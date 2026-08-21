#!/usr/bin/env node
/**
 * Turn the built SPA into real HTML, one file per public route.
 *
 * Why this exists
 * ---------------
 * The site ships a single index.html with an empty <div id="root">. Google can
 * execute the JavaScript and eventually see the page, but:
 *
 *   · Bing runs JS rarely and unpredictably.
 *   · GPTBot, OAI-SearchBot, PerplexityBot and ClaudeBot do not run it at all.
 *
 * So to an answer engine — the thing this whole exercise is aimed at — the site
 * is 1.3KB of nothing. Per-route <title> tags in the React app do not fix that,
 * because the crawler never gets far enough to see them.
 *
 * This script loads each public route in a real browser, waits for the head
 * manager to finish, and writes the resulting DOM to disk as a static file.
 * Caddy is configured to serve `{path}/index.html` before falling back to the
 * SPA shell, so a crawler gets the snapshot and a human still gets the app —
 * the same HTML boots React and hydration replaces the markup.
 *
 * Deliberately not prerendered: /buy/*, /order/*, /profile, /astrologers. They
 * are private or thin, they carry noindex, and an order page snapshot would put
 * a stranger's birth details in a file on a public web root.
 *
 * Usage:  node scripts/prerender.js [--strict]
 *   --strict  exit non-zero if a route fails or no browser is found. Used by
 *             the deploy path, where shipping an unprerendered build silently
 *             is the failure we are trying to prevent.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { findChrome } from "./find_chrome.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DIST = join(ROOT, "dist");
const STRICT = process.argv.includes("--strict");

const say = (m) => console.log(`[prerender] ${m}`);

/**
 * Where the data comes from. A developer with the API running locally gets
 * their own; everyone else gets production, which serves the same public
 * catalogue. Override with PRERENDER_API.
 */
const UPSTREAM = (async () => {
  const tries = [
    process.env.PRERENDER_API,
    "http://127.0.0.1:4050",
    JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8")).origin
  ].filter(Boolean);
  for (const base of tries) {
    try {
      const r = await fetch(`${base}/noauth-api/v1/shop/catalogue`, { signal: AbortSignal.timeout(4000) });
      const j = await r.json();
      // The API wraps payloads in { success, results }.
      const list = j?.results?.reports || j?.results || j?.reports;
      if (Array.isArray(list) && list.length) {
        say(`api: ${base}`);
        return base;
      }
    } catch { /* next */ }
  }
  throw new Error("no API reachable — tried " + tries.join(", "));
})();
function fail(m) {
  if (STRICT) { console.error(`[prerender] ${m}`); process.exit(1); }
  console.warn(`[prerender] skipped — ${m}`);
  process.exit(0);
}

/* ── 1. Which routes ──────────────────────────────────────────────────────
   Read from the same two files the sitemap generator reads, so a new report or
   a new legal page cannot appear in the sitemap and be missing here. A URL we
   promise a crawler but serve as an empty shell is worse than one we never
   listed. */

const ROUTES = await (async () => {
  const { publicPaths } = await import("./public_routes.js");
  return publicPaths();
})();

/* ── 2. Serve dist exactly the way Caddy will ─────────────────────────────
   Including the try_files fallback, so the crawl below exercises the same
   resolution order production uses. */

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain",
  ".xml": "application/xml"
};

/**
 * Stop the build from filing analytics.
 *
 * The Meta Pixel in index.html fires PageView on load, so prerendering — which
 * really does load every page in a real browser — reported 18 phantom
 * pageviews to Facebook on every build, from a machine in the wrong country
 * with no user behind them. The tags stay in the HTML; they simply do not get
 * to phone home while we are the ones looking at the page.
 */
const TRACKERS = [
  "connect.facebook.net", "facebook.com/tr", "google-analytics.com",
  "googletagmanager.com", "doubleclick.net", "clarity.ms"
];

async function blockTrackers(page) {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = req.url();
    if (TRACKERS.some((t) => u.includes(t))) return req.abort();
    req.continue();
  });
}

/** Public, read-only endpoints only — no order or account data is fetched. */
async function proxy(req, res, url) {
  try {
    const upstream = await UPSTREAM;
    const r = await fetch(upstream + url, { headers: { accept: "application/json" } });
    const body = Buffer.from(await r.arrayBuffer());
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" });
    res.end(body);
  } catch {
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  }
}

