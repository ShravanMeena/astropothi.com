// ─────────────────────────────────────────────────────────────────────────────
// In-house dosh report generation service
//
// Replaces the AstroNext vendor + "Bedrock reads a PDF" pipeline. Computes the
// chart locally (astronomy-engine), detects doshas deterministically, builds the
// existing dosh_report JSONB shape, enriches the prose with Bedrock (best-effort,
// never structural), and renders the customer PDF in-house with pdfkit.
//
// Contract: generateInhouseDoshReport(input) → { doshReport, pdfBuffer, kundliData }
// The controller (_generateAndSaveDoshReportInner) uploads pdfBuffer to S3 and
// upserts doshReport exactly as before — the rest of the pipeline is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { v4 as uuidv4 } from "uuid";
import tzlookup from "tz-lookup";

import { buildCalculatedKundliData } from "../astrology/normalize-kundli-data.js";
import { computeSadeSatiTimeline } from "../astrology/sade-sati-timeline.js";
import { analyzeManglikCancellations } from "../astrology/manglik-cancellations.js";
import { DOSHA_DETAILS } from "../lib/dosha-details.js";
import { buildDoshReportJSONB } from "../mapping/dosh-report-mapper.js";
import { expandDoshReport, DETECTOR_KEY_TO_CHAPTER } from "../mapping/dosh-chapters.js";
import { MANGLIK_CLAUSE_HI } from "../mapping/dosh-i18n.js";
import { verifyDoshReport } from "../validate/verify-dosh-report.js";
import { buildDoshaPdf } from "../reporting/render-dosha-pdfkit.js";

const MAJOR_DOSHA_KEYS = new Set(["manglik", "kaal_sarp", "sade_sati", "pitra_dosha", "guru_chandal"]);
const SEVERITY_RANK = { severe: 0, moderate: 1, mild: 2, none: 3 };

const pad = (n) => String(n).padStart(2, "0");

// dob: "YYYY-MM-DD" or "DD/MM/YYYY" → "YYYY-MM-DD"
function normalizeBirthDate(dob) {
  if (!dob) throw new Error("dob is required");
  let y, m, d;
  if (dob.includes("-")) {
    [y, m, d] = dob.split("-").map(Number);
  } else if (dob.includes("/")) {
    [d, m, y] = dob.split("/").map(Number);
  } else {
    throw new Error("dob must be YYYY-MM-DD or DD/MM/YYYY");
  }
  if (!y || !m || !d) throw new Error(`could not parse dob: ${dob}`);
  return `${y}-${pad(m)}-${pad(d)}`;
}

// tob: "HH:MM" or "HH:MM AM/PM" → 24h "HH:MM"
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

// Resolve a precise IANA timezone from lat/lon. The float tzone the booking
// carries (e.g. 5.5) is NOT enough for the engine (it uses Intl with an IANA
// zone). Fall back to IST when lookup fails (India-first product).
function resolveTimezone(lat, lon) {
  try {
    const tz = tzlookup(Number(lat), Number(lon));
    if (tz) return tz;
  } catch {
    /* fall through */
  }
  return "Asia/Kolkata";
}

/**
 * Generate a complete in-house dosh report.
 *
 * @param {object} input  { name, dob, tob, pob, lat, lon, tzone, gender, language }
 * @returns {Promise<{ doshReport: object, pdfBuffer: Buffer, kundliData: object }>}
 */
