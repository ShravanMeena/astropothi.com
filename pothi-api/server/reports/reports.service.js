import { randomBytes } from "node:crypto";
import db from "../../database/index.js";
import { getReportType } from "../catalog/catalog.js";
import { renderReport } from "../../engine/render.js";
import * as Pilot from "../pilot/pilot.service.js";
import * as Credits from "../credits/credits.service.js";
import { putReportPdf } from "../../utilities/storage.js";

// Branding row -> the shape the engine's mergeBranding() expects.
function toEngineBranding(b) {
  if (!b) return {};
  const name = [b.honorific, b.display_name].filter(Boolean).join(" ").trim();
  return {
    companyName: b.shop_name || name || undefined,
    companyInfo: name || undefined,
    logoUrl: b.logo_url || undefined,
    logoPath: b.logo_url ? undefined : null,   // null = no Devpunya fallback logo
    footerLink: undefined,                      // never our domain on his PDF
    domainUrl: undefined,
    email: b.email || undefined,
    mobile: b.whatsapp || b.phone || undefined,
    chartStyle: b.chart_style || "NORTH_INDIAN",
    // Widened fields — consumed once the theme refactor lands (phase 2).
    panditName: name || undefined,
    photoUrl: b.photo_url || undefined,
    signatureUrl: b.signature_url || undefined,
    tagline: b.tagline || undefined,
    address: b.address || undefined
  };
}

const token = () => randomBytes(6).toString("base64url").slice(0, 10);

/**
 * Generate synchronously. Measured 120–1550ms, so a job table + polling would be
 * pure overhead on the normal path (see OPEN-ITEMS.md #2). Bulk CSV gets a queue later.
 *
 * The debit and the report row commit in ONE transaction; a render failure rolls
 * both back, so a failed generate never costs him a credit.
 */
export async function generate({ pandit, input, reportType, design, palette, language, clientId, clientPhone, saveClient = true }) {
  const type = getReportType(reportType);
  if (!type) throw Object.assign(new Error("UNKNOWN_REPORT_TYPE"), { code: 400 });
  if (!type.ready) throw Object.assign(new Error("REPORT_TYPE_NOT_AVAILABLE"), { code: 409 });

  const branding = await db.BrandingProfile.findOne({ where: { pandit_id: pandit.id } });
  const lang = language === "en" ? "en" : "hi";
  const designId = design || branding?.default_design || "classic";
  const paletteId = palette || branding?.default_palette || "saffron";

  const tx = await db.sequelize.transaction();
  let report;
  try {
    // Flat 1 credit per report while the pilot runs, so "10 free reports" means ten.
    const cost = Pilot.creditCost(type.code, type.credits);
    await Credits.reserve(pandit.id, cost, tx);

    // Resolve the client inside the transaction so a failed generate leaves no
    // orphan vahi rows, and re-use an existing client rather than duplicating him.
    let resolvedClientId = clientId || null;
    if (!resolvedClientId && saveClient) {
      const [client] = await db.Client.findOrCreate({
        where: { pandit_id: pandit.id, name: input.name, dob: input.dob, tob: input.tob },
        defaults: { pandit_id: pandit.id, ...input, phone: clientPhone || null },
        transaction: tx
      });
      if (clientPhone && !client.phone) await client.update({ phone: clientPhone }, { transaction: tx });
      resolvedClientId = client.id;
    }

    report = await db.Report.create({
      pandit_id: pandit.id, client_id: resolvedClientId,
      report_type: type.code, design: designId, palette: paletteId, language: lang,
      status: "generating", credits_charged: cost,
      birth_meta: input, share_token: token()
    }, { transaction: tx });

    await Credits.debit(pandit.id, cost, "generate",
      { type: "report", id: report.id, note: type.code }, tx);

    const t0 = Date.now();
    const { buffer, pages, model } = await renderReport({
      reportType: type.code, input, designId, paletteId, language: lang,
      branding: toEngineBranding(branding)
    });
    const ms = Date.now() - t0;

    // Keyed by the report's own share_token, never by pandit.id.
    //
    // This link is deliberately a capability: the pandit WhatsApps it straight
    // to his client, who has no account and must not need one. That only works
    // if the URL cannot be guessed — and `reports/<pandit_id>/<report_id>.pdf`
    // is two autoincrementing integers, so /files/reports/1/1.pdf was a real,
    // unauthenticated download of somebody's birth chart. The consumer path was
    // already random; this makes both unguessable.
    const pdfUrl = await putReportPdf(buffer, `p/${report.share_token}`, report.id);

    await report.update({
      status: "ready", pdf_url: pdfUrl, generated_ms: ms, page_count: pages,
      report_json: { sections: model.sections.length, title: model.title },
      rashi: model.profile.rashi, nakshatra: model.profile.nakshatra, lagna: model.profile.lagna
    }, { transaction: tx });

    await tx.commit();
    return report;
  } catch (err) {
    await tx.rollback();
    if (err.message === "INSUFFICIENT_CREDITS") {
      throw Object.assign(err, { code: 402 });
    }
    throw err;
  }
}
