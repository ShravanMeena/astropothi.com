#!/usr/bin/env node
// Does the database actually have what the models expect?
//
// Production does not sync on boot, deliberately — so every new model or
// attribute needs a migration script, and forgetting one is invisible until a
// request touches the missing column and returns 500. That has now happened
// twice: `relation "report_status" does not exist` took out the catalogue, and
// `column "utm_source" does not exist` took out checkout.
//
// This compares every model to the live schema and exits non-zero on drift, so
// a deploy can say it before a buyer does. It only ever READS.
//
//     node scripts/schema_check.js
import db from "../database/index.js";

const qi = db.sequelize.getQueryInterface();
const models = Object.values(db).filter((m) => m && m.tableName && m.rawAttributes);
const drift = [];

for (const M of models) {
  let cols;
  try {
    cols = await qi.describeTable(M.tableName);
  } catch {
    drift.push(`  table missing: ${M.tableName}`);
    continue;
  }
  const missing = Object.values(M.rawAttributes)
    .map((a) => a.field || a.fieldName)
    .filter((c) => !(c in cols));
  if (missing.length) drift.push(`  ${M.tableName}: ${missing.join(", ")}`);
}

if (!drift.length) {
  console.log(`  schema ok — ${models.length} models match the database`);
  process.exit(0);
}

console.error("  SCHEMA DRIFT — the database is missing what the code expects:");
drift.forEach((d) => console.error(d));
console.error("\n  Write an idempotent scripts/ensure_*.js for these and run it.");
console.error("  Do NOT reach for sync({ alter: true }) — see the note in bin/www.js.");
process.exit(1);
