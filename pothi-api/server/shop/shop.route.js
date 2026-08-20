import { Router } from "express";
import * as Shop from "./shop.service.js";
import { outline } from "./outline.service.js";
import { orderPages } from "./reader.service.js";
import { ask, suggestions } from "./ask.service.js";
import { chat as aiChat } from "../ai/chat.service.js";
import * as ChatLog from "./chat-log.service.js";
import * as LLM from "../ai/llm.js";
import { COVER_PALETTE, getReportType } from "../catalog/catalog.js";
import * as Pricing from "../catalog/pricing.service.js";
import { getPreview, getThumb } from "../catalog/preview.service.js";
import config from "../../config.js";
import db from "../../database/index.js";
import { consumerCatalogue } from "../catalog/catalog.js";
import * as Status from "../catalog/status.service.js";
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
  r.get("/catalogue", h(async (req, res) => {
    const prices = await Pricing.priceMap();
    // A report pulled from the shelf in the admin panel has to disappear here,
    // not merely stop being buyable further down — a card that 404s on click is
    // worse than one that was never shown.
    const sellable = await Status.sellableMap();
    return ok(res, {
      reports: consumerCatalogue()
        .filter((r) => sellable[r.code])
        .map((r) => ({ ...r, price_paise: prices[r.code] ?? r.price_paise })),
      designs: listDesigns(), palettes: listPalettes()
    });
  }));

  // Everything a buyer needs to decide: the real chapter list, page count, and
  // rendered sample pages of the exact design they are looking at.
  r.get("/report/:code", h(async (req, res) => {
    const type = getReportType(req.params.code);
    if (!type || !(await Status.isSellable(req.params.code))) return fail(res, "Unknown report", 404);
    const lang = req.query.lang === "hi" ? "hi" : "en";
    // A report may pin its typesetting and its colourway, and when it does the
    // storefront must preview THAT — the Couples Challenge is laid out one page
    // per day in Keepsake, and the sample was showing it as a Heritage volume
    // with a Ganesha on the cover. Showing a buyer a book they will not receive
    // is the one thing a sample must never do.
    const design = String(req.query.design || type.design || "heritage");
    const palette = String(req.query.palette || COVER_PALETTE[type.code] || "gold");

    const [o, preview] = await Promise.all([
      outline(type.code, lang),
      getPreview(type.code, design, palette, lang, "house").catch(() => null)
    ]);
    return ok(res, {
      code: type.code, name_en: type.name_en, name_hi: type.name_hi,
      // Which edition this sample actually is, so the picker on the detail page
      // can start where the book starts rather than on its own default.
      design, palette,
      chapters: type.chapters, price_paise: await Pricing.priceOf(type.code),
      // The preview is the real book in the design the reader is looking at, so
      // its page count is the true one. The outline's is a floor: it renders
      // without the AI expansion, which is what makes it fast.
      approx_pages: preview?.total_pages ?? o.approx_pages,
      outline: o.chapters,
      sample: preview ? { pages: preview.total_pages, images: preview.images, pdf: preview.pdf } : null
    });
  }));

  // One cover thumbnail, so the edition picker shows the layouts rather than
  // describing them. Fetched per card so a cold render never blocks the page.
  r.get("/thumb/:code", h(async (req, res) => {
    const type = getReportType(req.params.code);
    if (!type || !(await Status.isSellable(req.params.code))) return fail(res, "Unknown report", 404);
    const url = await getThumb(
      String(req.query.design || "heritage"), String(req.query.palette || "gold"),
      req.query.lang === "hi" ? "hi" : "en", type.code, "house"
    ).catch(() => null);
    return ok(res, { url });
  }));

  /** Check a code without creating anything. */
  r.post("/coupon", h(async (req, res) => {
    const code = String(req.body?.code || "").trim();
    const type = getReportType(req.body?.report_type);
    if (!type) return fail(res, "Unknown report", 400);
    const amount = await Pricing.priceOf(type.code);
    const out = await Pricing.applyCoupon(code, { reportType: type.code, amountPaise: amount });
    return out.ok ? ok(res, out) : fail(res, out.reason, 400);
  }));

  r.post("/order", h(async (req, res) => {
    // Three subjects, three sets of required fields. A Vastu report is about a
    // building and needs a facing, not a birth time; a Couples Challenge is
    // about two people and needs two names and no chart at all.
    const rt = getReportType(req.body.report_type);
    const subject = rt?.subject || "person";
    const isProperty = subject === "property";
    const isCouple = subject === "couple";
    const NEED = {
      property: ["report_type", "name", "facing", "buyer_phone"],
      couple:   ["report_type", "partner1_name", "partner2_name", "buyer_phone"],
      person:   ["report_type", "name", "dob", "tob", "buyer_phone"]
    };
    const missing = NEED[subject].filter((k) => !String(req.body[k] || "").trim());
    if (missing.length) return fail(res, `Missing: ${missing.join(", ")}`);
    if (!isProperty && !isCouple && !req.body.place_id && !req.body.pob)
      return fail(res, "Birth place is required");
    try {
      // Buying is what creates the account: the number they are reachable on
      // becomes the login, and the order is attached to it from the start.
      const user = await U.upsertByPhone(req.body.buyer_phone, {
        // A couples order carries no `name` — the buyer is one of the two
        // partners, or the person gifting it. Without this the account would be
        // created nameless and every later email would open "Hello ,".
        name: req.body.buyer_name || req.body.name || req.body.partner1_name,
        email: req.body.buyer_email,
        // Nothing to remember for a report with no chart; skip rather than
        // write a birth record of four nulls over a real one saved earlier.
        ...(isCouple ? {} : {
          birth: { name: req.body.name, dob: req.body.dob, tob: req.body.tob, pob: req.body.pob }
        }),
        attribution: req.body.attribution
      });
      // Re-validated here: the browser may send any code and any total, and the
      // amount charged must come from our arithmetic, not theirs.
      let coupon = null;
      if (String(req.body.coupon || "").trim()) {
        const listed = await Pricing.priceOf(rt.code);
        const c = await Pricing.applyCoupon(req.body.coupon, { reportType: rt.code, amountPaise: listed });
        if (!c.ok) return fail(res, c.reason, 400);
        coupon = c;
      }
      const { order, pay_url, mock } = await Shop.createOrder({
        ...req.body, user_id: user.id,
        coupon: coupon?.code || null,
        discount_paise: coupon?.discount_paise || 0,
        final_paise: coupon?.final_paise
      });
      return ok(res, {
        public_id: order.public_id, razorpay_order_id: order.razorpay_order_id,
        amount_paise: order.amount_paise, gst_paise: order.gst_paise,
        list_paise: order.list_paise, discount_paise: order.discount_paise,
        coupon_code: order.coupon_code,
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
      // Razorpay throttles, and it surfaced to the buyer as "Internal error" —
      // which reads as "your details are wrong" at the exact moment somebody is
      // about to pay. It is transient and retrying works, so say that.
      if (e?.statusCode === 429)
        return fail(res, "Our payment provider is busy. Wait a few seconds and press pay again.", 503);
      if (e?.statusCode >= 400 && e?.statusCode < 600 && e?.error?.description)
        return fail(res, `Payment could not be set up: ${e.error.description}`, 502);
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
    // The reference id is ours and carries a source prefix ("POTHI-XXXX").
    // Strip only that exact prefix: public_id is base64url-derived and can
    // itself contain a dash, so a greedy /^[A-Z0-9]+-/ would eat part of the id
    // and reject a perfectly good redirect.
    const bare = referenceId.startsWith(`${config.razorpay.source}-`)
      ? referenceId.slice(config.razorpay.source.length + 1)
      : referenceId;
    if (referenceId && bare !== order.public_id) return fail(res, "Order mismatch", 400);

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

  /**
   * Ask a question of a report you own.
   *
   * Retrieval over that buyer's own chapters — it quotes, it never composes.
   * Public like the rest of the order routes: the public_id is the capability,
   * and everything it can return is already on the order page.
   */
  r.get("/order/:publicId/ask", h(async (req, res) => {
    const lang = req.query.lang === "hi" ? "hi" : "en";
    if (!String(req.query.q || "").trim()) {
      return ok(res, {
        kind: "suggestions", ai: LLM.isLive(),
        suggestions: await suggestions(req.params.publicId, lang)
      });
    }
    return ok(res, await ask(req.params.publicId, req.query.q, lang));
  }));

  /**
   * The report assistant. A real conversation, grounded in this buyer's own
   * chapters — see server/ai/chat.service.js for the grounding and the rules.
   *
   * Falls back to quoting passages when no model key is configured or the model
   * is unreachable, so a vendor outage degrades the feature instead of breaking
   * the page somebody just paid for.
   */
  r.post("/order/:publicId/chat", h(async (req, res) => {
    const lang = req.body?.lang === "hi" ? "hi" : "en";
    const q = String(req.body?.q || "").trim();
    if (!q) return fail(res, "Ask a question", 400);

    const order = await db.Order.findOne({ where: { public_id: req.params.publicId } });
    // The thread comes from the database, not the browser. A client-supplied
    // history could be edited to put words in the assistant's mouth, and it is
    // lost on reload anyway.
    const stored = order ? await ChatLog.history(req.params.publicId, 12) : [];
    const thread = stored.map((m) => ({ role: m.role, content: m.content }));

    const started = Date.now();
    let reply = null;
    if (LLM.isLive()) {
      try {
        const out = await aiChat(req.params.publicId, q, thread, lang);
        if (out.kind === "answer" || out.kind === "limit") reply = out;
      } catch (e) {
        console.error("[chat] model failed:", e.message);
      }
    }
    // No key, over the cap, or the model failed — quote the report instead.
    if (!reply) reply = { ...(await ask(req.params.publicId, q, lang)), degraded: true };

    await ChatLog.record(order, {
      question: q, reply, lang,
      model: reply.degraded ? "retrieval" : (config.ai.chatModelId || config.ai.bedrockModelId),
      latencyMs: Date.now() - started
    });
    return ok(res, reply);
  }));

  /** Everything already said in this conversation, so a reload does not lose it. */
  r.get("/order/:publicId/chat", h(async (req, res) =>
    ok(res, { messages: await ChatLog.history(req.params.publicId) })));

  return r;
}
