#!/usr/bin/env node
/**
 * The admin surface.
 *
 * Three things are worth testing here and the rest is CRUD:
 *
 *   1. The namespace cannot be entered sideways. Four token kinds share one
 *      signing secret, so the only thing standing between a pandit and the
 *      whole business's revenue is a string comparison on `kind` — which is
 *      exactly the sort of check that survives review and dies in a refactor.
 *   2. The money is right. Every figure is cross-checked against SQL run
 *      through psql, in a separate process, against the same database — so a
 *      bug in the service cannot also write the expectation.
 *   3. Suspension bites. A status column nothing enforces is decoration.
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

const call = async (path, { token, method = "GET", body } = {}) => {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};

/** One scalar, straight out of psql. Deliberately not through Sequelize. */
const q = (sql) => execSync(`psql -d ${DB} -t -A -c ${JSON.stringify(sql)}`, { encoding: "utf8" }).trim();

if (!config.otpBypass) {
  console.error("  ✗ OTP_BYPASS must be set to run this suite (it is dev-only and null in production)");
  process.exit(1);
}
const OTP = config.otpBypass;

// ── who is who ───────────────────────────────────────────────────────────────
const adminPhone = q(`SELECT phone FROM pandits WHERE is_admin AND status='active' AND "deletedAt" IS NULL ORDER BY id LIMIT 1`);
const plainPhone = q(`SELECT phone FROM pandits WHERE NOT is_admin AND "deletedAt" IS NULL ORDER BY id LIMIT 1`);
if (!adminPhone) {
  console.error("  ✗ no admin seeded — run: node scripts/ensure_admin.js <phone>");
  process.exit(1);
}

console.log("admin auth");

// ── tokens ───────────────────────────────────────────────────────────────────
const adminLogin = await call("/noauth-api/v1/auth/otp/verify", {
  method: "POST", body: { phone: adminPhone, otp: OTP }
});
is("admin sign-in succeeds", adminLogin.status, 200);
is("admin sign-in is flagged", adminLogin.json?.results?.is_admin, true);
const adminToken = adminLogin.json?.results?.admin_token;
const adminPanditToken = adminLogin.json?.results?.token;
is("admin sign-in returns a separate admin token", typeof adminToken === "string" && adminToken !== adminPanditToken, true);

let panditToken = null;
if (plainPhone) {
  const r = await call("/noauth-api/v1/auth/otp/verify", { method: "POST", body: { phone: plainPhone, otp: OTP } });
  panditToken = r.json?.results?.token;
  is("an ordinary pandit gets no admin token", r.json?.results?.admin_token ?? null, null);
  is("an ordinary pandit is not flagged admin", r.json?.results?.is_admin ?? false, false);
} else {
  console.log("  – no non-admin pandit in the database, skipping two checks");
}

const userLogin = await call("/user-api/v1/../noauth-api/v1/user/otp/verify", {
  method: "POST", body: { phone: "9812345678", otp: OTP }
});
const userToken = (userLogin.json?.results?.token)
  || (await call("/noauth-api/v1/user/otp/verify", { method: "POST", body: { phone: "9812345678", otp: OTP } })).json?.results?.token;
is("consumer sign-in produced a token", typeof userToken === "string", true);

// ── the namespace cannot be entered sideways ─────────────────────────────────
is("no token → 401",              (await call("/admin-api/v1/overview")).status, 401);
is("garbage token → 401",         (await call("/admin-api/v1/overview", { token: "not.a.jwt" })).status, 401);
if (panditToken)
  is("pandit token → 403",        (await call("/admin-api/v1/overview", { token: panditToken })).status, 403);
is("an admin's OWN pandit token → 403", (await call("/admin-api/v1/overview", { token: adminPanditToken })).status, 403);
is("consumer token → 403",        (await call("/admin-api/v1/overview", { token: userToken })).status, 403);
is("admin token → 200",           (await call("/admin-api/v1/overview", { token: adminToken })).status, 200);

