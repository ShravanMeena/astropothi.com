// ─────────────────────────────────────────────────────────────────────────────
// The 64-chapter Premium Kundali narrative.
//
// The Premium Kundali (astro_chart_listing id 5) is sold as 64 pages and its
// stored sample lists 64 chapter titles. This module emits exactly those 64
// chapters, in that order, built deterministically from the computed chart.
//
// Rules this file follows:
//   • no LLM, no generic astrology prose — every sentence interpolates values
//     computed by the engine (kundli-facts.js / normalize-kundli-data.js);
//   • proper nouns are translated through the existing i18n tables;
//   • both languages live side by side in `s(en, hi)` so a chapter can never
//     be written in one language and forgotten in the other;
//   • every chart-related chapter carries structured `placements`.
//
//   buildKundliSections(kundliData, language) – Section[64]
//   Section = { id, page, title, subtitle, summary, body[], highlights[],
//               bullets[], advisory, placements? }
// ─────────────────────────────────────────────────────────────────────────────

import { SignLords, DashaYears as DASHA_YEARS } from "../astrology/astro-constants.js";
import { BEEJ_MANTRA } from "../mapping/dosh-i18n.js";
import { localizeDates } from "../i18n/forecast-strings.js";
import { activatingWindows as ACTIVATING } from "../astrology/normalize-kundli-data.js";
import {
  buildChartFacts, dignityOf, dms, horaLordOf, trimsamsaLordOf,
  ABBR, GRAHAS, SEVEN, EXALT, DEBIL, OWN
} from "../astrology/kundli-facts.js";
import {
  translatePlanet, translateSign, translateNakshatra, translateTerm,
  translateTithi, translateNameAlphabet
} from "../i18n/astrology-labels.js";

// ── the 64 chapters, in the order the stored sample defines ──────────────────
const CHAPTERS = [
  ["about",        "About This Report",                  "इस रिपोर्ट के बारे में"],
  ["birth-details","Birth Details & Panchang",           "जन्म विवरण एवं पंचांग"],
  ["birth-chart",  "Your Birth Chart",                   "आपकी जन्म कुंडली"],
  ["core",         "Core Placements",                    "मुख्य ग्रह स्थितियाँ"],
  ["lagna",        "Lagna Reading",                      "लग्न विश्लेषण"],
  ["moon",         "Moon Sign & Nakshatra",              "चंद्र राशि एवं नक्षत्र"],
  ["house-1",      "House 1 — Self & Body",              "भाव 1 — स्वयं एवं शरीर"],
  ["house-2",      "House 2 — Wealth & Speech",          "भाव 2 — धन एवं वाणी"],
  ["house-3",      "House 3 — Siblings & Courage",       "भाव 3 — भाई-बहन एवं साहस"],
  ["house-4",      "House 4 — Home & Mother",            "भाव 4 — घर एवं माता"],
  ["house-5",      "House 5 — Intellect & Children",     "भाव 5 — बुद्धि एवं संतान"],
  ["house-6",      "House 6 — Health & Enemies",         "भाव 6 — रोग एवं शत्रु"],
  ["house-7",      "House 7 — Marriage & Partnership",   "भाव 7 — विवाह एवं साझेदारी"],
  ["house-8",      "House 8 — Longevity & Change",       "भाव 8 — आयु एवं परिवर्तन"],
  ["house-9",      "House 9 — Fortune & Father",         "भाव 9 — भाग्य एवं पिता"],
  ["house-10",     "House 10 — Career & Status",         "भाव 10 — कर्म एवं प्रतिष्ठा"],
  ["house-11",     "House 11 — Gains & Network",         "भाव 11 — लाभ एवं संपर्क"],
  ["house-12",     "House 12 — Loss & Liberation",       "भाव 12 — व्यय एवं मोक्ष"],
  ["planet-Sun",     "Sun — Full Reading",               "सूर्य — विस्तृत विश्लेषण"],
  ["planet-Moon",    "Moon — Full Reading",              "चंद्र — विस्तृत विश्लेषण"],
  ["planet-Mars",    "Mars — Full Reading",              "मंगल — विस्तृत विश्लेषण"],
  ["planet-Mercury", "Mercury — Full Reading",           "बुध — विस्तृत विश्लेषण"],
  ["planet-Jupiter", "Jupiter — Full Reading",           "गुरु — विस्तृत विश्लेषण"],
  ["planet-Venus",   "Venus — Full Reading",             "शुक्र — विस्तृत विश्लेषण"],
  ["planet-Saturn",  "Saturn — Full Reading",            "शनि — विस्तृत विश्लेषण"],
  ["planet-Rahu",    "Rahu — Full Reading",              "राहु — विस्तृत विश्लेषण"],
  ["planet-Ketu",    "Ketu — Full Reading",              "केतु — विस्तृत विश्लेषण"],
  ["shadbala",     "Shadbala — Planetary Strengths",     "षड्बल — ग्रह बल"],
  ["ashtakavarga", "Ashtakavarga — Overview",            "अष्टकवर्ग — सारांश"],
  ["sarvashtakavarga", "Sarvashtakavarga",               "सर्वाष्टकवर्ग"],
  ["d2",  "D2 Hora — Wealth",                            "D2 होरा — धन"],
  ["d3",  "D3 Drekkana — Siblings",                      "D3 द्रेष्काण — भाई-बहन"],
  ["d4",  "D4 Chaturthamsa — Property",                  "D4 चतुर्थांश — संपत्ति"],
  ["d7",  "D7 Saptamsa — Children",                      "D7 सप्तांश — संतान"],
  ["d9",  "D9 Navamsa — Marriage & Dharma",              "D9 नवांश — विवाह एवं धर्म"],
  ["d10", "D10 Dasamsa — Career",                        "D10 दशांश — कर्म"],
  ["d12", "D12 Dwadasamsa — Parents",                    "D12 द्वादशांश — माता-पिता"],
  ["d16", "D16 Shodasamsa — Vehicles & Comfort",         "D16 षोडशांश — वाहन एवं सुख"],
  ["d20", "D20 Vimsamsa — Spiritual Path",               "D20 विंशांश — आध्यात्मिक मार्ग"],
  ["d24", "D24 Chaturvimsamsa — Education",              "D24 चतुर्विंशांश — शिक्षा"],
  ["d27", "D27 Bhamsa — Strengths & Weaknesses",         "D27 भांश — बल एवं दुर्बलता"],
  ["d30", "D30 Trimsamsa — Difficulties",                "D30 त्रिंशांश — कष्ट"],
  ["d40-45-60", "D40, D45, D60 — Fine Detail",           "D40, D45, D60 — सूक्ष्म विवरण"],
  ["raja-yogas",   "Raja Yogas Present",                 "राज योग"],
  ["dhana-yogas",  "Dhana Yogas — Wealth",               "धन योग"],
  ["mahapurusha",  "Pancha Mahapurusha & Arishta Yogas", "पंच महापुरुष एवं अरिष्ट योग"],
  ["doshas",       "Doshas Present",                     "दोष विश्लेषण"],
  ["vimshottari",  "Vimshottari — Full Sequence",        "विंशोत्तरी — पूर्ण क्रम"],
  ["mahadasha",    "Current Mahadasha in Depth",         "वर्तमान महादशा विस्तार से"],
  ["antardasha",   "Antardasha Timeline",                "अंतर्दशा समयरेखा"],
  ["pratyantara",  "Pratyantara — Next 24 Months",       "प्रत्यंतर — अगले 24 महीने"],
  ["transit-saturn",  "Transits — Saturn",               "गोचर — शनि"],
  ["transit-jupiter", "Transits — Jupiter",              "गोचर — गुरु"],
  ["transit-nodes",   "Transits — Rahu & Ketu",          "गोचर — राहु एवं केतु"],
  ["career",     "Career & Profession",                  "करियर एवं व्यवसाय"],
  ["wealth",     "Wealth & Finance",                     "धन एवं वित्त"],
  ["marriage",   "Marriage & Relationships",             "विवाह एवं संबंध"],
  ["children",   "Children & Family",                    "संतान एवं परिवार"],
  ["health",     "Health & Longevity",                   "स्वास्थ्य एवं आयु"],
  ["education",  "Education & Learning",                 "शिक्षा एवं अध्ययन"],
  ["property",   "Property & Vehicles",                  "संपत्ति एवं वाहन"],
  ["spiritual",  "Spiritual Path",                       "आध्यात्मिक मार्ग"],
  ["remedies",   "Remedies",                             "उपाय"],
  ["how-to-use", "How to Use This Report",               "इस रिपोर्ट का उपयोग कैसे करें"]
];

// ── static domain tables (bilingual) ─────────────────────────────────────────
const HOUSE_DOMAIN = {
  1:  ["body, vitality, temperament and life direction", "शरीर, ओज, स्वभाव एवं जीवन की दिशा"],
  2:  ["savings, family, food and speech", "संचय, कुटुंब, भोजन एवं वाणी"],
  3:  ["younger siblings, courage, short travel and effort", "छोटे भाई-बहन, साहस, अल्प यात्रा एवं परिश्रम"],
  4:  ["mother, home, land, vehicles and inner peace", "माता, घर, भूमि, वाहन एवं मानसिक शांति"],
  5:  ["intelligence, children, romance and past merit", "बुद्धि, संतान, प्रेम एवं पूर्व पुण्य"],
  6:  ["illness, debt, competition and daily service", "रोग, ऋण, प्रतिस्पर्धा एवं दैनिक सेवा"],
  7:  ["spouse, partnership, contracts and public dealing", "जीवनसाथी, साझेदारी, अनुबंध एवं जनसंपर्क"],
  8:  ["longevity, sudden change, inheritance and hidden matters", "आयु, आकस्मिक परिवर्तन, उत्तराधिकार एवं गुप्त विषय"],
  9:  ["fortune, father, teachers and long journeys", "भाग्य, पिता, गुरु एवं लंबी यात्रा"],
  10: ["career, status, authority and public role", "कर्म, प्रतिष्ठा, अधिकार एवं सार्वजनिक भूमिका"],
  11: ["income, elder siblings, friends and fulfilled desires", "आय, बड़े भाई-बहन, मित्र एवं इच्छापूर्ति"],
  12: ["expenses, foreign lands, sleep and letting go", "व्यय, विदेश, निद्रा एवं त्याग"]
};

const KARAKA = {
  Sun:     ["soul, father, authority and confidence", "आत्मा, पिता, अधिकार एवं आत्मविश्वास"],
  Moon:    ["mind, mother and emotional comfort", "मन, माता एवं भावनात्मक सुख"],
  Mars:    ["energy, courage, siblings and land", "ऊर्जा, साहस, भाई-बहन एवं भूमि"],
  Mercury: ["speech, analysis, trade and learning", "वाणी, विश्लेषण, व्यापार एवं अध्ययन"],
  Jupiter: ["wisdom, wealth, children and teachers", "ज्ञान, धन, संतान एवं गुरु"],
  Venus:   ["marriage, comfort, art and vehicles", "विवाह, सुख, कला एवं वाहन"],
  Saturn:  ["discipline, delay, labour and longevity", "अनुशासन, विलंब, परिश्रम एवं आयु"],
  Rahu:    ["ambition, foreign matters and amplification", "महत्वाकांक्षा, विदेश एवं वृद्धि"],
  Ketu:    ["detachment, past skill and research", "वैराग्य, पूर्व कौशल एवं शोध"]
};

const DIGNITY = {
  exalted:      ["exalted", "उच्च का"],
  moolatrikona: ["in its moolatrikona", "मूलत्रिकोण में"],
  own:          ["in its own sign", "स्वराशि में"],
  friend:       ["in a friend's sign", "मित्र राशि में"],
  neutral:      ["in a neutral sign", "सम राशि में"],
  enemy:        ["in an enemy's sign", "शत्रु राशि में"],
  debilitated:  ["debilitated", "नीच का"]
};

// Devanagari for Hindi reports: a mantra transliterated into Latin is the one
// thing a Hindi reader cannot actually recite from. The bilingual table already
// exists for the dosh report — reused here rather than kept in two places.

/** Technical calculation labels that arrive in English from the ephemeris. */
const META_HI = {
  "Approx Lahiri": "लाहिड़ी (अनुमानित)", Lahiri: "लाहिड़ी",
  sidereal: "निरयण", tropical: "सायन",
  "Whole Sign": "पूर्ण राशि", Placidus: "प्लासिडस", "Equal House": "समान भाव",
};
const metaHi = (v) => META_HI[String(v || "").trim()] || v;

const MANTRA_OF = (planet, hi) => {
  const m = BEEJ_MANTRA[planet];
  if (!m) return "";
  return hi ? m.hi : m.en;
};
const WEEKDAY = {
  Sun: ["Sunday", "रविवार"], Moon: ["Monday", "सोमवार"], Mars: ["Tuesday", "मंगलवार"],
  Mercury: ["Wednesday", "बुधवार"], Jupiter: ["Thursday", "गुरुवार"], Venus: ["Friday", "शुक्रवार"],
  Saturn: ["Saturday", "शनिवार"], Rahu: ["Saturday", "शनिवार"], Ketu: ["Tuesday", "मंगलवार"]
};
const GEMSTONE = {
  Sun: ["Ruby", "माणिक"], Moon: ["Pearl", "मोती"], Mars: ["Red Coral", "मूंगा"],
  Mercury: ["Emerald", "पन्ना"], Jupiter: ["Yellow Sapphire", "पुखराज"], Venus: ["Diamond", "हीरा"],
  Saturn: ["Blue Sapphire", "नीलम"], Rahu: ["Hessonite", "गोमेद"], Ketu: ["Cat's Eye", "लहसुनिया"]
};

// ── per-run context ──────────────────────────────────────────────────────────
function makeCtx(kundliData, language) {
  const hi = language === "hi";
  const pick = (pair) => (hi ? pair[1] : pair[0]);
  return {
    hi,
    lang: language,
    s: (en, hin) => (hi ? hin : en),
    pl: (n) => translatePlanet(n, language),
    sg: (n) => translateSign(n, language),
    nk: (n) => translateNakshatra(n, language),
    // Engine data values (varna, yoni, gana, yoga, karana, weekday, metal …)
    // go through the shared term table so a Hindi report has no English data.
    tm: (n) => translateTerm(n, language),
    ti: (n) => translateTithi(n, language),
    na: (n) => translateNameAlphabet(n, language),
    pk: (n) => (hi ? (/krishna/i.test(String(n)) ? "कृष्ण पक्ष" : "शुक्ल पक्ष") : n),
    ho: (n) => (hi ? `भाव ${n}` : `house ${n}`),
    dg: (key) => pick(DIGNITY[key] || DIGNITY.neutral),
    domain: (n) => pick(HOUSE_DOMAIN[n]),
    karaka: (n) => pick(KARAKA[n]),
    weekday: (n) => pick(WEEKDAY[n]),
    gem: (n) => pick(GEMSTONE[n]),
    // "a, b and c" in either language
    list: (items) => {
      const a = items.filter(Boolean);
      if (!a.length) return hi ? "कोई नहीं" : "none";
      if (a.length === 1) return a[0];
      return `${a.slice(0, -1).join(", ")} ${hi ? "एवं" : "and"} ${a[a.length - 1]}`;
    },
    none: hi ? "कोई नहीं" : "none"
  };
}

// Assemble one chapter, dropping empty strings so a page never renders a blank.
function mk(index, ctx, part) {
  const [id, titleEn, titleHi] = CHAPTERS[index];
  const out = {
    id,
    page: index + 1,
    title: ctx.hi ? titleHi : titleEn,
    subtitle: part.subtitle,
    summary: part.summary,
    body: (part.body || []).filter((x) => typeof x === "string" && x.trim()),
    highlights: (part.highlights || []).filter((x) => typeof x === "string" && x.trim()),
    bullets: (part.bullets || []).filter((x) => typeof x === "string" && x.trim()),
    advisory: part.advisory
  };
  if (part.placements) out.placements = part.placements;
  return out;
}

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

// "Mars, own sign, in house 7" — the phrase every chapter reuses to state a
// placement in words. Values only; nothing is asserted that is not computed.
function place(c, p) {
  if (!p) return c.none;
  return `${c.pl(p.name)} — ${c.sg(p.sign)} ${dms(p.degree)}, ${c.dg(dignityOf(p))}, ${c.ho(p.house)}`;
}
function shortPlace(c, p) {
  if (!p) return c.none;
  return c.s(`${c.pl(p.name)} in ${c.sg(p.sign)} in house ${p.house}`,
             `${c.pl(p.name)} ${c.sg(p.sign)} में, भाव ${p.house} में`);
}

// ── 1–6 ──────────────────────────────────────────────────────────────────────

function ch1(c, k, f) {
  const sub = k.subject || {};
  const meta = k.calculationMeta || {};
  const doshCount = (k.doshas?.list || []).filter((d) => d.present).length;
  const yogaCount = f.rajaYogas.length + f.dhanaYogas.length + f.mahapurusha.filter((m) => m.present).length;
  const moon = f.P("Moon"); const sun = f.P("Sun");
  return {
    subtitle: c.s("What these 64 chapters cover", "इन 64 अध्यायों में क्या है"),
    summary: c.s(
      `This report is cast for ${sub.fullName}, born ${sub.birthDate} at ${sub.birthTime} in ${sub.birthPlace || "the recorded place"}. Your Lagna is ${c.sg(f.ascSign)}, your Moon is in ${c.sg(moon.sign)} and your Sun is in ${c.sg(sun.sign)}. Everything that follows is read from those positions.`,
      `यह रिपोर्ट ${sub.fullName} के लिए बनाई गई है, जन्म ${sub.birthDate} को ${sub.birthTime} बजे ${sub.birthPlace || "दर्ज स्थान"} में। आपका लग्न ${c.sg(f.ascSign)} है, चंद्र ${c.sg(moon.sign)} में और सूर्य ${c.sg(sun.sign)} में है। आगे का सब कुछ इन्हीं स्थितियों से पढ़ा गया है।`
    ),
    body: [
      c.s(
        `The chart is calculated with the ${meta.ayanamsha} ayanamsa (${dms(meta.ayanamshaDegrees || 0)}) on the ${meta.zodiac} zodiac, using the ${meta.houseSystem} house system. Julian day ${meta.julianDay}. Because whole-sign houses are used, a house and a sign are the same span: ${c.sg(f.ascSign)} is your 1st house, the next sign your 2nd, and so on all the way round.`,
        `कुंडली ${metaHi(meta.ayanamsha)} अयनांश (${dms(meta.ayanamshaDegrees || 0)}) के साथ ${metaHi(meta.zodiac)} पद्धति पर, ${metaHi(meta.houseSystem)} भाव पद्धति से बनाई गई है। जूलियन दिन ${meta.julianDay}। पूर्ण-राशि भाव पद्धति में भाव और राशि एक ही होते हैं: ${c.sg(f.ascSign)} आपका पहला भाव है, अगली राशि दूसरा, और इसी क्रम में आगे।`
      ),
      c.s(
        `Your chart has ${new Set(f.planets.map((p) => p.house)).size} of twelve houses occupied by planets. ${yogaCount} yoga combinations and ${doshCount} classical doshas were found by testing your positions against the classical rules. Your running major period is the ${c.pl(k.dashas.currentMahaDasha)} mahadasha, with ${c.pl(k.dashas.currentAntarDasha)} as the sub-period.`,
        `आपकी कुंडली में बारह में से ${new Set(f.planets.map((p) => p.house)).size} भावों में ग्रह हैं। शास्त्रीय नियमों पर आपकी स्थितियों को परखने पर ${yogaCount} योग और ${doshCount} दोष मिले। आपकी वर्तमान महादशा ${c.pl(k.dashas.currentMahaDasha)} की है, तथा अंतर्दशा ${c.pl(k.dashas.currentAntarDasha)} की।`
      ),
      c.s(
        `Chapters 7 to 18 read each house in turn. Chapters 19 to 27 read each planet. Chapters 28 to 30 measure strength. Chapters 31 to 43 cover the divisional charts. Chapters 44 to 47 list the yogas and doshas actually present. Chapters 48 to 51 lay out your dasha periods with dates, 52 to 54 the current transits, 55 to 62 the eight life areas, and 63 to 64 the remedies and how to use all of it.`,
        `अध्याय 7 से 18 तक प्रत्येक भाव का विश्लेषण है। 19 से 27 तक प्रत्येक ग्रह का। 28 से 30 तक बल का मापन। 31 से 43 तक वर्ग कुंडलियाँ। 44 से 47 तक कुंडली में वास्तव में उपस्थित योग एवं दोष। 48 से 51 तक तिथियों सहित दशाएँ, 52 से 54 तक गोचर, 55 से 62 तक आठ जीवन क्षेत्र, और 63 से 64 तक उपाय एवं उपयोग विधि।`
      )
    ],
    highlights: [
      c.s(`Lagna ${c.sg(f.ascSign)}, ruled by ${c.pl(f.ascLord)}`, `लग्न ${c.sg(f.ascSign)}, स्वामी ${c.pl(f.ascLord)}`),
      c.s(`Moon in ${c.sg(moon.sign)}, nakshatra ${c.nk(moon.nakshatra)} pada ${moon.pada}`, `चंद्र ${c.sg(moon.sign)} में, नक्षत्र ${c.nk(moon.nakshatra)} चरण ${moon.pada}`),
      c.s(`Running period: ${c.pl(k.dashas.currentMahaDasha)}–${c.pl(k.dashas.currentAntarDasha)}`, `वर्तमान दशा: ${c.pl(k.dashas.currentMahaDasha)}–${c.pl(k.dashas.currentAntarDasha)}`)
    ],
    bullets: [
      c.s("Read chapter 5 and 6 first — they set up everything else.", "पहले अध्याय 5 और 6 पढ़ें — बाकी सब उन्हीं पर टिका है।"),
      c.s("Chapters 48 to 51 answer 'when' questions with dates.", "अध्याय 48 से 51 'कब' के प्रश्नों का उत्तर तिथियों सहित देते हैं।"),
      c.s("Chapter 63 lists remedies drawn from your weakest computed placements.", "अध्याय 63 में आपकी सबसे दुर्बल गणित स्थितियों से निकाले गए उपाय हैं।")
    ],
    advisory: c.s(
      "Every statement in this report is derived from the positions above — nothing here is general advice written for everyone.",
      "इस रिपोर्ट का हर कथन ऊपर दी गई स्थितियों से निकला है — यहाँ कुछ भी सामान्य सलाह नहीं है।"
    ),
    placements: f.natalPlacements
  };
}

function ch2(c, k, f) {
  const p = k.panchang || {};
  const a = k.astroDetails || {};
  const meta = k.calculationMeta || {};
  return {
    subtitle: c.s("The sky at the moment of birth", "जन्म के क्षण का आकाश"),
    summary: c.s(
      `You were born on a ${c.tm(p.weekday)}, in ${c.pk(p.paksha)}, on tithi ${c.ti(p.tithi)}, with the Moon in ${c.nk(p.nakshatra)} pada ${p.nakshatraPada}. Sunrise that day was ${p.sunrise} and sunset ${p.sunset}.`,
      `आपका जन्म ${c.tm(p.weekday)} को, ${c.pk(p.paksha)} में, तिथि ${c.ti(p.tithi)} को हुआ, चंद्र ${c.nk(p.nakshatra)} नक्षत्र चरण ${p.nakshatraPada} में था। उस दिन सूर्योदय ${p.sunrise} और सूर्यास्त ${p.sunset} था।`
    ),
    body: [
      c.s(
        `The five limbs of the panchang at your birth: tithi ${c.ti(p.tithi)} (tithi number ${p.tithiNumber}), weekday ${c.tm(p.weekday)}, nakshatra ${c.nk(p.nakshatra)} pada ${p.nakshatraPada}, yoga ${c.tm(p.yoga)}, and karana ${c.tm(p.karana)}. The Moon was ${p.paksha === "Shukla Paksha" ? c.s("waxing", "बढ़ता हुआ") : c.s("waning", "घटता हुआ")} — ${c.pk(p.paksha)}.`,
        `जन्म के समय पंचांग के पाँच अंग: तिथि ${c.ti(p.tithi)} (तिथि संख्या ${p.tithiNumber}), वार ${c.tm(p.weekday)}, नक्षत्र ${c.nk(p.nakshatra)} चरण ${p.nakshatraPada}, योग ${c.tm(p.yoga)}, करण ${c.tm(p.karana)}। चंद्र ${p.paksha === "Shukla Paksha" ? "बढ़ता हुआ" : "घटता हुआ"} था — ${c.pk(p.paksha)}।`
      ),
      c.s(
        `From the Moon's position the classical matching attributes are computed: varna ${c.tm(a.varna)}, vashya ${c.tm(a.vashya)}, yoni ${c.tm(a.yoni)}, gana ${c.tm(a.gan)}, nadi ${c.tm(a.nadi)}, tatva ${c.tm(a.tatva)} and paya ${c.tm(a.paya)}. The name-syllable indicated by ${c.nk(p.nakshatra)} pada ${p.nakshatraPada} is "${c.na(a.nameAlphabet)}". Your Moon sign lord is ${c.pl(a.signLord)} and your nakshatra lord is ${c.pl(a.nakshatraLord)} — that second one is what starts your dasha sequence.`,
        `चंद्र की स्थिति से मेलापक के गुण निकाले जाते हैं: वर्ण ${c.tm(a.varna)}, वश्य ${c.tm(a.vashya)}, योनि ${c.tm(a.yoni)}, गण ${c.tm(a.gan)}, नाड़ी ${c.tm(a.nadi)}, तत्व ${c.tm(a.tatva)} एवं पाया ${c.tm(a.paya)}। ${c.nk(p.nakshatra)} चरण ${p.nakshatraPada} से नामाक्षर "${c.na(a.nameAlphabet)}" निकलता है। चंद्र राशि स्वामी ${c.pl(a.signLord)} है और नक्षत्र स्वामी ${c.pl(a.nakshatraLord)} — दूसरा ही आपकी दशा क्रम का आरंभ करता है।`
      ),
      c.s(
        `The Ascendant was rising at ${dms(k.ascendant.degree)} of ${c.sg(f.ascSign)}, ruled by ${c.pl(f.ascLord)}. Ayanamsa applied: ${dms(meta.ayanamshaDegrees || 0)}. Birth moment in UTC: ${meta.birthUtc}. These are the two numbers that fix every house cusp in the chart, which is why an accurate birth time matters more than any other input.`,
        `जन्म के समय लग्न ${c.sg(f.ascSign)} के ${dms(k.ascendant.degree)} पर उदय हो रहा था, स्वामी ${c.pl(f.ascLord)}। प्रयुक्त अयनांश: ${dms(meta.ayanamshaDegrees || 0)}। UTC में जन्म क्षण: ${meta.birthUtc}। यही दो संख्याएँ कुंडली के सभी भाव निश्चित करती हैं, इसीलिए सही जन्म समय सबसे महत्वपूर्ण है।`
      )
    ],
    highlights: [
      c.s(`Tithi ${c.ti(p.tithi)}, ${c.pk(p.paksha)}`, `तिथि ${c.ti(p.tithi)}, ${c.pk(p.paksha)}`),
      c.s(`Nakshatra ${c.nk(p.nakshatra)} pada ${p.nakshatraPada}, lord ${c.pl(a.nakshatraLord)}`, `नक्षत्र ${c.nk(p.nakshatra)} चरण ${p.nakshatraPada}, स्वामी ${c.pl(a.nakshatraLord)}`),
      c.s(`Lagna ${c.sg(f.ascSign)} at ${dms(k.ascendant.degree)}`, `लग्न ${c.sg(f.ascSign)} ${dms(k.ascendant.degree)} पर`)
    ],
    bullets: [
      c.s(`Your weekday lord is ${c.pl(SignLords[f.ascSign])}'s counterpart — keep ${c.tm(p.weekday)} for beginnings.`, `आरंभ के लिए ${c.tm(p.weekday)} का दिन रखें।`),
      c.s(`Sunrise ${p.sunrise}, sunset ${p.sunset} on your birth day.`, `जन्म दिवस पर सूर्योदय ${p.sunrise}, सूर्यास्त ${p.sunset}।`),
      c.s(`Name-syllable "${c.na(a.nameAlphabet)}" is the traditional starting sound for your given name.`, `परंपरागत नामाक्षर "${c.na(a.nameAlphabet)}" है।`)
    ],
    placements: f.natalPlacements,
    advisory: c.s(
      "If your recorded birth time is off by more than a few minutes, re-check it — the Lagna degree above is what everything else is measured from.",
      "यदि आपका दर्ज जन्म समय कुछ मिनट से अधिक भिन्न है तो उसे पुनः जाँचें — ऊपर दिया लग्न अंश ही सबका आधार है।"
    )
  };
}

