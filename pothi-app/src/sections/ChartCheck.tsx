import { useState } from "react";
import { DateField, TimeField } from "../components/Picker";
import PlaceInput from "./PlaceInput";
import { runChartCheck, type ChartCheckResult } from "../lib/chartCheck";
import { track } from "../lib/track";
import { holdWelcome } from "../lib/qualify";
import { useLang } from "../lib/lang";

/**
 * A real answer about the visitor's own chart, on the first screen.
 *
 * Measured, not assumed: of 77 devices that opened a report page in thirty
 * days, 4 scrolled past the first screen. Everything below the fold — the
 * sample, the chapter list, the engine explainer — is addressed to nobody. So
 * the one place worth spending is the screen everybody sees, and the only thing
 * that belongs there is something about them rather than about us.
 *
 * This runs the same dosha detector the paid report runs. When the answer is
 * "you are not Manglik" it says exactly that, which is the most useful sentence
 * we can give away — a lot of people have been told otherwise for years.
 *
 * It also captures the three fields checkout needs, so the buy page can be
 * pre-filled instead of asking for a birth time twice.
 */

const T = {
  en: {
    eyebrow: "Free · no account",
    title: "Is Manglik dosh in your chart?",
    sub: "Enter your birth details. We run the same calculation the report runs and tell you now — whichever way it comes out.",
    dob: "Date of birth", tob: "Time of birth", pob: "Place of birth",
    dontKnow: "I don't know my birth time",
    unknownTitle: "Your birth time decides this one",
    unknownBody: (signs: number, flips: number) =>
      `Manglik dosh is read from the ascendant, and the ascendant moves through ${signs} signs in a single day. On your date and place the answer flips ${flips} times between midnight and midnight — so without a time, any verdict would be a guess printed as a fact.`,
    stillTrue: "What your date alone does settle",
    findIt: "Your birth certificate or a hospital record is the best source. Even the closest hour you remember is enough for a real answer.",
    enterTime: "Enter a time instead",
    go: "Check my chart", busy: "Casting your chart…",
    hintTime: "As close as you know — ten minutes moves the ascendant",
    yes: "Manglik dosh is present", no: "No Manglik dosh in your chart",
    marsIn: (h: string, s: string) => `Mars is in your ${h} house, in ${s}.`,
    band: "Severity", of100: "/100",
    reduced: "Classical cancellations that apply to you",
    noneApply: "No classical cancellation applies, so it reads at full strength.",
    notManglik: (h: string) => `Mars is in your ${h} house — outside the six Manglik houses (1, 2, 4, 7, 8 and 12), so the rule is never met.`,
    yourChart: "Your chart",
    moon: "Moon sign", nak: "Nakshatra", asc: "Ascendant",
    nextTitle: "That is one of fourteen.",
    nextBody: (n: number) => `The full report tests all ${n} — Kaal Sarp, Sade Sati, Pitra, Guru Chandal and the rest — explains what each means for you, and gives the classical remedies.`,
    cta: "Get the full report",
    again: "Check another chart",
    err: "Could not cast that chart"
  },
  hi: {
    eyebrow: "मुफ़्त · कोई खाता नहीं",
    title: "क्या आपकी कुंडली में मांगलिक दोष है?",
    sub: "अपने जन्म विवरण भरिए। वही गणना जो रिपोर्ट में चलती है, अभी चलाकर बता देंगे — उत्तर जो भी हो।",
    dob: "जन्म तिथि", tob: "जन्म समय", pob: "जन्म स्थान",
    dontKnow: "मुझे अपना जन्म समय नहीं पता",
    unknownTitle: "यह उत्तर आपके जन्म समय पर निर्भर है",
    unknownBody: (signs: number, flips: number) =>
      `मांगलिक दोष लग्न से देखा जाता है, और लग्न एक ही दिन में ${signs} राशियों से गुज़रता है। आपकी तिथि और स्थान पर यह उत्तर एक दिन में ${flips} बार पलटता है — इसलिए बिना समय के कोई भी निष्कर्ष अनुमान होगा, तथ्य नहीं।`,
    stillTrue: "केवल तिथि से जो तय हो जाता है",
    findIt: "जन्म प्रमाण-पत्र या अस्पताल का रिकॉर्ड सबसे भरोसेमंद है। याद रहने वाला निकटतम घंटा भी सही उत्तर के लिए काफ़ी है।",
    enterTime: "समय भरकर देखें",
    go: "मेरी कुंडली जाँचें", busy: "कुंडली बन रही है…",
    hintTime: "जितना सही पता हो — दस मिनट से लग्न बदल जाता है",
    yes: "मांगलिक दोष उपस्थित है", no: "आपकी कुंडली में मांगलिक दोष नहीं है",
    marsIn: (h: string, s: string) => `मंगल आपके ${h}वें भाव में, ${s} राशि में है।`,
    band: "तीव्रता", of100: "/100",
    reduced: "आप पर लागू शास्त्रीय निवारण",
    noneApply: "कोई शास्त्रीय निवारण लागू नहीं होता, इसलिए यह पूर्ण बल में है।",
    notManglik: (h: string) => `मंगल आपके ${h}वें भाव में है — छह मांगलिक भावों (1, 2, 4, 7, 8, 12) से बाहर, इसलिए यह नियम बनता ही नहीं।`,
    yourChart: "आपकी कुंडली",
    moon: "चंद्र राशि", nak: "नक्षत्र", asc: "लग्न",
    nextTitle: "यह चौदह में से एक है।",
    nextBody: (n: number) => `पूरी रिपोर्ट सभी ${n} जाँचती है — कालसर्प, साढ़े साती, पितृ, गुरु चांडाल और बाकी — हर एक का अर्थ बताती है, और शास्त्रोक्त उपाय देती है।`,
    cta: "पूरी रिपोर्ट लें",
    again: "दूसरी कुंडली जाँचें",
    err: "यह कुंडली नहीं बन सकी"
  }
} as const;

