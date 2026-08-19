// ─────────────────────────────────────────────────────────────────────────────
// Dosh report verifier / guard
//
// Runs AFTER buildDoshReportJSONB and BEFORE persistence. Its job is NOT to
// re-do astrology — the structural verdicts are already deterministic — but to
// guarantee the final JSONB is internally consistent and to strip silly / AI
// hallucinations from the prose so a model slip can never leak into a paid
// report.
//
// It is deterministic, side-effect-free, and never throws: it returns a
// (possibly repaired) report plus a list of issues it corrected, so callers can
// log/alert without risking the user's report.
//
// What it checks & repairs:
//   1. Structural integrity — every report.doshas[] entry must correspond to a
//      detector entry that is actually present; any extra (hallucinated) dosha
//      is removed. total_detected and primary_dosh are recomputed.
//   2. Severity sanity — each severity number is clamped to 0-100 and its label
//      is forced to match the band (a number/label mismatch is repaired).
//   3. Chart-profile fidelity — rashi/nakshatra/lagna in the report must equal
//      the computed chart (English path); a mismatch is overwritten from source.
//   4. Prose hallucination scan — overall_summary, general_recommendation, and
//      every per-dosha narrative are scanned for the NAME of any dosha that is
//      NOT present in this chart. Offending sentences are dropped; if that guts
//      a field, it is replaced with deterministic text.
// ─────────────────────────────────────────────────────────────────────────────

import { SOURCE_TO_CANONICAL, severityToNumber, severityLabelFromNumber } from "../mapping/dosh-report-mapper.js";

// Display-name fragments used to detect a dosha being *named* in prose. Keyed by
// detector key. Lower-cased, matched as substrings.
const DOSHA_NAME_HINTS = {
  manglik:      ["manglik", "mangal dosh", "mangal dosha"],
  kaal_sarp:    ["kaal sarp", "kal sarp", "kaalsarp"],
  sade_sati:    ["sade sati", "sade-sati", "sadesati", "shani sade"],
  pitra_dosha:  ["pitra dosh", "pitru dosh", "pitra dosha", "pitru dosha"],
  guru_chandal: ["guru chandal", "guru-chandal", "chandal dosh"],
  grahan:       ["grahan dosh", "grahan dosha"],
  angarak:      ["angarak"],
  vish_yoga:    ["vish yoga", "vish dosh", "visha yoga"],
  kemadruma:    ["kemadruma"],
  shrapit:      ["shrapit"],
  paap_kartari: ["paap kartari", "pap kartari", "papa kartari"],
  shakat:       ["shakat", "shakata"],
  gandmool:     ["gandmool", "gandmula", "gand mool"],
  daridra:      ["daridra"],
};

function splitSentences(text) {
  if (!text) return [];
  return String(text).match(/[^.!?]+[.!?]*/g) || [String(text)];
}

