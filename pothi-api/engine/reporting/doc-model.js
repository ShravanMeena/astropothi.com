// ─────────────────────────────────────────────────────────────────────────────
// One document model for every report type.
//
// The seven generators each emit a `sections` array in a slightly different
// shape (kundli has body[]+highlights+advisory, love/health have a plain body
// string, dosh has bullets, horoscope/varshaphal carry placements). The four
// small legacy renderers simply ignored these arrays, which is why dosh,
// horoscope, laalkitab and varshaphal came out 5–6 pages instead of 22–40.
//
// Normalising here means ONE renderer can draw all of them — so a fix or a new
// theme lands on every report at once.
// ─────────────────────────────────────────────────────────────────────────────

import { translateSign, translateNakshatra, translatePlanet } from "../i18n/astrology-labels.js";

/**
 * Tidy a corpus string.
 *
 * The content templates interpolate optional clauses — `${cond ? "..." : ""}` —
 * and when the condition is false the empty slot leaves a double space, or a
 * space stranded before the full stop. That is invisible in code and obvious on
 * a printed page, so it is normalised here for every report at once rather than
 * chased through 130 KB of strings.
 */
const clean = (v) =>
  String(v)
    .replace(/[ \t]{2,}/g, " ")        // collapse runs of spaces
    .replace(/\s+([.,;:!?।])/g, "$1")  // no space before punctuation (incl. danda)
    .replace(/([([])\s+/g, "$1")       // no space after an opening bracket
    .replace(/\s+([)\]])/g, "$1")
    .trim();

const str = (v) => (typeof v === "string" ? clean(v) : "");
const arr = (v) => (Array.isArray(v) ? v.filter((x) => str(x)).map((x) => str(x)) : str(v) ? [str(v)] : []);

/** Pull the sections array out of whichever wrapper this report type used. */
export function extractSections(result) {
  return result?.sections ?? result?.report?.sections ?? result?.doshReport?.sections ?? [];
}

/** One section → a uniform shape the renderer understands. */
function normalizeSection(raw, index) {
  return {
    n: raw.n ?? raw.page ?? index + 1,
    id: raw.id ?? `s${index + 1}`,
    title: str(raw.title) || `Section ${index + 1}`,
    subtitle: str(raw.subtitle),
    summary: str(raw.summary),
    paras: arr(raw.body),
    bullets: [...arr(raw.bullets), ...arr(raw.highlights)],
    advisory: str(raw.advisory),
    placements: Array.isArray(raw.placements) ? raw.placements : [],
    table: Array.isArray(raw.table) ? raw.table : null
  };
}

/**
 * Build the render model.
 * @param {object} o
 * @param {object} o.result     whatever the generator returned
 * @param {string} o.reportType catalogue code
 * @param {object} o.titles     { en, hi } display name for this report type
 * @param {object} o.input      birth input
 * @param {string} o.language
 */
const MONTHS_EN = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"];
const MONTHS_HI = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून",
                   "जुलाई","अगस्त","सितम्बर","अक्टूबर","नवम्बर","दिसम्बर"];

/** "2001-01-09" → "09 January 2001" / "09 जनवरी 2001". Anything else passes through. */
function prettyDate(v, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || "").trim());
  if (!m) return String(v || "");
  const [, y, mo, d] = m;
  const idx = Number(mo) - 1;
  const months = lang === "hi" ? MONTHS_HI : MONTHS_EN;
  return months[idx] ? `${d} ${months[idx]} ${y}` : String(v);
}

export function buildDocModel({ result, reportType, titles, input, language }) {
  const k = result?.kundliData || {};
  const sections = extractSections(result).map(normalizeSection);
  const lang = language === "hi" ? "hi" : "en";

  return {
    lang,
    reportType,
    title: titles?.[lang] || titles?.en || reportType,
    subject: {
      name: str(input?.name) || "—",
      // Printed, not stored: "2001-01-09" is a database format and it was
      // going on the cover of a book somebody paid for.
      dob: prettyDate(str(input?.dob), lang),
      dob_iso: str(input?.dob),
      tob: str(input?.tob),
      pob: str(input?.pob),
      gender: str(input?.gender)
    },
    // Shown on the cover and the details page. Absent for report types that
    // don't compute a chart (horoscope/varshaphal return kundliData: null).
    //
    // Localised here: the engine computes signs and nakshatras in English, and a
    // Hindi report was printing "Leo / Magha / Taurus" on its cover.
    profile: {
      rashi: translateSign(k?.astroDetails?.sign || "", lang),
      nakshatra: translateNakshatra(k?.panchang?.nakshatra || "", lang),
      lagna: translateSign(k?.ascendant?.sign || "", lang),
      rashiLord: translatePlanet(k?.astroDetails?.signLord || "", lang),
      nakshatraLord: translatePlanet(k?.astroDetails?.nakshatraLord || "", lang),
      gana: k?.astroDetails?.gan || "",
      nadi: k?.astroDetails?.nadi || "",
      tithi: k?.panchang?.tithi || ""
    },
    planets: (Array.isArray(k?.planets) ? k.planets : []).map((p) => ({
      ...p, name: translatePlanet(p.name, lang), sign: translateSign(p.sign, lang)
    })),
    houses: (Array.isArray(k?.houses) ? k.houses : []).map((h) => ({
      // The sign was already localised here; the lord and the occupants were
      // not, so a Hindi report printed "वृषभ … Jupiter".
      ...h,
      sign: translateSign(h.sign, lang),
      lord: translatePlanet(h.lord || "", lang),
      occupants: (h.occupants || []).map((n) => translatePlanet(n, lang))
    })),
    sections
  };
}

export const L = {
  en: { born:"Born", at:"at", place:"Place", rashi:"Moon Sign", nakshatra:"Nakshatra",
        lagna:"Ascendant", contents:"Contents", planetary:"Planetary Positions",
        preparedBy:"Prepared by", planet:"Planet", sign:"Sign", house:"House",
        degree:"Degree", page:"Page", details:"Birth Details", chart:"Birth Chart",
        houses:"The Twelve Houses", lord:"Lord", occupants:"Occupants", empty:"—",
        disclaimer:"This report is generated for guidance and reflection. It is not a substitute for professional medical, legal or financial advice." },
  hi: { born:"जन्म", at:"समय", place:"स्थान", rashi:"चंद्र राशि", nakshatra:"नक्षत्र",
        lagna:"लग्न", contents:"विषय सूची", planetary:"ग्रह स्थिति",
        preparedBy:"प्रस्तुतकर्ता", planet:"ग्रह", sign:"राशि", house:"भाव",
        degree:"अंश", page:"पृष्ठ", details:"जन्म विवरण", chart:"जन्म कुंडली",
        houses:"द्वादश भाव", lord:"स्वामी", occupants:"स्थित ग्रह", empty:"—",
        disclaimer:"यह रिपोर्ट मार्गदर्शन हेतु है। यह चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं है।" }
};
