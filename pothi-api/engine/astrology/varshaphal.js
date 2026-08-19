// ─────────────────────────────────────────────────────────────────────────────
// Varshaphal (Tajika annual chart) — deterministic, ephemeris-driven (NO LLM).
//
//   • Varsha Pravesh — the solar-return instant (Sun returns to its natal
//     sidereal longitude) found by bracketing + bisection over the ephemeris.
//   • Annual chart    — a full chart cast for that instant at the birth place.
//   • Muntha          — progressed point: natal Lagna sign advanced 1 sign/year.
//   • Varshesh        — the year-lord, chosen from the Tajika office-bearers by
//     dignity + angularity in the annual chart (basis stated in the output).
//   • Mudda dasha     — the classical Varsha-Vimshottari timeline: 120 dasha
//     years scaled to 365.25 days, in Vimshottari order from the natal Moon
//     nakshatra lord — the authentic month-by-month spine of the year.
// ─────────────────────────────────────────────────────────────────────────────

import { buildCalculatedKundliData } from "./normalize-kundli-data.js";
import { SIGNS, SignLords, DashaOrder, DashaYears } from "./astro-constants.js";

const pad = (n) => String(n).padStart(2, "0");
const YEAR_DAYS = 365.2425;

// Significations used for readings (concise karaka).
const KARAKA = {
  Sun: "authority, health, father, status and confidence",
  Moon: "mind, emotions, mother, home and public life",
  Mars: "energy, courage, property, disputes and initiative",
  Mercury: "intellect, communication, trade, learning and skill",
  Jupiter: "wisdom, wealth, children, fortune and expansion",
  Venus: "relationships, comforts, art, vehicles and pleasure",
  Saturn: "discipline, work, delays, responsibility and endurance",
  Rahu: "ambition, foreign matters, sudden gains and obsession",
  Ketu: "detachment, spirituality, research and letting go",
};

const HOUSE_AREA = {
  1: "self, vitality and overall direction", 2: "wealth, family and speech", 3: "courage, siblings and initiative",
  4: "home, mother, property and peace of mind", 5: "children, education and creativity", 6: "work, health, competition and debts",
  7: "marriage, partnerships and business", 8: "sudden change, obstacles and transformation", 9: "fortune, dharma, father and long journeys",
  10: "career, status and public conduct", 11: "gains, income and fulfilment of desires", 12: "expenses, travel, loss and spirituality",
};

// A chart at an absolute instant: feed UTC wall-clock + timezone "UTC" so the
// engine's planet longitudes are the true geocentric positions at that moment.
function chartAtInstant(date, lat, lon, name = "Annual") {
  return buildCalculatedKundliData({
    fullName: name, gender: "male",
    birthDate: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    birthTime: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
    birthPlace: "", latitude: Number(lat), longitude: Number(lon), timezone: "UTC", language: "en",
  });
}

const sunLonAt = (date, lat, lon) => chartAtInstant(date, lat, lon).planets.find((p) => p.name === "Sun").longitude;
// signed angular difference in (-180, 180]
const angDiff = (a, b) => ((a - b + 540) % 360) - 180;

// Find the solar-return instant near the target-year birthday.
function findSolarReturn(natalSunLon, bm, bd, targetYear, lat, lon) {
  const center = Date.UTC(targetYear, bm - 1, bd, 12, 0, 0);
  const step = 3 * 3600 * 1000; // 3h
  let prev = null;
  for (let ms = center - 2 * 86400000; ms <= center + 2 * 86400000; ms += step) {
    const diff = angDiff(sunLonAt(new Date(ms), lat, lon), natalSunLon);
    if (prev && prev.diff < 0 && diff >= 0) {
      let lo = prev.ms, hi = ms;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (angDiff(sunLonAt(new Date(mid), lat, lon), natalSunLon) < 0) lo = mid; else hi = mid;
      }
      return new Date((lo + hi) / 2);
    }
    prev = { ms, diff };
  }
  return new Date(center);
}

const signIdx = (sign) => SIGNS.indexOf(sign);
const houseFromLagna = (sign, lagnaSign) => ((signIdx(sign) - signIdx(lagnaSign) + 12) % 12) + 1;

function dignityScore(planet) {
  switch (planet?.intensity) {
    case "Highly Favorable": return 3; // exalted
    case "Favorable": return 2;        // own sign
    case "Neutral": return 1;
    case "Unfavorable": return -2;     // debilitated
    default: return 0;
  }
}

