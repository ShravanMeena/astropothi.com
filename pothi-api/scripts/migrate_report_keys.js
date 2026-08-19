#!/usr/bin/env node
/**
 * Move pandit reports off their guessable URLs.
 *
 * `reports/<pandit_id>/<report_id>.pdf` is two autoincrementing integers, and
 * the file behind it is served without authentication — by design, because the
 * pandit WhatsApps the link to a client who has no account. That design needs
 * the URL to be unguessable, and it was not: /files/reports/1/1.pdf downloaded
 * a stranger's birth chart, name, date, exact time and place included.
 *
 * This rewrites those rows to `reports/p/<share_token>/<id>.pdf` and moves the
 * bytes. Consumer reports already used a random order id and are left alone.
 *
 * Old links stop working. That is the point — they were the vulnerability, and
 * eleven of them exist. Run once, and re-run safely: it skips anything already
 * migrated.
 */
import path from "node:path";
import { rename, mkdir, access } from "node:fs/promises";
import db from "../database/index.js";
import config from "../config.js";

const OUT = path.resolve(import.meta.dirname, "..", "out");
const exists = (p) => access(p).then(() => true, () => false);
const apply = process.argv.includes("--apply");

const rows = await db.Report.findAll({
  where: { source: "pandit" },
  attributes: ["id", "pdf_url", "share_token"]
});

const stale = rows.filter((r) => r.pdf_url?.startsWith("/files/reports/")
                              && !r.pdf_url.startsWith("/files/reports/p/"));

if (!stale.length) { console.log("  ✓ nothing to migrate"); process.exit(0); }
console.log(`  ${stale.length} report(s) on a guessable path`);

let moved = 0, missing = 0, blocked = 0;
for (const r of stale) {
  if (!r.share_token) { console.log(`  ✗ report ${r.id} has no share_token — skipped`); blocked++; continue; }
  const oldKey = r.pdf_url.slice("/files/".length);
  const newKey = `reports/p/${r.share_token}/${r.id}.pdf`;

  if (!apply) { console.log(`    ${oldKey}  →  ${newKey}`); continue; }

  if (config.storage.enabled) {
    const { Storage } = await import("@google-cloud/storage");
    const bucket = new Storage().bucket(config.storage.bucket);
    const src = bucket.file(oldKey);
    if ((await src.exists())[0]) { await src.move(newKey); moved++; }
    else missing++;
  } else {
    const from = path.join(OUT, oldKey), to = path.join(OUT, newKey);
    if (await exists(from)) {
      await mkdir(path.dirname(to), { recursive: true });
      await rename(from, to);
      moved++;
    } else missing++;
  }
  await r.update({ pdf_url: `/files/${newKey}` });
}

if (!apply) { console.log("\n  dry run — re-run with --apply to move them"); process.exit(0); }
console.log(`  ✓ ${moved} moved, ${missing} row(s) updated with no file on disk, ${blocked} blocked`);
process.exit(0);
