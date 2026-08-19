// Single source of truth for the doshas our system recognizes.
//
// The Bedrock dosh detector is prompted to ONLY use these IDs. Anything
// outside this list is dropped server-side (defense-in-depth). Synonyms
// listed below let the LLM (or callers) refer to variants and we still
// land on the canonical ID.
//
// When adding a new dosh: append to CANONICAL_DOSHAS, optionally add an
// entry to DOSH_SYNONYMS, and (if it should trigger a follow-up WhatsApp)
// extend FOLLOWUP_DOSH_TEMPLATE_MAP below.

export const CANONICAL_DOSHAS = [
    { id: "mangal_dosh",        name_en: "Mangal Dosh",        name_hi: "मांगलिक दोष",       planet: "Mars",         icon: "mars" },
    { id: "kaal_sarp_dosh",     name_en: "Kaal Sarp Dosh",     name_hi: "काल सर्प दोष",      planet: "Rahu-Ketu",    icon: "snake" },
    { id: "sade_sati",          name_en: "Sade Sati",          name_hi: "साढ़े साती",         planet: "Saturn",       icon: "saturn" },
    { id: "pitru_dosh",         name_en: "Pitru Dosh",         name_hi: "पितृ दोष",           planet: "Sun",          icon: "sun" },
    { id: "shani_dosh",         name_en: "Shani Dosh",         name_hi: "शनि दोष",            planet: "Saturn",       icon: "saturn" },
    { id: "guru_chandal_dosh",  name_en: "Guru Chandal Dosh",  name_hi: "गुरु चांडाल दोष",   planet: "Jupiter-Rahu", icon: "jupiter" },
    { id: "grahan_dosh",        name_en: "Grahan Dosh",        name_hi: "ग्रहण दोष",          planet: "Sun-Rahu",     icon: "sun" },
    { id: "rahu_dosh",          name_en: "Rahu Dosh",          name_hi: "राहु दोष",           planet: "Rahu",         icon: "rahu" },
    { id: "ketu_dosh",          name_en: "Ketu Dosh",          name_hi: "केतु दोष",           planet: "Ketu",         icon: "ketu" },
    { id: "kemadruma_dosh",     name_en: "Kemadruma Dosh",     name_hi: "केमद्रुम दोष",       planet: "Moon",         icon: "moon" },
    { id: "vish_dosh",          name_en: "Vish Dosh",          name_hi: "विष दोष",            planet: "Saturn-Moon",  icon: "saturn" },
    { id: "angarak_dosh",       name_en: "Angarak Dosh",       name_hi: "अंगारक दोष",        planet: "Mars-Rahu",    icon: "mars" },
    { id: "nadi_dosh",          name_en: "Nadi Dosh",          name_hi: "नाड़ी दोष",          planet: "—",            icon: "default" },
    { id: "chandra_dosh",       name_en: "Chandra Dosh",       name_hi: "चन्द्र दोष",         planet: "Moon",         icon: "moon" },
    { id: "surya_dosh",         name_en: "Surya Dosh",         name_hi: "सूर्य दोष",          planet: "Sun",          icon: "sun" },
    // ── Added for the in-house astrology engine (server/astro_chart/engine) ──
    // The deterministic detector (engine/astrology/detect-doshas.js) recognizes
    // these classical doshas which the legacy AstroNext/LLM path never emitted.
    // Added here so every detected dosh persists faithfully (no silent drops,
    // no semantic remapping). See engine/mapping/dosh-report-mapper.js.
    { id: "shrapit_dosh",       name_en: "Shrapit Dosh",       name_hi: "श्रापित दोष",        planet: "Saturn-Rahu",  icon: "saturn" },
    { id: "paap_kartari_dosh",  name_en: "Paap Kartari Dosh",  name_hi: "पाप कर्तरी दोष",     planet: "Malefics",     icon: "default" },
    { id: "shakat_dosh",        name_en: "Shakat Dosh",        name_hi: "शकट दोष",            planet: "Moon-Jupiter", icon: "moon" },
    { id: "gandmool_dosh",      name_en: "Gandmool Dosh",      name_hi: "गंडमूल दोष",         planet: "Moon",         icon: "moon" },
    { id: "daridra_dosh",       name_en: "Daridra Dosh",       name_hi: "दरिद्र दोष",         planet: "—",            icon: "default" },
    // ── Match-making (Ashtakoot) doshas + the second Saturn transit window ──
    // The 28-page in-house dosh report checks these alongside the chart doshas:
    // Bhakoot and Gana are two-chart rules (reported as "cannot form from your
    // chart alone", with the partner criteria computed), and Shani Dhaiya is the
    // 4th/8th-from-Moon Saturn transit that is NOT Sade Sati.
    { id: "bhakoot_dosh",       name_en: "Bhakoot Dosh",       name_hi: "भकूट दोष",           planet: "Moon",         icon: "moon" },
    { id: "gana_dosh",          name_en: "Gana Dosh",          name_hi: "गण दोष",             planet: "Moon",         icon: "moon" },
    { id: "shani_dhaiya",       name_en: "Shani Dhaiya",       name_hi: "शनि ढैया",           planet: "Saturn",       icon: "saturn" },
];

// Fast lookup set for membership checks.
export const CANONICAL_DOSH_IDS = new Set(CANONICAL_DOSHAS.map((d) => d.id));

