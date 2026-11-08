"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type MusicWindow = Window & { __musicStopped?: boolean };

/**
 * The sound button. Autoplay and resuming live in the inline script in layout.tsx, which
 * has to run before React; that script reads __musicStopped and leaves this button's taps alone.
 */
export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    const sync = () => setIsPlaying(!audio.paused);
    sync();
    audio.addEventListener("playing", sync);
    audio.addEventListener("pause", sync);
    return () => {
      audio.removeEventListener("playing", sync);
      audio.removeEventListener("pause", sync);
    };
  }, []);

  const toggle = () => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    const shouldStop = !audio.paused;
    (window as MusicWindow).__musicStopped = shouldStop;
    setIsStopped(shouldStop);
    if (shouldStop) audio.pause();
    else audio.play().catch(() => {});
  };

  const needsTap = !isPlaying && !isStopped;

  return (
    <button
      type="button"
      data-music-toggle
      onClick={toggle}
      className={`fixed bottom-4 right-4 sm:bottom-7 sm:right-7 z-50 select-none flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full backdrop-blur-xl border bg-[#090e24]/90 border-gold/70 text-gold shadow-[0_0_22px_rgba(230,191,90,0.4)] cursor-pointer ${
        needsTap ? "animate-gold-pulse" : ""
      }`}
      aria-label={isPlaying ? "Stop Diwali music" : "Play Diwali music"}
    >
      {isPlaying ? (
        <Volume2 className="w-4 h-4" aria-hidden="true" />
      ) : (
        <VolumeX className="w-4 h-4" aria-hidden="true" />
      )}

      {/* On a phone only the prompt keeps its text, so the button stays clear of the jars */}
      <span
        className={`font-body text-[11px] uppercase tracking-wider font-semibold ${
          needsTap ? "" : "hidden sm:inline"
        }`}
      >
        {isPlaying ? "Music on" : isStopped ? "Music off" : "Tap for music"}
      </span>
    </button>
  );
}
