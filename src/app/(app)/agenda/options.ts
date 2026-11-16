import "server-only";
import { db } from "@/lib/db";
import { specialtyLabel } from "@/lib/labels";
import type { FormOptions } from "./appointment-form";

// shortcut: carrega todos os clientes e veículos no formulário; trocar por busca se a base passar de alguns milhares.
export async function loadFormOptions(): Promise<FormOptions> {
  const [customers, services, professionals] = await Promise.all([
    db.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, vehicles: { select: { id: true, plate: true, model: true }, orderBy: { plate: "asc" } } },
    }),
    db.service.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }], select: { id: true, name: true, durationMinutes: true } }),
    db.professional.findMany({ where: { active: true, specialty: { not: "RECEPTION" } }, orderBy: { name: "asc" } }),
  ]);
  return {
    customers,
    services,
    professionals: professionals.map((p) => ({ id: p.id, label: `${p.name} · ${specialtyLabel[p.specialty]}` })),
  };
}
