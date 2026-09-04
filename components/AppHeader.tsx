"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileClock, FileInput, LogOut, Waypoints } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Processamento", icon: FileInput },
  { href: "/mapeamentos", label: "Mapeamentos", icon: Waypoints },
  { href: "/historico", label: "Histórico", icon: FileClock },
];

export function AppHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="PGI - Processamento">
        <Image src="/brand/pgi-logo.svg" alt="PGI Peões Glass Industry" width={43} height={43} priority />
      </Link>
      <nav className="app-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? "app-nav-link active" : "app-nav-link"} aria-current={active ? "page" : undefined}>
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="topbar-actions">
        <span className="environment"><span />Demonstração</span>
        <button className="icon-button" onClick={logout} title="Terminar sessão" aria-label="Terminar sessão"><LogOut size={18} /></button>
      </div>
    </header>
  );
}
