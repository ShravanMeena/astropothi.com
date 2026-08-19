// ─────────────────────────────────────────────────────────────────────────────
// Monthly Horoscope — transits over the natal chart. Deterministic (NO LLM).
//
// For the target calendar month, computes each planet's sign at the month's
// start and end from the ephemeris, maps it onto the NATAL houses (whole-sign
// from the natal Lagna), detects sign-ingresses within the month (dated), and
// produces per-planet readings + life-area sections + key dates. Moon is
// summarised (too fast for a monthly card).
// ─────────────────────────────────────────────────────────────────────────────

import { buildCalculatedKundliData } from "./normalize-kundli-data.js";
import { SIGNS } from "./astro-constants.js";

const pad = (n) => String(n).padStart(2, "0");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const KARAKA = {
  Sun: "vitality, recognition and confidence", Mercury: "communication, deals, learning and travel",
  Venus: "love, money, comfort and relationships", Mars: "energy, drive, courage and initiative",
  Jupiter: "growth, fortune, wisdom and opportunity", Saturn: "discipline, work, tests and patience",
  Rahu: "ambition, sudden turns and desire", Ketu: "detachment, endings and inner focus",
};
const HOUSE_AREA = {
  1: "your self, health and overall drive", 2: "money, family and speech", 3: "courage, siblings and communication",
  4: "home, mother, property and peace", 5: "romance, children and creativity", 6: "work, health, rivals and routine",
  7: "partnerships, marriage and business", 8: "change, shared resources and the unexpected", 9: "luck, travel, learning and dharma",
  10: "career, status and public life", 11: "income, gains and networks", 12: "expenses, rest, foreign matters and closure",
};
const TRANSIT_PLANETS = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];

function chartAtInstant(date, lat, lon) {
  return buildCalculatedKundliData({
    fullName: "T", gender: "male",
    birthDate: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    birthTime: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
    birthPlace: "", latitude: Number(lat), longitude: Number(lon), timezone: "UTC", language: "en",
  });
}
const planetSignAt = (date, lat, lon, name) => {
  const p = chartAtInstant(date, lat, lon).planets.find((pl) => pl.name === name);
  return { sign: p.sign, retrograde: p.retrograde };
};
const signIdx = (s) => SIGNS.indexOf(s);
const houseOf = (sign, lagnaSign) => ((signIdx(sign) - signIdx(lagnaSign) + 12) % 12) + 1;
const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

// Find the day a planet enters `toSign` within [startMs, endMs] (daily scan).
function findIngress(name, lat, lon, startMs, endMs, toSign) {
  let prev = new Date(startMs);
  for (let ms = startMs + 86400000; ms <= endMs; ms += 86400000) {
    const d = new Date(ms);
    if (planetSignAt(d, lat, lon, name).sign === toSign) {
      // bisect between prev and d
      let lo = prev.getTime(), hi = ms;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        if (planetSignAt(new Date(mid), lat, lon, name).sign === toSign) hi = mid; else lo = mid;
      }
      return new Date(hi);
    }
    prev = d;
  }
  return null;
}

