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
  targetX: number;
  targetY: number;
}

interface FlyingJarArcProps {
  flight: FlyingJarData;
  onComplete: (id: string) => void;
}

export default function FlyingJarArc({ flight, onComplete }: FlyingJarArcProps) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const { startX, startY, targetX, targetY } = flight;
    const progress = { val: 0 };

    const tween = gsap.to(progress, {
      val: 1,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => {
        const t = progress.val;
        // Parabolic arc: rises up to 130px midway before swooping into box
        const curX = startX + (targetX - startX) * t;
        const curY = startY + (targetY - startY) * t - Math.sin(t * Math.PI) * 130;
        const scale = 1 + Math.sin(t * Math.PI) * 0.35;
        const rot = Math.sin(t * Math.PI * 2) * 15;

        el.style.transform = `translate3d(${curX - 24}px, ${curY - 24}px, 0) scale(${scale}) rotate(${rot}deg)`;
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
      className="fixed top-0 left-0 z-50 pointer-events-none will-change-transform"
      style={{
        transform: `translate3d(${flight.startX - 24}px, ${flight.startY - 24}px, 0)`,
      }}
    >
      <div className="w-12 h-12 rounded-full border-2 border-gold bg-[#0e1638] shadow-[0_0_25px_rgba(230,191,90,0.8)] flex items-center justify-center">
        <div
          className="w-5 h-5 rounded-full border border-gold/60 shadow-sm"
          style={{ backgroundColor: `#${flight.item.color.toString(16).padStart(6, "0")}` }}
        />
      </div>
    </div>
  );
}

