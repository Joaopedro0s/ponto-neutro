import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Card, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { businessHours } from "@/lib/company";
import { delta, loadDashboard } from "@/lib/dashboard";
import { db } from "@/lib/db";
import { formatBRL, formatLongDay } from "@/lib/format";
import { formatWorkOrderNumber, quoteStatus, workOrderStatus } from "@/lib/labels";
import { withColors } from "@/lib/professionals";
import { atSp, spTime, weekday } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { QuoteStatus, WorkOrderStatus } from "@/generated/prisma/enums";
import { CountUp, RevenueChart, Sparkline } from "./dashboard-charts";

const STAGES: WorkOrderStatus[] = ["WAITING", "IN_PROGRESS", "READY", "DELIVERED"];
const STATUS_BAR: Record<QuoteStatus, string> = { DRAFT: "bg-muted-foreground", SENT: "bg-info", APPROVED: "bg-success", REJECTED: "bg-danger" };

/** Variação com seta + texto: nunca só cor. `points` mostra pontos percentuais em vez de %. */
function Change({ value, label, points = false }: { value: number | null; label: string; points?: boolean }) {
  if (value === null) return <p className="text-sm text-muted-foreground">Sem base para comparar</p>;
  const up = value > 0.005;
  const down = value < -0.005;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const text = `${up ? "+" : down ? "−" : ""}${Math.abs(Math.round(value * 100))}${points ? " p.p." : "%"}`;
  return (
    <p className="text-sm text-muted-foreground">
      <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-success" : down ? "text-danger-fg" : "text-muted-foreground")}>
        <Icon className="size-4" aria-hidden="true" />
        {text}
      </span>{" "}
      {label}
    </p>
  );
}

function Kpi({ label, children, footer, spark, sparkId, wide = false }: { label: string; children: React.ReactNode; footer: React.ReactNode; spark?: number[]; sparkId: string; wide?: boolean }) {
  return (
    <Card className={cn("flex flex-col gap-2 p-5", wide && "sm:col-span-2")}>
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display text-5xl font-semibold tracking-wide">{children}</dd>
      <dd>{footer}</dd>
      {spark && (
        <dd className="mt-auto pt-2">
          <Sparkline values={spark} id={sparkId} />
        </dd>
      )}
    </Card>
  );
}

const linkClass = "text-sm font-medium text-primary underline-offset-4 hover:underline";

