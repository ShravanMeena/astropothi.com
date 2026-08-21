#!/usr/bin/env node
/**
 * Read-only. Answers one question: a lot of people are arriving from ads and
 * almost nobody is engaging — where does it actually break?
 *
 * SELECTs only. Prints no phone numbers, no emails, no tokens: identity is
 * reported as counts and as truncated anonymous_ids, which are device ids we
 * generated, not personal data.
 *
 *   node scripts/analyze_traffic.js [days]
 */
import db from "../database/index.js";

const DAYS = Number(process.argv[2] || 7);
const q = (sql, replacements = {}) =>
  db.sequelize.query(sql, { replacements: { days: DAYS, ...replacements }, type: db.Sequelize.QueryTypes.SELECT });

const since = `NOW() - (:days || ' days')::interval`;
const h = (s) => console.log(`\n\x1b[1m── ${s} ─────────────────────────────────\x1b[0m`);
const rows = (r, cols) => {
  if (!r.length) return console.log("   (nothing)");
  for (const x of r) console.log("   " + cols.map((c) => String(x[c] ?? "").padEnd(c === cols[0] ? 26 : 12)).join(""));
};

console.log(`\nastropothi — last ${DAYS} days\n`);

h("Volume");
rows(await q(`
  SELECT COUNT(*)::int AS events,
         COUNT(DISTINCT anonymous_id)::int AS devices,
         COUNT(DISTINCT session_id)::int AS sessions,
         COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS signed_in_users
    FROM app_events WHERE occurred_at >= ${since}`),
  ["events", "devices", "sessions", "signed_in_users"]);

h("Funnel (distinct devices)");
rows(await q(`
  SELECT name, COUNT(DISTINCT anonymous_id)::int AS devices
    FROM app_events
   WHERE occurred_at >= ${since}
     AND name IN ('page_view','report_viewed','sample_opened','buy_clicked','checkout_started',
                  'checkout_field_error','pay_clicked','payment_redirected','order_ready',
                  'signin_opened','signin_otp_sent','signed_in','welcome_shown','welcome_submitted')
   GROUP BY name ORDER BY devices DESC`), ["name", "devices"]);

h("How much does one device actually do?");
rows(await q(`
  WITH per AS (
    SELECT anonymous_id, COUNT(*)::int AS n,
           EXTRACT(EPOCH FROM (MAX(occurred_at) - MIN(occurred_at)))::int AS secs
      FROM app_events WHERE occurred_at >= ${since} GROUP BY anonymous_id)
  SELECT CASE WHEN n = 1 THEN '1 event (bounced)'
              WHEN n <= 3 THEN '2-3 events'
              WHEN n <= 9 THEN '4-9 events'
              ELSE '10+ events' END AS bucket,
         COUNT(*)::int AS devices,
         ROUND(AVG(secs))::int AS avg_seconds
    FROM per GROUP BY 1 ORDER BY devices DESC`), ["bucket", "devices", "avg_seconds"]);

h("Where they came from");
rows(await q(`
  SELECT COALESCE(NULLIF(source,''),'(none)') AS source,
         COALESCE(NULLIF(medium,''),'(none)') AS medium,
         COALESCE(NULLIF(campaign,''),'(none)') AS campaign,
         COUNT(DISTINCT anonymous_id)::int AS devices
    FROM app_events WHERE occurred_at >= ${since}
   GROUP BY 1,2,3 ORDER BY devices DESC LIMIT 15`), ["source", "medium", "campaign", "devices"]);

h("Landing paths");
rows(await q(`
  SELECT path, COUNT(DISTINCT anonymous_id)::int AS devices
    FROM app_events WHERE occurred_at >= ${since} AND name = 'page_view'
   GROUP BY path ORDER BY devices DESC LIMIT 15`), ["path", "devices"]);

h("Scroll depth reached");
rows(await q(`
  SELECT COALESCE(properties->>'depth', properties->>'percent', '?') AS depth,
         COUNT(DISTINCT anonymous_id)::int AS devices
    FROM app_events WHERE occurred_at >= ${since} AND name = 'scroll_depth'
   GROUP BY 1 ORDER BY devices DESC LIMIT 10`), ["depth", "devices"]);

h("Devices by client (bot check)");
rows(await q(`
  SELECT CASE
           WHEN ua ~* 'bot|crawler|spider|preview|headless|python|curl|facebookexternalhit' THEN 'BOT/CRAWLER'
           WHEN ua ~* 'iphone|ipad' THEN 'iOS'
           WHEN ua ~* 'android' THEN 'Android'
           WHEN ua IS NULL OR ua = '' THEN '(no UA)'
           ELSE 'desktop/other' END AS client,
         COUNT(DISTINCT anonymous_id)::int AS devices,
         COUNT(*)::int AS events
    FROM app_events WHERE occurred_at >= ${since}
   GROUP BY 1 ORDER BY devices DESC`), ["client", "devices", "events"]);

h("Busiest days");
rows(await q(`
  SELECT to_char(occurred_at AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD') AS day,
         COUNT(DISTINCT anonymous_id)::int AS devices,
         COUNT(*)::int AS events
    FROM app_events WHERE occurred_at >= ${since}
   GROUP BY 1 ORDER BY 1 DESC LIMIT 14`), ["day", "devices", "events"]);

h("Orders in the same window");
rows(await q(`
  SELECT status, COUNT(*)::int AS orders
    FROM orders WHERE "createdAt" >= ${since} GROUP BY status ORDER BY orders DESC`), ["status", "orders"]);

h("A few real journeys (most active devices)");
const busiest = await q(`
  SELECT anonymous_id, COUNT(*)::int AS n FROM app_events
   WHERE occurred_at >= ${since} GROUP BY 1 ORDER BY n DESC LIMIT 3`);
for (const b of busiest) {
  console.log(`\n   device ${b.anonymous_id.slice(0, 10)}… (${b.n} events)`);
  const j = await q(`
    SELECT to_char(occurred_at AT TIME ZONE 'Asia/Kolkata','HH24:MI:SS') AS t, name, path
      FROM app_events WHERE anonymous_id = :a AND occurred_at >= ${since}
     ORDER BY occurred_at LIMIT 25`, { a: b.anonymous_id });
  for (const e of j) console.log(`     ${e.t}  ${String(e.name).padEnd(22)} ${e.path || ""}`);
}

console.log("");
process.exit(0);
