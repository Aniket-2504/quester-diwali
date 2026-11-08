"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { JarItem } from "@/types/gift";
import { playJarDropSound } from "@/lib/audio";

export interface FlyingJarData {
  id: string;
  item: JarItem;
  startX: number;
  startY: number;
  targetEl: HTMLElement | null;
}

interface FlyingJarArcProps {
  flight: FlyingJarData;
  onComplete: (id: string) => void;
}

const HALF_SIZE = 24;

export default function FlyingJarArc({ flight, onComplete }: FlyingJarArcProps) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const { startX, startY, targetEl } = flight;
    const progress = { val: 0 };

    const tween = gsap.to(progress, {
      val: 1,
      duration: 0.6,
      ease: "power2.inOut",
      onUpdate: () => {
        const t = progress.val;
        // Read every frame because the page may be scrolling the box into view mid-flight
        const box = targetEl?.getBoundingClientRect();
        const targetX = box ? box.left + box.width / 2 : window.innerWidth / 2;
        const targetY = box ? box.top + box.height * 0.62 : window.innerHeight * 0.35;

        const arc = Math.sin(t * Math.PI);
        const x = startX + (targetX - startX) * t;
        const y = startY + (targetY - startY) * t - arc * 130;
        const scale = 1 + arc * 0.3 - t * 0.35;
        const rotation = Math.sin(t * Math.PI * 2) * 15;

        el.style.transform = `translate3d(${x - HALF_SIZE}px, ${y - HALF_SIZE}px, 0) scale(${scale}) rotate(${rotation}deg)`;
      },
      onComplete: () => {
        playJarDropSound();
        onComplete(flight.id);
      },
    });

    return () => {
      tween.kill();
    };
  }, [flight, onComplete]);

  return (
    <div
      ref={elRef}
      className="fixed top-0 left-0 z-50 pointer-events-none will-change-transform w-12 h-12 flex flex-col items-center justify-center drop-shadow-[0_0_14px_rgba(230,191,90,0.8)]"
      style={{
        transform: `translate3d(${flight.startX - HALF_SIZE}px, ${flight.startY - HALF_SIZE}px, 0)`,
      }}
    >
      <div className="w-10 h-2.5 rounded-t-md rounded-b-sm bg-[#d9a92c]" />
      <div
        className="w-9 h-7 rounded-b-lg border border-white/25"
        style={{ backgroundColor: `#${flight.item.color.toString(16).padStart(6, "0")}` }}
      />
    </div>
  );
}
