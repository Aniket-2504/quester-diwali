"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronsDown, Move } from "lucide-react";
import photos from "@/lib/galleryPhotos.json";
import { useInView } from "@/lib/useInView";

/*
 * Photos start as a tilted stack and scatter across the screen as the visitor scrolls.
 * Everything moves through transforms written straight to the DOM, once per frame, so
 * React never re-renders during the animation. Plain images: no WebGL limit applies.
 */

const CARD_BASE = "min(58vw, 40svh, 340px)";
const baseWidth = (w: number, h: number) => Math.min(w * 0.58, h * 0.4, 340);

const STACK_HOLD = 0.06; // scroll fraction the stack stays closed
const SCATTER_SPAN = 0.5; // scroll fraction one card takes to reach its place
const MAX_STAGGER = 0.2;
const SCROLL_SMOOTHING = 9;
const THROW_FRICTION = 4.5;
const EDGE_SPRING = 10;
const SNAP_BACK_BELOW = 0.1; // scroll progress under which dragged cards rejoin the stack
const TOUCH_HOLD_MS = 150;
const TOP_CLEARANCE = 64; // keeps the top row out from under the navbar

// Left-aligned on phones so it doesn't run into the music button at bottom right
const HINT_POSITION =
  "absolute bottom-5 sm:bottom-6 inset-x-0 z-[60] flex justify-start sm:justify-center pl-4 sm:pl-0 pointer-events-none";

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Seeded so the server and the browser agree on every card's starting tilt
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNT = photos.length;
const random = seededRandom(20261108);

const CARDS = photos.map((photo, i) => {
  const aspect = photo.width / photo.height;
  const side = i % 2 === 0 ? 1 : -1;
  return {
    ...photo,
    aspect,
    sizeFactor: Math.sqrt(clamp(aspect, 0.62, 1.55) / 0.75),
    stackTilt: side * lerp(2.5, 9, random()),
    scatterTilt: -side * lerp(2, 7, random()),
    jitterX: random() - 0.5,
    jitterY: random() - 0.5,
    // Top of the stack leaves first
    delay: ((COUNT - 1 - i) / Math.max(1, COUNT - 1)) * MAX_STAGGER,
  };
});

