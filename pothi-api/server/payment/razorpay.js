import crypto from "node:crypto";
import config from "../../config.js";

// Live only when keys are configured. Without them the credits flow falls back
// to a clearly-labelled dev path so the loop is testable locally.
export const isLive = () => Boolean(config.razorpay.key && config.razorpay.secret);

let client = null;
async function rz() {
  if (!client) {
    const { default: Razorpay } = await import("razorpay");
    client = new Razorpay({ key_id: config.razorpay.key, key_secret: config.razorpay.secret });
  }
  return client;
}

export async function createOrder({ amountPaise, receipt, notes }) {
  const instance = await rz();
  return instance.orders.create({ amount: amountPaise, currency: "INR", receipt, notes });
}

/**
 * A hosted Payment Link, which is what a consumer is sent to.
 *
 * We deliberately do not open the checkout SDK for buyers: a link is one URL we
 * can also send over WhatsApp later, it survives the buyer switching device,
 * and it keeps card handling entirely on Razorpay's page. Razorpay redirects to
 * `callbackUrl` with its own query parameters appended once the link is paid.
 */
export async function createPaymentLink({
  amountPaise, description, name, phone, email, referenceId, callbackUrl, notes
}) {
  const instance = await rz();
  const contact = phone ? `+91${String(phone).replace(/\D/g, "").slice(-10)}` : undefined;
  return instance.paymentLink.create({
    amount: amountPaise,
    currency: "INR",
    accept_partial: false,
    description: String(description || "Pothi report").slice(0, 2048),
    reference_id: referenceId,
    // `customer` drives Razorpay's own reminders. It does NOT prefill the
    // checkout — that is options.checkout.prefill, below.
    customer: { name: name || undefined, contact, email: email || undefined },
    // Razorpay does the reminding; we do not want to build an SMS chaser.
    notify: { sms: true, email: Boolean(email) },
    reminder_enable: true,
    callback_url: callbackUrl,
    callback_method: "get",
    notes: notes || {},

    // We already asked for the number on our own form, so making the buyer type
    // it again on Razorpay's page is a step that only loses orders. Prefilling
    // it skips the "Contact details" screen entirely and lands them on the
    // payment options. Left editable on purpose: a locked field turns a typo
    // into a dead end. `name` also puts our brand on the checkout header
    // instead of the registered legal entity.
    options: {
      checkout: {
        name: config.brand?.name || undefined,
        prefill: {
          name: name || undefined,
          contact,
          email: email || undefined
        }
      }
    }
  });
}

/**
 * The signature on Razorpay's redirect back to us.
 *
 * Payment Links sign a different payload from Orders: the link id, our
 * reference id, the status and the payment id, joined by pipes. Using the
 * order-flow verifier here would reject every legitimate return.
 */
export function verifyPaymentLinkSignature({ linkId, referenceId, status, paymentId, signature }) {
  if (!config.razorpay.secret) return false;
  const expected = crypto.createHmac("sha256", config.razorpay.secret)
    .update(`${linkId}|${referenceId}|${status}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// HMAC of "<order_id>|<payment_id>" with the key secret.
export function verifySignature(orderId, paymentId, signature) {
  if (!config.razorpay.secret) return false;
  const expected = crypto.createHmac("sha256", config.razorpay.secret)
    .update(`${orderId}|${paymentId}`).digest("hex");
  // timingSafeEqual throws on a length mismatch, so compare lengths first —
  // a short signature must be a rejection, not a 500.
  const a = Buffer.from(expected), b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// HMAC of the RAW request body with the webhook secret. Requires req.rawBody,
// captured in index.js via express.json({ verify }).
export function validateWebhook(rawBody, signature) {
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto.createHmac("sha256", config.razorpay.webhookSecret)
    .update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
