"use client";

import { useState, useEffect, useCallback } from "react";

export default function BackgroundMusic() {
  // Initialize to true immediately on client so the equalizer animates with zero delay
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("iqoo_music_muted") !== "true";
  });

  useEffect(() => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    // Immediately check if already playing or should play
    const isMuted = localStorage.getItem("iqoo_music_muted") === "true";
    if (isMuted) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    if (!audio.paused) {
      // User explicitly stopped music
      localStorage.setItem("iqoo_music_muted", "true");
      audio.pause();
      setIsPlaying(false);
    } else {
      // User unmuted music
      localStorage.setItem("iqoo_music_muted", "false");
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.warn("Audio play error:", e);
        });
    }
  }, []);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 select-none">
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={isPlaying ? "Mute Diwali background music" : "Play Diwali background music"}
        title={isPlaying ? "Click to mute music" : "Click to play music"}
        className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-2xl group cursor-pointer ${
          isPlaying
            ? "bg-[#090e24]/90 border-gold/70 text-gold shadow-[0_0_22px_rgba(230,191,90,0.4)]"
            : "bg-[#090e24]/85 border-white/20 text-white/50 hover:text-white hover:border-gold/50"
        }`}
      >
        {/* Animated Equalizer Bars with GPU Hardware Acceleration */}
        <div className="flex items-end gap-[3px] h-4 w-4 justify-center">
          <span
            className={`w-[2.5px] h-full bg-gold rounded-full music-bar transition-transform ${
              isPlaying
                ? "animate-[musicBar_0.65s_ease-in-out_infinite_alternate]"
                : "scale-y-[0.25]"
            }`}
          />
          <span
            className={`w-[2.5px] h-full bg-gold rounded-full music-bar transition-transform ${
              isPlaying
                ? "animate-[musicBar_0.5s_ease-in-out_infinite_alternate_0.15s]"
                : "scale-y-[0.35]"
            }`}
          />
          <span
            className={`w-[2.5px] h-full bg-gold rounded-full music-bar transition-transform ${
              isPlaying
                ? "animate-[musicBar_0.75s_ease-in-out_infinite_alternate_0.3s]"
                : "scale-y-[0.25]"
            }`}
          />
        </div>

        {/* Indicator text */}
        <span className="font-body text-[11px] uppercase tracking-wider font-semibold">
          {isPlaying ? "Music ON" : "Music OFF"}
        </span>

        {/* Ambient pulse glow when playing */}
        {isPlaying && (
          <span className="absolute -inset-0.5 rounded-full border border-gold/40 animate-ping pointer-events-none" />
        )}
      </button>
    </div>
  );
}
