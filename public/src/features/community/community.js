// Community tab — a real social-media feed. Posts in a single column with
// like/comment/share, followed by collapsible sections for friends, groups,
// and prayer requests. All actions hit real API endpoints.

import { getSession } from "../../core/authClient.js";
import { toast } from "../../ui/components/toast.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Award XP for actions
async function awardXP(amount, reason) {
  try {
    const res = await fetch("/api/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ amount, reason }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.level > 1) toast(`🎉 Level ${data.level}!`);
    }
  } catch (err) {
    console.error("XP error:", err);
  }
}

// Swipe gesture detection for bottom nav
function setupSwipeGestures() {
  let touchStart = 0;
  document.addEventListener("touchstart", e => { touchStart = e.touches[0]?.clientX || 0; });
  document.addEventListener("touchend", e => {
    const touchEnd = e.changedTouches[0]?.clientX || 0;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) < 50) return;
    const navItems = document.querySelectorAll(".bottom-nav-item");
    if (!navItems.length) return;
    const active = document.querySelector(".bottom-nav-item.active");
    const index = Array.from(navItems).indexOf(active);
    if (diff > 0 && index < navItems.length - 1) navItems[index + 1]?.click();
    if (diff < 0 && index > 0) navItems[index - 1]?.click();
  });
}

