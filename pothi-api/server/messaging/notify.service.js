// What we tell a buyer, and when. One function per moment worth interrupting
// somebody for — currently exactly one.

import db from "../../database/index.js";
import config from "../../config.js";
import { getReportType } from "../catalog/catalog.js";
import * as MSG91 from "./msg91.js";

/**
 * "Your report is ready", once.
 *
 * Both the Razorpay webhook and the browser callback settle an order, and
 * either can arrive twice, so the send is guarded by a timestamp on the order
 * rather than by hoping settlement happens once.
 *
 * Never throws. A messaging outage must not turn a paid, generated report into
 * a failed order — the failure is recorded on the order and the buyer still has
 * the page. Callers do not need to wrap this.
 */
export async function reportReady(order) {
  try {
    if (!order) return { skipped: "no order" };
    if (order.whatsapp_sent_at) return { skipped: "already sent" };
    if (order.status !== "ready") return { skipped: `status ${order.status}` };
    if (!order.buyer_phone) return { skipped: "no phone" };

    const type = getReportType(order.report_type);
    const name = order.language === "hi" ? type?.name_hi : type?.name_en;

    const out = await MSG91.sendTemplate({
      to: order.buyer_phone,
      template: config.msg91.template,
      language: order.language === "hi" ? "hi" : config.msg91.templateLang,
      body: [
        order.buyer_name || order.birth?.name || "there",
        name || order.report_type
      ],
      // The template's URL button is dynamic: WhatsApp appends this to the base
      // URL that was approved with the template, so send ONLY the id.
      buttonUrlSuffix: order.public_id
    });

    // A dry run is not a delivery, so it must not set the timestamp — otherwise
    // switching the key on later would silently skip every earlier order.
    if (out.sent) await order.update({ whatsapp_sent_at: new Date(), whatsapp_error: null });
    return out;
  } catch (e) {
    console.error(`[notify] report-ready failed for ${order?.public_id}:`, e.message);
    try { await order.update({ whatsapp_error: String(e.message).slice(0, 500) }); } catch { /* not worth a second failure */ }
    return { sent: false, error: e.message };
  }
}

/** Orders that are ready but never got their message — a webhook outage, say. */
export async function pendingNotifications(limit = 50) {
  return db.Order.findAll({
    where: { status: "ready", whatsapp_sent_at: null },
    order: [["createdAt", "DESC"]], limit
  });
}