export async function generateInhouseDoshReport(input) {
  const { name, dob, tob, pob, lat, lon, gender } = input;
  const language = input.language === "hi" ? "hi" : "en";

  const birthDate = normalizeBirthDate(dob);
  const birthTime = normalizeBirthTime(tob);
  const timezone = resolveTimezone(lat, lon);
  const astroGender = gender === "male" || gender === "female" || gender === "other" ? gender : "male";

  const kundliData = buildCalculatedKundliData({
    fullName: name || "User",
    gender: astroGender,
    birthDate,
    birthTime,
    birthPlace: pob || "",
    latitude: Number(lat),
    longitude: Number(lon),
    timezone,
    language,
  });

  const entries = (kundliData.doshas && kundliData.doshas.list) || [];

  // No LLM anywhere in this path. Every sentence in the report is a static
  // bilingual template from engine/mapping/dosh-i18n.js with engine-computed
  // values interpolated, so a Hindi request comes back Hindi end to end with no
  // translation step and nothing that a model could invent.
  const aiReading = null;

  // Deterministic dosh_report JSONB in the exact existing shape.
  let doshReport = buildDoshReportJSONB(kundliData, entries, language, aiReading);

  // Verify/guard the report against the computed chart. Repairs severity/label/
  // total mismatches and re-asserts the chart profile. Never throws.
  const verification = verifyDoshReport(doshReport, kundliData, entries);
  doshReport = verification.report;
  if (verification.issues.length) {
    console.warn("[inhouse-dosh] report verification corrected output:", verification.issues);
  }

  // Sade Sati timeline + the Manglik cancellation analysis. Computed here (not
  // just before the PDF as before) because the 28-chapter expansion needs both.
  const ad = kundliData.astroDetails || {};
  const panchang = kundliData.panchang || {};
  let sadeSati = null;
  try { sadeSati = ad.sign ? computeSadeSatiTimeline(ad.sign) : null; } catch { sadeSati = null; }
  let manglik = null;
  try { manglik = analyzeManglikCancellations(kundliData); } catch { manglik = null; }

  // Expand the verified report into the full chapter set: every dosh CHECKED
  // (not only the detected ones), the classical cancellation clauses, and the
  // 28 rendered pages whose titles/order match the stored sample for this
  // listing. Runs after verification so the verifier — which strips anything
  // not present in the chart — never sees the absent chapters.
  doshReport = expandDoshReport(doshReport, kundliData, entries, { sadeSati, manglik, language });

  // Render the customer-facing PDF in-house. (sadeSati / manglik were computed
  // above, before the chapter expansion, and are reused here unchanged.)
  const flagged = entries
    .filter((d) => d.present && MAJOR_DOSHA_KEYS.has(d.key))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const secondaryFlagged = entries
    .filter((d) => d.present && !MAJOR_DOSHA_KEYS.has(d.key))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const cleanMajors = entries.filter((d) => MAJOR_DOSHA_KEYS.has(d.key) && !d.present);

  const active = entries.filter((d) => d.present);
  const summary = {
    total: entries.length,
    present: active.length,
    severe: active.filter((d) => d.severity === "severe").length,
    moderate: active.filter((d) => d.severity === "moderate").length,
    mild: active.filter((d) => d.severity === "mild").length,
  };

  // The PDF prints `d.reason`, which comes straight from the detector and is a
  // one-line generic ("Sun is conjoined by Rahu, Ketu, or Saturn."). The chapter
  // builder has already computed a measured, chart-specific sentence for the
  // same fact — the Sun's sign and house, each separation in degrees, and which
  // of them actually falls inside the orb. Swap that in.
  //
  // This used to run only for non-English, where it doubled as the translation
  // step. The effect was that Hindi PDFs carried the detailed reasoning and
  // English PDFs carried the generic line — the same report, materially thinner
  // in English. The chapter text is localised by `t(lang, …)` already, so the
  // swap is correct in every language; only the manglik clause LABELS need the
  // Hindi table, and that part stays gated.
  const chapterById = Object.fromEntries((doshReport.doshas || []).map((c) => [c.id, c]));
  const minorById = Object.fromEntries((doshReport.minor_patterns || []).map((c) => [c.id, c]));
  const reasonFor = (key) => {
    const id = DETECTOR_KEY_TO_CHAPTER[key] || `${key}_dosh`;
    return chapterById[id]?.short_description || minorById[id]?.short_description || null;
  };
  [...flagged, ...secondaryFlagged].forEach((d) => {
    const measured = reasonFor(d.key);
    if (measured) d.reason = measured;
  });
  if (manglik) {
    const mangalChapter = chapterById.mangal_dosh;
    if (mangalChapter?.short_description) manglik.summary = mangalChapter.short_description;
    const byClause = Object.fromEntries(
      (doshReport.cancellations || []).filter((x) => x.clause_key).map((x) => [x.clause_key, x])
    );
    for (const c of [...(manglik.cancellations || []), ...(manglik.mitigators || [])]) {
      // Clause labels have no localised counterpart in the chapter output, so
      // for Devanagari they come from the static table; English keeps its own.
      const label = language !== "en" ? MANGLIK_CLAUSE_HI[c.key] : null;
      if (label) c.label = label;
      if (byClause[c.key]) c.detail = byClause[c.key].detail;
      else if (label) c.detail = label;
    }
  }

  const pdfBuffer = await buildDoshaPdf({
    doshaId: uuidv4(),
    createdAt: new Date().toISOString(),
    subject: {
      name: name || "User",
      birthDate,
      birthTime,
      birthPlace: pob || "",
      moonSign: ad.sign,
      moonNakshatra: panchang.nakshatra,
      ascendant: ad.ascendant,
    },
    flagged,
    secondaryFlagged,
    cleanMajors,
    details: DOSHA_DETAILS,
    summary,
    sadeSati,
    manglik,
    aiReading,
    language,
  });

  return { doshReport, pdfBuffer, kundliData };
}
