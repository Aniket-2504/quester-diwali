"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { JarItem, SlotSelection } from "@/types/gift";
import JarShelf from "./JarShelf";
import SendGiftModal from "./SendGiftModal";
import FlyingJarArc, { FlyingJarData } from "./FlyingJarArc";
import Fireworks from "./Fireworks";
import { useInView } from "@/lib/useInView";
import { scrollPageTo } from "@/lib/scroll";

// Start downloading the 3D code straight away, ahead of hydration
if (typeof window !== "undefined") {
  import("./GiftBoxCanvas");
  import("./JarStage");
}

const BOX_STAGE_HEIGHT = "h-[min(96vw,420px)] sm:h-[400px] md:h-[460px] lg:h-[500px]";

// Gives the hero Q first go at the main thread, unless the visitor scrolls here sooner
const LOAD_3D_AFTER_MS = 1200;

const NAVBAR_CLEARANCE = 72;

/** Brings the box on screen so a picked jar is seen landing, and leaves the page alone if it's already visible. */
function revealBox(box: HTMLElement) {
  const rect = box.getBoundingClientRect();
  const visible =
    Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, NAVBAR_CLEARANCE);
  if (visible < rect.height * 0.6) scrollPageTo(box, -16);
}

function BoxPlaceholder() {
  return (
    <div className={`w-full ${BOX_STAGE_HEIGHT} flex items-center justify-center`}>
      <div className="w-36 h-24 sm:w-48 sm:h-32 rounded-xl bg-gradient-to-br from-gold/20 to-royal/20 animate-pulse" />
    </div>
  );
}

const GiftBoxCanvas = dynamic(() => import("./GiftBoxCanvas"), {
  ssr: false,
  loading: () => <BoxPlaceholder />,
});

export default function GiftBuilderSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<SlotSelection>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [flyingJars, setFlyingJars] = useState<FlyingJarData[]>([]);

  const sectionRef = useRef<HTMLElement>(null);
  const boxContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoOpened = useRef(false);
  const flightCounter = useRef(0);

  const isNearViewport = useInView(sectionRef, "60% 0px");
  const [timerElapsed, setTimerElapsed] = useState(false);
  const load3D = isNearViewport || timerElapsed;

  useEffect(() => {
    const timer = setTimeout(() => setTimerElapsed(true), LOAD_3D_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  // Auto-open lid when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAutoOpened.current) {
            setIsOpen(true);
            hasAutoOpened.current = true;
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Handle clicking a jar on the shelf
  const handleToggleJar = useCallback(
    (item: JarItem, e: React.MouseEvent) => {
      // If the gift box is closed, automatically open the lid so the jar lands inside!
      setIsOpen(true);

      const existingIndex = selectedSlots.findIndex((s) => s?.id === item.id);

      // If already in the box, remove it
      if (existingIndex !== -1) {
        setSelectedSlots((prev) => {
          const next = [...prev];
          next[existingIndex] = null;
          return next;
        });
        return;
      }

      // If not in the box, find first empty slot
      const firstEmptyIndex = selectedSlots.findIndex((s) => s === null);
      if (firstEmptyIndex !== -1) {
        // Fly out of the jar's own cell, which also works for keyboard presses that have no pointer position
        const jarCell = e.currentTarget
          .querySelector("[data-jar-cell]")
          ?.getBoundingClientRect();
        const targetEl = boxContainerRef.current;
        if (targetEl) revealBox(targetEl);

        flightCounter.current += 1;
        const flightId = `${item.id}-${Date.now()}-${flightCounter.current}-${Math.random().toString(36).slice(2, 6)}`;

        setFlyingJars((curr) => [
          ...curr,
          {
            id: flightId,
            item,
            startX: jarCell ? jarCell.left + jarCell.width / 2 : window.innerWidth / 2,
            startY: jarCell ? jarCell.top + jarCell.height / 2 : window.innerHeight * 0.7,
            targetEl,
          },
        ]);

        setSelectedSlots((prev) => {
          const next = [...prev];
          const emptyIdx = next.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            next[emptyIdx] = item;
          }
          return next;
        });
      }
    },
    [selectedSlots]
  );

  const handleRemoveSlot = useCallback((index: number) => {
    setSelectedSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }, []);

  const handleFlightComplete = useCallback((id: string) => {
    setFlyingJars((curr) => curr.filter((f) => f.id !== id));
  }, []);

  return (
    <section
      id="gift-box"
      ref={sectionRef}
      className="relative w-full min-h-screen pt-16 sm:pt-24 md:pt-28 pb-8 sm:pb-16 px-2 sm:px-6 md:px-8 flex flex-col items-center bg-transparent overflow-hidden"
    >
      {/* Festive Fireworks Canvas across the Gift Section background */}
      <div className="absolute inset-0 pointer-events-none opacity-60 z-0">
        <Fireworks />
      </div>

      {/* Flying Jar Arc Overlays */}
      {flyingJars.map((flight) => (
        <FlyingJarArc
          key={flight.id}
          flight={flight}
          onComplete={handleFlightComplete}
        />
      ))}

      {/* Soft background glow for the stage (No hard rectangular borders) */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none rounded-full blur-3xl opacity-35 bg-[radial-gradient(ellipse_at_center,_#e6bf5a_0%,_#1630a8_45%,_transparent_75%)]"
        aria-hidden="true"
      />

      {/* Header & Short Headline */}
      <div className="relative z-10 text-center max-w-2xl mb-2 sm:mb-4 px-2">
        <span className="font-body text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold/80 block mb-1">
          Custom Celebration Box
        </span>
        <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl font-semibold tracking-wide text-gold leading-tight">
          Build Your Own Gift Box
        </h2>
        <p className="mt-1.5 font-body text-xs sm:text-sm md:text-base text-fg/70 max-w-md mx-auto">
          Tap the box to open or close. Pick 6 treats below to fill your hamper.
        </p>
      </div>

      {/* 3D Stage with Interactive Box (Completely borderless, no clipping, fully responsive) */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Interactive hint pill */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="mb-1 px-4 py-1 rounded-full border border-gold/40 text-[11px] font-body uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all cursor-pointer flex items-center gap-2"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOpen ? "bg-green-400" : "bg-gold"
            }`}
          />
          {isOpen ? "Tap Box to Close Lid" : "Tap Box to Open Lid"}
        </button>

        {/* 3D Gift Box Canvas */}
        <div
          ref={boxContainerRef}
          className="w-full relative flex items-center justify-center"
        >
          {load3D ? (
            <GiftBoxCanvas
              selectedSlots={selectedSlots}
              isOpen={isOpen}
              onToggleOpen={() => setIsOpen((v) => !v)}
              className={`w-full ${BOX_STAGE_HEIGHT}`}
            />
          ) : (
            <BoxPlaceholder />
          )}
        </div>
      </div>

      {/* Jar Shelf (Directly below the box with the 2-row grid and top status strip) */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center mt-3 sm:mt-5">
        <JarShelf
          selectedSlots={selectedSlots}
          load3D={load3D}
          onToggleJar={handleToggleJar}
          onRemoveSlot={handleRemoveSlot}
          onOpenSendModal={() => setIsModalOpen(true)}
        />
      </div>

      {/* Send Gift Customization Modal */}
      <SendGiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSlots={selectedSlots}
      />
    </section>
  );
}
