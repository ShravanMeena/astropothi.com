import { Router } from "express";
import db from "../../database/index.js";
import config from "../../config.js";
import { signUserToken } from "../../platform/auth.js";
import * as U from "./user.service.js";
import { ok, fail, h } from "../../utilities/http.js";

const OTP_TTL_MS = 10 * 60 * 1000;

/** Public: sign in with a mobile number. No sign-up, no password. */
export function noAuth() {
  const r = Router();

  r.post("/otp/send", h(async (req, res) => {
    const phone = U.cleanPhone(req.body.phone);
    if (phone.length !== 10) return fail(res, "Enter a valid 10-digit mobile number");

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await db.OtpSession.create({
      phone, otp, isd_code: "+91", expires_at: new Date(Date.now() + OTP_TTL_MS)
    });
    // TODO: dispatch over WhatsApp. Until that exists, the only way a code can
    // reach anybody is in this response — which is exactly what OTP_REQUIRED=false
    // turns on. With it true and no dispatch, this endpoint sends nothing.
    console.log(`[otp:buyer] ${phone} → ${otp}`);
    return ok(res, { sent: true, ...(!config.otpRequired && { dev_otp: otp }) });
  }));

  r.post("/otp/verify", h(async (req, res) => {
    const phone = U.cleanPhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();
    if (phone.length !== 10 || !otp) return fail(res, "Phone and OTP are required");

    const bypass = config.otpBypass && otp === config.otpBypass;
    let session = null;
    if (!bypass) {
      session = await db.OtpSession.findOne({
        where: { phone, otp, status: "created" }, order: [["createdAt", "DESC"]]
      });
      if (!session) return fail(res, "Incorrect OTP", 401);
      if (session.expires_at && session.expires_at < new Date()) {
        await session.update({ status: "expired" });
        return fail(res, "OTP expired, please request a new one", 401);
      }
    }
    // Consume only once the sign-in is certain to succeed.
    if (session) await session.update({ status: "completed" });

    const user = await U.upsertByPhone(phone, { name: req.body.name, email: req.body.email });
    await U.markVerified(user);
    return ok(res, { token: signUserToken(user), user: U.publicUser(user) });
  }));

  return r;
}

/** Authenticated: /user-api/v1/* */
export function userRoute() {
  const r = Router();

  r.get("/me", h(async (req, res) => ok(res, await U.profileOf(req.user))));

  r.put("/me", h(async (req, res) => ok(res, await U.updateProfile(req.user, req.body || {}))));

  r.get("/orders", h(async (req, res) => {
    const { orders } = await U.profileOf(req.user);
    return ok(res, orders);
  }));

  return r;
}
