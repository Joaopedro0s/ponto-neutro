import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/format";
import { formatQuoteNumber } from "@/lib/labels";
import { spDay } from "@/lib/schedule";
import { saveQuote } from "../../actions";
import { loadQuoteOptions } from "../../options";
import { QuoteForm } from "../../quote-form";

export const metadata: Metadata = { title: "Editar orçamento" };

const toCents = (d: { toString(): string }) => Math.round(Number(d.toString()) * 100);

export default async function EditQuotePage({ params }: PageProps<"/orcamentos/[id]/editar">) {
  await requireUser();
  const { id } = await params;
  const quote = await db.quote.findUnique({ where: { id }, include: { items: { orderBy: { position: "asc" } } } });
  if (!quote) notFound();
  if (quote.status !== "DRAFT" && quote.status !== "SENT") redirect(`/orcamentos/${id}`);

  return (
    <>
      <PageHeader title={`Editar ${formatQuoteNumber(quote.number)}`} back={{ href: `/orcamentos/${id}`, label: formatQuoteNumber(quote.number) }} />
      <QuoteForm
        action={saveQuote.bind(null, id)}
        options={await loadQuoteOptions()}
        cancelHref={`/orcamentos/${id}`}
        defaults={{
          customerId: quote.customerId,
          vehicleId: quote.vehicleId,
          discount: toCents(quote.discount) ? centsToInput(toCents(quote.discount)) : "",
          validUntil: quote.validUntil ? spDay(quote.validUntil) : "",
          notes: quote.notes ?? "",
          items: quote.items.map((i) => ({
            key: i.id,
            kind: i.kind,
            description: i.description,
            quantity: Number(i.quantity).toString().replace(".", ","),
            unitPrice: centsToInput(toCents(i.unitPrice)),
            serviceId: i.serviceId,
          })),
        }}
      />
    </>
  );
}
