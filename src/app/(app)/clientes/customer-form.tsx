"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError, TextAreaField, TextField } from "@/components/form-field";
import type { FormState } from "@/lib/form";

type Customer = { name: string; phone: string; email: string | null; notes: string | null };

export function CustomerForm({
  action,
  customer,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  customer?: Customer;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = (k: keyof Customer) => state.values?.[k] ?? customer?.[k] ?? "";
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex max-w-xl flex-col gap-4">
      <TextField label="Nome" name="name" required autoComplete="off" defaultValue={v("name")} error={e.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Telefone"
          name="phone"
          required
          type="tel"
          inputMode="tel"
          placeholder="(00) 98765-4321"
          defaultValue={v("phone")}
          error={e.phone}
        />
        <TextField label="E-mail" name="email" type="email" inputMode="email" defaultValue={v("email")} error={e.email} />
      </div>
      <TextAreaField
        label="Observações"
        name="notes"
        rows={3}
        hint="Preferências de contato, horários, cuidados com o veículo."
        defaultValue={v("notes")}
        error={e.notes}
      />
      <FormError message={state.error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Salvar cliente"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
