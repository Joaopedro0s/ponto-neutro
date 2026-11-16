import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarX } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { appointmentStatus } from "@/lib/labels";
import { spDay, spTime } from "@/lib/schedule";
import { cancelAppointment, saveAppointment } from "../actions";
import { AppointmentForm } from "../appointment-form";
import { loadFormOptions } from "../options";

export const metadata: Metadata = { title: "Agendamento" };

export default async function AppointmentPage({ params }: PageProps<"/agenda/[id]">) {
  await requireUser();
  const { id } = await params;
  const appointment = await db.appointment.findUnique({
    where: { id },
    include: { vehicle: { select: { plate: true } }, customer: { select: { name: true } }, service: { select: { name: true } } },
  });
  if (!appointment) notFound();
  const day = spDay(appointment.startsAt);
  const back = `/agenda?data=${day}&visao=dia`;

  return (
    <>
      <PageHeader
        title={`${appointment.service.name} · ${appointment.vehicle.plate}`}
        description={
          <>
            {appointment.customer.name} · {formatDateTime(appointment.startsAt)} ·{" "}
            <Link href={`/veiculos/${appointment.vehicle.plate}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              Histórico do veículo
            </Link>
          </>
        }
        back={{ href: back, label: "Agenda" }}
      >
        <StatusBadge {...appointmentStatus[appointment.status]} />
      </PageHeader>

      <AppointmentForm
        action={saveAppointment.bind(null, id)}
        options={await loadFormOptions()}
        cancelHref={back}
        defaults={{
          customerId: appointment.customerId,
          vehicleId: appointment.vehicleId,
          serviceId: appointment.serviceId,
          professionalId: appointment.professionalId,
          date: day,
          time: spTime(appointment.startsAt),
          notes: appointment.notes ?? "",
          status: appointment.status,
        }}
      />

      {appointment.status !== "CANCELED" && (
        <section aria-labelledby="cancelar" className="mt-10 max-w-2xl border-t pt-6">
          <h2 id="cancelar" className="eyebrow">
            Cancelar agendamento
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            O horário fica livre na agenda e o registro continua no histórico do veículo.
          </p>
          <ActionButton
            action={cancelAppointment.bind(null, id)}
            label="Cancelar agendamento"
            icon={<CalendarX aria-hidden="true" />}
            confirmMessage={`Cancelar ${appointment.service.name} de ${appointment.customer.name}?`}
          />
        </section>
      )}
    </>
  );
}