// ...and does not open anything else.
is("admin token rejected by the pandit console", (await call("/api/v1/me", { token: adminToken })).status, 403);
is("admin token rejected by the buyer API",      (await call("/user-api/v1/me", { token: adminToken })).status, 403);

// The public OTP endpoints must not be persuadable.
const forged = await call("/noauth-api/v1/auth/otp/verify", {
  method: "POST", body: { phone: plainPhone || "9000000002", otp: OTP, is_admin: true, admin: true, kind: "admin" }
});
is("posting is_admin does not make you one", forged.json?.results?.admin_token ?? null, null);
is("posting is_admin does not write the column",
   q(`SELECT is_admin FROM pandits WHERE phone='${plainPhone || "9000000002"}'`) || "f", "f");

console.log("\nmoney");

// ── revenue, cross-checked against psql ──────────────────────────────────────
const ov = (await call("/admin-api/v1/overview?window=all", { token: adminToken })).json?.results;

const PAID = `('paid','generating','ready','failed')`;
const sqlConsumerGross = Number(q(`SELECT COALESCE(SUM(amount_paise),0) FROM orders WHERE status IN ${PAID} AND "deletedAt" IS NULL`));
const sqlConsumerGst   = Number(q(`SELECT COALESCE(SUM(gst_paise),0)    FROM orders WHERE status IN ${PAID} AND "deletedAt" IS NULL`));
const sqlPanditGross   = Number(q(`SELECT COALESCE(SUM(amount_paise),0) FROM credit_purchases WHERE status='paid' AND "deletedAt" IS NULL`));
const sqlPanditGst     = Number(q(`SELECT COALESCE(SUM(gst_paise),0)    FROM credit_purchases WHERE status='paid' AND "deletedAt" IS NULL`));
const sqlOrdersAll     = Number(q(`SELECT COUNT(*) FROM orders WHERE "deletedAt" IS NULL`));
const sqlAbandoned     = Number(q(`SELECT COUNT(*) FROM orders WHERE status='created' AND "deletedAt" IS NULL`));

is("consumer gross matches SQL", ov?.revenue?.consumer?.gross_paise, sqlConsumerGross);
is("consumer GST matches SQL",   ov?.revenue?.consumer?.gst_paise,   sqlConsumerGst);
is("consumer net = gross − GST", ov?.revenue?.consumer?.net_paise,   sqlConsumerGross - sqlConsumerGst);
is("pandit gross matches SQL",   ov?.revenue?.pandit?.gross_paise,   sqlPanditGross);
is("pandit net = gross − GST",   ov?.revenue?.pandit?.net_paise,     sqlPanditGross - sqlPanditGst);
is("orders created matches SQL", ov?.funnel?.orders_created,         sqlOrdersAll);
is("abandoned matches SQL",      ov?.funnel?.abandoned,              sqlAbandoned);

// The revenue trap, asserted structurally: there must be no key anywhere in the
// revenue block that adds the two audiences together.
const revenueKeys = Object.keys(ov?.revenue || {});
is("revenue has exactly two lines", revenueKeys.sort(), ["consumer", "pandit"]);
const combined = sqlConsumerGross + sqlPanditGross;
is("no field anywhere equals consumer + pandit",
   JSON.stringify(ov).includes(`:${combined},`) || JSON.stringify(ov).includes(`:${combined}}`), false);

// A paid-but-undelivered order is revenue AND is flagged. Both, not either.
const sqlFailed = Number(q(`SELECT COUNT(*) FROM orders WHERE status='failed' AND "deletedAt" IS NULL`));
const sqlFailedPaise = Number(q(`SELECT COALESCE(SUM(amount_paise),0) FROM orders WHERE status='failed' AND "deletedAt" IS NULL`));
is("failed orders surfaced", ov?.funnel?.failed, sqlFailed);
is("failed orders counted as money received",
   ov?.revenue?.consumer?.gross_paise >= sqlFailedPaise && sqlFailedPaise > 0 ? "included" : sqlFailedPaise === 0 ? "none to check" : "excluded",
   sqlFailedPaise === 0 ? "none to check" : "included");

