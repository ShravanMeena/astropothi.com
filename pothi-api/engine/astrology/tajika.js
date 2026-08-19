// ─────────────────────────────────────────────────────────────────────────────
// Tajika (Varshaphal) computation layer — deterministic, ephemeris-driven.
// NO LLM, NO prose. Every export here returns NUMBERS and KEYS only; the words
// are added later by engine/i18n/forecast-strings.js so the same facts render
// identically in English and Hindi.
//
// What is computed here, and from what:
//   • Varsha Pravesh   — the solar-return instant, by bracketing + bisection on
//                        the sidereal Sun longitude (engine ephemeris).
//   • Masa Pravesh     — the 12 monthly ingresses, i.e. the instants the Sun is
//                        30°·k past its natal longitude. Same solver.
//   • Muntha           — natal Lagna sign advanced one sign per completed year;
//                        Masa Muntha advances one house per solar month.
//   • Sahams           — Tajika sensitive points. Each is A − B + Lagna on the
//                        annual chart's sidereal longitudes, reversed for a
//                        night pravesh where the classical rule reverses. The
//                        formula used is carried in the output so the report can
//                        print it instead of asserting it.
//   • Panchavargeeya   — Kshetra / Uchcha / Hadda (Egyptian terms) / Drekkana /
//     Bala               Navamsha, on the classical 30-20-15-10-5 scale.
//   • Harsha Bala      — the four 5-point Tajika "joy" conditions.
//   • Tri-Pataki       — the three flags counted from the Moon of the varsha
//                        chart (construction stated in TRIPATAKI_FLAGS).
//
// Any table below is an explicit static table; nothing is generated at runtime.
// ─────────────────────────────────────────────────────────────────────────────

import { buildCalculatedKundliData } from "./normalize-kundli-data.js";
import { computeVarshaphal } from "./varshaphal.js";
import { SIGNS, SignLords } from "./astro-constants.js";

const pad = (n) => String(n).padStart(2, "0");
const DAY_MS = 86400000;

export const TAJIKA_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
export const ALL_PLANETS = [...TAJIKA_PLANETS, "Rahu", "Ketu"];

export const PLANET_ABBR = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

// ── static reference tables ──────────────────────────────────────────────────

// Exaltation longitude (absolute sidereal degrees). Debilitation = +180°.
export const EXALTATION_DEG = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};

// Parashari natural relationships, used by Kshetra / Hadda / Navamsha bala.
export const NATURAL_RELATION = {
  Sun:     { friend: ["Moon", "Mars", "Jupiter"], neutral: ["Mercury"], enemy: ["Venus", "Saturn"] },
  Moon:    { friend: ["Sun", "Mercury"], neutral: ["Mars", "Jupiter", "Venus", "Saturn"], enemy: [] },
  Mars:    { friend: ["Sun", "Moon", "Jupiter"], neutral: ["Venus", "Saturn"], enemy: ["Mercury"] },
  Mercury: { friend: ["Sun", "Venus"], neutral: ["Mars", "Jupiter", "Saturn"], enemy: ["Moon"] },
  Jupiter: { friend: ["Sun", "Moon", "Mars"], neutral: ["Saturn"], enemy: ["Mercury", "Venus"] },
  Venus:   { friend: ["Mercury", "Saturn"], neutral: ["Mars", "Jupiter"], enemy: ["Sun", "Moon"] },
  Saturn:  { friend: ["Mercury", "Venus"], neutral: ["Jupiter"], enemy: ["Sun", "Moon", "Mars"] },
};

