// Admin dashboard for Simply Manna — staff-only.
// Tabs: Overview (stats), Moderation (comments + reports), Users, Health.

const root = document.getElementById("admin-root");

let me = null;
let currentTab = "overview";

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function init() {
  try {
    me = await api("/api/users/me");
  } catch {
    return renderSigninPrompt();
  }
  // Staff check happens server-side, but we ping /api/admin/stats to confirm + cache
  try {
    await api("/api/admin/stats");
  } catch (err) {
    return renderForbidden(err.message);
  }
  renderShell();
}

function renderSigninPrompt() {
  root.innerHTML = `
    <div class="signin-prompt">
      <h2>Admin access required</h2>
      <p>You must be signed in as a moderator or admin to view this page.</p>
      <p><a href="/index.html">← Back to Simply Manna</a></p>
    </div>
  `;
}

function renderForbidden(msg) {
  root.innerHTML = `
    <div class="signin-prompt">
      <h2>Access denied</h2>
      <p>${escapeHtml(msg)}</p>
      <p><a href="/index.html">← Back to Simply Manna</a></p>
    </div>
  `;
}

function renderShell() {
  root.innerHTML = `
    <div class="admin-header">
      <h1>Simply Manna · Admin</h1>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span id="admin-refresh-badge" style="font-size:11px;color:rgba(255,255,255,.4);"></span>
        <button class="btn" id="admin-refresh-btn" title="Refresh now">↻ Refresh</button>
        <span class="role-badge">${escapeHtml(me.email)}</span>
        <a href="/index.html" class="btn" style="margin-left: 4px;">← Back to app</a>
      </div>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab" data-tab="overview">Overview</button>
      <button class="admin-tab" data-tab="moderation">Moderation</button>
      <button class="admin-tab" data-tab="reports">Reports</button>
      <button class="admin-tab" data-tab="users">Users</button>
      <button class="admin-tab" data-tab="applications">Applications</button>
      <button class="admin-tab" data-tab="trending">Trending</button>
      <button class="admin-tab" data-tab="ads">Ads</button>
      <button class="admin-tab" data-tab="health">Health</button>
    </div>
    <div id="panel-overview" class="panel"></div>
    <div id="panel-moderation" class="panel"></div>
    <div id="panel-reports" class="panel"></div>
    <div id="panel-users" class="panel"></div>
    <div id="panel-applications" class="panel"></div>
    <div id="panel-trending" class="panel"></div>
    <div id="panel-ads" class="panel"></div>
    <div id="panel-health" class="panel"></div>
  `;
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.getElementById("admin-refresh-btn").addEventListener("click", () => loadCurrentTab());
  switchTab("overview");
}

let autoRefreshTimer = null;
const REFRESH_INTERVAL = 30_000; // 30 seconds

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === `panel-${tab}`));
  loadCurrentTab();
  clearInterval(autoRefreshTimer);
  // Auto-refresh live tabs (not users — too disruptive while searching)
  if (["overview", "moderation", "reports", "trending", "health"].includes(tab)) {
    autoRefreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") loadCurrentTab();
    }, REFRESH_INTERVAL);
  }
}

function loadCurrentTab() {
  updateRefreshBadge();
  if (currentTab === "overview") loadOverview();
  else if (currentTab === "moderation") loadModeration();
  else if (currentTab === "reports") loadReports();
  else if (currentTab === "users") loadUsers();
  else if (currentTab === "applications") loadApplications();
  else if (currentTab === "trending") loadTrending();
  else if (currentTab === "ads") loadAds();
  else if (currentTab === "health") loadHealth();
}

function updateRefreshBadge() {
  const badge = document.getElementById("admin-refresh-badge");
  if (badge) badge.textContent = `Updated ${new Date().toLocaleTimeString()}`;
}

