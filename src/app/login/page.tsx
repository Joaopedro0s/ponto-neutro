import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DemoNotice } from "@/components/demo-notice";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { company } from "@/lib/company";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

// Fundo liso: só marca, slogan em tipografia e formulário. Nada decorativo.
export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 sm:px-8 lg:grid-cols-2 lg:gap-24">
        <section aria-label={company.name} className="hidden lg:block">
          <Logo size="lg" />
          <p className="mt-10 max-w-md font-display text-6xl leading-[0.95] font-bold tracking-wide text-balance uppercase">{company.slogan}</p>
          <p className="mt-6 max-w-sm text-base text-muted-foreground">Agenda, orçamentos e ordens de serviço da oficina em um só painel.</p>
        </section>

        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
          <Logo className="lg:hidden" />
          <h1 className="mt-10 font-display text-4xl font-bold tracking-wide uppercase lg:mt-0">Acesse o painel</h1>
          <p className="mt-2 text-sm text-muted-foreground lg:hidden">{company.slogan}</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
      <DemoNotice className="border-t py-4 text-center text-xs text-muted-foreground" />
    </div>
  );
}
