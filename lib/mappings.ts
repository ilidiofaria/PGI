export type MappingCategory = "Material" | "Cliente" | "Produto" | "Operação";
export type MappingStatus = "Confirmado" | "Provisório";

export type MappingItem = {
  id: string;
  category: MappingCategory;
  context: string;
  source: string;
  target: string;
  output: string;
  evidence: string;
  status: MappingStatus;
  active: boolean;
};

export const DEFAULT_MAPPINGS: MappingItem[] = [
  { id: "map-001", category: "Material", context: "Listagem PDF", source: "VIDRIO 8/14/8 - primeiro vidro", target: "MAT_1", output: "8MC.CG1.0T", evidence: "Histórico do protótipo", status: "Provisório", active: true },
  { id: "map-002", category: "Material", context: "Listagem PDF", source: "VIDRIO 8/16/8 - primeiro vidro", target: "MAT_1", output: "8MC.CG1.0T", evidence: "Histórico do protótipo", status: "Provisório", active: true },
  { id: "map-003", category: "Material", context: "Listagem PDF", source: "Segundo vidro de 8 mm", target: "MAT_2", output: "44.2STD", evidence: "Não suportado pelo PDF", status: "Provisório", active: true },
  { id: "map-004", category: "Material", context: "Vãos exteriores", source: "Cool-lite Xtreme 70/33 II 6mm", target: "MAT_1", output: "6CLXTM70-33II", evidence: "Descrição explícita", status: "Confirmado", active: true },
  { id: "map-005", category: "Material", context: "Vãos exteriores", source: "44.1 Inc.", target: "MAT_2", output: "44.1STDIC", evidence: "Descrição explícita", status: "Confirmado", active: true },
  { id: "map-006", category: "Cliente", context: "Listagem PDF", source: "Engimov - Construções, S.A", target: "CUSTOMER", output: "01048", evidence: "Valor predefinido", status: "Provisório", active: true },
  { id: "map-007", category: "Cliente", context: "Vãos exteriores", source: "3.01 Vãos exteriores", target: "CUSTOMER", output: "01107", evidence: "Valor predefinido", status: "Provisório", active: true },
  { id: "map-008", category: "Produto", context: "Todos", source: "Composição com dois vidros", target: "PRODUCTO", output: "VD", evidence: "Regra de negócio", status: "Confirmado", active: true },
  { id: "map-009", category: "Operação", context: "Todos", source: "Valor predefinido", target: "Wor1_1", output: "ARTD", evidence: "Requer validação PGI", status: "Provisório", active: true },
  { id: "map-010", category: "Operação", context: "Todos", source: "Valor predefinido", target: "Wor1_2", output: "TEMPERA", evidence: "Requer validação PGI", status: "Provisório", active: true },
  { id: "map-011", category: "Operação", context: "Todos", source: "Valor predefinido", target: "Wor3_1", output: "ARI", evidence: "Requer validação PGI", status: "Provisório", active: true },
  { id: "map-012", category: "Operação", context: "Todos", source: "Valor predefinido", target: "Wor0_4", output: "SRVINST", evidence: "Requer validação PGI", status: "Provisório", active: true },
];

export function blankMapping(): MappingItem {
  return {
    id: `map-new-${crypto.randomUUID()}`,
    category: "Material",
    context: "Todos",
    source: "",
    target: "",
    output: "",
    evidence: "Definido pelo utilizador",
    status: "Provisório",
    active: true,
  };
}
