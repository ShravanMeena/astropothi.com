// The detail screens: who bought, what was made, what broke.
//
// Everything here is read-only except four deliberate writes — suspend a user,
// suspend a pandit, grant/revoke a pilot seat, and retry a failed order — and
// each of those is narrow on purpose. In particular there is no "mark as paid":
// payment state belongs to the webhook, and a button that forged it would make
// every revenue figure in metrics.service a guess.

import { Op } from "sequelize";
import db from "../../database/index.js";
import config from "../../config.js";
import { REPORT_TYPES, CONSUMER_PRICES, PACKS } from "../catalog/catalog.js";
import * as Shop from "../shop/shop.service.js";
import * as Pilot from "../pilot/pilot.service.js";
import { PAID_STATES } from "./metrics.service.js";

const Q = db.Sequelize.QueryTypes.SELECT;
const sql = (text, replacements = {}) => db.sequelize.query(text, { replacements, type: Q });
const clamp = (n, d, max = 200) => Math.max(1, Math.min(max, Number(n) || d));
const typeName = (code) => REPORT_TYPES.find((t) => t.code === code)?.name_en || code;

// A free-text box that searches phone, name, email and id at once. `q` is always
// bound as a replacement — never interpolated — so a search for "'" is a search,
// not a syntax error or an injection.
const like = (q) => `%${String(q || "").trim()}%`;

// ── Orders ───────────────────────────────────────────────────────────────────

export async function listOrders({ status, q, window, limit = 50, offset = 0 } = {}) {
  const where = withinWindow({}, window);
  if (status && status !== "all") where.status = status;
  if (String(q || "").trim()) {
    const term = like(q);
    where[Op.or] = [
      { public_id:   { [Op.iLike]: term } },
      { buyer_phone: { [Op.iLike]: term } },
      { buyer_name:  { [Op.iLike]: term } },
      { buyer_email: { [Op.iLike]: term } },
      { invoice_no:  { [Op.iLike]: term } }
    ];
  }
  const { rows, count } = await db.Order.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: clamp(limit, 50), offset: Math.max(0, Number(offset) || 0)
  });
  return { total: count, orders: rows.map(orderRow) };
}

function orderRow(o) {
  return {
    public_id: o.public_id,
    status: o.status,
    // Whether the money arrived, stated once here so no screen has to re-derive
    // it from the status enum and get `failed` wrong.
    paid: PAID_STATES.includes(o.status) || o.status === "refunded",
    report_type: o.report_type, report_name: typeName(o.report_type),
    design: o.design, palette: o.palette, language: o.language,
    amount_paise: o.amount_paise, gst_paise: o.gst_paise,
    buyer_name: o.buyer_name, buyer_phone: o.buyer_phone, buyer_email: o.buyer_email,
    state: o.state,
    subject_name: o.birth?.name || null,
    user_id: o.user_id ? String(o.user_id) : null,
    report_id: o.report_id ? String(o.report_id) : null,
    invoice_no: o.invoice_no,
    razorpay_link_id: o.razorpay_link_id,
    razorpay_link_url: o.razorpay_link_url,
    razorpay_payment_id: o.razorpay_payment_id,
    error: o.error,
    created_at: o.createdAt, updated_at: o.updatedAt
  };
}

export async function getOrder(publicId) {
  const o = await db.Order.findOne({ where: { public_id: publicId } });
  if (!o) return null;
  const report = o.report_id ? await db.Report.findByPk(o.report_id, { attributes: { exclude: ["report_json"] } }) : null;
  const user = o.user_id ? await db.User.findByPk(o.user_id) : null;
  // Reports linked by order_id but never linked back onto the order — the
  // signature of a generate that produced a book and then failed to file it.
  const orphans = await db.Report.findAll({
    where: { order_id: o.id, ...(o.report_id ? { id: { [Op.ne]: o.report_id } } : {}) },
    attributes: ["id", "status", "pdf_url", "page_count", "createdAt"]
  });
  return {
    ...orderRow(o),
    birth: o.birth || null,
    report: report && {
      id: String(report.id), status: report.status, pdf_url: report.pdf_url,
      page_count: report.page_count, generated_ms: report.generated_ms,
      rashi: report.rashi, nakshatra: report.nakshatra, lagna: report.lagna
    },
    orphan_reports: orphans.map((r) => ({
      id: String(r.id), status: r.status, pdf_url: r.pdf_url,
      page_count: r.page_count, created_at: r.createdAt
    })),
    user: user && { id: String(user.id), phone: user.phone, name: user.name, status: user.status }
  };
}

/**
 * Re-run generation for an order whose payment landed but whose book did not.
 *
 * Two hard rules:
 *   - Only `failed`. An unpaid order has no money behind it and retrying one
 *     would hand out a ₹699 report for free.
 *   - The retry goes through Shop.settleAndGenerate, the same idempotent path
 *     the webhook uses. Admin does not get its own generation code, because a
 *     second implementation is a second set of bugs and only one of them would
 *     be under test.
 *
 * If a previous attempt already produced a finished report and only the linking
 * failed, that report is adopted rather than re-rendered — re-rendering would
 * leave a paid customer with two books and us with two S3 objects.
 */