function fmtDate(d) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
function fmtDateTime(d) {
  return `${fmtDate(d)}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

// Mudda (Varsha-Vimshottari) dasha: 120 yrs → 365.2425 days, Vimshottari order
// starting from the natal Moon-nakshatra lord, from the solar-return instant.
function buildMuddaDasha(startDate, startLord, annual) {
  const startIdx = DashaOrder.indexOf(startLord);
  const order = Array.from({ length: 9 }, (_, i) => DashaOrder[(startIdx + i) % 9]);
  let ms = startDate.getTime();
  return order.map((lord) => {
    const days = (DashaYears[lord] / 120) * YEAR_DAYS;
    const start = new Date(ms);
    ms += days * 86400000;
    const end = new Date(ms);
    const p = annual.planets.find((pl) => pl.name === lord);
    const house = p ? p.house : null;
    const cond = p ? p.intensity : "Neutral";
    const tone = dignityScore(p) >= 2 ? "supportive and productive"
      : dignityScore(p) <= -2 ? "testing — go slow and remedy"
      : "mixed — steady effort pays";
    return {
      lord, start, end,
      startLabel: fmtDate(start), endLabel: fmtDate(end),
      house, condition: cond,
      theme: `${lord} governs this sub-period (${KARAKA[lord]}). In your annual chart it sits in house ${house} (${HOUSE_AREA[house] || "—"}), ${cond.toLowerCase()} — ${tone}.`,
    };
  });
}

export function computeVarshaphal(input) {
  const { name, birthDate, birthTime, lat, lon, timezone } = input;
  const [by, bm, bd] = birthDate.split("-").map(Number);

  // Natal chart.
  const natal = buildCalculatedKundliData({
    fullName: name || "User", gender: input.gender || "male",
    birthDate, birthTime, birthPlace: input.pob || "",
    latitude: Number(lat), longitude: Number(lon), timezone: timezone || "Asia/Kolkata", language: "en",
  });
  const natalSunLon = natal.planets.find((p) => p.name === "Sun").longitude;
  const natalLagnaSign = natal.ascendant.sign;
  const moonNakLord = natal.astroDetails.nakshatraLord;

  // The current solar year: the varsha that has most recently begun (birthday
  // this year if it has passed, else last year's birthday).
  const now = new Date();
  let targetYear = now.getUTCFullYear();
  const birthdayThisYear = Date.UTC(targetYear, bm - 1, bd);
  if (now.getTime() < birthdayThisYear) targetYear -= 1;
  const age = targetYear - by; // completed years at this solar return

  const srDate = findSolarReturn(natalSunLon, bm, bd, targetYear, lat, lon);
  const annual = chartAtInstant(srDate, lat, lon, name || "Annual");
  const annualLagnaSign = annual.ascendant.sign;
  const annualLagnesh = SignLords[annualLagnaSign];

  // Muntha.
  const munthaIdx = (signIdx(natalLagnaSign) + age) % 12;
  const munthaSign = SIGNS[munthaIdx];
  const munthaLord = SignLords[munthaSign];
  const munthaHouse = houseFromLagna(munthaSign, annualLagnaSign);

  // Varshesh candidates (Tajika office-bearers we can determine unambiguously).
  const candidateNames = Array.from(new Set([
    annualLagnesh,                       // Varsha Lagnesh
    SignLords[natalLagnaSign],           // Janma Lagnesh
    munthaLord,                          // Muntha lord
    SignLords[annual.planets.find((p) => p.name === "Sun").sign], // Sun-sign lord (day proxy)
    SignLords[annual.planets.find((p) => p.name === "Moon").sign],// Moon-sign lord (night proxy)
  ]));
  const KENDRA = new Set([1, 4, 7, 10]);
  const candidates = candidateNames.map((lord) => {
    const p = annual.planets.find((pl) => pl.name === lord);
    const angular = p && KENDRA.has(p.house) ? 1 : 0;
    const score = dignityScore(p) + angular;
    // Role labels carry both scripts: they are printed inside Hindi sentences,
    // where a Latin "Janma Lagnesh" reads as untranslated copy.
    const roles = [];
    const roles_hi = [];
    if (lord === annualLagnesh) { roles.push("Varsha Lagnesh"); roles_hi.push("वर्ष लग्नेश"); }
    if (lord === SignLords[natalLagnaSign]) { roles.push("Janma Lagnesh"); roles_hi.push("जन्म लग्नेश"); }
    if (lord === munthaLord) { roles.push("Muntha lord"); roles_hi.push("मुंथा स्वामी"); }
    return { lord, house: p?.house, condition: p?.intensity, angular: !!angular, score, roles, roles_hi };
  }).sort((a, b) => b.score - a.score);
  const varshesh = candidates[0];

  // Mudda dasha timeline.
  const mudda = buildMuddaDasha(srDate, moonNakLord, annual);

  // Theme of the year.
  const munthaGood = dignityScore(annual.planets.find((p) => p.name === munthaLord)) >= 1;
  const theme =
    `Your year runs from ${fmtDate(srDate)} to the next birthday. Muntha falls in house ${munthaHouse} ` +
    `(${HOUSE_AREA[munthaHouse]}), so this area is highlighted all year. The year-lord (Varshesh) is ${varshesh.lord} ` +
    `${varshesh.roles.length ? `(${varshesh.roles.join(", ")})` : ""}, placed in house ${varshesh.house} and ${String(varshesh.condition).toLowerCase()} — ` +
    `${varshesh.score >= 2 ? "a strong, favourable year-lord" : varshesh.score <= -1 ? "a year-lord under strain, asking for care and remedy" : "a workable year-lord"}. ` +
    `${munthaGood ? "With Muntha's lord well placed, its house's affairs progress well." : "Support Muntha's lord to smooth its house's affairs."}`;

  return {
    subject: { name: name || "User", birthDate, birthTime, birthPlace: input.pob || "" },
    year: { targetYear, age, from: srDate, fromLabel: fmtDateTime(srDate) },
    annualLagna: { sign: annualLagnaSign, lord: annualLagnesh },
    natalLagna: { sign: natalLagnaSign },
    muntha: { sign: munthaSign, lord: munthaLord, house: munthaHouse },
    varshesh,
    candidates,
    theme,
    annualPlanets: annual.planets.map((p) => ({ name: p.name, sign: p.sign, house: p.house, retrograde: p.retrograde, condition: p.intensity })),
    mudda,
    profile: { rashi: natal.astroDetails.sign, nakshatra: natal.panchang.nakshatra, lagna: natalLagnaSign },
  };
}
