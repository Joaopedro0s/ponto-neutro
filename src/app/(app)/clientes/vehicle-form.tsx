"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError, TextField } from "@/components/form-field";
import type { FormState } from "@/lib/form";

type Vehicle = { plate: string; model: string; color: string | null; year: number | null };

export function VehicleForm({
  action,
  vehicle,
  cancelHref,
  submitLabel = "Salvar veículo",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  vehicle?: Vehicle;
  cancelHref?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = (k: keyof Vehicle) => state.values?.[k] ?? String(vehicle?.[k] ?? "");
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Placa"
          name="plate"
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABC1D23"
          className="sm:max-w-48"
          defaultValue={v("plate")}
          error={e.plate}
        />
        <TextField
          label="Modelo"
          name="model"
          required
          placeholder="Ex.: Hatch compacto 1.0"
          defaultValue={v("model")}
          error={e.model}
        />
        <TextField label="Cor" name="color" defaultValue={v("color")} error={e.color} />
        <TextField label="Ano" name="year" inputMode="numeric" maxLength={4} defaultValue={v("year")} error={e.year} />
      </div>
      <FormError message={state.error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
