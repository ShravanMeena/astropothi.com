import { Router } from "express";
import db from "../../database/index.js";
import config from "../../config.js";
import * as Credits from "../credits/credits.service.js";
import * as Pilot from "../pilot/pilot.service.js";
import { ok, fail, h } from "../../utilities/http.js";

const FIELDS = ["honorific", "display_name", "shop_name", "phone", "whatsapp", "email",
  "address", "logo_url", "photo_url", "signature_url", "tagline",
  "chart_style", "default_language", "default_design", "default_palette", "ui_language"];

// A reseller has to emit reports under other people's identities. Cap the churn.
const MAX_CHANGES_PER_QUARTER = 2;
const IDENTITY_FIELDS = ["display_name", "shop_name", "logo_url", "photo_url"];

export function userRoute() {
  const r = Router();

  r.get("/", h(async (req, res) => {
    const b = await db.BrandingProfile.findOne({ where: { pandit_id: req.pandit.id } });
    return ok(res, b);
  }));

  r.put("/", h(async (req, res) => {
    const panditId = req.pandit.id;
    const patch = Object.fromEntries(
      Object.entries(req.body).filter(([k, v]) => FIELDS.includes(k) && v !== undefined)
    );
    if (!Object.keys(patch).length) return fail(res, "Nothing to update");

    let b = await db.BrandingProfile.findOne({ where: { pandit_id: panditId } });
    const before = b ? b.toJSON() : null;

    // Quarter window rolls forward lazily.
    if (b) {
      const q = b.quarter_started_at;
      const stale = !q || Date.now() - new Date(q).getTime() > 90 * 864e5;
      if (stale) await b.update({ changes_this_quarter: 0, quarter_started_at: new Date() });

      const touchesIdentity = IDENTITY_FIELDS.some(
        (f) => patch[f] !== undefined && patch[f] !== b[f]
      );
      if (touchesIdentity && b.changes_this_quarter >= MAX_CHANGES_PER_QUARTER) {
        return fail(res, "Branding can be changed twice per quarter. Contact support if you need another change.", 429);
      }
      await b.update({ ...patch, ...(touchesIdentity && { changes_this_quarter: b.changes_this_quarter + 1 }) });
    } else {
      b = await db.BrandingProfile.create({
        pandit_id: panditId, ...patch, quarter_started_at: new Date()
      });
    }

    await db.BrandingChangeLog.create({
      pandit_id: panditId, changed_fields: Object.keys(patch), before, after: b.toJSON(),
      ip: req.ip, ua: req.headers["user-agent"]
    });

    // Trial credits are released on completing the profile, not on signup —
    // free-credit farming needs an activation cost.
    const complete = b.display_name && (b.phone || b.whatsapp) && b.logo_url;
    if (complete && !req.pandit.trial_granted_at) {
      if (Pilot.isOn()) await Pilot.grantFreeReports(req.pandit);
      else {
        await Credits.credit(panditId, config.trialCredits, "trial", { note: "profile completed" });
        await req.pandit.update({ trial_granted_at: new Date() });
      }
    }

    return ok(res, { branding: b, balance: await Credits.getBalance(panditId) });
  }));

  return r;
}
