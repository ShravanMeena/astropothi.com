#!/usr/bin/env node
/**
 * Behavioural events.
 *
 * The thing worth defending: a visitor browses for ten minutes, then types a
 * phone number. Those ten minutes are the interesting part, and they only stay
 * attached to the person if identify() backfills them. Everything else here is
 * guarding the ingest against the two ways an open endpoint goes wrong —
 * accepting junk, and letting one caller write into another's history.
 */
import { execSync } from "node:child_process";
import config from "../config.js";

const API = process.env.API || "http://localhost:4050";
const DB = config.db.name;
let pass = 0, fail = 0;

const is = (name, got, want) => {
  const okk = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${okk ? "✓" : "✗"} ${name}${okk ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  okk ? pass++ : fail++;
};
const call = async (path, { token, method = "GET", body, raw } = {}) => {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      "content-type": raw ? "text/plain" : "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {})
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const q = (sql) => execSync(`psql -d ${DB} -t -A -c ${JSON.stringify(sql.replace(/\s+/g, " ").trim())}`, { encoding: "utf8" }).trim();

const ANON = "suite_anon_0000000000000000001";
const OTHER = "suite_anon_0000000000000000002";
const cleanup = () => q(`DELETE FROM app_events WHERE anonymous_id IN ('${ANON}','${OTHER}')`);
cleanup();

console.log("ingest");
const post = (events, opts = {}) =>
  call("/noauth-api/v1/events", { method: "POST", body: { anonymous_id: ANON, events }, ...opts });

is("a batch is stored", (await post([
  { name: "page_view", path: "/", session_id: "s1", source: "google", campaign: "diwali" },
  { name: "report_viewed", path: "/report/kundli", session_id: "s1", properties: { code: "kundli" } }
])).json?.results?.stored, 2);

is("an unknown event name is dropped, not 500",
   (await post([{ name: "definitely_not_an_event", path: "/" }])).json?.results?.stored, 0);

is("one bad name does not lose the good events beside it",
   (await post([{ name: "nope", path: "/" }, { name: "buy_clicked", path: "/report/love", properties: { code: "love" } }]))
     .json?.results?.stored, 1);

is("an event with no anonymous id is refused",
   (await call("/noauth-api/v1/events", { method: "POST", body: { events: [{ name: "page_view" }] } }))
     .json?.results?.stored, 0);

// sendBeacon cannot set a content type of application/json.
is("a text/plain beacon body is parsed",
   (await call("/noauth-api/v1/events", {
     method: "POST", raw: true,
     body: JSON.stringify({ anonymous_id: ANON, events: [{ name: "page_view", path: "/faq" }] })
   })).json?.results?.stored, 1);

is("a batch larger than 50 is truncated rather than refused",
   (await post(Array.from({ length: 80 }, () => ({ name: "page_view", path: "/" })))).json?.results?.stored, 50);

is("the campaign is recorded",
   q(`SELECT campaign FROM app_events WHERE anonymous_id='${ANON}' AND campaign IS NOT NULL LIMIT 1`), "diwali");

console.log("\nidentify");
const before = Number(q(`SELECT count(*) FROM app_events WHERE anonymous_id='${ANON}'`));
is("nothing is attributed yet",
   Number(q(`SELECT count(*) FROM app_events WHERE anonymous_id='${ANON}' AND user_id IS NOT NULL`)), 0);

const login = await call("/noauth-api/v1/user/otp/verify", {
  method: "POST", body: { phone: "9812345678", otp: config.otpBypass }
});
const userToken = login.json?.results?.token;
is("a buyer token was issued", typeof userToken, "string");

is("identify needs a token", (await call("/noauth-api/v1/events/identify", {
  method: "POST", body: { anonymous_id: ANON } })).status, 401);

const linked = await call("/noauth-api/v1/events/identify", {
  method: "POST", token: userToken, body: { anonymous_id: ANON } });
is("every earlier row is attributed", linked.json?.results?.linked, before);
is("the pre-login browsing now belongs to the buyer",
   Number(q(`SELECT count(*) FROM app_events WHERE anonymous_id='${ANON}' AND user_id IS NOT NULL`)), before);

// Another device's history must not move.
await call("/noauth-api/v1/events", { method: "POST", body: { anonymous_id: OTHER, events: [{ name: "page_view", path: "/" }] } });
await call("/noauth-api/v1/events/identify", { method: "POST", token: userToken, body: { anonymous_id: ANON } });
is("a different device is untouched",
   Number(q(`SELECT count(*) FROM app_events WHERE anonymous_id='${OTHER}' AND user_id IS NOT NULL`)), 0);

// A signed-in caller's new events are stamped from the TOKEN, never the body.
await call("/noauth-api/v1/events", {
  method: "POST", token: userToken,
  body: { anonymous_id: ANON, events: [{ name: "chat_opened", path: "/order/X", user_id: "999999" }] }
});
is("user_id comes from the token, not the posted body",
   q(`SELECT user_id::text FROM app_events WHERE anonymous_id='${ANON}' AND name='chat_opened'`),
   String(login.json.results.user?.id ?? q(`SELECT id FROM users WHERE phone='9812345678'`)));

console.log("\nreading it back");
const adminPhone = q(`SELECT phone FROM pandits WHERE is_admin AND status='active' AND "deletedAt" IS NULL ORDER BY id LIMIT 1`);
const T = (await call("/noauth-api/v1/auth/otp/verify", {
  method: "POST", body: { phone: adminPhone, otp: config.otpBypass } })).json?.results?.admin_token;

const funnel = (await call("/admin-api/v1/events/funnel?days=1", { token: T })).json?.results;
is("the funnel has a step per stage", funnel?.length, 6);
is("it starts at Visited", funnel?.[0]?.step, "Visited");
is("every step counts people, not events", funnel?.every((s) => Number.isInteger(s.people)), true);
// One device firing 50 page_views must count once.
is("a device is counted once however often it fires", funnel?.[0]?.people >= 1 && funnel[0].people < 50, true);
is("no step reports a negative drop", funnel?.every((s) => s.dropped >= 0), true);

const journey = (await call(`/admin-api/v1/events/journey/${ANON}`, { token: T })).json?.results;
is("the journey is returned in order", journey?.length > 0
   && journey.every((h, i) => i === 0 || new Date(h.at) >= new Date(journey[i - 1].at)), true);

is("staff-only: a buyer token cannot read the funnel",
   (await call("/admin-api/v1/events/funnel", { token: userToken })).status, 403);

cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
