import { state } from "../core/state.js";
import { recordSignal } from "../core/engine.js";
import { recordEngagement, checkMilestone } from "../core/retention.js";
import { analytics } from "../core/ai/aiClient.js";
import { toast } from "./components/toast.js";
import { closePanel } from "./components/panel.js";
import { contentIndex } from "../data/graph.js";
import { buildFeed, appendBatch, setFilter, getFilter } from "../features/feed/feed.js";
import { openDiscovery } from "../features/discovery/discovery.js";
import { buildProfile } from "../features/profile/profile.js";
import { buildCommunity } from "../features/community/community.js";
import { chipsHTML } from "./components/chips.js";
import { ICONS } from "./components/icons.js";
import { startDwellTracking, markReflected } from "../core/telemetry.js";
import { cyclePreferredTranslation } from "../core/aiProfile.js";
import { toggleLike as apiToggleLike, toggleSave as apiToggleSave, postComment as apiPostComment, getComments as apiGetComments } from "../core/apiClient.js";

const feedEl = document.getElementById("feed");
const filtersEl = document.getElementById("filters");
let view = "feed";

function spawnFloatingEmoji(anchor, glyph) {
  const rect = anchor.getBoundingClientRect();
  const card = anchor.closest(".card");
  const layer = card?.querySelector(".float-layer") || (() => {
    const l = document.createElement("div");
    l.className = "float-layer";
    card?.appendChild(l);
    return l;
  })();
  for (let i = 0; i < 3; i++) {
    const span = document.createElement("span");
    span.className = "float-emoji";
    span.textContent = glyph;
    const cardRect = card.getBoundingClientRect();
    span.style.left = `${rect.left - cardRect.left + rect.width / 2 + (Math.random() * 40 - 20)}px`;
    span.style.top = `${rect.top - cardRect.top - 8}px`;
    span.style.animationDelay = `${i * 90}ms`;
    layer.appendChild(span);
    setTimeout(() => span.remove(), 2200 + i * 90);
  }
}

function openMoreMenu(anchor, contentId) {
  document.querySelectorAll(".card-more-menu").forEach(n => n.remove());
  const rect = anchor.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.className = "card-more-menu";
  menu.style.top = `${rect.bottom + 6}px`;
  menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
  menu.innerHTML = `<button data-action="report">🚩 Report this post</button>`;
  document.body.appendChild(menu);
  const close = () => { menu.remove(); document.removeEventListener("click", onDoc, true); };
  const onDoc = e => { if (!menu.contains(e.target) && e.target !== anchor) close(); };
  setTimeout(() => document.addEventListener("click", onDoc, true), 0);
  menu.querySelector("[data-action=report]").addEventListener("click", () => { close(); openReportDialog(contentId); });
}

