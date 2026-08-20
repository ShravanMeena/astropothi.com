import { useEffect, useRef } from "react";
import { track } from "./track";

/**
 * How far down a page somebody actually got, and which parts they stopped at.
 *
 * The funnel already answers "did they reach checkout". It cannot answer why
 * they didn't — whether the page lost them in the first screen, or they read
 * all the way to the chapter list and still walked. That difference decides
 * whether the fix is the headline or the price, and until now nothing recorded
 * it.
 *
 * Both hooks below are deliberately quiet:
 *   · each milestone and each section fires ONCE per mount, so a visitor
 *     scrolling up and down does not manufacture engagement that isn't there;
 *   · scroll handling is passive and rAF-throttled, so it cannot make the page
 *     stutter — analytics that costs frames is worse than no analytics;
 *   · everything is wrapped so a failure here can never reach the UI.
 */

/** The depths worth knowing about. 100 is "reached the end", not "scrolled a lot". */
const MILESTONES = [25, 50, 75, 100] as const;

export function useScrollDepth(context: Record<string, unknown> = {}) {
  // Kept in a ref so re-renders (a language switch, a sample loading) do not
  // reset what has already been reported.
  const fired = useRef<Set<number>>(new Set());
  const ctx = useRef(context);
  ctx.current = context;

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      try {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        // A page shorter than the viewport is 100% read the moment it loads,
        // which would report a perfect score for a page nobody touched.
        if (scrollable < 240) return;
        const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
        for (const m of MILESTONES) {
          if (pct >= m && !fired.current.has(m)) {
            fired.current.add(m);
            track("scroll_depth", { depth: m, ...ctx.current });
          }
        }
      } catch { /* never break the page for a metric */ }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };

    window.addEventListener("scroll", onScroll, { passive: true });
    measure();                                   // a short page, or a restored position
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/**
 * Fires once when a section has been genuinely looked at.
 *
 * Not on first pixel: a section that clips the bottom of the viewport for a
 * moment during a fast scroll has not been read, and counting it would make
 * every section look equally interesting. Half of it visible, or a third of the
 * screen filled by it, is the bar.
 */
export function useSectionView<T extends HTMLElement = HTMLDivElement>(
  section: string,
  context: Record<string, unknown> = {}
) {
  const ref = useRef<T | null>(null);
  const ctx = useRef(context);
  ctx.current = context;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let done = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (done || !e.isIntersecting) continue;
        done = true;
        track("section_viewed", { section, ...ctx.current });
        io.disconnect();
      }
    }, { threshold: 0.5, rootMargin: "0px 0px -20% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [section]);

  return ref;
}
