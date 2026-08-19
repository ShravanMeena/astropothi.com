// Reading the report in the browser, as a book.
//
// A buyer who does not want a download should still be able to read what they
// paid for. We rasterise the delivered PDF once and serve the pages, so the
// reader shows the real typeset artefact rather than a re-flowed web version of
// it — the layout IS the product here.

import { mkdir, readdir, access, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import db from "../../database/index.js";

const run = promisify(execFile);
const OUT = path.resolve(import.meta.dirname, "../..", "out");
const ROOT = path.join(OUT, "readers");
const exists = (p) => access(p).then(() => true).catch(() => false);
const inflight = new Map();

const DPI = 96;   // legible on a laptop without making every page a megabyte

/**
 * Page images for a delivered order, rasterised on first read and cached.
 * Returns null when there is nothing to read yet, or when the PDF lives in
 * object storage rather than on this disk.
 */
export async function orderPages(publicId) {
  const order = await db.Order.findOne({ where: { public_id: publicId } });
  if (!order || order.status !== "ready" || !order.report_id) return null;
  const report = await db.Report.findByPk(order.report_id);
  if (!report?.pdf_url) return null;

  // Only local-disk deliveries can be rasterised here. An S3 URL would need the
  // object pulled back first, which is a deploy-time concern, not a silent
  // fallback — say so plainly instead of half-working.
  if (!report.pdf_url.startsWith("/files/")) return null;
  const pdfPath = path.join(OUT, report.pdf_url.slice("/files/".length));
  if (!(await exists(pdfPath))) return null;

  const key = `${publicId}_${report.id}`;
  const dir = path.join(ROOT, key);
  const manifest = path.join(dir, "manifest.json");
  if (await exists(manifest)) return JSON.parse(await readFile(manifest, "utf8"));
  if (inflight.has(key)) return inflight.get(key);

  const job = (async () => {
    await mkdir(dir, { recursive: true });
    await run("pdftoppm", ["-png", "-r", String(DPI), pdfPath, path.join(dir, "p")],
              { maxBuffer: 1 << 26 });
    // pdftoppm pads the page number to the width of the total count, so sort
    // numerically rather than trusting lexical order.
    const files = (await readdir(dir))
      .filter((f) => /^p-\d+\.png$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    const meta = {
      public_id: publicId,
      total: files.length,
      pages: files.map((f) => ({ page: Number(f.match(/\d+/)[0]), url: `/files/readers/${key}/${f}` }))
    };
    await writeFile(manifest, JSON.stringify(meta));
    return meta;
  })().finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}
