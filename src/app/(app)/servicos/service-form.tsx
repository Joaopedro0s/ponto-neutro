"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormError, SelectField, TextAreaField, TextField } from "@/components/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FormState } from "@/lib/form";
import { serviceCategoryLabel } from "@/lib/labels";

type Defaults = { name: string; category: string; description: string; price: string; durationMinutes: string; active: boolean };

export function ServiceForm({ action, defaults }: { action: (prev: FormState, formData: FormData) => Promise<FormState>; defaults: Defaults }) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = (k: Exclude<keyof Defaults, "active">) => state.values?.[k] ?? defaults[k];
  const e = state.fieldErrors ?? {};
  const active = state.values ? state.values.active === "on" : defaults.active;

  return (
    <form action={formAction} noValidate className="flex max-w-xl flex-col gap-4">
      <TextField label="Nome" name="name" required defaultValue={v("name")} error={e.name} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Categoria" name="category" required defaultValue={v("category")} error={e.category}>
          <option value="">Selecione…</option>
          {Object.entries(serviceCategoryLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextField label="Preço (R$)" name="price" required inputMode="decimal" defaultValue={v("price")} error={e.price} />
        <TextField
          label="Duração (min)"
          name="durationMinutes"
          required
          inputMode="numeric"
          defaultValue={v("durationMinutes")}
          hint="Usada para calcular o término na agenda."
          error={e.durationMinutes}
        />
      </div>
      <TextAreaField label="Descrição" name="description" rows={2} defaultValue={v("description")} error={e.description} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={active} className="size-4 accent-[var(--primary)]" />
        Ativo (aparece na agenda e nos orçamentos)
      </label>
      <FormError message={state.error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Salvar serviço"}
        </Button>
        <Link href="/servicos" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Voltar
        </Link>
      </div>
    </form>
  );
}
