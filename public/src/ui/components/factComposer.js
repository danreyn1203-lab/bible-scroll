// Composer for user-authored "facts" that pin to the top of the For You feed.
// Fancy version: live card preview, category picker, character counter.
import { CATS } from "../../data/graph.js";
import { addUserFact, FACT_CATEGORIES } from "../../core/userFacts.js";
import { icon } from "./icons.js";
import { toast } from "./toast.js";

const CAT_ICON = { verse: "scroll", history: "compass", theology: "thought", catechism: "question", funfact: "sparkle" };
const MAX = 600;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function showFactComposer(onSaved) {
  const overlay = document.createElement("div");
  overlay.className = "fc-overlay";
  overlay.innerHTML = `
    <div class="fc-sheet" role="dialog" aria-modal="true" aria-label="Create a fact">
      <div class="fc-head">
        <div class="fc-head-icon">${icon("sparkle")}</div>
        <div class="fc-head-text">
          <h3 class="fc-title">Create a fact</h3>
          <p class="fc-sub">Pin your own insight to the top of <strong>For You</strong></p>
        </div>
        <button class="fc-close" aria-label="Close">×</button>
      </div>

      <div class="fc-preview" id="fc-preview">
        <div class="fc-preview-glow"></div>
        <span class="fc-preview-kicker" id="fc-prev-kicker"></span>
        <div class="fc-preview-text" id="fc-prev-text"></div>
        <div class="fc-preview-ref" id="fc-prev-ref"></div>
        <span class="fc-preview-tag">Live preview</span>
      </div>

      <label class="fc-label">Category</label>
      <div class="fc-cats" id="fc-cats">
        ${FACT_CATEGORIES.map((k, i) =>
          `<button type="button" class="fc-cat ${i === FACT_CATEGORIES.length - 1 ? "active" : ""}" data-cat="${k}">
             ${icon(CAT_ICON[k], "fc-cat-ic")}<span>${CATS[k].label}</span>
           </button>`).join("")}
      </div>

      <label class="fc-label" for="fc-text">Your fact</label>
      <div class="fc-textwrap">
        <textarea class="fc-text" id="fc-text" rows="4" maxlength="${MAX}"
          placeholder="Share a verse, a fact, or something you're learning…"></textarea>
        <span class="fc-counter" id="fc-counter">0 / ${MAX}</span>
      </div>

      <label class="fc-label" for="fc-ref">Reference <span class="fc-optional">optional</span></label>
      <input class="fc-ref" id="fc-ref" type="text" maxlength="120" placeholder="e.g. John 3:16 or a source" />

      <div class="fc-actions">
        <button class="fc-cancel" type="button">Cancel</button>
        <button class="fc-submit" type="button" disabled>${icon("sparkle", "fc-submit-ic")} Add to feed</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));

  const text = overlay.querySelector("#fc-text");
  const refInput = overlay.querySelector("#fc-ref");
  const submit = overlay.querySelector(".fc-submit");
  const counter = overlay.querySelector("#fc-counter");
  const cats = overlay.querySelector("#fc-cats");
  const preview = overlay.querySelector("#fc-preview");
  const prevKicker = overlay.querySelector("#fc-prev-kicker");
  const prevText = overlay.querySelector("#fc-prev-text");
  const prevRef = overlay.querySelector("#fc-prev-ref");
  let category = FACT_CATEGORIES[FACT_CATEGORIES.length - 1]; // default: funfact

  const close = () => { overlay.classList.remove("show"); setTimeout(() => overlay.remove(), 220); };
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  overlay.querySelector(".fc-close").addEventListener("click", close);
  overlay.querySelector(".fc-cancel").addEventListener("click", close);
  document.addEventListener("keydown", function onKey(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
  });

  function renderPreview() {
    const cat = CATS[category];
    preview.style.setProperty("--grad", cat.grad);
    prevKicker.innerHTML = `${icon(CAT_ICON[category], "fc-cat-ic")} ${cat.label}`;
    const val = text.value.trim();
    prevText.textContent = val || "Your fact will appear here…";
    prevText.classList.toggle("is-placeholder", !val);
    prevText.classList.toggle("is-verse", category === "verse");
    const ref = refInput.value.trim();
    prevRef.textContent = ref || "Your note";
  }

  cats.addEventListener("click", e => {
    const btn = e.target.closest(".fc-cat");
    if (!btn) return;
    cats.querySelectorAll(".fc-cat").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    category = btn.dataset.cat;
    renderPreview();
  });

  text.addEventListener("input", () => {
    submit.disabled = !text.value.trim();
    counter.textContent = `${text.value.length} / ${MAX}`;
    renderPreview();
  });
  refInput.addEventListener("input", renderPreview);

  submit.addEventListener("click", () => {
    const fact = addUserFact({ text: text.value, ref: refInput.value, category });
    if (!fact) return;
    close();
    toast("Added to your feed ✦");
    onSaved?.(fact);
  });

  renderPreview();
  setTimeout(() => text.focus(), 60);
}
