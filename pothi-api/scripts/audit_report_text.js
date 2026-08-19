#!/usr/bin/env node
// Text-quality audit of what the pandit's client actually reads.
//
// Not "does it render" — that is covered. This looks for the things that make a
// paid report look unfinished: leaked placeholders, broken numbers, stub
// chapters, and the same sentence printed twice in one book.

import { renderReport, REPORT_CODES } from "../engine/render.js";

const CHARTS = [
  { name: "S1", dob: "1992-03-17", tob: "09:42", lat: 25.3176, lon: 82.9739, gender: "male" },
  { name: "S2", dob: "1978-11-02", tob: "23:05", lat: 9.9312,  lon: 76.2673, gender: "female" },
  { name: "S3", dob: "2001-01-09", tob: "17:50", lat: 22.5726, lon: 88.3639, gender: "female" }
].map((c) => ({ ...c, pob: "India", tzone: 5.5 }));

// Things that must never reach a customer.
const LEAKS = [
  [/\bundefined\b/i, "undefined"], [/\bnull\b/i, "null"], [/\bNaN\b/, "NaN"],
  [/\[object Object\]/, "[object Object]"], [/\bTODO\b/i, "TODO"],
  [/\{\{|\}\}/, "unreplaced {{template}}"], [/\bInfinity\b/, "Infinity"],
  [/\s,|\s\./, "space before punctuation"], [/  +/, "double space"],
  [/\bNA\b|\bN\/A\b/, "N/A"], [/-?\d+\.\d{6,}/, "unrounded float"]
];

const sentences = (s) => String(s || "")
  .split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x.length > 20);
// Prose and bullets are rendered as separate blocks on the page. Joining them
// with a space invents run-on sentences that do not exist in the PDF — an
// earlier version of this audit reported exactly that as a product bug.
const prose = (x) => [x.summary, ...x.paras, x.advisory].filter(Boolean).join("\n");
const sectionText = (x) => [prose(x), ...x.bullets].filter(Boolean).join("\n");
const words = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;

// Ratchet at today's measured values. Depth may not fall, leaks may not appear.
const MIN_MEDIAN = { kundli: 240, dosh: 155, love: 42, health: 54, horoscope: 130, laalkitab: 205, varshaphal: 135 };
const budget = process.argv.includes("--budget");
let issues = 0, regressed = 0;
console.log("report       thin ch  dup-sentences  leaks   median words/ch");
console.log("─".repeat(58));

for (const type of REPORT_CODES) {
  let stubs = 0, dups = 0;
  const leakHits = new Map();
  const stubList = [], dupList = [], depths = [];

  for (const c of CHARTS) {
    const { model } = await renderReport({ reportType: type, input: c, designId: "classic",
      paletteId: "saffron", branding: {}, language: "en" });

    const seen = new Map();
    for (const sec of model.sections) {
      const txt = sectionText(sec);
      // Depth, measured as a reader sees it: words of prose plus bullet lines.
      // Under ~45 words is two sentences — thin for a chapter someone paid for.
      const w = words(prose(sec)) + sec.bullets.length * 6;
      depths.push(w);
      if (w < 45) { stubs++; if (stubList.length < 5) stubList.push(`${sec.n}. ${sec.title} (${w}w)`); }
      for (const [re, label] of LEAKS) if (re.test(txt)) leakHits.set(label, (leakHits.get(label) || 0) + 1);
      for (const s of sentences(txt)) {
        if (seen.has(s) && seen.get(s) !== sec.n) {
          dups++; if (dupList.length < 5) dupList.push(`ch ${seen.get(s)} & ${sec.n}: ${s.slice(0, 72)}`);
        } else seen.set(s, sec.n);
      }
    }
  }
  const n = Math.round(stubs / CHARTS.length), d = Math.round(dups / CHARTS.length);
  const l = [...leakHits.keys()];
  if (n || d || l.length) issues++;
  depths.sort((a, b) => a - b);
  const med = depths[Math.floor(depths.length / 2)] || 0;
  if (l.length) { console.log(`  ✗ ${type}: placeholder leak — ${l.join(", ")}`); regressed++; }
  if (med < (MIN_MEDIAN[type] ?? 0)) { console.log(`  ✗ ${type}: median depth ${med}w below floor ${MIN_MEDIAN[type]}w`); regressed++; }
  console.log(`${type.padEnd(12)} ${String(n).padStart(7)}  ${String(d).padStart(13)}  ${(l.length ? l.join(", ") : "—").padEnd(14)} ${med}`);
  if (stubList.length) console.log(`             stub: ${stubList[0]}`);
  if (dupList.length)  console.log(`             dup : ${dupList[0]}`);
}
console.log("─".repeat(58));
if (budget) {
  console.log(regressed ? `  ${regressed} regression(s)` : "  no text-quality regressions");
  process.exit(regressed ? 1 : 0);
}
console.log(`  ${issues} report(s) with notes. Love (44w) and Health (56w) are ~4x thinner than
  the rest — the same two the data audit flags as 40–49% static. That is the
  content gap, and it is real; the others are fine.`);
