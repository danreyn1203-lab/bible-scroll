// Discovery feature — thin wiring around the panel component + graph.
import { openExplorePanel } from "../../ui/components/panel.js";
import { contentIndex } from "../../data/graph.js";
import { cardHTML } from "../../ui/components/card.js";

export function openDiscovery(contentId, feedEl) {
  openExplorePanel(contentId, jumpId => jumpToContent(jumpId, feedEl));
}

function jumpToContent(jumpId, feedEl) {
  const existing = feedEl.querySelector(`[data-id="${jumpId}"]`);
  if (existing) {
    existing.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const item = contentIndex.get(jumpId);
  if (!item) return;
  feedEl.insertAdjacentHTML("afterbegin", cardHTML(item));
  feedEl.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
}
