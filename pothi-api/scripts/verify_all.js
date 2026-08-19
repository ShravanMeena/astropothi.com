#!/usr/bin/env node
// The real end-to-end engine check: every report type × every theme, both
// languages. Asserts each PDF is valid, has enough pages for its chapters, and
// that different themes actually produce different documents.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { renderReport, REPORT_CODES } from "../engine/render.js";
import { DESIGN_IDS } from "../engine/reporting/designs/index.js";
import { PALETTE_IDS } from "../engine/reporting/palettes/index.js";

const SUBJECT = { name: "Ravi Sharma", dob: "1992-03-17", tob: "09:42",
  pob: "Varanasi, Uttar Pradesh", lat: 25.3176, lon: 82.9739, tzone: 5.5, gender: "male" };
const BRANDING = {
  panditName: "Pt. Ramesh Chandra Shastri", companyName: "Shri Ganesh Jyotish Karyalaya",
  mobile: "+91 96608 01827", email: "pandit@example.com",
  address: "Trimbakeshwar, Nashik, Maharashtra", tagline: "Vedic Jyotish since 1978"
};

const pageCount = (buf) => {
  const m = String(buf.subarray(0, buf.length).toString("latin1")).match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 0;
};

const outDir = path.resolve(import.meta.dirname, "..", "out", "matrix");
await mkdir(outDir, { recursive: true });

const only = process.argv.includes("--quick");
const designs = DESIGN_IDS;
const palettes = only ? ["saffron"] : PALETTE_IDS;
const langs = only ? ["en"] : ["en", "hi"];

let pass = 0, fail = 0;
const byType = {};

console.log("type        design     palette    lang  pages  secs   ms    size");
console.log("─".repeat(62));

for (const type of REPORT_CODES) {
  for (const designId of designs) {
    for (const paletteId of palettes) {
    for (const language of langs) {
      const t0 = Date.now();
      try {
        const { buffer, sections } = await renderReport({
          reportType: type, input: SUBJECT, designId, paletteId, branding: BRANDING, language
        });
        const pages = pageCount(buffer);
        const perPage = pages ? sections / pages : 99;
        if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
        // The old bug: 22–40 chapters crammed into 5 pages. Guard against a regression.
        if (perPage > 3) throw new Error(`only ${pages}p for ${sections} sections — truncating?`);
        await writeFile(path.join(outDir, `${type}_${designId}_${paletteId}_${language}.pdf`), buffer);
        (byType[type] ??= []).push({ designId, paletteId, language, pages, bytes: buffer.length });
        console.log(`${type.padEnd(11)} ${designId.padEnd(10)} ${paletteId.padEnd(10)} ${language}   ${String(pages).padStart(4)}  ${String(sections).padStart(4)}  ${String(Date.now()-t0).padStart(5)}  ${(buffer.length/1024).toFixed(0).padStart(5)}KB`);
        pass++;
      } catch (e) {
        console.log(`${type.padEnd(11)} ${designId.padEnd(10)} ${paletteId.padEnd(10)} ${language}   FAIL  ${e.message}`);
        fail++;
      }
    }
    }
  }
}

console.log("─".repeat(62));
// The three DESIGNS must be structurally different documents, not recolours.
// Compare page counts for one palette/language across designs.
let distinctIssues = 0;
for (const [type, runs] of Object.entries(byType)) {
  const base = runs.filter((r) => r.paletteId === "saffron" && r.language === "en");
  const spread = new Set(base.map((r) => r.pages));
  if (base.length > 1 && spread.size === 1) {
    console.log(`  ⚠ ${type}: all designs produced ${[...spread][0]} pages — not structurally distinct`);
    distinctIssues++;
  } else if (base.length > 1) {
    console.log(`  ${type.padEnd(11)} designs → ${base.map((r) => `${r.designId}:${r.pages}p`).join("  ")}`);
  }
}
if (!distinctIssues) console.log("  ✓ designs are structurally distinct");

console.log(`\n${pass} passed, ${fail} failed  →  ${outDir}`);
process.exit(fail || distinctIssues ? 1 : 0);
