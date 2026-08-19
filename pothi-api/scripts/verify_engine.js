#!/usr/bin/env node
// Phase 0 exit criterion: every report type renders in both languages
// from a clean repo with zero Devpunya dependencies.
//
//   npm run verify:engine

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const TYPES = [
  ["love",       "../engine/reports/love.js",       "generateInhouseLove"],
  ["health",     "../engine/reports/health.js",     "generateInhouseHealth"],
  ["dosh",       "../engine/reports/dosh.js",       "generateInhouseDoshReport"],
  ["horoscope",  "../engine/reports/horoscope.js",  "generateInhouseHoroscope"],
  ["kundli",     "../engine/reports/kundli.js",     "generateInhouseKundli"],
  ["laalkitab",  "../engine/reports/laalkitab.js",  "generateInhouseLaalKitab"],
  ["varshaphal", "../engine/reports/varshaphal.js", "generateInhouseVarshaphal"]
];

const SUBJECT = {
  name: "Ravi Sharma", dob: "1992-03-17", tob: "09:42",
  pob: "Varanasi, Uttar Pradesh, India",
  lat: 25.3176, lon: 82.9739, tzone: 5.5, gender: "male"
};

const outDir = path.resolve(import.meta.dirname, "..", "out", "verify");
await mkdir(outDir, { recursive: true });

let pass = 0, fail = 0;
console.log("type         lang      ms        size   sections");
console.log("─".repeat(56));

for (const [name, mod, fn] of TYPES) {
  for (const language of ["en", "hi"]) {
    const t0 = Date.now();
    try {
      const { [fn]: generate } = await import(mod);
      const res = await generate({ ...SUBJECT, language });
      const buf = res.pdfBuffer;
      if (!Buffer.isBuffer(buf) || buf.length < 5000) throw new Error(`bad pdfBuffer (${buf?.length ?? "none"} bytes)`);
      if (buf.subarray(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
      const sec = res.sections?.length ?? res.report?.sections?.length ?? res.doshReport?.sections?.length ?? "-";
      await writeFile(path.join(outDir, `${name}_${language}.pdf`), buf);
      console.log(`${name.padEnd(12)} ${language}   ${String(Date.now() - t0).padStart(6)}  ${(buf.length / 1024).toFixed(0).padStart(5)} KB   ${sec}`);
      pass++;
    } catch (e) {
      console.log(`${name.padEnd(12)} ${language}   ${String(Date.now() - t0).padStart(6)}  FAIL  ${e.message}`);
      fail++;
    }
  }
}

console.log("─".repeat(56));
console.log(`${pass} passed, ${fail} failed   →  ${outDir}`);
process.exit(fail ? 1 : 0);
