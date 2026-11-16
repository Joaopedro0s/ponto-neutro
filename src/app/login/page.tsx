import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { company } from "@/lib/company";
import { LoginForm } from "./login-form";
import { DemoNotice } from "@/components/demo-notice";
import { SpeedometerArt } from "@/components/speedometer-art";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
        {/* Painel da marca: só em telas largas, para o formulário vir primeiro no celular. */}
        <section aria-label={company.name} className="relative hidden overflow-hidden border-r bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_70%_60%,black,transparent_70%)]"
            aria-hidden="true"
          />
          <Logo size="lg" slogan />
          <SpeedometerArt className="relative mx-auto my-8 w-full max-w-md" />
          <ul className="relative grid grid-cols-3 gap-6 border-t pt-6 text-sm text-muted-foreground">
            <li>
              <span className="block font-display text-2xl font-semibold text-foreground">Agenda</span>
              sem horários encavalados
            </li>
            <li>
              <span className="block font-display text-2xl font-semibold text-foreground">Orçamento</span>
              em PDF pelo WhatsApp
            </li>
            <li>
              <span className="block font-display text-2xl font-semibold text-foreground">Oficina</span>
              da entrada à retirada
            </li>
          </ul>
        </section>

        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-sm">
            <Logo className="lg:hidden" />
            <h1 className="mt-10 font-display text-4xl font-bold tracking-wide uppercase lg:mt-0">Acesse o painel</h1>
            <p className="mt-2 text-sm text-muted-foreground">Agenda, orçamentos e ordens de serviço da oficina.</p>
            <div className="mt-8">
              <LoginForm />
            </div>
            <p className="mt-10 text-sm text-muted-foreground lg:hidden">{company.slogan}</p>
          </div>
        </div>
      </main>
      <DemoNotice className="border-t py-4 text-center text-xs text-muted-foreground" />
    </div>
  );
}