export default async function DashboardPage() {
  const user = await requireUser();
  const [d, professionals] = await Promise.all([
    loadDashboard(),
    db.professional.findMany({ where: { active: true, specialty: { not: "RECEPTION" } }, select: { id: true, name: true } }),
  ]);
  const pros = new Map(withColors(professionals).map((p) => [p.id, p]));

  const closedToday = !businessHours[weekday(d.today)];
  const rateNow = d.approval.current.value;
  const ratePrev = d.approval.previous.value;
  const quotesTotal = Object.values(d.quotesByStatus).reduce((a, b) => a + b, 0);
  const topMax = Math.max(1, ...d.topServices.map((s) => s.count));
  const ready = d.inShop.filter((o) => o.status === "READY").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{formatLongDay(atSp(d.today, "12:00"))}</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-wide uppercase">Olá, {user.name.split(" ")[0]}</h1>
        </div>
        <p className="text-sm text-muted-foreground">Variações comparam com o período anterior equivalente.</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi
          label="Faturamento do mês"
          wide
          sparkId="fat"
          spark={d.weeks.map((w) => w.total)}
          footer={<Change value={delta(d.revenue.current, d.revenue.previous)} label={`vs. ${formatBRL(d.revenue.previous)}`} />}
        >
          <CountUp value={d.revenue.current} format="brl" />
        </Kpi>
        <Kpi
          label="Orçamentos aprovados"
          sparkId="apr"
          spark={d.weeks.map((w) => w.approvals)}
          footer={<Change value={delta(d.approvedQuotes.current, d.approvedQuotes.previous)} label={`vs. ${d.approvedQuotes.previous} no mês anterior`} />}
        >
          <CountUp value={d.approvedQuotes.current} format="int" />
        </Kpi>
        <Kpi
          label="Taxa de aprovação"
          sparkId="taxa"
          footer={
            <Change
              value={rateNow !== null && ratePrev !== null ? rateNow - ratePrev : null}
              points
              label={`${d.approval.current.approved} de ${d.approval.current.decided} em 30 dias`}
            />
          }
        >
          {rateNow === null ? "—" : <CountUp value={rateNow} format="pct" />}
        </Kpi>
        <Kpi
          label="Agendamentos hoje"
          sparkId="ag"
          spark={d.perDay.map((p) => p.count)}
          footer={
            closedToday ? (
              <p className="text-sm text-muted-foreground">A oficina não abre hoje</p>
            ) : (
              <Change value={delta(d.appointmentsToday.current, d.appointmentsToday.previous)} label="vs. mesmo dia da semana passada" />
            )
          }
        >
          <CountUp value={d.appointmentsToday.current} format="int" />
        </Kpi>
        <Kpi label="Veículos na oficina" sparkId="ofi" footer={<p className="text-sm text-muted-foreground">{ready} pronto{ready === 1 ? "" : "s"} para retirada</p>}>
          <CountUp value={d.inShop.length} format="int" />
        </Kpi>
      </dl>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Faturamento · últimos 3 meses" id="graf-faturamento" description="Por semana, pela data de entrega do veículo" />
          <RevenueChart data={d.weeks} />
          <table className="sr-only">
            <caption>Faturamento por semana</caption>
            <thead>
              <tr>
                <th scope="col">Semana iniciada em</th>
                <th scope="col">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {d.weeks.map((w) => (
                <tr key={w.start}>
                  <td>{w.label}</td>
                  <td>{formatBRL(w.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader
            title="Hoje na oficina"
            id="hoje"
            action={
              <Link href="/agenda?visao=dia" className={linkClass}>
                Abrir agenda
              </Link>
            }
          />
          {d.todayAppointments.length === 0 ? (
            <EmptyState title={closedToday ? "Oficina fechada hoje" : "Nenhum agendamento hoje"} description="Os próximos atendimentos aparecem na agenda." />
          ) : (
            <ol className="flex flex-col">
              {d.todayAppointments.map((a) => (
                <li key={a.id}>
                  <Link href={`/agenda/${a.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2">
                    <span className="w-12 shrink-0 font-display text-lg font-semibold tabular-nums">{spTime(a.startsAt)}</span>
                    <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: pros.get(a.professional.id)?.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{a.service.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        <span className="plate">{a.vehicle.plate}</span> · {a.professional.name.split(" ")[0]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Veículos em serviço"
            id="oficina"
            action={
              <Link href="/ordens" className={linkClass}>
                Ver ordens
              </Link>
            }
          />
          {d.inShop.length === 0 ? (
            <EmptyState title="Nenhum veículo na oficina" description="Ao aprovar um orçamento, a OS aparece aqui." />
          ) : (
            <ul className="flex flex-col divide-y">
              {d.inShop.map((o) => {
                const step = STAGES.indexOf(o.status);
                return (
                  <li key={o.id}>
                    <Link
                      href={`/ordens/${o.id}`}
                      className="grid gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-surface-2 sm:grid-cols-[1fr_15rem] sm:items-center"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm">
                          <span className="plate font-medium">{o.vehicle.plate}</span> · {o.vehicle.model}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {formatWorkOrderNumber(o.number)} · {o.quote.items[0]?.description ?? "Serviço"} · {o.quote.customer.name.split(" ")[0]}
                        </span>
                      </span>
                      <span className="flex flex-col gap-1.5">
                        <span className="flex gap-1" aria-hidden="true">
                          {STAGES.map((s, i) => (
                            <span key={s} className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-muted-foreground" : i === step ? "bg-primary" : "bg-surface-2")} />
                          ))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Etapa {step + 1} de 4 · <span className="text-foreground">{workOrderStatus[o.status].label}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader title="Orçamentos por situação" id="funil" description={`${quotesTotal} criados nos últimos 90 dias`} />
            <ul className="flex flex-col gap-3">
              {(Object.keys(d.quotesByStatus) as QuoteStatus[]).map((s) => {
                const n = d.quotesByStatus[s];
                const pct = quotesTotal ? (n / quotesTotal) * 100 : 0;
                return (
                  <li key={s}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{quoteStatus[s].label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {n} · {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2" aria-hidden="true">
                      <div className={cn("h-2 rounded-full", STATUS_BAR[s])} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Serviços mais vendidos" id="ranking" description="Em orçamentos aprovados nos últimos 90 dias" />
            {d.topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há orçamentos aprovados no período.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {d.topServices.map((s, i) => (
                  <li key={s.name} className="grid grid-cols-[1.5rem_1fr] items-center gap-x-2">
                    <span className="font-display text-lg font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                    <div>
                      <div className="mb-1 flex justify-between gap-2 text-sm">
                        <span className="truncate">{s.name}</span>
                        <span className="tabular-nums text-muted-foreground">{s.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2" aria-hidden="true">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(s.count / topMax) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
