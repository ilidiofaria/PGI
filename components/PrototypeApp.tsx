"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle, Check, CheckCircle2, Download, Eye, FileSpreadsheet,
  FileUp, KeyRound, LoaderCircle, LogOut, Plus, Search, ShieldCheck, Sparkles,
  Trash2, UploadCloud, X,
} from "lucide-react";
import { blankRow, isCompleteRow, type OptimaRow, type ProcessResponse, type Provider, type SourceKind } from "@/lib/types";

const MODELS: Record<Provider, string> = {
  demo: "",
  openai: "gpt-5.6",
  anthropic: "claude-sonnet-4-6",
};

const EDITABLE_COLUMNS = [
  ["ID", "ID", "col-xs"], ["QTY", "Qtd.", "col-xs"], ["MAT_1", "Material 1", "col-lg"],
  ["SEP_1", "Separador", "col-md"], ["MAT_2", "Material 2", "col-lg"], ["PRODUCTO", "Produto", "col-md"],
  ["DIM_X", "Largura", "col-md"], ["DIM_Y", "Altura", "col-md"], ["ORDER", "Ordem", "col-lg"],
  ["CUSTOMER", "Cliente", "col-md"], ["Notes", "Referência / notas", "col-xl"],
] as const;

export function PrototypeApp() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<Provider>("demo");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [rows, setRows] = useState<OptimaRow[]>([]);
  const [sourceKind, setSourceKind] = useState<SourceKind>("pdf");
  const [mode, setMode] = useState("");
  const [remotePreview, setRemotePreview] = useState<string | undefined>();
  const [localPreview, setLocalPreview] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState("");
  const [order, setOrder] = useState("");

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => Object.values(row.cells).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [query, rows]);

  const units = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.cells.QTY) || 0), 0), [rows]);
  const area = useMemo(() => rows.reduce((sum, row) => {
    const quantity = Number(row.cells.QTY) || 0;
    const width = Number(row.cells.DIM_X) || 0;
    const height = Number(row.cells.DIM_Y) || 0;
    return sum + quantity * width * height / 1_000_000;
  }, 0), [rows]);
  const approved = rows.filter((row) => row.approved).length;
  const incomplete = rows.filter((row) => !isCompleteRow(row)).length;
  const readyToExport = rows.length > 0 && approved === rows.length && incomplete === 0;
  const previewUrl = remotePreview || localPreview;

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "dwg") {
      setError("Selecione um ficheiro PDF ou DWG.");
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setFile(nextFile);
    setRows([]);
    setMode("");
    setWarnings([]);
    setRemotePreview(undefined);
    setLocalPreview(extension === "pdf" ? URL.createObjectURL(nextFile) : undefined);
    setError("");
  }

  async function processFile() {
    if (!file) {
      setError("Selecione primeiro o ficheiro a processar.");
      return;
    }
    if (provider !== "demo" && (!apiKey.trim() || !model.trim())) {
      setError("Indique o modelo e a chave de API.");
      return;
    }

    setLoading(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("provider", provider);
    form.set("model", model);
    form.set("apiKey", apiKey);

    try {
      const response = await fetch("/api/process", { method: "POST", body: form });
      const data = await response.json() as ProcessResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível processar o ficheiro.");
      setRows(data.rows);
      setSourceKind(data.sourceKind);
      setMode(data.mode);
      setWarnings(data.warnings || []);
      setRemotePreview(data.previewUrl);
      setCustomer(String(data.rows[0]?.cells.CUSTOMER || ""));
      setOrder(String(data.rows[0]?.cells.ORDER || ""));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível processar o ficheiro.");
    } finally {
      setLoading(false);
    }
  }

  function updateCell(rowId: string, field: string, value: string) {
    setRows((current) => current.map((row) => row.rowId === rowId
      ? { ...row, approved: false, cells: { ...row.cells, [field]: value } }
      : row));
  }

  function toggleApproval(rowId: string) {
    setRows((current) => current.map((row) => row.rowId === rowId && isCompleteRow(row)
      ? { ...row, approved: !row.approved }
      : row));
  }

  function approveAll() {
    setRows((current) => current.map((row) => ({ ...row, approved: isCompleteRow(row) })));
  }

  function addBlankRow() {
    setRows((current) => [...current, blankRow(current.length + 1)]);
  }

  function removeRow(rowId: string) {
    setRows((current) => current.filter((row) => row.rowId !== rowId));
  }

  function applyParameters() {
    setRows((current) => current.map((row) => ({
      ...row,
      approved: false,
      cells: { ...row.cells, CUSTOMER: customer, ORDER: order },
    })));
  }

  async function exportExcel() {
    setExporting(true);
    setError("");
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, sourceKind }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível gerar o Excel.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "IMPORT_EXCEL.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o Excel.");
    } finally {
      setExporting(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Image src="/brand/pgi-logo.svg" alt="PGI Peões Glass Industry" width={43} height={43} priority />
        </div>
        <div className="topbar-actions">
          <span className="environment"><span />Demonstração</span>
          <button className="icon-button" onClick={logout} title="Terminar sessão" aria-label="Terminar sessão"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="content">
        <div className="page-heading">
          <div><p className="eyebrow">Conversão assistida</p><h1>Preparar ficheiro para o Optima</h1></div>
          <div className="stepper" aria-label="Etapas do processo">
            {["Carregamento", "Processamento", "Validação", "Exportação"].map((step, index) => {
              const active = rows.length ? (readyToExport ? 3 : 2) : loading ? 1 : 0;
              return <div className={`step ${index <= active ? "step-active" : ""}`} key={step}><span>{index < active ? <Check size={13} /> : index + 1}</span>{step}</div>;
            })}
          </div>
        </div>

        <section className="setup-grid">
          <div className="section-block">
            <div className="section-title"><span>1</span><div><h2>Carregamento de ficheiro</h2><p>PDF de listagem técnica ou DWG de referência.</p></div></div>
            <div
              className={`dropzone ${dragging ? "dropzone-active" : ""} ${file ? "dropzone-filled" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
              onClick={() => fileInput.current?.click()}
              role="button" tabIndex={0}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }}
            >
              <input ref={fileInput} type="file" accept=".pdf,.dwg,application/pdf" hidden onChange={(event) => selectFile(event.target.files?.[0])} />
              {file ? <>
                <span className="file-icon"><FileUp size={23} /></span>
                <div className="file-copy"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.toLowerCase().endsWith(".dwg") ? "DWG" : "PDF"}</span></div>
                <button className="icon-button subtle" aria-label="Remover ficheiro" title="Remover ficheiro" onClick={(event) => { event.stopPropagation(); setFile(null); setRows([]); }}><X size={18} /></button>
              </> : <>
                <span className="upload-icon"><UploadCloud size={25} /></span>
                <div><strong>Selecione ou arraste o ficheiro</strong><span>Formatos PDF e DWG · máximo 4,4 MB.</span></div>
              </>}
            </div>
          </div>

          <div className="section-block">
            <div className="section-title"><span>2</span><div><h2>Motor de processamento</h2><p>Escolha o modo a utilizar nesta execução.</p></div></div>
            <div className="provider-tabs">
              {(["demo", "openai", "anthropic"] as Provider[]).map((option) => (
                <button key={option} className={provider === option ? "selected" : ""} onClick={() => { setProvider(option); setModel(MODELS[option]); }}>
                  {option === "demo" ? "Demonstração" : option === "openai" ? "OpenAI" : "Anthropic"}
                </button>
              ))}
            </div>
            {provider === "demo" ? (
              <div className="info-line"><ShieldCheck size={18} /><div><strong>Dados de referência validados</strong><span>Utiliza o output esperado dos ficheiros fornecidos, sem consumo de API.</span></div></div>
            ) : (
              <div className="credentials-row">
                <label>Modelo<input value={model} onChange={(event) => setModel(event.target.value)} /></label>
                <label>Chave de API<div className="input-with-icon"><KeyRound size={16} /><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Introduzir apenas para esta execução" /></div></label>
              </div>
            )}
            <button className="button button-primary process-button" onClick={processFile} disabled={loading || !file}>
              {loading ? <><LoaderCircle className="spin" size={18} />A analisar o documento...</> : <><Sparkles size={18} />Processar ficheiro</>}
            </button>
          </div>
        </section>

        {error && <div className="alert alert-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}

        {rows.length > 0 && <>
          <section className="summary-strip">
            <div><span>Modo</span><strong>{mode}</strong></div>
            <div><span>Linhas</span><strong>{rows.length}</strong></div>
            <div><span>Unidades</span><strong>{units}</strong></div>
            <div><span>Área estimada</span><strong>{area.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} m²</strong></div>
            <div><span>Validadas</span><strong className={approved === rows.length ? "text-success" : ""}>{approved}/{rows.length}</strong></div>
          </section>

          {warnings.map((warning) => <div className="alert alert-warning" key={warning}><AlertCircle size={18} /><span>{warning}</span></div>)}

          <section className="parameters-bar">
            <div><p className="eyebrow">Parâmetros transversais</p><strong>Aplicar a todas as linhas</strong></div>
            <label>Cliente<input value={customer} onChange={(event) => setCustomer(event.target.value)} /></label>
            <label>Ordem<input value={order} onChange={(event) => setOrder(event.target.value)} placeholder="Opcional" /></label>
            <button className="button button-secondary" onClick={applyParameters}>Aplicar</button>
          </section>

          <section className="review-workspace">
            <div className="document-panel">
              <div className="panel-header"><div><Eye size={18} /><strong>Documento original</strong></div><span>{sourceKind.toUpperCase()}</span></div>
              {previewUrl ? <iframe src={previewUrl} title="Pré-visualização do documento" /> : <div className="preview-empty"><FileUp size={30} /><p>A pré-visualização do DWG fica disponível após a conversão para PDF.</p></div>}
            </div>

            <div className="table-panel">
              <div className="panel-header table-toolbar">
                <div><FileSpreadsheet size={18} /><strong>Dados para o Optima</strong></div>
                <div className="toolbar-actions">
                  <label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar" /></label>
                  <button className="button button-quiet" onClick={addBlankRow}><Plus size={16} />Adicionar linha</button>
                  <button className="button button-secondary" onClick={approveAll}><CheckCircle2 size={16} />Validar completas</button>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th className="status-cell">Validar</th>{EDITABLE_COLUMNS.map(([, label, className]) => <th className={className} key={label}>{label}</th>)}<th className="action-cell" /></tr></thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const complete = isCompleteRow(row);
                      return <tr key={row.rowId} className={`${row.approved ? "row-approved" : ""} ${!complete ? "row-incomplete" : ""}`}>
                        <td className="status-cell"><button className={`approval ${row.approved ? "approval-on" : ""}`} onClick={() => toggleApproval(row.rowId)} disabled={!complete} title={complete ? "Validar linha" : "Preencher campos obrigatórios"} aria-label="Validar linha">{row.approved && <Check size={13} />}</button></td>
                        {EDITABLE_COLUMNS.map(([field, label, className]) => <td className={className} key={field}><input aria-label={label} value={String(row.cells[field] ?? "")} onChange={(event) => updateCell(row.rowId, field, event.target.value)} /></td>)}
                        <td className="action-cell"><button className="icon-button subtle danger" onClick={() => removeRow(row.rowId)} title="Eliminar linha" aria-label="Eliminar linha"><Trash2 size={16} /></button></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>{filteredRows.length} de {rows.length} linhas visíveis.</span><span>{incomplete > 0 ? `${incomplete} linhas incompletas.` : "Campos obrigatórios completos."}</span></div>
            </div>
          </section>

          <section className="export-bar">
            <div><span className={readyToExport ? "export-icon ready" : "export-icon"}><FileSpreadsheet size={22} /></span><div><strong>IMPORT_EXCEL.xlsx</strong><span>{readyToExport ? "Ficheiro pronto para gerar." : "Valide todas as linhas antes de exportar."}</span></div></div>
            <button className="button button-primary" disabled={!readyToExport || exporting} onClick={exportExcel}>
              {exporting ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}{exporting ? "A gerar..." : "Exportar para o Optima"}
            </button>
          </section>
        </>}
      </div>
      <footer><span>Protótipo de demonstração · PGI</span><span>As chaves de API são utilizadas apenas durante o pedido e não são armazenadas.</span></footer>
    </main>
  );
}
