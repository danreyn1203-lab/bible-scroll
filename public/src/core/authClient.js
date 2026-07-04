// Talks to the real bible-scroll backend now that Manna is served from the
// same origin (no CORS/cross-cookie complications). This is plain fetch
// rather than the next-auth/react package, since this file is a static
// ES module, not bundled by Next.js.

async function getCsrfToken() {
  const res = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  const data = await res.json();
  return data.csrfToken;
}

async function loginWithPassword(email, password, code) {
  const csrfToken = await getCsrfToken();
  const params = { email, password, csrfToken, json: "true" };
  if (code) params.code = code;
  const body = new URLSearchParams(params);
  await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "same-origin",
    body,
  });
  const session = await fetch("/api/auth/session", { credentials: "same-origin" }).then(r => r.json());
  if (!session?.user) return { ok: false, error: code ? "Invalid code or credentials." : "Invalid email or password." };
  return { ok: true, session };
}

// Returns { twoFactor: boolean } — if true, caller must collect the emailed
// code and call login() with it. If false, password was verified but caller
// still needs to call login() to actually establish the session.
export async function startLogin({ email, password }) {
  const res = await fetch("/api/auth/login-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || "Login failed" };
  return { ok: true, twoFactor: !!data.twoFactor };
}

export async function forgotPassword(email) {
  const res = await fetch("/api/auth/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || "Couldn't send reset" };
  return { ok: true };
}

export async function signupAndLogin({ email, password, displayName }) {
  const signupRes = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email, password, displayName }),
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) {
    return { ok: false, error: signupData.error || "Could not create account." };
  }
  return loginWithPassword(email, password);
}

export async function login({ email, password, code }) {
  return loginWithPassword(email, password, code);
}

export async function getSession() {
  const res = await fetch("/api/auth/session", { credentials: "same-origin" });
  const data = await res.json();
  return data?.user ? data : null;
}

export async function logout() {
  const csrfToken = await getCsrfToken();
  await fetch("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "same-origin",
    body: new URLSearchParams({ csrfToken, json: "true" }),
  });
  // Force full page reload so session is cleared everywhere, then show login
  window.location.href = "/index.html?auth=login";
}
