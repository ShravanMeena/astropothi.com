import GrahaOrbit from "../components/GrahaOrbit";
import { useLang } from "../lib/lang";
import { ui } from "../lib/reportStrings";

/**
 * Why the numbers can be trusted. Every claim here is measured, not asserted —
 * the arcsecond figure and the invariant count come from the suite that runs
 * against the engine.
 */

export default function Engine() {
  const [lang] = useLang();
  const t = ui(lang);
  // The facts live beside the rest of the page copy, so the arcsecond figure and
  // the invariant count cannot drift apart between the two languages.
  const FACTS = t.engineFacts;
  return (
    <section id="engine" className="relative overflow-hidden grain lamp border-y border-line scroll-mt-20">
      <div className="shell relative z-10 py-12 sm:py-28 grid lg:grid-cols-[.95fr_1.05fr] gap-14 items-center">
        <div>
          <p className="caps text-brass">{t.engineEyebrow}</p>
          <h2 className="display text-[24px] sm:text-[46px] mt-3 leading-[1.05]">
            {t.engineTitleA}<br />{t.engineTitleB}
          </h2>
          <p className="lede mt-5 max-w-prose2">
            {t.engineLede}
          </p>
          <dl className="mt-10 space-y-5">
            {FACTS.map(([k, v]) => (
              <div key={k} className="flex gap-5 border-t border-line pt-5">
                <dt className="font-serif text-[16px] text-brass w-[9.5rem] shrink-0 leading-snug">{k}</dt>
                <dd className="text-[14.5px] text-muted leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        {/* Desktop only: a square animation next to four facts is a nice
            aside on a wide screen and 500px of scrolling on a phone. */}
        <div className="hidden sm:block relative mx-auto w-full max-w-[520px] text-brass">
          <GrahaOrbit className="w-full h-auto" />
        </div>
      </div>
    </section>
  );
}
