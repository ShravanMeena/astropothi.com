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
    // The verdict as data, so the renderer can colour it instead of the reader
    // having to parse severity out of grey type. Only the dosh mapper sets it.
    status: raw.status && typeof raw.status === "object" ? raw.status : null,
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

const FACING = {
  N:  { en: "North facing",      hi: "उत्तर मुखी" },   NE: { en: "North-East facing", hi: "ईशान मुखी" },
  E:  { en: "East facing",       hi: "पूर्व मुखी" },   SE: { en: "South-East facing", hi: "आग्नेय मुखी" },
  S:  { en: "South facing",      hi: "दक्षिण मुखी" },  SW: { en: "South-West facing", hi: "नैऋत्य मुखी" },
  W:  { en: "West facing",       hi: "पश्चिम मुखी" },  NW: { en: "North-West facing", hi: "वायव्य मुखी" }
};
const PROPERTY_TYPE = {
  home: { en: "independent house", hi: "स्वतंत्र भवन" }, flat: { en: "flat", hi: "फ्लैट" },
  shop: { en: "shop or office",    hi: "दुकान या कार्यालय" }, plot: { en: "plot", hi: "भूखंड" }
};

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
      gender: str(input?.gender),
      // Property reports carry these instead of a birth moment.
      facingName: FACING[str(input?.facing).toUpperCase()]?.[lang] || "",
      propertyType: PROPERTY_TYPE[str(input?.property_type)]?.[lang] || ""
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
    // Numbers worth drawing rather than listing. Only whatever the chart
    // actually produced — an empty array here means the page is not printed,
    // never an empty axis.
    graphs: {
      bindus: Array.isArray(k?.ashtakavarga?.houses) ? k.ashtakavarga.houses : [],
      dashaTimeline: Array.isArray(k?.dashas?.vimshottariTimeline) ? k.dashas.vimshottariTimeline : [],
      currentDasha: str(k?.dashas?.currentMahaDasha)
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
        strengths:"Strength & Timing at a Glance", bindus:"Ashtakavarga — Bindus by House",
        bindusNote:"Your chart carries {total} bindus across the twelve houses, an average of {avg}. Houses at or above the average are the ones the chart supports; the faded bars are the ones that need help.",
        average:"average", dashaLine:"Vimshottari — The Whole Sequence", today:"today",
        disclaimer:"This report is generated for guidance and reflection. It is not a substitute for professional medical, legal or financial advice.",
        supportTitle:"Questions about this report?",
        supportBody:"Write to us — a person reads every message. Ask about your chart, your reading, or your order.",
        supportWhatsapp:"WhatsApp", supportEmail:"Email" },
  hi: { born:"जन्म", at:"समय", place:"स्थान", rashi:"चंद्र राशि", nakshatra:"नक्षत्र",
        lagna:"लग्न", contents:"विषय सूची", planetary:"ग्रह स्थिति",
        preparedBy:"प्रस्तुतकर्ता", planet:"ग्रह", sign:"राशि", house:"भाव",
        degree:"अंश", page:"पृष्ठ", details:"जन्म विवरण", chart:"जन्म कुंडली",
        houses:"द्वादश भाव", lord:"स्वामी", occupants:"स्थित ग्रह", empty:"—",
        strengths:"बल और काल — एक दृष्टि में", bindus:"अष्टकवर्ग — भावानुसार बिंदु",
        bindusNote:"आपकी कुंडली में बारह भावों में कुल {total} बिंदु हैं, औसत {avg}। औसत या उससे ऊपर के भाव वे हैं जिन्हें कुंडली सहारा देती है; हल्के स्तंभ वे हैं जिन्हें सहायता चाहिए।",
        average:"औसत", dashaLine:"विंशोत्तरी — सम्पूर्ण क्रम", today:"आज",
        disclaimer:"यह रिपोर्ट मार्गदर्शन हेतु है। यह चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं है।",
        supportTitle:"रिपोर्ट के बारे में कोई प्रश्न है?",
        supportBody:"हमें लिखिए — हर संदेश एक व्यक्ति पढ़ता है। कुंडली, रिपोर्ट या ऑर्डर से जुड़ा कोई भी प्रश्न पूछिए।",
        supportWhatsapp:"व्हाट्सएप", supportEmail:"ईमेल" }
};
