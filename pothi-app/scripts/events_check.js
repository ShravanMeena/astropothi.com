#!/usr/bin/env node
/**
 * Every event the client fires must be registered on the server.
 *
 * events.service.js keeps an allow-list and drops anything it does not
 * recognise — deliberately, so a stale cached bundle cannot poison a batch. The
 * cost is that adding a track() call in the app and forgetting the server side
 * fails silently: the event leaves the browser, the endpoint answers 200, and
 * the row is never written.
 *
 * That is exactly what happened. Ten new events — report_engaged, banner_viewed,
 * video_played, the chart-check trio and the rest — were fired by the live site
 * for a day and stored zero times, and nothing anywhere said so. The Meta Pixel
 * kept working, because that path does not go through the allow-list, which
 * made the gap even harder to see.
 *
 *   node scripts/events_check.js
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SERVICE = resolve(ROOT, "../pothi-api/server/events/events.service.js");

function tsFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) tsFiles(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const fired = new Map();                       // name → first file that fires it
for (const f of tsFiles(join(ROOT, "src"))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/track\("([a-z_]+)"/g)) {
    if (!fired.has(m[1])) fired.set(m[1], f.replace(`${ROOT}/`, ""));
  }
}

const svc = readFileSync(SERVICE, "utf8");
const start = svc.indexOf("export const EVENTS");
const block = svc.slice(start, svc.indexOf("\n};", start));
const allowed = new Set([...block.matchAll(/([a-z_]+):\s*"/g)].map((m) => m[1]));

const missing = [...fired.keys()].filter((n) => !allowed.has(n)).sort();
// The reverse is only a tidiness issue — an allowed name nothing fires costs
// nothing — so it is reported but does not fail.
const unused = [...allowed].filter((n) => !fired.has(n)).sort();

console.log(`\n  ${fired.size} events fired by the app, ${allowed.size} allowed by the server\n`);
if (unused.length) console.log(`  allowed but never fired: ${unused.join(", ")}\n`);
if (missing.length) {
  console.error("  ✗ fired by the app and DROPPED by the server:");
  for (const n of missing) console.error(`      ${n.padEnd(24)} ${fired.get(n)}`);
  console.error(`\n    Add them to EVENTS in pothi-api/server/events/events.service.js.\n`);
  process.exit(1);
}
console.log("  ✓ every event the app fires is stored\n");
