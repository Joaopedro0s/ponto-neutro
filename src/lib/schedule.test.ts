import { test } from "node:test";
import assert from "node:assert/strict";
import { atSp, businessHoursError, isValidDay, openDaysOfWeek, overlaps, spDay, spTime } from "./schedule";

const t = (day: string, time: string) => atSp(day, time);

test("sobreposição: encostar no fim do outro não é conflito", () => {
  assert.equal(overlaps(t("2026-11-16", "09:00"), t("2026-11-16", "10:00"), t("2026-11-16", "09:30"), t("2026-11-16", "11:00")), true);
  assert.equal(overlaps(t("2026-11-16", "09:00"), t("2026-11-16", "10:00"), t("2026-11-16", "10:00"), t("2026-11-16", "11:00")), false);
  assert.equal(overlaps(t("2026-11-16", "08:00"), t("2026-11-16", "12:00"), t("2026-11-16", "09:00"), t("2026-11-16", "10:00")), true);
});

test("expediente: domingo fechado, sábado até 13h, dias úteis 8h às 18h", () => {
  assert.match(businessHoursError(t("2026-11-15", "09:00"), t("2026-11-15", "10:00"))!, /não abre/);
  assert.equal(businessHoursError(t("2026-11-16", "08:00"), t("2026-11-16", "18:00")), null);
  assert.match(businessHoursError(t("2026-11-16", "07:30"), t("2026-11-16", "08:30"))!, /Fora do expediente/);
  assert.match(businessHoursError(t("2026-11-21", "12:00"), t("2026-11-21", "13:30"))!, /terminaria às 13:30/);
});

test("semana de expediente começa na segunda, mesmo vindo de um domingo", () => {
  assert.deepEqual(openDaysOfWeek("2026-11-15"), ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14"]);
  assert.equal(openDaysOfWeek("2026-11-18")[0], "2026-11-16");
});

test("datas e horas no fuso de São Paulo", () => {
  const d = new Date("2026-11-16T02:30:00Z");
  assert.equal(spDay(d), "2026-11-15");
  assert.equal(spTime(d), "23:30");
  assert.equal(isValidDay("2026-02-30"), false);
  assert.equal(isValidDay("2026-11-16"), true);
});
