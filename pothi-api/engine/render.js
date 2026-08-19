// Single entry point: birth input + type + theme → themed PDF.
// Every report type routes through renderThemedReport, so the four that used to
// drop their chapters (dosh, horoscope, laalkitab, varshaphal) now render in full.

import { buildDocModel } from "./reporting/doc-model.js";
import { renderReportPdf } from "./reporting/render-report.js";

const GENERATORS = {
  kundli:     { mod: "./reports/kundli.js",     fn: "generateInhouseKundli",     en: "Premium Kundali",        hi: "प्रीमियम कुंडली" },
  dosh:       { mod: "./reports/dosh.js",       fn: "generateInhouseDoshReport", en: "Kundali Dosh Report",    hi: "कुंडली दोष रिपोर्ट" },
  love:       { mod: "./reports/love.js",       fn: "generateInhouseLove",       en: "Love & Marriage",        hi: "प्रेम कुंडली" },
  health:     { mod: "./reports/health.js",     fn: "generateInhouseHealth",     en: "Health Report",          hi: "स्वास्थ्य कुंडली" },
  horoscope:  { mod: "./reports/horoscope.js",  fn: "generateInhouseHoroscope",  en: "Personalised Horoscope", hi: "व्यक्तिगत राशिफल" },
  laalkitab:  { mod: "./reports/laalkitab.js",  fn: "generateInhouseLaalKitab",  en: "Laal Kitaab Report",     hi: "लाल किताब रिपोर्ट" },
  varshaphal: { mod: "./reports/varshaphal.js", fn: "generateInhouseVarshaphal", en: "Varshaphal (Annual)",    hi: "वर्षफल रिपोर्ट" }
};

export const REPORT_CODES = Object.keys(GENERATORS);

export async function renderReport({ reportType, input, designId, paletteId, branding, language }) {
  const g = GENERATORS[reportType];
  if (!g) throw new Error(`unknown report type: ${reportType}`);
  const lang = language === "hi" ? "hi" : "en";

  const generate = (await import(g.mod))[g.fn];
  const result = await generate({ ...input, language: lang });

  const model = buildDocModel({
    result, reportType, titles: { en: g.en, hi: g.hi }, input, language: lang
  });
  if (!model.sections.length) throw new Error(`${reportType}: generator produced no sections`);

  const { buffer, pages } = await renderReportPdf({
    doc: model, designId, paletteId, branding
  });
  return { buffer, pages, sections: model.sections.length, model, result };
}