// Egyptian terms (Hadda). [lord, upper degree bound within the sign].
export const EGYPTIAN_TERMS = {
  Aries:       [["Jupiter", 6], ["Venus", 12], ["Mercury", 20], ["Mars", 25], ["Saturn", 30]],
  Taurus:      [["Venus", 8], ["Mercury", 14], ["Jupiter", 22], ["Saturn", 27], ["Mars", 30]],
  Gemini:      [["Mercury", 6], ["Jupiter", 12], ["Venus", 17], ["Mars", 24], ["Saturn", 30]],
  Cancer:      [["Mars", 7], ["Venus", 13], ["Mercury", 19], ["Jupiter", 26], ["Saturn", 30]],
  Leo:         [["Jupiter", 6], ["Venus", 11], ["Saturn", 18], ["Mercury", 24], ["Mars", 30]],
  Virgo:       [["Mercury", 7], ["Venus", 17], ["Jupiter", 21], ["Mars", 28], ["Saturn", 30]],
  Libra:       [["Saturn", 6], ["Mercury", 14], ["Jupiter", 21], ["Venus", 28], ["Mars", 30]],
  Scorpio:     [["Mars", 7], ["Venus", 11], ["Mercury", 19], ["Jupiter", 24], ["Saturn", 30]],
  Sagittarius: [["Jupiter", 12], ["Venus", 17], ["Mercury", 21], ["Saturn", 26], ["Mars", 30]],
  Capricorn:   [["Mercury", 7], ["Jupiter", 14], ["Venus", 22], ["Saturn", 26], ["Mars", 30]],
  Aquarius:    [["Mercury", 7], ["Venus", 13], ["Jupiter", 20], ["Mars", 25], ["Saturn", 30]],
  Pisces:      [["Venus", 12], ["Jupiter", 16], ["Mercury", 19], ["Mars", 28], ["Saturn", 30]],
};

// Panchavargeeya component ceilings (classical 30-20-15-10-5, total 80).
export const PANCHAVARGEEYA_MAX = { kshetra: 30, uchcha: 20, hadda: 15, drekkana: 10, navamsha: 5, total: 80 };

// Kshetra (sign) bala steps, by the planet's relation to the sign lord.
const KSHETRA_STEP = { ownOrExalted: 30, friend: 22.5, neutral: 15, enemy: 7.5, debilitated: 3.75 };
// Hadda bala steps, by the planet's relation to the term lord.
const HADDA_STEP = { own: 15, friend: 11.25, neutral: 7.5, enemy: 3.75 };
// Navamsha bala steps, by the planet's relation to the navamsha sign lord.
const NAVAMSHA_STEP = { own: 5, friend: 3.75, neutral: 2.5, enemy: 1.25 };

// Drekkana bala (Tajika): masculine planets score in the 1st drekkana,
// hermaphrodite in the 2nd, feminine in the 3rd.
export const PLANET_GENDER = {
  Sun: "male", Mars: "male", Jupiter: "male",
  Moon: "female", Venus: "female",
  Mercury: "neuter", Saturn: "neuter",
};
const DREKKANA_SLOT = { male: 0, neuter: 1, female: 2 };

// Harsha bala rule 1 — the house each planet rejoices in.
export const JOY_HOUSE = { Sun: 9, Moon: 3, Mars: 6, Mercury: 1, Jupiter: 11, Venus: 5, Saturn: 12 };
// Harsha bala rules 2 & 3 — planetary sect. Mercury is resolved at run time
// (oriental = diurnal, occidental = nocturnal).
export const PLANET_SECT = { Sun: "diurnal", Jupiter: "diurnal", Saturn: "diurnal", Moon: "nocturnal", Venus: "nocturnal", Mars: "nocturnal" };

export const HARSHA_RULES = ["joy", "hemisphere", "sect", "gender"];
export const HARSHA_POINTS_PER_RULE = 5;

// The Tri-Pataki construction actually used: counted from the Moon's sign in
// the varsha chart, the twelve signs are dealt onto three flags in rotation.
export const TRIPATAKI_FLAGS = [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]];

export const NATURAL_BENEFICS = ["Jupiter", "Venus", "Mercury"];
export const NATURAL_MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];

// Saham table. `a` and `b` are longitude sources; `base` is added.
// Sources: a planet name, "Lagna" (annual ascendant), "LagnaLord" (longitude of
// the annual lagna lord), "Punya" (the Punya saham), "H2Cusp" / "H2Lord".
// `reverse: true` → at a night pravesh the first two terms swap (classical).
export const SAHAM_SPECS = [
  { key: "punya",     a: "Moon",    b: "Sun",       base: "Lagna", reverse: true },
  { key: "vidya",     a: "Sun",     b: "Moon",      base: "Lagna", reverse: true },
  { key: "yasas",     a: "Jupiter", b: "Punya",     base: "Lagna", reverse: true },
  { key: "mitra",     a: "Jupiter", b: "Punya",     base: "Venus", reverse: true },
  { key: "mahatmya",  a: "Mars",    b: "Punya",     base: "Lagna", reverse: true },
  { key: "asha",      a: "Saturn",  b: "Mars",      base: "Lagna", reverse: true },
  { key: "samartha",  a: "Mars",    b: "LagnaLord", base: "Lagna", reverse: true },
  { key: "bhratru",   a: "Jupiter", b: "Saturn",    base: "Lagna", reverse: true },
  { key: "pitru",     a: "Saturn",  b: "Sun",       base: "Lagna", reverse: true },
  { key: "matru",     a: "Moon",    b: "Venus",     base: "Lagna", reverse: true },
  { key: "putra",     a: "Jupiter", b: "Moon",      base: "Lagna", reverse: true },
  { key: "jeeva",     a: "Saturn",  b: "Jupiter",   base: "Lagna", reverse: true },
  { key: "karma",     a: "Mars",    b: "Mercury",   base: "Lagna", reverse: true },
  { key: "vivaha",    a: "Venus",   b: "Saturn",    base: "Lagna", reverse: true },
  { key: "roga",      a: "Lagna",   b: "Moon",      base: "Saturn", reverse: false },
  { key: "artha",     a: "H2Cusp",  b: "H2Lord",    base: "Lagna", reverse: false },
];

