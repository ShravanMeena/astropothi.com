// ─────────────────────────────────────────────────────────────────────────────
// Derived facts for the Love (id 1) and Health (id 2) reports.
//
// Both read the SAME computed chart the Premium Kundali is built from — this
// module only selects and judges the parts each report is about, so a devotee
// who buys two reports gets two readings of one chart rather than two charts.
//
// Every judgement here is a classical rule applied to computed positions. No
// value is invented, and nothing is written by an LLM.
// ─────────────────────────────────────────────────────────────────────────────

import { buildChartFacts, dignityOf, GRAHAS } from "./kundli-facts.js";

const BENEFICS = ["Jupiter", "Venus", "Moon", "Mercury"];
const MALEFICS = ["Saturn", "Mars", "Sun", "Rahu", "Ketu"];

const isBenefic = (p) => BENEFICS.includes(p);

/** Degrees within the sign as "21°49'", matching the other engines. */
function dms(deg) {
  const n = Number(deg);
  if (!Number.isFinite(n)) return "";
  const d = Math.floor(n);
  const m = Math.round((n - d) * 60);
  return m === 60 ? `${d + 1}°00'` : `${d}°${String(m).padStart(2, "0")}'`;
}

/** House a planet sits in, counted from another house. */
const fromHouse = (planetHouse, refHouse) => ((planetHouse - refHouse + 12) % 12) + 1;

/** A three-step verdict used all over both reports. */
function gradeOf(score) {
  if (score >= 2) return "strong";
  if (score >= 0) return "moderate";
  return "weak";
}

/**
 * How well a house is doing: its lord's dignity and placement, the company it
 * keeps, and who aspects it. This is the standard way a house is judged, and
 * both reports lean on it repeatedly.
 */
function judgeHouse(f, house) {
  const lord = f.houses.find((h) => h.house === house)?.lord;
  const lordPl = lord ? f.byName[lord] : null;
  const occupants = f.planets.filter((p) => p.house === house).map((p) => p.name);
  const aspects = f.aspectsOnHouse[house] || [];

  let score = 0;
  const reasons = [];

  if (lordPl) {
    const dig = dignityOf(lordPl);
    if (dig === "exalted" || dig === "moolatrikona" || dig === "own") { score += 2; reasons.push("lordStrong"); }
    else if (dig === "debilitated") { score -= 2; reasons.push("lordWeak"); }
    else if (dig === "enemy") { score -= 1; reasons.push("lordUneasy"); }
    // A lord in the 6th, 8th or 12th from its own house undercuts it.
    const rel = fromHouse(lordPl.house, house);
    if ([6, 8, 12].includes(rel)) { score -= 1; reasons.push("lordInDusthana"); }
    if ([1, 4, 5, 7, 9, 10].includes(lordPl.house)) { score += 1; reasons.push("lordWellPlaced"); }
    if (f.combust[lord]?.combust) { score -= 1; reasons.push("lordCombust"); }
  }

  const goodOcc = occupants.filter(isBenefic);
  const badOcc = occupants.filter((p) => MALEFICS.includes(p));
  score += goodOcc.length;
  score -= badOcc.length;
  if (goodOcc.length) reasons.push("beneficsInside");
  if (badOcc.length) reasons.push("maleficsInside");

  const goodAsp = aspects.filter(isBenefic);
  if (goodAsp.length) { score += 1; reasons.push("beneficAspect"); }

  return {
    house, lord,
    lordSign: lordPl?.sign || null,
    lordHouse: lordPl?.house || null,
    lordDignity: lordPl ? dignityOf(lordPl) : null,
    lordCombust: Boolean(f.combust[lord]?.combust),
    lordRetrograde: Boolean(lordPl?.retrograde),
    occupants, aspects, goodAspects: goodAsp, maleficOccupants: badOcc,
    score, grade: gradeOf(score), reasons,
  };
}

/**
 * Manglik / Kuja dosha, with the cancellations that actually matter.
 *
 * Mars in 1, 2, 4, 7, 8 or 12 from the Lagna raises it; the same test is run
 * from the Moon and from Venus because classical practice requires agreement
 * before the dosha is called serious.
 */
