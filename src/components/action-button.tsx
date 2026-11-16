"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-field";
import type { FormState } from "@/lib/form";

// Botão que dispara uma Server Action, com confirmação opcional e a mensagem de erro do servidor.
export function ActionButton({
  action,
  label,
  confirmMessage,
  icon = <Trash2 aria-hidden="true" />,
  variant = "destructive",
}: {
  action: (prev: FormState) => Promise<FormState>;
  label: string;
  confirmMessage?: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
      className="flex flex-col items-start gap-2"
    >
      <Button type="submit" variant={variant} size="lg" disabled={pending}>
        {icon}
        {pending ? "Aguarde…" : label}
      </Button>
      <FormError message={state.error} />
    </form>
  );
}