function ch3(c, k, f) {
  const occupied = [...new Set(f.planets.map((p) => p.house))].sort((a, b) => a - b);
  const empty = Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => !occupied.includes(h));
  const strongest = f.savRank[0]; const weakest = f.savRank[f.savRank.length - 1];
  const retro = f.planets.filter((p) => p.retrograde && !["Rahu", "Ketu"].includes(p.name)).map((p) => c.pl(p.name));
  return {
    subtitle: c.s("Every planet, sign and house together", "सभी ग्रह, राशि एवं भाव एक साथ"),
    summary: c.s(
      `With ${c.sg(f.ascSign)} rising, your nine planets occupy ${occupied.length} houses. Houses ${empty.join(", ")} hold no planet, which means they are read through their lords instead.`,
      `${c.sg(f.ascSign)} लग्न के साथ आपके नौ ग्रह ${occupied.length} भावों में हैं। भाव ${empty.join(", ")} में कोई ग्रह नहीं, अतः इन्हें उनके स्वामियों से पढ़ा जाता है।`
    ),
    body: [
      c.s(
        `Reading the chart house by house: ${f.houses.map((h) => `${h.house} ${c.sg(h.sign)}${h.occupants.length ? ` (${h.occupants.map((o) => c.pl(o)).join(", ")})` : ""}`).join("; ")}.`,
        `भाव क्रम से कुंडली: ${f.houses.map((h) => `${h.house} ${c.sg(h.sign)}${h.occupants.length ? ` (${h.occupants.map((o) => c.pl(o)).join(", ")})` : ""}`).join("; ")}।`
      ),
      c.s(
        `Each planet with its exact degree: ${f.planets.map((p) => `${c.pl(p.name)} ${dms(p.degree)} ${c.sg(p.sign)}, ${c.ho(p.house)}${p.retrograde && !["Rahu", "Ketu"].includes(p.name) ? ", retrograde" : ""}`).join("; ")}.`,
        `प्रत्येक ग्रह अपने सटीक अंश सहित: ${f.planets.map((p) => `${c.pl(p.name)} ${dms(p.degree)} ${c.sg(p.sign)}, भाव ${p.house}${p.retrograde && !["Rahu", "Ketu"].includes(p.name) ? ", वक्री" : ""}`).join("; ")}।`
      ),
      c.s(
        `By Ashtakavarga bindus — the point-count method that scores each house — house ${strongest.house} is your strongest with ${strongest.score} bindus and house ${weakest.house} the weakest with ${weakest.score}. The whole chart totals ${f.avTotal} bindus. ${retro.length ? `${retro.join(", ")} ${retro.length > 1 ? "are" : "is"} retrograde at birth, which classically strengthens a planet's results while delaying their timing.` : "No planet other than the nodes is retrograde in your chart."}`,
        `अष्टकवर्ग बिंदुओं के अनुसार भाव ${strongest.house} सबसे बलवान है (${strongest.score} बिंदु) और भाव ${weakest.house} सबसे दुर्बल (${weakest.score})। पूरी कुंडली का योग ${f.avTotal} बिंदु है। ${retro.length ? `${retro.join(", ")} जन्म के समय वक्री ${retro.length > 1 ? "हैं" : "है"}, जो फल को बढ़ाता है पर समय में विलंब करता है।` : "राहु-केतु के अतिरिक्त कोई ग्रह वक्री नहीं है।"}`
      )
    ],
    highlights: [
      c.s(`${occupied.length} of 12 houses occupied`, `12 में से ${occupied.length} भावों में ग्रह`),
      c.s(`Strongest house by bindus: ${strongest.house} (${strongest.score})`, `बिंदुओं में सबसे बलवान भाव: ${strongest.house} (${strongest.score})`),
      c.s(`Weakest house by bindus: ${weakest.house} (${weakest.score})`, `बिंदुओं में सबसे दुर्बल भाव: ${weakest.house} (${weakest.score})`)
    ],
    bullets: [
      c.s(`Empty houses (${empty.join(", ")}) are judged from where their lords sit.`, `रिक्त भाव (${empty.join(", ")}) उनके स्वामियों की स्थिति से देखे जाते हैं।`),
      c.s(`House ${strongest.house} matters — ${c.domain(strongest.house)}.`, `भाव ${strongest.house} महत्वपूर्ण है — ${c.domain(strongest.house)}।`),
      c.s(`House ${weakest.house} needs support — ${c.domain(weakest.house)}.`, `भाव ${weakest.house} को सहारा चाहिए — ${c.domain(weakest.house)}।`)
    ],
    advisory: c.s(
      "The diagram on this page is the chart every later chapter refers back to.",
      "इस पृष्ठ का चित्र वही कुंडली है जिसका उल्लेख आगे के सभी अध्याय करते हैं।"
    ),
    placements: f.natalPlacements
  };
}

function ch4(c, k, f) {
  const moon = f.P("Moon"); const sun = f.P("Sun"); const lord = f.P(f.ascLord);
  // Chara Atmakaraka — the planet at the highest degree within its sign.
  const ak = [...f.planets.filter((p) => p.name !== "Ketu")].sort((a, b) => b.degree - a.degree)[0];
  return {
    subtitle: c.s("Lagna, Moon, Sun and chart ruler", "लग्न, चंद्र, सूर्य एवं कुंडली स्वामी"),
    summary: c.s(
      `Three points carry most of the weight: your Lagna ${c.sg(f.ascSign)}, your Moon in ${c.sg(moon.sign)} (${c.ho(moon.house)}) and your Sun in ${c.sg(sun.sign)} (${c.ho(sun.house)}). Your chart ruler ${c.pl(f.ascLord)} sits ${c.dg(dignityOf(lord))} in ${c.ho(lord.house)}.`,
      `तीन बिंदु सर्वाधिक महत्वपूर्ण हैं: लग्न ${c.sg(f.ascSign)}, चंद्र ${c.sg(moon.sign)} में (भाव ${moon.house}) और सूर्य ${c.sg(sun.sign)} में (भाव ${sun.house})। कुंडली स्वामी ${c.pl(f.ascLord)} ${c.dg(dignityOf(lord))} भाव ${lord.house} में है।`
    ),
    body: [
      c.s(
        `Your Lagna lord ${c.pl(f.ascLord)} is placed in ${c.sg(lord.sign)} at ${dms(lord.degree)}, ${c.dg(dignityOf(lord))}, in ${c.ho(lord.house)}. It also rules ${f.lordships[f.ascLord].map((h) => c.ho(h)).join(", ")}. Wherever the Lagna lord sits is where your personal effort naturally goes, so ${c.ho(lord.house)} — ${c.domain(lord.house)} — is where your own hand shows most.`,
        `लग्नेश ${c.pl(f.ascLord)} ${c.sg(lord.sign)} में ${dms(lord.degree)} पर, ${c.dg(dignityOf(lord))}, भाव ${lord.house} में है। यह ${f.lordships[f.ascLord].map((h) => `भाव ${h}`).join(", ")} का भी स्वामी है। लग्नेश जहाँ बैठता है वहीं आपका निजी प्रयास लगता है, अतः भाव ${lord.house} — ${c.domain(lord.house)} — में आपका हाथ सबसे अधिक दिखता है।`
      ),
      c.s(
        `The Moon at ${dms(moon.degree)} of ${c.sg(moon.sign)} governs ${c.karaka("Moon")}; it is ${c.dg(dignityOf(moon))} and sits in ${c.ho(moon.house)}, so ${c.domain(moon.house)} is where your mind spends its time. The Sun at ${dms(sun.degree)} of ${c.sg(sun.sign)} is ${c.dg(dignityOf(sun))} in ${c.ho(sun.house)} and rules ${f.lordships.Sun.length ? f.lordships.Sun.map((h) => c.ho(h)).join(", ") : c.none}.`,
        `चंद्र ${c.sg(moon.sign)} के ${dms(moon.degree)} पर ${c.karaka("Moon")} का कारक है; यह ${c.dg(dignityOf(moon))} भाव ${moon.house} में है, अतः ${c.domain(moon.house)} में आपका मन लगा रहता है। सूर्य ${c.sg(sun.sign)} के ${dms(sun.degree)} पर ${c.dg(dignityOf(sun))} भाव ${sun.house} में है और ${f.lordships.Sun.length ? f.lordships.Sun.map((h) => `भाव ${h}`).join(", ") : "किसी भाव"} का स्वामी है।`
      ),
      c.s(
        `By the Jaimini rule of highest degree, your Atmakaraka — the planet that carries the chart's main lesson — is ${c.pl(ak.name)} at ${dms(ak.degree)} of ${c.sg(ak.sign)} in ${c.ho(ak.house)}. That places the theme of ${c.karaka(ak.name)} at the centre of your life story rather than at its edges.`,
        `जैमिनी के उच्चतम अंश नियम से आपका आत्मकारक ${c.pl(ak.name)} है, जो ${c.sg(ak.sign)} के ${dms(ak.degree)} पर भाव ${ak.house} में है। इससे ${c.karaka(ak.name)} का विषय आपके जीवन के केंद्र में आ जाता है।`
      )
    ],
    highlights: [
      c.s(`Lagna lord ${c.pl(f.ascLord)} in ${c.ho(lord.house)}, ${c.dg(dignityOf(lord))}`, `लग्नेश ${c.pl(f.ascLord)} भाव ${lord.house} में, ${c.dg(dignityOf(lord))}`),
      c.s(`Moon in ${c.ho(moon.house)}, Sun in ${c.ho(sun.house)}`, `चंद्र भाव ${moon.house} में, सूर्य भाव ${sun.house} में`),
      c.s(`Atmakaraka ${c.pl(ak.name)} at ${dms(ak.degree)}`, `आत्मकारक ${c.pl(ak.name)} ${dms(ak.degree)} पर`)
    ],
    bullets: [
      c.s(`Strengthen ${c.pl(f.ascLord)} — it carries your body and direction.`, `${c.pl(f.ascLord)} को बल दें — यह आपके शरीर और दिशा का वाहक है।`),
      c.s(`${c.weekday(f.ascLord)} is your Lagna lord's weekday.`, `${c.weekday(f.ascLord)} आपके लग्नेश का दिन है।`),
      c.s(`Matters of ${c.ho(moon.house)} settle your mood faster than anything else.`, `भाव ${moon.house} के विषय आपके मन को सबसे शीघ्र स्थिर करते हैं।`)
    ],
    advisory: c.s(
      `When two chapters seem to disagree, the placement of ${c.pl(f.ascLord)} decides — it is the ruler of the whole chart.`,
      `जब दो अध्याय भिन्न लगें, तब ${c.pl(f.ascLord)} की स्थिति निर्णायक है — वही पूरी कुंडली का स्वामी है।`
    ),
    placements: f.natalPlacements
  };
}

function ch5(c, k, f) {
  const lord = f.P(f.ascLord);
  const occ = f.houses[0].occupants;
  const asp = f.aspectsOnHouse[1] || [];
  const sav = f.savRankOf(1);
  return {
    subtitle: c.s("The rising sign and its ruler", "उदय राशि एवं उसका स्वामी"),
    summary: c.s(
      `${c.sg(f.ascSign)} was rising at ${dms(k.ascendant.degree)} when you were born. Its lord ${c.pl(f.ascLord)} is ${c.dg(dignityOf(lord))} in ${c.ho(lord.house)}, and house 1 carries ${sav ? `${sav.score} bindus (rank ${sav.rank} of 12)` : "no bindu score"}.`,
      `जन्म के समय ${c.sg(f.ascSign)} ${dms(k.ascendant.degree)} पर उदय हो रहा था। इसका स्वामी ${c.pl(f.ascLord)} ${c.dg(dignityOf(lord))} भाव ${lord.house} में है, और भाव 1 में ${sav ? `${sav.score} बिंदु हैं (12 में ${sav.rank} स्थान)` : "बिंदु उपलब्ध नहीं"}।`
    ),
    body: [
      c.s(
        `Your 1st house is ${c.sg(f.ascSign)}, ruled by ${c.pl(f.ascLord)}. ${occ.length ? `It is occupied by ${occ.map((o) => shortPlace(c, f.P(o))).join(", ")}, so those planets colour your body and manner directly.` : "No planet occupies it, so your first house is read entirely through its lord and the planets that aspect it."} ${asp.length ? `It receives the aspect of ${asp.map((a) => c.pl(a)).join(", ")}.` : "No planet aspects it."}`,
        `आपका पहला भाव ${c.sg(f.ascSign)} है, स्वामी ${c.pl(f.ascLord)}। ${occ.length ? `इसमें ${occ.map((o) => shortPlace(c, f.P(o))).join(", ")} स्थित है, अतः ये ग्रह आपके शरीर और स्वभाव को सीधे प्रभावित करते हैं।` : "इसमें कोई ग्रह नहीं, अतः यह भाव पूर्णतः इसके स्वामी और दृष्टि डालने वाले ग्रहों से पढ़ा जाता है।"} ${asp.length ? `इस पर ${asp.map((a) => c.pl(a)).join(", ")} की दृष्टि है।` : "इस पर किसी ग्रह की दृष्टि नहीं है।"}`
      ),
      c.s(
        `${c.pl(f.ascLord)} sits in ${c.sg(lord.sign)} at ${dms(lord.degree)} in ${c.ho(lord.house)} — ${c.domain(lord.house)}. It is in ${c.nk(lord.nakshatra)} pada ${lord.pada}, whose lord is ${c.pl(lord.nakshatraLord)}${lord.retrograde && !["Rahu", "Ketu"].includes(lord.name) ? c.s(", and it is retrograde", ", और यह वक्री है") : ""}. ${f.combust[f.ascLord]?.combust ? c.s(`It is combust — within ${dms(f.combust[f.ascLord].distance)} of the Sun — which weakens its outward expression.`, `यह अस्त है — सूर्य से ${dms(f.combust[f.ascLord].distance)} के भीतर — जिससे इसका बाह्य प्रभाव घटता है।`) : ""}`,
        `${c.pl(f.ascLord)} ${c.sg(lord.sign)} में ${dms(lord.degree)} पर भाव ${lord.house} में है — ${c.domain(lord.house)}। यह ${c.nk(lord.nakshatra)} चरण ${lord.pada} में है, जिसका स्वामी ${c.pl(lord.nakshatraLord)} है${lord.retrograde && !["Rahu", "Ketu"].includes(lord.name) ? ", और यह वक्री है" : ""}। ${f.combust[f.ascLord]?.combust ? `यह अस्त है — सूर्य से ${dms(f.combust[f.ascLord].distance)} के भीतर।` : ""}`
      ),
      c.s(
        `${c.pl(f.ascLord)} also rules ${f.lordships[f.ascLord].map((h) => c.ho(h)).join(" and ")}, which links your health and self-image to ${f.lordships[f.ascLord].map((h) => c.domain(h)).join("; ")}. Its computed strength score is ${f.strength.find((s) => s.planet === f.ascLord)?.score ?? "not scored (node)"} out of 100, placing it ${f.strength.findIndex((s) => s.planet === f.ascLord) + 1 || "—"} of ${f.strength.length} among your planets.`,
        `${c.pl(f.ascLord)} ${f.lordships[f.ascLord].map((h) => `भाव ${h}`).join(" एवं ")} का भी स्वामी है, जिससे आपका स्वास्थ्य और आत्म-छवि ${f.lordships[f.ascLord].map((h) => c.domain(h)).join("; ")} से जुड़ जाते हैं। इसका गणित बल ${f.strength.find((s) => s.planet === f.ascLord)?.score ?? "—"} / 100 है, जो आपके ग्रहों में ${f.strength.findIndex((s) => s.planet === f.ascLord) + 1 || "—"} वें स्थान पर है।`
      )
    ],
    highlights: [
      c.s(`Ascendant ${c.sg(f.ascSign)} ${dms(k.ascendant.degree)}`, `लग्न ${c.sg(f.ascSign)} ${dms(k.ascendant.degree)}`),
      c.s(`Lagna lord ${c.pl(f.ascLord)} in ${c.ho(lord.house)}, ${c.dg(dignityOf(lord))}`, `लग्नेश ${c.pl(f.ascLord)} भाव ${lord.house} में, ${c.dg(dignityOf(lord))}`),
      c.s(`House 1 bindus: ${sav ? sav.score : "—"}`, `भाव 1 के बिंदु: ${sav ? sav.score : "—"}`)
    ],
    bullets: [
      c.s(`Wear or worship on ${c.weekday(f.ascLord)} to support ${c.pl(f.ascLord)}.`, `${c.pl(f.ascLord)} के लिए ${c.weekday(f.ascLord)} को उपासना करें।`),
      c.s(`${c.pl(f.ascLord)}'s stone is ${c.gem(f.ascLord)} — your life stone.`, `${c.pl(f.ascLord)} का रत्न ${c.gem(f.ascLord)} है — आपका जीवन रत्न।`),
      occ.length ? c.s(`Planets in house 1 (${occ.map((o) => c.pl(o)).join(", ")}) act on your body first.`, `भाव 1 के ग्रह (${occ.map((o) => c.pl(o)).join(", ")}) सबसे पहले शरीर पर असर करते हैं।`)
                 : c.s("An empty 1st house is not weak — it simply reports to its lord.", "रिक्त प्रथम भाव दुर्बल नहीं होता — वह अपने स्वामी के अधीन होता है।")
    ],
    advisory: c.s(
      `Anything that strengthens ${c.pl(f.ascLord)} lifts the whole chart, not just house 1.`,
      `जो भी ${c.pl(f.ascLord)} को बल दे, वह पूरी कुंडली को उठाता है, केवल भाव 1 को नहीं।`
    ),
    placements: f.natalPlacements
  };
}

function ch6(c, k, f) {
  const moon = f.P("Moon");
  const a = k.astroDetails || {};
  const my = f.moonYogas;
  const sav = f.savRankOf(moon.house);
  const yogaLine = my.kemadruma
    ? c.s("No planet flanks your Moon in the 2nd or 12th from it — the classical Kemadruma position, which asks you to build your own support rather than inherit it.",
          "आपके चंद्र से द्वितीय या द्वादश में कोई ग्रह नहीं — यह केमद्रुम स्थिति है, जो कहती है कि सहारा स्वयं बनाना होगा।")
    : my.durudhura.length
      ? c.s(`Planets flank your Moon on both sides (${my.durudhura.map((p) => c.pl(p)).join(", ")}) — the Durudhura combination, which gives the mind support from both directions.`,
            `आपके चंद्र के दोनों ओर ग्रह हैं (${my.durudhura.map((p) => c.pl(p)).join(", ")}) — दुरुधरा योग, जो मन को दोनों ओर से सहारा देता है।`)
      : my.sunapha.length
        ? c.s(`${my.sunapha.map((p) => c.pl(p)).join(", ")} sits in the 2nd from your Moon — the Sunapha combination, tied to self-earned resources.`,
              `${my.sunapha.map((p) => c.pl(p)).join(", ")} आपके चंद्र से द्वितीय में है — सुनफा योग, जो स्वअर्जित साधनों से जुड़ा है।`)
        : c.s(`${my.anapha.map((p) => c.pl(p)).join(", ")} sits in the 12th from your Moon — the Anapha combination, tied to health and reputation.`,
              `${my.anapha.map((p) => c.pl(p)).join(", ")} आपके चंद्र से द्वादश में है — अनफा योग, जो स्वास्थ्य एवं प्रतिष्ठा से जुड़ा है।`);
  return {
    subtitle: c.s("Where your mind actually lives", "आपका मन कहाँ रहता है"),
    summary: c.s(
      `Your Moon is at ${dms(moon.degree)} of ${c.sg(moon.sign)}, in ${c.nk(moon.nakshatra)} pada ${moon.pada}, ${c.dg(dignityOf(moon))}, occupying ${c.ho(moon.house)}. The nakshatra lord ${c.pl(moon.nakshatraLord)} is what starts your Vimshottari dasha sequence.`,
      `आपका चंद्र ${c.sg(moon.sign)} के ${dms(moon.degree)} पर, ${c.nk(moon.nakshatra)} चरण ${moon.pada} में, ${c.dg(dignityOf(moon))}, भाव ${moon.house} में है। नक्षत्र स्वामी ${c.pl(moon.nakshatraLord)} ही आपकी विंशोत्तरी दशा आरंभ करता है।`
    ),
    body: [
      c.s(
        `Moon sign ${c.sg(moon.sign)} is ruled by ${c.pl(a.signLord)}, which sits in ${c.ho(f.P(a.signLord).house)} — so your emotional state is tied to ${c.domain(f.P(a.signLord).house)}. The Moon itself occupies ${c.ho(moon.house)}, which carries ${sav ? `${sav.score} bindus (rank ${sav.rank} of 12)` : "no bindu score"}. Planets sharing that house: ${f.houses[moon.house - 1].occupants.filter((o) => o !== "Moon").map((o) => c.pl(o)).join(", ") || c.none}.`,
        `चंद्र राशि ${c.sg(moon.sign)} का स्वामी ${c.pl(a.signLord)} है, जो भाव ${f.P(a.signLord).house} में है — अतः आपकी भावदशा ${c.domain(f.P(a.signLord).house)} से जुड़ी है। चंद्र स्वयं भाव ${moon.house} में है, जिसमें ${sav ? `${sav.score} बिंदु हैं (12 में ${sav.rank} स्थान)` : "बिंदु उपलब्ध नहीं"}। उसी भाव के अन्य ग्रह: ${f.houses[moon.house - 1].occupants.filter((o) => o !== "Moon").map((o) => c.pl(o)).join(", ") || "कोई नहीं"}।`
      ),
      c.s(
        `${c.nk(moon.nakshatra)} pada ${moon.pada} is ruled by ${c.pl(moon.nakshatraLord)}, and that is not a decorative detail: the portion of this nakshatra the Moon had already crossed at your birth decides how much of the ${c.pl(moon.nakshatraLord)} mahadasha you were born into. From the Moon the classical attributes come out as varna ${c.tm(a.varna)}, vashya ${c.tm(a.vashya)}, yoni ${c.tm(a.yoni)}, gana ${c.tm(a.gan)}, nadi ${c.tm(a.nadi)} and paya ${c.tm(a.paya)}.`,
        `${c.nk(moon.nakshatra)} चरण ${moon.pada} का स्वामी ${c.pl(moon.nakshatraLord)} है, और यह केवल विवरण नहीं है: जन्म के समय चंद्र इस नक्षत्र का जितना भाग पार कर चुका था, उसी से तय होता है कि ${c.pl(moon.nakshatraLord)} महादशा का कितना भाग शेष था। चंद्र से ही वर्ण ${c.tm(a.varna)}, वश्य ${c.tm(a.vashya)}, योनि ${c.tm(a.yoni)}, गण ${c.tm(a.gan)}, नाड़ी ${c.tm(a.nadi)} एवं पाया ${c.tm(a.paya)} निकलते हैं।`
      ),
      yogaLine
    ],
    highlights: [
      c.s(`Moon ${c.sg(moon.sign)} ${dms(moon.degree)}, ${c.ho(moon.house)}`, `चंद्र ${c.sg(moon.sign)} ${dms(moon.degree)}, भाव ${moon.house}`),
      c.s(`Nakshatra ${c.nk(moon.nakshatra)} pada ${moon.pada}, lord ${c.pl(moon.nakshatraLord)}`, `नक्षत्र ${c.nk(moon.nakshatra)} चरण ${moon.pada}, स्वामी ${c.pl(moon.nakshatraLord)}`),
      c.s(`Moon dignity: ${c.dg(dignityOf(moon))}`, `चंद्र की स्थिति: ${c.dg(dignityOf(moon))}`)
    ],
    bullets: [
      c.s(`Monday and the ${c.gem("Moon")} relate to your Moon.`, `सोमवार एवं ${c.gem("Moon")} आपके चंद्र से संबंधित हैं।`),
      c.s(`Your emotional reset happens through ${c.domain(moon.house)}.`, `आपके मन की शांति ${c.domain(moon.house)} से आती है।`),
      c.s(`Dasha sequence starts from ${c.pl(moon.nakshatraLord)} — see chapter 48.`, `दशा क्रम ${c.pl(moon.nakshatraLord)} से आरंभ होता है — अध्याय 48 देखें।`)
    ],
    advisory: c.s(
      "In Vedic practice the Moon is read before the Sun — most of this report's timing rests on the position above.",
      "वैदिक पद्धति में चंद्र सूर्य से पहले देखा जाता है — इस रिपोर्ट का अधिकांश समय-निर्धारण उपर्युक्त स्थिति पर टिका है।"
    ),
    placements: f.natalPlacements
  };
}

