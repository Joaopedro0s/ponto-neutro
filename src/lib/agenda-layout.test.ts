import { test } from "node:test";
import assert from "node:assert/strict";
import { assignLanes } from "./agenda-layout";

const lanesOf = (items: { start: number; end: number }[]) =>
  assignLanes(items.map((x, i) => ({ ...x, id: i }))).sort((a, b) => a.id - b.id).map((p) => [p.lane, p.lanes]);

test("sem sobreposição: cada bloco ocupa a coluna toda", () => {
  assert.deepEqual(lanesOf([{ start: 480, end: 540 }, { start: 540, end: 600 }]), [[0, 1], [0, 1]]);
});

test("sobrepostos vão para faixas lado a lado e a faixa livre é reaproveitada", () => {
  // A 8h-10h, B 9h-9h30, C 9h30-10h (C reaproveita a faixa de B), D 11h sozinho
  assert.deepEqual(
    lanesOf([{ start: 480, end: 600 }, { start: 540, end: 570 }, { start: 570, end: 600 }, { start: 660, end: 720 }]),
    [[0, 2], [1, 2], [1, 2], [0, 1]],
  );
});
