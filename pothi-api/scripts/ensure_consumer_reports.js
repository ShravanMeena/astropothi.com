#!/usr/bin/env node
// Idempotent migration: a report may belong to a pandit OR a consumer order.
//
// sync({alter:true}) does not drop an existing NOT NULL, so the column has to be
// altered explicitly. The CHECK then enforces what the model can only comment on:
// exactly one owner, never both, never neither.
import db from "../database/index.js";

const q = (sql) => db.sequelize.query(sql);

await q(`ALTER TABLE reports ALTER COLUMN pandit_id DROP NOT NULL`);
await q(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_one_owner') THEN
      ALTER TABLE reports ADD CONSTRAINT reports_one_owner
        CHECK ((pandit_id IS NOT NULL) <> (order_id IS NOT NULL));
    END IF;
  END $$;
`);
console.log("  reports.pandit_id nullable; reports_one_owner constraint in place");
process.exit(0);
