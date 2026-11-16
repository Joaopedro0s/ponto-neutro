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
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Acesse o painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">{company.slogan}</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
