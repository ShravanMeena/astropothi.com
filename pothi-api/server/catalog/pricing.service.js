// What a buyer is actually charged: the tier, any admin override, and a coupon.

import db from "../../database/index.js";
import { CONSUMER_PRICES, getReportType } from "./catalog.js";

// Overrides change rarely and are read on every catalogue request.
let cache = null, cachedAt = 0;
const TTL = 30_000;

export function bustPriceCache() { cache = null; }

/** { code → paise }, tier price unless an override says otherwise. */
export async function priceMap() {
  if (cache && Date.now() - cachedAt < TTL) return cache;
  const rows = await db.PriceOverride.findAll();
  const map = { ...CONSUMER_PRICES };
  for (const r of rows) if (r.price_paise > 0) map[r.report_type] = r.price_paise;
  cache = map; cachedAt = Date.now();
  return map;
}

export async function priceOf(code) {
  return (await priceMap())[code] ?? CONSUMER_PRICES[code] ?? 39900;
}

/**
 * Check a coupon against one report and price.
 *
 * Never throws and never leaks why a private code failed beyond what the buyer
 * needs — "not valid for this report" is help, an inventory of our coupons is not.
 */
export async function applyCoupon(rawCode, { reportType, amountPaise }) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "no code" };

  const c = await db.Coupon.findOne({ where: { code } });
  const now = new Date();
  if (!c || !c.active)                                return { ok: false, reason: "That code is not valid." };
  if (c.starts_at && c.starts_at > now)               return { ok: false, reason: "That code is not active yet." };
  if (c.expires_at && c.expires_at < now)             return { ok: false, reason: "That code has expired." };
  if (c.max_uses !== null && c.uses >= c.max_uses)    return { ok: false, reason: "That code has been fully used." };
  if (Array.isArray(c.report_types) && c.report_types.length && !c.report_types.includes(reportType))
    return { ok: false, reason: "That code does not apply to this report." };
  if (c.min_amount_paise && amountPaise < c.min_amount_paise)
    return { ok: false, reason: "That code needs a larger order." };

  // `value` is a percentage for a percent coupon and PAISE for a flat one —
  // paise everywhere, like every other amount in this system.
  let off = c.kind === "percent"
    ? Math.round((amountPaise * c.value) / 100)
    : c.value;
  if (c.max_discount_paise) off = Math.min(off, c.max_discount_paise);
  // Never below ₹1: a zero-rupee Razorpay link cannot be created, and a free
  // order should be granted deliberately rather than fall out of arithmetic.
  off = Math.max(0, Math.min(off, amountPaise - 100));
  // Round the discount UP to a whole rupee so the payable amount is a whole
  // rupee too. 25% of ₹399 is ₹99.75, and "₹299.25" on a Razorpay page reads
  // as a mistake — the rounding goes to the buyer, never against them.
  if (off % 100) off = Math.min(Math.ceil(off / 100) * 100, amountPaise - 100);

  return {
    ok: true, code: c.code, discount_paise: off,
    final_paise: amountPaise - off,
    label: c.kind === "percent" ? `${c.value}% off` : `₹${Math.round(c.value / 100)} off`,
    list_paise: amountPaise
  };
}

/** Called once the order is paid, so an abandoned checkout does not burn a use. */
export async function redeem(code) {
  if (!code) return;
  await db.Coupon.increment("uses", { where: { code: String(code).toUpperCase() } }).catch(() => {});
}

/** The catalogue price plus whether a report is discounted right now. */
export async function consumerPriceFor(code) {
  const type = getReportType(code);
  if (!type) return null;
  return priceOf(code);
}
