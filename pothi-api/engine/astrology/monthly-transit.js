// ─────────────────────────────────────────────────────────────────────────────
// Monthly transit computation layer — deterministic, ephemeris-driven.
// NO LLM, NO prose. Returns numbers and keys only; wording is applied later by
// engine/i18n/forecast-strings.js, so en/hi render from identical facts.
//
// Everything is read against THIS native's chart, never a sun-sign:
//   • one chart per calendar day at local midday (plus one day of lead-in and
//     ten days of look-ahead) — the spine every other fact is derived from;
//   • each transiting planet's sign, its house counted from the NATAL Lagna,
//     retrogression, and the exact day of any sign ingress inside the month;
//   • the day table: Moon sign, Moon house from Lagna, Chandra bala from the
//     natal Moon (good in 1,3,6,7,10,11 — Chandrashtama in the 8th), tithi;
//   • New/Full Moon instants by bisecting the Sun–Moon elongation;
//   • the running Vimshottari maha/antar/pratyantar and where those lords are
//     transiting this month.
// ─────────────────────────────────────────────────────────────────────────────

import { buildCalculatedKundliData, buildDashaWindows } from "./normalize-kundli-data.js";
import { computeMonthlyHoroscope } from "./transit-horoscope.js";
import { SIGNS, SignLords } from "./astro-constants.js";

const pad = (n) => String(n).padStart(2, "0");

export const TRANSIT_PLANETS = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
export const ALL_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const PLANET_ABBR = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

// Classical Chandra bala: the Moon supports when it transits these houses from
// the natal Moon sign. The 8th is Chandrashtama.
export const CHANDRA_BALA_GOOD = [1, 3, 6, 7, 10, 11];
export const CHANDRASHTAMA_HOUSE = 8;
export const CHANDRA_BALA_WEAK = [4, 8, 12];

export const NATURAL_BENEFICS = ["Jupiter", "Venus", "Mercury", "Moon"];
export const NATURAL_MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
// Houses a malefic transit is felt hardest in, counted from the natal Lagna.
export const SENSITIVE_HOUSES = [1, 4, 7, 8, 12];

export const PLANET_NUMBER = { Sun: 1, Moon: 2, Jupiter: 3, Rahu: 4, Mercury: 5, Venus: 6, Ketu: 7, Saturn: 8, Mars: 9 };
export const PLANET_WEEKDAY = { Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6, Rahu: 6, Ketu: 2 };
// Colour key per planet — resolved to a localized name + hex by the string pack.
export const PLANET_COLOUR = {
  Sun: "saffron", Moon: "white", Mars: "red", Mercury: "green",
  Jupiter: "yellow", Venus: "cream", Saturn: "blue", Rahu: "grey", Ketu: "brown",
};

// Which houses each life-area chapter reads, and its karaka.
export const MONTH_AREAS = [
  { key: "career", houses: [10, 6, 11], karaka: "Saturn" },
  { key: "money", houses: [2, 11, 12], karaka: "Jupiter" },
  { key: "love", houses: [5, 7], karaka: "Venus" },
  { key: "family", houses: [2, 4], karaka: "Moon" },
  { key: "health", houses: [1, 6, 8], karaka: "Sun" },
  { key: "travel", houses: [3, 9, 12], karaka: "Mercury" },
  { key: "education", houses: [4, 5, 9], karaka: "Mercury" },
  { key: "property", houses: [4, 12], karaka: "Mars" },
];

const DIGNITY_KEY = { "Highly Favorable": "exalted", Favorable: "own", Neutral: "neutral", Unfavorable: "debilitated" };
export const dignityKeyOf = (i) => DIGNITY_KEY[i] || "neutral";
export const dignityScore = (i) => ({ exalted: 3, own: 2, neutral: 1, debilitated: -2 }[dignityKeyOf(i)] ?? 0);

const norm360 = (x) => ((x % 360) + 360) % 360;
const signIdx = (s) => SIGNS.indexOf(s);
export const houseFrom = (sign, fromSign) => ((signIdx(sign) - signIdx(fromSign) + 12) % 12) + 1;

