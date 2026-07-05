// Universal search overlay — searches users, posts, content, entities.
// Triggered from the top-bar 🔍 button. Closes on Escape or backdrop click.

import { toast } from "./toast.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let activeOverlay = null;

export function openSearch() {
  if (activeOverlay) return;
  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.innerHTML = `
    <div class="search-sheet">
      <div class="search-input-row">
        <input type="search" class="search-input" placeholder="Search verses, people, posts, topics…" autocomplete="off" />
        <button class="search-close" aria-label="Close">×</button>
      </div>
      <div class="search-results" id="search-results">
        <div class="search-hint">Type to search across Simply Manna.</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  activeOverlay = overlay;

  const input = overlay.querySelector(".search-input");
  const results = overlay.querySelector("#search-results");
  setTimeout(() => input.focus(), 50);

  const close = () => { overlay.remove(); activeOverlay = null; document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  overlay.querySelector(".search-close").addEventListener("click", close);

  let abortCtrl = null;
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = `<div class="search-hint">Keep typing…</div>`;
      return;
    }
    timer = setTimeout(async () => {
      abortCtrl?.abort();
      abortCtrl = new AbortController();
      results.innerHTML = `<div class="search-hint">Searching…</div>`;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: abortCtrl.signal });
        const data = await res.json();
        renderResults(results, data, close);
      } catch (e) {
        if (e.name !== "AbortError") toast("Search failed");
      }
    }, 200);
  });
}

function renderResults(root, data, close) {
  const sections = [];
  if (data.users?.length) {
    sections.push(`
      <div class="search-section">
        <div class="search-section-label">People</div>
        ${data.users.map(u => `
          <div class="search-result" data-kind="user" data-id="${u.id}">
            ${u.avatarUrl ? `<img class="search-avatar" src="${esc(u.avatarUrl)}" />` : `<div class="search-avatar"><span>${esc((u.displayName || "?")[0].toUpperCase())}</span></div>`}
            <div class="search-result-body">
              <div class="search-result-title">${esc(u.displayName || "User")}</div>
              ${u.bio ? `<div class="search-result-sub">${esc(u.bio.slice(0, 80))}</div>` : ""}
            </div>
          </div>`).join("")}
      </div>`);
  }
  if (data.content?.length) {
    sections.push(`
      <div class="search-section">
        <div class="search-section-label">Bible content</div>
        ${data.content.map(c => `
          <div class="search-result" data-kind="content" data-id="${c.id}">
            <div class="search-icon">📖</div>
            <div class="search-result-body">
              <div class="search-result-title">${esc(c.ref)}</div>
              <div class="search-result-sub">${esc(c.text)}</div>
            </div>
          </div>`).join("")}
      </div>`);
  }
  if (data.entities?.length) {
    sections.push(`
      <div class="search-section">
        <div class="search-section-label">Topics</div>
        ${data.entities.map(e => `
          <div class="search-result" data-kind="entity" data-id="${e.id}">
            <div class="search-icon">${e.type === "person" ? "👤" : e.type === "book" ? "📜" : "✨"}</div>
            <div class="search-result-body">
              <div class="search-result-title">${esc(e.label)}</div>
              <div class="search-result-sub">${esc(e.summary)}</div>
            </div>
          </div>`).join("")}
      </div>`);
  }
  if (data.posts?.length) {
    sections.push(`
      <div class="search-section">
        <div class="search-section-label">Posts</div>
        ${data.posts.map(p => `
          <div class="search-result" data-kind="post" data-id="${p.id}">
            <div class="search-icon">💬</div>
            <div class="search-result-body">
              <div class="search-result-title">${esc(p.author?.displayName || "Anonymous")}</div>
              <div class="search-result-sub">${esc(p.caption || "(no caption)")}</div>
            </div>
          </div>`).join("")}
      </div>`);
  }
  if (!sections.length) {
    root.innerHTML = `<div class="search-hint">No matches — try different words.</div>`;
    return;
  }
  root.innerHTML = sections.join("");
  root.querySelectorAll(".search-result").forEach(el => {
    el.addEventListener("click", () => {
      const kind = el.dataset.kind;
      const id = el.dataset.id;
      if (kind === "user") window.open(`/api/users/${id}`, "_blank");
      // For posts/content/entities we'd jump to the item; for now just close.
      close();
    });
  });
}
