import Reveal from "../components/Reveal";
import { useLang } from "../lib/lang";
import { homeUi } from "../lib/homeStrings";
import ReportCover from "../components/ReportCover";
import { rupees, type ReportItem } from "../lib/api";
import ReportCard from "../components/ReportCard";

const BLURB: Record<string, string> = {
  kundli:     "The complete reading. Every house, every planet, dashas with dates, divisional charts, strengths and remedies.",
  dosh:       "Fourteen classical doshas checked against your chart — what is present, what is cancelled, and what it actually means.",
  love:       "The 7th house, Venus, the navamsa and the timing windows. What the chart says about marriage and partnership.",
  health:     "Constitution, the 6th house, and the areas of the body your chart asks you to care for.",
  horoscope:  "This month against your own chart — transits, key dates, and the areas they touch.",
  laalkitab:  "The Laal Kitaab reading with its own distinctive remedies, drawn from your weakest placements.",
  couples:    "Thirty evenings, thirty questions, one book with both your names on it. A question a day and one small thing to do — plus room to write, four weekly check-ins, and a certificate at the end.",
  vastu:      "Nine directions, and what belongs in each. Every dosh named with the rule behind it, and remedies that need no demolition.",
  varshaphal: "The year ahead. Muntha, the annual chart, Mudda dasha and month-by-month themes.",
  career:     "The 10th house, the Dashamsha, your Amatyakaraka, and when a career turns. Job or business, answered from your own chart."
};

export default function Reports({ items, onPick, onAll, onAskGuide }: {
  items: ReportItem[]; onPick: (c: string) => void; onAll: () => void; onAskGuide: () => void;
}) {
  const [lang] = useLang();
  const h = homeUi(lang);
  const hero = items.find((i) => i.code === "kundli");
  // The home page shows the shape of the range; /reports shows all of it.
  const rest = items.filter((i) => i.code !== "kundli").slice(0, 3);
  // Spelled in the reader's language, from the catalogue rather than typed into
  // the heading — this said "Seven" for a while after the eighth report shipped.
  const howMany = h.numberWords[items.length] || String(items.length);

  return (
    <section id="reports" className="shell py-12 sm:py-28">
      <Reveal>
        <p className="eyebrow">{h.reportsEyebrow}</p>
        <h2 className="display text-[25px] sm:text-[44px] mt-3 max-w-prose2 leading-[1.08]">
          {h.reportsTitle(String(howMany))}
        </h2>
        <p className="lede mt-4 max-w-prose2">
          {h.reportsLede}
        </p>
      </Reveal>

      {hero && (
        <button onClick={() => onPick(hero.code)}
          className="group card mt-8 sm:mt-10 w-full text-left p-4 sm:p-9 flex gap-4
                     sm:grid sm:grid-cols-[auto_1fr_auto] sm:gap-9 sm:items-center
                     hover:shadow-lift hover:-translate-y-0.5 hover:border-faint transition-all">
          <ReportCover code={hero.code} className="w-[92px] shrink-0 sm:w-[152px]" />
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[.14em]
                             bg-brassSoft text-brass rounded-full px-3 py-1">{h.reportsMostComplete}</span>
            <h3 className="display text-[21px] sm:text-[30px] mt-2.5 sm:mt-3">{lang === "hi" ? hero.name_hi : hero.name_en}</h3>
            <p className="text-[13.5px] sm:text-[15px] text-muted mt-2 max-w-prose2 leading-relaxed
                          line-clamp-3 sm:line-clamp-none">{h.cards[hero.code]?.t ?? BLURB[hero.code]}</p>
            <div className="flex items-baseline gap-3 mt-3 sm:hidden">
              <span className="display text-[19px]">{rupees(hero.price_paise)}</span>
              <span className="text-[12.5px] text-faint">{h.chaptersCount(hero.chapters)}</span>
            </div>
            <p className="hidden sm:block text-[13px] text-faint mt-3">
              {h.chaptersPages(hero.chapters)}
            </p>
          </div>
          <div className="hidden sm:block sm:text-right">
            <div className="display text-[24px]">{rupees(hero.price_paise)}</div>
            <span className="btn-dark btn-sm mt-3">{h.reportsSeeInside}</span>
          </div>
        </button>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {rest.map((r) => <ReportCard key={r.code} item={r} onPick={onPick} />)}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <button className="btn-line h-[50px]" onClick={onAll}>
          {h.allReports(items.length)}
        </button>
        <button className="btn-quiet h-[50px]" onClick={onAskGuide}>
          {h.notSure}
        </button>
      </div>
    </section>
  );
}
