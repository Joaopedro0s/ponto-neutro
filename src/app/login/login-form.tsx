"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, loginAsDemo, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {} as LoginState);
  const [demoState, demoAction, demoPending] = useActionState(loginAsDemo, {} as LoginState);
  const busy = pending || demoPending;
  const error = state.error ?? demoState.error;

  return (
    <div className="flex flex-col gap-6">
      <form action={demoAction}>
        <Button type="submit" size="lg" className="h-11 w-full text-sm" disabled={busy}>
          {demoPending ? "Entrando…" : "Entrar como demonstração"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Acesso imediato com dados fictícios, sem cadastro.
        </p>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        ou entre com e-mail
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-10"
            defaultValue={state.email}
            aria-invalid={!!state.fieldErrors?.email}
            aria-describedby={state.fieldErrors?.email ? "email-erro" : undefined}
          />
          {state.fieldErrors?.email && (
            <p id="email-erro" className="text-sm text-destructive">
              {state.fieldErrors.email}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-10"
            aria-invalid={!!state.fieldErrors?.password}
            aria-describedby={state.fieldErrors?.password ? "senha-erro" : undefined}
          />
          {state.fieldErrors?.password && (
            <p id="senha-erro" className="text-sm text-destructive">
              {state.fieldErrors.password}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" variant="outline" size="lg" className="h-10" disabled={busy}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
