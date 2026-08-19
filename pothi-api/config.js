import dotenv from "dotenv";
dotenv.config();

const int = (v, d) => (v === undefined || v === "" ? d : Number(v));

// Sign-in asks for an OTP that nothing dispatches yet — no SMS or WhatsApp send
// is wired to /otp/send. In production that means the code is generated, logged
// and goes nowhere: nobody can sign in at all.
//
// OTP_REQUIRED=false is the stopgap until dispatch ships. The code comes back in
// the response, the client fills it in and verifies immediately, so the buyer
// never sees an OTP field — and OTP_BYPASS keeps working.
//
// It is a deliberate hole, not an oversight: anyone who types a number is signed
// in as that number and gets its order history and saved birth details. That is
// the exposure AUTO_LOGIN_ON_ORDER already accepts at checkout. Set it back to
// true the day dispatch lands.
const otpRequired =
  (process.env.OTP_REQUIRED ?? (process.env.NODE_ENV === "production" ? "true" : "false")) !== "false";

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
  // When false, /otp/send returns the code it just generated so the client can
  // complete the sign-in without one being delivered. See the note above.
  otpRequired,
  // An OTP that logs in any phone. Alive only while otpRequired is false, so a
  // production .env that leaves OTP_BYPASS set cannot open a door on its own.
  otpBypass: otpRequired ? null : process.env.OTP_BYPASS || null,

  // Checkout signs the buyer in on the strength of the mobile number alone, with
  // no OTP. It removes every step between wanting a report and paying for one —
  // and it means anyone who types a number gets that account's history, since
  // the session is issued before payment. Set AUTO_LOGIN_ON_ORDER=false to
  // require the OTP instead; `verified_at` on the user records which happened.
  autoLoginOnOrder: (process.env.AUTO_LOGIN_ON_ORDER ?? "true") !== "false",

  // The report assistant. Whichever key is present decides the provider; with
  // neither, the endpoint falls back to quoting the report's own chapters, so
  // the feature degrades instead of disappearing.
  ai: {
    // Bedrock, matching devpunya-node-api-server: same region, same
    // inference-profile ARNs, one AWS account for both products.
    awsRegion: process.env.AWS_REGION || "ap-south-1",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bedrockModelId: process.env.BEDROCK_MODEL_ID || "",
    bedrockFallbackModelId: process.env.BEDROCK_FALLBACK_MODEL_ID || "",

    anthropicKey: process.env.ANTHROPIC_API_KEY || "",
    openaiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.AI_MODEL || "claude-sonnet-4-5",
    timeoutMs: int(process.env.AI_TIMEOUT_MS, 20000),
    // A public endpoint keyed only by an order id, so the spend has to be
    // bounded per order rather than per user.
    maxQuestionsPerOrder: int(process.env.AI_MAX_QUESTIONS, 60),

    // Expand thin chapters at generation time. Facts stay computed; only the
    // explanation around them is written. Off leaves every report exactly as
    // the templates produce it.
    enrichReports: (process.env.AI_ENRICH_REPORTS ?? "true") !== "false",
    // Expanding chapters is a bulk writing job, not a reasoning one. On Opus it
    // took 58s — long enough that a buyer who has just paid is left staring at
    // a spinner. Haiku does it in a fraction of that for a fraction of the cost.
    // The assistant answers in a few sentences from text it is handed — a
    // fast model does that as well as a slow one, and a buyer is waiting.
    chatModelId: process.env.BEDROCK_CHAT_MODEL_ID
      || "global.anthropic.claude-haiku-4-5-20251001-v1:0",
    enrichModelId: process.env.BEDROCK_ENRICH_MODEL_ID
      || "global.anthropic.claude-haiku-4-5-20251001-v1:0"
  },

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
    // Stamped on every payment link so this site's income can be told apart
    // from anything else sharing the Razorpay account. It goes into the
    // reference id, the notes and the description — the three places the
    // dashboard lets you search and export on.
    source: process.env.RAZORPAY_SOURCE_TAG || "POTHI",
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
