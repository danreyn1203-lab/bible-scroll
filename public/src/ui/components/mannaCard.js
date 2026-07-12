// "Manna card" — a Wikipedia-style profile for a person/place/topic in the
// knowledge graph. Rich bio + the readings they appear in + connected figures
// and topics you can click straight through to (the graph makes it a wiki).

import { entityIndex, contentIndex, neighbors, contentLinkedTo } from "../../data/graph.js";
import { ENTITY_TYPES } from "../../data/entities.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let overlayEl = null;
let stack = [];       // navigation history of entity ids (for the Back button)
let onJumpContent = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "manna-overlay";
  overlayEl.innerHTML = `<div class="manna-card" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(overlayEl);
  overlayEl.addEventListener("click", e => { if (e.target === overlayEl) closeMannaCard(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlayEl?.classList.contains("show")) closeMannaCard(); });
  return overlayEl;
}

export function closeMannaCard() {
  overlayEl?.classList.remove("show");
  stack = [];
}

/**
 * Open the Manna card for an entity.
 * @param {string} entityId
 * @param {{onJump?: (contentId:string)=>void, _back?: boolean}} [opts]
 */
export function openMannaCard(entityId, opts = {}) {
  const e = entityIndex.get(entityId);
  if (!e) return;
  if (opts.onJump) onJumpContent = opts.onJump;
  if (!opts._back) stack.push(entityId);

  const el = ensureOverlay();
  const card = el.querySelector(".manna-card");
  const typeInfo = ENTITY_TYPES[e.type] || { label: "Topic", icon: "✦" };

  const appearsIn = contentLinkedTo(entityId);
  const appearsHTML = appearsIn.length
    ? appearsIn.map(c => `
        <button class="manna-reading" data-jump="${esc(c.id)}">
          <span class="manna-reading-ref">${esc(c.ref)}</span>
          <span class="manna-reading-text">${esc(c.text.replace(/<[^>]+>/g, "").slice(0, 110))}…</span>
        </button>`).join("")
    : `<p class="manna-empty">No readings yet — search or explore to add connections.</p>`;

  // Connected entities: graph neighbors that are themselves entities.
  const connected = neighbors(entityId)
    .map(id => entityIndex.get(id))
    .filter(Boolean)
    .filter(n => n.id !== entityId);
  // People first, then places/events, then everything else — feels more "who's who".
  const order = { person: 0, place: 1, event: 2, artifact: 3 };
  connected.sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5) || a.label.localeCompare(b.label));
  const connectedHTML = connected.length
    ? `<div class="manna-links">${connected.slice(0, 16).map(n => {
        const ti = ENTITY_TYPES[n.type] || { icon: "✦" };
        return `<button class="manna-link" data-entity="${esc(n.id)}"><span>${ti.icon}</span>${esc(n.label)}</button>`;
      }).join("")}</div>`
    : `<p class="manna-empty">No connections yet.</p>`;

  const facts = [];
  if (e.also) facts.push(`<span class="manna-fact"><span class="manna-fact-k">Also</span>${esc(e.also)}</span>`);
  if (e.era) facts.push(`<span class="manna-fact"><span class="manna-fact-k">Era</span>${esc(e.era)}</span>`);

  card.innerHTML = `
    <div class="manna-topbar">
      ${stack.length > 1 ? `<button class="manna-back" data-back>← Back</button>` : `<span></span>`}
      <button class="manna-close" data-close aria-label="Close">×</button>
    </div>
    <div class="manna-head">
      <div class="manna-avatar">${typeInfo.icon}</div>
      <div>
        <div class="manna-kind">${esc(typeInfo.label)}</div>
        <h2 class="manna-name">${esc(e.label)}</h2>
      </div>
    </div>
    ${facts.length ? `<div class="manna-facts">${facts.join("")}</div>` : ""}
    <p class="manna-bio">${esc(e.bio || e.summary)}</p>

    <div class="manna-section-label">Appears in these readings</div>
    <div class="manna-readings">${appearsHTML}</div>

    <div class="manna-section-label">Connected people, places &amp; topics</div>
    ${connectedHTML}
  `;

  card.scrollTop = 0;
  el.classList.add("show");

  card.querySelector("[data-close]").onclick = closeMannaCard;
  const backBtn = card.querySelector("[data-back]");
  if (backBtn) backBtn.onclick = () => {
    stack.pop();                       // current
    const prev = stack[stack.length - 1];
    if (prev) openMannaCard(prev, { _back: true });
  };
  card.querySelectorAll("[data-entity]").forEach(b => {
    b.onclick = () => openMannaCard(b.dataset.entity);
  });
  card.querySelectorAll("[data-jump]").forEach(b => {
    b.onclick = () => {
      const id = b.dataset.jump;
      closeMannaCard();
      if (onJumpContent) { onJumpContent(id); return; }
      // Fallback: scroll to the card in the feed if it's on the page.
      const inFeed = document.querySelector(`.feed [data-id="${CSS.escape(id)}"]`);
      if (inFeed) inFeed.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.href = "/index.html";
    };
  });
}
