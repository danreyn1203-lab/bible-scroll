import { entitiesOf } from "../../data/graph.js";
import { suggestCrossReferences, explainHistory, generateStudyPlan, generateQuiz, generateDevotional, PremiumRequiredError, AIComingSoonError } from "../../core/ai/aiClient.js";
import { continueLearning, flagStubInterest } from "../../core/discoveryEngine.js";
import { recordSignal } from "../../core/engine.js";
import { state } from "../../core/state.js";
import { toast } from "./toast.js";
import { icon } from "./icons.js";

let panelEl;
function ensurePanel() {
  if (panelEl) return panelEl;
  panelEl = document.createElement("div");
  panelEl.className = "panel";
  panelEl.innerHTML = `<div class="panel-sheet">
    <button class="panel-close" data-panel-close>Close</button>
    <div class="panel-body"></div>
  </div>`;
  document.body.appendChild(panelEl);
  panelEl.addEventListener("click", e => {
    if (e.target === panelEl || e.target.closest("[data-panel-close]")) closePanel();
  });
  return panelEl;
}

export function closePanel() {
  if (panelEl) panelEl.classList.remove("show");
}

const KIND_ICON = { content: "scroll", entity: "compass", stub: "sparkle" };

export async function openExplorePanel(contentId, onJump) {
  const el = ensurePanel();
  const ents = entitiesOf(contentId);
  const continueItems = continueLearning(contentId, 7);

  const entityChips = ents.map(e =>
    `<button class="tag-chip" data-jump-entity="${e.id}">${e.label}</button>`
  ).join("");

  const continueHTML = continueItems.length
    ? `<div class="continue-row">${continueItems.map(c =>
        `<button class="continue-chip ${c.kind === "stub" ? "continue-chip--stub" : ""}"
            data-continue-kind="${c.kind}" data-continue-ref="${c.ref}">
          ${icon(KIND_ICON[c.kind] || "compass", "continue-ic")}<span>${c.label}</span>
        </button>`).join("")}</div>`
    : "";

  // Show panel instantly — cross-refs load in background below
  el.querySelector(".panel-body").innerHTML = `
    <h3>Explore further</h3>

    <h4>AI Tools</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
      <button class="panel-ai-btn" data-ai="chat" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:10px;cursor:pointer;color:var(--ink);transition:all .2s;">
        <span style="font-size:20px;">💬</span>
        <span style="font-size:12px;font-weight:600;">Chat / Q&A</span>
        <span style="font-size:10px;color:var(--muted);">Ask a question</span>
      </button>
      <button class="panel-ai-btn" data-ai="devotional" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:10px;cursor:pointer;color:var(--ink);transition:all .2s;">
        <span style="font-size:20px;">🕊️</span>
        <span style="font-size:12px;font-weight:600;">Devotional</span>
        <span style="font-size:10px;color:var(--muted);">AI reflection</span>
      </button>
      <button class="panel-ai-btn" data-ai="quiz" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:10px;cursor:pointer;color:var(--ink);transition:all .2s;">
        <span style="font-size:20px;">❓</span>
        <span style="font-size:12px;font-weight:600;">Quiz</span>
        <span style="font-size:10px;color:var(--muted);">Test your knowledge</span>
      </button>
      <button class="panel-ai-btn" data-ai="studyplan" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;background:rgba(255,255,255,.04);border:1px solid var(--glass-border);border-radius:10px;cursor:pointer;color:var(--ink);transition:all .2s;">
        <span style="font-size:20px;">📚</span>
        <span style="font-size:12px;font-weight:600;">Study Plan</span>
        <span style="font-size:10px;color:var(--muted);">5-day deep dive</span>
      </button>
    </div>
    <div id="panel-ai-output" style="display:none;padding:14px;background:rgba(255,255,255,.03);border:1px solid var(--glass-border);border-radius:10px;font-size:13px;line-height:1.6;color:var(--ink);margin-bottom:16px;white-space:pre-wrap;"></div>

    ${continueHTML ? `<h4>Continue learning</h4>${continueHTML}` : ""}
    <h4>Topics on this card</h4>
    <p style="font-size:11px;color:var(--muted);margin:-8px 0 8px;">Tap a topic to get an AI explanation</p>
    <div class="tag-row">${entityChips}</div>
    <h4>Related</h4>
    <div class="related-list" id="panel-related"><span style="color:var(--muted);font-size:13px;">Loading…</span></div>
  `;
  el.classList.add("show");

  // Load cross-refs in background after panel is visible
  suggestCrossReferences(contentId).then(crossRefs => {
    const related = crossRefs.filter(c => c.id !== contentId).slice(0, 4);
    const relatedEl = el.querySelector("#panel-related");
    if (!relatedEl) return;
    relatedEl.innerHTML = related.length
      ? related.map(r => `<button class="related-item" data-jump-content="${r.id}">
          <span class="related-ref">${r.ref}</span>
          <span class="related-snippet">${r.text.replace(/<[^>]+>/g, "").slice(0, 90)}…</span>
        </button>`).join("")
      : `<p class="panel-empty">No cross-references found — try a topic tag above.</p>`;
    relatedEl.querySelectorAll("[data-jump-content]").forEach(btn => {
      btn.onclick = () => { closePanel(); onJump?.(btn.dataset.jumpContent); };
    });
  }).catch(() => {
    const relatedEl = el.querySelector("#panel-related");
    if (relatedEl) relatedEl.innerHTML = `<p class="panel-empty" style="color:var(--muted);">Cross-references unavailable.</p>`;
  });

  // AI tool buttons
  const aiOutput = el.querySelector("#panel-ai-output");
  const firstEntityId = ents[0]?.id ?? null;
  el.querySelectorAll(".panel-ai-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const tool = btn.dataset.ai;
      aiOutput.style.display = "block";
      aiOutput.textContent = "Thinking…";
      try {
        if (tool === "chat") {
          const q = prompt("Ask anything about this passage or topic:");
          if (!q) { aiOutput.style.display = "none"; return; }
          const res = await (await import("../../core/ai/aiClient.js")).chat(q);
          aiOutput.textContent = res.text ?? JSON.stringify(res);
        } else if (tool === "devotional" && firstEntityId) {
          const res = await generateDevotional(firstEntityId);
          aiOutput.innerHTML = `<strong>${res.title}</strong><br><br>${res.body}<br><br><em>Readings: ${(res.readings||[]).join(", ")}</em>`;
        } else if (tool === "quiz" && firstEntityId) {
          const res = await generateQuiz(firstEntityId);
          aiOutput.innerHTML = res.map((q, i) =>
            `<div style="margin-bottom:12px;"><strong>Q${i+1}: ${q.question}</strong><br><span style="color:var(--muted);">A: ${q.answer}</span></div>`
          ).join("") || "No quiz available for this topic.";
        } else if (tool === "studyplan" && firstEntityId) {
          const res = await generateStudyPlan(firstEntityId, 5);
          aiOutput.innerHTML = `<strong>5-Day Study Plan</strong><br><br>` + (res.map((d, i) =>
            `<div style="margin-bottom:8px;"><strong>Day ${i+1}:</strong> ${d.ref ?? d.contentId ?? JSON.stringify(d)}</div>`
          ).join("") || "No plan available.");
        } else {
          aiOutput.textContent = "Tap a topic tag first, then try again.";
        }
      } catch (err) {
        if (err instanceof PremiumRequiredError) {
          aiOutput.innerHTML = `
            <div style="text-align:center;padding:8px 0">
              <div style="font-size:28px;margin-bottom:10px">✦</div>
              <div style="font-weight:700;font-size:14px;color:var(--ink);margin-bottom:6px">Sign in to continue</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.5">AI Chat, Devotionals, Quizzes and Study Plans are free — just sign in to use them.</div>
            </div>`;
        } else if (err instanceof AIComingSoonError) {
          aiOutput.innerHTML = `
            <div style="text-align:center;padding:8px 0">
              <div style="font-size:28px;margin-bottom:10px">✦</div>
              <div style="font-weight:700;font-size:14px;color:var(--ink);margin-bottom:6px">Coming soon</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.5">AI Chat, Devotionals, Quizzes and Study Plans are on the way — check back soon.</div>
            </div>`;
        } else {
          aiOutput.innerHTML = `
            <div style="text-align:center;padding:8px 0">
              <div style="font-size:28px;margin-bottom:10px">✦</div>
              <div style="font-weight:700;font-size:14px;color:var(--ink);margin-bottom:6px">Coming soon</div>
              <div style="font-size:12px;color:var(--muted);line-height:1.5">This feature isn't available yet — check back soon.</div>
            </div>`;
        }
      }
    });
  });

  el.querySelectorAll("[data-jump-content]").forEach(btn => {
    btn.onclick = () => { closePanel(); onJump?.(btn.dataset.jumpContent); };
  });
  el.querySelectorAll("[data-jump-entity]").forEach(btn => {
    btn.onclick = async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "Loading…";
      try {
        const summary = await explainHistory(btn.dataset.jumpEntity);
        btn.insertAdjacentHTML("afterend", `<div class="entity-summary">${summary}</div>`);
      } catch (_) {
        btn.insertAdjacentHTML("afterend", `<div class="entity-summary" style="color:var(--muted)">Couldn't load — try again.</div>`);
      }
      btn.disabled = false;
    };
  });
  el.querySelectorAll("[data-continue-ref]").forEach(btn => {
    btn.onclick = async () => {
      const kind = btn.dataset.continueKind;
      const ref = btn.dataset.continueRef;
      if (kind === "content") {
        closePanel();
        onJump?.(ref);
      } else if (kind === "entity") {
        recordSignal(contentId, "reveal", 0.5); // soft signal: curiosity about an adjacent topic
        if (btn.disabled) return;
        btn.disabled = true;
        const summary = await explainHistory(ref);
        btn.insertAdjacentHTML("afterend", `<div class="entity-summary">${summary}</div>`);
      } else {
        flagStubInterest(ref);
        state.update("stubInterest", {}, m => ({ ...m, [ref]: (m[ref] || 0) + 1 }));
        toast("Coming soon — we've noted your interest ✦");
      }
    };
  });
}