// ── 7–18: one chapter per house ──────────────────────────────────────────────

function houseChapter(c, k, f, h) {
  const H = f.H(h);
  const lord = f.P(H.lord);
  const occ = H.occupants;
  const asp = (f.aspectsOnHouse[h] || []).filter((a) => !occ.includes(a));
  const sav = f.savRankOf(h);
  const lordDign = lord ? dignityOf(lord) : null;
  const lordRules = lord ? f.lordships[H.lord] : [];
  return {
    subtitle: c.s(`${c.sg(H.sign)}, ruled by ${c.pl(H.lord)}`, `${c.sg(H.sign)}, स्वामी ${c.pl(H.lord)}`),
    summary: c.s(
      `Your ${ORDINAL[h]} house is ${c.sg(H.sign)} and governs ${c.domain(h)}. Its lord ${c.pl(H.lord)} is ${c.dg(lordDign)} in ${c.ho(lord.house)}, and the house holds ${sav ? `${sav.score} bindus, rank ${sav.rank} of 12` : "no bindu score"}.`,
      `आपका ${h}वाँ भाव ${c.sg(H.sign)} है और ${c.domain(h)} का कारक है। इसका स्वामी ${c.pl(H.lord)} ${c.dg(lordDign)} भाव ${lord.house} में है, और भाव में ${sav ? `${sav.score} बिंदु हैं, 12 में ${sav.rank} स्थान` : "बिंदु उपलब्ध नहीं"}।`
    ),
    body: [
      occ.length
        ? c.s(`${occ.length === 1 ? "One planet occupies" : `${occ.length} planets occupy`} this house: ${occ.map((o) => place(c, f.P(o))).join("; ")}. An occupied house acts on its own — these planets deliver the results of ${c.domain(h)} directly, without waiting on the lord.`,
              `इस भाव में ${occ.length === 1 ? "एक ग्रह है" : `${occ.length} ग्रह हैं`}: ${occ.map((o) => place(c, f.P(o))).join("; ")}। ग्रहयुक्त भाव स्वयं फल देता है — ये ग्रह ${c.domain(h)} के फल स्वामी की प्रतीक्षा किए बिना देते हैं।`)
        : c.s(`No planet occupies your ${ORDINAL[h]} house, so it is judged entirely from its lord ${c.pl(H.lord)} and from what aspects it. An empty house is not a weak house — house ${h} simply reports its results through ${c.ho(lord.house)}, where ${c.pl(H.lord)} actually sits.`,
              `आपके ${h}वें भाव में कोई ग्रह नहीं, अतः इसका फल पूर्णतः इसके स्वामी ${c.pl(H.lord)} और दृष्टियों से देखा जाता है। रिक्त भाव दुर्बल नहीं होता — भाव ${h} अपना फल भाव ${lord.house} से देता है, जहाँ ${c.pl(H.lord)} स्थित है।`),
      c.s(
        `${c.pl(H.lord)} is in ${c.sg(lord.sign)} at ${dms(lord.degree)}, ${c.dg(lordDign)}, in ${c.ho(lord.house)}${lord.retrograde && !["Rahu", "Ketu"].includes(lord.name) ? ", retrograde" : ""}. It also rules ${lordRules.filter((x) => x !== h).length ? lordRules.filter((x) => x !== h).map((x) => c.ho(x)).join(" and ") : c.s("no other house", "कोई अन्य भाव नहीं")}. ${lord.house === h
          ? `Because the lord sits in the house it rules, your ${ORDINAL[h]} house is self-contained — ${c.domain(h)} depends on you rather than on another part of the chart.`
          : `That places the affairs of your ${ORDINAL[h]} house — ${c.domain(h)} — inside the affairs of ${c.ho(lord.house)}: ${c.domain(lord.house)}.`}`,
        `${c.pl(H.lord)} ${c.sg(lord.sign)} में ${dms(lord.degree)} पर, ${c.dg(lordDign)}, भाव ${lord.house} में है${lord.retrograde && !["Rahu", "Ketu"].includes(lord.name) ? ", वक्री" : ""}। यह ${lordRules.filter((x) => x !== h).length ? lordRules.filter((x) => x !== h).map((x) => `भाव ${x}`).join(" एवं ") : "अन्य कोई भाव नहीं"} का भी स्वामी है। ${lord.house === h
          ? `स्वामी अपने ही भाव में है, अतः आपका ${h}वाँ भाव स्वावलंबी है — ${c.domain(h)} कुंडली के किसी अन्य भाग पर नहीं, आप पर निर्भर है।`
          : `इससे आपके ${h}वें भाव के विषय — ${c.domain(h)} — भाव ${lord.house} के विषयों से जुड़ जाते हैं: ${c.domain(lord.house)}।`}`
      ),
      c.s(
        `${asp.length ? `${asp.map((a) => c.pl(a)).join(", ")} ${asp.length > 1 ? "cast their aspects" : "casts its aspect"} on this house, so ${asp.map((a) => c.karaka(a)).join("; ")} colour its results.` : "No planet aspects this house from elsewhere, so its results come mainly from its lord."} On bindus it scores ${sav ? sav.score : "—"}, which is ${sav && sav.score >= 30 ? c.s("above the 28-bindu average — a supported house", "28 के औसत से ऊपर — सहारा प्राप्त भाव") : sav && sav.score >= 25 ? c.s("close to the 28-bindu average", "28 के औसत के निकट") : c.s("below the 28-bindu average — this area needs conscious effort", "28 के औसत से नीचे — इस क्षेत्र में सजग प्रयास चाहिए")}.`,
        `${asp.length ? `${asp.map((a) => c.pl(a)).join(", ")} की दृष्टि इस भाव पर है, अतः ${asp.map((a) => c.karaka(a)).join("; ")} इसके फल को रंग देते हैं।` : "बाहर से किसी ग्रह की दृष्टि नहीं, अतः फल मुख्यतः स्वामी से आता है।"} बिंदुओं में यह ${sav ? sav.score : "—"} है, जो ${sav && sav.score >= 30 ? "28 के औसत से ऊपर है — सहारा प्राप्त भाव" : sav && sav.score >= 25 ? "28 के औसत के निकट है" : "28 के औसत से नीचे है — इस क्षेत्र में सजग प्रयास चाहिए"}।`
      )
    ],
    highlights: [
      c.s(`${c.sg(H.sign)} on house ${h}, lord ${c.pl(H.lord)}`, `भाव ${h} पर ${c.sg(H.sign)}, स्वामी ${c.pl(H.lord)}`),
      c.s(`Lord placed in ${c.ho(lord.house)}, ${c.dg(lordDign)}`, `स्वामी भाव ${lord.house} में, ${c.dg(lordDign)}`),
      c.s(`Occupants: ${occ.length ? occ.map((o) => c.pl(o)).join(", ") : c.none} · bindus ${sav ? sav.score : "—"}`, `ग्रह: ${occ.length ? occ.map((o) => c.pl(o)).join(", ") : "कोई नहीं"} · बिंदु ${sav ? sav.score : "—"}`)
    ],
    bullets: [
      c.s(`Track this house during the ${c.pl(H.lord)} dasha periods.`, `${c.pl(H.lord)} की दशा में इस भाव पर ध्यान दें।`),
      c.s(`${c.weekday(H.lord)} is the weekday of this house's lord.`, `${c.weekday(H.lord)} इस भाव के स्वामी का दिन है।`),
      occ.length
        ? c.s(`${c.pl(occ[0])} inside this house is the first thing to strengthen here.`, `इस भाव में स्थित ${c.pl(occ[0])} को सबसे पहले बल दें।`)
        : c.s(`Results arrive through ${c.ho(lord.house)} matters, not directly.`, `फल भाव ${lord.house} के विषयों से आते हैं, सीधे नहीं।`)
    ],
    advisory: c.s(
      `Read this house together with ${c.ho(lord.house)} — in your chart the two are linked by ${c.pl(H.lord)}.`,
      `इस भाव को भाव ${lord.house} के साथ पढ़ें — आपकी कुंडली में दोनों ${c.pl(H.lord)} से जुड़े हैं।`
    ),
    placements: f.natalPlacements
  };
}


// ── 19–27: one chapter per planet ────────────────────────────────────────────

function planetChapter(c, k, f, name) {
  const p = f.P(name);
  const dign = dignityOf(p);
  const rules = f.lordships[name] || [];
  const asp = f.aspectsFrom[name] || [];
  const st = f.strength.find((s) => s.planet === name);
  const rank = f.strength.findIndex((s) => s.planet === name);
  const cb = f.combust[name];
  const node = name === "Rahu" || name === "Ketu";
  const period = f.timeline.find((m) => m.mahaDasha === name);
  const bav = f.bavInOwnSign[name];
  const sav = f.savRankOf(p.house);

  return {
    subtitle: c.s(`${c.sg(p.sign)} ${dms(p.degree)}, ${c.ho(p.house)}`, `${c.sg(p.sign)} ${dms(p.degree)}, भाव ${p.house}`),
    summary: c.s(
      `${c.pl(name)} governs ${c.karaka(name)}. In your chart it is ${c.dg(dign)} at ${dms(p.degree)} of ${c.sg(p.sign)}, in ${c.ho(p.house)}, in ${c.nk(p.nakshatra)} pada ${p.pada}${node ? " (the nodes are always retrograde)" : p.retrograde ? c.s(", retrograde", ", वक्री") : ""}.`,
      `${c.pl(name)} ${c.karaka(name)} का कारक है। आपकी कुंडली में यह ${c.dg(dign)} ${c.sg(p.sign)} के ${dms(p.degree)} पर, भाव ${p.house} में, ${c.nk(p.nakshatra)} चरण ${p.pada} में है${node ? " (छाया ग्रह सदा वक्री रहते हैं)" : p.retrograde ? ", वक्री" : ""}।`
    ),
    body: [
      c.s(
        `${c.pl(name)} sits in ${c.ho(p.house)}, which governs ${c.domain(p.house)}. ${rules.length ? `It rules ${rules.map((h) => c.ho(h)).join(" and ")}, so it carries the results of ${rules.map((h) => c.domain(h)).join("; ")} into that house.` : "As a shadow planet it rules no sign, so it acts through whatever it sits with and whatever aspects it."} Its dispositor — the lord of the sign it occupies — is ${c.pl(SignLords[p.sign])}, placed in ${c.ho(f.P(SignLords[p.sign]).house)}, and a planet can never give more than its dispositor allows.`,
        `${c.pl(name)} भाव ${p.house} में है, जो ${c.domain(p.house)} का कारक है। ${rules.length ? `यह ${rules.map((h) => `भाव ${h}`).join(" एवं ")} का स्वामी है, अतः ${rules.map((h) => c.domain(h)).join("; ")} के फल इसी भाव में लाता है।` : "छाया ग्रह होने से यह किसी राशि का स्वामी नहीं, अतः यह अपने सहचर ग्रहों और दृष्टियों से फल देता है।"} इसका राशि स्वामी ${c.pl(SignLords[p.sign])} है, जो भाव ${f.P(SignLords[p.sign]).house} में है, और कोई ग्रह अपने राशि स्वामी की सीमा से अधिक नहीं दे सकता।`
      ),
      c.s(
        `It aspects ${asp.map((h) => c.ho(h)).join(", ")}${name === "Mars" ? " (Mars adds the 4th and 8th to the standard 7th)" : name === "Jupiter" ? " (Jupiter adds the 5th and 9th)" : name === "Saturn" ? " (Saturn adds the 3rd and 10th)" : ""}. Sharing its house: ${f.houses[p.house - 1].occupants.filter((o) => o !== name).map((o) => c.pl(o)).join(", ") || c.none}. ${cb ? (cb.combust ? c.s(`It is combust — only ${dms(cb.distance)} from the Sun, inside the ${cb.orb}° orb — so its results show late or quietly.`, `यह अस्त है — सूर्य से केवल ${dms(cb.distance)} दूर, ${cb.orb}° की सीमा के भीतर — अतः फल विलंब से या धीरे मिलते हैं।`) : c.s(`It is ${dms(cb.distance)} from the Sun, outside the ${cb.orb}° combustion orb, so it is not burnt.`, `यह सूर्य से ${dms(cb.distance)} दूर है, ${cb.orb}° की अस्त सीमा से बाहर, अतः अस्त नहीं है।`)) : ""}`,
        `यह ${asp.map((h) => `भाव ${h}`).join(", ")} पर दृष्टि डालता है। इसी भाव में साथ: ${f.houses[p.house - 1].occupants.filter((o) => o !== name).map((o) => c.pl(o)).join(", ") || "कोई नहीं"}। ${cb ? (cb.combust ? `यह अस्त है — सूर्य से केवल ${dms(cb.distance)} दूर।` : `यह सूर्य से ${dms(cb.distance)} दूर है, अस्त नहीं।`) : ""}`
      ),
      c.s(
        `${st ? `Its computed strength score is ${st.score} of 100 — rank ${rank + 1} of ${f.strength.length} in your chart — built from dignity (${c.dg(dign)}), directional strength ${st.digBala}, house class ${st.houseClass} and ${bav != null ? `${bav} Ashtakavarga bindus in ${c.sg(p.sign)}` : "no bindu contribution"}.` : "Rahu and Ketu are outside the classical seven-planet strength scheme, so no strength score is computed for them — they are judged by house, dispositor and company instead."} ${period ? c.s(`Its Vimshottari mahadasha runs ${period.start} to ${period.end}.`, `इसकी विंशोत्तरी महादशा ${period.start} से ${period.end} तक चलती है।`) : ""} ${sav ? c.s(`The house it occupies carries ${sav.score} bindus (rank ${sav.rank}).`, `जिस भाव में यह है उसमें ${sav.score} बिंदु हैं (स्थान ${sav.rank})।`) : ""}`,
        `${st ? `इसका गणित बल ${st.score} / 100 है — आपकी कुंडली में ${rank + 1} वाँ स्थान — जो स्थिति (${c.dg(dign)}), दिग्बल ${st.digBala}, भाव वर्ग ${st.houseClass} एवं ${bav != null ? `${c.sg(p.sign)} में ${bav} अष्टकवर्ग बिंदु` : "बिंदु रहित"} से बना है।` : "राहु एवं केतु शास्त्रीय सात-ग्रह बल पद्धति से बाहर हैं, अतः इनका बल अंक नहीं निकाला जाता — इन्हें भाव, राशि स्वामी एवं संगति से देखा जाता है।"} ${period ? `इसकी विंशोत्तरी महादशा ${period.start} से ${period.end} तक है।` : ""} ${sav ? `जिस भाव में यह है उसमें ${sav.score} बिंदु हैं (स्थान ${sav.rank})।` : ""}`
      )
    ],
    highlights: [
      c.s(`${c.pl(name)} ${c.dg(dign)} in ${c.sg(p.sign)}`, `${c.pl(name)} ${c.dg(dign)} ${c.sg(p.sign)} में`),
      c.s(`Placed in ${c.ho(p.house)}, rules ${rules.length ? rules.map((h) => c.ho(h)).join(", ") : c.none}`, `भाव ${p.house} में, स्वामी: ${rules.length ? rules.map((h) => `भाव ${h}`).join(", ") : "कोई नहीं"}`),
      st ? c.s(`Strength ${st.score}/100 (rank ${rank + 1})`, `बल ${st.score}/100 (स्थान ${rank + 1})`)
         : c.s("Shadow planet — no classical strength score", "छाया ग्रह — शास्त्रीय बल अंक नहीं")
    ],
    bullets: [
      c.s(`Mantra: ${MANTRA_OF(name, false)}`, `मंत्र: ${MANTRA_OF(name, true)}`),
      c.s(`Weekday ${c.weekday(name)}; stone ${c.gem(name)}.`, `दिन ${c.weekday(name)}; रत्न ${c.gem(name)}।`),
      c.s(`Its results reach you through ${c.domain(p.house)}.`, `इसके फल ${c.domain(p.house)} के माध्यम से आते हैं।`)
    ],
    advisory: c.s(
      `${c.pl(name)} is ${c.dg(dign)} here — ${dign === "debilitated" ? "support it before you lean on it" : dign === "exalted" || dign === "own" || dign === "moolatrikona" ? "this is one of the placements you can rely on" : "it works steadily rather than dramatically"}.`,
      `${c.pl(name)} यहाँ ${c.dg(dign)} है — ${dign === "debilitated" ? "इस पर निर्भर होने से पहले इसे बल दें" : dign === "exalted" || dign === "own" || dign === "moolatrikona" ? "यह उन स्थितियों में है जिन पर भरोसा किया जा सकता है" : "यह नाटकीय नहीं, स्थिर रूप से काम करता है"}।`
    ),
    placements: [{ planet: name, abbr: ABBR[name], sign: p.sign, house: p.house, degree: dms(p.degree) }]
  };
}

// ── 28–30: strength and Ashtakavarga ─────────────────────────────────────────

function ch28(c, k, f) {
  const top = f.strength[0]; const bottom = f.strength[f.strength.length - 1];
  const rows = f.strength.map((s) => `${c.pl(s.planet)} ${s.score}`).join(", ");
  return {
    subtitle: c.s("Which planets can actually deliver", "कौन से ग्रह वास्तव में फल दे सकते हैं"),
    summary: c.s(
      `Scored across dignity, direction, house class, motion, natural strength and bindus, your strongest planet is ${c.pl(top.planet)} at ${top.score} of 100 and your weakest is ${c.pl(bottom.planet)} at ${bottom.score}.`,
      `स्थिति, दिशा, भाव वर्ग, गति, नैसर्गिक बल एवं बिंदुओं के आधार पर आपका सबसे बलवान ग्रह ${c.pl(top.planet)} है (${top.score}/100) और सबसे दुर्बल ${c.pl(bottom.planet)} (${bottom.score})।`
    ),
    body: [
      c.s(
        `Full ranking out of 100: ${rows}. This is a composite of the strength components this engine computes — sign dignity, directional strength (each planet has one house where it is strongest: the Sun and Mars in the 10th, Jupiter and Mercury in the 1st, the Moon and Venus in the 4th, Saturn in the 7th), the class of house occupied, retrograde motion, natural strength and Ashtakavarga bindus. It is not the classical six-fold Shadbala in virupas, which needs values this engine does not compute; where a component cannot be computed it is left out rather than guessed.`,
        `100 में पूर्ण क्रम: ${rows}। यह उन बल घटकों का संयोजन है जिन्हें यह इंजन गणना करता है — राशि स्थिति, दिग्बल (प्रत्येक ग्रह का एक भाव होता है जहाँ वह सर्वाधिक बली है: सूर्य एवं मंगल दशम में, गुरु एवं बुध लग्न में, चंद्र एवं शुक्र चतुर्थ में, शनि सप्तम में), भाव वर्ग, वक्री गति, नैसर्गिक बल एवं अष्टकवर्ग बिंदु। यह विरूप में पूर्ण षड्बल नहीं है, जिसके लिए आवश्यक मान यह इंजन नहीं निकालता; जो घटक गणनीय नहीं, उसे अनुमान से नहीं भरा गया।`
      ),
      c.s(
        `${c.pl(top.planet)} scores highest because it is ${c.dg(top.dignity)} with directional strength ${top.digBala} and house-class value ${top.houseClass}${top.bindus != null ? `, carrying ${top.bindus} bindus in its sign` : ""}. It rules ${(f.lordships[top.planet] || []).map((h) => c.ho(h)).join(", ") || c.none}, so those areas of life get the benefit of its strength first.`,
        `${c.pl(top.planet)} सर्वोच्च है क्योंकि यह ${c.dg(top.dignity)} है, दिग्बल ${top.digBala} एवं भाव वर्ग ${top.houseClass}${top.bindus != null ? `, अपनी राशि में ${top.bindus} बिंदु` : ""}। यह ${(f.lordships[top.planet] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी है, अतः उन्हीं क्षेत्रों को इसका बल सबसे पहले मिलता है।`
      ),
      c.s(
        `${c.pl(bottom.planet)} is the weakest at ${bottom.score}: ${c.dg(bottom.dignity)}, directional strength ${bottom.digBala}, house class ${bottom.houseClass}${bottom.combust ? c.s(", and combust", ", एवं अस्त") : ""}. It rules ${(f.lordships[bottom.planet] || []).map((h) => c.ho(h)).join(", ") || c.none} — those are the matters that need patience, method and the remedies in chapter 63 rather than force.`,
        `${c.pl(bottom.planet)} सबसे दुर्बल है (${bottom.score}): ${c.dg(bottom.dignity)}, दिग्बल ${bottom.digBala}, भाव वर्ग ${bottom.houseClass}${bottom.combust ? ", एवं अस्त" : ""}। यह ${(f.lordships[bottom.planet] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी है — इन विषयों में बल नहीं, धैर्य, विधि एवं अध्याय 63 के उपाय चाहिए।`
      )
    ],
    highlights: f.strength.slice(0, 3).map((s) => c.s(`${c.pl(s.planet)} ${s.score}/100 — ${c.dg(s.dignity)}`, `${c.pl(s.planet)} ${s.score}/100 — ${c.dg(s.dignity)}`)),
    bullets: [
      c.s(`Lean on ${c.pl(top.planet)} matters when you need a result quickly.`, `शीघ्र फल चाहिए तो ${c.pl(top.planet)} के विषयों पर निर्भर रहें।`),
      c.s(`Give ${c.pl(bottom.planet)} time — its houses move slowly for you.`, `${c.pl(bottom.planet)} को समय दें — इसके भाव आपके लिए धीरे चलते हैं।`),
      c.s("Rahu and Ketu are excluded — the classical scheme scores seven planets.", "राहु एवं केतु सम्मिलित नहीं — शास्त्रीय पद्धति सात ग्रहों का बल मापती है।")
    ],
    advisory: c.s(
      "A strong planet gives its results readily; a weak one gives them, but only after effort and delay.",
      "बली ग्रह फल सहज देता है; दुर्बल ग्रह भी देता है, पर परिश्रम एवं विलंब के बाद।"
    ),
    placements: f.natalPlacements
  };
}

