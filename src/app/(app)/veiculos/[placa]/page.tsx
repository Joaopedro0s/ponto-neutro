import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CalendarPlus, FileText, Pencil } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDate, formatTime, normalizePlate } from "@/lib/format";
import { appointmentStatus, formatQuoteNumber, formatWorkOrderNumber, quoteStatus, workOrderStatus } from "@/lib/labels";

export async function generateMetadata({ params }: PageProps<"/veiculos/[placa]">): Promise<Metadata> {
  const placa = (await params).placa;
  return { title: `Histórico ${normalizePlate(placa) ?? placa.toUpperCase()}` };
}

export default async function VehicleHistoryPage({ params }: PageProps<"/veiculos/[placa]">) {
  await requireUser();
  const plate = normalizePlate((await params).placa);
  if (!plate) notFound();

  const vehicle = await db.vehicle.findUnique({
    where: { plate },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      appointments: {
        orderBy: { startsAt: "desc" },
        include: { service: { select: { name: true } }, professional: { select: { name: true } } },
      },
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } }, workOrder: true },
      },
    },
  });
  if (!vehicle) notFound();

  const completed = vehicle.appointments.filter((a) => a.status === "COMPLETED");
  const spent = vehicle.quotes
    .filter((q) => q.workOrder?.status === "DELIVERED")
    .reduce((sum, q) => sum + Number(q.total), 0);

  // Linha do tempo única: agendamentos e orçamentos (com a OS, quando existe), do mais recente ao mais antigo.
  const timeline = [
    ...vehicle.appointments.map((a) => ({ kind: "appointment" as const, date: a.startsAt, a })),
    ...vehicle.quotes.map((q) => ({ kind: "quote" as const, date: q.createdAt, q })),
  ].sort((x, y) => y.date.getTime() - x.date.getTime());

  const stats = [
    { label: "Atendimentos concluídos", value: String(completed.length) },
    { label: "Última visita", value: completed[0] ? formatDate(completed[0].startsAt) : "—" },
    { label: "Total em serviços entregues", value: formatBRL(spent) },
  ];

  return (
    <>
      <PageHeader
        title={
          <>
            <span className="font-mono tracking-wider">{vehicle.plate}</span>
            <span className="text-muted-foreground"> · {vehicle.model}</span>
          </>
        }
        description={
          <>
            {[vehicle.year, vehicle.color].filter(Boolean).join(" · ")}
            {(vehicle.year || vehicle.color) && " · "}
            Proprietário:{" "}
            <Link href={`/clientes/${vehicle.customer.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              {vehicle.customer.name}
            </Link>
          </>
        }
        back={{ href: `/clientes/${vehicle.customer.id}`, label: vehicle.customer.name }}
      >
        <Link href={`/agenda/novo?veiculo=${vehicle.plate}`} className={buttonVariants({ size: "lg" })}>
          <CalendarPlus aria-hidden="true" />
          Agendar serviço
        </Link>
        <Link href={`/veiculos/${vehicle.plate}/editar`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Pencil aria-hidden="true" />
          Editar veículo
        </Link>
      </PageHeader>

      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-3 last:col-span-2 sm:p-4 sm:last:col-span-1">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="historico">
        <h2 id="historico" className="mb-3 font-medium">
          Histórico de serviços
        </h2>
        {timeline.length === 0 ? (
          <EmptyState title="Nenhum serviço registrado" description="Agendamentos e orçamentos deste veículo aparecerão aqui." />
        ) : (
          <ol className="divide-y rounded-xl border bg-card">
            {timeline.map((item) =>
              item.kind === "appointment" ? (
                <li key={`a-${item.a.id}`} className="flex gap-3 p-4">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{item.a.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Agendamento · {formatDate(item.a.startsAt)}, {formatTime(item.a.startsAt)} · {item.a.professional.name}
                      </p>
                    </div>
                    <StatusBadge {...appointmentStatus[item.a.status]} />
                  </div>
                </li>
              ) : (
                <li key={`q-${item.q.id}`} className="flex gap-3 p-4">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">
                        Orçamento {formatQuoteNumber(item.q.number)} · <span className="tabular-nums">{formatBRL(item.q.total)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(item.q.createdAt)} · {item.q._count.items} {item.q._count.items === 1 ? "item" : "itens"}
                        {item.q.workOrder && (
                          <>
                            {" "}
                            · {formatWorkOrderNumber(item.q.workOrder.number)}
                            {item.q.workOrder.deliveredAt && <>, entregue em {formatDate(item.q.workOrder.deliveredAt)}</>}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge {...quoteStatus[item.q.status]} />
                      {item.q.workOrder && <StatusBadge {...workOrderStatus[item.q.workOrder.status]} />}
                    </div>
                  </div>
                </li>
              ),
            )}
          </ol>
        )}
      </section>
    </>
  );
}
