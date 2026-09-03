import ExcelJS from "exceljs";
import path from "node:path";
import type { CellValue, OptimaRow, SourceKind } from "@/lib/types";

export const OPTIMA_COLUMNS = [
  "ID", "QTY", "MAT_1", "SEP_1", "MAT_2", "SEP_2", "MAT_3", "SEP_3", "MAT_4",
  "PRODUCTO", "DIM_X", "DIM_Y", "Wor1_1", "Wor1_2", "Wor1_3", "Wor1_4",
  "Wor2_1", "Wor2_2", "Wor2_3", "Wor3_1", "Wor3_2", "Wor3_3", "Wor4_1",
  "Wor4_2", "Wor4_3", "Wor5_1", "Wor5_2", "Wor5_3", "Wor6_1", "Wor6_2",
  "Wor6_3", "Wor7_1", "Wor7_2", "Wor7_3", "Wor0_1", "Wor0_2", "Wor0_3",
  "Wor0_4", "ORDER", "CUSTOMER", "Notes", "Note_1", "Note_2", "Note_3", "Note_4",
  "Note_5", "Note_6", "Note_7", "Note_8", "Note_9", "Note_10", "Note_11", "Note_12",
  "Note_13", "Note_14", "Note_15", "Note_16", "Note_17", "Note_18", "Note_19", "Note_20",
] as const;

function templatePath(sourceKind: SourceKind) {
  return path.join(process.cwd(), "templates", sourceKind === "dwg" ? "dwg-import.xlsx" : "pdf-import.xlsx");
}

function scalar(value: ExcelJS.CellValue): CellValue {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value && typeof value === "object" && "result" in value) {
    const result = value.result;
    return typeof result === "number" || typeof result === "string" ? result : "";
  }
  return value == null ? "" : String(value);
}

export async function loadValidatedRows(sourceKind: SourceKind): Promise<OptimaRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath(sourceKind));
  const worksheet = workbook.worksheets[0];
  const rows: OptimaRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || String(row.getCell(1).value ?? "").trim() === "") return;
    const cells: Record<string, CellValue> = {};
    OPTIMA_COLUMNS.forEach((column, index) => {
      cells[column] = scalar(row.getCell(index + 1).value);
    });
    rows.push({
      rowId: crypto.randomUUID(),
      approved: false,
      confidence: 1,
      provisionalFields: [],
      cells,
    });
  });
  return rows;
}

export async function buildOptimaWorkbook(rows: OptimaRow[], sourceKind: SourceKind) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath(sourceKind));
  const worksheet = workbook.worksheets[0];
  const originalRowCount = worksheet.rowCount;

  rows.forEach((item, index) => {
    const values = OPTIMA_COLUMNS.map((column) => item.cells[column] ?? "");
    values.push("");
    worksheet.getRow(index + 2).values = values;
  });

  const firstUnusedRow = rows.length + 2;
  if (firstUnusedRow <= originalRowCount) {
    worksheet.spliceRows(firstUnusedRow, originalRowCount - firstUnusedRow + 1);
  }

  worksheet.properties.defaultRowHeight = worksheet.properties.defaultRowHeight || 15;
  return workbook.xlsx.writeBuffer();
}

export function normalizeLlmRows(
  rawRows: Array<Record<string, unknown>>,
  defaults: Record<string, CellValue> = {},
): OptimaRow[] {
  return rawRows.map((raw, index) => {
    const cells: Record<string, CellValue> = {};
    OPTIMA_COLUMNS.forEach((column) => {
      const value = raw[column] ?? raw[column.toLowerCase()] ?? defaults[column] ?? "";
      cells[column] = typeof value === "number" || typeof value === "string" ? value : "";
    });
    cells.ID = cells.ID || index + 1;

    const provisional = raw.provisionalFields;
    return {
      rowId: crypto.randomUUID(),
      approved: false,
      confidence: typeof raw.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : 0.7,
      provisionalFields: Array.isArray(provisional) ? provisional.map(String) : [],
      cells,
    };
  });
}
