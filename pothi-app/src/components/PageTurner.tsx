import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

type Shot = { page: number; url: string };

/** Two pages on a desktop spread, one on a phone. */
function useSpreadMode(force?: boolean) {
  const [wide, setWide] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return force ? false : wide;
}

const chunk = <T,>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

/**
 * The book, as a book — turned by clicking a page, by the arrows, by the
 * keyboard, or by scrolling past it.
 *
 * A leaf hinges on the spine in 3D: its front is the page you are leaving, its
 * back is the page you are arriving at, and the spread underneath is already
 * the destination. That is how a real page turn works, and it is why the
 * illusion holds at any speed.
 */
export default function PageTurner({
  shots, caption, single, scrollFlip, maxW = 820, showChrome = true, keyboard = false
}: {
  shots: Shot[]; caption?: string; single?: boolean; scrollFlip?: boolean;
  maxW?: number; showChrome?: boolean;
  /** Bind the arrow keys. Opt-in: a page can hold several books, and one key
   *  press must not turn all of them. Enable it on the one being read. */
  keyboard?: boolean;
}) {
  const wide = useSpreadMode(single);
  const reduce = useReducedMotion();
  const per = wide ? 2 : 1;
  const spreads = useMemo(() => chunk(shots, per), [shots, per]);

  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState<null | { dir: 1 | -1; from: number }>(null);
  const busy = useRef(false);

  useEffect(() => { setI(0); setFlip(null); busy.current = false; }, [per, shots]);

  const go = useCallback((dir: 1 | -1) => {
    if (busy.current) return;
    const next = i + dir;
    if (next < 0 || next >= spreads.length) return;
    if (reduce) { setI(next); return; }
    busy.current = true;
    setFlip({ dir, from: i });
  }, [i, spreads.length, reduce]);

  const done = () => {
    if (!flip) return;
    setI(flip.from + flip.dir);
    setFlip(null);
    busy.current = false;
  };

  useEffect(() => {
    if (!keyboard) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go, keyboard]);

  // Turning by scroll: the book advances one spread at a time as the section
  // travels through the viewport. It steps rather than seeks, so a fast scroll
  // still shows each turn instead of snapping to the end.
  const { scrollYProgress } = useScroll({
    target: root, offset: ["start 85%", "end 15%"]
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!scrollFlip || reduce || busy.current || spreads.length < 2) return;
    const want = Math.min(spreads.length - 1, Math.max(0, Math.floor(p * spreads.length)));
    if (want > i) go(1);
    else if (want < i) go(-1);
  });

  if (!spreads.length) {
    return <div className={`w-full ${single ? "aspect-[1/1.414]" : "aspect-[1.414/1]"}
                            rounded-[2px] bg-sunken border border-line animate-pulse`} />;
  }

  // While a leaf is in flight the spread underneath is already the destination,
  // so the arriving page is revealed rather than swapped in at the end.
  const dest = flip ? flip.from + flip.dir : i;
  const under = spreads[dest] ?? spreads[i];
  const leafFront = flip ? (flip.dir === 1 ? spreads[flip.from][per - 1] : spreads[flip.from][0]) : null;
  const leafBack  = flip ? (flip.dir === 1 ? spreads[dest]?.[0] : spreads[dest]?.[per - 1]) : null;
  const forward = flip?.dir === 1;

  const Page = ({ s, className = "" }: { s?: Shot; className?: string }) => (
    <span className={`relative block bg-raised overflow-hidden ${className}`}>
      {s
        ? <img src={s.url} alt={`Page ${s.page}`} className="w-full h-full object-contain block" />
        : <span className="block w-full h-full bg-sunken" />}
    </span>
  );

  const atStart = i === 0 && !flip;
  const atEnd = i >= spreads.length - 1 && !flip;
  const label = (spreads[i] ?? []).map((s) => s.page).join(" · ");
  const many = spreads.length > 14;

  return (
    <div ref={root} className="relative">
      {/* the reading table: warm light pooled under the book */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-8 -inset-y-10 rounded-[40px]"
           style={{ background: "radial-gradient(closest-side, rgb(var(--brass) / .20), transparent 76%)" }} />

      <div className="relative mx-auto w-full" style={{ perspective: 2400, maxWidth: maxW }}>
        <div className={`group relative w-full ${per === 2 ? "aspect-[1.414/1]" : "aspect-[1/1.414]"}
                         shadow-book rounded-[3px] ring-1 ring-brass/25 bg-raised`}>
          {/* the spread underneath */}
          <div className="absolute inset-0 flex">
            {per === 2 && <Page s={under[0]} className="w-1/2 h-full" />}
            <Page s={under[per - 1]} className={per === 2 ? "w-1/2 h-full" : "w-full h-full"} />
          </div>

          {/* the gutter: two pages meeting is a shadow, not a gap */}
          {per === 2 && (
            <div aria-hidden className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[42px] pointer-events-none"
                 style={{ background: "linear-gradient(90deg, transparent, rgb(0 0 0 / .34) 40%, rgb(0 0 0 / .52) 50%, rgb(0 0 0 / .34) 60%, transparent)" }} />
          )}

          {/* the leaf in flight */}
          {flip && (
            <motion.div
              className="absolute top-0 bottom-0"
              style={{
                left: forward ? (per === 2 ? "50%" : "0%") : "0%",
                width: per === 2 ? "50%" : "100%",
                transformStyle: "preserve-3d",
                transformOrigin: forward ? "left center" : "right center",
                zIndex: 20
              }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: forward ? -180 : 180 }}
              transition={{ duration: .78, ease: [0.42, 0, 0.24, 1] }}
              onAnimationComplete={done}>
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                <Page s={leafFront ?? undefined} className="w-full h-full" />
              </div>
              <div className="absolute inset-0"
                   style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <Page s={leafBack ?? undefined} className="w-full h-full" />
              </div>
              {/* light rolls across the sheet as it lifts */}
              <motion.div aria-hidden className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: [0, .45, 0] }}
                transition={{ duration: .78, times: [0, .5, 1] }}
                style={{ background: forward
                  ? "linear-gradient(270deg, rgb(0 0 0 / .55), transparent 62%)"
                  : "linear-gradient(90deg, rgb(0 0 0 / .55), transparent 62%)" }} />
            </motion.div>
          )}

          {/* You turn a book by touching the page, so the page is the control.
              The arrows below stay for keyboard and for anyone who wants them. */}
          <button type="button" aria-label="Previous page" disabled={atStart}
            onClick={() => go(-1)}
            className="absolute inset-y-0 left-0 z-30 w-1/2 cursor-pointer
                       disabled:cursor-default focus-visible:ring-inset" />
          <button type="button" aria-label="Next page" disabled={atEnd}
            onClick={() => go(1)}
            className="absolute inset-y-0 right-0 z-30 w-1/2 cursor-pointer
                       disabled:cursor-default focus-visible:ring-inset" />

          {/* corner lift: the affordance that says this page can be turned */}
          {!atEnd && (
            <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 z-20
                                        h-14 w-14 opacity-0 transition-opacity duration-300
                                        group-hover:opacity-100"
                 style={{ background: "linear-gradient(315deg, rgb(var(--brass) / .55), rgb(0 0 0 / .25) 45%, transparent 60%)" }} />
          )}

          {/* the block of pages still unread, seen edge-on */}
          <div aria-hidden className="absolute -right-[7px] top-[5px] bottom-[5px] w-[7px] rounded-r-[2px]
                                      bg-gradient-to-r from-brass/30 via-black/40 to-transparent" />
          <div aria-hidden className="absolute -left-[7px] top-[5px] bottom-[5px] w-[7px] rounded-l-[2px]
                                      bg-gradient-to-l from-brass/30 via-black/40 to-transparent" />
        </div>
      </div>

      {showChrome && (
        <>
          <div className="relative mt-7 flex items-center justify-center gap-5">
            <button onClick={() => go(-1)} disabled={atStart} aria-label="Previous pages"
              className="h-11 w-11 rounded-full border border-line text-fg grid place-items-center
                         transition hover:border-brass hover:text-brass disabled:opacity-25 disabled:pointer-events-none">
              ←
            </button>
            <div className="text-center min-w-[160px]">
              <div className="caps text-brass">{caption ?? "From the book"}</div>
              <div className="text-[13px] text-faint mt-1 tabular-nums">
                Page {label}{many ? ` of ${shots.length}` : ""}
              </div>
            </div>
            <button onClick={() => go(1)} disabled={atEnd} aria-label="Next pages"
              className="h-11 w-11 rounded-full border border-line text-fg grid place-items-center
                         transition hover:border-brass hover:text-brass disabled:opacity-25 disabled:pointer-events-none">
              →
            </button>
          </div>

          {/* A tab per spread is right for a sample and unreadable for a whole
              book, so a long report gets a progress bar you can scrub instead. */}
          <div className="relative mt-6 flex items-center justify-center gap-2">
            {many ? (
              <input type="range" min={0} max={spreads.length - 1} value={i}
                aria-label="Jump to page"
                onChange={(e) => { if (!busy.current) setI(Number(e.target.value)); }}
                className="w-full max-w-[420px] accent-brass" />
            ) : spreads.map((sp, n) => (
              <button key={n} onClick={() => { if (!busy.current) setI(n); }}
                aria-label={`Pages ${sp.map((s) => s.page).join(" and ")}`} aria-current={n === i}
                className={`h-1 rounded-full transition-all duration-300
                  ${n === i ? "w-9 bg-brass" : "w-4 bg-line hover:bg-faint"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
