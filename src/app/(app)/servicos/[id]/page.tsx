import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/format";
import { saveService } from "../actions";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Editar serviço" };

// Serviços não são excluídos (estão em orçamentos e agendamentos antigos); desative para tirá-los das listas.
export default async function EditServicePage({ params }: PageProps<"/servicos/[id]">) {
  await requireUser();
  const s = await db.service.findUnique({ where: { id: (await params).id } });
  if (!s) notFound();
  return (
    <>
      <PageHeader title={s.name} description="Mudar o preço não altera orçamentos já criados." back={{ href: "/servicos", label: "Catálogo" }} />
      <ServiceForm
        action={saveService.bind(null, s.id)}
        defaults={{
          name: s.name,
          category: s.category,
          description: s.description ?? "",
          price: centsToInput(Math.round(Number(s.price) * 100)),
          durationMinutes: String(s.durationMinutes),
          active: s.active,
        }}
      />
    </>
  );
}
