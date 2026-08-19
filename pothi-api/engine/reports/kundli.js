// ─────────────────────────────────────────────────────────────────────────────
// In-house full kundli (64-chapter) report generation service
//
// Fully deterministic, exactly like the dosh report path: compute the chart →
// derive the 64 chapters from it → render them to PDF. No LLM is called, so the
// report needs no API key and cannot vary between two runs of the same birth
// data. The PDF and the web/app report render the same 64 chapters, so the two
// can never disagree.
//
// Contract: generateInhouseKundli(input) → { pdfBuffer, kundliData, sections }
// ─────────────────────────────────────────────────────────────────────────────

import tzlookup from "tz-lookup";

import { buildCalculatedKundliData } from "../astrology/normalize-kundli-data.js";
import { buildKundliSectionsPdf } from "../reporting/render-report-pdfkit.js";
import { buildKundliSections } from "../reporting/kundli-sections.js";

const pad = (n) => String(n).padStart(2, "0");

function normalizeBirthDate(dob) {
  if (!dob) throw new Error("dob is required");
  let y, m, d;
  if (dob.includes("-")) { [y, m, d] = dob.split("-").map(Number); }
  else if (dob.includes("/")) { [d, m, y] = dob.split("/").map(Number); }
  else throw new Error("dob must be YYYY-MM-DD or DD/MM/YYYY");
  if (!y || !m || !d) throw new Error(`could not parse dob: ${dob}`);
  return `${y}-${pad(m)}-${pad(d)}`;
}

function normalizeBirthTime(tob) {
  if (!tob) throw new Error("tob is required");
  const m = String(tob).trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) throw new Error("tob must be HH:MM or HH:MM AM/PM");
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3] === "PM" && hour !== 12) hour += 12;
  if (m[3] === "AM" && hour === 12) hour = 0;
  return `${pad(hour)}:${pad(min)}`;
}

function resolveTimezone(lat, lon) {
  try {
    const tz = tzlookup(Number(lat), Number(lon));
    if (tz) return tz;
  } catch { /* fall through */ }
  return "Asia/Kolkata";
}

/**
 * Generate the 64-chapter kundli report (PDF + sections).
 *
 * @param {object} input  { name, dob, tob, pob, lat, lon, gender, language, branding? }
 * @returns {Promise<{ pdfBuffer: Buffer, kundliData: object, sections: Array }>}
 */
export async function generateInhouseKundli(input) {
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

  // The 64 chapters the Premium Kundali is sold as, derived from the computed
  // chart in the requested language. Both outputs below are built from this one
  // array, which is what keeps the PDF and the on-screen report identical.
  const sections = buildKundliSections(kundliData, language);

  const pdfBuffer = await buildKundliSectionsPdf({ request, kundliData, sections, branding });

  return { pdfBuffer, kundliData, sections };
}
