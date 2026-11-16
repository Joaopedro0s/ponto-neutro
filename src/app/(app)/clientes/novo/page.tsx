import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createCustomer } from "../actions";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Novo cliente"
        description="Depois de salvar, você poderá cadastrar os veículos dele."
        back={{ href: "/clientes", label: "Clientes" }}
      />
      <CustomerForm action={createCustomer} cancelHref="/clientes" />
    </>
  );
}
