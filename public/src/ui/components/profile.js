import { getStreak, totalReflections, graphCoverage } from "../../core/retention.js";
import { icon } from "./icons.js";
import { buildAIProfile } from "../../core/aiProfile.js";
import { getSession } from "../../core/authClient.js";
import { showPlanCreator } from "./planCreator.js";

function pillRow(entities) {
  if (!entities.length) return `<p class="ai-empty">Not enough signal yet — like or save a few cards.</p>`;
  return `<div class="pill-row">${entities.map(e => `<span class="pill">${e.label || e}</span>`).join("")}</div>`;
}

function aiProfileHTML() {
  const p = buildAIProfile();
  return `
    <h4 class="profile-subhead">Your AI profile</h4>
    <p class="ai-privacy">${icon("sun", "ai-privacy-ic")} ${p.privacyNote}</p>

    <div class="ai-grid">
      <div class="ai-stat"><div class="ai-stat-lab">Reading speed</div><div class="ai-stat-val">${p.readingSpeed.label}</div></div>
      <div class="ai-stat"><div class="ai-stat-lab">Reflection time</div><div class="ai-stat-val">${p.reflectionTime.label}</div></div>
      <div class="ai-stat"><div class="ai-stat-lab">Difficulty</div><div class="ai-stat-val">${p.difficultyPreference}</div></div>
    </div>
    <div class="ai-stat ai-stat--wide"><div class="ai-stat-lab">Learning style</div><div class="ai-stat-val">${p.learningStyle}</div></div>

    <div class="ai-section"><div class="ai-section-lab">Favorite books</div>${pillRow(p.favoriteBooks)}</div>
    <div class="ai-section"><div class="ai-section-lab">Favorite themes</div>${pillRow(p.favoriteThemes)}</div>
    <div class="ai-section"><div class="ai-section-lab">Favorite historical periods</div>${pillRow(p.favoritePeriods)}</div>
    <div class="ai-section"><div class="ai-section-lab">Favorite historical topics</div>${pillRow(p.favoriteHistoricalTopics)}</div>
    <div class="ai-section"><div class="ai-section-lab">Favorite theologians</div>${pillRow(p.favoriteTheologians)}</div>

    <div class="ai-section">
      <div class="ai-section-lab">Preferred translation</div>
      <button class="translation-chip" data-cycle-translation>${p.preferredTranslation} <span class="translation-hint">tap to change</span></button>
    </div>
  `;
}

function readingPlanHTML(plan) {
  const pct = plan.days > 0 ? Math.round((plan.progress / plan.days) * 100) : 0;
  const items = plan.plan || [];
  return `
    <div class="reading-plan-card" data-plan-id="${plan.id}">
      <div class="plan-header">
        <div class="plan-title">${plan.title}</div>
        <div class="plan-progress-text">${plan.progress}/${plan.days} days</div>
      </div>
      <div class="plan-progress-bar"><div class="plan-progress-fill" style="width:${pct}%"></div></div>
      <div class="plan-days">
        ${items.map(d => `
          <div class="plan-day ${d.day <= plan.progress ? "done" : ""}">
            <div class="plan-day-num">Day ${d.day}</div>
            <div class="plan-day-ref">${d.ref}</div>
            <div class="plan-day-text">${d.text.slice(0, 80)}…</div>
          </div>
        `).join("")}
      </div>
      <button class="plan-advance" data-plan-id="${plan.id}" data-next="${plan.progress + 1}" ${plan.progress >= plan.days ? "disabled" : ""}>
        ${plan.progress >= plan.days ? "Complete ✓" : `Mark day ${plan.progress + 1} done`}
      </button>
    </div>
  `;
}

async function fetchServerData() {
  const session = await getSession();
  if (!session) return null;

  const [streakRes, plansRes, interestsRes, meRes, libraryRes] = await Promise.all([
    fetch("/api/streak", { credentials: "same-origin" }),
    fetch("/api/reading-plans", { credentials: "same-origin" }),
    fetch("/api/interests", { credentials: "same-origin" }),
    fetch("/api/users/me", { credentials: "same-origin" }),
    fetch("/api/library", { credentials: "same-origin" }),
  ]);

  const library = libraryRes.ok ? await libraryRes.json() : null;

  return {
    streak: streakRes.ok ? await streakRes.json() : { current: 0, longest: 0, totalDaysEngaged: 0 },
    plans: plansRes.ok ? await plansRes.json() : [],
    interests: interestsRes.ok ? await interestsRes.json() : [],
    user: meRes.ok ? await meRes.json() : session.user,
    // saved: Bible content the user bookmarked
    savedBible: library?.saved?.filter(i => i.kind === "bible") ?? [],
    // liked: community posts (photos/videos/text) the user liked
    likedPosts: library?.liked?.filter(i => i.kind === "post") ?? [],
  };
}

