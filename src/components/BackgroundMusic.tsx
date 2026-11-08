"use client";

import { useEffect, useCallback, useRef } from "react";

export default function BackgroundMusic() {
  // Always show as playing — music is ALWAYS on
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Aggressively ensure music is always playing
  const ensurePlaying = useCallback(() => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    // Always clear any muted state
    localStorage.removeItem("iqoo_music_muted");

    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    ensurePlaying();

    // Keep checking every 500ms to ensure music is always playing
    retryRef.current = setInterval(ensurePlaying, 500);

    // Also listen for any pause event and immediately resume
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    const onPause = () => {
      // Immediately resume if paused for any reason
      setTimeout(() => {
        const a = document.getElementById("bg-music") as HTMLAudioElement | null;
        if (a && a.paused) {
          a.play().catch(() => {});
        }
      }, 50);
    };

    // Listen for visibility changes to resume on tab switch back
    const onVisibilityChange = () => {
      if (!document.hidden) {
        ensurePlaying();
      }
    };

    audio?.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Also listen for any user interaction to ensure audio plays (browser autoplay policies)
    const forcePlay = () => ensurePlaying();
    const events = ["pointerdown", "pointermove", "touchstart", "click", "scroll", "keydown"] as const;
    events.forEach((e) => {
      window.addEventListener(e, forcePlay, { passive: true });
    });

    return () => {
      if (retryRef.current) clearInterval(retryRef.current);
      audio?.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      events.forEach((e) => {
        window.removeEventListener(e, forcePlay);
      });
    };
  }, [ensurePlaying]);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 select-none">
      {/* Music is always on — just show the animated equalizer as a visual indicator */}
      <div
        className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-2xl bg-[#090e24]/90 border-gold/70 text-gold shadow-[0_0_22px_rgba(230,191,90,0.4)]"
        aria-label="Diwali background music is playing"
        title="Diwali music is playing"
      >
        {/* Animated Equalizer Bars */}
        <div className="flex items-end gap-[3px] h-4 w-4 justify-center">
          <span
            className="w-[2.5px] h-full bg-gold rounded-full music-bar animate-[musicBar_0.65s_ease-in-out_infinite_alternate]"
          />
          <span
            className="w-[2.5px] h-full bg-gold rounded-full music-bar animate-[musicBar_0.5s_ease-in-out_infinite_alternate_0.15s]"
          />
          <span
            className="w-[2.5px] h-full bg-gold rounded-full music-bar animate-[musicBar_0.75s_ease-in-out_infinite_alternate_0.3s]"
          />
        </div>

        {/* Indicator text */}
        <span className="font-body text-[11px] uppercase tracking-wider font-semibold">
          Music ON
        </span>

        {/* Ambient pulse glow */}
        <span className="absolute -inset-0.5 rounded-full border border-gold/40 animate-ping pointer-events-none" />
      </div>
    </div>
  );
}