export async function retryOrder(publicId) {
  const o = await db.Order.findOne({ where: { public_id: publicId } });
  if (!o) throw Object.assign(new Error("ORDER_NOT_FOUND"), { code: 404 });
  if (o.status !== "failed")
    throw Object.assign(new Error(`Only a failed order can be retried — this one is "${o.status}"`), { code: 409 });

  const salvage = await db.Report.findOne({
    where: { order_id: o.id, status: "ready", pdf_url: { [Op.ne]: null } },
    order: [["id", "DESC"]]
  });
  if (salvage) {
    await o.update({ status: "ready", report_id: salvage.id, error: null });
    return { public_id: o.public_id, status: o.status, adopted_report_id: String(salvage.id), rerendered: false };
  }

  // Clear the stale error first: if this attempt also fails, settleAndGenerate
  // writes the new reason and nobody is left reading last week's.
  await o.update({ error: null });
  const out = await Shop.settleAndGenerate({ publicId: o.public_id, paymentId: o.razorpay_payment_id || null });
  return { public_id: out.public_id, status: out.status, report_id: out.report_id ? String(out.report_id) : null, rerendered: true };
}

// ── Consumer users ───────────────────────────────────────────────────────────

/**
 * Lifetime value is computed in the same SQL as the list, not per row in JS.
 * A per-row query here is the classic N+1 that makes a 500-user page take a
 * minute. Note the paranoid filter on BOTH tables in the join.
 */
export async function listUsers({ q, window, limit = 50, offset = 0 } = {}) {
  const term = String(q || "").trim();
  const filter = term
    ? `AND (u.phone ILIKE :term OR COALESCE(u.name,'') ILIKE :term OR COALESCE(u.email,'') ILIKE :term)`
    : "";
  const paid = PAID_STATES.map((s) => `'${s}'`).join(",");
  // Same boundary as the Sequelize lists, expressed for raw SQL.
  const from = windowStart(window);
  const win = from ? `AND u."createdAt" >= :from` : "";
  const rows = await sql(
    `SELECT u.id, u.phone, u.name, u.email, u.status, u.verified_at, u.last_seen_at, u."createdAt",
            COUNT(o.id) FILTER (WHERE o."deletedAt" IS NULL)::int AS orders,
            COUNT(o.id) FILTER (WHERE o."deletedAt" IS NULL AND o.status IN (${paid}))::int AS paid_orders,
            COALESCE(SUM(o.amount_paise) FILTER (WHERE o."deletedAt" IS NULL AND o.status IN (${paid})),0)::bigint AS ltv_paise
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
      WHERE u."deletedAt" IS NULL ${filter} ${win}
      GROUP BY u.id
      ORDER BY ltv_paise DESC, u.id DESC
      LIMIT :limit OFFSET :offset`,
    { term: like(term), from, limit: clamp(limit, 50), offset: Math.max(0, Number(offset) || 0) }
  );
  const [{ count }] = await sql(
    `SELECT COUNT(*)::int AS count FROM users u WHERE u."deletedAt" IS NULL ${filter} ${win}`,
    { term: like(term), from }
  );
  return {
    total: count,
    users: rows.map((r) => ({
      id: String(r.id), phone: r.phone, name: r.name || "", email: r.email || "",
      status: r.status, verified: Boolean(r.verified_at),
      orders: r.orders, paid_orders: r.paid_orders, ltv_paise: Number(r.ltv_paise),
      last_seen_at: r.last_seen_at, created_at: r.createdAt
    }))
  };
}

export async function getUser(id) {
  const u = await db.User.findByPk(id);
  if (!u) return null;
  const orders = await db.Order.findAll({ where: { user_id: u.id }, order: [["createdAt", "DESC"]], limit: 200 });
  // Orders placed on this number before the account existed, never adopted.
  const loose = await db.Order.findAll({
    where: { buyer_phone: u.phone, user_id: null }, order: [["createdAt", "DESC"]], limit: 50
  });
  const ltv = orders.filter((o) => PAID_STATES.includes(o.status)).reduce((n, o) => n + o.amount_paise, 0);
  return {
    id: String(u.id), phone: u.phone, isd_code: u.isd_code,
    name: u.name || "", email: u.email || "",
    status: u.status,
    // Null verified_at means every session this account ever had came from
    // checkout auto-login — it has never proved it owns the number.
    verified: Boolean(u.verified_at), verified_at: u.verified_at,
    birth: u.birth || null,
    profile: u.profile || {},
    last_seen_at: u.last_seen_at, created_at: u.createdAt,
    ltv_paise: ltv,
    orders: orders.map(orderRow),
    unclaimed_orders: loose.map(orderRow)
  };
}

