import type { Provider, SourceKind } from "@/lib/types";

export const IMPORT_HISTORY_STORAGE_KEY = "pgi_optima_import_history_v1";
export const IMPORT_HISTORY_LIMIT = 100;
const IMPORT_HISTORY_EVENT = "pgi-optima-import-history-change";

export type ImportHistoryStatus = "A processar" | "A validar" | "Validado" | "Exportado" | "Erro";

export type ImportHistoryItem = {
  id: string;
  startedAt: string;
  updatedAt: string;
  processedAt?: string;
  validatedAt?: string;
  exportedAt?: string;
  user: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash?: string;
  sourceKind?: SourceKind;
  provider: Provider;
  model: string;
  mode?: string;
  status: ImportHistoryStatus;
  rowCount: number;
  approvedCount: number;
  unitCount: number;
  warnings: string[];
  outputFileName?: string;
  errorMessage?: string;
};

type HistoryStorage = Pick<Storage, "getItem" | "setItem">;
const HISTORY_STATUSES: ImportHistoryStatus[] = ["A processar", "A validar", "Validado", "Exportado", "Erro"];
const HISTORY_PROVIDERS: Provider[] = ["demo", "openai", "anthropic"];

function isHistoryItem(value: unknown): value is ImportHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ImportHistoryItem>;
  return typeof item.id === "string"
    && typeof item.startedAt === "string"
    && typeof item.updatedAt === "string"
    && typeof item.user === "string"
    && typeof item.fileName === "string"
    && typeof item.fileType === "string"
    && typeof item.fileSize === "number"
    && HISTORY_PROVIDERS.includes(item.provider as Provider)
    && typeof item.model === "string"
    && HISTORY_STATUSES.includes(item.status as ImportHistoryStatus)
    && typeof item.rowCount === "number"
    && typeof item.approvedCount === "number"
    && typeof item.unitCount === "number"
    && Array.isArray(item.warnings)
    && item.warnings.every((warning) => typeof warning === "string");
}

export function parseImportHistory(value: string | null): ImportHistoryItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isHistoryItem).slice(0, IMPORT_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function readImportHistory(storage: HistoryStorage = window.localStorage) {
  return parseImportHistory(storage.getItem(IMPORT_HISTORY_STORAGE_KEY));
}

function writeImportHistory(items: ImportHistoryItem[], storage: HistoryStorage) {
  storage.setItem(IMPORT_HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, IMPORT_HISTORY_LIMIT)));
  if (typeof window !== "undefined" && storage === window.localStorage) {
    window.dispatchEvent(new Event(IMPORT_HISTORY_EVENT));
  }
}

export function getImportHistorySnapshot() {
  try {
    return window.localStorage.getItem(IMPORT_HISTORY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function getImportHistoryServerSnapshot() {
  return "";
}

export function subscribeImportHistory(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === IMPORT_HISTORY_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(IMPORT_HISTORY_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(IMPORT_HISTORY_EVENT, listener);
  };
}

export function createImportHistoryItem(file: File, provider: Provider, model: string): ImportHistoryItem {
  const now = new Date().toISOString();
  const datePart = now.slice(0, 10).replaceAll("-", "");
  const timePart = now.slice(11, 19).replaceAll(":", "");
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return {
    id: `IMP-${datePart}-${timePart}-${suffix}`,
    startedAt: now,
    updatedAt: now,
    user: "demo",
    fileName: file.name,
    fileType: file.name.split(".").pop()?.toUpperCase() || "FICHEIRO",
    fileSize: file.size,
    provider,
    model: provider === "demo" ? "Demonstração" : model,
    status: "A processar",
    rowCount: 0,
    approvedCount: 0,
    unitCount: 0,
    warnings: [],
  };
}

export function addImportHistory(item: ImportHistoryItem, storage: HistoryStorage = window.localStorage) {
  try {
    writeImportHistory([item, ...readImportHistory(storage).filter((current) => current.id !== item.id)], storage);
    return true;
  } catch {
    return false;
  }
}

export function updateImportHistory(id: string, patch: Partial<ImportHistoryItem>, storage: HistoryStorage = window.localStorage) {
  try {
    const items = readImportHistory(storage);
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    items[index] = { ...items[index], ...patch };
    writeImportHistory(items, storage);
    return true;
  } catch {
    return false;
  }
}
