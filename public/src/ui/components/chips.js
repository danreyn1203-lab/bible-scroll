import { CATS } from "../../data/graph.js";
import { icon } from "./icons.js";

const CAT_ICON = { all: "all", verse: "scroll", history: "compass", theology: "thought", catechism: "question", funfact: "sparkle" };

export function chipsHTML(activeFilter) {
  const all = [["all", "All"], ...Object.entries(CATS).map(([k, v]) => [k, v.label])];
  return all.map(([k, lab]) =>
    `<button class="chip ${k === activeFilter ? "active" : ""}" data-f="${k}">${icon(CAT_ICON[k], "chip-ic")} ${lab}</button>`
  ).join("");
}
