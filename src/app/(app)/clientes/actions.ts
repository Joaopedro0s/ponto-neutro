"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formValues, invalid, optionalText, type FormState } from "@/lib/form";
import { normalizePhone, normalizePlate } from "@/lib/format";

const customerSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do cliente (mínimo de 3 letras).").max(100, "Use no máximo 100 caracteres."),
  phone: z.string().transform((v, ctx) => {
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Informe o telefone com DDD, ex.: (00) 98765-4321." });
      return z.NEVER;
    }
    return phone;
  }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.union([z.literal(""), z.email("Informe um e-mail válido ou deixe em branco.")]))
    .transform((v) => v || null),
  notes: optionalText(500, "Use no máximo 500 caracteres."),
});

const currentYear = new Date().getFullYear();
const vehicleSchema = z.object({
  plate: z.string().transform((v, ctx) => {
    const plate = normalizePlate(v);
    if (!plate) {
      ctx.addIssue({ code: "custom", message: "Placa inválida. Use o formato ABC1D23 ou ABC1234." });
      return z.NEVER;
    }
    return plate;
  }),
  model: z.string().trim().min(2, "Descreva o modelo, ex.: Hatch compacto 1.0.").max(60, "Use no máximo 60 caracteres."),
  color: optionalText(30, "Use no máximo 30 caracteres."),
  year: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const year = Number(v);
      if (!Number.isInteger(year) || year < 1950 || year > currentYear + 1) {
        ctx.addIssue({ code: "custom", message: `Informe um ano entre 1950 e ${currentYear + 1}.` });
        return z.NEVER;
      }
      return year;
    }),
});

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
const plateTaken = (values: Record<string, string>): FormState => ({
  values,
  fieldErrors: { plate: "Já existe um veículo cadastrado com esta placa." },
});

// ---------- Clientes ----------

export async function createCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = customerSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  const customer = await db.customer.create({ data: parsed.data, select: { id: true } });
  redirect(`/clientes/${customer.id}`);
}

export async function updateCustomer(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = customerSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  await db.customer.update({ where: { id }, data: parsed.data });
  redirect(`/clientes/${id}`);
}

export async function deleteCustomer(id: string): Promise<FormState> {
  await requireUser();
  const [appointments, quotes] = await Promise.all([
    db.appointment.count({ where: { customerId: id } }),
    db.quote.count({ where: { customerId: id } }),
  ]);
  if (appointments + quotes > 0) {
    return { error: "Este cliente tem agendamentos ou orçamentos registrados e não pode ser excluído, para preservar o histórico." };
  }
  // Sem histórico, os veículos dele também podem sair.
  await db.$transaction([
    db.vehicle.deleteMany({ where: { customerId: id } }),
    db.customer.delete({ where: { id } }),
  ]);
  redirect("/clientes");
}

// ---------- Veículos ----------

export async function createVehicle(customerId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = vehicleSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  try {
    await db.vehicle.create({ data: { ...parsed.data, customerId } });
  } catch (e) {
    if (isUniqueViolation(e)) return plateTaken(values);
    throw e;
  }
  revalidatePath(`/clientes/${customerId}`);
  return { values: {} }; // sucesso: formulário volta vazio
}

export async function updateVehicle(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = vehicleSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  try {
    await db.vehicle.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) return plateTaken(values);
    throw e;
  }
  redirect(`/veiculos/${parsed.data.plate}`);
}

export async function deleteVehicle(id: string): Promise<FormState> {
  await requireUser();
  const vehicle = await db.vehicle.findUniqueOrThrow({
    where: { id },
    select: { customerId: true, _count: { select: { appointments: true, quotes: true, workOrders: true } } },
  });
  const c = vehicle._count;
  if (c.appointments + c.quotes + c.workOrders > 0) {
    return { error: "Este veículo tem histórico de serviços e não pode ser excluído." };
  }
  await db.vehicle.delete({ where: { id } });
  redirect(`/clientes/${vehicle.customerId}`);
}