export async function setUserStatus(id, status) {
  if (!["active", "suspended"].includes(status))
    throw Object.assign(new Error("Status must be active or suspended"), { code: 400 });
  const u = await db.User.findByPk(id);
  if (!u) throw Object.assign(new Error("USER_NOT_FOUND"), { code: 404 });
  await u.update({ status });
  // authenticateUser re-reads status on every request, so this takes effect on
  // the buyer's very next call — their existing token stops working at once.
  return { id: String(u.id), status: u.status };
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function listReports({ source, status, report_type, q, window, limit = 50, offset = 0 } = {}) {
  const where = withinWindow({}, window);
  if (source && source !== "all") where.source = source;
  if (status && status !== "all") where.status = status;
  if (report_type && report_type !== "all") where.report_type = report_type;
  if (String(q || "").trim()) {
    const term = like(q);
    where[Op.or] = [{ rashi: { [Op.iLike]: term } }, { nakshatra: { [Op.iLike]: term } },
                    { lagna: { [Op.iLike]: term } }, { share_token: { [Op.iLike]: term } }];
  }
  const { rows, count } = await db.Report.findAndCountAll({
    where,
    // report_json is the whole computed book — hundreds of KB a row. Excluding
    // it is the difference between a 40KB list response and a 20MB one.
    attributes: { exclude: ["report_json"] },
    order: [["id", "DESC"]],
    limit: clamp(limit, 50), offset: Math.max(0, Number(offset) || 0)
  });

  // Resolve owners in two batched queries rather than one per row.
  const panditIds = [...new Set(rows.map((r) => r.pandit_id).filter(Boolean).map(String))];
  const orderIds  = [...new Set(rows.map((r) => r.order_id).filter(Boolean).map(String))];
  const pandits = panditIds.length ? await db.Pandit.findAll({ where: { id: panditIds }, attributes: ["id", "phone", "name"] }) : [];
  const orders  = orderIds.length  ? await db.Order.findAll({ where: { id: orderIds }, attributes: ["id", "public_id", "buyer_name", "buyer_phone"] }) : [];
  const byPandit = new Map(pandits.map((p) => [String(p.id), p]));
  const byOrder  = new Map(orders.map((o) => [String(o.id), o]));

  return {
    total: count,
    reports: rows.map((r) => {
      const p = r.pandit_id ? byPandit.get(String(r.pandit_id)) : null;
      const o = r.order_id ? byOrder.get(String(r.order_id)) : null;
      return {
        id: String(r.id), source: r.source, status: r.status,
        report_type: r.report_type, report_name: typeName(r.report_type),
        design: r.design, palette: r.palette, language: r.language,
        page_count: r.page_count, generated_ms: r.generated_ms,
        credits_charged: r.credits_charged, pdf_url: r.pdf_url,
        rashi: r.rashi, nakshatra: r.nakshatra, lagna: r.lagna,
        subject_name: r.birth_meta?.name || null,
        error: r.error, created_at: r.createdAt,
        owner: p ? { kind: "pandit", id: String(p.id), label: p.name || p.phone }
             : o ? { kind: "order", id: o.public_id, label: o.buyer_name || o.buyer_phone || o.public_id }
             : null
      };
    })
  };
}

// ── Pandits ──────────────────────────────────────────────────────────────────

export async function listPandits() {
  const paid = "'paid'";
  const rows = await sql(
    `SELECT p.id, p.phone, p.name, p.email, p.city, p.state, p.business_name, p.gstin,
            p.status, p.pilot_seat, p.invite_code, p.is_admin, p.trial_granted_at,
            p.last_seen_at, p."createdAt",
            COALESCE((SELECT SUM(delta) FROM credit_ledger l WHERE l.pandit_id = p.id),0)::int AS balance,
            COALESCE((SELECT COUNT(*) FROM reports r
                       WHERE r.pandit_id = p.id AND r.status = 'ready' AND r."deletedAt" IS NULL),0)::int AS reports_ready,
            COALESCE((SELECT SUM(amount_paise) FROM credit_purchases c
                       WHERE c.pandit_id = p.id AND c.status = ${paid} AND c."deletedAt" IS NULL),0)::bigint AS spent_paise
       FROM pandits p
      WHERE p."deletedAt" IS NULL
      ORDER BY p.pilot_seat NULLS LAST, p.id`
  );
  return rows.map((p) => ({
    id: String(p.id), phone: p.phone, name: p.name || "", email: p.email || "",
    city: p.city || "", state: p.state || "", business_name: p.business_name || "", gstin: p.gstin || "",
    status: p.status, pilot_seat: p.pilot_seat, invite_code: p.invite_code, is_admin: p.is_admin,
    balance: p.balance, reports_ready: p.reports_ready,
    // What this pandit paid US. Never mixed with what he charges his own
    // clients — that number is his, is an estimate, and is not our revenue.
    spent_paise: Number(p.spent_paise),
    trial_granted_at: p.trial_granted_at, last_seen_at: p.last_seen_at, created_at: p.createdAt
  }));
}

export async function getPandit(id) {
  const p = await db.Pandit.findByPk(id);
  if (!p) return null;
  const [branding, ledger, purchases, prices, reports] = await Promise.all([
    db.BrandingProfile.findOne({ where: { pandit_id: p.id } }),
    db.CreditLedger.findAll({ where: { pandit_id: p.id }, order: [["id", "DESC"]], limit: 100 }),
    db.CreditPurchase.findAll({ where: { pandit_id: p.id }, order: [["id", "DESC"]], limit: 50 }),
    db.PanditPrice.findAll({ where: { pandit_id: p.id } }),
    db.Report.findAll({
      where: { pandit_id: p.id }, attributes: { exclude: ["report_json"] },
      order: [["id", "DESC"]], limit: 50
    })
  ]);
  const balance = ledger.length
    ? (await sql(`SELECT COALESCE(SUM(delta),0)::int AS b FROM credit_ledger WHERE pandit_id = :pid`, { pid: p.id }))[0].b
    : 0;

  return {
    id: String(p.id), phone: p.phone, name: p.name || "", email: p.email || "",
    city: p.city || "", state: p.state || "", business_name: p.business_name || "", gstin: p.gstin || "",
    status: p.status, is_admin: p.is_admin, pilot_seat: p.pilot_seat, invite_code: p.invite_code,
    trial_granted_at: p.trial_granted_at, last_seen_at: p.last_seen_at, created_at: p.createdAt,
    balance,
    branding: branding && {
      honorific: branding.honorific, display_name: branding.display_name, shop_name: branding.shop_name,
      phone: branding.phone, whatsapp: branding.whatsapp, email: branding.email, address: branding.address,
      tagline: branding.tagline, logo_url: branding.logo_url, photo_url: branding.photo_url,
      signature_url: branding.signature_url, chart_style: branding.chart_style,
      default_language: branding.default_language, default_design: branding.default_design,
      default_palette: branding.default_palette,
      // The anti-arbitrage counter: a reseller has to keep changing identity.
      changes_this_quarter: branding.changes_this_quarter, quarter_started_at: branding.quarter_started_at
    },
    ledger: ledger.map((l) => ({
      id: String(l.id), delta: l.delta, reason: l.reason,
      ref_type: l.ref_type, ref_id: l.ref_id ? String(l.ref_id) : null,
      note: l.note, created_at: l.createdAt
    })),
    purchases: purchases.map((c) => ({
      id: String(c.id), status: c.status, amount_paise: c.amount_paise, gst_paise: c.gst_paise,
      credits: c.credits, invoice_no: c.invoice_no, razorpay_order_id: c.razorpay_order_id,
      razorpay_payment_id: c.razorpay_payment_id, expires_at: c.expires_at, created_at: c.createdAt
    })),
    prices: REPORT_TYPES.map((t) => ({
      report_type: t.code, name_en: t.name_en,
      sale_price_paise: prices.find((x) => x.report_type === t.code)?.sale_price_paise ?? null
    })),
    reports: reports.map((r) => ({
      id: String(r.id), status: r.status, report_type: r.report_type, report_name: typeName(r.report_type),
      design: r.design, palette: r.palette, language: r.language,
      page_count: r.page_count, generated_ms: r.generated_ms, credits_charged: r.credits_charged,
      pdf_url: r.pdf_url, subject_name: r.birth_meta?.name || null, created_at: r.createdAt
    }))
  };
}

export async function setPanditStatus(id, status) {
  if (!["active", "suspended"].includes(status))
    throw Object.assign(new Error("Status must be active or suspended"), { code: 400 });
  const p = await db.Pandit.findByPk(id);
  if (!p) throw Object.assign(new Error("PANDIT_NOT_FOUND"), { code: 404 });
  // Suspending the last admin would lock everyone out of this panel with no way
  // back except a shell. Refuse, and say why.
  if (p.is_admin && status === "suspended") {
    const others = await db.Pandit.count({ where: { is_admin: true, status: "active", id: { [Op.ne]: p.id } } });
    if (!others) throw Object.assign(new Error("This is the last active administrator — suspending it would lock everyone out"), { code: 409 });
  }
  await p.update({ status });
  return { id: String(p.id), status: p.status };
}

/**
 * Pilot seats. Granting reuses Pilot.claimSeat so the transactional
 * last-seat-wins logic is not reimplemented here; revoking clears the seat and
 * is deliberately NOT reversible on the credits already granted, because those
 * reports may already have been generated.
 */
export async function setPilotSeat(id, grant) {
  const p = await db.Pandit.findByPk(id);
  if (!p) throw Object.assign(new Error("PANDIT_NOT_FOUND"), { code: 404 });
  if (!Pilot.isOn()) throw Object.assign(new Error("The pilot is not running"), { code: 409 });

  if (!grant) {
    await p.update({ pilot_seat: null });
    return { id: String(p.id), pilot_seat: null, ...(await Pilot.status()) };
  }
  if (p.pilot_seat) return { id: String(p.id), pilot_seat: p.pilot_seat, ...(await Pilot.status()) };
  // Admin grants bypass the invite code — that is the whole point of a manual
  // grant — but not the seat cap, which claimSeat still enforces under lock.
  await Pilot.claimSeat(p, config.pilot.inviteCode);
  await p.reload();
  const granted = await Pilot.grantFreeReports(p);
  return { id: String(p.id), pilot_seat: p.pilot_seat, credits_granted: granted, ...(await Pilot.status()) };
}

// ── Operations ───────────────────────────────────────────────────────────────

/**
 * Payment links and their state. There is no webhook_deliveries table in this
 * schema, so "webhook failures" cannot be listed — what CAN be shown is the
 * observable consequence: a link that exists with no payment recorded against
 * it, which is either an unpaid link or a webhook that never landed. Labelled
 * as exactly that, rather than presented as a delivery log we do not have.
 */
export async function paymentLinks({ limit = 100 } = {}) {
  const rows = await db.Order.findAll({
    where: { razorpay_link_id: { [Op.ne]: null } },
    order: [["createdAt", "DESC"]], limit: clamp(limit, 100)
  });
  return rows.map((o) => ({
    public_id: o.public_id, link_id: o.razorpay_link_id, link_url: o.razorpay_link_url,
    payment_id: o.razorpay_payment_id, status: o.status,
    settled: Boolean(o.razorpay_payment_id),
    amount_paise: o.amount_paise, buyer_phone: o.buyer_phone,
    created_at: o.createdAt, updated_at: o.updatedAt
  }));
}

/** The catalogue, as configured — prices live in code, not in DB rows. */
export async function catalogue() {
  return {
    source: "code (server/catalog/catalog.js) — changes with a deploy, not at runtime",
    gst_rate_pct: 18,
    reports: REPORT_TYPES.map((t) => ({
      code: t.code, name_en: t.name_en, name_hi: t.name_hi, chapters: t.chapters,
      credits: t.credits, ready: t.ready,
      consumer_price_paise: CONSUMER_PRICES[t.code] ?? null,
      // What the pilot actually charges, which is 1 for everything.
      pilot_credits: Pilot.creditCost(t.code, t.credits)
    })),
    packs: PACKS,
    pilot: await Pilot.status()
  };
}

/** Config the panel needs to explain itself. Never secrets. */
export function environment() {
  return {
    env: config.env,
    pilot: config.pilot,
    // Both of these change what the numbers mean, so the panel says them out loud.
    otp_bypass_enabled: Boolean(config.otpBypass),
    auto_login_on_order: config.autoLoginOnOrder,
    razorpay_configured: Boolean(config.razorpay.key && config.razorpay.secret),
    webhook_secret_configured: Boolean(config.razorpay.webhookSecret),
    consumer_brand: config.brand.name,
    web_origin: config.webOrigin
  };
}

// ── pricing ─────────────────────────────────────────────────────────────────

/** Every report with its tier price, its override, and what is actually charged. */
export async function pricing() {
  const { REPORT_TYPES, CONSUMER_PRICES, tierOf } = await import("../catalog/catalog.js");
  const rows = await db.PriceOverride.findAll();
  const byCode = Object.fromEntries(rows.map((r) => [r.report_type, r]));
  return REPORT_TYPES.map((r) => {
    const ov = byCode[r.code];
    return {
      code: r.code, name_en: r.name_en, chapters: r.chapters,
      tier: tierOf(r.code),
      tier_paise: CONSUMER_PRICES[r.code],
      override_paise: ov?.price_paise ?? null,
      price_paise: ov?.price_paise ?? CONSUMER_PRICES[r.code],
      note: ov?.note ?? null, set_by: ov?.set_by ?? null, changed_at: ov?.updatedAt ?? null
    };
  });
}

export async function setPrice(code, paise, note, by) {
  const { getReportType } = await import("../catalog/catalog.js");
  if (!getReportType(code)) return { error: "Unknown report" };
  const [row] = await db.PriceOverride.upsert(
    { report_type: code, price_paise: paise, note: note || null, set_by: by || null },
    { returning: true }
  );
  const { bustPriceCache } = await import("../catalog/pricing.service.js");
  bustPriceCache();
  return { code, price_paise: row?.price_paise ?? paise };
}

export async function clearPrice(code) {
  await db.PriceOverride.destroy({ where: { report_type: code }, force: true });
  const { bustPriceCache } = await import("../catalog/pricing.service.js");
  bustPriceCache();
  return { code, cleared: true };
}

// ── coupons ─────────────────────────────────────────────────────────────────

export async function listCoupons() {
  const rows = await db.Coupon.findAll({ order: [["id", "DESC"]] });
  return rows.map((c) => ({
    code: c.code, kind: c.kind, value: c.value,
    max_discount_paise: c.max_discount_paise, min_amount_paise: c.min_amount_paise,
    report_types: c.report_types, max_uses: c.max_uses, uses: c.uses,
    starts_at: c.starts_at, expires_at: c.expires_at, active: c.active, note: c.note
  }));
}

export async function upsertCoupon(b = {}) {
  const code = String(b.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { error: "Code must be 3–32 letters, digits, - or _" };
  if (!["percent", "flat"].includes(b.kind)) return { error: "kind must be percent or flat" };
  const value = Math.round(Number(b.value));
  if (!Number.isFinite(value) || value < 1) return { error: "value must be a positive number" };
  if (b.kind === "percent" && value > 90) return { error: "A percent coupon is capped at 90%" };

  await db.Coupon.upsert({
    code, kind: b.kind, value,
    max_discount_paise: b.max_discount_paise ?? null,
    min_amount_paise: b.min_amount_paise ?? null,
    report_types: Array.isArray(b.report_types) && b.report_types.length ? b.report_types : null,
    max_uses: b.max_uses ?? null,
    starts_at: b.starts_at ? new Date(b.starts_at) : null,
    expires_at: b.expires_at ? new Date(b.expires_at) : null,
    active: b.active !== false,
    note: b.note || null
  });
  return { code };
}

export async function setCouponActive(code, active) {
  await db.Coupon.update({ active }, { where: { code: String(code).toUpperCase() } });
  return { code, active };
}

// ── behaviour ───────────────────────────────────────────────────────────────

/**
 * A window filter for the list screens, in real Indian days.
 *
 * metrics.service.js already does this for the dashboard, but in raw SQL —
 * `"createdAt" AT TIME ZONE 'Asia/Kolkata' >= date_trunc('day', now() AT TIME
 * ZONE 'Asia/Kolkata')`. The list endpoints build Sequelize `where` objects, so
 * the same boundary has to be computed as an instant here.
 *
 * "Today" has to mean today in Delhi. Subtracting 24 hours from now would put
 * the boundary in the middle of yesterday afternoon for anyone looking before
 * half past five, and the container runs on UTC — so the day is truncated in
 * IST and converted back.
 */
const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const WINDOW_DAYS_BACK = { today: 0, "7d": 6, "30d": 29, all: null };

export function windowStart(window) {
  const back = WINDOW_DAYS_BACK[window];
  if (back === null || back === undefined) return null;      // "all", or unknown
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - back * 864e5 - IST_OFFSET_MS);
}

/** Merge into a Sequelize where. No-op for "all". */
function withinWindow(where, window, col = "createdAt") {
  const from = windowStart(window);
  if (from) where[col] = { [Op.gte]: from };
  return where;
}

const since = (days) => new Date(Date.now() - (Number(days) || 30) * 864e5);

export async function listEvents({ days = 7, name, source, limit = 200 } = {}) {
  const where = { occurred_at: { [db.Sequelize.Op.gte]: since(days) } };
  if (name) where.name = name;
  // "direct" covers both an explicit source and none recorded, which is what a
  // visitor with no campaign on the URL looks like.
  if (source === "direct") where[Op.or] = [{ source: null }, { source: "" }, { source: "direct" }];
  else if (source) where.source = source;
  const rows = await db.AppEvent.findAll({
    where, order: [["occurred_at", "DESC"]], limit: Math.min(Number(limit) || 200, 1000)
  });
  return rows.map((r) => ({
    at: r.occurred_at, name: r.name, category: r.category, path: r.path,
    anonymous_id: r.anonymous_id, session_id: r.session_id,
    user_id: r.user_id ? String(r.user_id) : null,
    source: r.source, campaign: r.campaign, props: r.properties
  }));
}

/**
 * The sources present in the window, so the filter offers what exists rather
 * than a hardcoded list that goes stale the first time a new channel appears.
 */
export async function eventSources({ days = 7 } = {}) {
  const rows = await sql(
    `SELECT COALESCE(NULLIF(source,''),'direct') AS source,
            COUNT(DISTINCT anonymous_id)::int AS devices
       FROM app_events
      WHERE occurred_at >= :since
      GROUP BY 1 ORDER BY devices DESC`,
    { since: since(days) }
  );
  return rows;
}

/**
 * The funnel, counted in PEOPLE not events — one visitor refreshing a page
 * twenty times is one visitor, and counting rows would say otherwise.
 */
/**
 * The devices in a window that belong to one traffic source.
 *
 * First touch, not per-row: a visitor who arrives on an ad and later navigates
 * to a page with no campaign on the URL is still an ad visitor, and filtering
 * event rows by their own `source` column would split one person across two
 * cohorts. So the source is taken from the device's earliest event and the
 * whole journey inherits it.
 *
 * Bots are excluded everywhere this is used. A crawler that loads one page and
 * leaves looks exactly like the bounce we are trying to measure, and there were
 * fifteen of them in a week.
 */
function cohortSql(source) {
  const clause = !source ? ""
    : source === "direct"
      ? "AND COALESCE(NULLIF(fs.source,''),'direct') = 'direct'"
      : "AND fs.source = :source";
  return `WITH cohort AS (
            SELECT anonymous_id FROM (
              SELECT DISTINCT ON (anonymous_id) anonymous_id, source, ua
                FROM app_events WHERE occurred_at >= :since
               ORDER BY anonymous_id, occurred_at
            ) fs
            WHERE COALESCE(fs.ua,'') !~* 'bot|crawler|spider|headless|facebookexternalhit'
              ${clause}
          )`;
}

export async function funnel({ days = 30, source } = {}) {
  // Only steps on the required path. Opening a sample is optional, and putting
  // it in the funnel invents a "drop" of everyone who bought without one — a
  // number that would send us optimising a step nobody has to take. It is
  // reported per report in reportInterest() instead.
  const STEPS = [
    ["Visited",           ["page_view"]],
    ["Viewed a report",   ["report_viewed"]],
    ["Started checkout",  ["checkout_started"]],
    ["Pressed pay",       ["pay_clicked"]],
    ["Sent to Razorpay",  ["payment_redirected"]],
    ["Report ready",      ["order_ready"]]
  ];

  // One query, not seven: the counts have to describe the same instant, and a
  // loop of round trips can straddle an event landing mid-read.
  const rows = await db.sequelize.query(
    `${cohortSql(source)}
     SELECT e.name, COUNT(DISTINCT e.anonymous_id)::int AS people
       FROM app_events e JOIN cohort c USING (anonymous_id)
      WHERE e.name IN (:names) AND e.occurred_at >= :since
      GROUP BY e.name`,
    {
      replacements: { names: STEPS.flatMap(([, n]) => n), since: since(days), source },
      type: db.Sequelize.QueryTypes.SELECT
    }
  );
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.people]));

  const out = STEPS.map(([step, names]) => ({
    step, people: names.reduce((n, k) => n + (byName[k] || 0), 0)
  }));
  const first = out[0].people;
  out.forEach((s, i) => {
    s.of_first = first ? Math.round((s.people / first) * 100) : 0;
    // Where they leave: the fall between this step and the one before it.
    s.dropped = i ? Math.max(0, out[i - 1].people - s.people) : 0;
  });
  return out;
}

