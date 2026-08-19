import { useRef, useState } from "react";
import ReportCover from "../components/ReportCover";
import { rupees, type ReportItem } from "../lib/api";

/**
 * The mobile hero's shelf: real covers, swiped sideways.
 *
 * The desktop hero is a book that opens as you scroll — 220vh of sticky track.
 * On a phone that ate the whole screen and pushed the buttons under the fold,
 * so the first thing a visitor saw was an animation with nothing to press. This
 * replaces it below `sm`: one screen of copy, then the range itself, swipeable.
 *
 * Every banner is the report's own rendered cover, not artwork — the same image
 * the buyer gets. Snap points make it feel like a shelf rather than a
 * free-scrolling strip, and the edge padding lets the next card peek so the
 * gesture is discoverable without a hint.
 */

const HOOK: Record<string, string> = {
  kundli:     "Every house, every planet, dashas with dates",
  dosh:       "Fourteen doshas tested — and what is cancelled",
  love:       "How you love, and whether it lasts",
  health:     "Your constitution, and what to look after",
  horoscope:  "This month against your own chart",
  laalkitab:  "A different tradition, and its own remedies",
  varshaphal: "The year ahead, month by month",
  vastu:      "Your home, direction by direction",
  career:     "What your chart says about work"
};

const DEVA: Record<string, string> = {
  kundli: "कुंडली", dosh: "दोष", love: "विवाह", health: "आरोग्य",
  horoscope: "राशिफल", laalkitab: "लाल किताब", varshaphal: "वर्षफल",
  vastu: "वास्तु", career: "कर्म"
};

export default function ReportBanners({ items, onPick }: {
  items: ReportItem[]; onPick: (code: string) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  // Which card is under the left edge, for the dots. Read from scroll position
  // rather than IntersectionObserver: one number, no observer per card.
  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 12;
    setAt(Math.round(el.scrollLeft / step));
  };

  if (!items.length) return null;

  return (
    <div className="mt-8">
      <div ref={rail} onScroll={onScroll}
           className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth
                      -mx-5 px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((r) => (
          <button key={r.code} onClick={() => onPick(r.code)}
            className="group snap-start shrink-0 w-[76vw] max-w-[300px] text-left
                       card overflow-hidden active:scale-[.99] transition-transform">
            <div className="flex gap-3.5 p-3.5">
              <ReportCover code={r.code} className="w-[74px] shrink-0" />
              <div className="min-w-0 flex-1 flex flex-col">
                <span className="deva text-[12px] text-brass leading-none">{DEVA[r.code]}</span>
                <h3 className="display text-[17px] leading-tight mt-1.5">{r.name_en}</h3>
                <p className="text-[12.5px] text-muted leading-snug mt-1.5 line-clamp-2">
                  {HOOK[r.code]}
                </p>
                {/* mt-auto pins the price to the bottom of the card whatever the
                    hook wraps to, so a row of cards lines up. */}
                <div className="mt-auto pt-2 flex items-baseline gap-2">
                  <span className="display text-[16px] text-brass">{rupees(r.price_paise)}</span>
                  <span className="text-[11.5px] text-faint">{r.chapters} chapters</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {items.map((r, i) => (
          <span key={r.code} aria-hidden
                className={`h-1 rounded-full transition-all duration-200
                            ${i === at ? "w-4 bg-brass" : "w-1 bg-line"}`} />
        ))}
      </div>
    </div>
  );
}
