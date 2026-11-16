import { test } from "node:test";
import assert from "node:assert/strict";
import { initials, withColors } from "./professionals";

test("iniciais e cores estáveis por ordem alfabética", () => {
  assert.equal(initials("Rogério Antunes"), "RA");
  assert.equal(initials("Ana"), "A");
  const pros = withColors([{ id: "2", name: "Rogério" }, { id: "1", name: "Caíque" }]);
  assert.deepEqual(pros.map((p) => [p.id, p.color]), [["1", "var(--pro-1)"], ["2", "var(--pro-2)"]]);
});
