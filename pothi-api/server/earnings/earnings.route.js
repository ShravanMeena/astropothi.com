import { Router } from "express";
import db from "../../database/index.js";
import { REPORT_TYPES } from "../catalog/catalog.js";
import { ok, h } from "../../utilities/http.js";

// The retention mechanic. Explicitly an ESTIMATE based on prices he set himself —
// never presented as verified revenue.
export function userRoute() {
  const r = Router();

  r.get("/summary", h(async (req, res) => {
    const pid = req.pandit.id;
    const prices = Object.fromEntries(
      (await db.PanditPrice.findAll({ where: { pandit_id: pid } }))
        .map((p) => [p.report_type, p.sale_price_paise])
    );

    const rows = await db.sequelize.query(
      `SELECT report_type, COUNT(*)::int AS n, COALESCE(SUM(credits_charged),0)::int AS credits
         FROM reports
        WHERE pandit_id = :pid AND status = 'ready' AND "deletedAt" IS NULL
        GROUP BY report_type`,
      { replacements: { pid }, type: db.Sequelize.QueryTypes.SELECT }
    );

    let earned = 0, reports = 0, credits = 0;
    const byType = rows.map((row) => {
      const price = prices[row.report_type] ?? 0;
      const sub = price * row.n;
      earned += sub; reports += row.n; credits += row.credits;
      const meta = REPORT_TYPES.find((t) => t.code === row.report_type);
      return { report_type: row.report_type, name_hi: meta?.name_hi, name_en: meta?.name_en,
               count: row.n, price_paise: price, earned_paise: sub };
    }).sort((a, b) => b.earned_paise - a.earned_paise);

    // What those credits cost him, at his blended rate across paid packs.
    const [spend] = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount_paise),0)::int AS paid, COALESCE(SUM(credits),0)::int AS bought
         FROM credit_purchases WHERE pandit_id = :pid AND status = 'paid'`,
      { replacements: { pid }, type: db.Sequelize.QueryTypes.SELECT }
    );
    const perCredit = spend.bought ? spend.paid / spend.bought : 0;
    const spent = Math.round(perCredit * credits);

    return ok(res, {
      estimated: true,
      earned_paise: earned, spent_paise: spent,
      multiple: spent ? Number((earned / spent).toFixed(1)) : null,
      reports, credits_used: credits, by_type: byType
    });
  }));

  r.get("/prices", h(async (req, res) =>
    ok(res, await db.PanditPrice.findAll({ where: { pandit_id: req.pandit.id } }))));

  r.put("/prices", h(async (req, res) => {
    const entries = Array.isArray(req.body.prices) ? req.body.prices : [];
    for (const { report_type, sale_price_paise } of entries) {
      if (!REPORT_TYPES.some((t) => t.code === report_type)) continue;
      const paise = Number(sale_price_paise);
      // An empty or zero price means "no price set" — remove the row. Upsert-only
      // meant a price could be added but never taken back.
      if (!Number.isFinite(paise) || paise <= 0) {
        // Hard delete: a price needs no audit trail, and soft-deleted rows
        // accumulating under the (pandit_id, report_type) unique index are a
        // latent hazard for the upsert on the other branch.
        await db.PanditPrice.destroy({ where: { pandit_id: req.pandit.id, report_type }, force: true });
      } else {
        await db.PanditPrice.upsert({ pandit_id: req.pandit.id, report_type, sale_price_paise: Math.round(paise) });
      }
    }
    return ok(res, await db.PanditPrice.findAll({ where: { pandit_id: req.pandit.id } }));
  }));

  return r;
}
