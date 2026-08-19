import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import ChartMark from "../components/ChartMark";
import ReportBanners from "./ReportBanners";
import type { ReportItem } from "../lib/api";

/**
 * The pothi opens as you scroll.
 *
 * A tall scroll track drives one progress value. The front cover swings on its
 * spine in 3D, the inner spread is revealed behind it, and the headline resolves
 * as the book settles. It is the product doing the talking rather than a hero
 * image — and every page shown is a real render.
 */
/** The pitch. Identical in every branch so they can never drift apart. */
function Copy({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-brass" />
        <span className="caps text-brass">Vedic · computed, then explained</span>
      </div>
      <h1 className="mt-6">
        <span className="deva foil block text-[25px] sm:text-[48px] leading-[1.18] font-semibold">
          जन्म कुंडली
        </span>
        <span className="display block text-[26px] sm:text-[56px] lg:text-[64px] leading-[1.0] mt-1">
          Your birth chart,<br />read properly.
        </span>
      </h1>
      <p className="lede mt-6 max-w-prose2">
        A 64-chapter kundali computed from your exact birth time — every line traceable
        to a planetary position we can show you.
      </p>
      {/* One button, not two. "See what's inside" and "See every report" both
          went to the range, so the pair was a choice between two words for the
          same thing — and on a phone it wrapped and pushed itself under the
          fold. */}
      <div className="mt-8">
        <button className="btn-brass h-[52px] px-8 text-[16px] w-full sm:w-auto" onClick={onOpen}>
          See every report
        </button>
      </div>
    </>
  );
}

export default function BookHero({ onOpen, items, onPick }: {
  onOpen: () => void; items: ReportItem[]; onPick: (code: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: .4 });

  // Cover swings open on the spine, then the whole book eases away.
  const coverRotate = useTransform(p, [0, .55], [0, -168]);
  const coverShade  = useTransform(p, [0, .35], [0.0, 0.55]);
  const bookScale   = useTransform(p, [0, .55, 1], [1, 1.02, .93]);
  const bookY       = useTransform(p, [0, 1], [0, -60]);
  const spreadOpacity = useTransform(p, [.18, .45], [0, 1]);
  const spreadX     = useTransform(p, [.18, .55], [-12, 0]);

  // The headline is visible from the first frame. An earlier version faded it in
  // only after scrolling, which left anyone arriving from an ad looking at a
  // wordless page — the animation must decorate the message, never withhold it.
  // It lifts slightly as the book opens rather than appearing from nothing.
  const copyY       = useTransform(p, [0, .68], [10, 0]);
  const copyOpacity = useTransform(p, [0, .2], [.86, 1]);
  const hintOpacity = useTransform(p, [0, .18], [1, 0]);
  const markRot     = useTransform(p, [0, 1], [0, 22]);

  // ── phones ────────────────────────────────────────────────────────────────
  // Rendered alongside the desktop hero and switched by CSS rather than by a
  // width test in JS: a JS breakpoint renders the wrong one for a frame on
  // first paint, and this is the first thing an ad click sees.
  const mobile = (
    <section className="sm:hidden relative overflow-hidden grain lamp">
      <div className="pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2
                      w-[520px] max-w-[150vw] text-brass opacity-[.13] dark:opacity-[.17]">
        <ChartMark className="w-full h-auto" weight={0.32} draw={false} />
      </div>
      <div className="shell relative z-10 pt-10 pb-12">
        <Copy onOpen={onOpen} />
        <ReportBanners items={items} onPick={onPick} />
      </div>
    </section>
  );

  if (reduce) {
    return (
      <>
      {mobile}
      <section className="hidden sm:block relative overflow-hidden grain lamp">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[820px] max-w-[128vw] text-brass opacity-[.16] dark:opacity-[.2]">
          <ChartMark className="w-full h-auto" weight={0.32} draw={false} />
        </div>
        <div className="shell relative z-10 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div><Copy onOpen={onOpen} /></div>
          <img src="/covers/heritage.png" alt="A Pothi report"
               className="rounded-[2px] border border-line shadow-book w-[72%] mx-auto" />
        </div>
      </section>
      </>
    );
  }

  return (
    <>
    {mobile}
    <section ref={track} className="hidden sm:block relative h-[220vh]">
      <div className="sticky top-0 h-dvh flex items-center overflow-hidden grain">
        <div aria-hidden className="absolute inset-0 pointer-events-none lamp" />
        <motion.div aria-hidden style={{ rotate: markRot }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[900px] max-w-[130vw] text-brass opacity-[.14] dark:opacity-[.18]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </motion.div>

        <div className="shell relative z-10 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center w-full">
          {/* Copy resolves as the book opens */}
          <motion.div style={{ opacity: copyOpacity, y: copyY }} className="order-2 lg:order-1">
            <Copy onOpen={onOpen} />
          </motion.div>

          {/* The book */}
          <motion.div style={{ scale: bookScale, y: bookY }}
                      className="order-1 lg:order-2 relative mx-auto w-[280px] sm:w-[360px] lg:w-[420px]"
                      // perspective must sit on the parent for the spine to read as 3D
                      >
            <div style={{ perspective: 1800 }} className="relative aspect-[1/1.414]">
              {/* Inner spread, revealed behind the cover */}
              <motion.div style={{ opacity: spreadOpacity, x: spreadX }}
                          className="absolute inset-0 grid grid-cols-2 gap-[2px] rounded-lg overflow-hidden shadow-book">
                <img src="/covers/inner-left.png" alt="" className="h-full w-full object-cover object-left" />
                <img src="/covers/inner-right.png" alt="" className="h-full w-full object-cover object-right" />
              </motion.div>

              {/* Front cover, hinged on the left edge */}
              <motion.div
                style={{ rotateY: coverRotate, transformOrigin: "left center", transformStyle: "preserve-3d" }}
                className="absolute inset-0 rounded-lg shadow-book will-change-transform">
                <img src="/covers/heritage.png" alt="A Pothi report" className="h-full w-full rounded-lg" />
                {/* the page darkens as it swings past the light */}
                <motion.div style={{ opacity: coverShade }}
                            className="absolute inset-0 rounded-lg bg-black pointer-events-none" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div style={{ opacity: hintOpacity }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[12px] text-faint tracking-wide">scroll to open</p>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
                      className="mx-auto mt-2 w-px h-6 bg-line" />
        </motion.div>
      </div>
    </section>
    </>
  );
}
