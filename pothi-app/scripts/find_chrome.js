/**
 * Locate a Chrome the machine already has.
 *
 * puppeteer-core downloads nothing on install — deliberately, so `npm i` stays
 * fast and CI does not pull 150MB it may not need. The cost is that we have to
 * find a browser ourselves: whatever Playwright or Puppeteer cached for this
 * user, or the Chrome they already run.
 *
 * Shared by prerender.js and build_og.js.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function findChrome() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const home = process.env.HOME || "";
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];

  // Whatever Playwright or Puppeteer already pulled down for this user.
  for (const base of [join(home, "Library/Caches/ms-playwright"), join(home, ".cache/puppeteer")]) {
    if (!existsSync(base)) continue;
    for (const dir of readdirSync(base)) {
      if (!/^chrom/i.test(dir)) continue;
      for (const rel of [
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "chrome-headless-shell-mac-x64/chrome-headless-shell",
        "mac_arm-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-linux/chrome",
        "chrome-linux64/chrome"
      ]) {
        const guess = join(base, dir, rel);
        if (existsSync(guess)) candidates.unshift(guess);
      }
      // One level of globbing for puppeteer's versioned folders.
      const inner = join(base, dir);
      if (statSync(inner).isDirectory()) {
        for (const v of readdirSync(inner)) {
          for (const rel of [
            "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
            "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
            "chrome-headless-shell-mac-arm64/chrome-headless-shell",
            "chrome-headless-shell-mac-x64/chrome-headless-shell",
            "chrome-linux64/chrome"
          ]) {
            const guess = join(inner, v, rel);
            if (existsSync(guess)) candidates.unshift(guess);
          }
        }
      }
    }
  }
  return candidates.find((c) => existsSync(c)) || null;
}
