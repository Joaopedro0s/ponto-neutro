// Contas do orçamento em centavos (inteiros) para não acumular erro de ponto flutuante.
export type QuoteLine = { quantity: number; unitPriceCents: number };

export function lineTotalCents({ quantity, unitPriceCents }: QuoteLine) {
  return Math.round(quantity * unitPriceCents);
}

export function quoteTotals(lines: QuoteLine[], discountCents: number) {
  const subtotalCents = lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
  // O desconto nunca deixa o total negativo.
  const appliedDiscount = Math.min(Math.max(discountCents, 0), subtotalCents);
  return { subtotalCents, discountCents: appliedDiscount, totalCents: subtotalCents - appliedDiscount };
}

export const centsToDecimalString = (cents: number) => (cents / 100).toFixed(2);
