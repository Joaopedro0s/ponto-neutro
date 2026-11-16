"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { DEMO_ACCOUNT } from "@/lib/demo";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors;
    return { email, fieldErrors: { email: errors.email?.[0], password: errors.password?.[0] } };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais contas existem.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { email, error: "E-mail ou senha incorretos." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function loginAsDemo(): Promise<LoginState> {
  const user = await db.user.findUnique({ where: { email: DEMO_ACCOUNT.email } });
  if (!user) {
    return { error: "A conta de demonstração não existe. Rode `npm run db:seed` para criar os dados." };
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
