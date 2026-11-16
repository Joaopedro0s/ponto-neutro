import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { saveService } from "../actions";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NewServicePage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Novo serviço" back={{ href: "/servicos", label: "Catálogo" }} />
      <ServiceForm action={saveService.bind(null, null)} defaults={{ name: "", category: "", description: "", price: "", durationMinutes: "60", active: true }} />
    </>
  );
}
