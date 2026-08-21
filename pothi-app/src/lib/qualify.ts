import { useEffect } from "react";

/**
 * The moment a visitor stops being a bounce.
 *
 * Two things on this site used to happen the instant a page mounted: the Meta
 * Pixel's ViewContent, and the welcome sheet asking for a phone number. Both
 * were wrong for the same reason — "the page rendered" is not "the person is
 * interested", and treating it as such cost real money in both directions:
 *
 *   · The ad set optimises for ViewContent. Firing it on mount told Meta that
 *     every arrival was a success, including the twenty-six visitors who left
 *     inside one second. Meta then went looking for more people exactly like
 *     them. The signal was not merely noisy, it was self-reinforcing.
 *   · The welcome sheet covered the page before a visitor had read a word,
 *     asking a stranger for their number. Shown 61 times, submitted once.
 *
 * So both now wait for the same evidence: the visitor either stayed long
 * enough to be reading, or scrolled far enough to have started, or did
 * something that only an interested person does.
 *
 * Kept in its own module so track.ts and engagement.ts can both use it without
 * importing each other.
 */

/** Long enough to have read a headline and a paragraph, short enough to still catch them. */
const DWELL_MS = 12_000;
/** A quarter of the way down. Below this is a glance, not a read. */
const SCROLL_PCT = 25;
/** A page barely taller than the viewport cannot be "scrolled 25% of". */
const MIN_SCROLLABLE = 240;

/** Events that need no waiting: nobody does these by accident. */
export const INTENT_EVENTS = new Set([
  "sample_opened", "buy_clicked", "checkout_started", "guide_opened",
  "guide_answered", "signin_opened", "reader_opened", "chat_question"
]);

let qualified = false;
let reasonWas = "";
const waiting = new Set<(reason: string) => void>();

export const isQualified = () => qualified;
export const qualifiedBecause = () => reasonWas;

/** Idempotent. The first reason wins, and later calls are free. */
export function qualify(reason: string) {
  if (qualified) return;
  qualified = true;
  reasonWas = reason;
  const fns = [...waiting];
  waiting.clear();
  for (const f of fns) { try { f(reason); } catch { /* a subscriber must not break the rest */ } }
}

/** Calls back once, immediately if the bar has already been cleared. */
export function onQualified(fn: (reason: string) => void) {
  if (qualified) { fn(reasonWas); return () => {}; }
  waiting.add(fn);
  return () => waiting.delete(fn);
}

/** Attaches the dwell timer and the scroll listener. Mounted once, in App. */
export function useQualifyWatcher() {
  useEffect(() => {
    if (qualified) return;
    const timer = setTimeout(() => qualify("dwell"), DWELL_MS);

    let raf = 0;
    const measure = () => {
      raf = 0;
      try {
        const doc = document.documentElement;
        if (doc.scrollHeight - window.innerHeight < MIN_SCROLLABLE) return;
        const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
        if (pct >= SCROLL_PCT) qualify("scroll");
      } catch { /* never break the page for a metric */ }
    };
    // Passive and rAF-throttled: this runs on every scroll frame of every page.
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    window.addEventListener("scroll", onScroll, { passive: true });

    const stop = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    const unsub = onQualified(stop);
    return () => { stop(); unsub(); };
  }, []);
}

/**
 * Stand the welcome sheet down for this visit.
 *
 * The sheet and the free chart check now both ask a visitor for their details,
 * and the sheet asks by covering the page. Put one above the other and the
 * sheet wins: it opened on top of the chart-check form, so the place-of-birth
 * field could be seen but not tapped — measured, the element under that field's
 * centre was a paragraph belonging to the dialog.
 *
 * The chart check is the better of the two anyway. It gives an answer before it
 * asks for anything, and the details it collects are the same ones checkout
 * needs. So once somebody starts filling it in, the sheet stops competing.
 */
let welcomeHeld = false;
export const holdWelcome = () => { welcomeHeld = true; };
export const isWelcomeHeld = () => welcomeHeld;
