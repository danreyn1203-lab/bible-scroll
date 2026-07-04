// Interest survey — shown right after sign-up. Fetches real topics from the
// database and saves the user's choices via the /api/interests endpoint.
// This drives personalized feed ordering.

export async function showOnboarding(onDone) {
  const el = document.getElementById("welcome");
  if (!el) { onDone?.(); return; }

  const res = await fetch("/api/onboarding/topics");
  const topics = await res.json();

  const grouped = {};
  for (const t of topics) {
    const g = t.type.charAt(0).toUpperCase() + t.type.slice(1) + "s";
    (grouped[g] = grouped[g] || []).push(t);
  }

  el.innerHTML = `
    <div class="welcome-overlay">
      <div class="welcome-sheet onboarding-sheet">
        <div class="welcome-logo">✦</div>
        <h1>What interests you?</h1>
        <p class="welcome-sub">Pick a few topics so your feed feels personal. You can change these anytime.</p>
        <div class="onboarding-groups">
          ${Object.entries(grouped).map(([group, items]) => `
            <div class="onboarding-group">
              <div class="onboarding-group-label">${group}</div>
              <div class="onboarding-chips">
                ${items.map(t => `
                  <button class="onboarding-chip" data-entity-id="${t.id}" title="${t.summary}">
                    ${t.label}
                  </button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        <div class="onboarding-survey">
          <div class="onboarding-survey-label">A little about you (all optional)</div>
          <div class="onboarding-survey-row">
            <label class="onboarding-field">
              <span>Full name</span>
              <input type="text" id="ob-name" placeholder="e.g. John Smith" maxlength="100" />
            </label>
            <label class="onboarding-field">
              <span>Date of birth</span>
              <input type="date" id="ob-dob" />
            </label>
          </div>
          <div class="onboarding-survey-row">
            <label class="onboarding-field">
              <span>City</span>
              <input type="text" id="ob-city" placeholder="e.g. Austin" maxlength="80" />
            </label>
            <label class="onboarding-field">
              <span>&nbsp;</span>
              <div style="opacity: 0; pointer-events: none;">.</div>
            </label>
          </div>
          <div class="onboarding-survey-row">
            <label class="onboarding-field">
              <span>Tradition</span>
              <select id="ob-denomination">
                <option value="">Prefer not to say</option>
                <option value="Catholic">Catholic</option>
                <option value="Protestant">Protestant</option>
                <option value="Orthodox">Orthodox</option>
                <option value="Evangelical">Evangelical</option>
                <option value="Non-denominational">Non-denominational</option>
                <option value="Other">Other</option>
                <option value="Seeking">Still seeking</option>
              </select>
            </label>
            <label class="onboarding-field">
              <span>Do you attend a church?</span>
              <select id="ob-attends">
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">Not currently</option>
              </select>
            </label>
          </div>
          <div class="onboarding-church-suggest" id="ob-church-suggest" hidden>
            <p>🕊️ Looking for a community to grow with? Visiting a nearby church is a great first step. <a id="ob-church-link" href="https://www.churchfinder.com" target="_blank" rel="noopener">Find a church near you →</a></p>
          </div>
          <p class="onboarding-privacy">We use this to recommend content. It's never sold or shared. You can edit or remove it anytime in your account.</p>
        </div>
        <button class="welcome-cta" id="onboarding-done" disabled>Continue</button>
        <button class="welcome-skip" id="onboarding-skip">Skip for now</button>
      </div>
    </div>
  `;

  function refreshChurchSuggestion() {
    const attends = el.querySelector("#ob-attends").value;
    const city = el.querySelector("#ob-city").value.trim();
    const box = el.querySelector("#ob-church-suggest");
    box.hidden = attends !== "no";
    const link = el.querySelector("#ob-church-link");
    if (city) {
      link.href = `https://www.google.com/search?q=${encodeURIComponent("churches near " + city)}`;
      link.textContent = `Find a church near ${city} →`;
    } else {
      link.href = "https://www.churchfinder.com";
      link.textContent = "Find a church near you →";
    }
  }
  el.querySelector("#ob-attends").addEventListener("change", refreshChurchSuggestion);
  el.querySelector("#ob-city").addEventListener("input", refreshChurchSuggestion);

  const selected = new Set();
  const doneBtn = el.querySelector("#onboarding-done");

  el.querySelectorAll(".onboarding-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const id = chip.dataset.entityId;
      if (selected.has(id)) {
        selected.delete(id);
        chip.classList.remove("selected");
      } else {
        selected.add(id);
        chip.classList.add("selected");
      }
      doneBtn.disabled = selected.size === 0;
      doneBtn.textContent = selected.size ? `Continue (${selected.size} selected)` : "Continue";
    });
  });

  function close() {
    el.querySelector(".welcome-overlay")?.classList.add("welcome-out");
    setTimeout(() => { el.innerHTML = ""; onDone?.(); }, 350);
  }

  doneBtn.addEventListener("click", async () => {
    doneBtn.disabled = true;
    doneBtn.textContent = "Saving…";
    await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ entityIds: [...selected] }),
    });
    const attends = el.querySelector("#ob-attends").value;
    const dobVal = el.querySelector("#ob-dob").value;
    let age = null;
    if (dobVal) {
      const dob = new Date(dobVal);
      age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      age = age >= 13 && age <= 120 ? age : null;
    }
    const profile = {
      displayName: el.querySelector("#ob-name").value.trim() || null,
      age: age,
      city: el.querySelector("#ob-city").value.trim() || null,
      denomination: el.querySelector("#ob-denomination").value || null,
      attendsChurch: attends === "yes" ? true : attends === "no" ? false : null,
    };
    if (profile.displayName || profile.age || profile.city || profile.denomination || profile.attendsChurch !== null) {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(profile),
      }).catch(() => {});
    }
    close();
  });

  el.querySelector("#onboarding-skip")?.addEventListener("click", close);
}
