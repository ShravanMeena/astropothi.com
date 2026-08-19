import { Router } from "express";
import * as Shop from "./shop.service.js";
import { outline } from "./outline.service.js";
import { orderPages } from "./reader.service.js";
import { getReportType, consumerPrice } from "../catalog/catalog.js";
import { getPreview, getThumb } from "../catalog/preview.service.js";
import config from "../../config.js";
import { consumerCatalogue } from "../catalog/catalog.js";
import { listDesigns } from "../../engine/reporting/designs/index.js";
import { listPalettes } from "../../engine/reporting/palettes/index.js";
import { ok, fail, h } from "../../utilities/http.js";
import * as U from "../user/user.service.js";
import { signUserToken } from "../../platform/auth.js";

// All public: a consumer buys without an account. Phone is captured at checkout,
// which doubles as the receipt channel.
export function noAuth() {
  const r = Router();

  r.get("/brand", (req, res) => ok(res, { name: config.brand.name, tagline: config.brand.tagline }));
  r.get("/catalogue", (req, res) => ok(res, {
    reports: consumerCatalogue(), designs: listDesigns(), palettes: listPalettes()
  }));

  // Everything a buyer needs to decide: the real chapter list, page count, and
  // rendered sample pages of the exact design they are looking at.
  r.get("/report/:code", h(async (req, res) => {
    const type = getReportType(req.params.code);
    if (!type || !type.ready) return fail(res, "Unknown report", 404);
    const lang = req.query.lang === "hi" ? "hi" : "en";
    const design = String(req.query.design || "heritage");
    const palette = String(req.query.palette || "gold");

    const [o, preview] = await Promise.all([
      outline(type.code, lang),
      getPreview(type.code, design, palette, lang, "house").catch(() => null)
    ]);
    return ok(res, {
      code: type.code, name_en: type.name_en, name_hi: type.name_hi,
      chapters: type.chapters, price_paise: consumerPrice(type.code),
      approx_pages: o.approx_pages, outline: o.chapters,
      sample: preview ? { pages: preview.total_pages, images: preview.images, pdf: preview.pdf } : null
    });
  }));

  // One cover thumbnail, so the edition picker shows the layouts rather than
  // describing them. Fetched per card so a cold render never blocks the page.
  r.get("/thumb/:code", h(async (req, res) => {
    const type = getReportType(req.params.code);
    if (!type || !type.ready) return fail(res, "Unknown report", 404);
    const url = await getThumb(
      String(req.query.design || "heritage"), String(req.query.palette || "gold"),
      req.query.lang === "hi" ? "hi" : "en", type.code, "house"
    ).catch(() => null);
    return ok(res, { url });
  }));

  r.post("/order", h(async (req, res) => {
    const need = ["report_type", "name", "dob", "tob", "buyer_phone"];
    const missing = need.filter((k) => !String(req.body[k] || "").trim());
    if (missing.length) return fail(res, `Missing: ${missing.join(", ")}`);
    if (!req.body.place_id && !req.body.pob) return fail(res, "Birth place is required");
    try {
      // Buying is what creates the account: the number they are reachable on
      // becomes the login, and the order is attached to it from the start.
      const user = await U.upsertByPhone(req.body.buyer_phone, {
        name: req.body.buyer_name || req.body.name,
        email: req.body.buyer_email,
        birth: { name: req.body.name, dob: req.body.dob, tob: req.body.tob, pob: req.body.pob }
      });
      const { order, pay_url, mock } = await Shop.createOrder({ ...req.body, user_id: user.id });
      return ok(res, {
        public_id: order.public_id, razorpay_order_id: order.razorpay_order_id,
        amount_paise: order.amount_paise, gst_paise: order.gst_paise,
        report_type: order.report_type, mock, pay_url: pay_url || null,
        // Signed in on the number they just gave us, with no OTP step. See the
        // note on config.autoLoginOnOrder for what this trades away.
        ...(config.autoLoginOnOrder
          ? { token: signUserToken(user), user: U.publicUser(user) }
          : {})
      });
    } catch (e) {
      if (e.message === "BAD_PLACE") return fail(res, "Could not resolve that birth place — pick one from the list", 400);
      if (e.message === "UNKNOWN_REPORT") return fail(res, "Unknown report", 400);
      throw e;
    }
  }));

  /**
   * Razorpay's redirect back from a payment link.
   *
   * The webhook is authoritative — this exists so a buyer who lands back on the
   * page before the webhook arrives is not left staring at "awaiting payment".
   * The signature is still checked in full: a redirect is attacker-controlled.
   */
  r.post("/confirm-link", h(async (req, res) => {
    const linkId = String(req.body.razorpay_payment_link_id || "");
    const paymentId = String(req.body.razorpay_payment_id || "");
    const status = String(req.body.razorpay_payment_link_status || "");
    const referenceId = String(req.body.razorpay_payment_link_reference_id || "");
    if (!linkId || !paymentId) return fail(res, "Missing payment reference", 400);

    const { verifyPaymentLinkSignature } = await import("../payment/razorpay.js");
    const okSig = verifyPaymentLinkSignature({
      linkId, referenceId, status, paymentId, signature: req.body.razorpay_signature
    });
    if (!okSig) return fail(res, "Signature mismatch", 400);
    if (status !== "paid") return fail(res, `Payment ${status || "not completed"}`, 402);

    const order = await Shop.findByLink(linkId);
    if (!order) return fail(res, "Order not found", 404);
    // The reference id is ours; a mismatch means the link is not this order's.
    if (referenceId && referenceId !== order.public_id) return fail(res, "Order mismatch", 400);

    await Shop.settleAndGenerate({ linkId, paymentId });
    return ok(res, await Shop.statusOf(order.public_id));
  }));

  // The client-side confirm. The webhook is authoritative and settle is
  // idempotent, so whichever arrives first generates the report.
  r.post("/confirm", h(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id) return fail(res, "razorpay_order_id is required");
    // Decide by the id, not by whether keys happen to be configured: a dev
    // order can only settle on the dev path (never in production), and a real
    // order always needs a real signature.
    const { isLive, verifySignature } = await import("../payment/razorpay.js");
    if (String(razorpay_order_id).startsWith("order_dev_")) {
      if (config.env === "production") return fail(res, "Payments are not configured", 503);
    } else if (isLive()) {
      if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
        return fail(res, "Signature mismatch", 400);
    } else {
      return fail(res, "Payments are not configured", 503);
    }
    const order = await Shop.settleAndGenerate({ razorpayOrderId: razorpay_order_id, paymentId: razorpay_payment_id });
    return ok(res, await Shop.statusOf(order.public_id));
  }));

  r.get("/order/:publicId", h(async (req, res) => {
    const s = await Shop.statusOf(req.params.publicId);
    return s ? ok(res, s) : fail(res, "Order not found", 404);
  }));

  // The report as turnable pages, for a buyer who would rather read than download.
  r.get("/order/:publicId/pages", h(async (req, res) => {
    const pages = await orderPages(req.params.publicId);
    return ok(res, pages ?? { pages: [], total: 0 });
  }));

  return r;
}
