// Persistent top-bar account control. When logged out: "Sign in" opens auth
// panel. When logged in: shows the user's name + avatar; tapping opens the
// account menu (profile, 2FA, sign out).

import { getSession } from "../../core/authClient.js";
import { openAuthPanel, setAuthChangeHandler } from "./welcome.js";
import { showAccountMenu } from "./accountMenu.js";

const btn = () => document.getElementById("account-btn");

async function render(session) {
  const el = btn();
  if (!el) return;
  if (session?.user) {
    const meRes = await fetch("/api/users/me", { credentials: "same-origin" });
    const me = meRes.ok ? await meRes.json() : null;
    const name = me?.displayName || session.user.name || (session.user.email || "Account").split("@")[0];
    const avatar = me?.avatarUrl
      ? `<img class="account-btn-avatar" src="${me.avatarUrl}" alt="" />`
      : `<span class="account-btn-avatar account-btn-avatar--placeholder">${(name || "A")[0].toUpperCase()}</span>`;
    el.innerHTML = `${avatar}<span class="account-btn-name">${name}</span><span class="account-btn-chev">▾</span>`;
    el.classList.add("account-btn--in");
    el.title = "Account menu";
  } else {
    el.textContent = "Sign in";
    el.innerHTML = "Sign in";
    el.classList.remove("account-btn--in");
    el.title = "Sign in or create an account";
  }
}

export async function initAccount() {
  const el = btn();
  if (!el) return;

  let session = await getSession();
  await render(session);

  setAuthChangeHandler(async newSession => { session = newSession; await render(session); });

  el.addEventListener("click", async e => {
    e.stopPropagation();
    if (session?.user) {
      showAccountMenu(el, async newSession => {
        session = newSession === undefined ? await getSession() : newSession;
        await render(session);
      });
    } else {
      openAuthPanel({ mode: "login", dismissible: true });
    }
  });
}
