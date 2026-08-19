// The product catalogue. Code, not DB rows — it changes with deploys, not at runtime.

// Credit weighting protects margin: a 64-chapter book must not cost the same as a 12-page one.
export const REPORT_TYPES = [
  { code: "kundli",     name_en: "Premium Kundali",       name_hi: "प्रीमियम कुंडली",      chapters: 64, credits: 5, engine: "kundli",     ready: true  },
  { code: "dosh",       name_en: "Kundali Dosh Report",   name_hi: "कुंडली दोष रिपोर्ट",   chapters: 28, credits: 2, engine: "dosh",       ready: true },
  { code: "love",       name_en: "Love & Marriage",       name_hi: "प्रेम कुंडली",         chapters: 24, credits: 2, engine: "love",       ready: true  },
  { code: "health",     name_en: "Health Report",         name_hi: "स्वास्थ्य कुंडली",     chapters: 26, credits: 2, engine: "health",     ready: true  },
  { code: "horoscope",  name_en: "Personalised Horoscope",name_hi: "व्यक्तिगत राशिफल",     chapters: 22, credits: 2, engine: "horoscope",  ready: true },
  { code: "laalkitab",  name_en: "Laal Kitaab Report",    name_hi: "लाल किताब रिपोर्ट",    chapters: 30, credits: 3, engine: "laalkitab",  ready: true },
  { code: "varshaphal", name_en: "Varshaphal (Annual)",   name_hi: "वर्षफल रिपोर्ट",       chapters: 40, credits: 3, engine: "varshaphal", ready: true }
];

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
// GST-inclusive, anchored below every incumbent (Clickastro ₹1,416, AstroSage
// ₹996–1,999, VedicRishi ₹550) while carrying three designs they do not have.
// See docs/08-consumer.md.
export const CONSUMER_PRICES = {
  kundli:     69900,
  laalkitab:  49900,
  varshaphal: 49900,
  dosh:       29900,
  love:       29900,
  health:     29900,
  horoscope:  29900
};

export const consumerCatalogue = () =>
  SELLABLE.map((r) => ({
    code: r.code, name_en: r.name_en, name_hi: r.name_hi,
    chapters: r.chapters, price_paise: CONSUMER_PRICES[r.code] ?? 29900
  }));

export const consumerPrice = (code) => CONSUMER_PRICES[code] ?? null;
