// UI for creating a new reading plan — shows a topic picker, then generates
// and saves a plan via the API.

export async function showPlanCreator(onDone) {
  const el = document.getElementById("welcome");
  if (!el) return;

  const res = await fetch("/api/onboarding/topics");
  const topics = await res.json();

  el.innerHTML = `
    <div class="welcome-overlay">
      <div class="welcome-sheet onboarding-sheet">
        <div class="welcome-logo">✦</div>
        <h1>Start a reading plan</h1>
        <p class="welcome-sub">Pick a topic and we'll generate a multi-day plan from the knowledge graph.</p>
        <div class="onboarding-chips" style="max-height:35vh;overflow-y:auto;padding:4px 0">
          ${topics.map(t => `
            <button class="onboarding-chip" data-entity-id="${t.id}" title="${t.summary}">
              ${t.label}
            </button>
          `).join("")}
        </div>
        <div class="plan-days-picker" style="margin:14px 0;display:flex;align-items:center;gap:10px">
          <label style="font-size:13px;color:var(--muted)">Days:</label>
          <select id="plan-days" style="background:var(--glass-fill);border:1px solid var(--glass-border);
            color:var(--ink);padding:8px 12px;border-radius:10px;font-size:14px">
            <option value="3">3</option>
            <option value="5" selected>5</option>
            <option value="7">7</option>
          </select>
        </div>
        <button class="welcome-cta" id="plan-create" disabled>Create plan</button>
        <button class="welcome-skip" id="plan-cancel">Cancel</button>
      </div>
    </div>
  `;

  let selectedId = null;
  const createBtn = el.querySelector("#plan-create");

  el.querySelectorAll(".onboarding-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      el.querySelectorAll(".onboarding-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedId = chip.dataset.entityId;
      createBtn.disabled = false;
    });
  });

  function close() {
    el.querySelector(".welcome-overlay")?.classList.add("welcome-out");
    setTimeout(() => { el.innerHTML = ""; onDone?.(); }, 350);
  }

  createBtn.addEventListener("click", async () => {
    if (!selectedId) return;
    createBtn.disabled = true;
    createBtn.textContent = "Generating plan…";
    const days = parseInt(el.querySelector("#plan-days").value);
    await fetch("/api/reading-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ entityId: selectedId, days }),
    });
    close();
  });

  el.querySelector("#plan-cancel")?.addEventListener("click", close);
}
