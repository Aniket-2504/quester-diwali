"use client";

import { useMemo } from "react";
import { ITEMS } from "@/lib/iqooModels";
import { JarItem, SlotSelection } from "@/types/gift";
import JarThumbnail from "./JarThumbnail";

interface JarShelfProps {
  selectedSlots: SlotSelection;
  onToggleJar: (item: JarItem, e: React.MouseEvent) => void;
  onRemoveSlot: (index: number) => void;
  onOpenSendModal: () => void;
}

export default function JarShelf({
  selectedSlots,
  onToggleJar,
  onRemoveSlot,
  onOpenSendModal,
}: JarShelfProps) {
  // Count filled slots
  const count = useMemo(() => {
    return selectedSlots.filter(Boolean).length;
  }, [selectedSlots]);

  const isFull = count === 6;

  return (
    <div
      id="jar-shelf"
      className="w-full max-w-5xl mx-auto flex flex-col items-center px-3 sm:px-6 md:px-8"
    >
      {/* ── Top Status Strip (Spans full width of jar shelf, perfectly centered) ── */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-white/10 mb-6 sm:mb-10">
        {/* Left: 6 Slot Chips */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          {selectedSlots.map((item, idx) => (
            <div
              key={idx}
              className={`h-7 sm:h-9 px-2 sm:px-3.5 rounded-full flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-body transition-all ${
                item
                  ? "border border-gold/60 bg-gold/10 text-gold shadow-[0_0_12px_rgba(230,191,90,0.2)]"
                  : "border border-dashed border-white/20 bg-transparent text-transparent w-7 sm:w-11"
              }`}
            >
              {item ? (
                <>
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSlot(idx)}
                    aria-label={`Remove ${item.name}`}
                    className="text-gold/70 hover:text-gold hover:scale-125 transition-transform cursor-pointer text-sm leading-none"
                  >
                    ×
                  </button>
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Right: Counter status & Send Gift Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="font-body text-xs sm:text-sm text-fg/60 tracking-wide whitespace-nowrap">
            {isFull ? "✨ All 6 chosen" : `Pick ${6 - count} more`}
          </span>

          <button
            type="button"
            disabled={!isFull}
            onClick={onOpenSendModal}
            className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full font-body text-xs sm:text-sm tracking-wider uppercase font-semibold transition-all duration-300 ${
              isFull
                ? "bg-gold text-black border-2 border-gold shadow-[0_0_20px_rgba(230,191,90,0.6)] animate-gold-pulse hover:scale-105 cursor-pointer"
                : "bg-white/10 text-fg/40 border border-white/10 cursor-not-allowed"
            }`}
          >
            Send gift
          </button>
        </div>
      </div>

      {/* ── 10 Jars Grid: 2 Rows of 5 Jars (Mobile-optimized) ── */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Row 1: First 5 Jars */}
        <div className="w-full grid grid-cols-5 gap-y-4 sm:gap-y-10 gap-x-1 sm:gap-x-6 md:gap-x-8 justify-items-center mb-4 sm:mb-10">
          {ITEMS.slice(0, 5).map((item: JarItem) => {
            const isSelected = selectedSlots.some((s) => s?.id === item.id);
            return (
              <JarThumbnail
                key={item.id}
                item={item}
                isSelected={isSelected}
                disabled={isFull}
                onClick={(e) => onToggleJar(item, e)}
              />
            );
          })}
        </div>

        {/* Row 2: Second 5 Jars */}
        <div className="w-full grid grid-cols-5 gap-y-4 sm:gap-y-10 gap-x-1 sm:gap-x-6 md:gap-x-8 justify-items-center">
          {ITEMS.slice(5, 10).map((item: JarItem) => {
            const isSelected = selectedSlots.some((s) => s?.id === item.id);
            return (
              <JarThumbnail
                key={item.id}
                item={item}
                isSelected={isSelected}
                disabled={isFull}
                onClick={(e) => onToggleJar(item, e)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
