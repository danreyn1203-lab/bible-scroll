import { CATS } from "../../data/graph.js";
import { whyRecommended } from "../../core/engine.js";
import { state } from "../../core/state.js";
import { icon } from "./icons.js";
// Like/save/comment fetches are owned by ui/render.js to avoid double-wiring bugs.

const CAT_ICON = { verse: "scroll", history: "compass", theology: "thought", catechism: "question", funfact: "sparkle" };

export async function cardHTML(d, { isToday = false, realData = null } = {}) {
  const cat = CATS[d.c];
  const liked = state.get("liked", {});
  const saved = state.get("saved", {});
  const isLiked = realData?.isLiked || !!liked[d.id];
  const isSaved = realData?.isSaved || !!saved[d.id];
  const why = whyRecommended(d.id);

  const main = d.c === "verse"
    ? `<div class="verse">${d.text}</div>`
    : d.c === "catechism"
      ? `<div class="verse verse--question">${d.text}</div>
         <button class="reveal-btn" data-reveal>Reveal the answer</button>
         <div class="answer"><div class="lab">Answer</div><div class="body">${d.answer}</div></div>`
      : `<div class="body">${d.text}</div>`;

  const stats = realData?.stats || { likes: 0, saves: 0, comments: 0 };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Comments are shown in a full-screen sheet (see render.js openCommentSheet)
  const commentHtml = "";

  return `<section class="card" data-id="${d.id}" style="--grad:${cat.grad}">
    <div class="card-glow"></div>
    <div class="deco">${icon(CAT_ICON[d.c])}</div>
    <div class="glass-sheet">
      <div class="inner">
        <div class="kicker-row">
          <span class="kicker">${icon(CAT_ICON[d.c], "kicker-ic")} ${cat.label}</span>
          ${isToday ? `<span class="kicker kicker--today">${icon("sun", "kicker-ic")} Today's Bread</span>` : ""}
        </div>
        ${main}
        <div class="ref">${d.ref}</div>
        ${why ? `<div class="why">${why}</div>` : ""}
        <div class="reactions-bar">
          ${["🙏","❤️","✨","🕊️","🔥"].map(e => `<button class="reaction-btn" data-react="${e}" data-id="${d.id}" aria-label="React with ${e}">${e}</button>`).join("")}
        </div>
        ${commentHtml}
      </div>
    </div>
    <div class="heart-pop">${icon("heartFilled")}</div>
    <div class="rail">
      <div class="act like ${isLiked ? "on" : ""}" data-act="like" data-id="${d.id}">
        <div class="ic">${icon(isLiked ? "heartFilled" : "heartOutline")}</div>
        <div class="ct" data-likect>${stats.likes ?? 0}</div>
      </div>
      <div class="act save ${isSaved ? "saved" : ""}" data-act="save" data-id="${d.id}">
        <div class="ic">${icon(isSaved ? "bookmarkFilled" : "bookmarkOutline")}</div>
        <div class="ct" data-savect>${stats.saves ?? 0}</div>
      </div>
      <div class="act comment" data-act="comment" data-id="${d.id}">
        <div class="ic">${icon("comment")}</div>
        <div class="ct" data-commentct>${stats.comments ?? 0}</div>
      </div>
      <div class="act" data-act="explore" data-id="${d.id}">
        <div class="ic">${icon("compass")}</div>
        <div class="ct">Explore</div>
      </div>
      <div class="act" data-act="share" data-id="${d.id}">
        <div class="ic">${icon("share")}</div>
      </div>
      <div class="act" data-act="more" data-id="${d.id}">
        <div class="ic">${icon("more")}</div>
      </div>
    </div>
  </section>`;
}

// No-op kept for the existing import in feed.js. Wiring lives in ui/render.js.
// Earlier this function double-bound click handlers and overwrote the numeric
// like/save count with the strings "Liked"/"Saved" — that's the bug Daniel hit.
export function wireCardActions() {}
