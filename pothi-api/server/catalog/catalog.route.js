import { Router } from "express";
import { REPORT_TYPES, PACKS, getReportType } from "./catalog.js";
import { listDesigns, DESIGN_IDS } from "../../engine/reporting/designs/index.js";
import { listPalettes, PALETTE_IDS } from "../../engine/reporting/palettes/index.js";
import { getPreview } from "./preview.service.js";
import { ok, fail, h } from "../../utilities/http.js";

export function noAuth() {
  const r = Router();
  r.get("/report-types", (req, res) => ok(res, REPORT_TYPES));
  r.get("/designs", (req, res) => ok(res, listDesigns()));
  r.get("/palettes", (req, res) => ok(res, listPalettes()));
  r.get("/packs", (req, res) => ok(res, PACKS));

  // Real rendered sample pages for a (type, design, palette, language) combo.
  r.get("/preview", h(async (req, res) => {
    const type = String(req.query.type || "kundli");
    const design = String(req.query.design || "classic");
    const palette = String(req.query.palette || "saffron");
    const lang = req.query.lang === "en" ? "en" : "hi";
    if (!getReportType(type)) return fail(res, "Unknown report type", 400);
    if (!DESIGN_IDS.includes(design)) return fail(res, "Unknown design", 400);
    if (!PALETTE_IDS.includes(palette)) return fail(res, "Unknown palette", 400);
    return ok(res, await getPreview(type, design, palette, lang));
  }));

  return r;
}
