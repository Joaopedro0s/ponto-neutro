import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Painel provisório da fase 2: mostra o volume de dados do seed. O dashboard real chega na fase 7.
export default async function HomePage() {
  const user = await requireUser();
  const [customers, vehicles, appointments, quotes, inService] = await Promise.all([
    db.customer.count(),
    db.vehicle.count(),
    db.appointment.count(),
    db.quote.count(),
    db.workOrder.count({ where: { status: { in: ["WAITING", "IN_PROGRESS", "READY"] } } }),
  ]);

  const stats = [
    { label: "Clientes", value: customers },
    { label: "Veículos", value: vehicles },
    { label: "Agendamentos", value: appointments },
    { label: "Orçamentos", value: quotes },
    { label: "Veículos na oficina", value: inService },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">O painel completo chega nas próximas fases.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
