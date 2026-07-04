"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setError("Account created, but sign-in failed. Try logging in.");
      return;
    }
    router.push("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <input
          type="text" placeholder="Name (optional)" value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="email" placeholder="Email" required value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="password" placeholder="Password (8+ characters)" required value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="bg-black text-white rounded px-3 py-2 disabled:opacity-50">
          {loading ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-sm text-center">
          Already have an account? <a href="/login" className="underline">Log in</a>
        </p>
      </form>
    </main>
  );
}
