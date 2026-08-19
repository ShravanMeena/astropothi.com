#!/usr/bin/env node
/**
 * Drop the duplicate UNIQUE constraints that sync({ alter: true }) leaves behind.
 *
 * Sequelize cannot tell "this column already has its unique constraint" from
 * "this column needs one", so every boot in development adds another. They are
 * not cosmetic: each one is a real index Postgres writes on every INSERT and
 * UPDATE of that table. This database reached 402 identical unique indexes on
 * orders.public_id — 402 index writes per order.
 *
 * Keeps the oldest constraint on each (table, column set) and drops the rest.
 * Safe to run any time; it never drops the last one.
 */
import db from "../database/index.js";

const rows = await db.sequelize.query(
  `SELECT c.oid, c.conname, c.conrelid::regclass::text AS tbl,
          array_to_string(c.conkey, ',') AS cols
     FROM pg_constraint c
     JOIN pg_class t ON t.oid = c.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'u' AND n.nspname = 'public'
    ORDER BY c.oid`,
  { type: db.Sequelize.QueryTypes.SELECT }
);

const seen = new Set();
const doomed = [];
for (const r of rows) {
  const key = `${r.tbl}|${r.cols}`;
  if (seen.has(key)) doomed.push(r); else seen.add(key);
}

if (!doomed.length) {
  console.log(`  ✓ nothing to do — ${rows.length} unique constraints, none duplicated`);
  process.exit(0);
}

console.log(`  ${rows.length} unique constraints, ${doomed.length} duplicates`);
const byTable = {};
for (const d of doomed) byTable[d.tbl] = (byTable[d.tbl] || 0) + 1;
for (const [t, n] of Object.entries(byTable).sort((a, b) => b[1] - a[1]))
  console.log(`    ${t.padEnd(20)} ${n}`);

// One statement per constraint rather than one giant ALTER: a name that has
// already gone (two runs racing) must not abort the rest.
let dropped = 0;
for (const d of doomed) {
  try {
    await db.sequelize.query(`ALTER TABLE ${d.tbl} DROP CONSTRAINT IF EXISTS "${d.conname}"`);
    dropped++;
  } catch (e) {
    console.error(`    ✗ ${d.tbl}.${d.conname}: ${e.message}`);
  }
}
console.log(`  ✓ dropped ${dropped}`);
process.exit(0);