// Remove any sentence that names an absent dosha. Returns the cleaned string
// (trimmed). Empty string if everything was stripped.
function stripAbsentDoshaMentions(text, absentHints) {
  if (!text || !absentHints.length) return text || "";
  const kept = splitSentences(text).filter((s) => {
    const low = s.toLowerCase();
    return !absentHints.some((h) => low.includes(h));
  });
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * @param {object} doshReport  output of buildDoshReportJSONB (English, pre-localization)
 * @param {object} kundliData  output of buildCalculatedKundliData
 * @param {Array}  entries     detectDoshas() entries
 * @returns {{ ok: boolean, issues: string[], report: object }}
 */
export function verifyDoshReport(doshReport, kundliData, entries) {
  const issues = [];
  const report = JSON.parse(JSON.stringify(doshReport)); // never mutate the input

  const presentEntries = (entries || []).filter((e) => e && e.present);
  const presentKeys = new Set(presentEntries.map((e) => e.key));
  const presentCanonical = new Set(presentEntries.map((e) => SOURCE_TO_CANONICAL[e.key]).filter(Boolean));

  // ── 1. Structural integrity — drop hallucinated doshas ──────────────────────
  if (Array.isArray(report.doshas)) {
    const before = report.doshas.length;
    report.doshas = report.doshas.filter((d) => {
      const ok = d && d.id && presentCanonical.has(d.id) && d.detected === true;
      if (!ok) issues.push(`removed dosha not present in chart: ${d?.id ?? "<unknown>"}`);
      return ok;
    });
    if (report.doshas.length !== before) {
      // recompute derived fields
      report.total_detected = report.doshas.length;
      const primary = report.doshas.slice().sort((a, b) => (b.severity || 0) - (a.severity || 0))[0];
      report.primary_dosh = primary ? primary.id : null;
    }
  }

  // ── 2. Severity sanity — number clamped, label matches band ─────────────────
  for (const d of report.doshas || []) {
    const n = severityToNumber(d.severity);
    if (n !== d.severity) { issues.push(`clamped severity for ${d.id}: ${d.severity} → ${n}`); d.severity = n; }
    const label = severityLabelFromNumber(n);
    if (label !== d.severity_label) { issues.push(`fixed severity_label for ${d.id}: ${d.severity_label} → ${label}`); d.severity_label = label; }
  }
  if (report.total_detected !== (report.doshas || []).length) {
    issues.push(`fixed total_detected: ${report.total_detected} → ${(report.doshas || []).length}`);
    report.total_detected = (report.doshas || []).length;
  }

  // ── 3. Chart-profile fidelity (English path only) ───────────────────────────
  const ad = kundliData?.astroDetails || {};
  const panchang = kundliData?.panchang || {};
  const kp = report.kundali_profile || {};
  const checkField = (field, computed) => {
    if (!computed) return;
    // skip if the value looks already localized (Devanagari) — handled elsewhere
    if (/[ऀ-ॿ]/.test(String(kp[field] || ""))) return;
    if (kp[field] && String(kp[field]) !== String(computed)) {
      issues.push(`corrected kundali_profile.${field}: ${kp[field]} → ${computed}`);
      kp[field] = computed;
    } else if (!kp[field]) {
      kp[field] = computed;
    }
  };
  checkField("rashi", ad.sign);
  checkField("nakshatra", panchang.nakshatra || ad.nakshatra);
  checkField("lagna", ad.ascendant);
  report.kundali_profile = kp;

  // ── 4. Prose hallucination scan ─────────────────────────────────────────────
  const absentHints = Object.entries(DOSHA_NAME_HINTS)
    .filter(([key]) => !presentKeys.has(key))
    .flatMap(([, hints]) => hints);

  const cleanProse = (label, value, fallback) => {
    const cleaned = stripAbsentDoshaMentions(value, absentHints);
    if (cleaned !== (value || "").trim()) issues.push(`sanitized prose (${label}) — removed mention of an absent dosha`);
    // If sanitation gutted the field, fall back to deterministic text.
    return cleaned.length >= 12 ? cleaned : (fallback || cleaned);
  };

  report.overall_summary = cleanProse("overall_summary", report.overall_summary,
    presentEntries.length
      ? `This chart shows ${presentEntries.length} active dosha${presentEntries.length > 1 ? "s" : ""}. Each is a classical flag with well-known pacification remedies.`
      : "No major classical doshas are active in this chart based on the computed planetary positions.");
  report.general_recommendation = cleanProse("general_recommendation", report.general_recommendation,
    "Follow the suggested remedies with consistency, keep a calm and disciplined routine, and consult a qualified astrologer before wearing any gemstone.");

  for (const d of report.doshas || []) {
    if (d.what_does_this_mean) d.what_does_this_mean = cleanProse(`${d.id}.what_does_this_mean`, d.what_does_this_mean, d.short_description || "");
    if (d.short_description)    d.short_description    = cleanProse(`${d.id}.short_description`, d.short_description, d.what_does_this_mean || "");
  }

  return { ok: issues.length === 0, issues, report };
}
