import { getUserToken } from "./account";
import { captureAttribution, currentCampaign } from "./attribution";

/**
 * What people actually do on the site.
 *
 * Two ids, and the difference matters:
 *   anonymous_id  a device, kept forever in localStorage. This is what makes
 *                 "they browsed for ten minutes, THEN signed in" answerable —
 *                 on sign-in the server backfills user_id onto every earlier
 *                 row carrying this id, so the pre-login half of the journey
 *                 stops being anonymous retroactively.
 *   session_id    one visit, kept in sessionStorage. A new tab is a new visit.
 *
 * Events are batched and flushed on a timer, on page hide and on unload
 * (sendBeacon, which survives navigation). Nothing here is allowed to throw
 * into the UI or block a click: analytics that breaks the checkout is worse
 * than no analytics.
 */

const ENDPOINT = "/noauth-api/v1/events";
const ANON_KEY = "pothi.anon";
const SESS_KEY = "pothi.session";
const FLUSH_MS = 4000;
const MAX_BATCH = 25;

const rid = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`)
    .replace(/-/g, "").slice(0, 32);

function stored(store: Storage, key: string) {
  try {
    let v = store.getItem(key);
    if (!v) { v = rid(); store.setItem(key, v); }
    return v;
  } catch {
    // Private mode, or storage disabled. A per-load id still groups one visit.
    return rid();
  }
}

let anonId = "";
let sessId = "";
export const anonymousId = () => (anonId ||= stored(localStorage, ANON_KEY));
export const sessionId = () => (sessId ||= stored(sessionStorage, SESS_KEY));

type Ev = {
  name: string; path: string; referrer?: string;
  source?: string; medium?: string; campaign?: string;
  properties?: Record<string, unknown>;
  session_id: string; occurred_at: string;
};

let queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function flush(useBeacon = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const payload = JSON.stringify({ anonymous_id: anonymousId(), events: queue });
  queue = [];

  // On unload only sendBeacon survives — but it cannot carry an Authorization
  // header, so those rows land unattributed and get stitched by anonymous_id.
  if (useBeacon && navigator.sendBeacon) {
    try { navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "text/plain" })); } catch { /* gone */ }
    return;
  }
  const token = getUserToken();
  fetch(ENDPOINT, {
    method: "POST", keepalive: true,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload
  }).catch(() => { /* never surfaced */ });
}


// ── Meta Pixel bridge ────────────────────────────────────────────────────────
// Every event the site already tracks is ALSO sent to the Meta Pixel from one
// place, so the two never drift and nothing is fired twice. Only the handful of
// events Meta can optimize a campaign on are mapped to its *standard* events
// (ViewContent → InitiateCheckout → Purchase); the rest go as custom events,
// visible in Events Manager without cluttering the conversion columns.
//
// value + currency are attached wherever an amount is known, because Meta cannot
// optimize for "purchases worth more" without them — and a ₹99 and a ₹999 buyer
// should not look identical to the auction.
type FbAmount = { value?: number; currency?: string; content_name?: string; content_ids?: string[]; content_type?: string };

function fbq(...args: unknown[]) {
  try { (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.(...args); } catch { /* pixel not loaded */ }
}

// site event name → { fb standard event, or custom }
const STANDARD: Record<string, string> = {
  report_viewed:      "ViewContent",     // looked at a report's page
  sample_opened:      "ViewContent",     // opened the sample pages — real intent
  pay_clicked:        "InitiateCheckout",
  payment_redirected: "InitiateCheckout",
  order_ready:        "Purchase",        // the money actually landed and the book rendered
  coupon_applied:     "AddPaymentInfo",
  signed_in:          "Lead",            // gave us a real phone number
};

const paise = (p: Record<string, unknown> | undefined) => {
  const n = Number(p?.amount_paise ?? p?.discount_paise);
  return Number.isFinite(n) && n > 0 ? n / 100 : undefined;
};

function toPixel(name: string, props?: Record<string, unknown>) {
  const std = STANDARD[name];
  const money: FbAmount = {};
  const v = paise(props);
  if (v !== undefined) { money.value = v; money.currency = "INR"; }
  const code = props?.code ?? props?.report_type;
  if (typeof code === "string") { money.content_ids = [code]; money.content_type = "product"; money.content_name = code; }

  if (std) fbq("track", std, money);
  // Always also emit the raw event as a custom one, so the full funnel is in
  // Events Manager even for steps Meta has no standard event for.
  else fbq("trackCustom", name, money);
}

export function track(name: string, properties?: Record<string, unknown>) {
  try {
    const utm = currentCampaign();
    queue.push({
      name,
      path: location.pathname + location.search,
      referrer: document.referrer || undefined,
      source: utm.source, medium: utm.medium, campaign: utm.campaign,
      properties: properties && Object.fromEntries(
        Object.entries(properties).filter(([, v]) => v !== undefined && v !== null)
      ),
      session_id: sessionId(),
      occurred_at: new Date().toISOString()
    });
    // Mirror to the Meta Pixel from the same call — one place, no drift.
    toPixel(name, properties);
    if (queue.length >= MAX_BATCH) return flush();
    timer ||= setTimeout(() => flush(), FLUSH_MS);
  } catch { /* analytics must never break a click */ }
}

/**
 * Tell the server which person this device is. Called right after sign-in, and
 * it is what turns the anonymous half of the journey into that buyer's history.
 */
export function identify() {
  const token = getUserToken();
  if (!token) return;
  flush();
  fetch("/noauth-api/v1/events/identify", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ anonymous_id: anonymousId() })
  }).catch(() => {});
}

let lastPath = "";
/**
 * Returns false when this is the same page we already counted — a hash change,
 * or React's development double-invoke of the effect. Callers use the return
 * value to avoid firing their own route-derived events twice.
 */
export function pageView(extra?: Record<string, unknown>) {
  const p = location.pathname;
  if (p === lastPath) return false;
  lastPath = p;
  track("page_view", extra);
  return true;
}

let started = false;
/** Called once from App. Wires the flush triggers. */
export function startTracking() {
  if (started) return;
  started = true;
  anonymousId(); sessionId();
  // Before the first event, so the very first page_view already carries the
  // campaign that produced it.
  captureAttribution();
  // visibilitychange is the reliable one on mobile Safari; unload often never
  // fires there at all.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}
