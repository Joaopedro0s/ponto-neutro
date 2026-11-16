"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { CustomerVehicleFields, type CustomerOption } from "@/components/customer-vehicle-fields";
import { FormError, TextAreaField, TextField } from "@/components/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { fieldClass, Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centsToInput, formatBRL, parseMoney } from "@/lib/format";
import type { FormState } from "@/lib/form";
import { quoteItemKindLabel } from "@/lib/labels";
import { lineTotalCents, quoteTotals } from "@/lib/quote-math";
import { cn } from "@/lib/utils";

export type QuoteFormOptions = {
  customers: CustomerOption[];
  services: { id: string; name: string; priceCents: number }[];
};

export type ItemRow = {
  key: string;
  kind: "PART" | "LABOR";
  description: string;
  quantity: string;
  unitPrice: string;
  serviceId: string | null;
};

type Defaults = {
  customerId: string;
  vehicleId: string;
  discount: string;
  validUntil: string;
  notes: string;
  items: ItemRow[];
};

const quantityOf = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const newKey = () => Math.random().toString(36).slice(2);

export function QuoteForm({
  action,
  options,
  defaults,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  options: QuoteFormOptions;
  defaults: Defaults;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [rows, setRows] = useState<ItemRow[]>(defaults.items);
  const [discount, setDiscount] = useState(defaults.discount);
  const e = state.fieldErrors ?? {};

  const lines = rows.map((r) => ({ quantity: quantityOf(r.quantity), unitPriceCents: parseMoney(r.unitPrice) ?? 0 }));
  const totals = quoteTotals(lines, parseMoney(discount) ?? 0);
  const update = (key: string, patch: Partial<ItemRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      // onSubmit em vez de action: mantém os itens digitados quando o servidor devolve um erro.
      onSubmit={(ev) => {
        ev.preventDefault();
        startTransition(() => formAction(new FormData(ev.currentTarget)));
      }}
    >
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <CustomerVehicleFields
          customers={options.customers}
          defaultCustomerId={defaults.customerId}
          defaultVehicleId={defaults.vehicleId}
          errors={e}
        />
      </div>

      <section aria-labelledby="itens" className="flex flex-col gap-3">
        <h2 id="itens" className="eyebrow">
          Itens
        </h2>
        <input type="hidden" name="items" value={JSON.stringify(rows)} />

        <div className="hidden grid-cols-[9rem_1fr_5rem_8rem_7rem_2.5rem] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid" aria-hidden="true">
          <span>Tipo</span>
          <span>Descrição</span>
          <span>Qtd.</span>
          <span>Valor unit. (R$)</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum item ainda. Adicione um serviço do catálogo ou uma peça.
          </p>
        )}

        <ol className="flex flex-col gap-3 sm:gap-2">
          {rows.map((r, i) => {
            const n = i + 1;
            const error = e[`items.${i}`];
            const id = (f: string) => `item-${r.key}-${f}`;
            return (
              <li key={r.key} className="relative rounded-lg border p-3 sm:border-0 sm:p-0">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-[9rem_1fr_5rem_8rem_7rem_2.5rem] sm:items-center">
                  <div className="col-span-3 pr-10 sm:col-span-1 sm:pr-0">
                    <Label htmlFor={id("kind")} className="mb-1 text-xs sm:sr-only">
                      Tipo<span className="sr-only"> do item {n}</span>
                    </Label>
                    <select
                      id={id("kind")}
                      value={r.kind}
                      onChange={(ev) => update(r.key, { kind: ev.target.value as ItemRow["kind"] })}
                      className={cn(fieldClass, "h-11 sm:h-10")}
                    >
                      {Object.entries(quoteItemKindLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <Label htmlFor={id("desc")} className="mb-1 text-xs sm:sr-only">
                      Descrição<span className="sr-only"> do item {n}</span>
                    </Label>
                    <Input
                      id={id("desc")}
                      value={r.description}
                      onChange={(ev) => update(r.key, { description: ev.target.value })}
                      aria-invalid={!!error || undefined}
                      
                    />
                  </div>
                  <div>
                    <Label htmlFor={id("qty")} className="mb-1 text-xs sm:sr-only">
                      Qtd.<span className="sr-only"> do item {n}</span>
                    </Label>
                    <Input
                      id={id("qty")}
                      inputMode="decimal"
                      value={r.quantity}
                      onChange={(ev) => update(r.key, { quantity: ev.target.value })}
                      className="tabular-nums"
                    />
                  </div>
                  <div>
                    <Label htmlFor={id("price")} className="mb-1 text-xs sm:sr-only">
                      Valor unit. (R$)<span className="sr-only"> do item {n}</span>
                    </Label>
                    <Input
                      id={id("price")}
                      inputMode="decimal"
                      value={r.unitPrice}
                      onChange={(ev) => update(r.key, { unitPrice: ev.target.value })}
                      onBlur={() => {
                        const cents = parseMoney(r.unitPrice);
                        if (cents !== null) update(r.key, { unitPrice: centsToInput(cents) });
                      }}
                      className="tabular-nums"
                    />
                  </div>
                  <div className="flex items-end justify-end self-end pb-2.5 text-sm font-medium tabular-nums sm:self-center sm:pb-0">
                    <span className="sr-only">Total do item {n}: </span>
                    {formatBRL(lineTotalCents(lines[i]) / 100)}
                  </div>
                  <div className="absolute top-1.5 right-1.5 sm:static">
                    <Button type="button" variant="ghost" size="icon-lg" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} aria-label={`Remover item ${n}`}>
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                {error && <p className="mt-1 text-sm text-danger-fg">Item {n}: {error}</p>}
              </li>
            );
          })}
        </ol>
        {e.items && <p className="text-sm text-danger-fg">{e.items}</p>}

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalogo">Adicionar do catálogo</Label>
            <select
              id="catalogo"
              value=""
              onChange={(ev) => {
                const s = options.services.find((x) => x.id === ev.target.value);
                if (s) setRows((rs) => [...rs, { key: newKey(), kind: "LABOR", description: s.name, quantity: "1", unitPrice: centsToInput(s.priceCents), serviceId: s.id }]);
              }}
              className={cn(fieldClass, "h-11 max-w-xs sm:h-10")}
            >
              <option value="">Escolha um serviço…</option>
              {options.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatBRL(s.priceCents / 100)}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setRows((rs) => [...rs, { key: newKey(), kind: "PART", description: "", quantity: "1", unitPrice: "", serviceId: null }])}
          >
            <Plus aria-hidden="true" />
            Adicionar peça ou item avulso
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex max-w-2xl flex-col gap-4">
          <TextField label="Válido até" name="validUntil" type="date" defaultValue={defaults.validUntil} error={e.validUntil} className="sm:max-w-48" />
          <TextAreaField label="Observações para o cliente" name="notes" rows={3} defaultValue={defaults.notes} error={e.notes} />
        </div>

        <dl className="flex h-fit flex-col gap-2 rounded-xl border bg-card p-4 text-sm" aria-live="polite">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatBRL(totals.subtotalCents / 100)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>
              <Label htmlFor="discount" className="font-normal text-muted-foreground">
                Desconto (R$)
              </Label>
            </dt>
            <dd>
              <Input
                id="discount"
                name="discount"
                inputMode="decimal"
                value={discount}
                onChange={(ev) => setDiscount(ev.target.value)}
                aria-invalid={!!e.discount || undefined}
                aria-describedby={e.discount ? "discount-erro" : undefined}
                className="w-32 text-right tabular-nums"
              />
            </dd>
          </div>
          {e.discount && (
            <p id="discount-erro" className="text-right text-sm text-danger-fg">
              {e.discount}
            </p>
          )}
          {totals.discountCents > 0 && totals.subtotalCents > 0 && (
            <p className="text-right text-xs text-muted-foreground">
              {((totals.discountCents / totals.subtotalCents) * 100).toFixed(1).replace(".", ",")}% do subtotal
            </p>
          )}
          <div className="mt-1 flex justify-between border-t pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatBRL(totals.totalCents / 100)}</dd>
          </div>
        </dl>
      </div>

      <FormError message={state.error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Salvar orçamento"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Voltar
        </Link>
      </div>
    </form>
  );
}
