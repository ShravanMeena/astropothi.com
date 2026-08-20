#!/usr/bin/env node
// Idempotent migration: the `couple` column on orders.
//
// A Couples Challenge order has neither a birth moment nor a building — two
// names, an optional start date, an optional gift message. It gets its own
// JSONB column for the same reason `property` has one: nothing that reads
// `birth` should have to learn that some orders keep something else there.
//
// Production does not sync on boot (see bin/www.js), so this must run after the
// deploy that adds the model attribute. `npm run migrate` includes it, and
// scripts/schema_check.js will say so if it was skipped.
import db from "../database/index.js";

const [rows] = await db.sequelize.query(
  `SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'couple'`
);

if (rows.length) {
  console.log("  orders.couple already present — nothing to do");
} else {
  await db.sequelize.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS couple JSONB`);
  console.log("  + orders.couple JSONB");
}
process.exit(0);
