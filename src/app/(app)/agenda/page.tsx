import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { businessHours } from "@/lib/company";
import { db } from "@/lib/db";
import { formatDate, formatLongDay, formatWeekday } from "@/lib/format";
import { appointmentStatus, specialtyLabel } from "@/lib/labels";
import { addDays, atSp, isValidDay, openDaysOfWeek, spDay, spTime, weekday } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Agenda" };

// Cor fixa por profissional (pela ordem alfabética), usada na borda dos cartões e na legenda.
const COLORS = ["border-l-sky-600", "border-l-amber-500", "border-l-emerald-600", "border-l-violet-600", "border-l-rose-600"];
const DOTS = ["bg-sky-600", "bg-amber-500", "bg-emerald-600", "bg-violet-600", "bg-rose-600"];

const noon = (day: string) => atSp(day, "12:00");
const nextOpen = (day: string, step: 1 | -1) => {
  do day = addDays(day, step);
  while (!businessHours[weekday(day)]);
  return day;
};

type CardData = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
  service: { name: string };
  vehicle: { plate: string };
  customer: { name: string };
};

function AppointmentCard({ a, color, pro }: { a: CardData; color: string; pro?: string }) {
  const canceled = a.status === "CANCELED";
  return (
    <Link
      href={`/agenda/${a.id}`}
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-l-4 bg-card p-3 text-sm transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        color,
        canceled && "opacity-60",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className={cn("font-medium tabular-nums", canceled && "line-through")}>
          {spTime(a.startsAt)}–{spTime(a.endsAt)}
        </span>
        {a.status !== "SCHEDULED" && <StatusBadge {...appointmentStatus[a.status]} className="h-5 px-2" />}
      </span>
      <span className={cn("leading-snug", canceled && "line-through")}>{a.service.name}</span>
      <span className="text-xs text-muted-foreground">
        <span className="font-mono tracking-wide">{a.vehicle.plate}</span> · {a.customer.name.split(" ")[0]}
        {pro && <> · {pro.split(" ")[0]}</>}
      </span>
    </Link>
  );
}

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await requireUser();
  const sp = await searchParams;
  const today = spDay(new Date());
  const day = typeof sp.data === "string" && isValidDay(sp.data) ? sp.data : today;
  const view = sp.visao === "dia" ? "dia" : "semana";

  const days = view === "semana" ? openDaysOfWeek(day) : [day];
  const from = atSp(days[0], "00:00");
  const to = atSp(addDays(days[days.length - 1], 1), "00:00");

  const [professionals, appointments] = await Promise.all([
    db.professional.findMany({
      where: { active: true, specialty: { not: "RECEPTION" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: from, lt: to } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        professionalId: true,
        service: { select: { name: true } },
        vehicle: { select: { plate: true } },
        customer: { select: { name: true } },
      },
    }),
  ]);
  const colorOf = new Map(professionals.map((p, i) => [p.id, i % COLORS.length]));
  const proName = new Map(professionals.map((p) => [p.id, p.name]));
  const active = appointments.filter((a) => a.status !== "CANCELED").length;

  const href = (d: string, v = view) => `/agenda?data=${d}&visao=${v}`;
  const prev = view === "semana" ? addDays(day, -7) : nextOpen(day, -1);
  const next = view === "semana" ? addDays(day, 7) : nextOpen(day, 1);
  const title =
    view === "semana"
      ? `Semana de ${formatDate(noon(days[0])).slice(0, 5)} a ${formatDate(noon(days[days.length - 1]))}`
      : formatLongDay(noon(day)).replace(/^./, (c) => c.toUpperCase());

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
          <Link href={href(prev)} className={buttonVariants({ variant: "outline", size: "icon-lg" })} aria-label={view === "semana" ? "Semana anterior" : "Dia anterior"}>
            <ChevronLeft aria-hidden="true" />
          </Link>
          <Link href={href(today)} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Hoje
          </Link>
          <Link href={href(next)} className={buttonVariants({ variant: "outline", size: "icon-lg" })} aria-label={view === "semana" ? "Próxima semana" : "Próximo dia"}>
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>

        <form className="flex items-center gap-1">
          <Label htmlFor="data" className="sr-only">
            Ir para a data
          </Label>
          <Input id="data" name="data" type="date" defaultValue={day} className="h-9 w-auto" />
          <input type="hidden" name="visao" value={view} />
          <Button type="submit" variant="outline" size="lg">
            Ir
          </Button>
        </form>

        <nav aria-label="Visualização" className="ml-auto flex rounded-lg border p-0.5">
          {(["semana", "dia"] as const).map((v) => (
            <Link
              key={v}
              href={href(day, v)}
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                view === v && "bg-muted font-medium text-foreground",
              )}
            >
              {v === "semana" ? "Semana" : "Dia"}
            </Link>
          ))}
        </nav>
      </div>

      <ul className="mb-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Profissionais">
        {professionals.map((p) => (
          <li key={p.id} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", DOTS[colorOf.get(p.id)!])} aria-hidden="true" />
            {p.name} · {specialtyLabel[p.specialty]}
          </li>
        ))}
      </ul>

      {view === "semana" ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {days.map((d) => {
            const list = appointments.filter((a) => spDay(a.startsAt) === d);
            return (
              <section key={d} aria-labelledby={`dia-${d}`} className="flex flex-col gap-2">
                <h2 id={`dia-${d}`} className="text-sm">
                  <Link
                    href={href(d, "dia")}
                    className={cn(
                      "inline-flex rounded-md px-1 font-medium capitalize hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      d === today && "text-primary",
                    )}
                  >
                    {formatWeekday(noon(d))}
                    {d === today && <span className="ml-1 font-normal">(hoje)</span>}
                  </Link>
                </h2>
                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Sem agendamentos</p>
                ) : (
                  list.map((a) => <AppointmentCard key={a.id} a={a} color={COLORS[colorOf.get(a.professionalId) ?? 0]} pro={proName.get(a.professionalId)} />)
                )}
              </section>
            );
          })}
        </div>
      ) : !businessHours[weekday(day)] ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          A oficina não abre aos domingos.{" "}
          <Link href={href(nextOpen(day, 1))} className="font-medium text-primary hover:underline">
            Ver o próximo dia útil
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {professionals.map((p) => {
            const list = appointments.filter((a) => a.professionalId === p.id);
            return (
              <section key={p.id} aria-labelledby={`pro-${p.id}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 id={`pro-${p.id}`} className="text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground"> · {specialtyLabel[p.specialty]}</span>
                  </h2>
                  <Link
                    href={`/agenda/novo?data=${day}&profissional=${p.id}`}
                    className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    aria-label={`Agendar com ${p.name}`}
                  >
                    <Plus aria-hidden="true" />
                  </Link>
                </div>
                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Livre o dia todo</p>
                ) : (
                  list.map((a) => <AppointmentCard key={a.id} a={a} color={COLORS[colorOf.get(a.professionalId) ?? 0]} />)
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
