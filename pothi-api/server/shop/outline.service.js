// The actual table of contents for each report, taken from the engine.
//
// A ₹699 page needs to show what is inside, and the honest way to do that is to
// print the real chapter list rather than marketing bullets. Structure does not
// vary by chart, so one render per (type, language) is cached for the process.

import { renderReport } from "../../engine/render.js";

// Fixed sample subject — only the chapter titles are used, never the readings.
const SPECIMEN = {
  name: "—", dob: "1992-03-17", tob: "09:42", pob: "Varanasi",
  lat: 25.3176, lon: 82.9739, tzone: 5.5, gender: "male"
};

const cache = new Map();
const inflight = new Map();

export async function outline(reportType, lang = "en") {
  const key = `${reportType}:${lang}`;
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    const { model, pages } = await renderReport({
      reportType, input: SPECIMEN, designId: "classic", paletteId: "saffron",
      branding: {}, language: lang,
      // Titles only. The AI expansion appends paragraphs inside chapters and
      // can neither rename one nor add one, so paying ten seconds and a model
      // call for it here bought nothing — and it was paid by whichever visitor
      // opened a report page first after a deploy.
      enrich: false
    });
    const out = {
      chapters: model.sections.map((s) => ({ n: s.n, title: s.title, subtitle: s.subtitle || "" })),
      // Unenriched, so it under-counts a report whose chapters get expanded.
      // The shop prefers the warmed preview's real page count and falls back to
      // this; see shop.route.js.
      approx_pages: pages
    };
    cache.set(key, out);
    return out;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}
