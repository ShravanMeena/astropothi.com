import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChartMark from "../components/ChartMark";

const GROUPS: { group: string; qa: [string, string][] }[] = [
  {
    group: "The calculation",
    qa: [
      ["Is this a real calculation or a template?",
       "A real calculation. Positions come from an astronomical ephemeris using the Lahiri (Chitrapaksha) ayanamsa, accurate to within a few arcseconds. Change the birth time by ten minutes and the ascendant, the houses and the dasha dates all move — the report moves with them."],
      ["Which conventions do you follow?",
       "North Indian chart, whole-sign houses and Vimshottari dasha — the standard north Indian convention. Divisional charts run D1 to D12, and strengths are given by Ashtakavarga bindu."],
      ["How do I know the numbers are right?",
       "Every chart is checked against 480 invariants before a word is written: the nodes exactly 180° apart, no retrograde Sun or Moon, the dasha sequence totalling exactly 120 years, and the Ashtakavarga summing to 337."]
    ]
  },
  {
    group: "Your birth details",
    qa: [
      ["What if I don't know my exact birth time?",
       "Give the closest time you have. The moon sign, nakshatra and dashas stay reliable within about an hour; the ascendant and the house cusps do not. A birth certificate or hospital record is the best source."],
      ["Why does the birth place matter so much?",
       "It sets the latitude, longitude and time zone used to cast the chart. A hundred kilometres moves the ascendant degree; the wrong city can move it a whole sign."],
      ["Do you keep my birth details?",
       "They are stored against your order so the report can be regenerated if something goes wrong. We do not sell them and we do not pass them to anyone."]
    ]
  },
  {
    group: "The book",
    qa: [
      ["How is this different from a free online kundli?",
       "Free tools give you a chart and a paragraph. This is 22 to 64 written chapters — every house read in turn, every planet, dashas with dates, divisional charts, doshas checked against classical rules, and remedies drawn from your weakest placements."],
      ["Can I get it in Hindi?",
       "Yes. Choose Hindi at checkout and the whole report, including signs, nakshatras and planet names, is set in Devanagari."],
      ["What do the three designs change?",
       "The whole typesetting, not the colour. Classic is a traditional Vedic layout economical to print; Editorial is a two-column magazine layout with generous whitespace; Heritage is an ornate presentation edition with a title page for every chapter."]
    ]
  },
  {
    group: "Ordering",
    qa: [
      ["How long does it take?",
       "Under a minute. The chart is computed, the chapters written and the pages typeset while you wait, and the PDF is on screen when it finishes."],
      ["Can I read it without downloading?",
       "Yes. The order page opens the report as a book you can turn, page by page, in the browser."],
      ["Do you offer refunds?",
       "Yes — 100% of what you paid, no questions asked. If the report was not worth it to you, message us and we refund it in full. You do not have to explain why, and you keep the PDF. We would rather refund you than keep money you feel you wasted."]
    ]
  }
];

export default function FaqPage({ onBuy, onAskGuide }: { onBuy: () => void; onAskGuide: () => void }) {
  const [open, setOpen] = useState<string | null>("0-0");

  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[720px] max-w-[128vw] text-brass opacity-[.13] dark:opacity-[.17]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>
        <div className="shell relative z-10 py-11 sm:py-24">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-brass" />
            <span className="caps text-brass">Questions</span>
          </div>
          <h1 className="display text-[26px] sm:text-[58px] leading-[1.03] mt-6 max-w-[15ch]">
            Everything worth asking first.
          </h1>
          <p className="lede mt-5 max-w-prose2">
            If something here is not answered, the guide will point you at the right
            report in four taps.
          </p>
        </div>
      </section>

      <section className="shell py-11 sm:py-24">
        <div className="grid lg:grid-cols-[.42fr_1fr] gap-x-16 gap-y-12">
          <nav className="lg:sticky lg:top-24 self-start">
            <p className="caps text-faint">Sections</p>
            <ul className="mt-4 space-y-2.5">
              {GROUPS.map((g) => (
                <li key={g.group}>
                  <a href={`#${g.group.replace(/\s+/g, "-").toLowerCase()}`}
                     className="text-[15px] text-muted hover:text-brass transition">{g.group}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-14">
            {GROUPS.map((g, gi) => (
              <div key={g.group} id={g.group.replace(/\s+/g, "-").toLowerCase()} className="scroll-mt-24">
                <h2 className="display text-[21px] sm:text-[32px]">{g.group}</h2>
                <div className="mt-6 border-t border-line">
                  {g.qa.map(([q, a], qi) => {
                    const k = `${gi}-${qi}`;
                    const on = open === k;
                    return (
                      <div key={k} className="border-b border-line">
                        <button onClick={() => setOpen(on ? null : k)} aria-expanded={on}
                          className="w-full py-5 flex items-start justify-between gap-6 text-left group">
                          <span className={`text-[16.5px] font-medium transition-colors
                                            ${on ? "text-brass" : "group-hover:text-brass"}`}>{q}</span>
                          <span className={`text-faint mt-1 shrink-0 text-[18px] transition-transform duration-200
                                            ${on ? "rotate-45" : ""}`}>+</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {on && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: .24, ease: [0.22, 0.7, 0.2, 1] }}
                              className="overflow-hidden">
                              <p className="pb-6 -mt-1 text-[15px] text-muted leading-relaxed max-w-prose2">{a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="rounded-[3px] border border-line bg-sunken p-7 sm:p-9">
              <h3 className="display text-[22px]">Still deciding?</h3>
              <p className="text-[14.5px] text-muted mt-2 leading-relaxed max-w-prose2">
                Answer four questions and we will point you at one report — with the reason why.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="btn-brass" onClick={onAskGuide}>Which report suits me</button>
                <button className="btn-line" onClick={onBuy}>Browse all seven</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
