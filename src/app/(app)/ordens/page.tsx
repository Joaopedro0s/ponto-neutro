import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL, formatDateTime } from "@/lib/format";
import { formatWorkOrderNumber, workOrderNextAction, workOrderStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/generated/prisma/enums";
import { advanceWorkOrder } from "./actions";

export const metadata: Metadata = { title: "Ordens de serviço" };

const STAGES: WorkOrderStatus[] = ["WAITING", "IN_PROGRESS", "READY", "DELIVERED"];
const STAGE_BAR: Record<WorkOrderStatus, string> = {
  WAITING: "bg-muted-foreground/40",
  IN_PROGRESS: "bg-amber-500",
  READY: "bg-sky-600",
  DELIVERED: "bg-emerald-600",
};

// Fora do componente: a regra de pureza do React não se aplica a uma consulta feita por requisição no servidor.
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export default async function WorkOrdersPage() {
  await requireUser();
  const weekAgo = daysAgo(7);
  const orders = await db.workOrder.findMany({
    // Em aberto: todas. Entregues: só as da última semana, para o quadro não crescer sem fim.
    where: { OR: [{ status: { not: "DELIVERED" } }, { deliveredAt: { gte: weekAgo } }] },
    orderBy: { createdAt: "asc" },
    include: {
      vehicle: { select: { plate: true, model: true } },
      professional: { select: { name: true } },
      quote: { select: { total: true, customer: { select: { name: true } }, items: { orderBy: { position: "asc" }, select: { description: true, kind: true } } } },
    },
  });
  const open = orders.filter((o) => o.status !== "DELIVERED").length;

  return (
    <>
      <PageHeader
        title="Ordens de serviço"
        description={`${open} veículo${open === 1 ? "" : "s"} na oficina. Uma OS nasce quando um orçamento é aprovado.`}
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const list = orders
            .filter((o) => o.status === stage)
            .sort((a, b) => (stage === "DELIVERED" ? b.deliveredAt!.getTime() - a.deliveredAt!.getTime() : 0));
          return (
            <section key={stage} aria-labelledby={`etapa-${stage}`} className="flex flex-col gap-3">
              <h2 id={`etapa-${stage}`} className="flex items-center gap-2 text-sm font-medium">
                <span className={cn("h-2.5 w-2.5 rounded-full", STAGE_BAR[stage])} aria-hidden="true" />
                {workOrderStatus[stage].label}
                {stage === "DELIVERED" && <span className="font-normal text-muted-foreground">(últimos 7 dias)</span>}
                <span className="ml-auto rounded-full bg-muted px-2 text-xs tabular-nums">{list.length}</span>
              </h2>
              {list.length === 0 && <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhuma OS nesta etapa.</p>}
              {list.map((o) => {
                const labor = o.quote.items.filter((i) => i.kind === "LABOR");
                const services = (labor.length ? labor : o.quote.items).map((i) => i.description);
                const since = o.deliveredAt ?? o.readyAt ?? o.startedAt ?? o.createdAt;
                const next = workOrderNextAction[o.status];
                return (
                  <article key={o.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/ordens/${o.id}`}
                        className="rounded font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {formatWorkOrderNumber(o.number)} · <span className="font-mono">{o.vehicle.plate}</span>
                      </Link>
                      <span className="tabular-nums text-muted-foreground">{formatBRL(o.quote.total)}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {o.vehicle.model} · {o.quote.customer.name.split(" ")[0]}
                    </p>
                    <p className="leading-snug">
                      {services[0]}
                      {services.length > 1 && <span className="text-muted-foreground"> +{services.length - 1}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.professional?.name ?? "Sem responsável"} · desde {formatDateTime(since)}
                    </p>
                    {next && (
                      <div className="mt-1">
                        <ActionButton action={advanceWorkOrder.bind(null, o.id, o.status)} label={next} variant="outline" icon={<ArrowRight aria-hidden="true" />} />
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
