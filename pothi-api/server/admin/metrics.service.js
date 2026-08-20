// What the business actually did. Every figure here is computed in SQL against
// live rows, never cached, and never rounded before it reaches the browser.
//
// Three rules hold throughout this file, and breaking any one of them silently
// produces a plausible wrong number:
//
//   1. `AND "deletedAt" IS NULL` on every table. Every model is paranoid, so
//      the ORM hides removed rows and raw SQL does not. A count that disagrees
//      with the ORM by exactly the number of deleted rows is this bug, and it
//      has already shipped once here (pilot seats leaked — see pilot.service).
//
//   2. Consumer money and pandit money are separate lines and are NEVER added.
//      They are different products bought by different people; one total across
//      both answers no question anybody has.
//
//   3. Days are IST days. The server's local zone is a coincidence, not a
//      business rule, and "today" moving at 05:30 would make every daily figure
//      wrong for the first half of the morning.

import db from "../../database/index.js";
import { REPORT_TYPES, CONSUMER_PRICES } from "../catalog/catalog.js";

const Q = db.Sequelize.QueryTypes.SELECT;
const sql = (text, replacements = {}) => db.sequelize.query(text, { replacements, type: Q });
const one = async (text, replacements) => (await sql(text, replacements))[0];

/**
 * Statuses that mean the money arrived.
 *
 * `failed` belongs here and that is not a mistake: shop.service only ever sets
 * `failed` inside the catch of settleAndGenerate, which runs *after* the order
 * was marked paid. A failed order is money we have taken and a book we have not
 * delivered — the single most expensive row in the table, and leaving it out of
 * revenue would hide it from exactly the person who needs to see it.
 */
export const PAID_STATES = ["paid", "generating", "ready", "failed"];

/** Money in, then money back out. Reported on its own line, never netted silently. */
export const REFUNDED_STATE = "refunded";

// ── Windows ──────────────────────────────────────────────────────────────────
// `"createdAt" AT TIME ZONE 'Asia/Kolkata'` turns a timestamptz into the wall
// clock in Delhi; comparing that against a truncated IST `now()` gives real
// Indian days regardless of where the process happens to be running.
const WINDOWS = { today: 0, "7d": 6, "30d": 29, all: null };
export const isWindow = (w) => Object.hasOwn(WINDOWS, w);

function since(window, col = '"createdAt"') {
  const back = WINDOWS[window];
  if (back === null || back === undefined) return "";
  return ` AND ${col} AT TIME ZONE 'Asia/Kolkata'
             >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') - interval '${back} days'`;
}

const inList = (arr) => arr.map((s) => `'${s}'`).join(",");
const PAID = inList(PAID_STATES);

// ── Consumer orders ──────────────────────────────────────────────────────────

/**
 * The funnel, by status, for one window. Gross is carried alongside the count
 * so "8 orders died at created" can also say what those 8 were worth.
 */
export async function orderFunnel(window) {
  const rows = await sql(
    `SELECT status,
            COUNT(*)::int                     AS count,
            COALESCE(SUM(amount_paise),0)::bigint AS gross_paise
       FROM orders
      WHERE "deletedAt" IS NULL ${since(window)}
      GROUP BY status`
  );
  const by = Object.fromEntries(rows.map((r) => [r.status, { count: r.count, gross_paise: Number(r.gross_paise) }]));
  const at = (s) => by[s] || { count: 0, gross_paise: 0 };

  const created = rows.reduce((n, r) => n + r.count, 0);
  const paid = PAID_STATES.reduce((n, s) => n + at(s).count, 0) + at(REFUNDED_STATE).count;

  return {
    // Every status the enum can hold, including the ones with no rows — a
    // missing key reads as "no data" when it means "none of those happened".
    by_status: Object.fromEntries(
      ["created", "paid", "generating", "ready", "failed", "refunded"].map((s) => [s, at(s)])
    ),
    orders_created: created,
    orders_paid: paid,
    // Abandoned = a link was issued and never paid. The main leak.
    abandoned: at("created").count,
    abandoned_paise: at("created").gross_paise,
    // Paid but undelivered. The expensive leak.
    failed: at("failed").count,
    failed_paise: at("failed").gross_paise,
    conversion_pct: created ? Number(((paid / created) * 100).toFixed(1)) : null
  };
}