// Which houses + saham a life-area chapter reads. Static topic map.
export const LIFE_AREAS = [
  { key: "career",    houses: [10, 6], saham: "karma",    karaka: "Saturn" },
  { key: "finance",   houses: [2, 11], saham: "artha",    karaka: "Jupiter" },
  { key: "marriage",  houses: [7],     saham: "vivaha",   karaka: "Venus" },
  { key: "children",  houses: [5, 4],  saham: "putra",    karaka: "Jupiter" },
  { key: "health",    houses: [1, 6],  saham: "roga",     karaka: "Sun" },
  { key: "property",  houses: [4],     saham: "matru",    karaka: "Mars" },
  { key: "travel",    houses: [9, 12], saham: "asha",     karaka: "Moon" },
  { key: "education", houses: [5, 9],  saham: "vidya",    karaka: "Mercury" },
  { key: "legal",     houses: [6, 8],  saham: "mahatmya", karaka: "Mars" },
];

// Classical Vimshottari japa counts, used for the mantra schedule chapter.
export const JAPA_COUNT = {
  Sun: 7000, Moon: 11000, Mars: 10000, Mercury: 9000, Jupiter: 19000,
  Venus: 16000, Saturn: 23000, Rahu: 18000, Ketu: 17000,
};
export const PLANET_WEEKDAY = {
  Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6, Rahu: 6, Ketu: 2,
};
export const PLANET_NUMBER = { Sun: 1, Moon: 2, Jupiter: 3, Rahu: 4, Mercury: 5, Venus: 6, Ketu: 7, Saturn: 8, Mars: 9 };

// ── small maths helpers ──────────────────────────────────────────────────────

const norm360 = (x) => ((x % 360) + 360) % 360;
const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
const signIdx = (s) => SIGNS.indexOf(s);
export const houseFrom = (sign, lagnaSign) => ((signIdx(sign) - signIdx(lagnaSign) + 12) % 12) + 1;
export const signOfLon = (lon) => SIGNS[Math.floor(norm360(lon) / 30)];
export const degInSign = (lon) => norm360(lon) % 30;

export const DIGNITY_KEY = {
  "Highly Favorable": "exalted",
  Favorable: "own",
  Neutral: "neutral",
  Unfavorable: "debilitated",
};
export const dignityKeyOf = (intensity) => DIGNITY_KEY[intensity] || "neutral";
export const dignityScore = (intensity) => ({ exalted: 3, own: 2, neutral: 1, debilitated: -2 }[dignityKeyOf(intensity)] ?? 0);

function relationOf(planet, other) {
  if (planet === other) return "own";
  const r = NATURAL_RELATION[planet];
  if (!r) return "neutral";
  if (r.friend.includes(other)) return "friend";
  if (r.enemy.includes(other)) return "enemy";
  return "neutral";
}

function chartAtInstant(date, lat, lon, name = "Annual") {
  return buildCalculatedKundliData({
    fullName: name, gender: "male",
    birthDate: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    birthTime: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
    birthPlace: "", latitude: Number(lat), longitude: Number(lon), timezone: "UTC", language: "en",
  });
}

const sunLonAt = (ms, lat, lon) => chartAtInstant(new Date(ms), lat, lon).planets.find((p) => p.name === "Sun").longitude;

