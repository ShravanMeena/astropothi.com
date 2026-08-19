// In-house Health Chart report — deterministic, NO LLM.
//
// Reads the SAME computed chart the Premium Kundali is built from, then selects
// and judges the parts this report is about. Every sentence is a template from
// engine/i18n/life-strings.js filled with values computed from the native's own
// placements.
//
// The report is the 26 chapters published for astro_chart_listing id = 2.
// Contract: generateInhouseHealth(input) → { report, pdfBuffer, kundliData }

import tzlookup from "tz-lookup";

import { buildCalculatedKundliData } from "../astrology/normalize-kundli-data.js";
import { computeLifeFacts } from "../astrology/life-facts.js";
import { buildHealthSections } from "../mapping/health-chapters.js";
import { getLifePack } from "../i18n/life-strings.js";
import { buildKundliSectionsPdf } from "../reporting/render-report-pdfkit.js";

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
  if (m[3] === "PM" && h !== 12) h += 12;
  if (m[3] === "AM" && h === 12) h = 0;
  return `${pad(h)}:${pad(min)}`;
}

function resolveTimezone(lat, lon) {
  try { const tz = tzlookup(Number(lat), Number(lon)); if (tz) return tz; } catch { /* fall through */ }
  return "Asia/Kolkata";
}

export async function generateInhouseHealth(input) {
  const { name, dob, tob, pob, lat, lon, gender, branding } = input;
  const language = input.language === "hi" ? "hi" : "en";
  const astroGender = gender === "male" || gender === "female" || gender === "other" ? gender : "male";

  const request = {
    fullName: name || "User",
    gender: astroGender,
    birthDate: normalizeBirthDate(dob),
    birthTime: normalizeBirthTime(tob),
    birthPlace: pob || "",
    latitude: Number(lat),
    longitude: Number(lon),
    timezone: resolveTimezone(lat, lon),
    language,
  };

  const kundliData = buildCalculatedKundliData(request);
  const facts = computeLifeFacts(kundliData, "health");
  const P = getLifePack(language);
  const sections = buildHealthSections(facts, P);

  const report = {
    generated_by: "inhouse_health",
    chart_id: 2,
    language,
    kundali_profile: {
      lagna: facts.lagnaSign,
      lagna_lord: facts.lagnaLord,
      rashi: facts.moonSign,
      nakshatra: facts.nakshatra,
      nakshatra_lord: facts.nakshatraLord,
      placements: facts.placements,
    },
    sections,
  };

  const pdfBuffer = await buildKundliSectionsPdf({ request, kundliData, sections, branding });

  return { report, pdfBuffer, kundliData };
}
