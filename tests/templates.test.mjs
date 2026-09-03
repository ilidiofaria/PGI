import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import path from "node:path";

const expectedHeaders = [
  "ID", "QTY", "MAT_1", "SEP_1", "MAT_2", "SEP_2", "MAT_3", "SEP_3", "MAT_4",
  "PRODUCTO", "DIM_X", "DIM_Y", "Wor1_1", "Wor1_2", "Wor1_3", "Wor1_4",
  "Wor2_1", "Wor2_2", "Wor2_3", "Wor3_1", "Wor3_2", "Wor3_3", "Wor4_1",
  "Wor4_2", "Wor4_3", "Wor5_1", "Wor5_2", "Wor5_3", "Wor6_1", "Wor6_2",
  "Wor6_3", "Wor7_1", "Wor7_2", "Wor7_3", "Wor0_1", "Wor0_2", "Wor0_3",
  "Wor0_4", "ORDER", "CUSTOMER", "Notes", "Note_1", "Note_2", "Note_3", "Note_4",
  "Note_5", "Note_6", "Note_7", "Note_8", "Note_9", "Note_10", "Note_11", "Note_12",
  "Note_13", "Note_14", "Note_15", "Note_16", "Note_17", "Note_18", "Note_19", "Note_20", "",
];

async function inspectTemplate(name) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(process.cwd(), "templates", name));
  const worksheet = workbook.worksheets[0];
  const headers = Array.from({ length: 62 }, (_, index) => String(worksheet.getRow(1).getCell(index + 1).value ?? ""));
  const dataRows = worksheet.getRows(2, worksheet.rowCount - 1)?.filter((row) => row.getCell(1).value != null) ?? [];
  return { headers, dataRows };
}

test("os templates mantêm as 62 colunas Optima", async () => {
  for (const template of ["pdf-import.xlsx", "dwg-import.xlsx"]) {
    const { headers } = await inspectTemplate(template);
    assert.deepEqual(headers, expectedHeaders);
  }
});

test("o cenário PDF contém 53 linhas e 68 unidades", async () => {
  const { dataRows } = await inspectTemplate("pdf-import.xlsx");
  assert.equal(dataRows.length, 53);
  assert.equal(dataRows.reduce((sum, row) => sum + Number(row.getCell(2).value || 0), 0), 68);
});

test("o cenário PDF respeita o separador e não assume o segundo material", async () => {
  const { dataRows } = await inspectTemplate("pdf-import.xlsx");
  const exteriorRows = dataRows.filter((row) => String(row.getCell(41).value || "").startsWith("VJe"));
  const interiorRows = dataRows.filter((row) => String(row.getCell(41).value || "").startsWith("VPe"));

  assert.equal(exteriorRows.length, 40);
  assert.equal(interiorRows.length, 13);
  assert.ok(exteriorRows.every((row) => row.getCell(4).value === "CX14"));
  assert.ok(interiorRows.every((row) => row.getCell(4).value === "CX16"));
  assert.ok(dataRows.every((row) => row.getCell(5).value == null || row.getCell(5).value === ""));
});

test("o cenário DWG contém 6 linhas e 82 unidades", async () => {
  const { dataRows } = await inspectTemplate("dwg-import.xlsx");
  assert.equal(dataRows.length, 6);
  assert.equal(dataRows.reduce((sum, row) => sum + Number(row.getCell(2).value || 0), 0), 82);
});
