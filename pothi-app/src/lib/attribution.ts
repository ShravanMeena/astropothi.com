/**
 * Where a buyer came from, kept from the first visit to the order.
 *
 * Two records, because they answer different questions and a business needs
 * both:
 *
 *   first — the click that introduced them. Written once, never overwritten.
 *           This is the ad that earned the customer, and it is the number that
 *           tells you which campaign to keep funding.
 *   last  — the click that brought them back to buy. Overwritten every time a
 *           new campaign arrives. This is the one that closed the sale.
 *
 * Someone who sees an Instagram ad on Monday, thinks about it, and searches for
 * the brand on Thursday is an Instagram acquisition and a direct conversion.
 * Recording only one of those credits the wrong channel — and "direct" is
 * usually just an ad whose attribution was dropped somewhere in between.
 *
 * Both live in localStorage rather than sessionStorage: buying an astrology
 * report is not a same-tab decision, and a session-scoped record forgets the ad
 * the moment the tab closes.
 */

const FIRST = "pothi.attr.first";
const LAST = "pothi.attr.last";

export type Attribution = {
  source: string; medium: string; campaign: string;
  term?: string; content?: string;
  /** Whatever click id the ad platform appended — this is what reconciles a
   *  sale against a spend report, and no UTM can stand in for it. */
  click_id?: string; click_type?: string;
  referrer?: string; landing?: string; at?: string;
};

const CLICK_IDS: [string, string][] = [
  ["gclid", "google"], ["wbraid", "google"], ["gbraid", "google"],
  ["fbclid", "meta"], ["msclkid", "microsoft"], ["ttclid", "tiktok"],
  ["twclid", "twitter"], ["li_fat_id", "linkedin"], ["epik", "pinterest"]
];

const read = (k: string): Attribution | null => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
};
const write = (k: string, v: Attribution) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ }
};

/** Read the current URL. Null when this visit carries no campaign of its own. */
function fromUrl(): Attribution | null {
  const q = new URLSearchParams(location.search);
  const utm = {
    source: q.get("utm_source") || "",
    medium: q.get("utm_medium") || "",
    campaign: q.get("utm_campaign") || "",
    term: q.get("utm_term") || undefined,
    content: q.get("utm_content") || undefined
  };
  const hit = CLICK_IDS.find(([p]) => q.get(p));
  const click = hit ? { click_id: q.get(hit[0]) as string, click_type: hit[1] } : {};

  // A campaign is a utm_source or a click id. A bare referrer is not — it gets
  // recorded below as the fallback, but it must not overwrite a real ad click.
  if (!utm.source && !hit) return null;

  return {
    ...utm, ...click,
    source: utm.source || (hit ? hit[1] : ""),
    referrer: document.referrer || undefined,
    landing: location.pathname,
    at: new Date().toISOString()
  };
}

/** The referrer, for a visit with no campaign at all. */
function fromReferrer(): Attribution {
  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; }
  catch { /* malformed referrer */ }
  return {
    source: host || "direct",
    medium: host ? "referral" : "direct",
    campaign: "",
    referrer: document.referrer || undefined,
    landing: location.pathname,
    at: new Date().toISOString()
  };
}

let captured = false;

/**
 * Called once per page load, before anything else reads attribution.
 * Cheap, synchronous, and safe to call again.
 */
export function captureAttribution() {
  if (captured) return;
  captured = true;
  const now = fromUrl() ?? (read(FIRST) ? null : fromReferrer());
  if (!now) return;              // no campaign, and we already know this visitor
  if (!read(FIRST)) write(FIRST, now);
  // Last-touch only moves for a real campaign. Otherwise a buyer who returns by
  // typing the URL would overwrite the ad that brought them with "direct".
  if (fromUrl()) write(LAST, now);
}

/** Both records, for sending with an order or a sign-in. */
export function attribution(): { first: Attribution | null; last: Attribution | null } {
  return { first: read(FIRST), last: read(LAST) ?? read(FIRST) };
}

/** The flat trio the event stream and the admin grouping use. */
export function currentCampaign() {
  const a = read(LAST) ?? read(FIRST);
  return {
    source: a?.source || "direct",
    medium: a?.medium || "",
    campaign: a?.campaign || ""
  };
}
