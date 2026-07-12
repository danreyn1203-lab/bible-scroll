// Composition root. Wires core + ui + features together and boots the app.
import { initRender } from "./src/ui/render.js";
import { initParticles, initScrollMotion, initPointerLight } from "./src/ui/effects.js";
import { maybeAutoOpen } from "./src/ui/components/welcome.js";
import { initAccount } from "./src/ui/components/account.js";
import { showPostComposer } from "./src/ui/components/postComposer.js";
import { getSession } from "./src/core/authClient.js";
import { buildCommunity } from "./src/features/community/community.js";
import { openAuthPanel } from "./src/ui/components/welcome.js";
import { openSearch } from "./src/ui/components/search.js";
import { showFactComposer } from "./src/ui/components/factComposer.js";
import { buildFeed } from "./src/features/feed/feed.js";

(async () => {
  await initRender();
  initParticles(document.getElementById("particles"));
  initScrollMotion(document.getElementById("feed"));
  initPointerLight(document.getElementById("feed"));
  initAccount();
  maybeAutoOpen();

  document.getElementById("search-btn")?.addEventListener("click", () => openSearch());
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
  });

  document.getElementById("post-fab")?.addEventListener("click", async () => {
    const activeView = document.querySelector(".tab.active")?.dataset.view;
    // On the For You feed the + creates a personal "fact" card (no login needed).
    if (activeView !== "community") {
      showFactComposer(async () => { await buildFeed(document.getElementById("feed")); });
      return;
    }
    // On Community the + creates a shared post (requires an account).
    const session = await getSession();
    if (!session) { openAuthPanel({ mode: "login", dismissible: true }); return; }
    showPostComposer(async () => {
      if (document.querySelector(".tab.active")?.dataset.view === "community") {
        await buildCommunity(document.getElementById("feed"));
      }
    });
  });

  // Bottom nav visibility is handled entirely by CSS (display:none on desktop, flex on mobile).
})();
