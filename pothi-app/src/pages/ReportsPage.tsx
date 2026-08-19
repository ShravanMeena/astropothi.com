import { motion } from "framer-motion";
import { rupees, type ReportItem } from "../lib/api";
import ChartMark from "../components/ChartMark";
import ReportCover from "../components/ReportCover";

const BLURB: Record<string, { deva: string; text: string; for: string }> = {
  kundli:     { deva: "कुंडली",   text: "Every house read in turn, every planet, the dasha timeline with dates, ten divisional charts, strengths by bindu, and remedies drawn from your weakest placements.", for: "The whole picture" },
  dosh:       { deva: "दोष",      text: "Fourteen classical doshas tested against your chart — what forms, what is cancelled, how severe it actually is, and what to do about it.", for: "Something feels blocked" },
  love:       { deva: "विवाह",    text: "The 7th house and its lord, Venus and Mars, the navamsa that decides whether the promise holds, and the dasha windows when marriage ripens.", for: "Marriage and partnership" },
  health:     { deva: "आरोग्य",   text: "Lagna and its lord, the 6th house, the Moon, your tatva and prakriti — and the areas of the body your chart asks you to look after.", for: "Constitution and energy" },
  horoscope:  { deva: "राशिफल",   text: "Not a sun-sign column. Every transit placed against your own natal houses, the dates that matter, and what each one touches.", for: "The month ahead" },
  laalkitab:  { deva: "लाल किताब", text: "A distinct tradition with its own logic and its own remedies — practical, inexpensive, and drawn from the placements that need help.", for: "Practical remedies" },
  vastu:      { deva: "वास्तु चक्र", text: "Nine directions, and what the classics assign to each. Your entrance, kitchen, bedroom, pooja space, toilets and water checked against the mandala — every dosh named with the rule behind it, and remedies that need no demolition.", for: "Your home" },
  varshaphal: { deva: "वर्षफल",   text: "The annual chart cast for your solar return: Muntha, Panchavargeeya bala, the Mudda dasha and the themes month by month.", for: "The year ahead" }
};

export default function ReportsPage({ items, onPick, onAskGuide }: {
  items: ReportItem[]; onPick: (code: string) => void; onAskGuide: () => void;
}) {
  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[860px] max-w-[128vw] text-brass opacity-[.14] dark:opacity-[.18]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>
        <div className="shell relative z-10 py-16 sm:py-24">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-brass" />
            <span className="caps text-brass">{items.length} readings</span>
          </div>
          <h1 className="display text-[40px] sm:text-[60px] leading-[1.02] mt-6 max-w-[16ch]">
            One engine. Many ways of reading.
          </h1>
          <p className="lede mt-5 max-w-prose2">
            Every report is computed from the same ephemeris and the same birth moment.
            They differ in what they look at, not in how carefully they look.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button className="btn-brass h-[52px] px-8 text-[16px]" onClick={onAskGuide}>
              Not sure? Answer four questions
            </button>
          </div>
        </div>
      </section>

      <section className="shell py-16 sm:py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {items.map((r, i) => {
            const b = BLURB[r.code];
            return (
              <motion.button key={r.code} onClick={() => onPick(r.code)}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, delay: Math.min(i, 6) * .06, ease: [0.22, 0.7, 0.2, 1] }}
                className="group text-left flex gap-5 sm:block">
                <ReportCover code={r.code} className="w-[112px] shrink-0 sm:w-auto" />
                <span className="block min-w-0 flex-1">
                  <span className="caps text-brass block sm:mt-6">{b?.for}</span>
                  <span className="flex items-baseline gap-2.5 mt-1.5 sm:mt-2 flex-wrap">
                    <span className="display text-[20px] sm:text-[23px]">{r.name_en}</span>
                    <span className="deva text-[14px] sm:text-[15px] text-brass">{b?.deva}</span>
                  </span>
                  <span className="block text-[13.5px] sm:text-[14px] text-muted mt-2 leading-relaxed
                                   line-clamp-3 sm:line-clamp-none">{b?.text}</span>
                  <span className="flex items-baseline gap-3 sm:justify-between mt-3 sm:mt-4
                                   sm:pt-4 sm:border-t sm:border-line">
                    <span className="display text-[18px] sm:text-[20px] foil sm:order-2">
                      {rupees(r.price_paise)}
                    </span>
                    <span className="text-[12.5px] text-faint sm:order-1">{r.chapters} chapters</span>
                  </span>
                  <span className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium
                                   group-hover:gap-2.5 transition-all">
                    See what's inside <span aria-hidden className="text-brass">→</span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </>
  );
}
