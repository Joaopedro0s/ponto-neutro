import { formatQuoteNumber } from "@/lib/labels";
import { getQuoteByToken, renderQuotePdf } from "@/lib/quote-pdf";

// Link público do PDF (vai para o cliente pelo WhatsApp). Quem tem o link vê o orçamento; o token é um UUID aleatório.
export async function GET(_request: Request, ctx: RouteContext<"/compartilhar/orcamento/[token]">) {
  const quote = await getQuoteByToken((await ctx.params).token);
  if (!quote) return new Response("Orçamento não encontrado.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const pdf = await renderQuotePdf(quote);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${formatQuoteNumber(quote.number)}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
