// Sample previews: what THIS report in THIS design actually looks like, before
// he spends a credit. Rendered from the real engine with a fixed demo subject,
// rasterised with pdftoppm, then cached on disk — a preview must never be a
// mockup that drifts from the real output.

import { mkdir, writeFile, readFile, access, readdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { renderReport } from "../../engine/render.js";
import { getReportType } from "./catalog.js";
import config from "../../config.js";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "../..", "out", "previews");

// Previews are rendered PNGs of real engine output, so they go stale the moment
// the renderer, a design or a palette changes — and a pandit would keep seeing
// last week's layout. Fingerprint those sources into the cache key so the cache
// invalidates itself on every deploy that touches them.
const ENGINE_SRC = [
  "../../engine/reporting/render-report.js",
  "../../engine/reporting/designs/index.js",
  "../../engine/reporting/palettes/index.js",
  "../../engine/reporting/style.js",
  "../../engine/reporting/doc-model.js",
  "../../server/catalog/preview.service.js"
];
let RENDER_REV = null;
async function renderRev() {
  if (RENDER_REV) return RENDER_REV;
  const h = createHash("sha1");
  for (const rel of ENGINE_SRC) {
    try { h.update(await readFile(path.resolve(import.meta.dirname, rel))); }
    catch { h.update(rel); }
  }
  // The brand is printed on the cover of every sample, so it belongs in the
  // key. Renaming Pothi to astropothi left the storefront serving samples with
  // the old name beside a site carrying the new one — the cached bytes were
  // still valid for a renderer that had not changed, and wrong for the product.
  h.update(String(config.brand.name || ""));
  h.update(String(config.brand.tagline || ""));
  h.update(String(config.brand.supportPhone || ""));
  h.update(String(config.brand.supportEmail || ""));
  RENDER_REV = h.digest("hex").slice(0, 8);
  return RENDER_REV;
}

/** Drop preview directories built by an older renderer. */
async function sweepStale(rev) {
  try {
    for (const d of await readdir(ROOT)) {
      if (!d.endsWith(`__${rev}`)) await rm(path.join(ROOT, d), { recursive: true, force: true });
    }
  } catch { /* nothing cached yet */ }
}
let swept = null;

// Fixed so every preview is comparable and reproducible. Birth time is not part
// of the brief we were given for this subject, so it is pinned here rather than
// left to drift — change it in one place and every sample re-renders.
const DEMO_SUBJECT = {
  name: "Poonam Kumawat", dob: "2001-01-09", tob: "10:30",
  pob: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873, tzone: 5.5, gender: "female"
};

// A Vastu report's subject is a building, so feeding it a birth date produced a
// sample cover that printed one. This layout is deliberately imperfect — a
// sample that finds nothing wrong sells nothing and teaches nothing.
const DEMO_PROPERTY = {
  name: "Poonam Kumawat", facing: "N", property_type: "home", pob: "Jaipur, Rajasthan",
  rooms: { entrance: "N", kitchen: "NE", master_bedroom: "SW", pooja: "NE",
           toilet: "NE", water: "NE", staircase: "SW", store: "NW" }
};
const demoFor = (type) => (getReportType(type)?.subject === "property" ? DEMO_PROPERTY : DEMO_SUBJECT);
// Two audiences, two imprints. The console previews a white-labelled report so
// the pandit sees HIS name; the storefront previews the house edition, because
// showing a consumer a stranger's name on the product is a bug, not a demo.
const BRANDINGS = {
  pandit: {
    panditName: "Pt. Ramesh Chandra Shastri",
    companyName: "Shri Ganesh Jyotish Karyalaya",
    mobile: "+91 98765 43210",
    address: "Trimbakeshwar, Nashik",
    tagline: "Vedic Jyotish since 1978"
  },
  house: {
    panditName: config.brand.name,
    companyName: "",
    tagline: config.brand.tagline,
    mobile: config.brand.supportPhone || "",
    email: config.brand.supportEmail || ""
  }
};

// The front matter alone under-sells the book: in Heritage, page 2 is a title
// leaf that rasterises to a near-blank sheet. Sample the opening AND two pages
// from deep inside, where the actual reading is — that is the proof a buyer
// wants before paying.
const FRONT = 4;      // cover + details + chart/toc + first content page
const DEEP = [0.4, 0.68];   // fractions of the book to pull a reading page from
const exists = (p) => access(p).then(() => true).catch(() => false);
const inflight = new Map();

function key(type, design, palette, lang, brand, rev) { return `${type}_${design}_${palette}_${lang}_${brand}__${rev}`; }

/** Returns [{ page, file }] for a (type, theme, language). Cached after first build. */
export async function getPreview(type, design, palette, lang = "en", brand = "pandit") {
  const rev = await renderRev();
  swept ??= sweepStale(rev);
  await swept;
  const k = key(type, design, palette, lang, brand, rev);
  const dir = path.join(ROOT, k);
  const manifest = path.join(dir, "manifest.json");

  if (await exists(manifest)) return JSON.parse(await readFile(manifest, "utf8"));
  if (inflight.has(k)) return inflight.get(k);

  const job = (async () => {
    await mkdir(dir, { recursive: true });
    const { buffer, pages } = await renderReport({
      reportType: type, input: demoFor(type), designId: design, paletteId: palette,
      branding: BRANDINGS[brand] || BRANDINGS.pandit, language: lang
    });
    const pdfPath = path.join(dir, "sample.pdf");
    await writeFile(pdfPath, buffer);

    // pdftoppm writes <prefix>-NN.png, zero-padded to the total page count, so
    // one run per range keeps the numbering consistent and sortable.
    const wanted = [
      [1, Math.min(FRONT, pages)],
      ...DEEP.map((f) => { const n = Math.round(pages * f); return n > FRONT && n <= pages ? [n, n] : null; })
    ].filter(Boolean);
    for (const [from, to] of wanted) {
      await run("pdftoppm", ["-png", "-r", "72", "-f", String(from), "-l", String(to),
                             pdfPath, path.join(dir, "p")]);
    }

    // pdftoppm pads the page number to the width of the TOTAL page count, so a
    // 135-page book writes p-001.png while a 53-page one writes p-01.png.
    // Discover the files instead of guessing the padding.
    const files = (await readdir(dir))
      .filter((f) => /^p-\d+\.png$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    // Label each image with its true page number, not its index — a deep page
    // shown as "Page 5" would be a lie about the book's length.
    const out = files.map((f) => ({ page: Number(f.match(/\d+/)[0]), url: `/files/previews/${k}/${f}` }));
    const meta = { type, design, palette, lang, brand, total_pages: pages, pdf: `/files/previews/${k}/sample.pdf`, images: out };
    await writeFile(manifest, JSON.stringify(meta));
    return meta;
  })().finally(() => inflight.delete(k));

  inflight.set(k, job);
  return job;
}

/** Cover-only thumbnail for a picker tile. */
export async function getThumb(design, palette, lang = "en", type = "kundli", brand = "pandit") {
  const p = await getPreview(type, design, palette, lang, brand);
  return p.images[0]?.url || null;
}
