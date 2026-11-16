import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePlate } from "@/lib/format";
import { isValidDay, spDay } from "@/lib/schedule";
import { saveAppointment } from "../actions";
import { AppointmentForm } from "../appointment-form";
import { loadFormOptions } from "../options";

export const metadata: Metadata = { title: "Novo agendamento" };

export default async function NewAppointmentPage({ searchParams }: PageProps<"/agenda/novo">) {
  await requireUser();
  const sp = await searchParams;
  const date = typeof sp.data === "string" && isValidDay(sp.data) ? sp.data : spDay(new Date());
  // Atalho vindo do histórico do veículo: ?veiculo=PLACA já preenche cliente e veículo.
  const plate = typeof sp.veiculo === "string" ? normalizePlate(sp.veiculo) : null;
  const vehicle = plate ? await db.vehicle.findUnique({ where: { plate }, select: { id: true, customerId: true } }) : null;

  return (
    <>
      <PageHeader title="Novo agendamento" back={{ href: `/agenda?data=${date}&visao=dia`, label: "Agenda" }} />
      <AppointmentForm
        action={saveAppointment.bind(null, null)}
        options={await loadFormOptions()}
        cancelHref={`/agenda?data=${date}&visao=dia`}
        defaults={{
          customerId: vehicle?.customerId ?? "",
          vehicleId: vehicle?.id ?? "",
          serviceId: "",
          professionalId: typeof sp.profissional === "string" ? sp.profissional : "",
          date,
          time: "09:00",
          notes: "",
        }}
      />
    </>
  );
}
