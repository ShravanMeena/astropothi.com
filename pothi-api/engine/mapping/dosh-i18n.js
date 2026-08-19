// ─────────────────────────────────────────────────────────────────────────────
// Shared bilingual helpers for the 28-page dosh report.
//
// Everything the report prints is either (a) a value computed by the astrology
// engine or (b) a sentence from a static table in this repo. There is no LLM in
// this path: `t(lang, en, hi)` picks the language-correct template and the
// computed values are interpolated into it, so a Hindi report is Hindi end to
// end — titles, labels and bodies — with no translation step.
// ─────────────────────────────────────────────────────────────────────────────

import { SIGNS } from "../astrology/astro-constants.js";
import { translatePlanet, translateSign, translateNakshatra, translateAny, translateTithi } from "../i18n/astrology-labels.js";

/** Language switch. Any non-Hindi code falls back to English. */
export const norm = (lang) => (String(lang || "en").toLowerCase().slice(0, 2) === "hi" ? "hi" : "en");

/** Pick the language-correct string. Both branches are written by hand. */
export const t = (lang, en, hi) => (norm(lang) === "hi" ? hi : en);

// ── proper nouns ─────────────────────────────────────────────────────────────
export const sg = (sign, lang) => (sign ? translateSign(sign, norm(lang)) || sign : t(lang, "—", "—"));
export const pl = (planet, lang) => (planet ? translatePlanet(planet, norm(lang)) || planet : t(lang, "—", "—"));
export const nk = (nak, lang) => (nak ? translateNakshatra(nak, norm(lang)) || nak : t(lang, "—", "—"));

/** Panchang cells: tithi is a composite string, the rest are plain terms. */
export const tithiLoc = (v, lang) => (v ? translateTithi(v, norm(lang)) || v : t(lang, "—", "—"));
export const termLoc = (v, lang) => (v ? translateAny(v, norm(lang)) || v : t(lang, "—", "—"));

/** A compound ruler label like "Sun-Rahu" / "Jupiter-Rahu" → localized. */
export function plCompound(label, lang) {
  if (!label) return t(lang, "—", "—");
  return String(label)
    .split(/([-\s]+)/)
    .map((part) => (/^[-\s]+$/.test(part) ? part : pl(part, lang)))
    .join("");
}

// ── numbers / ordinals ───────────────────────────────────────────────────────
export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "6th house" / "6वें भाव" */
export const oh = (n, lang) => t(lang, `${ordinal(n)} house`, `${n}वें भाव`);

/** "the 6th" (used for "the Nth from the Moon") / "6वें" */
export const od = (n, lang) => t(lang, ordinal(n), `${n}वें`);

/** "6th house" as a subject, not a locative: "भाव 6" reads better in lists. */
export const hn = (n, lang) => t(lang, `house ${n}`, `भाव ${n}`);

export const deg = (d) => (d == null ? "—" : `${Number(d).toFixed(1)}°`);

// ── lists ────────────────────────────────────────────────────────────────────
export function joinList(items, lang, kind = "and") {
  const list = (items || []).filter(Boolean);
  if (!list.length) return "";
  if (list.length === 1) return String(list[0]);
  const conj = norm(lang) === "hi" ? (kind === "or" ? "या" : "और") : kind === "or" ? "or" : "and";
  return `${list.slice(0, -1).join(", ")} ${conj} ${list[list.length - 1]}`;
}

