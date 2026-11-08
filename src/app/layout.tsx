import type { Metadata } from "next";
import localFont from "next/font/local";
import SmoothScroll from "@/components/SmoothScroll";
import BackgroundMusic from "@/components/BackgroundMusic";
import "./globals.css";

const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-700.woff2", weight: "700", style: "normal" },
  ],
});

const outfit = localFont({
  variable: "--font-outfit",
  display: "swap",
  src: [
    { path: "../fonts/outfit-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/outfit-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/outfit-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/outfit-600.woff2", weight: "600", style: "normal" },
  ],
});

const montserrat = localFont({
  variable: "--font-montserrat",
  display: "swap",
  src: [
    { path: "../fonts/montserrat-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/montserrat-800.woff2", weight: "800", style: "normal" },
    { path: "../fonts/montserrat-900.woff2", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Quester Diwali — Craft Your Gift",
  description:
    "Celebrate Diwali with Quester. Build a custom gift box of premium treats and send it to someone special.",
  openGraph: {
    title: "Quester Diwali — Craft Your Gift",
    description:
      "Build a custom Diwali gift box with premium treats and share the joy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${outfit.variable} ${montserrat.variable}`}
    >
      <head>
        {/* Instant audio preloader to eliminate network buffering delay */}
        <link
          rel="preload"
          href="/musicforpeople-indian-music-491998.mp3"
          as="audio"
          type="audio/mpeg"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-[#06050a] text-fg relative">
        {/* Native Audio element in raw DOM for zero-delay instant playback */}
        <audio
          id="bg-music"
          src="/musicforpeople-indian-music-491998.mp3"
          preload="auto"
          autoPlay
          loop
          playsInline
        />

        {/* Immediate zero-delay audio activation script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var a = document.getElementById('bg-music');
                  if (!a) return;
                  a.volume = 0.45;
                  
                  // Check user mute preference
                  if (localStorage.getItem('iqoo_music_muted') === 'true') {
                    a.pause();
                    return;
                  }

                  // Attempt immediate autoplay on HTML parse
                  var p = a.play();
                  if (p && p.catch) {
                    p.catch(function() {
                      // If browser requires gesture, play on the very first micro-gesture
                      var triggered = false;
                      var start = function() {
                        if (triggered) return;
                        if (localStorage.getItem('iqoo_music_muted') !== 'true') {
                          a.play().catch(function(){});
                        }
                        triggered = true;
                        ['pointerdown', 'pointermove', 'touchstart', 'click', 'scroll', 'keydown'].forEach(function(e) {
                          window.removeEventListener(e, start);
                          document.removeEventListener(e, start);
                        });
                      };
                      ['pointerdown', 'pointermove', 'touchstart', 'click', 'scroll', 'keydown'].forEach(function(e) {
                        window.addEventListener(e, start, { passive: true, once: true });
                        document.addEventListener(e, start, { passive: true, once: true });
                      });
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />

        <SmoothScroll />
        <BackgroundMusic />
        {children}
      </body>
    </html>
  );
}
