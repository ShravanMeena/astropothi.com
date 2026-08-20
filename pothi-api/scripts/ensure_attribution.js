#!/usr/bin/env node
// Idempotent migration: campaign attribution on orders and users.
//
// Production does not sync on boot (see bin/www.js), so new model attributes do
// not become columns by deploying. These seven arrived together and took the
// storefront down with `column "utm_source" does not exist` — an error the buyer
// sees as a checkout that simply fails.
//
// ADD COLUMN IF NOT EXISTS rather than sync({ alter: true }): alter walks every
// model and cannot tell an existing UNIQUE constraint from one it still needs to
// create, which is how the development database collected 402 identical unique
// indexes on orders.public_id.
import db from "../database/index.js";

const COLUMNS = [
  // Both touches are stored ON THE ORDER at creation. Stitching them from
  // app_events later relies on a browser-local anonymous_id, which a cleared
  // cache or a second device breaks — and the one row that must never lose its
  // attribution is the one with money on it.
  ["orders", "utm_source",         "VARCHAR(120)"],
  ["orders", "utm_medium",         "VARCHAR(120)"],
  ["orders", "utm_campaign",       "VARCHAR(160)"],
  ["orders", "attribution",        "JSONB"],
  // First touch only: the question a customer row answers is which campaign
  // acquired them, not what they clicked last week.
  ["users",  "first_utm_source",   "VARCHAR(120)"],
  ["users",  "first_utm_campaign", "VARCHAR(160)"],
  ["users",  "attribution",        "JSONB"]
];

let added = 0;
for (const [table, column, type] of COLUMNS) {
  const [rows] = await db.sequelize.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_name = :table AND column_name = :column`,
    { replacements: { table, column } }
  );
  if (rows.length) continue;
  await db.sequelize.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
  console.log(`  + ${table}.${column} ${type}`);
  added++;
}

console.log(added ? `  ${added} column(s) added` : "  nothing to do — all seven already present");
process.exit(0);
