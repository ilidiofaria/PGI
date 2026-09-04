import test from "node:test";
import assert from "node:assert/strict";
import {
  addImportHistory, IMPORT_HISTORY_STORAGE_KEY, parseImportHistory, readImportHistory, updateImportHistory,
} from "../lib/import-history.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

const importItem = {
  id: "IMP-TESTE",
  startedAt: "2026-09-04T10:00:00.000Z",
  updatedAt: "2026-09-04T10:00:00.000Z",
  user: "demo",
  fileName: "ficheiro.pdf",
  fileType: "PDF",
  fileSize: 1024,
  provider: "demo",
  model: "Demonstração",
  status: "A processar",
  rowCount: 0,
  approvedCount: 0,
  unitCount: 0,
  warnings: [],
};

test("o histórico inicia vazio e ignora conteúdo inválido", () => {
  assert.deepEqual(parseImportHistory(null), []);
  assert.deepEqual(parseImportHistory("conteúdo inválido"), []);
  assert.deepEqual(parseImportHistory('[{"id":"incompleto"}]'), []);
});

test("regista e atualiza uma importação real", () => {
  const storage = memoryStorage();
  assert.equal(addImportHistory(importItem, storage), true);
  assert.equal(updateImportHistory(importItem.id, { status: "Exportado", rowCount: 4 }, storage), true);
  const items = readImportHistory(storage);
  assert.equal(items.length, 1);
  assert.equal(items[0].status, "Exportado");
  assert.equal(items[0].rowCount, 4);
  assert.ok(storage.getItem(IMPORT_HISTORY_STORAGE_KEY));
});
