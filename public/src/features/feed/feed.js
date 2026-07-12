// The v1 swipe feed — a view over the knowledge graph driven by engine.nextBatch().
// Now wired to show real engagement stats (likes, saves, comments) from the backend.
import { nextBatch } from "../../core/engine.js";
import { cardHTML, wireCardActions } from "../../ui/components/card.js";
import { todaysCard } from "../../core/retention.js";
import { getStats, getComments, getUserState } from "../../core/apiClient.js";
import { getUserFacts } from "../../core/userFacts.js";

const BATCH_SIZE = 8;
let activeFilter = "all";
let shownTodayCard = false;

export function setFilter(filter) { activeFilter = filter; shownTodayCard = false; }
export function getFilter() { return activeFilter; }

// Render the user's own facts (pinned to the top), each with a small delete control.
async function userFactsHTML() {
  const facts = getUserFacts().filter(f => activeFilter === "all" || f.c === activeFilter);
  if (!facts.length) return "";
  const cards = await Promise.all(facts.map(f =>
    cardHTML(f, { realData: { stats: { likes: 0, saves: 0, comments: 0 }, comments: [], isLiked: false, isSaved: false } })
  ));
  // Inject a "Your fact" pill into each card's kicker row (sits beside the
  // category badge — flows with the card, never overlaps the filters or rail).
  return cards.map((html, i) =>
    html.replace('<div class="kicker-row">',
      `<div class="kicker-row"><button class="user-fact-del" data-del-fact="${facts[i].id}" title="Tap to remove your fact" aria-label="Remove your fact">Your fact</button>`)
  ).join("");
}

export async function buildFeed(feedEl) {
  feedEl.innerHTML = "";
  shownTodayCard = false;
  feedEl.insertAdjacentHTML("beforeend", await userFactsHTML());
  await appendBatch(feedEl);
  feedEl.scrollTop = 0;
}

export async function appendBatch(feedEl) {
  let batch = nextBatch(BATCH_SIZE, { category: activeFilter });

  // Fetch real stats + comments for each card in parallel
  const enriched = await Promise.all(batch.map(async d => {
    const [stats, comments] = await Promise.all([
      getStats(d.id),
      getComments(d.id),
    ]);
    return { ...d, stats, comments };
  }));

  // Load liked/saved IDs — gracefully degrade if unauthenticated or fails
  let likedIds = new Set();
  let savedIds = new Set();
  try {
    const userState = await getUserState();
    // API returns Set which JSON-serializes to {} — must use Object.keys or the array fields
    if (Array.isArray(userState?.likedIds)) likedIds = new Set(userState.likedIds);
    if (Array.isArray(userState?.savedIds)) savedIds = new Set(userState.savedIds);
  } catch (_) { /* not logged in or network error — just show unheated cards */ }

  let prepend = "";
  if (!shownTodayCard && (activeFilter === "all")) {
    const today = todaysCard();
    prepend = await cardHTML(today, { isToday: true });
    shownTodayCard = true;
  }

  const html = prepend + (await Promise.all(enriched.map(d =>
    cardHTML(d, { realData: { stats: d.stats, comments: d.comments, isLiked: likedIds.has(d.id), isSaved: savedIds.has(d.id) } })
  ))).join("");

  feedEl.insertAdjacentHTML("beforeend", html);
  wireCardActions(feedEl);

  while (feedEl.children.length > 140) feedEl.removeChild(feedEl.firstElementChild);
}