function openReportDialog(contentId) {
  const overlay = document.createElement("div");
  overlay.className = "report-overlay";
  overlay.innerHTML = `
    <div class="report-sheet">
      <h3>Report this post</h3>
      <p class="report-sub">Tell us what's wrong. Reports are private.</p>
      <select class="report-reason">
        <option value="inappropriate">Inappropriate content</option>
        <option value="misleading">Misleading or incorrect</option>
        <option value="spam">Spam</option>
        <option value="off-topic">Off-topic</option>
        <option value="other">Other</option>
      </select>
      <textarea class="report-details" rows="3" maxlength="500" placeholder="Describe the issue (optional)"></textarea>
      <div class="report-actions">
        <button class="report-cancel">Cancel</button>
        <button class="report-submit">Submit report</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  overlay.querySelector(".report-cancel").addEventListener("click", close);
  overlay.querySelector(".report-submit").addEventListener("click", async () => {
    const reason = overlay.querySelector(".report-reason").value;
    const details = overlay.querySelector(".report-details").value.trim();
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ contentId, reason, details }),
    });
    if (res.ok) { toast("Thanks — report submitted"); close(); }
    else { const err = await res.json().catch(() => ({})); toast(err.error || "Couldn't submit"); }
  });
}

function engage() {
  const streak = recordEngagement();
  const milestone = checkMilestone(streak);
  if (milestone) toast(milestone);
}

async function toggleLike(card, id) {
  const act = card.querySelector('[data-act="like"]');
  if (act.dataset.pending) return; // ignore rapid double-clicks while a request is in flight
  act.dataset.pending = "1";
  try {
    const res = await apiToggleLike(id);
    if (!res) return;
    act.classList.toggle("on", res.liked);
    act.querySelector(".ic").innerHTML = res.liked ? ICONS.heartFilled : ICONS.heartOutline;
    act.querySelector("[data-likect]").textContent = res.count ?? 0;
    if (res.liked) { recordSignal(id, "like"); analytics("like", { id }); engage(); }
  } finally {
    delete act.dataset.pending;
  }
}

async function toggleSave(card, id) {
  const act = card.querySelector('[data-act="save"]');
  if (act.dataset.pending) return; // ignore rapid double-clicks while a request is in flight
  act.dataset.pending = "1";
  try {
    const res = await apiToggleSave(id);
    if (!res) return;
    act.classList.toggle("saved", res.saved);
    act.querySelector(".ic").innerHTML = res.saved ? ICONS.bookmarkFilled : ICONS.bookmarkOutline;
    act.querySelector("[data-savect]").textContent = res.count ?? 0;
    if (res.saved) { toast("Saved ✦"); recordSignal(id, "save"); analytics("save", { id }); engage(); }
    else toast("Removed from Saved");
  } finally {
    delete act.dataset.pending;
  }
}

function shareItem(id) {
  const d = contentIndex.get(id);
  if (!d) return;
  const plain = (d.text + (d.answer ? " — " + d.answer : "")).replace(/<[^>]+>/g, "");
  const txt = `“${plain}”\n— ${d.ref}\n\nvia Simply Manna ✦`;
  if (navigator.share) navigator.share({ title: "Simply Manna", text: txt }).catch(() => {});
  else navigator.clipboard?.writeText(txt).then(() => toast("Copied to clipboard ✦"), () => toast("Copy not available"));
}

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderCommentItem(c) {
  const initial = esc((c.author?.displayName || "A")[0].toUpperCase());
  const avatarInner = c.author?.avatarUrl
    ? `<img src="${esc(c.author.avatarUrl)}" alt="" />`
    : `<span>${initial}</span>`;
  const profileHref = c.author?.id ? `/profile.html?id=${esc(c.author.id)}` : null;
  const nameEl = profileHref
    ? `<a class="cs-author" href="${profileHref}">${esc(c.author?.displayName || "Anonymous")}</a>`
    : `<span class="cs-author">${esc(c.author?.displayName || "Anonymous")}</span>`;
  const avatarEl = profileHref
    ? `<a href="${profileHref}" class="cs-avatar">${avatarInner}</a>`
    : `<div class="cs-avatar">${avatarInner}</div>`;
  const ts = c.createdAt ? new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
  return `<div class="cs-item">
    ${avatarEl}
    <div class="cs-bubble">
      <div class="cs-meta">${nameEl}${ts ? `<span class="cs-time">${ts}</span>` : ""}</div>
      <div class="cs-text">${esc(c.text)}</div>
    </div>
  </div>`;
}

async function openCommentSheet(id, card) {
  // Remove any existing sheet
  document.querySelector(".comment-sheet-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "comment-sheet-overlay";
  overlay.innerHTML = `
    <div class="comment-sheet">
      <div class="cs-topbar">
        <button class="cs-back" aria-label="Close">&#8592;</button>
        <span class="cs-title">Comments</span>
      </div>
      <div class="cs-list" id="csListInner"><div class="cs-loading">Loading…</div></div>
      <form class="cs-input-row" id="csForm">
        <input class="cs-input" type="text" placeholder="Share a thought…" maxlength="500" autocomplete="off" />
        <button class="cs-send" type="submit">Send</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const list = overlay.querySelector("#csListInner");
  const form = overlay.querySelector("#csForm");
  const input = form.querySelector(".cs-input");

  const close = () => overlay.remove();
  overlay.querySelector(".cs-back").addEventListener("click", close);

  async function loadComments() {
    list.innerHTML = `<div class="cs-loading">Loading…</div>`;
    try {
      const comments = await apiGetComments(id);
      if (!comments.length) {
        list.innerHTML = `<div class="cs-loading">No comments yet — be the first!</div>`;
        return;
      }
      list.innerHTML = comments.map(renderCommentItem).join("");
      list.scrollTop = list.scrollHeight;
    } catch {
      list.innerHTML = `<div class="cs-loading">Couldn't load comments.</div>`;
    }
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const btn = form.querySelector(".cs-send");
    btn.disabled = true;
    try {
      await apiPostComment(id, text);
      input.value = "";
      await loadComments();
      // Update the count badge on the originating card
      const ct = card?.querySelector("[data-commentct]");
      if (ct) ct.textContent = parseInt(ct.textContent || "0") + 1;
    } catch (err) {
      toast(err.message || "Couldn't post comment");
    } finally {
      btn.disabled = false;
    }
  });

  await loadComments();
  setTimeout(() => input.focus(), 100);
}

