// Single localStorage gateway. Namespaced + versioned so future schema
// changes (cloud sync, accounts) can migrate instead of corrupting data.
const NS = "manna";
const VERSION = 1;

function key(k) { return `${NS}:v${VERSION}:${k}`; }

export const state = {
  get(k, fallback) {
    try {
      const raw = localStorage.getItem(key(k));
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try { localStorage.setItem(key(k), JSON.stringify(v)); } catch {}
  },
  update(k, fallback, fn) {
    const next = fn(state.get(k, fallback));
    state.set(k, next);
    return next;
  },
};