/**
 * Daily activity, gapless.
 *
 * The panel could count every step in the funnel but not tell you whether last
 * Tuesday was busier than today — a funnel is a shape, not a trend, and staff
 * were reading a 30-day total as if it described this morning. generate_series
 * fills empty days with zero: a series that silently omits them draws a slope
 * that never happened.
 *
 * Devices, not events, for the same reason the funnel counts devices — one
 * person refreshing eleven times is one visitor.
 */
/**
 * The last thing each device did before it disappeared.
 *
 * The funnel says how many reached each step. It cannot say where a journey
 * ENDED, because a device that stops after "viewed a report" is invisible in
 * the gap between two bars — it just fails to appear in the next one. This
 * counts endings directly, which is the shape of the question "where are we
 * losing them".
 *
 * `avg_seconds` is the span from a device's first event to its last, so a row
 * reading "46 devices ended on report_viewed after 0 seconds" is the finding,
 * not an inference from one.
 */
export async function dropOff({ days = 30, source } = {}) {
  return db.sequelize.query(
    `${cohortSql(source)},
     last AS (
       SELECT DISTINCT ON (e.anonymous_id) e.anonymous_id, e.name, e.path
         FROM app_events e JOIN cohort c USING (anonymous_id)
        WHERE e.occurred_at >= :since
        ORDER BY e.anonymous_id, e.occurred_at DESC
     ),
     span AS (
       SELECT e.anonymous_id,
              EXTRACT(EPOCH FROM (MAX(e.occurred_at) - MIN(e.occurred_at)))::int secs,
              COUNT(*)::int events
         FROM app_events e JOIN cohort c USING (anonymous_id)
        WHERE e.occurred_at >= :since GROUP BY 1
     )
     SELECT l.name AS last_event,
            COUNT(*)::int AS devices,
            ROUND(AVG(s.secs))::int AS avg_seconds,
            ROUND(AVG(s.events), 1) AS avg_events
       FROM last l JOIN span s USING (anonymous_id)
      GROUP BY 1 ORDER BY devices DESC LIMIT 12`,
    { replacements: { since: since(days), source }, type: db.Sequelize.QueryTypes.SELECT }
  );
}

