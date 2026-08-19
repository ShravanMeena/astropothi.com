#!/usr/bin/env node
// How much of a report is genuinely derived from the birth chart?
//
// Two charts is not enough: a template branch that both charts happen to take
// looks identical but is data-driven. So render the same report for EIGHT very
// different charts and count sentences that are identical across ALL of them.
// Surviving eight unrelated charts is strong evidence of hardcoded text.
//
//   node scripts/audit_data_driven.js            full audit
//   node scripts/audit_data_driven.js --budget   pass/fail against thresholds

import { renderReport, REPORT_CODES } from "../engine/render.js";

const CHARTS = [
  { name: "S1", dob: "1992-03-17", tob: "09:42", lat: 25.3176, lon: 82.9739, gender: "male" },
  { name: "S2", dob: "1978-11-02", tob: "23:05", lat: 9.9312,  lon: 76.2673, gender: "female" },
  { name: "S3", dob: "1965-06-28", tob: "04:15", lat: 28.6139, lon: 77.2090, gender: "male" },
  { name: "S4", dob: "2001-01-09", tob: "17:50", lat: 22.5726, lon: 88.3639, gender: "female" },
  { name: "S5", dob: "1986-09-21", tob: "12:00", lat: 13.0827, lon: 80.2707, gender: "male" },
  { name: "S6", dob: "1973-12-05", tob: "02:30", lat: 26.9124, lon: 75.7873, gender: "female" },
  { name: "S7", dob: "1999-07-14", tob: "20:20", lat: 19.0760, lon: 72.8777, gender: "male" },
  { name: "S8", dob: "1958-04-03", tob: "06:55", lat: 31.6340, lon: 74.8723, gender: "female" }
].map((c) => ({ ...c, pob: "India", tzone: 5.5 }));

// Chapters that are meant to be the same for everyone — navigation and
// instructions, not analysis. Excluded from the boilerplate budget.
const INTENTIONAL = /how to use|about this report|what this report|contents/i;

const sentences = (s) => String(s || "")
  .split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x.length > 12);

const sectionText = (sec) =>
  [sec.summary, ...sec.paras, ...sec.bullets, sec.advisory].filter(Boolean).join(" ");

const budget = process.argv.includes("--budget");
// A ratchet, not an aspiration: these are TODAY's measured values +1. The build
// fails if static content grows. Lower them deliberately as the corpus improves.
const MAX = { kundli: 19, dosh: 43, love: 41, health: 50, horoscope: 24, laalkitab: 24, varshaphal: 14 };

console.log("report       chapters  sentences  same-in-all-8   static");
console.log("─".repeat(64));

let fail = 0;
const offenders = {};

for (const type of REPORT_CODES) {
  const runs = [];
  for (const c of CHARTS) {
    const r = await renderReport({ reportType: type, input: c, designId: "classic",
                                   paletteId: "saffron", branding: {}, language: "en" });
    runs.push(r.model.sections);
  }
  const base = runs[0];
  let same = 0, count = 0;
  const lines = [];

  for (let i = 0; i < base.length; i++) {
    if (INTENTIONAL.test(base[i].title)) continue;
    const mine = sentences(sectionText(base[i]));
    const others = runs.slice(1).map((r) => new Set(sentences(sectionText(r[i] || {}))));
    for (const s of mine) {
      count++;
      if (others.every((o) => o.has(s))) { same++; lines.push(`${base[i].n}. ${s}`); }
    }
  }
  offenders[type] = lines;
  const pct = count ? (same / count) * 100 : 0;
  const over = pct > (MAX[type] ?? 100);
  if (over) fail++;
  console.log(`${type.padEnd(12)} ${String(base.length).padStart(8)} ${String(count).padStart(10)} ${String(same).padStart(14)}   ${pct.toFixed(0).padStart(4)}%${over ? `  ✗ over ${MAX[type]}%` : ""}`);
}

console.log("─".repeat(64));
if (budget) {
  console.log(fail ? `${fail} report(s) over their static-content budget` : "all reports within budget");
  process.exit(fail ? 1 : 0);
}

console.log("\nStatic across all eight charts:");
for (const [t, l] of Object.entries(offenders)) {
  if (!l.length) continue;
  console.log(`\n  ${t} (${l.length}):`);
  for (const x of l.slice(0, 6)) console.log(`    ${x.slice(0, 108)}`);
  if (l.length > 6) console.log(`    …and ${l.length - 6} more`);
}
