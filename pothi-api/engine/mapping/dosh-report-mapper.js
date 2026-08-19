// ─────────────────────────────────────────────────────────────────────────────
// Dosh report mapper
//
// Converts the in-house astrology engine output into the EXACT dosh_report
// JSONB shape the app + DB already expect (the shape the legacy AstroNext +
// Bedrock-reads-PDF path produced — see utilities/llmRunner.js
// generateDoshReportFromPDF / generateDoshReportFromKundali).
//
// The structural fields (id, severity number/label, kundali_profile, lucky_*,
// total_detected, primary_dosh) are built DETERMINISTICALLY from the computed
// chart + detectDoshas() entries + DOSHA_DETAILS. The AI is used only for prose
// (overall_summary, general_recommendation, per-dosha narrative); when no AI
// reading is supplied (or it lacks a field) we fall back to the static
// DOSHA_DETAILS text so the JSONB is ALWAYS complete.
// ─────────────────────────────────────────────────────────────────────────────

import { CANONICAL_DOSHAS, toCanonicalDoshId } from "../lib/doshas.js";
import { DOSHA_DETAILS } from "../lib/dosha-details.js";
import { translatePlanet, translateSign, translateNakshatra, translateAny } from "../i18n/astrology-labels.js";

// Detector key (engine/astrology/detect-doshas.js) → canonical dosh id
// (utilities/constant/doshas.js). Every detected dosh maps to a real canonical
// id — no drops, no semantic remapping (shrapit/paap_kartari/shakat/gandmool/
// daridra were added to the canonical whitelist for exactly this reason).
const SOURCE_TO_CANONICAL = {
  manglik:      "mangal_dosh",
  kaal_sarp:    "kaal_sarp_dosh",
  sade_sati:    "sade_sati",
  pitra_dosha:  "pitru_dosh",
  guru_chandal: "guru_chandal_dosh",
  grahan:       "grahan_dosh",
  angarak:      "angarak_dosh",
  vish_yoga:    "vish_dosh",
  kemadruma:    "kemadruma_dosh",
  shrapit:      "shrapit_dosh",
  paap_kartari: "paap_kartari_dosh",
  shakat:       "shakat_dosh",
  gandmool:     "gandmool_dosh",
  daridra:      "daridra_dosh",
};

// Primary life area each dosh impacts (2-4 words) — the only per-dosha field
// that neither the engine nor DOSHA_DETAILS produces. Keyed by detector key.
const AFFECTS_MAP = {
  manglik:      "Marriage & Relationship",
  kaal_sarp:    "Life Path & Karma",
  sade_sati:    "Discipline & Mind",
  pitra_dosha:  "Family & Ancestors",
  guru_chandal: "Wisdom & Beliefs",
  grahan:       "Vitality & Clarity",
  angarak:      "Temper & Safety",
  vish_yoga:    "Emotions & Peace",
  kemadruma:    "Emotional Support",
  shrapit:      "Karmic Burdens",
  paap_kartari: "Confidence & Self",
  shakat:       "Growth & Fortune",
  gandmool:     "Early Life & Stability",
  daridra:      "Wealth & Earnings",
};

// Bands (1-29 Mild, 30-54 Moderate, 55-74 High, 75-100 Severe — see
// utilities/llmRunner.js:1279). The detector now emits a chart-specific numeric
// `score` (0-100); these helpers band it. The legacy string tiers are still
// accepted as a fallback for any non-inhouse caller.
const STRING_SCORE = { severe: 80, high: 65, moderate: 50, mild: 20 };

function severityToNumber(sev) {
  if (typeof sev === "number") return Math.max(0, Math.min(100, Math.round(sev)));
  return STRING_SCORE[sev] ?? 0;
}

function severityLabelFromNumber(n) {
  if (n >= 75) return "Severe";
  if (n >= 55) return "High";
  if (n >= 30) return "Moderate";
  if (n >= 1)  return "Mild";
  return "None";
}

// Prefer the numeric `score`; fall back to the coarse string tier.
function resolveSeverity(entry) {
  const n = severityToNumber(entry.score != null ? entry.score : entry.severity);
  return { number: n, label: severityLabelFromNumber(n) };
}

function firstSentence(text) {
  if (!text) return "";
  const m = String(text).match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : String(text)).trim();
}

function remedyStrings(details) {
  if (!details || !Array.isArray(details.remedies)) return [];
  return details.remedies
    .slice(0, 5)
    .map((r) => (r && r.title ? (r.detail ? `${r.title}: ${r.detail}` : r.title) : ""))
    .filter(Boolean);
}

function remedyPujaName(details, fallbackName) {
  if (details && Array.isArray(details.remedies)) {
    const puja = details.remedies.find((r) => /pooja|puja|p00ja/i.test(r?.title || ""));
    if (puja) return puja.title;
  }
  return `${fallbackName} Shanti Puja`;
}

