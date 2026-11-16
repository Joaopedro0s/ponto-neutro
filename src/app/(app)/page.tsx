import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { businessHours } from "@/lib/company";
import { loadDashboard } from "@/lib/dashboard";
import { formatBRL, formatLongDay } from "@/lib/format";
import { formatWorkOrderNumber, workOrderStatus } from "@/lib/labels";
import { atSp, spTime, weekday } from "@/lib/schedule";
import { TopServicesChart, WeeklyRevenueChart } from "./dashboard-charts";

const cardClass = "rounded-xl border bg-card p-5";

export default async function DashboardPage() {
  const user = await requireUser();
  const d = await loadDashboard();

  const change = d.revenue.previous > 0 ? (d.revenue.current - d.revenue.previous) / d.revenue.previous : null;
  const rate = d.approval.decided ? Math.round((d.approval.approved / d.approval.decided) * 100) : null;
  const todayLabel = formatLongDay(atSp(d.today, "12:00"));
  const closedToday = !businessHours[weekday(d.today)];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground first-letter:uppercase">{todayLabel}</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <dt className="text-sm text-muted-foreground">Faturamento do mês</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{formatBRL(d.revenue.current)}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">
            {change === null ? (
              "Sem base no mês anterior"
            ) : (
              <>
                {change >= 0 ? <ArrowUpRight className="mr-0.5 inline size-4 align-[-3px] text-emerald-700" aria-hidden="true" /> : <ArrowDownRight className="mr-0.5 inline size-4 align-[-3px] text-red-700" aria-hidden="true" />}
                <span className="font-medium text-foreground">
                  {change >= 0 ? "+" : "−"}
                  {Math.abs(change * 100).toFixed(0)}%
                </span>{" "}
                vs. mesmo período do mês anterior ({formatBRL(d.revenue.previous)})
              </>
            )}
          </dd>
        </div>
        <div className={cardClass}>
          <dt className="text-sm text-muted-foreground">Taxa de aprovação</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{rate === null ? "—" : `${rate}%`}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">
            {d.approval.approved} de {d.approval.decided} orçamentos decididos em 30 dias
          </dd>
        </div>
        <div className={cardClass}>
          <dt className="text-sm text-muted-foreground">Veículos na oficina</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{d.inShop.length}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">
            {d.inShop.filter((o) => o.status === "READY").length} prontos para retirada
          </dd>
        </div>
        <div className={cardClass}>
          <dt className="text-sm text-muted-foreground">Agendamentos hoje</dt>
          <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{d.todayAppointments.length}</dd>
          <dd className="mt-1 text-sm text-muted-foreground">{closedToday ? "A oficina não abre hoje" : "sem contar os cancelados"}</dd>
        </div>
      </dl>

      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="graf-faturamento" className={cardClass}>
          <h2 id="graf-faturamento" className="font-medium">
            Faturamento por semana
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">Últimas 13 semanas, pela data de entrega do veículo</p>
          <WeeklyRevenueChart data={d.weeks} />
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
        </section>

        <section aria-labelledby="graf-servicos" className={cardClass}>
          <h2 id="graf-servicos" className="font-medium">
            Serviços mais vendidos
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">Em orçamentos aprovados nos últimos 90 dias</p>
          {d.topServices.length ? (
            <>
              <TopServicesChart data={d.topServices} />
              <ol className="sr-only">
                {d.topServices.map((s) => (
                  <li key={s.name}>
                    {s.name}: {s.count} vendas
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Ainda não há orçamentos aprovados no período.</p>
          )}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section aria-labelledby="hoje" className={cardClass}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="hoje" className="font-medium">
              Agenda de hoje
            </h2>
            <Link href="/agenda?visao=dia" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Abrir agenda
            </Link>
          </div>
          {d.todayAppointments.length === 0 ? (
            <EmptyState title={closedToday ? "Hoje a oficina está fechada" : "Nenhum agendamento hoje"} description="Os próximos atendimentos aparecem na agenda." />
          ) : (
            <ul className="divide-y">
              {d.todayAppointments.map((a) => (
                <li key={a.id}>
                  <Link href={`/agenda/${a.id}`} className="flex gap-3 py-2.5 text-sm hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="w-12 shrink-0 font-medium tabular-nums">{spTime(a.startsAt)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{a.service.name}</span>
                      <span className="block text-muted-foreground">
                        <span className="font-mono">{a.vehicle.plate}</span> · {a.professional.name}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="oficina" className={cardClass}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 id="oficina" className="font-medium">
              Veículos em serviço
            </h2>
            <Link href="/ordens" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Ver ordens
            </Link>
          </div>
          {d.inShop.length === 0 ? (
            <EmptyState title="Nenhum veículo na oficina" description="Ao aprovar um orçamento, a OS aparece aqui." />
          ) : (
            <ul className="divide-y">
              {d.inShop.map((o) => (
                <li key={o.id}>
                  <Link href={`/ordens/${o.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className="min-w-0 flex-1">
                      <span className="block">
                        <span className="font-mono">{o.vehicle.plate}</span> · {o.vehicle.model}
                      </span>
                      <span className="block text-muted-foreground">
                        {formatWorkOrderNumber(o.number)} · {o.quote.customer.name}
                      </span>
                    </span>
                    <StatusBadge {...workOrderStatus[o.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