// Instant at which the sidereal Sun reaches `targetLon`, searched forward
// through [fromMs, toMs]. Bracket on a 12h grid, then 24 bisections (≈ 30 s).
// The window is anchored to the PREVIOUS crossing rather than to a linear
// estimate of the whole year: the Sun's daily motion swings between 0.95° and
// 1.02°, so a linear anchor drifts by several days by mid-year and can bracket
// the wrong ingress (which showed up as 28- and 33-day "solar months").
function findSunCrossing(targetLon, fromMs, toMs, lat, lon) {
  const step = 12 * 3600 * 1000;
  let prev = null;
  for (let ms = fromMs; ms <= toMs; ms += step) {
    const diff = angDiff(sunLonAt(ms, lat, lon), targetLon);
    if (prev && prev.diff < 0 && diff >= 0) {
      let lo = prev.ms, hi = ms;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (angDiff(sunLonAt(mid, lat, lon), targetLon) < 0) lo = mid; else hi = mid;
      }
      return new Date((lo + hi) / 2);
    }
    prev = { ms, diff };
  }
  return new Date((fromMs + toMs) / 2);
}

// ── Panchavargeeya Bala ──────────────────────────────────────────────────────

function navamshaSign(lon) {
  const si = Math.floor(norm360(lon) / 30);
  const part = Math.floor((norm360(lon) % 30) / (30 / 9));
  return SIGNS[(si * 9 + part) % 12];
}

function haddaLord(lon) {
  const sign = signOfLon(lon);
  const d = degInSign(lon);
  for (const [lord, upTo] of EGYPTIAN_TERMS[sign]) if (d < upTo) return lord;
  return EGYPTIAN_TERMS[sign][4][0];
}

export function computePanchavargeeya(planets) {
  return TAJIKA_PLANETS.map((name) => {
    const p = planets.find((x) => x.name === name);
    if (!p) return null;
    const dk = dignityKeyOf(p.intensity);
    const lord = SignLords[p.sign];

    const kshetra = dk === "exalted" || dk === "own" ? KSHETRA_STEP.ownOrExalted
      : dk === "debilitated" ? KSHETRA_STEP.debilitated
      : KSHETRA_STEP[relationOf(name, lord) === "own" ? "neutral" : relationOf(name, lord)] ?? KSHETRA_STEP.neutral;

    const sep = Math.abs(angDiff(p.longitude, EXALTATION_DEG[name]));
    const uchcha = Number((PANCHAVARGEEYA_MAX.uchcha * (1 - Math.abs(sep) / 180)).toFixed(2));

    const hl = haddaLord(p.longitude);
    const hadda = hl === name ? HADDA_STEP.own : HADDA_STEP[relationOf(name, hl)] ?? HADDA_STEP.neutral;

    const drekIdx = Math.floor(degInSign(p.longitude) / 10);
    const drekkana = drekIdx === DREKKANA_SLOT[PLANET_GENDER[name]] ? PANCHAVARGEEYA_MAX.drekkana : 0;

    const nav = navamshaSign(p.longitude);
    const navLord = SignLords[nav];
    const navamsha = navLord === name ? NAVAMSHA_STEP.own : NAVAMSHA_STEP[relationOf(name, navLord)] ?? NAVAMSHA_STEP.neutral;

    const total = Number((kshetra + uchcha + hadda + drekkana + navamsha).toFixed(2));
    const bala = Number((total / 4).toFixed(2)); // classical 0–20 vishwa scale
    const grade = bala >= 15 ? "veryStrong" : bala >= 10 ? "strong" : bala >= 5 ? "moderate" : "weak";
    return {
      planet: name, sign: p.sign, house: p.house, degree: Number(p.degree.toFixed(2)),
      kshetra, uchcha, hadda, drekkana, navamsha, total, bala, grade,
      haddaLord: hl, navamshaSign: nav, drekkanaIndex: drekIdx + 1,
    };
  }).filter(Boolean);
}

// ── Harsha Bala ──────────────────────────────────────────────────────────────

