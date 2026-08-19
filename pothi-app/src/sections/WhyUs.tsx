import Reveal from "../components/Reveal";

/**
 * Why this and not one of the others.
 *
 * A buyer comparing us to Clickastro or AstroSage is not comparing astrology —
 * every one of them casts the same chart from the same ephemeris. They are
 * comparing what arrives afterwards, and that is where the differences are real
 * and checkable. So every row below is a fact about the product, not a claim
 * about the stars: page counts, a refund policy, a language, a suite that runs.
 *
 * Nothing here names a competitor. Naming them invites a comparison we do not
 * control and hands them the traffic — "the usual report" is honest and is
 * exactly what the reader is holding in their head anyway.
 */

const ROWS: { what: string; them: string; us: string }[] = [
  { what: "Length",
    them: "6–20 pages, mostly headings",
    us: "25–88 pages, every chapter written out" },
  { what: "Written by",
    them: "A template with your name dropped in",
    us: "Computed from your minute of birth, then explained" },
  { what: "Delivery",
    them: "24–72 hours, by email",
    us: "Under a minute, on this page and on WhatsApp" },
  { what: "Questions after",
    them: "Pay again for a consultation",
    us: "Ask the report itself, free, as often as you like" },
  { what: "Language",
    them: "English, or a machine translation",
    us: "English or Hindi, written separately in both" },
  { what: "If you dislike it",
    them: "No refund on digital goods",
    us: "100% back, no questions asked" }
];

export default function WhyUs({ compact = false }: { compact?: boolean }) {
  return (
    <section className="border-y border-line bg-sunken">
      <div className="shell py-12 sm:py-24">
        <Reveal>
          <p className="caps text-brass">Why astropothi</p>
          <h2 className="display text-[25px] sm:text-[40px] mt-3 max-w-[20ch] leading-[1.08]">
            The chart is the same. The book is not.
          </h2>
          {!compact && (
            <p className="lede mt-4 max-w-prose2">
              Every service casts the same chart from the same ephemeris. What differs is
              what lands in your hands afterwards.
            </p>
          )}
        </Reveal>

        <div className="mt-8 sm:mt-12 rounded-2xl border border-line bg-raised overflow-hidden">
          {/* Two columns on a phone as well as a desktop: a comparison that
              stacks stops being a comparison. The labels move above the pair
              instead of taking a third column. */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1.1fr] border-b border-line">
            <div className="px-5 py-3 caps text-faint" />
            <div className="px-5 py-3 caps text-faint">The usual report</div>
            <div className="px-5 py-3 caps text-brass bg-brassSoft/25 dark:bg-brass/10">astropothi</div>
          </div>

          {ROWS.map((r, i) => (
            <div key={r.what}
                 className={`sm:grid sm:grid-cols-[1fr_1fr_1.1fr] ${i ? "border-t border-line" : ""}`}>
              <div className="px-4 sm:px-5 pt-3.5 sm:py-4 text-[12px] sm:text-[14px]
                              caps sm:normal-case sm:tracking-normal sm:font-normal
                              text-faint sm:text-fg sm:font-medium">
                {r.what}
              </div>
              <div className="grid grid-cols-2 sm:contents">
                <div className="px-4 sm:px-5 py-3 sm:py-4 text-[12.5px] sm:text-[14px] text-faint leading-snug">
                  <span className="sm:hidden block caps text-[9.5px] text-faint/70 mb-1">Usual</span>
                  {r.them}
                </div>
                <div className="px-4 sm:px-5 py-3 sm:py-4 text-[12.5px] sm:text-[14px] text-fg leading-snug
                                bg-brassSoft/25 dark:bg-brass/10">
                  <span className="sm:hidden block caps text-[9.5px] text-brass mb-1">astropothi</span>
                  {r.us}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[12px] text-faint max-w-prose2">
          “The usual report” describes what the large Indian astrology services currently sell
          at this price. Compare for yourself before buying — the sample above is free.
        </p>
      </div>
    </section>
  );
}