function ch29(c, k, f) {
  const rows = SEVEN.map((g) => {
    const p = f.P(g);
    return c.s(`${c.pl(g)} has ${f.bavInOwnSign[g]} bindus in ${c.sg(p.sign)}`, `${c.pl(g)} के ${c.sg(p.sign)} में ${f.bavInOwnSign[g]} बिंदु`);
  });
  const best = SEVEN.slice().sort((a, b) => (f.bavInOwnSign[b] ?? 0) - (f.bavInOwnSign[a] ?? 0));
  return {
    subtitle: c.s("Bindu counts, planet by planet", "ग्रह अनुसार बिंदु"),
    summary: c.s(
      `Ashtakavarga scores every sign from the viewpoint of each planet. In your chart ${c.pl(best[0])} is best supported with ${f.bavInOwnSign[best[0]]} bindus in the sign it occupies, and ${c.pl(best[best.length - 1])} is least supported with ${f.bavInOwnSign[best[best.length - 1]]}.`,
      `अष्टकवर्ग प्रत्येक ग्रह की दृष्टि से हर राशि को अंक देता है। आपकी कुंडली में ${c.pl(best[0])} सर्वाधिक सहारा पाता है — अपनी राशि में ${f.bavInOwnSign[best[0]]} बिंदु, और ${c.pl(best[best.length - 1])} सबसे कम — ${f.bavInOwnSign[best[best.length - 1]]} बिंदु।`
    ),
    body: [
      c.s(
        `Each of the seven planets contributes points to the twelve signs from its own position, plus the Ascendant contributes a set. A sign holding five or more of a planet's bindus supports that planet; four or fewer means the planet has to work for its results there. Your counts, planet by planet in the sign each one actually occupies: ${rows.join("; ")}.`,
        `सातों ग्रह अपनी स्थिति से बारह राशियों को बिंदु देते हैं, और लग्न भी एक समूह देता है। जिस राशि में किसी ग्रह के पाँच या अधिक बिंदु हों वह उस ग्रह को सहारा देती है; चार या कम का अर्थ है वहाँ ग्रह को परिश्रम करना पड़ेगा। आपके अंक, प्रत्येक ग्रह की वास्तविक राशि में: ${rows.join("; ")}।`
      ),
      c.s(
        `${c.pl(best[0])} carries the highest count at ${f.bavInOwnSign[best[0]]} bindus. It occupies ${c.ho(f.P(best[0]).house)} and rules ${(f.lordships[best[0]] || []).map((h) => c.ho(h)).join(", ") || c.none} — those matters have the most background support in your chart even before dasha timing is considered.`,
        `${c.pl(best[0])} के सर्वाधिक ${f.bavInOwnSign[best[0]]} बिंदु हैं। यह भाव ${f.P(best[0]).house} में है और ${(f.lordships[best[0]] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी है — दशा के विचार से पहले ही इन विषयों को सर्वाधिक सहारा प्राप्त है।`
      ),
      c.s(
        `${c.pl(best[best.length - 1])} has the lowest at ${f.bavInOwnSign[best[best.length - 1]]}. Transits of that planet through low-bindu signs are the periods to plan conservatively; the same transit through a high-bindu sign is where the same planet gives its better results. Ashtakavarga is a background map — it does not time events on its own, it tells you how much support an event will find when a dasha does time it.`,
        `${c.pl(best[best.length - 1])} के सबसे कम ${f.bavInOwnSign[best[best.length - 1]]} बिंदु हैं। कम बिंदु वाली राशियों में इस ग्रह के गोचर में सावधानी से योजना बनाएँ; अधिक बिंदु वाली राशि में वही ग्रह अच्छा फल देता है। अष्टकवर्ग पृष्ठभूमि का मानचित्र है — यह स्वयं घटना का समय नहीं बताता, यह बताता है कि जब दशा समय देगी तब कितना सहारा मिलेगा।`
      )
    ],
    highlights: [
      c.s(`Best supported: ${c.pl(best[0])} (${f.bavInOwnSign[best[0]]} bindus)`, `सर्वाधिक सहारा: ${c.pl(best[0])} (${f.bavInOwnSign[best[0]]} बिंदु)`),
      c.s(`Least supported: ${c.pl(best[best.length - 1])} (${f.bavInOwnSign[best[best.length - 1]]})`, `न्यूनतम सहारा: ${c.pl(best[best.length - 1])} (${f.bavInOwnSign[best[best.length - 1]]})`),
      c.s(`Chart total: ${f.avTotal} bindus`, `कुल योग: ${f.avTotal} बिंदु`)
    ],
    bullets: [
      c.s("Five or more bindus in a sign is support; four or fewer is effort.", "किसी राशि में पाँच या अधिक बिंदु सहारा हैं; चार या कम परिश्रम।"),
      c.s(`Time important moves to ${c.pl(best[0])}'s transits.`, `महत्वपूर्ण कार्य ${c.pl(best[0])} के गोचर में करें।`),
      c.s("Use this chapter with chapter 30, which totals the same points house by house.", "इस अध्याय को अध्याय 30 के साथ पढ़ें, जो इन्हीं बिंदुओं का भाव अनुसार योग है।")
    ],
    advisory: c.s(
      "Bindus describe support, not certainty — a low count is a caution, not a verdict.",
      "बिंदु सहारा बताते हैं, निश्चितता नहीं — कम अंक चेतावनी है, निर्णय नहीं।"
    ),
    placements: f.natalPlacements
  };
}

function ch30(c, k, f) {
  const top3 = f.savRank.slice(0, 3);
  const bottom3 = f.savRank.slice(-3).reverse();
  const kendra = [1, 4, 7, 10].reduce((a, h) => a + (f.savByHouse(h) ?? 0), 0);
  const trikona = [1, 5, 9].reduce((a, h) => a + (f.savByHouse(h) ?? 0), 0);
  const upachaya = [3, 6, 10, 11].reduce((a, h) => a + (f.savByHouse(h) ?? 0), 0);
  const dusthana = [6, 8, 12].reduce((a, h) => a + (f.savByHouse(h) ?? 0), 0);
  return {
    subtitle: c.s("All bindus added, house by house", "सभी बिंदुओं का भाव अनुसार योग"),
    summary: c.s(
      `Adding every planet's bindus gives ${f.avTotal} points across your twelve houses. Houses ${top3.map((x) => x.house).join(", ")} lead with ${top3.map((x) => x.score).join(", ")} bindus; houses ${bottom3.map((x) => x.house).join(", ")} trail with ${bottom3.map((x) => x.score).join(", ")}.`,
      `सभी ग्रहों के बिंदु जोड़ने पर आपके बारह भावों में कुल ${f.avTotal} अंक बनते हैं। भाव ${top3.map((x) => x.house).join(", ")} सर्वोच्च हैं (${top3.map((x) => x.score).join(", ")} बिंदु); भाव ${bottom3.map((x) => x.house).join(", ")} सबसे नीचे (${bottom3.map((x) => x.score).join(", ")})।`
    ),
    body: [
      c.s(
        `House-by-house totals: ${f.savRank.slice().sort((a, b) => a.house - b.house).map((x) => `${x.house}: ${x.score}`).join(", ")}. The average house holds 28 bindus, so anything above 30 is a well-supported area of life and anything under 25 is one that asks for method rather than momentum.`,
        `भाव अनुसार योग: ${f.savRank.slice().sort((a, b) => a.house - b.house).map((x) => `${x.house}: ${x.score}`).join(", ")}। औसत भाव में 28 बिंदु होते हैं, अतः 30 से ऊपर सहारा प्राप्त क्षेत्र है और 25 से नीचे वह क्षेत्र जहाँ गति नहीं, विधि चाहिए।`
      ),
      c.s(
        `Your four kendras (houses 1, 4, 7, 10) hold ${kendra} bindus between them and your three trikonas (1, 5, 9) hold ${trikona}. The growth houses (3, 6, 10, 11) hold ${upachaya}, and the three difficult houses (6, 8, 12) hold ${dusthana}. Kendra and trikona strength is what carries long-term standing; upachaya strength is what improves with age and repetition.`,
        `आपके चार केंद्र (भाव 1, 4, 7, 10) मिलकर ${kendra} बिंदु रखते हैं और तीन त्रिकोण (1, 5, 9) ${trikona}। उपचय भाव (3, 6, 10, 11) ${upachaya} रखते हैं, और तीन कष्ट भाव (6, 8, 12) ${dusthana}। केंद्र एवं त्रिकोण का बल दीर्घकालीन प्रतिष्ठा देता है; उपचय का बल आयु एवं अभ्यास के साथ बढ़ता है।`
      ),
      c.s(
        `House ${top3[0].house} — ${c.domain(top3[0].house)} — is your best-supported area at ${top3[0].score} bindus, and its lord ${c.pl(f.H(top3[0].house).lord)} sits in ${c.ho(f.P(f.H(top3[0].house).lord).house)}. House ${bottom3[0].house} — ${c.domain(bottom3[0].house)} — is the least supported at ${bottom3[0].score}; its lord ${c.pl(f.H(bottom3[0].house).lord)} is in ${c.ho(f.P(f.H(bottom3[0].house).lord).house)}, and that is where to apply the remedies rather than more effort.`,
        `भाव ${top3[0].house} — ${c.domain(top3[0].house)} — आपका सर्वाधिक सहारा प्राप्त क्षेत्र है (${top3[0].score} बिंदु), और इसका स्वामी ${c.pl(f.H(top3[0].house).lord)} भाव ${f.P(f.H(top3[0].house).lord).house} में है। भाव ${bottom3[0].house} — ${c.domain(bottom3[0].house)} — सबसे कम सहारा पाता है (${bottom3[0].score}); इसका स्वामी ${c.pl(f.H(bottom3[0].house).lord)} भाव ${f.P(f.H(bottom3[0].house).lord).house} में है, और यहीं अधिक परिश्रम नहीं, उपाय लगाने चाहिए।`
      )
    ],
    highlights: top3.map((x) => c.s(`House ${x.house}: ${x.score} bindus — ${c.domain(x.house)}`, `भाव ${x.house}: ${x.score} बिंदु — ${c.domain(x.house)}`)),
    bullets: [
      c.s(`Build on house ${top3[0].house} — it has the most backing.`, `भाव ${top3[0].house} पर निर्माण करें — इसे सर्वाधिक सहारा है।`),
      c.s(`Protect house ${bottom3[0].house} — it has the least.`, `भाव ${bottom3[0].house} की रक्षा करें — इसे सबसे कम सहारा है।`),
      c.s(`Kendra total ${kendra}, trikona total ${trikona}.`, `केंद्र योग ${kendra}, त्रिकोण योग ${trikona}।`)
    ],
    advisory: c.s(
      "Sarvashtakavarga is the map of where your chart has reserves — spend effort where the bindus already back you.",
      "सर्वाष्टकवर्ग बताता है कि आपकी कुंडली में संचित बल कहाँ है — परिश्रम वहीं लगाएँ जहाँ बिंदु पहले से साथ हैं।"
    ),
    placements: f.natalPlacements
  };
}

// ── 31–42: one chapter per divisional chart ──────────────────────────────────

function vargaChapter(c, k, f, cfg) {
  const v = f.varga(cfg.divisor);
  const karaka = cfg.karaka;
  const kp = v.at(karaka);
  const natal = f.P(karaka);
  const focus = v.placements.filter((x) => x.house === cfg.focusHouse);
  const lagnaLordVarga = v.at(v.lagnaLord);
  const topic = c.s(cfg.topicEn, cfg.topicHi);

  const extra = cfg.extra ? cfg.extra(c, k, f, v) : null;

  return {
    subtitle: c.s(`D${cfg.divisor} lagna ${c.sg(v.lagnaSign)}`, `D${cfg.divisor} लग्न ${c.sg(v.lagnaSign)}`),
    summary: c.s(
      `The D${cfg.divisor} divides each sign into ${cfg.divisor} parts and is read for ${topic}. Your D${cfg.divisor} lagna is ${c.sg(v.lagnaSign)}, ruled by ${c.pl(v.lagnaLord)}, and ${c.pl(karaka)} — the significator for this chart — falls in ${c.sg(kp.sign)}, house ${kp.house} of the D${cfg.divisor}.`,
      `D${cfg.divisor} प्रत्येक राशि को ${cfg.divisor} भागों में बाँटता है और ${topic} के लिए देखा जाता है। आपका D${cfg.divisor} लग्न ${c.sg(v.lagnaSign)} है, स्वामी ${c.pl(v.lagnaLord)}, और इस वर्ग का कारक ${c.pl(karaka)} ${c.sg(kp.sign)} में, D${cfg.divisor} के भाव ${kp.house} में पड़ता है।`
    ),
    body: [
      c.s(
        `Your D${cfg.divisor} positions: ${v.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)} (h${x.house})`).join(", ")}. The divisional lagna ${c.sg(v.lagnaSign)} is ruled by ${c.pl(v.lagnaLord)}, which falls in ${c.sg(lagnaLordVarga.sign)} — house ${lagnaLordVarga.house} of this chart — while in the birth chart it sits in ${c.ho(f.P(v.lagnaLord).house)}.${cfg.divisor === 2 ? " A divisional chart never replaces the birth chart; it magnifies one subject inside it." : ""}`,
        `आपकी D${cfg.divisor} स्थितियाँ: ${v.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)} (भाव ${x.house})`).join(", ")}। वर्ग लग्न ${c.sg(v.lagnaSign)} का स्वामी ${c.pl(v.lagnaLord)} है, जो ${c.sg(lagnaLordVarga.sign)} में — इस वर्ग के भाव ${lagnaLordVarga.house} में — पड़ता है, जबकि जन्म कुंडली में यह भाव ${f.P(v.lagnaLord).house} में है।${cfg.divisor === 2 ? " वर्ग कुंडली जन्म कुंडली का स्थान नहीं लेती; वह उसके एक विषय को बड़ा करके दिखाती है।" : ""}`
      ),
      c.s(
        `${c.pl(karaka)} carries this chart's subject. In the birth chart it is ${c.dg(dignityOf(natal))} in ${c.sg(natal.sign)}, ${c.ho(natal.house)}; in the D${cfg.divisor} it moves to ${c.sg(kp.sign)}, house ${kp.house}${EXALT[karaka] === kp.sign ? c.s(" — exalted in the divisional", " — वर्ग में उच्च का") : DEBIL[karaka] === kp.sign ? c.s(" — debilitated in the divisional", " — वर्ग में नीच का") : (OWN[karaka] || []).includes(kp.sign) ? c.s(" — in its own sign in the divisional", " — वर्ग में स्वराशि में") : ""}. ${v.vargottama.length ? c.s(`${v.vargottama.map((p) => c.pl(p)).join(", ")} ${v.vargottama.length > 1 ? "hold" : "holds"} the same sign in both charts (vargottama), which is the strongest thing a divisional can say about a planet.`, `${v.vargottama.map((p) => c.pl(p)).join(", ")} दोनों कुंडलियों में एक ही राशि में ${v.vargottama.length > 1 ? "हैं" : "है"} (वर्गोत्तम), जो वर्ग कुंडली का सबसे बलवान संकेत है।`) : c.s("No planet repeats its birth-chart sign here, so no vargottama strength is available in this varga.", "यहाँ कोई ग्रह अपनी जन्म राशि नहीं दोहराता, अतः इस वर्ग में वर्गोत्तम बल नहीं है।")}`,
        `${c.pl(karaka)} इस वर्ग का विषय वहन करता है। जन्म कुंडली में यह ${c.dg(dignityOf(natal))} ${c.sg(natal.sign)} में, भाव ${natal.house} में है; D${cfg.divisor} में यह ${c.sg(kp.sign)}, भाव ${kp.house} में आता है${EXALT[karaka] === kp.sign ? " — वर्ग में उच्च का" : DEBIL[karaka] === kp.sign ? " — वर्ग में नीच का" : (OWN[karaka] || []).includes(kp.sign) ? " — वर्ग में स्वराशि में" : ""}। ${v.vargottama.length ? `${v.vargottama.map((p) => c.pl(p)).join(", ")} दोनों कुंडलियों में एक ही राशि में हैं (वर्गोत्तम)।` : "यहाँ कोई ग्रह वर्गोत्तम नहीं है।"}`
      ),
      extra || c.s(
        `House ${cfg.focusHouse} of this divisional — the house that carries ${topic} — holds ${focus.length ? focus.map((x) => c.pl(x.planet)).join(", ") : "no planet"}, and its lord is ${c.pl(SignLords[v.placements.length ? SIGN_AT(v, cfg.focusHouse) : v.lagnaSign])}. ${v.dignified.length ? c.s(`${v.dignified.map((p) => c.pl(p)).join(", ")} reach own or exalted signs here.`, `${v.dignified.map((p) => c.pl(p)).join(", ")} यहाँ स्वराशि या उच्च राशि में हैं।`) : c.s("No planet reaches an own or exalted sign in this varga.", "इस वर्ग में कोई ग्रह स्वराशि या उच्च राशि में नहीं है।")} ${v.debilitated.length ? c.s(`${v.debilitated.map((p) => c.pl(p)).join(", ")} fall into debilitation here — the matters they rule need more care in this area than the birth chart alone suggests.`, `${v.debilitated.map((p) => c.pl(p)).join(", ")} यहाँ नीच के हो जाते हैं — इनके विषयों में जन्म कुंडली से अधिक सावधानी चाहिए।`) : ""} ${v.inKendra.length} of nine planets fall in the angles of this divisional.`,
        `इस वर्ग का भाव ${cfg.focusHouse} — जो ${topic} वहन करता है — में ${focus.length ? focus.map((x) => c.pl(x.planet)).join(", ") : "कोई ग्रह नहीं"} है। ${v.dignified.length ? `${v.dignified.map((p) => c.pl(p)).join(", ")} यहाँ स्वराशि या उच्च राशि में हैं।` : "इस वर्ग में कोई ग्रह स्वराशि या उच्च राशि में नहीं है।"} ${v.debilitated.length ? `${v.debilitated.map((p) => c.pl(p)).join(", ")} यहाँ नीच के हैं।` : ""} नौ में से ${v.inKendra.length} ग्रह इस वर्ग के केंद्रों में हैं।`
      )
    ],
    highlights: [
      c.s(`D${cfg.divisor} lagna ${c.sg(v.lagnaSign)}, lord ${c.pl(v.lagnaLord)}`, `D${cfg.divisor} लग्न ${c.sg(v.lagnaSign)}, स्वामी ${c.pl(v.lagnaLord)}`),
      c.s(`${c.pl(karaka)} in ${c.sg(kp.sign)}, house ${kp.house}`, `${c.pl(karaka)} ${c.sg(kp.sign)} में, भाव ${kp.house}`),
      c.s(`Vargottama: ${v.vargottama.length ? v.vargottama.map((p) => c.pl(p)).join(", ") : c.none}`, `वर्गोत्तम: ${v.vargottama.length ? v.vargottama.map((p) => c.pl(p)).join(", ") : "कोई नहीं"}`)
    ],
    bullets: [
      c.s(`Read this chart with house ${cfg.focusHouse} of your birth chart.`, `इसे जन्म कुंडली के भाव ${cfg.focusHouse} के साथ पढ़ें।`),
      c.s(`${c.pl(karaka)} is the planet to strengthen for ${topic}.`, `${topic} के लिए ${c.pl(karaka)} को बल दें।`),
      v.debilitated.length
        ? c.s(`Watch ${v.debilitated.map((p) => c.pl(p)).join(", ")} — weak in this varga.`, `${v.debilitated.map((p) => c.pl(p)).join(", ")} पर ध्यान दें — इस वर्ग में दुर्बल।`)
        : c.s("No planet is debilitated in this varga.", "इस वर्ग में कोई ग्रह नीच का नहीं है।")
    ],
    advisory: c.s(
      `A divisional chart confirms or qualifies the birth chart — where D${cfg.divisor} and your birth chart agree, that result is reliable.`,
      `वर्ग कुंडली जन्म कुंडली की पुष्टि या सीमा बताती है — जहाँ D${cfg.divisor} और जन्म कुंडली एकमत हों, वह फल विश्वसनीय है।`
    ),
    placements: v.placements
  };
}

// Sign sitting on a given house of a divisional chart.
function SIGN_AT(v, house) {
  const SIGNS_ORDER = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const idx = (SIGNS_ORDER.indexOf(v.lagnaSign) + house - 1) % 12;
  return SIGNS_ORDER[idx];
}

// D2 carries the classical Sun/Moon hora split as its third paragraph.
function horaExtra(c, k, f) {
  const tally = { Sun: [], Moon: [] };
  for (const p of f.planets) tally[horaLordOf(p.longitude)].push(c.pl(p.name));
  return c.s(
    `The classical Hora rule splits each sign in half: in your chart ${tally.Sun.length} planets fall in the Sun's hora (${tally.Sun.join(", ") || "none"}) and ${tally.Moon.length} in the Moon's (${tally.Moon.join(", ") || "none"}). A majority in the Sun's hora points to wealth earned through initiative, authority and one's own name; a majority in the Moon's points to wealth that comes through people, family, liquidity and accumulation over time. Yours leans ${tally.Sun.length > tally.Moon.length ? "to the Sun's side" : tally.Moon.length > tally.Sun.length ? "to the Moon's side" : "evenly between the two"}.`,
    `शास्त्रीय होरा नियम प्रत्येक राशि को आधा बाँटता है: आपकी कुंडली में ${tally.Sun.length} ग्रह सूर्य होरा में हैं (${tally.Sun.join(", ") || "कोई नहीं"}) और ${tally.Moon.length} चंद्र होरा में (${tally.Moon.join(", ") || "कोई नहीं"})। सूर्य होरा में बहुमत स्वप्रयास, अधिकार एवं अपने नाम से अर्जित धन दर्शाता है; चंद्र होरा में बहुमत लोगों, परिवार एवं क्रमिक संचय से आने वाला धन। आपका झुकाव ${tally.Sun.length > tally.Moon.length ? "सूर्य की ओर" : tally.Moon.length > tally.Sun.length ? "चंद्र की ओर" : "दोनों में समान"} है।`
  );
}

// D30 carries the classical Trimsamsa rulers as its third paragraph.
function trimsamsaExtra(c, k, f) {
  const rows = f.planets.filter((p) => !["Rahu", "Ketu"].includes(p.name))
    .map((p) => `${c.pl(p.name)} – ${c.pl(trimsamsaLordOf(p.longitude))}`);
  const counts = {};
  for (const p of f.planets.filter((x) => !["Rahu", "Ketu"].includes(x.name))) {
    const l = trimsamsaLordOf(p.longitude);
    counts[l] = (counts[l] || 0) + 1;
  }
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return c.s(
    `By the classical Trimsamsa division the degree each planet occupies falls under one of five rulers — Mars, Saturn, Jupiter, Mercury or Venus. In your chart: ${rows.join(", ")}. ${c.pl(dominant[0])} rules the most of them (${dominant[1]} of seven), which is the planet whose kind of difficulty recurs most often for you — and correspondingly the one whose remedy has the widest effect.`,
    `शास्त्रीय त्रिंशांश विभाजन में प्रत्येक ग्रह का अंश पाँच स्वामियों में से एक के अधीन आता है — मंगल, शनि, गुरु, बुध या शुक्र। आपकी कुंडली में: ${rows.join(", ")}। ${c.pl(dominant[0])} इनमें सर्वाधिक (सात में ${dominant[1]}) का स्वामी है, अर्थात इसी प्रकार का कष्ट आपके लिए बार-बार आता है — और इसी का उपाय सर्वाधिक प्रभावी है।`
  );
}

const VARGA_CFG = [
  { divisor: 2,  focusHouse: 2,  karaka: "Jupiter", topicEn: "wealth and resources",        topicHi: "धन एवं साधन",           extra: horaExtra },
  { divisor: 3,  focusHouse: 3,  karaka: "Mars",    topicEn: "siblings and courage",        topicHi: "भाई-बहन एवं साहस" },
  { divisor: 4,  focusHouse: 4,  karaka: "Mars",    topicEn: "property and fixed assets",   topicHi: "संपत्ति एवं स्थिर धन" },
  { divisor: 7,  focusHouse: 5,  karaka: "Jupiter", topicEn: "children and progeny",        topicHi: "संतान" },
  { divisor: 9,  focusHouse: 7,  karaka: "Venus",   topicEn: "marriage and inner strength", topicHi: "विवाह एवं आंतरिक बल" },
  { divisor: 10, focusHouse: 10, karaka: "Saturn",  topicEn: "career and profession",       topicHi: "कर्म एवं व्यवसाय" },
  { divisor: 12, focusHouse: 9,  karaka: "Sun",     topicEn: "parents and lineage",         topicHi: "माता-पिता एवं वंश" },
  { divisor: 16, focusHouse: 4,  karaka: "Venus",   topicEn: "vehicles and comforts",       topicHi: "वाहन एवं सुख" },
  { divisor: 20, focusHouse: 9,  karaka: "Ketu",    topicEn: "spiritual practice",          topicHi: "साधना" },
  { divisor: 24, focusHouse: 5,  karaka: "Mercury", topicEn: "education and learning",      topicHi: "शिक्षा एवं अध्ययन" },
  { divisor: 27, focusHouse: 1,  karaka: "Moon",    topicEn: "underlying strengths and weaknesses", topicHi: "मूल बल एवं दुर्बलता" },
  { divisor: 30, focusHouse: 6,  karaka: "Saturn",  topicEn: "difficulties and misfortune", topicHi: "कष्ट एवं विपत्ति",      extra: trimsamsaExtra }
];