// Soft deletes: the ORM and the raw SQL must agree. This is the bug that leaked
// pilot seats, reproduced as an assertion rather than a comment.
const listed = (await call("/admin-api/v1/users?limit=200", { token: adminToken })).json?.results?.total;
is("user count excludes soft-deleted rows", listed, Number(q(`SELECT COUNT(*) FROM users WHERE "deletedAt" IS NULL`)));

console.log("\nenforcement");

// ── suspension actually blocks ───────────────────────────────────────────────
const uid = q(`SELECT id FROM users WHERE phone='9812345678' AND "deletedAt" IS NULL`);
is("the buyer's token works before suspension", (await call("/user-api/v1/me", { token: userToken })).status, 200);
is("suspend accepted", (await call(`/admin-api/v1/users/${uid}/status`, {
  token: adminToken, method: "POST", body: { status: "suspended" } })).status, 200);
is("the buyer's existing token now fails", (await call("/user-api/v1/me", { token: userToken })).status, 403);
is("suspension is visible in SQL", q(`SELECT status FROM users WHERE id=${uid}`), "suspended");
is("un-suspend accepted", (await call(`/admin-api/v1/users/${uid}/status`, {
  token: adminToken, method: "POST", body: { status: "active" } })).status, 200);
is("the buyer is let back in", (await call("/user-api/v1/me", { token: userToken })).status, 200);
is("a nonsense status is rejected", (await call(`/admin-api/v1/users/${uid}/status`, {
  token: adminToken, method: "POST", body: { status: "deleted" } })).status, 400);

// ── retry refuses to invent money ────────────────────────────────────────────
const readyPid = q(`SELECT public_id FROM orders WHERE status='ready' AND "deletedAt" IS NULL LIMIT 1`);
const createdPid = q(`SELECT public_id FROM orders WHERE status='created' AND "deletedAt" IS NULL LIMIT 1`);
if (readyPid)
  is("retrying a delivered order is refused",
     (await call(`/admin-api/v1/orders/${readyPid}/retry`, { token: adminToken, method: "POST" })).status, 409);
if (createdPid)
  is("retrying an UNPAID order is refused",
     (await call(`/admin-api/v1/orders/${createdPid}/retry`, { token: adminToken, method: "POST" })).status, 409);
is("retrying a nonexistent order 404s",
   (await call("/admin-api/v1/orders/NOPE/retry", { token: adminToken, method: "POST" })).status, 404);

// ── the last admin cannot lock everyone out ──────────────────────────────────
const adminId = q(`SELECT id FROM pandits WHERE phone='${adminPhone}'`);
const activeAdmins = Number(q(`SELECT COUNT(*) FROM pandits WHERE is_admin AND status='active' AND "deletedAt" IS NULL`));
if (activeAdmins === 1) {
  is("the last admin cannot suspend themselves",
     (await call(`/admin-api/v1/pandits/${adminId}/status`, {
       token: adminToken, method: "POST", body: { status: "suspended" } })).status, 409);
  is("...and is still active afterwards", q(`SELECT status FROM pandits WHERE id=${adminId}`), "active");
}

// ── revoking admin logs the panel out immediately ────────────────────────────
execSync(`node ${import.meta.dirname}/ensure_admin.js ${adminPhone} off`, { stdio: "pipe" });
is("revoked admin token stops working at once",
   (await call("/admin-api/v1/overview", { token: adminToken })).status, 403);
execSync(`node ${import.meta.dirname}/ensure_admin.js ${adminPhone}`, { stdio: "pipe" });
is("re-granting restores the SAME token", (await call("/admin-api/v1/overview", { token: adminToken })).status, 200);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