async function loadApplications() {
  const panel = document.getElementById("panel-applications");
  panel.innerHTML = `<div class="empty">Loading applications…</div>`;
  try {
    const { applications } = await api("/api/admin/applications?status=pending");
    if (!applications.length) {
      panel.innerHTML = `<div class="empty">No pending applications. Share <code>/apply-moderator.html</code> to recruit help.</div>`;
      return;
    }
    panel.innerHTML = `
      <table>
        <thead><tr><th>Applicant</th><th>Age</th><th>Experience</th><th>Why they want to help</th><th>Submitted</th><th>Actions</th></tr></thead>
        <tbody>
          ${applications.map(a => `
            <tr>
              <td>${escapeHtml(a.name)}<div class="meta">${escapeHtml(a.email)}</div></td>
              <td>${a.age ?? "—"}</td>
              <td class="comment-text">${escapeHtml(a.experience).slice(0, 200)}…</td>
              <td class="comment-text">${escapeHtml(a.whyJoin).slice(0, 200)}…</td>
              <td class="meta">${new Date(a.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn primary" data-act="approve-app" data-id="${a.id}">Approve</button>
                <button class="btn danger" data-act="reject-app" data-id="${a.id}">Reject</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    panel.querySelectorAll("[data-act]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.act === "approve-app" ? "approve" : "reject";
        try {
          await api(`/api/admin/applications/${btn.dataset.id}`, { method: "PATCH", body: JSON.stringify({ action }) });
          loadApplications();
        } catch (e) { alert(e.message); }
      });
    });
  } catch (e) {
    panel.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`;
  }
}

async function loadTrending() {
  const panel = document.getElementById("panel-trending");
  panel.innerHTML = `<div class="empty">Computing scores…</div>`;
  try {
    const t = await api("/api/admin/trending");
    panel.innerHTML = `
      <h3 style="color:#c9a14a;margin-top:8px">🔥 Trending posts</h3>
      <table>
        <thead><tr><th>Preview</th><th>Author</th><th>Caption</th><th>Type</th><th>Likes</th><th>Comments</th><th>Score</th></tr></thead>
        <tbody>${t.trendingPosts.map(p => `
          <tr>
            <td>${p.thumbnailUrl ? `<img src="${escapeHtml(p.thumbnailUrl)}" style="width:56px;height:40px;object-fit:cover;border-radius:4px;" />` : p.mediaType === "video" ? "🎥" : p.mediaType === "photo" ? "🖼️" : "—"}</td>
            <td>${escapeHtml(p.author)}</td>
            <td class="comment-text">${escapeHtml(p.caption)}</td>
            <td><span class="pill">${escapeHtml(p.mediaType || "text")}</span></td>
            <td>${p.likes}</td><td>${p.comments}</td><td><b>${p.score}</b></td>
          </tr>
        `).join("")}</tbody>
      </table>
      <h3 style="color:#c9a14a;margin-top:24px">📖 Most engaging Bible content</h3>
      <table>
        <thead><tr><th>Reference</th><th>Text</th><th>Likes</th><th>Saves</th><th>Comments</th><th>Score</th></tr></thead>
        <tbody>${t.trendingContent.map(c => `
          <tr><td>${escapeHtml(c.ref)}</td><td class="comment-text">${escapeHtml(c.text)}</td><td>${c.likedBy}</td><td>${c.savedBy}</td><td>${c.comments}</td><td><b>${c.score}</b></td></tr>
        `).join("")}</tbody>
      </table>
      <h3 style="color:#c9a14a;margin-top:24px">⭐ Top contributors</h3>
      <table>
        <thead><tr><th>User</th><th>Posts</th><th>Comments</th><th>Likes</th><th>Score</th></tr></thead>
        <tbody>${t.topContributors.map(u => `
          <tr><td>${escapeHtml(u.displayName || u.email)}</td><td>${u._count.posts}</td><td>${u._count.comments}</td><td>${u._count.likes}</td><td><b>${u.score}</b></td></tr>
        `).join("")}</tbody>
      </table>`;
  } catch (e) {
    panel.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`;
  }
}

async function loadAds() {
  const panel = document.getElementById("panel-ads");
  panel.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const [pricing, active] = await Promise.all([
      api("/api/ads/pricing"),
      api("/api/ads"),
    ]);
    panel.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card ${pricing.paymentEnabled ? "" : "warn"}">
          <div class="label">Stripe payments</div>
          <div class="value">${pricing.paymentEnabled ? "Enabled ✅" : "Not configured"}</div>
          ${!pricing.paymentEnabled ? `<div class="delta">Set STRIPE_SECRET_KEY in .env to enable</div>` : ""}
        </div>
        <div class="stat-card"><div class="label">Active ads</div><div class="value">${active.ads.length}</div></div>
        <div class="stat-card"><div class="label">Tiers</div><div class="value">${pricing.tiers.length}</div></div>
      </div>
      <h3 style="color:#c9a14a;margin-top:24px">Pricing tiers</h3>
      <table>
        <thead><tr><th>Tier</th><th>Duration</th><th>Price</th></tr></thead>
        <tbody>${pricing.tiers.map(t => `
          <tr><td>${escapeHtml(t.label)}</td><td>${t.durationDays} days</td><td>$${(t.amountCents/100).toFixed(2)}</td></tr>
        `).join("")}</tbody>
      </table>
      <h3 style="color:#c9a14a;margin-top:24px">Active sponsored posts</h3>
      ${active.ads.length ? `
        <table><thead><tr><th>Title</th><th>Impressions</th><th>Clicks</th><th>Ends</th></tr></thead>
        <tbody>${active.ads.map(a => `
          <tr><td>${escapeHtml(a.title)}</td><td>${a.impressions}</td><td>${a.clicks}</td><td class="meta">${a.endsAt ? new Date(a.endsAt).toLocaleDateString() : "—"}</td></tr>
        `).join("")}</tbody></table>
      ` : `<div class="empty">No active sponsored posts.</div>`}`;
  } catch (e) {
    panel.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`;
  }
}

