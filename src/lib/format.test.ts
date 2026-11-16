import { test } from "node:test";
import assert from "node:assert/strict";
import { centsToInput, formatBRL, formatDate, formatDateTime, formatDuration, normalizePhone, normalizePlate, parseMoney } from "./format";

test("normaliza telefones digitados de qualquer jeito", () => {
  assert.equal(normalizePhone("00987654321"), "(00) 98765-4321");
  assert.equal(normalizePhone("(00) 3456-7890"), "(00) 3456-7890");
  assert.equal(normalizePhone("12345"), null);
});

test("aceita placa Mercosul e antiga, recusa o resto", () => {
  assert.equal(normalizePlate("abc-1d23"), "ABC1D23");
  assert.equal(normalizePlate("ABC 1234"), "ABC1234");
  assert.equal(normalizePlate("AB1C234"), null);
  assert.equal(normalizePlate("ABCD123"), null);
});

test("datas e moeda no padrão brasileiro, no fuso de São Paulo", () => {
  // 02:30 UTC ainda é o dia anterior em São Paulo
  assert.equal(formatDate(new Date("2026-11-16T02:30:00Z")), "15/11/2026");
  assert.equal(formatDateTime(new Date("2026-11-16T12:05:00Z")), "16/11/2026 às 09:05");
  assert.equal(formatBRL("1490.5").replace(/\s/g, " "), "R$ 1.490,50");
});

test("duração legível", () => {
  assert.deepEqual([45, 60, 90, 485].map(formatDuration), ["45 min", "1h", "1h30", "8h05"]);
});

test("lê valores em reais digitados de vários jeitos", () => {
  assert.equal(parseMoney("54,90"), 5490);
  assert.equal(parseMoney("1.490,50"), 149050);
  assert.equal(parseMoney("54.90"), 5490);
  assert.equal(parseMoney("1.490"), 149000);
  assert.equal(parseMoney("R$ 10"), 1000);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney("-5"), null);
  assert.equal(centsToInput(149050), "1490,50");
});