function ch43(c, k, f) {
  const v40 = f.varga(40); const v45 = f.varga(45); const v60 = f.varga(60);
  const tally = f.shodashaTally;
  return {
    subtitle: c.s("The three finest divisions", "तीन सूक्ष्मतम विभाजन"),
    summary: c.s(
      `The D40, D45 and D60 divide each sign into forty, forty-five and sixty parts. Your D40 lagna is ${c.sg(v40.lagnaSign)}, D45 is ${c.sg(v45.lagnaSign)} and D60 is ${c.sg(v60.lagnaSign)}. At this resolution a few minutes of birth time changes the answer, so these are read as confirmation, never on their own.`,
      `D40, D45 एवं D60 प्रत्येक राशि को चालीस, पैंतालीस एवं साठ भागों में बाँटते हैं। आपका D40 लग्न ${c.sg(v40.lagnaSign)}, D45 ${c.sg(v45.lagnaSign)} एवं D60 ${c.sg(v60.lagnaSign)} है। इस सूक्ष्मता पर जन्म समय के कुछ मिनट भी उत्तर बदल देते हैं, अतः इन्हें केवल पुष्टि के लिए देखा जाता है।`
    ),
    body: [
      c.s(
        `D40 (maternal legacy): lagna ${c.sg(v40.lagnaSign)}, ruled by ${c.pl(v40.lagnaLord)}; ${v40.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)}`).join(", ")}. D45 (paternal legacy): lagna ${c.sg(v45.lagnaSign)}, ruled by ${c.pl(v45.lagnaLord)}; ${v45.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)}`).join(", ")}.`,
        `D40 (मातृ पक्ष): लग्न ${c.sg(v40.lagnaSign)}, स्वामी ${c.pl(v40.lagnaLord)}; ${v40.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)}`).join(", ")}। D45 (पितृ पक्ष): लग्न ${c.sg(v45.lagnaSign)}, स्वामी ${c.pl(v45.lagnaLord)}; ${v45.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)}`).join(", ")}।`
      ),
      c.s(
        `D60 (the finest division, read for the overall quality of results): lagna ${c.sg(v60.lagnaSign)}, ruled by ${c.pl(v60.lagnaLord)}; ${v60.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)} (h${x.house})`).join(", ")}. ${v60.vargottama.length ? c.s(`${v60.vargottama.map((p) => c.pl(p)).join(", ")} hold the same sign as in the birth chart even at this resolution — an unusually durable placement.`, `${v60.vargottama.map((p) => c.pl(p)).join(", ")} इस सूक्ष्मता पर भी जन्म राशि में हैं — असामान्य रूप से स्थिर स्थिति।`) : c.s("No planet holds its birth-chart sign at this resolution.", "इस सूक्ष्मता पर कोई ग्रह अपनी जन्म राशि नहीं रखता।")}`,
        `D60 (सूक्ष्मतम विभाजन, फल की समग्र गुणवत्ता के लिए): लग्न ${c.sg(v60.lagnaSign)}, स्वामी ${c.pl(v60.lagnaLord)}; ${v60.placements.map((x) => `${c.pl(x.planet)} ${c.sg(x.sign)} (भाव ${x.house})`).join(", ")}। ${v60.vargottama.length ? `${v60.vargottama.map((p) => c.pl(p)).join(", ")} इस स्तर पर भी जन्म राशि में हैं।` : "इस स्तर पर कोई ग्रह अपनी जन्म राशि नहीं रखता।"}`
      ),
      c.s(
        `Counting across all sixteen standard vargas (D1 to D60), the number of divisions in which each planet reaches its own or exalted sign is: ${tally.map((t) => `${c.pl(t.planet)} ${t.count}/16`).join(", ")}. ${c.pl(tally[0].planet)} holds up best under subdivision at ${tally[0].count} of 16, and ${c.pl(tally[tally.length - 1].planet)} the least at ${tally[tally.length - 1].count}. This is the practical use of the fine vargas — a planet that keeps good signs as you subdivide gives steady results, and one that loses them gives results that look good at first and thin out.`,
        `सोलहों वर्गों (D1 से D60) में गिनने पर प्रत्येक ग्रह कितने विभाजनों में स्वराशि या उच्च राशि पाता है: ${tally.map((t) => `${c.pl(t.planet)} ${t.count}/16`).join(", ")}। ${c.pl(tally[0].planet)} विभाजन में सर्वाधिक टिकता है (16 में ${tally[0].count}) और ${c.pl(tally[tally.length - 1].planet)} सबसे कम (${tally[tally.length - 1].count})। सूक्ष्म वर्गों का व्यावहारिक उपयोग यही है — जो ग्रह विभाजन में अच्छी राशियाँ बनाए रखे वह स्थिर फल देता है, जो खो दे उसका फल आरंभ में अच्छा दिखकर क्षीण हो जाता है।`
      )
    ],
    highlights: [
      c.s(`D40 lagna ${c.sg(v40.lagnaSign)} · D45 ${c.sg(v45.lagnaSign)} · D60 ${c.sg(v60.lagnaSign)}`, `D40 लग्न ${c.sg(v40.lagnaSign)} · D45 ${c.sg(v45.lagnaSign)} · D60 ${c.sg(v60.lagnaSign)}`),
      c.s(`Most durable planet: ${c.pl(tally[0].planet)} (${tally[0].count}/16)`, `सर्वाधिक स्थिर ग्रह: ${c.pl(tally[0].planet)} (${tally[0].count}/16)`),
      c.s(`Least durable: ${c.pl(tally[tally.length - 1].planet)} (${tally[tally.length - 1].count}/16)`, `सबसे कम स्थिर: ${c.pl(tally[tally.length - 1].planet)} (${tally[tally.length - 1].count}/16)`)
    ],
    bullets: [
      c.s("Treat these three as confirmation of the D9 and D10, not as separate verdicts.", "इन तीनों को D9 एवं D10 की पुष्टि मानें, अलग निर्णय नहीं।"),
      c.s("An unverified birth time makes this page unreliable — verify it before acting on it.", "अपुष्ट जन्म समय इस पृष्ठ को अविश्वसनीय बनाता है — पहले उसे सत्यापित करें।"),
      c.s(`Strengthening ${c.pl(tally[tally.length - 1].planet)} gives the largest gain across the vargas.`, `${c.pl(tally[tally.length - 1].planet)} को बल देने से वर्गों में सर्वाधिक लाभ होता है।`)
    ],
    advisory: c.s(
      "These divisions are the reason a birth time should be recorded to the minute — at D60 each division lasts only half a degree.",
      "इन्हीं विभाजनों के कारण जन्म समय मिनट तक दर्ज होना चाहिए — D60 में प्रत्येक भाग केवल आधा अंश का होता है।"
    ),
    placements: v60.placements
  };
}

// ── 44–47: yogas and doshas ──────────────────────────────────────────────────

function ch44(c, k, f) {
  const rys = f.rajaYogas;
  const seen = new Set();
  const unique = rys.filter((y) => {
    const key = `${y.name}:${y.planets.slice().sort().join("-")}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  // The detector carries both languages for the name and the reason; the Hindi
  // line was interpolating the English ones.
  const lines = unique.map((y) => c.s(
    `${y.name} — ${y.planets.map((p) => c.pl(p)).join(" + ")}: ${y.reason}`,
    `${y.name_hi || y.name} — ${y.planets.map((p) => c.pl(p)).join(" + ")}: ${y.reason_hi || y.reason}`
  ));
  const vip = f.vipreet;
  const nb = f.neechaBhanga.filter((x) => x.cancelled);
  return {
    subtitle: c.s(`${unique.length} combination${unique.length === 1 ? "" : "s"} found`, `${unique.length} योग मिले`),
    summary: unique.length
      ? c.s(`Testing your kendra lords (${[1, 4, 7, 10].map((h) => c.pl(f.H(h).lord)).join(", ")}) against your trikona lords (${[1, 5, 9].map((h) => c.pl(f.H(h).lord)).join(", ")}) produces ${unique.length} Raja Yoga combination${unique.length === 1 ? "" : "s"} in your chart.`,
             `आपके केंद्रेश (${[1, 4, 7, 10].map((h) => c.pl(f.H(h).lord)).join(", ")}) और त्रिकोणेश (${[1, 5, 9].map((h) => c.pl(f.H(h).lord)).join(", ")}) के मेल से आपकी कुंडली में ${unique.length} राज योग बनते हैं।`)
      : c.s(`No Raja Yoga forms in your chart: your kendra lords (${[1, 4, 7, 10].map((h) => c.pl(f.H(h).lord)).join(", ")}) neither join nor aspect your trikona lords (${[1, 5, 9].map((h) => c.pl(f.H(h).lord)).join(", ")}). That is a common and workable chart, not a defect.`,
             `आपकी कुंडली में राज योग नहीं बनता: केंद्रेश (${[1, 4, 7, 10].map((h) => c.pl(f.H(h).lord)).join(", ")}) न त्रिकोणेश (${[1, 5, 9].map((h) => c.pl(f.H(h).lord)).join(", ")}) से युत हैं, न दृष्ट। यह सामान्य कुंडली है, दोष नहीं।`),
    body: [
      unique.length
        ? c.s(`The combinations present: ${lines.join(". ")}. A Raja Yoga is formed when the lord of an angle (1, 4, 7, 10) and the lord of a trine (1, 5, 9) come together — by conjunction, by mutual aspect, or by one planet ruling both. It gives its result during the dasha of the planets involved, not continuously.`,
              `उपस्थित योग: ${lines.join("। ")}। राज योग तब बनता है जब केंद्र (1, 4, 7, 10) एवं त्रिकोण (1, 5, 9) के स्वामी युति, परस्पर दृष्टि, या एक ही ग्रह के दोनों स्वामित्व से जुड़ें। इसका फल संबंधित ग्रहों की दशा में मिलता है, निरंतर नहीं।`)
        : c.s(`In your chart the angular lords are ${[...new Set([1, 4, 7, 10].map((h) => f.H(h).lord))].map((l) => `${c.pl(l)} in ${c.ho(f.P(l).house)}`).join(", ")} and the trinal lords are ${[...new Set([1, 5, 9].map((h) => f.H(h).lord))].map((l) => `${c.pl(l)} in ${c.ho(f.P(l).house)}`).join(", ")}. None of these pairs sits together or aspects the other, so the classical Raja Yoga condition is not met. Status in this kind of chart is built through the dasha sequence and through the strongest planets in chapter 28 instead.`,
              `आपकी कुंडली में केंद्रेश ${[...new Set([1, 4, 7, 10].map((h) => f.H(h).lord))].map((l) => `${c.pl(l)} भाव ${f.P(l).house} में`).join(", ")} हैं और त्रिकोणेश ${[...new Set([1, 5, 9].map((h) => f.H(h).lord))].map((l) => `${c.pl(l)} भाव ${f.P(l).house} में`).join(", ")}। इनमें कोई जोड़ी न युत है न दृष्ट, अतः शास्त्रीय राज योग की शर्त पूरी नहीं होती। ऐसी कुंडली में प्रतिष्ठा दशा क्रम एवं अध्याय 28 के बलवान ग्रहों से बनती है।`),
      f.exchanges.length
        ? c.s(`Your chart also has ${f.exchanges.length} sign exchange${f.exchanges.length === 1 ? "" : "s"} (parivartana): ${f.exchanges.map((e) => `${c.pl(e.lords[0])} and ${c.pl(e.lords[1])} swap houses ${e.houses[0]} and ${e.houses[1]}`).join("; ")}. An exchange ties two houses permanently — the results of one arrive through the other.`,
              `आपकी कुंडली में ${f.exchanges.length} राशि परिवर्तन भी है: ${f.exchanges.map((e) => `${c.pl(e.lords[0])} एवं ${c.pl(e.lords[1])} भाव ${e.houses[0]} और ${e.houses[1]} का आदान-प्रदान करते हैं`).join("; ")}। परिवर्तन दो भावों को स्थायी रूप से जोड़ देता है।`)
        : c.s("No two house lords exchange signs in your chart, so no parivartana yoga is present.", "आपकी कुंडली में किन्हीं दो भावेशों का राशि परिवर्तन नहीं है, अतः परिवर्तन योग नहीं है।"),
      c.s(
        `${f.gajaKesari ? `Gaja Kesari is present — Jupiter sits in an angle from your Moon, which steadies judgement and brings support from seniors. ` : `Gaja Kesari is not present — Jupiter is not in an angle from your Moon. `}${vip.length ? `Vipreet Raja Yoga is formed: ${vip.map((v) => `the lord of house ${v.house} (${c.pl(v.lord)}) sits in house ${v.placedIn}`).join("; ")} — difficulty turning into advantage through the same channel that caused it. ` : "No Vipreet Raja Yoga is formed. "}${nb.length ? `${nb.map((x) => c.pl(x.planet)).join(", ")} is debilitated but cancelled (neecha bhanga) by ${nb.map((x) => x.by.map((b) => c.pl(b)).join(", ")).join("; ")}, which converts an apparent weakness into late-arriving strength.` : f.neechaBhanga.length ? `${f.neechaBhanga.map((x) => c.pl(x.planet)).join(", ")} is debilitated with no cancellation available.` : "No planet in your chart is debilitated, so no cancellation question arises."}`,
        `${f.gajaKesari ? "गजकेसरी योग है — गुरु आपके चंद्र से केंद्र में है। " : "गजकेसरी योग नहीं है — गुरु चंद्र से केंद्र में नहीं है। "}${vip.length ? `विपरीत राज योग बनता है: ${vip.map((v) => `भाव ${v.house} का स्वामी (${c.pl(v.lord)}) भाव ${v.placedIn} में है`).join("; ")}। ` : "विपरीत राज योग नहीं बनता। "}${nb.length ? `${nb.map((x) => c.pl(x.planet)).join(", ")} नीच का है पर ${nb.map((x) => x.by.map((b) => c.pl(b)).join(", ")).join("; ")} से नीचभंग हो रहा है।` : f.neechaBhanga.length ? `${f.neechaBhanga.map((x) => c.pl(x.planet)).join(", ")} नीच का है और भंग उपलब्ध नहीं।` : "आपकी कुंडली में कोई ग्रह नीच का नहीं है।"}`
      )
    ],
    highlights: [
      c.s(`Raja Yogas found: ${unique.length}`, `राज योग: ${unique.length}`),
      c.s(`Sign exchanges: ${f.exchanges.length}`, `राशि परिवर्तन: ${f.exchanges.length}`),
      c.s(`Gaja Kesari: ${f.gajaKesari ? "present" : "absent"}`, `गजकेसरी: ${f.gajaKesari ? "उपस्थित" : "अनुपस्थित"}`)
    ],
    bullets: unique.length
      ? unique.slice(0, 4).map((y) => c.s(`${y.planets.map((p) => c.pl(p)).join(" + ")} — active in their dasha periods.`, `${y.planets.map((p) => c.pl(p)).join(" + ")} — इनकी दशा में सक्रिय।`))
      : [
          c.s("Absence of Raja Yoga is not absence of success — see chapter 28.", "राज योग का न होना असफलता नहीं — अध्याय 28 देखें।"),
          c.s(`Your strongest planet ${c.pl(f.strength[0].planet)} does this work instead.`, `आपका सबसे बलवान ग्रह ${c.pl(f.strength[0].planet)} यह कार्य करता है।`),
          c.s("Check chapters 48 to 51 for when your best periods run.", "सर्वोत्तम समय के लिए अध्याय 48 से 51 देखें।")
        ],
    advisory: c.s(
      "A yoga only delivers during the dasha of the planets that form it — chapter 48 tells you when yours run.",
      "योग केवल उन्हीं ग्रहों की दशा में फल देता है जो उसे बनाते हैं — अध्याय 48 में उनका समय है।"
    ),
    placements: f.natalPlacements
  };
}

function ch45(c, k, f) {
  const dy = f.dhanaYogas;
  const l2 = f.H(2).lord; const l11 = f.H(11).lord; const l9 = f.H(9).lord; const l5 = f.H(5).lord;
  const sav2 = f.savRankOf(2); const sav11 = f.savRankOf(11);
  return {
    subtitle: c.s(`${dy.length} wealth combination${dy.length === 1 ? "" : "s"}`, `${dy.length} धन योग`),
    summary: dy.length
      ? c.s(`Your wealth houses are ruled by ${c.pl(l2)} (2nd), ${c.pl(l5)} (5th), ${c.pl(l9)} (9th) and ${c.pl(l11)} (11th). ${dy.length} Dhana Yoga combination${dy.length === 1 ? "" : "s"} form between them.`,
             `आपके धन भावों के स्वामी हैं ${c.pl(l2)} (द्वितीय), ${c.pl(l5)} (पंचम), ${c.pl(l9)} (नवम) एवं ${c.pl(l11)} (एकादश)। इनके बीच ${dy.length} धन योग बनते हैं।`)
      : c.s(`Your wealth houses are ruled by ${c.pl(l2)}, ${c.pl(l5)}, ${c.pl(l9)} and ${c.pl(l11)}, and none of them joins or occupies another's house — so no classical Dhana Yoga forms. Income in this pattern comes from steady work rather than from combinations.`,
             `आपके धन भावों के स्वामी ${c.pl(l2)}, ${c.pl(l5)}, ${c.pl(l9)} एवं ${c.pl(l11)} हैं, और इनमें कोई न युत है न एक-दूसरे के भाव में — अतः शास्त्रीय धन योग नहीं बनता। ऐसी स्थिति में आय योग से नहीं, निरंतर कार्य से आती है।`),
    body: [
      dy.length
        ? c.s(`The combinations: ${dy.map((y) => y.reason).join("; ")}. A Dhana Yoga is a link between the houses of earning (11th), savings (2nd), fortune (9th) and merit (5th). Each one delivers during the dasha of the planets that form it.`,
              `योग: ${dy.map((y) => y.reason_hi || y.reason).join("; ")}। धन योग आय (एकादश), संचय (द्वितीय), भाग्य (नवम) एवं पुण्य (पंचम) भावों के बीच का संबंध है। प्रत्येक अपने ग्रहों की दशा में फल देता है।`)
        : c.s(`Your 2nd lord ${c.pl(l2)} sits in ${c.ho(f.P(l2).house)}, the 11th lord ${c.pl(l11)} in ${c.ho(f.P(l11).house)}, the 9th lord ${c.pl(l9)} in ${c.ho(f.P(l9).house)} and the 5th lord ${c.pl(l5)} in ${c.ho(f.P(l5).house)}. Since these do not meet, money follows the houses they actually occupy rather than arriving as a windfall.`,
              `आपका द्वितीयेश ${c.pl(l2)} भाव ${f.P(l2).house} में, एकादशेश ${c.pl(l11)} भाव ${f.P(l11).house} में, नवमेश ${c.pl(l9)} भाव ${f.P(l9).house} में एवं पंचमेश ${c.pl(l5)} भाव ${f.P(l5).house} में है। ये मिलते नहीं, अतः धन इन्हीं भावों के मार्ग से आता है, अचानक नहीं।`),
      c.s(
        `Your 2nd house of savings carries ${sav2 ? `${sav2.score} bindus (rank ${sav2.rank} of 12)` : "no score"} and your 11th house of income carries ${sav11 ? `${sav11.score} bindus (rank ${sav11.rank})` : "no score"}. ${sav11 && sav2 && sav11.score > sav2.score ? c.s("Income scores higher than savings in your chart, which means money arrives more easily than it stays — the discipline to keep it matters more than the effort to earn it.", "आपकी कुंडली में आय संचय से अधिक अंक पाती है, अर्थात धन आता सरलता से है, टिकता कठिनाई से — कमाने से अधिक बचाने का अनुशासन आवश्यक है।") : c.s("Savings score at least as high as income in your chart, which means what you earn tends to stay — accumulation is the natural strength here.", "आपकी कुंडली में संचय आय से कम नहीं है, अर्थात जो कमाते हैं वह टिकता है — संचय आपकी स्वाभाविक शक्ति है।")}`,
        `आपके द्वितीय भाव में ${sav2 ? `${sav2.score} बिंदु (12 में ${sav2.rank} स्थान)` : "अंक नहीं"} और एकादश भाव में ${sav11 ? `${sav11.score} बिंदु (स्थान ${sav11.rank})` : "अंक नहीं"} हैं।`
      ),
      c.s(
        `Jupiter, the natural significator of wealth, is ${c.dg(dignityOf(f.P("Jupiter")))} in ${c.sg(f.P("Jupiter").sign)} in ${c.ho(f.P("Jupiter").house)}, and Venus, the significator of comfort, is ${c.dg(dignityOf(f.P("Venus")))} in ${c.ho(f.P("Venus").house)}. ${f.budhaAditya ? c.s("Sun and Mercury sit together (Budha-Aditya), which favours income through communication, analysis and dealing.", "सूर्य एवं बुध एक साथ हैं (बुधादित्य), जो संवाद, विश्लेषण एवं व्यवहार से आय देता है।") : ""} ${f.chandraMangala ? c.s("Moon and Mars sit together (Chandra-Mangala), a classical money-through-enterprise combination.", "चंद्र एवं मंगल एक साथ हैं (चंद्र-मंगल), जो उद्यम से धन का शास्त्रीय योग है।") : ""}`,
        `धन का नैसर्गिक कारक गुरु ${c.dg(dignityOf(f.P("Jupiter")))} ${c.sg(f.P("Jupiter").sign)} में भाव ${f.P("Jupiter").house} में है, एवं सुख का कारक शुक्र ${c.dg(dignityOf(f.P("Venus")))} भाव ${f.P("Venus").house} में। ${f.budhaAditya ? "सूर्य एवं बुध एक साथ हैं (बुधादित्य)।" : ""} ${f.chandraMangala ? "चंद्र एवं मंगल एक साथ हैं (चंद्र-मंगल)।" : ""}`
      )
    ],
    highlights: [
      c.s(`Dhana Yogas: ${dy.length}`, `धन योग: ${dy.length}`),
      c.s(`2nd house bindus ${sav2 ? sav2.score : "—"}, 11th house ${sav11 ? sav11.score : "—"}`, `द्वितीय भाव बिंदु ${sav2 ? sav2.score : "—"}, एकादश ${sav11 ? sav11.score : "—"}`),
      c.s(`Jupiter ${c.dg(dignityOf(f.P("Jupiter")))} in ${c.ho(f.P("Jupiter").house)}`, `गुरु ${c.dg(dignityOf(f.P("Jupiter")))} भाव ${f.P("Jupiter").house} में`)
    ],
    bullets: [
      c.s(`${c.weekday(l11)} is your 11th lord's day — good for income matters.`, `${c.weekday(l11)} आपके एकादशेश का दिन है — आय के कार्यों के लिए उपयुक्त।`),
      c.s(`Money reaches you through ${c.domain(f.P(l11).house)}.`, `धन ${c.domain(f.P(l11).house)} के मार्ग से आता है।`),
      c.s(`Savings depend on ${c.pl(l2)} in ${c.ho(f.P(l2).house)}.`, `संचय ${c.pl(l2)} पर निर्भर है, जो भाव ${f.P(l2).house} में है।`)
    ],
    advisory: c.s(
      "Wealth combinations describe the route money takes, not the amount — the dasha chapters say when the route opens.",
      "धन योग धन का मार्ग बताते हैं, मात्रा नहीं — दशा अध्याय बताते हैं कि वह मार्ग कब खुलता है।"
    ),
    placements: f.natalPlacements
  };
}

function ch46(c, k, f) {
  const present = f.mahapurusha.filter((m) => m.present);
  const absent = f.mahapurusha.filter((m) => !m.present);
  const arishtaKeys = ["kemadruma", "shakat", "daridra", "paap_kartari", "guru_chandal"];
  const arishta = (k.doshas?.list || [])
    .filter((d) => arishtaKeys.includes(d.key))
    .map((d) => ({
      ...d,
      name: (c.hi && d.name_hi) || d.name,
      reason: (c.hi && d.reason_hi) || d.reason,
      remedy: (c.hi && d.remedy_hi) || d.remedy,
    }));
  const arishtaPresent = arishta.filter((d) => d.present);
  return {
    subtitle: c.s(`${present.length} of five Mahapurusha yogas`, `पाँच में से ${present.length} महापुरुष योग`),
    summary: present.length
      ? c.s(`${present.map((m) => `${m.yoga} Yoga is formed — ${c.pl(m.planet)} is ${c.dg(m.dignity)} in ${c.sg(m.sign)} in ${c.ho(m.house)}`).join("; ")}. A Mahapurusha yoga needs its planet both dignified and in an angle, so it is genuinely uncommon.`,
             `${present.map((m) => `${m.yoga} योग बनता है — ${c.pl(m.planet)} ${c.dg(m.dignity)} ${c.sg(m.sign)} में, भाव ${m.house} में`).join("; ")}। महापुरुष योग के लिए ग्रह का बली होना एवं केंद्र में होना दोनों आवश्यक हैं, अतः यह वास्तव में दुर्लभ है।`)
      : c.s("None of the five Pancha Mahapurusha yogas forms in your chart. Each needs its planet to be in its own or exalted sign and simultaneously in an angle — a demanding condition that most charts do not meet.",
             "आपकी कुंडली में पाँचों महापुरुष योगों में से कोई नहीं बनता। प्रत्येक के लिए ग्रह का स्वराशि या उच्च राशि में तथा साथ ही केंद्र में होना आवश्यक है — यह कठिन शर्त अधिकांश कुंडलियों में पूरी नहीं होती।"),
    body: [
      c.s(
        `The five tested, planet by planet: ${f.mahapurusha.map((m) => `${m.yoga} (${c.pl(m.planet)}) — ${c.pl(m.planet)} is ${c.dg(m.dignity)} in ${c.sg(m.sign)}, ${c.ho(m.house)}: ${m.present ? c.s("formed", "बनता है") : c.s("not formed", "नहीं बनता")}`).join("; ")}.`,
        `पाँचों की जाँच, ग्रह अनुसार: ${f.mahapurusha.map((m) => `${m.yoga} (${c.pl(m.planet)}) — ${c.pl(m.planet)} ${c.dg(m.dignity)} ${c.sg(m.sign)} में, भाव ${m.house}: ${m.present ? "बनता है" : "नहीं बनता"}`).join("; ")}।`
      ),
      present.length
        ? c.s(`${present[0].yoga} is the one that shapes your public character. ${c.pl(present[0].planet)} in ${c.ho(present[0].house)} rules ${(f.lordships[present[0].planet] || []).map((h) => c.ho(h)).join(", ")} and governs ${c.karaka(present[0].planet)} — that is the quality people will describe you by, and it strengthens further during the ${c.pl(present[0].planet)} dasha.`,
              `${present[0].yoga} ही आपके सार्वजनिक व्यक्तित्व को गढ़ता है। ${c.pl(present[0].planet)} भाव ${present[0].house} में ${(f.lordships[present[0].planet] || []).map((h) => `भाव ${h}`).join(", ")} का स्वामी है और ${c.karaka(present[0].planet)} का कारक — यही गुण लोग आपमें देखेंगे, और ${c.pl(present[0].planet)} की दशा में यह और बढ़ेगा।`)
        : c.s(`The nearest of the five in your chart is ${absent.sort((a, b) => ([1, 4, 7, 10].includes(b.house) ? 1 : 0) - ([1, 4, 7, 10].includes(a.house) ? 1 : 0))[0].yoga}: ${c.pl(absent[0].planet)} is ${c.dg(absent[0].dignity)} in ${c.ho(absent[0].house)}, so it misses on ${[1, 4, 7, 10].includes(absent[0].house) ? c.s("dignity", "बल") : c.s("house position", "भाव स्थिति")}. This matters less than it sounds — the yoga is a bonus, and its absence removes nothing from the chart.`,
              `पाँचों में आपकी कुंडली में सबसे निकट ${absent[0].yoga} है: ${c.pl(absent[0].planet)} ${c.dg(absent[0].dignity)} भाव ${absent[0].house} में है, अतः ${[1, 4, 7, 10].includes(absent[0].house) ? "बल" : "भाव स्थिति"} की शर्त छूट जाती है। इसका महत्व उतना नहीं — योग अतिरिक्त लाभ है, उसका अभाव कुंडली से कुछ घटाता नहीं।`),
      c.s(
        `On the arishta side — the combinations that describe strain rather than status — ${arishtaPresent.length ? `${arishtaPresent.length} are present: ${arishtaPresent.map((d) => `${d.name} (${d.reason})`).join("; ")}` : `none of ${arishta.length} tested is present: ${arishta.map((d) => d.name).join(", ")} all fail their conditions in your chart`}. ${f.moonYogas.kemadruma ? c.s("The Moon being unflanked is the one to note — it asks you to build your own support system rather than expect one.", "चंद्र का असहाय होना ध्यान देने योग्य है — यह कहता है कि सहारा स्वयं बनाना होगा।") : ""}`,
        `अरिष्ट पक्ष में — जो योग प्रतिष्ठा नहीं, कष्ट बताते हैं — ${arishtaPresent.length ? `${arishtaPresent.length} उपस्थित हैं: ${arishtaPresent.map((d) => `${d.name} (${d.reason})`).join("; ")}` : `जाँचे गए ${arishta.length} में कोई नहीं: ${arishta.map((d) => d.name).join(", ")} सभी की शर्तें आपकी कुंडली में पूरी नहीं होतीं`}।`
      )
    ],
    highlights: [
      c.s(`Mahapurusha yogas formed: ${present.length} of 5`, `महापुरुष योग: 5 में ${present.length}`),
      c.s(`Arishta yogas present: ${arishtaPresent.length} of ${arishta.length}`, `अरिष्ट योग: ${arishta.length} में ${arishtaPresent.length}`),
      c.s(`Kemadruma: ${f.moonYogas.kemadruma ? "present" : "absent"}`, `केमद्रुम: ${f.moonYogas.kemadruma ? "उपस्थित" : "अनुपस्थित"}`)
    ],
    bullets: (arishtaPresent.length ? arishtaPresent : f.mahapurusha.filter((m) => m.present)).slice(0, 3).map((x) =>
      c.s(`${x.name || `${x.yoga} Yoga`} — ${x.remedy || c.s("strengthen the planet that forms it", "इसे बनाने वाले ग्रह को बल दें")}`,
          `${x.name || `${x.yoga} योग`} — ${x.remedy || "इसे बनाने वाले ग्रह को बल दें"}`)
    ).concat(present.length || arishtaPresent.length ? [] : [c.s("Neither group is active — your chart is judged on placements alone.", "दोनों वर्ग निष्क्रिय हैं — आपकी कुंडली केवल ग्रह स्थितियों से देखी जाएगी।")]),
    advisory: c.s(
      "These are the two extremes of the classical yoga list; most charts, including strong ones, sit between them.",
      "ये शास्त्रीय योग सूची के दो छोर हैं; अधिकांश कुंडलियाँ, बलवान भी, इनके बीच रहती हैं।"
    ),
    placements: f.natalPlacements
  };
}

