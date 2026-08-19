#!/usr/bin/env node
/**
 * Who can download a report.
 *
 * A report link is deliberately a capability. The pandit WhatsApps it straight
 * to a client who has no account, and the buyer's download button is a plain
 * anchor — neither can carry a token. So the URL is the only thing between a
 * stranger and somebody's name, date of birth, exact birth time and birth
 * place, and it has to hold on its own.
 *
 * It did not. `reports/<pandit_id>/<report_id>.pdf` is two autoincrementing
 * integers, and `/files` was served with express.static, so
 * /files/reports/1/1.pdf returned a stranger's chart to anyone who counted.
 * Serving the directory statically also handed out every orphan left behind by
 * a deleted report, because a file on disk needed no database row to be read.
 *
 * Both are closed now — putReportPdf refuses a guessable key, and /files/reports
 * resolves through the reports table. This suite is what stops them reopening.
 */
import { execSync } from "node:child_process";
import config from "../config.js";

const API = process.env.API || "http://localhost:4050";
const DB = config.db.name;
let pass = 0, fail = 0;

const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};
const q = (sql) => execSync(`psql -d ${DB} -t -A -c ${JSON.stringify(sql.replace(/\s+/g, " ").trim())}`, { encoding: "utf8" }).trim();
const status = async (p) => (await fetch(`${API}${p}`, { redirect: "manual" })).status;

console.log("report URLs cannot be guessed");

// The shape of the key is the whole defence, so assert it directly rather than
// only through the HTTP surface.
const guessable = Number(q(`SELECT count(*) FROM reports
  WHERE pdf_url IS NOT NULL AND pdf_url ~ '^/files/reports/[0-9]+/'`));
is("no report is stored under a sequential owner id", guessable, 0);

const { putReportPdf } = await import("../utilities/storage.js");
for (const key of ["1", "137", "42", "consumer/ab"]) {
  let refused = false;
  try { await putReportPdf(Buffer.from("x"), key, 1); } catch { refused = true; }
  is(`storage refuses the key "${key}"`, refused, true);
}
// And still accepts the two real shapes.
for (const key of ["consumer/LU2Z2PKM", "p/aB3xY9kQ2m"]) {
  let ok = true;
  try { await putReportPdf(Buffer.from("%PDF-1.3\n"), key, 999999); } catch { ok = false; }
  is(`storage accepts the key "${key}"`, ok, true);
}
execSync(`rm -rf out/reports/consumer/LU2Z2PKM/999999.pdf out/reports/p/aB3xY9kQ2m`, { cwd: new URL("..", import.meta.url).pathname });

console.log("\nenumeration");
for (const p of ["/files/reports/1/1.pdf", "/files/reports/2/2.pdf", "/files/reports/1/2.pdf",
                 "/files/reports/137/162.pdf", "/files/reports/97/95.pdf"]) {
  is(`${p} is not served`, await status(p), 404);
}

console.log("\nan object nothing points at is not readable");
// Written straight to disk under a valid-looking key, with no row behind it.
const orphan = "reports/p/zzOrphanKey/424242.pdf";
execSync(`mkdir -p out/reports/p/zzOrphanKey && printf '%%PDF-1.3' > out/${orphan}`,
         { cwd: new URL("..", import.meta.url).pathname });
is("a file with no reports row is not served", await status(`/files/${orphan}`), 404);
execSync(`rm -rf out/reports/p/zzOrphanKey`, { cwd: new URL("..", import.meta.url).pathname });

console.log("\nreal reports still download");
const pandit = q(`SELECT pdf_url FROM reports WHERE source='pandit' AND pdf_url IS NOT NULL
                  AND "deletedAt" IS NULL ORDER BY id LIMIT 1`);
const buyer = q(`SELECT pdf_url FROM reports WHERE source='consumer' AND pdf_url IS NOT NULL
                 AND "deletedAt" IS NULL ORDER BY id DESC LIMIT 1`);
if (pandit) is("a pandit's report is served", await status(pandit), 200);
else console.log("  – no pandit report in the database, skipped");
if (buyer) is("a buyer's report is served", await status(buyer), 200);
else console.log("  – no consumer report in the database, skipped");

console.log("\nthe caches are still public, and still only caches");
is("path traversal out of /files is refused",
   await status("/files/reports/../../config.js"), 404);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
