"use client";

import { useRef, useEffect } from "react";
import { startFireworks } from "@/lib/fireworks";
import { useInView } from "@/lib/useInView";

interface FireworksProps {
  interactive?: boolean;
}

type FireworksHandle = ReturnType<typeof startFireworks>;

export default function Fireworks({ interactive = true }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<FireworksHandle | null>(null);
  const inView = useInView(canvasRef);

  // Starts on first sight and only animates while on screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!inView) {
      handleRef.current?.pause();
    } else if (handleRef.current) {
      handleRef.current.resume();
    } else {
      handleRef.current = startFireworks(canvas, { rate: 1, burstAtStart: true });
    }
  }, [inView]);

  useEffect(() => {
    return () => {
      handleRef.current?.();
      handleRef.current = null;
    };
  }, []);

  // Tap on the background to set off a burst
  useEffect(() => {
    if (!interactive) return;

    const handlePointerDown = (e: PointerEvent) => {
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

      handleRef.current?.boom(e.clientX, e.clientY);
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
