"use client";

import { RefObject, useEffect, useState } from "react";

/** True while the element is on screen, or within `rootMargin` of it. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = "0px"
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