/** Consumer revenue. Gross is GST-inclusive; net is what we keep. */
export async function consumerRevenue(window) {
  const r = await one(
    `SELECT COUNT(*)::int                      AS orders,
            COALESCE(SUM(amount_paise),0)::bigint AS gross_paise,
            COALESCE(SUM(gst_paise),0)::bigint    AS gst_paise
       FROM orders
      WHERE status IN (${PAID}) AND "deletedAt" IS NULL ${since(window)}`
  );
  const ref = await one(
    `SELECT COUNT(*)::int                      AS orders,
            COALESCE(SUM(amount_paise),0)::bigint AS gross_paise
       FROM orders
      WHERE status = '${REFUNDED_STATE}' AND "deletedAt" IS NULL ${since(window)}`
  );
  /**
     * Money taken for a report the buyer never received.
     *
     * `failed` is inside PAID_STATES because the payment genuinely succeeded —
     * the money is with the gateway. But bundling it into one headline "gross"
     * says we earned it, when what we actually have is a debt: that buyer is
     * owed a report or a refund. It is reported separately so the top number
     * can be read as "collected" and the difference is visible rather than
     * discovered later.
     */
  const owed = await one(
    `SELECT COUNT(*)::int                      AS orders,
            COALESCE(SUM(amount_paise),0)::bigint AS gross_paise
       FROM orders
      WHERE status = 'failed' AND "deletedAt" IS NULL ${since(window)}`
  );

  const gross = Number(r.gross_paise), gst = Number(r.gst_paise);
  const owedPaise = Number(owed.gross_paise);
  return {
    orders: r.orders,
    // Paid AND delivered — the part of gross we are entitled to keep.
    delivered_orders: r.orders - owed.orders,
    delivered_paise: gross - owedPaise,
    owed_orders: owed.orders,
    owed_paise: owedPaise,
    gross_paise: gross,
    gst_paise: gst,
    net_paise: gross - gst,
    refunded_orders: ref.orders,
    refunded_paise: Number(ref.gross_paise),
    // Collected after refunds. Shown next to gross, not instead of it.
    net_of_refunds_paise: gross - Number(ref.gross_paise),
    aov_paise: r.orders ? Math.round(gross / r.orders) : 0
  };
}

/** Pandit revenue: credit packs. A different product; kept on its own line. */
export async function panditRevenue(window) {
  const r = await one(
    `SELECT COUNT(*)::int                      AS purchases,
            COALESCE(SUM(amount_paise),0)::bigint AS gross_paise,
            COALESCE(SUM(gst_paise),0)::bigint    AS gst_paise,
            COALESCE(SUM(credits),0)::int         AS credits
       FROM credit_purchases
      WHERE status = 'paid' AND "deletedAt" IS NULL ${since(window)}`
  );
  const gross = Number(r.gross_paise), gst = Number(r.gst_paise);
  return {
    purchases: r.purchases,
    gross_paise: gross,
    gst_paise: gst,
    net_paise: gross - gst,
    credits_sold: r.credits,
    aov_paise: r.purchases ? Math.round(gross / r.purchases) : 0
  };
}

/** Consumer revenue split by what was bought. */
export async function revenueByType(window) {
  const rows = await sql(
    `SELECT report_type,
            COUNT(*)::int                      AS orders,
            COALESCE(SUM(amount_paise),0)::bigint AS gross_paise,
            COALESCE(SUM(gst_paise),0)::bigint    AS gst_paise
       FROM orders
      WHERE status IN (${PAID}) AND "deletedAt" IS NULL ${since(window)}
      GROUP BY report_type`
  );
  const by = new Map(rows.map((r) => [r.report_type, r]));
  // Driven off the catalogue, not off the rows, so a report type that sold
  // nothing this window shows a zero instead of vanishing from the table.
  return REPORT_TYPES.map((t) => {
    const r = by.get(t.code);
    return {
      report_type: t.code, name_en: t.name_en, name_hi: t.name_hi,
      list_price_paise: CONSUMER_PRICES[t.code] ?? null,
      orders: r?.orders || 0,
      gross_paise: Number(r?.gross_paise || 0),
      net_paise: Number(r?.gross_paise || 0) - Number(r?.gst_paise || 0)
    };
  }).sort((a, b) => b.gross_paise - a.gross_paise);
}

/**
 * Revenue per IST day, for the chart. generate_series fills the gaps so a day
 * with no sales draws a zero rather than being skipped — a line chart that
 * silently omits empty days lies about the slope.
 */