/**
 * How long devices stayed, bucketed.
 *
 * One number for "average time on site" hides the shape completely: forty
 * devices at zero seconds and two at twenty minutes average out to something
 * that describes neither. The buckets show whether traffic is a few real
 * readers among a crowd that never arrived, which is the difference between a
 * landing-page problem and a traffic-quality problem.
 */
export async function dwell({ days = 30, source } = {}) {
  return db.sequelize.query(
    `${cohortSql(source)},
     span AS (
       SELECT e.anonymous_id,
              EXTRACT(EPOCH FROM (MAX(e.occurred_at) - MIN(e.occurred_at)))::int secs
         FROM app_events e JOIN cohort c USING (anonymous_id)
        WHERE e.occurred_at >= :since GROUP BY 1
     )
     SELECT CASE WHEN secs = 0  THEN '1. nothing after the first moment'
                 WHEN secs < 15 THEN '2. under 15 seconds'
                 WHEN secs < 60 THEN '3. 15 to 60 seconds'
                 WHEN secs < 300 THEN '4. 1 to 5 minutes'
                 ELSE '5. over 5 minutes' END AS bucket,
            COUNT(*)::int AS devices
       FROM span GROUP BY 1 ORDER BY 1`,
    { replacements: { since: since(days), source }, type: db.Sequelize.QueryTypes.SELECT }
  );
}

