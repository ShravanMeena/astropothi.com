// Consumer purchases: one person, one report, one payment. No account.
//
// Kept apart from the pandit credit flow on purpose — a pandit buys capacity, a
// consumer buys an artefact, and forcing either to imitate the other would
// distort both. They share only the engine underneath.

import { randomBytes } from "node:crypto";
import db from "../../database/index.js";
import config from "../../config.js";
import { getReportType, consumerPrice } from "../catalog/catalog.js";
import { getDesign } from "../../engine/reporting/designs/index.js";
import { getPalette } from "../../engine/reporting/palettes/index.js";
import { renderReport } from "../../engine/render.js";
import { putReportPdf } from "../../utilities/storage.js";
import * as Loc from "../location/location.service.js";
import * as RZ from "../payment/razorpay.js";
import * as Notify from "../messaging/notify.service.js";

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
  if (!type || !type.ready) throw Object.assign(new Error("UNKNOWN_REPORT"), { code: 400 });
  const price = consumerPrice(type.code);
  const base = Math.round(price / (1 + GST_RATE));
  return { code: type.code, chapters: type.chapters, price_paise: price,
           base_paise: base, gst_paise: price - base };
}

/** Create the order and, if Razorpay is live, the hosted payment link for it. */
export async function createOrder(input) {
  const q = await quote(input.report_type);

  // Coordinates are resolved server-side — never trusted from the browser, and
  // an unresolvable place must fail before we take money.
  const hit = await Loc.geocode({ placeId: input.place_id, address: input.pob });
  if (!hit) throw Object.assign(new Error("BAD_PLACE"), { code: 400 });

  const order = await db.Order.create({
    public_id: publicId(),
    report_type: q.code,
    design: getDesign(input.design).id,
    palette: getPalette(input.palette).id,
    language: input.language === "en" ? "en" : "hi",
    user_id: input.user_id || null,
    buyer_name: input.buyer_name, buyer_phone: input.buyer_phone,
    buyer_email: input.buyer_email || null, state: input.state || null,
    birth: {
      name: input.name, dob: input.dob, tob: input.tob, pob: input.pob,
      lat: hit.lat, lon: hit.lon, tzone: hit.tzone,
      gender: ["male", "female", "other"].includes(input.gender) ? input.gender : "male"
    },
    amount_paise: q.price_paise, gst_paise: q.gst_paise
  });

  if (RZ.isLive()) {
    // A hosted link, not a checkout SDK: one URL we can also send over WhatsApp,
    // that survives the buyer moving to another device, and that keeps card
    // handling entirely on Razorpay's page.
    const type = getReportType(q.code);
    const link = await RZ.createPaymentLink({
      amountPaise: q.price_paise,
      description: `${type?.name_en || q.code} — ${order.birth?.name || "your chart"}`,
      name: input.buyer_name || input.name,
      phone: input.buyer_phone,
      email: input.buyer_email,
      referenceId: order.public_id,
      callbackUrl: `${config.webOrigin}/order/${order.public_id}`,
      notes: { order: order.public_id, report: q.code }
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
      reportType: order.report_type, input: order.birth,
      designId: order.design, paletteId: order.palette,
      language: order.language, branding: houseBranding()
    });

    const report = await db.Report.create({
      order_id: order.id, source: "consumer",
      report_type: order.report_type, design: order.design, palette: order.palette,
      language: order.language, status: "ready", page_count: pages,
      credits_charged: 0, birth_meta: order.birth,
      rashi: model.profile.rashi, nakshatra: model.profile.nakshatra, lagna: model.profile.lagna,
      generated_ms: Date.now() - startedAt,
      share_token: randomBytes(6).toString("base64url").slice(0, 10)
    });
    const pdfUrl = await putReportPdf(buffer, `consumer/${order.public_id}`, report.id);
    await report.update({ pdf_url: pdfUrl });
    await order.update({ status: "ready", report_id: report.id });
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
