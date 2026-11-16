import { test } from "node:test";
import assert from "node:assert/strict";
import { centsToDecimalString, quoteTotals } from "./quote-math";

test("soma itens e aplica desconto", () => {
  const totals = quoteTotals(
    [
      { quantity: 4, unitPriceCents: 5490 },
      { quantity: 1, unitPriceCents: 8000 },
    ],
    1000,
  );
  assert.deepEqual(totals, { subtotalCents: 29960, discountCents: 1000, totalCents: 28960 });
});

test("desconto maior que o subtotal zera o total, nunca fica negativo", () => {
  assert.equal(quoteTotals([{ quantity: 1, unitPriceCents: 500 }], 900).totalCents, 0);
  assert.equal(quoteTotals([{ quantity: 1, unitPriceCents: 500 }], -100).totalCents, 500);
});

test("converte centavos para o formato do banco", () => {
  assert.equal(centsToDecimalString(28960), "289.60");
});
