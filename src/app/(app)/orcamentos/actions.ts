"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formValues, optionalText, type FormState } from "@/lib/form";
import { parseMoney } from "@/lib/format";
import { specialtyFor } from "@/lib/labels";
import { centsToDecimalString, quoteTotals } from "@/lib/quote-math";
import { atSp, isValidDay } from "@/lib/schedule";

// Item como chega do editor (texto digitado); convertido e validado aqui.
const itemSchema = z.object({
  kind: z.enum(["PART", "LABOR"]),
  description: z.string().trim().min(2, "Descreva o item.").max(120, "Use no máximo 120 caracteres."),
  quantity: z.string().transform((v, ctx) => {
    const n = Number(v.replace(",", "."));
    if (!/^\d+([.,]\d{1,2})?$/.test(v.trim()) || n <= 0 || n > 9999) {
      ctx.addIssue({ code: "custom", message: "Quantidade inválida." });
      return z.NEVER;
    }
    return n;
  }),
  unitPrice: z.string().transform((v, ctx) => {
    const cents = parseMoney(v);
    if (cents === null || cents > 99_999_999) {
      ctx.addIssue({ code: "custom", message: "Valor unitário inválido." });
      return z.NEVER;
    }
    return cents;
  }),
  serviceId: z.string().nullish(),
});

const schema = z.object({
  customerId: z.string({ error: "Selecione o cliente." }).min(1, "Selecione o cliente."),
  vehicleId: z.string({ error: "Selecione o veículo." }).min(1, "Selecione o veículo."),
  discount: z.string().transform((v, ctx) => {
    if (!v.trim()) return 0;
    const cents = parseMoney(v);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Desconto inválido. Use, por exemplo, 50,00." });
      return z.NEVER;
    }
    return cents;
  }),
  validUntil: z
    .string()
    .refine((v) => !v || isValidDay(v), "Informe uma data válida.")
    .transform((v) => (v ? atSp(v, "23:59") : null)),
  notes: optionalText(500, "Use no máximo 500 caracteres."),
  items: z
    .string()
    .transform((v, ctx) => {
      try {
        return JSON.parse(v) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Itens inválidos." });
        return z.NEVER;
      }
    })
    .pipe(z.array(itemSchema).min(1, "Adicione pelo menos um item.").max(50, "Use no máximo 50 itens.")),
});

export async function saveQuote(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    // Erros de item viram "items.0", "items.1"... para aparecer na linha certa.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] === "items" && typeof issue.path[1] === "number" ? `items.${issue.path[1]}` : String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  if (id) {
    const current = await db.quote.findUnique({ where: { id }, select: { status: true } });
    if (!current || (current.status !== "DRAFT" && current.status !== "SENT")) {
      return { error: "Só é possível editar orçamentos em rascunho ou enviados." };
    }
  }
  const vehicle = await db.vehicle.findUnique({ where: { id: data.vehicleId }, select: { customerId: true } });
  if (!vehicle || vehicle.customerId !== data.customerId) {
    return { fieldErrors: { vehicleId: "Este veículo não pertence ao cliente selecionado." } };
  }

  const lines = data.items.map((i) => ({ quantity: i.quantity, unitPriceCents: i.unitPrice }));
  const subtotal = quoteTotals(lines, 0).subtotalCents;
  if (data.discount > subtotal) return { fieldErrors: { discount: "O desconto não pode ser maior que o subtotal." } };
  const totals = quoteTotals(lines, data.discount);

  const quoteData = {
    customerId: data.customerId,
    vehicleId: data.vehicleId,
    validUntil: data.validUntil,
    notes: data.notes,
    discount: centsToDecimalString(totals.discountCents),
    subtotal: centsToDecimalString(totals.subtotalCents),
    total: centsToDecimalString(totals.totalCents),
  };
  const items = data.items.map((i, position) => ({
    kind: i.kind,
    description: i.description,
    quantity: i.quantity.toFixed(2),
    unitPrice: centsToDecimalString(i.unitPrice),
    serviceId: i.serviceId || null,
    position,
  }));

  const saved = await db.$transaction(async (tx) => {
    if (!id) return tx.quote.create({ data: { ...quoteData, items: { create: items } }, select: { id: true } });
    await tx.quoteItem.deleteMany({ where: { quoteId: id } });
    return tx.quote.update({ where: { id }, data: { ...quoteData, items: { create: items } }, select: { id: true } });
  });
  redirect(`/orcamentos/${saved.id}`);
}

// ---------- Mudanças de situação (cada uma só vale a partir da situação certa) ----------

export async function markQuoteSent(id: string): Promise<FormState> {
  await requireUser();
  await db.quote.updateMany({ where: { id, status: "DRAFT" }, data: { status: "SENT", sentAt: new Date() } });
  revalidatePath(`/orcamentos/${id}`);
  return {};
}

export async function approveQuote(id: string): Promise<FormState> {
  await requireUser();
  const ok = await db.$transaction(async (tx) => {
    const { count } = await tx.quote.updateMany({ where: { id, status: "SENT" }, data: { status: "APPROVED", decidedAt: new Date() } });
    if (count === 0) return false;
    const quote = await tx.quote.findUniqueOrThrow({
      where: { id },
      select: { vehicleId: true, items: { where: { serviceId: { not: null } }, orderBy: { position: "asc" }, take: 1, select: { service: { select: { category: true } } } } },
    });
    // Responsável inicial: alguém da especialidade do primeiro serviço do catálogo (pode ser trocado na OS).
    const category = quote.items[0]?.service?.category;
    const professional = category
      ? await tx.professional.findFirst({ where: { active: true, specialty: specialtyFor[category] }, orderBy: { name: "asc" } })
      : null;
    await tx.workOrder.create({ data: { quoteId: id, vehicleId: quote.vehicleId, professionalId: professional?.id ?? null } });
    return true;
  });
  if (!ok) return { error: "Só orçamentos enviados podem ser aprovados." };
  revalidatePath(`/orcamentos/${id}`);
  return {};
}

export async function rejectQuote(id: string): Promise<FormState> {
  await requireUser();
  const { count } = await db.quote.updateMany({ where: { id, status: "SENT" }, data: { status: "REJECTED", decidedAt: new Date() } });
  if (count === 0) return { error: "Só orçamentos enviados podem ser recusados." };
  revalidatePath(`/orcamentos/${id}`);
  return {};
}

export async function deleteQuote(id: string): Promise<FormState> {
  await requireUser();
  const { count } = await db.quote.deleteMany({ where: { id, status: "DRAFT" } });
  if (count === 0) return { error: "Só rascunhos podem ser excluídos." };
  redirect("/orcamentos");
}
