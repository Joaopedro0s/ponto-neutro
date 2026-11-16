import "server-only";
import { db } from "@/lib/db";
import { addDays, atSp, monthToDateRanges, spDay, weekday } from "@/lib/schedule";

const sumTotals = (rows: { quote: { total: { toString(): string } } }[]) => rows.reduce((s, r) => s + Number(r.quote.total), 0);

/**
 * Números do painel. Faturamento = total dos orçamentos cujas OS foram entregues no período
 * (o dinheiro entra na retirada do veículo).
 */
export async function loadDashboard(now = new Date()) {
  const { current, previous } = monthToDateRanges(now);
  const today = spDay(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);
  // Gráfico: 12 semanas completas + a atual, começando na segunda-feira.
  const thisMonday = addDays(today, -((weekday(today) + 6) % 7));
  const firstMonday = addDays(thisMonday, -12 * 7);

  const [monthRows, prevRows, decided, weekRows, topItems, todayAppointments, inShop] = await Promise.all([
    db.workOrder.findMany({ where: { deliveredAt: { gte: current.from, lt: current.to } }, select: { quote: { select: { total: true } } } }),
    db.workOrder.findMany({ where: { deliveredAt: { gte: previous.from, lt: previous.to } }, select: { quote: { select: { total: true } } } }),
    db.quote.groupBy({ by: ["status"], where: { decidedAt: { gte: thirtyDaysAgo }, status: { in: ["APPROVED", "REJECTED"] } }, _count: true }),
    db.workOrder.findMany({
      where: { deliveredAt: { gte: atSp(firstMonday, "00:00") } },
      select: { deliveredAt: true, quote: { select: { total: true } } },
    }),
    db.quoteItem.groupBy({
      by: ["serviceId"],
      where: { serviceId: { not: null }, quote: { status: "APPROVED", decidedAt: { gte: ninetyDaysAgo } } },
      _count: true,
      orderBy: { _count: { serviceId: "desc" } },
      take: 6,
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: atSp(today, "00:00"), lt: atSp(addDays(today, 1), "00:00") }, status: { not: "CANCELED" } },
      orderBy: { startsAt: "asc" },
      include: { service: { select: { name: true } }, vehicle: { select: { plate: true } }, professional: { select: { name: true } } },
    }),
    db.workOrder.findMany({
      where: { status: { not: "DELIVERED" } },
      orderBy: { createdAt: "asc" },
      include: { vehicle: { select: { plate: true, model: true } }, quote: { select: { customer: { select: { name: true } } } } },
    }),
  ]);

  const services = await db.service.findMany({ where: { id: { in: topItems.map((t) => t.serviceId!) } }, select: { id: true, name: true } });
  const approved = decided.find((d) => d.status === "APPROVED")?._count ?? 0;
  const rejected = decided.find((d) => d.status === "REJECTED")?._count ?? 0;

  const weeks = Array.from({ length: 13 }, (_, i) => {
    const start = addDays(firstMonday, i * 7);
    return { start, label: `${start.slice(8, 10)}/${start.slice(5, 7)}`, total: 0 };
  });
  for (const r of weekRows) {
    const index = Math.floor((atSp(spDay(r.deliveredAt!), "12:00").getTime() - atSp(firstMonday, "12:00").getTime()) / (7 * 86_400_000));
    if (weeks[index]) weeks[index].total += Number(r.quote.total);
  }

  return {
    revenue: { current: sumTotals(monthRows), previous: sumTotals(prevRows) },
    approval: { approved, decided: approved + rejected },
    weeks: weeks.map((w) => ({ ...w, total: Math.round(w.total * 100) / 100, partial: w.start === thisMonday })),
    topServices: topItems.map((t) => ({ name: services.find((s) => s.id === t.serviceId)?.name ?? "—", count: t._count })),
    todayAppointments,
    inShop,
    today,
  };
}
