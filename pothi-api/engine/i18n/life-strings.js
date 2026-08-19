// ─────────────────────────────────────────────────────────────────────────────
// Language pack for the Love Chart (id 1) and Health Chart (id 2) reports.
//
// Same contract as forecast-strings.js: every sentence a devotee reads is a
// template here, filled with values computed from their own chart. Nothing is
// written by an LLM, and the Hindi is authored — not machine-translated from
// the English.
//
// The domain vocabulary (which house rules which part of the body, which graha
// signifies which relationship) is classical and fixed; only the placements
// that select it change from chart to chart.
// ─────────────────────────────────────────────────────────────────────────────

import { getPack } from "./forecast-strings.js";

// ── titles ───────────────────────────────────────────────────────────────────
// 24 for Love, 26 for Health — the counts published on astro_chart_listing.

// The Love report is organised around the reader's questions, not the chart's
// components. The old titles were "The 7th House", "Venus", "The Navamsa" — a
// description of a chart rather than an answer to anything, and a reader who
// paid ₹399 to find out whether a relationship will last should not have to
// assemble that answer from nine chapters about planets. The chart is still all
// there; it moved to the back, as evidence.
const LOVE_TITLES = {
  en: [
    "About This Report",
    "Your Relationship, at a Glance",
    "How You Are in Love",
    "What You Actually Need From a Partner",
    "How Your Heart Works",
    "How You Talk, and How You Argue",
    "Attraction and Chemistry",
    "Where the Friction Will Come From",
    "What You Bring to a Relationship",
    "Will It Last?",
    "From Love to Partnership",
    "The Periods That Matter",
    "What to Actually Do",
    "One Last Thing",
    "The Chart Behind This Reading"
  ],
  hi: [
    "इस रिपोर्ट के बारे में",
    "आपका रिश्ता — एक नज़र में",
    "आप प्यार में कैसे हैं",
    "आपको साथी से सच में क्या चाहिए",
    "आपका दिल कैसे काम करता है",
    "आप बात कैसे करते हैं, और झगड़ते कैसे हैं",
    "आकर्षण और केमिस्ट्री",
    "टकराव कहाँ से आएगा",
    "आप रिश्ते में क्या लाते हैं",
    "क्या यह रिश्ता टिकेगा",
    "प्यार से साथ तक",
    "वे समय जो मायने रखते हैं",
    "अब असल में करना क्या है",
    "आख़िरी एक बात",
    "इस पाठ के पीछे की कुंडली"
  ]
};

const HEALTH_TITLES = {
  en: [
    "About This Report",
    "The Significators of Health",
    "Your Constitution — Tatva and Prakriti",
    "The Lagna and Its Lord — Your Vitality",
    "The 6th House — Illness and Resistance",
    "The Lord of Your 6th House",
    "The 8th House — Chronic Matters and Longevity",
    "The 12th House — Rest, Hospitals and Recovery",
    "The Sun — Bones, Heart and Eyes",
    "The Moon — Fluids, Sleep and the Mind",
    "Mars — Blood, Inflammation and Accidents",
    "Mercury — Nerves, Skin and Speech",
    "Jupiter — Liver, Weight and Sugar",
    "Venus — Kidneys and Reproductive Health",
    "Saturn — Joints, Teeth and Chronic Wear",
    "Rahu — The Undiagnosed and the Anxious",
    "Ketu — Immunity and Obscure Ailments",
    "Your Body, House by House",
    "Your Nakshatra and the Body",
    "Ashtakavarga on the Houses of Health",
    "Health Yogas Present in Your Chart",
    "Dasha Periods to Watch",
    "Current Transits and Your Health",
    "Food and Routine for Your Constitution",
    "Remedies and Upay",
    "How to Use This Report",
  ],
  hi: [
    "इस रिपोर्ट के बारे में",
    "स्वास्थ्य के कारक ग्रह",
    "आपकी प्रकृति — तत्व और स्वभाव",
    "लग्न और लग्नेश — आपकी जीवनशक्ति",
    "षष्ठ भाव — रोग और रोग-प्रतिरोध",
    "आपके षष्ठ भाव का स्वामी",
    "अष्टम भाव — पुराने रोग और आयु",
    "द्वादश भाव — विश्राम, चिकित्सालय और स्वास्थ्य-लाभ",
    "सूर्य — अस्थि, हृदय और नेत्र",
    "चंद्रमा — जल-तत्व, निद्रा और मन",
    "मंगल — रक्त, सूजन और दुर्घटना",
    "बुध — स्नायु, त्वचा और वाणी",
    "गुरु — यकृत, भार और मधुमेह",
    "शुक्र — वृक्क और प्रजनन स्वास्थ्य",
    "शनि — संधि, दंत और जीर्ण क्षय",
    "राहु — अनिदान रोग और चिंता",
    "केतु — रोग-प्रतिरोधक क्षमता और गूढ़ रोग",
    "आपका शरीर, भाव दर भाव",
    "आपका नक्षत्र और शरीर",
    "स्वास्थ्य भावों का अष्टकवर्ग",
    "आपकी कुंडली के स्वास्थ्य योग",
    "सावधानी की दशा अवधि",
    "वर्तमान गोचर और आपका स्वास्थ्य",
    "आपकी प्रकृति के अनुसार आहार और दिनचर्या",
    "उपाय और परिहार",
    "इस रिपोर्ट का उपयोग कैसे करें",
  ],
};

