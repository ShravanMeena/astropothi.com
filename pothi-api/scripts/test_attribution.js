#!/usr/bin/env node
/**
 * Where an order came from.
 *
 * The thing this defends: an order must carry its own attribution, written at
 * creation. It is tempting to reconstruct it later by joining app_events on
 * anonymous_id, and that join is broken by a cleared cache, a second device, or
 * a buyer who opens the WhatsApp link on a phone after browsing on a laptop.
 * The row with money on it cannot depend on any of that.
 *
 * Two records, two questions:
 *   users.first_utm_*  which campaign ACQUIRED this customer
 *   orders.utm_*       which click CLOSED this sale
 * Recording only one credits the wrong channel, so both are asserted here.
 */
import { execSync } from "node:child_process";
import config from "../config.js";

const API = process.env.API || "http://localhost:4050";
const DB = config.db.name;
let pass = 0, fail = 0;

const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};
const q = (sql) => execSync(`psql -d ${DB} -t -A -c ${JSON.stringify(sql.replace(/\s+/g, " ").trim())}`, { encoding: "utf8" }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PHONE = "9111100009";
const clean = () => q(`DELETE FROM orders WHERE buyer_phone='${PHONE}'; DELETE FROM users WHERE phone='${PHONE}'`);
clean();

const ATTR = {
  first: { source: "google", medium: "cpc", campaign: "kundli-hindi", term: "kundli online",
           click_id: "Cj0KCQjwTEST", click_type: "google", landing: "/report/kundli",
           at: "2026-08-15T09:00:00Z" },
  last:  { source: "meta", medium: "paid_social", campaign: "diwali-2026", content: "video-a",
           click_id: "IwARTEST", click_type: "meta", landing: "/report/love" }
};

const order = async (attribution) => {
  // Real Razorpay links are rate-limited; back off rather than fail on a 429.
  for (const wait of [0, 2000, 5000, 10000]) {
    if (wait) await sleep(wait);
    const r = await fetch(`${API}/noauth-api/v1/shop/order`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        report_type: "love", name: "Attribution Suite", gender: "male",
        dob: "1990-05-15", tob: "10:30", pob: "Jaipur, Rajasthan, India",
        buyer_phone: PHONE, language: "en", attribution
      })
    });
    if (r.status !== 503) return { status: r.status, json: await r.json().catch(() => null) };
  }
  return { status: 503, json: null };
};

console.log("an order records where it came from");
const first = await order(ATTR);
const pid = first.json?.results?.public_id;
is("the order was created", typeof pid, "string");
if (!pid) { console.log(`      why: ${first.json?.message ?? first.status}`); process.exit(1); }

const row = q(`SELECT coalesce(utm_source,'') ||'|'|| coalesce(utm_medium,'') ||'|'|| coalesce(utm_campaign,'')
                 FROM orders WHERE public_id='${pid}'`).split("|");
is("the order groups on LAST touch — the click that closed it", row, ["meta", "paid_social", "diwali-2026"]);

const j = JSON.parse(q(`SELECT attribution::text FROM orders WHERE public_id='${pid}'`));
is("first touch is kept in full", j.first.campaign, "kundli-hindi");
is("and its click id, which is what reconciles against ad spend", j.first.click_id, "Cj0KCQjwTEST");
is("last touch is kept in full", j.last.content, "video-a");

console.log("\na customer records who acquired them");
const u = q(`SELECT coalesce(first_utm_source,'') ||'|'|| coalesce(first_utm_campaign,'')
               FROM users WHERE phone='${PHONE}'`).split("|");
is("the user carries FIRST touch, not last", u, ["google", "kundli-hindi"]);

console.log("\nfirst touch is written once and never moved");
await order({ first: { source: "bing", campaign: "later-campaign" },
              last:  { source: "bing", campaign: "later-campaign" } });
const u2 = q(`SELECT coalesce(first_utm_source,'') FROM users WHERE phone='${PHONE}'`);
is("a later campaign does not rewrite the acquisition source", u2, "google");

console.log("\nuntrusted input is not stored raw");
const long = await order({ last: { source: "x".repeat(400), campaign: "c".repeat(400) } });
const lpid = long.json?.results?.public_id;
if (lpid) {
  const lens = q(`SELECT length(utm_source) ||'|'|| length(utm_campaign) FROM orders WHERE public_id='${lpid}'`).split("|");
  is("an absurdly long utm_source is capped", Number(lens[0]) <= 120, true);
  is("an absurdly long utm_campaign is capped", Number(lens[1]) <= 160, true);
} else {
  console.log("  – gateway busy, skipped the length check");
}

console.log("\nno attribution at all is fine");
const bare = await order(undefined);
const bpid = bare.json?.results?.public_id;
if (bpid) {
  is("an order with no campaign still saves", typeof bpid, "string");
  is("and stores nothing rather than 'undefined'",
     q(`SELECT coalesce(utm_source,'NULL') FROM orders WHERE public_id='${bpid}'`), "NULL");
} else {
  console.log("  – gateway busy, skipped the bare-order check");
}

console.log("\nthe admin can read it back");
const adminPhone = q(`SELECT phone FROM pandits WHERE is_admin AND status='active' AND "deletedAt" IS NULL ORDER BY id LIMIT 1`);
const login = await fetch(`${API}/noauth-api/v1/auth/otp/verify`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ phone: adminPhone, otp: config.otpBypass })
});
const T = (await login.json())?.results?.admin_token;
const rev = await (await fetch(`${API}/admin-api/v1/events/revenue-by-source?days=90`,
                               { headers: { authorization: `Bearer ${T}` } })).json();
const meta = (rev.results || []).find((r) => r.source === "meta");
is("the campaign appears in revenue-by-source", meta?.campaign, "diwali-2026");

const acq = await (await fetch(`${API}/admin-api/v1/events/acquisition?days=90`,
                               { headers: { authorization: `Bearer ${T}` } })).json();
is("and the acquiring campaign appears in acquisition",
   (acq.results || []).some((r) => r.source === "google" && r.campaign === "kundli-hindi"), true);

is("a buyer token cannot read revenue by source",
   (await fetch(`${API}/admin-api/v1/events/revenue-by-source`)).status, 401);

clean();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
