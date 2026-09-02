"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowRight, LockKeyhole } from "lucide-react";

export function LoginView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Não foi possível iniciar sessão.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand brand-large">
          <Image src="/brand/pgi-logo.svg" alt="PGI Peões Glass Industry" width={56} height={56} priority />
          <div>
            <strong>PGI</strong>
            <span>Preparação de importação Optima</span>
          </div>
        </div>
        <div className="login-heading">
          <span className="icon-box"><LockKeyhole size={20} /></span>
          <div>
            <p className="eyebrow">Acesso reservado</p>
            <h1>Iniciar sessão</h1>
          </div>
        </div>
        <form onSubmit={submit} className="login-form">
          <label>
            Utilizador
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>
            Palavra-passe
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" disabled={loading}>
            {loading ? "A validar..." : "Entrar"}<ArrowRight size={17} />
          </button>
        </form>
        <p className="login-note">Ambiente de demonstração. Os dados não são armazenados após o processamento.</p>
      </section>
    </main>
  );
}
