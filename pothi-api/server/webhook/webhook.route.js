import { Router } from "express";
import * as RZ from "../payment/razorpay.js";
import * as Purchase from "../credits/purchase.service.js";
import * as Shop from "../shop/shop.service.js";
import db from "../../database/index.js";

/**
 * The source of truth for payment.
 *
 * A paid order must never depend on the buyer's browser coming back to tell us
 * — that is how the donor codebase loses orders. Three rules hold here:
 *
 *   1. Verify the HMAC over the RAW body before reading anything. An unsigned
 *      body is not a payment notification, it is a stranger.
 *   2. Answer 200 immediately, then do the work. Razorpay retries anything
 *      else, and report generation takes seconds.
 *   3. Every handler is idempotent, because retries and the browser callback
 *      both land here and either may arrive first.
 */
export function noAuth() {
  const r = Router();

  r.post("/razorpay", async (req, res) => {
    if (!RZ.validateWebhook(req.rawBody || "", req.headers["x-razorpay-signature"])) {
      console.warn("[webhook] razorpay signature rejected");
      return res.status(400).json({ ok: false });
    }
    // Acknowledge first. Anything below this line must not change the response.
    res.json({ ok: true });

    const event = req.body?.event;
    const id = req.body?.payload?.payment?.entity?.id
            || req.body?.payload?.payment_link?.entity?.id;
    try {
      await handle(req.body);
    } catch (e) {
      // Swallow: we have already answered 200, and Razorpay must not retry a
      // failure that is ours (a bad birth place, a renderer crash). The order
      // is left marked `failed` by settleAndGenerate for us to see.
      console.error(`[webhook] ${event} ${id || "?"} failed:`, e.message);
    }
  });

  return r;
}

async function handle(body) {
  const event = body?.event;
  const payment = body?.payload?.payment?.entity || {};
  const link = body?.payload?.payment_link?.entity || {};

  // ── Consumer, paid through a hosted payment link ───────────────────────────
  if (event === "payment_link.paid") {
    if (!link.id) return;
    const order = await Shop.findByLink(link.id);
    if (!order) return console.warn(`[webhook] payment_link.paid for unknown link ${link.id}`);
    await Shop.settleAndGenerate({ linkId: link.id, paymentId: payment.id });
    return console.log(`[webhook] payment_link.paid ${link.id} → ${order.public_id} generated`);
  }

  // ── Everything else arrives against a gateway order id ─────────────────────
  if (event !== "payment.captured" && event !== "order.paid") return;
  if (!payment.order_id) return;

  // A payment made against a link also emits payment.captured; that link's
  // order_id belongs to Razorpay's internal order, which we never stored. Fall
  // back to the notes we set when the link was created.
  const consumer = await db.Order.findOne({ where: { razorpay_order_id: payment.order_id } });
  if (consumer) {
    await Shop.settleAndGenerate({ razorpayOrderId: payment.order_id, paymentId: payment.id });
    return console.log(`[webhook] ${event} ${payment.order_id} → consumer report generated`);
  }

  const byNote = payment.notes?.order
    ? await db.Order.findOne({ where: { public_id: payment.notes.order } })
    : null;
  if (byNote) {
    await Shop.settleAndGenerate({ publicId: byNote.public_id, paymentId: payment.id });
    return console.log(`[webhook] ${event} → ${byNote.public_id} generated (via notes)`);
  }

  const { alreadySettled } = await Purchase.settle({
    orderId: payment.order_id, paymentId: payment.id
  });
  console.log(`[webhook] ${event} ${payment.order_id} ${alreadySettled ? "(dup)" : "credited"}`);
}