export async function activityByDay({ days = 30 } = {}) {
  const n = Math.max(1, Math.min(180, Number(days) || 30));
  return db.sequelize.query(
    `WITH span AS (
       SELECT generate_series(
         date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') - interval '${n - 1} days',
         date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata'),
         interval '1 day')::date AS day
     ),
     ev AS (
       SELECT (occurred_at AT TIME ZONE 'Asia/Kolkata')::date AS day,
              COUNT(DISTINCT anonymous_id)::int AS visitors,
              COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'report_viewed')::int AS viewed,
              COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'checkout_started')::int AS checkout,
              COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'pay_clicked')::int AS pay,
              COUNT(*)::int AS events
         FROM app_events
        WHERE occurred_at >= (now() AT TIME ZONE 'Asia/Kolkata')::date - interval '${n - 1} days'
        GROUP BY 1
     )
     SELECT to_char(span.day, 'YYYY-MM-DD') AS day,
            COALESCE(ev.visitors, 0) AS visitors,
            COALESCE(ev.viewed, 0)   AS viewed,
            COALESCE(ev.checkout, 0) AS checkout,
            COALESCE(ev.pay, 0)      AS pay,
            COALESCE(ev.events, 0)   AS events
       FROM span LEFT JOIN ev ON ev.day = span.day
      ORDER BY span.day`,
    { type: db.Sequelize.QueryTypes.SELECT }
  );
}

