import Link from "./Link";
import { useLang } from "../lib/lang";
import { homeUi } from "../lib/homeStrings";
import ReportCover from "./ReportCover";
import { rupees, type ReportItem } from "../lib/api";

/**
 * One report, as a card. The only one — the home page and /reports used to
 * each carry their own markup and their own copy dictionary, which is two
 * places to change a price line and two places for the wording to drift.
 *
 * The layout is a poster, not a list row: the cover gets a tinted panel of its
 * own at the top so it reads as the object being sold, and everything below is
 * a fixed rhythm — eyebrow, name, two lines, then price. Fixed, because nine
 * cards whose insides float at different heights is what made the old grid look
 * unfinished.
 */

export const REPORT_COPY: Record<string, { deva: string; for: string; text: string }> = {
  kundli:     { deva: "कुंडली", for: "The whole picture",
                text: "Every house and planet, the dasha timeline with dates, ten divisional charts, and remedies from your weakest placements." },
  dosh:       { deva: "दोष", for: "Something feels blocked",
                text: "Fourteen classical doshas tested — what forms, what is cancelled, how severe it is, and what to do." },
  love:       { deva: "विवाह", for: "Marriage and partnership",
                text: "How you love, what you need from a partner, where the friction starts, and whether it lasts." },
  health:     { deva: "आरोग्य", for: "Constitution and energy",
                text: "Lagna, the 6th house, the Moon, your tatva and prakriti — and what your body asks you to look after." },
  horoscope:  { deva: "राशिफल", for: "The month ahead",
                text: "Not a sun-sign column. Every transit placed against your own houses, with the dates that matter." },
  laalkitab:  { deva: "लाल किताब", for: "Practical remedies",
                text: "A different tradition with its own logic and its own upaay — inexpensive, and drawn from your chart." },
  varshaphal: { deva: "वर्षफल", for: "The year ahead",
                text: "Your solar return: Muntha, Panchavargeeya bala, the Mudda dasha, and the themes month by month." },
  vastu:      { deva: "वास्तु", for: "Your home",
                text: "Nine directions checked against the mandala — every dosh named, with remedies that need no demolition." },
  career:     { deva: "कर्म", for: "Work and livelihood",
                text: "The 10th house, the Dashamsha read for work alone, your Amatyakaraka, and when a career turns." }
};

export default function ReportCard({ item, onPick, featured = false }: {
  item: ReportItem; onPick: (code: string) => void; featured?: boolean;
}) {
  const [lang] = useLang();
  const c = REPORT_COPY[item.code];
  // The Devanagari word stays in REPORT_COPY — it is the same in both
  // languages. Only the hook and the description are copy.
  const h = homeUi(lang);
  const card = h.cards[item.code];

  return (
    // A real <a href="/report/…">, not a button. These nine cards are the main
    // crawl path from the homepage into the pages that actually sell, and as
    // buttons they carried no href, no anchor text and no cmd-click.
    <Link to={`/report/${item.code}`} onClick={() => onPick(item.code)}
      // Horizontal on a phone, poster on a desktop. The poster is the right
      // shape when three sit side by side and the wrong one stacked: nine of
      // them full-width is 3,000px of scrolling to see a list.
      className="group card overflow-hidden text-left flex sm:flex-col h-full
                 transition-all duration-200 hover:border-faint hover:shadow-lift
                 hover:-translate-y-0.5 active:translate-y-0">

      {/* The cover on its own ground. A book floating on the card background
          was the thing that looked unfinished — it needs a shelf. */}
      <div className="relative bg-sunken border-r sm:border-r-0 sm:border-b border-line
                      shrink-0 p-3 sm:px-5 sm:pt-6 sm:pb-5 grid place-items-center">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16
                                    bg-gradient-to-t from-black/10 to-transparent dark:from-black/25" />
        <ReportCover code={item.code} palette={item.cover_palette}
                     className={`relative w-[74px] ${featured ? "sm:w-[150px]" : "sm:w-[118px]"}`} />
        {featured && (
          <span className="hidden sm:inline absolute top-3 left-3 text-[10px] font-semibold
                           uppercase tracking-[.14em] bg-brass text-surface rounded-full px-2.5 py-1">
            Most complete
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 p-3.5 sm:p-5">
        <span className="caps text-brass text-[9.5px] sm:text-[10.5px]">{card?.f ?? c?.for}</span>
        <span className="flex items-baseline gap-2 mt-2 flex-wrap">
          <span className="display text-[16.5px] sm:text-[20px] leading-tight">{lang === "hi" ? item.name_hi : item.name_en}</span>
          <span className="deva text-[13px] text-brass">{c?.deva}</span>
        </span>
        {/* Clamped, so every card in a row ends its copy on the same line.
            No `block` here: line-clamp works by setting display:-webkit-box,
            and `block` overrode it — which is why one card ran to three lines
            while the rest stopped at two. */}
        <span className="text-[13px] text-muted mt-2 leading-snug line-clamp-2">{card?.t ?? c?.text}</span>

        {/* mt-auto pins this to the bottom whatever the copy above did. */}
        <span className="mt-auto pt-2.5 sm:pt-4 flex items-center justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="display text-[19px] text-brass">{rupees(item.price_paise)}</span>
            <span className="text-[11.5px] text-faint">{h.chaptersCount(item.chapters)}</span>
          </span>
          <span aria-hidden
                className="hidden sm:grid h-8 w-8 rounded-full border border-line place-items-center
                           text-brass transition-all group-hover:border-brass group-hover:bg-brassSoft/40">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </span>
        </span>
      </div>
    </Link>
  );
}
