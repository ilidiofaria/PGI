import { createHash } from "node:crypto";

export const DEMO_DWG_SHA256 = "DE3272C1B34747EDF1DE4869C4341B0DB2C240A2D89FE83308308A51815B25ED";
export const DEMO_VAOS_PDF_SHA256 = "581B5BBD249BA34EA2DCD90BB0630A693275CA7E42672FA9EB0635730049A5DF";

export function sha256(buffer: Uint8Array) {
  return createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

export function classifySourceKind(extension: string, fileHash: string): "pdf" | "dwg" {
  if (extension === "dwg" || fileHash === DEMO_VAOS_PDF_SHA256) return "dwg";
  return "pdf";
}
