import { useEffect, useRef, useState } from "react";

/*
 * The site's own small motions: panels that light up under the pointer, things that arrive as the page is scrolled,
 * and numbers that count up. One listener and one observer for the whole page, set up once per page.
 */

/**
 * Wires a page's `data-glow` panels to the pointer and brings its `data-reveal` blocks in as they are scrolled to.
 * Runs again when the page changes, so a page opened from a link gets the same treatment as the first one.
 */
export function useSiteMotion(path: string) {
  useEffect(() => {
    // The light inside a panel follows the pointer: the panel reads where it is from two custom properties.
    const onMove = (event: PointerEvent) => {
      const panel = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-glow]") : null;
      if (!panel) return;
      const box = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${event.clientX - box.left}px`);
      panel.style.setProperty("--my", `${event.clientY - box.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const blocks = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (blocks.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const block of blocks) observer.observe(block);
    return () => observer.disconnect();
  }, [path]);
}

/**
 * A number that climbs to its value the first time it is seen. The HTML holds the final number, so a page read
 * without scripts, or by a crawler, says the same thing.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || value === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const started = performance.now();
      const tick = (now: number) => {
        const done = Math.min(1, (now - started) / 1100);
        // Fast at first, settling onto the number.
        setShown(Math.round(value * (1 - (1 - done) ** 3)));
        if (done < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return <span ref={ref}>{shown}</span>;
}
