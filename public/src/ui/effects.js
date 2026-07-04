// Ambient visual layer: floating particles, scroll-driven card depth, and a
// pointer-follow highlight. Pure presentation — no state, no app logic.

const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- ambient particles ---------- */
export function initParticles(canvas) {
  if (reduceMotion || !canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles;

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }
  function seed() {
    particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.6 + 0.4) * devicePixelRatio,
      s: Math.random() * 0.35 + 0.06,
      o: Math.random() * 0.35 + 0.08,
      drift: (Math.random() - 0.5) * 0.25,
    }));
  }
  resize(); seed();
  window.addEventListener("resize", () => { resize(); seed(); });

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y -= p.s * devicePixelRatio;
      p.x += p.drift * devicePixelRatio;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244,241,234,${p.o})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- scroll-driven card depth ---------- */
export function initScrollMotion(feedEl) {
  if (reduceMotion) return;
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const card = entry.target;
      const ratio = entry.intersectionRatio;
      card.style.setProperty("--ratio", ratio.toFixed(3));
      card.classList.toggle("in-view", ratio > 0.55);
    }
  }, { threshold: [0, 0.15, 0.3, 0.45, 0.55, 0.7, 0.85, 1] });

  function observeAll() {
    feedEl.querySelectorAll(".card").forEach(c => io.observe(c));
  }
  observeAll();
  const mo = new MutationObserver(observeAll);
  mo.observe(feedEl, { childList: true });
}

/* ---------- pointer-follow ambient highlight ---------- */
export function initPointerLight(feedEl) {
  if (reduceMotion) return;
  feedEl.addEventListener("pointermove", e => {
    const card = e.target.closest(".card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", mx.toFixed(1) + "%");
    card.style.setProperty("--my", my.toFixed(1) + "%");
  });
}
