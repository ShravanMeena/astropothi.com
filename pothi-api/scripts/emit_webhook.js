#!/usr/bin/env node
// Emit a correctly-signed payment_link.paid webhook, the way Razorpay would.
// Used by the shop test so it exercises the real settlement path rather than a
// back door that only exists for tests.
import crypto from "node:crypto";
import config from "../config.js";

const [linkId, paymentId = "pay_test"] = process.argv.slice(2);
if (!linkId) { console.error("usage: emit_webhook.js <payment_link_id> [payment_id]"); process.exit(2); }

const raw = JSON.stringify({
  event: "payment_link.paid",
  payload: {
    payment_link: { entity: { id: linkId, status: "paid" } },
    payment: { entity: { id: paymentId } }
  }
});
const res = await fetch(`${process.env.API || "http://localhost:4050"}/noauth-api/v1/webhook/razorpay`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-razorpay-signature": crypto.createHmac("sha256", config.razorpay.webhookSecret).update(raw).digest("hex")
  },
  body: raw
});
console.log(res.status);
process.exit(res.ok ? 0 : 1);