function manglikCheck(f) {
  const mars = f.byName.Mars;
  if (!mars) return { detected: false, from: [], cancellations: [], severity: "none" };

  const moon = f.byName.Moon;
  const venus = f.byName.Venus;
  const HOUSES = [1, 2, 4, 7, 8, 12];

  const from = [];
  if (HOUSES.includes(mars.house)) from.push("lagna");
  if (moon && HOUSES.includes(fromHouse(mars.house, moon.house))) from.push("moon");
  if (venus && HOUSES.includes(fromHouse(mars.house, venus.house))) from.push("venus");

  const cancellations = [];
  const marsDig = dignityOf(mars);
  if (marsDig === "own" || marsDig === "exalted" || marsDig === "moolatrikona") cancellations.push("marsDignified");
  // Mars in its own or exaltation sign in 1/4/7/8/12 is not a dosha.
  if (["Aries", "Scorpio", "Capricorn"].includes(mars.sign)) cancellations.push("marsOwnSign");
  // Jupiter's or Venus's aspect on Mars, or on the 7th, settles it.
  const jup = f.byName.Jupiter;
  if (jup && (f.aspectsFrom.Jupiter || []).includes(mars.house)) cancellations.push("jupiterAspect");
  if ((f.aspectsOnHouse[7] || []).includes("Jupiter")) cancellations.push("jupiterOn7th");
  // Saturn aspecting Mars restrains it.
  if ((f.aspectsFrom.Saturn || []).includes(mars.house)) cancellations.push("saturnRestrains");

  const detected = from.length > 0;
  const severity = !detected
    ? "none"
    : cancellations.length >= 2 ? "cancelled"
      : from.length >= 2 ? "strong"
        : "mild";

  return { detected, from, houseFromLagna: mars.house, sign: mars.sign, dignity: marsDig, cancellations, severity };
}

/** Marriage timing — the dasha windows in which the 7th is activated. */
function marriageWindows(f) {
  const seventh = f.houses.find((h) => h.house === 7);
  const lord7 = seventh?.lord;
  const venus = "Venus";
  const occupants7 = f.planets.filter((p) => p.house === 7).map((p) => p.name);
  const activators = [...new Set([lord7, venus, ...occupants7].filter(Boolean))];

  const windows = (f.timeline || [])
    .filter((w) => activators.includes(w.mahaDasha))
    .map((w) => ({
      lord: w.mahaDasha, start: w.startDate || w.start, end: w.endDate || w.end,
      why: w.mahaDasha === lord7 ? "lord7" : w.mahaDasha === venus ? "venus" : "occupies7",
    }));

  return { activators, windows: windows.slice(0, 6) };
}

/** Which grahas are positioned to trouble the body, and where. */
function healthPressure(f) {
  const points = [];
  for (const g of GRAHAS) {
    const p = f.byName[g];
    if (!p) continue;
    const dig = dignityOf(p);
    const inDusthana = [6, 8, 12].includes(p.house);
    const afflicted = dig === "debilitated" || dig === "enemy" || Boolean(f.combust[g]?.combust);
    if (inDusthana || afflicted) {
      points.push({
        planet: g, house: p.house, sign: p.sign, dignity: dig,
        combust: Boolean(f.combust[g]?.combust),
        retrograde: Boolean(p.retrograde),
        reason: inDusthana && afflicted ? "both" : inDusthana ? "dusthana" : "dignity",
      });
    }
  }
  return points;
}

/** Classical health yogas that are either present or not — no hedging. */
function healthYogas(f, sixth, eighth) {
  const out = [];
  const lagnaLord = f.byName[f.ascLord];
  const push = (key, detected, note) => out.push({ key, detected, note: note || null });

  // Vipreet Raja yoga on the 6th — the lord of the 6th in the 8th or 12th
  // turns illness into resilience.
  const l6 = sixth.lordHouse;
  push("vipreetHealth", [8, 12].includes(l6), l6 ? `6th lord in ${l6}` : null);

  // A strong Lagna lord is the single best protection in the chart.
  const dig = lagnaLord ? dignityOf(lagnaLord) : null;
  push("strongLagnaLord", ["exalted", "own", "moolatrikona"].includes(dig), dig);

  // Jupiter or Venus in a kendra guards the body.
  const guard = ["Jupiter", "Venus"].find((g) => [1, 4, 7, 10].includes(f.byName[g]?.house));
  push("beneficKendra", Boolean(guard), guard || null);

  // Malefics in the 6th are a classical strength — they fight disease there.
  push("maleficIn6th", sixth.maleficOccupants.length > 0, sixth.maleficOccupants.join(", ") || null);

  // The 8th lord in the 8th steadies longevity.
  push("eighthLordHome", eighth.lordHouse === 8, null);

  return out;
}

