#!/usr/bin/env node
/**
 * The social card, rendered once at build time.
 *
 * og:image is the single largest lever on click-through from a WhatsApp
 * forward, a Twitter card or a Slack unfurl, and India's astrology audience
 * shares on WhatsApp more than it clicks a SERP. A missing image is a grey box;
 * a 1200×630 one with the mark and the promise is a link that looks paid for.
 *
 * Drawn in HTML and screenshotted with the same headless Chrome the
 * prerenderer uses, so there is no image toolchain to install and the card is
 * built from the same tokens as the site rather than a stale export someone
 * made in Figma.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { findChrome } from "./find_chrome.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/og");

// Light theme tokens from src/index.css, so the card cannot drift from the site.
const T = { surface: "#fcfbf8", sunken: "#f6f3ed", line: "#e2dbce", fg: "#17150f", muted: "#5b5347", brass: "#a9862e" };

const MARK = `
<svg viewBox="0 0 32 32" width="92" height="92" fill="none" stroke="${T.brass}">
  <rect x="5.5" y="3.5" width="21" height="25" rx="2.5" stroke-width="1.6"/>
  <path d="M9.6 3.5v25" stroke-width="1.1" opacity=".5"/>
  <path d="M13 16 18.8 10.2 24.6 16 18.8 21.8Z" stroke-width="1.35" stroke-linejoin="round"/>
  <path d="M13 10.2h11.6M13 21.8h11.6M13 10.2v11.6M24.6 10.2v11.6" stroke-width="1.05" opacity=".55"/>
</svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:${T.surface};font-family:Inter,system-ui,sans-serif;
       display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;position:relative;overflow:hidden}
  /* the same lamp wash the site uses behind its hero */
  body:after{content:"";position:absolute;inset:0;
    background:radial-gradient(900px 520px at 78% -12%, rgba(169,134,46,.16), transparent 62%);}
  .row{display:flex;align-items:center;gap:20px;position:relative;z-index:1}
  .name{font-family:Fraunces,Georgia,serif;font-size:44px;letter-spacing:-.03em;color:${T.fg}}
  .name .a{opacity:.55;font-weight:400}
  h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:74px;line-height:1.03;
     letter-spacing:-.035em;color:${T.fg};max-width:19ch;position:relative;z-index:1}
  p{font-size:27px;line-height:1.45;color:${T.muted};max-width:34ch;margin-top:22px;position:relative;z-index:1}
  .feet{display:flex;gap:14px;position:relative;z-index:1}
  .chip{border:1px solid ${T.line};background:${T.sunken};border-radius:999px;
        padding:11px 22px;font-size:20px;color:${T.muted}}
</style></head><body>
  <div class="row">${MARK}<span class="name"><span class="a">astro</span>pothi</span></div>
  <div>
    <h1>Your birth chart, read out in full.</h1>
    <p>Computed from an astronomical ephemeris using your exact birth time — not a template.</p>
  </div>
  <div class="feet">
    <span class="chip">22–64 chapters</span>
    <span class="chip">English or Hindi</span>
    <span class="chip">Ready in under a minute</span>
  </div>
</body></html>`;

const exe = findChrome();
if (!exe) {
  console.warn("[og] skipped — no Chrome found (set PUPPETEER_EXECUTABLE_PATH)");
  process.exit(0);
}
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle0" });
// Webfonts swap in after paint; screenshotting early gives a Georgia fallback.
await page.evaluate(() => document.fonts.ready);
const buf = await page.screenshot({ type: "png" });
writeFileSync(join(OUT, "astropothi-og.png"), buf);
await browser.close();
console.log(`[og] public/og/astropothi-og.png — ${Math.round(buf.length / 1024)}KB`);
if (!existsSync(join(OUT, "astropothi-og.png"))) process.exit(1);
