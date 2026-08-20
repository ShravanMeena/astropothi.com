import Reveal from "../components/Reveal";
import { useLang } from "../lib/lang";
import { ui } from "../lib/reportStrings";

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


export default function WhyUs({ compact = false }: { compact?: boolean }) {
  const [lang] = useLang();
  const t = ui(lang);
  // The comparison rows live beside the rest of the page copy rather than in
  // this file, so a translation cannot go stale against the English it mirrors.
  const ROWS = t.rows;
  return (
    <section className="border-y border-line bg-sunken">
      <div className="shell py-12 sm:py-24">
        <Reveal>
          <p className="caps text-brass">{t.whyEyebrow}</p>
          <h2 className="display text-[25px] sm:text-[40px] mt-3 max-w-[20ch] leading-[1.08]">
            {t.whyTitle}
          </h2>
          {!compact && (
            <p className="lede mt-4 max-w-prose2">
              {t.whyLede}
            </p>
          )}
        </Reveal>

        <div className="mt-8 sm:mt-12 rounded-2xl border border-line bg-raised overflow-hidden">
          {/* Two columns on a phone as well as a desktop: a comparison that
              stacks stops being a comparison. The labels move above the pair
              instead of taking a third column. */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1.1fr] border-b border-line">
            <div className="px-5 py-3 caps text-faint" />
            <div className="px-5 py-3 caps text-faint">{t.usual}</div>
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
                  <span className="sm:hidden block caps text-[9.5px] text-faint/70 mb-1">{t.usualShort}</span>
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
          {t.whyFootnote}
        </p>
      </div>
    </section>
  );
}
