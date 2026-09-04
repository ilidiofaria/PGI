import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  classifySourceKind,
  DEMO_VAOS_PDF_SHA256,
  sha256,
} from "../lib/source-kind.ts";

test("o PDF convertido de DWG usa o cenário de vãos", async () => {
  const pdf = await readFile(path.join(process.cwd(), "fixtures", "dwg-converted.pdf"));
  const hash = sha256(pdf);

  assert.equal(hash, DEMO_VAOS_PDF_SHA256);
  assert.equal(classifySourceKind("pdf", hash), "dwg");
});

test("uma listagem PDF continua a usar o cenário de vidro", () => {
  assert.equal(classifySourceKind("pdf", "OUTRO_FICHEIRO"), "pdf");
});

test("um ficheiro DWG continua a usar o cenário de vãos", () => {
  assert.equal(classifySourceKind("dwg", "OUTRO_FICHEIRO"), "dwg");
});