// ── domain vocabulary ────────────────────────────────────────────────────────

/** Kalapurusha — the body read house by house. */
const BODY_BY_HOUSE = {
  en: {
    1: "head, brain and overall vitality", 2: "face, eyes, teeth and throat",
    3: "arms, shoulders, ears and breathing", 4: "chest, lungs, heart and the stomach lining",
    5: "upper abdomen, liver and the heart's rhythm", 6: "intestines, digestion and the immune response",
    7: "lower abdomen, kidneys and the urinary tract", 8: "reproductive organs, colon and chronic weakness",
    9: "hips, thighs and the arterial system", 10: "knees, joints and the skeletal frame",
    11: "calves, ankles and the circulation of blood", 12: "feet, sleep, the lymphatic system and the eyes' rest",
  },
  hi: {
    1: "सिर, मस्तिष्क और समग्र जीवनशक्ति", 2: "मुख, नेत्र, दाँत और कंठ",
    3: "भुजाएँ, कंधे, कान और श्वास", 4: "वक्ष, फेफड़े, हृदय और आमाशय",
    5: "ऊपरी उदर, यकृत और हृदय की गति", 6: "आँतें, पाचन और रोग-प्रतिरोधक क्षमता",
    7: "निचला उदर, वृक्क और मूत्र-मार्ग", 8: "जननांग, बड़ी आँत और पुरानी दुर्बलता",
    9: "कटि, जंघा और धमनियाँ", 10: "घुटने, संधियाँ और अस्थि-पंजर",
    11: "पिंडली, टखने और रक्त-संचार", 12: "पैर, निद्रा, लसिका तंत्र और नेत्रों का विश्राम",
  },
};

/** What each graha governs in the body. */
const BODY_BY_PLANET = {
  en: {
    Sun: "bones, the heart, the right eye and general vitality",
    Moon: "body fluids, blood plasma, sleep, the stomach and the mind",
    Mars: "blood, muscle, bone marrow, inflammation and injury",
    Mercury: "the nervous system, skin, speech and the lungs' fine work",
    Jupiter: "the liver, fat, the pancreas and the body's sweetness",
    Venus: "the kidneys, reproductive organs, throat and the skin's lustre",
    Saturn: "joints, teeth, nails, the spleen and everything that wears slowly",
    Rahu: "undiagnosed complaints, poisoning, phobia and nervous unrest",
    Ketu: "immunity, obscure ailments, surgical wounds and sudden flare-ups",
  },
  hi: {
    Sun: "अस्थि, हृदय, दायाँ नेत्र और सामान्य जीवनशक्ति",
    Moon: "शरीर के तरल, रक्त-प्लाज़्मा, निद्रा, आमाशय और मन",
    Mars: "रक्त, मांसपेशी, अस्थि-मज्जा, सूजन और चोट",
    Mercury: "स्नायु तंत्र, त्वचा, वाणी और फेफड़ों का सूक्ष्म कार्य",
    Jupiter: "यकृत, चर्बी, अग्न्याशय और शरीर की मधुरता",
    Venus: "वृक्क, प्रजनन अंग, कंठ और त्वचा की कांति",
    Saturn: "संधियाँ, दाँत, नख, प्लीहा और धीरे-धीरे क्षय होने वाला सब कुछ",
    Rahu: "अनिदान शिकायतें, विषाक्तता, भय और स्नायविक अशांति",
    Ketu: "रोग-प्रतिरोधक क्षमता, गूढ़ रोग, शल्य-घाव और अचानक उभार",
  },
};

/** Elemental constitution by the Moon's sign. */
const TATVA = {
  en: {
    fire: ["Fire (Pitta-leaning)", "sharp digestion, strong appetite, quick temper, heat and acidity when out of balance"],
    earth: ["Earth (Kapha-leaning)", "steady strength, slow metabolism, weight and congestion when out of balance"],
    air: ["Air (Vata-leaning)", "quick movement, light frame, dryness, gas and restless sleep when out of balance"],
    water: ["Water (Kapha–Pitta)", "good reserves, emotional appetite, fluid retention and sluggishness when out of balance"],
  },
  hi: {
    fire: ["अग्नि (पित्त-प्रधान)", "तीव्र पाचन, अच्छी भूख, शीघ्र क्रोध; असंतुलन में गर्मी और अम्लता"],
    earth: ["पृथ्वी (कफ-प्रधान)", "स्थिर बल, मंद चयापचय; असंतुलन में भार-वृद्धि और जकड़न"],
    air: ["वायु (वात-प्रधान)", "शीघ्र गति, हल्का शरीर; असंतुलन में रूक्षता, वायु-विकार और अनिद्रा"],
    water: ["जल (कफ-पित्त)", "अच्छा संचय, भावनात्मक भूख; असंतुलन में जल-संचय और आलस्य"],
  },
};

