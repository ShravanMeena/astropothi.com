import { Router } from "express";
import * as A from "./admin.service.js";
import * as M from "./metrics.service.js";
import { ok, fail, h } from "../../utilities/http.js";

/**
 * /admin-api/v1/* — staff only.
 *
 * Mounted behind authenticateAdmin in index.route.js, so every handler here can
 * assume req.admin. Nothing in this file mints, escalates or grants admin
 * rights: is_admin is set by scripts/ensure_admin.js and nowhere else, which is
 * what keeps the whole surface un-escalatable no matter what these routes get
 * wrong.
 */
export function adminRoute() {
  const r = Router();

  // Who am I, and what does this environment do to the numbers below.
  r.get("/me", h(async (req, res) => ok(res, {
    id: String(req.admin.id), phone: req.admin.phone, name: req.admin.name || "",
    environment: A.environment()
  })));

  // ── Money ──────────────────────────────────────────────────────────────────
  r.get("/overview", h(async (req, res) => {
    const w = req.query.window || "30d";
    if (!M.isWindow(w)) return fail(res, "window must be today, 7d, 30d or all");
    return ok(res, await M.overview(w));
  }));

  r.get("/revenue/by-day", h(async (req, res) =>
    ok(res, await M.revenueByDay(req.query.days || 30))));

  // ── Orders ─────────────────────────────────────────────────────────────────
  r.get("/orders", h(async (req, res) => ok(res, await A.listOrders(req.query))));

  r.get("/orders/:publicId", h(async (req, res) => {
    const o = await A.getOrder(req.params.publicId);
    return o ? ok(res, o) : fail(res, "Order not found", 404);
  }));

  // The only write that touches money-adjacent state, and it cannot create it:
  // retry runs Shop.settleAndGenerate, which refuses anything but a failed order.
  r.post("/orders/:publicId/retry", h(async (req, res) => {
    try {
      return ok(res, await A.retryOrder(req.params.publicId));
    } catch (e) {
      if (e.message === "ORDER_NOT_FOUND") return fail(res, "Order not found", 404);
      if (e.code === 409) return fail(res, e.message, 409);
      // A render that fails again is news, not a 500 — hand back the reason.
      return fail(res, `Retry failed: ${e.message}`, 422);
    }
  }));

  // ── Users ──────────────────────────────────────────────────────────────────
  r.get("/users", h(async (req, res) => ok(res, await A.listUsers(req.query))));

  r.get("/users/:id", h(async (req, res) => {
    const u = await A.getUser(req.params.id);
    return u ? ok(res, u) : fail(res, "User not found", 404);
  }));

  r.post("/users/:id/status", h(async (req, res) => {
    try {
      return ok(res, await A.setUserStatus(req.params.id, req.body?.status));
    } catch (e) {
      if (e.message === "USER_NOT_FOUND") return fail(res, "User not found", 404);
      return fail(res, e.message, e.code || 400);
    }
  }));

  // ── Reports ────────────────────────────────────────────────────────────────
  r.get("/reports", h(async (req, res) => ok(res, await A.listReports(req.query))));

  // ── Astrologers ────────────────────────────────────────────────────────────
  r.get("/pandits", h(async (req, res) => ok(res, await A.listPandits())));

  r.get("/pandits/:id", h(async (req, res) => {
    const p = await A.getPandit(req.params.id);
    return p ? ok(res, p) : fail(res, "Astrologer not found", 404);
  }));

  r.post("/pandits/:id/status", h(async (req, res) => {
    try {
      return ok(res, await A.setPanditStatus(req.params.id, req.body?.status));
    } catch (e) {
      if (e.message === "PANDIT_NOT_FOUND") return fail(res, "Astrologer not found", 404);
      return fail(res, e.message, e.code || 400);
    }
  }));

  r.post("/pandits/:id/pilot", h(async (req, res) => {
    try {
      return ok(res, await A.setPilotSeat(req.params.id, req.body?.grant !== false));
    } catch (e) {
      if (e.message === "PANDIT_NOT_FOUND") return fail(res, "Astrologer not found", 404);
      if (e.message === "PILOT_FULL") return fail(res, "Every pilot seat is taken", 409);
      return fail(res, e.message, e.code || 400);
    }
  }));

  // ── Operations ─────────────────────────────────────────────────────────────
  r.get("/ops/payment-links", h(async (req, res) => ok(res, await A.paymentLinks(req.query))));
  r.get("/ops/catalogue", h(async (req, res) => ok(res, await A.catalogue())));

  // ── pricing ───────────────────────────────────────────────────────────────
  r.get("/pricing", h(async (req, res) => ok(res, await A.pricing())));
  r.put("/pricing/:code", h(async (req, res) => {
    const paise = Math.round(Number(req.body?.price_paise));
    if (!Number.isFinite(paise) || paise < 100 || paise > 5000000)
      return fail(res, "Price must be between ₹1 and ₹50,000", 400);
    return ok(res, await A.setPrice(req.params.code, paise, req.body?.note, req.admin?.name));
  }));
  r.delete("/pricing/:code", h(async (req, res) =>
    ok(res, await A.clearPrice(req.params.code))));

  // ── catalogue status ──────────────────────────────────────────────────────
  r.get("/catalogue/status", h(async (req, res) => ok(res, await A.catalogueStatus())));

  r.post("/catalogue/:code/status", h(async (req, res) => {
    try {
      return ok(res, await A.setCatalogueStatus(
        req.params.code, req.body?.sellable !== false, req.body?.note, req.admin?.phone
      ));
    } catch (e) { return fail(res, e.message, e.code || 400); }
  }));

  // Drop the override; the catalogue's own `ready` flag takes over again.
  r.delete("/catalogue/:code/status", h(async (req, res) =>
    ok(res, await A.clearCatalogueStatus(req.params.code))));

  // ── individual reports ────────────────────────────────────────────────────
  r.post("/reports/:id/status", h(async (req, res) => {
    try {
      return ok(res, await A.setReportStatus(req.params.id, req.body?.status));
    } catch (e) {
      if (e.message === "REPORT_NOT_FOUND") return fail(res, "Report not found", 404);
      return fail(res, e.message, e.code || 400);
    }
  }));

  r.delete("/reports/:id", h(async (req, res) => {
    try {
      return ok(res, await A.deleteReport(req.params.id, { force: req.query.force === "true" }));
    } catch (e) {
      if (e.message === "REPORT_NOT_FOUND") return fail(res, "Report not found", 404);
      // needs_force lets the UI ask a second time instead of failing silently.
      return fail(res, e.message, e.code || 400, e.needsForce ? { needs_force: true } : {});
    }
  }));

  r.delete("/orders/:publicId", h(async (req, res) => {
    try {
      return ok(res, await A.deleteOrder(req.params.publicId, { force: req.query.force === "true" }));
    } catch (e) {
      if (e.message === "ORDER_NOT_FOUND") return fail(res, "Order not found", 404);
      return fail(res, e.message, e.code || 400, e.needsForce ? { needs_force: true } : {});
    }
  }));

  // ── coupons ───────────────────────────────────────────────────────────────
  r.get("/coupons", h(async (req, res) => ok(res, await A.listCoupons())));
  r.post("/coupons", h(async (req, res) => {
    const out = await A.upsertCoupon(req.body);
    return out.error ? fail(res, out.error, 400) : ok(res, out);
  }));
  r.post("/coupons/:code/active", h(async (req, res) =>
    ok(res, await A.setCouponActive(req.params.code, Boolean(req.body?.active)))));

  // ── behaviour ─────────────────────────────────────────────────────────────
  r.get("/events", h(async (req, res) => ok(res, await A.listEvents(req.query))));
  r.get("/events/funnel", h(async (req, res) => ok(res, await A.funnel(req.query))));
  r.get("/events/by-report", h(async (req, res) => ok(res, await A.reportInterest(req.query))));
  r.get("/events/revenue-by-source", h(async (req, res) =>
    ok(res, await A.revenueBySource(req.query))));
  r.get("/events/acquisition", h(async (req, res) =>
    ok(res, await A.acquisitionBySource(req.query))));
  r.get("/events/journey/:anonymousId", h(async (req, res) =>
    ok(res, await A.journeyOf(req.params.anonymousId))));

  return r;
}