// Localize a single chart-profile value for non-English output. Falls back to
// the original English string if no mapping exists.
function loc(value, fn, language) {
  if (!value) return value || null;
  if (language === "en" || !language) return value;
  try {
    const out = fn(value, language);
    return out || value;
  } catch {
    return value;
  }
}

/**
 * Build the dosh_report JSONB from the computed chart + detected doshas.
 *
 * @param {object} kundliData  output of buildCalculatedKundliData()
 * @param {Array}  entries     detectDoshas() entries (kundliData.doshas.list)
 * @param {string} language    "en" | "hi" (others treated as en for structure)
 * @param {object|null} aiReading optional { overallReading, perDosha:[{key,narrative}], closingGuidance }
 * @returns {object} dosh_report JSONB
 */
export function buildDoshReportJSONB(kundliData, entries, language = "en", aiReading = null) {
  const lang = language === "hi" ? "hi" : "en";
  const ad = kundliData?.astroDetails || {};
  const panchang = kundliData?.panchang || {};
  const numerology = kundliData?.numerology || {};

  const kundali_profile = {
    rashi:          loc(ad.sign, translateSign, lang),
    nakshatra:      loc(panchang.nakshatra || ad.nakshatra, translateNakshatra, lang),
    lagna:          loc(ad.ascendant, translateSign, lang),
    lagna_lord:     loc(ad.ascendantLord, translatePlanet, lang),
    rashi_lord:     loc(ad.signLord, translatePlanet, lang),
    nakshatra_lord: loc(ad.nakshatraLord, translatePlanet, lang),
    gana:           loc(ad.gan, translateAny, lang),
    varna:          loc(ad.varna, translateAny, lang),
  };

  // Per-dosha narrative lookup (keyed by detector key).
  const aiByKey = {};
  if (aiReading && Array.isArray(aiReading.perDosha)) {
    for (const p of aiReading.perDosha) {
      if (p && p.key) aiByKey[p.key] = p.narrative || "";
    }
  }

  const present = (entries || []).filter((e) => e && e.present);
  const doshas = [];
  for (const e of present) {
    const canonicalId = SOURCE_TO_CANONICAL[e.key] || toCanonicalDoshId(e.key);
    if (!canonicalId) continue; // defensive — should never happen now
    const def = CANONICAL_DOSHAS.find((d) => d.id === canonicalId) || {};
    const details = DOSHA_DETAILS[e.key] || {};
    const aiNarr = aiByKey[e.key];
    const sev = resolveSeverity(e);

    doshas.push({
      id: canonicalId,
      name: lang === "hi" ? (def.name_hi || def.name_en || details.name) : (def.name_en || details.name),
      detected: true,
      severity: sev.number,
      severity_label: sev.label,
      planet: def.planet || details.ruler || "—",
      icon: def.icon || "default",
      short_description: aiNarr ? firstSentence(aiNarr) : (firstSentence(details.intro) || e.reason || ""),
      what_does_this_mean: aiNarr || details.significance || e.reason || "",
      what_to_be_aware_of: details.whenPresent || (Array.isArray(details.effects) ? details.effects.slice(0, 2).join(" ") : "") || "",
      remedies: remedyStrings(details),
      remedy_puja_name: remedyPujaName(details, def.name_en || details.name || "Dosh"),
      affects: AFFECTS_MAP[e.key] || "General Wellbeing",
    });
  }

  // primary_dosh = highest-severity present dosh (canonical id), else null.
  const primary = doshas.slice().sort((a, b) => (b.severity || 0) - (a.severity || 0))[0];

  // Deterministic fallbacks for the prose fields when AI is absent.
  const deterministicSummary = present.length
    ? `This chart shows ${present.length} active dosha${present.length > 1 ? "s" : ""}: ${present
        .map((e) => (DOSHA_DETAILS[e.key]?.name || e.name))
        .join(", ")}. Each is a classical flag with well-known pacification remedies — not a life sentence.`
    : "No major classical doshas are active in this chart based on the computed planetary positions. This is an auspicious, unobstructed configuration.";

  const deterministicRecommendation =
    "Follow the suggested remedies with consistency, keep a calm and disciplined routine, and consult a qualified astrologer before wearing any gemstone.";

  return {
    kundali_profile,
    doshas,
    overall_summary: (aiReading && aiReading.overallReading) ? aiReading.overallReading : deterministicSummary,
    primary_dosh: primary ? primary.id : null,
    total_detected: doshas.length,
    lucky_color: numerology.luckyColor || "",
    lucky_number: numerology.lifePathNumber != null ? String(numerology.lifePathNumber) : "",
    lucky_day: numerology.luckyDay || "",
    general_recommendation: (aiReading && aiReading.closingGuidance) ? aiReading.closingGuidance : deterministicRecommendation,
  };
}

export { SOURCE_TO_CANONICAL, AFFECTS_MAP, severityToNumber, severityLabelFromNumber };
