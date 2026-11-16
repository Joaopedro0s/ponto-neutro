import "server-only";
import { db } from "@/lib/db";
import { addDays, atSp, monthToDateRanges, spDay, weekday } from "@/lib/schedule";

const sumTotals = (rows: { quote: { total: { toString(): string } } }[]) => rows.reduce((s, r) => s + Number(r.quote.total), 0);
const DAY = 86_400_000;

/** Variação relativa; null quando não há base de comparação. */
export const delta = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null);

/**
 * Números do painel. Faturamento = total dos orçamentos cujas OS foram entregues no período
 * (o dinheiro entra na retirada do veículo). Comparações usam sempre o período anterior equivalente.
 */
export async function loadDashboard(now = new Date()) {
  const { current, previous } = monthToDateRanges(now);
  const today = spDay(now);
  const ago = (days: number) => new Date(now.getTime() - days * DAY);
  // Séries semanais: 12 semanas completas + a atual, começando na segunda-feira.
  const thisMonday = addDays(today, -((weekday(today) + 6) % 7));
  const firstMonday = addDays(thisMonday, -12 * 7);
  const seriesStart = atSp(firstMonday, "00:00");

  const [monthRows, prevRows, decided30, decidedPrev30, approvedMonth, approvedPrev, weekRows, decidedWeekRows, byStatus, topItems, todayAppointments, lastDays, inShop, shopHistory] =
    await Promise.all([
      db.workOrder.findMany({ where: { deliveredAt: { gte: current.from, lt: current.to } }, select: { quote: { select: { total: true } } } }),
      db.workOrder.findMany({ where: { deliveredAt: { gte: previous.from, lt: previous.to } }, select: { quote: { select: { total: true } } } }),
      db.quote.groupBy({ by: ["status"], where: { decidedAt: { gte: ago(30) }, status: { in: ["APPROVED", "REJECTED"] } }, _count: true }),
      db.quote.groupBy({ by: ["status"], where: { decidedAt: { gte: ago(60), lt: ago(30) }, status: { in: ["APPROVED", "REJECTED"] } }, _count: true }),
      db.quote.count({ where: { status: "APPROVED", decidedAt: { gte: current.from, lt: current.to } } }),
      db.quote.count({ where: { status: "APPROVED", decidedAt: { gte: previous.from, lt: previous.to } } }),
      db.workOrder.findMany({ where: { deliveredAt: { gte: seriesStart } }, select: { deliveredAt: true, quote: { select: { total: true } } } }),
      db.quote.findMany({ where: { status: { in: ["APPROVED", "REJECTED"] }, decidedAt: { gte: seriesStart } }, select: { decidedAt: true, status: true } }),
      db.quote.groupBy({ by: ["status"], where: { createdAt: { gte: ago(90) } }, _count: true }),
      db.quoteItem.groupBy({
        by: ["serviceId"],
        where: { serviceId: { not: null }, quote: { status: "APPROVED", decidedAt: { gte: ago(90) } } },
        _count: true,
        orderBy: { _count: { serviceId: "desc" } },
        take: 6,
      }),
      db.appointment.findMany({
        where: { startsAt: { gte: atSp(today, "00:00"), lt: atSp(addDays(today, 1), "00:00") }, status: { not: "CANCELED" } },
        orderBy: { startsAt: "asc" },
        include: { service: { select: { name: true } }, vehicle: { select: { plate: true } }, professional: { select: { id: true, name: true } } },
      }),
      db.appointment.findMany({
        where: { startsAt: { gte: atSp(addDays(today, -13), "00:00"), lt: atSp(addDays(today, 1), "00:00") }, status: { not: "CANCELED" } },
        select: { startsAt: true },
      }),
      db.workOrder.findMany({
        where: { status: { not: "DELIVERED" } },
        orderBy: { createdAt: "asc" },
        include: {
          vehicle: { select: { plate: true, model: true } },
          professional: { select: { name: true } },
          quote: { select: { customer: { select: { name: true } }, items: { where: { kind: "LABOR" }, orderBy: { position: "asc" }, take: 1, select: { description: true } } } },
        },
      }),
      // Para a série "veículos na oficina" dos últimos 14 dias
      db.workOrder.findMany({
        where: { createdAt: { lt: atSp(addDays(today, 1), "00:00") }, OR: [{ deliveredAt: null }, { deliveredAt: { gte: atSp(addDays(today, -13), "00:00") } }] },
        select: { createdAt: true, deliveredAt: true },
      }),
    ]);

  const services = await db.service.findMany({ where: { id: { in: topItems.map((t) => t.serviceId!) } }, select: { id: true, name: true } });
  const countOf = (rows: { status: string; _count: number }[], s: string) => rows.find((r) => r.status === s)?._count ?? 0;
  const rate = (rows: { status: string; _count: number }[]) => {
    const a = countOf(rows, "APPROVED");
    const total = a + countOf(rows, "REJECTED");
    return { approved: a, decided: total, value: total ? a / total : null };
  };

  // Agrupa datas em semanas a partir da primeira segunda-feira.
  const weekIndex = (d: Date) => Math.floor((atSp(spDay(d), "12:00").getTime() - atSp(firstMonday, "12:00").getTime()) / (7 * DAY));
  const weeks = Array.from({ length: 13 }, (_, i) => {
    const start = addDays(firstMonday, i * 7);
    return { start, label: `${start.slice(8, 10)}/${start.slice(5, 7)}`, total: 0, approvals: 0, rejections: 0, partial: start === thisMonday };
  });
  for (const r of weekRows) if (weeks[weekIndex(r.deliveredAt!)]) weeks[weekIndex(r.deliveredAt!)].total += Number(r.quote.total);
  for (const r of decidedWeekRows) {
    const w = weeks[weekIndex(r.decidedAt!)];
    if (w) w[r.status === "APPROVED" ? "approvals" : "rejections"] += 1;
  }

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const perDay = days.map((d) => ({ day: d, count: lastDays.filter((a) => spDay(a.startsAt) === d).length }));
  const sameDayLastWeek = perDay[perDay.length - 8].count;
  // Veículos na oficina ao fim de cada dia: OS abertas até o dia e ainda não entregues.
  const inShopPerDay = days.map((d) => {
    const end = atSp(addDays(d, 1), "00:00");
    return shopHistory.filter((w) => w.createdAt < end && (!w.deliveredAt || w.deliveredAt >= end)).length;
  });

  return {
    today,
    revenue: { current: sumTotals(monthRows), previous: sumTotals(prevRows) },
    approvedQuotes: { current: approvedMonth, previous: approvedPrev },
    approval: { current: rate(decided30), previous: rate(decidedPrev30) },
    appointmentsToday: { current: todayAppointments.length, previous: sameDayLastWeek },
    weeks: weeks.map((w) => ({ ...w, total: Math.round(w.total * 100) / 100 })),
    perDay,
    inShopPerDay,
    // Taxa de aprovação por semana (semanas sem decisão ficam com a taxa da anterior, para a linha não despencar)
    approvalPerWeek: weeks.reduce<number[]>((acc, w) => [...acc, w.approvals + w.rejections ? w.approvals / (w.approvals + w.rejections) : (acc.at(-1) ?? 0)], []),
    quotesByStatus: { DRAFT: countOf(byStatus, "DRAFT"), SENT: countOf(byStatus, "SENT"), APPROVED: countOf(byStatus, "APPROVED"), REJECTED: countOf(byStatus, "REJECTED") },
    topServices: topItems.map((t) => ({ name: services.find((s) => s.id === t.serviceId)?.name ?? "—", count: t._count })),
    todayAppointments,
    inShop,
  };
}
