#!/usr/bin/env node
// Does the PDF actually contain the text the engine produced?
//
// Page counts and "no crash" are not enough: the heritage drop cap clipped every
// chapter to two lines with a pdfkit `height:` option and lost the rest silently.
// This extracts the real text with pdftotext and compares it against the source
// sections, so any future truncation fails the build.

import { writeFile, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import { renderReport, REPORT_CODES } from "../engine/render.js";
import { DESIGN_IDS } from "../engine/reporting/designs/index.js";

const run = promisify(execFile);
const SUBJECT = { name: "Ravi Sharma", dob: "1992-03-17", tob: "09:42",
  pob: "Varanasi, Uttar Pradesh", lat: 25.3176, lon: 82.9739, tzone: 5.5, gender: "male" };
const BRANDING = { panditName: "Pt. Ramesh Chandra Shastri", companyName: "Shri Ganesh Jyotish Karyalaya",
  mobile: "+91 96608 01827" };

// Normalise so justification/hyphen/line-wrap differences don't create false alarms.
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const words = (s) => norm(s).split(" ").filter((w) => w.length > 3);

const tmp = path.join(os.tmpdir(), `pothi-integrity-${process.pid}`);
await mkdir(tmp, { recursive: true });

const only = process.argv.includes("--quick");
const types = only ? ["love", "kundli"] : REPORT_CODES;
let pass = 0, fail = 0;

console.log("type        design     src words  in pdf   coverage");
console.log("─".repeat(56));

for (const type of types) {
  for (const designId of DESIGN_IDS) {
    try {
      const { buffer, model } = await renderReport({
        reportType: type, input: SUBJECT, designId, paletteId: "saffron",
        branding: BRANDING, language: "en"
      });
      const pdfPath = path.join(tmp, `${type}_${designId}.pdf`);
      await writeFile(pdfPath, buffer);
      await run("pdftotext", ["-q", "-enc", "UTF-8", pdfPath, pdfPath + ".txt"]);
      const { stdout } = await run("cat", [pdfPath + ".txt"]);
      const inPdf = new Set(words(stdout));

      // Every distinctive word in the source body should appear in the PDF.
      const src = model.sections.flatMap((s) =>
        [s.summary, ...s.paras, ...s.bullets, s.advisory].filter(Boolean));
      const srcWords = [...new Set(words(src.join(" ")))];
      const missing = srcWords.filter((w) => !inPdf.has(w));
      const coverage = 1 - missing.length / Math.max(1, srcWords.length);

      const ok = coverage >= 0.98;
      console.log(`${type.padEnd(11)} ${designId.padEnd(10)} ${String(srcWords.length).padStart(9)} ${String(srcWords.length - missing.length).padStart(8)}   ${(coverage * 100).toFixed(1)}%${ok ? "" : "  ✗ MISSING: " + missing.slice(0, 6).join(", ")}`);
      ok ? pass++ : fail++;
    } catch (e) {
      console.log(`${type.padEnd(11)} ${designId.padEnd(10)} FAIL ${e.message}`);
      fail++;
    }
  }
}

/**
 * The Hindi half.
 *
 * The loop above only ever rendered `language: "en"`, which is why a Devanagari
 * font bug lived in `note()` unnoticed: the सुझाव box was drawn in Times-Italic,
 * a face with no Devanagari glyphs, so it printed `•y8 " ? '©K" M'ò` in every
 * Hindi report ever generated — and ran off the page, because pdfkit cannot
 * measure a string in a font that cannot render it.
 *
 * Word coverage is the wrong assertion here: pdftotext's Devanagari extraction
 * is lossy (मार्गदर्शन comes back as मागदशन), so a missing-word count would fail
 * on correct output. What a Latin-font block DOES do is replace a run of
 * Devanagari with Latin punctuation soup, so the ratio of Devanagari to Latin
 * catches it and nothing else does.
 */
console.log("\nhindi rendering");
console.log("type        deva chars   latin runs");
console.log("─".repeat(44));

const DEVA = /[\u0900-\u097F]/g;
// Six or more Latin letters/punctuation in a row inside a Hindi report is either
// a placement name we print in English or a font that could not render.
const LATIN_RUN = /[A-Za-z\u00C0-\u00FF‘’“”•·]{6,}/g;

for (const type of types) {
  try {
    const { buffer } = await renderReport({
      reportType: type, input: SUBJECT, designId: "heritage", paletteId: "saffron",
      branding: BRANDING, language: "hi"
    });
    const pdfPath = path.join(tmp, `${type}_hi.pdf`);
    await writeFile(pdfPath, buffer);
    await run("pdftotext", ["-q", "-enc", "UTF-8", pdfPath, pdfPath + ".txt"]);
    const { stdout } = await run("cat", [pdfPath + ".txt"]);

    const deva = (stdout.match(DEVA) || []).length;
    // Mojibake is Latin glyphs standing in for Devanagari, so it shows up as
    // runs made of accented Latin and typographic punctuation rather than words.
    const gibberish = (stdout.match(LATIN_RUN) || [])
      .filter((r) => /[\u00C0-\u00FF‘’“”•·]/.test(r));
    const ok = deva > 400 && gibberish.length === 0;
    console.log(`${type.padEnd(11)} ${String(deva).padStart(10)} ${String(gibberish.length).padStart(12)}`
                + (ok ? "" : `  ✗ ${gibberish.slice(0, 3).join(" | ").slice(0, 60)}`));
    ok ? pass++ : fail++;
  } catch (e) {
    console.log(`${type.padEnd(11)} FAIL ${e.message}`);
    fail++;
  }
}

await rm(tmp, { recursive: true, force: true });
console.log("─".repeat(56));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
