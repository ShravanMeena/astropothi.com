#!/usr/bin/env node
/**
 * Chapter enrichment — the guard, not the prose.
 *
 * Makes ONE live model call, so it is deliberately outside `npm test`. What it
 * proves is the only thing that matters about this feature: the computed
 * sentences survive untouched, and an expansion that invents a fact is thrown
 * away rather than printed.
 */
import { renderReport } from "../engine/render.js";
import { enrichSections } from "../engine/ai/enrich.js";
import * as LLM from "../server/ai/llm.js";

let pass = 0, fail = 0;
const is = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "✓" : "✗"} ${n}${ok ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};
const words = (s) => [s.summary, ...(s.paras || []), ...(s.bullets || [])]
  .filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length;

const INPUT = { name: "Ravi Sharma", dob: "1992-03-17", tob: "09:42", pob: "Varanasi",
                lat: 25.3176, lon: 82.9739, tzone: 5.5, gender: "male" };

console.log("chapter enrichment\n");

if (!LLM.isLive()) {
  console.log("  – no model configured; nothing to test");
  process.exit(0);
}

// Baseline: the templates alone.
process.env.AI_ENRICH_REPORTS = "false";
const plain = await renderReport({ reportType: "love", input: INPUT, designId: "heritage",
  paletteId: "saffron", branding: { panditName: "Pothi" }, language: "en" });
const before = plain.model.sections.map((s) => ({
  id: s.id, n: s.n, summary: s.summary, bullets: [...(s.bullets || [])],
  paras: [...(s.paras || [])], w: words(s)
}));

// Enrich a copy of that same model.
const model = JSON.parse(JSON.stringify(plain.model));
process.env.AI_ENRICH_REPORTS = "true";
const { default: config } = await import("../config.js");
config.ai.enrichReports = true;                       // config was read before the env change
const out = await enrichSections(model, { lang: "en" });
console.log(`  · expanded ${out.expanded}, rejected ${out.rejected}${out.skipped ? `, skipped: ${out.skipped}` : ""}`);

is("something was expanded", out.expanded > 0, true);

// ── the guarantees ─────────────────────────────────────────────────────────
const summaryChanged = model.sections.filter((s, i) => s.summary !== before[i].summary);
is("no computed summary was rewritten", summaryChanged.map((s) => s.title), []);

const bulletsChanged = model.sections.filter((s, i) =>
  JSON.stringify(s.bullets || []) !== JSON.stringify(before[i].bullets));
is("no computed bullet was rewritten", bulletsChanged.map((s) => s.title), []);

const lostAPara = model.sections.filter((s, i) =>
  before[i].paras.some((p) => !(s.paras || []).includes(p)));
is("every computed paragraph is still present", lostAPara.map((s) => s.title), []);

const shrunk = model.sections.filter((s, i) => words(s) < before[i].w);
is("no chapter got shorter", shrunk.map((s) => s.title), []);

// ── the fact guard ─────────────────────────────────────────────────────────
const SIGNS = /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/g;
const invented = [];
model.sections.forEach((s, i) => {
  const src = [before[i].summary, ...before[i].paras, ...before[i].bullets].join(" ").toLowerCase();
  const added = (s.paras || []).filter((p) => !before[i].paras.includes(p)).join(" ");
  for (const sign of added.match(SIGNS) || []) {
    if (!src.includes(sign.toLowerCase())) invented.push(`${s.title}: ${sign}`);
  }
});
is("no expansion names a sign its chapter never mentioned", invented, []);

const thinAfter = model.sections.filter((s) => words(s) < 50).length;
console.log(`  · chapters under 50 words: ${before.filter((b) => b.w < 50).length} → ${thinAfter}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
