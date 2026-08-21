#!/usr/bin/env node
/**
 * Assert the built site is actually crawlable — against dist/, not against a
 * dev server, because dist/ is what ships.
 *
 * The bugs this is here to catch are all silent. A route dropped from the
 * prerender list still 200s. A canonical left pointing at the previous page
 * still validates. A JSON-LD block with a typo'd @type is ignored rather than
 * reported. None of these break a page a human looks at, so nothing else in
 * the repo would notice.
 *
 *   node scripts/seo_check.js [--strict]
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publicPaths } from "./public_routes.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const STRICT = process.argv.includes("--strict");
const ORIGIN = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8")).origin;

let pass = 0;
const fails = [];
function ok(cond, label, detail = "") {
  if (cond) { pass++; return true; }
  fails.push(`${label}${detail ? ` — ${detail}` : ""}`);
  return false;
}

const fileFor = (p) => (p === "/" ? join(DIST, "index.html") : join(DIST, p, "index.html"));
const attr = (html, re) => (re.exec(html) || [])[1] || "";

const titleOf = (h) => attr(h, /<title>([\s\S]*?)<\/title>/);
const metaOf = (h, key) => {
  const re = new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*content="([^"]*)"`, "i");
  const alt = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*(?:name|property)="${key}"`, "i");
  return attr(h, re) || attr(h, alt);
};
const canonicalOf = (h) => attr(h, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
const textOf = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
   .replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const ldOf = (h) =>
  [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]));

const paths = await publicPaths();
const titles = new Map();
const descs = new Map();

console.log(`\n  SEO check — ${paths.length} public routes in dist/\n`);

for (const p of paths) {
  const f = fileFor(p);
  if (!ok(existsSync(f), `${p}: prerendered file exists`, f)) continue;
  const h = readFileSync(f, "utf8");
  const t = titleOf(h);
  const d = metaOf(h, "description");
  const text = textOf(h);

  ok(t.length > 15 && t.length <= 75, `${p}: title length`, `${t.length} chars — "${t}"`);
  ok(!titles.has(t), `${p}: title is unique`, `also on ${titles.get(t)}`);
  titles.set(t, p);

  // Devanagari is measured on a different scale. Google truncates a snippet on
  // rendered width, not character count, and Devanagari glyphs are wider while
  // Hindi says more per character than English does — so the same character
  // bounds would demand a description that is both less informative and too
  // wide to display. These bounds were set from what the rendered snippets
  // actually fit.
  const hindi = /[\u0900-\u097F]/.test(d);
  const [lo, hi] = hindi ? [55, 140] : [70, 175];
  ok(d.length >= lo && d.length <= hi, `${p}: description length`, `${d.length} chars (${hindi ? "hi" : "en"})`);
  ok(!descs.has(d), `${p}: description is unique`, `also on ${descs.get(d)}`);
  descs.set(d, p);

  ok(canonicalOf(h) === `${ORIGIN}${p === "/" ? "/" : p}`, `${p}: canonical is self`, canonicalOf(h));
  ok(/index/.test(metaOf(h, "robots")) && !/noindex/.test(metaOf(h, "robots")),
     `${p}: indexable`, metaOf(h, "robots"));

  // The whole reason for prerendering: a crawler that runs no JavaScript must
  // still get the page. 500 chars is well below any real page and well above
  // the empty shell.
  ok(text.length > 800, `${p}: has server-visible text`, `${text.length} chars`);
  // Not "exactly one h1". The hero renders a mobile and a desktop variant and
  // switches them with CSS, because a JS width test paints the wrong one for a
  // frame on the first ad click — and dropping either leaves that viewport with
  // no h1 in the accessibility tree. Two h1s are legal HTML5 and Google says
  // so explicitly. What actually matters is that they do not say different
  // things, which is what this checks.
  const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  ok(h1s.length >= 1, `${p}: has an h1`);
  ok(new Set(h1s).size <= 1, `${p}: all h1s say the same thing`, h1s.join(" | "));

  ok(metaOf(h, "og:title").length > 0, `${p}: og:title`);
  ok(metaOf(h, "og:image").startsWith("http"), `${p}: og:image absolute`);
  ok(metaOf(h, "twitter:card") === "summary_large_image", `${p}: twitter card`);

  let graph = [];
  try {
    const blocks = ldOf(h);
    ok(blocks.length === 1, `${p}: one JSON-LD block`, `${blocks.length}`);
    graph = blocks[0]?.["@graph"] || [];
  } catch (e) {
    ok(false, `${p}: JSON-LD parses`, e.message);
  }
  const types = graph.map((n) => n["@type"]);
  ok(types.includes("Organization"), `${p}: Organization schema`);

  // Every FAQ question in the schema must be findable in the page text.
  // Structured data describing answers a visitor cannot reach is the most
  // commonly penalised abuse there is, and it is invisible without this check:
  // the page still renders, the schema still validates, and only Search Console
  // ever complains — months later.
  const schemaQs = graph
    .filter((n) => n["@type"] === "FAQPage")
    .flatMap((n) => (n.mainEntity || []).map((q) => q.name));
  for (const q of schemaQs) {
    const needle = q.slice(0, 38).replace(/\s+/g, " ");
    ok(text.includes(needle), `${p}: FAQ question is on the page`, q.slice(0, 52));
  }
  ok(types.includes("WebSite"), `${p}: WebSite schema`);

  if (p.startsWith("/report/")) {
    ok(types.includes("Product"), `${p}: Product schema`);
    const offer = graph.find((n) => n["@type"] === "Product")?.offers;
    ok(offer?.priceCurrency === "INR" && Number(offer?.price) > 0, `${p}: real offer price`, offer?.price);
    // A rating we do not have is the fastest way to a structured-data penalty.
    ok(!JSON.stringify(graph).includes("aggregateRating"), `${p}: no invented rating`);
    ok(!/Get it\s*—\s*…/.test(text), `${p}: price rendered, not a placeholder`);
  }
  if (p !== "/") ok(types.includes("BreadcrumbList"), `${p}: breadcrumbs`);

  // Real <a href>, not <button onClick>. The whole site navigated by button
  // once, which meant the crawler had no path between any two pages and every
  // page's importance had to be guessed from the sitemap alone. Cheap to
  // regress — one <button onClick={go}> added to the nav does it — so it is
  // asserted rather than trusted.
  const hrefs = [...h.matchAll(/<a[^>]+href="(\/[^"#]*)"/g)].map((m) => m[1]);
  const internal = new Set(hrefs.filter((u) => !u.startsWith("/assets") && u !== "/favicon.svg"));
  ok(internal.size >= 4, `${p}: has crawlable internal links`, `${internal.size}`);
  ok(internal.has("/reports"), `${p}: links to the report index`);
  for (const u of internal) {
    if (["/profile", "/astrologers"].includes(u) || u.startsWith("/buy/") || u.startsWith("/order/")) continue;
    ok(paths.includes(u), `${p}: link ${u} is a real route`);
  }
}

/* ── Files that must exist, and must agree with each other ───────────────── */

