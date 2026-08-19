// In-house Varshaphal (Tajika annual) report — deterministic, ephemeris-driven.
// NO LLM anywhere in this path: every sentence is a template in
// engine/i18n/forecast-strings.js filled with values computed by
// engine/astrology/tajika.js, and every chapter carries the structured
// `placements` the UI draws its chart diagram from.
//
// The report is the 40 chapters published for astro_chart_listing id = 7.
// Contract: generateInhouseVarshaphal(input) → { report, pdfBuffer, kundliData:null }

import tzlookup from "tz-lookup";

import { computeVarshaphalFacts, PLANET_WEEKDAY } from "../astrology/tajika.js";
import { buildVarshaphalSections } from "../mapping/varshaphal-chapters.js";
import { getPack, localizeDates } from "../i18n/forecast-strings.js";
import { buildVarshaphalPdf } from "../reporting/render-varshaphal-pdfkit.js";

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

// Concise, well-known strengthening remedies per year-lord — used by the PDF,
// which is rendered in English (Helvetica) exactly as before.
const YEAR_LORD_UPAAY = {
  Sun: ["Offer water to the Sun at sunrise through the year.", "Recite Aditya Hridaya / 'Om Suryaya Namah' on Sundays.", "Respect and serve your father and elders."],
  Moon: ["Offer milk/water at a Shiva temple on Mondays.", "Chant 'Om Chandraya Namah'; keep a silver item.", "Care for your mother; keep the home clean and calm."],
  Mars: ["Recite Hanuman Chalisa on Tuesdays; offer red masoor.", "Chant 'Om Mangalaya Namah'; avoid needless conflict.", "Donate sweets to children; keep courage disciplined."],
  Mercury: ["Feed green fodder to cows; donate green moong on Wednesdays.", "Chant 'Om Budhaya Namah'; keep speech truthful.", "Respect sisters and daughters; study/teach with care."],
  Jupiter: ["Offer besan-laddu/bananas and haldi tilak on Thursdays.", "Chant 'Om Gurave Namah'; water a peepal tree.", "Serve teachers, elders and priests; give to the needy."],
  Venus: ["Donate white items (curd, rice, silver) on Fridays.", "Chant 'Om Shukraya Namah'; keep fragrance and cleanliness.", "Respect the spouse and women; support the arts."],
  Saturn: ["Serve labourers and the poor; feed crows/dogs on Saturdays.", "Offer mustard oil at a Shani/Hanuman temple; chant 'Om Shanaischaraya Namah'.", "Keep conduct honest and disciplined; avoid intoxicants."],
  Rahu: ["Donate to the destitute; keep a solid silver item.", "Chant 'Om Rahave Namah'; avoid deceit and shortcuts.", "Keep the head covered in temples; respect in-laws."],
  Ketu: ["Feed dogs (especially black/spotted); serve at a temple.", "Chant 'Om Ketave Namah'; donate a two-coloured blanket.", "Honour the spiritual path; keep ears/feet clean."],
};

export async function generateInhouseVarshaphal(input) {
  const language = input.language === "hi" ? "hi" : "en";
  const birthDate = normalizeBirthDate(input.dob);
  const birthTime = normalizeBirthTime(input.tob);
  const timezone = resolveTimezone(input.lat, input.lon);

  const facts = computeVarshaphalFacts({
    name: input.name, birthDate, birthTime,
    lat: input.lat, lon: input.lon, timezone,
    gender: input.gender, pob: input.pob,
  });

  const P = getPack(language);
  const sections = buildVarshaphalSections(facts, P);
  // Dasha windows arrive pre-formatted with English months; Hindi reports
  // need them in Devanagari.
  const localized = language === "hi" ? localizeDates(sections) : sections;

  const goodMonths = facts.months.filter((m) => m.score >= 1);
  const hardMonths = facts.months.filter((m) => m.score <= 0);
  const keyMonth = facts.months.slice().sort((a, b) => b.score - a.score)[0];
  const R = P.remedy(facts.varshesh.lord);

  const overall_summary = P.t.vpSummary({
    age: facts.year.age,
    from: P.fmtDate(facts.year.start), to: P.fmtDate(facts.year.end),
    varshesh: P.planet(facts.varshesh.lord),
    varsheshHouse: facts.varshesh.house,
    varsheshDignity: P.dignity(facts.varshesh.dignity),
    munthaHouse: facts.muntha.house,
    strongest: P.planet(facts.strongest.planet),
    weakest: P.planet(facts.weakest.planet),
    goodMonths: goodMonths.length, hardMonths: hardMonths.length,
  });

  const general_recommendation = P.t.vpRecommendation({
    lord: P.planet(facts.varshesh.lord), act: R.act, mantra: R.mantra,
    weekday: P.weekday(PLANET_WEEKDAY[facts.varshesh.lord]),
    keyMonth: keyMonth.index, keyDates: P.range(keyMonth.start, keyMonth.end),
    hardMonths: hardMonths.map((m) => m.index).join(", "),
  });

  const v = facts.legacy;
  const report = {
    generated_by: "inhouse_varshaphal",
    chart_id: 7,
    language,
    kundali_profile: {
      ...v.profile,
      placements: facts.natal.placements,
      annual_placements: facts.annual.placements,
      house_signs: facts.annual.houses,
    },
    overall_summary,
    sections: localized,
    general_recommendation,
    varshaphal: {
      year: v.year, muntha: v.muntha, varshesh: v.varshesh, annualLagna: v.annualLagna,
      candidates: v.candidates, mudda: v.mudda.map(({ start, end, ...m }) => m), annualPlanets: v.annualPlanets,
      // Tajika layer — structured so the UI can render tables/diagrams directly.
      solarReturn: { start: facts.year.start, end: facts.year.end, next: facts.nextYear.start, dayPravesh: facts.year.dayBirth },
      sahams: facts.sahams,
      panchavargeeya: facts.panchavargeeya,
      harsha: facts.harsha,
      tripataki: facts.tripataki,
      months: facts.months.map(({ rulers, ruler, ...m }) => ({ ...m, ruler, rulers })),
      comparison: facts.comparison,
      nextYear: facts.nextYear,
    },
  };

  const remedies = YEAR_LORD_UPAAY[v.varshesh.lord] || [];
  const pdfBuffer = await buildVarshaphalPdf({ varshaphal: v, remedies });
  return { report, pdfBuffer, kundliData: null };
}
