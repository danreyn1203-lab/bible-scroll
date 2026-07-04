"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) return <p style={{ color: "#fff" }}>Missing reset token.</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Reset failed"); return; }
    setDone(true);
    setTimeout(() => router.push("/"), 1500);
  }

  if (done) return <p style={{ color: "#c9a14a" }}>Password reset. Redirecting…</p>;

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
      <h1 style={{ color: "#c9a14a", fontFamily: "serif" }}>Set a new password</h1>
      <input type="password" minLength={8} required placeholder="New password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)}
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14 }} />
      <button disabled={busy} style={{ padding: "10px 16px", borderRadius: 8, background: "#c9a14a", color: "#0b0916", fontWeight: 600, border: "none", cursor: "pointer" }}>
        {busy ? "Saving…" : "Reset password"}
      </button>
      {error && <p style={{ color: "#ff7070", fontSize: 13 }}>{error}</p>}
    </form>
  );
}

export default function ResetPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#07060d", color: "#f6f3ec", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Suspense fallback={<p>Loading…</p>}><ResetForm /></Suspense>
    </main>
  );
}
