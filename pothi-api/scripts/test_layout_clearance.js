#!/usr/bin/env node
// Geometry guard: running head and footer must never touch the page frame.
//
// This is the class of bug that only shows up when someone zooms into a corner —
// text sitting on the border line. Cheap to assert, so assert it.

import { DESIGN_IDS } from "../engine/reporting/designs/index.js";
import { composeStyle } from "../engine/reporting/style.js";

const A4H = 841.89;
const MIN_GAP = 4;          // points of clear air required

let fail = 0;
console.log("design      head→frame   foot→frame");
console.log("─".repeat(44));

for (const d of DESIGN_IDS) {
  const { D, spec } = composeStyle(d, "saffron");
  const M = D.margin;
  const framed = spec.border !== "none";

  // Mirrors header() / footer() in render-report.js.
  const headY = spec.header === "minimal" ? M - 20
              : spec.header === "ornate"  ? M - 38
              : framed ? M - 30 : M - 22;
  const headBottom = headY + 10;
  const footTop = A4H - M - 8 - 11;          // ornate rule sits 9pt above the text

  let top = null, bot = null;
  if (spec.border === "hairline") { top = M - 14; bot = A4H - (M - 14); }
  else if (spec.border === "double") { top = M - 20; bot = A4H - (M - 18); }

  const hGap = top === null ? Infinity : top - headBottom;
  const fGap = bot === null ? Infinity : bot - (A4H - M - 8 + 9);
  const hOk = hGap >= MIN_GAP, fOk = fGap >= MIN_GAP;
  if (!hOk || !fOk) fail++;

  const fmt = (g, ok) => (g === Infinity ? "  n/a  " : `${g.toFixed(0).padStart(4)}pt`) + (ok ? " ✓" : " ✗");
  console.log(`${d.padEnd(11)} ${fmt(hGap, hOk)}    ${fmt(fGap, fOk)}`);
}

console.log("─".repeat(44));
console.log(fail ? `${fail} design(s) with text on the frame` : "all clear");
process.exit(fail ? 1 : 0);
