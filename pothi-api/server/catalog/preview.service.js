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

/**
 * Drop preview directories built by an older renderer.
 *
 * Deferred until the warmer has finished, not run on first use.
 *
 * Sweeping eagerly threw away the one thing that covers the gap after a deploy:
 * for the two minutes it takes to re-render every sample, the PREVIOUS build's
 * sample is still a perfectly good picture of the same report — only the
 * renderer changed. Deleting it first meant the first visitor to each report
 * waited for a full enriched render, which is the seventeen seconds this was
 * all about. Now the old files stay until the new ones exist.
 */
async function sweepStale(rev) {
  try {
    for (const d of await readdir(ROOT)) {
      // `includes`, not `endsWith`: a cover thumbnail is stored as
      // `<key>__<rev>__cover`, so an endsWith test called every one of them
      // stale and deleted the lot on each warm — they were then re-rendered on
      // the next request, for ever.
      if (!d.includes(`__${rev}`)) await rm(path.join(ROOT, d), { recursive: true, force: true });
    }
  } catch { /* nothing cached yet */ }
}

/**
 * A sample from an older renderer for the same report, design and palette.
 * Used only while the current one is still being built.
 */
async function previousRev(type, design, palette, lang, brand) {
  const prefix = `${type}_${design}_${palette}_${lang}_${brand}__`;
  try {
    const dirs = (await readdir(ROOT)).filter((d) => d.startsWith(prefix));
    for (const d of dirs) {
      const m = path.join(ROOT, d, "manifest.json");
      if (await exists(m)) return JSON.parse(await readFile(m, "utf8"));
    }
  } catch { /* nothing cached yet */ }
  return null;
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
  const k = key(type, design, palette, lang, brand, rev);
  const dir = path.join(ROOT, k);
  const manifest = path.join(dir, "manifest.json");

  if (await exists(manifest)) return JSON.parse(await readFile(manifest, "utf8"));

  // Checked BEFORE the inflight promise, not after.
  //
  // If the warmer happens to be rendering this exact variant, joining its
  // promise means waiting the full ten seconds — which is the case a visitor is
  // most likely to hit, because the warmer works through the same reports they
  // browse. The previous build's sample is on disk and is a picture of the same
  // report; serve it and let the render finish in the background.
  const stale = await previousRev(type, design, palette, lang, brand);
  if (stale) return stale;

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
/**
 * The cover, and only the cover.
 *
 * This used to ask getPreview for the whole sample, which renders the entire
 * book — including the AI expansion — to hand back one image of page one. The
 * edition picker asks for three designs at once, so opening a report page fired
 * three full renders and measured seventeen seconds each.
 *
 * A cover cannot depend on the expansion: it is the title page, and expansion
 * only ever appends paragraphs inside chapters. So the thumbnail gets its own
 * render with `enrich: false` and its own cache entry, and costs about a third
 * of a second cold instead of seventeen seconds.
 *
 * When the full preview happens to be cached already, that is reused instead —
 * same image, no second render.
 */
export async function getThumb(design, palette, lang = "en", type = "kundli", brand = "pandit") {
  const rev = await renderRev();

  // A warmed full preview is the same page one. Prefer it.
  const fullKey = key(type, design, palette, lang, brand, rev);
  const fullManifest = path.join(ROOT, fullKey, "manifest.json");
  if (await exists(fullManifest)) {
    const p = JSON.parse(await readFile(fullManifest, "utf8"));
    if (p.images?.[0]?.url) return p.images[0].url;
  }

  const k = `${fullKey}__cover`;
  const dir = path.join(ROOT, k);
  const done = path.join(dir, "cover.json");
  if (await exists(done)) return JSON.parse(await readFile(done, "utf8")).url;
  if (inflight.has(k)) return inflight.get(k);

  const job = (async () => {
    await mkdir(dir, { recursive: true });
    const { buffer } = await renderReport({
      reportType: type, input: demoFor(type), designId: design, paletteId: palette,
      branding: BRANDINGS[brand] || BRANDINGS.pandit, language: lang,
      enrich: false
    });
    const pdfPath = path.join(dir, "cover.pdf");
    await writeFile(pdfPath, buffer);
    await run("pdftoppm", ["-png", "-r", "72", "-f", "1", "-l", "1", pdfPath, path.join(dir, "c")]);
    const file = (await readdir(dir)).find((f) => /^c-\d+\.png$/.test(f));
    if (!file) throw new Error("cover page did not rasterise");
    const url = `/files/previews/${k}/${file}`;
    await writeFile(done, JSON.stringify({ url }));
    return url;
  })().finally(() => inflight.delete(k));

  inflight.set(k, job);
  return job;
}


/**
 * Render the storefront's samples before anyone asks for them.
 *
 * A preview is a full report render, and a report render includes the AI
 * expansion — 10 seconds a report, against 0.3 without it. Cached, that cost is
 * paid once per variant per deploy; uncached, it is paid by whichever visitor
 * happens to be first, on the page an advertisement lands on. Measured at 17
 * seconds for one report detail page. Nobody waits that long.
 *
 * So the cost moves to boot. Sequential on purpose: nine concurrent renders
 * would each be slower than nine in a row and would starve the requests of
 * anyone already on the site. Failures are logged and skipped — a warm cache is
 * an optimisation, and the request path still renders on demand.
 *
 * The variants warmed are exactly the ones the storefront asks for: the cover
 * thumbnail per report in its own colourway, and the detail page's sample.
 */
export async function warmPreviews({ langs = ["en"] } = {}) {
  const { SELLABLE, COVER_PALETTE, SHOP_DESIGN } = await import("./catalog.js");

  const jobs = [];
  for (const lang of langs) {
    for (const r of SELLABLE) {
      // The cover the cards show.
      jobs.push([r.code, SHOP_DESIGN, COVER_PALETTE[r.code] || "gold", lang]);
      // The detail page's default, when it differs from the cover's.
      if ((COVER_PALETTE[r.code] || "gold") !== "gold")
        jobs.push([r.code, SHOP_DESIGN, "gold", lang]);
    }
  }

  // The table of contents is a separate render and a separate in-process cache,
  // so a restart drops it even when every preview is still on disk. It is cheap
  // now that it skips the AI expansion — warm it too, so the first visitor
  // after a deploy waits for nothing at all.
  const { outline } = await import("../shop/outline.service.js");

  let made = 0, already = 0, failed = 0;
  const t0 = Date.now();
  for (const lang of langs) {
    for (const r of SELLABLE) {
      try { await outline(r.code, lang); }
      catch (e) { console.warn(`[warm] outline ${r.code}/${lang}: ${e.message}`); }
    }
  }
  // A breath between renders. Each one is CPU-bound for several seconds, and
  // back to back they starve whoever is already on the site — measured at 16s
  // for a request that takes half a second on an idle server. Warming is a
  // background chore; it must lose to a real visitor, not race them.
  const breathe = () => new Promise((r) => setTimeout(r, 400));

  for (const [type, design, palette, lang] of jobs) {
    await breathe();
    const rev = await renderRev();
    const cached = await exists(path.join(ROOT, key(type, design, palette, lang, "house", rev), "manifest.json"));
    if (cached) { already++; continue; }
    try { await getPreview(type, design, palette, lang, "house"); made++; }
    catch (e) { failed++; console.warn(`[warm] ${type}/${design}/${palette}/${lang}: ${e.message}`); }
  }

  // Only now is it safe to delete what the previous build left behind.
  swept ??= sweepStale(await renderRev());
  await swept;

  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  if (made || failed)
    console.log(`[warm] previews ready — ${made} rendered, ${already} cached, ${failed} failed, ${secs}s`);
  else
    console.log(`[warm] previews already cached (${already})`);
  return { made, already, failed };
}
