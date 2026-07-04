// Minimal line-icon set — stroke-based, consistent weight, no emoji.
// Each is a bare <svg> string sized by its container via CSS (width/height:100%).
const svg = (paths, viewBox = "0 0 24 24") =>
  `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

export const ICONS = {
  heartOutline: svg(`<path d="M12 20.2s-7.6-4.6-9.8-9.2C.7 7.7 2.2 4.4 5.6 3.6c2.1-.5 4 .4 5 2 .9 1.6.4-2.5 5-2 3.4.8 4.9 4.1 3.4 7.4-2.2 4.6-9.8 9.2-9.8 9.2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  heartFilled: svg(`<path d="M12 20.2s-7.6-4.6-9.8-9.2C.7 7.7 2.2 4.4 5.6 3.6c2.1-.5 4 .4 5 2 .9 1.6.4-2.5 5-2 3.4.8 4.9 4.1 3.4 7.4-2.2 4.6-9.8 9.2-9.8 9.2z" fill="currentColor"/>`),
  bookmarkOutline: svg(`<path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  bookmarkFilled: svg(`<path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" fill="currentColor"/>`),
  compass: svg(`<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M15 9l-2 5-5 2 2-5 5-2z" fill="currentColor"/>`),
  share: svg(`<path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  book: svg(`<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" stroke="currentColor" stroke-width="1.4"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z" stroke="currentColor" stroke-width="1.4"/>`),
  scroll: svg(`<rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M8 11h8M8 14h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`),
  thought: svg(`<circle cx="12" cy="10" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M9 20c.5-1.5 1.5-2.5 3-2.5s2.5 1 3 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`),
  question: svg(`<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.7.4-1.2.9-1.2 1.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>`),
  sparkle: svg(`<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" fill="currentColor"/>`),
  sun: svg(`<circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="M12 2.5v3M12 18.5v3M3.5 12h3M17.5 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`),
  all: svg(`<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4"/>`),
  comment: svg(`<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-4 3v-3H6a2 2 0 0 1-2-2V6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`),
  more: svg(`<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>`),
};

export function icon(name, cls = "") {
  return `<span class="icon ${cls}">${ICONS[name] || ""}</span>`;
}