const SIGN_ELEMENT = {
  Aries: "fire", Leo: "fire", Sagittarius: "fire",
  Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air",
  Cancer: "water", Scorpio: "water", Pisces: "water",
};

/** What a graha in the 7th says about the partner. Classical descriptions. */
const PARTNER_BY_PLANET = {
  en: {
    Sun: "someone with standing and a certain pride — dignified, and not easily led",
    Moon: "someone gentle, changeable and emotionally attentive; the mood of the home will follow theirs",
    Mars: "someone forceful and quick — capable and protective, but the temper is real",
    Mercury: "someone young in manner, clever and talkative; the marriage will be a conversation",
    Jupiter: "someone principled and generous, often older in outlook if not in years",
    Venus: "someone attractive and comfort-loving, drawn to beauty and to peace",
    Saturn: "someone serious and enduring — slow to warm, and steady once warmed",
    Rahu: "someone unconventional, possibly from a different community or place",
    Ketu: "someone private and detached, with a spiritual or unworldly streak",
  },
  hi: {
    Sun: "प्रतिष्ठित और स्वाभिमानी व्यक्ति — गरिमामय, जो सहज ही किसी के पीछे नहीं चलता",
    Moon: "कोमल, परिवर्तनशील और भावनाओं का ध्यान रखने वाला व्यक्ति; घर का वातावरण उनके मन पर निर्भर रहेगा",
    Mars: "तेज और शीघ्र निर्णय लेने वाला व्यक्ति — सक्षम और रक्षक, किंतु क्रोध वास्तविक है",
    Mercury: "व्यवहार में युवा, चतुर और वाचाल व्यक्ति; यह विवाह एक निरंतर संवाद रहेगा",
    Jupiter: "सिद्धांतवादी और उदार व्यक्ति, आयु में न सही तो विचारों में बड़ा",
    Venus: "आकर्षक और सुख-प्रिय व्यक्ति, सौंदर्य और शांति की ओर झुका हुआ",
    Saturn: "गंभीर और धैर्यवान व्यक्ति — देर से खुलने वाला, और खुलने पर स्थिर",
    Rahu: "परंपरा से हटकर, संभवतः भिन्न समुदाय या स्थान से",
    Ketu: "एकांतप्रिय और निर्लिप्त, आध्यात्मिक झुकाव के साथ",
  },
};

const DIRECTION = {
  en: { Sun: "east", Moon: "north-west", Mars: "south", Mercury: "north", Jupiter: "north-east", Venus: "south-east", Saturn: "west", Rahu: "south-west", Ketu: "north-west" },
  hi: { Sun: "पूर्व", Moon: "वायव्य", Mars: "दक्षिण", Mercury: "उत्तर", Jupiter: "ईशान", Venus: "आग्नेय", Saturn: "पश्चिम", Rahu: "नैऋत्य", Ketu: "वायव्य" },
};

const LBL2 = {
  en: {
    verdict: "Verdict", present: "Present", absent: "Not present", cancelled: "Present but cancelled",
    strength: "Strength", strong: "strong", moderate: "workable", weak: "needs support",
    window: "Window", from: "from", to: "to", karaka: "Significator", governs: "Governs",
    reading: "Reading", whatToDo: "What to do", note: "Note", house: "house", lord: "lord",
  },
  hi: {
    verdict: "निर्णय", present: "उपस्थित", absent: "अनुपस्थित", cancelled: "उपस्थित किंतु भंग",
    strength: "बल", strong: "प्रबल", moderate: "मध्यम", weak: "सहारा चाहिए",
    window: "अवधि", from: "से", to: "तक", karaka: "कारक", governs: "अधिकार",
    reading: "फल", whatToDo: "क्या करें", note: "टिप्पणी", house: "भाव", lord: "स्वामी",
  },
};

/**
 * Extends the forecast pack with the love/health vocabulary.
 *
 * Everything the two new reports need that the existing pack does not already
 * provide — sign/planet/dignity naming and the block/kv/ul helpers all come
 * from there unchanged, so the four report families read as one voice.
 */
export function getLifePack(language) {
  const P = getPack(language);
  const L = P.lang;
  return {
    ...P,
    loveTitles: LOVE_TITLES[L],
    healthTitles: HEALTH_TITLES[L],
    bodyByHouse: (h) => BODY_BY_HOUSE[L][h],
    bodyByPlanet: (p) => BODY_BY_PLANET[L][p],
    partnerBy: (p) => PARTNER_BY_PLANET[L][p],
    direction: (p) => DIRECTION[L][p],
    tatva: (sign) => TATVA[L][SIGN_ELEMENT[sign] || "earth"],
    element: (sign) => SIGN_ELEMENT[sign] || "earth",
    l2: LBL2[L],
  };
}

export { LOVE_TITLES, HEALTH_TITLES, BODY_BY_HOUSE, BODY_BY_PLANET, SIGN_ELEMENT };
