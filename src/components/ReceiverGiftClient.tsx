"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { GiftData, JarItem, SlotSelection } from "@/types/gift";
import dynamic from "next/dynamic";
import { ArrowRight, Flame, Gift, Sparkles } from "lucide-react";
import { ITEMS } from "@/lib/jarItems";
import Fireworks from "./Fireworks";
import Footer from "./Footer";

const GiftBoxCanvas = dynamic(() => import("./GiftBoxCanvas"), { ssr: false });

interface ReceiverGiftClientProps {
  gift: GiftData;
}

export default function ReceiverGiftClient({ gift }: ReceiverGiftClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Map jarIds to a guaranteed 6-element SlotSelection
  const selectedSlots: SlotSelection = useMemo(() => {
    const itemMap = new Map<string, JarItem>(
      ITEMS.map((item: JarItem) => [item.id, item])
    );
    const slots: SlotSelection = [null, null, null, null, null, null];
    (gift.jarIds || []).forEach((id, idx) => {
      if (idx < 6) {
        slots[idx] = itemMap.get(id) || null;
      }
    });
    return slots;
  }, [gift.jarIds]);

  // Recalibrate Lenis scroll limits whenever the box opens or dynamic treats card mounts
  useEffect(() => {
    const lenis = (window as unknown as { lenis?: { resize: () => void } }).lenis;
    if (lenis) {
      lenis.resize();
      const t = setTimeout(() => lenis.resize(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Personalized inside lid greeting
  const greeting = useMemo<[string, string]>(() => {
    const name = gift.senderName ? gift.senderName.trim().slice(0, 18).toUpperCase() : "iQOO";
    return [`${name} WISHES YOU A`, "HAPPY DIWALI"];
  }, [gift.senderName]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-fg">
      <main className="relative flex-1 w-full flex flex-col items-center pb-24 sm:pb-32">
        {/* Festive Fireworks Canvas across sky and sides */}
        <Fireworks />

        {/* Minimal Top Nav */}
        <header className="relative z-20 w-full max-w-7xl px-6 h-18 flex items-center justify-between gold-hairline">
          <Link href="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity" aria-label="Quester Home">
            <span className="font-brand text-xl sm:text-2xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F2B31E] via-[#E6BF5A] to-[#F2B31E] drop-shadow-[0_2px_10px_rgba(242,179,30,0.35)]">
              Quester
            </span>
          </Link>
          <Link
            href="/"
            className="px-5 py-2 rounded-full border border-gold/40 text-xs font-body uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-colors"
          >
            Send a Gift
          </Link>
        </header>

        {/* Main Content Stage */}
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center px-4 mt-6 sm:mt-10">
          {/* Top Announcement Popup (Deep Midnight Navy with Gold Hairline) */}
          <div className="w-full rounded-2xl bg-[#0D1126] border border-[#263158] p-5 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] text-center flex flex-col items-center mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-gold" aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#E8B530] font-body">
                Special Delivery
              </span>
              <Flame className="w-4 h-4 text-gold" aria-hidden="true" />
            </div>

            <h1 className="font-heading text-2xl sm:text-4xl font-semibold tracking-wide text-gold leading-tight">
              {gift.senderName} sent you an iQOO Diwali gift!
            </h1>

            {gift.role && (
              <p className="mt-1 text-xs font-body text-[#8F97B7] tracking-wider uppercase">
                {gift.role}
              </p>
            )}

            <p className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-body text-fg/75 max-w-md">
              {isOpen && <Sparkles className="w-4 h-4 text-gold flex-shrink-0" aria-hidden="true" />}
              {isOpen
                ? "Your Diwali hamper is unlocked! Jars have dropped into the box."
                : "Tap the closed box below to open it and watch your 6 festive treats drop in!"}
            </p>
          </div>

          {/* Interactive 3D Gift Box (Starts CLOSED, click to open and drop jars from upwards!) */}
          <div className="w-full flex flex-col items-center">
            {/* Interactive unwrap button cue */}
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className={`mb-2 px-6 py-2 rounded-full text-xs font-body uppercase tracking-[0.2em] font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                isOpen
                  ? "bg-[#0D1126] border border-gold/40 text-gold hover:bg-gold/10"
                  : "bg-gradient-to-r from-[#F5C042] via-[#E8B530] to-[#DC9D1B] text-[#151515] border-2 border-gold animate-gold-pulse hover:scale-105"
              }`}
            >
              {!isOpen && <Gift className="w-4 h-4" aria-hidden="true" />}
              <span>{isOpen ? "Tap Box to Close Lid" : "Tap Box to Open & Drop Jars"}</span>
            </button>

            {/* 3D Box Canvas: Completely borderless, seamless on pure black */}
            <div className="w-full relative flex items-center justify-center">
              <GiftBoxCanvas
                selectedSlots={selectedSlots}
                isOpen={isOpen}
                onToggleOpen={() => setIsOpen((v) => !v)}
                greeting={greeting}
                className="w-full h-[min(96vw,420px)] sm:h-[420px] md:h-[460px] lg:h-[500px]"
              />
            </div>
            <span className="text-[11px] font-body text-muted mt-1 tracking-wide">
              (Tap box to open/close or drag to inspect in 3D)
            </span>
          </div>

          {/* Note & Treats Reveal (displayed when open) */}
          {isOpen && (
            <div className="w-full mt-8 flex flex-col gap-6 animate-fade-in">
              {/* Sender Note Card (Matching Dark navy with gold border & attribution) */}
              <div className="w-full rounded-2xl bg-[#0D1126] border border-gold/25 p-5 sm:p-7 shadow-lg text-left relative overflow-hidden">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#E8B530] font-body block mb-2">
                  Personal Diwali Greeting
                </span>

                <p className="font-heading italic text-lg sm:text-2xl text-fg leading-relaxed">
                  &ldquo;{gift.note}&rdquo;
                </p>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-body text-sm font-semibold text-[#E8B530] tracking-wide">
                    — {gift.senderName}
                    {gift.role ? `, ${gift.role}` : ""}
                  </span>
                  <span className="text-[11px] font-body text-[#8F97B7]">
                    iQOO Celebration Box
                  </span>
                </div>
              </div>

              {/* Handpicked Treats Showcase */}
              <div className="w-full rounded-2xl bg-[#0D1126] border border-[#263158] p-5 sm:p-7">
                <h2 className="font-heading text-lg sm:text-xl font-semibold tracking-wide text-gold text-center mb-1">
                  Your 6 Handpicked Delicacies
                </h2>
                <p className="text-xs font-body text-[#8F97B7] text-center mb-5">
                  Artisan festive treats chosen for you
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedSlots.map((item, idx) => {
                    if (!item) return null;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-gold/20 bg-[#070A18] flex items-center gap-3"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 border border-gold/40 shadow-sm"
                          style={{ backgroundColor: `#${item.color.toString(16).padStart(6, "0")}` }}
                        />
                        <div className="truncate">
                          <span className="text-[9px] uppercase tracking-wider text-[#8F97B7] font-body block">
                            Slot {idx + 1}
                          </span>
                          <span className="font-body text-xs sm:text-sm font-medium text-fg truncate block">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Send Your Own Gift CTA */}
              <div className="w-full text-center mt-4 mb-8 flex flex-col items-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F5C042] via-[#E8B530] to-[#DC9D1B] text-[#151515] font-body text-xs uppercase tracking-[0.2em] font-semibold hover:opacity-95 transition-all shadow-[0_0_25px_rgba(230,191,90,0.4)]"
                >
                  Craft Your Own Diwali Gift
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Official Footer */}
      <Footer />
    </div>
  );
}
