import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("visible application content does not contain the former brand", () => {
  const files = [
    "components/AppHeader.tsx",
    "components/LoginView.tsx",
    "components/PrototypeApp.tsx",
    "components/MappingsApp.tsx",
    "components/HistoryApp.tsx",
    "app/layout.tsx",
    "lib/mappings.ts",
  ];

  for (const file of files) {
    assert.doesNotMatch(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), /\bpgi\b/i, file);
  }
  assert.equal(existsSync(new URL("../public/brand/pgi-logo.svg", import.meta.url)), false);
});

test("application copy uses the generic ERP designation", () => {
  const files = [
    "components/PrototypeApp.tsx",
    "components/MappingsApp.tsx",
    "components/HistoryApp.tsx",
    "app/layout.tsx",
    "app/api/process/route.ts",
    "lib/llm.ts",
    "README.md",
  ];

  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?:para o|no|Campo|C\u00f3digo|Prepara\u00e7\u00e3o|importa\u00e7\u00e3o) Optima/i, file);
    assert.match(source, /\bERP\b/, file);
  }
});

test("application copy omits the removed environment labels and API notice", () => {
  const files = [
    "components/AppHeader.tsx",
    "components/LoginView.tsx",
    "components/PrototypeApp.tsx",
    "components/MappingsApp.tsx",
    "components/HistoryApp.tsx",
    "app/layout.tsx",
    "app/api/process/route.ts",
    "lib/mappings.ts",
    "lib/import-history.ts",
    "README.md",
  ];

  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /prot[o\u00f3]tipo|demonstra[\u00e7c][\u00e3a]o|As chaves de API s\u00e3o utilizadas apenas/i, file);
  }
});
