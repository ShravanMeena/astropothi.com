import { useEffect, useRef, useState } from "react";
import { BANNERS } from "../content/banners.generated";
import { track } from "../lib/track";
import { useLang } from "../lib/lang";

/**
 * What each banner says, in words, under the picture.
 *
 * The banners are images with text burnt into them, which means the text is
 * invisible to a crawler, unreadable at 390px for anyone with tired eyes, and
 * untranslatable. So the claim is repeated as real text below each one — and
 * only claims the product actually keeps.
 */

/**
 * The promo banners, as a strip you swipe.
 *
 * Built as a scroll container rather than a JS carousel: a native scroller
 * gives momentum, rubber-banding and a real scrollbar for free, works with a
 * trackpad and a keyboard, and cannot get stuck mid-transition the way a
 * timer-driven slider does. CSS scroll-snap supplies the paging.
 *
 * Three things that stop it costing more than it earns:
 *
 *   · Every image carries explicit width and height, so the box is reserved
 *     before the bytes land. Four images reflowing as they arrive is the
 *     classic layout-shift penalty, and this sits high on a page an ad pays for.
 *   · Only the first is eager. The rest are lazy and off-screen, so a visitor
 *     who never swipes pays for one 16KB image instead of four.
 *   · No autoplay. Content that moves on its own steals attention from the
 *     thing below it and is a WCAG problem for anyone who needs time to read.
 */
export default function PromoBanners({ where, onBuy }: { where: string; onBuy: () => void }) {
  const [lang] = useLang();
  const L = lang === "hi" ? "hi" : "en";
  const B = BANNERS[L];  // the banners in the reader's language
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const seen = useRef(new Set<number>());
  /**
   * Advancing on its own until the visitor touches it, and never again after.
   *
   * The moment somebody swipes, taps a dot or spins a wheel they have taken
   * over, and a carousel that keeps moving under a hand is the reason people
   * hate carousels. There is no restart timer: taken is taken.
   */
  const taken = useRef(false);

  // Which banner is in view, from the scroll position. Cheap, and it keeps the
  // dots honest when somebody drags rather than taps.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setActive(Math.min(B.length - 1, Math.max(0, i)));
      if (!seen.current.has(i) && B[i]) {
        seen.current.add(i);
        track("banner_viewed", { banner: B[i].id, index: i, where });
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    el.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => { el.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [where]);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Hands off, permanently.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const stop = () => { taken.current = true; };
    for (const ev of ["pointerdown", "touchstart", "wheel", "keydown"] as const) {
      el.addEventListener(ev, stop, { passive: true });
    }
    return () => { for (const ev of ["pointerdown", "touchstart", "wheel", "keydown"] as const) el.removeEventListener(ev, stop); };
  }, []);

  useEffect(() => {
    if (B.length < 2) return;
    // Somebody who has asked the OS to stop animations has asked for this too.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = scroller.current;
      if (!el || taken.current || document.hidden) return;
      const at = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      const next = (at + 1) % B.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  if (!B.length) return null;

  return (
    <section aria-label="What the Dosh report gives you"
             className="border-b border-line bg-gradient-to-b from-sunken to-surface">
      <div className="shell pt-2 pb-3 sm:py-8">
        {/* Full-bleed on a phone: the shell's side padding was costing ~40px of
            width, and on a 16:9 banner every pixel of width is 0.56 of a pixel
            of height. Cropping to force it taller cut the burnt-in text off the
            right edge, so it goes wider instead and stays whole. */}
        <div ref={scroller}
             className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth
                        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                        -mx-5 px-5 sm:mx-0 sm:px-0">
          {B.map((b, i) => {
            return (
            <div key={b.id} className="snap-center shrink-0 w-full">
              {/* The banner is the ad's promise; tapping it should take the
                  reader straight to buying, not just sit there as a picture. */}
              <button type="button"
                      onClick={() => { track("banner_clicked", { banner: b.id, index: i, where }); onBuy(); }}
                      className="block w-full text-left rounded-xl overflow-hidden border border-line bg-raised
                                 transition-transform active:scale-[.995] focus-visible:ring-2 focus-visible:ring-brass"
                      aria-label={b.alt}>
                <img
                  src={b.files["800"]}
                  srcSet={`${b.files["800"]} 800w, ${b.files["1376"]} 1376w`}
                  sizes="(min-width: 1180px) 1130px, 100vw"
                  width={b.width}
                  height={b.height}
                  alt={b.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "low"}
                  decoding="async"
                  className="w-full h-auto block"
                />
              </button>
            </div>
            );
          })}
        </div>

        {B.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Choose a banner">
            {B.map((b, i) => (
              <button key={b.id} type="button" role="tab"
                      aria-selected={i === active}
                      aria-label={`Banner ${i + 1} of ${B.length}`}
                      onClick={() => { taken.current = true; goTo(i); track("banner_dot_clicked", { index: i, where }); }}
                      className={`h-1.5 rounded-full transition-all duration-200
                                  ${i === active ? "w-6 bg-brass" : "w-1.5 bg-line hover:bg-faint"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
