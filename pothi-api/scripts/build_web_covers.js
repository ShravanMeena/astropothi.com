#!/usr/bin/env node
/**
 * Rebuild the storefront's static cover images from the live renderer.
 *
 * The home hero and the Designs section ship real PNGs rather than fetching a
 * preview, because they are above the fold and must paint instantly. That means
 * they go stale the moment the cover design changes — which is exactly what
 * happened. Run this after any change to the cover, and the marketing site
 * shows the book we actually print.
 */
import { mkdir, readdir, copyFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { getPreview } from "../server/catalog/preview.service.js";

const run = promisify(execFile);

const OUT = path.resolve(import.meta.dirname, "..", "..", "pothi-app", "public", "covers");
const FROM = path.resolve(import.meta.dirname, "..", "out", "previews");

const pageIn = async (dir, n) => {
  const files = (await readdir(path.join(FROM, dir)))
    .filter((f) => /^p-\d+\.png$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  return files[n] ? path.join(FROM, dir, files[n]) : null;
};

await mkdir(OUT, { recursive: true });

for (const design of ["classic", "heritage", "editorial"]) {
  const meta = await getPreview("kundli", design, "gold", "en", "house");
  const dir = path.basename(path.dirname(meta.images[0].url)); // …/previews/<key>/p-01.png
  const cover = await pageIn(dir, 0);
  if (!cover) throw new Error(`no cover rendered for ${design}`);
  await copyFile(cover, path.join(OUT, `${design}.png`));
  console.log(`  ${design}.png`);

  // The hero opens the book on a real spread. Pick the two facing pages with
  // the most text on them — a chapter's last page is half empty, and an open
  // book with a blank left leaf looks broken rather than inviting.
  if (design === "heritage") {
    const pdf = path.join(FROM, dir, "sample.pdf");
    const { stdout } = await run("pdftotext", ["-layout", pdf, "-"], { maxBuffer: 1 << 26 });
    const words = stdout.split("\f").map((p) => p.trim().split(/\s+/).filter(Boolean).length);

    let best = { at: 1, score: -1 };
    for (let i = 1; i < words.length - 1; i++) {          // 1-indexed, skip the cover
      const score = Math.min(words[i], words[i + 1]);      // the WEAKER of the pair
      if (score > best.score) best = { at: i + 1, score };  // pdftoppm is 1-based
    }
    const tmp = path.join(FROM, dir, "spread");
    await run("pdftoppm", ["-png", "-r", "96", "-f", String(best.at), "-l", String(best.at + 1), pdf, tmp]);
    const made = (await readdir(path.join(FROM, dir)))
      .filter((f) => /^spread-\d+\.png$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    if (made[0]) await copyFile(path.join(FROM, dir, made[0]), path.join(OUT, "inner-left.png"));
    if (made[1]) await copyFile(path.join(FROM, dir, made[1]), path.join(OUT, "inner-right.png"));
    console.log(`  inner-left/right.png  (pages ${best.at}–${best.at + 1}, ${best.score}+ words each)`);
  }
}
console.log("web covers rebuilt from the current renderer");
