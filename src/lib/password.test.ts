import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password";

test("aceita a senha certa e recusa a errada", async () => {
  const stored = await hashPassword("demo1234");
  assert.equal(await verifyPassword("demo1234", stored), true);
  assert.equal(await verifyPassword("demo12345", stored), false);
  assert.equal(await verifyPassword("demo1234", "formato-invalido"), false);
});
