// ─────────────────────────────────────────────────────────────────────────────
// Dosh report chapter expander — 14 dosh verdicts + 28 rendered pages
//
// buildDoshReportJSONB() only emits the doshas that were DETECTED. A report sold
// as a 28-page document has to do the harder, more honest thing: check every
// classical dosh, print the verdict for each — including the ones that are NOT
// there — state the rule that would have triggered it, and state the specific
// reason it does not fire in this chart.
//
// Rules of this module:
//   • No LLM. Every sentence is a static bilingual template from this repo with
//     engine-computed values interpolated. A `language: "hi"` run is Hindi end
//     to end (titles, labels, bodies) with no translation step.
//   • No assertion that is not computable — if the engine cannot produce the
//     value, the sentence is not printed.
//   • Chart-bearing chapters carry structured `placements` so the UI draws the
//     diagram from values rather than parsing prose.
//
// Output added to the report:
//   doshas[]        14 verdicts, each with an explicit boolean `detected`
//   cancellations[] classical cancellation clauses, { dosh, rule, applies }
//   sections[]      the 28 pages, titles/order identical to the stored sample
//   minor_patterns[] secondary patterns the engine also checks
// ─────────────────────────────────────────────────────────────────────────────

import { CANONICAL_DOSHAS } from "../lib/doshas.js";
import { DOSHA_DETAILS } from "../lib/dosha-details.js";
import { pickDoshaDetails } from "../i18n/dosha-details-hi.js";
import { GANA_MAP, NADI_MAP, NAKSHATRAS, SignLords } from "../astrology/astro-constants.js";
import { severityLabelFromNumber } from "./dosh-report-mapper.js";
import { buildSections } from "./dosh-sections.js";
import { localizeDates } from "../i18n/forecast-strings.js";
import {
  norm, t, sg, pl, nk, plCompound, ordinal, oh, od, deg, joinList,
  angularSeparation, signDistance, signAtOffset, aspectDistance, jupiterAspects,
  PLANET_ABBR, OWN_SIGNS, EXALTATION, NATURAL_FRIENDS,
  affectsFor, ruleFor, mantraFor, colorLoc, dayLoc,
} from "./dosh-i18n.js";

const canonical = (id) => CANONICAL_DOSHAS.find((d) => d.id === id) || {};
const nameFor = (id, lang) => (norm(lang) === "hi" ? canonical(id).name_hi : canonical(id).name_en) || id;

/** Language-correct dosha detail table (static, in-repo). */
const detailsTable = (lang) => pickDoshaDetails(norm(lang)) || DOSHA_DETAILS;

function remedyStrings(details) {
  if (!details || !Array.isArray(details.remedies)) return [];
  return details.remedies.slice(0, 5)
    .map((r) => (r && r.title ? (r.detail ? `${r.title}: ${r.detail}` : r.title) : ""))
    .filter(Boolean);
}

function remedyPujaName(details, fallbackName, lang) {
  if (details && Array.isArray(details.remedies)) {
    const puja = details.remedies.find((r) => /pooja|puja|पूजा|अनुष्ठान/i.test(r?.title || ""));
    if (puja) return puja.title;
  }
  return t(lang, `${fallbackName} Shanti Puja`, `${fallbackName} शान्ति पूजा`);
}

