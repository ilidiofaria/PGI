import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requestIsAuthenticated } from "@/lib/auth";
import { loadValidatedRows } from "@/lib/optima";
import { processWithLlm } from "@/lib/llm";
import type { CellValue, Provider, SourceKind } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 4_400_000;
const DEMO_DWG_SHA256 = "DE3272C1B34747EDF1DE4869C4341B0DB2C240A2D89FE83308308A51815B25ED";

export async function POST(request: Request) {
  if (!requestIsAuthenticated(request)) {
    return Response.json({ error: "Sessão expirada." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const provider = String(form.get("provider") || "demo") as Provider;
    const model = String(form.get("model") || "").trim();
    const apiKey = String(form.get("apiKey") || "").trim();

    if (!(file instanceof File)) {
      return Response.json({ error: "Selecione um ficheiro PDF ou DWG." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "O ficheiro excede o limite de 4,4 MB desta demonstração." }, { status: 413 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "dwg") {
      return Response.json({ error: "Formato não suportado. Utilize PDF ou DWG." }, { status: 400 });
    }
    const sourceKind = extension as SourceKind;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (provider === "demo") {
      const rows = await loadValidatedRows(sourceKind);
      return Response.json({
        mode: "Demonstração validada",
        sourceKind,
        rows,
        previewUrl: sourceKind === "dwg" ? "/demo/3.01-vaos-exteriores.pdf" : undefined,
        warnings: ["Resultado inicial sujeito a validação humana antes da importação no Optima."],
      });
    }

    if ((provider !== "openai" && provider !== "anthropic") || !apiKey || !model) {
      return Response.json({ error: "Indique o fornecedor, o modelo e a respetiva chave de API." }, { status: 400 });
    }

    let pdfBuffer = fileBuffer;
    let llmFileName = file.name;
    if (sourceKind === "dwg") {
      const hash = createHash("sha256").update(fileBuffer).digest("hex").toUpperCase();
      if (hash !== DEMO_DWG_SHA256) {
        return Response.json({
          error: "Nesta demonstração, o processamento DWG está limitado ao ficheiro de referência fornecido.",
        }, { status: 400 });
      }
      pdfBuffer = await readFile(path.join(process.cwd(), "fixtures", "dwg-converted.pdf"));
      llmFileName = "3.01 Vaos exteriores.pdf";
    }

    const defaults: Record<string, CellValue> = sourceKind === "dwg"
      ? { PRODUCTO: "VD", MAT_1: "6CLXTM70-33II", SEP_1: "CX16", MAT_2: "44.1STDIC", Wor1_1: "ARTD", Wor1_2: "TEMPERA", Wor3_1: "ARI", Wor0_4: "SRVINST", CUSTOMER: "01107" }
      : { PRODUCTO: "VD", MAT_1: "8MC.CG1.0T", SEP_1: "CX16", MAT_2: "44.2STD", Wor1_1: "ARTD", Wor1_2: "TEMPERA", Wor3_1: "ARI", Wor0_4: "SRVINST", CUSTOMER: "01048" };

    const rows = await processWithLlm({
      provider,
      apiKey,
      model,
      fileName: llmFileName,
      pdf: pdfBuffer,
      defaults,
    });

    return Response.json({
      mode: provider === "openai" ? `OpenAI · ${model}` : `Anthropic · ${model}`,
      sourceKind,
      rows,
      previewUrl: sourceKind === "dwg" ? "/demo/3.01-vaos-exteriores.pdf" : undefined,
      warnings: ["Os campos técnicos preenchidos pelo modelo devem ser confirmados por uma pessoa."],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ocorreu um erro no processamento.";
    return Response.json({ error: message }, { status: 500 });
  }
}
