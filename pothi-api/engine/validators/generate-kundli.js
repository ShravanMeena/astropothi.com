import { z } from "zod";

// Languages with an AI-generated narrative path (Claude is asked to respond
// in this language). Codes follow ISO 639-1.
export const SUPPORTED_LANGUAGES = ["en", "hi", "gu", "mr", "bn", "ta", "te", "kn"];

export const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
  mr: "Marathi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada"
};

export const generateKundliSchema = z.object({
  fullName: z.string().min(2).max(120),
  // Optional so existing clients keep working. Used for pronouns in the AI
  // narrative, Manglik dosha severity, and match-making partner roles.
  gender: z.enum(["male", "female", "other"]).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  birthPlace: z.string().min(2).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(3).max(60),
  // Pass any of: en, hi, gu, mr, bn, ta, te, kn. Defaults to English.
  // For non-English: Claude is asked to respond in that language for the
  // kundli narrative; the dosha endpoint runs a translation pass over its
  // human-readable text fields on the way out.
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
  // Optional email — when present, the completed PDF is mailed to this
  // address with the report attached. Falls back to the signed-in user's
  // email when set on the server side.
  email: z.string().trim().toLowerCase().email().max(255).optional()
});

// v1 adds an `output_type` toggle on top of the baseline birth fields.
// - "pdf"  (default): kicks off async generation + S3 upload, returns { jobId, pollUrl, ... }
// - "json": returns the full kundli data synchronously in the response body
export const v1GenerateKundliSchema = generateKundliSchema.extend({
  output_type: z.enum(["json", "pdf"]).optional().default("pdf")
});

// ─── Partner schema ───────────────────────────────────────────────────────
//
// Flat partner-friendly request shape used by white-label integrators. Every
// field except the absolute minimum (name + birth date/time + lat/lon) is
// optional — branding fields fall back to DEFAULT_BRANDING when not given.
//
// Date/time arrive as numeric components (day, month, year, hour, min) and
// are normalised to the internal YYYY-MM-DD / HH:MM strings the rest of the
// pipeline expects. tzone (float hours, e.g. 5.5 for IST) is recorded but
// the actual IANA timezone is resolved from lat/lon via tz-lookup so we
// always get a precise olson zone regardless of partner input.
export const v1PartnerKundliSchema = z.object({
  // identity
  source:       z.string().min(1).max(120).optional(),
  name:         z.string().min(2).max(120),
  gender:       z.enum(["male", "female", "other"]).optional(),

  // birth date/time (numeric components)
  day:          z.number().int().min(1).max(31),
  month:        z.number().int().min(1).max(12),
  year:         z.number().int().min(1900).max(2100),
  hour:         z.number().int().min(0).max(23),
  min:          z.number().int().min(0).max(59),

  // birth place
  lat:          z.number().min(-90).max(90),
  lon:          z.number().min(-180).max(180),
  tzone:        z.number().min(-12).max(14).optional(),
  place:        z.string().min(2).max(200).optional(),

  // narrative & output
  language:     z.enum(SUPPORTED_LANGUAGES).optional().default("en"),
  output_type:  z.enum(["json", "pdf"]).optional().default("pdf"),

  // branding (all optional — DEFAULT_BRANDING fills the gaps)
  chart_style:      z.enum(["NORTH_INDIAN", "SOUTH_INDIAN"]).optional(),
  footer_link:      z.string().max(120).optional(),
  logo_url:         z.string().url().max(2048).optional(),
  company_name:     z.string().max(120).optional(),
  company_info:     z.string().max(200).optional(),
  domain_url:       z.string().url().max(2048).optional(),
  company_email:    z.string().email().max(255).optional(),
  company_landline: z.string().max(40).optional(),
  company_mobile:   z.string().max(40).optional()
});
