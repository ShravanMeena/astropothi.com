// Translates astrological proper nouns (planet names, zodiac signs,
// nakshatras, panchang elements) used as data in the PDF. The English
// strings are the canonical keys — they come back from the local kundli
// computation and feed page-rendering directly.
//
// We translate at the display layer (not the data layer) so that internal
// switches (`case "Sun":`, `data.planets.find(p => p.name === "Mars")`) keep
// working unchanged.

function normalizeLang(lang) {
  const l = (lang ?? "en").toLowerCase().slice(0, 2);
  if (l === "hi" || l === "mr") return l;
  return "en";
}

// ──────────────────────────────────────────────────────────────────────────────
// Planets
// ──────────────────────────────────────────────────────────────────────────────
const PLANETS_HI = {
  Sun:       "सूर्य",
  Moon:      "चंद्र",
  Mars:      "मंगल",
  Mercury:   "बुध",
  Jupiter:   "गुरु",
  Venus:     "शुक्र",
  Saturn:    "शनि",
  Rahu:      "राहु",
  Ketu:      "केतु",
  Ascendant: "लग्न",
};

// ──────────────────────────────────────────────────────────────────────────────
// Zodiac signs
// ──────────────────────────────────────────────────────────────────────────────
const SIGNS_HI = {
  Aries:       "मेष",
  Taurus:      "वृषभ",
  Gemini:      "मिथुन",
  Cancer:      "कर्क",
  Leo:         "सिंह",
  Virgo:       "कन्या",
  Libra:       "तुला",
  Scorpio:     "वृश्चिक",
  Sagittarius: "धनु",
  Capricorn:   "मकर",
  Aquarius:    "कुम्भ",
  Pisces:      "मीन",
};

// ──────────────────────────────────────────────────────────────────────────────
// Nakshatras (27)
// ──────────────────────────────────────────────────────────────────────────────
const NAKSHATRAS_HI = {
  Ashwini:        "अश्विनी",
  Bharani:        "भरणी",
  Krittika:       "कृत्तिका",
  Rohini:         "रोहिणी",
  Mrigashira:     "मृगशिरा",
  Mrigashirsha:   "मृगशिरा",
  Ardra:          "आर्द्रा",
  Punarvasu:      "पुनर्वसु",
  Pushya:         "पुष्य",
  Ashlesha:       "आश्लेषा",
  Magha:          "मघा",
  "Purva Phalguni":   "पूर्व फाल्गुनी",
  "Uttara Phalguni":  "उत्तर फाल्गुनी",
  Hasta:          "हस्त",
  Chitra:         "चित्रा",
  Swati:          "स्वाति",
  Vishakha:       "विशाखा",
  Anuradha:       "अनुराधा",
  Jyeshtha:       "ज्येष्ठा",
  Mula:           "मूल",
  Moola:          "मूल",
  "Purva Ashadha":  "पूर्व आषाढ़ा",
  "Uttara Ashadha": "उत्तर आषाढ़ा",
  Shravana:       "श्रवण",
  Dhanishta:      "धनिष्ठा",
  Shatabhisha:    "शतभिषा",
  "Purva Bhadrapada":  "पूर्व भाद्रपद",
  "Uttara Bhadrapada": "उत्तर भाद्रपद",
  Revati:         "रेवती",
};

