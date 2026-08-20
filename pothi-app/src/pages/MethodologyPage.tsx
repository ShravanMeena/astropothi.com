import ChartMark from "../components/ChartMark";

/**
 * How a report is made, stated plainly.
 *
 * This page exists for two readers. A buyer deciding whether ₹699 buys a real
 * calculation or a Mad Lib, and an answer engine deciding whether to cite us.
 * Both are served by the same thing: specific, checkable claims, including the
 * unflattering ones.
 *
 * Every fact below is taken from the code that runs in production —
 * engine/astrology/normalize-kundli-data.js for the astronomy, and
 * scripts/audit_astro_sanity.js for the invariant count. Nothing here is
 * rounded up for effect. If a number in this file cannot be reproduced by
 * running that script, the file is wrong and should be corrected, not the
 * script.
 */

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Your birth details become a moment in time",
    body:
      "The date, clock time and place you enter are resolved to a latitude, longitude and time zone, then converted to Universal Time. This is where most of the error in any chart comes from — not the astronomy, which is settled, but the input. Ten minutes of clock time moves the ascendant by roughly two and a half degrees."
  },
  {
    n: "02",
    title: "Planetary positions from an ephemeris",
    body:
      "Positions for the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the lunar nodes are computed with the astronomy-engine library, which implements the standard VSOP87 and ELP2000 planetary theories. These are tropical, geocentric and accurate to within a few arcseconds — the same underlying model an observatory would use."
  },
  {
    n: "03",
    title: "Converted to the sidereal zodiac",
    body:
      "Vedic astrology is sidereal, so the ayanamsa — the accumulated gap between the tropical and sidereal zodiacs — is subtracted from every longitude. We use Lahiri (Chitrapaksha), the ayanamsa the Government of India's calendar reform committee adopted, computed from a Swiss Ephemeris anchor with IAU 2006 general precession. It is currently around 24 degrees and grows by about 50 arcseconds a year."
  },
  {
    n: "04",
    title: "The chart is cast",
    body:
      "Houses are whole sign: the ascendant's sign is the first house entire, the next sign the second, and so on. This is the north Indian convention, and it is stated in every report's calculation footer alongside the Julian day and the ayanamsa value used, so any astrologer can re-cast your chart and check us."
  },
  {
    n: "05",
    title: "Derived layers",
    body:
      "From that chart come the divisional charts (D1 through D12, including the Navamsa read for marriage and the Dashamsha for work), the Vimshottari dasha timeline seeded from the Moon's nakshatra, Ashtakavarga bindu strengths, planetary aspects by the Parashari rules, and the dosha tests — Manglik, Kaal Sarp, Pitru, Nadi, Bhakoot and the rest — each applied with its cancellation clauses rather than as a yes or no."
  },
  {
    n: "06",
    title: "Checked before a word is written",
    body:
      "Every chart is run against 480 invariants across eight reference charts before any text is generated. Rahu and Ketu exactly 180 degrees apart. No retrograde Sun or Moon. The Vimshottari sequence totalling exactly 120 years. Ashtakavarga summing to 337 bindus. If any of these fail, generation stops rather than producing a confident, wrong book."
  },
  {
    n: "07",
    title: "Written out",
    body:
      "The computed chart is then written into chapters. The structure, the placements, the dates and every number are computed — they are handed to the writing step, which is not permitted to introduce a placement that is not in the chart. The prose that explains what a placement traditionally signifies is drafted with Anthropic's Claude models running in AWS's Mumbai region, working only from those computed facts, and the classical significations are drawn from standard Parashari sources."
  },
  {
    n: "08",
    title: "Typeset and delivered",
    body:
      "The chapters are typeset to a PDF — page numbers, running heads, chapter openers, chart diagrams drawn as vectors — and delivered to your order page, usually in under a minute. English or Hindi; Hindi is set in Devanagari throughout, including planet and nakshatra names."
  }
];

const HONEST: { q: string; a: string }[] = [
  {
    q: "Is astrology being presented here as science?",
    a: "No. The astronomy is science and is verifiable to the arcsecond. The interpretation of what a placement means for a life is a traditional system of belief, and we present it as that. Our reports are for reflection and guidance. They are not medical, legal, financial or psychiatric advice, and nothing in them should replace a qualified professional."
  },
  {
    q: "Where does AI come in, and where does it not?",
    a: "It writes; it does not calculate. No planetary position, house, dasha date, dosha verdict or strength score comes from a language model — all of those are computed and checked first. The model is given the finished chart and writes the explanation around it. This distinction matters, so we would rather state it than let the word 'AI' imply either more or less than it does."
  },
  {
    q: "What is the biggest source of error?",
    a: "Your birth time, by a wide margin. The astronomy is settled to arcseconds, but a clock time recorded from memory or rounded to the nearest half hour is often out by more than that error budget allows. If your time is uncertain, the Moon sign, nakshatra and dasha periods remain reliable; the ascendant and everything keyed to the houses may not."
  },
  {
    q: "Can two people get the same report?",
    a: "Only if they were born at the same moment in the same place. The text is generated per chart, not selected from a bank of pre-written paragraphs."
  },
  {
    q: "What if the report is wrong, or you simply do not like it?",
    a: "You get all your money back. No conditions, no form to fill in, and you keep the file. If a birth detail was entered wrong, we will also regenerate it for you free."
  }
];

export default function MethodologyPage({ onGo }: { onGo: (to: string) => void }) {
  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[720px] max-w-[128vw] text-brass opacity-[.13] dark:opacity-[.17]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>
        <div className="shell relative z-10 py-12 sm:py-24 text-center">
          <p className="eyebrow">Methodology</p>
          <h1 className="display mt-4 text-[28px] sm:text-[52px] leading-[1.05] max-w-[20ch] mx-auto">
            How a report is computed
          </h1>
          <p className="lede mt-5 max-w-prose2 mx-auto">
            The astronomy, the conventions, the checks, and an honest account of
            what is calculated versus what is interpreted.
          </p>
        </div>
      </section>

      <section className="shell py-10 sm:py-20">
        <ol className="grid gap-6 sm:gap-8 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl border border-line p-5 sm:p-7">
              <span className="font-mono text-[12px] text-brass">{s.n}</span>
              <h2 className="display mt-2 text-[19px] sm:text-[23px] leading-tight">{s.title}</h2>
              <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line">
        <div className="shell py-10 sm:py-20">
          <h2 className="display text-[23px] sm:text-[34px]">Plainly, then</h2>
          <p className="lede mt-3 max-w-prose2">
            The questions we would want answered before paying for something like this.
          </p>
          <dl className="mt-8 grid gap-6 max-w-prose2">
            {HONEST.map((h) => (
              <div key={h.q} className="border-t border-line pt-5">
                <dt className="display text-[17px] sm:text-[19px] leading-snug">{h.q}</dt>
                <dd className="mt-2 text-[14px] sm:text-[15px] leading-relaxed text-muted">{h.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <button className="btn-brass h-[52px] px-8 text-[16px]" onClick={() => onGo("/reports")}>
              See the reports
            </button>
            <button className="btn-line h-[52px]" onClick={() => onGo("/faq")}>Read the questions</button>
          </div>
        </div>
      </section>
    </>
  );
}

export { HONEST as METHODOLOGY_QA, STEPS as METHODOLOGY_STEPS };
