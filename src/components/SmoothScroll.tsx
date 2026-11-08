"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      autoResize: true,
      anchors: { offset: -80 }, // keeps "#section" links clear of the fixed navbar
    });

    // Lenis animates "#section" links itself but leaves the browser's instant jump in place
    const stopNativeAnchorJump = (e: MouseEvent) => {
      if ((e.target as Element).closest?.('a[href^="#"]:not([href="#"])')) {
        e.preventDefault();
      }
    };
    document.addEventListener("click", stopNativeAnchorJump, true);

    // Expose lenis instance globally for dynamic resize triggers
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    // Observe DOM changes so whenever dynamic cards appear, Lenis recalibrates scroll limits immediately!
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });
    resizeObserver.observe(document.body);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", stopNativeAnchorJump, true);
      resizeObserver.disconnect();
      delete (window as unknown as { lenis?: Lenis }).lenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
