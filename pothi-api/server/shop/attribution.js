/**
 * Attribution, cleaned before it is stored.
 *
 * Everything here arrives from the browser, which means it arrives from
 * whatever was in the URL — and a URL is written by whoever made the link. So
 * it is treated as untrusted text: length-capped, stripped of control
 * characters, and reduced to the fields we actually report on. Nothing here is
 * ever interpolated into SQL or HTML by a caller, but a 4KB utm_campaign in
 * every order row is its own kind of damage.
 */

const CAPS = {
  source: 120, medium: 120, campaign: 160, term: 160, content: 160,
  click_id: 200, click_type: 32, referrer: 300, landing: 300
};

const CONTROL = /[\u0000-\u001F\u007F]/g;

const clean = (v, max) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).replace(CONTROL, "").trim();
  return s ? s.slice(0, max) : undefined;
};

/** One touch — the shape the client sends for `first` and for `last`. */
function touch(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const [k, max] of Object.entries(CAPS)) {
    const v = clean(raw[k], max);
    if (v) out[k] = v;
  }
  // A timestamp we did not generate is a claim, not a fact — keep it, but only
  // if it parses, and never let it drive anything but display.
  const at = Date.parse(raw.at);
  if (Number.isFinite(at)) out.at = new Date(at).toISOString();
  return Object.keys(out).length ? out : null;
}

/**
 * @param {object} raw  `{ first, last }` as sent by the browser
 */
export function normalizeAttribution(raw) {
  const first = touch(raw?.first);
  const last = touch(raw?.last) || first;

  // The flat trio is what every report groups by, and it takes LAST touch —
  // the click that closed the sale is the one a campaign report is asking
  // about. First touch is still in the JSONB for the acquisition question.
  return {
    first, last,
    utm_source: last?.source || null,
    utm_medium: last?.medium || null,
    utm_campaign: last?.campaign || null
  };
}

/** What goes on the order row. */
export function orderAttribution(raw) {
  const a = normalizeAttribution(raw);
  if (!a.first && !a.last) return {};
  return {
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    attribution: { first: a.first, last: a.last }
  };
}

/** What goes on a user, the first time we see them. Never overwritten. */
export function userAttribution(raw) {
  const a = normalizeAttribution(raw);
  if (!a.first) return {};
  return {
    first_utm_source: a.first.source || null,
    first_utm_campaign: a.first.campaign || null,
    attribution: { first: a.first }
  };
}
