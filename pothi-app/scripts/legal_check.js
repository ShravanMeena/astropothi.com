#!/usr/bin/env node
/**
 * Refuses to let an incomplete legal page reach production quietly.
 *
 * The on-page notice is development-only, because a buyer must never read a
 * page that admits it is unfinished. That leaves nothing between a missing
 * grievance officer and a live site — which is what this is for. Run it with
 * --strict in the deploy pipeline and a gap fails the build instead of
 * shipping.
 *
 * Reads src/lib/legal.ts as text rather than importing it, so it works before
 * the TypeScript build and cannot be broken by a compile error.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const FILE = path.resolve(import.meta.dirname, "../src/lib/legal.ts");
const strict = process.argv.includes("--strict");
const src = await readFile(FILE, "utf8");

/** `field: null as string | null` means unset; a quoted string means set. */
const valueOf = (field) => {
  const m = src.match(new RegExp(`${field}\\s*:\\s*(null\\b|"([^"]*)")`));
  if (!m) return { missing: true, reason: `${field} is not declared in legal.ts` };
  if (m[1] === "null" || !m[2]?.trim()) return { missing: true };
  return { missing: false, value: m[2] };
};

const REQUIRED = [
  ["entity", "the registered entity name"],
  ["address", "the registered address"],
  ["grievanceOfficer", "a named grievance officer — Consumer Protection (E-Commerce) Rules 2020, r.4(5)"],
  ["gstin", 'the GSTIN — the checkout and the policies both state prices "include GST"']
];

const gaps = [];
for (const [field, why] of REQUIRED) {
  const v = valueOf(field);
  if (v.missing) gaps.push(`${field.padEnd(18)} ${why}`);
}

if (!gaps.length) {
  console.log("  ✓ legal pages complete");
  process.exit(0);
}

const head = `${gaps.length} legal detail${gaps.length > 1 ? "s" : ""} still missing:`;
if (strict) {
  console.error(`  ✗ ${head}`);
  gaps.forEach((g) => console.error(`      ${g}`));
  console.error("    Set them in pothi-app/src/lib/legal.ts, then build again.");
  process.exit(1);
}
console.warn(`  ⚠ ${head}`);
gaps.forEach((g) => console.warn(`      ${g}`));
process.exit(0);
