import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteCustomer, updateCustomer } from "../../actions";
import { CustomerForm } from "../../customer-form";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditCustomerPage({ params }: PageProps<"/clientes/[id]/editar">) {
  await requireUser();
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <>
      <PageHeader title="Editar cliente" back={{ href: `/clientes/${id}`, label: customer.name }} />
      <CustomerForm action={updateCustomer.bind(null, id)} customer={customer} cancelHref={`/clientes/${id}`} />

      <section aria-labelledby="excluir" className="mt-10 max-w-xl border-t pt-6">
        <h2 id="excluir" className="font-medium">
          Excluir cliente
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Só é possível excluir clientes sem agendamentos ou orçamentos. Os veículos dele também serão removidos.
        </p>
        <ActionButton
          action={deleteCustomer.bind(null, id)}
          label="Excluir cliente"
          confirmMessage={`Excluir ${customer.name} e seus veículos? Esta ação não pode ser desfeita.`}
        />
      </section>
    </>
  );
}
