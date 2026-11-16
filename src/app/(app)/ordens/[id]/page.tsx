import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { company } from "@/lib/company";
import { db } from "@/lib/db";
import { formatBRL, formatDateTime, whatsappLink } from "@/lib/format";
import { formatQuoteNumber, formatWorkOrderNumber, quoteItemKindLabel, specialtyLabel, workOrderNextAction, workOrderStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { advanceWorkOrder, assignProfessional } from "../actions";
import { ProfessionalForm } from "./professional-form";

export async function generateMetadata({ params }: PageProps<"/ordens/[id]">): Promise<Metadata> {
  const o = await db.workOrder.findUnique({ where: { id: (await params).id }, select: { number: true } });
  return { title: o ? formatWorkOrderNumber(o.number) : "Ordem de serviço" };
}

export default async function WorkOrderPage({ params }: PageProps<"/ordens/[id]">) {
  await requireUser();
  const { id } = await params;
  const [o, professionals] = await Promise.all([
    db.workOrder.findUnique({
      where: { id },
      include: { vehicle: true, quote: { include: { customer: true, items: { orderBy: { position: "asc" } } } } },
    }),
    db.professional.findMany({ where: { active: true, specialty: { not: "RECEPTION" } }, orderBy: { name: "asc" } }),
  ]);
  if (!o) notFound();

  const number = formatWorkOrderNumber(o.number);
  const customer = o.quote.customer;
  const next = workOrderNextAction[o.status];
  const steps = [
    { label: "OS aberta (orçamento aprovado)", at: o.createdAt },
    { label: "Serviço iniciado", at: o.startedAt },
    { label: "Pronto para retirada", at: o.readyAt },
    { label: "Entregue ao cliente", at: o.deliveredAt },
  ];
  const readyMessage = `Olá, ${customer.name.split(" ")[0]}! O veículo ${o.vehicle.plate} está pronto para retirada na ${company.name}. Atendemos ${company.hoursLabel.toLowerCase()}.`;

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {number}
            <StatusBadge {...workOrderStatus[o.status]} />
          </span>
        }
        description={
          <>
            <Link href={`/clientes/${customer.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              {customer.name}
            </Link>{" "}
            ·{" "}
            <Link href={`/veiculos/${o.vehicle.plate}`} className="font-mono underline-offset-4 hover:underline">
              {o.vehicle.plate}
            </Link>{" "}
            · {o.vehicle.model} ·{" "}
            <Link href={`/orcamentos/${o.quoteId}`} className="underline-offset-4 hover:underline">
              {formatQuoteNumber(o.quote.number)}
            </Link>
          </>
        }
        back={{ href: "/ordens", label: "Ordens de serviço" }}
      />

      <div className="mb-6 flex flex-wrap items-start gap-2">
        {next && <ActionButton action={advanceWorkOrder.bind(null, id, o.status)} label={next} variant="default" icon={<ArrowRight aria-hidden="true" />} />}
        {o.status === "READY" && (
          <a href={whatsappLink(customer.phone, readyMessage)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <MessageCircle aria-hidden="true" />
            Avisar o cliente pelo WhatsApp
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="servicos" className="flex flex-col gap-3">
          <h2 id="servicos" className="eyebrow">
            Serviços e peças
          </h2>
          <ul className="divide-y rounded-xl border bg-card">
            {o.quote.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 p-3 text-sm">
                <span>
                  {i.description}
                  <span className="text-muted-foreground">
                    {" "}
                    · {quoteItemKindLabel[i.kind]} · {Number(i.quantity).toString().replace(".", ",")}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatBRL(Number(i.quantity) * Number(i.unitPrice))}</span>
              </li>
            ))}
            <li className="flex justify-between p-3 text-sm font-semibold">
              <span>Total aprovado</span>
              <span className="tabular-nums">{formatBRL(o.quote.total)}</span>
            </li>
          </ul>
          {o.quote.notes && <p className="text-sm text-muted-foreground">Observações: {o.quote.notes}</p>}
        </section>

        <aside className="flex flex-col gap-6">
          <ProfessionalForm
            action={assignProfessional.bind(null, id)}
            current={o.professionalId ?? ""}
            professionals={professionals.map((p) => ({ id: p.id, label: `${p.name} · ${specialtyLabel[p.specialty]}` }))}
          />
          <section aria-labelledby="etapas">
            <h2 id="etapas" className="eyebrow mb-3">
              Etapas
            </h2>
            <ol className="flex flex-col gap-3 border-l pl-4">
              {steps.map((s) => (
                <li key={s.label} className="relative text-sm">
                  <span
                    className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background", s.at ? "bg-primary" : "bg-muted-foreground/30")}
                    aria-hidden="true"
                  />
                  <p className={cn(!s.at && "text-muted-foreground")}>{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.at ? formatDateTime(s.at) : "Pendente"}</p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
