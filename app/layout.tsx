import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Preparação ERP",
  description: "Preparação de ficheiros de importação para o ERP.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
