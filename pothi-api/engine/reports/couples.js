// Couples Challenge — 30 days, 30 questions. Deterministic, NO LLM.
//
// The second report in this catalogue that is not derived from a birth chart,
// after Vastu — and the first whose subject is two people rather than one. It
// never touches the astrology engine, so stages 1 and 2 of the pipeline in
// docs/09-adding-a-report.md simply do not run.
//
// Enrichment must stay OFF for this report. engine/ai/enrich.js expands any
// chapter under 90 words, and every daily page here is deliberately short — a
// question, a line of framing, one small action. Enriched, all thirty become
// paragraphs and the format the buyer paid for is gone. render.js passes
// `enrich: false` for this type; do not remove it.
//
// Contract: generateCouplesBook(input) → { report, sections, kundliData: null }

import { buildCouplesSections, formatMonthYear } from "../mapping/couples-chapters.js";

export async function generateCouplesBook(input) {
  const language = input.language === "hi" ? "hi" : "en";

  // The checkout sends these nested under subject_meta; the pandit console and
  // the test scripts pass them flat. Accept both rather than making the caller
  // remember which shape this one report wants.
  const meta = input.subject_meta ?? input;

  const sections = buildCouplesSections(meta, language);

  return {
    report: {
      generated_by: "inhouse_couples",
      language,
      couple_profile: {
        partner1: String(meta.partner1_name ?? "").trim(),
        partner2: String(meta.partner2_name ?? "").trim(),
        // Stored as it will be printed, so an order page and the book can never
        // disagree about the date.
        since: formatMonthYear(meta.start_date, language),
        is_gift: Boolean(String(meta.gift_message ?? "").trim()),
        days: 30
      },
      sections
    },
    sections,
    // No chart is cast for a couple. doc-model handles a null here — the cover
    // falls back to its own motif instead of drawing an empty birth square.
    kundliData: null
  };
}
