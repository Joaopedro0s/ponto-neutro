import "server-only";
import { db } from "@/lib/db";
import type { QuoteFormOptions } from "./quote-form";

// shortcut: carrega todos os clientes e veículos no formulário; trocar por busca se a base passar de alguns milhares.
export async function loadQuoteOptions(): Promise<QuoteFormOptions> {
  const [customers, services] = await Promise.all([
    db.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, vehicles: { select: { id: true, plate: true, model: true }, orderBy: { plate: "asc" } } },
    }),
    db.service.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }], select: { id: true, name: true, price: true } }),
  ]);
  return { customers, services: services.map((s) => ({ id: s.id, name: s.name, priceCents: Math.round(Number(s.price) * 100) })) };
}