/**
 * The shared fact set. `kind` selects which extras get computed so a Love
 * report does not pay for the health work and vice versa.
 */
export function computeLifeFacts(kundliData, kind) {
  const f = buildChartFacts(kundliData);

  const base = {
    subject: kundliData.subject || {},
    lagnaSign: f.ascSign,
    lagnaLord: f.ascLord,
    moonSign: f.byName.Moon?.sign || null,
    nakshatra: kundliData.astroDetails?.nakshatra || f.byName.Moon?.nakshatra || null,
    nakshatraLord: f.byName.Moon?.nakshatraLord || null,
    placements: f.planets.map((p) => ({
      planet: p.name, abbr: p.abbr || p.name.slice(0, 2), sign: p.sign,
      // Formatted like every other report's placements ("21°49'"). Emitting the
      // raw float printed "12.115745254709168" on the page.
      house: p.house, degree: dms(p.degree), retrograde: Boolean(p.retrograde),
      dignity: dignityOf(p), combust: Boolean(f.combust[p.name]?.combust),
    })),
    houses: f.houses,
    dasha: { maha: f.activeMaha?.mahaDasha || null, antar: f.currentAntar?.antar || null },
    // Normalised to the shape the chapters read: {lord, start, end}.
    timeline: (f.timeline || []).map((w) => ({
      lord: w.mahaDasha, start: w.startDate || w.start, end: w.endDate || w.end,
    })),
    // buildChartFacts keys these by lowercase planet; the chapters want a list.
    transits: Object.entries(f.transits || {}).map(([k, v]) => ({
      planet: k.charAt(0).toUpperCase() + k.slice(1),
      sign: v.sign, house: v.fromLagna, fromMoon: v.fromMoon,
    })),
    sadeSati: f.sadeSati || null,
    chart: f,
  };

  if (kind === "love") {
    const h7 = judgeHouse(f, 7);
    const h5 = judgeHouse(f, 5);
    const h2 = judgeHouse(f, 2);
    const h8 = judgeHouse(f, 8);
    const h12 = judgeHouse(f, 12);
    const d9 = f.varga(9);
    const venus = f.byName.Venus;
    const partnerPlanet = h7.occupants[0] || h7.lord;

    return {
      ...base,
      houses7: h7, houses5: h5, houses2: h2, houses8: h8, houses12: h12,
      venus: venus ? {
        sign: venus.sign, house: venus.house, degree: venus.degree,
        dignity: dignityOf(venus), combust: Boolean(f.combust.Venus?.combust),
        retrograde: Boolean(venus.retrograde),
      } : null,
      mars: f.byName.Mars ? { sign: f.byName.Mars.sign, house: f.byName.Mars.house, dignity: dignityOf(f.byName.Mars) } : null,
      moon: f.byName.Moon ? { sign: f.byName.Moon.sign, house: f.byName.Moon.house, dignity: dignityOf(f.byName.Moon) } : null,
      navamsa: d9,
      manglik: manglikCheck(f),
      timing: marriageWindows(f),
      partnerPlanet,
      partnerDirection: partnerPlanet,
    };
  }

  const h6 = judgeHouse(f, 6);
  const h8 = judgeHouse(f, 8);
  const h12 = judgeHouse(f, 12);
  const h1 = judgeHouse(f, 1);
  return {
    ...base,
    houses1: h1, houses6: h6, houses8: h8, houses12: h12,
    pressure: healthPressure(f),
    yogas: healthYogas(f, h6, h8),
    // savByHouse is a function on the facts object, not a lookup table.
    sav: (() => {
      const at = (h) => { try { return typeof f.savByHouse === "function" ? f.savByHouse(h) : f.savByHouse?.[h] ?? null; } catch { return null; } };
      return { 1: at(1), 6: at(6), 8: at(8), 12: at(12) };
    })(),
  };
}

export { judgeHouse, manglikCheck, fromHouse, isBenefic, MALEFICS };