export function computeHarshaBala(planets, dayBirth) {
  const sun = planets.find((p) => p.name === "Sun");
  const mercury = planets.find((p) => p.name === "Mercury");
  // Mercury is diurnal when oriental (rises before the Sun).
  const mercurySect = mercury && angDiff(mercury.longitude, sun.longitude) < 0 ? "diurnal" : "nocturnal";

  return TAJIKA_PLANETS.map((name) => {
    const p = planets.find((x) => x.name === name);
    if (!p) return null;
    const sect = name === "Mercury" ? mercurySect : PLANET_SECT[name];
    const above = p.house >= 7 && p.house <= 12; // above the horizon
    const gender = PLANET_GENDER[name];
    const oddSign = signIdx(p.sign) % 2 === 0; // Aries, Gemini … are masculine

    const got = {
      joy: JOY_HOUSE[name] === p.house,
      hemisphere: sect === "diurnal" ? above : !above,
      sect: sect === (dayBirth ? "diurnal" : "nocturnal"),
      gender: gender === "male" ? oddSign : !oddSign, // female + neuter score in even signs
    };
    const scored = HARSHA_RULES.filter((r) => got[r]);
    const total = scored.length * HARSHA_POINTS_PER_RULE;
    const grade = total >= 20 ? "veryStrong" : total >= 15 ? "strong" : total >= 10 ? "moderate" : total >= 5 ? "weak" : "none";
    return { planet: name, house: p.house, sign: p.sign, sect, got, scored, total, grade };
  }).filter(Boolean);
}

// ── Tri-Pataki ───────────────────────────────────────────────────────────────

export function computeTriPataki(planets, waxingMoon) {
  const moon = planets.find((p) => p.name === "Moon");
  const moonSign = moon.sign;
  const benefics = new Set([...NATURAL_BENEFICS, ...(waxingMoon ? ["Moon"] : [])]);

  const flags = TRIPATAKI_FLAGS.map((counts, i) => {
    const members = planets
      .filter((p) => counts.includes(houseFrom(p.sign, moonSign)))
      .map((p) => ({ planet: p.name, abbr: PLANET_ABBR[p.name], sign: p.sign, fromMoon: houseFrom(p.sign, moonSign) }))
      .sort((a, b) => a.fromMoon - b.fromMoon);
    const ben = members.filter((m) => benefics.has(m.planet)).length;
    const mal = members.filter((m) => NATURAL_MALEFICS.includes(m.planet)).length;
    const net = ben - mal;
    return {
      index: i + 1, counts, members, benefics: ben, malefics: mal, net,
      verdict: net > 0 ? "supportive" : net < 0 ? "strained" : members.length ? "mixed" : "empty",
    };
  });
  return { moonSign, waxingMoon, flags, strongest: flags.slice().sort((a, b) => b.net - a.net)[0].index };
}

// ── Sahams ───────────────────────────────────────────────────────────────────

