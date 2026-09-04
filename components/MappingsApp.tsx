"use client";

import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, Plus, RotateCcw, Search, Settings2, Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import {
  blankMapping, DEFAULT_MAPPINGS, type MappingCategory, type MappingItem, type MappingStatus,
} from "@/lib/mappings";

const FILTERS = ["Todos", "Material", "Cliente", "Produto", "Operação"] as const;

export function MappingsApp() {
  const [mappings, setMappings] = useState<MappingItem[]>(DEFAULT_MAPPINGS);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMappings = mappings.filter((mapping) => {
    const matchesFilter = filter === "Todos" || mapping.category === filter;
    const matchesQuery = !normalizedQuery || Object.values(mapping).some((value) => String(value).toLowerCase().includes(normalizedQuery));
    return matchesFilter && matchesQuery;
  });

  const confirmed = mappings.filter((mapping) => mapping.status === "Confirmado").length;
  const provisional = mappings.length - confirmed;
  const inactive = mappings.filter((mapping) => !mapping.active).length;

  function updateMapping<K extends keyof MappingItem>(id: string, field: K, value: MappingItem[K]) {
    setMappings((current) => current.map((mapping) => mapping.id === id ? { ...mapping, [field]: value } : mapping));
  }

  function addMapping() {
    setMappings((current) => [...current, blankMapping()]);
    setFilter("Todos");
    setQuery("");
  }

  function removeMapping(id: string) {
    setMappings((current) => current.filter((mapping) => mapping.id !== id));
  }

  function resetMappings() {
    setMappings(DEFAULT_MAPPINGS.map((mapping) => ({ ...mapping })));
    setFilter("Todos");
    setQuery("");
  }

  return (
    <main className="app-shell">
      <AppHeader />
      <div className="content mapping-content">
        <div className="page-heading mapping-heading">
          <div>
            <p className="eyebrow">Configuração do protótipo</p>
            <h1>Mapeamentos para o Optima</h1>
            <p className="page-description">Equivalências aplicadas aos campos que não resultam diretamente dos documentos.</p>
          </div>
          <div className="heading-actions">
            <button className="button button-secondary" onClick={resetMappings}><RotateCcw size={16} />Repor valores</button>
            <button className="button button-primary" onClick={addMapping}><Plus size={16} />Adicionar mapeamento</button>
          </div>
        </div>

        <section className="mapping-summary" aria-label="Resumo dos mapeamentos">
          <div><span>Total</span><strong>{mappings.length}</strong></div>
          <div><span>Confirmados</span><strong className="mapping-success">{confirmed}</strong></div>
          <div><span>Provisórios</span><strong className="mapping-warning">{provisional}</strong></div>
          <div><span>Inativos</span><strong>{inactive}</strong></div>
        </section>

        <section className="mapping-panel">
          <div className="mapping-toolbar">
            <div className="mapping-toolbar-title"><Settings2 size={18} /><div><strong>Tabela de equivalências</strong><span>Alterações mantidas apenas nesta sessão.</span></div></div>
            <div className="mapping-toolbar-controls">
              <div className="mapping-filters" aria-label="Filtrar por categoria">
                {FILTERS.map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}
              </div>
              <label className="search-box mapping-search"><span className="sr-only">Pesquisar mapeamentos</span><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar" /></label>
            </div>
          </div>

          <div className="mapping-table-scroll">
            <table className="mapping-table">
              <thead><tr><th>Categoria</th><th>Contexto</th><th>Valor identificado</th><th>Campo Optima</th><th>Código Optima</th><th>Evidência</th><th>Estado</th><th className="mapping-active-column">Ativo</th><th className="action-cell" /></tr></thead>
              <tbody>
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className={!mapping.active ? "mapping-row-inactive" : ""}>
                    <td><select aria-label="Categoria" value={mapping.category} onChange={(event) => updateMapping(mapping.id, "category", event.target.value as MappingCategory)}><option>Material</option><option>Cliente</option><option>Produto</option><option>Operação</option></select></td>
                    <td><input aria-label="Contexto" value={mapping.context} onChange={(event) => updateMapping(mapping.id, "context", event.target.value)} /></td>
                    <td className="mapping-source"><input aria-label="Valor identificado" value={mapping.source} onChange={(event) => updateMapping(mapping.id, "source", event.target.value)} /></td>
                    <td><input aria-label="Campo Optima" value={mapping.target} onChange={(event) => updateMapping(mapping.id, "target", event.target.value)} /></td>
                    <td><input className="mapping-code" aria-label="Código Optima" value={mapping.output} onChange={(event) => updateMapping(mapping.id, "output", event.target.value)} /></td>
                    <td><input aria-label="Evidência" value={mapping.evidence} onChange={(event) => updateMapping(mapping.id, "evidence", event.target.value)} /></td>
                    <td><select className={`status-select ${mapping.status === "Confirmado" ? "confirmed" : "provisional"}`} aria-label="Estado" value={mapping.status} onChange={(event) => updateMapping(mapping.id, "status", event.target.value as MappingStatus)}><option>Confirmado</option><option>Provisório</option></select></td>
                    <td className="mapping-active-column"><label className="switch-control"><input type="checkbox" checked={mapping.active} onChange={(event) => updateMapping(mapping.id, "active", event.target.checked)} aria-label={`Ativar mapeamento ${mapping.target || mapping.id}`} /><span aria-hidden="true" /></label></td>
                    <td className="action-cell"><button className="icon-button subtle danger" onClick={() => removeMapping(mapping.id)} title="Eliminar mapeamento" aria-label="Eliminar mapeamento"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{filteredMappings.length} de {mappings.length} mapeamentos visíveis.</span><span>{inactive ? `${inactive} ${inactive === 1 ? "mapeamento inativo" : "mapeamentos inativos"}.` : "Todos os mapeamentos estão ativos."}</span></div>
        </section>

        <section className="mapping-rules" aria-labelledby="mapping-rules-title">
          <div className="mapping-rules-heading"><CheckCircle2 size={19} /><div><strong id="mapping-rules-title">Campos tratados sem mapeamento</strong><span>Regras determinísticas ou valores introduzidos durante a validação.</span></div></div>
          <div className="mapping-rules-list">
            <span><strong>SEP_1</strong> Medida central da composição: 14 → CX14 e 16 → CX16.</span>
            <span><strong>QTY, DIM_X, DIM_Y e Notes</strong> Extração direta do documento.</span>
            <span><strong>ID e ORDER</strong> Numeração sequencial e introdução manual.</span>
          </div>
          {provisional > 0 && <div className="mapping-caution"><AlertTriangle size={16} /><span>Os mapeamentos provisórios requerem validação da PGI antes de utilização operacional.</span></div>}
        </section>
      </div>
      <footer><span>Protótipo de demonstração · PGI</span><span>Os mapeamentos desta página não alteram o processamento nem são persistidos.</span></footer>
    </main>
  );
}
