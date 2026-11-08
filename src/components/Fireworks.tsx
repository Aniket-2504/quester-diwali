"use client";

import { useRef, useEffect } from "react";

interface FireworksProps {
  interactive?: boolean;
}

export default function Fireworks({ interactive = true }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<((() => void) & { boom?: (x: number, y: number) => void }) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let localStop: ((() => void) & { boom?: (x: number, y: number) => void }) | null = null;

    // Dynamic import so the module runs only in the browser
    import("@/lib/fireworks").then(({ startFireworks }) => {
      localStop = startFireworks(canvas, { rate: 1, burstAtStart: true });
      stopRef.current = localStop;
    });

    return () => {
      localStop?.();
      stopRef.current = null;
    };
  }, []);

  // Global click / tap to burst fireworks in the background
  useEffect(() => {
    if (!interactive) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only burst if clicking on background (not interactive buttons/inputs)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("canvas")
      ) {
        return;
      }

      if (stopRef.current?.boom) {
        stopRef.current.boom(e.clientX, e.clientY);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
