// In-house Monthly Horoscope report — deterministic transits, NO LLM.
// The month is read against THIS native's chart (transits mapped onto the natal
// houses, one computed chart per day for the week tables), and every sentence is
// a template from engine/i18n/forecast-strings.js filled with computed values.
//
// The report is the 22 chapters published for astro_chart_listing id = 4.
// Contract: generateInhouseHoroscope(input) → { report, pdfBuffer, kundliData:null }

import tzlookup from "tz-lookup";

import { computeMonthlyFacts } from "../astrology/monthly-transit.js";
import { buildHoroscopeSections } from "../mapping/horoscope-chapters.js";
import { getPack, localizeDates } from "../i18n/forecast-strings.js";
import { buildHoroscopePdf } from "../reporting/render-horoscope-pdfkit.js";

const pad = (n) => String(n).padStart(2, "0");

function normalizeBirthDate(dob) {
  if (!dob) throw new Error("dob is required");
  let y, m, d;
  if (dob.includes("-")) [y, m, d] = dob.split("-").map(Number);
  else if (dob.includes("/")) [d, m, y] = dob.split("/").map(Number);
  else throw new Error("dob must be YYYY-MM-DD or DD/MM/YYYY");
  if (!y || !m || !d) throw new Error(`could not parse dob: ${dob}`);
  return `${y}-${pad(m)}-${pad(d)}`;
}
function normalizeBirthTime(tob) {
  if (!tob) return "12:00";
  const m = String(tob).trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) return "12:00";
  let h = parseInt(m[1], 10); const min = parseInt(m[2], 10);
  if (m[3] === "PM" && h !== 12) h += 12; if (m[3] === "AM" && h === 12) h = 0;
  return `${pad(h)}:${pad(min)}`;
}
function resolveTimezone(lat, lon) {
  try { const tz = tzlookup(Number(lat), Number(lon)); if (tz) return tz; } catch { /* */ }
  return "Asia/Kolkata";
}

export async function generateInhouseHoroscope(input) {
  const language = input.language === "hi" ? "hi" : "en";
  const birthDate = normalizeBirthDate(input.dob);
  const birthTime = normalizeBirthTime(input.tob);
  const timezone = resolveTimezone(input.lat, input.lon);

  const facts = computeMonthlyFacts({
    name: input.name, birthDate, birthTime,
    lat: input.lat, lon: input.lon, timezone,
    gender: input.gender, pob: input.pob,
    year: input.year, month: input.month, now: input.now,
  });

  const P = getPack(language);
  const sections = buildHoroscopeSections(facts, P);
  // Dasha windows arrive pre-formatted with English months; Hindi reports
  // need them in Devanagari.
  const localized = language === "hi" ? localizeDates(sections) : sections;

  const goodDays = facts.days.filter((d) => d.chandraBala === "good");
  const hardDays = facts.days.filter((d) => d.chandraBala === "chandrashtama" || d.chandraBala === "weak");
  const remedySection = sections[20];
  const remedyPlanet = remedySection?.data?.remedyPlanet || facts.dasha.antar;
  const R = P.remedy(remedyPlanet);

  const overall_summary = P.t.hsSummary({
    month: P.monthName(facts.month.index), year: facts.month.year,
    sunHouse: facts.sunHouse,
    ingressCount: facts.ingresses.length,
    retroCount: facts.transits.filter((t) => t.retrograde).length,
    goodDays: goodDays.length, hardDays: hardDays.length,
    lagna: P.sign(facts.natal.lagnaSign),
    maha: P.planet(facts.dasha.maha), antar: P.planet(facts.dasha.antar),
  });

  const general_recommendation = P.t.hsRecommendation({
    bestDays: facts.lucky.bestDays.join(", "),
    goodDays: facts.lucky.days.join(", "),
    avoidDays: facts.cautions.chandrashtama.join(", "),
    planet: P.planet(remedyPlanet), act: R.act,
  });

  const h = facts.legacy;
  const report = {
    generated_by: "inhouse_horoscope",
    chart_id: 4,
    language,
    kundali_profile: {
      ...facts.profile,
      placements: facts.natal.placements,
      transit_placements: facts.transitPlacements,
      house_signs: facts.natal.houses,
    },
    overall_summary,
    sections: localized,
    general_recommendation,
    horoscope: {
      month: h.month, transits: h.transits, keyDates: h.keyDates, areas: h.areas,
      // Structured transit layer — tables and day grids render from these.
      window: { start: facts.month.start, end: facts.month.end, days: facts.month.days },
      transitPlacements: facts.transitPlacements,
      ingresses: facts.ingresses,
      dayTable: facts.days.map(({ date, ...d }) => d),
      weeks: facts.weeks.map((w) => ({ index: w.index, days: w.days.map((d) => d.iso) })),
      phases: facts.phases,
      dasha: facts.dasha,
      lucky: facts.lucky,
      cautions: facts.cautions,
      nextMonth: facts.nextMonth,
      remedyPlanet,
    },
  };

  const pdfBuffer = await buildHoroscopePdf({ horoscope: h });
  return { report, pdfBuffer, kundliData: null };
}
