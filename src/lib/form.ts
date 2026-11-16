import { z } from "zod";

// Mensagens padrão do zod em português (as dos formulários são escritas à mão).
z.config(z.locales.ptBR());

// Estado devolvido pelas Server Actions de formulário (useActionState).
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string | undefined>;
  values?: Record<string, string>;
};

export const formValues = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, String(v)]));

export function invalid(error: z.ZodError, values: Record<string, string>): FormState {
  const fieldErrors = Object.fromEntries(
    Object.entries(z.flattenError(error).fieldErrors).map(([k, v]) => [k, (v as string[] | undefined)?.[0]]),
  );
  return { fieldErrors, values };
}

// Campo de texto opcional: string vazia vira null.
export const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).transform((v) => v || null);