/** Which reports get looked at, and which of those turn into money. */
export async function reportInterest({ days = 30 } = {}) {
  return db.sequelize.query(
    `SELECT properties->>'code' AS code,
            COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'report_viewed')::int      AS viewed,
            COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'sample_opened')::int      AS sampled,
            COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'checkout_started')::int   AS started,
            COUNT(DISTINCT anonymous_id) FILTER (WHERE name = 'pay_clicked')::int        AS paid_click
       FROM app_events
      WHERE occurred_at >= :since AND properties->>'code' IS NOT NULL
      GROUP BY 1 ORDER BY viewed DESC NULLS LAST`,
    { replacements: { since: since(days) }, type: db.Sequelize.QueryTypes.SELECT });
}

/**
 * Money by campaign.
 *
 * Reads `orders` rather than `app_events`, deliberately. Events are stitched by
 * a browser-local id that a cleared cache or a second device breaks, and the
 * question here has revenue in it — it has to be answered from the row that
 * holds the payment. Grouped on LAST touch, because that is the click a spend
 * report is asking about; first touch is in the JSONB for the acquisition view.
 *
 * `paid` counts orders that reached a state where money moved.
 */
export async function revenueBySource({ days = 30 } = {}) {
  return db.sequelize.query(
    `SELECT coalesce(nullif(utm_source, ''),   'direct') AS source,
            coalesce(nullif(utm_medium, ''),   '—')      AS medium,
            coalesce(nullif(utm_campaign, ''), '—')      AS campaign,
            count(*)::int                                                       AS orders,
            count(*) FILTER (WHERE status IN ('paid','generating','ready'))::int AS paid,
            coalesce(sum(amount_paise) FILTER (WHERE status IN ('paid','generating','ready')), 0)::bigint AS revenue_paise
       FROM orders
      WHERE "createdAt" >= :since AND "deletedAt" IS NULL
      GROUP BY 1, 2, 3
      ORDER BY revenue_paise DESC, orders DESC`,
    { replacements: { since: since(days) }, type: db.Sequelize.QueryTypes.SELECT });
}

/** Which campaign ACQUIRED each buyer, as opposed to which one closed the sale. */
export async function acquisitionBySource({ days = 90 } = {}) {
  return db.sequelize.query(
    `SELECT coalesce(nullif(u.first_utm_source, ''),   'direct') AS source,
            coalesce(nullif(u.first_utm_campaign, ''), '—')      AS campaign,
            count(DISTINCT u.id)::int AS buyers,
            count(o.id)::int          AS orders,
            coalesce(sum(o.amount_paise) FILTER (WHERE o.status IN ('paid','generating','ready')), 0)::bigint AS revenue_paise
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id AND o."deletedAt" IS NULL
      WHERE u."createdAt" >= :since AND u."deletedAt" IS NULL
      GROUP BY 1, 2
      ORDER BY revenue_paise DESC, buyers DESC`,
    { replacements: { since: since(days) }, type: db.Sequelize.QueryTypes.SELECT });
}

export async function journeyOf(anonymousId) {
  const { journey } = await import("../events/events.service.js");
  return journey(anonymousId);
}

// ── catalogue status ────────────────────────────────────────────────────────
// The mirror of the pricing block above. catalog.js `ready` stays the default;
// a row here overrides it, and deleting the row restores the default.

