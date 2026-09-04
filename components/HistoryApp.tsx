"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertCircle, CheckCircle2, ExternalLink, FileClock, FileSpreadsheet, Search, X,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import {
  getImportHistoryServerSnapshot, getImportHistorySnapshot, parseImportHistory, subscribeImportHistory,
  type ImportHistoryItem, type ImportHistoryStatus,
} from "@/lib/import-history";

const FILTERS = ["Todos", "A processar", "A validar", "Validado", "Exportado", "Erro"] as const;

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSize(bytes: number) {
  return bytes < 1_000_000 ? `${(bytes / 1_000).toFixed(0)} KB` : `${(bytes / 1_000_000).toFixed(2)} MB`;
}

function providerLabel(item: ImportHistoryItem) {
  if (item.provider === "demo") return "Demonstração";
  return `${item.provider === "openai" ? "OpenAI" : "Anthropic"} · ${item.model}`;
}

function statusClass(status: ImportHistoryStatus) {
  if (status === "Exportado" || status === "Validado") return "history-status-success";
  if (status === "Erro") return "history-status-error";
  if (status === "A processar") return "history-status-progress";
  return "history-status-warning";
}

export function HistoryApp() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const historySnapshot = useSyncExternalStore(
    subscribeImportHistory,
    getImportHistorySnapshot,
    getImportHistoryServerSnapshot,
  );
  const items = useMemo(() => parseImportHistory(historySnapshot), [historySnapshot]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === "Todos" || item.status === filter;
    const matchesQuery = !normalizedQuery || [item.id, item.fileName, item.user, item.model, item.mode]
      .some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    return matchesFilter && matchesQuery;
  });
  const selected = items.find((item) => item.id === selectedId);
  const exported = items.filter((item) => item.status === "Exportado").length;
  const pending = items.filter((item) => ["A processar", "A validar", "Validado"].includes(item.status)).length;
  const errors = items.filter((item) => item.status === "Erro").length;

  return (
    <main className="app-shell">
      <AppHeader />
      <div className="content history-content">
        <div className="page-heading history-heading">
          <div>
            <p className="eyebrow">Rastreabilidade do protótipo</p>
            <h1>Histórico de importações</h1>
            <p className="page-description">Registo das operações realizadas neste navegador, sem dados de demonstração.</p>
          </div>
          <Link className="button button-primary" href="/"><FileSpreadsheet size={16} />Nova importação</Link>
        </div>

        <section className="mapping-summary" aria-label="Resumo das importações">
          <div><span>Total</span><strong>{items.length}</strong></div>
          <div><span>Exportadas</span><strong className="mapping-success">{exported}</strong></div>
          <div><span>Pendentes</span><strong className="mapping-warning">{pending}</strong></div>
          <div><span>Com erro</span><strong className={errors ? "history-error-value" : ""}>{errors}</strong></div>
        </section>

        <section className="history-panel">
          <div className="mapping-toolbar">
            <div className="mapping-toolbar-title"><FileClock size={18} /><div><strong>Importações registadas</strong><span>As operações mais recentes surgem em primeiro lugar.</span></div></div>
            <div className="mapping-toolbar-controls">
              <div className="mapping-filters history-filters" aria-label="Filtrar por estado">
                {FILTERS.map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}
              </div>
              <label className="search-box mapping-search"><span className="sr-only">Pesquisar importações</span><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar" /></label>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="history-empty">
              <span><FileClock size={28} /></span>
              <h2>Ainda não existem importações</h2>
              <p>Os ficheiros efetivamente processados neste navegador ficarão registados nesta página.</p>
              <Link className="button button-secondary" href="/">Iniciar primeira importação</Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="history-empty compact"><Search size={24} /><h2>Sem resultados</h2><p>Ajuste os filtros ou o termo de pesquisa.</p></div>
          ) : (
            <div className="history-table-scroll">
              <table className="history-table">
                <thead><tr><th>Data e hora</th><th>ID</th><th>Ficheiro</th><th>Origem</th><th>Motor</th><th>Linhas</th><th>Alertas</th><th>Estado</th><th className="action-cell" /></tr></thead>
                <tbody>{filteredItems.map((item) => <tr key={item.id}>
                  <td>{formatDate(item.startedAt)}</td>
                  <td><span className="history-id">{item.id}</span></td>
                  <td><div className="history-file"><strong title={item.fileName}>{item.fileName}</strong><span>{item.fileType} · {formatSize(item.fileSize)}</span></div></td>
                  <td>{item.sourceKind === "dwg" ? "Vãos exteriores" : item.sourceKind === "pdf" ? "Listagem PDF" : "Por identificar"}</td>
                  <td>{providerLabel(item)}</td>
                  <td>{item.rowCount}</td>
                  <td>{item.warnings.length}</td>
                  <td><span className={`history-status ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td className="action-cell"><button className="icon-button subtle" onClick={() => setSelectedId(item.id)} title="Consultar detalhe" aria-label={`Consultar detalhe da importação ${item.id}`}><ExternalLink size={16} /></button></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          {items.length > 0 && <div className="table-footer"><span>{filteredItems.length} de {items.length} importações visíveis.</span><span>Histórico local deste navegador.</span></div>}
        </section>

        {selected && <section className="history-detail" aria-labelledby="history-detail-title">
          <div className="history-detail-header"><div><p className="eyebrow">Detalhe da importação</p><h2 id="history-detail-title">{selected.id}</h2></div><button className="icon-button subtle" onClick={() => setSelectedId(null)} title="Fechar detalhe" aria-label="Fechar detalhe"><X size={18} /></button></div>
          <div className="history-detail-grid">
            <div><span>Ficheiro</span><strong>{selected.fileName}</strong></div>
            <div><span>Utilizador</span><strong>{selected.user}</strong></div>
            <div><span>Motor</span><strong>{providerLabel(selected)}</strong></div>
            <div><span>Estado</span><strong className={`history-status ${statusClass(selected.status)}`}>{selected.status}</strong></div>
            <div><span>Início</span><strong>{formatDate(selected.startedAt)}</strong></div>
            <div><span>Processamento</span><strong>{formatDate(selected.processedAt)}</strong></div>
            <div><span>Validação</span><strong>{formatDate(selected.validatedAt)}</strong></div>
            <div><span>Exportação</span><strong>{formatDate(selected.exportedAt)}</strong></div>
            <div><span>Linhas validadas</span><strong>{selected.approvedCount}/{selected.rowCount}</strong></div>
            <div><span>Unidades</span><strong>{selected.unitCount}</strong></div>
            <div><span>Output</span><strong>{selected.outputFileName || "-"}</strong></div>
            <div className="history-hash"><span>SHA-256 do original</span><strong>{selected.fileHash || "Não disponível"}</strong></div>
          </div>
          {selected.warnings.length > 0 && <div className="history-detail-message warning"><AlertCircle size={17} /><span>{selected.warnings.join(" ")}</span></div>}
          {selected.errorMessage && <div className="history-detail-message error"><AlertCircle size={17} /><span>{selected.errorMessage}</span></div>}
          {selected.status === "Exportado" && <div className="history-detail-message success"><CheckCircle2 size={17} /><span>Ficheiro preparado e exportado para utilização no Optima.</span></div>}
        </section>}
      </div>
      <footer><span>Protótipo de demonstração · PGI</span><span>O histórico permanece apenas neste navegador e não inclui chaves de API.</span></footer>
    </main>
  );
}