// ── chart geometry (shared by chapters and sections) ─────────────────────────
export function angularSeparation(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

/** Inclusive house-distance between two signs (1..12). */
export function signDistance(fromSign, toSign) {
  const fi = SIGNS.indexOf(fromSign);
  const ti = SIGNS.indexOf(toSign);
  if (fi < 0 || ti < 0) return 0;
  return ((ti - fi + 12) % 12) + 1;
}

export function signAtOffset(fromSign, offset) {
  const fi = SIGNS.indexOf(fromSign);
  if (fi < 0) return null;
  return SIGNS[(fi + offset - 1 + 12) % 12];
}

/** Inclusive house-distance from one house to another (1..12). */
export const aspectDistance = (fromHouse, toHouse) => ((toHouse - fromHouse + 12) % 12) + 1;

/** Jupiter's 5th/7th/9th aspect onto a house — returns the distance or null. */
export function jupiterAspects(jup, targetHouse) {
  if (!jup || !targetHouse) return null;
  const d = aspectDistance(jup.house, targetHouse);
  return [5, 7, 9].includes(d) ? d : null;
}

export const PLANET_ABBR = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

export const OWN_SIGNS = {
  Sun: ["Leo"], Moon: ["Cancer"], Mars: ["Aries", "Scorpio"],
  Mercury: ["Gemini", "Virgo"], Jupiter: ["Sagittarius", "Pisces"],
  Venus: ["Taurus", "Libra"], Saturn: ["Capricorn", "Aquarius"],
};

export const EXALTATION = {
  Sun: "Aries", Moon: "Taurus", Mars: "Capricorn", Mercury: "Virgo",
  Jupiter: "Cancer", Venus: "Pisces", Saturn: "Libra",
};

export const NATURAL_FRIENDS = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};

/** Weekday name per planet, localized. */
export const WEEKDAY_OF = {
  Sun: { en: "Sunday", hi: "रविवार" },
  Moon: { en: "Monday", hi: "सोमवार" },
  Mars: { en: "Tuesday", hi: "मंगलवार" },
  Mercury: { en: "Wednesday", hi: "बुधवार" },
  Jupiter: { en: "Thursday", hi: "गुरुवार" },
  Venus: { en: "Friday", hi: "शुक्रवार" },
  Saturn: { en: "Saturday", hi: "शनिवार" },
  Rahu: { en: "Saturday", hi: "शनिवार" },
  Ketu: { en: "Tuesday", hi: "मंगलवार" },
};

export const weekdayFor = (planet, lang) => (WEEKDAY_OF[planet] ? WEEKDAY_OF[planet][norm(lang)] : t(lang, "Thursday", "गुरुवार"));

/** Gemstone of a planet, localized — static classical table. */
export const GEMSTONE_OF = {
  Sun: { en: "Ruby (Manik)", hi: "माणिक" },
  Moon: { en: "Pearl (Moti)", hi: "मोती" },
  Mars: { en: "Red Coral (Moonga)", hi: "मूंगा" },
  Mercury: { en: "Emerald (Panna)", hi: "पन्ना" },
  Jupiter: { en: "Yellow Sapphire (Pukhraj)", hi: "पुखराज" },
  Venus: { en: "Diamond (Heera)", hi: "हीरा" },
  Saturn: { en: "Blue Sapphire (Neelam)", hi: "नीलम" },
  Rahu: { en: "Hessonite (Gomed)", hi: "गोमेद" },
  Ketu: { en: "Cat's Eye (Lehsunia)", hi: "लहसुनिया" },
};

export const gemFor = (planet, lang) => (GEMSTONE_OF[planet] ? GEMSTONE_OF[planet][norm(lang)] : null);

