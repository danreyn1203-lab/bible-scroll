// Shared account-button wiring for standalone pages (leaderboard, donate, ads, home).
// Mirrors what app.js does for index.html's top bar, using the real session/auth modules.
import { getSession } from "./authClient.js";
import { openAuthPanel, maybeAutoOpen } from "../ui/components/welcome.js";
import { showAccountMenu } from "../ui/components/accountMenu.js";

export async function initPageAccount(buttonEl) {
  // Force sign-in on every page that wires up the account button, not just
  // the main feed — otherwise visiting e.g. /leaderboard.html directly
  // skips the auth wall entirely.
  await maybeAutoOpen();

  if (!buttonEl) return null;

  let session = await getSession();

  async function render() {
    if (session?.user) {
      const meRes = await fetch("/api/users/me", { credentials: "same-origin" });
      const me = meRes.ok ? await meRes.json() : null;
      const name = me?.displayName || session.user.name || (session.user.email || "Account").split("@")[0];
      const avatar = me?.avatarUrl
        ? `<img class="account-btn-avatar" src="${me.avatarUrl}" alt="" />`
        : `<span class="account-btn-avatar account-btn-avatar--placeholder">${(name || "A")[0].toUpperCase()}</span>`;
      buttonEl.innerHTML = `${avatar}<span class="account-btn-name">${name}</span><span class="account-btn-chev">▾</span>`;
      buttonEl.classList.add("account-btn--in");
    } else {
      buttonEl.textContent = "Sign in";
      buttonEl.classList.remove("account-btn--in");
    }
  }
  await render();

  buttonEl.addEventListener("click", async e => {
    e.stopPropagation();
    if (session?.user) {
      showAccountMenu(buttonEl, async newSession => {
        session = newSession === undefined ? await getSession() : newSession;
        await render();
      });
    } else {
      openAuthPanel({ mode: "login", dismissible: true });
    }
  });

  return {
    getSession: () => session,
    refresh: async () => { session = await getSession(); await render(); return session; },
  };
}