// Chapter order = the order the doshas appear across the 28 pages.
// `page` is where the dosh is primarily presented; `pages` lists every page it
// owns (the sample gives Mangal and Pitru three pages each, Sade Sati two).
const CHAPTER_ORDER = [
  { id: "mangal_dosh",       source: "manglik",      page: 5,  pages: [5, 6, 7] },
  { id: "kaal_sarp_dosh",    source: "kaal_sarp",    page: 8,  pages: [8] },
  { id: "pitru_dosh",        source: "pitra_dosha",  page: 9,  pages: [9, 10, 11] },
  { id: "nadi_dosh",         source: null,           page: 12, pages: [12] },
  { id: "bhakoot_dosh",      source: null,           page: 13, pages: [13] },
  { id: "gana_dosh",         source: null,           page: 14, pages: [14] },
  { id: "kemadruma_dosh",    source: "kemadruma",    page: 15, pages: [15] },
  { id: "grahan_dosh",       source: "grahan",       page: 16, pages: [16] },
  { id: "guru_chandal_dosh", source: "guru_chandal", page: 16, pages: [16] },
  { id: "angarak_dosh",      source: "angarak",      page: 16, pages: [16] },
  { id: "shrapit_dosh",      source: "shrapit",      page: 16, pages: [16] },
  { id: "sade_sati",         source: "sade_sati",    page: 17, pages: [17, 18] },
  { id: "shani_dhaiya",      source: null,           page: 19, pages: [19] },
  { id: "chandra_dosh",      source: "vish_yoga",    page: 20, pages: [20] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chart context
// ─────────────────────────────────────────────────────────────────────────────
export function buildContext(kundliData, entries, sadeSati, manglik, language) {
  const lang = norm(language);
  const planets = kundliData?.planets || [];
  const houses = kundliData?.houses || [];
  const ad = kundliData?.astroDetails || {};
  const panchang = kundliData?.panchang || {};
  const P = (n) => planets.find((p) => p.name === n) || null;

  const moon = P("Moon");
  const sun = P("Sun");
  const moonSign = moon?.sign || ad.sign;
  const moonNakshatra = moon?.nakshatra || panchang.nakshatra;
  const saturnTransitSign = kundliData?.transitSnapshot?.saturnSign || null;

  return {
    lang, kundliData, entries, planets, houses, ad, panchang, P,
    moon, sun, moonSign, moonNakshatra,
    mars: P("Mars"), saturn: P("Saturn"), jupiter: P("Jupiter"),
    rahu: P("Rahu"), ketu: P("Ketu"), venus: P("Venus"), mercury: P("Mercury"),
    lagna: ad.ascendant, lagnaLord: ad.ascendantLord,
    nadi: NADI_MAP[moonNakshatra] || null,
    gana: GANA_MAP[moonNakshatra] || null,
    saturnTransitSign,
    saturnFromMoon: moonSign && saturnTransitSign ? signDistance(moonSign, saturnTransitSign) : null,
    // Sun–Moon elongation → paksha strength. Under 72° the Moon is Kshina.
    elongation: sun && moon ? angularSeparation(sun.longitude, moon.longitude) : null,
    byKey: Object.fromEntries((entries || []).map((e) => [e.key, e])),
    sadeSati, manglik,
    dashas: kundliData?.dashas || {},
    numerology: kundliData?.numerology || {},
    placements: planets.map((p) => ({
      planet: pl(p.name, lang),
      abbr: PLANET_ABBR[p.name] || p.name.slice(0, 2),
      sign: sg(p.sign, lang),
      house: p.house,
      degree: Number(Number(p.degree).toFixed(2)),
      retrograde: Boolean(p.retrograde),
      planet_en: p.name,
      sign_en: p.sign,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-dosh chart verdicts. Each returns { detected, score, short, why, extra }
// with `short`/`why` already language-correct.
// ─────────────────────────────────────────────────────────────────────────────

function manglikVerdict(ctx) {
  const { lang, mars, manglik } = ctx;
  if (!mars) return null;
  const present = ctx.byKey.manglik?.present || false;
  const score = ctx.byKey.manglik?.score || 0;
  const verdict = manglik?.netVerdict || "no-dosha";
  const inHouses = [1, 2, 4, 7, 8, 12].includes(mars.house);
  const cancels = (manglik?.cancellations || []).length;

  const place = t(lang,
    `Mars is in ${mars.sign} at ${deg(mars.degree)}, ${oh(mars.house, lang)} from the ${ctx.lagna} ascendant`,
    `मंगल ${sg(mars.sign, lang)} में ${deg(mars.degree)} पर, ${sg(ctx.lagna, lang)} लग्न से ${oh(mars.house, lang)} में स्थित है`);

  if (present) {
    const reduced = verdict === "substantially-reduced" || verdict === "partially-reduced";
    return {
      detected: true, score,
      short: t(lang,
        `${place} — one of the six Manglik houses.${reduced ? ` ${cancels} classical cancellation${cancels === 1 ? "" : "s"} reduce${cancels === 1 ? "s" : ""} it, which is why the score is ${score} and not higher.` : " No classical cancellation applies, so the dosh reads at full strength."}`,
        `${place} — यह छह मांगलिक भावों में से एक है।${reduced ? ` ${cancels} शास्त्रीय निवारण लागू होते हैं, इसीलिए अंक ${score} है, इससे अधिक नहीं।` : " कोई शास्त्रीय निवारण लागू नहीं होता, अतः दोष पूर्ण बल में है।"}`),
    };
  }
  return {
    detected: false, score: 0,
    short: t(lang,
      `${place} — outside the six Manglik houses (1, 2, 4, 7, 8, 12). Mangal Dosh does not form for you.`,
      `${place} — जो छह मांगलिक भावों (1, 2, 4, 7, 8, 12) से बाहर है। आपकी कुंडली में मंगल दोष नहीं बनता।`),
    why: inHouses
      ? t(lang,
        `Mars does occupy a Manglik house, but ${cancels} classical full cancellation${cancels === 1 ? "" : "s"} apply, so the dosh is treated as neutralised rather than active.`,
        `मंगल मांगलिक भाव में तो है, किन्तु ${cancels} पूर्ण शास्त्रीय निवारण लागू होने से दोष निरस्त माना जाता है, सक्रिय नहीं।`)
      : t(lang,
        `The rule needs Mars in house 1, 2, 4, 7, 8 or 12 counted from the ascendant. Yours is in ${hnum(mars.house)}, so the condition is never met — no cancellation clause is even needed.`,
        `नियम के लिए मंगल का लग्न से 1, 2, 4, 7, 8 या 12वें भाव में होना आवश्यक है। आपका मंगल भाव ${mars.house} में है, अतः शर्त कभी पूरी ही नहीं होती — किसी निवारण की आवश्यकता ही नहीं पड़ती।`),
  };
}

const hnum = (n) => `house ${n}`;

function kaalSarpVerdict(ctx) {
  const { lang, rahu, ketu } = ctx;
  const entry = ctx.byKey.kaal_sarp;
  if (!rahu || !ketu || !entry) return null;
  const sides = { fwd: [], back: [] };
  for (const n of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) {
    const p = ctx.P(n);
    if (!p) continue;
    (((p.longitude - rahu.longitude + 360) % 360) < 180 ? sides.fwd : sides.back).push(pl(n, lang));
  }
  const nearest = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    .map((n) => ctx.P(n)).filter(Boolean)
    .reduce((m, p) => Math.min(m, angularSeparation(p.longitude, rahu.longitude), angularSeparation(p.longitude, ketu.longitude)), 999);

  const axis = t(lang,
    `The axis runs Rahu in ${sg(rahu.sign, lang)} (${oh(rahu.house, lang)}) to Ketu in ${sg(ketu.sign, lang)} (${oh(ketu.house, lang)})`,
    `अक्ष राहु ${sg(rahu.sign, lang)} (${oh(rahu.house, lang)}) से केतु ${sg(ketu.sign, lang)} (${oh(ketu.house, lang)}) तक है`);

  if (entry.present) {
    const leaking = nearest < 6;
    return {
      detected: true, score: entry.score,
      short: t(lang,
        `${axis}, and all seven planets fall on one side of it. ${leaking ? `The nearest planet sits ${deg(nearest)} from a node, which makes this a leaking (partial) Kaal Sarp rather than a sealed one.` : "No planet breaks the arc, so the hemming is complete."}`,
        `${axis}, और सातों ग्रह इसके एक ही ओर पड़ते हैं। ${leaking ? `निकटतम ग्रह किसी नोड से ${deg(nearest)} पर है, अतः यह पूर्ण नहीं बल्कि आंशिक (रिसाव वाला) काल सर्प है।` : "कोई ग्रह अक्ष को नहीं तोड़ता, अतः घेरा पूर्ण है।"}`),
    };
  }
  return {
    detected: false, score: 0,
    short: t(lang,
      `${axis}. Planets fall on both sides of it, so Kaal Sarp Dosh does not form.`,
      `${axis}। ग्रह इसके दोनों ओर स्थित हैं, अतः काल सर्प दोष नहीं बनता।`),
    why: t(lang,
      `${joinList(sides.fwd, lang)} sit on the Rahu side and ${joinList(sides.back, lang)} on the Ketu side. The rule needs every one of the seven on a single side; a single planet on the far arc is enough to break it, and you have ${Math.min(sides.fwd.length, sides.back.length)}.`,
      `${joinList(sides.fwd, lang)} राहु की ओर हैं तथा ${joinList(sides.back, lang)} केतु की ओर। नियम के लिए सातों का एक ही ओर होना आवश्यक है; दूसरी ओर एक ग्रह भी घेरा तोड़ देता है, और आपके यहाँ ${Math.min(sides.fwd.length, sides.back.length)} हैं।`),
  };
}

function pitruVerdict(ctx) {
  const { lang, sun } = ctx;
  const entry = ctx.byKey.pitra_dosha;
  if (!sun || !entry) return null;
  const sep = (p) => (p ? deg(angularSeparation(sun.longitude, p.longitude)) : "—");
  const ninth = ctx.planets.filter((p) => p.house === 9);
  const ninthNames = ninth.map((p) => pl(p.name, lang));
  const afflicters = ninth.filter((p) => ["Rahu", "Ketu", "Saturn"].includes(p.name)).map((p) => pl(p.name, lang));

  if (entry.present) {
    // Which of the three actually sits inside the orb — the sentence used to
    // print all three separations and then assert, unconditionally, that they
    // were "inside the 15° affliction orb". For a chart where only Saturn is
    // close (Rahu 143°, Ketu 37°, Saturn 8°) that is a plainly false statement
    // attached to a verdict that is itself correct — the first thing an
    // astrologer reading the report would catch. Name only what qualifies, and
    // say so explicitly when the trigger is the 9th house rather than an orb.
    const ORB = 15;
    const within = [["Rahu", ctx.rahu], ["Ketu", ctx.ketu], ["Saturn", ctx.saturn]]
      .filter(([, p]) => p && angularSeparation(sun.longitude, p.longitude) <= ORB);
    const withinText = within
      .map(([name, p]) => `${pl(name, lang)} ${deg(angularSeparation(sun.longitude, p.longitude))}`);

    const orbClause = within.length
      ? t(lang,
        `Inside the ${ORB}° affliction orb of the Sun: ${joinList(withinText, lang)}.`,
        `सूर्य की ${ORB}° पीड़ा-सीमा के भीतर: ${joinList(withinText, lang)}।`)
      : t(lang,
        `No planet falls inside the ${ORB}° affliction orb of the Sun — the dosh forms from the 9th house alone.`,
        `कोई ग्रह सूर्य की ${ORB}° पीड़ा-सीमा के भीतर नहीं है — यह दोष केवल नवम भाव से बनता है।`);

    return {
      detected: true, score: entry.score,
      short: t(lang,
        `The Sun is in ${sg(sun.sign, lang)}, ${oh(sun.house, lang)}${afflicters.length ? `, and the 9th house of ancestors carries ${joinList(afflicters, lang)}` : ""}. Measured separations from the Sun — Rahu ${sep(ctx.rahu)}, Ketu ${sep(ctx.ketu)}, Saturn ${sep(ctx.saturn)}. ${orbClause}`,
        `सूर्य ${sg(sun.sign, lang)} में, ${oh(sun.house, lang)} में है${afflicters.length ? `, तथा पितरों के नवम भाव में ${joinList(afflicters, lang)} स्थित है` : ""}। सूर्य से मापी गई दूरी — राहु ${sep(ctx.rahu)}, केतु ${sep(ctx.ketu)}, शनि ${sep(ctx.saturn)}। ${orbClause}`),
    };
  }
  return {
    detected: false, score: 0,
    short: t(lang,
      `The Sun is in ${sg(sun.sign, lang)}, ${oh(sun.house, lang)}, clear of Rahu, Ketu and Saturn. Pitru Dosh does not form.`,
      `सूर्य ${sg(sun.sign, lang)} में, ${oh(sun.house, lang)} में है और राहु, केतु तथा शनि से मुक्त है। पितृ दोष नहीं बनता।`),
    why: t(lang,
      `The Sun stands ${sep(ctx.rahu)} from Rahu, ${sep(ctx.ketu)} from Ketu and ${sep(ctx.saturn)} from Saturn — every gap wider than the 15° the rule requires. The 9th house holds ${ninthNames.length ? joinList(ninthNames, lang) : "no planet"}, none of them an afflicter.`,
      `सूर्य राहु से ${sep(ctx.rahu)}, केतु से ${sep(ctx.ketu)} तथा शनि से ${sep(ctx.saturn)} दूर है — प्रत्येक अंतर नियम की 15° सीमा से अधिक है। नवम भाव में ${ninthNames.length ? joinList(ninthNames, lang) : "कोई ग्रह नहीं"} है, और उनमें कोई पीड़क नहीं।`),
  };
}

function kemadrumaVerdict(ctx) {
  const { lang, moon } = ctx;
  const entry = ctx.byKey.kemadruma;
  if (!moon || !entry) return null;
  const second = (moon.house % 12) + 1;
  const twelfth = ((moon.house + 10) % 12) + 1;
  const support = ctx.planets
    .filter((p) => !["Moon", "Rahu", "Ketu"].includes(p.name) && [moon.house, second, twelfth].includes(p.house))
    .map((p) => `${pl(p.name, lang)} (${oh(p.house, lang)})`);

  if (entry.present) {
    return {
      detected: true, score: entry.score,
      short: t(lang,
        `The Moon is in ${sg(moon.sign, lang)}, ${oh(moon.house, lang)}, with no planet in ${hnum(twelfth)}, ${hnum(second)} or alongside it. The Moon stands alone.`,
        `चंद्रमा ${sg(moon.sign, lang)} में, ${oh(moon.house, lang)} में है, और भाव ${twelfth}, भाव ${second} तथा उसके साथ कोई ग्रह नहीं है। चंद्रमा अकेला है।`),
    };
  }
  return {
    detected: false, score: 0,
    short: t(lang,
      `The Moon is in ${sg(moon.sign, lang)}, ${oh(moon.house, lang)}, and is supported — Kemadruma Dosh does not form.`,
      `चंद्रमा ${sg(moon.sign, lang)} में, ${oh(moon.house, lang)} में है और सहारा प्राप्त है — केमद्रुम दोष नहीं बनता।`),
    why: t(lang,
      `The supporting houses are ${hnum(twelfth)} and ${hnum(second)} counted from the Moon, and they are occupied: ${joinList(support, lang)}. The isolation the rule describes never occurs.`,
      `चंद्रमा से सहायक भाव ${twelfth} और भाव ${second} हैं, और वे भरे हुए हैं: ${joinList(support, lang)}। नियम जिस एकाकीपन की बात करता है, वह बनता ही नहीं।`),
  };
}

// The detector (engine/astrology/detect-doshas.js) counts a conjunction when the
// two bodies share a sign OR fall within the orb — the classical sign-based
// reading. Mirrored here so the printed sentence can never contradict the
// verdict it is explaining.
const isConjunct = (a, b, orb) => Boolean(a && b && (a.sign === b.sign || angularSeparation(a.longitude, b.longitude) < orb));

// Conjunction-based doshas share one shape: one body, one or two possible
// shadow partners, one orb.
function conjunctionVerdict(ctx, { key, a, partners, orb }) {
  const { lang } = ctx;
  const entry = ctx.byKey[key];
  const A = ctx[a];
  if (!entry || !A) return null;
  const bodies = partners.map((p) => ctx[p]).filter(Boolean);
  if (!bodies.length) return null;

  const pos = (X) => t(lang, `${pl(X.name, lang)} in ${sg(X.sign, lang)} (${oh(X.house, lang)})`, `${pl(X.name, lang)} ${sg(X.sign, lang)} में (${oh(X.house, lang)})`);
  const hit = bodies.find((B) => isConjunct(A, B, orb));

  if (entry.present && hit) {
    const sepDeg = angularSeparation(A.longitude, hit.longitude);
    const sameSign = A.sign === hit.sign;
    return {
      detected: true, score: entry.score,
      short: sameSign
        ? t(lang,
          `${pos(A)} and ${pos(hit)} share the same sign, which the classical rule counts as conjunction whatever the degree gap (measured: ${deg(sepDeg)}). That is what sets the score at ${entry.score}.`,
          `${pos(A)} तथा ${pos(hit)} एक ही राशि में हैं, और शास्त्रीय नियम इसे अंशों की दूरी देखे बिना युति मानता है (मापा गया अंतर: ${deg(sepDeg)})। इसी से अंक ${entry.score} बनता है।`)
        : t(lang,
          `${pos(A)} and ${pos(hit)} stand ${deg(sepDeg)} apart — inside the ${orb}° orb the rule requires, which is what sets the score at ${entry.score}.`,
          `${pos(A)} तथा ${pos(hit)} के बीच ${deg(sepDeg)} का अंतर है — नियम की ${orb}° सीमा के भीतर, इसी से अंक ${entry.score} बनता है।`),
    };
  }

  const gaps = bodies.map((B) => t(lang,
    `${pl(A.name, lang)}–${pl(B.name, lang)} ${deg(angularSeparation(A.longitude, B.longitude))} (${sg(A.sign, lang)} / ${sg(B.sign, lang)})`,
    `${pl(A.name, lang)}–${pl(B.name, lang)} ${deg(angularSeparation(A.longitude, B.longitude))} (${sg(A.sign, lang)} / ${sg(B.sign, lang)})`));
  return {
    detected: false, score: 0,
    short: t(lang,
      `${pos(A)} is clear of ${joinList(bodies.map((B) => pl(B.name, lang)), lang, "and")} — no shared sign and no conjunction inside the ${orb}° orb, so this dosh does not form.`,
      `${pos(A)} ${joinList(bodies.map((B) => pl(B.name, lang)), lang, "और")} से मुक्त है — न एक राशि, न ${orb}° की सीमा के भीतर युति, अतः यह दोष नहीं बनता।`),
    why: t(lang,
      `The rule fires on either a shared sign or a separation under ${orb}°. Measured: ${joinList(gaps, lang)} — neither condition is met, so the combination the texts describe is not present at any strength.`,
      `यह नियम या तो एक ही राशि पर लागू होता है या ${orb}° से कम अंतर पर। माप: ${joinList(gaps, lang)} — दोनों में से कोई शर्त पूरी नहीं होती, अतः शास्त्रोक्त योग किसी भी मात्रा में उपस्थित नहीं है।`),
  };
}

function grahanVerdict(ctx) {
  const { lang, sun, moon, rahu, ketu } = ctx;
  const entry = ctx.byKey.grahan;
  if (!entry || !sun || !moon) return null;
  const sr = rahu ? angularSeparation(sun.longitude, rahu.longitude) : null;
  const sk = ketu ? angularSeparation(sun.longitude, ketu.longitude) : null;
  const mr = rahu ? angularSeparation(moon.longitude, rahu.longitude) : null;
  const mk = ketu ? angularSeparation(moon.longitude, ketu.longitude) : null;
  const table = t(lang,
    `Sun–Rahu ${deg(sr)}, Sun–Ketu ${deg(sk)}, Moon–Rahu ${deg(mr)}, Moon–Ketu ${deg(mk)}`,
    `सूर्य–राहु ${deg(sr)}, सूर्य–केतु ${deg(sk)}, चंद्र–राहु ${deg(mr)}, चंद्र–केतु ${deg(mk)}`);

  const sunHit = [rahu, ketu].find((n) => isConjunct(sun, n, 10));
  const moonHit = [rahu, ketu].find((n) => isConjunct(moon, n, 10));

  if (entry.present && (sunHit || moonHit)) {
    const parts = [];
    if (sunHit) parts.push(t(lang,
      `the Sun is eclipsed by ${pl(sunHit.name, lang)}${sun.sign === sunHit.sign ? ` (both in ${sg(sun.sign, lang)} — a shared sign counts as conjunction)` : ""}`,
      `सूर्य ${pl(sunHit.name, lang)} से ग्रस्त है${sun.sign === sunHit.sign ? ` (दोनों ${sg(sun.sign, lang)} में — एक राशि में होना युति मानी जाती है)` : ""}`));
    if (moonHit) parts.push(t(lang,
      `the Moon is eclipsed by ${pl(moonHit.name, lang)}${moon.sign === moonHit.sign ? ` (both in ${sg(moon.sign, lang)})` : ""}`,
      `चंद्रमा ${pl(moonHit.name, lang)} से ग्रस्त है${moon.sign === moonHit.sign ? ` (दोनों ${sg(moon.sign, lang)} में)` : ""}`));
    return {
      detected: true, score: entry.score,
      short: t(lang, `In your chart ${joinList(parts, lang)}. Measured: ${table}.`, `आपकी कुंडली में ${joinList(parts, lang)}। माप: ${table}।`),
    };
  }
  return {
    detected: false, score: 0,
    short: t(lang,
      `Neither luminary is eclipsed — the Sun and the Moon share no sign with Rahu or Ketu and stand outside the eclipse orb. Grahan Dosh does not form.`,
      `कोई भी प्रकाशक ग्रस्त नहीं है — सूर्य और चंद्रमा न तो राहु-केतु के साथ एक राशि में हैं, न ग्रहण की सीमा के भीतर। ग्रहण दोष नहीं बनता।`),
    why: t(lang,
      `The eclipse condition needs a luminary sharing a node's sign or within about 10° of it. Measured: ${table} — every gap is wider and no sign is shared.`,
      `ग्रहण की स्थिति के लिए प्रकाशक का किसी नोड के साथ एक राशि में या उससे लगभग 10° के भीतर होना आवश्यक है। माप: ${table} — प्रत्येक अंतर इससे अधिक है और कोई राशि साझा नहीं है।`),
  };
}

function chandraVerdict(ctx) {
  const { lang, moon, saturn, rahu, ketu, elongation } = ctx;
  if (!moon) return null;
  const satSep = saturn ? angularSeparation(moon.longitude, saturn.longitude) : null;
  const rahuSep = rahu ? angularSeparation(moon.longitude, rahu.longitude) : null;
  const ketuSep = ketu ? angularSeparation(moon.longitude, ketu.longitude) : null;
  const kshina = elongation != null && elongation < 72;
  const dusthana = [6, 8, 12].includes(moon.house);

  // Same sign-or-orb rule the detector uses for Vish yoga, so this chapter can
  // never disagree with the engine's own Moon-Saturn verdict.
  const triggers = [];
  if (isConjunct(moon, saturn, 12)) triggers.push({ key: "vish", label: t(lang, "Vish yoga (Moon with Saturn)", "विष योग (चंद्र-शनि युति)"), weight: 40 });
  if (isConjunct(moon, rahu, 10)) triggers.push({ key: "rahu", label: t(lang, "Moon with Rahu", "चंद्र-राहु युति"), weight: 35 });
  if (isConjunct(moon, ketu, 10)) triggers.push({ key: "ketu", label: t(lang, "Moon with Ketu", "चंद्र-केतु युति"), weight: 30 });
  if (kshina && dusthana) triggers.push({ key: "kshina", label: t(lang, "Kshina Moon in a dusthana", "क्षीण चंद्र दुःस्थान में"), weight: 30 });

  const strength = elongation == null ? t(lang, "unmeasured", "अमापित")
    : elongation >= 144 ? t(lang, "strong — close to full", "बलवान — पूर्णिमा के निकट")
    : elongation >= 72 ? t(lang, "moderate", "मध्यम")
    : t(lang, "weak (Kshina) — close to the Sun", "क्षीण — सूर्य के निकट");

  const measured = t(lang,
    `Moon–Saturn ${deg(satSep)} (shared sign or under 12°), Moon–Rahu ${deg(rahuSep)} and Moon–Ketu ${deg(ketuSep)} (shared sign or under 10°); the Moon is in ${sg(moon.sign, lang)}, ${elongation != null ? `${Math.round(elongation)}°` : "—"} from the Sun, in ${hnum(moon.house)}`,
    `चंद्र–शनि ${deg(satSep)} (एक राशि अथवा 12° से कम), चंद्र–राहु ${deg(rahuSep)} तथा चंद्र–केतु ${deg(ketuSep)} (एक राशि अथवा 10° से कम); चंद्रमा ${sg(moon.sign, lang)} में है, सूर्य से ${elongation != null ? `${Math.round(elongation)}°` : "—"} दूर, भाव ${moon.house} में`);

  if (triggers.length) {
    const score = Math.min(80, Math.round(25 + triggers.reduce((s, x) => s + x.weight, 0) / 2));
    return {
      detected: true, score, triggers: triggers.map((x) => x.label), strength,
      short: t(lang,
        `The Moon in ${sg(moon.sign, lang)} (${nk(moon.nakshatra, lang)}), ${oh(moon.house, lang)}, is afflicted: ${joinList(triggers.map((x) => x.label), lang)}. Lunar strength is ${strength}.`,
        `${sg(moon.sign, lang)} (${nk(moon.nakshatra, lang)}) में, ${oh(moon.house, lang)} में स्थित चंद्रमा पीड़ित है: ${joinList(triggers.map((x) => x.label), lang)}। चंद्र-बल ${strength} है।`),
      measured,
    };
  }
  return {
    detected: false, score: 0, triggers: [], strength,
    short: t(lang,
      `The Moon in ${sg(moon.sign, lang)} (${nk(moon.nakshatra, lang)}), ${oh(moon.house, lang)}, carries no affliction within orb — Chandra Dosh does not form. Lunar strength is ${strength}.`,
      `${sg(moon.sign, lang)} (${nk(moon.nakshatra, lang)}) में, ${oh(moon.house, lang)} में स्थित चंद्रमा पर सीमा के भीतर कोई पीड़ा नहीं है — चंद्र दोष नहीं बनता। चंद्र-बल ${strength} है।`),
    why: t(lang, `Measured: ${measured}. No affliction clause is satisfied.`, `माप: ${measured}। कोई पीड़ा-शर्त पूरी नहीं होती।`),
    measured,
  };
}

function sadeSatiVerdict(ctx) {
  const { lang, sadeSati, saturnTransitSign, moonSign, saturnFromMoon } = ctx;
  const entry = ctx.byKey.sade_sati;
  if (!entry || !saturnTransitSign || !moonSign) return null;
  const phase = saturnFromMoon === 12 ? t(lang, "Rising (Aroh)", "आरोह")
    : saturnFromMoon === 1 ? t(lang, "Peak (Madhya)", "मध्य")
    : saturnFromMoon === 2 ? t(lang, "Setting (Avaroh)", "अवरोह") : null;

  if (entry.present) {
    return {
      detected: true, score: entry.score,
      short: t(lang,
        `Transit Saturn is in ${sg(saturnTransitSign, lang)} — ${od(saturnFromMoon, lang)} from your natal Moon in ${sg(moonSign, lang)}. Phase: ${phase}${sadeSati?.overallProgress != null ? `, ${sadeSati.overallProgress}% through the full passage` : ""}.`,
        `गोचर का शनि ${sg(saturnTransitSign, lang)} में है — जन्म-चंद्र ${sg(moonSign, lang)} से ${od(saturnFromMoon, lang)}। चरण: ${phase}${sadeSati?.overallProgress != null ? `, सम्पूर्ण अवधि का ${sadeSati.overallProgress}% पूर्ण` : ""}।`),
    };
  }
  return {
    detected: false, score: 0,
    short: t(lang,
      `Transit Saturn is in ${sg(saturnTransitSign, lang)} — ${od(saturnFromMoon, lang)} from your natal Moon in ${sg(moonSign, lang)}. Sade Sati is not running.`,
      `गोचर का शनि ${sg(saturnTransitSign, lang)} में है — जन्म-चंद्र ${sg(moonSign, lang)} से ${od(saturnFromMoon, lang)}। साढ़े साती नहीं चल रही।`),
    why: t(lang,
      `The passage needs Saturn in the 12th, 1st or 2nd from the Moon — that is ${sg(signAtOffset(moonSign, 12), lang)}, ${sg(moonSign, lang)} or ${sg(signAtOffset(moonSign, 2), lang)} for you. Saturn is in neither.${sadeSati?.startDate ? ` The nearest window found within the five-year search runs ${sadeSati.startDate} to ${sadeSati.endDate}.` : ""}`,
      `इस अवधि के लिए शनि का चंद्रमा से 12वीं, 1वीं या 2वीं राशि में होना आवश्यक है — आपके लिए वे ${sg(signAtOffset(moonSign, 12), lang)}, ${sg(moonSign, lang)} तथा ${sg(signAtOffset(moonSign, 2), lang)} हैं। शनि इनमें से किसी में नहीं है।${sadeSati?.startDate ? ` पाँच वर्ष की खोज में निकटतम अवधि ${sadeSati.startDate} से ${sadeSati.endDate} तक मिली।` : ""}`),
  };
}

function shaniDhaiyaVerdict(ctx) {
  const { lang, saturnFromMoon: d, saturnTransitSign, moonSign } = ctx;
  if (!d || !saturnTransitSign || !moonSign) return null;
  const detected = d === 4 || d === 8;
  const kind = d === 4 ? t(lang, "Kantak Shani (4th from Moon)", "कंटक शनि (चंद्र से चतुर्थ)")
    : d === 8 ? t(lang, "Ashtama Shani (8th from Moon)", "अष्टम शनि (चंद्र से अष्टम)") : null;

  if (detected) {
    return {
      detected: true, score: d === 8 ? 60 : 45,
      short: t(lang,
        `Transit Saturn is in ${sg(saturnTransitSign, lang)} — ${od(d, lang)} from your natal Moon in ${sg(moonSign, lang)}. This is ${kind}, the two-and-a-half-year Dhaiya.`,
        `गोचर का शनि ${sg(saturnTransitSign, lang)} में है — जन्म-चंद्र ${sg(moonSign, lang)} से ${od(d, lang)}। यह ${kind} है, अर्थात् ढाई वर्ष की ढैया।`),
      house: d,
    };
  }
  return {
    detected: false, score: 0, house: d,
    short: t(lang,
      `Transit Saturn is ${od(d, lang)} from your Moon in ${sg(moonSign, lang)} — outside the 4th and the 8th, so Shani Dhaiya is not running for you now.`,
      `गोचर का शनि आपके चंद्र ${sg(moonSign, lang)} से ${od(d, lang)} है — चतुर्थ और अष्टम से बाहर, अतः इस समय शनि ढैया नहीं चल रही।`),
    why: t(lang,
      `Dhaiya needs Saturn in ${sg(signAtOffset(moonSign, 4), lang)} (4th from your Moon) or ${sg(signAtOffset(moonSign, 8), lang)} (8th). Saturn is presently in ${sg(saturnTransitSign, lang)}, so the window is closed — it is a schedule, and it will open when Saturn reaches those signs.`,
      `ढैया के लिए शनि का ${sg(signAtOffset(moonSign, 4), lang)} (चंद्र से चतुर्थ) अथवा ${sg(signAtOffset(moonSign, 8), lang)} (अष्टम) में होना आवश्यक है। इस समय शनि ${sg(saturnTransitSign, lang)} में है, अतः यह अवधि बंद है — यह एक समय-चक्र है और शनि के उन राशियों में पहुँचने पर खुलेगी।`),
  };
}

// ── Match-making koota chapters (two-chart rules) ────────────────────────────
const nakshatrasWith = (map, value) => NAKSHATRAS.filter((n) => map[n] === value);

function nadiVerdict(ctx) {
  const { lang, nadi, moonNakshatra } = ctx;
  if (!nadi || !moonNakshatra) return null;
  const NADI_HI = { Aadi: "आदि", Madhya: "मध्य", Antya: "अंत्य" };
  const label = t(lang, nadi, NADI_HI[nadi] || nadi);
  const others = ["Aadi", "Madhya", "Antya"].filter((n) => n !== nadi).map((n) => t(lang, n, NADI_HI[n]));
  const group = nakshatrasWith(NADI_MAP, nadi).map((n) => nk(n, lang));
  return {
    detected: false, score: 0, partner_risk: nakshatrasWith(NADI_MAP, nadi), nadi: label, group,
    short: t(lang,
      `Your Nadi is ${label}, taken from the Moon in ${nk(moonNakshatra, lang)}. Nadi Dosh is scored between two charts, so nothing in yours alone can form it.`,
      `आपकी नाड़ी ${label} है, जो ${nk(moonNakshatra, lang)} में स्थित चंद्रमा से निकलती है। नाड़ी दोष दो कुंडलियों के बीच गिना जाता है, अतः अकेली आपकी कुंडली से यह बन ही नहीं सकता।`),
    why: t(lang,
      `The rule needs both Moons in the same Nadi. Yours is ${label}; the dosh would arise only against a partner whose Moon also falls in ${label} Nadi — that is the nakshatra set ${joinList(group, lang)}. Against a ${joinList(others, lang, "or")} Nadi partner these 8 Guna points are scored in full.`,
      `नियम के लिए दोनों का चंद्रमा एक ही नाड़ी में होना आवश्यक है। आपकी ${label} है; दोष केवल तभी बनेगा जब जीवनसाथी का चंद्रमा भी ${label} नाड़ी में हो — अर्थात् नक्षत्र समूह ${joinList(group, lang)}। ${joinList(others, lang, "या")} नाड़ी वाले जीवनसाथी के साथ ये 8 गुण पूरे मिलते हैं।`),
  };
}

function bhakootVerdict(ctx) {
  const { lang, moonSign } = ctx;
  if (!moonSign) return null;
  const risky = [2, 12, 5, 9, 6, 8].map((o) => signAtOffset(moonSign, o));
  const lord = SignLords[moonSign];
  const friends = (NATURAL_FRIENDS[lord] || []).map((p) => pl(p, lang));
  return {
    detected: false, score: 0, partner_risk: risky,
    short: t(lang,
      `Your Moon sign is ${sg(moonSign, lang)}, ruled by ${pl(lord, lang)}. Bhakoot is a two-chart score, so it does not exist inside your own horoscope.`,
      `आपकी चंद्र-राशि ${sg(moonSign, lang)} है, स्वामी ${pl(lord, lang)}। भकूट दो कुंडलियों का मिलान है, अतः अकेली आपकी कुंडली में यह होता ही नहीं।`),
    why: t(lang,
      `The dosh would arise only if a partner's Moon fell in ${joinList(risky.map((s) => sg(s, lang)), lang, "or")} — the 2–12, 5–9 and 6–8 axes measured from ${sg(moonSign, lang)}. Every other Moon sign scores the full 7 points, and even on those axes the clause is cancelled when the two Moon-sign lords are the same planet or natural friends (${pl(lord, lang)} is friendly with ${joinList(friends, lang)}).`,
      `दोष केवल तभी बनेगा जब जीवनसाथी का चंद्रमा ${joinList(risky.map((s) => sg(s, lang)), lang, "या")} में हो — ${sg(moonSign, lang)} से 2–12, 5–9 और 6–8 की स्थिति। शेष सभी चंद्र-राशियों में पूरे 7 गुण मिलते हैं, और इन स्थितियों में भी यदि दोनों राशि-स्वामी एक ही हों या परस्पर मित्र हों तो दोष निरस्त हो जाता है (${pl(lord, lang)} के मित्र हैं ${joinList(friends, lang)})।`),
  };
}

function ganaVerdict(ctx) {
  const { lang, gana, moonNakshatra } = ctx;
  if (!gana || !moonNakshatra) return null;
  const GANA_HI = { Deva: "देव", Manushya: "मनुष्य", Rakshasa: "राक्षस" };
  const label = t(lang, gana, GANA_HI[gana] || gana);
  const RISK = {
    Deva: { risky: ["Rakshasa"], safe: ["Deva", "Manushya"] },
    Manushya: { risky: ["Rakshasa"], safe: ["Deva", "Manushya"] },
    Rakshasa: { risky: ["Deva", "Manushya"], safe: ["Rakshasa"] },
  }[gana] || { risky: [], safe: [] };
  const loc = (arr) => arr.map((g) => t(lang, g, GANA_HI[g]));
  const temperament = {
    Deva: { en: "gentle, rule-following and quick to concede", hi: "सौम्य, नियम-पालक और शीघ्र झुक जाने वाला" },
    Manushya: { en: "balanced — practical and reciprocal, neither yielding nor forceful", hi: "संतुलित — व्यावहारिक और पारस्परिक, न अति विनम्र न अति आग्रही" },
    Rakshasa: { en: "intense, self-directed and slow to concede a point", hi: "तीव्र, स्वनिर्देशित और अपनी बात पर टिका रहने वाला" },
  }[gana];
  return {
    detected: false, score: 0, partner_risk: RISK.risky,
    short: t(lang,
      `Your Gana is ${label}, read from the Moon in ${nk(moonNakshatra, lang)} — a temperament classically described as ${temperament.en}.`,
      `आपका गण ${label} है, जो ${nk(moonNakshatra, lang)} में स्थित चंद्रमा से निकलता है — शास्त्रों में इस स्वभाव को ${temperament.hi} कहा गया है।`),
    why: t(lang,
      `Gana Dosh needs two nakshatras to compare, so one horoscope cannot carry it. Yours is ${label}, so the dosh would be scored only against a ${joinList(loc(RISK.risky), lang, "or")} Gana partner; a ${joinList(loc(RISK.safe), lang, "or")} Gana partner scores these 6 points in full.`,
      `गण दोष के लिए दो नक्षत्रों की तुलना आवश्यक है, अतः एक कुंडली में यह बन नहीं सकता। आपका ${label} है, अतः दोष केवल ${joinList(loc(RISK.risky), lang, "या")} गण के जीवनसाथी के साथ गिना जाएगा; ${joinList(loc(RISK.safe), lang, "या")} गण के साथ ये 6 गुण पूरे मिलते हैं।`),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Assemble the 14 chapters.
// ─────────────────────────────────────────────────────────────────────────────
function buildChapters(ctx) {
  const lang = ctx.lang;
  const DT = detailsTable(lang);
  const chapters = [];

  const verdicts = {
    mangal_dosh: manglikVerdict(ctx),
    kaal_sarp_dosh: kaalSarpVerdict(ctx),
    pitru_dosh: pitruVerdict(ctx),
    nadi_dosh: nadiVerdict(ctx),
    bhakoot_dosh: bhakootVerdict(ctx),
    gana_dosh: ganaVerdict(ctx),
    kemadruma_dosh: kemadrumaVerdict(ctx),
    grahan_dosh: grahanVerdict(ctx),
    guru_chandal_dosh: conjunctionVerdict(ctx, { key: "guru_chandal", a: "jupiter", partners: ["rahu", "ketu"], orb: 15 }),
    angarak_dosh: conjunctionVerdict(ctx, { key: "angarak", a: "mars", partners: ["rahu"], orb: 12 }),
    shrapit_dosh: conjunctionVerdict(ctx, { key: "shrapit", a: "saturn", partners: ["rahu"], orb: 12 }),
    sade_sati: sadeSatiVerdict(ctx),
    shani_dhaiya: shaniDhaiyaVerdict(ctx),
    chandra_dosh: chandraVerdict(ctx),
  };

  for (const { id, source, page, pages } of CHAPTER_ORDER) {
    const def = canonical(id);
    const v = verdicts[id];
    const details = source ? DT[source] || {} : null;
    const detected = Boolean(v?.detected);
    const score = detected ? (v.score || 0) : 0;

    const verdict = v;

    const chapter = {
      id,
      name: nameFor(id, lang),
      detected,
      severity: score,
      severity_label: severityLabelFromNumber(score),
      planet: plCompound(def.planet || "—", lang),
      planet_en: def.planet || "—",
      icon: def.icon || "default",
      affects: affectsFor(id, lang),
      rule: ruleFor(id, lang),
      short_description: verdict?.short || "",
      what_does_this_mean: "",
      what_to_be_aware_of: "",
      remedies: [],
      remedy_puja_name: null,
      page,
      pages,
    };

    if (!detected) chapter.why_not = verdict?.why || "";

    if (details) {
      chapter.what_does_this_mean = detected
        ? (details.significance || details.intro || "")
        : (details.whenAbsent || details.intro || "");
      chapter.what_to_be_aware_of = detected
        ? (details.whenPresent || (details.effects || []).slice(0, 2).join(" "))
        : t(lang,
          `This is what the flag would have meant if it had formed: ${details.intro || ""} It did not, so no part of it applies to you — it is printed so you can recognise the claim if it is made about your chart.`,
          `यदि यह दोष बनता तो उसका अर्थ यह होता: ${details.intro || ""} किन्तु वह बना नहीं, अतः इसका कोई अंश आप पर लागू नहीं होता — यह केवल इसलिए छापा गया है कि यदि कोई आपकी कुंडली पर यह दावा करे तो आप पहचान सकें।`);
      if (detected) {
        chapter.remedies = remedyStrings(details);
        chapter.remedy_puja_name = remedyPujaName(details, chapter.name, lang);
      }
    }

    // Chapters the detector does not back — their prose is written here.
    if (id === "nadi_dosh" || id === "bhakoot_dosh" || id === "gana_dosh") {
      chapter.requires_partner_chart = true;
      chapter.partner_risk = verdict?.partner_risk || [];
      chapter.what_does_this_mean = kootaMeaning(id, ctx, verdict);
      chapter.what_to_be_aware_of = kootaCaution(id, ctx, verdict);
    }
    if (id === "shani_dhaiya") {
      const built = dhaiyaProse(ctx, verdict);
      chapter.what_does_this_mean = built.means;
      chapter.what_to_be_aware_of = built.aware;
      chapter.remedies = detected ? built.remedies : [];
      chapter.remedy_puja_name = detected ? t(lang, "Shani Shanti Puja", "शनि शान्ति पूजा") : null;
    }
    if (id === "chandra_dosh") {
      const built = chandraProse(ctx, verdict);
      chapter.what_does_this_mean = built.means;
      chapter.what_to_be_aware_of = built.aware;
      chapter.remedies = detected ? built.remedies : [];
      chapter.remedy_puja_name = detected ? t(lang, "Chandra Shanti Puja", "चन्द्र शान्ति पूजा") : null;
      chapter.triggers = verdict?.triggers || [];
    }

    chapters.push(chapter);
  }

  return chapters;
}

function kootaMeaning(id, ctx, v) {
  const lang = ctx.lang;
  if (id === "nadi_dosh") {
    return t(lang,
      `Nadi is the constitutional layer of Ashtakoot matching and carries the largest single block of points — 8 of 36. It is computed from the birth nakshatra alone, which is why it can be stated for you now and settled only when a second chart exists.`,
      `नाड़ी अष्टकूट मिलान की प्राकृतिक-गठन वाली परत है और इसमें सर्वाधिक 8 गुण होते हैं। यह केवल जन्म-नक्षत्र से निकलती है, इसीलिए आपकी नाड़ी अभी बताई जा सकती है, किन्तु दोष का निर्णय दूसरी कुंडली आने पर ही होगा।`);
  }
  if (id === "bhakoot_dosh") {
    return t(lang,
      `Bhakoot judges household rhythm between two people — money, health and daily harmony. The 2–12 axis is read as expenditure against savings, the 5–9 axis as differing values around children and fortune, and the 6–8 axis as friction and health.`,
      `भकूट दो व्यक्तियों के गृहस्थ-जीवन की लय देखता है — धन, स्वास्थ्य और दैनिक सामंजस्य। 2–12 की स्थिति व्यय बनाम संचय, 5–9 संतान और भाग्य से जुड़े भिन्न मूल्य, तथा 6–8 टकराव और स्वास्थ्य की सूचक मानी जाती है।`);
  }
  return t(lang,
    `Gana carries 6 of the 36 Guna points and speaks to how two people argue and recover. It is a temperament reading, not a moral one — Rakshasa Gana does not mean a bad person, it describes force of will.`,
    `गण के 36 में से 6 गुण होते हैं और यह बताता है कि दो व्यक्ति विवाद कैसे करते और कैसे सँभलते हैं। यह स्वभाव का आकलन है, चरित्र का नहीं — राक्षस गण का अर्थ बुरा व्यक्ति नहीं, केवल इच्छाशक्ति की तीव्रता है।`);
}

function kootaCaution(id, ctx, v) {
  const lang = ctx.lang;
  if (id === "nadi_dosh") {
    return t(lang,
      `Nadi is over-used as a reason to reject an otherwise sound match. Classical practice accepts cancellations — the same nakshatra with different padas, the same Moon sign with different nakshatras, or identical Rashi lords. Ask which cancellation applies before treating a same-Nadi match as closed.`,
      `किसी अन्यथा उत्तम संबंध को अस्वीकार करने के लिए नाड़ी का उपयोग आवश्यकता से अधिक होता है। शास्त्र निवारण स्वीकारते हैं — एक ही नक्षत्र किन्तु भिन्न चरण, एक ही चंद्र-राशि किन्तु भिन्न नक्षत्र, अथवा दोनों की राशि का स्वामी एक। समान नाड़ी वाले संबंध को अंतिम मानने से पहले पूछें कि कौन-सा निवारण लागू है।`);
  }
  if (id === "bhakoot_dosh") {
    return t(lang,
      `Bhakoot is quoted far more often than it is checked against its own cancellation clauses. Before accepting it as a verdict, confirm the two Moon-sign lords and the Nadi and Gana scores — any one of them can cancel it outright.`,
      `भकूट का उल्लेख जितनी बार होता है, उसके निवारण नियमों की जाँच उतनी बार नहीं होती। इसे निर्णय मानने से पूर्व दोनों की राशि के स्वामी तथा नाड़ी और गण के अंक अवश्य देखें — इनमें से कोई एक भी इसे पूर्णतः निरस्त कर सकता है।`);
  }
  return t(lang,
    `Gana Dosh is treated as cancelled when both Moon signs are the same, or when the Rashi lords are friends and the Bhakoot score is clean. Read a Gana mismatch as a note on communication style, not as grounds to end a match.`,
    `गण दोष तब निरस्त माना जाता है जब दोनों की चंद्र-राशि एक हो, अथवा राशि-स्वामी मित्र हों और भकूट शुद्ध हो। गण का अंतर संवाद-शैली की टिप्पणी है, संबंध समाप्त करने का कारण नहीं।`);
}

function dhaiyaProse(ctx, v) {
  const lang = ctx.lang;
  const d = v?.house;
  if (v?.detected) {
    return {
      means: d === 4
        ? t(lang,
          "Kantak Shani presses on 4th-house matters: home, property, the mother's health, vehicles and the sense of a settled base. Work tends to feel as though it is being done from an unsettled footing rather than being blocked outright.",
          "कंटक शनि चतुर्थ भाव के विषयों पर दबाव डालता है: गृह, संपत्ति, माता का स्वास्थ्य, वाहन और स्थायित्व का भाव। काम रुकता नहीं, किन्तु अस्थिर आधार पर होता प्रतीत होता है।")
        : t(lang,
          "Ashtama Shani presses on 8th-house matters: sudden change, joint finances, insurance and health that needs investigation rather than emergency. It rewards conservative decisions and punishes leverage.",
          "अष्टम शनि अष्टम भाव के विषयों पर दबाव डालता है: आकस्मिक परिवर्तन, संयुक्त वित्त, बीमा तथा वह स्वास्थ्य जिसे आपात नहीं, जाँच चाहिए। यह सतर्क निर्णयों को फल देता है और अत्यधिक उधारी को दंडित करता है।"),
      aware: t(lang,
        "Dhaiya is often mistaken for Sade Sati and sold at the same intensity. It is shorter, narrower, and does not sit on your Moon. Keep documents current, avoid new debt against property, and take routine health checks on schedule rather than reactively.",
        "ढैया को प्रायः साढ़े साती समझकर उसी तीव्रता से बेचा जाता है। यह छोटी है, सीमित है, और आपके चंद्रमा पर नहीं बैठती। दस्तावेज़ अद्यतन रखें, संपत्ति पर नया ऋण न लें, और स्वास्थ्य जाँच नियत समय पर कराएँ।"),
      remedies: [
        t(lang, `Saturday discipline: offer mustard oil at a Shani or Hanuman temple and keep the day free of hurried commitments.`, `शनिवार का अनुशासन: शनि अथवा हनुमान मंदिर में सरसों का तेल अर्पित करें और उस दिन जल्दबाज़ी में कोई वचन न दें।`),
        t(lang, `Shani mantra: chant "${mantraFor("Saturn", "en")}" 108 times on Saturdays for the length of the transit.`, `शनि मंत्र: गोचर की पूरी अवधि तक प्रत्येक शनिवार "${mantraFor("Saturn", "hi")}" का 108 बार जप करें।`),
        t(lang, "Donation: give black sesame, iron or a warm blanket to a labourer or an elderly person once a month.", "दान: प्रति माह किसी श्रमिक अथवा वृद्धजन को काले तिल, लोहा अथवा कम्बल दान करें।"),
        t(lang, "Hanuman Chalisa on Tuesdays and Saturdays — the classical shield during any Saturn transit.", "मंगलवार और शनिवार को हनुमान चालीसा — किसी भी शनि-गोचर में शास्त्रोक्त कवच।"),
        d === 4
          ? t(lang, "Home care: repair what is broken in the house rather than replacing it, and keep the mother's health checks current.", "गृह-देखभाल: घर में जो टूटा है उसे बदलने के बजाय ठीक कराएँ, और माता की स्वास्थ्य जाँच नियमित रखें।")
          : t(lang, "Paperwork: renew insurance, nominations and property papers early in the transit rather than late.", "काग़ज़ात: बीमा, नामांकन और संपत्ति के दस्तावेज़ गोचर के आरंभ में ही नवीनीकृत करा लें।"),
      ],
    };
  }
  return {
    means: t(lang,
      "Dhaiya and Sade Sati are the two Saturn transit windows sold hardest. Neither is open on the Dhaiya axis for you at present, so advice framed as 'Saturn's small panoti' does not currently describe your chart.",
      "ढैया और साढ़े साती — शनि के ये दो गोचर सर्वाधिक बेचे जाते हैं। इस समय आपके लिए ढैया की अवधि खुली नहीं है, अतः 'शनि की छोटी पनोती' कहकर दी गई सलाह आपकी वर्तमान स्थिति का वर्णन नहीं करती।"),
    aware: t(lang,
      "Saturn changes sign roughly every two and a half years, so this window will open in its own time — it is a schedule, not a verdict. Note the two signs named above and re-read this page when Saturn reaches them.",
      "शनि लगभग ढाई वर्ष में राशि बदलता है, अतः यह अवधि अपने समय पर खुलेगी — यह समय-चक्र है, कोई निर्णय नहीं। ऊपर बताई दोनों राशियाँ ध्यान रखें और शनि के वहाँ पहुँचने पर यह पृष्ठ पुनः पढ़ें।"),
    remedies: [],
  };
}

function chandraProse(ctx, v) {
  const lang = ctx.lang;
  if (v?.detected) {
    return {
      means: t(lang,
        `The Moon governs mood, sleep and the speed at which you recover from a setback. An afflicted Moon does not mean illness — it means the emotional weather runs heavier than average and responds to routine rather than to willpower. Measured here: ${v.measured}.`,
        `चंद्रमा मन, निद्रा और आघात से उबरने की गति का स्वामी है। पीड़ित चंद्रमा का अर्थ रोग नहीं — इसका अर्थ है कि भावनात्मक स्थिति औसत से भारी रहती है और वह इच्छाशक्ति से नहीं, दिनचर्या से सँभलती है। माप: ${v.measured}।`),
      aware: t(lang,
        "Sleep slips first — it is the earliest signal that this placement is under load. Avoid irreversible decisions in the three days around a new moon, and treat a fixed sleep window as the primary remedy rather than an afterthought.",
        "सबसे पहले निद्रा बिगड़ती है — यही इस स्थिति पर भार का प्रथम संकेत है। अमावस्या के आस-पास के तीन दिनों में अपरिवर्तनीय निर्णय न लें, और निश्चित समय पर सोने को गौण नहीं, प्रमुख उपाय मानें।"),
      remedies: [
        t(lang, `Chandra Beej mantra: chant "${mantraFor("Moon", "en")}" 108 times on Monday mornings.`, `चन्द्र बीज मंत्र: सोमवार प्रातः "${mantraFor("Moon", "hi")}" का 108 बार जप करें।`),
        t(lang, "Monday abhishek: offer raw milk and white rice at a Shiva temple — the classical route to a settled Moon.", "सोमवार अभिषेक: शिव मंदिर में कच्चा दूध और अक्षत अर्पित करें — शांत चंद्रमा का शास्त्रोक्त मार्ग।"),
        t(lang, "Protect sleep: fix a sleep window and hold it for forty days; the Moon answers to routine faster than to any other remedy.", "निद्रा की रक्षा: सोने का समय निश्चित करें और चालीस दिन तक उसका पालन करें; चंद्रमा किसी भी उपाय से अधिक शीघ्र दिनचर्या से प्रसन्न होता है।"),
        t(lang, "Donate white: give rice, milk or white cloth on a Monday, especially in the waning fortnight.", "श्वेत दान: सोमवार को चावल, दूध अथवा श्वेत वस्त्र दान करें, विशेषकर कृष्ण पक्ष में।"),
        t(lang, "Water and evening habits: keep hydration steady and screens away after dusk — the Moon rules the body's water and its rhythm.", "जल और सांध्य दिनचर्या: पर्याप्त जल लें और संध्या के बाद स्क्रीन से दूरी रखें — चंद्रमा शरीर के जल और लय का स्वामी है।"),
      ],
    };
  }
  return {
    means: t(lang,
      "An unafflicted Moon means the baseline emotional recovery is intact: sleep, mood and appetite return to normal on their own after a hard stretch. This is one of the quietly valuable things a chart can say, and it needs no remedy to maintain.",
      "अपीड़ित चंद्रमा का अर्थ है कि भावनात्मक पुनर्प्राप्ति की क्षमता सुरक्षित है: कठिन समय के बाद निद्रा, मन और भूख स्वतः सामान्य हो जाते हैं। यह कुंडली की चुपचाप मूल्यवान बातों में से एक है और इसे बनाए रखने के लिए किसी उपाय की आवश्यकता नहीं।"),
    aware: t(lang,
      "The Moon changes sign every two and a half days, so short mood swings are ordinary transit weather and not a chart defect. The one habit worth keeping regardless is a regular sleep window.",
      "चंद्रमा हर ढाई दिन में राशि बदलता है, अतः मनःस्थिति के छोटे उतार-चढ़ाव सामान्य गोचर हैं, कुंडली का दोष नहीं। फिर भी एक आदत सदैव उपयोगी है — सोने का नियत समय।"),
    remedies: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Secondary patterns the engine also checks but which own no page.
// ─────────────────────────────────────────────────────────────────────────────
const MINOR_KEYS = ["paap_kartari", "shakat", "gandmool", "daridra"];

function buildMinorPatterns(ctx) {
  const lang = ctx.lang;
  const DT = detailsTable(lang);
  const out = [];
  for (const key of MINOR_KEYS) {
    const entry = ctx.byKey[key];
    if (!entry) continue;
    const id = `${key}_dosh`;
    const details = DT[key] || {};
    const detected = Boolean(entry.present);
    out.push({
      id, key, name: nameFor(id, lang), detected, chapter: false,
      severity: detected ? entry.score : 0,
      severity_label: severityLabelFromNumber(detected ? entry.score : 0),
      planet: plCompound(canonical(id).planet || "—", lang),
      // The detector already computed the chart-specific reason ("Moon is in
      // the 12th from Jupiter — Shakat position"), and this was discarding it
      // for a generic "present as a secondary pattern (score 22)". Under the
      // heading "why this applies to your chart" that answered nothing — and
      // when a detected minor pattern gets promoted to a full page, it was the
      // only justification the reader ever saw. Lead with the measured reason.
      short_description: (() => {
        const measured = lang === "en" ? entry.reason : (entry.reason_hi || entry.reason);
        const generic = detected
          ? t(lang, `${nameFor(id, lang)} is present as a secondary pattern (score ${entry.score}).`, `${nameFor(id, lang)} एक गौण योग के रूप में उपस्थित है (अंक ${entry.score})।`)
          : t(lang, `${nameFor(id, lang)} was checked and does not form in this chart.`, `${nameFor(id, lang)} की जाँच की गई और यह इस कुंडली में नहीं बनता।`);
        return measured ? `${measured} ${generic}` : generic;
      })(),
      what_does_this_mean: details.significance || details.intro || "",
      remedies: detected ? remedyStrings(details) : [],
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancellations — the classical clauses that switch a dosh off, each emitted
// with applies:true/false (or null for a clause that needs a partner's chart)
// so the reader sees which were tested, not only which fired.
// ─────────────────────────────────────────────────────────────────────────────
function buildCancellations(ctx, chapters) {
  const lang = ctx.lang;
  const out = [];
  const presentNames = new Set(chapters.filter((c) => c.detected).map((c) => c.name));
  // clauseKey ties a clause back to analyzeManglikCancellations' own key, so the
  // PDF (which renders that structure directly) can reuse the localized detail.
  const add = (doshId, rule, applies, detail, clauseKey = null) => {
    const dosh = nameFor(doshId, lang);
    out.push({ dosh, dosh_id: doshId, rule, applies, detail, clause_key: clauseKey, dosh_present: presentNames.has(dosh) });
  };

  const { mars, jupiter, moon, saturn, rahu, ketu, sun } = ctx;

  if (mars) {
    const inOwn = OWN_SIGNS.Mars.includes(mars.sign);
    add("mangal_dosh",
      t(lang, "Mars in his own sign (Aries or Scorpio) neutralises Mangal Dosh entirely.", "मंगल का स्वराशि (मेष अथवा वृश्चिक) में होना मंगल दोष को पूर्णतः निरस्त कर देता है।"),
      inOwn,
      inOwn ? t(lang, `Mars is in ${sg(mars.sign, lang)}, his own sign — the full cancellation applies.`, `मंगल ${sg(mars.sign, lang)} में, अर्थात् स्वराशि में है — पूर्ण निवारण लागू है।`)
        : t(lang, `Mars is in ${sg(mars.sign, lang)}, which is neither Aries nor Scorpio.`, `मंगल ${sg(mars.sign, lang)} में है, जो न मेष है न वृश्चिक।`), "own-sign");

    const exalted = mars.sign === EXALTATION.Mars;
    add("mangal_dosh",
      t(lang, "Mars exalted in Capricorn dissolves the Manglik harm — the energy expresses as discipline rather than friction.", "मकर में उच्च का मंगल मांगलिक हानि को समाप्त कर देता है — ऊर्जा टकराव के बजाय अनुशासन बनकर प्रकट होती है।"),
      exalted,
      exalted ? t(lang, "Mars is exalted in Capricorn.", "मंगल मकर में उच्च का है।")
        : t(lang, `Mars is in ${sg(mars.sign, lang)}, not his exaltation sign.`, `मंगल ${sg(mars.sign, lang)} में है, उच्च राशि में नहीं।`), "exalted");

    const jupConj = Boolean(jupiter && jupiter.house === mars.house);
    add("mangal_dosh",
      t(lang, "Mars conjunct Jupiter (Guru-Mangal yoga) substantially reduces the dosha — Jupiter's wisdom tempers Mars's heat.", "मंगल-गुरु युति (गुरु-मंगल योग) दोष को पर्याप्त घटा देती है — गुरु का विवेक मंगल की उष्णता को संतुलित करता है।"),
      jupConj,
      jupConj ? t(lang, `Jupiter and Mars share ${hnum(mars.house)}.`, `गुरु और मंगल दोनों भाव ${mars.house} में हैं।`)
        : t(lang, `Jupiter is in ${jupiter ? hnum(jupiter.house) : "—"} and Mars in ${hnum(mars.house)} — not together.`, `गुरु ${jupiter ? `भाव ${jupiter.house}` : "—"} में और मंगल भाव ${mars.house} में है — साथ नहीं।`), "jupiter-conjunct");

    const jAsp = jupiterAspects(jupiter, mars.house);
    add("mangal_dosh",
      t(lang, "Jupiter's 5th, 7th or 9th aspect landing on Mars cushions the Mars house and softens marital friction.", "गुरु की पंचम, सप्तम अथवा नवम दृष्टि यदि मंगल पर पड़े तो वह मंगल के भाव को सुरक्षा देती है और वैवाहिक टकराव घटाती है।"),
      Boolean(jAsp),
      jAsp ? t(lang, `Jupiter throws its ${ordinal(jAsp)} aspect onto Mars.`, `गुरु की ${jAsp}वीं दृष्टि मंगल पर पड़ रही है।`)
        : t(lang, `Jupiter does not aspect Mars — the house gap is ${jupiter ? ordinal(aspectDistance(jupiter.house, mars.house)) : "—"}, outside the 5th, 7th and 9th.`, `गुरु की दृष्टि मंगल पर नहीं है — भावों का अंतर ${jupiter ? `${aspectDistance(jupiter.house, mars.house)}` : "—"} है, जो पंचम, सप्तम और नवम से बाहर है।`), "jupiter-aspect");

    const moonConj = Boolean(moon && moon.house === mars.house);
    add("mangal_dosh",
      t(lang, "Mars conjunct the Moon is accepted by several authorities as a cancellation — the Moon draws the heat out of Mars.", "कई आचार्य मंगल-चंद्र युति को निवारण मानते हैं — चंद्रमा मंगल की उष्णता खींच लेता है।"),
      moonConj,
      moonConj ? t(lang, `The Moon shares ${hnum(mars.house)} with Mars.`, `चंद्रमा मंगल के साथ भाव ${mars.house} में है।`)
        : t(lang, `The Moon is in ${moon ? hnum(moon.house) : "—"}, away from Mars.`, `चंद्रमा ${moon ? `भाव ${moon.house}` : "—"} में है, मंगल से दूर।`), "moon-conjunct");

    const friendly7 = mars.house === 7 && ["Cancer", "Leo", "Sagittarius", "Pisces"].includes(mars.sign);
    add("mangal_dosh",
      t(lang, "Mars in the 7th house in Cancer, Leo, Sagittarius or Pisces is held cancelled — the sign tempers Mars's marital aggression.", "सप्तम भाव में मंगल यदि कर्क, सिंह, धनु अथवा मीन में हो तो दोष निरस्त माना जाता है — राशि मंगल की वैवाहिक उग्रता को शांत कर देती है।"),
      friendly7,
      friendly7 ? t(lang, `Mars is in the 7th in ${sg(mars.sign, lang)}, one of the tempering signs.`, `मंगल सप्तम भाव में ${sg(mars.sign, lang)} में है, जो शमनकारी राशियों में से एक है।`)
        : t(lang, `Mars is in ${hnum(mars.house)} in ${sg(mars.sign, lang)}; this clause needs the 7th house specifically.`, `मंगल भाव ${mars.house} में, ${sg(mars.sign, lang)} में है; यह नियम विशेष रूप से सप्तम भाव के लिए है।`), "7th-friendly-sign");

    add("mangal_dosh",
      t(lang, "A retrograde Mars expresses inwardly; several authorities hold that retrogression reduces the manifest Manglik effect.", "वक्री मंगल अंतर्मुखी होकर फल देता है; कई आचार्यों के अनुसार वक्रत्व प्रकट मांगलिक प्रभाव को घटाता है।"),
      Boolean(mars.retrograde),
      mars.retrograde ? t(lang, "Mars is retrograde at birth.", "जन्म के समय मंगल वक्री है।") : t(lang, "Mars is in direct motion at birth.", "जन्म के समय मंगल मार्गी है।"), "retrograde");

    add("mangal_dosh",
      t(lang, "Matching with a partner who is also Manglik cancels the dosha — the two Mars energies neutralise.", "किसी अन्य मांगलिक से विवाह दोष को निरस्त कर देता है — दोनों की मंगल-ऊर्जा परस्पर संतुलित हो जाती है।"),
      null,
      t(lang, "This clause depends on the partner's chart and cannot be settled from a single horoscope. It is listed so you know the option exists.", "यह नियम जीवनसाथी की कुंडली पर निर्भर है और अकेली कुंडली से तय नहीं हो सकता। इसे इसलिए दिया गया है कि यह विकल्प आपको ज्ञात रहे।"));
  }

  if (rahu && ketu) {
    const nearest = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
      .map((n) => ctx.P(n)).filter(Boolean)
      .reduce((m, p) => Math.min(m, angularSeparation(p.longitude, rahu.longitude), angularSeparation(p.longitude, ketu.longitude)), 999);
    const ksPresent = Boolean(ctx.byKey.kaal_sarp?.present);
    add("kaal_sarp_dosh",
      t(lang, "A single planet falling outside the Rahu–Ketu arc breaks the hemming and cancels Kaal Sarp entirely.", "राहु–केतु के अर्धवृत्त से बाहर एक भी ग्रह घेरा तोड़ देता है और काल सर्प पूर्णतः निरस्त हो जाता है।"),
      !ksPresent,
      ksPresent ? t(lang, "Every classical planet is hemmed on one side of the axis — nothing breaks the arc.", "सातों ग्रह अक्ष के एक ही ओर घिरे हैं — कोई भी घेरा नहीं तोड़ता।")
        : t(lang, "At least one planet sits on the far side of the nodal axis, so the serpent never closes.", "कम से कम एक ग्रह अक्ष की दूसरी ओर है, अतः सर्प का घेरा बनता ही नहीं।"));
    add("kaal_sarp_dosh",
      t(lang, "A planet within about 6° of either node makes the yoga leak — a partial Kaal Sarp, materially milder than a sealed one.", "किसी नोड से लगभग 6° के भीतर स्थित ग्रह योग को रिसाव-युक्त बना देता है — यह आंशिक काल सर्प है, पूर्ण की तुलना में कहीं हल्का।"),
      Boolean(ksPresent && nearest < 6),
      t(lang, `The nearest planet to either node is ${deg(nearest)} away${ksPresent ? "." : ", though with the yoga unformed there is nothing here for the clause to soften."}`,
        `किसी नोड के निकटतम ग्रह की दूरी ${deg(nearest)} है${ksPresent ? "।" : ", किन्तु योग बना ही नहीं, अतः इस नियम के लिए यहाँ कुछ शेष नहीं।"}`));
  }

  if (sun) {
    const jAspSun = jupiterAspects(jupiter, sun.house);
    add("pitru_dosh",
      t(lang, "Jupiter aspecting the Sun or the 9th house repairs the ancestral line and softens Pitru Dosh.", "गुरु की दृष्टि सूर्य अथवा नवम भाव पर हो तो वह पितृ-परंपरा को सुधारती है और पितृ दोष को हल्का करती है।"),
      Boolean(jAspSun),
      jAspSun ? t(lang, `Jupiter's ${ordinal(jAspSun)} aspect falls on the Sun.`, `गुरु की ${jAspSun}वीं दृष्टि सूर्य पर पड़ रही है।`)
        : t(lang, "Jupiter does not aspect the Sun in this chart.", "इस कुंडली में गुरु की दृष्टि सूर्य पर नहीं है।"));
    const ninthLord = ctx.houses.find((h) => h.house === 9)?.lord;
    const lordPlanet = ninthLord ? ctx.P(ninthLord) : null;
    const strong = Boolean(lordPlanet && [1, 4, 5, 7, 9, 10].includes(lordPlanet.house));
    add("pitru_dosh",
      t(lang, "The 9th lord placed in a kendra or trikona keeps the ancestral current strong despite an afflicted Sun.", "नवमेश यदि केंद्र या त्रिकोण में हो तो सूर्य के पीड़ित होने पर भी पितृ-धारा बलवान बनी रहती है।"),
      strong,
      lordPlanet ? t(lang, `The 9th lord ${pl(ninthLord, lang)} sits in ${hnum(lordPlanet.house)}.`, `नवमेश ${pl(ninthLord, lang)} भाव ${lordPlanet.house} में है।`)
        : t(lang, "The 9th lord could not be located among the computed planets.", "गणना किए गए ग्रहों में नवमेश की स्थिति नहीं मिली।"));
  }

  if (moon) {
    const kendraPlanets = ctx.planets.filter((p) => !["Moon", "Rahu", "Ketu", "Sun"].includes(p.name) && [1, 4, 7, 10].includes(p.house));
    add("kemadruma_dosh",
      t(lang, "A planet other than the Sun in a kendra (1, 4, 7, 10) from the ascendant cancels Kemadruma.", "सूर्य के अतिरिक्त कोई ग्रह लग्न से केंद्र (1, 4, 7, 10) में हो तो केमद्रुम निरस्त हो जाता है।"),
      kendraPlanets.length > 0,
      kendraPlanets.length
        ? t(lang, `Kendra houses are occupied by ${joinList(kendraPlanets.map((p) => pl(p.name, lang)), lang)}.`, `केंद्र भावों में ${joinList(kendraPlanets.map((p) => pl(p.name, lang)), lang)} स्थित हैं।`)
        : t(lang, "No supporting planet occupies a kendra from the ascendant.", "लग्न से किसी केंद्र में कोई सहायक ग्रह नहीं है।"));
    add("kemadruma_dosh",
      t(lang, "The Moon itself standing in a kendra from the ascendant cancels the isolation.", "चंद्रमा स्वयं लग्न से केंद्र में हो तो एकाकीपन निरस्त हो जाता है।"),
      [1, 4, 7, 10].includes(moon.house),
      t(lang, `The Moon is in ${hnum(moon.house)} from the ascendant.`, `चंद्रमा लग्न से भाव ${moon.house} में है।`));
    const jAspMoon = jupiterAspects(jupiter, moon.house);
    add("kemadruma_dosh",
      t(lang, "Jupiter aspecting the Moon supplies the support the yoga says is missing.", "गुरु की दृष्टि चंद्रमा पर हो तो वह सहारा मिल जाता है जिसकी कमी यह योग बताता है।"),
      Boolean(jAspMoon),
      jAspMoon ? t(lang, `Jupiter's ${ordinal(jAspMoon)} aspect falls on the Moon.`, `गुरु की ${jAspMoon}वीं दृष्टि चंद्रमा पर पड़ रही है।`)
        : t(lang, "Jupiter does not aspect the Moon here.", "यहाँ गुरु की दृष्टि चंद्रमा पर नहीं है।"));
  }

  if (jupiter) {
    const strongJup = OWN_SIGNS.Jupiter.includes(jupiter.sign) || jupiter.sign === EXALTATION.Jupiter;
    add("guru_chandal_dosh",
      t(lang, "Jupiter in his own sign (Sagittarius, Pisces) or exalted in Cancer holds his ground against Rahu and greatly reduces the dosha.", "गुरु स्वराशि (धनु, मीन) अथवा कर्क में उच्च का हो तो वह राहु के सामने टिका रहता है और दोष बहुत घट जाता है।"),
      strongJup,
      t(lang, `Jupiter is in ${sg(jupiter.sign, lang)}${strongJup ? " — dignified, so the clause applies." : " — neither own sign nor exaltation."}`,
        `गुरु ${sg(jupiter.sign, lang)} में है${strongJup ? " — बलवान, अतः नियम लागू है।" : " — न स्वराशि, न उच्च।"}`));
  }
  if (mars) {
    const marsStrong = OWN_SIGNS.Mars.includes(mars.sign) || mars.sign === EXALTATION.Mars;
    add("angarak_dosh",
      t(lang, "Mars in his own sign or exalted converts the Angarak heat into disciplined drive rather than accident-prone volatility.", "मंगल स्वराशि अथवा उच्च का हो तो अंगारक की उष्णता दुर्घटना-प्रवृत्ति के बजाय अनुशासित ऊर्जा बन जाती है।"),
      marsStrong,
      t(lang, `Mars is in ${sg(mars.sign, lang)}${marsStrong ? ", a sign of strength for him." : ", where he holds no special dignity."}`,
        `मंगल ${sg(mars.sign, lang)} में है${marsStrong ? ", जो उसके बल की राशि है।" : ", जहाँ उसे कोई विशेष बल प्राप्त नहीं।"}`));
  }
  if (saturn) {
    const satStrong = OWN_SIGNS.Saturn.includes(saturn.sign) || saturn.sign === EXALTATION.Saturn;
    add("shrapit_dosh",
      t(lang, "Saturn in Capricorn, Aquarius or exalted in Libra carries the karmic load without breaking — the Shrapit reading is materially lighter.", "शनि मकर, कुम्भ अथवा तुला में उच्च का हो तो वह कार्मिक भार बिना टूटे उठा लेता है — श्रापित का फल बहुत हल्का हो जाता है।"),
      satStrong,
      t(lang, `Saturn is in ${sg(saturn.sign, lang)}${satStrong ? ", where he is strong." : ", where he holds no special dignity."}`,
        `शनि ${sg(saturn.sign, lang)} में है${satStrong ? ", जहाँ वह बलवान है।" : ", जहाँ उसे कोई विशेष बल प्राप्त नहीं।"}`));
  }

  if (moon && (rahu || ketu)) {
    const sep = Math.min(rahu ? angularSeparation(moon.longitude, rahu.longitude) : 999, ketu ? angularSeparation(moon.longitude, ketu.longitude) : 999);
    add("grahan_dosh",
      t(lang, "Beyond roughly 10° from the node the eclipse condition is nominal — the luminary is not swallowed.", "नोड से लगभग 10° से अधिक दूरी पर ग्रहण की स्थिति नाममात्र रह जाती है — प्रकाशक ग्रस्त नहीं होता।"),
      sep > 10,
      t(lang, `The Moon's nearest node is ${deg(sep)} away.`, `चंद्रमा का निकटतम नोड ${deg(sep)} दूर है।`));
  }
  if (moon) {
    const jAspMoon = jupiterAspects(jupiter, moon.house);
    const waxingStrong = ctx.elongation != null && ctx.elongation >= 120;
    add("chandra_dosh",
      t(lang, "A bright waxing Moon (far from the Sun) or Jupiter's aspect on the Moon restores lunar strength and cancels the affliction reading.", "सूर्य से दूर, बलवान शुक्ल-पक्ष का चंद्रमा अथवा चंद्रमा पर गुरु की दृष्टि चंद्र-बल लौटा देती है और पीड़ा का निर्णय निरस्त हो जाता है।"),
      Boolean(jAspMoon) || waxingStrong,
      t(lang, `The Moon is ${ctx.elongation != null ? `${Math.round(ctx.elongation)}°` : "—"} from the Sun${jAspMoon ? ` and receives Jupiter's ${ordinal(jAspMoon)} aspect` : " and receives no Jupiter aspect"}.`,
        `चंद्रमा सूर्य से ${ctx.elongation != null ? `${Math.round(ctx.elongation)}°` : "—"} दूर है${jAspMoon ? ` तथा उस पर गुरु की ${jAspMoon}वीं दृष्टि है` : " तथा उस पर गुरु की दृष्टि नहीं है"}।`));
  }

  if (ctx.saturnTransitSign) {
    const dignified = ["Capricorn", "Aquarius", "Libra"].includes(ctx.saturnTransitSign);
    add("sade_sati",
      t(lang, "Saturn transiting his own signs (Capricorn, Aquarius) or his exaltation (Libra) runs the passage far more constructively — structure instead of grinding.", "शनि यदि स्वराशि (मकर, कुम्भ) अथवा उच्च राशि (तुला) में गोचर करे तो यह अवधि कहीं अधिक रचनात्मक रहती है — पिसाई नहीं, व्यवस्था।"),
      dignified,
      t(lang, `Saturn currently transits ${sg(ctx.saturnTransitSign, lang)}${dignified ? ", where he is dignified." : ", where he holds no special dignity."}`,
        `इस समय शनि ${sg(ctx.saturnTransitSign, lang)} में गोचर कर रहा है${dignified ? ", जहाँ वह बलवान है।" : ", जहाँ उसे कोई विशेष बल प्राप्त नहीं।"}`));
    add("shani_dhaiya",
      t(lang, "Dhaiya and Sade Sati cannot run at the same time — Saturn cannot be in the 4th or 8th from the Moon while also in the 12th, 1st or 2nd.", "ढैया और साढ़े साती एक साथ नहीं चल सकतीं — शनि एक ही समय में चंद्र से चतुर्थ/अष्टम और द्वादश/प्रथम/द्वितीय दोनों में नहीं हो सकता।"),
      true,
      t(lang, `Saturn is ${ctx.saturnFromMoon ? od(ctx.saturnFromMoon, lang) : "—"} from your natal Moon, so at most one of the two windows can be open.`,
        `शनि आपके जन्म-चंद्र से ${ctx.saturnFromMoon ? od(ctx.saturnFromMoon, lang) : "—"} है, अतः दोनों में से अधिकतम एक ही अवधि खुली हो सकती है।`));
  }

  add("nadi_dosh",
    t(lang, "Nadi Dosh is cancelled when both Moons share the same nakshatra but different padas, when the Moon signs differ while the nakshatra is the same, or when the Rashi lords are identical.", "नाड़ी दोष तब निरस्त होता है जब दोनों का नक्षत्र एक हो किन्तु चरण भिन्न, अथवा नक्षत्र एक हो किन्तु चंद्र-राशि भिन्न, अथवा दोनों की राशि का स्वामी एक ही हो।"),
    null,
    t(lang, "These clauses can only be settled once a partner's chart exists. They are listed so a same-Nadi match is not rejected before they are checked.", "ये नियम जीवनसाथी की कुंडली आने पर ही तय होंगे। इन्हें इसलिए दिया गया है कि समान नाड़ी वाला संबंध जाँच से पहले अस्वीकार न कर दिया जाए।"));

  if (ctx.moonSign) {
    const lord = SignLords[ctx.moonSign];
    add("bhakoot_dosh",
      t(lang, "Bhakoot is cancelled when the two Moon-sign lords are the same planet or natural friends.", "भकूट तब निरस्त होता है जब दोनों की चंद्र-राशि के स्वामी एक ही ग्रह हों अथवा परस्पर नैसर्गिक मित्र हों।"),
      null,
      t(lang, `Your Moon sign ${sg(ctx.moonSign, lang)} is ruled by ${pl(lord, lang)}; a partner whose Moon-sign lord is ${pl(lord, lang)} or a friend of it (${joinList((NATURAL_FRIENDS[lord] || []).map((p) => pl(p, lang)), lang)}) carries this cancellation.`,
        `आपकी चंद्र-राशि ${sg(ctx.moonSign, lang)} का स्वामी ${pl(lord, lang)} है; जिस जीवनसाथी की चंद्र-राशि का स्वामी ${pl(lord, lang)} अथवा उसका मित्र (${joinList((NATURAL_FRIENDS[lord] || []).map((p) => pl(p, lang)), lang)}) हो, उसके साथ यह निवारण स्वतः लागू होता है।`));
  }

  add("gana_dosh",
    t(lang, "Gana Dosh is cancelled when both partners share the same Moon sign, or when the Rashi lords are friends and the Bhakoot score is clean.", "गण दोष तब निरस्त होता है जब दोनों की चंद्र-राशि एक हो, अथवा राशि-स्वामी मित्र हों और भकूट शुद्ध हो।"),
    null,
    t(lang, "A two-chart clause — noted here so a Gana mismatch is read as a communication note rather than a disqualification.", "यह दो-कुंडली नियम है — इसे इसलिए दिया गया है कि गण का अंतर संवाद-शैली की टिप्पणी माना जाए, अयोग्यता नहीं।"));

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Expand a verified dosh_report into the full 28-page chapter set.
 *
 * @param {object} report      output of buildDoshReportJSONB → verifyDoshReport
 * @param {object} kundliData  output of buildCalculatedKundliData
 * @param {Array}  entries     detectDoshas() entries
 * @param {object} opts        { sadeSati, manglik, language }
 */
export function expandDoshReport(report, kundliData, entries, opts = {}) {
  const lang = norm(opts.language);
  const ctx = buildContext(kundliData, entries, opts.sadeSati || null, opts.manglik || null, lang);

  const chapters = buildChapters(ctx);
  const minorPatterns = buildMinorPatterns(ctx);
  const cancellations = buildCancellations(ctx, chapters);
  // Gana, paksha and saham tokens arrive from the ephemeris in English and get
  // interpolated into Hindi sentences; the shared pass rewrites them.
  const rawSections = buildSections(ctx, chapters, cancellations, minorPatterns);
  const sections = lang === "hi" ? localizeDates(rawSections) : rawSections;

  const detected = chapters.filter((c) => c.detected);
  const primary = detected.slice().sort((a, b) => (b.severity || 0) - (a.severity || 0))[0];

  const kundali_profile = {
    ...(report.kundali_profile || {}),
    placements: ctx.placements,
    house_signs: (ctx.houses || []).map((h) => ({ house: h.house, sign: sg(h.sign, lang), lord: pl(h.lord, lang) })),
  };

  const summary = t(lang,
    detected.length
      ? `Of the ${chapters.length} classical doshas checked against your chart, ${detected.length} ${detected.length === 1 ? "is" : "are"} present — ${joinList(detected.map((d) => `${d.name} (${d.severity_label}, ${d.severity}/100)`), lang)} — and ${chapters.length - detected.length} are not. Each verdict below cites the position that decided it.`
      : `All ${chapters.length} classical doshas checked against your chart came back absent. Each chapter below still states the rule that would have triggered the dosh and the exact position that keeps it from forming.`,
    detected.length
      ? `आपकी कुंडली में जाँचे गए ${chapters.length} शास्त्रीय दोषों में से ${detected.length} उपस्थित हैं — ${joinList(detected.map((d) => `${d.name} (${d.severity_label}, ${d.severity}/100)`), lang)} — और ${chapters.length - detected.length} अनुपस्थित। नीचे प्रत्येक निर्णय के साथ वह स्थिति दी गई है जिससे वह निकला।`
      : `आपकी कुंडली में जाँचे गए सभी ${chapters.length} शास्त्रीय दोष अनुपस्थित पाए गए। फिर भी प्रत्येक अध्याय में वह नियम और वह सटीक स्थिति दी गई है जिसके कारण दोष नहीं बनता।`);

  const recommendation = t(lang,
    "Read the severity score before the prose, check the cancellation page before acting on any chapter, and give any remedy forty days before judging it. Consult a qualified astrologer before wearing any gemstone.",
    "विवरण से पहले गंभीरता का अंक देखें, किसी भी अध्याय पर कार्य करने से पूर्व निवारण वाला पृष्ठ पढ़ें, और किसी भी उपाय को परखने से पहले चालीस दिन दें। कोई भी रत्न धारण करने से पूर्व योग्य ज्योतिषी से परामर्श अवश्य लें।");

  return {
    ...report,
    kundali_profile,
    doshas: chapters,
    cancellations,
    sections,
    minor_patterns: minorPatterns,
    // Numerology values arrive from the engine in English; localize the two
    // that are customer-facing so a Hindi report never mixes scripts.
    lucky_color: colorLoc(ctx.numerology?.luckyColor || report.lucky_color || "", lang),
    lucky_day: dayLoc(ctx.numerology?.luckyDay || report.lucky_day || "", lang),
    doshas_checked: chapters.length,
    total_detected: detected.length + minorPatterns.filter((p) => p.detected).length,
    primary_dosh: primary ? primary.id : null,
    overall_summary: summary,
    general_recommendation: recommendation,
    language: lang,
    total_pages: sections.length,
  };
}

/** detectDoshas() key → the chapter id that reports it. */
export const DETECTOR_KEY_TO_CHAPTER = Object.fromEntries(
  CHAPTER_ORDER.filter((c) => c.source).map((c) => [c.source, c.id])
);

export { CHAPTER_ORDER, buildCancellations, buildMinorPatterns, buildChapters, detailsTable, nameFor, hnum };
