import { useRef, useState } from "react";
import { useLang } from "../lib/lang";
import { homeUi } from "../lib/homeStrings";
import { rupees, type ReportItem } from "../lib/api";

/**
 * The mobile hero's shelf: a designed banner per report, swiped sideways.
 *
 * The first version put the rendered cover in a card, which made nine cards
 * that were nine photographs of the same object — the covers differ by a
 * colourway and a title, and at 74px wide that difference is invisible. A
 * banner has to sell one reading in one glance, so each is built rather than
 * photographed: its own colour, its own Devanagari word set large as the
 * graphic, the question the report answers, and the price on a button that
 * says what happens next.
 *
 * Fixed height on purpose. Cards that size themselves to their copy make a
 * ragged shelf, and the eye reads the ragged edge before it reads any of the
 * words.
 */

type Banner = {
  deva: string;
  /** Two stops and an ink, per report. Kept as raw values rather than theme
   *  tokens: these are the product's own colours and must not flip with the
   *  light/dark switch, the way a printed cover does not. */
  from: string; to: string; ink: string;
};

const B: Record<string, Banner> = {
  kundli:     { deva: "कुंडली",      from: "#3B2A0E", to: "#171008", ink: "#E9C877" },
  dosh:       { deva: "दोष",         from: "#3A1712", to: "#170B09", ink: "#F0A98C" },
  love:       { deva: "विवाह",       from: "#3A1526", to: "#170A11", ink: "#F2A6C6" },
  health:     { deva: "आरोग्य",      from: "#0E3327", to: "#081712", ink: "#8FE0BC" },
  horoscope:  { deva: "राशिफल",      from: "#141F3E", to: "#0A0E1B", ink: "#A8BEF5" },
  laalkitab:  { deva: "लाल किताब",   from: "#3D1414", to: "#180909", ink: "#F0A0A0" },
  varshaphal: { deva: "वर्षफल",      from: "#33290E", to: "#161207", ink: "#EBD08A" },
  vastu:      { deva: "वास्तु",      from: "#123028", to: "#081512", ink: "#9BDCC4" },
  career:     { deva: "कर्म",        from: "#1D2733", to: "#0B0F14", ink: "#AFC6DC" }
};

/** The chart diamond, flat, as the banner's own graphic. */
const Diamond = ({ ink }: { ink: string }) => (
  <svg viewBox="0 0 120 120" className="absolute -right-6 -bottom-7 w-[132px] h-[132px]"
       fill="none" aria-hidden style={{ color: ink, opacity: .17 }}>
    <rect x="6" y="6" width="108" height="108" stroke="currentColor" strokeWidth="1.4" />
    <path d="M60 6 114 60 60 114 6 60Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 6 60 60 6 114M114 6 60 60l54 54" stroke="currentColor" strokeWidth="1.1" opacity=".7" />
  </svg>
);

export default function ReportBanners({ items, onPick }: {
  items: ReportItem[]; onPick: (code: string) => void;
}) {
  const [lang] = useLang();
  const h = homeUi(lang);
  const rail = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    setAt(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
  };

  if (!items.length) return null;

  return (
    <div className="mt-7">
      <div ref={rail} onScroll={onScroll}
           // The rail bleeds to both screen edges so the next banner can peek,
           // but the FIRST one still starts on the page's own left margin —
           // flush against the edge it read as a broken layout rather than a
           // shelf. scroll-pl keeps the snap honest at that inset.
           className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth
                      -mx-5 px-5 scroll-pl-5 pb-1
                      [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((r) => {
          const b = B[r.code] ?? B.kundli;
          // Colours come from the map above; the words come from the copy file,
          // so a new language never has to be threaded through a palette.
          const copy = h.banners[r.code] ?? h.banners.kundli;
          return (
            <button key={r.code} onClick={() => onPick(r.code)}
              aria-label={`${r.name_en} — ${rupees(r.price_paise)}`}
              className="group relative snap-start shrink-0 w-[78vw] max-w-[310px] h-[228px]
                         rounded-2xl overflow-hidden text-left ring-1 ring-white/10
                         active:scale-[.985] transition-transform"
              style={{ background: `linear-gradient(152deg, ${b.from}, ${b.to})` }}>
              <Diamond ink={b.ink} />

              <div className="relative h-full p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="deva text-[26px] leading-none font-semibold" style={{ color: b.ink }}>
                    {b.deva}
                  </span>
                  <span className="text-[10px] uppercase tracking-[.16em] px-2 py-1 rounded-full
                                   bg-white/10 text-white/70 whitespace-nowrap">
                    {r.chapters} {h.chShort}
                  </span>
                </div>

                <h3 className="display text-[19px] leading-[1.18] text-white mt-3 pr-2">
                  {copy.q}
                </h3>
                <p className="text-[12px] leading-snug text-white/55 mt-1.5 pr-4 line-clamp-2">
                  {copy.s}
                </p>

                {/* mt-auto: the button sits on the bottom edge of every banner,
                    so nine of them make one straight line across the shelf. */}
                <div className="mt-auto flex items-center justify-between gap-3">
                  <div>
                    <div className="display text-[19px] leading-none" style={{ color: b.ink }}>
                      {rupees(r.price_paise)}
                    </div>
                    <div className="text-[10.5px] text-white/40 mt-1">{h.oneTime}</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 h-9 pl-4 pr-3.5 rounded-full
                                   text-[13px] font-medium text-black"
                        style={{ background: b.ink }}>
                    {h.bookNow}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                         strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
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