function cardTransform(x: number, y: number, rotate: number, scale: number) {
  return `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
}

interface Target {
  x: number;
  y: number;
  scale: number;
}

/** Fans the photos over a grid, leaving the cells nearest the centre free for the heading. */
function computeTargets(width: number, height: number): Target[] {
  const cols = width < 520 ? 3 : width < 900 ? 4 : 6;
  const rows = Math.ceil((COUNT + (width < 520 ? 3 : 4)) / cols);
  const usableHeight = height - TOP_CLEARANCE;
  const cellW = width / cols;
  const cellH = usableHeight / rows;
  const base = baseWidth(width, height);

  // On tall screens the heading spans the full width, so whole middle rows give way to it
  const isTall = height > width;
  const widthWeight = isTall ? 0.35 : 1;
  const centreDistance = (u: number, v: number) => Math.hypot(u * widthWeight, v);
  const headingHalfGap = isTall ? height * 0.11 : 0;

  const placeY = (v: number) => {
    if (!isTall) return v * usableHeight;
    // Rows are squeezed outward so the gap around the heading stays open
    const halfHeight = usableHeight / 2;
    return (
      Math.sign(v) *
      (headingHalfGap + (Math.abs(v) / 0.5) * (halfHeight - headingHalfGap))
    );
  };

  const cells = Array.from({ length: rows * cols }, (_, n) => ({
    u: ((n % cols) + 0.5) / cols - 0.5,
    v: (Math.floor(n / cols) + 0.5) / rows - 0.5,
  }))
    .sort((a, b) => centreDistance(b.u, b.v) - centreDistance(a.u, a.v))
    .slice(0, COUNT);

  // Shuffle so neighbours in the stack land in unrelated directions
  const shuffle = seededRandom(7);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(shuffle() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return CARDS.map((card, i) => {
    const cardW = base * card.sizeFactor;
    const cardH = cardW / card.aspect;
    return {
      x: cells[i].u * width + card.jitterX * cellW * 0.22,
      y: placeY(cells[i].v) + TOP_CLEARANCE / 2 + card.jitterY * cellH * 0.22,
      scale: Math.min((cellW * 1.3) / cardW, (cellH * 1.45) / cardH),
    };
  });
}

interface Motion {
  offsetX: number;
  offsetY: number;
  velocityX: number;
  velocityY: number;
  dragging: boolean;
  lift: number;
}

interface Grab {
  index: number;
  pointerId: number;
  element: HTMLElement;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  engaged: boolean;
}

export default function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const dragHintRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const motion = useRef<Motion[]>(
    CARDS.map(() => ({
      offsetX: 0,
      offsetY: 0,
      velocityX: 0,
      velocityY: 0,
      dragging: false,
      lift: 0,
    }))
  );
  const progress = useRef(0);
  const targets = useRef<Target[]>([]);
  const inView = useInView(sectionRef, "200px");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      if (stage.clientWidth > 0) {
        targets.current = computeTargets(stage.clientWidth, stage.clientHeight);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Dragging. On touch, a sideways move or a short hold picks a photo up, and an immediate
  // up-or-down swipe is left alone so the page can still scroll with photos under the finger.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let grab: Grab | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let topZ = COUNT + 1;

    const engage = () => {
      if (!grab) return;
      clearTimeout(holdTimer);
      grab.engaged = true;
      const card = motion.current[grab.index];
      card.dragging = true;
      card.velocityX = 0;
      card.velocityY = 0;
      grab.element.style.zIndex = String(++topZ);
      grab.element.style.cursor = "grabbing";
      grab.element.setPointerCapture?.(grab.pointerId);
    };

    const release = () => {
      clearTimeout(holdTimer);
      if (grab) {
        motion.current[grab.index].dragging = false;
        grab.element.style.cursor = "";
      }
      grab = null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (grab || (e.pointerType === "mouse" && e.button !== 0)) return;
      const element = (e.target as Element).closest<HTMLElement>("[data-card]");
      if (!element) return;
      grab = {
        index: Number(element.dataset.card),
        pointerId: e.pointerId,
        element,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: e.timeStamp,
        engaged: false,
      };
      if (e.pointerType === "mouse") engage();
      else holdTimer = setTimeout(engage, TOUCH_HOLD_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.pointerId) return;

      if (!grab.engaged) {
        const dx = Math.abs(e.clientX - grab.startX);
        const dy = Math.abs(e.clientY - grab.startY);
        if (dx > 6 && dx > dy) engage();
        else if (dy > 8) release();
        if (!grab?.engaged) return;
      }

      const card = motion.current[grab.index];
      const dx = e.clientX - grab.lastX;
      const dy = e.clientY - grab.lastY;
      const elapsed = Math.max(1, e.timeStamp - grab.lastTime) / 1000;
      card.offsetX += dx;
      card.offsetY += dy;
      card.velocityX = lerp(card.velocityX, dx / elapsed, 0.35);
      card.velocityY = lerp(card.velocityY, dy / elapsed, 0.35);
      grab.lastX = e.clientX;
      grab.lastY = e.clientY;
      grab.lastTime = e.timeStamp;
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (grab && e.pointerId === grab.pointerId) release();
    };

    // Once a photo is held, the same finger must not also scroll the page
    const onTouchMove = (e: TouchEvent) => {
      if (grab?.engaged && e.cancelable) e.preventDefault();
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerEnd, { passive: true });
    window.addEventListener("pointercancel", onPointerEnd, { passive: true });

    return () => {
      clearTimeout(holdTimer);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, []);

  // Animation loop, only while the section is near the screen
  useEffect(() => {
    if (!inView) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) section.style.height = "100svh";

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (targets.current.length === 0) return;

      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - stage.clientHeight;
      const goal = reducedMotion || scrollable <= 0 ? 1 : clamp(-rect.top / scrollable);
      progress.current = reducedMotion
        ? 1
        : lerp(progress.current, goal, 1 - Math.exp(-dt * SCROLL_SMOOTHING));
      const p = progress.current;

      const halfW = stage.clientWidth / 2;
      const halfH = stage.clientHeight / 2;

      CARDS.forEach((card, i) => {
        const element = cardRefs.current[i];
        const state = motion.current[i];
        const target = targets.current[i];
        if (!element || !target) return;

        const eased = easeInOut(clamp((p - STACK_HOLD - card.delay) / SCATTER_SPAN));

        if (!state.dragging) {
          state.offsetX += state.velocityX * dt;
          state.offsetY += state.velocityY * dt;
          const friction = Math.exp(-dt * THROW_FRICTION);
          state.velocityX *= friction;
          state.velocityY *= friction;

          if (p < SNAP_BACK_BELOW) {
            // Near the top of the section a released photo slides back onto the stack
            const pull = Math.exp(-dt * 7);
            state.offsetX *= pull;
            state.offsetY *= pull;
            state.velocityX = 0;
            state.velocityY = 0;
          } else {
            // A photo thrown off screen eases back to the edge
            const spring = 1 - Math.exp(-dt * EDGE_SPRING);
            const x = target.x * eased + state.offsetX;
            const y = target.y * eased + state.offsetY;
            state.offsetX -= (x - clamp(x, -halfW, halfW)) * spring;
            state.offsetY -= (y - clamp(y, -halfH, halfH)) * spring;
          }
        }

        state.lift = lerp(state.lift, state.dragging ? 1 : 0, 1 - Math.exp(-dt * 16));

        element.style.transform = cardTransform(
          target.x * eased + state.offsetX,
          target.y * eased + state.offsetY,
          lerp(card.stackTilt, card.scatterTilt, eased) * (1 - state.lift * 0.6),
          lerp(1, target.scale, eased) * (1 + state.lift * 0.07)
        );
      });

      const reveal = clamp((p - 0.45) / 0.25);
      if (headingRef.current) {
        headingRef.current.style.opacity = String(reveal);
        headingRef.current.style.transform = `translate(-50%,-50%) scale(${lerp(0.94, 1, reveal).toFixed(4)})`;
      }
      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(1 - clamp(p / 0.08));
      }
      if (dragHintRef.current) {
        dragHintRef.current.style.opacity = String(clamp((p - 0.7) / 0.15));
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <section
      id="moments"
      ref={sectionRef}
      aria-label="Photos from the Questers Diwali meet"
      className="relative w-full h-[340svh]"
    >
      <div
        ref={stageRef}
        className="sticky top-0 w-full h-[100svh] overflow-hidden select-none"
        style={{ "--card-base": CARD_BASE } as React.CSSProperties}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] max-w-[900px] aspect-square rounded-full pointer-events-none opacity-40 bg-[radial-gradient(circle,_rgba(230,191,90,0.35)_0%,_rgba(22,48,168,0.25)_45%,_transparent_70%)]"
          aria-hidden="true"
        />

        <div
          ref={headingRef}
          className="absolute top-1/2 left-1/2 z-0 w-[78vw] max-w-xl text-center pointer-events-none"
          style={{ opacity: 0, transform: "translate(-50%,-50%)" }}
        >
          <span className="block mb-1 font-body text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold/80">
            Questers Meet
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fff4c9] via-[#e6bf5a] to-[#f7d774]">
            One night,
            <br />
            a thousand glows.
          </h2>
        </div>

        {CARDS.map((card, i) => (
          <div
            key={card.src}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            data-card={i}
            className="absolute top-1/2 left-1/2 p-[2.2%] rounded-lg bg-[#fff8e7] shadow-[0_18px_40px_rgba(0,0,0,0.55)] cursor-grab will-change-transform [-webkit-touch-callout:none]"
            style={{
              width: `calc(var(--card-base) * ${card.sizeFactor.toFixed(4)})`,
              zIndex: i + 1,
              touchAction: "pan-y",
              transform: cardTransform(0, 0, card.stackTilt, 1),
            }}
          >
            <Image
              // Already resized to .webp by scripts/build-gallery.mjs, so these are served
              // as plain static files and never depend on Vercel's image optimizer
              unoptimized
              src={card.src}
              alt={`Questers Diwali meet, photo ${i + 1}`}
              width={card.width}
              height={card.height}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block w-full h-auto rounded-[5px] pointer-events-none"
              style={{ backgroundColor: card.color }}
            />
          </div>
        ))}

        <div
          ref={scrollHintRef}
          className={HINT_POSITION}
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#090e24]/85 border border-gold/40 font-body text-[11px] uppercase tracking-widest text-gold">
            <ChevronsDown className="w-3.5 h-3.5" aria-hidden="true" />
            Scroll to scatter
          </span>
        </div>

        <div
          ref={dragHintRef}
          className={HINT_POSITION}
          style={{ opacity: 0 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#090e24]/85 border border-gold/40 font-body text-[11px] uppercase tracking-widest text-gold">
            <Move className="w-3.5 h-3.5" aria-hidden="true" />
            Drag the photos
          </span>
        </div>
      </div>
    </section>
  );
}
