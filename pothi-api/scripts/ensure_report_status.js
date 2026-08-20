#!/usr/bin/env node
// Idempotent migration: create the report_status table.
//
// Production does not sync on boot (see bin/www.js), so a new model does not
// become a table by deploying — the catalogue simply starts answering 500 with
// `relation "report_status" does not exist`, which is how this one was found.
//
// `Model.sync()` on a single model issues CREATE TABLE IF NOT EXISTS for that
// table alone. That is deliberately narrower than `sequelize.sync()`: syncing
// everything would walk all seventeen models, and Sequelize cannot tell an
// existing UNIQUE constraint from one it still needs to create.
import db from "../database/index.js";

const [, created] = await db.sequelize.query(
  `SELECT to_regclass('public.report_status') IS NOT NULL AS present`
).then(([rows]) => [null, rows[0].present]);

await db.ReportStatus.sync();

const rows = await db.ReportStatus.count();
console.log(created
  ? `  report_status already existed — ${rows} override(s) in place`
  : `  report_status created — no overrides yet, every report falls back to catalog.js \`ready\``);
process.exit(0);