export async function revenueByDay(days = 30) {
  const n = Math.max(1, Math.min(365, Number(days) || 30));
  return (await sql(
    `WITH span AS (
       SELECT generate_series(
         date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') - interval '${n - 1} days',
         date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata'),
         interval '1 day')::date AS day
     ),
     ord AS (
       SELECT ("createdAt" AT TIME ZONE 'Asia/Kolkata')::date AS day,
              COUNT(*) FILTER (WHERE status IN (${PAID}))::int AS paid_orders,
              COUNT(*)::int AS all_orders,
              COALESCE(SUM(amount_paise) FILTER (WHERE status IN (${PAID})),0)::bigint AS gross
         FROM orders WHERE "deletedAt" IS NULL GROUP BY 1
     ),
     cp AS (
       SELECT ("createdAt" AT TIME ZONE 'Asia/Kolkata')::date AS day,
              COALESCE(SUM(amount_paise) FILTER (WHERE status = 'paid'),0)::bigint AS gross
         FROM credit_purchases WHERE "deletedAt" IS NULL GROUP BY 1
     )
     SELECT span.day,
            COALESCE(ord.all_orders,0)  AS orders_created,
            COALESCE(ord.paid_orders,0) AS orders_paid,
            COALESCE(ord.gross,0)::bigint AS consumer_gross_paise,
            COALESCE(cp.gross,0)::bigint  AS pandit_gross_paise
       FROM span LEFT JOIN ord ON ord.day = span.day
                 LEFT JOIN cp  ON cp.day  = span.day
      ORDER BY span.day`
  )).map((r) => ({
    day: String(r.day).slice(0, 10),
    orders_created: r.orders_created,
    orders_paid: r.orders_paid,
    consumer_gross_paise: Number(r.consumer_gross_paise),
    pandit_gross_paise: Number(r.pandit_gross_paise)
  }));
}

/** Generation health: how many reports, how they came out, how slow. */
export async function reportHealth(window) {
  const rows = await sql(
    `SELECT source, status, COUNT(*)::int AS count,
            COALESCE(ROUND(AVG(generated_ms)),0)::int AS avg_ms,
            COALESCE(MAX(generated_ms),0)::int         AS max_ms
       FROM reports
      WHERE "deletedAt" IS NULL ${since(window)}
      GROUP BY source, status`
  );
  const total = rows.reduce((n, r) => n + r.count, 0);
  return {
    total,
    ready: rows.filter((r) => r.status === "ready").reduce((n, r) => n + r.count, 0),
    failed: rows.filter((r) => r.status === "failed").reduce((n, r) => n + r.count, 0),
    generating: rows.filter((r) => r.status === "generating").reduce((n, r) => n + r.count, 0),
    // Averaged over ready rows only: a crash that took 30ms would otherwise
    // flatter the mean.
    avg_ms: (() => {
      const r = rows.filter((x) => x.status === "ready");
      const n = r.reduce((a, x) => a + x.count, 0);
      return n ? Math.round(r.reduce((a, x) => a + x.avg_ms * x.count, 0) / n) : 0;
    })(),
    max_ms: Math.max(0, ...rows.map((r) => r.max_ms)),
    by_source: ["pandit", "consumer"].map((s) => ({
      source: s,
      count: rows.filter((r) => r.source === s).reduce((n, r) => n + r.count, 0)
    }))
  };
}

/**
 * Audience size.
 *
 * Deliberately NOT filtered by the window. "How many buyers are suspended" is a
 * question about the state of the world right now, and answering it with "none
 * were suspended among accounts created today" is a different question wearing
 * the same label — it would read as an all-clear on a quiet morning. The window
 * gets its own column instead: how many joined during it.
 */
export async function audience(window) {
  const u = await one(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE verified_at IS NOT NULL)::int AS verified,
            COUNT(*) FILTER (WHERE status = 'suspended')::int    AS suspended,
            COUNT(*) FILTER (WHERE TRUE ${since(window)})::int   AS joined_in_window
       FROM users WHERE "deletedAt" IS NULL`
  );
  const p = await one(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE pilot_seat IS NOT NULL)::int AS seated,
            COUNT(*) FILTER (WHERE status = 'suspended')::int   AS suspended,
            COUNT(*) FILTER (WHERE is_admin)::int               AS admins,
            COUNT(*) FILTER (WHERE TRUE ${since(window)})::int  AS joined_in_window
       FROM pandits WHERE "deletedAt" IS NULL`
  );
  return { users: u, pandits: p };
}

/** Everything the dashboard needs, in one round trip. */
export async function overview(window = "30d") {
  const w = isWindow(window) ? window : "30d";
  const [funnel, consumer, pandit, by_type, by_day, reports, aud] = await Promise.all([
    orderFunnel(w), consumerRevenue(w), panditRevenue(w), revenueByType(w),
    revenueByDay(w === "today" ? 14 : w === "7d" ? 14 : 30), reportHealth(w), audience(w)
  ]);
  return {
    window: w,
    generated_at: new Date().toISOString(),
    funnel,
    // Deliberately two keys and no third. There is no `total_revenue` here and
    // there must never be one — see rule 2 at the top of this file.
    revenue: { consumer, pandit },
    by_type, by_day, reports, audience: aud
  };
}
