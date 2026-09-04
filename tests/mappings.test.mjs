import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_MAPPINGS } from "../lib/mappings.ts";

test("o protótipo disponibiliza os 12 mapeamentos dummy", () => {
  assert.equal(DEFAULT_MAPPINGS.length, 12);
  assert.equal(DEFAULT_MAPPINGS.filter((mapping) => mapping.status === "Confirmado").length, 3);
  assert.ok(DEFAULT_MAPPINGS.every((mapping) => mapping.active));
});

test("os mapeamentos incluem os códigos de materiais e operações esperados", () => {
  const pairs = new Set(DEFAULT_MAPPINGS.map((mapping) => `${mapping.target}:${mapping.output}`));
  for (const pair of [
    "MAT_1:8MC.CG1.0T", "MAT_1:6CLXTM70-33II", "MAT_2:44.2STD", "MAT_2:44.1STDIC",
    "CUSTOMER:01048", "CUSTOMER:01107", "PRODUCTO:VD", "Wor1_1:ARTD",
    "Wor1_2:TEMPERA", "Wor3_1:ARI", "Wor0_4:SRVINST",
  ]) assert.ok(pairs.has(pair), `Mapeamento em falta: ${pair}`);
});
