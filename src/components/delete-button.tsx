"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-field";
import type { FormState } from "@/lib/form";

// Botão de exclusão com confirmação nativa do navegador e mensagem de erro do servidor.
export function DeleteButton({
  action,
  label,
  confirmMessage,
  icon = <Trash2 aria-hidden="true" />,
}: {
  action: (prev: FormState) => Promise<FormState>;
  label: string;
  confirmMessage: string;
  icon?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      className="flex flex-col items-start gap-2"
    >
      <Button type="submit" variant="destructive" size="lg" disabled={pending}>
        {icon}
        {pending ? "Aguarde…" : label}
      </Button>
      <FormError message={state.error} />
    </form>
  );
}
