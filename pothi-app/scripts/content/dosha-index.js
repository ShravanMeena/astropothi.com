/**
 * Which doshas get a learn page, what their URLs are, and what each page is
 * called in each language.
 *
 * The slug is shared between languages — /learn/manglik-dosha and
 * /hi/learn/manglik-dosha — so the hreflang pair is obvious to a crawler and a
 * shared link does not turn into percent-encoded Devanagari in WhatsApp.
 *
 * Titles are written to match how people actually search rather than how the
 * texts name things: "manglik dosh" gets searched, "kuja dosha" mostly does
 * not, so the common spelling leads and the classical one appears in the body.
 * They are kept under 62 characters so the " | astropothi" suffix still fits in
 * a result snippet — scripts/seo_check.js enforces that.
 */
export const DOSHA_PAGES = [
  { key: "manglik", slug: "manglik-dosha",
    en: { title: "Manglik Dosha: Formation, Effects and Remedies",
          blurb: "Mars in the 1st, 2nd, 4th, 7th, 8th or 12th — how the dosha forms, the ten classical cancellations, and what to do about it." },
    hi: { title: "मांगलिक दोष: कैसे बनता है, प्रभाव और उपाय",
          blurb: "मंगल 1, 2, 4, 7, 8 या 12वें भाव में — दोष कैसे बनता है, दस शास्त्रीय निवारण, और क्या करें।" } },

  { key: "kaal_sarp", slug: "kaal-sarp-dosha",
    en: { title: "Kaal Sarp Dosha: How It Forms and What It Means",
          blurb: "All seven planets hemmed on one side of the Rahu–Ketu axis. What the chart is saying, and the classical remedies." },
    hi: { title: "कालसर्प दोष: कैसे बनता है और इसका अर्थ",
          blurb: "सातों ग्रह राहु-केतु अक्ष के एक ओर। कुंडली क्या कह रही है, और शास्त्रोक्त उपाय।" } },

  { key: "sade_sati", slug: "sade-sati",
    en: { title: "Sade Sati: Saturn's Seven and a Half Years",
          blurb: "What Sade Sati actually is, its three phases, when yours runs, and what the classical texts advise." },
    hi: { title: "साढ़े साती: शनि के साढ़े सात वर्ष",
          blurb: "साढ़े साती वास्तव में क्या है, इसके तीन चरण, कब चलती है, और शास्त्र क्या कहते हैं।" } },

  { key: "pitra_dosha", slug: "pitra-dosha",
    en: { title: "Pitra Dosha: What It Is and How It Is Read",
          blurb: "The ancestral debt in a chart — how it is identified, what it affects, and the remedies the texts prescribe." },
    hi: { title: "पितृ दोष: क्या है और कैसे देखा जाता है",
          blurb: "कुंडली में पितृ ऋण — कैसे पहचाना जाता है, किन क्षेत्रों को प्रभावित करता है, और शास्त्रोक्त उपाय।" } },

  { key: "guru_chandal", slug: "guru-chandal-dosha",
    en: { title: "Guru Chandal Dosha: Jupiter with Rahu or Ketu",
          blurb: "When wisdom meets the nodes. How the conjunction is judged, what it affects, and how it is settled." },
    hi: { title: "गुरु चांडाल दोष: गुरु के साथ राहु या केतु",
          blurb: "जब ज्ञान का ग्रह नोड से मिलता है। युति कैसे आँकी जाती है, क्या प्रभावित होता है, और निवारण।" } },

  { key: "shrapit", slug: "shrapit-dosha",
    en: { title: "Shrapit Dosha: Saturn Conjunct Rahu",
          blurb: "The 'cursed' combination — what it actually indicates in a chart, and the remedies that apply." },
    hi: { title: "श्रापित दोष: शनि-राहु युति",
          blurb: "'श्रापित' योग — कुंडली में यह वास्तव में क्या दर्शाता है, और इसके उपाय।" } },

  { key: "angarak", slug: "angarak-dosha",
    en: { title: "Angarak Dosha: Mars Conjunct Rahu",
          blurb: "Mars and Rahu together — the temper combination. How close the conjunction has to be, and what settles it." },
    hi: { title: "अंगारक दोष: मंगल-राहु युति",
          blurb: "मंगल और राहु साथ — उग्रता का योग। युति कितनी निकट होनी चाहिए, और शमन के उपाय।" } },

  { key: "grahan", slug: "grahan-dosha",
    en: { title: "Grahan Dosha: Sun or Moon with the Nodes",
          blurb: "The eclipse combination in a birth chart — how it is measured, what it touches, and the classical remedies." },
    hi: { title: "ग्रहण दोष: सूर्य या चंद्र के साथ राहु-केतु",
          blurb: "जन्म कुंडली में ग्रहण योग — कैसे मापा जाता है, किसे प्रभावित करता है, और शास्त्रोक्त उपाय।" } },

  { key: "vish_yoga", slug: "vish-yoga",
    en: { title: "Vish Yoga: The Moon with Saturn",
          blurb: "Also called Chandra dosha. What the Moon–Saturn conjunction indicates, and how the texts advise handling it." },
    hi: { title: "विष योग: चंद्रमा के साथ शनि",
          blurb: "जिसे चंद्र दोष भी कहते हैं। चंद्र-शनि युति क्या दर्शाती है, और शास्त्र क्या सुझाते हैं।" } },

  { key: "kemadruma", slug: "kemadruma-dosha",
    en: { title: "Kemadruma Dosha: The Isolated Moon",
          blurb: "No planet on either side of the Moon. What that means for the mind, and what cancels it." },
    hi: { title: "केमद्रुम दोष: एकाकी चंद्रमा",
          blurb: "चंद्रमा के दोनों ओर द्वितीय और द्वादश भाव में कोई ग्रह नहीं। मन और मनोबल पर इसका क्या अर्थ है, और कौन-सी स्थितियाँ इसे निरस्त कर देती हैं।" } },

  { key: "paap_kartari", slug: "paap-kartari-yoga",
    en: { title: "Paap Kartari Yoga: Hemmed Between Malefics",
          blurb: "When a house or planet is scissored between two malefics. How it is judged and what it restricts." },
    hi: { title: "पाप कर्तरी योग: पाप ग्रहों के बीच",
          blurb: "जब कोई भाव या ग्रह दो पाप ग्रहों के बीच फँस जाए। कैसे आँका जाता है और क्या रोकता है।" } },

  { key: "shakat", slug: "shakat-yoga",
    en: { title: "Shakat Yoga: The Moon and Jupiter in 6-8",
          blurb: "The cart-wheel yoga — what the 6-8 relationship between Moon and Jupiter indicates, and its limits." },
    hi: { title: "शकट योग: चंद्र और गुरु 6-8 में",
          blurb: "शकट योग — चंद्र और गुरु का 6-8 सम्बन्ध क्या दर्शाता है, और इसकी सीमाएँ।" } },

  { key: "gandmool", slug: "gandmool-nakshatra",
    en: { title: "Gandmool Nakshatra: Birth in a Junction Star",
          blurb: "The six gandanta nakshatras, why birth in one is flagged, and the shanti the texts prescribe." },
    hi: { title: "गंडमूल नक्षत्र: संधि नक्षत्र में जन्म",
          blurb: "छह गंडांत नक्षत्र, इनमें जन्म क्यों देखा जाता है, और शास्त्रोक्त गंडमूल शांति।" } },

  { key: "daridra", slug: "daridra-yoga",
    en: { title: "Daridra Yoga: What the Texts Actually Say",
          blurb: "A yoga quoted far more often than it is checked. What forms it, what it does not mean, and how it is read." },
    hi: { title: "दरिद्र योग: शास्त्र वास्तव में क्या कहते हैं",
          blurb: "यह योग जितना उद्धृत होता है, उतना जाँचा नहीं जाता। क्या बनाता है, क्या नहीं, और कैसे पढ़ें।" } }
];

/** DOSHA_DETAILS key → the FORMATION_RULE / AFFECTS key for the same dosha. */
export const RULE_KEY = {
  manglik: "mangal_dosh", kaal_sarp: "kaal_sarp_dosh", pitra_dosha: "pitru_dosh",
  kemadruma: "kemadruma_dosh", grahan: "grahan_dosh", guru_chandal: "guru_chandal_dosh",
  angarak: "angarak_dosh", shrapit: "shrapit_dosh", sade_sati: "sade_sati",
  vish_yoga: "chandra_dosh"
};

/**
 * The severity bands from engine/astrology/detect-doshas.js labelForScore().
 * Published because "you have Manglik dosha" is a useless sentence without a
 * strength attached, and no other site shows the scale it is grading on.
 */
export const SEVERITY_BANDS = [
  { min: 75, en: "severe",   hi: "अत्यधिक" },
  { min: 55, en: "high",     hi: "प्रबल" },
  { min: 30, en: "moderate", hi: "मध्यम" },
  { min: 1,  en: "mild",     hi: "अल्प" },
  { min: 0,  en: "none",     hi: "नहीं" }
];
