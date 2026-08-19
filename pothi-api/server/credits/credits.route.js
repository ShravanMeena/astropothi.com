import { Router } from "express";
import db from "../../database/index.js";
import config from "../../config.js";
import * as Credits from "./credits.service.js";
import * as Purchase from "./purchase.service.js";
import * as RZ from "../payment/razorpay.js";
import { PACKS, getPack } from "../catalog/catalog.js";
import { ok, fail, h } from "../../utilities/http.js";

export function userRoute() {
  const r = Router();

  r.get("/balance", h(async (req, res) =>
    ok(res, { balance: await Credits.getBalance(req.pandit.id) })));

  r.get("/ledger", h(async (req, res) =>
    ok(res, await Credits.ledger(req.pandit.id, Number(req.query.limit) || 50))));

  r.get("/custom-rate", (req, res) => ok(res, {
    rate_paise: Purchase.CUSTOM_RATE_PAISE, min: Purchase.CUSTOM_MIN, max: Purchase.CUSTOM_MAX
  }));

  r.get("/packs", (req, res) => ok(res, PACKS.map((p) => ({
    ...p, ...Purchase.splitGst(p.price_paise),
    per_credit_paise: p.credits ? Math.round(p.price_paise / p.credits) : 0
  }))));

  // Create the order. Returns everything the client needs to open checkout.
  r.post("/purchase", h(async (req, res) => {
    let started;
    try {
      started = await Purchase.startPurchase(req.pandit, req.body.pack, req.body.credits);
    } catch (e) {
      if (e.message === "UNKNOWN_PACK") return fail(res, "Unknown pack", 400);
      if (e.message === "PACK_NOT_PURCHASABLE") return fail(res, "This pack cannot be purchased", 400);
      if (e.message === "BAD_CUSTOM_AMOUNT")
        return fail(res, `Enter between ${Purchase.CUSTOM_MIN} and ${Purchase.CUSTOM_MAX} credits`, 400);
      throw e;
    }
    const { purchase, pack } = started;

    if (true) {   // payments intentionally stubbed — see docs/06-roadmap.md phase 1
      // DUMMY GATEWAY. No real money moves. The client shows a payment sheet that
      // mirrors a real one so the confirmation UX is built and testable now; when
      // Razorpay is switched on, only this branch is deleted — createOrder(),
      // verifySignature(), the webhook and settle() are already the real thing.
      const fakeOrderId = `order_dev_${purchase.id}_${Date.now().toString(36)}`;
      await purchase.update({ razorpay_order_id: fakeOrderId });
      return ok(res, {
        mock: true, purchase_id: purchase.id, order_id: fakeOrderId,
        amount_paise: pack.price_paise, credits: pack.credits, pack: pack.code,
        gst_paise: Purchase.splitGst(pack.price_paise).gst_paise,
        prefill: { contact: req.pandit.phone, name: req.pandit.name || "" }
      });
    }

    const order = await RZ.createOrder({
      amountPaise: pack.price_paise,
      receipt: `pothi_${purchase.id}`,
      notes: { pandit_id: String(req.pandit.id), purchase_id: String(purchase.id), pack: pack.code }
    });
    await purchase.update({ razorpay_order_id: order.id });

    return ok(res, {
      mock: false, purchase_id: purchase.id, order_id: order.id,
      amount_paise: pack.price_paise, credits: pack.credits, pack: pack.code,
      key: config.razorpay.key, currency: "INR",
      prefill: { contact: req.pandit.phone, name: req.pandit.name || "" }
    });
  }));

  // Client-side confirm. A UX accelerator only — the webhook is authoritative
  // and settle() is idempotent, so whichever lands first wins.
  r.post("/confirm", h(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id) return fail(res, "razorpay_order_id is required");

    if (String(razorpay_order_id).startsWith("order_dev_")) {
      if (config.env === "production") return fail(res, "Payments are not configured", 503);
    } else if (RZ.isLive()) {
      if (!RZ.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
        return fail(res, "Signature mismatch", 400);
    } else {
      return fail(res, "Payments are not configured", 503);
    }

    const owned = await db.CreditPurchase.findOne({
      where: { razorpay_order_id, pandit_id: req.pandit.id }
    });
    if (!owned) return fail(res, "Order not found", 404);

    const { purchase, alreadySettled } = await Purchase.settle({
      orderId: razorpay_order_id, paymentId: razorpay_payment_id || "dev"
    });
    return ok(res, {
      credited: !alreadySettled, credits: purchase.credits,
      invoice_no: purchase.invoice_no,
      balance: await Credits.getBalance(req.pandit.id)
    });
  }));

  r.get("/purchases", h(async (req, res) =>
    ok(res, await db.CreditPurchase.findAll({
      where: { pandit_id: req.pandit.id }, order: [["id", "DESC"]], limit: 30
    }))));

  return r;
}
