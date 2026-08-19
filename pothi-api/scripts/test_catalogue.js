#!/usr/bin/env node
/**
 * The catalogue must not advertise something the engine does not ship.
 *
 * This exists because it already went wrong: the Love report was rewritten from
 * 24 thin chapters into 15 deep ones, the mapper changed, and REPORT_TYPES was
 * not. The storefront went on selling "24 chapters" while 15 arrived — a false
 * claim on a paid product page, and exactly the kind of seam that makes a buyer
 * feel the whole thing is machine-assembled.
 *
 * Nothing here needs a running server: it renders each report and counts.
 */
import { renderReport } from "../engine/render.js";
import { REPORT_TYPES, CONSUMER_PRICES, PRICE_TIERS } from "../server/catalog/catalog.js";

const SUBJECT = {
  name: "Ravi Sharma", dob: "1992-03-17", tob: "09:42",
  pob: "Varanasi, Uttar Pradesh, India", lat: 25.3176, lon: 82.9739, tzone: 5.5, gender: "male"
};

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

console.log("catalogue vs engine");

for (const t of REPORT_TYPES) {
  if (!t.ready) { console.log(`  – ${t.code} is not sellable, skipped`); continue; }

  // A property report ignores birth details by design, so it cannot be counted
  // from this subject. It is checked for price and name only.
  if ((t.subject || "person") !== "person") {
    is(`${t.code} has a price`, Number.isInteger(CONSUMER_PRICES[t.code]), true);
    continue;
  }

  const r = await renderReport({
    reportType: t.code, input: SUBJECT,
    designId: "classic", paletteId: "saffron", branding: {}, language: "en"
  });
  is(`${t.code} ships the ${t.chapters} chapters it advertises`, r.sections, t.chapters);
  is(`${t.code} has a price`, Number.isInteger(CONSUMER_PRICES[t.code]), true);
  is(`${t.code} price is one of the published tiers`,
     Object.values(PRICE_TIERS).includes(CONSUMER_PRICES[t.code]), true);
}

// Every sellable code must have somewhere to be rendered from, or the storefront
// offers a report that 500s at checkout.
const { REPORT_CODES } = await import("../engine/render.js");
for (const t of REPORT_TYPES.filter((x) => x.ready)) {
  is(`${t.code} is registered in engine/render.js`, REPORT_CODES.includes(t.code), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
