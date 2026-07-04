// Frontend API client — talks to the real bible-scroll backend.
// Called by feed, cards, profile, etc. to fetch data and trigger actions.

let cachedUserState = null;

export async function getUserState() {
  if (cachedUserState?.authenticated) return cachedUserState;
  try {
    const res = await fetch("/api/user-state", { credentials: "same-origin" });
    if (!res.ok) return { authenticated: false, likedIds: [], savedIds: [] };
    const data = await res.json();
    // Only cache authenticated responses — unauthenticated may change after login
    if (data.authenticated) cachedUserState = data;
    return data;
  } catch (err) {
    return { authenticated: false, likedIds: [], savedIds: [] };
  }
}

export async function getContent(take = 20, category = null) {
  const url = new URL("/api/content", window.location.origin);
  url.searchParams.set("take", take);
  if (category && category !== "all") url.searchParams.set("category", category);
  const res = await fetch(url, { credentials: "same-origin" });
  return res.json();
}

export async function getStats(contentId) {
  const res = await fetch(`/api/content/${encodeURIComponent(contentId)}/stats?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function toggleLike(contentId) {
  const res = await fetch("/api/content/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ contentId }),
  });
  if (!res.ok) return null;
  cachedUserState = null; // invalidate cache
  return res.json();
}

export async function toggleSave(contentId) {
  const res = await fetch("/api/content/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ contentId }),
  });
  if (!res.ok) return null;
  cachedUserState = null; // invalidate cache
  return res.json();
}

export async function getComments(contentId) {
  // cache:no-store so a fresh GET after POST always sees the new comment
  const res = await fetch(`/api/comments?contentId=${encodeURIComponent(contentId)}&t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function postComment(contentId, text) {
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ contentId, text }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to post comment");
  }
  return res.json();
}

export async function getUserProfile(userId) {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) return null;
  return res.json();
}
