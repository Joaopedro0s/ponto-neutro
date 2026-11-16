"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ServiceCategory } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formValues, invalid, optionalText, type FormState } from "@/lib/form";
import { parseMoney } from "@/lib/format";
import { centsToDecimalString } from "@/lib/quote-math";

const schema = z.object({
  name: z.string().trim().min(3, "Informe o nome do serviço.").max(60, "Use no máximo 60 caracteres."),
  category: z.enum(ServiceCategory, { error: "Escolha a categoria." }),
  description: optionalText(200, "Use no máximo 200 caracteres."),
  price: z.string().transform((v, ctx) => {
    const cents = parseMoney(v);
    if (cents === null || cents === 0) {
      ctx.addIssue({ code: "custom", message: "Informe o preço, ex.: 150,00." });
      return z.NEVER;
    }
    return cents;
  }),
  durationMinutes: z.coerce
    .number({ error: "Informe a duração em minutos." })
    .int("Use minutos inteiros.")
    .min(15, "A duração mínima é de 15 minutos.")
    .max(600, "A duração máxima é de 10 horas.")
    .refine((n) => n % 15 === 0, "Use múltiplos de 15 minutos, como na agenda."),
  active: z.literal("on").optional(),
});

export async function saveService(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const values = formValues(formData);
  const parsed = schema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { price, active, ...rest } = parsed.data;
  const data = { ...rest, price: centsToDecimalString(price), active: active === "on" };

  try {
    if (id) await db.service.update({ where: { id }, data });
    else await db.service.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { values, fieldErrors: { name: "Já existe um serviço com este nome." } };
    }
    throw e;
  }
  redirect("/servicos");
}