export async function catalogueStatus() {
  const { REPORT_TYPES } = await import("../catalog/catalog.js");
  const { priceMap } = await import("../catalog/pricing.service.js");
  const [rows, prices] = await Promise.all([db.ReportStatus.findAll(), priceMap()]);
  const byCode = Object.fromEntries(rows.map((r) => [r.report_type, r]));

  // Counts come from live rows, because "can I safely pull this" is really the
  // question "has anybody bought it" — and that is not answerable from code.
  const sold = await sql(
    `SELECT report_type, COUNT(*)::int AS orders
       FROM orders
      WHERE status IN (${PAID_STATES.map((s) => `'${s}'`).join(",")}) AND "deletedAt" IS NULL
      GROUP BY report_type`
  );
  const soldBy = Object.fromEntries(sold.map((r) => [r.report_type, r.orders]));

  return REPORT_TYPES.map((t) => {
    const ov = byCode[t.code];
    return {
      code: t.code, name_en: t.name_en, name_hi: t.name_hi,
      chapters: t.chapters, subject: t.subject || "person",
      price_paise: prices[t.code] ?? null,
      default_ready: Boolean(t.ready),
      override: ov ? Boolean(ov.sellable) : null,
      sellable: ov ? Boolean(ov.sellable) : Boolean(t.ready),
      paid_orders: soldBy[t.code] || 0,
      note: ov?.note ?? null, set_by: ov?.set_by ?? null, changed_at: ov?.updatedAt ?? null
    };
  });
}

export async function setCatalogueStatus(code, sellable, note, by) {
  const { getReportType } = await import("../catalog/catalog.js");
  if (!getReportType(code)) throw Object.assign(new Error("Unknown report"), { code: 404 });
  await db.ReportStatus.upsert({
    report_type: code, sellable: Boolean(sellable), note: note || null, set_by: by || null
  });
  const { bustStatusCache } = await import("../catalog/status.service.js");
  bustStatusCache();
  return { code, sellable: Boolean(sellable) };
}

/** Drop the override and fall back to `ready` in catalog.js. */
export async function clearCatalogueStatus(code) {
  await db.ReportStatus.destroy({ where: { report_type: code }, force: true });
  const { bustStatusCache } = await import("../catalog/status.service.js");
  bustStatusCache();
  const { getReportType } = await import("../catalog/catalog.js");
  return { code, cleared: true, sellable: Boolean(getReportType(code)?.ready) };
}

// ── individual reports: correct one, or remove it ───────────────────────────

/**
 * Change a report's status by hand.
 *
 * For clearing up after testing, and for the case where a report generated fine
 * but its row says otherwise. It does NOT re-render — `ready` here only means
 * "this row is correct"; if there is no pdf_url, say so rather than pretend.
 */
export async function setReportStatus(id, status) {
  if (!["generating", "ready", "failed"].includes(status))
    throw Object.assign(new Error("Status must be generating, ready or failed"), { code: 400 });
  const rep = await db.Report.findByPk(id);
  if (!rep) throw Object.assign(new Error("REPORT_NOT_FOUND"), { code: 404 });
  if (status === "ready" && !rep.pdf_url)
    throw Object.assign(new Error("This report has no PDF, so marking it ready would lie to the buyer. Retry the order instead."), { code: 409 });
  await rep.update({ status, ...(status === "ready" ? { error: null } : {}) });
  return { id: String(rep.id), status: rep.status };
}

/**
 * Remove a report.
 *
 * A soft delete, because every model here is paranoid and because a deleted
 * report is evidence of what a buyer was sent. If an order points at it, the
 * link is cleared and the order is marked failed — otherwise the order would
 * claim to be delivered while pointing at nothing, which is worse than either.
 *
 * The PDF is deliberately left in storage: unpicking a delivered file is not
 * something an admin click should do silently.
 */
export async function deleteReport(id, { force = false } = {}) {
  const rep = await db.Report.findByPk(id);
  if (!rep) throw Object.assign(new Error("REPORT_NOT_FOUND"), { code: 404 });

  const order = rep.order_id ? await db.Order.findByPk(rep.order_id) : null;
  // Refuse to quietly strip a paid buyer's only report unless it is asked for
  // twice. Test rows are unpaid, so the ordinary case is unaffected.
  if (order && PAID_STATES.includes(order.status) && !force)
    throw Object.assign(new Error(
      `Order ${order.public_id} was paid and points at this report. Deleting it leaves that buyer with nothing. Confirm to proceed.`
    ), { code: 409, needsForce: true });

  if (order && String(order.report_id) === String(rep.id)) {
    await order.update({
      report_id: null, status: "failed",
      error: `report ${rep.id} deleted from the admin panel`
    });
  }
  await rep.destroy();
  return { id: String(rep.id), deleted: true, order: order?.public_id || null };
}

/**
 * Remove an order and whatever it produced.
 *
 * The intended use is clearing test rows. A paid order needs `force`, because
 * deleting one silently removes real money from every figure on the Overview.
 */
export async function deleteOrder(publicId, { force = false } = {}) {
  const order = await db.Order.findOne({ where: { public_id: publicId } });
  if (!order) throw Object.assign(new Error("ORDER_NOT_FOUND"), { code: 404 });
  if (PAID_STATES.includes(order.status) && !force)
    throw Object.assign(new Error(
      `${order.public_id} is a PAID order worth ${(order.amount_paise / 100).toFixed(0)} rupees. Deleting it removes that from revenue. Confirm to proceed.`
    ), { code: 409, needsForce: true });

  const reports = await db.Report.findAll({ where: { order_id: order.id } });
  for (const r of reports) await r.destroy();
  await order.destroy();
  return { public_id: order.public_id, deleted: true, reports_deleted: reports.length };
}