async function loadOverview() {
  const panel = document.getElementById("panel-overview");
  panel.innerHTML = `<div class="empty">Loading stats…</div>`;
  try {
    const [s, d] = await Promise.all([api("/api/admin/stats"), api("/api/admin/demographics")]);
    const topDenom = d.denomination?.[0];
    const topCountry = d.country?.[0];
    panel.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Total Users</div><div class="value">${s.users.total}</div><div class="delta">+${s.users.new24h} today · +${s.users.new7d} this week</div></div>
        <div class="stat-card ${s.users.banned > 0 ? "warn" : ""}"><div class="label">Banned Users</div><div class="value">${s.users.banned}</div></div>
        <div class="stat-card"><div class="label">Posts</div><div class="value">${s.posts.total}</div><div class="delta">+${s.posts.new24h} today</div></div>
        <div class="stat-card"><div class="label">Comments</div><div class="value">${s.comments.total}</div></div>
        <div class="stat-card ${s.comments.flagged > 0 ? "warn" : ""}"><div class="label">Flagged Comments</div><div class="value">${s.comments.flagged}</div></div>
        <div class="stat-card ${s.comments.removed > 0 ? "danger" : ""}"><div class="label">Removed Comments</div><div class="value">${s.comments.removed}</div></div>
        <div class="stat-card ${s.moderation.pendingReports > 0 ? "warn" : ""}"><div class="label">Pending Reports</div><div class="value">${s.moderation.pendingReports}</div></div>
        <div class="stat-card"><div class="label">Likes</div><div class="value">${s.engagement.likes}</div></div>
        <div class="stat-card"><div class="label">Saves</div><div class="value">${s.engagement.saves}</div></div>
        <div class="stat-card"><div class="label">Reading Plans</div><div class="value">${s.engagement.readingPlans}</div></div>
        <div class="stat-card"><div class="label">Users with profile</div><div class="value">${d.totalProfiled}</div><div class="delta">Avg age: ${d.age.avg}</div></div>
        <div class="stat-card"><div class="label">Top denomination</div><div class="value">${escapeHtml(topDenom?.value || "—")}</div><div class="delta">${topDenom?.count} users</div></div>
        <div class="stat-card"><div class="label">Top location</div><div class="value">${escapeHtml(topCountry?.value || "—")}</div><div class="delta">${topCountry?.count} users</div></div>
        <div class="stat-card"><div class="label">Church attendance</div><div class="value">${d.churchAttendance.yes}</div><div class="delta">Yes: ${d.churchAttendance.yes} · No: ${d.churchAttendance.no}</div></div>
      </div>
      <h3 style="color:#c9a14a;margin-top:24px">📊 Age distribution</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;font-size:12px">
        ${Object.entries(d.age.buckets).map(([range, count]) => `<div style="background:rgba(201,161,74,.1);border-radius:8px;padding:8px;text-align:center"><div style="color:var(--gold);font-weight:700">${count}</div><div style="color:var(--muted)">${range}</div></div>`).join("")}
      </div>
      <p class="meta">Generated ${new Date(s.generatedAt).toLocaleString()}</p>
    `;
  } catch (e) {
    panel.innerHTML = `<div class="empty">Failed to load: ${escapeHtml(e.message)}</div>`;
  }
}

async function loadModeration() {
  const panel = document.getElementById("panel-moderation");
  panel.innerHTML = `
    <div class="search-bar">
      <select id="modFilter">
        <option value="flagged">Flagged only</option>
        <option value="visible">Visible</option>
        <option value="removed">Removed</option>
        <option value="">All</option>
      </select>
    </div>
    <div id="modList" class="empty">Loading…</div>
  `;
  const sel = document.getElementById("modFilter");
  sel.addEventListener("change", () => fetchModList(sel.value));
  fetchModList("flagged");
}

async function fetchModList(status) {
  const list = document.getElementById("modList");
  list.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const { comments } = await api(`/api/admin/comments?status=${status}&limit=100`);
    if (comments.length === 0) {
      list.innerHTML = `<div class="empty">No comments match this filter.</div>`;
      return;
    }
    list.innerHTML = `
      <table>
        <thead><tr><th>User</th><th>Comment</th><th>On</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          ${comments.map(c => `
            <tr>
              <td>${escapeHtml(c.user?.displayName || c.user?.email || "—")}${c.user?.bannedAt ? ' <span class="pill banned">banned</span>' : ""}</td>
              <td class="comment-text">${escapeHtml(c.text)}</td>
              <td>${escapeHtml(c.content?.ref || c.contentId)}</td>
              <td><span class="pill ${c.status}">${c.status}</span></td>
              <td class="meta">${new Date(c.createdAt).toLocaleString()}</td>
              <td>
                ${c.status !== "visible" ? `<button class="btn" data-act="approve" data-id="${c.id}">Approve</button>` : ""}
                ${c.status !== "removed" ? `<button class="btn danger" data-act="remove" data-id="${c.id}">Remove</button>` : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    list.querySelectorAll("button[data-act]").forEach(btn => {
      btn.addEventListener("click", () => modAction(btn.dataset.id, btn.dataset.act));
    });
  } catch (e) {
    list.innerHTML = `<div class="empty">Failed: ${escapeHtml(e.message)}</div>`;
  }
}

async function modAction(id, act) {
  const status = act === "approve" ? "visible" : "removed";
  try {
    await api(`/api/admin/comments/${id}`, { method: "PATCH", body: JSON.stringify({ status, reason: act === "remove" ? "Moderator action" : null }) });
    fetchModList(document.getElementById("modFilter").value);
  } catch (e) {
    alert("Failed: " + e.message);
  }
}

async function loadReports() {
  const panel = document.getElementById("panel-reports");
  panel.innerHTML = `<div class="empty">Loading reports…</div>`;
  try {
    const { reports } = await api("/api/admin/reports");
    if (reports.length === 0) {
      panel.innerHTML = `<div class="empty">No reports — community is clean. 🎉</div>`;
      return;
    }
    panel.innerHTML = `
      <table>
        <thead><tr><th>Reporter</th><th>Type</th><th>Content</th><th>Reason</th><th>Details</th><th>Reported</th><th>Actions</th></tr></thead>
        <tbody>
          ${reports.map(r => `
            <tr data-report-id="${r.id}">
              <td>${escapeHtml(r.reporter?.displayName || r.reporter?.email || "—")}</td>
              <td><span class="pill">${escapeHtml(r.content?.type || "—")}</span></td>
              <td>${escapeHtml(r.content?.ref || "(missing)")} <div class="meta">${escapeHtml((r.content?.text || "").slice(0, 80))}</div></td>
              <td>${escapeHtml(r.reason)}</td>
              <td class="comment-text">${escapeHtml(r.details || "—")}</td>
              <td class="meta">${new Date(r.createdAt).toLocaleString()}</td>
              <td>
                <button class="btn" data-act="dismiss-report" data-id="${r.id}">Dismiss</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    panel.querySelectorAll("[data-act='dismiss-report']").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "…";
        try {
          await api(`/api/admin/reports/${btn.dataset.id}`, { method: "DELETE" });
          btn.closest("tr").remove();
        } catch (e) {
          btn.disabled = false;
          btn.textContent = "Dismiss";
          alert("Failed: " + e.message);
        }
      });
    });
  } catch (e) {
    panel.innerHTML = `<div class="empty">Failed: ${escapeHtml(e.message)}</div>`;
  }
}

async function loadUsers() {
  const panel = document.getElementById("panel-users");
  panel.innerHTML = `
    <div class="search-bar">
      <input id="userSearch" placeholder="Search email or name…" />
      <select id="userFilter">
        <option value="">All users</option>
        <option value="banned">Banned</option>
        <option value="staff">Staff</option>
      </select>
    </div>
    <div id="userList" class="empty">Loading…</div>
  `;
  let timer;
  document.getElementById("userSearch").addEventListener("input", e => {
    clearTimeout(timer);
    timer = setTimeout(() => fetchUserList(e.target.value, document.getElementById("userFilter").value), 250);
  });
  document.getElementById("userFilter").addEventListener("change", e => {
    fetchUserList(document.getElementById("userSearch").value, e.target.value);
  });
  fetchUserList("", "");
}

async function fetchUserList(q, filter) {
  const list = document.getElementById("userList");
  list.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    const { users } = await api(`/api/admin/users?${params}`);
    if (users.length === 0) {
      list.innerHTML = `<div class="empty">No users match.</div>`;
      return;
    }
    list.innerHTML = `
      <table>
        <thead><tr><th>User</th><th>Role</th><th>Posts</th><th>Comments</th><th>Likes</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${escapeHtml(u.displayName || u.email)} <div class="meta">${escapeHtml(u.email)}</div></td>
              <td>
                <span class="pill ${u.role}">${u.role}</span>
                ${u.bannedAt ? '<span class="pill banned">banned</span>' : ""}
              </td>
              <td>${u._count.posts}</td>
              <td>${u._count.comments}</td>
              <td>${u._count.likes}</td>
              <td class="meta">${new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                ${u.role === "admin" ? `<button class="btn" data-act="demote-admin" data-id="${u.id}" title="Remove admin status">Remove admin</button>` : `<button class="btn primary" data-act="promote-admin" data-id="${u.id}" title="Make administrator">Make admin</button>`}
                ${u.role === "moderator" ? `<button class="btn" data-act="demote-mod" data-id="${u.id}" title="Remove moderator status">Remove mod</button>` : u.role !== "admin" ? `<button class="btn primary" data-act="promote-mod" data-id="${u.id}" title="Make moderator">Make mod</button>` : ""}
                ${u.bannedAt
                  ? `<button class="btn" data-act="unban" data-id="${u.id}">Unban</button>`
                  : `<button class="btn danger" data-act="ban" data-id="${u.id}">Ban</button>`}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    list.querySelectorAll("button[data-act]").forEach(btn => {
      btn.addEventListener("click", () => userAction(btn.dataset.id, btn.dataset.act));
    });
  } catch (e) {
    list.innerHTML = `<div class="empty">Failed: ${escapeHtml(e.message)}</div>`;
  }
}

async function userAction(id, action) {
  let reason = null;
  if (action === "ban") {
    reason = prompt("Reason for ban?");
    if (!reason) return;
  }
  if (action === "promote-admin" || action === "promote-mod") {
    const message = action === "promote-admin"
      ? "Make this user an ADMINISTRATOR?\n\nAdmins can:\n• Manage all users\n• Moderate content\n• View analytics\n• Appoint other admins\n\nClick OK to confirm."
      : "Make this user a MODERATOR?\n\nModerators can:\n• Moderate content\n• Review reports\n• Approve applications\n\nClick OK to confirm.";
    if (!confirm(message)) return;
  }
  if (action === "demote-admin" || action === "demote-mod") {
    const message = action === "demote-admin"
      ? "Remove admin status from this user? They'll become a regular user."
      : "Remove moderator status from this user? They'll become a regular user.";
    if (!confirm(message)) return;
  }

  try {
    // Handle promotions/demotions via new endpoint
    if (action.includes("promote") || action.includes("demote")) {
      const roleMap = {
        "promote-admin": "admin",
        "demote-admin": "user",
        "promote-mod": "moderator",
        "demote-mod": "user",
      };
      const newRole = roleMap[action];
      await api(`/api/admin/promote`, {
        method: "PATCH",
        body: JSON.stringify({ userId: id, role: newRole }),
      });
    } else {
      // Handle bans/unbans via original endpoint
      await api(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ action, reason }) });
    }
    fetchUserList(document.getElementById("userSearch").value, document.getElementById("userFilter").value);
  } catch (e) {
    alert("Failed: " + e.message);
  }
}

async function loadHealth() {
  const panel = document.getElementById("panel-health");
  panel.innerHTML = `<div class="empty">Pinging /api/health…</div>`;
  try {
    const h = await api("/api/health");
    panel.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card ${h.status === "healthy" ? "" : "danger"}"><div class="label">Status</div><div class="value">${h.status}</div></div>
        <div class="stat-card"><div class="label">Uptime</div><div class="value">${formatUptime(h.uptime)}</div></div>
        <div class="stat-card"><div class="label">DB Latency</div><div class="value">${h.checks.database.latencyMs ?? "—"}ms</div></div>
      </div>
      <pre style="background: rgba(0,0,0,.3); padding: 16px; border-radius: 8px; overflow-x: auto; color: #d8d3c5;">${escapeHtml(JSON.stringify(h, null, 2))}</pre>
    `;
  } catch (e) {
    panel.innerHTML = `<div class="empty">Failed: ${escapeHtml(e.message)}</div>`;
  }
}

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
