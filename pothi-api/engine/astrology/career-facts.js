// Career facts — what a reading of work argues from.
//
// Deliberately its own file rather than a third branch inside life-facts.js:
// love and health already share that function, and a career reading needs a
// different set of houses, the Dashamsha, and a Jaimini karaka none of the
// others compute. Adding a branch would have made one function serve three
// unrelated questions.
//
// Nothing here is invented. Every field is derived from the same computed chart
// the Premium Kundali is built from.

import { buildChartFacts, dignityOf } from "./kundli-facts.js";
import { judgeHouse, fromHouse, isBenefic, MALEFICS } from "./life-facts.js";

/** The seven Jaimini chara karakas — Rahu and Ketu are outside this scheme. */
const CHARA = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/**
 * Atmakaraka is the planet at the highest degree within its sign; Amatyakaraka
 * is the second. The Amatyakaraka is the classical significator of career and
 * the minister of the chart — it is what this report leans on hardest after the
 * 10th house itself.
 */
function charaKarakas(f) {
  const ranked = CHARA.map((name) => {
    const p = f.byName[name];
    if (!p) return null;
    return { planet: name, degree: p.degree, sign: p.sign, house: p.house, dignity: dignityOf(p) };
  }).filter(Boolean).sort((a, b) => b.degree - a.degree);
  return { atmakaraka: ranked[0] || null, amatyakaraka: ranked[1] || null, ranked };
}

/**
 * Job or business, as a weighted count rather than a verdict pulled from
 * nowhere. Each signal is a classical rule; the report prints the signals it
 * found, so the reader can see what the answer was built from instead of being
 * asked to trust it.
 */
function jobOrBusiness(f, h10, h7, h6, h3, h11) {
  const job = [], business = [];
  const P = (n) => f.byName[n];

  if (h6.grade !== "weak") job.push("sixthSteady");
  if (h10.lordHouse === 6) job.push("tenthLordInSixth");
  if (h6.lordHouse === 10) job.push("sixthLordInTenth");
  if ((h10.aspects || []).includes("Saturn")) job.push("saturnOnTenth");
  if (P("Saturn") && [1, 6, 10].includes(P("Saturn").house)) job.push("saturnPlacedForService");
  if (P("Sun") && [6, 10].includes(P("Sun").house)) job.push("sunInServiceHouse");

  if (h7.grade === "strong") business.push("seventhStrong");
  if (h10.lordHouse === 7) business.push("tenthLordInSeventh");
  if (h7.lordHouse === 10) business.push("seventhLordInTenth");
  if (h3.grade !== "weak") business.push("thirdSteady");
  if (h11.grade === "strong") business.push("eleventhStrong");
  if (P("Mercury") && ["own", "exalted", "moolatrikona"].includes(dignityOf(P("Mercury")))) business.push("mercuryDignified");
  if (f.exchanges?.some((e) => e.houses.includes(10) && (e.houses.includes(7) || e.houses.includes(11)))) business.push("exchangeWithTenth");

  const lean = job.length === business.length ? "either"
             : job.length > business.length ? "job" : "business";
  return { job, business, lean, margin: Math.abs(job.length - business.length) };
}

/**
 * The field of work. Read from three independent places — the 10th lord, the
 * Amatyakaraka and the strongest planet in the chart — and reported as agreement
 * or disagreement, because a chart that points three ways honestly points three
 * ways.
 */
const FIELD_BY_PLANET = {
  Sun:     ["government, administration, medicine, power and energy, positions that carry a title"],
  Moon:    ["the public, liquids, food, hospitality, care work, travel by water, anything with a mass audience"],
  Mars:    ["engineering, defence and police, surgery, land and property, metals, sport, work with tools or risk"],
  Mercury: ["trade and commerce, accounts, writing, teaching, software, brokerage, anything that moves information"],
  Jupiter: ["advice and counsel, law, teaching, finance, priesthood, publishing, work where judgement is the product"],
  Venus:   ["design, beauty, fashion, film and music, hospitality, luxury goods, work that must look right"],
  Saturn:  ["labour and structure, mining, iron, construction, agriculture, long service, work with the old or the poor"],
  Rahu:    ["foreign connections, technology, aviation, speculation, unconventional trades, work that did not exist a generation ago"],
  Ketu:    ["research, medicine, spiritual work, computing, investigation, work done apart from a crowd"],
};

