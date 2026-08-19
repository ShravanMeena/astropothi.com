// ─────────────────────────────────────────────────────────────────────────────
// Pothi in-house Vedic astrology engine.
//
// Vendored from devpunya-node-api-server/server/astro_chart/engine at port time.
// Changes made during the port (see scripts/sync_engine.js to diff upstream):
//   • ai/*        deleted — the optional LLM prose layer. v1 is 100% deterministic,
//                 which is also what the donor's paid path already did
//                 (inhouse_dosh.service.js set `const aiReading = null`).
//   • lib/doshas.js  vendored from utilities/constant/doshas.js (static registry).
//   • reports/*   the seven inhouse_*.service.js wrappers, moved in-tree.
//   • Nothing here imports outside engine/. Only npm deps are:
//     astronomy-engine, pdfkit, tz-lookup, uuid, zod.
//
// Everything below is a pure function of birth input — no DB, no network, no config.
// ─────────────────────────────────────────────────────────────────────────────

// ── Chart computation ────────────────────────────────────────────────────────
export {
  buildCalculatedKundliData,
  buildDashaWindows,
  activatingWindows,
  pratyantarWithinAntar,
  computeSunriseSunset
} from "./astrology/normalize-kundli-data.js";

export { detectDoshas, doshasFromEntries, analyzeManglikCancellations } from "./astrology/detect-doshas.js";
export { computeSadeSatiTimeline } from "./astrology/sade-sati-timeline.js";
export { computeAshtakavarga } from "./astrology/ashtakavarga.js";
export { buildChartFacts } from "./astrology/kundli-facts.js";
export * as CONSTANTS from "./astrology/astro-constants.js";

// ── Report generators (one per SKU) ──────────────────────────────────────────
export { generateInhouseLove as generateLove } from "./reports/love.js";
export { generateInhouseHealth as generateHealth } from "./reports/health.js";
export { generateInhouseDoshReport as generateDosh } from "./reports/dosh.js";
export { generateInhouseHoroscope as generateHoroscope } from "./reports/horoscope.js";
export { generateInhouseKundli as generateKundli } from "./reports/kundli.js";
export { generateInhouseLaalKitab as generateLaalKitab } from "./reports/laalkitab.js";
export { generateInhouseVarshaphal as generateVarshaphal } from "./reports/varshaphal.js";

// ── Free/utility computations ────────────────────────────────────────────────
export { computeDailyPanchang } from "./reports/panchang.js";
export { computeDailyHoroscopes } from "./reports/daily_horoscope.js";

// ── Branding + validation ────────────────────────────────────────────────────
export { DEFAULT_BRANDING, mergeBranding, loadLogoBuffer } from "./reporting/branding.js";
export { generateKundliSchema, SUPPORTED_LANGUAGES } from "./validators/generate-kundli.js";
