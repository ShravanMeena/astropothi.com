import { Router } from "express";
import db from "../../database/index.js";
import config from "../../config.js";
import { signToken, signAdminToken } from "../../platform/auth.js";
import * as Pilot from "../pilot/pilot.service.js";
import { ok, fail, h } from "../../utilities/http.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const clean = (p) => String(p || "").replace(/\D/g, "").slice(-10);

export function noAuth() {
  const r = Router();

  r.post("/otp/send", h(async (req, res) => {
    const phone = clean(req.body.phone);
    if (phone.length !== 10) return fail(res, "Enter a valid 10-digit mobile number");

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await db.OtpSession.create({
      phone, otp, isd_code: req.body.isd_code || "+91",
      expires_at: new Date(Date.now() + OTP_TTL_MS)
    });
    // TODO: dispatch over WhatsApp. Until that exists, the only way a code can
    // reach anybody is in this response — which is exactly what OTP_REQUIRED=false
    // turns on. With it true and no dispatch, this endpoint sends nothing.
    console.log(`[otp] ${phone} → ${otp}`);
    return ok(res, { sent: true, ...(!config.otpRequired && { dev_otp: otp }) });
  }));

  r.post("/otp/verify", h(async (req, res) => {
    const phone = clean(req.body.phone);
    const otp = String(req.body.otp || "").trim();
    if (phone.length !== 10 || !otp) return fail(res, "Phone and OTP are required");

    // Verify the OTP but do NOT consume it yet — the invite check below can
    // still reject, and burning the OTP on a mistyped code would force a fresh
    // one for every attempt.
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

    const existing = await db.Pandit.findOne({ where: { phone } });

    // Invite-only during the pilot: a new phone needs a valid code and a free
    // seat. Existing pandits sign in normally.
    if (!existing && Pilot.isOn()) {
      const st = await Pilot.status();
      if (!st.seats_left) return fail(res, "The pilot is full for now.", 409, { pilot: st });
      if (!String(req.body.invite_code || "").trim())
        return fail(res, "An invite code is required.", 403, { needs_invite: true, pilot: st });
    }

    const [pandit, created] = await db.Pandit.findOrCreate({
      where: { phone }, defaults: { phone, isd_code: req.body.isd_code || "+91" }
    });

    if (Pilot.isOn() && !pandit.pilot_seat) {
      try {
        await Pilot.claimSeat(pandit, req.body.invite_code);
      } catch (e) {
        // A brand-new row with no seat would be a dead account — remove it.
        if (created) await pandit.destroy({ force: true });
        if (e.message === "BAD_INVITE") return fail(res, "That invite code is not valid.", 403, { needs_invite: true });
        if (e.message === "PILOT_FULL") return fail(res, "The pilot is full for now.", 409);
        throw e;
      }
    }

    // Everything passed — now the OTP is spent.
    if (session) await session.update({ status: "completed" });

    return ok(res, {
      token: signToken(pandit),
      // Staff get a SECOND token, never a more powerful first one. The pandit
      // token stays exactly what it was, so nothing downstream has to learn
      // that admins exist; the console and the panel simply hold different
      // keys. is_admin is read from the row, never from anything posted here.
      ...(pandit.is_admin ? { is_admin: true, admin_token: signAdminToken(pandit) } : {}),
      is_new: created,
      pilot_seat: pandit.pilot_seat,
      pandit: { id: pandit.id, phone: pandit.phone, name: pandit.name, state: pandit.state }
    });
  }));

  return r;
}
