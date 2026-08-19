import { Router } from "express";
import { Op } from "sequelize";
import db from "../../database/index.js";
import { ok, fail, h } from "../../utilities/http.js";

export function userRoute() {
  const r = Router();

  r.get("/", h(async (req, res) => {
    const q = (req.query.q || "").trim();
    const where = { pandit_id: req.pandit.id };
    if (q) where[Op.or] = [{ name: { [Op.iLike]: `%${q}%` } }, { phone: { [Op.iLike]: `%${q}%` } }];
    return ok(res, await db.Client.findAll({ where, order: [["id", "DESC"]], limit: 100 }));
  }));

  r.post("/", h(async (req, res) => {
    if (!req.body.name) return fail(res, "Name is required");
    return ok(res, await db.Client.create({ pandit_id: req.pandit.id, ...req.body }), 201);
  }));

  // The annuity: every client needs a fresh Varshaphal each year.
  r.get("/birthdays", h(async (req, res) => {
    const days = Number(req.query.days) || 7;
    const rows = await db.sequelize.query(
      `SELECT id, name, phone, dob FROM clients
        WHERE pandit_id = :pid AND dob IS NOT NULL AND "deletedAt" IS NULL
          AND (to_char(to_date(dob,'YYYY-MM-DD'),'MM-DD'))
              IN (SELECT to_char(CURRENT_DATE + s, 'MM-DD')
                    FROM generate_series(0, :days) s)
        ORDER BY to_char(to_date(dob,'YYYY-MM-DD'),'MM-DD')`,
      { replacements: { pid: req.pandit.id, days }, type: db.Sequelize.QueryTypes.SELECT }
    );
    return ok(res, rows);
  }));

  return r;
}
