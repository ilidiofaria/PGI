import type { CellValue, Provider } from "@/lib/types";
import { normalizeLlmRows } from "@/lib/optima";

const EXTRACTION_PROMPT = `
Analisa integralmente todas as páginas do PDF fornecido. O documento contém uma listagem ou desenho técnico de vidros a encomendar.

Devolve exclusivamente JSON válido, sem markdown, no formato:
{"rows":[{"ID":"","QTY":"","MAT_1":"","SEP_1":"","MAT_2":"","PRODUCTO":"VD","DIM_X":"","DIM_Y":"","ORDER":"","CUSTOMER":"","Notes":"","confidence":0.0,"provisionalFields":[]}]}

Regras obrigatórias:
- Cria uma linha por referência e dimensão distintas. Não omitas páginas, quadros ou referências.
- Mantém as dimensões em milímetros e a quantidade como número inteiro.
- Usa Notes para a referência do vão ou janela quando existir.
- Não inventes dimensões ou quantidades. Quando um campo técnico necessário não estiver legível, deixa-o vazio e inclui o nome em provisionalFields.
- PRODUCTO pode assumir VD quando o documento representar vidro duplo; caso contrário, deixa vazio.
- Confidence deve refletir a confiança na leitura da linha, entre 0 e 1.
- O resultado será obrigatoriamente validado por uma pessoa antes de ser importado no Optima.
`;

function toBase64(buffer: Buffer) {
  return buffer.toString("base64");
}

function parseJson(text: string) {
  const clean = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  const parsed = JSON.parse(first >= 0 && last > first ? clean.slice(first, last + 1) : clean);
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  if (!Array.isArray(rows)) throw new Error("O modelo não devolveu uma lista de linhas válida.");
  return rows as Array<Record<string, unknown>>;
}

async function callOpenAI(apiKey: string, model: string, fileName: string, pdf: Buffer) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: EXTRACTION_PROMPT },
          {
            type: "input_file",
            filename: fileName,
            file_data: `data:application/pdf;base64,${toBase64(pdf)}`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`A OpenAI devolveu o estado ${response.status}: ${details.slice(0, 240)}`);
  }

  const data = await response.json() as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("\n") || "";
  return parseJson(text);
}

async function callAnthropic(apiKey: string, model: string, pdf: Buffer) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: toBase64(pdf) },
          },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`A Anthropic devolveu o estado ${response.status}: ${details.slice(0, 240)}`);
  }

  const data = await response.json() as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.filter((part) => part.type === "text").map((part) => part.text || "").join("\n") || "";
  return parseJson(text);
}

export async function processWithLlm(options: {
  provider: Exclude<Provider, "demo">;
  apiKey: string;
  model: string;
  fileName: string;
  pdf: Buffer;
  defaults?: Record<string, CellValue>;
}) {
  const rawRows = options.provider === "openai"
    ? await callOpenAI(options.apiKey, options.model, options.fileName, options.pdf)
    : await callAnthropic(options.apiKey, options.model, options.pdf);
  return normalizeLlmRows(rawRows, options.defaults);
}
