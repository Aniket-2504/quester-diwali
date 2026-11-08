"use client";

import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import Fireworks from "./Fireworks";

// Eagerly preload HeroQCanvas chunk to eliminate delay
if (typeof window !== "undefined") {
  import("./HeroQCanvas");
}

const HeroQCanvas = dynamic(() => import("./HeroQCanvas"), {
  ssr: false,
  // Same outline and framing as the 3D model, so the Q is visible in the very first paint
  loading: () => (
    <svg viewBox="-2 -2 4 4" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-q-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2cf63" />
          <stop offset="1" stopColor="#dca928" />
        </linearGradient>
      </defs>
      <g fill="url(#hero-q-gold)">
        <path d="M1.55 0A1.55 1.55 0 1 0 0 1.55L0 1.04A1.04 1.04 0 1 1 1.04 0Z" />
        <rect x="-.88" y="-.25" width="1.76" height=".5" transform="translate(.775 .76) rotate(45)" />
      </g>
    </svg>
  ),
});

/*
 * Tagline options (Diwali + iQOO brand voice):
 * 1. "Light up every moment. Gift the iQOO way."
 * 2. "A thousand diyas, one extraordinary gift."
 * 3. "This Diwali, send more than wishes."
 *
 * Using #3 — punchy, action-oriented, fits the CTA flow.
 */

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full min-h-[max(100svh,600px)] flex flex-col items-center justify-center overflow-hidden bg-transparent pt-20 pb-16"
    >
      {/* Fireworks background */}
      <Fireworks />

      {/* Smooth Ambient Blur Gradient beneath Navbar & around 3D Q */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[780px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 0%, rgba(24, 54, 185, 0.65) 0%, rgba(18, 38, 138, 0.4) 35%, rgba(8, 18, 65, 0.15) 60%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none select-none max-w-4xl">
        {/* 3D Q logo — smaller on mobile for faster render */}
        <div
          id="hero-q-mount"
          className="w-[min(62vw,34svh)] h-[min(62vw,34svh)] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] lg:w-[460px] lg:h-[460px] mb-2 pointer-events-auto"
          aria-label="3D Q festive logo"
        >
          <HeroQCanvas />
        </div>

        {/* Tagline */}
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-semibold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-[#fff4c9] via-[#e6bf5a] to-[#f7d774] drop-shadow-[0_4px_32px_rgba(230,191,90,0.35)]">
          Light the sky.
          <br />
          Gift the glow.
        </h1>

        <p className="mt-4 font-body text-sm sm:text-base md:text-lg text-fg/75 max-w-lg leading-relaxed">
          Pick six festive jars, wrap them in a Quester celebration box and send the glow to someone you love.
        </p>

        {/* Radiant Golden Pill CTA Button */}
        <a
          href="#gift-box"
          className="mt-6 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-body font-bold text-sm sm:text-base text-[#1a1204]
                     bg-gradient-to-r from-[#ffe9a0] via-[#f2b31e] to-[#d99a0b]
                     shadow-[0_8px_28px_rgba(242,179,30,0.38),inset_0_1px_0_rgba(255,255,255,0.6)]
                     hover:shadow-[0_14px_36px_rgba(242,179,30,0.55),inset_0_1px_0_rgba(255,255,255,0.7)]
                     hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer pointer-events-auto"
        >
          Build your gift box
        </a>
      </div>

      {/* Scroll cue */}
      <a
        href="#gift-box"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 group cursor-pointer"
        aria-label="Scroll down to gift box section"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold/60 group-hover:text-gold transition-colors font-body">
          Explore Gift Box
        </span>
        <ChevronDown
          className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors animate-bounce"
          aria-hidden="true"
        />
      </a>

      {/* Bottom subtle gradient vignette */}
      <div
        className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-[5] pointer-events-none"
        aria-hidden="true"
      />
    </section>
  );
}

