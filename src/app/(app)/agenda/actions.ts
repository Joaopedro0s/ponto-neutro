"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppointmentStatus } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formValues, invalid, optionalText, type FormState } from "@/lib/form";
import { atSp, businessHoursError, isValidDay, isValidTime, spDay, spTime } from "@/lib/schedule";

// Campo ausente (select desabilitado não é enviado) recebe a mesma mensagem do campo vazio.
const required = (message: string) => z.string({ error: message }).trim().min(1, message);

const schema = z.object({
  customerId: required("Selecione o cliente."),
  vehicleId: required("Selecione o veículo."),
  serviceId: required("Selecione o serviço."),
  professionalId: required("Selecione o profissional."),
  date: z.string().refine(isValidDay, "Informe uma data válida."),
  time: z.string().refine(isValidTime, "Informe um horário válido, ex.: 09:30."),
  status: z.enum(AppointmentStatus).optional(),
  notes: optionalText(300, "Use no máximo 300 caracteres."),
});

class ConflictError extends Error {}

export async function saveAppointment(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = schema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const data = parsed.data;

  const [service, vehicle, professional] = await Promise.all([
    db.service.findUnique({ where: { id: data.serviceId } }),
    db.vehicle.findUnique({ where: { id: data.vehicleId } }),
    db.professional.findUnique({ where: { id: data.professionalId } }),
  ]);
  if (!service) return { values, fieldErrors: { serviceId: "Serviço não encontrado." } };
  if (!vehicle || vehicle.customerId !== data.customerId) {
    return { values, fieldErrors: { vehicleId: "Este veículo não pertence ao cliente selecionado." } };
  }
  if (!professional || !professional.active || professional.specialty === "RECEPTION") {
    return { values, fieldErrors: { professionalId: "Escolha um profissional que execute serviços." } };
  }

  const startsAt = atSp(data.date, data.time);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
  const status = data.status ?? "SCHEDULED";

  // Cancelados não ocupam horário; os demais precisam caber no expediente.
  if (status !== "CANCELED") {
    const hoursError = businessHoursError(startsAt, endsAt);
    if (hoursError) return { values, fieldErrors: { time: hoursError } };
  }

  const record = {
    customerId: data.customerId,
    vehicleId: data.vehicleId,
    serviceId: data.serviceId,
    professionalId: data.professionalId,
    startsAt,
    endsAt,
    status,
    notes: data.notes,
  };

  try {
    // Serializable: se dois salvamentos disputarem o mesmo horário, o banco recusa um deles.
    await db.$transaction(
      async (tx) => {
        if (status !== "CANCELED") {
          const conflict = await tx.appointment.findFirst({
            where: {
              professionalId: data.professionalId,
              status: { not: "CANCELED" },
              startsAt: { lt: endsAt },
              endsAt: { gt: startsAt },
              ...(id ? { id: { not: id } } : {}),
            },
            include: { service: true, vehicle: true },
          });
          if (conflict) {
            throw new ConflictError(
              `${professional.name} já tem ${conflict.service.name} (${conflict.vehicle.plate}) das ${spTime(conflict.startsAt)} às ${spTime(conflict.endsAt)}. Escolha outro horário ou profissional.`,
            );
          }
        }
        if (id) await tx.appointment.update({ where: { id }, data: record });
        else await tx.appointment.create({ data: record });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (e) {
    if (e instanceof ConflictError) return { values, error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      return { values, error: "Outro agendamento foi salvo ao mesmo tempo. Confira a agenda e tente de novo." };
    }
    throw e;
  }

  redirect(`/agenda?data=${data.date}&visao=dia`);
}

export async function cancelAppointment(id: string): Promise<FormState> {
  await requireUser();
  const appointment = await db.appointment.update({ where: { id }, data: { status: "CANCELED" } });
  redirect(`/agenda?data=${spDay(appointment.startsAt)}&visao=dia`);
}