async function fetchJSON(url, opts) {
  const res = await fetch(url, { credentials: "same-origin", cache: "no-store", ...opts });
  if (!res.ok) return null;
  return res.json();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function avatarHtml(a, sizeClass = "") {
  if (!a) return `<div class="cm-avatar ${sizeClass}"><span>?</span></div>`;
  if (a.avatarUrl) return `<img class="cm-avatar ${sizeClass}" src="${esc(a.avatarUrl)}" alt="" />`;
  const initial = ((a.displayName || a.email || "A")[0] || "A").toUpperCase();
  return `<div class="cm-avatar ${sizeClass}"><span>${esc(initial)}</span></div>`;
}

function postHtml(p, me) {
  const own = p.isOwn || (me && p.author?.id === me.id);
  return `
  <article class="cm-post" data-post-id="${p.id}">
    <header class="cm-post-head">
      ${avatarHtml(p.author, "cm-avatar--lg")}
      <div class="cm-post-meta">
        <div class="cm-post-author">${esc(p.author?.displayName || "Anonymous")}</div>
        <div class="cm-post-time">${timeAgo(p.createdAt)}</div>
      </div>
      ${own ? `<button class="cm-icon-btn cm-post-delete" data-act="delete-post" title="Delete">✕</button>` : `<button class="cm-icon-btn cm-post-more" data-act="report-post" title="Report">⋯</button>`}
    </header>

    ${p.caption ? `<div class="cm-post-caption">${esc(p.caption)}</div>` : ""}

    ${p.mediaUrl ? `
      <div class="cm-post-media">
        ${p.mediaType === "video"
          ? `<div class="cm-video-wrap" data-video-src="${esc(p.mediaUrl)}" ${p.thumbnailUrl ? `style="background-image:url('${esc(p.thumbnailUrl)}');background-size:cover;background-position:center;"` : ""}>
              ${p.thumbnailUrl ? `<img class="cm-video-thumb" src="${esc(p.thumbnailUrl)}" alt="Video thumbnail" loading="lazy" />` : `<div class="cm-video-placeholder"><span style="font-size:32px;">🎥</span><span style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px;">Video</span></div>`}
              <button class="cm-video-play" aria-label="Play video">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="rgba(0,0,0,.55)"/><polygon points="19,15 37,24 19,33" fill="white"/></svg>
              </button>
            </div>`
          : `<img src="${esc(p.mediaUrl)}" alt="" loading="lazy" />`}
      </div>` : ""}

    <div class="cm-post-actions">
      <button class="cm-action ${p.liked ? "is-liked" : ""}" data-act="like-post">
        <span class="cm-action-icon">${p.liked ? "❤️" : "🤍"}</span>
        <span class="cm-action-ct" data-likect>${p.likeCount}</span>
      </button>
      <button class="cm-action" data-act="toggle-comments">
        <span class="cm-action-icon">💬</span>
        <span class="cm-action-ct" data-commentct>${p.commentCount}</span>
      </button>
      <button class="cm-action" data-act="share-post">
        <span class="cm-action-icon">↗</span>
      </button>
    </div>

    <div class="cm-post-comments" hidden>
      <div class="cm-comments-list" data-comments-list></div>
      ${me ? `
        <form class="cm-comment-form" data-comment-form>
          ${avatarHtml(me, "cm-avatar--sm")}
          <input type="text" class="cm-comment-input" placeholder="Add a comment…" maxlength="500" required />
          <button type="submit" class="cm-comment-submit">Post</button>
        </form>` : `<p class="cm-muted">Sign in to comment.</p>`}
    </div>
  </article>`;
}

function composerHtml(me) {
  if (!me) return "";
  const name = (me.displayName || "friend").split(" ")[0];
  return `
  <div class="cm-composer">
    ${avatarHtml(me, "cm-avatar--md")}
    <button class="cm-composer-prompt" data-act="open-composer">What's on your heart, ${esc(name)}?</button>
    <button class="cm-composer-media" data-act="open-composer" title="Add a photo or video">📷</button>
  </div>`;
}

function sectionPanel({ title, count, body, action }) {
  return `
  <details class="cm-panel">
    <summary class="cm-panel-head">
      <span class="cm-panel-title">${esc(title)}</span>
      <span class="cm-panel-count">${count}</span>
    </summary>
    <div class="cm-panel-body">${body}${action || ""}</div>
  </details>`;
}

export async function buildCommunity(feedEl) {
  setupSwipeGestures();
  const session = await getSession();
  if (!session) {
    feedEl.innerHTML = `
      <div class="cm-shell">
        <div class="cm-empty">
          <h3>Sign in to join the community</h3>
          <p>Share posts, connect with friends, join groups, and share prayer requests.</p>
        </div>
      </div>`;
    return;
  }

  feedEl.innerHTML = `<div class="cm-shell"><div class="cm-loading">Loading community…</div></div>`;

  const [me, posts, friends, groups, prayers, suggestionsRes] = await Promise.all([
    fetchJSON("/api/users/me"),
    fetchJSON("/api/posts").then(r => r || []),
    fetchJSON("/api/friends").then(r => r || { friends: [], pendingReceived: [] }),
    fetchJSON("/api/groups").then(r => r || []),
    fetchJSON("/api/prayer-requests").then(r => r || []),
    fetchJSON("/api/friends/suggestions").then(r => r || { suggestions: [] }),
  ]);
  const suggestions = suggestionsRes.suggestions || [];

  const pendingHtml = friends.pendingReceived?.length ? `
    <div class="cm-notice">
      <div class="cm-notice-label">${friends.pendingReceived.length} friend request${friends.pendingReceived.length !== 1 ? "s" : ""}</div>
      ${friends.pendingReceived.map(f => `
        <div class="cm-pending-row">
          ${avatarHtml(f, "cm-avatar--sm")}
          <span class="cm-pending-name">${esc(f.displayName || f.email || "Someone")}</span>
          <button class="cm-mini cm-mini--primary" data-friendship-id="${f.friendshipId}" data-act="accept-friend">Accept</button>
          <button class="cm-mini" data-friendship-id="${f.friendshipId}" data-act="decline-friend">Ignore</button>
        </div>`).join("")}
    </div>` : "";

  const friendsBody = friends.friends?.length
    ? friends.friends.map(f => `
        <div class="cm-row">
          ${avatarHtml(f, "cm-avatar--sm")}
          <span class="cm-row-name">${esc(f.displayName || "Friend")}</span>
        </div>`).join("")
    : `<p class="cm-muted">No friends yet — invite someone by email below.</p>`;

  const groupsBody = groups.length
    ? groups.map(g => `
        <div class="cm-row cm-row--group">
          <div class="cm-row-icon">👥</div>
          <div class="cm-row-info">
            <div class="cm-row-name">${esc(g.name)}</div>
            ${g.description ? `<div class="cm-row-sub">${esc(g.description)}</div>` : ""}
            <div class="cm-row-meta">${g.memberCount} member${g.memberCount !== 1 ? "s" : ""} · ${g.prayerCount} prayer${g.prayerCount !== 1 ? "s" : ""}</div>
          </div>
        </div>`).join("")
    : `<p class="cm-muted">No groups yet — start one below.</p>`;

  const prayersBody = prayers.length
    ? prayers.map(p => `
        <div class="cm-prayer">
          <div class="cm-prayer-head">
            ${avatarHtml(p.author, "cm-avatar--sm")}
            <div>
              <div class="cm-prayer-author">${esc(p.author?.displayName || "Anonymous")}</div>
              <div class="cm-prayer-time">${timeAgo(p.createdAt)}</div>
            </div>
          </div>
          <div class="cm-prayer-text">${esc(p.text)}</div>
          <button class="cm-mini cm-prayer-pray" data-prayer-id="${p.id}" data-act="pray">🙏 Praying <span class="cm-prayer-ct">${p.prayCount}</span></button>
        </div>`).join("")
    : `<p class="cm-muted">No prayer requests yet — share one below.</p>`;

  feedEl.innerHTML = `
    <div class="cm-shell">
      ${pendingHtml}
      ${composerHtml(me)}

      ${suggestions.length ? `
        <div class="cm-suggest">
          <div class="cm-suggest-head">People you may know</div>
          <div class="cm-suggest-row">
            ${suggestions.slice(0, 8).map(s => `
              <div class="cm-suggest-card">
                ${avatarHtml(s, "cm-avatar--lg")}
                <div class="cm-suggest-name">${esc(s.displayName || "User")}</div>
                <div class="cm-suggest-reason">${esc(s.reason)}</div>
                <button class="cm-mini cm-mini--primary" data-act="add-friend" data-email="${esc(s.email || "")}">+ Friend</button>
              </div>`).join("")}
          </div>
        </div>` : ""}

      <div class="cm-sort">
        <button class="cm-sort-btn cm-sort-new is-active">✨ New</button>
        <button class="cm-sort-btn cm-sort-trending">🔥 Trending</button>
      </div>

      <div class="cm-feed">
        ${posts.length ? posts.map(p => postHtml(p, me)).join("") : `
          <div class="cm-empty">
            <h3>No posts yet</h3>
            <p>Be the first to share. Tap the prompt above to post a verse, a photo, a thought.</p>
          </div>`}
      </div>

      <aside class="cm-side">
        ${sectionPanel({
          title: "👥 Friends",
          count: friends.friends?.length || 0,
          body: friendsBody,
          action: `<form class="cm-form" data-form="add-friend">
            <input type="email" class="cm-input" placeholder="Friend's email" required />
            <button class="cm-mini cm-mini--primary" type="submit">Add</button>
          </form>`,
        })}
        ${sectionPanel({
          title: "🤝 Groups",
          count: groups.length,
          body: groupsBody,
          action: `<form class="cm-form" data-form="create-group">
            <input type="text" class="cm-input" placeholder="Group name" required />
            <button class="cm-mini cm-mini--primary" type="submit">Create</button>
          </form>`,
        })}
        ${sectionPanel({
          title: "🙏 Prayer requests",
          count: prayers.length,
          body: prayersBody,
          action: `<form class="cm-form cm-form--col" data-form="prayer">
            <textarea class="cm-input cm-textarea" placeholder="Share a prayer request…" maxlength="1000" required></textarea>
            <button class="cm-mini cm-mini--primary" type="submit">Share prayer</button>
          </form>`,
        })}
      </aside>
    </div>
  `;

  wireCommunity(feedEl, me, posts);
}

function wireCommunity(feedEl, me, posts) {
  feedEl.querySelectorAll('[data-act="open-composer"]').forEach(el => {
    el.addEventListener("click", () => document.getElementById("post-fab")?.click());
  });

  // Sort toggle: switch between new/trending without full rebuild
  feedEl.querySelector(".cm-sort-new")?.addEventListener("click", e => {
    feedEl.querySelectorAll(".cm-sort-btn").forEach(b => b.classList.remove("is-active"));
    e.target.classList.add("is-active");
    const feed = feedEl.querySelector(".cm-feed");
    if (feed) {
      feed.innerHTML = posts.length ? posts.map(p => postHtml(p, me)).join("") : `<div class="cm-empty"><h3>No posts yet</h3></div>`;
      wireFeedActions(feedEl, me);
    }
  });

  feedEl.querySelector(".cm-sort-trending")?.addEventListener("click", async e => {
    feedEl.querySelectorAll(".cm-sort-btn").forEach(b => b.classList.remove("is-active"));
    e.target.classList.add("is-active");
    await loadTrendingPosts(feedEl, me);
  });

  wireFeedActions(feedEl, me);
}

function wireFeedActions(feedEl, me) {
  // Video play button — replace thumbnail with actual video element
  feedEl.addEventListener("click", e => {
    const playBtn = e.target.closest(".cm-video-play");
    if (!playBtn) return;
    const wrap = playBtn.closest(".cm-video-wrap");
    if (!wrap) return;
    const src = wrap.dataset.videoSrc;
    wrap.innerHTML = `<video src="${src}" controls playsinline autoplay style="width:100%;display:block;border-radius:inherit;"></video>`;
  });

  feedEl.addEventListener("click", async e => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const postEl = btn.closest(".cm-post");
    const postId = postEl?.dataset.postId;
    const act = btn.dataset.act;

    if (act === "like-post" && postId) {
      btn.disabled = true;
      const res = await fetchJSON(`/api/posts/${postId}/like`, { method: "POST" });
      btn.disabled = false;
      if (!res) { toast("Couldn't like — sign in?"); return; }
      btn.classList.toggle("is-liked", res.liked);
      btn.querySelector(".cm-action-icon").textContent = res.liked ? "❤️" : "🤍";
      btn.querySelector("[data-likect]").textContent = res.count;
      if (res.liked) {
        burstHeart(btn);
        awardXP(5, "like");
      }
      return;
    }

    if (act === "toggle-comments" && postId) {
      const panel = postEl.querySelector(".cm-post-comments");
      const opening = panel.hidden;
      panel.hidden = !panel.hidden;
      if (opening) loadComments(postEl, postId, me);
      return;
    }

    if (act === "share-post" && postId) {
      const url = `${window.location.origin}/#post-${postId}`;
      if (navigator.share) {
        navigator.share({ url, title: "Taste Manna" }).then(() => awardXP(10, "share")).catch(() => {});
      } else {
        navigator.clipboard?.writeText(url).then(() => {
          toast("Link copied");
          awardXP(10, "share");
        });
      }
      return;
    }

    if (act === "delete-post" && postId) {
      if (!confirm("Delete this post?")) return;
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE", credentials: "same-origin" });
      if (res.ok) { toast("Post deleted"); postEl.remove(); }
      else toast("Couldn't delete");
      return;
    }

    if (act === "report-post" && postId) {
      const reason = prompt("Why are you reporting this post?");
      if (!reason) return;
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ contentId: `post:${postId}`, reason, details: "" }),
      });
      toast("Reported. Thank you.");
      return;
    }

    if (act === "add-friend") {
      const email = btn.dataset.email?.trim();
      if (!email) { toast("Couldn't find email"); return; }
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email }) });
        if (res.ok) { btn.closest(".cm-suggest-card").classList.add("is-sent"); btn.textContent = "✓ Sent"; toast("Request sent!"); }
        else { btn.disabled = false; btn.textContent = "+ Friend"; toast("Couldn't send request"); }
      } catch (err) { btn.disabled = false; btn.textContent = "+ Friend"; toast(err.message); }
      return;
    }

    if (act === "add-friend") {
      const email = btn.dataset.email?.trim();
      if (!email) { toast("Couldn't find email"); return; }
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email }) });
        if (res.ok) { btn.closest(".cm-suggest-card").classList.add("is-sent"); btn.textContent = "✓ Sent"; toast("Request sent!"); }
        else { btn.disabled = false; btn.textContent = "+ Friend"; toast("Couldn't send request"); }
      } catch (err) { btn.disabled = false; btn.textContent = "+ Friend"; toast(err.message); }
      return;
    }

    if (act === "accept-friend") {
      await fetch(`/api/friends/${btn.dataset.friendshipId}`, { method: "PATCH", credentials: "same-origin" });
      toast("Friend added!"); buildCommunity(feedEl);
      return;
    }
    if (act === "decline-friend") {
      await fetch(`/api/friends/${btn.dataset.friendshipId}`, { method: "DELETE", credentials: "same-origin" });
      buildCommunity(feedEl);
      return;
    }

    if (act === "pray") {
      const res = await fetch(`/api/prayer-requests/${btn.dataset.prayerId}`, { method: "PATCH", credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        btn.querySelector(".cm-prayer-ct").textContent = data.prayCount;
        toast("Praying for them 🙏");
      }
      return;
    }
  });

  feedEl.addEventListener("submit", async e => {
    const form = e.target.closest("[data-comment-form]");
    if (form) {
      e.preventDefault();
      const postEl = form.closest(".cm-post");
      const postId = postEl.dataset.postId;
      const input = form.querySelector(".cm-comment-input");
      const text = input.value.trim();
      if (!text) return;
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Couldn't post");
        }
        input.value = "";
        awardXP(8, "comment");
        await loadComments(postEl, postId, me);
      } catch (err) { toast(err.message); }
      return;
    }

    const sideForm = e.target.closest("[data-form]");
    if (!sideForm) return;
    e.preventDefault();
    const kind = sideForm.dataset.form;
    if (kind === "add-friend") {
      const email = sideForm.querySelector("input").value.trim();
      const res = await fetch("/api/friends", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { toast("Request sent!"); buildCommunity(feedEl); }
      else toast(data.error || "Failed");
    } else if (kind === "create-group") {
      const name = sideForm.querySelector("input").value.trim();
      const res = await fetch("/api/groups", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ name }),
      });
      if (res.ok) { toast("Group created"); buildCommunity(feedEl); }
    } else if (kind === "prayer") {
      const text = sideForm.querySelector("textarea").value.trim();
      const res = await fetch("/api/prayer-requests", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { toast("Prayer shared"); buildCommunity(feedEl); }
      else toast(data.error || "Failed");
    }
  });
}

