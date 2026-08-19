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
// High enough to cover every thin chapter in the thinnest report we sell.
// One Haiku call handles them together.
const MAX_CHAPTERS = 26;

/**
 * Per-report tuning.
 *
 * One threshold cannot serve both ends of the shelf. The Kundali writes 64
 * chapters and needs almost no help; the Love report writes 15 long-form
 * chapters that each answer a question, and a question answered in 130 words
 * reads like a summary of an answer. So Love asks for a higher floor and a
 * longer expansion, and everything else keeps the conservative default.
 *
 * The guard against padding is unchanged: the model may still not introduce a
 * single fact, so a longer expansion means more explanation of the same
 * computed placement, not more claims.
 */
const PROFILES = {
  love: { thin: 300, add: "220 to 300 words, in three or four paragraphs" },
  health: { thin: 220, add: "160 to 220 words, in two or three paragraphs" },
  default: { thin: THIN_WORDS, add: "90 to 150 words in total" }
};
const profileFor = (t) => PROFILES[t] || PROFILES.default;

const wordsIn = (s) =>
  [s.summary, ...(s.paras || []), ...(s.bullets || [])].filter(Boolean).join(" ")
    .split(/\s+/).filter(Boolean).length;

const SYSTEM = (lang, add) => `
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
- ${add}. Not more.\n- Every paragraph must earn its place. If you find yourself\n  restating the previous paragraph in different words, stop instead.
- Never frighten. No death, disease, divorce, financial ruin or curses.
- Do not give medical, legal or financial advice.
- Do not repeat the sentences you were given — the report already prints them.
- No headings, no bullet points, no markdown.

Return ONLY a JSON object mapping each chapter id to an ARRAY OF PARAGRAPHS:
{"<chapter id>": ["<paragraph>", "<paragraph>"], ...}
One array element per paragraph. Never put a line break inside a string — that
is not valid JSON and the response will be discarded.
No prose outside the JSON, no code fence.
`.trim();

/**
 * Parse the model's reply, surviving the one thing it gets wrong.
 *
 * Asked for paragraphs, a model will sometimes put a literal newline inside a
 * JSON string, which is invalid JSON. Devanagari responses do it more often
 * because they are longer. Before batching, one such reply cost the whole book
 * its expansion and the failure was invisible — it looked like "unparseable"
 * and shipped the thin computed text.
 *
 * So: try it straight, then repair raw newlines inside strings and try again.
 * Anything still broken is the caller's problem to log, not to swallow.
 */
function parseChapters(raw) {
  const body = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(body);
  } catch {
    // Escape only the newlines that sit between an opening and a closing quote.
    let out = "", inStr = false, esc = false;
    for (const ch of body) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === "\\") { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && (ch === "\n" || ch === "\r")) { out += "\\n"; continue; }
      out += ch;
    }
    return JSON.parse(out);
  }
}

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
export async function enrichSections(model, { lang = "en", reportType = "" } = {}) {
  const profile = profileFor(reportType);
  if (!config.ai.enrichReports) return { expanded: 0, rejected: 0, skipped: "disabled" };
  if (!LLM.isLive()) return { expanded: 0, rejected: 0, skipped: "no model configured" };

  // Thinnest first: if the cap ever bites, it must bite the chapters that least
  // need help, not the eighteen-word one at the back of the book.
  const thin = model.sections
    .map((s) => ({ s, w: wordsIn(s) }))
    .filter((x) => x.w < profile.thin)
    .sort((a, b) => a.w - b.w)
    .slice(0, MAX_CHAPTERS)
    .map((x) => x.s);
  if (!thin.length) return { expanded: 0, rejected: 0, skipped: "nothing thin" };

  const describe = (s) => ({
    id: s.id || `ch${s.n}`,
    title: s.title,
    subtitle: s.subtitle || "",
    computed: [s.summary, ...(s.paras || []), ...(s.bullets || [])].filter(Boolean).join("\n")
  });

  /**
   * Sent as several concurrent calls rather than one.
   *
   * The Love report asks for 15 chapters at up to 300 words each. As a single
   * request that is one ~5,000-word completion, and it took 34 seconds — which
   * a buyer spends staring at a spinner immediately after paying. The work
   * splits perfectly: chapters are expanded independently and never reference
   * each other, so N smaller calls in parallel produce identical output in a
   * fraction of the wall-clock.
   *
   * Batches of five, because one chapter per call would multiply the fixed
   * per-request overhead by fifteen for no gain.
   */
  const BATCH = 5;
  const batches = [];
  for (let i = 0; i < thin.length; i += BATCH) batches.push(thin.slice(i, i + BATCH));

  const results = await Promise.all(batches.map(async (batch) => {
    try {
      const raw = await LLM.complete({
        system: SYSTEM(lang, profile.add),
        messages: [{ role: "user", content: JSON.stringify({ chapters: batch.map(describe) }) }],
        // Devanagari costs several tokens per word, and a truncated response
        // surfaces as "unparseable" and silently ships the thin computed text.
        // The Love report failed exactly that way on every Hindi render while
        // English passed, because Hindi is where the budget actually binds.
        maxTokens: 8000,
        modelId: config.ai.enrichModelId,
        // Zero, so the same birth data keeps producing the same book. The
        // reports are advertised as reproducible; a warm temperature would
        // quietly break that.
        temperature: 0
      });
      return parseChapters(raw);
    } catch (e) {
      // One failed batch costs its own chapters, not the whole book.
      console.warn(`[enrich] batch failed, shipping its computed text: ${e.message}`);
      return {};
    }
  }));

  const map = Object.assign({}, ...results);
  if (!Object.keys(map).length) return { expanded: 0, rejected: 0, skipped: "no usable response" };

  let expanded = 0, rejected = 0;
  for (const s of thin) {
    const reply = map[s.id || `ch${s.n}`];
    // The contract asks for an array of paragraphs; older replies send one
    // string with blank lines. Both are accepted, neither is required.
    const paras = Array.isArray(reply)
      ? reply.map((x) => String(x).trim()).filter(Boolean)
      : typeof reply === "string"
        ? reply.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)
        : [];
    const text = paras.join("\n\n");
    if (text.length < 80) continue;

    const original = [s.summary, ...(s.paras || []), ...(s.bullets || [])].filter(Boolean).join(" ");
    const invented = inventsFacts(original, text);
    if (invented) {
      rejected++;
      console.warn(`[enrich] rejected "${s.title}": introduced "${invented}"`);
      continue;
    }
    // Appended, never substituted. The computed sentences stay exactly as they
    // were and stay first — this adds to the chapter, it does not rewrite it.
    s.paras = [...(s.paras || []), ...paras];
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