const robots = existsSync(join(DIST, "robots.txt")) ? readFileSync(join(DIST, "robots.txt"), "utf8") : "";
ok(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), "robots.txt points at the sitemap");
ok(robots.includes("Disallow: /order/"), "robots.txt hides order pages");
ok(/User-agent:\s*GPTBot/i.test(robots), "robots.txt names the answer-engine crawlers");

const sitemap = existsSync(join(DIST, "sitemap.xml")) ? readFileSync(join(DIST, "sitemap.xml"), "utf8") : "";
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(locs.length === paths.length, "sitemap lists every public route", `${locs.length} vs ${paths.length}`);
for (const p of paths) {
  ok(locs.includes(`${ORIGIN}${p === "/" ? "/" : p}`), `sitemap contains ${p}`);
}
// The failure this pairs with prerender: a URL promised to Google and served
// as an empty shell.
for (const l of locs) {
  const p = l.replace(ORIGIN, "") || "/";
  ok(existsSync(fileFor(p)), `sitemap URL ${p} was prerendered`);
}

ok(existsSync(join(DIST, "404.html")), "404.html exists");
ok(existsSync(join(DIST, "app.html")), "app.html shell exists for private routes");
if (existsSync(join(DIST, "app.html"))) {
  const shell = readFileSync(join(DIST, "app.html"), "utf8");
  ok(!/rel="canonical"/.test(shell), "shell has no canonical to leak onto private routes");
}
ok(existsSync(join(DIST, "og/astropothi-og.png")), "og image is in the build");

// No prerendered file may contain someone's data. Cheap, and the one mistake
// here would be unrecoverable once Google has the page.
for (const p of paths) {
  const f = fileFor(p);
  if (!existsSync(f)) continue;
  const h = readFileSync(f, "utf8");
  ok(!/\b[6-9]\d{9}\b/.test(textOf(h).replace(/9660801827/g, "")), `${p}: no stray phone numbers`);
  ok(!/"token"|Bearer /.test(h), `${p}: no credentials`);
  // A revision-stamped asset URL baked into static HTML goes stale the moment
  // the API re-warms, and every prerendered page 404s its images until the next
  // client build. The prerenderer strips these; this makes sure it kept doing so.
  ok(!/src="[^"]*\/files\/previews\//.test(h), `${p}: no cache-busted preview URLs frozen in`);
}

console.log(`\n  ${pass} passed, ${fails.length} failed\n`);
if (fails.length) {
  for (const f of fails) console.log(`   ✗ ${f}`);
  console.log("");
  if (STRICT) process.exit(1);
} else {
  console.log("   ✓ all clear\n");
}
