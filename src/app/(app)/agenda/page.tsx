import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { businessHours } from "@/lib/company";
import { db } from "@/lib/db";
import { assignLanes } from "@/lib/agenda-layout";
import { formatDate, formatLongDay, formatWeekday } from "@/lib/format";
import { appointmentStatus, specialtyLabel } from "@/lib/labels";
import { withColors } from "@/lib/professionals";
import { addDays, atSp, isValidDay, openDaysOfWeek, spDay, spTime, weekday } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { AgendaGrid, type GridBlock, type GridColumn } from "./agenda-grid";

export const metadata: Metadata = { title: "Agenda" };

const noon = (day: string) => atSp(day, "12:00");
const minutes = (d: Date) => {
  const [h, m] = spTime(d).split(":").map(Number);
  return h * 60 + m;
};
const nextOpen = (day: string, step: 1 | -1) => {
  do day = addDays(day, step);
  while (!businessHours[weekday(day)]);
  return day;
};
const capitalize = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await requireUser();
  const sp = await searchParams;
  const today = spDay(new Date());
  const day = typeof sp.data === "string" && isValidDay(sp.data) ? sp.data : today;
  const view = sp.visao === "dia" ? "dia" : "semana";
  const selectedPros = typeof sp.pro === "string" && sp.pro ? sp.pro.split(",") : [];

  const days = view === "semana" ? openDaysOfWeek(day) : [day];
  const from = atSp(days[0], "00:00");
  const to = atSp(addDays(days[days.length - 1], 1), "00:00");

  const [proRows, rows] = await Promise.all([
    db.professional.findMany({ where: { active: true, specialty: { not: "RECEPTION" } }, select: { id: true, name: true, specialty: true } }),
    db.appointment.findMany({
      where: { startsAt: { gte: from, lt: to }, ...(selectedPros.length ? { professionalId: { in: selectedPros } } : {}) },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        professionalId: true,
        service: { select: { name: true } },
        vehicle: { select: { plate: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);
  const professionals = withColors(proRows);
  const proById = new Map(professionals.map((p) => [p.id, p]));
  const shownPros = selectedPros.length ? professionals.filter((p) => selectedPros.includes(p.id)) : professionals;
  const active = rows.filter((a) => a.status !== "CANCELED").length;

  const href = (params: { data?: string; visao?: string; pro?: string[] }) => {
    const q = new URLSearchParams({ data: params.data ?? day, visao: params.visao ?? view });
    const pros = params.pro ?? selectedPros;
    if (pros.length) q.set("pro", pros.join(","));
    return `/agenda?${q}`;
  };
  const prev = view === "semana" ? addDays(day, -7) : nextOpen(day, -1);
  const next = view === "semana" ? addDays(day, 7) : nextOpen(day, 1);
  const title =
    view === "semana"
      ? `Semana de ${formatDate(noon(days[0])).slice(0, 5)} a ${formatDate(noon(days[days.length - 1]))}`
      : capitalize(formatLongDay(noon(day)));
  const closedDay = view === "dia" && !businessHours[weekday(day)];

  // Grade: semana = uma coluna por dia; dia = uma coluna por profissional.
  const columns: GridColumn[] =
    view === "semana"
      ? days.map((d) => ({
          key: d,
          day: d,
          title: capitalize(formatWeekday(noon(d))),
          subtitle: d === today ? "Hoje" : undefined,
          isToday: d === today,
          closedFrom: businessHours[weekday(d)]!.close < 18 ? businessHours[weekday(d)]!.close * 60 : null,
        }))
      : shownPros.map((p) => ({
          key: p.id,
          day,
          title: p.name.split(" ")[0],
          subtitle: specialtyLabel[p.specialty],
          isToday: false,
          closedFrom: businessHours[weekday(day)] && businessHours[weekday(day)]!.close < 18 ? businessHours[weekday(day)]!.close * 60 : null,
        }));
  const colOf = (a: (typeof rows)[number]) => (view === "semana" ? days.indexOf(spDay(a.startsAt)) : shownPros.findIndex((p) => p.id === a.professionalId));
  const blocks: GridBlock[] = columns.flatMap((_, ci) =>
    assignLanes(
      rows
        .filter((a) => colOf(a) === ci)
        .map((a) => {
          const pro = proById.get(a.professionalId);
          return {
            id: a.id,
            col: ci,
            start: minutes(a.startsAt),
            end: minutes(a.endsAt),
            timeLabel: `${spTime(a.startsAt)}–${spTime(a.endsAt)}`,
            dateLabel: capitalize(formatLongDay(a.startsAt)),
            service: a.service.name,
            plate: a.vehicle.plate,
            customer: a.customer.name,
            proName: pro?.name ?? "—",
            proInitials: pro?.initials ?? "",
            color: pro?.color ?? "var(--muted-foreground)",
            status: appointmentStatus[a.status],
            canceled: a.status === "CANCELED",
            notes: a.notes,
          };
        }),
    ),
  );

  const chipClass = (on: boolean) =>
    cn(
      "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors duration-150 sm:min-h-9",
      on ? "border-foreground/40 bg-surface-2 text-foreground" : "border-border text-muted-foreground hover:border-input hover:text-foreground",
    );

  return (
    <>
      <PageHeader title="Agenda" description={`${title} · ${active} agendamento${active === 1 ? "" : "s"}`}>
        <Link href={`/agenda/novo?data=${day}`} className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Novo agendamento
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Link href={href({ data: prev })} className={buttonVariants({ variant: "outline", size: "icon-lg" })} aria-label={view === "semana" ? "Semana anterior" : "Dia anterior"}>
            <ChevronLeft aria-hidden="true" />
          </Link>
          <Link href={href({ data: today })} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Hoje
          </Link>
          <Link href={href({ data: next })} className={buttonVariants({ variant: "outline", size: "icon-lg" })} aria-label={view === "semana" ? "Próxima semana" : "Próximo dia"}>
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>

        <form className="order-last flex w-full items-center gap-1 sm:order-none sm:w-auto">
          <Label htmlFor="data" className="sr-only">
            Ir para a data
          </Label>
          <Input id="data" name="data" type="date" defaultValue={day} className="flex-1 sm:w-auto sm:flex-none" />
          <input type="hidden" name="visao" value={view} />
          {selectedPros.length > 0 && <input type="hidden" name="pro" value={selectedPros.join(",")} />}
          <Button type="submit" variant="outline" size="lg">
            Ir
          </Button>
        </form>

        <nav aria-label="Visualização" className="ml-auto flex rounded-lg border bg-surface p-1">
          {(["semana", "dia"] as const).map((v) => (
            <Link
              key={v}
              href={href({ visao: v })}
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center rounded-md px-4 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground sm:min-h-8",
                view === v && "bg-surface-2 font-medium text-foreground",
              )}
            >
              {v === "semana" ? "Semana" : "Dia"}
            </Link>
          ))}
        </nav>
      </div>

      {/* Filtro por profissional: chips com a cor de cada um */}
      <nav aria-label="Filtrar por profissional" className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2 sm:flex-wrap">
          <li>
            <Link href={href({ pro: [] })} aria-current={selectedPros.length === 0 ? "true" : undefined} className={chipClass(selectedPros.length === 0)}>
              Todos
            </Link>
          </li>
          {professionals.map((p) => {
            const on = selectedPros.includes(p.id);
            const nextPros = on ? selectedPros.filter((id) => id !== p.id) : [...selectedPros, p.id];
            return (
              <li key={p.id}>
                <Link href={href({ pro: nextPros })} aria-current={on ? "true" : undefined} className={chipClass(on)}>
                  <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                  {p.name.split(" ")[0]}
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {p.initials} · {specialtyLabel[p.specialty]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {closedDay ? (
        <EmptyState title="A oficina não abre aos domingos" description="Escolha outro dia ou vá direto ao próximo dia útil.">
          <Link href={href({ data: nextOpen(day, 1) })} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Ver o próximo dia útil
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* Tablet e desktop: grade de horas */}
          <div className="hidden md:block">
            <AgendaGrid columns={columns} blocks={blocks} />
          </div>

          {/* Celular: lista por horário */}
          <div className="flex flex-col gap-5 md:hidden">
            {days.map((d) => {
              const list = rows.filter((a) => spDay(a.startsAt) === d);
              return (
                <section key={d} aria-labelledby={`lista-${d}`}>
                  <h2 id={`lista-${d}`} className={cn("mb-2 font-display text-lg font-semibold tracking-wide uppercase", d === today && "text-primary")}>
                    {capitalize(formatWeekday(noon(d)))}
                    {d === today && " · hoje"}
                  </h2>
                  {list.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Sem agendamentos</p>
                  ) : (
                    <ol className="divide-y rounded-xl border bg-card">
                      {list.map((a) => {
                        const pro = proById.get(a.professionalId);
                        const canceled = a.status === "CANCELED";
                        return (
                          <li key={a.id}>
                            <Link href={`/agenda/${a.id}`} className={cn("flex items-center gap-3 px-4 py-3", canceled && "opacity-50")}>
                              <span className="w-[4.5rem] shrink-0">
                                <span className={cn("block font-display text-lg leading-tight font-semibold tabular-nums", canceled && "line-through")}>
                                  {spTime(a.startsAt)}
                                </span>
                                <span className="block font-mono text-xs whitespace-nowrap text-muted-foreground">até {spTime(a.endsAt)}</span>
                              </span>
                              <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: pro?.color }} aria-hidden="true" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{a.service.name}</span>
                                <span className="block truncate text-sm text-muted-foreground">
                                  <span className="plate">{a.vehicle.plate}</span> · {pro?.name.split(" ")[0]}
                                </span>
                                {a.status !== "SCHEDULED" && <StatusBadge {...appointmentStatus[a.status]} className="mt-1.5" />}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
