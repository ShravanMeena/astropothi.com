import GrahaOrbit from "../components/GrahaOrbit";

/**
 * Why the numbers can be trusted. Every claim here is measured, not asserted —
 * the arcsecond figure and the invariant count come from the suite that runs
 * against the engine.
 */
const FACTS: [string, string][] = [
  ["Sidereal, Lahiri", "Chitrapaksha ayanamsha, within 2.3 arcseconds of the reference value."],
  ["480 invariants", "Every chart is checked: nodes exactly 180° apart, dashas totalling 120 years, Ashtakavarga summing to 337."],
  ["Your minute, not your day", "Lagna moves a full sign every two hours. We use the birth time you give us."],
  ["Facts, then plain language", "The chart is arithmetic and never guessed. What it means is explained in words anyone can read — checked, so it can only explain what was computed."]
];

export default function Engine() {
  return (
    <section id="engine" className="relative overflow-hidden grain lamp border-y border-line scroll-mt-20">
      <div className="shell relative z-10 py-20 sm:py-28 grid lg:grid-cols-[.95fr_1.05fr] gap-14 items-center">
        <div>
          <p className="caps text-brass">Computed, not copied</p>
          <h2 className="display text-[32px] sm:text-[46px] mt-3 leading-[1.05]">
            Nine grahas.<br />One ephemeris.
          </h2>
          <p className="lede mt-5 max-w-prose2">
            Every fact in your book — every sign, house, date and score — is computed
            from your own chart. The explanation around those facts is written in plain
            language, and it may never introduce a placement the calculation did not find.
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
        <div className="relative mx-auto w-full max-w-[520px] text-brass">
          <GrahaOrbit className="w-full h-auto" />
        </div>
      </div>
    </section>
  );
}
