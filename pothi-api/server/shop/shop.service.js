// Consumer purchases: one person, one report, one payment. No account.
//
// Kept apart from the pandit credit flow on purpose — a pandit buys capacity, a
// consumer buys an artefact, and forcing either to imitate the other would
// distort both. They share only the engine underneath.

import { randomBytes } from "node:crypto";
import db from "../../database/index.js";
import config from "../../config.js";
import { getReportType, COVER_PALETTE } from "../catalog/catalog.js";
import * as Pricing from "../catalog/pricing.service.js";
import { getDesign } from "../../engine/reporting/designs/index.js";
import { getPalette } from "../../engine/reporting/palettes/index.js";
import { renderReport } from "../../engine/render.js";
import { putReportPdf } from "../../utilities/storage.js";
import * as Loc from "../location/location.service.js";
import * as RZ from "../payment/razorpay.js";
import { isSellable } from "../catalog/status.service.js";
import * as Notify from "../messaging/notify.service.js";
import { orderAttribution } from "./attribution.js";

const GST_RATE = 0.18;
const publicId = () => randomBytes(6).toString("base64url").slice(0, 10).toUpperCase();

/** Our own brand goes on a consumer report — never a pandit's. */
function houseBranding() {
  return {
    panditName: config.brand.name,
    companyName: "",
    tagline: config.brand.tagline,
    mobile: config.brand.supportPhone || "",
    email: config.brand.supportEmail || "",
    logoUrl: config.brand.logoUrl || undefined
  };
}

export async function quote(reportType) {
  const type = getReportType(reportType);
  // Checked against the live override, not the compile-time flag: a buyer with
  // the checkout already open must not be able to pay for something we pulled.
  if (!type || !(await isSellable(reportType))) throw Object.assign(new Error("UNKNOWN_REPORT"), { code: 400 });
  const price = await Pricing.priceOf(type.code);
  const base = Math.round(price / (1 + GST_RATE));
  return { code: type.code, chapters: type.chapters, price_paise: price,
           base_paise: base, gst_paise: price - base };
}

/** Create the order and, if Razorpay is live, the hosted payment link for it. */
export async function createOrder(input) {
  const q = await quote(input.report_type);
  const type = getReportType(q.code);
  const isProperty = type?.subject === "property";
  const isCouple = type?.subject === "couple";

  // Coordinates are resolved server-side — never trusted from the browser, and
  // an unresolvable place must fail before we take money. Neither a Vastu report
  // nor a Couples Challenge has a birth place to resolve, so both skip this.
  let hit = null;
  if (!isProperty && !isCouple) {
    hit = await Loc.geocode({ placeId: input.place_id, address: input.pob });
    if (!hit) throw Object.assign(new Error("BAD_PLACE"), { code: 400 });
  }

  // One number, computed once. The payment link, the order row and the invoice
  // all have to agree — quoting a discount and then charging the list price at
  // Razorpay is the kind of bug a buyer reports as fraud.
  const charged = input.final_paise ?? q.price_paise;

  const order = await db.Order.create({
    public_id: publicId(),
    report_type: q.code,
    // A report may pin its typesetting. The Couples Challenge needs one chapter
    // per page or it stops being a thirty-day ritual — see the Keepsake spec.
    design: getDesign(input.design || type?.design).id,
    // The buyer picks a colourway, or the report's own is used. Falling through
    // to the global default put a Couples Challenge on the shelf in kalava and
    // then printed the delivered book in saffron — the same book in two colours,
    // and the wrong one is the one they paid for.
    palette: getPalette(input.palette || COVER_PALETTE[q.code]).id,
    language: input.language === "en" ? "en" : "hi",
    user_id: input.user_id || null,
    buyer_name: input.buyer_name, buyer_phone: input.buyer_phone,
    buyer_email: input.buyer_email || null, state: input.state || null,
    birth: (isProperty || isCouple) ? null : {
      name: input.name, dob: input.dob, tob: input.tob, pob: input.pob,
      lat: hit.lat, lon: hit.lon, tzone: hit.tzone,
      // Recorded, because a chart cast for midday because nobody knew the time
      // is a different thing from one cast for a time somebody gave us, and six
      // months later nothing else in the row would tell them apart. Support
      // needs it to answer "why does my ascendant look wrong", and it is what a
      // caveat printed inside the report would key off.
      tob_unknown: Boolean(input.tob_unknown),
      gender: ["male", "female", "other"].includes(input.gender) ? input.gender : "male"
    },
    property: isProperty ? {
      name: input.name,
      facing: input.facing,
      property_type: input.property_type || "home",
      city: input.pob || null,
      rooms: input.rooms && typeof input.rooms === "object" ? input.rooms : {}
    } : null,
    couple: isCouple ? {
      partner1_name: String(input.partner1_name || "").trim(),
      partner2_name: String(input.partner2_name || "").trim(),
      // Optional, and stored raw. The mapper decides whether it is readable and
      // drops the line if it is not — a half-parsed date must never reach a cover.
      start_date: String(input.start_date || "").trim() || null,
      gift_from: String(input.gift_from || "").trim() || null,
      gift_message: String(input.gift_message || "").trim().slice(0, 200) || null
    } : null,
    // Stamped at creation, so the answer to "where did this order come from"
    // lives on the order forever — not reconstructed later from a browser id
    // that a cleared cache would have broken.
    ...orderAttribution(input.attribution),

    list_paise: q.price_paise,
    coupon_code: input.coupon || null,
    discount_paise: input.discount_paise || 0,
    amount_paise: charged,
    gst_paise: charged - Math.round(charged / (1 + GST_RATE))
  });

  if (RZ.isLive()) {
    // A hosted link, not a checkout SDK: one URL we can also send over WhatsApp,
    // that survives the buyer moving to another device, and that keeps card
    // handling entirely on Razorpay's page.
    const link = await RZ.createPaymentLink({
      amountPaise: charged,
      description: `${type?.name_en || q.code} — ${order.birth?.name || order.property?.name || "your report"}`,
      name: input.buyer_name || input.name,
      phone: input.buyer_phone,
      email: input.buyer_email,
      // Prefixed so the Razorpay dashboard can be filtered to this site alone:
      // "POTHI-I9GPXV_X" is searchable, "I9GPXV_X" is not distinguishable from
      // another product's receipt.
      referenceId: `${config.razorpay.source}-${order.public_id}`,
      callbackUrl: `${config.webOrigin}/order/${order.public_id}`,
      notes: {
        source: config.razorpay.source,
        product: "report",
        order: order.public_id,
        report: q.code,
        design: order.design,
        language: order.language
      }
    });
    await order.update({ razorpay_link_id: link.id, razorpay_link_url: link.short_url });
    return { order, pay_url: link.short_url, mock: false };
  }

  // Payments not configured: a clearly-labelled local order so the flow is
  // testable end to end. Deleting this branch is the whole go-live change.
  await order.update({ razorpay_order_id: `order_dev_${order.id}_${Date.now().toString(36)}` });
  return { order, mock: true };
}

