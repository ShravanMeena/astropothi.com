// Buyer accounts. One row per mobile number, created the first time somebody
// signs in — there is no sign-up step and nothing to fill in.

import db from "../../database/index.js";

export const cleanPhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);

/**
 * Find or create the buyer behind a phone number, and adopt any orders they
 * placed before signing in. Without that adoption, a first purchase made as a
 * guest would never appear on their profile.
 */
export async function upsertByPhone(phone, patch = {}) {
  const clean = cleanPhone(phone);
  const [user] = await db.User.findOrCreate({
    where: { phone: clean },
    defaults: { phone: clean, isd_code: "+91", ...patch }
  });
  // Only fill blanks — never overwrite something the buyer has since edited.
  const fill = {};
  for (const k of ["name", "email"]) if (!user[k] && patch[k]) fill[k] = patch[k];
  if (patch.birth && !user.birth) fill.birth = patch.birth;
  fill.last_seen_at = new Date();
  await user.update(fill);

  await db.Order.update({ user_id: user.id },
    { where: { buyer_phone: clean, user_id: null } });
  return user;
}

/** Record that this account proved ownership of its number. */
export async function markVerified(user) {
  await user.update({ verified_at: new Date() });
  return user;
}

/** What the profile screen shows: the person, plus every order they have made. */
export async function profileOf(user) {
  const orders = await db.Order.findAll({
    where: { user_id: user.id },
    order: [["createdAt", "DESC"]],
    limit: 100
  });
  const reportIds = orders.map((o) => o.report_id).filter(Boolean);
  const reports = reportIds.length
    ? await db.Report.findAll({ where: { id: reportIds } })
    : [];
  const byId = new Map(reports.map((r) => [String(r.id), r]));

  return {
    user: publicUser(user),
    orders: orders.map((o) => {
      const rep = o.report_id ? byId.get(String(o.report_id)) : null;
      return {
        public_id: o.public_id, status: o.status,
        report_type: o.report_type, design: o.design, palette: o.palette,
        language: o.language, amount_paise: o.amount_paise,
        invoice_no: o.invoice_no, created_at: o.createdAt,
        subject_name: o.birth?.name || o.buyer_name || null,
        pdf_url: rep?.pdf_url || null, page_count: rep?.page_count || null,
        pay_url: o.status === "created" ? o.razorpay_link_url : null
      };
    })
  };
}

/** Never leak internal columns to the browser. */
export function publicUser(u) {
  return {
    id: String(u.id), phone: u.phone, name: u.name || "", email: u.email || "",
    birth: u.birth || null, profile: u.profile || {},
    verified: Boolean(u.verified_at),
    created_at: u.createdAt
  };
}

// The optional part of the profile. Free text is capped rather than rejected —
// somebody writing a paragraph about their ishta devta should not hit an error.
const TEXT = (v, n) => (v === undefined || v === null ? undefined : String(v).slice(0, n));
const LIST = (v, n) => (Array.isArray(v) ? v.map((x) => String(x).slice(0, 60)).slice(0, n) : undefined);

export async function updateProfile(user, body) {
  const patch = {};
  const name = TEXT(body.name, 120); if (name !== undefined) patch.name = name;
  const email = TEXT(body.email, 160); if (email !== undefined) patch.email = email;

  const p = { ...(user.profile || {}) };
  const fields = {
    ishta_devta:  TEXT(body.ishta_devta, 60),
    tradition:    TEXT(body.tradition, 60),
    gotra:        TEXT(body.gotra, 60),
    city:         TEXT(body.city, 80),
    languages:    LIST(body.languages, 6),
    interests:    LIST(body.interests, 20),
    practices:    LIST(body.practices, 20),
    looking_for:  TEXT(body.looking_for, 600),
    notes:        TEXT(body.notes, 2000)
  };
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) p[k] = v;
  patch.profile = p;

  await user.update(patch);
  return publicUser(user);
}