export async function initRender() {
  buildChips();
  await buildFeed(feedEl);
  startDwellTracking(feedEl);

  feedEl.addEventListener("scroll", async () => {
    if (view !== "feed") return;
    const nearEnd = feedEl.scrollTop + feedEl.clientHeight * 2.2 >= feedEl.scrollHeight;
    if (nearEnd) await appendBatch(feedEl);
  });

  feedEl.addEventListener("click", e => {
    const translationBtn = e.target.closest("[data-cycle-translation]");
    if (translationBtn) {
      const next = cyclePreferredTranslation();
      translationBtn.innerHTML = `${next} <span class="translation-hint">tap to change</span>`;
      toast(`Preferred translation: ${next}`);
      return;
    }
    const rev = e.target.closest("[data-reveal]");
    if (rev) {
      const ans = rev.parentElement.querySelector(".answer");
      ans.classList.toggle("show");
      rev.textContent = ans.classList.contains("show") ? "Hide the answer" : "Reveal the answer";
      if (ans.classList.contains("show")) {
        const id = rev.closest(".card").dataset.id;
        recordSignal(id, "reveal");
        markReflected(id);
        engage();
      }
      return;
    }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const card = act.closest(".card");
    const id = card.dataset.id;
    const kind = act.dataset.act;
    if (kind === "like") toggleLike(card, id);
    if (kind === "save") toggleSave(card, id);
    if (kind === "share") shareItem(id);
    if (kind === "explore") openDiscovery(id, feedEl);
    if (kind === "comment") openCommentSheet(id, card);
    if (kind === "more") openMoreMenu(act, id);
  });

  // Floating-emoji reactions: tapping an emoji button spawns a floating glyph
  feedEl.addEventListener("click", e => {
    const btn = e.target.closest("[data-react]");
    if (!btn) return;
    e.stopPropagation();
    spawnFloatingEmoji(btn, btn.dataset.react);
  });

  // No embedded comment forms in cards — comments open in a sheet (openCommentSheet below)

  let lastTap = 0;
  feedEl.addEventListener("click", e => {
    if (e.target.closest("[data-act]") || e.target.closest("[data-reveal]")) return;
    const now = Date.now();
    if (now - lastTap < 320) {
      const card = e.target.closest(".card");
      if (card) {
        const id = card.dataset.id;
        const liked = state.get("liked", {});
        if (!liked[id]) toggleLike(card, id);
        const h = card.querySelector(".heart-pop");
        h.classList.remove("go"); void h.offsetWidth; h.classList.add("go");
      }
    }
    lastTap = now;
  });

  async function switchView(newView) {
    view = newView;
    filtersEl.style.display = view === "feed" ? "flex" : "none";
    closePanel();
    if (view === "feed") await buildFeed(feedEl);
    else if (view === "community") await buildCommunity(feedEl);
    else if (view === "premium") { window.location.href = "/upgrade.html"; return; }
    else await buildProfile(feedEl);
  }

  document.querySelectorAll(".tab").forEach(t => t.onclick = async () => {
    document.querySelectorAll(".tab").forEach(x => {
      const on = x === t;
      x.classList.toggle("active", on);
      if (x.hasAttribute("aria-selected")) x.setAttribute("aria-selected", on ? "true" : "false");
    });
    await switchView(t.dataset.view);
  });

  document.querySelectorAll(".bottom-nav-item[data-view]").forEach(item => {
    item.onclick = async e => {
      e.preventDefault();
      document.querySelectorAll(".bottom-nav-item").forEach(x => x.classList.remove("active"));
      item.classList.add("active");
      await switchView(item.dataset.view);
    };
  });
}

function buildChips() {
  filtersEl.innerHTML = chipsHTML(getFilter());
  filtersEl.querySelectorAll(".chip").forEach(ch => ch.onclick = () => {
    setFilter(ch.dataset.f);
    filtersEl.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === ch));
    if (view === "feed") buildFeed(feedEl);
  });
}