/** Beej mantra per planet — static classical table, transliterated for EN. */
export const BEEJ_MANTRA = {
  Sun: { en: "Om Hraam Hreem Hraum Sah Suryaya Namah", hi: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः" },
  Moon: { en: "Om Shraam Shreem Shraum Sah Chandramase Namah", hi: "ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः" },
  Mars: { en: "Om Kram Kreem Kraum Sah Bhaumaya Namah", hi: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः" },
  Mercury: { en: "Om Bram Breem Braum Sah Budhaya Namah", hi: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः" },
  Jupiter: { en: "Om Gram Greem Graum Sah Gurave Namah", hi: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः" },
  Venus: { en: "Om Draam Dreem Draum Sah Shukraya Namah", hi: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः" },
  Saturn: { en: "Om Praam Preem Praum Sah Shanaishcharaya Namah", hi: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः" },
  Rahu: { en: "Om Bhraam Bhreem Bhraum Sah Rahave Namah", hi: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः" },
  Ketu: { en: "Om Sraam Sreem Sraum Sah Ketave Namah", hi: "ॐ स्रां स्रीं स्रौं सः केतवे नमः" },
};

export const mantraFor = (planet, lang) => (BEEJ_MANTRA[planet] ? BEEJ_MANTRA[planet][norm(lang)] : null);

/** Temple / shrine direction per planet — static classical table. */
export const SHRINE_OF = {
  Sun: { en: "a Surya temple at sunrise, or an east-facing Shiva shrine", hi: "सूर्योदय पर सूर्य मंदिर अथवा पूर्वमुखी शिव मंदिर" },
  Moon: { en: "a Shiva temple on Monday, with a raw-milk abhishek", hi: "सोमवार को शिव मंदिर, कच्चे दूध से अभिषेक सहित" },
  Mars: { en: "a Hanuman temple on Tuesday, with sindoor and a chola offering", hi: "मंगलवार को हनुमान मंदिर, सिंदूर और चोला अर्पण सहित" },
  Mercury: { en: "a Vishnu or Ganesha shrine on Wednesday", hi: "बुधवार को विष्णु अथवा गणेश मंदिर" },
  Jupiter: { en: "a Dattatreya or Brihaspati shrine on Thursday", hi: "गुरुवार को दत्तात्रेय अथवा बृहस्पति मंदिर" },
  Venus: { en: "a Lakshmi shrine on Friday", hi: "शुक्रवार को लक्ष्मी मंदिर" },
  Saturn: { en: "a Shani temple on Saturday, with an offering of mustard oil", hi: "शनिवार को शनि मंदिर, सरसों तेल अर्पण सहित" },
  Rahu: { en: "Kalahasti or Trimbakeshwar for the nodal rites", hi: "नाग-दोष हेतु कालहस्ती अथवा त्र्यंबकेश्वर" },
  Ketu: { en: "a Ganesha shrine, and the nodal rites at Kalahasti", hi: "गणेश मंदिर तथा कालहस्ती में केतु-शांति" },
};

export const shrineFor = (planet, lang) => (SHRINE_OF[planet] ? SHRINE_OF[planet][norm(lang)] : null);

/** Life area each dosh touches — static table, both languages. */
export const AFFECTS = {
  mangal_dosh: { en: "Marriage & Relationship", hi: "विवाह और संबंध" },
  kaal_sarp_dosh: { en: "Life Path & Karma", hi: "जीवन-पथ और कर्म" },
  pitru_dosh: { en: "Family & Ancestors", hi: "परिवार और पितृ" },
  nadi_dosh: { en: "Match-making & Progeny", hi: "गुण मिलान और संतान" },
  bhakoot_dosh: { en: "Match-making & Household Harmony", hi: "गुण मिलान और गृहस्थ सामंजस्य" },
  gana_dosh: { en: "Temperament & Compatibility", hi: "स्वभाव और अनुकूलता" },
  kemadruma_dosh: { en: "Emotional Support", hi: "भावनात्मक संबल" },
  grahan_dosh: { en: "Vitality & Clarity", hi: "ओज और स्पष्टता" },
  guru_chandal_dosh: { en: "Wisdom & Beliefs", hi: "विवेक और आस्था" },
  angarak_dosh: { en: "Temper & Safety", hi: "क्रोध और सुरक्षा" },
  shrapit_dosh: { en: "Karmic Burdens", hi: "कार्मिक भार" },
  chandra_dosh: { en: "Mind & Emotional Weather", hi: "मन और भावनात्मक स्थिति" },
  sade_sati: { en: "Discipline & Structure", hi: "अनुशासन और व्यवस्था" },
  shani_dhaiya: { en: "Home, Health & Endurance", hi: "गृह, स्वास्थ्य और सहनशक्ति" },
};

export const affectsFor = (id, lang) => (AFFECTS[id] ? AFFECTS[id][norm(lang)] : t(lang, "General Wellbeing", "सामान्य कल्याण"));

/**
 * The classical formation rule for every chapter — stated once, plainly, so an
 * absent dosh still explains exactly what would have had to be true.
 */
export const FORMATION_RULE = {
  mangal_dosh: {
    en: "Mangal (Manglik) Dosh forms when Mars occupies the 1st, 2nd, 4th, 7th, 8th or 12th house from the ascendant — the houses of self, family, home, marriage, longevity and the bedroom.",
    hi: "मंगल (मांगलिक) दोष तब बनता है जब मंगल लग्न से 1, 2, 4, 7, 8 अथवा 12वें भाव में स्थित हो — ये भाव क्रमशः स्व, कुटुम्ब, गृह, विवाह, आयु और शयन के हैं।",
  },
  kaal_sarp_dosh: {
    en: "Kaal Sarp Dosh forms when all seven classical planets — Sun, Moon, Mars, Mercury, Jupiter, Venus and Saturn — are hemmed within the 180° arc on one side of the Rahu–Ketu axis, with nothing on the other side.",
    hi: "काल सर्प दोष तब बनता है जब सातों ग्रह — सूर्य, चंद्र, मंगल, बुध, गुरु, शुक्र और शनि — राहु–केतु अक्ष के एक ही ओर 180° के अर्धवृत्त में आ जाएँ और दूसरी ओर कोई ग्रह न बचे।",
  },
  pitru_dosh: {
    en: "Pitru Dosh forms when the Sun (the karaka of father and lineage) is conjoined by Rahu, Ketu or Saturn, or when the 9th house of ancestors is occupied by one of those three.",
    hi: "पितृ दोष तब बनता है जब सूर्य (पिता एवं वंश का कारक) राहु, केतु अथवा शनि से युत हो, अथवा पितरों का नवम भाव इन्हीं तीन में से किसी से घिरा हो।",
  },
  nadi_dosh: {
    en: "Nadi Dosh is a two-chart rule of Ashtakoot matching: it forms only when both partners' Moons fall in nakshatras of the SAME Nadi (Aadi, Madhya or Antya). It costs 8 of the 36 Guna points.",
    hi: "नाड़ी दोष अष्टकूट मिलान का दो-कुंडली नियम है: यह तभी बनता है जब दोनों जातकों का चंद्रमा एक ही नाड़ी (आदि, मध्य अथवा अंत्य) के नक्षत्रों में हो। इसके 36 में से 8 गुण जाते हैं।",
  },
  bhakoot_dosh: {
    en: "Bhakoot Dosh is a two-chart rule: it forms when the two partners' Moon signs stand 6–8, 9–5 or 2–12 from each other. It costs 7 of the 36 Guna points.",
    hi: "भकूट दोष दो-कुंडली नियम है: यह तब बनता है जब दोनों जातकों की चंद्र-राशियाँ परस्पर 6–8, 9–5 अथवा 2–12 की स्थिति में हों। इसके 36 में से 7 गुण जाते हैं।",
  },
  gana_dosh: {
    en: "Gana Dosh is a two-chart rule comparing temperament groups drawn from the birth nakshatra — Deva, Manushya and Rakshasa. It forms when a Rakshasa Gana partner is matched with a Deva or Manushya Gana partner.",
    hi: "गण दोष दो-कुंडली नियम है जो जन्म-नक्षत्र से निकले स्वभाव-वर्गों — देव, मनुष्य और राक्षस — की तुलना करता है। यह तब बनता है जब राक्षस गण का जातक देव अथवा मनुष्य गण के जातक से मिलाया जाए।",
  },
  kemadruma_dosh: {
    en: "Kemadruma Dosh forms when no planet other than the Sun and the nodes occupies the 2nd or the 12th house from the Moon, and no planet sits with the Moon — an unsupported, isolated Moon.",
    hi: "केमद्रुम दोष तब बनता है जब चंद्रमा से दूसरे और बारहवें भाव में सूर्य तथा राहु-केतु के अतिरिक्त कोई ग्रह न हो, और चंद्रमा के साथ भी कोई ग्रह न बैठा हो — अर्थात् चंद्रमा निराश्रित हो।",
  },
  grahan_dosh: {
    en: "Grahan (eclipse) Dosh forms when the Sun or the Moon is closely conjoined — within about 10° — by Rahu or Ketu, reproducing an eclipse condition in the birth chart.",
    hi: "ग्रहण दोष तब बनता है जब सूर्य अथवा चंद्रमा राहु या केतु से लगभग 10° के भीतर युत हो — जन्म-कुंडली में ग्रहण की स्थिति बन जाती है।",
  },
  guru_chandal_dosh: {
    en: "Guru Chandal Dosh forms when Jupiter, the planet of wisdom and dharma, is conjoined with Rahu or Ketu within about 15°.",
    hi: "गुरु चांडाल दोष तब बनता है जब विवेक और धर्म का ग्रह गुरु, राहु अथवा केतु से लगभग 15° के भीतर युत हो।",
  },
  angarak_dosh: {
    en: "Angarak Dosh forms when Mars and Rahu are conjoined within about 12° — the heat of Mars amplified by the restlessness of Rahu.",
    hi: "अंगारक दोष तब बनता है जब मंगल और राहु लगभग 12° के भीतर युत हों — मंगल की उष्णता राहु की बेचैनी से बढ़ जाती है।",
  },
  shrapit_dosh: {
    en: "Shrapit Dosh forms when Saturn and Rahu are conjoined within about 12° — classically read as a carried-forward karmic debt.",
    hi: "श्रापित दोष तब बनता है जब शनि और राहु लगभग 12° के भीतर युत हों — शास्त्र इसे पूर्वजन्म से चला आया कार्मिक ऋण मानते हैं।",
  },
  chandra_dosh: {
    en: "Chandra Dosh forms when the Moon is afflicted: conjoined with Saturn (Vish yoga), closely conjoined with Rahu or Ketu, or a waning (Kshina) Moon placed in the 6th, 8th or 12th house.",
    hi: "चंद्र दोष तब बनता है जब चंद्रमा पीड़ित हो: शनि से युत (विष योग), राहु अथवा केतु से निकट युत, या क्षीण चंद्रमा 6, 8 या 12वें भाव में स्थित हो।",
  },
  sade_sati: {
    en: "Sade Sati runs when transiting Saturn occupies the 12th, the 1st or the 2nd sign from the natal Moon — a continuous passage of roughly seven and a half years.",
    hi: "साढ़े साती तब चलती है जब गोचर का शनि जन्म-चंद्र से 12वीं, 1वीं अथवा 2वीं राशि में हो — लगभग साढ़े सात वर्ष की सतत यात्रा।",
  },
  shani_dhaiya: {
    en: "Shani Dhaiya (Small Panoti) runs when transiting Saturn occupies the 4th or the 8th sign from the natal Moon — a two-and-a-half-year passage, distinct from Sade Sati.",
    hi: "शनि ढैया (छोटी पनोती) तब चलती है जब गोचर का शनि जन्म-चंद्र से 4थी अथवा 8वीं राशि में हो — ढाई वर्ष की अवधि, जो साढ़े साती से भिन्न है।",
  },
};

export const ruleFor = (id, lang) => (FORMATION_RULE[id] ? FORMATION_RULE[id][norm(lang)] : "");

/** Numerology lucky colour + weekday, localized (values from numerologyFromInput). */
const COLOR_HI = { Gold: "स्वर्ण", Saffron: "केसरिया", "Sky Blue": "आसमानी", White: "श्वेत", Emerald: "पन्ना हरा", Maroon: "गहरा लाल" };
const DAY_HI = { Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार", Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार" };

export const colorLoc = (value, lang) => (!value ? value : norm(lang) === "hi" ? (COLOR_HI[value] || value) : value);
export const dayLoc = (value, lang) => (!value ? value : norm(lang) === "hi" ? (DAY_HI[value] || value) : value);

/** Manglik cancellation labels from analyzeManglikCancellations(), localized. */
export const MANGLIK_CLAUSE_HI = {
  "own-sign": "मंगल स्वराशि में",
  exalted: "मंगल मकर में उच्च का",
  "jupiter-conjunct": "मंगल गुरु से युत",
  "moon-conjunct": "मंगल चंद्र से युत",
  "mercury-conjunct": "मंगल बुध से युत",
  "venus-conjunct": "मंगल शुक्र से युत",
  "jupiter-aspect": "गुरु की दृष्टि मंगल पर",
  "saturn-aspect": "शनि की दृष्टि मंगल पर",
  "7th-friendly-sign": "सप्तम भाव में मंगल अनुकूल राशि में",
  retrograde: "मंगल वक्री",
  "mars-rahu-opposition-warning": "चेतावनी — मंगल राहु के सम्मुख",
};
