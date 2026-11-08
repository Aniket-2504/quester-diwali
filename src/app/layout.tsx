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
      <body className="min-h-screen flex flex-col antialiased bg-[#06050a] text-fg relative">
        {/* In the raw HTML so playback doesn't have to wait for React */}
        <audio
          id="bg-music"
          src="/musicforpeople-indian-music-491998.mp3"
          preload="auto"
          autoPlay
          loop
          playsInline
        />

        {/*
          Runs during HTML parsing. Browsers refuse sound until the visitor has interacted
          with the page, so if the first play() is blocked, every event that counts as an
          interaction retries it. The listeners stay on so music also resumes after an
          interruption such as a phone call. Pressing the sound button sets __musicStopped
          for this page load, so a refresh starts the song again.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var a = document.getElementById('bg-music');
                if (!a) return;
                a.volume = 0.45;
                function play(e) {
                  if (!a.paused || window.__musicStopped) return;
                  // The sound button decides for itself, or its first tap would start and then stop the song
                  var t = e && e.target;
                  if (t && t.closest && t.closest('[data-music-toggle]')) return;
                  var p = a.play();
                  if (p && p.catch) p.catch(function() {});
                }
                ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'click', 'keydown'].forEach(function(e) {
                  window.addEventListener(e, play, { capture: true, passive: true });
                });
                a.addEventListener('pause', function() { setTimeout(play, 80); });
                document.addEventListener('visibilitychange', function() {
                  if (!document.hidden) play();
                });
                play();
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
