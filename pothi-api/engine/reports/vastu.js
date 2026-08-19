// In-house Vastu Wheel report — deterministic, NO LLM.
//
// The one report in this catalogue that is not derived from a birth chart. Its
// subject is a building: which way it faces and what sits in each corner. It
// therefore takes its own input shape and never touches the astrology engine.
//
// Contract: generateInhouseVastu(input) → { report, sections, kundliData: null }

import { auditVastu, ZONE } from "../vastu/rules.js";
import { buildVastuSections } from "../mapping/vastu-chapters.js";

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Accepts "north-east", "NE", "ने" … and returns a zone key, or null. */
export function normalizeDirection(v) {
  const s = String(v || "").trim().toUpperCase().replace(/[\s_]/g, "-");
  if (DIRECTIONS.includes(s) || s === "C") return s;
  const long = {
    "NORTH": "N", "NORTH-EAST": "NE", "NORTHEAST": "NE", "EAST": "E",
    "SOUTH-EAST": "SE", "SOUTHEAST": "SE", "SOUTH": "S",
    "SOUTH-WEST": "SW", "SOUTHWEST": "SW", "WEST": "W",
    "NORTH-WEST": "NW", "NORTHWEST": "NW", "CENTRE": "C", "CENTER": "C"
  };
  return long[s] || null;
}

export async function generateInhouseVastu(input) {
  const language = input.language === "hi" ? "hi" : "en";

  const facing = normalizeDirection(input.facing) || "N";
  const rooms = {};
  for (const [k, v] of Object.entries(input.rooms || {})) {
    const d = normalizeDirection(v);
    if (d) rooms[k] = d;
  }

  const audit = auditVastu({ facing, rooms });
  const sections = buildVastuSections(audit, input, language);

  return {
    report: {
      generated_by: "inhouse_vastu",
      language,
      vastu_profile: {
        facing,
        facing_name: ZONE[facing]?.en,
        score: audit.score,
        counts: audit.counts,
        findings: audit.findings
      },
      sections
    },
    sections,
    // No chart is cast for a building. The doc model handles this — the cover
    // falls back to its wheel motif and the profile chips are replaced by facts.
    kundliData: null
  };
}
