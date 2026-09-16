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