export function computeSahams(annual, dayBirth) {
  const lonOf = (n) => annual.planets.find((p) => p.name === n).longitude;
  const lagnaLon = annual.ascendant.longitude;
  const lagnaSign = annual.ascendant.sign;
  const lagnaLord = SignLords[lagnaSign];
  const h2 = annual.houses.find((h) => h.house === 2);

  const resolved = {};
  const source = (token) => {
    if (token === "Lagna") return lagnaLon;
    if (token === "LagnaLord") return lonOf(lagnaLord);
    if (token === "Punya") return resolved.punya;
    if (token === "H2Cusp") return h2.cuspStart;
    if (token === "H2Lord") return lonOf(h2.lord);
    return lonOf(token);
  };

  const out = [];
  for (const spec of SAHAM_SPECS) {
    const flip = spec.reverse && !dayBirth;
    const aTok = flip ? spec.b : spec.a;
    const bTok = flip ? spec.a : spec.b;
    const lon = norm360(source(aTok) - source(bTok) + source(spec.base));
    resolved[spec.key] = lon;
    const sign = signOfLon(lon);
    const lord = SignLords[sign];
    const lp = annual.planets.find((p) => p.name === lord);
    out.push({
      key: spec.key,
      formula: `${aTok} − ${bTok} + ${spec.base}`,
      reversedForNight: flip,
      longitude: Number(lon.toFixed(2)),
      sign, degree: Number(degInSign(lon).toFixed(2)),
      house: houseFrom(sign, lagnaSign),
      lord, lordHouse: lp?.house ?? null, lordSign: lp?.sign ?? null,
      lordDignity: dignityKeyOf(lp?.intensity),
      lordScore: dignityScore(lp?.intensity),
    });
  }
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────

const toPlacements = (planets) => planets.map((p) => ({
  planet: p.name, abbr: PLANET_ABBR[p.name], sign: p.sign, house: p.house,
  degree: Number(p.degree.toFixed(2)), retrograde: Boolean(p.retrograde),
  dignity: dignityKeyOf(p.intensity), nakshatra: p.nakshatra,
}));

export function computeVarshaphalFacts(input) {
  const { birthDate, birthTime, lat, lon } = input;
  const timezone = input.timezone || "Asia/Kolkata";

  // Legacy engine result — kept intact so the existing PDF renderer and the
  // report's `varshaphal` payload keep working unchanged.
  const legacy = computeVarshaphal({ ...input, timezone });

  const natal = buildCalculatedKundliData({
    fullName: input.name || "User", gender: input.gender || "male",
    birthDate, birthTime, birthPlace: input.pob || "",
    latitude: Number(lat), longitude: Number(lon), timezone, language: "en",
  });
  const natalSunLon = natal.planets.find((p) => p.name === "Sun").longitude;
  const natalLagnaSign = natal.ascendant.sign;

  const srDate = legacy.year.from;
  const annual = chartAtInstant(srDate, lat, lon, input.name || "Annual");
  const annualLagnaSign = annual.ascendant.sign;
  const sunHouse = annual.planets.find((p) => p.name === "Sun").house;
  const dayBirth = sunHouse >= 7 && sunHouse <= 12;
  const waxingMoon = annual.panchang.tithiNumber <= 15;

  // 12 solar months: the Sun at natal longitude + 30°·k. Each ingress is searched
  // forward from the previous one (a solar month is never shorter than 29.3 or
  // longer than 31.5 days), so the twelve windows are always contiguous.
  const monthBounds = [srDate];
  for (let k = 1; k <= 12; k++) {
    const prevMs = monthBounds[k - 1].getTime();
    const target = k === 12 ? natalSunLon : norm360(natalSunLon + 30 * k);
    monthBounds.push(findSunCrossing(target, prevMs + 26 * DAY_MS, prevMs + 35 * DAY_MS, lat, lon));
  }
  const yearEnd = monthBounds[12];

  const mudda = legacy.mudda;
  const months = [];
  for (let k = 0; k < 12; k++) {
    const start = monthBounds[k], end = monthBounds[k + 1];
    const mChart = chartAtInstant(start, lat, lon, input.name || "Masa");
    const overlaps = mudda
      .map((m) => {
        const o = Math.min(end.getTime(), m.end.getTime()) - Math.max(start.getTime(), m.start.getTime());
        return o > 0 ? { lord: m.lord, house: m.house, dignity: dignityKeyOf(m.condition), score: dignityScore(m.condition), days: Number((o / DAY_MS).toFixed(1)), start: m.start, end: m.end } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.days - a.days);
    const ruler = overlaps[0] || null;
    const munthaHouse = ((legacy.muntha.house - 1 + k) % 12) + 1;
    const sunSign = mChart.planets.find((p) => p.name === "Sun").sign;
    const score = (ruler?.score ?? 0) + ([1, 4, 5, 7, 9, 10, 11].includes(munthaHouse) ? 1 : [6, 8, 12].includes(munthaHouse) ? -2 : 0);
    months.push({
      index: k + 1, start, end,
      startMs: start.getTime(), endMs: end.getTime(),
      days: Number(((end - start) / DAY_MS).toFixed(1)),
      sunSign, sunHouse: houseFrom(sunSign, annualLagnaSign),
      munthaHouse,
      lagnaSign: mChart.ascendant.sign,
      lagnaLord: SignLords[mChart.ascendant.sign],
      moonSign: mChart.planets.find((p) => p.name === "Moon").sign,
      tithi: mChart.panchang.tithi, tithiNumber: mChart.panchang.tithiNumber,
      nakshatra: mChart.panchang.nakshatra,
      rulers: overlaps, ruler,
      score,
      tone: score >= 3 ? "strong" : score >= 1 ? "steady" : score <= -2 ? "testing" : "mixed",
    });
  }

  const sahams = computeSahams(annual, dayBirth);
  const panchavargeeya = computePanchavargeeya(annual.planets);
  const harsha = computeHarshaBala(annual.planets, dayBirth);
  const tripataki = computeTriPataki(annual.planets, waxingMoon);

  const comparison = ALL_PLANETS.map((n) => {
    const np = natal.planets.find((p) => p.name === n);
    const ap = annual.planets.find((p) => p.name === n);
    return {
      planet: n, abbr: PLANET_ABBR[n],
      natalSign: np.sign, natalHouse: np.house, natalDignity: dignityKeyOf(np.intensity),
      annualSign: ap.sign, annualHouse: ap.house, annualDignity: dignityKeyOf(ap.intensity),
      sameSign: np.sign === ap.sign,
      houseShift: ap.house - np.house,
      dignityShift: dignityScore(ap.intensity) - dignityScore(np.intensity),
    };
  });

  // The next Varsha Pravesh is exactly where this one ends.
  const nextSr = yearEnd;
  const nextMunthaSign = SIGNS[(signIdx(natalLagnaSign) + legacy.year.age + 1) % 12];

  const annualLordOfHouse = (h) => {
    const sign = SIGNS[(signIdx(annualLagnaSign) + h - 1) % 12];
    const lord = SignLords[sign];
    const p = annual.planets.find((x) => x.name === lord);
    return { house: h, sign, lord, lordHouse: p.house, lordSign: p.sign, lordDignity: dignityKeyOf(p.intensity), lordScore: dignityScore(p.intensity), lordRetro: Boolean(p.retrograde) };
  };
  const occupantsOf = (h) => annual.planets.filter((p) => p.house === h).map((p) => p.name);

  const strengthOrder = panchavargeeya.slice().sort((a, b) => b.bala - a.bala);

  return {
    legacy,
    subject: { name: input.name || "User", birthDate, birthTime, birthPlace: input.pob || "", lat: Number(lat), lon: Number(lon), timezone },
    year: {
      targetYear: legacy.year.targetYear, age: legacy.year.age,
      start: srDate, end: yearEnd, nextStart: nextSr,
      dayBirth, waxingMoon,
    },
    natal: {
      lagnaSign: natalLagnaSign, lagnaLord: SignLords[natalLagnaSign],
      moonSign: natal.astroDetails.sign, nakshatra: natal.panchang.nakshatra,
      nakshatraLord: natal.astroDetails.nakshatraLord,
      sunLongitude: Number(natalSunLon.toFixed(2)),
      placements: toPlacements(natal.planets),
      dasha: natal.dashas,
    },
    annual: {
      lagnaSign: annualLagnaSign, lagnaLord: SignLords[annualLagnaSign],
      lagnaDegree: Number(annual.ascendant.degree.toFixed(2)),
      moonSign: annual.planets.find((p) => p.name === "Moon").sign,
      nakshatra: annual.panchang.nakshatra,
      tithi: annual.panchang.tithi, tithiNumber: annual.panchang.tithiNumber,
      weekday: annual.panchang.weekday, weekdayIndex: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(annual.panchang.weekday),
      placements: toPlacements(annual.planets),
      houses: annual.houses.map((h) => ({ house: h.house, sign: h.sign, lord: h.lord, occupants: h.occupants })),
    },
    muntha: { ...legacy.muntha, lordPlacement: annual.planets.find((p) => p.name === legacy.muntha.lord) ? {
      house: annual.planets.find((p) => p.name === legacy.muntha.lord).house,
      sign: annual.planets.find((p) => p.name === legacy.muntha.lord).sign,
      dignity: dignityKeyOf(annual.planets.find((p) => p.name === legacy.muntha.lord).intensity),
    } : null },
    varshesh: { ...legacy.varshesh, dignity: dignityKeyOf(legacy.varshesh.condition) },
    candidates: legacy.candidates.map((c) => ({ ...c, dignity: dignityKeyOf(c.condition) })),
    mudda: mudda.map((m) => ({ lord: m.lord, house: m.house, dignity: dignityKeyOf(m.condition), score: dignityScore(m.condition), start: m.start, end: m.end })),
    months, sahams, panchavargeeya, harsha, tripataki, comparison,
    strongest: strengthOrder[0], weakest: strengthOrder[strengthOrder.length - 1],
    nextYear: {
      start: nextSr, munthaSign: nextMunthaSign,
      munthaLord: SignLords[nextMunthaSign],
      munthaHouseFromNatal: houseFrom(nextMunthaSign, natalLagnaSign),
      age: legacy.year.age + 1,
    },
    lordOfHouse: annualLordOfHouse,
    occupantsOf,
    sahamByKey: Object.fromEntries(sahams.map((s) => [s.key, s])),
    balaByPlanet: Object.fromEntries(panchavargeeya.map((p) => [p.planet, p])),
    harshaByPlanet: Object.fromEntries(harsha.map((p) => [p.planet, p])),
  };
}
