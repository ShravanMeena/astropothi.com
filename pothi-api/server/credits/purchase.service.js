import db from "../../database/index.js";
import { getPack } from "../catalog/catalog.js";
import * as Credits from "./credits.service.js";

const GST_RATE = 0.18;

// Packs are quoted GST-inclusive — most pandits are under the ₹20L threshold,
// cannot claim ITC, and must never be surprised at checkout.
export const splitGst = (inclusivePaise) => {
  const base = Math.round(inclusivePaise / (1 + GST_RATE));
  return { base_paise: base, gst_paise: inclusivePaise - base };
};

// Custom top-up rate: matches the Standard pack (Rs 4/credit ex-GST).
export const CUSTOM_RATE_PAISE = 472;
export const CUSTOM_MIN = 10;
export const CUSTOM_MAX = 25000;

export async function startPurchase(pandit, packCode, customCredits) {
  let pack;
  if (customCredits != null) {
    const n = Math.floor(Number(customCredits));
    if (!Number.isFinite(n) || n < CUSTOM_MIN || n > CUSTOM_MAX)
      throw Object.assign(new Error("BAD_CUSTOM_AMOUNT"), { code: 400 });
    pack = { code: "custom", credits: n, price_paise: n * CUSTOM_RATE_PAISE, validity_days: 365 };
  } else {
    pack = getPack(packCode);
    if (!pack) throw Object.assign(new Error("UNKNOWN_PACK"), { code: 400 });
    if (pack.price_paise <= 0) throw Object.assign(new Error("PACK_NOT_PURCHASABLE"), { code: 400 });
  }

  const { gst_paise } = splitGst(pack.price_paise);
  const purchase = await db.CreditPurchase.create({
    pandit_id: pandit.id, pack_id: null,
    amount_paise: pack.price_paise, gst_paise, credits: pack.credits,
    status: "created",
    expires_at: new Date(Date.now() + pack.validity_days * 864e5)
  });
  return { purchase, pack };
}

/**
 * Idempotent. Both the webhook and the client-side confirm land here; whichever
 * arrives first credits the ledger, the second is a no-op. The webhook is the
 * source of truth — the client call only makes the UI feel instant.
 */
export async function settle({ orderId, paymentId }) {
  return db.sequelize.transaction(async (tx) => {
    const purchase = await db.CreditPurchase.findOne({
      where: { razorpay_order_id: orderId }, transaction: tx, lock: tx.LOCK.UPDATE
    });
    if (!purchase) throw Object.assign(new Error("PURCHASE_NOT_FOUND"), { code: 404 });
    if (purchase.status === "paid") return { purchase, alreadySettled: true };

    await purchase.update({
      status: "paid", razorpay_payment_id: paymentId,
      invoice_no: `POT-${new Date().getFullYear()}-${String(purchase.id).padStart(5, "0")}`
    }, { transaction: tx });

    await Credits.credit(purchase.pandit_id, purchase.credits, "purchase",
      { type: "purchase", id: purchase.id, note: `${purchase.credits} credits` }, tx);

    // Buying extends every unexpired credit by another year — turns expiry
    // anxiety into a purchase trigger instead of a support ticket.
    await db.CreditPurchase.update(
      { expires_at: purchase.expires_at },
      { where: { pandit_id: purchase.pandit_id, status: "paid" }, transaction: tx }
    );

    return { purchase, alreadySettled: false };
  });
}