// ──────────────────────────────────────────────────────────────────────────────
// Common panchang / astrological terms (Tithi, Yoga, Karana, Varna, Vashya,
// Yoni, Gana, Nadi, Tatva) — short tables; cover the most-frequent values.
// Anything not in the table falls through to the English (already used today).
// ──────────────────────────────────────────────────────────────────────────────
const TERMS_HI = {
  // Varna
  Brahmin:     "ब्राह्मण",
  Kshatriya:   "क्षत्रिय",
  Vaishya:     "वैश्य",
  Shudra:      "शूद्र",

  // Vashya
  Manav:       "मानव",
  Vanchar:     "वनचर",
  Chatushpad:  "चतुष्पद",
  Jalachar:    "जलचर",
  Keet:        "कीट",

  // Yoni
  Horse:       "अश्व",
  Elephant:    "गज",
  Sheep:       "मेष",
  Serpent:     "सर्प",
  Dog:         "श्वान",
  Cat:         "मार्जार",
  Rat:         "मूषक",
  Cow:         "गौ",
  Buffalo:     "महिष",
  Tiger:       "व्याघ्र",
  Deer:        "मृग",
  Monkey:      "वानर",
  Mongoose:    "नकुल",
  Lion:        "सिंह",

  // Gana
  Deva:        "देव",
  Manushya:    "मनुष्य",
  Rakshasa:    "राक्षस",

  // Nadi
  Aadi:        "आदि",
  Madhya:      "मध्य",
  Antya:       "अन्त्य",

  // Tatva
  Fire:        "अग्नि",
  Earth:       "पृथ्वी",
  Air:         "वायु",
  Water:       "जल",
  Ether:       "आकाश",

  // Vashya (extra spellings emitted by VASHYA_MAP)
  Nara:        "मानव",
  Jalchar:     "जलचर",
  Keeta:       "कीट",

  // Paya (metal)
  Gold:        "स्वर्ण",
  Silver:      "चांदी",
  Copper:      "ताम्र",
  Iron:        "लोहा",

  // Weekdays
  Sunday:      "रविवार",
  Monday:      "सोमवार",
  Tuesday:     "मंगलवार",
  Wednesday:   "बुधवार",
  Thursday:    "गुरुवार",
  Friday:      "शुक्रवार",
  Saturday:    "शनिवार",

  // Hindu (lunar) months
  Chaitra:     "चैत्र",
  Vaishakh:    "वैशाख",
  Vaisakha:    "वैशाख",
  Jyeshtha:    "ज्येष्ठ",
  Ashadha:     "आषाढ़",
  Shravan:     "श्रावण",
  Shravana:    "श्रावण",
  Bhadrapada:  "भाद्रपद",
  Ashwin:      "आश्विन",
  Kartik:      "कार्तिक",
  Agrahayan:   "मार्गशीर्ष",
  Margashirsha:"मार्गशीर्ष",
  Paush:       "पौष",
  Magh:        "माघ",
  Phalgun:     "फाल्गुन",

  // Yogas (27)
  Vishkumbha:"विष्कम्भ", Preeti:"प्रीति", Ayushman:"आयुष्मान्", Saubhagya:"सौभाग्य",
  Shobhana:"शोभन", Atiganda:"अतिगण्ड", Sukarma:"सुकर्मा", Dhriti:"धृति", Shoola:"शूल",
  Ganda:"गण्ड", Vriddhi:"वृद्धि", Dhruva:"ध्रुव", Vyaghata:"व्याघात", Harshana:"हर्षण",
  Vajra:"वज्र", Siddhi:"सिद्धि", Vyatipata:"व्यतीपात", Variyana:"वरीयान्", Parigha:"परिघ",
  Shiva:"शिव", Siddha:"सिद्ध", Sadhya:"साध्य", Shubha:"शुभ", Shukla:"शुक्ल", Brahma:"ब्रह्म",
  Indra:"इन्द्र", Vaidhriti:"वैधृति",

  // Karanas (11)
  Bava:"बव", Balava:"बालव", Kaulava:"कौलव", Taitila:"तैतिल", Garaja:"गर", Vanija:"वणिज",
  Vishti:"विष्टि", Shakuni:"शकुनि", Chatushpada:"चतुष्पाद", Naga:"नाग", Kimstughna:"किंस्तुघ्न",

  // Kaal Sarp Dosh types (12)
  Anant:"अनंत", Kulik:"कुलिक", Vasuki:"वासुकि", Shankhpal:"शंखपाल", Padma:"पद्म",
  Mahapadma:"महापद्म", Takshak:"तक्षक", Karkotak:"कर्कोटक", Shankhchoor:"शंखचूड़",
  Ghatak:"घातक", Vishdhar:"विषधर", Sheshnaag:"शेषनाग",

  // Common labels used as data values
  Yes:         "हां",
  No:          "नहीं",
};

// Name-alphabet (नामाक्षर) syllable → Devanagari. Used to render the birth
// syllable from NAME_ALPHABET_TABLE (e.g. "Te" → "ते"). Dental forms used
// throughout (matches AstroNext's rendering).
const NAME_AKSHAR_HI = {
  A:"अ", I:"इ", U:"उ", E:"ए", O:"ओ", Ang:"अं",
  Ka:"क", Ki:"कि", Ku:"कु", Ke:"के", Ko:"को", Kha:"ख", Khi:"खि", Khu:"खु", Khe:"खे", Kho:"खो",
  Ga:"ग", Gi:"गि", Gu:"गु", Ge:"गे", Go:"गो", Gha:"घ",
  Cha:"च", Chi:"चि", Chu:"चु", Che:"चे", Cho:"चो", Chha:"छ",
  Ja:"ज", Ji:"जि", Jha:"झ",
  Ta:"त", Ti:"ति", Tu:"तु", Te:"ते", To:"तो", Tha:"थ",
  Da:"द", Di:"दि", Du:"दु", De:"दे", Do:"दो", Dha:"ध",
  Na:"न", Ni:"नि", Nu:"नु", Ne:"ने", No:"नो",
  Pa:"प", Pi:"पि", Pu:"पु", Pe:"पे", Po:"पो", Pha:"फ",
  Bha:"भ", Bhi:"भि", Bhu:"भु", Bhe:"भे", Bho:"भो",
  Ma:"म", Mi:"मि", Mu:"मु", Me:"मे", Mo:"मो",
  Ya:"य", Yi:"यि", Yu:"यु", Ye:"ये", Yo:"यो",
  Ra:"र", Ri:"रि", Ru:"रु", Re:"रे", Ro:"रो",
  La:"ल", Li:"लि", Lu:"लु", Le:"ले", Lo:"लो",
  Va:"व", Vi:"वि", Vu:"वु", Ve:"वे", Vo:"वो",
  Sha:"श", Sa:"स", Si:"सि", Su:"सु", Se:"से", So:"सो",
  Ha:"ह", Hi:"हि", Hu:"हु", He:"हे", Ho:"हो",
};