function startServer() {
  const server = createServer((req, res) => {
    const rawUrl = req.url || "/";                       // keeps the query string
    const url = decodeURIComponent(rawUrl.split("?")[0]);
    // Report pages get their name, price and chapter count from the API. Stub
    // those calls out and the snapshot still passes a naive "did it render"
    // check while shipping a page whose headline is blank and whose price is
    // an ellipsis — which is exactly what the first version of this script did.
    // So proxy them to a real API instead: a local one if the developer has it
    // up, otherwise the live site, which serves the same public catalogue.
    if (/^\/(api|user-api|admin-api|noauth-api|files|health)\b/.test(url)) {
      return proxy(req, res, rawUrl);
    }
    let file = join(DIST, url);
    // Fall back to the shell, not index.html — "/" is snapshotted into
    // index.html partway through this very run, and every route crawled after
    // that would otherwise be handed the homepage's frozen markup to boot from.
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "app.html");
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

/* ── 3. Snapshot ─────────────────────────────────────────────────────────── */

async function main() {
  if (!existsSync(join(DIST, "index.html"))) fail("dist/index.html missing — run vite build first");

  // app.html — the shell Caddy serves for the private routes — is emitted by
  // the vite plugin in vite.config.ts, not here. See the comment there: copying
  // it at this point works only on a fresh build, and fails silently otherwise.
  if (!existsSync(join(DIST, "app.html"))) fail("dist/app.html missing — rebuild");

  const exe = findChrome();
  if (!exe) fail("no Chrome or Chromium found (set PUPPETEER_EXECUTABLE_PATH)");
  say(`browser: ${exe}`);

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  let ok = 0;
  const failed = [];

  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      await blockTrackers(page);
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(base + route, { waitUntil: "networkidle0", timeout: 30_000 });
      // The head manager sets this last, so it means "this route's head is
      // written", not merely "something mounted".
      await page.waitForFunction(() => document.documentElement.dataset.seoReady === "1", { timeout: 15_000 });

      const html = await page.evaluate(() => {
        /*
         * Never freeze a cache-busted URL into static HTML.
         *
         * The preview and cover images live at /files/previews/<key>__<rev>/…,
         * where <rev> is a content hash the API owns. Snapshotting those <img
         * src> values pinned every prerendered page to whatever revision the
         * API happened to be on at build time — and the moment the API moved on
         * and swept the old revision, every cover on the site 404'd until
         * somebody rebuilt the client. Which is exactly what happened: nine
         * dead covers on the page an ad campaign was pointing at.
         *
         * The client re-renders this subtree on mount and sets the live URL
         * from the API, so dropping the attribute costs nothing a visitor sees.
         * The alt text stays, so the markup still describes itself.
         */
        document.querySelectorAll('img[src*="/files/previews/"]').forEach((el) => {
          el.removeAttribute("src");
          el.removeAttribute("srcset");
          el.setAttribute("data-preview-src", "runtime");
        });
        // Framer Motion leaves elements mid-animation at opacity:0 and with a
        // transform. Frozen into static HTML that is an invisible page — for a
        // text-only crawler it is merely odd, but for a human who lands before
        // hydration finishes it is a blank screen. Settle them.
        document.querySelectorAll("[style]").forEach((el) => {
          const s = el.style;
          if (s.opacity !== "" && Number(s.opacity) < 1) s.opacity = "1";
          if (s.transform && s.transform !== "none") s.transform = "none";
        });
        return "<!doctype html>\n" + document.documentElement.outerHTML;
      });

      const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] || "";
      const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ")
                       .replace(/\s+/g, " ").trim();

      // A snapshot that captured the shell and nothing else is a silent
      // regression — it would look like a success and ship an empty page.
      if (text.length < 500) throw new Error(`only ${text.length} chars of text — did it render?`);
      if (!/<h1[\s>]/.test(html)) throw new Error("no <h1>");
      // The loading placeholder. Its presence means the API data never
      // arrived and this page would ship with a blank headline and no price.
      if (/(Get it|Generate mine)\s*—\s*…/.test(text)) {
        throw new Error("price still a placeholder — API data did not load");
      }

      const dir = route === "/" ? DIST : join(DIST, route);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), html);
      say(`${route.padEnd(22)} ${String(Math.round(html.length / 1024)).padStart(4)}KB  ${title.slice(0, 58)}`);
      ok++;
    } catch (e) {
      failed.push(`${route}: ${e.message}`);
      console.warn(`[prerender] FAILED ${route} — ${e.message}`);
    } finally {
      await page.close();
    }
  }

  // A 404 body Caddy can serve with a real status code.
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/__not_found__`, { waitUntil: "networkidle0", timeout: 30_000 });
    await page.waitForFunction(() => document.documentElement.dataset.seoReady === "1", { timeout: 15_000 });
    writeFileSync(join(DIST, "404.html"), await page.evaluate(() => "<!doctype html>\n" + document.documentElement.outerHTML));
    await page.close();
    say("404.html written");
  } catch (e) {
    failed.push(`404.html: ${e.message}`);
  }

  await browser.close();
  server.close();

  say(`${ok}/${ROUTES.length} routes prerendered`);
  if (failed.length) {
    console.error(`[prerender] ${failed.length} failure(s):\n  ${failed.join("\n  ")}`);
    if (STRICT) process.exit(1);
  }
}

main().catch((e) => { console.error(`[prerender] ${e.stack}`); process.exit(STRICT ? 1 : 0); });
