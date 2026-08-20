/**
 * The public, indexable URL list — read by build_sitemap.js and prerender.js.
 *
 * These two must never disagree. A URL in the sitemap that was not prerendered
 * is a page we told Google to crawl and then handed an empty shell; a page
 * prerendered but absent from the sitemap is work thrown away. Keeping one list
 * makes the failure impossible rather than merely unlikely.
 *
 * Excluded on purpose: /buy/* and /order/* (transactional, and an order page
 * holds someone's birth details), /profile (private), /astrologers (staff).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const CATALOG = path.resolve(APP, "../pothi-api/server/catalog/catalog.js");
const ROUTES = path.join(APP, "src/lib/route.ts");

/** Static pages, in the order a person would meet them. */
export const STATIC_PATHS = ["/", "/reports", "/methodology", "/faq", "/about"];

/**
 * The learn slugs, read out of the generated content module rather than
 * retyped. It is generated from the engine, so this is still one source: add a
 * dosha to the engine, run `npm run content`, and the page, the sitemap and the
 * prerender list all pick it up together.
 */
async function learnPaths() {
  const src = await readFile(path.join(APP, "src/content/doshas.generated.ts"), "utf8");
  const m = src.match(/export const SLUGS: string\[\] = (\[[\s\S]*?\]);/);
  if (!m) throw new Error("SLUGS not found in src/content/doshas.generated.ts — run `npm run content`");
  const slugs = JSON.parse(m[1]);
  return [
    "/learn", "/hi/learn",
    ...slugs.map((s) => `/learn/${s}`),
    ...slugs.map((s) => `/hi/learn/${s}`)
  ];
}

export async function publicPaths() {
  let SELLABLE;
  try {
    ({ SELLABLE } = await import(CATALOG));
  } catch (e) {
    throw new Error(
      `could not read the report catalogue at ${CATALOG}: ${e.message}\n` +
      "    pothi-api must sit beside pothi-app."
    );
  }
  if (!SELLABLE?.length) throw new Error("the catalogue lists no sellable reports");

  const src = await readFile(ROUTES, "utf8");
  const m = src.match(/LEGAL_SLUGS\s*=\s*\[([^\]]+)\]/);
  if (!m) throw new Error(`LEGAL_SLUGS not found in ${ROUTES}`);
  const legal = m[1].match(/"([a-z-]+)"/g).map((q) => q.slice(1, -1));

  return [
    ...STATIC_PATHS,
    ...(await learnPaths()),
    ...SELLABLE.map((r) => `/report/${r.code}`),
    ...legal.map((l) => `/${l}`)
  ];
}
