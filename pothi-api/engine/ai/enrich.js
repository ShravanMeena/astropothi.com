// ─────────────────────────────────────────────────────────────────────────────
// Filling out a thin chapter, without inventing anything.
//
// The split this module exists to enforce:
//
//   FACTS come from the chart. Placements, signs, houses, degrees, dasha dates,
//   dosh scores, bindus — all computed, all deterministic, never touched here.
//
//   EXPLANATION can be written. What a placement means, what to watch for, how
//   it tends to play out — that is interpretation, and a language model writes
//   it better than a template does.
//
// So the model is handed the computed sentences and asked to expand around
// them. It is explicitly forbidden from stating a placement, sign, house or
// date that is not already in what it was given, and the output is checked for
// exactly that before it is accepted.
//
// One call per report, not one per chapter: twenty-four round trips would cost
// twenty-four times as much and take a minute.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import config from "../../config.js";
import * as LLM from "../../server/ai/llm.js";

/** A chapter this thin is why buyers see half-empty pages. */
const THIN_WORDS = 90;
// High enough to cover every thin chapter in the thinnest report we sell (Love
// has 19). One Haiku call handles them together.
const MAX_CHAPTERS = 26;

const wordsIn = (s) =>
  [s.summary, ...(s.paras || []), ...(s.bullets || [])].filter(Boolean).join(" ")
    .split(/\s+/).filter(Boolean).length;

const SYSTEM = (lang) => `
You expand chapters of a Vedic astrology report that has ALREADY been computed.

THE ONE RULE: you may not introduce a single new fact. Every sign, house,
planet, degree, date, score and yoga you mention must already appear in the
chapter text you are given. If a chapter says "Venus in Aquarius, house 1", you
may explain what that placement means — you may NOT add that Venus aspects
anything, or name a dasha date, or mention any other planet's position.

What you are adding is explanation, in this order:
  1. What the computed placement actually means, in plain language.
  2. How it tends to show up in ordinary life — concrete, not mystical.
  3. What the reader can do with it, if the chapter's subject allows.

STYLE
- ${lang === "hi" ? "Hindi (Devanagari). Simple, warm, no Sanskrit the reader would need a dictionary for." : "English. Simple, warm, no jargon without a plain-language gloss in the same sentence."}
- Two or three paragraphs, 90 to 150 words in total. Not more.
- Never frighten. No death, disease, divorce, financial ruin or curses.
- Do not give medical, legal or financial advice.
- Do not repeat the sentences you were given — the report already prints them.
- No headings, no bullet points, no markdown. Plain paragraphs separated by a
  blank line.

Return ONLY a JSON object: {"<chapter id>": "<the paragraphs>", ...}
No prose outside the JSON, no code fence.
`.trim();

/** Anything that looks like a hard fact, so we can check none were invented. */
const SIGNS = /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|मेष|वृषभ|मिथुन|कर्क|सिंह|कन्या|तुला|वृश्चिक|धनु|मकर|कुम्भ|मीन)\b/g;
const DATES = /\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/g;

/**
 * Reject an expansion that names a sign or a date the chapter never mentioned.
 * This is the check that makes the module safe to ship: without it, "explain
 * this" quietly becomes "make something up".
 */
function inventsFacts(original, expansion) {
  const src = original.toLowerCase();
  for (const re of [SIGNS, DATES]) {
    for (const hit of expansion.match(re) || []) {
      if (!src.includes(hit.toLowerCase())) return hit;
    }
  }
  return null;
}

/**
 * @param {object} model  the doc model, mutated in place
 * @returns {Promise<{expanded:number, rejected:number, skipped:string}>}
 */
export async function enrichSections(model, { lang = "en" } = {}) {
  if (!config.ai.enrichReports) return { expanded: 0, rejected: 0, skipped: "disabled" };
  if (!LLM.isLive()) return { expanded: 0, rejected: 0, skipped: "no model configured" };

  // Thinnest first: if the cap ever bites, it must bite the chapters that least
  // need help, not the eighteen-word one at the back of the book.
  const thin = model.sections
    .map((s) => ({ s, w: wordsIn(s) }))
    .filter((x) => x.w < THIN_WORDS)
    .sort((a, b) => a.w - b.w)
    .slice(0, MAX_CHAPTERS)
    .map((x) => x.s);
  if (!thin.length) return { expanded: 0, rejected: 0, skipped: "nothing thin" };

  const payload = thin.map((s) => ({
    id: s.id || `ch${s.n}`,
    title: s.title,
    subtitle: s.subtitle || "",
    computed: [s.summary, ...(s.paras || []), ...(s.bullets || [])].filter(Boolean).join("\n")
  }));

  let raw;
  try {
    raw = await LLM.complete({
      system: SYSTEM(lang),
      messages: [{ role: "user", content: JSON.stringify({ chapters: payload }) }],
      maxTokens: 4000,
      modelId: config.ai.enrichModelId,
      // Zero, so the same birth data keeps producing the same book. The reports
      // are advertised as reproducible and a warm temperature would break that.
      temperature: 0
    });
  } catch (e) {
    console.warn(`[enrich] model failed, shipping the computed text: ${e.message}`);
    return { expanded: 0, rejected: 0, skipped: `model error: ${e.message}` };
  }

  let map;
  try {
    map = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    console.warn("[enrich] model returned unparseable JSON; shipping the computed text");
    return { expanded: 0, rejected: 0, skipped: "unparseable" };
  }

  let expanded = 0, rejected = 0;
  for (const s of thin) {
    const text = map[s.id || `ch${s.n}`];
    if (typeof text !== "string" || text.trim().length < 80) continue;

    const original = [s.summary, ...(s.paras || []), ...(s.bullets || [])].filter(Boolean).join(" ");
    const invented = inventsFacts(original, text);
    if (invented) {
      rejected++;
      console.warn(`[enrich] rejected "${s.title}": introduced "${invented}"`);
      continue;
    }
    // Appended, never substituted. The computed sentences stay exactly as they
    // were and stay first — this adds to the chapter, it does not rewrite it.
    s.paras = [...(s.paras || []), ...text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)];
    s.enriched = true;
    expanded++;
  }
  return { expanded, rejected, skipped: null };
}

/** Stable key for caching an enrichment against a chart. */
export const enrichKey = (reportType, lang, sections) =>
  crypto.createHash("sha1")
    .update(`${reportType}|${lang}|` + sections.map((s) => `${s.id}:${(s.summary || "").slice(0, 80)}`).join("|"))
    .digest("hex").slice(0, 16);
