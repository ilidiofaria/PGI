import { requestIsAuthenticated } from "@/lib/auth";
import { buildOptimaWorkbook } from "@/lib/optima";
import { isCompleteRow, type OptimaRow, type SourceKind } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!requestIsAuthenticated(request)) {
    return Response.json({ error: "Sessão expirada." }, { status: 401 });
  }

  try {
    const body = await request.json() as { rows?: OptimaRow[]; sourceKind?: SourceKind };
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const sourceKind = body.sourceKind === "dwg" ? "dwg" : "pdf";

    if (rows.length === 0) {
      return Response.json({ error: "Não existem linhas para exportar." }, { status: 400 });
    }
    if (rows.some((row) => !row.approved || !isCompleteRow(row))) {
      return Response.json({ error: "Valide todas as linhas obrigatórias antes da exportação." }, { status: 400 });
    }

    const buffer = await buildOptimaWorkbook(rows, sourceKind);
    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="IMPORT_EXCEL.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o Excel.";
    return Response.json({ error: message }, { status: 500 });
  }
}
