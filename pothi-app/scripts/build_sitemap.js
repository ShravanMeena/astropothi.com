#!/usr/bin/env node
/**
 * Writes public/sitemap.xml and public/robots.txt.
 *
 * Two rules shape this script:
 *
 *   1. The report list comes from the API's catalogue module, never from a
 *      second copy here. A sitemap that advertises a report we removed — or
 *      omits one we added — is the failure mode, and the only way to prevent it
 *      is to have one source. Only SELLABLE reports are listed: a report that
 *      is built but not switched on must not be announced to Google.
 *
 *   2. It will not invent an origin. A sitemap full of http://localhost:5190
 *      submitted to Search Console is worse than no sitemap, so with no
 *      SITE_ORIGIN set the script writes a robots.txt that disallows
 *      everything, skips the sitemap, and says loudly what it did.
 *
 * Usage:
 *   SITE_ORIGIN=https://pothi.in node scripts/build_sitemap.js
 *   node scripts/build_sitemap.js --strict     # exit 1 rather than warn
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const HERE = import.meta.dirname;
const PUBLIC = path.resolve(HERE, "../public");
const CATALOG = path.resolve(HERE, "../../pothi-api/server/catalog/catalog.js");
const ROUTES = path.resolve(HERE, "../src/lib/route.ts");
const strict = process.argv.includes("--strict");

const origin = (process.env.SITE_ORIGIN || "").replace(/\/+$/, "");

await mkdir(PUBLIC, { recursive: true });

if (!origin) {
  const msg = [
    "SITE_ORIGIN is not set.",
    "  No sitemap written, and robots.txt now disallows crawling.",
    "  Set it for a production build:  SITE_ORIGIN=https://your-domain npm run build"
  ].join("\n");
  if (strict) { console.error(`  ✗ ${msg}`); process.exit(1); }
  console.warn(`  ⚠ ${msg}`);
  await writeFile(path.join(PUBLIC, "robots.txt"),
    "# No SITE_ORIGIN was set at build time, so this build is not indexable.\n" +
    "User-agent: *\nDisallow: /\n");
  process.exit(0);
}

// One source of truth for what is on the shelf.
let SELLABLE;
try {
  ({ SELLABLE } = await import(CATALOG));
} catch (e) {
  console.error(`  ✗ could not read the report catalogue at ${CATALOG}`);
  console.error(`    ${e.message}`);
  console.error("    pothi-api must sit beside pothi-app for the sitemap to be generated.");
  process.exit(1);
}
if (!SELLABLE?.length) {
  console.error("  ✗ the catalogue lists no sellable reports — refusing to write an empty sitemap");
  process.exit(1);
}

// The policy slugs are read out of the router rather than retyped here, for
// the same reason the reports are: two lists that must agree eventually stop
// agreeing, and the symptom is a 404 in Search Console weeks later.
let legalSlugs;
try {
  const src = await readFile(ROUTES, "utf8");
  const m = src.match(/LEGAL_SLUGS\s*=\s*\[([^\]]+)\]/);
  if (!m) throw new Error("LEGAL_SLUGS not found in route.ts");
  legalSlugs = m[1].match(/"([a-z-]+)"/g).map((q) => q.slice(1, -1));
} catch (e) {
  console.error(`  ✗ could not read the policy routes from ${ROUTES}: ${e.message}`);
  process.exit(1);
}

// Public, indexable pages only. /buy and /order are transactional, /profile is
// private, /astrologers is the staff door — none of them belong in a sitemap.
const paths = [
  "/",
  "/reports",
  "/faq",
  ...SELLABLE.map((r) => `/report/${r.code}`),
  ...legalSlugs.map((l) => `/${l}`)
];

// No <lastmod>, <changefreq> or <priority>. Google ignores the last two, and a
// <lastmod> stamped with the build date would be false for every page that did
// not change — at which point Google ignores that too.
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${origin}${p === "/" ? "/" : p}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

const robots = [
  "User-agent: *",
  "Allow: /",
  "",
  "# Nothing here is useful to a crawler and some of it is private.",
  "Disallow: /buy/",
  "Disallow: /order/",
  "Disallow: /profile",
  "Disallow: /astrologers",
  "",
  `Sitemap: ${origin}/sitemap.xml`,
  ""
].join("\n");

await writeFile(path.join(PUBLIC, "sitemap.xml"), xml);
await writeFile(path.join(PUBLIC, "robots.txt"), robots);
console.log(`  ✓ sitemap.xml — ${paths.length} urls at ${origin}`);
console.log(`  ✓ robots.txt`);
