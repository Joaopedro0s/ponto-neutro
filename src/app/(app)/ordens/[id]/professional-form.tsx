"use client";

import { useActionState } from "react";
import { FormError, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";

export function ProfessionalForm({
  action,
  professionals,
  current,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  professionals: { id: string; label: string }[];
  current: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <SelectField label="Responsável" name="professionalId" required defaultValue={current} className="flex-1">
          <option value="">Sem responsável</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="outline" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
