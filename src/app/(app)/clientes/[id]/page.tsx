import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Pencil, Phone } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, whatsappLink } from "@/lib/format";
import { createVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";

export async function generateMetadata({ params }: PageProps<"/clientes/[id]">): Promise<Metadata> {
  const customer = await db.customer.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: customer?.name ?? "Cliente" };
}

export default async function CustomerPage({ params }: PageProps<"/clientes/[id]">) {
  await requireUser();
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { createdAt: "asc" },
        include: {
          appointments: { where: { status: "COMPLETED" }, orderBy: { startsAt: "desc" }, take: 1, select: { startsAt: true } },
          _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
        },
      },
    },
  });
  if (!customer) notFound();

  const firstName = customer.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`Cliente desde ${formatDate(customer.createdAt)}`}
        back={{ href: "/clientes", label: "Clientes" }}
      >
        <Link href={`/clientes/${id}/editar`} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Pencil aria-hidden="true" />
          Editar
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section aria-labelledby="contato" className="h-fit rounded-xl border bg-card p-5">
          <h2 id="contato" className="mb-3 font-medium">
            Contato
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <a href={`tel:+55${customer.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 rounded hover:underline">
                <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                {customer.phone}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink(customer.phone, `Olá, ${firstName}!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded hover:underline"
              >
                <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
                Conversar pelo WhatsApp
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
            {customer.email && (
              <li>
                <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-2 rounded break-all hover:underline">
                  <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {customer.email}
                </a>
              </li>
            )}
          </ul>
          {customer.notes && (
            <>
              <h3 className="mt-5 mb-1 text-sm font-medium">Observações</h3>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{customer.notes}</p>
            </>
          )}
        </section>

        <section aria-labelledby="veiculos" className="flex flex-col gap-4">
          <h2 id="veiculos" className="font-medium">
            Veículos
          </h2>
          {customer.vehicles.length === 0 ? (
            <EmptyState title="Nenhum veículo cadastrado" description="Cadastre o veículo abaixo para agendar serviços e montar orçamentos." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {customer.vehicles.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/veiculos/${v.plate}`}
                    className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="font-mono text-sm font-medium tracking-wider">{v.plate}</span>
                    <span className="text-sm">
                      {v.model}
                      {v.year && ` · ${v.year}`}
                      {v.color && ` · ${v.color}`}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {v._count.appointments > 0
                        ? `${v._count.appointments} atendimento${v._count.appointments === 1 ? "" : "s"} · último em ${formatDate(v.appointments[0].startsAt)}`
                        : "Sem atendimentos ainda"}
                    </span>
                    <span className="mt-2 text-sm font-medium text-primary">Ver histórico</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border p-5">
            <h3 className="mb-4 font-medium">Cadastrar veículo</h3>
            <VehicleForm action={createVehicle.bind(null, id)} submitLabel="Adicionar veículo" />
          </div>
        </section>
      </div>
    </>
  );
}
