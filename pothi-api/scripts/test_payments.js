#!/usr/bin/env node
/**
 * Payment link + webhook contract.
 *
 * The webhook is the only thing that may mark an order paid, so it is tested
 * the way an attacker and a flaky network would exercise it: forged
 * signatures, duplicate deliveries, unknown ids, and out-of-order arrival.
 */
import crypto from "node:crypto";
import config from "../config.js";

const API = process.env.API || "http://localhost:4050";
const B = `${API}/noauth-api/v1/shop`;
let pass = 0, fail = 0;

const is = (name, got, want) => {
  const okk = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${okk ? "✓" : "✗"} ${name}${okk ? "" : `\n      got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
  okk ? pass++ : fail++;
};

const post = async (path, body, raw) => {
  const payload = raw ?? JSON.stringify(body);
  const headers = { "content-type": "application/json", ...(body?.__headers || {}) };
  delete body?.__headers;
  const r = await fetch(`${API}${path}`, { method: "POST", headers, body: payload });
  return { status: r.status, json: await r.json().catch(() => null) };
};

const sign = (raw) =>
  crypto.createHmac("sha256", config.razorpay.webhookSecret).update(raw).digest("hex");

const hook = async (event, entities, { badSig = false } = {}) => {
  const raw = JSON.stringify({ event, payload: entities });
  const r = await fetch(`${API}/noauth-api/v1/webhook/razorpay`, {
    method: "POST",
    headers: { "content-type": "application/json",
               "x-razorpay-signature": badSig ? "deadbeef" : sign(raw) },
    body: raw
  });
  return r.status;
};

const status = async (pid) =>
  (await (await fetch(`${B}/order/${pid}`)).json()).results;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("payment links + webhook");

// ── an order, with a real hosted link ────────────────────────────────────────
const created = await post("/noauth-api/v1/shop/order", {
  report_type: "love", name: "Ravi Sharma", gender: "male",
  dob: "1992-03-17", tob: "09:42",
  pob: "Varanasi, Uttar Pradesh, India", place_id: "local:Varanasi|Uttar Pradesh",
  language: "en", buyer_phone: "9660801827", buyer_name: "Ravi Sharma",
  design: "heritage", palette: "gold"
});
const order = created.json?.results;
is("order created", created.status, 200);
is("order starts unpaid", (await status(order.public_id)).status, "created");
console.log(`    link ${order.pay_url}`);

// The link id is not returned to the browser, so read it back the way the
// webhook will: by looking the order up.
const { default: db } = await import("../database/index.js");
const row = await db.Order.findOne({ where: { public_id: order.public_id } });
const linkId = row.razorpay_link_id;
if (!linkId) { console.log("  ✗ no payment link on the order"); process.exit(1); }

// ── checkout signs the buyer in, with no OTP ─────────────────────────────────
is("checkout returned a session", Boolean(order.token), true);
is("session is for the number given", order.user?.phone, "9660801827");
is("session is marked unverified", order.user?.verified, false);

const meRes = await fetch(`${API}/user-api/v1/me`, {
  headers: { authorization: `Bearer ${order.token}` }
});
const me = await meRes.json();
is("session reads the profile", meRes.status, 200);
is("the new order is on it", me.results.orders.some((x) => x.public_id === order.public_id), true);
is("no session is still rejected", (await fetch(`${API}/user-api/v1/me`)).status, 401);

// ── signature ────────────────────────────────────────────────────────────────
is("forged signature rejected", await hook("payment_link.paid",
  { payment_link: { entity: { id: linkId } }, payment: { entity: { id: "pay_forged" } } },
  { badSig: true }), 400);
is("still unpaid after forgery", (await status(order.public_id)).status, "created");

// ── the real thing ───────────────────────────────────────────────────────────
is("signed webhook accepted", await hook("payment_link.paid", {
  payment_link: { entity: { id: linkId, status: "paid" } },
  payment: { entity: { id: "pay_TEST00000001", order_id: null } }
}), 200);

let s = null;
for (let i = 0; i < 40 && (s = await status(order.public_id)).status !== "ready"; i++) await wait(500);
is("order is ready", s.status, "ready");
is("report attached", Boolean(s.pdf_url), true);
is("invoice issued", Boolean(s.invoice_no), true);
const firstPdf = s.pdf_url;

// ── duplicates ───────────────────────────────────────────────────────────────
is("duplicate delivery accepted", await hook("payment_link.paid", {
  payment_link: { entity: { id: linkId, status: "paid" } },
  payment: { entity: { id: "pay_TEST00000001" } }
}), 200);
await wait(1500);
const again = await status(order.public_id);
is("duplicate did not regenerate", again.pdf_url, firstPdf);

// ── noise ────────────────────────────────────────────────────────────────────
is("unknown link id survives", await hook("payment_link.paid", {
  payment_link: { entity: { id: "plink_does_not_exist" } }, payment: { entity: { id: "pay_x" } }
}), 200);
is("irrelevant event ignored", await hook("payment.failed", {
  payment: { entity: { id: "pay_y", order_id: "order_nope" } }
}), 200);

// ── the browser redirect ─────────────────────────────────────────────────────
const linkSig = (pid, st) => crypto.createHmac("sha256", config.razorpay.secret)
  .update(`${linkId}|${order.public_id}|${st}|${pid}`).digest("hex");

const confirm = (body) => post("/noauth-api/v1/shop/confirm-link", body);

is("redirect with a forged signature rejected", (await confirm({
  razorpay_payment_link_id: linkId, razorpay_payment_id: "pay_z",
  razorpay_payment_link_status: "paid", razorpay_payment_link_reference_id: order.public_id,
  razorpay_signature: "00" })).status, 400);

is("redirect with a valid signature accepted", (await confirm({
  razorpay_payment_link_id: linkId, razorpay_payment_id: "pay_TEST00000001",
  razorpay_payment_link_status: "paid", razorpay_payment_link_reference_id: order.public_id,
  razorpay_signature: linkSig("pay_TEST00000001", "paid") })).status, 200);

is("redirect for a mismatched order rejected", (await confirm({
  razorpay_payment_link_id: linkId, razorpay_payment_id: "pay_TEST00000001",
  razorpay_payment_link_status: "paid", razorpay_payment_link_reference_id: "SOMEONEELSE",
  razorpay_signature: crypto.createHmac("sha256", config.razorpay.secret)
    .update(`${linkId}|SOMEONEELSE|paid|pay_TEST00000001`).digest("hex") })).status, 400);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