function ch47(c, k, f) {
  // The detector emits both languages; pick the one this report is written in.
  // Without this the Hindi chapter interpolated English names and reasons into
  // Hindi sentences and came out 54% English.
  const nm = (d) => (c.hi && d.name_hi) || d.name;
  const rs = (d) => (c.hi && d.reason_hi) || d.reason;
  const rm = (d) => (c.hi && d.remedy_hi) || d.remedy;
  const all = (k.doshas?.list || []).map((d) => ({ ...d, name: nm(d), reason: rs(d), remedy: rm(d) }));
  const present = all.filter((d) => d.present);
  const absent = all.filter((d) => !d.present);
  return {
    subtitle: c.s(`${present.length} of ${all.length} tested doshas found`, `जाँचे गए ${all.length} में ${present.length} दोष मिले`),
    summary: present.length
      ? c.s(`${all.length} classical doshas were tested against your positions and ${present.length} form: ${present.map((d) => d.name).join(", ")}. Each is stated below with the exact reason it applies.`,
             `आपकी स्थितियों पर ${all.length} शास्त्रीय दोष जाँचे गए, जिनमें ${present.length} बनते हैं: ${present.map((d) => d.name).join(", ")}। नीचे प्रत्येक का सटीक कारण दिया है।`)
      : c.s(`${all.length} classical doshas were tested against your positions and none forms. That is stated as plainly as a positive finding would be — the conditions simply are not met in your chart.`,
             `आपकी स्थितियों पर ${all.length} शास्त्रीय दोष जाँचे गए और कोई नहीं बनता। यह उतनी ही स्पष्टता से कहा जा रहा है जितनी किसी दोष के मिलने पर — आपकी कुंडली में शर्तें पूरी ही नहीं होतीं।`),
    body: [
      present.length
        ? c.s(`Present in your chart: ${present.map((d) => `${d.name} — ${d.reason} (severity score ${d.score})`).join("; ")}.`,
              `आपकी कुंडली में उपस्थित: ${present.map((d) => `${d.name} — ${d.reason} (तीव्रता ${d.score})`).join("; ")}।`)
        : c.s(`Every dosha tested and why it does not apply: ${absent.slice(0, 6).map((d) => `${d.name} — ${d.reason}`).join("; ")}.`,
              `प्रत्येक जाँचा गया दोष और क्यों लागू नहीं होता: ${absent.slice(0, 6).map((d) => `${d.name} — ${d.reason}`).join("; ")}।`),
      c.s(
        `Not present, with the reason: ${absent.map((d) => `${d.name} — ${d.reason}`).join("; ")}.`,
        `अनुपस्थित दोष, कारण सहित: ${absent.map((d) => `${d.name} — ${d.reason}`).join("; ")}।`
      ),
      present.length
        ? c.s(`The remedies attached to what was actually found: ${present.filter((d) => d.remedy).map((d) => `${d.name} — ${(c.hi && d.remedy_hi) || d.remedy}`).join("; ")}. A dosha describes a stress in one area of the chart; it does not overwrite the rest of it, and its effect is felt mainly during the dasha of the planets involved.`,
              `जो दोष वास्तव में मिले उनके उपाय: ${present.filter((d) => d.remedy).map((d) => `${d.name} — ${(c.hi && d.remedy_hi) || d.remedy}`).join("; ")}। दोष कुंडली के एक क्षेत्र का तनाव बताता है; वह शेष कुंडली को रद्द नहीं करता, और उसका प्रभाव मुख्यतः संबंधित ग्रहों की दशा में अनुभव होता है।`)
        : c.s("Because no dosha is active, no dosha-specific remedy is needed. The remedies in chapter 63 are drawn instead from your weakest computed placements, which is where effort actually pays in your chart.",
              "कोई दोष सक्रिय न होने से दोष-विशेष उपाय की आवश्यकता नहीं। अध्याय 63 के उपाय आपकी सबसे दुर्बल गणित स्थितियों से लिए गए हैं, जहाँ प्रयास वास्तव में फल देता है।")
    ],
    highlights: [
      c.s(`Manglik: ${k.doshas?.manglik ? "yes" : "no"}`, `मांगलिक: ${k.doshas?.manglik ? "हाँ" : "नहीं"}`),
      c.s(`Kaal Sarp: ${k.doshas?.kaalSarp ? "yes" : "no"}`, `कालसर्प: ${k.doshas?.kaalSarp ? "हाँ" : "नहीं"}`),
      c.s(`Sade Sati: ${k.doshas?.sadeSati ? "yes" : "no"}`, `साढ़ेसाती: ${k.doshas?.sadeSati ? "हाँ" : "नहीं"}`)
    ],
    bullets: present.length
      ? present.slice(0, 5).map((d) => c.s(`${d.name}: ${d.remedy || "monitor during related dashas"}`, `${d.name}: ${(d.remedy_hi || d.remedy) || "संबंधित दशा में सजग रहें"}`))
      : [
          c.s("No dosha-specific ritual is indicated by your chart.", "आपकी कुंडली किसी दोष-विशेष अनुष्ठान का संकेत नहीं देती।"),
          c.s("Use chapter 63 remedies, which target your weakest planets.", "अध्याय 63 के उपाय प्रयोग करें, जो आपके दुर्बल ग्रहों पर केंद्रित हैं।"),
          c.s("Re-check this page if your birth time is ever corrected.", "जन्म समय सुधरने पर यह पृष्ठ पुनः देखें।")
        ],
    advisory: c.s(
      "Every line on this page names the rule it applied and the position it applied it to — nothing here is assumed.",
      "इस पृष्ठ की हर पंक्ति उस नियम और स्थिति का नाम देती है जिस पर वह लागू हुआ — यहाँ कुछ भी अनुमान नहीं है।"
    ),
    placements: f.natalPlacements
  };
}

// ── 48–51: the dasha sequence ────────────────────────────────────────────────

function ch48(c, k, f) {
  const moon = f.P("Moon");
  const rows = f.timeline.map((m) => `${c.pl(m.mahaDasha)} ${m.start} – ${m.end} (${DASHA_YEARS[m.mahaDasha]}y)`);
  const active = f.activeMaha;
  const past = f.timeline.filter((m) => m.endDate && m.endDate < f.now).length;
  return {
    subtitle: c.s("All nine major periods with dates", "सभी नौ महादशाएँ तिथियों सहित"),
    summary: c.s(
      `Your dasha sequence starts from ${c.pl(moon.nakshatraLord)}, the lord of ${c.nk(moon.nakshatra)}, because your Moon was in that nakshatra at birth. You are currently in the ${c.pl(active.mahaDasha)} mahadasha, running ${active.start} to ${active.end}.`,
      `आपका दशा क्रम ${c.pl(moon.nakshatraLord)} से आरंभ होता है, जो ${c.nk(moon.nakshatra)} का स्वामी है, क्योंकि जन्म के समय चंद्र उसी नक्षत्र में था। वर्तमान में ${c.pl(active.mahaDasha)} महादशा चल रही है, ${active.start} से ${active.end} तक।`
    ),
    body: [
      c.s(
        `The Vimshottari cycle runs 120 years in a fixed order, each planet holding a fixed span. Your full sequence: ${rows.join("; ")}. ${past} of the nine have already completed.`,
        `विंशोत्तरी चक्र 120 वर्ष का है, निश्चित क्रम में, प्रत्येक ग्रह की निश्चित अवधि। आपका पूर्ण क्रम: ${rows.join("; ")}। नौ में से ${past} पूर्ण हो चुकी हैं।`
      ),
      c.s(
        `The starting point is not arbitrary. Your Moon at ${dms(moon.degree)} of ${c.sg(moon.sign)} had crossed part of ${c.nk(moon.nakshatra)} by the time you were born, and that fraction is exactly how much of the ${c.pl(moon.nakshatraLord)} mahadasha had already elapsed — which is why your first period began part-used rather than at its start.`,
        `आरंभ बिंदु मनमाना नहीं है। जन्म के समय आपका चंद्र ${c.sg(moon.sign)} के ${dms(moon.degree)} पर ${c.nk(moon.nakshatra)} का कुछ भाग पार कर चुका था, और वही अंश बताता है कि ${c.pl(moon.nakshatraLord)} महादशा का कितना भाग बीत चुका था — इसीलिए आपकी पहली दशा आरंभ से नहीं, बीच से मिली।`
      ),
      c.s(
        `The planet ruling a period gives the results of the houses it owns and the house it sits in. Your current lord ${c.pl(active.mahaDasha)} sits in ${c.ho(f.P(active.mahaDasha).house)} and rules ${(f.lordships[active.mahaDasha] || []).map((h) => c.ho(h)).join(", ") || c.s("no house (shadow planet)", "कोई भाव नहीं (छाया ग्रह)")}. The next mahadasha, ${c.pl(f.timeline[(f.timeline.indexOf(active) + 1) % 9].mahaDasha)}, begins ${active.end} — that is the next real change of season in your chart.`,
        `दशा स्वामी उन भावों का फल देता है जिनका वह स्वामी है और जिस भाव में बैठा है। वर्तमान स्वामी ${c.pl(active.mahaDasha)} भाव ${f.P(active.mahaDasha).house} में है और ${(f.lordships[active.mahaDasha] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव का नहीं (छाया ग्रह)"} का स्वामी है। अगली महादशा ${c.pl(f.timeline[(f.timeline.indexOf(active) + 1) % 9].mahaDasha)} की ${active.end} से आरंभ होगी — यही आपकी कुंडली की अगली वास्तविक ऋतु-परिवर्तन है।`
      )
    ],
    highlights: [
      c.s(`Sequence begins with ${c.pl(moon.nakshatraLord)}`, `क्रम ${c.pl(moon.nakshatraLord)} से आरंभ`),
      c.s(`Running: ${c.pl(active.mahaDasha)} until ${active.end}`, `चल रही है: ${c.pl(active.mahaDasha)}, ${active.end} तक`),
      c.s(`${past} of 9 mahadashas completed`, `9 में से ${past} महादशाएँ पूर्ण`)
    ],
    bullets: [
      c.s("A mahadasha sets the season; the antardasha inside it sets the month-to-month weather.", "महादशा ऋतु तय करती है; भीतर की अंतर्दशा मासिक मौसम।"),
      c.s(`Mark ${active.end} — your next major period change.`, `${active.end} अंकित करें — अगला बड़ा दशा परिवर्तन।`),
      c.s("See chapter 50 for the sub-periods inside the current one.", "वर्तमान दशा की अंतर्दशाओं के लिए अध्याय 50 देखें।")
    ],
    advisory: c.s(
      "Dates here are computed on the classical 120-year cycle from your Moon's exact degree — they shift if your birth time changes.",
      "यहाँ की तिथियाँ आपके चंद्र के सटीक अंश से 120-वर्षीय शास्त्रीय चक्र पर निकाली गई हैं — जन्म समय बदलने पर ये बदल जाती हैं।"
    )
  };
}

function ch49(c, k, f) {
  const m = f.activeMaha;
  const lord = f.P(m.mahaDasha);
  const st = f.strength.find((s) => s.planet === m.mahaDasha);
  const rules = f.lordships[m.mahaDasha] || [];
  const total = m.endDate && m.startDate ? (m.endDate - m.startDate) : 0;
  const elapsed = total ? Math.round(((f.now - m.startDate) / total) * 100) : null;
  const sav = f.savRankOf(lord.house);
  return {
    subtitle: c.s(`${c.pl(m.mahaDasha)}: ${m.start} – ${m.end}`, `${c.pl(m.mahaDasha)}: ${m.start} – ${m.end}`),
    summary: c.s(
      `You are ${elapsed}% through the ${c.pl(m.mahaDasha)} mahadasha. Its lord sits ${c.dg(dignityOf(lord))} in ${c.sg(lord.sign)} in ${c.ho(lord.house)} and rules ${rules.map((h) => c.ho(h)).join(", ") || c.none}, so those are the matters this whole period is about.`,
      `${c.pl(m.mahaDasha)} महादशा का ${elapsed}% भाग बीत चुका है। इसका स्वामी ${c.dg(dignityOf(lord))} ${c.sg(lord.sign)} में भाव ${lord.house} में है और ${rules.map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी है, अतः यही विषय पूरी दशा के केंद्र में हैं।`
    ),
    body: [
      c.s(
        `${c.pl(m.mahaDasha)} runs ${m.start} to ${m.end}. In your chart it is at ${dms(lord.degree)} of ${c.sg(lord.sign)}, ${c.dg(dignityOf(lord))}, in ${c.ho(lord.house)} — ${c.domain(lord.house)} — in ${c.nk(lord.nakshatra)} pada ${lord.pada}. ${st ? `Its computed strength is ${st.score} of 100, rank ${f.strength.findIndex((s) => s.planet === m.mahaDasha) + 1} in your chart, so it delivers ${st.score >= 65 ? c.s("readily", "सहजता से") : st.score >= 45 ? c.s("steadily but not quickly", "स्थिर रूप से, शीघ्र नहीं") : c.s("only against effort", "केवल प्रयास से")}.` : "As a shadow planet it has no classical strength score; it acts through its dispositor and the planets it sits with."}`,
        `${c.pl(m.mahaDasha)} ${m.start} से ${m.end} तक चलती है। आपकी कुंडली में यह ${c.sg(lord.sign)} के ${dms(lord.degree)} पर, ${c.dg(dignityOf(lord))}, भाव ${lord.house} में — ${c.domain(lord.house)} — ${c.nk(lord.nakshatra)} चरण ${lord.pada} में है। ${st ? `इसका गणित बल ${st.score}/100 है, कुंडली में ${f.strength.findIndex((s) => s.planet === m.mahaDasha) + 1} वाँ स्थान।` : "छाया ग्रह होने से इसका शास्त्रीय बल अंक नहीं; यह अपने राशि स्वामी एवं सहचरों से फल देता है।"}`
      ),
      c.s(
        `A dasha lord gives the results of the houses it rules, delivered through the house it occupies. Here that means ${rules.length ? `${rules.map((h) => c.domain(h)).join("; ")} — arriving through ${c.domain(lord.house)}` : `matters of ${c.domain(lord.house)}, since a node rules no house of its own`}. The house it sits in carries ${sav ? `${sav.score} bindus (rank ${sav.rank} of 12)` : "no bindu score"}, which is ${sav && sav.score >= 28 ? c.s("at or above average support", "औसत या उससे अधिक सहारा") : c.s("below average support, so results need method", "औसत से कम सहारा, अतः विधि आवश्यक")}. ${lord.retrograde && !["Rahu", "Ketu"].includes(lord.name) ? c.s("It is retrograde, which classically delays the timing while deepening the result.", "यह वक्री है, जो शास्त्रानुसार समय में विलंब पर फल में गहराई देता है।") : ""}`,
        `दशा स्वामी उन भावों का फल देता है जिनका वह स्वामी है, और उस भाव के माध्यम से जिसमें वह बैठा है। यहाँ इसका अर्थ है ${rules.length ? `${rules.map((h) => c.domain(h)).join("; ")} — जो ${c.domain(lord.house)} से आते हैं` : `${c.domain(lord.house)} के विषय`}। जिस भाव में यह है उसमें ${sav ? `${sav.score} बिंदु हैं (12 में ${sav.rank} स्थान)` : "बिंदु उपलब्ध नहीं"}। ${lord.retrograde && !["Rahu", "Ketu"].includes(lord.name) ? "यह वक्री है, जो विलंब पर गहराई देता है।" : ""}`
      ),
      c.s(
        `The sub-period running inside it right now is ${c.pl(k.dashas.currentAntarDasha)}${f.currentAntar ? `, from ${f.currentAntar.start} to ${f.currentAntar.end}` : ""}, with ${c.pl(k.dashas.currentPratyantarDasha)} as the finer sub-sub-period. ${c.pl(k.dashas.currentAntarDasha)} sits in ${c.ho(f.P(k.dashas.currentAntarDasha).house)} and rules ${(f.lordships[k.dashas.currentAntarDasha] || []).map((h) => c.ho(h)).join(", ") || c.none} — the combination of the two is what decides what actually surfaces this year.`,
        `इसके भीतर वर्तमान अंतर्दशा ${c.pl(k.dashas.currentAntarDasha)} की है${f.currentAntar ? `, ${f.currentAntar.start} से ${f.currentAntar.end} तक` : ""}, और प्रत्यंतर ${c.pl(k.dashas.currentPratyantarDasha)} का। ${c.pl(k.dashas.currentAntarDasha)} भाव ${f.P(k.dashas.currentAntarDasha).house} में है और ${(f.lordships[k.dashas.currentAntarDasha] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी — दोनों का मेल ही तय करता है कि इस वर्ष क्या सामने आएगा।`
      )
    ],
    highlights: [
      c.s(`${elapsed}% elapsed, ends ${m.end}`, `${elapsed}% बीत चुका, समाप्ति ${m.end}`),
      c.s(`Lord in ${c.ho(lord.house)}, ${c.dg(dignityOf(lord))}`, `स्वामी भाव ${lord.house} में, ${c.dg(dignityOf(lord))}`),
      c.s(`Rules ${rules.map((h) => c.ho(h)).join(", ") || c.none}`, `स्वामित्व: ${rules.map((h) => `भाव ${h}`).join(", ") || "कोई नहीं"}`)
    ],
    bullets: [
      c.s(`Do ${c.pl(m.mahaDasha)}'s remedies on ${c.weekday(m.mahaDasha)}.`, `${c.pl(m.mahaDasha)} के उपाय ${c.weekday(m.mahaDasha)} को करें।`),
      c.s(`Mantra: ${MANTRA_OF(m.mahaDasha, false)}`, `मंत्र: ${MANTRA_OF(m.mahaDasha, true)}`),
      c.s(`Expect the theme of ${c.domain(lord.house)} throughout.`, `पूरे काल में ${c.domain(lord.house)} का विषय प्रमुख रहेगा।`)
    ],
    advisory: c.s(
      `Plan around ${m.end} — after that date a different planet sets the terms.`,
      `${m.end} को ध्यान में रखकर योजना बनाएँ — उसके बाद दूसरा ग्रह नियम तय करेगा।`
    )
  };
}

function ch50(c, k, f) {
  const rows = f.antarInCurrentMaha;
  const active = rows.find((w) => w.active);
  const future = rows.filter((w) => !w.past && !w.active);
  return {
    subtitle: c.s(`Sub-periods inside the ${c.pl(f.activeMaha.mahaDasha)} mahadasha`, `${c.pl(f.activeMaha.mahaDasha)} महादशा की अंतर्दशाएँ`),
    summary: c.s(
      `The ${c.pl(f.activeMaha.mahaDasha)} mahadasha divides into nine sub-periods. ${active ? `You are in the ${c.pl(active.antar)} sub-period, ${active.start} to ${active.end}.` : ""} ${future.length} sub-period${future.length === 1 ? "" : "s"} remain in this mahadasha.`,
      `${c.pl(f.activeMaha.mahaDasha)} महादशा नौ अंतर्दशाओं में बँटती है। ${active ? `वर्तमान में ${c.pl(active.antar)} अंतर्दशा चल रही है, ${active.start} से ${active.end} तक।` : ""} इस महादशा में ${future.length} अंतर्दशाएँ शेष हैं।`
    ),
    body: [
      c.s(
        `Full sub-period table for this mahadasha: ${rows.map((w) => `${c.pl(w.antar)} ${w.start} – ${w.end}${w.active ? c.s(" (running now)", " (वर्तमान)") : w.past ? c.s(" (past)", " (बीत चुकी)") : ""}`).join("; ")}.`,
        `इस महादशा की पूर्ण अंतर्दशा तालिका: ${rows.map((w) => `${c.pl(w.antar)} ${w.start} – ${w.end}${w.active ? " (वर्तमान)" : w.past ? " (बीत चुकी)" : ""}`).join("; ")}।`
      ),
      active
        ? c.s(`The running sub-period lord ${c.pl(active.antar)} is ${c.dg(dignityOf(f.P(active.antar)))} in ${c.sg(f.P(active.antar).sign)}, ${c.ho(f.P(active.antar).house)}, ruling ${(f.lordships[active.antar] || []).map((h) => c.ho(h)).join(", ") || c.none}. Combined with the mahadasha lord in ${c.ho(f.P(f.activeMaha.mahaDasha).house)}, the live themes are ${c.domain(f.P(active.antar).house)} inside the larger frame of ${c.domain(f.P(f.activeMaha.mahaDasha).house)}.`,
              `वर्तमान अंतर्दशा स्वामी ${c.pl(active.antar)} ${c.dg(dignityOf(f.P(active.antar)))} ${c.sg(f.P(active.antar).sign)} में, भाव ${f.P(active.antar).house} में है, और ${(f.lordships[active.antar] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी है। महादशा स्वामी भाव ${f.P(f.activeMaha.mahaDasha).house} में होने से वर्तमान विषय ${c.domain(f.P(active.antar).house)} हैं, ${c.domain(f.P(f.activeMaha.mahaDasha).house)} के बड़े ढाँचे के भीतर।`)
        : c.s("No sub-period of this mahadasha is currently marked active in the computed window, which happens at the boundary between two periods.", "गणना की गई अवधि में इस महादशा की कोई अंतर्दशा वर्तमान में सक्रिय नहीं दिख रही, जो दो कालों की संधि पर होता है।"),
      future.length
        ? c.s(`Still to come: ${future.map((w) => `${c.pl(w.antar)} from ${w.start}`).join(", ")}. Each of these lords brings the matters of the houses it rules to the front — ${future.slice(0, 3).map((w) => `${c.pl(w.antar)}: ${(f.lordships[w.antar] || []).map((h) => c.domain(h)).join(", ") || c.domain(f.P(w.antar).house)}`).join("; ")}.`,
              `शेष: ${future.map((w) => `${c.pl(w.antar)} ${w.start} से`).join(", ")}। प्रत्येक स्वामी अपने भावों के विषय सामने लाता है — ${future.slice(0, 3).map((w) => `${c.pl(w.antar)}: ${(f.lordships[w.antar] || []).map((h) => c.domain(h)).join(", ") || c.domain(f.P(w.antar).house)}`).join("; ")}।`)
        : c.s("This mahadasha is in its final sub-period; the next change is the mahadasha change itself.", "यह महादशा अपनी अंतिम अंतर्दशा में है; अगला परिवर्तन महादशा का ही होगा।")
    ],
    highlights: [
      active ? c.s(`Running: ${c.pl(active.antar)} until ${active.end}`, `वर्तमान: ${c.pl(active.antar)}, ${active.end} तक`) : c.s("Period boundary", "दशा संधि"),
      c.s(`${future.length} sub-periods remaining`, `${future.length} अंतर्दशाएँ शेष`),
      c.s(`Mahadasha ends ${f.activeMaha.end}`, `महादशा समाप्ति ${f.activeMaha.end}`)
    ],
    bullets: rows.filter((w) => !w.past).slice(0, 4).map((w) =>
      c.s(`${c.pl(w.antar)} ${w.start} – ${w.end}`, `${c.pl(w.antar)} ${w.start} – ${w.end}`)
    ),
    advisory: c.s(
      "Sub-period changes are where plans should change — they move every one to three years, unlike the mahadasha.",
      "योजना अंतर्दशा बदलने पर बदलनी चाहिए — ये महादशा के विपरीत हर एक से तीन वर्ष में बदलती हैं।"
    )
  };
}