function careerFields(f, h10, karakas) {
  const strongest = [...(f.strength || [])].sort((a, b) => b.score - a.score)[0]?.planet || null;
  const sources = [
    { from: "tenthLord", planet: h10.lord },
    { from: "amatyakaraka", planet: karakas.amatyakaraka?.planet || null },
    { from: "strongest", planet: strongest },
  ].filter((s) => s.planet);
  const counts = {};
  for (const s of sources) counts[s.planet] = (counts[s.planet] || 0) + 1;
  const agreement = Math.max(0, ...Object.values(counts));
  return { sources, agreement, fieldOf: (p) => FIELD_BY_PLANET[p] || [] };
}

/** Dasha periods that activate the 10th house, its lord, Saturn or the Amatyakaraka. */
function careerWindows(f, h10, karakas) {
  const activators = [...new Set([
    h10.lord,
    ...(h10.occupants || []),
    "Saturn",
    karakas.amatyakaraka?.planet,
  ].filter(Boolean))];
  const windows = (f.timeline || [])
    .filter((w) => activators.includes(w.mahaDasha))
    .map((w) => ({ lord: w.mahaDasha, start: w.startDate || w.start, end: w.endDate || w.end }));
  return { activators, windows: windows.slice(0, 6) };
}

export function computeCareerFacts(kundliData) {
  const f = buildChartFacts(kundliData);

  const h10 = judgeHouse(f, 10);
  const h1 = judgeHouse(f, 1);
  const h2 = judgeHouse(f, 2);
  const h3 = judgeHouse(f, 3);
  const h6 = judgeHouse(f, 6);
  const h7 = judgeHouse(f, 7);
  const h11 = judgeHouse(f, 11);

  const karakas = charaKarakas(f);
  const d10 = f.varga(10);
  const route = jobOrBusiness(f, h10, h7, h6, h3, h11);
  const fields = careerFields(f, h10, karakas);
  const timing = careerWindows(f, h10, karakas);

  const sav = {};
  for (const h of [1, 2, 3, 6, 7, 10, 11]) {
    try { sav[h] = typeof f.savByHouse === "function" ? f.savByHouse(h) : null; } catch { sav[h] = null; }
  }

  const grahaOf = (n) => {
    const p = f.byName[n];
    return p ? {
      name: n, sign: p.sign, house: p.house, degree: p.degree,
      dignity: dignityOf(p), retrograde: Boolean(p.retrograde),
      combust: Boolean(f.combust[n]?.combust),
      bindus: (f.strength || []).find((s) => s.planet === n)?.bindus ?? null,
    } : null;
  };

  return {
    subject: kundliData.subject || {},
    lagnaSign: f.ascSign,
    lagnaLord: f.ascLord,
    moonSign: f.byName.Moon?.sign || null,
    nakshatra: kundliData.astroDetails?.nakshatra || f.byName.Moon?.nakshatra || null,
    nakshatraLord: f.byName.Moon?.nakshatraLord || null,
    placements: f.planets.map((p) => ({
      planet: p.name, abbr: p.abbr || p.name.slice(0, 2), sign: p.sign,
      house: p.house, degree: `${Math.floor(p.degree)}°${String(Math.round((p.degree % 1) * 60)).padStart(2, "0")}'`,
      retrograde: Boolean(p.retrograde), dignity: dignityOf(p),
      combust: Boolean(f.combust[p.name]?.combust),
    })),
    houses: f.houses,
    houses1: h1, houses2: h2, houses3: h3, houses6: h6, houses7: h7, houses10: h10, houses11: h11,
    saturn: grahaOf("Saturn"), sun: grahaOf("Sun"),
    mercury: grahaOf("Mercury"), jupiter: grahaOf("Jupiter"),
    mars: grahaOf("Mars"), venus: grahaOf("Venus"),
    karakas, dashamsha: d10, route, fields, timing, sav,
    rajaYogas: f.rajaYogas || [], dhanaYogas: f.dhanaYogas || [],
    yogakarakas: f.yogakarakas || [], exchanges: f.exchanges || [],
    mahapurusha: f.mahapurusha || [],
    dasha: { maha: f.activeMaha?.mahaDasha || null, antar: f.currentAntar?.antar || null },
    timeline: (f.timeline || []).map((w) => ({ lord: w.mahaDasha, start: w.startDate || w.start, end: w.endDate || w.end })),
    transits: Object.entries(f.transits || {}).map(([k, v]) => ({
      planet: k.charAt(0).toUpperCase() + k.slice(1), sign: v.sign, house: v.fromLagna, fromMoon: v.fromMoon,
    })),
    sadeSati: f.sadeSati || null,
    chart: f,
  };
}

export { FIELD_BY_PLANET, isBenefic, MALEFICS, fromHouse };
