import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PGI · Preparação Optima",
  description: "Protótipo de preparação de ficheiros de importação para o Optima.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