export default function ChartCheck({ code, onBuy }: { code: string; onBuy: () => void }) {
  const [lang] = useLang();
  const t = T[lang === "hi" ? "hi" : "en"];
  const [f, setF] = useState({ dob: "", tob: "", pob: "", place_id: "" });
  const [noTime, setNoTime] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<ChartCheckResult | null>(null);

  // The moment they start filling this in, the welcome sheet stops competing
  // for the same screen — see lib/qualify.ts.
  const set = (patch: Partial<typeof f>) => { holdWelcome(); setF((prev) => ({ ...prev, ...patch })); };

  const ready = !!f.dob && (noTime || !!f.tob) && (!!f.place_id || f.pob.trim().length > 2);

  async function submit() {
    if (!ready || busy) return;
    setBusy(true); setErr("");
    track("chart_check_started", { code, tob_unknown: noTime });
    try {
      const r = await runChartCheck({ ...f, tob_unknown: noTime });
      setRes(r);
      // The verdict is the interesting dimension: it tells us whether the free
      // answer being "no" costs us the sale or wins it.
      track("chart_check_done", { code, time_known: r.time_known, manglik: r.manglik?.present ?? null, severity: r.manglik?.severity ?? null });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.err);
      track("chart_check_failed", { code });
    } finally { setBusy(false); }
  }

  const deva = lang === "hi" ? "deva" : "";

  /* ── Result: the birth time was not known ────────────────────────────
     No Manglik verdict here, and the numbers say why rather than a warning
     saying "may be inaccurate". See chart-check.service.js. */
  if (res && !res.time_known) {
    const why = res.why;
    const facts = ([[t.moon, res.chart.moon_sign], [t.nak, res.chart.nakshatra]] as const)
      .filter(([, v]) => v);
    return (
      <section data-chart-check className="border-b border-line bg-sunken">
        <div className="shell py-7 sm:py-10 max-w-prose2">
          <h2 className={`display text-[21px] sm:text-[27px] leading-tight ${deva}`}>{t.unknownTitle}</h2>
          <p className={`mt-3 text-[14.5px] leading-relaxed text-muted ${deva}`}>
            {t.unknownBody(why?.ascendant_signs_in_a_day ?? 6, why?.manglik_flips_in_a_day ?? 4)}
          </p>

          {facts.length > 0 && (
            <>
              <p className={`mt-6 text-[12px] uppercase tracking-[.14em] text-faint ${deva}`}>{t.stillTrue}</p>
              <dl className="mt-2 flex flex-wrap gap-x-7 gap-y-2 text-[14.5px]">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className={`text-faint ${deva}`}>{k}</dt><dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <p className={`mt-5 text-[13.5px] leading-relaxed text-muted ${deva}`}>{t.findIt}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-brass h-[46px] px-6 text-[15px]"
                    onClick={() => { setRes(null); setNoTime(false); }}>{t.enterTime}</button>
            <button className="btn-line h-[46px] text-[14px]" onClick={onBuy}>{t.cta}</button>
          </div>
        </div>
      </section>
    );
  }

  if (res && res.manglik) {
    const m = res.manglik;
    const clauses = [...m.cancellations, ...m.mitigators];
    // English wants the ordinal ("4th house"), Hindi wants the bare number
    // ("4वें भाव"). Passing the raw number to both printed "your 4 house".
    const house = lang === "hi"
      ? String(m.mars_house ?? "—")
      : (m.mars_house_label || String(m.mars_house ?? "—"));
    return (
      <section className="border-b border-line bg-sunken">
        <div className="shell py-7 sm:py-10 max-w-prose2">
          <div className={`flex items-start gap-3 ${deva}`}>
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${m.present ? "bg-ember" : "bg-brass"}`} />
            <div>
              <h2 className="display text-[21px] sm:text-[27px] leading-tight">
                {m.present ? t.yes : t.no}
              </h2>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
                {m.present
                  ? t.marsIn(house, m.mars_sign || "—")
                  : t.notManglik(house)}
              </p>
            </div>
          </div>

          {m.present && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px]">
              <span className={deva}>
                <span className="text-faint">{t.band} </span>
                <span className="font-semibold">{m.severity}</span>
                <span className="text-faint"> · {m.score}{t.of100}</span>
              </span>
            </div>
          )}

          {m.present && (
            <div className="mt-4">
              <p className={`text-[12px] uppercase tracking-[.14em] text-faint ${deva}`}>{t.reduced}</p>
              {clauses.length ? (
                <ul className="mt-2 grid gap-1.5">
                  {clauses.map((c) => (
                    <li key={c} className="flex gap-2.5 text-[14px]">
                      <span className="text-brass">✓</span><span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-1.5 text-[14px] text-muted ${deva}`}>{t.noneApply}</p>
              )}
            </div>
          )}

          <dl className="mt-5 flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-4 text-[13.5px]">
            {([[t.moon, res.chart.moon_sign], [t.nak, res.chart.nakshatra], [t.asc, res.chart.ascendant]] as const)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className={`text-faint ${deva}`}>{k}</dt><dd>{v}</dd>
                </div>
              ))}
          </dl>

          <div className="mt-6 rounded-xl border border-line bg-raised p-4 sm:p-5">
            <h3 className={`display text-[17px] sm:text-[19px] ${deva}`}>{t.nextTitle}</h3>
            <p className={`mt-1.5 text-[14px] leading-relaxed text-muted ${deva}`}>
              {t.nextBody(res.checks_in_report)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-brass h-[46px] px-6 text-[15px]" onClick={onBuy}>{t.cta}</button>
              <button className="btn-line h-[46px] text-[14px]"
                      onClick={() => { setRes(null); setNoTime(false); setF({ dob: "", tob: "", pob: "", place_id: "" }); }}>
                {t.again}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-chart-check className="border-b border-line bg-sunken">
      <div className="shell py-7 sm:py-10 max-w-prose2">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className={`display mt-2 text-[21px] sm:text-[27px] leading-tight ${deva}`}>{t.title}</h2>
        <p className={`mt-2 text-[14.5px] leading-relaxed text-muted ${deva}`}>{t.sub}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={`block text-[12.5px] text-faint mb-1.5 ${deva}`}>{t.dob}</label>
            <DateField value={f.dob} onChange={(dob) => set({ dob })} />
          </div>
          <div>
            <label className={`block text-[12.5px] text-faint mb-1.5 ${deva}`}>{t.tob}</label>
            <div className={noTime ? "opacity-40 pointer-events-none" : ""}>
              <TimeField value={f.tob} onChange={(tob) => set({ tob })} />
            </div>
            {!noTime && <p className={`mt-1 text-[11.5px] text-faint ${deva}`}>{t.hintTime}</p>}
            {/* Offered, not hidden. Plenty of people genuinely do not know, and
                making them invent a time produces a confident wrong answer —
                which is the one outcome this whole section exists to avoid. */}
            <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={noTime}
                     onChange={(e) => { holdWelcome(); setNoTime(e.target.checked); }}
                     className="h-4 w-4 rounded border-line text-brass focus:ring-brass/40" />
              <span className={`text-[12.5px] text-muted ${deva}`}>{t.dontKnow}</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={`block text-[12.5px] text-faint mb-1.5 ${deva}`}>{t.pob}</label>
            <PlaceInput value={f.pob} placeId={f.place_id} onChange={(v) => set(v)} />
          </div>
        </div>

        {err && <p className="mt-3 text-[13.5px] text-ember">{err}</p>}

        <button className="btn-brass mt-5 h-[50px] px-7 text-[15px] w-full sm:w-auto disabled:opacity-45"
                disabled={!ready || busy} onClick={submit}>
          {busy ? t.busy : t.go}
        </button>
      </div>
    </section>
  );
}
