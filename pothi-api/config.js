import dotenv from "dotenv";
dotenv.config();

const int = (v, d) => (v === undefined || v === "" ? d : Number(v));

export default {
  env: process.env.NODE_ENV || "development",
  port: int(process.env.PORT, 4050),

  db: {
    host: process.env.PG_HOST || "localhost",
    port: int(process.env.PG_PORT, 5432),
    name: process.env.PG_DB || "pothi",
    user: process.env.PG_USER || process.env.USER,
    password: process.env.PG_PASSWORD || undefined
  },

  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  // Dev-only OTP that logs in any phone. MUST be unset in production.
  otpBypass: process.env.NODE_ENV === "production" ? null : process.env.OTP_BYPASS || null,

  // Checkout signs the buyer in on the strength of the mobile number alone, with
  // no OTP. It removes every step between wanting a report and paying for one —
  // and it means anyone who types a number gets that account's history, since
  // the session is issued before payment. Set AUTO_LOGIN_ON_ORDER=false to
  // require the OTP instead; `verified_at` on the user records which happened.
  autoLoginOnOrder: (process.env.AUTO_LOGIN_ON_ORDER ?? "true") !== "false",

  // Where the buyer's browser lives. Razorpay redirects back here after a
  // payment link is paid, so it must be a real origin, not a guess.
  webOrigin: (process.env.WEB_ORIGIN || "http://localhost:5190").replace(/\/+$/, ""),

  // WhatsApp delivery through MSG91. Without an auth key the service runs in
  // dry-run: it builds and logs the exact payload but sends nothing, so the
  // whole path is testable before credentials exist.
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || "",
    integratedNumber: (process.env.MSG91_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
    template: process.env.MSG91_TEMPLATE_REPORT_READY || "booking_confirmation_pothi_reports",
    // WhatsApp matches the template by name AND language; the wrong code is a
    // silent "template not found".
    templateLang: process.env.MSG91_TEMPLATE_LANG || "en",
    namespace: process.env.MSG91_NAMESPACE || null
  },

  razorpay: {
    key: process.env.RAZORPAY_ID,
    secret: process.env.RAZORPAY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  },

  s3: {
    bucket: process.env.S3_BUCKET || "pothi-content",
    region: process.env.S3_REGION || "ap-south-1",
    publicBase: process.env.S3_PUBLIC_BASE || ""
  },

  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,

  // Free credits released on completing the branding profile, not on signup.
  trialCredits: int(process.env.TRIAL_CREDITS, 10),

  // ── Consumer brand ────────────────────────────────────────────────────────
  // The name that goes on a report a consumer buys for themselves. Deliberately
  // configurable and deliberately NOT "Pothi": a pandit who finds his supplier
  // selling to his own client at retail stops being a customer. See
  // docs/08-consumer.md for why the two brands stay apart.
  brand: {
    name: process.env.CONSUMER_BRAND_NAME || "Janampatri",
    tagline: process.env.CONSUMER_BRAND_TAGLINE || "",
    supportPhone: process.env.CONSUMER_SUPPORT_PHONE || "",
    supportEmail: process.env.CONSUMER_SUPPORT_EMAIL || "",
    logoUrl: process.env.CONSUMER_LOGO_URL || ""
  },

  // ── Pilot mode ────────────────────────────────────────────────────────────
  // Invite-only free pilot: the first N pandits get M reports at no cost, and
  // nothing is for sale. Every report costs 1 credit regardless of type, so
  // "10 free reports" is literally true rather than "10 credits, which is two
  // Premium Kundalis". Flip PILOT_MODE=false to restore paid credit packs.
  pilot: {
    on: (process.env.PILOT_MODE ?? "true") !== "false",
    seats: int(process.env.PILOT_SEATS, 10),
    reports: int(process.env.PILOT_REPORTS, 10),
    inviteCode: (process.env.PILOT_INVITE_CODE || "POTHI10").toUpperCase()
  }
};
