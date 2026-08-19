// Single entry point: birth input + type + theme → themed PDF.
// Every report type routes through renderThemedReport, so the four that used to
// drop their chapters (dosh, horoscope, laalkitab, varshaphal) now render in full.

import { buildDocModel } from "./reporting/doc-model.js";
import { renderReportPdf } from "./reporting/render-report.js";
import { enrichSections } from "./ai/enrich.js";

const GENERATORS = {
  kundli:     { mod: "./reports/kundli.js",     fn: "generateInhouseKundli",     en: "Premium Personalised Kundali", hi: "प्रीमियम व्यक्तिगत कुंडली" },
  dosh:       { mod: "./reports/dosh.js",       fn: "generateInhouseDoshReport", en: "Kundali Dosh Report",    hi: "कुंडली दोष रिपोर्ट" },
  love:       { mod: "./reports/love.js",       fn: "generateInhouseLove",       en: "Love & Marriage",        hi: "प्रेम कुंडली" },
  health:     { mod: "./reports/health.js",     fn: "generateInhouseHealth",     en: "Health Report",          hi: "स्वास्थ्य कुंडली" },
  horoscope:  { mod: "./reports/horoscope.js",  fn: "generateInhouseHoroscope",  en: "Personalised Horoscope", hi: "व्यक्तिगत राशिफल" },
  laalkitab:  { mod: "./reports/laalkitab.js",  fn: "generateInhouseLaalKitab",  en: "Laal Kitaab Report",     hi: "लाल किताब रिपोर्ट" },
  varshaphal: { mod: "./reports/varshaphal.js", fn: "generateInhouseVarshaphal", en: "Varshaphal (Annual)",    hi: "वर्षफल रिपोर्ट" },
  career:     { mod: "./reports/career.js",     fn: "generateInhouseCareer",     en: "Career & Livelihood",    hi: "कर्म एवं जीविका" },
  // Not chart-derived: its subject is a building, so it takes facing + rooms
  // rather than birth details. See engine/vastu/rules.js.
  vastu:      { mod: "./reports/vastu.js",      fn: "generateInhouseVastu",      en: "Vastu Wheel Report",     hi: "वास्तु चक्र रिपोर्ट" }
};

export const REPORT_CODES = Object.keys(GENERATORS);

export async function renderReport({ reportType, input, designId, paletteId, branding, language, reference }) {
  const g = GENERATORS[reportType];
  if (!g) throw new Error(`unknown report type: ${reportType}`);
  const lang = language === "hi" ? "hi" : "en";

  const generate = (await import(g.mod))[g.fn];
  const result = await generate({ ...input, language: lang });

  const model = buildDocModel({
    result, reportType, titles: { en: g.en, hi: g.hi }, input, language: lang
  });
  // The order id, so the support links in the closing page arrive pre-filled
  // with something we can look up instead of "I have a problem".
  if (reference) model.reference = reference;
  if (!model.sections.length) throw new Error(`${reportType}: generator produced no sections`);

  // Chapters that came out thin get their explanation expanded. The computed
  // sentences are untouched and stay first; anything the model tries to add
  // that names a sign or a date the chapter never mentioned is rejected. If the
  // model is unreachable this is a no-op and the report ships as templates.
  const enrichment = await enrichSections(model, { lang, reportType });

  const { buffer, pages } = await renderReportPdf({
    doc: model, designId, paletteId, branding
  });
  return { buffer, pages, sections: model.sections.length, model, result, enrichment };
}
