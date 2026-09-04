export type SourceKind = "pdf" | "dwg";
export type Provider = "demo" | "openai" | "anthropic";
export type CellValue = string | number;

export type OptimaRow = {
  rowId: string;
  approved: boolean;
  confidence: number;
  provisionalFields: string[];
  cells: Record<string, CellValue>;
};

export type ProcessResponse = {
  mode: string;
  sourceKind: SourceKind;
  fileHash: string;
  rows: OptimaRow[];
  previewUrl?: string;
  warnings: string[];
};

export const REQUIRED_FIELDS = ["ID", "QTY", "PRODUCTO", "DIM_X", "DIM_Y"] as const;

export function isCompleteRow(row: OptimaRow) {
  return REQUIRED_FIELDS.every((field) => String(row.cells[field] ?? "").trim() !== "");
}

export function blankRow(index: number): OptimaRow {
  return {
    rowId: crypto.randomUUID(),
    approved: false,
    confidence: 0,
    provisionalFields: [],
    cells: {
      ID: index,
      QTY: "",
      MAT_1: "",
      SEP_1: "",
      MAT_2: "",
      PRODUCTO: "",
      DIM_X: "",
      DIM_Y: "",
      ORDER: "",
      CUSTOMER: "",
      Notes: "",
    },
  };
}
