import { Router } from "express";
import db from "../../database/index.js";
import * as ReportService from "./reports.service.js";
import * as Credits from "../credits/credits.service.js";
import * as Loc from "../location/location.service.js";
import { ok, fail, h } from "../../utilities/http.js";

const REQUIRED = ["name", "dob", "tob"];

export function userRoute() {
  const r = Router();

  r.post("/generate", h(async (req, res) => {
    const { report_type, design, palette, language, client_id, save_client = true, ...birth } = req.body;

    const missing = REQUIRED.filter((f) => birth[f] === undefined || birth[f] === "");
    if (missing.length) return fail(res, `Missing: ${missing.join(", ")}`);

    // Resolve the birth place server-side. The client may send a place_id (from
    // autocomplete) or just text; either way the coordinates and timezone are
    // decided here, not trusted from the browser.
    let lat = Number(birth.lat), lon = Number(birth.lon), tzone = Number(birth.tzone ?? 5.5);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || birth.place_id) {
      const hit = await Loc.geocode({ placeId: birth.place_id, address: birth.pob });
      if (!hit) return fail(res, "Could not resolve the birth place — pick one from the list", 400);
      lat = hit.lat; lon = hit.lon; tzone = hit.tzone;
    } else {
      tzone = Loc.withTimezone(lat, lon).tzone;
    }

    const input = {
      name: birth.name, dob: birth.dob, tob: birth.tob,
      pob: birth.pob || "", lat, lon, tzone,
      gender: ["male", "female", "other"].includes(birth.gender) ? birth.gender : "male"
    };

    try {
      // The vahi is written inside the generate transaction — see reports.service.js.
      const report = await ReportService.generate({
        pandit: req.pandit, input, reportType: report_type, design, palette, language,
        clientId: client_id || null, clientPhone: birth.client_phone, saveClient: save_client
      });
      return ok(res, {
        report_id: report.id, status: report.status, pdf_url: report.pdf_url,
        design: report.design, palette: report.palette, language: report.language, share_token: report.share_token,
        credits_charged: report.credits_charged, generated_ms: report.generated_ms,
        page_count: report.page_count,
        balance: await Credits.getBalance(req.pandit.id)
      });
    } catch (e) {
      if (e.message === "INSUFFICIENT_CREDITS")
        return fail(res, "Not enough credits", 402, { balance: e.balance, needed: e.needed });
      if (e.message === "REPORT_TYPE_NOT_AVAILABLE")
        return fail(res, "This report is not available yet", 409);
      if (e.message === "UNKNOWN_REPORT_TYPE") return fail(res, "Unknown report type", 400);
      throw e;
    }
  }));

  r.get("/", h(async (req, res) => {
    const rows = await db.Report.findAll({
      where: { pandit_id: req.pandit.id },
      attributes: { exclude: ["report_json"] },
      include: [{ model: db.Client, attributes: ["id", "name", "phone"] }],
      order: [["id", "DESC"]], limit: Number(req.query.limit) || 50
    });
    return ok(res, rows);
  }));

  r.get("/:id", h(async (req, res) => {
    const row = await db.Report.findOne({ where: { id: req.params.id, pandit_id: req.pandit.id } });
    return row ? ok(res, row) : fail(res, "Report not found", 404);
  }));

  return r;
}
