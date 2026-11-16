"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form";
import type { WorkOrderStatus } from "@/generated/prisma/enums";

// Cada etapa só avança para a seguinte e grava o horário da mudança.
const NEXT: Partial<Record<WorkOrderStatus, { status: WorkOrderStatus; stamp: "startedAt" | "readyAt" | "deliveredAt" }>> = {
  WAITING: { status: "IN_PROGRESS", stamp: "startedAt" },
  IN_PROGRESS: { status: "READY", stamp: "readyAt" },
  READY: { status: "DELIVERED", stamp: "deliveredAt" },
};

export async function advanceWorkOrder(id: string, from: WorkOrderStatus): Promise<FormState> {
  await requireUser();
  const next = NEXT[from];
  if (!next) return { error: "Esta ordem de serviço já foi entregue." };
  // `status: from` na condição evita avançar duas vezes com cliques repetidos ou abas desatualizadas.
  const { count } = await db.workOrder.updateMany({ where: { id, status: from }, data: { status: next.status, [next.stamp]: new Date() } });
  if (count === 0) return { error: "A etapa mudou em outra tela. Atualize a página." };
  revalidatePath("/ordens");
  revalidatePath(`/ordens/${id}`);
  return {};
}

export async function assignProfessional(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const professionalId = String(formData.get("professionalId") ?? "");
  if (professionalId) {
    const pro = await db.professional.findUnique({ where: { id: professionalId } });
    if (!pro || !pro.active || pro.specialty === "RECEPTION") return { error: "Escolha um profissional que execute serviços." };
  }
  await db.workOrder.update({ where: { id }, data: { professionalId: professionalId || null } });
  revalidatePath(`/ordens/${id}`);
  return {};
}
