import { profileHTML } from "../../ui/components/profile.js";
import { showPlanCreator } from "../../ui/components/planCreator.js";
import { showEditProfile } from "../../ui/components/editProfile.js";

export async function buildProfile(feedEl) {
  feedEl.innerHTML = await profileHTML();
  feedEl.scrollTop = 0;

  // Wire up reading plan "mark day done" buttons
  feedEl.querySelectorAll(".plan-advance[data-plan-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const planId = btn.dataset.planId;
      const next = parseInt(btn.dataset.next);
      btn.disabled = true;
      btn.textContent = "Updating…";
      await fetch(`/api/reading-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ progress: next }),
      });
      await buildProfile(feedEl);
    });
  });

  // Wire up "Start a new reading plan" button
  const newPlanBtn = feedEl.querySelector("#new-plan-btn");
  if (newPlanBtn) {
    newPlanBtn.addEventListener("click", () => {
      showPlanCreator(() => buildProfile(feedEl));
    });
  }

  // Wire up "Edit profile" button
  const editBtn = feedEl.querySelector("#edit-profile-btn");
  if (editBtn) {
    editBtn.addEventListener("click", async () => {
      const res = await fetch("/api/users/me", { credentials: "same-origin" });
      if (!res.ok) return;
      const me = await res.json();
      showEditProfile(me, () => buildProfile(feedEl));
    });
  }
}
