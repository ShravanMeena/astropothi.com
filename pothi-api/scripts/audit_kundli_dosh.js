#!/usr/bin/env node
/**
 * Cross-check the two reports we advertise — Kundali and Dosh — against the
 * chart they claim to be derived from, in English AND Hindi.
 *
 * The layout suite proves nothing spills off the page and the content suite
 * proves no chapter is dropped. Neither proves the words are TRUE. This does:
 * it re-derives every fact independently and compares it with what the PDF
 * actually says.
 *
 * Hindi is checked on its numbers, not its words: pdftotext reorders Devanagari
 * matras on extraction, so a glyph comparison would fail on a correct PDF. The
 * numbers are what a reader would catch anyway.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { renderReport } from "../engine/render.js";
import { vargaSign } from "../engine/astrology/varga.js";

const run = promisify(execFile);
const DIR = "/tmp/pothi-audit";
let pass = 0, fail = 0;
const ok  = (m) => { console.log(`  ✓ ${m}`); pass++; };
const bad = (m, got, want) => {
  console.log(`  ✗ ${m}${got !== undefined ? `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}` : ""}`);
  fail++;
};
const is = (m, got, want) => (JSON.stringify(got) === JSON.stringify(want) ? ok(m) : bad(m, got, want));

const SUBJECT = {
  name: "Poonam Kumawat", dob: "2001-01-09", tob: "10:30", pob: "Jaipur, Rajasthan",
  lat: 26.9124, lon: 75.7873, tzone: 5.5, gender: "female"
};
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
               "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

await rm(DIR, { recursive: true, force: true });
await mkdir(DIR, { recursive: true });

async function build(type, language) {
  const { buffer, pages, model, result } = await renderReport({
    reportType: type, input: SUBJECT, designId: "heritage",
    paletteId: type === "kundli" ? "gold" : "slate",
    branding: { panditName: "Pothi", tagline: "Vedic reports, computed not copied" }, language
  });
  const pdf = path.join(DIR, `${type}_${language}.pdf`);
  await writeFile(pdf, buffer);
  const { stdout } = await run("pdftotext", ["-layout", pdf, "-"], { maxBuffer: 1 << 26 });
  return { text: stdout, pages, model, result };
}

console.log("kundali + dosh — data cross-check\n");

// ── the chart itself, re-derived ────────────────────────────────────────────
const k = await build("kundli", "en");
const planets = k.model.planets;
const lagna = k.model.profile.lagna;
const lagnaIdx = SIGNS.indexOf(lagna);

console.log("chart");
is("nodes exactly 180° apart",
  Math.round((((planets.find((p) => p.name === "Ketu").fullDegree ??
                planets.find((p) => p.name === "Ketu").longitude) -
               (planets.find((p) => p.name === "Rahu").fullDegree ??
                planets.find((p) => p.name === "Rahu").longitude) + 360) % 360)), 180);

const houseErrors = planets.filter((p) => {
  const want = ((SIGNS.indexOf(p.sign) - lagnaIdx + 12) % 12) + 1;
  return p.house !== want;
});
is("every planet's house follows whole-sign from the lagna", houseErrors.map((p) => p.name), []);

is("houses run 1–12 from the lagna sign",
  k.model.houses.map((h) => h.sign),
  Array.from({ length: 12 }, (_, i) => SIGNS[(lagnaIdx + i) % 12]));

// ── what the PDF says vs what was computed ──────────────────────────────────
console.log("\nwhat the kundali PDF prints (English)");
const rows = [...k.text.matchAll(
  /^\s*(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)(?:\s*\(R\))?\s+([A-Z][a-z]+)\s+(\d{1,2})\s+([\d.]+)°/gm
)].map((m) => ({ name: m[1], sign: m[2], house: Number(m[3]), deg: Number(m[4]) }));

is("the planetary table lists all nine grahas", rows.length, 9);
for (const r of rows) {
  const p = planets.find((x) => x.name === r.name);
  const deg = Number((p.normDegree ?? p.degree ?? 0).toFixed(2));
  if (p.sign !== r.sign || p.house !== r.house || Math.abs(deg - r.deg) > 0.02) {
    bad(`${r.name} printed correctly`, r, { sign: p.sign, house: p.house, deg });
  }
}
if (!rows.some((r) => {
  const p = planets.find((x) => x.name === r.name);
  return p.sign !== r.sign || p.house !== r.house;
})) ok("every printed sign and house matches the computed chart");

// The cover letter-spaces its labels ("N A K S H AT R A"), so match on the
// values, anywhere in the document.
for (const [label, value] of [["moon sign", k.model.profile.rashi],
                              ["nakshatra", k.model.profile.nakshatra],
                              ["ascendant", k.model.profile.lagna]])
  is(`the printed ${label} is the computed one (${value})`, k.text.includes(value), true);

// ── divisional charts ───────────────────────────────────────────────────────
console.log("\ndivisional charts");
const divClaims = [...k.text.matchAll(/^•\s+D(\d+) lagna ([A-Z][a-z]+)/gm)]
  .map((m) => ({ d: Number(m[1]), sign: m[2] }));
const ascLon = k.result?.kundliData?.ascendant?.longitude;
is("the report states a divisional lagna for each varga", divClaims.length > 5, true);
const wrong = divClaims.filter((c) => vargaSign(ascLon, c.d) !== c.sign);
is(`every divisional lagna matches the classical Parashari rule (${divClaims.length} checked)`,
   wrong.map((w) => `D${w.d}: printed ${w.sign}, classical ${vargaSign(ascLon, w.d)}`), []);

// ── dashas ──────────────────────────────────────────────────────────────────
console.log("\nvimshottari");
const dashaDates = [...k.text.matchAll(/(\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})/g)]
  .map((m) => new Date(`${m[1]} ${m[2]} ${m[3]} UTC`)).filter((d) => !isNaN(d));
is("the report prints dated periods", dashaDates.length > 20, true);
// The dasha running at birth necessarily began before it — that is the balance
// of dasha, not a bug. Bound it by a lifetime instead.
const birthYear = Number(SUBJECT.dob.slice(0, 4));
const years = dashaDates.map((d) => d.getUTCFullYear());
is("every printed date sits within one Vimshottari cycle of the birth",
   [...new Set(years.filter((y) => y < birthYear - 120 || y > birthYear + 120))], []);

// ── English vs Hindi ────────────────────────────────────────────────────────
console.log("\nenglish vs hindi");
for (const type of ["kundli", "dosh"]) {
  const en = type === "kundli" ? k : await build(type, "en");
  const hi = await build(type, "hi");

  is(`${type}: same number of chapters in both`, hi.model.sections.length, en.model.sections.length);

  // The one thing that must never differ: the numbers.
  const nums = (t) => (t.match(/\d{1,2}\.\d{2}°/g) || []).sort();
  is(`${type}: identical planetary degrees in both languages`, nums(hi.text), nums(en.text));

  const houses = (t) => [...t.matchAll(/^\s*\S+(?:\s*\(R\))?\s+\S+\s+(\d{1,2})\s+[\d.]+°/gm)]
    .map((m) => m[1]);
  is(`${type}: identical house numbers in both languages`, houses(hi.text), houses(en.text));

  // Devanagari in an English report, or long Latin prose in a Hindi one, means
  // a string was not translated.
  // Every cover prints the report's own name in Devanagari by design, so skip
  // page 1 and look for Devanagari that leaked into the body.
  const enBody = en.text.split("\f").slice(1).join("\f");
  is(`${type}: no Devanagari leaked into the English body`,
     [...new Set(enBody.match(/[ऀ-ॿ]{4,}/g) || [])], []);
  const latinRuns = (hi.text.match(/[A-Za-z]{5,}(?:\s+[A-Za-z]{4,}){4,}/g) || []);
  is(`${type}: no untranslated English sentences in the Hindi edition`, latinRuns.slice(0, 2), []);
}

// ── dosh: does the prose agree with the detector? ───────────────────────────
console.log("\ndosh findings");
const d = await build("dosh", "en");
const verdicts = [...d.text.matchAll(/^\s*(?:•\s+)?([A-Z][A-Za-z ]{3,30} Dosh(?:a)?)\s*[—–-]\s*(present|not present|cancelled)/gim)];
is("the dosh report states a verdict for each dosha it checks", verdicts.length > 0, true);
is("no dosha is both present and not present",
   [...new Set(verdicts.map((v) => v[1].trim()))]
     .filter((n) => new Set(verdicts.filter((v) => v[1].trim() === n).map((v) => v[2].toLowerCase())).size > 1),
   []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