export function computeMonthlyHoroscope(input) {
  const { name, birthDate, birthTime, lat, lon, timezone } = input;
  const now = input.now ? new Date(input.now) : new Date();
  const year = input.year || now.getUTCFullYear();
  const month = (input.month != null ? input.month : now.getUTCMonth()); // 0-based

  const natal = buildCalculatedKundliData({
    fullName: name || "User", gender: input.gender || "male",
    birthDate, birthTime, birthPlace: input.pob || "",
    latitude: Number(lat), longitude: Number(lon), timezone: timezone || "Asia/Kolkata", language: "en",
  });
  const lagnaSign = natal.ascendant.sign;

  const startMs = Date.UTC(year, month, 1, 6, 0, 0);
  const endMs = Date.UTC(year, month + 1, 0, 18, 0, 0);
  const midMs = (startMs + endMs) / 2;

  const transits = [];
  const keyDates = [];

  for (const planet of TRANSIT_PLANETS) {
    const a = planetSignAt(new Date(startMs), lat, lon, planet);
    const b = planetSignAt(new Date(endMs), lat, lon, planet);
    const retro = planetSignAt(new Date(midMs), lat, lon, planet).retrograde;
    const house = houseOf(b.sign, lagnaSign);
    const area = HOUSE_AREA[house];

    let ingress = null;
    if (a.sign !== b.sign) {
      const dt = findIngress(planet, lat, lon, startMs, endMs, b.sign);
      if (dt) {
        ingress = { date: dt, dateLabel: fmt(dt), fromSign: a.sign, toSign: b.sign, fromHouse: houseOf(a.sign, lagnaSign), toHouse: house };
        keyDates.push({ ts: dt.getTime(), date: dt, label: `${fmt(dt)} — ${planet} enters ${b.sign} (your ${ordinal(house)} house)` });
      }
    }

    const tone = ["Jupiter", "Venus"].includes(planet) ? "brings support and openings to" :
      ["Saturn", "Mars", "Rahu", "Ketu"].includes(planet) ? "asks for patience and care with" : "puts focus on";
    const reading =
      `${planet} transits your ${ordinal(house)} house this month — ${area}. Carrying ${KARAKA[planet]}, it ${tone} this area.` +
      (ingress ? ` It moves from your ${ordinal(ingress.fromHouse)} to the ${ordinal(ingress.toHouse)} house on ${ingress.dateLabel}, shifting the emphasis.` : "") +
      (retro ? ` It is retrograde — expect review, delay and second chances here.` : "");

    transits.push({ planet, sign: b.sign, natalHouse: house, area, retrograde: retro, ingress, reading });
  }

  keyDates.sort((x, y) => x.ts - y.ts);

  // Life-area synthesis from which houses are activated.
  const byHouse = {};
  transits.forEach((t) => { (byHouse[t.natalHouse] = byHouse[t.natalHouse] || []).push(t.planet); });
  const area = (houses, label) => {
    const hits = transits.filter((t) => houses.includes(t.natalHouse));
    if (!hits.length) return `${label}: a quieter month here — steady, no major transit pressure.`;
    return `${label}: ${hits.map((t) => `${t.planet} in your ${ordinal(t.natalHouse)}`).join(", ")} — ${hits.some((t) => ["Jupiter", "Venus"].includes(t.planet)) ? "favourable movement, act on openings" : "progress with patience and effort"}.`;
  };

  const areas = {
    career: area([10, 6, 2, 11], "Career & Money"),
    love: area([5, 7], "Love & Relationships"),
    health: area([1, 6, 8], "Health & Energy"),
    growth: area([9, 3], "Learning & Travel"),
  };

  const sun = transits.find((t) => t.planet === "Sun");
  const summary =
    `Through ${MONTHS[month]} ${year}, the Sun lights up your ${ordinal(sun.natalHouse)} house (${sun.area}). ` +
    (keyDates.length ? `Watch the dated shifts below — ${keyDates.length} planetary ingress${keyDates.length > 1 ? "es" : ""} reshape the month. ` : "No major sign-changes this month — a steady run. ") +
    `The transits are read against YOUR birth chart (Lagna ${lagnaSign}), not a generic sun-sign.`;

  return {
    subject: { name: name || "User", birthDate, birthTime, birthPlace: input.pob || "" },
    month: { index: month, name: MONTHS[month], year, from: new Date(startMs), to: new Date(endMs), fromLabel: fmt(new Date(startMs)), toLabel: fmt(new Date(endMs)) },
    profile: { rashi: natal.astroDetails.sign, nakshatra: natal.panchang.nakshatra, lagna: lagnaSign },
    summary,
    transits,
    keyDates: keyDates.map(({ ts, date, ...k }) => ({ ...k, dateLabel: fmt(date) })),
    areas,
  };
}

function ordinal(n) { const s = ["th", "st", "nd", "rd"], k = n % 100; return n + (s[(k - 20) % 10] || s[k] || s[0]); }
