#!/usr/bin/env node
// Render any report type to a local PDF, with no DB, no S3, no payment.
// This is the engine smoke test and the design-review loop for themes.
//
//   npm run render -- --type kundli --lang hi
//   npm run render -- --type dosh --lang en --name "Ram Kumar" --dob 1990-08-15 --tob 04:30
//
// Types: love health dosh horoscope kundli laalkitab varshaphal

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const TYPES = {
  love:       { mod: "../engine/reports/love.js",       fn: "generateInhouseLove" },
  health:     { mod: "../engine/reports/health.js",     fn: "generateInhouseHealth" },
  dosh:       { mod: "../engine/reports/dosh.js",       fn: "generateInhouseDoshReport" },
  horoscope:  { mod: "../engine/reports/horoscope.js",  fn: "generateInhouseHoroscope" },
  kundli:     { mod: "../engine/reports/kundli.js",     fn: "generateInhouseKundli" },
  laalkitab:  { mod: "../engine/reports/laalkitab.js",  fn: "generateInhouseLaalKitab" },
  varshaphal: { mod: "../engine/reports/varshaphal.js", fn: "generateInhouseVarshaphal" }
};

function args() {
  const a = {};
  for (let i = 2; i < process.argv.length; i++) {
    const t = process.argv[i];
    if (t.startsWith("--")) a[t.slice(2)] = process.argv[i + 1]?.startsWith("--") ? true : process.argv[++i];
  }
  return a;
}

// A fixed, known-good subject so output is comparable run to run.
const SAMPLE = {
  name: "Ravi Sharma",
  dob: "1992-03-17",
  tob: "09:42",
  pob: "Varanasi, Uttar Pradesh, India",
  lat: 25.3176,
  lon: 82.9739,
  tzone: 5.5,
  gender: "male"
};

const a = args();
const type = a.type || "kundli";
const language = a.lang === "hi" ? "hi" : "en";
if (!TYPES[type]) {
  console.error(`unknown --type "${type}". one of: ${Object.keys(TYPES).join(" ")}`);
  process.exit(1);
}

const input = {
  ...SAMPLE,
  ...(a.name && { name: a.name }),
  ...(a.dob && { dob: a.dob }),
  ...(a.tob && { tob: a.tob }),
  ...(a.pob && { pob: a.pob }),
  ...(a.lat && { lat: Number(a.lat) }),
  ...(a.lon && { lon: Number(a.lon) }),
  ...(a.gender && { gender: a.gender }),
  language
};

const t0 = Date.now();
const { [TYPES[type].fn]: generate } = await import(TYPES[type].mod);
const res = await generate(input);
const ms = Date.now() - t0;

const buf = res.pdfBuffer;
if (!Buffer.isBuffer(buf)) {
  console.error(`${type}: no pdfBuffer returned. keys = ${Object.keys(res).join(", ")}`);
  process.exit(1);
}

const outDir = path.resolve(import.meta.dirname, "..", "out");
await mkdir(outDir, { recursive: true });
const out = a.out || path.join(outDir, `${type}_${language}.pdf`);
await writeFile(out, buf);

const sections = res.sections?.length ?? res.report?.sections?.length ?? res.doshReport?.sections?.length;
console.log(
  `${type.padEnd(11)} ${language}  ${String(ms).padStart(6)}ms  ` +
  `${(buf.length / 1024).toFixed(0).padStart(5)} KB  ` +
  `${sections ? `${sections} sections  ` : ""}→ ${out}`
);