// A chart for local midday on a given calendar date.
function chartAtNoon(y, m, d, lat, lon, timezone) {
  return buildCalculatedKundliData({
    fullName: "T", gender: "male",
    birthDate: `${y}-${pad(m + 1)}-${pad(d)}`, birthTime: "12:00",
    birthPlace: "", latitude: Number(lat), longitude: Number(lon), timezone, language: "en",
  });
}

// A chart at an absolute UTC instant — used only to refine the New/Full Moon.
function chartAtInstant(date, lat, lon) {
  return buildCalculatedKundliData({
    fullName: "T", gender: "male",
    birthDate: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    birthTime: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
    birthPlace: "", latitude: Number(lat), longitude: Number(lon), timezone: "UTC", language: "en",
  });
}

const elongationOf = (chart) => norm360(
  chart.planets.find((p) => p.name === "Moon").longitude - chart.planets.find((p) => p.name === "Sun").longitude,
);

// Bisect the instant at which the Sun–Moon elongation crosses `target` (0 or
// 180), between two UTC instants that are known to bracket it.
function refinePhase(loMs, hiMs, target, lat, lon) {
  const rel = (ms) => {
    const e = elongationOf(chartAtInstant(new Date(ms), lat, lon));
    return ((e - target + 540) % 360) - 180;
  };
  let lo = loMs, hi = hiMs;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (rel(mid) < 0) lo = mid; else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

export function computeMonthlyFacts(input) {
  const { birthDate, birthTime, lat, lon } = input;
  const timezone = input.timezone || "Asia/Kolkata";
  const now = input.now ? new Date(input.now) : new Date();
  const year = input.year != null ? Number(input.year) : now.getUTCFullYear();
  const month = input.month != null ? Number(input.month) : now.getUTCMonth(); // 0-based

  // Legacy engine result — the existing PDF renderer and the report's
  // `horoscope` payload keep consuming exactly this shape.
  const legacy = computeMonthlyHoroscope({ ...input, timezone, year, month });

  const natal = buildCalculatedKundliData({
    fullName: input.name || "User", gender: input.gender || "male",
    birthDate, birthTime, birthPlace: input.pob || "",
    latitude: Number(lat), longitude: Number(lon), timezone, language: "en",
  });
  const lagnaSign = natal.ascendant.sign;
  const natalMoonSign = natal.astroDetails.sign;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // One chart per day: previous day (lead-in for ingress detection), the whole
  // month, and ten days of the next month for the outlook chapter.
  const rows = [];
  for (let offset = -1; offset <= daysInMonth + 10; offset++) {
    const d = new Date(Date.UTC(year, month, 1 + offset));
    const chart = chartAtNoon(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), lat, lon, timezone);
    rows.push({
      offset,
      date: d,
      iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      dom: d.getUTCDate(),
      weekday: d.getUTCDay(),
      inMonth: offset >= 0 && offset < daysInMonth,
      chart,
      signs: Object.fromEntries(chart.planets.map((p) => [p.name, p.sign])),
      retro: Object.fromEntries(chart.planets.map((p) => [p.name, Boolean(p.retrograde)])),
      dignity: Object.fromEntries(chart.planets.map((p) => [p.name, dignityKeyOf(p.intensity)])),
      elongation: elongationOf(chart),
    });
  }
  const byOffset = (o) => rows.find((r) => r.offset === o);
  const monthRows = rows.filter((r) => r.inMonth);
  const first = monthRows[0];
  const last = monthRows[monthRows.length - 1];
  const mid = monthRows[Math.floor(monthRows.length / 2)];

  // ── transits ───────────────────────────────────────────────────────────────
  const transits = TRANSIT_PLANETS.map((name) => {
    const startSign = first.signs[name];
    const endSign = last.signs[name];
    // A fast planet can change sign more than once inside a month, so every
    // crossing is kept — not just the first.
    const planetIngresses = [];
    for (const r of monthRows) {
      const prev = byOffset(r.offset - 1);
      if (prev && prev.signs[name] !== r.signs[name]) {
        planetIngresses.push({
          date: r.date, iso: r.iso, dom: r.dom,
          fromSign: prev.signs[name], toSign: r.signs[name],
          fromHouse: houseFrom(prev.signs[name], lagnaSign),
          toHouse: houseFrom(r.signs[name], lagnaSign),
        });
      }
    }
    const ingress = planetIngresses[0] || null;
    const retroDays = monthRows.filter((r) => r.retro[name]).length;
    return {
      planet: name, abbr: PLANET_ABBR[name],
      startSign, endSign,
      startHouse: houseFrom(startSign, lagnaSign),
      house: houseFrom(endSign, lagnaSign),
      dignity: mid.dignity[name],
      retrograde: retroDays > 0,
      retrogradeAllMonth: retroDays === monthRows.length,
      retroDays,
      benefic: NATURAL_BENEFICS.includes(name),
      ingress, ingresses: planetIngresses,
    };
  });
  const ingresses = transits
    .flatMap((t) => t.ingresses.map((g) => ({ planet: t.planet, ...g })))
    .sort((a, b) => a.date - b.date);

  // ── day table ──────────────────────────────────────────────────────────────
  const days = monthRows.map((r) => {
    const moonSign = r.signs.Moon;
    const fromMoon = houseFrom(moonSign, natalMoonSign);
    const dayIngress = ingresses.filter((i) => i.iso === r.iso).map((i) => i.planet);
    const chandraBala = fromMoon === CHANDRASHTAMA_HOUSE ? "chandrashtama"
      : CHANDRA_BALA_GOOD.includes(fromMoon) ? "good"
      : CHANDRA_BALA_WEAK.includes(fromMoon) ? "weak" : "neutral";
    return {
      iso: r.iso, dom: r.dom, weekday: r.weekday, date: r.date,
      moonSign, moonHouse: houseFrom(moonSign, lagnaSign), moonFromNatalMoon: fromMoon,
      chandraBala,
      tithi: r.chart.panchang.tithi, tithiNumber: r.chart.panchang.tithiNumber,
      paksha: r.chart.panchang.tithiNumber <= 15 ? "shukla" : "krishna",
      nakshatra: r.chart.panchang.nakshatra,
      ingressPlanets: dayIngress,
      rating: chandraBala === "good" ? 1 : chandraBala === "chandrashtama" ? -2 : chandraBala === "weak" ? -1 : 0,
    };
  });

  const weeks = [0, 1, 2, 3].map((w) => ({
    index: w + 1,
    days: days.slice(w * 7, w === 3 ? days.length : (w + 1) * 7),
  }));

  // ── moon phases ────────────────────────────────────────────────────────────
  const phases = [];
  for (const r of monthRows) {
    const prev = byOffset(r.offset - 1);
    if (!prev) continue;
    for (const [type, target] of [["new", 0], ["full", 180]]) {
      const a = ((prev.elongation - target + 540) % 360) - 180;
      const b = ((r.elongation - target + 540) % 360) - 180;
      if (a < 0 && b >= 0) {
        const at = refinePhase(prev.date.getTime() + 12 * 3600000, r.date.getTime() + 12 * 3600000, target, lat, lon);
        const c = chartAtInstant(at, lat, lon);
        const ms = c.planets.find((p) => p.name === "Moon").sign;
        phases.push({
          type, date: at, iso: `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}-${pad(at.getUTCDate())}`,
          moonSign: ms, house: houseFrom(ms, lagnaSign), fromNatalMoon: houseFrom(ms, natalMoonSign),
        });
      }
    }
  }
  phases.sort((x, y) => x.date - y.date);

  // ── dasha context ──────────────────────────────────────────────────────────
  let windows = [];
  try {
    windows = buildDashaWindows({
      moonLongitude: natal.planets.find((p) => p.name === "Moon").longitude,
      birthUtc: new Date(natal.calculationMeta.birthUtc),
      fromDate: first.date, years: 2, lookbackYears: 1,
    });
  } catch { windows = []; }
  const activeWindow = windows.find((w) => w.active) || null;
  const dashaLords = [natal.dashas.currentMahaDasha, natal.dashas.currentAntarDasha, natal.dashas.currentPratyantarDasha];
  const dasha = {
    maha: natal.dashas.currentMahaDasha,
    antar: natal.dashas.currentAntarDasha,
    pratyantar: natal.dashas.currentPratyantarDasha,
    window: activeWindow,
    upcoming: windows.filter((w) => !w.past && !w.active).slice(0, 3),
    lords: [...new Set(dashaLords)].map((lord) => {
      const nat = natal.planets.find((p) => p.name === lord);
      const tr = transits.find((t) => t.planet === lord);
      return {
        lord,
        natalHouse: nat?.house ?? null, natalSign: nat?.sign ?? null,
        natalDignity: dignityKeyOf(nat?.intensity),
        transitSign: tr ? tr.endSign : mid.signs[lord],
        transitHouse: tr ? tr.house : houseFrom(mid.signs[lord], lagnaSign),
      };
    }),
  };

  // ── lucky days / colours / numbers ─────────────────────────────────────────
  const lagnaLord = SignLords[lagnaSign];
  const moonLord = SignLords[natalMoonSign];
  const luckyDays = days.filter((d) => d.chandraBala === "good").map((d) => d.dom);
  const luckyWeekdays = [...new Set([PLANET_WEEKDAY[lagnaLord], PLANET_WEEKDAY[moonLord]])];
  const lucky = {
    lagnaLord, moonLord,
    days: luckyDays,
    bestDays: days.filter((d) => d.chandraBala === "good" && luckyWeekdays.includes(d.weekday)).map((d) => d.dom),
    weekdays: luckyWeekdays,
    colours: [...new Set([PLANET_COLOUR[lagnaLord], PLANET_COLOUR[moonLord]])],
    numbers: [...new Set([PLANET_NUMBER[lagnaLord], PLANET_NUMBER[moonLord]])],
  };

  // ── cautions ───────────────────────────────────────────────────────────────
  const cautions = {
    chandrashtama: days.filter((d) => d.chandraBala === "chandrashtama").map((d) => d.dom),
    weak: days.filter((d) => d.chandraBala === "weak").map((d) => d.dom),
    retrograde: transits.filter((t) => t.retrograde).map((t) => ({ planet: t.planet, house: t.house, days: t.retroDays })),
    maleficHouses: transits
      .filter((t) => NATURAL_MALEFICS.includes(t.planet) && SENSITIVE_HOUSES.includes(t.house))
      .map((t) => ({ planet: t.planet, house: t.house, dignity: t.dignity })),
  };

  // ── next month look-ahead ──────────────────────────────────────────────────
  const lookahead = rows.filter((r) => r.offset >= daysInMonth);
  const nextIngresses = [];
  for (const r of lookahead) {
    const prev = byOffset(r.offset - 1);
    if (!prev) continue;
    for (const name of TRANSIT_PLANETS) {
      if (prev.signs[name] !== r.signs[name]) {
        nextIngresses.push({
          planet: name, date: r.date, iso: r.iso, dom: r.dom,
          fromSign: prev.signs[name], toSign: r.signs[name],
          toHouse: houseFrom(r.signs[name], lagnaSign),
        });
      }
    }
  }
  const nextOpen = lookahead[0];
  const nextClose = lookahead[lookahead.length - 1];
  const nextMonth = {
    index: (month + 1) % 12,
    year: month === 11 ? year + 1 : year,
    days: lookahead.length,
    // Where each planet stands on the FIRST day of the next month, plus whether
    // it moves again inside the look-ahead window.
    transits: TRANSIT_PLANETS.map((name) => ({
      planet: name, sign: nextOpen.signs[name],
      house: houseFrom(nextOpen.signs[name], lagnaSign),
      changed: nextClose.signs[name] !== nextOpen.signs[name],
      laterSign: nextClose.signs[name],
      laterHouse: houseFrom(nextClose.signs[name], lagnaSign),
    })),
    ingresses: nextIngresses,
  };

  // ── house activity summary ─────────────────────────────────────────────────
  const byHouse = {};
  transits.forEach((t) => { (byHouse[t.house] = byHouse[t.house] || []).push(t.planet); });
  const busiestHouse = Object.entries(byHouse).sort((a, b) => b[1].length - a[1].length)[0];

  const areaFor = (spec) => {
    const hits = transits.filter((t) => spec.houses.includes(t.house));
    const lords = spec.houses.map((h) => {
      const sign = SIGNS[(signIdx(lagnaSign) + h - 1) % 12];
      const lord = SignLords[sign];
      const nat = natal.planets.find((p) => p.name === lord);
      const tr = transits.find((t) => t.planet === lord);
      return {
        house: h, sign, lord,
        natalHouse: nat?.house ?? null, natalDignity: dignityKeyOf(nat?.intensity),
        transitSign: tr ? tr.endSign : mid.signs[lord],
        transitHouse: tr ? tr.house : houseFrom(mid.signs[lord], lagnaSign),
        retrograde: tr ? tr.retrograde : false,
      };
    });
    const karaka = transits.find((t) => t.planet === spec.karaka) || null;
    const benefics = hits.filter((t) => t.benefic).map((t) => t.planet);
    const malefics = hits.filter((t) => !t.benefic).map((t) => t.planet);
    const net = benefics.length - malefics.length;
    const ing = ingresses.filter((i) => spec.houses.includes(i.toHouse));
    return {
      key: spec.key, houses: spec.houses, hits, lords, karaka, benefics, malefics, net, ingresses: ing,
      verdict: net > 0 ? "supportive" : net < 0 ? "demanding" : hits.length ? "mixed" : "quiet",
      bestDays: days.filter((d) => spec.houses.includes(d.moonHouse) && d.chandraBala !== "chandrashtama").map((d) => d.dom),
    };
  };

  return {
    legacy,
    subject: { name: input.name || "User", birthDate, birthTime, birthPlace: input.pob || "", timezone },
    month: {
      index: month, year, days: daysInMonth,
      startIso: first.iso, endIso: last.iso,
      start: first.date, end: last.date,
    },
    natal: {
      lagnaSign, lagnaLord, moonSign: natalMoonSign, moonLord,
      nakshatra: natal.panchang.nakshatra,
      placements: natal.planets.map((p) => ({
        planet: p.name, abbr: PLANET_ABBR[p.name], sign: p.sign, house: p.house,
        degree: Number(p.degree.toFixed(2)), retrograde: Boolean(p.retrograde), dignity: dignityKeyOf(p.intensity),
      })),
      houses: natal.houses.map((h) => ({ house: h.house, sign: h.sign, lord: h.lord, occupants: h.occupants })),
    },
    transitPlacements: transits.map((t) => ({
      planet: t.planet, abbr: t.abbr, sign: t.endSign, house: t.house,
      degree: Number(mid.chart.planets.find((p) => p.name === t.planet).degree.toFixed(2)),
      retrograde: t.retrograde, dignity: t.dignity,
    })),
    transits, ingresses, days, weeks, phases, dasha, lucky, cautions, nextMonth,
    byHouse, busiestHouse: busiestHouse ? { house: Number(busiestHouse[0]), planets: busiestHouse[1] } : null,
    sunHouse: transits.find((t) => t.planet === "Sun").house,
    areas: Object.fromEntries(MONTH_AREAS.map((s) => [s.key, areaFor(s)])),
    profile: { rashi: natalMoonSign, nakshatra: natal.panchang.nakshatra, lagna: lagnaSign },
  };
}