async function loadTrendingPosts(feedEl, me) {
  const trending = await fetchJSON("/api/posts/trending") || [];
  const feed = feedEl.querySelector(".cm-feed");
  if (!feed) return;
  feed.innerHTML = trending.length ? trending.map(p => postHtml(p, me)).join("") : `<div class="cm-empty"><h3>No trending posts</h3></div>`;
  wireFeedActions(feedEl, me);
}

async function loadComments(postEl, postId, me) {
  const list = postEl.querySelector("[data-comments-list]");
  list.innerHTML = `<div class="cm-muted">Loading…</div>`;
  const comments = await fetchJSON(`/api/posts/${postId}/comments?t=${Date.now()}`) || [];
  postEl.querySelector("[data-commentct]").textContent = comments.length;
  if (!comments.length) {
    list.innerHTML = `<div class="cm-muted">No comments yet. Be the first.</div>`;
    return;
  }
  list.innerHTML = comments.map(c => `
    <div class="cm-comment">
      ${avatarHtml(c.author, "cm-avatar--sm")}
      <div class="cm-comment-body">
        <span class="cm-comment-author">${esc(c.author?.displayName || "Anonymous")}</span>
        <span class="cm-comment-text">${esc(c.text)}</span>
        <span class="cm-comment-time">${timeAgo(c.createdAt)}</span>
      </div>
    </div>`).join("");
}

function burstHeart(btn) {
  const rect = btn.getBoundingClientRect();
  for (let i = 0; i < 4; i++) {
    const span = document.createElement("span");
    span.className = "cm-heart-burst";
    span.textContent = "❤️";
    span.style.left = `${rect.left + rect.width / 2 + (Math.random() * 20 - 10)}px`;
    span.style.top = `${rect.top}px`;
    span.style.animationDelay = `${i * 60}ms`;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 1100 + i * 60);
  }
}
