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

await rm(tmp, { recursive: true, force: true });
console.log("─".repeat(56));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
