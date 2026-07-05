// Auth panel — real accounts against the bible-scroll backend.
// Supports signup, login, forgot-password, and 2FA email codes.

import { state } from "../../core/state.js";
import { signupAndLogin, login, getSession, startLogin, forgotPassword } from "../../core/authClient.js";
import { showOnboarding } from "./onboarding.js";

let onAuthChange = null;
export function setAuthChangeHandler(fn) { onAuthChange = fn; }

export async function maybeAutoOpen() {
  // ?auth=login means the user just signed out — force login panel, not dismissible
  const param = new URLSearchParams(window.location.search).get("auth");
  if (param === "login") {
    // Clean the URL without reloading
    history.replaceState({}, "", window.location.pathname);
    openAuthPanel({ mode: "login", dismissible: false });
    return;
  }
  const session = await getSession();
  if (session) return;
  openAuthPanel({ mode: "signup", dismissible: false });
}

export function openAuthPanel({ mode = "signup", dismissible = true } = {}) {
  const el = document.getElementById("welcome");
  if (!el) return;
  render(el, mode, dismissible, {});
}

function render(el, mode, dismissible, ctx) {
  const isSignup = mode === "signup";
  const isLogin = mode === "login";
  const isForgot = mode === "forgot";
  const isCode = mode === "code";

  let inner;
  if (isForgot) {
    inner = `
      <h1>Reset password</h1>
      <p class="welcome-sub">Enter your email — we'll send you a reset link.</p>
      <form id="welcome-form" class="welcome-form">
        <input type="email" name="email" placeholder="Email" required autocomplete="email" value="${ctx.email || ""}" />
        <button type="submit" class="welcome-cta">Send reset link</button>
      </form>
      <p class="welcome-error" id="welcome-error" hidden></p>
      <button class="welcome-toggle" data-go="login">Back to log in</button>
    `;
  } else if (isCode) {
    inner = `
      <h1>Check your email</h1>
      <p class="welcome-sub">We sent a 6-digit code to <b>${ctx.email}</b>. Enter it below.</p>
      <form id="welcome-form" class="welcome-form">
        <input type="text" name="code" placeholder="123456" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="one-time-code" autofocus />
        <button type="submit" class="welcome-cta">Verify & sign in</button>
      </form>
      <p class="welcome-error" id="welcome-error" hidden></p>
      <button class="welcome-toggle" data-go="login">Use a different account</button>
    `;
  } else {
    inner = `
      <h1>${isSignup ? "Welcome to Simply Manna" : "Welcome back"}</h1>
      <p class="welcome-sub">${isSignup
        ? "Create an account so your likes, saves, and streak follow you everywhere."
        : "Log in to pick up your reading where you left off."}</p>
      <form id="welcome-form" class="welcome-form">
        ${isSignup ? `<input type="text" name="name" placeholder="Your name (optional)" autocomplete="name" />` : ""}
        <input type="email" name="email" placeholder="Email" required autocomplete="email" />
        <input type="password" name="password" placeholder="Password (8+ characters)" required minlength="8" autocomplete="${isSignup ? "new-password" : "current-password"}" />
        <button type="submit" class="welcome-cta">${isSignup ? "Create account & begin reading" : "Log in"}</button>
      </form>
      <p class="welcome-error" id="welcome-error" hidden></p>
      ${isLogin ? `<button class="welcome-link" data-go="forgot">Forgot password?</button>` : ""}
      <button class="welcome-toggle" data-go="${isSignup ? "login" : "signup"}">
        ${isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
      </button>
    `;
  }

  el.innerHTML = `
    <div class="welcome-overlay">
      <div class="welcome-sheet">
        <div class="welcome-logo">✦</div>
        ${inner}
        ${dismissible ? `<button class="welcome-skip" id="welcome-skip">Maybe later</button>` : ""}
      </div>
    </div>
  `;

  const form = el.querySelector("#welcome-form");
  const errorEl = el.querySelector("#welcome-error");
  const submitBtn = form.querySelector(".welcome-cta");
  const showError = msg => { errorEl.textContent = msg; errorEl.hidden = false; };
  const close = () => {
    el.querySelector(".welcome-overlay")?.classList.add("welcome-out");
    setTimeout(() => { el.innerHTML = ""; }, 350);
  };

  el.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => render(el, btn.dataset.go, dismissible, ctx));
  });
  el.querySelector("#welcome-skip")?.addEventListener("click", () => { state.set("welcomeDismissed", true); close(); });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errorEl.hidden = true;
    const data = new FormData(form);
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;

    try {
      if (isForgot) {
        submitBtn.textContent = "Sending…";
        const r = await forgotPassword((data.get("email") || "").toString().trim());
        if (!r.ok) { showError(r.error); return; }
        showError("If that email is registered, a reset link is on its way.");
        errorEl.style.color = "var(--gold)";
        return;
      }

      if (isCode) {
        submitBtn.textContent = "Verifying…";
        const code = (data.get("code") || "").toString().trim();
        const r = await login({ email: ctx.email, password: ctx.password, code });
        if (!r.ok) { showError(r.error); return; }
        state.set("welcomeDismissed", true);
        close();
        onAuthChange?.(r.session);
        return;
      }

      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const password = (data.get("password") || "").toString();

      if (isSignup) {
        submitBtn.textContent = "Creating account…";
        const r = await signupAndLogin({ email, password, displayName: name || undefined });
        if (!r.ok) { showError(r.error); return; }
        state.set("welcomeDismissed", true);
        close();
        onAuthChange?.(r.session);
        showOnboarding();
        return;
      }

      // Login: check whether 2FA is required first
      submitBtn.textContent = "Logging in…";
      const start = await startLogin({ email, password });
      if (!start.ok) { showError(start.error); return; }
      if (start.twoFactor) {
        render(el, "code", dismissible, { email, password });
        return;
      }
      const r = await login({ email, password });
      if (!r.ok) { showError(r.error); return; }
      state.set("welcomeDismissed", true);
      close();
      onAuthChange?.(r.session);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}