/** The order a Razorpay callback or webhook is talking about. */
export async function findByLink(linkId) {
  return linkId ? db.Order.findOne({ where: { razorpay_link_id: linkId } }) : null;
}

/**
 * Mark paid and render. Idempotent — webhook and client confirm both land here,
 * and a report is generated exactly once.
 */
export async function settleAndGenerate({ razorpayOrderId, linkId, publicId: pid, paymentId }) {
  const where = razorpayOrderId ? { razorpay_order_id: razorpayOrderId }
              : linkId          ? { razorpay_link_id: linkId }
              : pid             ? { public_id: pid }
                                : null;
  if (!where) throw Object.assign(new Error("ORDER_NOT_FOUND"), { code: 404 });
  const order = await db.Order.findOne({ where });
  if (!order) throw Object.assign(new Error("ORDER_NOT_FOUND"), { code: 404 });
  if (["ready", "generating"].includes(order.status)) return order;

  await order.update({
    status: "generating", razorpay_payment_id: paymentId || null,
    invoice_no: order.invoice_no || `POT-C-${new Date().getFullYear()}-${String(order.id).padStart(5, "0")}`
  });

  try {
    // Timed like the pandit path does, so the admin panel can report generation
    // cost for consumer books too — without this, 4 out of 5 reports in the
    // table have a blank "ms" column and slow renders hide.
    const startedAt = Date.now();
    const { buffer, pages, model } = await renderReport({
      reportType: order.report_type, input: order.couple || order.property || order.birth,
      designId: order.design, paletteId: order.palette,
      language: order.language, branding: houseBranding(),
      reference: order.public_id
    });

    const report = await db.Report.create({
      order_id: order.id, source: "consumer",
      report_type: order.report_type, design: order.design, palette: order.palette,
      language: order.language, status: "ready", page_count: pages,
      credits_charged: 0, birth_meta: order.property || order.birth,
      // The chapters, flattened to searchable text. Stored so a buyer can ask
      // their own report a question later without us re-rendering an 88-page
      // book to find the paragraph.
      report_json: {
        title: model.title,
        sections: model.sections.map((sec) => ({
          n: sec.n, id: sec.id, title: sec.title, subtitle: sec.subtitle || "",
          text: [sec.summary, ...(sec.paras || []), ...(sec.bullets || []), sec.advisory]
            .filter(Boolean).join(" ")
        }))
      },
      rashi: model.profile.rashi, nakshatra: model.profile.nakshatra, lagna: model.profile.lagna,
      generated_ms: Date.now() - startedAt,
      share_token: randomBytes(6).toString("base64url").slice(0, 10)
    });
    const pdfUrl = await putReportPdf(buffer, `consumer/${order.public_id}`, report.id);
    await report.update({ pdf_url: pdfUrl });
    await order.update({ status: "ready", report_id: report.id });
    // Counted at settlement, so an abandoned checkout never burns a use.
    if (order.coupon_code) await Pricing.redeem(order.coupon_code);
  } catch (e) {
    await order.update({ status: "failed", error: String(e.message).slice(0, 500) });
    throw e;
  }

  // Outside the try on purpose. Inside it, anything that went wrong while
  // messaging would mark a paid, generated report as `failed` — the notifier
  // already swallows its own errors, and this makes that guarantee structural
  // rather than a promise another file has to keep.
  await Notify.reportReady(order);
  return order;
}

export async function statusOf(publicIdOrOrder) {
  const order = await db.Order.findOne({ where: { public_id: publicIdOrOrder } });
  if (!order) return null;
  const report = order.report_id ? await db.Report.findByPk(order.report_id) : null;
  return {
    public_id: order.public_id, status: order.status,
    report_type: order.report_type,
    report_name_en: getReportType(order.report_type)?.name_en || order.report_type,
    design: order.design, palette: order.palette,
    language: order.language, amount_paise: order.amount_paise,
    invoice_no: order.invoice_no,
    pdf_url: report?.pdf_url || null, page_count: report?.page_count || null
  };
}