// Map of alternative/legacy IDs the LLM might still emit → canonical ID.
// Keys MUST be lowercase + snake_case (matches the LLM's emit format).
export const DOSH_SYNONYMS = {
    manglik_dosh: "mangal_dosh",
    mars_dosh: "mangal_dosh",
    mangal: "mangal_dosh",

    kalsarp_dosh: "kaal_sarp_dosh",
    kalsarpa_dosh: "kaal_sarp_dosh",
    kaalsarp_dosh: "kaal_sarp_dosh",
    kulik_kaal_sarp_dosh: "kaal_sarp_dosh",
    kaal_sarpa_dosh: "kaal_sarp_dosh",

    sadhesati: "sade_sati",
    sadesati: "sade_sati",
    saade_saati: "sade_sati",
    saturn_sadesati: "sade_sati",

    pitra_dosh: "pitru_dosh",
    pitri_dosh: "pitru_dosh",

    chandal_dosh: "guru_chandal_dosh",
    guru_chandala_dosh: "guru_chandal_dosh",

    surya_grahan_dosh: "grahan_dosh",
    chandra_grahan_dosh: "grahan_dosh",
    eclipse_dosh: "grahan_dosh",

    // Bare detector keys emitted by the in-house engine (engine/astrology/detect-doshas.js).
    manglik: "mangal_dosh",
    kaal_sarp: "kaal_sarp_dosh",
    pitra_dosha: "pitru_dosh",
    guru_chandal: "guru_chandal_dosh",
    grahan: "grahan_dosh",
    angarak: "angarak_dosh",
    vish_yoga: "vish_dosh",
    kemadruma: "kemadruma_dosh",
    shrapit: "shrapit_dosh",
    paap_kartari: "paap_kartari_dosh",
    shakat: "shakat_dosh",
    gandmool: "gandmool_dosh",
    daridra: "daridra_dosh",
};

/**
 * Normalize one LLM-returned dosh ID into a canonical ID, or null if it
 * doesn't match anything in our whitelist.
 */
export function toCanonicalDoshId(rawId) {
    if (!rawId) return null;
    const key = String(rawId).trim().toLowerCase();
    if (CANONICAL_DOSH_IDS.has(key)) return key;
    if (DOSH_SYNONYMS[key]) return DOSH_SYNONYMS[key];
    return null;
}

/**
 * Filter a `doshas` array (as emitted by the LLM) down to canonical IDs
 * only. Drops anything we don't recognize, rewrites synonyms to the
 * canonical ID, and prefers our localized names over the LLM-generated ones.
 */
export function filterToCanonical(doshas, language = "en") {
    if (!Array.isArray(doshas)) return [];
    const seen = new Set();
    const out = [];
    for (const item of doshas) {
        const canonicalId = toCanonicalDoshId(item?.id);
        if (!canonicalId || seen.has(canonicalId)) continue;
        seen.add(canonicalId);
        const def = CANONICAL_DOSHAS.find((d) => d.id === canonicalId);
        out.push({
            ...item,
            id: canonicalId,
            // Always overwrite name with our canonical version so the UI
            // gets a consistent label regardless of how the LLM phrased it.
            name: language === "hi" ? def.name_hi : def.name_en,
        });
    }
    return out;
}

/**
 * Doshas that trigger a follow-up WhatsApp template after the report is
 * delivered. Today fires IMMEDIATELY after the main "report ready"
 * notification; a scheduled (+30 min) version is planned via SQS.
 *
 * Each entry describes the Interakt template name + which placeholders it
 * uses. body_values is a list of token keys resolved against the context
 * built by the sender (see dosh_report.service.js):
 *   - "first_name" → user's first name (first word of fullname)
 *   - "report_id"  → dosh_reports.id (string)
 *   - "pdf_url"    → savedReport.pdf_url
 * Add more keys when needed.
 *
 * header_values / button_values are optional — omit them when the template
 * doesn't define a header or has a static (non-parameterized) button.
 */
// Shared header media URL for now — both follow-up templates point to the same
// asset. Per-template URLs live on the map entry, so we can diverge later
// (e.g. give kaal_sarp_dosh its own video) without touching the other.
const DOSH_FOLLOWUP_HEADER_MEDIA = "https://devpunya.com/static/media/dosh_three.aab0e4942072af6671c8.png";

export const FOLLOWUP_DOSH_TEMPLATE_MAP = {
    // "🌟 मंगल दोष निवारण 🌟 Namaste {{1}} ..." → {{1}} = first name
    // Interakt template is approved under languageCode "en_US" only — do not switch to "hi".
    mangal_dosh: {
        template_name: "mangal_dosh_vip",
        language_code: "en_US",
        body_values: ["first_name"],
        header_media_url: DOSH_FOLLOWUP_HEADER_MEDIA, // image header
        event_type: "Mangal_Dosh_Followup",
    },
    // "⌛ब्लैक मैजिक से कैसे बचाव करें⌛ Namaskar {{1}} ..." → {{1}} = first name
    // Interakt template is approved under languageCode "en_US" only — do not switch to "hi".
    kaal_sarp_dosh: {
        template_name: "copy_of_kaal_551",
        language_code: "en_US",
        body_values: ["first_name"],
        header_media_url: DOSH_FOLLOWUP_HEADER_MEDIA, // template expects video header — image may 400
        event_type: "Kaal_Sarp_Dosh_Followup",
    },
};
