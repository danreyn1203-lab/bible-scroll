"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <input
          type="email" placeholder="Email" required value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="password" placeholder="Password" required value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="bg-black text-white rounded px-3 py-2 disabled:opacity-50">
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p className="text-sm text-center">
          No account yet? <a href="/signup" className="underline">Sign up</a>
        </p>
      </form>
    </main>
  );
}
