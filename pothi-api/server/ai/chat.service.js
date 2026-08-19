// The report assistant.
//
// A real conversation, grounded in one specific book. The retrieval layer in
// shop/ask.service.js is not replaced by the model — it feeds it. The model is
// given the buyer's actual chapters and their actual placements, and is told to
// answer only from those. That is the difference between an astrologer who has
// read your chart and one who is making it up.
//
// Without an API key this module is never reached; the route falls back to
// quoting passages.

import db from "../../database/index.js";
import config from "../../config.js";
import * as LLM from "./llm.js";
import { ask as retrieve } from "../shop/ask.service.js";

const SYSTEM = ({ lang, title, facts, outline, chapters }) => `
You are the reading assistant for a Vedic astrology report published by Pothi.
The buyer has already paid for and received this report: "${title}".

YOUR ONE JOB is to help them understand what THEIR report says. You are not an
astrologer and you are not writing a new reading.

THE REPORT'S OWN FACTS — these are computed, and they are the only chart data
that exists. Never state a placement, sign, house, date or score that is not
here or in the excerpts below:
${facts}

EVERY CHAPTER IN THEIR REPORT (number, title, and the gist):
${outline}

FULL TEXT OF THE CHAPTERS MOST RELEVANT TO THIS QUESTION:
${chapters}

RULES, in order of importance:
1. ANSWER THE QUESTION. You have the full text of the relevant chapters and the
   gist of every other one. Never reply that you "do not have the excerpt", never
   ask the buyer to type their report to you, and never tell them to go and read
   a chapter instead of answering. They paid for an answer. If the full text you
   need is not here, answer from the gist in the outline and say which chapter
   has the detail — but ANSWER FIRST.
2. Never state a placement, sign, house, date or score that is not in the facts,
   the outline or the excerpts. That is the one thing you may not do.
3. Cite chapters in passing, like "(Chapter 13)". Do not list sources at the end.
4. Never give medical, legal, financial or psychiatric advice, and never predict
   death, disease or disaster.
5. Do not tell anyone to break off a marriage, an engagement or a relationship,
   and do not describe anyone as cursed or doomed. Doshas have cancellations and
   the report tests them — reflect that balance.
6. Do not recommend paid remedies or rituals beyond what the report prescribes,
   and never suggest buying another report.

HOW TO WRITE
- Short. Three to five sentences. One paragraph, occasionally two. Never more.
- PLAIN TEXT ONLY. No asterisks, no bold, no markdown, no headings, no bullet
  lists, no emoji. The answer is displayed as plain text and any ** will show up
  literally on the screen.
- Do not open with a greeting or the buyer's name after the first message.
- Reply in ${lang === "hi" ? "Hindi (Devanagari)" : "whatever the buyer wrote in — English, Hindi or Hinglish, matching them"}.

The buyer is often anxious. Be calm, concrete and kind.
`.trim();

/** The handful of computed facts worth putting in front of the model verbatim. */
function factSheet(report, order) {
  const b = report?.birth_meta || order?.birth || order?.property || {};
  const lines = [];
  if (b.name) lines.push(`Subject: ${b.name}`);
  if (b.dob) lines.push(`Born: ${b.dob}${b.tob ? ` at ${b.tob}` : ""}${b.pob ? `, ${b.pob}` : ""}`);
  if (b.facing) lines.push(`Property faces: ${b.facing}`);
  if (report?.rashi) lines.push(`Moon sign (rashi): ${report.rashi}`);
  if (report?.nakshatra) lines.push(`Nakshatra: ${report.nakshatra}`);
  if (report?.lagna) lines.push(`Ascendant (lagna): ${report.lagna}`);
  if (report?.page_count) lines.push(`Report length: ${report.page_count} pages`);
  return lines.length ? lines.join("\n") : "(no chart facts recorded)";
}

/**
 * Answer one question in a conversation.
 *
 * @param {string} publicId
 * @param {string} question
 * @param {{role:"user"|"assistant",content:string}[]} history
 * @returns {Promise<{kind:string,answer?:string,hits?:any[],reason?:string}>}
 */
export async function chat(publicId, question, history = [], lang = "en") {
  const q = String(question || "").trim().slice(0, 500);
  if (!q) return { kind: "none" };

  const order = await db.Order.findOne({ where: { public_id: publicId } });
  if (!order || order.status !== "ready" || !order.report_id) return { kind: "none" };

  // Metered: this endpoint is public and every call costs money.
  if (order.ai_questions >= config.ai.maxQuestionsPerOrder) {
    return { kind: "limit", reason: "question limit reached for this report" };
  }

  const report = await db.Report.findByPk(order.report_id);
  const sections = report?.report_json?.sections || [];

  // Ground it. Retrieval picks the chapters; without this the model would be
  // answering about astrology in general rather than about this person's chart.
  const found = await retrieve(publicId, q, lang);
  let picked = found.kind === "passages"
    ? found.hits.map((h) => sections.find((s) => s.n === h.n)).filter(Boolean)
    : [];
  // A question the search cannot place still deserves an answer, so fall back
  // to the report's opening chapters, which describe what it covers.
  if (!picked.length) picked = sections.slice(0, 3);

  // The whole table of contents with a gist of each chapter. This is what stops
  // the assistant answering "I do not have that chapter" — it always knows what
  // every chapter of this buyer's book contains, even the ones not retrieved.
  const outline = sections
    .map((s) => `${s.n}. ${s.title}${s.subtitle ? ` — ${s.subtitle}` : ""}: ${String(s.text).replace(/\s+/g, " ").slice(0, 200)}`)
    .join("\n");

  const chapters = picked
    .map((s) => `--- Chapter ${s.n}: ${s.title}${s.subtitle ? ` (${s.subtitle})` : ""} ---\n${String(s.text).slice(0, 3000)}`)
    .join("\n\n");

  const system = SYSTEM({
    lang, title: report?.report_type || "report",
    facts: factSheet(report, order), outline, chapters
  });

  const messages = [
    // Only the recent turns: the excerpts above are what matters, and a long
    // history is spend without accuracy.
    ...history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1200)
    })),
    { role: "user", content: q }
  ];

  // Short answers by construction as well as by instruction.
  const answer = await LLM.complete({
    system, messages, maxTokens: 420, temperature: 0.3,
    modelId: config.ai.chatModelId || undefined
  });
  await order.increment("ai_questions").catch(() => {});

  return {
    kind: "answer",
    answer,
    // The chapters the answer was built from, so the buyer can go and read them.
    sources: picked.map((s) => ({ n: s.n, title: s.title }))
  };
}
