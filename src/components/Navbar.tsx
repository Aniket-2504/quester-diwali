"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "The box", href: "#gift-box" },
  { label: "The jars", href: "#jar-shelf" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open & listen for Escape key
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 transition-all duration-300 pointer-events-none"
      role="banner"
    >
      {/* Smooth Ambient Blur Glow directly beneath the Navbar */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-[900px] max-w-[100vw] h-44 bg-[radial-gradient(ellipse_at_center,_rgba(24,56,190,0.65)_0%,_rgba(15,35,120,0.32)_45%,_transparent_75%)] blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Full-width glassy pill navigation bar (Matching Reference Image) */}
      <nav
        className="pointer-events-auto w-full max-w-7xl mx-auto rounded-full backdrop-blur-2xl bg-gradient-to-r from-[#080d24]/80 via-[#121f52]/75 to-[#080d24]/80 border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_35px_rgba(22,48,168,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] px-4 sm:px-8 py-2 sm:py-2.5 flex items-center justify-between transition-all relative"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Left: Quester wordmark */}
        <a
          href="#"
          className="flex-shrink-0 flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          aria-label="Quester home"
          onClick={close}
        >
          <span className="font-brand text-xl sm:text-2xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F2B31E] via-[#E6BF5A] to-[#F2B31E] drop-shadow-[0_2px_12px_rgba(242,179,30,0.4)]">
            Quester
          </span>
        </a>

        {/* Center: "The box" and "The jars" navigation links */}
        <div className="hidden sm:flex items-center gap-8 md:gap-14">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-body text-sm md:text-base font-normal text-white/85 hover:text-white transition-colors duration-200 tracking-wide"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right: Golden Pill "Send a gift" Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#jar-shelf"
            className="px-4 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full
                       bg-gradient-to-r from-[#F5C042] via-[#E8B530] to-[#DC9D1B]
                       text-[#151515] shadow-[0_0_18px_rgba(230,191,90,0.45)]
                       hover:shadow-[0_0_26px_rgba(230,191,90,0.7)] hover:brightness-105 active:scale-95
                       transition-all duration-200 tracking-wide font-body whitespace-nowrap"
          >
            Send a gift
          </a>

          {/* Mobile hamburger button */}
          <button
            className="sm:hidden flex justify-center items-center w-9 h-9 ml-1 text-gold"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Glassy Dropdown Menu */}
      <div
        className={`sm:hidden pointer-events-auto fixed inset-x-4 top-18 rounded-2xl backdrop-blur-2xl bg-[#080d24]/95 border border-white/20 p-5 shadow-2xl z-40 flex flex-col items-center gap-5
                    transition-all duration-300 ${
                      menuOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
        aria-hidden={!menuOpen}
      >
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={close}
            className="font-body text-base text-white/90 hover:text-gold transition-colors py-1"
          >
            {l.label}
          </a>
        ))}
      </div>
    </header>
  );
}
