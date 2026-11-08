import type Lenis from "lenis";

export function getLenis(): Lenis | undefined {
  return (window as unknown as { lenis?: Lenis }).lenis;
}

/** Scrolls through Lenis when it's running, so the two never fight over the page. */
export function scrollPageTo(target: HTMLElement | number, offset = 0) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 0.6 });
    return;
  }
  // Lenis only stays off for visitors who asked for reduced motion, so jump instead of animating
  const top =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + offset);
}