export function translateNameAlphabet(value, lang) {
  if (normalizeLang(lang) === "en" || !value) return value ?? "";
  return String(value).split(/[\s,]+/).map(s => NAME_AKSHAR_HI[s] ?? s).join(", ");
}

// Tithi names 1–15 (Purnima/Amavasya special-cased in translateTithi).
const TITHI_NAMES_HI = {
  1: "प्रतिपदा", 2: "द्वितीया", 3: "तृतीया", 4: "चतुर्थी", 5: "पंचमी",
  6: "षष्ठी", 7: "सप्तमी", 8: "अष्टमी", 9: "नवमी", 10: "दशमी",
  11: "एकादशी", 12: "द्वादशी", 13: "त्रयोदशी", 14: "चतुर्दशी", 15: "पूर्णिमा",
};

const PLANETS     = { en: undefined, hi: PLANETS_HI,    mr: PLANETS_HI,    gu: undefined, bn: undefined, ta: undefined, te: undefined, kn: undefined, ml: undefined, pa: undefined };
const SIGNS       = { en: undefined, hi: SIGNS_HI,      mr: SIGNS_HI,      gu: undefined, bn: undefined, ta: undefined, te: undefined, kn: undefined, ml: undefined, pa: undefined };
const NAKSHATRAS  = { en: undefined, hi: NAKSHATRAS_HI, mr: NAKSHATRAS_HI, gu: undefined, bn: undefined, ta: undefined, te: undefined, kn: undefined, ml: undefined, pa: undefined };
const TERMS       = { en: undefined, hi: TERMS_HI,      mr: TERMS_HI,      gu: undefined, bn: undefined, ta: undefined, te: undefined, kn: undefined, ml: undefined, pa: undefined };

function lookup(dict, value) {
  if (!value) return value ?? "";
  if (!dict) return value;
  return dict[value] ?? value;
}

export function translatePlanet(name, lang) {
  return lookup(PLANETS[normalizeLang(lang)], name);
}

export function translateSign(name, lang) {
  return lookup(SIGNS[normalizeLang(lang)], name);
}

export function translateNakshatra(name, lang) {
  return lookup(NAKSHATRAS[normalizeLang(lang)], name);
}

export function translateTerm(value, lang) {
  return lookup(TERMS[normalizeLang(lang)], value);
}

/**
 * Convenience: translate any astrology data value by trying signs → planets
 * → nakshatras → terms in that order. Useful for free-floating cells where
 * we don't know which category the value comes from.
 */
export function translateAny(value, lang) {
  if (!value) return value ?? "";
  const L = normalizeLang(lang);
  return SIGNS[L]?.[value]
      ?? PLANETS[L]?.[value]
      ?? NAKSHATRAS[L]?.[value]
      ?? TERMS[L]?.[value]
      ?? value;
}

/**
 * Translate a composite tithi string like "11 Krishna Paksha" → "कृष्ण एकादशी".
 * Returns the value unchanged for English or unrecognised formats.
 */
export function translateTithi(value, lang) {
  if (normalizeLang(lang) === "en" || !value) return value ?? "";
  const m = String(value).match(/^(\d+)\s+(Shukla|Krishna)\s*Paksha$/i);
  if (!m) return value;
  const num = parseInt(m[1], 10);
  const krishna = /krishna/i.test(m[2]);
  const paksha = krishna ? "कृष्ण" : "शुक्ल";
  let name = TITHI_NAMES_HI[num] || String(num);
  if (num === 15) name = krishna ? "अमावस्या" : "पूर्णिमा";
  return `${paksha} ${name}`;
}
