"use client";

import { ArrowRight, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GiftData } from "@/types/gift";
import Fireworks from "./Fireworks";
import ReceiverGiftClient from "./ReceiverGiftClient";

export default function GiftNotFound() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const [recoveredGift, setRecoveredGift] = useState<GiftData | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!id) {
      setChecked(true);
      return;
    }

    // 1. Try fetching from API in case of SSR delay
    fetch(`/api/gift/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.gift) {
          setRecoveredGift(data.gift);
        } else {
          // 2. Check localStorage backup
          try {
            const raw = localStorage.getItem("iqoo_diwali_gifts");
            if (raw) {
              const store = JSON.parse(raw);
              if (store[id]) {
                setRecoveredGift(store[id]);
              }
            }
          } catch (e) {
            console.error("Local recovery error:", e);
          }
        }
        setChecked(true);
      })
      .catch(() => {
        setChecked(true);
      });
  }, [id]);

  if (recoveredGift) {
    return <ReceiverGiftClient gift={recoveredGift} />;
  }

  if (!checked) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-gold/30 border-t-gold animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-transparent px-6 text-center overflow-hidden">
      <Fireworks />

      <div className="relative z-10 max-w-md rounded-2xl bg-[#0c0c0c] border border-gold/30 p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center">
        <div className="w-16 h-16 rounded-full border border-gold/40 flex items-center justify-center mb-4 text-gold shadow-[0_0_20px_rgba(230,191,90,0.2)]">
          <Flame className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="text-[10px] uppercase tracking-[0.25em] text-gold/80 font-brand font-bold mb-2">
          Quester Diwali
        </span>

        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-wide text-gold">
          Gift Box Not Found
        </h1>

        <p className="mt-3 font-body text-sm text-fg/70 leading-relaxed">
          This Diwali hamper may have expired, or the link may be incomplete.
          The festival is still bright — craft a personalized celebration box of
          your own!
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gold text-black font-body text-xs uppercase tracking-[0.2em] font-semibold hover:bg-gold/90 transition-all shadow-lg"
        >
          Craft a Diwali Gift Box
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
