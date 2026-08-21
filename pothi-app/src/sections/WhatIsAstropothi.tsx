import type { ReportItem } from "../lib/api";
import Faq from "../components/Faq";
import Link from "../components/Link";
import { SITE_FAQ } from "../content/siteFaq";

/**
 * What this site is, in the page, in plain words.
 *
 * The homepage said what the product feels like — "Your birth chart, read
 * properly" — and never once said what astropothi *is*. A person skimming can
 * infer it from the covers; a search engine deciding what entity this domain
 * represents, and an answer engine deciding whether it can be quoted, cannot.
 *
 * The list of what it covers is built from the live catalogue rather than
 * typed here, so it can never advertise a report that has been withdrawn or
 * miss one that was added — which has already happened once: a Couples
 * Challenge appeared in the catalogue overnight and nothing on the site
 * mentioned it.
 */

const WHAT_IT_COVERS: Record<string, string> = {
  kundli:     "Every house and planet, the dasha timeline, divisional charts and strengths",
  dosh:       "Manglik, Kaal Sarp, Sade Sati, Pitra and ten more, with their cancellation clauses",
  love:       "The 7th house, Venus, Mars and the navamsa — attachment, friction, and timing",
  health:     "Lagna, the 6th house, the Moon, and your tatva and prakriti",
  horoscope:  "This month's transits placed against your own natal houses",
  laalkitab:  "The Lal Kitab reading, with its own logic and its own upaay",
  varshaphal: "The solar-return chart for the year: Muntha, bala and the Mudda dasha",
  career:     "The 10th house and its lord, the Dashamsha, and the dasha windows for work",
  vastu:      "Nine directions of a home checked against the Vastu Purusha Mandala",
  couples:    "Thirty-seven chapters of questions for two people, printed with both names"
};

export default function WhatIsAstropothi({ items }: { items: ReportItem[] }) {
  const covered = items.filter((i) => WHAT_IT_COVERS[i.code]);

  return (
    <section id="what-is-astropothi" className="border-t border-line">
      <div className="shell py-10 sm:py-16">
        <div className="max-w-prose2">
          <h2 className="display text-[23px] sm:text-[32px] leading-tight">What is astropothi?</h2>
          {/* The direct answer, first, in one paragraph — the shape an answer
              engine can lift and a skim-reader can finish. */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed">
            astropothi creates personalised Vedic astrology reports from your birth details — date of
            birth, exact birth time and birthplace. It computes the relevant birth-chart data from an
            astronomical ephemeris and explains what it found in clear language, as a typeset book of
            22 to 64 written chapters rather than a summary.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            It is for anyone who wants their own chart read out properly — not a sun-sign column, and
            not a one-paragraph verdict. Every number in a report is calculated from the moment and
            place you were born; the writing around those numbers explains what the tradition holds
            them to mean.{" "}
            <Link to="/methodology" className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass">
              How a report is computed
            </Link>{" "}
            sets out the ephemeris, the ayanamsa and the checks in full.
          </p>
        </div>

        {covered.length > 0 && (
          <>
            <h3 className="display text-[19px] sm:text-[24px] mt-10">
              What can astropothi help you understand?
            </h3>
            <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {covered.map((r) => (
                <li key={r.code} className="flex gap-3">
                  <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                  <div>
                    <Link to={`/report/${r.code}`}
                          className="text-[15px] font-semibold hover:text-brass transition">
                      {r.name_en}
                    </Link>
                    <p className="text-[13.5px] leading-relaxed text-muted mt-0.5">
                      {WHAT_IT_COVERS[r.code]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-12 max-w-prose2">
          <h3 className="display text-[19px] sm:text-[24px]">Questions people ask first</h3>
          <div className="mt-5">
            <Faq items={SITE_FAQ} idPrefix="home-faq" />
          </div>
          <p className="mt-6 text-[13.5px] text-muted">
            More in{" "}
            <Link to="/faq" className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass">
              the full list of questions
            </Link>
            , or read{" "}
            <Link to="/learn" className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass">
              the doshas explained
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
