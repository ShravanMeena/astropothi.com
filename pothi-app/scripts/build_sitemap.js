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
import { writeFile, mkdir, readFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const PUBLIC = path.resolve(HERE, "../public");
const CATALOG = path.resolve(HERE, "../../pothi-api/server/catalog/catalog.js");
const ROUTES = path.resolve(HERE, "../src/lib/route.ts");
const strict = process.argv.includes("--strict");

/**
 * The origin, from the environment or from the repo.
 *
 * Requiring an environment variable for the ordinary case was a mistake: every
 * `npm run build` without it silently replaced a correct robots.txt with
 * Disallow-all while leaving the real sitemap.xml in place, so the two
 * contradicted each other. The domain is not a secret — it belongs in the repo,
 * with the env var kept as an override for a staging host.
 */
function resolveOrigin() {
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/+$/, "");
  try {
    const cfg = JSON.parse(readFileSync(path.resolve(HERE, "../site.config.json"), "utf8"));
    if (cfg.origin) return String(cfg.origin).replace(/\/+$/, "");
  } catch { /* fall through to the not-indexable branch */ }
  return "";
}
const origin = resolveOrigin();

await mkdir(PUBLIC, { recursive: true });

if (!origin) {
  const msg = [
    "No public origin — SITE_ORIGIN is unset and site.config.json is missing or unreadable.",
    "  No sitemap written, any stale one removed, and robots.txt now disallows crawling.",
    "  Fix site.config.json, or pass SITE_ORIGIN=https://your-domain for a one-off build."
  ].join("\n");
  if (strict) { console.error(`  ✗ ${msg}`); process.exit(1); }
  console.warn(`  ⚠ ${msg}`);
  await writeFile(path.join(PUBLIC, "robots.txt"),
    "# No origin was resolvable at build time, so this build is not indexable.\n" +
    "User-agent: *\nDisallow: /\n");
  // And remove any sitemap from an earlier good build. Leaving one behind means
  // shipping a crawl-me-not robots.txt beside a full sitemap of a real domain —
  // two files disagreeing about whether the site exists.
  await rm(path.join(PUBLIC, "sitemap.xml"), { force: true });
  process.exit(0);
}

// One source of truth for what is on the shelf — shared with prerender.js so
// the sitemap can never list a URL that was not turned into real HTML.
let paths;
let SELLABLE_FOR_LLMS = [];
try {
  const { publicPaths } = await import("./public_routes.js");
  paths = await publicPaths();
  ({ SELLABLE: SELLABLE_FOR_LLMS } = await import(
    new URL("../../pothi-api/server/catalog/catalog.js", import.meta.url).href));
} catch (e) {
  console.error(`  \u2717 ${e.message}`);
  process.exit(1);
}

// No <lastmod>, <changefreq> or <priority>. Google ignores the last two, and a
// <lastmod> stamped with the build date would be false for every page that did
// not change — at which point Google ignores that too.
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${origin}${p === "/" ? "/" : p}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

// Crawlers that read the site for an answer engine rather than a results page.
// They are allowed by default — listing them is a statement of intent, not a
// permission grant, and it means a future "block the AI bots" decision is one
// edit here rather than a hunt. Being cited by ChatGPT or Perplexity is the
// point of the prerendering work, so blocking them would undo it.
const AI_AGENTS = [
  "GPTBot",           // ChatGPT training + browsing
  "OAI-SearchBot",    // ChatGPT search index
  "ChatGPT-User",     // a user asking ChatGPT to open a link
  "ClaudeBot",        // Anthropic crawler
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",  // Gemini / AI Overviews grounding
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "cohere-ai",
  "Meta-ExternalAgent"
];

// Private or transactional. Repeated per agent group because robots.txt has no
// inheritance — a bot matching a specific User-agent block ignores the * block
// entirely, which is the single most common way a disallow silently stops
// applying.
const PRIVATE = ["/buy/", "/order/", "/profile", "/astrologers", "/app.html"];

const group = (agent) => [
  `User-agent: ${agent}`,
  "Allow: /",
  ...PRIVATE.map((d) => `Disallow: ${d}`),
  ""
];

const robots = [
  "# astropothi — generated by scripts/build_sitemap.js. Do not edit by hand.",
  "",
  ...group("*"),
  "# Answer-engine crawlers, allowed explicitly.",
  ...AI_AGENTS.flatMap(group),
  `Sitemap: ${origin}/sitemap.xml`,
  ""
].join("\n");

/*
 * llms.txt — a plain-text index of what this site is and what is worth reading.
 *
 * Not an SEO mechanism. No answer engine has committed to reading it and none
 * of the ranking systems use it; treating it as a lever would be wishful. It
 * costs one generated file, it is honest about the entity, and if the
 * convention does settle we already have it. Nothing here is a claim we do not
 * make on the pages themselves.
 */
const llms = [
  "# astropothi",
  "",
  "> astropothi creates personalised Vedic astrology reports from a person's date of birth,",
  "> exact birth time and birthplace. It computes the birth chart from an astronomical",
  "> ephemeris using the Lahiri (Chitrapaksha) ayanamsa and whole-sign houses, then writes",
  "> the result out in full — 22 to 64 chapters — in English or Hindi.",
  "",
  "Operated by DreamyHook Digital Media. Reports are for reflection and guidance; they are",
  "not medical, legal or financial advice.",
  "",
  "## Methodology",
  `- [How a report is computed](${origin}/methodology): the ephemeris, ayanamsa, house system,`,
  "  the invariants every chart is checked against, and where language is written rather than computed.",
  "",
  "## Reports",
  ...SELLABLE_FOR_LLMS.map((r) => `- [${r.name_en}](${origin}/report/${r.code})`),
  "",
  "## Reference",
  `- [Doshas explained](${origin}/learn) — fourteen doshas, how each forms, what cancels it.`,
  `- [दोष, हिन्दी में](${origin}/hi/learn)`,
  `- [Questions](${origin}/faq)`,
  `- [About](${origin}/about)`,
  "",
  "## Policies",
  `- [Terms](${origin}/terms)`,
  `- [Privacy](${origin}/privacy)`,
  `- [Refunds](${origin}/refunds) — full refund, no conditions.`,
  `- [Contact](${origin}/contact)`,
  ""
].join("\n");

await writeFile(path.join(PUBLIC, "sitemap.xml"), xml);
await writeFile(path.join(PUBLIC, "robots.txt"), robots);
await writeFile(path.join(PUBLIC, "llms.txt"), llms);
console.log(`  \u2713 llms.txt`);
console.log(`  ✓ sitemap.xml — ${paths.length} urls at ${origin}`);
console.log(`  ✓ robots.txt`);
