#!/usr/bin/env node
// Idempotent migration + seeding for staff access.
//
// `is_admin` is deliberately not reachable from any route: promoting somebody
// is a deploy-shell action, not an API call, so there is no endpoint to get
// wrong and no request that can escalate a privilege.
//
//   node scripts/ensure_admin.js                 → add the column, list admins
//   node scripts/ensure_admin.js 9660801827      → grant
//   node scripts/ensure_admin.js 9660801827 off  → revoke
import db from "../database/index.js";

const q = (sql, replacements) =>
  db.sequelize.query(sql, { replacements, type: db.Sequelize.QueryTypes.SELECT });

await db.sequelize.query(
  `ALTER TABLE pandits ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false`
);

const phone = String(process.argv[2] || "").replace(/\D/g, "").slice(-10);
const off = String(process.argv[3] || "").toLowerCase() === "off";

if (phone) {
  // Grant only to a pandit that already exists. Creating the row here would
  // mean a typo silently mints a staff account against a phone nobody owns.
  const [row] = await q(`SELECT id FROM pandits WHERE phone = :phone AND "deletedAt" IS NULL`, { phone });
  if (!row) {
    console.error(`  ✗ no pandit with phone ${phone} — sign in at /astrologers once first, then re-run`);
    process.exit(1);
  }
  await db.sequelize.query(
    `UPDATE pandits SET is_admin = :on, "updatedAt" = now() WHERE id = :id`,
    { replacements: { on: !off, id: row.id } }
  );
  console.log(`  ${off ? "revoked" : "granted"} admin on ${phone} (pandit ${row.id})`);
}

const admins = await q(
  `SELECT id, phone, COALESCE(name,'') AS name, status
     FROM pandits WHERE is_admin AND "deletedAt" IS NULL ORDER BY id`
);
console.log(`  ${admins.length} admin${admins.length === 1 ? "" : "s"}:`);
for (const a of admins) console.log(`    #${a.id}  ${a.phone}  ${a.name || "(no name)"}  ${a.status}`);
if (!admins.length) console.log("    (none — run: node scripts/ensure_admin.js <phone>)");
process.exit(0);
