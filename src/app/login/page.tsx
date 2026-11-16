import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { company } from "@/lib/company";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="grid flex-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Painel da marca: só em telas largas, para o formulário vir primeiro no celular. */}
      <section aria-label={company.name} className="relative hidden overflow-hidden bg-brand p-12 text-brand-foreground lg:flex lg:flex-col lg:justify-between">
        <svg viewBox="0 0 320 320" aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] opacity-15">
          <path d="M60 40v240M160 40v240M260 40v240M60 160h200" stroke="currentColor" strokeWidth="18" strokeLinecap="round" fill="none" />
          <circle cx="160" cy="160" r="26" fill="var(--brand-accent)" />
        </svg>
        <p className="text-lg font-semibold tracking-tight">{company.name}</p>
        <div className="relative max-w-md">
          <p className="text-3xl leading-tight font-semibold text-balance">{company.slogan}</p>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-brand-foreground/85">
            <li>Agenda por profissional, sem horários encavalados.</li>
            <li>Orçamento em PDF enviado pelo WhatsApp em um toque.</li>
            <li>Cada veículo acompanhado da entrada à retirada.</li>
          </ul>
        </div>
        <p className="relative text-xs text-brand-foreground/90">{company.address}</p>
      </section>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Acesse o painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestão de agenda, orçamentos e ordens de serviço.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
