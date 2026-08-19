import { Router } from "express";
import { authenticate, authenticateUser, authenticateAdmin } from "../platform/auth.js";

import * as auth from "./auth/auth.route.js";
import * as catalog from "./catalog/catalog.route.js";
import * as branding from "./branding/branding.route.js";
import * as credits from "./credits/credits.route.js";
import * as reports from "./reports/reports.route.js";
import * as clients from "./clients/clients.route.js";
import * as earnings from "./earnings/earnings.route.js";
import * as webhook from "./webhook/webhook.route.js";
import * as location from "./location/location.route.js";
import * as pilot from "./pilot/pilot.route.js";
import * as shop from "./shop/shop.route.js";
import * as user from "./user/user.route.js";
import * as admin from "./admin/admin.route.js";

// Public: /noauth-api/v1/*
export function noAuthRoutes() {
  const r = Router();
  r.use("/auth", auth.noAuth());
  r.use("/catalog", catalog.noAuth());
  r.use("/webhook", webhook.noAuth());
  r.use("/location", location.noAuth());
  r.use("/pilot", pilot.noAuth());
  r.use("/shop", shop.noAuth());
  r.use("/user", user.noAuth());
  return r;
}

// Authenticated: /api/v1/*
export function authRoutes() {
  const r = Router();
  r.use(authenticate);
  r.use("/branding", branding.userRoute());
  r.use("/credits", credits.userRoute());
  r.use("/reports", reports.userRoute());
  r.use("/clients", clients.userRoute());
  r.use("/earnings", earnings.userRoute());
  r.get("/me", (req, res) => res.json({ success: true, results: req.pandit }));
  return r;
}

// Buyers: /user-api/v1/* — a separate namespace so a pandit token and a buyer
// token can never be mistaken for one another.
export function buyerRoutes() {
  const r = Router();
  r.use(authenticateUser);
  r.use("/", user.userRoute());
  return r;
}

// Staff: /admin-api/v1/* — a fourth namespace, not a privileged corner of an
// existing one. Nothing here is reachable with a pandit or a buyer token, and
// the guard re-reads is_admin from the row on every request so revoking access
// does not wait for a thirty-day token to expire.
export function adminRoutes() {
  const r = Router();
  r.use(authenticateAdmin);
  r.use("/", admin.adminRoute());
  return r;
}