function ch51(c, k, f) {
  const ps = f.pratyantars.slice(0, 14);
  const active = ps.find((p) => p.active);
  return {
    subtitle: c.s("Month-level periods, dated", "मासिक स्तर की दशाएँ, तिथियों सहित"),
    summary: c.s(
      `The next 24 months break into ${ps.length} pratyantar periods — the third level of the dasha system. ${active ? `The one running now is ${c.pl(active.maha)}–${c.pl(active.antar)}–${c.pl(active.pratyantar)}, until ${active.end}.` : ""}`,
      `अगले 24 महीने ${ps.length} प्रत्यंतर दशाओं में बँटते हैं — दशा पद्धति का तीसरा स्तर। ${active ? `वर्तमान में ${c.pl(active.maha)}–${c.pl(active.antar)}–${c.pl(active.pratyantar)} चल रही है, ${active.end} तक।` : ""}`
    ),
    body: [
      c.s(
        `The dated sequence: ${ps.map((p) => `${c.pl(p.pratyantar)} (in ${c.pl(p.antar)}) ${p.start} – ${p.end}`).join("; ")}.`,
        `तिथिबद्ध क्रम: ${ps.map((p) => `${c.pl(p.pratyantar)} (${c.pl(p.antar)} में) ${p.start} – ${p.end}`).join("; ")}।`
      ),
      c.s(
        `A pratyantar is short — weeks to a few months — so it does not change the direction of your life, it decides which week a thing lands in. The pattern to use: when the pratyantar lord also rules the house you care about, that is the window to act. ${ps.length ? `For example ${c.pl(ps[0].pratyantar)}, running from ${ps[0].start}, rules ${(f.lordships[ps[0].pratyantar] || []).map((h) => c.ho(h)).join(", ") || c.s("no house", "कोई भाव नहीं")} and sits in ${c.ho(f.P(ps[0].pratyantar).house)}.` : ""}`,
        `प्रत्यंतर छोटी होती है — कुछ सप्ताह से कुछ माह — अतः यह जीवन की दिशा नहीं बदलती, केवल यह तय करती है कि कोई बात किस सप्ताह घटेगी। उपयोग का नियम: जब प्रत्यंतर स्वामी उसी भाव का स्वामी हो जिसकी आपको चिंता है, वही कार्य का समय है। ${ps.length ? `उदाहरणतः ${c.pl(ps[0].pratyantar)}, जो ${ps[0].start} से चलती है, ${(f.lordships[ps[0].pratyantar] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} की स्वामी है और भाव ${f.P(ps[0].pratyantar).house} में है।` : ""}`
      ),
      c.s(
        `Across these 24 months the mahadasha stays ${c.pl(f.activeMaha.mahaDasha)}${f.activeMaha.endDate && f.activeMaha.endDate.getTime() < f.now.getTime() + 730 * 86400000 ? c.s(` until ${f.activeMaha.end}, after which it changes`, ` ${f.activeMaha.end} तक, उसके बाद बदल जाएगी`) : ""}, so the background does not shift — only the foreground does. Use this page for scheduling, and chapters 49 and 50 for direction.`,
        `इन 24 महीनों में महादशा ${c.pl(f.activeMaha.mahaDasha)} की ही रहती है${f.activeMaha.endDate && f.activeMaha.endDate.getTime() < f.now.getTime() + 730 * 86400000 ? ` ${f.activeMaha.end} तक, उसके बाद बदलेगी` : ""}, अतः पृष्ठभूमि नहीं बदलती — केवल अग्रभूमि बदलती है। इस पृष्ठ का उपयोग समय-निर्धारण के लिए करें, दिशा के लिए अध्याय 49 एवं 50।`
      )
    ],
    highlights: [
      active ? c.s(`Now: ${c.pl(active.pratyantar)} until ${active.end}`, `वर्तमान: ${c.pl(active.pratyantar)}, ${active.end} तक`) : c.s("Between periods", "दो दशाओं के बीच"),
      c.s(`${ps.length} periods in the next 24 months`, `अगले 24 महीनों में ${ps.length} दशाएँ`),
      c.s(`Mahadasha throughout: ${c.pl(f.activeMaha.mahaDasha)}`, `पूरे काल में महादशा: ${c.pl(f.activeMaha.mahaDasha)}`)
    ],
    bullets: ps.slice(0, 5).map((p) => c.s(`${c.pl(p.pratyantar)}: ${p.start} – ${p.end}`, `${c.pl(p.pratyantar)}: ${p.start} – ${p.end}`)),
    advisory: c.s(
      "Use pratyantar dates to choose the week, never to decide whether a thing should happen at all.",
      "प्रत्यंतर तिथियों से सप्ताह चुनें, यह निर्णय नहीं कि कार्य करना है या नहीं।"
    )
  };
}

// ── 52–54: transits ──────────────────────────────────────────────────────────

function transitChapter(c, k, f, cfg) {
  const t = cfg.transit;
  const natal = f.P(cfg.planet);
  const extra = cfg.extra ? cfg.extra(c, k, f) : null;
  if (!t) {
    return {
      subtitle: c.s("Transit position unavailable", "गोचर स्थिति उपलब्ध नहीं"),
      summary: c.s(`The current transit sign for ${c.pl(cfg.planet)} was not returned by the engine, so this chapter reports only the natal position.`,
                   `${c.pl(cfg.planet)} की वर्तमान गोचर राशि इंजन से प्राप्त नहीं हुई, अतः यह अध्याय केवल जन्म स्थिति बताता है।`),
      body: [c.s(`Natally ${c.pl(cfg.planet)} is ${c.dg(dignityOf(natal))} in ${c.sg(natal.sign)}, ${c.ho(natal.house)}.`,
                 `जन्म कुंडली में ${c.pl(cfg.planet)} ${c.dg(dignityOf(natal))} ${c.sg(natal.sign)} में, भाव ${natal.house} में है।`)],
      highlights: [], bullets: [], advisory: "",
      placements: [{ planet: cfg.planet, abbr: ABBR[cfg.planet], sign: natal.sign, house: natal.house, degree: dms(natal.degree) }]
    };
  }
  const sav = f.savRankOf(t.fromLagna);
  return {
    subtitle: c.s(`Currently in ${c.sg(t.sign)}`, `वर्तमान में ${c.sg(t.sign)} में`),
    summary: c.s(
      `${c.pl(cfg.planet)} is transiting ${c.sg(t.sign)} — your ${ORDINAL[t.fromLagna]} house from the Lagna and the ${ORDINAL[t.fromMoon]} from your Moon. Natally it sits in ${c.sg(natal.sign)}, ${c.ho(natal.house)}.`,
      `${c.pl(cfg.planet)} ${c.sg(t.sign)} में गोचर कर रहा है — लग्न से ${t.fromLagna}वाँ भाव और चंद्र से ${t.fromMoon}वाँ। जन्म कुंडली में यह ${c.sg(natal.sign)} में, भाव ${natal.house} में है।`
    ),
    body: [
      c.s(
        `A transit is read from the Moon as much as from the Lagna. From your Lagna ${c.pl(cfg.planet)} is now crossing house ${t.fromLagna} — ${c.domain(t.fromLagna)} — which carries ${sav ? `${sav.score} bindus` : "no bindu score"}. From your Moon it is crossing the ${t.fromMoon}th, so ${c.domain(t.fromMoon)} is where your attention is being pulled emotionally.`,
        `गोचर लग्न के साथ चंद्र से भी देखा जाता है। लग्न से ${c.pl(cfg.planet)} अब भाव ${t.fromLagna} पर है — ${c.domain(t.fromLagna)} — जिसमें ${sav ? `${sav.score} बिंदु` : "बिंदु उपलब्ध नहीं"} हैं। चंद्र से यह ${t.fromMoon}वें में है, अतः ${c.domain(t.fromMoon)} की ओर मन खिंचता है।`
      ),
      c.s(
        `${c.pl(cfg.planet)} aspects ${(cfg.planet === "Saturn" ? [3, 7, 10] : [5, 7, 9]).map((o) => `house ${((t.fromLagna - 1 + o - 1) % 12) + 1}`).join(", ")} from where it is transiting, so those areas feel it too. Its natal position — ${c.dg(dignityOf(natal))} in ${c.ho(natal.house)}, ruling ${(f.lordships[cfg.planet] || []).map((h) => c.ho(h)).join(", ") || c.s("no house", "कोई भाव नहीं")} — decides how you experience the transit: a planet strong at birth handles its own transit better.`,
        `${c.pl(cfg.planet)} गोचर स्थान से ${(cfg.planet === "Saturn" ? [3, 7, 10] : [5, 7, 9]).map((o) => `भाव ${((t.fromLagna - 1 + o - 1) % 12) + 1}`).join(", ")} पर दृष्टि डालता है, अतः वे क्षेत्र भी प्रभावित हैं। इसकी जन्म स्थिति — ${c.dg(dignityOf(natal))}, भाव ${natal.house} में, ${(f.lordships[cfg.planet] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी — तय करती है कि गोचर कैसा अनुभव होगा।`
      ),
      extra || c.s(
        `${c.pl(cfg.planet)} will remain in ${c.sg(t.sign)} for the rest of this passage before moving to the next sign, at which point the house it acts on shifts by one. Read this together with your dasha: a transit only produces a visible event when a dasha of the same planet, or of the lord of the house it is crossing, is also running.`,
        `${c.pl(cfg.planet)} इस गोचर काल में ${c.sg(t.sign)} में रहेगा और अगली राशि में जाने पर प्रभावित भाव एक स्थान आगे खिसक जाएगा। इसे अपनी दशा के साथ पढ़ें: गोचर तभी दृश्य घटना देता है जब उसी ग्रह की, या जिस भाव से वह गुजर रहा है उसके स्वामी की, दशा भी चल रही हो।`
      )
    ],
    highlights: [
      c.s(`${c.pl(cfg.planet)} in ${c.sg(t.sign)} — house ${t.fromLagna} from Lagna`, `${c.pl(cfg.planet)} ${c.sg(t.sign)} में — लग्न से भाव ${t.fromLagna}`),
      c.s(`House ${t.fromMoon} from the Moon`, `चंद्र से भाव ${t.fromMoon}`),
      c.s(`Natal: ${c.sg(natal.sign)}, ${c.ho(natal.house)}, ${c.dg(dignityOf(natal))}`, `जन्म: ${c.sg(natal.sign)}, भाव ${natal.house}, ${c.dg(dignityOf(natal))}`)
    ],
    bullets: [
      c.s(`Matters of ${c.domain(t.fromLagna)} are live right now.`, `${c.domain(t.fromLagna)} के विषय इस समय सक्रिय हैं।`),
      c.s(`${c.weekday(cfg.planet)} is this planet's weekday for remedies.`, `उपाय के लिए ${c.weekday(cfg.planet)} इस ग्रह का दिन है।`),
      c.s(`A transit alone is not an event — check the dasha in chapter 50.`, `केवल गोचर घटना नहीं है — अध्याय 50 में दशा देखें।`)
    ],
    advisory: c.s(
      `Transit and dasha have to agree before something actually happens — this page is only one half of the answer.`,
      `कोई घटना तभी होती है जब गोचर एवं दशा एकमत हों — यह पृष्ठ उत्तर का आधा भाग है।`
    ),
    placements: [
      { planet: cfg.planet, abbr: ABBR[cfg.planet], sign: t.sign, house: t.fromLagna, degree: c.s("transit", "गोचर") },
      { planet: cfg.planet, abbr: ABBR[cfg.planet], sign: natal.sign, house: natal.house, degree: dms(natal.degree) }
    ]
  };
}

// Sade Sati phase names and phase status come out of the engine in English.
const SS_PHASE = { Aroh: ["Aroh (rising)", "आरोह"], Madhya: ["Madhya (peak)", "मध्य"], Avaroh: ["Avaroh (setting)", "अवरोह"] };
const SS_STATUS = { past: ["past", "बीत चुका"], active: ["running", "चल रहा"], future: ["upcoming", "आगामी"] };

function sadeSatiExtra(c, k, f) {
  const ss = f.sadeSati;
  const ph = (n) => (c.hi ? (SS_PHASE[n]?.[1] ?? n) : (SS_PHASE[n]?.[0] ?? n));
  const stt = (n) => (c.hi ? (SS_STATUS[n]?.[1] ?? n) : (SS_STATUS[n]?.[0] ?? n));
  if (!ss) return c.s("The Sade Sati window could not be computed for this chart.", "इस कुंडली के लिए साढ़ेसाती की अवधि गणना नहीं हो सकी।");
  if (ss.active) {
    return c.s(
      `Sade Sati is running: your window is ${ss.startDate} to ${ss.endDate}, ${ss.overallProgress}% complete, currently in the ${ph(ss.currentPhase)} phase with ${ss.daysRemaining} days left overall. The phases computed for you: ${ss.phases.map((p) => `${ph(p.name)} in ${c.sg(p.saturnSign)} (${p.startDate} – ${p.endDate}, ${stt(p.status)})`).join("; ")}.`,
      `साढ़ेसाती चल रही है: आपकी अवधि ${ss.startDate} से ${ss.endDate} तक है, ${ss.overallProgress}% पूर्ण, वर्तमान में ${ph(ss.currentPhase)} चरण, कुल ${ss.daysRemaining} दिन शेष। आपके लिए गणना किए गए चरण: ${ss.phases.map((p) => `${ph(p.name)} ${c.sg(p.saturnSign)} में (${p.startDate} – ${p.endDate}, ${stt(p.status)})`).join("; ")}।`
    );
  }
  return c.s(
    `Sade Sati is not running for you right now. ${ss.startDate ? `The window computed nearest to today is ${ss.startDate} to ${ss.endDate}, beginning with the ${ss.upcomingPhase ? ph(ss.upcomingPhase) : "first"} phase.` : ss.note}`,
    `इस समय आपकी साढ़ेसाती नहीं चल रही। ${ss.startDate ? `आज के सबसे निकट गणना की गई अवधि ${ss.startDate} से ${ss.endDate} तक है।` : (ss.note_hi || ss.note)}`
  );
}

function ch54(c, k, f) {
  const r = f.transits.rahu; const ke = f.transits.ketu;
  const nr = f.P("Rahu"); const nk = f.P("Ketu");
  if (!r || !ke) {
    return {
      subtitle: c.s("Node transit unavailable", "छाया ग्रह गोचर उपलब्ध नहीं"),
      summary: c.s("The engine did not return current node positions, so only the natal axis is reported here.", "इंजन से वर्तमान छाया ग्रह स्थिति प्राप्त नहीं हुई, अतः यहाँ केवल जन्म अक्ष दिया है।"),
      body: [c.s(`Natal axis: Rahu in ${c.sg(nr.sign)} (${c.ho(nr.house)}), Ketu in ${c.sg(nk.sign)} (${c.ho(nk.house)}).`,
                 `जन्म अक्ष: राहु ${c.sg(nr.sign)} में (भाव ${nr.house}), केतु ${c.sg(nk.sign)} में (भाव ${nk.house})।`)],
      highlights: [], bullets: [], advisory: "",
      placements: [
        { planet: "Rahu", abbr: "Ra", sign: nr.sign, house: nr.house, degree: dms(nr.degree) },
        { planet: "Ketu", abbr: "Ke", sign: nk.sign, house: nk.house, degree: dms(nk.degree) }
      ]
    };
  }
  const returning = r.sign === nr.sign;
  const reversed = r.sign === nk.sign;
  return {
    subtitle: c.s(`Rahu in ${c.sg(r.sign)}, Ketu in ${c.sg(ke.sign)}`, `राहु ${c.sg(r.sign)} में, केतु ${c.sg(ke.sign)} में`),
    summary: c.s(
      `The nodes are transiting your ${ORDINAL[r.fromLagna]} and ${ORDINAL[ke.fromLagna]} houses from the Lagna (${ORDINAL[r.fromMoon]} and ${ORDINAL[ke.fromMoon]} from the Moon). Your natal axis is Rahu in ${c.sg(nr.sign)} (${c.ho(nr.house)}) and Ketu in ${c.sg(nk.sign)} (${c.ho(nk.house)}).`,
      `छाया ग्रह लग्न से आपके ${r.fromLagna}वें और ${ke.fromLagna}वें भाव में गोचर कर रहे हैं (चंद्र से ${r.fromMoon}वाँ एवं ${ke.fromMoon}वाँ)। आपका जन्म अक्ष राहु ${c.sg(nr.sign)} में (भाव ${nr.house}) एवं केतु ${c.sg(nk.sign)} में (भाव ${nk.house}) है।`
    ),
    body: [
      c.s(
        `Rahu is crossing house ${r.fromLagna} — ${c.domain(r.fromLagna)} — and Ketu the opposite house ${ke.fromLagna} — ${c.domain(ke.fromLagna)}. The nodes always work as a pair: wherever Rahu is, appetite and activity increase; the opposite house, held by Ketu, tends to thin out and get neglected. That trade-off is the practical content of a node transit.`,
        `राहु भाव ${r.fromLagna} से गुजर रहा है — ${c.domain(r.fromLagna)} — और केतु सामने के भाव ${ke.fromLagna} से — ${c.domain(ke.fromLagna)}। छाया ग्रह सदा जोड़े में काम करते हैं: जहाँ राहु हो वहाँ इच्छा एवं गतिविधि बढ़ती है; सामने का भाव, जहाँ केतु है, उपेक्षित रहता है। यही अदला-बदली छाया गोचर का व्यावहारिक अर्थ है।`
      ),
      c.s(
        `${returning ? c.s(`Transit Rahu is back in the sign it occupied at your birth (${c.sg(nr.sign)}) — a nodal return, which happens roughly every eighteen years and re-opens the themes of ${c.domain(nr.house)}.`, `गोचर राहु आपकी जन्म राशि (${c.sg(nr.sign)}) में लौट आया है — नोड रिटर्न, जो लगभग हर अठारह वर्ष में आता है और ${c.domain(nr.house)} के विषय पुनः खोलता है।`) : reversed ? c.s(`Transit Rahu is now in the sign your natal Ketu occupies (${c.sg(nk.sign)}) — the reversal point of the eighteen-year cycle, when what you had let go of returns for a second look.`, `गोचर राहु अब उस राशि में है जहाँ आपका जन्म केतु है (${c.sg(nk.sign)}) — अठारह वर्षीय चक्र का उलटाव बिंदु।`) : c.s(`Transit Rahu is neither on your natal Rahu nor on your natal Ketu, so this is an ordinary passage of the axis rather than a return or a reversal.`, `गोचर राहु न आपके जन्म राहु पर है न जन्म केतु पर, अतः यह अक्ष का सामान्य गोचर है।`)} Natal Rahu is in ${c.nk(nr.nakshatra)} pada ${nr.pada} and natal Ketu in ${c.nk(nk.nakshatra)} pada ${nk.pada}.`,
        `${returning ? `गोचर राहु आपकी जन्म राशि (${c.sg(nr.sign)}) में लौटा है — नोड रिटर्न।` : reversed ? `गोचर राहु आपके जन्म केतु की राशि (${c.sg(nk.sign)}) में है — चक्र का उलटाव बिंदु।` : "गोचर राहु न जन्म राहु पर है न जन्म केतु पर — सामान्य गोचर।"} जन्म राहु ${c.nk(nr.nakshatra)} चरण ${nr.pada} में और जन्म केतु ${c.nk(nk.nakshatra)} चरण ${nk.pada} में है।`
      ),
      c.s(
        `House ${r.fromLagna} carries ${f.savRankOf(r.fromLagna)?.score ?? "—"} bindus and house ${ke.fromLagna} carries ${f.savRankOf(ke.fromLagna)?.score ?? "—"}, which tells you how much reserve each side of the axis has while the nodes sit on them. ${k.doshas?.kaalSarp ? c.s("Kaal Sarp is present natally, so node transits register more strongly in your chart than they would otherwise.", "जन्म कुंडली में कालसर्प है, अतः छाया गोचर आपकी कुंडली में सामान्य से अधिक प्रभाव डालते हैं।") : c.s("Kaal Sarp is not present natally, so the nodes act through these houses alone rather than over the whole chart.", "जन्म कुंडली में कालसर्प नहीं है, अतः छाया ग्रह पूरी कुंडली पर नहीं, इन्हीं भावों से काम करते हैं।")}`,
        `भाव ${r.fromLagna} में ${f.savRankOf(r.fromLagna)?.score ?? "—"} बिंदु और भाव ${ke.fromLagna} में ${f.savRankOf(ke.fromLagna)?.score ?? "—"} बिंदु हैं। ${k.doshas?.kaalSarp ? "जन्म कुंडली में कालसर्प है, अतः छाया गोचर अधिक प्रभावी हैं।" : "जन्म कुंडली में कालसर्प नहीं है।"}`
      )
    ],
    highlights: [
      c.s(`Rahu transiting house ${r.fromLagna}`, `राहु का गोचर भाव ${r.fromLagna} में`),
      c.s(`Ketu transiting house ${ke.fromLagna}`, `केतु का गोचर भाव ${ke.fromLagna} में`),
      c.s(`Natal axis: houses ${nr.house} / ${nk.house}`, `जन्म अक्ष: भाव ${nr.house} / ${nk.house}`)
    ],
    bullets: [
      c.s(`Rahu's house (${r.fromLagna}) expands — keep it in check.`, `राहु का भाव (${r.fromLagna}) बढ़ता है — संयम रखें।`),
      c.s(`Ketu's house (${ke.fromLagna}) thins — protect it consciously.`, `केतु का भाव (${ke.fromLagna}) क्षीण होता है — सजगता से रक्षा करें।`),
      c.s("The nodes move backwards, so they leave a house as quietly as they entered it.", "छाया ग्रह वक्र चलते हैं, अतः जिस चुपचाप ढंग से आते हैं उसी तरह जाते हैं।")
    ],
    advisory: c.s(
      "Node transits change what you want, not what you have — decisions made under them are worth revisiting later.",
      "छाया गोचर आपकी इच्छा बदलते हैं, आपकी संपत्ति नहीं — इस काल के निर्णय बाद में पुनः देखने योग्य होते हैं।"
    ),
    placements: [
      { planet: "Rahu", abbr: "Ra", sign: r.sign, house: r.fromLagna, degree: c.s("transit", "गोचर") },
      { planet: "Ketu", abbr: "Ke", sign: ke.sign, house: ke.fromLagna, degree: c.s("transit", "गोचर") },
      { planet: "Rahu", abbr: "Ra", sign: nr.sign, house: nr.house, degree: dms(nr.degree) },
      { planet: "Ketu", abbr: "Ke", sign: nk.sign, house: nk.house, degree: dms(nk.degree) }
    ]
  };
}

// ── 55–62: the eight life areas ──────────────────────────────────────────────

function lifeAreaChapter(c, k, f, cfg) {
  const primary = cfg.houses[0];
  const H = f.H(primary);
  const lord = f.P(H.lord);
  const karaka = f.P(cfg.karaka);
  const v = f.varga(cfg.divisor);
  const kv = v.at(cfg.karaka);
  const sav = f.savRankOf(primary);
  const occ = H.occupants;
  const asp = (f.aspectsOnHouse[primary] || []).filter((a) => !occ.includes(a));
  const topic = c.s(cfg.topicEn, cfg.topicHi);

  // Dated windows ruled by the planets that actually carry this subject.
  const roles = {};
  roles[H.lord] = `${primary}`;
  roles[cfg.karaka] = "karaka";
  for (const h of cfg.houses.slice(1)) roles[f.H(h).lord] = `${h}`;
  const windows = ACTIVATING(f.antarWindows, roles, { limit: 5 });
  const secondaryLines = cfg.houses.slice(1).map((h) =>
    c.s(`house ${h} (${c.domain(h)}) is ${c.sg(f.H(h).sign)}, its lord ${c.pl(f.H(h).lord)} in ${c.ho(f.P(f.H(h).lord).house)}`,
        `भाव ${h} (${c.domain(h)}) ${c.sg(f.H(h).sign)} है, स्वामी ${c.pl(f.H(h).lord)} भाव ${f.P(f.H(h).lord).house} में`)
  );

  return {
    subtitle: c.s(`House ${cfg.houses.join(", ")} · ${c.pl(cfg.karaka)} · D${cfg.divisor}`, `भाव ${cfg.houses.join(", ")} · ${c.pl(cfg.karaka)} · D${cfg.divisor}`),
    summary: c.s(
      `${topic} is read from house ${primary} (${c.sg(H.sign)}, lord ${c.pl(H.lord)} in ${c.ho(lord.house)}), from ${c.pl(cfg.karaka)} as its significator (${c.dg(dignityOf(karaka))} in ${c.ho(karaka.house)}), and from the D${cfg.divisor}. House ${primary} carries ${sav ? `${sav.score} bindus, rank ${sav.rank} of 12` : "no bindu score"}.`,
      `${topic} भाव ${primary} (${c.sg(H.sign)}, स्वामी ${c.pl(H.lord)} भाव ${lord.house} में), कारक ${c.pl(cfg.karaka)} (${c.dg(dignityOf(karaka))}, भाव ${karaka.house} में) एवं D${cfg.divisor} से देखा जाता है। भाव ${primary} में ${sav ? `${sav.score} बिंदु हैं, 12 में ${sav.rank} स्थान` : "बिंदु उपलब्ध नहीं"}।`
    ),
    body: [
      c.s(
        `House ${primary} is ${c.sg(H.sign)}. ${occ.length ? `It holds ${occ.map((o) => `${c.pl(o)} (${c.dg(dignityOf(f.P(o)))})`).join(", ")}, which act on ${topic} directly.` : "No planet occupies it, so it is judged from its lord and its aspects."} Its lord ${c.pl(H.lord)} is ${c.dg(dignityOf(lord))} in ${c.sg(lord.sign)}, ${c.ho(lord.house)}, which routes ${topic} through ${c.domain(lord.house)}. ${asp.length ? c.s(`${asp.map((a) => c.pl(a)).join(", ")} aspect${asp.length > 1 ? "" : "s"} the house.`, `${asp.map((a) => c.pl(a)).join(", ")} की दृष्टि इस भाव पर है।`) : c.s("No planet aspects it from elsewhere.", "बाहर से कोई दृष्टि नहीं है।")} Supporting houses: ${secondaryLines.join("; ")}.`,
        `भाव ${primary} ${c.sg(H.sign)} है। ${occ.length ? `इसमें ${occ.map((o) => `${c.pl(o)} (${c.dg(dignityOf(f.P(o)))})`).join(", ")} हैं, जो ${topic} पर सीधे कार्य करते हैं।` : "इसमें कोई ग्रह नहीं, अतः स्वामी एवं दृष्टियों से देखा जाता है।"} स्वामी ${c.pl(H.lord)} ${c.dg(dignityOf(lord))} ${c.sg(lord.sign)} में, भाव ${lord.house} में है, जिससे ${topic} ${c.domain(lord.house)} के मार्ग से आता है। ${asp.length ? `${asp.map((a) => c.pl(a)).join(", ")} की दृष्टि है।` : "बाहर से कोई दृष्टि नहीं।"} सहायक भाव: ${secondaryLines.join("; ")}।`
      ),
      c.s(
        `${c.pl(cfg.karaka)}, the natural significator of ${topic}, is ${c.dg(dignityOf(karaka))} at ${dms(karaka.degree)} of ${c.sg(karaka.sign)} in ${c.ho(karaka.house)}, in ${c.nk(karaka.nakshatra)} pada ${karaka.pada}. In the D${cfg.divisor} — the divisional chart for this subject — it moves to ${c.sg(kv.sign)}, house ${kv.house}, and the D${cfg.divisor} lagna is ${c.sg(v.lagnaSign)} ruled by ${c.pl(v.lagnaLord)}. ${v.vargottama.includes(cfg.karaka) ? c.s("It is vargottama here, which is the strongest confirmation a divisional can give.", "यह यहाँ वर्गोत्तम है, जो वर्ग कुंडली की सबसे बलवान पुष्टि है।") : v.debilitated.includes(cfg.karaka) ? c.s("It falls to debilitation in the divisional, so results in this area need more support than the birth chart alone suggests.", "यह वर्ग में नीच का हो जाता है, अतः इस क्षेत्र में जन्म कुंडली से अधिक सहारा चाहिए।") : c.s("Birth chart and divisional broadly agree here.", "जन्म कुंडली एवं वर्ग कुंडली यहाँ सहमत हैं।")}`,
        `${topic} का नैसर्गिक कारक ${c.pl(cfg.karaka)} ${c.dg(dignityOf(karaka))} ${c.sg(karaka.sign)} के ${dms(karaka.degree)} पर भाव ${karaka.house} में, ${c.nk(karaka.nakshatra)} चरण ${karaka.pada} में है। इस विषय की वर्ग कुंडली D${cfg.divisor} में यह ${c.sg(kv.sign)}, भाव ${kv.house} में आता है, और D${cfg.divisor} लग्न ${c.sg(v.lagnaSign)} है, स्वामी ${c.pl(v.lagnaLord)}। ${v.vargottama.includes(cfg.karaka) ? "यह यहाँ वर्गोत्तम है।" : v.debilitated.includes(cfg.karaka) ? "यह वर्ग में नीच का है।" : "जन्म एवं वर्ग कुंडली यहाँ सहमत हैं।"}`
      ),
      windows.length
        ? c.s(
            `Timing. The dasha periods ruled by the planets that carry this subject (${Object.keys(roles).map((p) => c.pl(p)).join(", ")}) are: ${windows.map((w) => `${c.pl(w.maha)}–${c.pl(w.antar)} ${w.start} – ${w.end}${w.active ? " (running now)" : ""}`).join("; ")}. These are the windows in which ${topic} actually moves — outside them the same effort produces less.`,
            `समय। जो ग्रह इस विषय को वहन करते हैं (${Object.keys(roles).map((p) => c.pl(p)).join(", ")}) उनकी दशाएँ: ${windows.map((w) => `${c.pl(w.maha)}–${c.pl(w.antar)} ${w.start} – ${w.end}${w.active ? " (वर्तमान)" : ""}`).join("; ")}। इन्हीं अवधियों में ${topic} वास्तव में गति करता है — इनके बाहर वही प्रयास कम फल देता है।`
          )
        : c.s(
            `No dasha window in the computed ±25-year range is ruled by ${Object.keys(roles).map((p) => c.pl(p)).join(", ")}, the planets that carry this subject. That does not mean nothing happens here — it means this area moves through transits and through the general mahadasha rather than through a period of its own.`,
            `गणना की गई ±25 वर्ष की अवधि में इस विषय के ग्रहों (${Object.keys(roles).map((p) => c.pl(p)).join(", ")}) की कोई दशा नहीं आती। इसका अर्थ यह नहीं कि यहाँ कुछ नहीं होगा — अर्थ यह है कि यह क्षेत्र अपनी दशा से नहीं, गोचर एवं सामान्य महादशा से चलेगा।`
          )
    ],
    highlights: [
      c.s(`House ${primary} ${c.sg(H.sign)}, lord ${c.pl(H.lord)} in ${c.ho(lord.house)}`, `भाव ${primary} ${c.sg(H.sign)}, स्वामी ${c.pl(H.lord)} भाव ${lord.house} में`),
      c.s(`${c.pl(cfg.karaka)} ${c.dg(dignityOf(karaka))} in ${c.ho(karaka.house)}`, `${c.pl(cfg.karaka)} ${c.dg(dignityOf(karaka))} भाव ${karaka.house} में`),
      c.s(`Bindus ${sav ? sav.score : "—"} · D${cfg.divisor} lagna ${c.sg(v.lagnaSign)}`, `बिंदु ${sav ? sav.score : "—"} · D${cfg.divisor} लग्न ${c.sg(v.lagnaSign)}`)
    ],
    bullets: [
      c.s(`Strengthen ${c.pl(cfg.karaka)} on ${c.weekday(cfg.karaka)}.`, `${c.weekday(cfg.karaka)} को ${c.pl(cfg.karaka)} को बल दें।`),
      c.s(`Progress comes through ${c.domain(lord.house)}.`, `प्रगति ${c.domain(lord.house)} के मार्ग से आती है।`),
      windows.length
        ? c.s(`Act during ${c.pl(windows[0].maha)}–${c.pl(windows[0].antar)} (${windows[0].start}).`, `${c.pl(windows[0].maha)}–${c.pl(windows[0].antar)} (${windows[0].start}) में कार्य करें।`)
        : c.s("Watch transits over this house rather than waiting for a dasha.", "दशा की प्रतीक्षा के बजाय इस भाव पर गोचर देखें।")
    ],
    advisory: c.s(
      `House ${primary}, ${c.pl(cfg.karaka)} and the D${cfg.divisor} must agree before a result in ${topic} is dependable — in your chart ${[occ.length || asp.length, ["exalted", "own", "moolatrikona", "friend"].includes(dignityOf(karaka)), !v.debilitated.includes(cfg.karaka)].filter(Boolean).length} of those three support it.`,
      `${topic} का फल तभी विश्वसनीय है जब भाव ${primary}, ${c.pl(cfg.karaka)} एवं D${cfg.divisor} तीनों सहमत हों — आपकी कुंडली में इनमें से ${[occ.length || asp.length, ["exalted", "own", "moolatrikona", "friend"].includes(dignityOf(karaka)), !v.debilitated.includes(cfg.karaka)].filter(Boolean).length} सहमत हैं।`
    ),
    placements: v.placements
  };
}

const LIFE_CFG = [
  { houses: [10, 6, 11], karaka: "Saturn",  divisor: 10, topicEn: "career and profession",   topicHi: "करियर एवं व्यवसाय" },
  { houses: [2, 11, 9],  karaka: "Jupiter", divisor: 2,  topicEn: "wealth and finance",      topicHi: "धन एवं वित्त" },
  { houses: [7, 2, 12],  karaka: "Venus",   divisor: 9,  topicEn: "marriage and partnership", topicHi: "विवाह एवं साझेदारी" },
  { houses: [5, 2, 9],   karaka: "Jupiter", divisor: 7,  topicEn: "children and family",     topicHi: "संतान एवं परिवार" },
  { houses: [6, 1, 8],   karaka: "Saturn",  divisor: 30, topicEn: "health and longevity",    topicHi: "स्वास्थ्य एवं आयु" },
  { houses: [4, 5, 9],   karaka: "Mercury", divisor: 24, topicEn: "education and learning",  topicHi: "शिक्षा एवं अध्ययन" },
  { houses: [4, 11, 2],  karaka: "Venus",   divisor: 4,  topicEn: "property and vehicles",   topicHi: "संपत्ति एवं वाहन" },
  { houses: [12, 9, 5],  karaka: "Ketu",    divisor: 20, topicEn: "the spiritual path",      topicHi: "आध्यात्मिक मार्ग" }
];

// ── 63–64 ────────────────────────────────────────────────────────────────────

function ch63(c, k, f) {
  const weak = f.strength.slice(-2);
  const strong = f.strength[0];
  const lagnaLord = f.ascLord;
  const fifthLord = f.H(5).lord;
  const ninthLord = f.H(9).lord;
  const doshaRemedies = (k.doshas?.list || [])
    .filter((d) => d.present && d.remedy)
    .map((d) => ({ ...d, name: (c.hi && d.name_hi) || d.name, remedy: (c.hi && d.remedy_hi) || d.remedy }));
  const num = k.numerology || {};
  return {
    subtitle: c.s("Drawn from your weakest computed placements", "आपकी दुर्बलतम गणित स्थितियों से"),
    summary: c.s(
      `Your two weakest planets by computed strength are ${weak.map((w) => `${c.pl(w.planet)} (${w.score}/100)`).join(" and ")}. The remedies below target those, plus the ${doshaRemedies.length} dosha${doshaRemedies.length === 1 ? "" : "s"} actually found in your chart — nothing is prescribed for a condition you do not have.`,
      `गणित बल के अनुसार आपके दो सबसे दुर्बल ग्रह ${weak.map((w) => `${c.pl(w.planet)} (${w.score}/100)`).join(" एवं ")} हैं। नीचे दिए उपाय इन्हीं पर केंद्रित हैं, तथा आपकी कुंडली में वास्तव में मिले ${doshaRemedies.length} दोष पर — जो स्थिति आपकी कुंडली में नहीं, उसके लिए कोई उपाय नहीं दिया गया।`
    ),
    body: [
      c.s(
        `${c.pl(weak[0].planet)} is your weakest at ${weak[0].score} of 100 — ${c.dg(weak[0].dignity)} in ${c.ho(f.P(weak[0].planet).house)}, ruling ${(f.lordships[weak[0].planet] || []).map((h) => c.ho(h)).join(", ") || c.none}. Its weekday is ${c.weekday(weak[0].planet)}, its mantra is ${MANTRA_OF(weak[0].planet, c.hi)}, and its stone is ${c.gem(weak[0].planet)}. ${c.pl(weak[1].planet)} follows at ${weak[1].score}, with ${c.weekday(weak[1].planet)} and ${MANTRA_OF(weak[1].planet, c.hi)}.`,
        `${c.pl(weak[0].planet)} सबसे दुर्बल है (${weak[0].score}/100) — ${c.dg(weak[0].dignity)}, भाव ${f.P(weak[0].planet).house} में, ${(f.lordships[weak[0].planet] || []).map((h) => `भाव ${h}`).join(", ") || "किसी भाव"} का स्वामी। इसका दिन ${c.weekday(weak[0].planet)}, मंत्र ${MANTRA_OF(weak[0].planet, c.hi)}, रत्न ${c.gem(weak[0].planet)}। इसके बाद ${c.pl(weak[1].planet)} (${weak[1].score}), दिन ${c.weekday(weak[1].planet)}, मंत्र ${MANTRA_OF(weak[1].planet, c.hi)}।`
      ),
      c.s(
        `On gemstones the classical rule reads three lords: your Lagna lord ${c.pl(lagnaLord)} gives the life stone (${c.gem(lagnaLord)}), your 5th lord ${c.pl(fifthLord)} the benefic stone (${c.gem(fifthLord)}), and your 9th lord ${c.pl(ninthLord)} the lucky stone (${c.gem(ninthLord)}). These follow from your Lagna being ${c.sg(f.ascSign)} — they would be different stones for a different Lagna, which is why a stone should never be chosen by sun sign alone.`,
        `रत्नों में शास्त्रीय नियम तीन स्वामियों से चलता है: लग्नेश ${c.pl(lagnaLord)} से जीवन रत्न (${c.gem(lagnaLord)}), पंचमेश ${c.pl(fifthLord)} से भाग्यवर्धक रत्न (${c.gem(fifthLord)}), एवं नवमेश ${c.pl(ninthLord)} से भाग्य रत्न (${c.gem(ninthLord)})। ये आपके लग्न ${c.sg(f.ascSign)} से निकले हैं — भिन्न लग्न पर रत्न भी भिन्न होते, इसीलिए रत्न केवल सूर्य राशि से नहीं चुना जाता।`
      ),
      doshaRemedies.length
        ? c.s(`For the doshas actually present: ${doshaRemedies.map((d) => `${d.name} — ${(c.hi && d.remedy_hi) || d.remedy}`).join("; ")}. Do these during the dasha of the planet involved, when the condition is live rather than dormant.`,
              `जो दोष वास्तव में उपस्थित हैं उनके लिए: ${doshaRemedies.map((d) => `${d.name} — ${(c.hi && d.remedy_hi) || d.remedy}`).join("; ")}। इन्हें संबंधित ग्रह की दशा में करें, जब वह स्थिति सक्रिय हो।`)
        : c.s(`No dosha is active in your chart, so no dosha ritual is prescribed. Your practical support is the strongest planet instead: ${c.pl(strong.planet)} at ${strong.score} of 100, in ${c.ho(f.P(strong.planet).house)} — keep its weekday ${c.weekday(strong.planet)} for important beginnings. Your numerology values, computed from your name and birth date, give life path ${num.lifePathNumber}, destiny number ${num.destinyNumber}, lucky day ${c.tm(num.luckyDay)} and lucky colour ${c.tm(num.luckyColor)}.`,
              `आपकी कुंडली में कोई दोष सक्रिय नहीं, अतः कोई दोष अनुष्ठान नहीं दिया गया। इसके स्थान पर आपका सहारा सबसे बलवान ग्रह है: ${c.pl(strong.planet)} (${strong.score}/100), भाव ${f.P(strong.planet).house} में — महत्वपूर्ण आरंभ के लिए इसका दिन ${c.weekday(strong.planet)} रखें। आपके नाम एवं जन्म तिथि से निकले अंक: मूलांक ${num.lifePathNumber}, भाग्यांक ${num.destinyNumber}, शुभ दिन ${c.tm(num.luckyDay)}, शुभ रंग ${c.tm(num.luckyColor)}।`)
    ],
    highlights: [
      c.s(`Weakest: ${c.pl(weak[0].planet)} ${weak[0].score}/100`, `सबसे दुर्बल: ${c.pl(weak[0].planet)} ${weak[0].score}/100`),
      c.s(`Life stone ${c.gem(lagnaLord)} (Lagna lord ${c.pl(lagnaLord)})`, `जीवन रत्न ${c.gem(lagnaLord)} (लग्नेश ${c.pl(lagnaLord)})`),
      c.s(`Doshas needing remedy: ${doshaRemedies.length}`, `उपाय योग्य दोष: ${doshaRemedies.length}`)
    ],
    bullets: [
      c.s(`${c.weekday(weak[0].planet)}: chant ${MANTRA_OF(weak[0].planet, c.hi)} for ${c.pl(weak[0].planet)}.`, `${c.weekday(weak[0].planet)}: ${c.pl(weak[0].planet)} के लिए ${MANTRA_OF(weak[0].planet, c.hi)} का जप करें।`),
      c.s(`${c.weekday(weak[1].planet)}: chant ${MANTRA_OF(weak[1].planet, c.hi)} for ${c.pl(weak[1].planet)}.`, `${c.weekday(weak[1].planet)}: ${c.pl(weak[1].planet)} के लिए ${MANTRA_OF(weak[1].planet, c.hi)} का जप करें।`),
      c.s(`Consult before wearing ${c.gem(lagnaLord)} — a stone strengthens whatever the planet already does.`, `${c.gem(lagnaLord)} धारण करने से पहले परामर्श लें — रत्न ग्रह जो कर रहा है उसी को बढ़ाता है।`),
      ...doshaRemedies.slice(0, 2).map((d) => c.s(`${d.name}: ${d.remedy}`, `${d.name}: ${d.remedy_hi || d.remedy}`))
    ],
    advisory: c.s(
      "Remedies support a weak planet; they do not replace the effort the chart already asks for in that area.",
      "उपाय दुर्बल ग्रह को सहारा देते हैं; वे उस क्षेत्र में कुंडली द्वारा माँगे गए प्रयास का स्थान नहीं लेते।"
    )
  };
}

function ch64(c, k, f) {
  const m = f.activeMaha;
  const lord = f.P(m.mahaDasha);
  const rules = f.lordships[m.mahaDasha] || [];
  const relevant = rules.length ? rules : [lord.house];
  const chapterFor = (h) => 6 + h;
  const strong = f.savRank[0]; const weak = f.savRank[f.savRank.length - 1];
  return {
    subtitle: c.s("Where to start, and what to re-read", "कहाँ से आरंभ करें, और क्या पुनः पढ़ें"),
    summary: c.s(
      `Because your ${c.pl(m.mahaDasha)} mahadasha runs until ${m.end}, the chapters that matter most to you right now are the ones for ${relevant.map((h) => `house ${h} (chapter ${chapterFor(h)})`).join(", ")} — the houses that period actually governs.`,
      `आपकी ${c.pl(m.mahaDasha)} महादशा ${m.end} तक चलती है, अतः इस समय आपके लिए सबसे महत्वपूर्ण अध्याय वे हैं जो ${relevant.map((h) => `भाव ${h} (अध्याय ${chapterFor(h)})`).join(", ")} के हैं — इसी दशा के अधीन भाव।`
    ),
    body: [
      c.s(
        `Read in this order: chapter 5 for your Lagna, chapter 6 for your Moon, then chapter ${chapterFor(relevant[0])} for the house your current dasha lord rules. After that, chapter 49 for the period you are in and chapter 50 for the sub-period. Those five pages answer most of what you came for; everything else is depth.`,
        `इस क्रम से पढ़ें: लग्न के लिए अध्याय 5, चंद्र के लिए अध्याय 6, फिर वर्तमान दशा स्वामी के भाव के लिए अध्याय ${chapterFor(relevant[0])}। उसके बाद वर्तमान दशा के लिए अध्याय 49 और अंतर्दशा के लिए अध्याय 50। ये पाँच पृष्ठ अधिकांश प्रश्नों का उत्तर देते हैं; शेष गहराई के लिए है।`
      ),
      c.s(
        `When two chapters seem to disagree, the order of authority is: the birth chart first, then the divisional chart for that subject, then the dasha, then the transit. A transit alone never decides anything. In your chart house ${strong.house} (${strong.score} bindus) has the most support and house ${weak.house} (${weak.score}) the least, so expect effort in ${weak.house} to need more time than the same effort in ${strong.house}.`,
        `जब दो अध्याय भिन्न लगें तो प्रामाणिकता का क्रम है: पहले जन्म कुंडली, फिर उस विषय की वर्ग कुंडली, फिर दशा, फिर गोचर। केवल गोचर कभी निर्णायक नहीं होता। आपकी कुंडली में भाव ${strong.house} (${strong.score} बिंदु) को सर्वाधिक सहारा है और भाव ${weak.house} (${weak.score}) को सबसे कम, अतः भाव ${weak.house} में वही प्रयास अधिक समय माँगेगा।`
      ),
      c.s(
        `Two dates are worth writing down from this report: ${f.currentAntar ? `${f.currentAntar.end}, when your ${c.pl(f.currentAntar.antar)} sub-period ends, and ` : ""}${m.end}, when the ${c.pl(m.mahaDasha)} mahadasha itself ends and ${c.pl(f.timeline[(f.timeline.indexOf(m) + 1) % 9].mahaDasha)} takes over. Re-read chapters 48 to 51 near each of those dates — the chart does not change, but which part of it is active does.`,
        `इस रिपोर्ट से दो तिथियाँ लिख लेने योग्य हैं: ${f.currentAntar ? `${f.currentAntar.end}, जब आपकी ${c.pl(f.currentAntar.antar)} अंतर्दशा समाप्त होगी, और ` : ""}${m.end}, जब ${c.pl(m.mahaDasha)} महादशा समाप्त होकर ${c.pl(f.timeline[(f.timeline.indexOf(m) + 1) % 9].mahaDasha)} की आरंभ होगी। इन तिथियों के निकट अध्याय 48 से 51 पुनः पढ़ें — कुंडली नहीं बदलती, पर उसका कौन सा भाग सक्रिय है, वह बदलता है।`
      )
    ],
    highlights: [
      c.s(`Start with chapters 5, 6 and ${chapterFor(relevant[0])}`, `अध्याय 5, 6 एवं ${chapterFor(relevant[0])} से आरंभ करें`),
      c.s(`Next period change: ${m.end}`, `अगला दशा परिवर्तन: ${m.end}`),
      c.s(`Strongest house ${strong.house}, weakest ${weak.house}`, `सर्वाधिक बलवान भाव ${strong.house}, दुर्बलतम ${weak.house}`)
    ],
    bullets: [
      c.s("Birth chart outranks divisional; divisional outranks dasha; dasha outranks transit.", "जन्म कुंडली वर्ग से ऊपर; वर्ग दशा से ऊपर; दशा गोचर से ऊपर।"),
      c.s(`Re-read chapters 48 to 51 around ${m.end}.`, `${m.end} के आसपास अध्याय 48 से 51 पुनः पढ़ें।`),
      c.s("If your birth time is ever corrected, chapters 31 to 43 change first.", "जन्म समय सुधरने पर सबसे पहले अध्याय 31 से 43 बदलते हैं।")
    ],
    advisory: c.s(
      "This report describes tendencies computed from your chart; it does not replace medical, legal or financial advice.",
      "यह रिपोर्ट आपकी कुंडली से गणना की गई प्रवृत्तियाँ बताती है; यह चिकित्सा, विधि या वित्त की सलाह का स्थान नहीं लेती।"
    ),
    placements: f.natalPlacements
  };
}

// ── assembler ────────────────────────────────────────────────────────────────


export function buildKundliSections(kundliData, language = "en") {
  const c = makeCtx(kundliData, language === "hi" ? "hi" : "en");
  const f = buildChartFacts(kundliData);
  const k = kundliData;
  const out = [];
  let i = 0;
  const add = (part) => { out.push(mk(i, c, part)); i += 1; };

  add(ch1(c, k, f));
  add(ch2(c, k, f));
  add(ch3(c, k, f));
  add(ch4(c, k, f));
  add(ch5(c, k, f));
  add(ch6(c, k, f));
  for (let h = 1; h <= 12; h += 1) add(houseChapter(c, k, f, h));
  for (const g of GRAHAS) add(planetChapter(c, k, f, g));
  add(ch28(c, k, f));
  add(ch29(c, k, f));
  add(ch30(c, k, f));
  for (const cfg of VARGA_CFG) add(vargaChapter(c, k, f, cfg));
  add(ch43(c, k, f));
  add(ch44(c, k, f));
  add(ch45(c, k, f));
  add(ch46(c, k, f));
  add(ch47(c, k, f));
  add(ch48(c, k, f));
  add(ch49(c, k, f));
  add(ch50(c, k, f));
  add(ch51(c, k, f));
  add(transitChapter(c, k, f, { planet: "Saturn", transit: f.transits.saturn, extra: sadeSatiExtra }));
  add(transitChapter(c, k, f, { planet: "Jupiter", transit: f.transits.jupiter }));
  add(ch54(c, k, f));
  for (const cfg of LIFE_CFG) add(lifeAreaChapter(c, k, f, cfg));
  add(ch63(c, k, f));
  add(ch64(c, k, f));

  return language === "hi" ? out.map(localizeDates) : out;
}
