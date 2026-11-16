import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, FileDown, Pencil, Send, X } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, tdClass, thClass, trClass } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { company } from "@/lib/company";
import { db } from "@/lib/db";
import { formatBRL, formatDate, formatDateTime, whatsappLink } from "@/lib/format";
import { formatQuoteNumber, formatWorkOrderNumber, quoteItemKindLabel, quoteStatus, workOrderStatus } from "@/lib/labels";
import { approveQuote, deleteQuote, markQuoteSent, rejectQuote } from "../actions";
import { WhatsAppButton } from "./whatsapp-button";

export async function generateMetadata({ params }: PageProps<"/orcamentos/[id]">): Promise<Metadata> {
  const q = await db.quote.findUnique({ where: { id: (await params).id }, select: { number: true } });
  return { title: q ? formatQuoteNumber(q.number) : "Orçamento" };
}

const qty = (d: { toString(): string }) => Number(d.toString()).toString().replace(".", ",");

export default async function QuotePage({ params }: PageProps<"/orcamentos/[id]">) {
  await requireUser();
  const { id } = await params;
  const q = await db.quote.findUnique({
    where: { id },
    include: { customer: true, vehicle: true, items: { orderBy: { position: "asc" } }, workOrder: true },
  });
  if (!q) notFound();

  const number = formatQuoteNumber(q.number);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const pdfUrl = `/compartilhar/orcamento/${q.shareToken}`;
  const message = `Olá, ${q.customer.name.split(" ")[0]}! Segue o orçamento ${number} da ${company.name} para o veículo ${q.vehicle.plate}, no total de ${formatBRL(q.total)}. Detalhes em PDF: ${origin}${pdfUrl}`;
  const editable = q.status === "DRAFT" || q.status === "SENT";
  const discount = Number(q.discount);

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {number}
            <StatusBadge {...quoteStatus[q.status]} />
          </span>
        }
        description={
          <>
            <Link href={`/clientes/${q.customerId}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              {q.customer.name}
            </Link>{" "}
            ·{" "}
            <Link href={`/veiculos/${q.vehicle.plate}`} className="font-mono underline-offset-4 hover:underline">
              {q.vehicle.plate}
            </Link>{" "}
            · {q.vehicle.model} · criado em {formatDate(q.createdAt)}
          </>
        }
        back={{ href: "/orcamentos", label: "Orçamentos" }}
      />

      <div className="mb-6 flex flex-wrap items-start gap-2">
        {q.status === "DRAFT" && (
          <>
            <WhatsAppButton href={whatsappLink(q.customer.phone, message)} onSend={markQuoteSent.bind(null, id)} label="Enviar pelo WhatsApp" />
            <ActionButton action={markQuoteSent.bind(null, id)} label="Marcar como enviado" variant="outline" icon={<Send aria-hidden="true" />} />
          </>
        )}
        {q.status === "SENT" && (
          <>
            <ActionButton
              action={approveQuote.bind(null, id)}
              label="Aprovar e gerar OS"
              variant="default"
              icon={<Check aria-hidden="true" />}
              confirmMessage={`Aprovar ${number} e abrir a ordem de serviço?`}
            />
            <ActionButton
              action={rejectQuote.bind(null, id)}
              label="Recusar"
              variant="outline"
              icon={<X aria-hidden="true" />}
              confirmMessage={`Marcar ${number} como recusado?`}
            />
          </>
        )}
        {editable && (
          <Link href={`/orcamentos/${id}/editar`} className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Pencil aria-hidden="true" />
            Editar
          </Link>
        )}
        {q.status !== "DRAFT" && <WhatsAppButton href={whatsappLink(q.customer.phone, message)} label="Reenviar pelo WhatsApp" />}
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
          <FileDown aria-hidden="true" />
          PDF
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </div>

      {q.workOrder && (
        <p className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4 text-sm">
          Ordem de serviço{" "}
          <Link href={`/ordens/${q.workOrder.id}`} className="font-medium underline-offset-4 hover:underline">
            {formatWorkOrderNumber(q.workOrder.number)}
          </Link>{" "}
          aberta em{" "}
          {formatDateTime(q.workOrder.createdAt)}
          <StatusBadge {...workOrderStatus[q.workOrder.status]} />
        </p>
      )}

      <section aria-labelledby="itens" className="mb-6">
        <h2 id="itens" className="eyebrow mb-3">
          Itens
        </h2>
        {/* Celular: lista; telas maiores: tabela. */}
        <ul className="divide-y rounded-xl border bg-card sm:hidden">
          {q.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{i.description}</p>
                <p className="text-muted-foreground">
                  {quoteItemKindLabel[i.kind]} · {qty(i.quantity)} × {formatBRL(i.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums">{formatBRL(Number(i.quantity) * Number(i.unitPrice))}</p>
            </li>
          ))}
        </ul>
        <div className="hidden sm:block">
          <Table>
            <caption className="sr-only">Itens do orçamento</caption>
            <thead>
              <tr>
                <th scope="col" className={thClass}>Tipo</th>
                <th scope="col" className={thClass}>Descrição</th>
                <th scope="col" className={`${thClass} text-right`}>Qtd.</th>
                <th scope="col" className={`${thClass} text-right`}>Valor unit.</th>
                <th scope="col" className={`${thClass} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((i) => (
                <tr key={i.id} className={trClass}>
                  <td className={`${tdClass} text-muted-foreground`}>{quoteItemKindLabel[i.kind]}</td>
                  <td className={tdClass}>{i.description}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{qty(i.quantity)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{formatBRL(i.unitPrice)}</td>
                  <td className={`${tdClass} text-right font-medium tabular-nums`}>{formatBRL(Number(i.quantity) * Number(i.unitPrice))}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-3 text-sm">
          {q.notes && (
            <div>
              <h2 className="eyebrow mb-1">Observações para o cliente</h2>
              <p className="whitespace-pre-line text-muted-foreground">{q.notes}</p>
            </div>
          )}
          <ul className="text-muted-foreground">
            {q.validUntil && <li>Válido até {formatDate(q.validUntil)}</li>}
            {q.sentAt && <li>Enviado em {formatDateTime(q.sentAt)}</li>}
            {q.decidedAt && <li>{q.status === "APPROVED" ? "Aprovado" : "Recusado"} em {formatDateTime(q.decidedAt)}</li>}
          </ul>
        </div>
        <dl className="flex h-fit flex-col gap-2 rounded-xl border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatBRL(q.subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd className="tabular-nums">− {formatBRL(discount)}</dd>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between border-t pt-3">
            <dt className="eyebrow">Total</dt>
            <dd className="font-display text-3xl font-semibold text-primary tabular-nums">{formatBRL(q.total)}</dd>
          </div>
        </dl>
      </div>

      {q.status === "DRAFT" && (
        <section aria-labelledby="excluir" className="mt-10 max-w-xl border-t pt-6">
          <h2 id="excluir" className="eyebrow">
            Excluir rascunho
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">Só rascunhos podem ser excluídos. Orçamentos enviados ficam no histórico.</p>
          <ActionButton action={deleteQuote.bind(null, id)} label="Excluir rascunho" confirmMessage={`Excluir ${number}? Esta ação não pode ser desfeita.`} />
        </section>
      )}
    </>
  );
}
