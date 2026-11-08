"use client";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-transparent text-fg border-t border-gold/20 py-12 sm:py-16 px-4 sm:px-8 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Quester Wordmark Brand */}
        <div className="mb-3">
          <span className="font-brand text-2xl sm:text-3xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#F2B31E] via-[#E6BF5A] to-[#F2B31E] drop-shadow-[0_2px_14px_rgba(242,179,30,0.45)]">
            Quester
          </span>
        </div>

        {/* Official Tagline: "I Quest On and On" */}
        <p className="font-heading italic text-xl sm:text-2xl md:text-3xl text-gold tracking-wider font-semibold">
          &ldquo;I Quest On and On&rdquo;
        </p>

        {/* Festive Note (Made with love, Happy Diwali everyone!) */}
        <p className="mt-3 text-xs sm:text-sm font-body text-fg/75 max-w-md tracking-wide leading-relaxed">
          Made with love, celebrating festive moments and high-performance spirits. Happy Diwali everyone! 🪔✨
        </p>

        {/* Navigation Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-6 pt-6 border-t border-white/10 w-full max-w-lg">
          <a
            href="#gift-box"
            className="font-body text-xs sm:text-sm text-fg/75 hover:text-gold transition-colors tracking-wide"
          >
            The box
          </a>
          <a
            href="#jar-shelf"
            className="font-body text-xs sm:text-sm text-fg/75 hover:text-gold transition-colors tracking-wide"
          >
            The jars
          </a>
          <a
            href="#jar-shelf"
            className="font-body text-xs sm:text-sm text-gold hover:text-gold/80 transition-colors font-medium tracking-wide"
          >
            Send a gift
          </a>
          <button
            type="button"
            onClick={scrollToTop}
            className="font-body text-xs sm:text-sm text-fg/50 hover:text-fg transition-colors tracking-wide cursor-pointer"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
