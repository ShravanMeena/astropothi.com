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

  return r;
}
