// The product catalogue. Code, not DB rows — it changes with deploys, not at runtime.

// Credit weighting protects margin: a 64-chapter book must not cost the same as a 12-page one.
export const REPORT_TYPES = [
  { code: "kundli",     name_en: "Premium Personalised Kundali", name_hi: "प्रीमियम व्यक्तिगत कुंडली",      chapters: 64, credits: 5, engine: "kundli",     ready: true  },
  { code: "dosh",       name_en: "Kundali Dosh Report",   name_hi: "कुंडली दोष रिपोर्ट",   chapters: 28, credits: 2, engine: "dosh",       ready: true },
  { code: "love",       name_en: "Love & Marriage",       name_hi: "प्रेम कुंडली",         chapters: 15, credits: 2, engine: "love",       ready: true  },
  { code: "health",     name_en: "Health Report",         name_hi: "स्वास्थ्य कुंडली",     chapters: 26, credits: 2, engine: "health",     ready: true  },
  { code: "horoscope",  name_en: "Personalised Horoscope",name_hi: "व्यक्तिगत राशिफल",     chapters: 22, credits: 2, engine: "horoscope",  ready: true },
  { code: "laalkitab",  name_en: "Laal Kitaab Report",    name_hi: "लाल किताब रिपोर्ट",    chapters: 30, credits: 3, engine: "laalkitab",  ready: true },
  { code: "varshaphal", name_en: "Varshaphal (Annual)",   name_hi: "वर्षफल रिपोर्ट",       chapters: 40, credits: 3, engine: "varshaphal", ready: true },
  // Career is the subject the shelf was missing: the Kundali gives work two of
  // its sixty-four chapters, and Varshaphal answers only "this year".
  { code: "career",     name_en: "Career & Livelihood",   name_hi: "कर्म एवं जीविका",      chapters: 28, credits: 3, engine: "career",     ready: true },
  // The only report whose subject is a building rather than a person — it asks
  // for the facing and the room layout, not a birth time.
  { code: "vastu",      name_en: "Vastu Wheel Report",    name_hi: "वास्तु चक्र रिपोर्ट",  chapters: 25, credits: 3, engine: "vastu",      ready: true, subject: "property" },
  // Two people, not one, and no chart at all — a written 30-day question set
  // personalised with both names. Sold to couples and, as often, to whoever is
  // buying them an anniversary present.
  { code: "couples",    name_en: "Couples Challenge",     name_hi: "कपल्स चैलेंज",         chapters: 37, credits: 2, engine: "couples",    ready: true, subject: "couple", design: "keepsake" }
];

/**
 * The colourway each report is *shown* in, so nine books do not look like nine
 * copies of one on a shelf.
 *
 * Server-side because two things need it and they must agree: the storefront
 * asks for this palette when it fetches a cover, and the boot warmer renders
 * that exact variant ahead of time. Kept in the client as well until now, which
 * meant the warmer could warm a variant nobody would ever request.
 */
export const COVER_PALETTE = {
  kundli: "gold", dosh: "slate", love: "saffron", health: "emerald",
  horoscope: "indigo", laalkitab: "crimson", varshaphal: "parchment",
  vastu: "emerald", career: "slate", couples: "kalava"
};
/** What the storefront shows a cover in, unless the reader picks otherwise. */
export const SHOP_DESIGN = "heritage";

// `ready: true` = renderer under review, see OPEN-ITEMS.md #1. Not sellable yet.
export const SELLABLE = REPORT_TYPES.filter((r) => r.ready);

export const getReportType = (code) => REPORT_TYPES.find((r) => r.code === code) || null;

export const PACKS = [
  { code: "trial",    name_en: "Trial",     name_hi: "नि:शुल्क",  price_paise: 0,      credits: 10,    validity_days: 30 },
  { code: "chakhna",  name_en: "Starter",   name_hi: "शुरुआत",    price_paise: 24900,  credits: 40,    validity_days: 365 },
  { code: "standard", name_en: "Standard",  name_hi: "स्टैंडर्ड", price_paise: 236000, credits: 500,   validity_days: 365, highlight: true },
  { code: "purohit",  name_en: "Purohit",   name_hi: "पुरोहित",   price_paise: 885000, credits: 2500,  validity_days: 365 }
];

export const getPack = (code) => PACKS.find((p) => p.code === code) || null;

// ── Consumer pricing ────────────────────────────────────────────────────────
//
// Priced by depth, in three tiers, rather than as eight numbers chosen one at a
// time. The old set had drifted badly out of line: measured against the words a
// buyer actually receives, Kundali cost ₹45 per thousand and Vastu ₹181 — a
// four-fold spread across one shelf, with the biggest book the cheapest per
// page. Tiers make that impossible to repeat: a report is placed in a band, and
// the band carries the price.
//
// GST-inclusive. The flagship stays under every incumbent (Clickastro ₹1,416,
// AstroSage ₹996–1,999, VedicRishi ₹550) while carrying three designs, eight
// report types and an assistant none of them offer. See docs/04-pricing-gtm.md.
export const PRICE_TIERS = {
  // 60+ chapters, 80+ pages. The anchor, and deliberately the best value on the
  // shelf — it is what the other seven are compared against.
  flagship: 99900,
  // A complete reading of a whole subject: ~30–40 chapters, ~40 pages.
  full:     59900,
  // One life area, read closely: ~20–26 chapters, ~15–26 pages.
  focused:  39900,
  // Priced by occasion, not by chapter count. The three tiers above all answer
  // "how much of your life does this read?" — the wrong question for a gift.
  // Nobody comparison-shops an anniversary present, and ₹499 next to a ₹399
  // shelf reads as the considered choice rather than the expensive one.
  keepsake: 49900
};

const TIER_OF = {
  kundli:     "flagship",
  dosh:       "full",
  laalkitab:  "full",
  varshaphal: "full",
  love:       "focused",
  health:     "focused",
  horoscope:  "focused",
  vastu:      "focused",
  // 28 chapters, same as Dosh — a complete reading of one whole subject.
  career:     "full",
  couples:    "keepsake"
};

export const CONSUMER_PRICES = Object.fromEntries(
  REPORT_TYPES.map((r) => [r.code, PRICE_TIERS[TIER_OF[r.code] || "focused"]])
);

export const tierOf = (code) => TIER_OF[code] || "focused";

export const consumerCatalogue = () =>
  SELLABLE.map((r) => ({
    code: r.code, name_en: r.name_en, name_hi: r.name_hi,
    chapters: r.chapters, price_paise: CONSUMER_PRICES[r.code] ?? 29900,
    // "person" (birth details), "property" (facing + room layout) or "couple"
    // (two names). The checkout form branches on this — a Vastu report has no
    // birth moment, and a Couples Challenge has no chart at all.
    subject: r.subject || "person",
    // So the client never has to keep its own copy of this map.
    cover_palette: COVER_PALETTE[r.code] || "gold"
  }));

export const consumerPrice = (code) => CONSUMER_PRICES[code] ?? null;
