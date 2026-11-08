/**
 * Diwali fireworks on a transparent <canvas> (put it over a black background).
 * Shells launch from the bottom, rise, and burst in red / blue / yellow (single colour or mixed),
 * with fading trails.  Browser only.
 *
 * Optimized for mobile: fewer particles, smaller burst sizes on small screens.
 *
 *   const stop = startFireworks(canvasEl, { rate: 1, burstAtStart: true });
 *   ...later: stop();
 *   boom(x, y) is also exposed via the returned function's .boom property.
 */
const COLORS = [[255, 60, 60], [70, 130, 255], [255, 200, 40]];

export function startFireworks(canvas, { rate = 1, burstAtStart = true } = {}) {
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 640;
  let W = 0, H = 0, raf = 0, last = performance.now(), next = 0;
  const shells = [], sparks = [];
  const G = 300;
  // Fewer particles on mobile for performance
  const MAX_SPARKS = isMobile ? 200 : 600;
  const BURST_COUNT = isMobile ? 45 : 90;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, isMobile ? 1 : 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener('resize', resize);

  function launch(x = W * (0.08 + Math.random() * 0.84)) {
    const h = H * (0.45 + Math.random() * 0.4);
    shells.push({ x, y: H, vx: (Math.random() - 0.5) * 40, vy: -Math.sqrt(2 * G * h), col: COLORS[(Math.random() * 3) | 0], mix: Math.random() < 0.4 });
  }
  function boom(x, y, col, mix) {
    const n = BURST_COUNT + ((Math.random() * 30) | 0);
    const sp = isMobile ? 60 + Math.random() * 120 : 90 + Math.random() * 190;
    // Limit total sparks for mobile perf
    const toAdd = Math.min(n, MAX_SPARKS - sparks.length);
    for (let i = 0; i < toAdd; i++) {
      const a = Math.random() * 6.2832, v = sp * (0.35 + Math.random() * 0.65);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, decay: 0.5 + Math.random() * 0.5, col: mix ? COLORS[(Math.random() * 3) | 0] : col });
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H); // trails
    ctx.globalCompositeOperation = 'lighter';
    // Slower launch rate on mobile
    const effectiveRate = isMobile ? rate * 0.5 : rate;
    next -= dt; if (next <= 0 && !reduce) { launch(); next = (0.5 + Math.random() * 1.2) / effectiveRate; }
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i]; s.vy += G * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      ctx.fillStyle = 'rgb(255,230,170)'; ctx.fillRect(s.x - 1, s.y - 1, 2.5, 2.5);
      if (s.vy > -25) { boom(s.x, s.y, s.col, s.mix); shells.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.vx *= 0.985; p.vy = p.vy * 0.985 + 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      const r = isMobile ? 1.2 * p.life + 0.3 : 1.6 * p.life + 0.4;
      ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${p.life})`; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  if (burstAtStart) for (let i = 0; i < (isMobile ? 2 : 3); i++) setTimeout(() => launch(), i * 250);

  const stop = () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  stop.boom = (x, y) => boom(x, y, COLORS[(Math.random() * 3) | 0], Math.random() < 0.4);
  return stop;
}