export async function profileHTML() {
  const localStreak = getStreak();
  const reflections = totalReflections();
  const coverage = graphCoverage();
  const server = await fetchServerData();

  const streakCount = server ? server.streak.current : localStreak.count;
  const longestStreak = server ? server.streak.longest : localStreak.count;
  const totalDays = server ? server.streak.totalDaysEngaged : 0;

  const streakHTML = `
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${streakCount}</div><div class="stat-lab">Day streak</div></div>
      <div class="stat"><div class="stat-num">${longestStreak}</div><div class="stat-lab">Longest</div></div>
      <div class="stat"><div class="stat-num">${totalDays || reflections}</div><div class="stat-lab">${server ? "Days engaged" : "Reflections"}</div></div>
      <div class="stat"><div class="stat-num">${coverage.booksTouched}</div><div class="stat-lab">Books touched</div></div>
    </div>`;

  let plansHTML = "";
  if (server) {
    const planCards = server.plans.length
      ? server.plans.map(p => readingPlanHTML(p)).join("")
      : `<p style="font-size:13px;color:var(--muted)">No plans yet — start one to stay on track.</p>`;
    plansHTML = `
      <h4 class="profile-subhead">Reading plans</h4>
      <div class="reading-plans-list">
        ${planCards}
      </div>
      <button class="plan-advance" id="new-plan-btn" style="margin-top:10px;background:var(--glass-fill);color:var(--ink);border:1px solid var(--glass-border)">
        + Start a new reading plan
      </button>`;
  }

  let interestsHTML = "";
  if (server && server.interests.length > 0) {
    interestsHTML = `
      <h4 class="profile-subhead">Your interests</h4>
      <div class="interests-list">
        ${server.interests.map(i => `<span class="pill">${i.label}</span>`).join("")}
      </div>`;
  }

  let userInfoHTML = "";
  if (server?.user) {
    const u = server.user;
    const name = u.displayName || u.name || u.email;
    const avatar = u.avatarUrl
      ? `<img class="profile-avatar" src="${u.avatarUrl}" alt="" />`
      : `<div class="profile-avatar profile-avatar--placeholder">${(name || "A")[0].toUpperCase()}</div>`;
    userInfoHTML = `
      <div class="profile-user">
        ${avatar}
        <div class="profile-user-text">
          <div class="profile-name">${name}</div>
          ${u.bio ? `<div class="profile-bio">${u.bio}</div>` : ""}
        </div>
        <button id="edit-profile-btn" class="edit-profile-btn">Edit</button>
      </div>`;
  }

  // Liked community posts from the server; fall back to empty for guests
  const likedPosts = server?.likedPosts ?? [];

  const savedHTML = likedPosts.length
    ? likedPosts.map(p => {
        const author = p.user?.displayName || "Someone";
        const caption = p.caption ? p.caption.slice(0, 100) + (p.caption.length > 100 ? "…" : "") : "";
        let mediaBadge = "";
        if (p.mediaType === "video" && (p.thumbnailUrl || p.mediaUrl)) {
          mediaBadge = `<div class="profile-saved-thumb" style="background-image:url('${p.thumbnailUrl || p.mediaUrl}')">
            <div class="profile-saved-play">▶</div>
          </div>`;
        } else if (p.mediaType === "photo" && p.mediaUrl) {
          mediaBadge = `<div class="profile-saved-thumb" style="background-image:url('${p.mediaUrl}')"></div>`;
        }
        return `<div class="profile-saved-post">
          ${mediaBadge}
          <div class="profile-saved-post-body">
            <div class="profile-saved-post-author">${author}</div>
            <div class="profile-saved-post-caption">${caption || "(no caption)"}</div>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty">
        <div class="big">${icon("heartOutline")}</div>
        <h3>No liked posts yet</h3>
        <p>Like posts in the Community tab and they'll appear here.</p>
      </div>`;

  return `<div class="profile">
    ${userInfoHTML}
    ${streakHTML}
    ${plansHTML}
    ${interestsHTML}
    ${aiProfileHTML()}
    <h4 class="profile-subhead">Liked Posts</h4>
    <div class="profile-saved-list">${savedHTML}</div>
  </div>`;
}
