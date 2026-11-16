import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePlate } from "@/lib/format";
import { addDays, spDay } from "@/lib/schedule";
import { saveQuote } from "../actions";
import { loadQuoteOptions } from "../options";
import { QuoteForm } from "../quote-form";

export const metadata: Metadata = { title: "Novo orçamento" };

export default async function NewQuotePage({ searchParams }: PageProps<"/orcamentos/novo">) {
  await requireUser();
  const sp = await searchParams;
  // Atalho vindo do histórico do veículo: ?veiculo=PLACA já preenche cliente e veículo.
  const plate = typeof sp.veiculo === "string" ? normalizePlate(sp.veiculo) : null;
  const vehicle = plate ? await db.vehicle.findUnique({ where: { plate }, select: { id: true, customerId: true } }) : null;

  return (
    <>
      <PageHeader title="Novo orçamento" description="O orçamento nasce como rascunho. Envie ao cliente quando estiver pronto." back={{ href: "/orcamentos", label: "Orçamentos" }} />
      <QuoteForm
        action={saveQuote.bind(null, null)}
        options={await loadQuoteOptions()}
        cancelHref="/orcamentos"
        defaults={{
          customerId: vehicle?.customerId ?? "",
          vehicleId: vehicle?.id ?? "",
          discount: "",
          validUntil: addDays(spDay(new Date()), 15),
          notes: "",
          items: [],
        }}
      />
    </>
  );
}
