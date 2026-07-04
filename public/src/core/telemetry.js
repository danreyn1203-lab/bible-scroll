// Minimal behavioral telemetry feeding the AI profile: dwell time per card
// and whether a reflection (catechism reveal) happened during that dwell.
// Nothing here is personally identifying — just content ids, durations, and
// category labels, kept locally via state.js.

import { recordSignal } from "./engine.js";
import { state } from "./state.js";
import { contentIndex } from "../data/graph.js";

const enterTimes = new Map();
const reflectedDuringDwell = new Set();

export function markReflected(contentId) {
  reflectedDuringDwell.add(contentId);
}

export function startDwellTracking(feedEl) {
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const id = entry.target.dataset.id;
      if (!id) continue;
      if (entry.intersectionRatio > 0.6) {
        if (!enterTimes.has(id)) enterTimes.set(id, performance.now());
      } else if (enterTimes.has(id)) {
        const dwellMs = performance.now() - enterTimes.get(id);
        enterTimes.delete(id);
        logDwell(id, dwellMs);
      }
    }
  }, { threshold: [0, 0.6, 1] });

  function observeAll() { feedEl.querySelectorAll(".card").forEach(c => io.observe(c)); }
  observeAll();
  new MutationObserver(observeAll).observe(feedEl, { childList: true });
}

function logDwell(id, dwellMs) {
  if (dwellMs < 400 || dwellMs > 5 * 60000) return; // ignore noise and backgrounded tabs
  const item = contentIndex.get(id);
  if (!item) return;
  const words = item.text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  const wasReflected = reflectedDuringDwell.has(id);
  reflectedDuringDwell.delete(id);

  recordSignal(id, "view", dwellMs / 1000);
  if (dwellMs < 1200) recordSignal(id, "fastSkip");

  state.update("timing", [], log =>
    [...log, { id, cat: item.c, words, dwellMs, reflected: wasReflected, t: Date.now() }].slice(-300)
  );
}
