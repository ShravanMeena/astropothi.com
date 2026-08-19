// ─────────────────────────────────────────────────────────────────────────────
// Career & Livelihood — 28 chapters.
//
// The report the catalogue was missing. Research on who actually pays for
// astrology in India puts career at the top of the paying cohort's worries, and
// nothing on the shelf answered it: the Kundali covers work in two of sixty-four
// chapters, and Varshaphal answers only "this year".
//
// Written against the Kundali's depth, not the Love report's. A chapter here
// states the rule it is applying, shows the placement it found, and only then
// draws the conclusion — so a reader who knows some jyotish can check the
// working, and one who does not can still see that there was working.
//
// Two things it must never do, both from docs/05-legal.md:
//   · promise a job, a salary, a promotion or a date. It describes what the
//     chart carries and when the chart is active, never an outcome.
//   · name a disease. Nothing here touches health at all.
// ─────────────────────────────────────────────────────────────────────────────

const TITLES = {
  en: [
    "About This Report",
    "Your Chart at Birth",
    "The 10th House — Your Karma Bhava",
    "The Lord of Your 10th House",
    "Saturn — The Significator of Work",
    "The Sun — Authority and Recognition",
    "Mercury — Trade, Skill and Speech",
    "Jupiter — Counsel, Learning and Growth",
    "The 2nd House — What You Earn and Keep",
    "The 6th House — Service, Competition and the Daily Job",
    "The 7th House — Business and Partnership",
    "The 11th House — Gains, Networks and Ambition",
    "The 3rd House — Initiative, Effort and Courage",
    "Dashamsha (D10) — The Chart of Work",
    "Your 10th Lord in the Dashamsha",
    "Amatyakaraka — Your Karaka of Career",
    "Job or Business — What the Chart Leans To",
    "The Field — What Kind of Work This Chart Fits",
    "Ashtakavarga Over the Houses of Work",
    "Raja Yogas in Your Chart",
    "Dhana Yogas — The Combinations for Wealth",
    "Your Strengths at Work",
    "Where the Difficulty Will Come From",
    "When Your Career Moves — Your Dasha Windows",
    "Transits Now Touching Your Houses of Work",
    "Sade Sati and Your Working Life",
    "Remedies for the Karma Bhava",
    "How to Use This Report",
  ],
  hi: [
    "इस रिपोर्ट के विषय में",
    "जन्म के समय आपकी कुंडली",
    "दशम भाव — आपका कर्म भाव",
    "आपके दशम भाव का स्वामी",
    "शनि — कर्म का कारक",
    "सूर्य — अधिकार और प्रतिष्ठा",
    "बुध — व्यापार, कौशल और वाणी",
    "गुरु — परामर्श, विद्या और वृद्धि",
    "द्वितीय भाव — आपकी आय और संचय",
    "षष्ठ भाव — सेवा, प्रतिस्पर्धा और नौकरी",
    "सप्तम भाव — व्यापार और साझेदारी",
    "एकादश भाव — लाभ, संपर्क और महत्वाकांक्षा",
    "तृतीय भाव — पराक्रम, प्रयास और साहस",
    "दशमांश (D10) — कर्म की कुंडली",
    "दशमांश में आपका दशमेश",
    "अमात्यकारक — आपका कर्म-कारक",
    "नौकरी या व्यापार — कुंडली किस ओर झुकी है",
    "क्षेत्र — यह कुंडली किस काम के योग्य है",
    "कर्म-भावों पर अष्टकवर्ग",
    "आपकी कुंडली के राजयोग",
    "धन योग — संपत्ति के संयोग",
    "कार्यक्षेत्र में आपकी शक्तियाँ",
    "कठिनाई कहाँ से आएगी",
    "करियर कब करवट लेगा — आपकी दशा-अवधियाँ",
    "इस समय कर्म-भावों पर गोचर",
    "साढ़े साती और आपका कार्यजीवन",
    "कर्म भाव के उपाय",
    "इस रिपोर्ट का उपयोग कैसे करें",
  ],
};

const nth = {
  en: (n) => ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][n],
  hi: (n) => `${n}वें`,
};

// What each house contributes to a reading of work, said once so the chapters
// do not have to re-explain the vocabulary every time.
const HOUSE_MEANS = {
  en: {
    1: "the body and the will — who is doing the working",
    2: "earned wealth, savings and the family you support",
    3: "initiative, short journeys, the courage to start",
    6: "service, employment, competition and the people you answer to",
    7: "partnership, contracts and the open market",
    10: "profession, standing and the work the world sees",
    11: "gains realised, networks and the ambition behind them",
  },
  hi: {
    1: "शरीर और संकल्प — कार्य करने वाला कौन है",
    2: "अर्जित धन, संचय और पोषित परिवार",
    3: "पराक्रम, अल्प यात्रा, आरंभ करने का साहस",
    6: "सेवा, नौकरी, प्रतिस्पर्धा और अधीनता",
    7: "साझेदारी, अनुबंध और खुला बाज़ार",
    10: "व्यवसाय, प्रतिष्ठा और संसार को दिखने वाला कर्म",
    11: "प्राप्त लाभ, संपर्क और उनके पीछे की महत्वाकांक्षा",
  },
};

const ROUTE_SIGNAL = {
  en: {
    sixthSteady: "your 6th house of service holds together",
    tenthLordInSixth: "the lord of your 10th sits in the 6th — the profession is carried out inside someone else's structure",
    sixthLordInTenth: "the 6th lord occupies the 10th, which puts service at the centre of the career",
    saturnOnTenth: "Saturn aspects the 10th, and Saturn rewards service before it rewards ownership",
    saturnPlacedForService: "Saturn sits in an angle or the 6th, the placement of long employment",
    sunInServiceHouse: "the Sun is in a house of duty, which points at working within an institution",
    seventhStrong: "your 7th house is strong, and the 7th is the open market",
    tenthLordInSeventh: "the lord of your 10th is in the 7th — the profession is conducted with others, not under them",
    seventhLordInTenth: "the 7th lord occupies the 10th, bringing partnership into the profession itself",
    thirdSteady: "your 3rd house of initiative holds, which is what a venture is started on",
    eleventhStrong: "the 11th of gains is strong, and business is paid in gains rather than in salary",
    mercuryDignified: "Mercury is dignified, and Mercury is the graha of trade",
    exchangeWithTenth: "an exchange of lords involves your 10th house, which links the profession directly to gain or to partnership",
  },
  hi: {
    sixthSteady: "आपका षष्ठ भाव — सेवा का भाव — स्थिर है",
    tenthLordInSixth: "दशमेश षष्ठ भाव में है — कार्य किसी और की व्यवस्था के भीतर होता है",
    sixthLordInTenth: "षष्ठेश दशम भाव में है, जिससे सेवा ही कर्म का केंद्र बनती है",
    saturnOnTenth: "शनि की दृष्टि दशम भाव पर है, और शनि स्वामित्व से पहले सेवा का फल देता है",
    saturnPlacedForService: "शनि केंद्र अथवा षष्ठ में है — दीर्घ सेवा का स्थान",
    sunInServiceHouse: "सूर्य कर्तव्य के भाव में है, जो संस्था के भीतर कार्य की ओर संकेत करता है",
    seventhStrong: "आपका सप्तम भाव बलवान है, और सप्तम ही खुला बाज़ार है",
    tenthLordInSeventh: "दशमेश सप्तम भाव में है — कार्य दूसरों के साथ होता है, उनके अधीन नहीं",
    seventhLordInTenth: "सप्तमेश दशम भाव में है, जिससे साझेदारी कर्म में ही आ जाती है",
    thirdSteady: "पराक्रम भाव स्थिर है, और उद्यम इसी पर आरंभ होता है",
    eleventhStrong: "लाभ भाव बलवान है, और व्यापार वेतन से नहीं, लाभ से चलता है",
    mercuryDignified: "बुध बलवान है, और बुध ही वाणिज्य का ग्रह है",
    exchangeWithTenth: "दशम भाव से संबंधित राशि-परिवर्तन योग है, जो कर्म को सीधे लाभ अथवा साझेदारी से जोड़ता है",
  },
};

const FIELD_HI = {
  Sun: "शासन, प्रशासन, चिकित्सा, ऊर्जा — ऐसा पद जिसमें उपाधि हो",
  Moon: "जनसंपर्क, तरल पदार्थ, भोजन, आतिथ्य, सेवा-कार्य, जल-यात्रा, व्यापक जनसमूह से जुड़ा कार्य",
  Mars: "अभियांत्रिकी, सेना और पुलिस, शल्यचिकित्सा, भूमि और भवन, धातु, खेल, औज़ार या जोखिम का कार्य",
  Mercury: "व्यापार, लेखा, लेखन, अध्यापन, संगणक, दलाली — सूचना का आदान-प्रदान",
  Jupiter: "परामर्श, विधि, अध्यापन, वित्त, पौरोहित्य, प्रकाशन — जहाँ विवेक ही उत्पाद हो",
  Venus: "कला, सौंदर्य, वस्त्र, चलचित्र और संगीत, आतिथ्य, विलास-वस्तुएँ — जो दिखने में सुंदर हो",
  Saturn: "श्रम और संरचना, खनन, लोहा, निर्माण, कृषि, दीर्घ सेवा, वृद्ध अथवा निर्धन के लिए कार्य",
  Rahu: "विदेश-संबंध, प्रौद्योगिकी, विमानन, सट्टा, अपरंपरागत व्यवसाय — जो एक पीढ़ी पहले था ही नहीं",
  Ketu: "अनुसंधान, चिकित्सा, आध्यात्मिक कार्य, संगणन, अन्वेषण — भीड़ से अलग किया जाने वाला कार्य",
};

export function buildCareerSections(f, P) {
  const L = P.lang;
  const hi = L === "hi";
  const S = P.stop;
  const sec = [];
  const N = (n) => nth[L](n);
  const pl = (p) => P.planet(p);
  const sg = (s) => P.sign(s);
  const dg = (d) => P.dignity(d);
  // Names have to go through the pack, not straight from the facts: the raw
  // value is English, and "नक्षत्र Magha" two pages after the cover prints "मघा"
  // is exactly the seam that makes a report look machine-assembled.
  const nk = (n) => (typeof P.nakshatra === "function" ? P.nakshatra(n) : n);
  const T = TITLES[L];
  const HM = (h) => HOUSE_MEANS[L][h];
  const grade = (g) => (g === "strong" ? P.l2.strong : g === "weak" ? P.l2.weak : P.l2.moderate);

  const add = (i, body, extra = {}) => sec.push({
    n: i + 1, title: T[i], body,
    ...(extra.placements ? { placements: extra.placements } : {}),
    ...(extra.bullets ? { bullets: extra.bullets } : {}),
    ...(extra.kv ? { kv: extra.kv } : {}),
    ...(extra.data ? { data: extra.data } : {}),
  });

  /** One house, described the same way every time: rule, placement, reading. */
  const houseChapter = (i, h, extraLine) => {
    const occ = h.occupants.length
      ? (hi ? `इस भाव में ${P.planets(h.occupants)} स्थित हैं${S}` : `${P.planets(h.occupants)} sits here.`)
      : (hi ? `इस भाव में कोई ग्रह नहीं — ऐसी स्थिति में निर्णय पूर्णतः स्वामी की स्थिति से होता है${S}` : `No planet occupies it, so the judgement rests entirely on where its lord has gone.`);
    const asp = h.aspects.length
      ? (hi ? `इस पर ${P.planets(h.aspects)} की दृष्टि है${S}` : `${P.planets(h.aspects)} aspects it.`)
      : (hi ? `इस पर किसी ग्रह की दृष्टि नहीं${S}` : `No planet aspects it.`);
    add(i, P.block(
      hi ? `${N(h.house)} भाव ${HM(h.house)} का है${S}` : `The ${N(h.house)} house governs ${HM(h.house)}.`,
      occ, asp,
      hi
        ? `इसका स्वामी ${pl(h.lord)} है, जो ${sg(h.lordSign)} राशि में ${N(h.lordHouse)} भाव में ${dg(h.lordDignity)} अवस्था में है${S}`
        : `Its lord is ${pl(h.lord)}, placed in ${sg(h.lordSign)} in the ${N(h.lordHouse)} house, ${dg(h.lordDignity)}.`,
      h.lordCombust ? (hi ? `स्वामी अस्त है — फल मिलता है पर दिखता कम है${S}` : `The lord is combust: the result arrives but is less visible than it deserves.`) : "",
      h.lordRetrograde ? (hi ? `स्वामी वक्री है — फल विलंब से, किंतु दोहराकर मिलता है${S}` : `The lord is retrograde: results come late, and tend to come round a second time.`) : "",
      extraLine || "",
      hi ? `कुल मिलाकर यह भाव ${grade(h.grade)} है${S}` : `Taken together this house reads as ${grade(h.grade)}.`,
    ), { kv: [["strength", grade(h.grade)], ["lord", pl(h.lord)]], data: { house: h.house, grade: h.grade, score: h.score } });
  };

  /** One graha, judged for what it contributes to working life. */
  const grahaChapter = (i, g, governs, whenStrong, whenWeak) => {
    if (!g) return add(i, hi ? `यह ग्रह गणना में नहीं मिला${S}` : `This graha was not found in the computation.`);
    const good = ["exalted", "own", "moolatrikona"].includes(g.dignity);
    add(i, P.block(
      hi ? `${pl(g.name)} ${governs} का कारक है${S}` : `${pl(g.name)} signifies ${governs}.`,
      hi
        ? `आपकी कुंडली में यह ${sg(g.sign)} राशि में ${N(g.house)} भाव में है, ${dg(g.dignity)} अवस्था में${S}`
        : `In your chart it stands in ${sg(g.sign)}, in the ${N(g.house)} house, ${dg(g.dignity)}.`,
      g.combust ? (hi ? `यह अस्त है — इसका बल भीतर है, बाहर नहीं${S}` : `It is combust, so its strength is felt inwardly rather than seen outwardly.`) : "",
      g.retrograde ? (hi ? `यह वक्री है — इसका फल अपने समय पर, दोबारा लौटकर आता है${S}` : `It is retrograde, so what it gives comes back around rather than arriving once.`) : "",
      good ? whenStrong : whenWeak,
      g.bindus !== null && g.bindus !== undefined
        ? (hi ? `अष्टकवर्ग में इसे ${g.bindus} बिंदु प्राप्त हैं${S}` : `It carries ${g.bindus} bindus in its own Ashtakavarga.`)
        : "",
    ), { kv: [["condition", dg(g.dignity)], ["house", N(g.house)]], data: { planet: g.name, house: g.house, dignity: g.dignity } });
  };

  // ── 1. About ───────────────────────────────────────────────────────────────
  add(0, P.block(
    hi
      ? `यह रिपोर्ट आपकी जन्म कुंडली के उन भागों को पढ़ती है जो जीविका से संबंध रखते हैं — दशम भाव, उसका स्वामी, कर्म के कारक ग्रह, दशमांश कुंडली और वे दशाएँ जिनमें कर्म करवट लेता है${S}`
      : `This report reads the parts of your birth chart that bear on livelihood: the 10th house, its lord, the grahas that signify work, the Dashamsha chart, and the periods in which a career turns.`,
    hi
      ? `प्रत्येक अध्याय पहले वह नियम बताता है जिस पर विचार हो रहा है, फिर आपकी कुंडली की वह स्थिति दिखाता है, और तब निष्कर्ष निकालता है${S} इससे आप स्वयं देख सकते हैं कि उत्तर किस आधार पर बना${S}`
      : `Each chapter states the rule it is applying, shows the placement it found in your chart, and only then draws a conclusion — so you can see what the answer was built from.`,
    hi
      ? `यह रिपोर्ट न नौकरी का वचन देती है, न वेतन का, न किसी तिथि का${S} ज्योतिष प्रवृत्ति बताता है, परिणाम नहीं${S} निर्णय आपका है${S}`
      : `It does not promise a job, a salary or a date. Jyotish describes tendency, not outcome; the decisions stay yours.`,
    hi
      ? `गणना लाहिड़ी अयनांश और सम-भाव पद्धति पर आधारित है, और वही गणना है जिस पर आपकी पूर्ण कुंडली बनती है${S}`
      : `The computation uses the Lahiri ayanamsha and whole-sign houses — the same chart your full Kundali is built from.`,
  ));

  // ── 2. Chart at birth ──────────────────────────────────────────────────────
  add(1, P.block(
    hi
      ? `आपका लग्न ${sg(f.lagnaSign)} है और लग्नेश ${pl(f.lagnaLord)} है${S} चंद्र राशि ${sg(f.moonSign)}, नक्षत्र ${nk(f.nakshatra)}${S}`
      : `Your Lagna is ${sg(f.lagnaSign)} and its lord is ${pl(f.lagnaLord)}. Moon sign ${sg(f.moonSign)}, nakshatra ${nk(f.nakshatra)}.`,
    hi
      ? `नीचे जन्म के समय नौ ग्रहों की स्थिति है${S} इस रिपोर्ट का प्रत्येक निष्कर्ष इसी तालिका से निकला है — कहीं और से नहीं${S}`
      : `Below are the nine grahas as they stood at your birth. Every conclusion in this report is drawn from this table and from nothing else.`,
    hi
      ? `वर्तमान में ${pl(f.dasha.maha)} की महादशा और ${pl(f.dasha.antar)} की अंतर्दशा चल रही है${S}`
      : `You are currently running the ${pl(f.dasha.maha)} mahadasha and ${pl(f.dasha.antar)} antardasha.`,
  ), { placements: f.placements });

  // ── 3–4. Tenth house and its lord ──────────────────────────────────────────
  const h10 = f.houses10;
  houseChapter(2, h10, hi
    ? `दशम भाव कुंडली का सर्वाधिक सक्रिय केंद्र है — यहीं से यह तय होता है कि संसार आपको किस रूप में पहचानेगा${S}`
    : `The 10th is the most active angle in a chart: it decides the form in which the world comes to know you.`);

  const l10 = h10.lordHouse;
  const LORD_IN = {
    en: {
      1: "in the 1st: the work is done in your own name, and your reputation and your profession rise and fall together",
      2: "in the 2nd: the profession converts directly into savings and supports the family",
      3: "in the 3rd: the career is built on your own initiative and repeated effort rather than on position",
      4: "in the 4th: work is tied to home, land, vehicles or the place you are from, and may be conducted from there",
      5: "in the 5th: the profession runs on intelligence, creation or speculation — what you make, not what you are given",
      6: "in the 6th: the profession is carried out inside someone else's structure, and competition is part of the work",
      7: "in the 7th: work is conducted with others in the open market — partnership, contract, dealing",
      8: "in the 8th: the career passes through interruptions and reinventions; what survives them tends to be unusual and hard to replace",
      9: "in the 9th: the work carries an element of teaching, advice, law or long-distance dealing, and fortune supports it",
      10: "in its own house: the profession is unambiguous, and standing is built by the work itself",
      11: "in the 11th: the profession pays in gains and connections, and the network matters as much as the work",
      12: "in the 12th: the work involves distance, foreign places, seclusion or institutions away from the public eye",
    },
    hi: {
      1: "प्रथम भाव में — कार्य आपके अपने नाम से होता है, प्रतिष्ठा और व्यवसाय साथ-साथ उठते-गिरते हैं",
      2: "द्वितीय भाव में — कर्म सीधे संचय में बदलता है और कुटुंब का पोषण करता है",
      3: "तृतीय भाव में — करियर पद से नहीं, अपने पराक्रम और बार-बार के प्रयास से बनता है",
      4: "चतुर्थ भाव में — कार्य घर, भूमि, वाहन अथवा जन्मस्थान से जुड़ा है, और वहीं से हो सकता है",
      5: "पंचम भाव में — व्यवसाय बुद्धि, सृजन अथवा सट्टे पर चलता है; जो रचा जाए वही फल देता है",
      6: "षष्ठ भाव में — कार्य किसी और की व्यवस्था के भीतर होता है, और प्रतिस्पर्धा कार्य का अंग है",
      7: "सप्तम भाव में — कार्य खुले बाज़ार में दूसरों के साथ होता है — साझेदारी, अनुबंध, लेन-देन",
      8: "अष्टम भाव में — करियर में विच्छेद और पुनर्निर्माण आते हैं; जो बचता है वह असामान्य और अपरिहार्य होता है",
      9: "नवम भाव में — कार्य में अध्यापन, परामर्श, विधि अथवा दूरस्थ व्यवहार का अंश है, और भाग्य साथ देता है",
      10: "अपने ही भाव में — व्यवसाय स्पष्ट है, और प्रतिष्ठा कार्य से ही बनती है",
      11: "एकादश भाव में — कर्म लाभ और संपर्कों में फल देता है, और संपर्क कार्य जितने ही महत्वपूर्ण हैं",
      12: "द्वादश भाव में — कार्य में दूरी, विदेश, एकांत अथवा जनदृष्टि से दूर संस्थाएँ आती हैं",
    },
  };
  add(3, P.block(
    hi
      ? `दशम भाव बताता है कि कर्म किस प्रकार का है; दशमेश बताता है कि वह कर्म कहाँ जाकर फलित होता है${S}`
      : `The 10th house says what kind of work; the 10th lord says where that work actually goes to bear fruit.`,
    hi
      ? `आपका दशमेश ${pl(h10.lord)} है और वह ${LORD_IN.hi[l10]}${S}`
      : `Your 10th lord is ${pl(h10.lord)}, and it sits ${LORD_IN.en[l10]}.`,
    hi
      ? `यह ${sg(h10.lordSign)} राशि में ${dg(h10.lordDignity)} अवस्था में है${S} ${["exalted", "own", "moolatrikona"].includes(h10.lordDignity) ? "स्वामी बलवान है — कर्म का फल अपने समय पर पूरा मिलता है" : h10.lordDignity === "debilitated" ? "स्वामी नीच का है — आरंभ में परिश्रम अधिक और फल कम लगता है, किंतु यह स्थायी दुर्बलता नहीं" : "स्वामी सामान्य बल में है — फल प्रयास के अनुपात में मिलता है"}${S}`
      : `It stands in ${sg(h10.lordSign)}, ${dg(h10.lordDignity)}. ${["exalted", "own", "moolatrikona"].includes(h10.lordDignity) ? "A dignified 10th lord means the profession pays what it promises, in its own time." : h10.lordDignity === "debilitated" ? "A debilitated 10th lord makes early work feel like more effort for less return — it is not a permanent weakness, but it is a real one." : "The lord is of ordinary strength, so the return stays roughly proportional to the effort."}`,
    hi
      ? `कर्म भाव से इसकी दूरी ${((l10 - 10 + 12) % 12) + 1} है${S}`
      : `Counted from the 10th itself, the lord has travelled ${((l10 - 10 + 12) % 12) + 1} houses.`,
  ), { data: { lord: h10.lord, lordHouse: l10, dignity: h10.lordDignity } });

  // ── 5–8. The four karakas of work ──────────────────────────────────────────
  grahaChapter(4, f.saturn,
    hi ? "श्रम, अनुशासन, सेवा और दीर्घ कर्म" : "labour, discipline, service and long endurance",
    hi ? `शनि बलवान है — यह कुंडली लंबे कार्य में सफल होती है, तेज़ कार्य में नहीं${S} जो टिकता है वही मिलता है${S}` : `Saturn is dignified here. This is a chart that succeeds by staying rather than by moving fast: what is held is what is gained.`,
    hi ? `शनि सामान्य बल में है — आरंभिक वर्षों में परिश्रम का फल देर से आता है, और यही शनि का स्वभाव है${S} तीस वर्ष के बाद इसका फल बदलता है${S}` : `Saturn is not dignified here. The early years tend to return less than the effort put in, which is Saturn's ordinary way of working; its account settles later rather than never.`);

  grahaChapter(5, f.sun,
    hi ? "अधिकार, पद, पहचान और पिता" : "authority, office, recognition and the father",
    hi ? `सूर्य बलवान है — पद और उत्तरदायित्व स्वाभाविक रूप से आते हैं, और आपका नाम कार्य से जुड़ता है${S}` : `The Sun is dignified. Position and responsibility come to this chart naturally, and your name tends to attach to the work.`,
    hi ? `सूर्य सामान्य बल में है — पहचान पद से नहीं, कार्य की गुणवत्ता से बनेगी${S} श्रेय मिलने में विलंब हो सकता है${S}` : `The Sun is of ordinary strength. Recognition here is built by the quality of the work rather than conferred by a title, and credit can be slow to arrive.`);

  grahaChapter(6, f.mercury,
    hi ? "वाणिज्य, गणना, लेखन, कौशल और वाणी" : "commerce, calculation, writing, skill and speech",
    hi ? `बुध बलवान है — व्यापार, लेखन, संगणन अथवा किसी भी ऐसे कार्य में जहाँ बुद्धि और वाणी बिकती हो, यह कुंडली सहज चलती है${S}` : `Mercury is dignified. Trade, writing, computation — any work where intelligence and speech are the thing being sold — runs easily for this chart.`,
    hi ? `बुध सामान्य बल में है — विवरण और हिसाब पर विशेष ध्यान देना होगा, वे स्वयं नहीं सँभलते${S}` : `Mercury is of ordinary strength: detail and accounts need deliberate attention here, because they will not look after themselves.`);

  grahaChapter(7, f.jupiter,
    hi ? "परामर्श, विद्या, विवेक और वृद्धि" : "counsel, learning, judgement and growth",
    hi ? `गुरु बलवान है — जहाँ सलाह, शिक्षा अथवा विवेक ही उत्पाद हो, वहाँ यह कुंडली मान पाती है${S}` : `Jupiter is dignified. Where advice, teaching or judgement is itself the product, this chart earns standing.`,
    hi ? `गुरु सामान्य बल में है — मार्गदर्शक स्वयं नहीं मिलेंगे, खोजने पड़ेंगे${S}` : `Jupiter is of ordinary strength: mentors do not arrive on their own here, they have to be sought.`);

  // ── 9–13. The supporting houses ────────────────────────────────────────────
  houseChapter(8, f.houses2, hi
    ? `दशम भाव कमाता है, द्वितीय भाव रखता है — दोनों में अंतर है${S}`
    : `The 10th earns it; the 2nd is whether it stays. They are not the same question.`);
  houseChapter(9, f.houses6, hi
    ? `षष्ठ भाव नौकरी का भाव है${S} इसका बलवान होना दुर्भाग्य नहीं — प्रतिस्पर्धा में जीतने की क्षमता है${S}`
    : `The 6th is the house of employment. Strength here is not misfortune; it is the capacity to win a contest.`);
  houseChapter(10, f.houses7, hi
    ? `सप्तम भाव केवल विवाह का नहीं — हर अनुबंध, हर ग्राहक और हर साझेदार इसी भाव से देखे जाते हैं${S}`
    : `The 7th is not only marriage. Every contract, every client and every partner is read from this house.`);
  houseChapter(11, f.houses11, hi
    ? `एकादश भाव वह है जहाँ परिश्रम वास्तव में हाथ में आता है${S} दशम प्रयास है, एकादश प्राप्ति${S}`
    : `The 11th is where effort actually arrives in hand. The 10th is the doing; the 11th is the getting.`);
  houseChapter(12, f.houses3, hi
    ? `तृतीय भाव आरंभ करने का साहस है — बिना इसके योजना योजना ही रह जाती है${S}`
    : `The 3rd is the nerve to begin. Without it a plan stays a plan.`);

  // ── 14–15. Dashamsha ───────────────────────────────────────────────────────
  const d10 = f.dashamsha;
  const d10Ten = d10?.at ? d10.at(h10.lord) : null;
  add(13, P.block(
    hi
      ? `दशमांश (D10) प्रत्येक राशि को दस भागों में बाँटकर बनी वह कुंडली है जिसे शास्त्र केवल कर्म के लिए देखते हैं${S} जन्म कुंडली प्रवृत्ति बताती है; दशमांश बताता है कि कार्यक्षेत्र में वह प्रवृत्ति किस रूप में उतरती है${S}`
      : `The Dashamsha divides every sign into ten parts, producing a chart the classics consult for one subject only: work. The birth chart shows the disposition; the D10 shows the form that disposition takes once it reaches a workplace.`,
    hi
      ? `आपके दशमांश का लग्न ${sg(d10.lagnaSign)} है और उसका स्वामी ${pl(d10.lagnaLord)} है${S}`
      : `Your Dashamsha Lagna is ${sg(d10.lagnaSign)}, ruled by ${pl(d10.lagnaLord)}.`,
    d10.vargottama?.length
      ? (hi ? `${P.planets(d10.vargottama)} वर्गोत्तम है — जन्म कुंडली और दशमांश दोनों में एक ही राशि${S} ऐसा ग्रह अपना फल दोहराकर देता है और उसका संकेत सर्वाधिक विश्वसनीय है${S}`
            : `${P.planets(d10.vargottama)} is vargottama — the same sign in both the birth chart and the D10. A vargottama graha repeats its promise, and its indication is the most reliable one in the chart.`)
      : (hi ? `कोई ग्रह वर्गोत्तम नहीं — कर्म में कोई एक दिशा दोहराई नहीं जा रही, इसलिए क्षेत्र चुनने में लचीलापन है${S}` : `No graha is vargottama, so no single direction is being repeated. That leaves genuine flexibility in choosing a field.`),
    d10.dignified?.length
      ? (hi ? `दशमांश में ${P.planets(d10.dignified)} बलवान है${S}` : `${P.planets(d10.dignified)} is dignified in the D10.`)
      : "",
    d10.debilitated?.length
      ? (hi ? `दशमांश में ${P.planets(d10.debilitated)} निर्बल है — इनसे संबंधित कार्य में अतिरिक्त परिश्रम लगेगा${S}` : `${P.planets(d10.debilitated)} is debilitated in the D10, so work of that nature will ask for extra effort.`)
      : "",
  ), { data: { lagna: d10.lagnaSign, vargottama: d10.vargottama } });

  add(14, P.block(
    hi
      ? `जन्म कुंडली का दशमेश दशमांश में कहाँ गया — यह प्रश्न कर्म के विषय में दो कुंडलियों को जोड़ता है${S}`
      : `Where the birth chart's 10th lord lands in the Dashamsha is the question that joins the two charts on the subject of work.`,
    d10Ten
      ? (hi ? `आपका दशमेश ${pl(h10.lord)} दशमांश में ${sg(d10Ten.sign)} राशि में ${N(d10Ten.house)} भाव में है${S}`
            : `Your 10th lord ${pl(h10.lord)} occupies ${sg(d10Ten.sign)} in the ${N(d10Ten.house)} house of the Dashamsha.`)
      : (hi ? `दशमांश में इस ग्रह की स्थिति गणना में नहीं मिली${S}` : `That placement was not available in the computation.`),
    d10Ten && [1, 4, 7, 10].includes(d10Ten.house)
      ? (hi ? `यह केंद्र में है — कर्म का विषय जीवन के मध्य में रहता है, किनारे पर नहीं${S}` : `It falls in an angle, which keeps the subject of work at the centre of the life rather than at its edge.`)
      : d10Ten && [6, 8, 12].includes(d10Ten.house)
        ? (hi ? `यह दुःस्थान में है — कार्यक्षेत्र में परिवर्तन और पुनर्निर्माण बार-बार आएँगे${S} यह असफलता नहीं, मार्ग का स्वरूप है${S}` : `It falls in a difficult house, which brings repeated change and rebuilding in the working life. That is the shape of the road here, not a verdict of failure.`)
        : d10Ten ? (hi ? `यह सामान्य भाव में है — कार्य स्थिर गति से आगे बढ़ता है${S}` : `It falls in an ordinary house, and the working life proceeds at a steady pace.`) : "",
    hi ? `स्मरण रहे: दशमांश जन्म कुंडली को काटता नहीं, उसे सूक्ष्म करता है${S} यदि दोनों में विरोध दिखे तो जन्म कुंडली ही प्रमाण है${S}` : `Remember that the D10 refines the birth chart, it does not overrule it. Where the two disagree, the birth chart is the authority.`,
  ));

  // ── 16. Amatyakaraka ───────────────────────────────────────────────────────
  const ak = f.karakas.amatyakaraka, atma = f.karakas.atmakaraka;
  add(15, P.block(
    hi
      ? `जैमिनि पद्धति में सात ग्रहों को उनके अंशों के क्रम में रखा जाता है${S} सर्वाधिक अंश वाला आत्मकारक और उससे अगला अमात्यकारक कहलाता है${S} अमात्यकारक ही कर्म और जीविका का कारक है — कुंडली का मंत्री${S}`
      : `In the Jaimini system the seven grahas are ranked by the degree they hold within their sign. The highest is the Atmakaraka, the soul's significator; the next is the Amatyakaraka, the minister — and the minister is the karaka of career and livelihood.`,
    atma ? (hi ? `आपका आत्मकारक ${pl(atma.planet)} है (${sg(atma.sign)}, ${N(atma.house)} भाव)${S}` : `Your Atmakaraka is ${pl(atma.planet)} (${sg(atma.sign)}, ${N(atma.house)} house).`) : "",
    ak
      ? (hi ? `आपका अमात्यकारक ${pl(ak.planet)} है, जो ${sg(ak.sign)} राशि में ${N(ak.house)} भाव में ${dg(ak.dignity)} अवस्था में है${S}`
            : `Your Amatyakaraka is ${pl(ak.planet)}, standing in ${sg(ak.sign)} in the ${N(ak.house)} house, ${dg(ak.dignity)}.`)
      : "",
    ak
      ? (hi ? `इसका अर्थ यह है कि आपकी जीविका ${FIELD_HI[ak.planet]} — इस स्वभाव के कार्य में सहज रूप से बैठती है${S}`
            : `That points your livelihood towards ${(f.fields.fieldOf(ak.planet)[0] || "work of that graha's nature")}.`)
      : "",
    ak && atma && ak.planet === h10.lord
      ? (hi ? `विशेष: आपका अमात्यकारक और दशमेश एक ही ग्रह है${S} यह दुर्लभ मेल है और कर्म के विषय में कुंडली का संकेत असंदिग्ध कर देता है${S}` : `Note: your Amatyakaraka and your 10th lord are the same graha. That is an uncommon agreement, and it makes the chart's indication about work unusually unambiguous.`)
      : "",
  ), { data: { atmakaraka: atma?.planet, amatyakaraka: ak?.planet } });

  // ── 17. Job or business ────────────────────────────────────────────────────
  const r = f.route;
  const sig = (keys) => keys.map((k) => ROUTE_SIGNAL[L][k]).filter(Boolean);
  add(16, P.block(
    hi
      ? `नौकरी और व्यापार का निर्णय एक नियम से नहीं होता${S} षष्ठ भाव सेवा की ओर खींचता है, सप्तम और एकादश स्वतंत्र कार्य की ओर${S} नीचे वे सब संकेत हैं जो आपकी कुंडली में वास्तव में मिले${S}`
      : `Job or business is not settled by one rule. The 6th pulls towards service, the 7th and 11th towards working for yourself. Below are the signals actually present in your chart, on both sides.`,
    r.lean === "job"
      ? (hi ? `संतुलन नौकरी की ओर झुका है — सेवा के ${r.job.length} संकेत, स्वतंत्र कार्य के ${r.business.length}${S}` : `The balance leans towards employment: ${r.job.length} signals for service against ${r.business.length} for enterprise.`)
      : r.lean === "business"
        ? (hi ? `संतुलन स्वतंत्र कार्य की ओर झुका है — व्यापार के ${r.business.length} संकेत, सेवा के ${r.job.length}${S}` : `The balance leans towards enterprise: ${r.business.length} signals for business against ${r.job.length} for service.`)
        : (hi ? `दोनों ओर बराबर संकेत हैं (${r.job.length} और ${r.business.length})${S} ऐसी कुंडली प्रायः नौकरी से आरंभ करके बाद में स्वतंत्र होती है — और यह दुविधा नहीं, क्रम है${S}` : `The signals are evenly matched (${r.job.length} against ${r.business.length}). Charts like this commonly begin in employment and move to their own work later; that is a sequence, not an indecision.`),
    r.margin === 1 ? (hi ? `अंतर केवल एक संकेत का है, इसलिए यह झुकाव है, निर्णय नहीं${S}` : `The margin is a single signal, so treat this as a lean and not a verdict.`) : "",
  ), {
    bullets: [
      ...sig(r.job).map((s) => (hi ? `नौकरी: ${s}` : `Service: ${s}`)),
      ...sig(r.business).map((s) => (hi ? `व्यापार: ${s}` : `Enterprise: ${s}`)),
    ],
    data: { lean: r.lean, job: r.job.length, business: r.business.length },
  });

  // ── 18. The field ──────────────────────────────────────────────────────────
  const fld = f.fields;
  const fieldLine = (src) => {
    const label = hi
      ? { tenthLord: "दशमेश", amatyakaraka: "अमात्यकारक", strongest: "कुंडली का सबसे बलवान ग्रह" }[src.from]
      : { tenthLord: "your 10th lord", amatyakaraka: "your Amatyakaraka", strongest: "the strongest graha in your chart" }[src.from];
    const desc = hi ? FIELD_HI[src.planet] : (fld.fieldOf(src.planet)[0] || "");
    return `${label} — ${pl(src.planet)}: ${desc}`;
  };
  add(17, P.block(
    hi
      ? `क्षेत्र किसी एक ग्रह से नहीं देखा जाता${S} तीन स्वतंत्र स्थानों से देखा जाता है — दशमेश, अमात्यकारक, और कुंडली का सबसे बलवान ग्रह${S} तीनों एक ही ग्रह बताएँ तो संकेत प्रबल; अलग-अलग बताएँ तो कुंडली सचमुच कई दिशाओं में खुली है${S}`
      : `A field is not read from one graha. It is read from three independent places — the 10th lord, the Amatyakaraka, and the strongest graha in the chart. When all three name the same graha the indication is strong; when they differ, the chart is genuinely open in more than one direction, and saying otherwise would be a guess.`,
    fld.agreement >= 3
      ? (hi ? `आपकी कुंडली में तीनों एक ही ग्रह पर मिलते हैं — संकेत अत्यंत स्पष्ट है${S}` : `In your chart all three agree on one graha. The indication is as clear as this method gets.`)
      : fld.agreement === 2
        ? (hi ? `तीन में से दो एक ही ग्रह पर मिलते हैं — मुख्य दिशा वही है, तीसरा एक सहायक क्षेत्र बताता है${S}` : `Two of the three agree. That is your principal direction, with the third naming a secondary field that will keep appearing alongside it.`)
        : (hi ? `तीनों अलग-अलग ग्रह बताते हैं${S} ऐसी कुंडली एक ही व्यवसाय में बँधकर नहीं रहती — नीचे तीनों दिशाएँ दी हैं, चुनाव आपका है${S}` : `All three name different grahas. A chart like this does not stay confined to a single trade; the three directions are listed below, and the choice is genuinely yours.`),
    hi ? `स्मरण रहे: ज्योतिष क्षेत्र का स्वभाव बताता है, पदनाम नहीं${S} "बुध का कार्य" में लेखा भी आता है और संगणक भी${S}` : `Note that jyotish names the nature of a field, not a job title. "Mercury work" covers both an accountant and a programmer.`,
  ), { bullets: fld.sources.map(fieldLine), data: { agreement: fld.agreement } });

  // ── 19. Ashtakavarga ───────────────────────────────────────────────────────
  const savRow = (h) => {
    const v = f.sav[h];
    if (v === null || v === undefined) return null;
    const verdict = hi
      ? (v >= 30 ? "बलवान" : v >= 25 ? "सामान्य" : "सहारा चाहिए")
      : (v >= 30 ? "strong" : v >= 25 ? "ordinary" : "needs support");
    return `${N(h)} ${P.l2.house} — ${v} ${hi ? "बिंदु" : "bindus"} (${verdict})`;
  };
  add(18, P.block(
    hi
      ? `अष्टकवर्ग में प्रत्येक भाव को ग्रहों से बिंदु प्राप्त होते हैं${S} अठारह से नीचे दुर्बल, अट्ठाईस औसत, तीस से ऊपर बलवान माना जाता है${S} यह संख्या भाव के विषय में मत नहीं, माप है${S}`
      : `Ashtakavarga scores each house in bindus contributed by the grahas. Below eighteen is weak, twenty-eight is the average, above thirty is strong. It is a measurement of a house rather than an opinion about it — which is why it is worth printing even when it disagrees with the chapters above.`,
    f.sav[10] !== null && f.sav[10] !== undefined
      ? (hi ? `आपके दशम भाव को ${f.sav[10]} बिंदु प्राप्त हैं${S} ${f.sav[10] >= 30 ? "यह प्रबल है — कर्म के विषय में कुंडली आपका साथ देती है" : f.sav[10] >= 25 ? "यह औसत के निकट है — फल प्रयास के अनुपात में" : "यह औसत से नीचे है — कर्म भाव को उपाय और धैर्य दोनों चाहिए"}${S}`
            : `Your 10th house carries ${f.sav[10]} bindus. ${f.sav[10] >= 30 ? "That is strong: the chart supports the subject of work." : f.sav[10] >= 25 ? "That is near average, so return stays proportional to effort." : "That is below average, and the house of work will want both remedy and patience."}`)
      : "",
  ), { bullets: [1, 2, 3, 6, 7, 10, 11].map(savRow).filter(Boolean), data: { sav: f.sav } });

  // ── 20–21. Yogas ───────────────────────────────────────────────────────────
  const rajas = (f.rajaYogas || []).slice(0, 6);
  add(19, P.block(
    hi
      ? `राजयोग तब बनता है जब केंद्र (1, 4, 7, 10) और त्रिकोण (1, 5, 9) के स्वामी आपस में संबंध बनाएँ${S} यह पद, अधिकार और उत्थान का योग है${S}`
      : `A Raja yoga forms when the lord of an angle (1, 4, 7, 10) and the lord of a trine (1, 5, 9) come into relationship. It is the combination for position, authority and rise.`,
    rajas.length
      ? (hi ? `आपकी कुंडली में ${rajas.length} ऐसे संबंध मिले${S} इनका फल उन्हीं दशाओं में मिलता है जिनमें ये ग्रह सक्रिय हों — अध्याय 24 देखें${S}`
            : `Your chart carries ${rajas.length} such relationships. A yoga gives its result only in the dasha of the grahas that form it — see chapter 24 for when those run.`)
      : (hi ? `इस प्रकार का कोई स्पष्ट संबंध नहीं मिला${S} इसका अर्थ यह नहीं कि उत्थान नहीं होगा — इसका अर्थ है कि वह पद से नहीं, कार्य से आएगा${S}` : `No such relationship was found. That does not mean there is no rise; it means the rise comes from the work itself rather than from position being conferred.`),
    (f.mahapurusha || []).length
      ? (hi ? `इसके अतिरिक्त पंच-महापुरुष योग भी उपस्थित है: ${f.mahapurusha.map((m) => m.yoga).join(", ")}${S}` : `A Pancha-Mahapurusha yoga is also present: ${f.mahapurusha.map((m) => m.yoga).join(", ")}.`)
      : "",
  ), { bullets: rajas.map((y) => (hi ? y.reason_hi || y.reason : y.reason)).filter(Boolean), data: { count: rajas.length } });

  const dhanas = (f.dhanaYogas || []).slice(0, 6);
  add(20, P.block(
    hi
      ? `धन योग द्वितीय, पंचम, नवम और एकादश भावों के स्वामियों के संबंध से बनता है — अर्थात् संचय, बुद्धि, भाग्य और लाभ के भावों से${S}`
      : `A Dhana yoga forms from relationships between the lords of the 2nd, 5th, 9th and 11th — savings, intelligence, fortune and gain.`,
    dhanas.length
      ? (hi ? `आपकी कुंडली में ${dhanas.length} धन योग मिले${S} ध्यान रहे — धन योग धन का वचन नहीं, धन बनने का मार्ग है${S} मार्ग तब खुलता है जब संबंधित ग्रह की दशा चले${S}`
            : `Your chart carries ${dhanas.length}. A Dhana yoga is a route to wealth rather than a promise of it, and the route opens when the graha involved runs its period.`)
      : (hi ? `स्पष्ट धन योग नहीं मिला${S} ऐसी कुंडली में संचय आय से नहीं, व्यय पर नियंत्रण से बनता है${S}` : `No clear Dhana yoga was found. In a chart like this, savings are built by controlling outgo rather than by a surge in income.`),
  ), { bullets: dhanas.map((y) => (hi ? y.reason_hi || y.reason : y.reason)).filter(Boolean), data: { count: dhanas.length } });

  // ── 22. Strengths ──────────────────────────────────────────────────────────
  const strengths = [];
  if (h10.grade === "strong") strengths.push(hi ? "दशम भाव स्वयं बलवान है — संसार आपके कार्य को देखता है" : "the 10th house itself is strong, so the work gets seen");
  if (["exalted", "own", "moolatrikona"].includes(h10.lordDignity)) strengths.push(hi ? `दशमेश ${pl(h10.lord)} बलवान है — कर्म का फल पूरा मिलता है` : `the 10th lord ${pl(h10.lord)} is dignified, so the profession returns what it should`);
  if (f.houses11.grade === "strong") strengths.push(hi ? "लाभ भाव प्रबल है — परिश्रम हाथ में आता है" : "the 11th of gains is strong, so effort actually arrives in hand");
  if (f.houses2.grade !== "weak") strengths.push(hi ? "धन भाव स्थिर है — जो कमाया जाता है वह टिकता है" : "the 2nd is steady, so what is earned tends to stay");
  if ((f.rajaYogas || []).length) strengths.push(hi ? `${f.rajaYogas.length} राजयोग उपस्थित हैं` : `${f.rajaYogas.length} Raja yoga${f.rajaYogas.length === 1 ? " is" : "s are"} present`);
  if (f.saturn && ["exalted", "own", "moolatrikona"].includes(f.saturn.dignity)) strengths.push(hi ? "शनि बलवान है — दीर्घ कार्य में यह सबसे बड़ी पूँजी है" : "Saturn is dignified, which is the single best asset for long work");
  if (f.sav[10] >= 30) strengths.push(hi ? `दशम भाव को अष्टकवर्ग में ${f.sav[10]} बिंदु` : `${f.sav[10]} bindus on the 10th in Ashtakavarga`);
  if (d10?.vargottama?.length) strengths.push(hi ? `${P.planets(d10.vargottama)} वर्गोत्तम — कर्म में इसका संकेत दोहराया गया है` : `${P.planets(d10.vargottama)} is vargottama, repeating its promise in the chart of work`);
  add(21, P.block(
    hi ? `प्रत्येक कुंडली में कुछ ऐसा होता है जिस पर जीविका टिक सकती है${S} आपकी कुंडली में ये हैं — और कठिन दशा में इन्हीं का सहारा लिया जाता है${S}`
       : `Every chart has something a livelihood can rest on. These are yours, and these are what a difficult period is weathered on.`,
  ), { bullets: strengths.length ? strengths : [hi ? "दशमेश अपना कार्य कर रहा है" : "the 10th lord is doing its work"] });

  // ── 23. Difficulty ─────────────────────────────────────────────────────────
  const frictions = [];
  if (h10.maleficOccupants.length) frictions.push(hi ? `दशम भाव में ${P.planets(h10.maleficOccupants)} — कार्यक्षेत्र में टकराव खुलकर आएगा, छिपकर नहीं` : `${P.planets(h10.maleficOccupants)} in the 10th: conflict at work will be open rather than hidden`);
  if (h10.lordDignity === "debilitated") frictions.push(hi ? "दशमेश नीच का — प्रयास और फल के बीच अंतर लंबे समय तक बना रहेगा" : "the 10th lord is debilitated: the gap between effort and reward stays wide for a long stretch");
  if (h10.lordCombust) frictions.push(hi ? "दशमेश अस्त — कार्य होता है पर श्रेय दूसरे को जाता है" : "the 10th lord is combust: the work gets done but the credit lands elsewhere");
  if ([6, 8, 12].includes(h10.lordHouse)) frictions.push(hi ? `दशमेश ${N(h10.lordHouse)} भाव में — करियर में परिवर्तन और पुनर्निर्माण बार-बार आएँगे` : `the 10th lord sits in the ${N(h10.lordHouse)}: expect repeated change and rebuilding rather than one straight line`);
  if (f.houses2.grade === "weak") frictions.push(hi ? "धन भाव दुर्बल — आय से अधिक व्यय पर ध्यान देना होगा" : "the 2nd is weak: outgo needs more watching than income does");
  if (f.saturn?.dignity === "debilitated") frictions.push(hi ? "शनि नीच का — आरंभिक वर्षों में परिश्रम का फल विलंब से" : "Saturn is debilitated: the early years pay late");
  if (f.sav[10] !== null && f.sav[10] < 25) frictions.push(hi ? `दशम भाव को अष्टकवर्ग में केवल ${f.sav[10]} बिंदु — कर्म भाव को सहारा चाहिए` : `only ${f.sav[10]} bindus on the 10th: the house of work needs support`);
  if (f.sadeSati?.active) frictions.push(hi ? "साढ़े साती चल रही है — इस अवधि में पद-परिवर्तन सोच-समझकर करें" : "Sade Sati is running: change position deliberately rather than suddenly while it lasts");
  add(22, P.block(
    hi ? `जो कठिनाई पहले से दिख जाए, वह आधी सुलझ जाती है${S} नीचे वे स्थितियाँ हैं जो आपकी कुंडली में वास्तव में मिलीं — ये भविष्यवाणी नहीं, चेतावनी हैं${S}`
       : `A difficulty seen in advance is half resolved. These are the conditions actually present in your chart. They are cautions, not predictions.`,
  ), { bullets: frictions.length ? frictions : [hi ? "कर्म भाव में कोई बड़ी बाधा नहीं मिली" : "no major obstruction was found in the house of work"] });

  // ── 24. Timing ─────────────────────────────────────────────────────────────
  const tm = f.timing;
  add(23, P.block(
    hi
      ? `करियर उस दशा में करवट लेता है जो दशम भाव, दशमेश, शनि अथवा अमात्यकारक को सक्रिय करे${S} आपकी कुंडली में ये ग्रह हैं: ${P.planets(tm.activators)}${S}`
      : `A career turns in a period that activates the 10th house, its lord, Saturn or the Amatyakaraka. In your chart those grahas are: ${P.planets(tm.activators)}.`,
    tm.windows.length
      ? (hi ? `नीचे वे महादशाएँ हैं जो गणना की गई अवधि में आती हैं${S}` : `The mahadashas of those grahas that fall inside the computed sequence are below.`)
      : (hi ? `गणना की गई दशा-क्रम में इनमें से कोई महादशा नहीं आती — ऐसी स्थिति में अंतर्दशाएँ देखी जाती हैं${S}` : `None of those mahadashas falls inside the computed sequence, in which case the antardashas carry the timing instead.`),
    hi
      ? `वर्तमान दशा: ${pl(f.dasha.maha)}–${pl(f.dasha.antar)}${S} दशा अवसर खोलती है; उसका उपयोग आपको करना होता है${S}`
      : `Currently running: ${pl(f.dasha.maha)}–${pl(f.dasha.antar)}. A dasha opens an opportunity; taking it stays your work.`,
  ), {
    bullets: tm.windows.map((w) => `${pl(w.lord)} — ${P.fmtDate(w.start)} ${P.l2.to} ${P.fmtDate(w.end)}`),
    data: { windows: tm.windows },
  });

  // ── 25. Transits ───────────────────────────────────────────────────────────
  const workTransits = (f.transits || []).filter((t) => [10, 6, 11, 2, 7].includes(t.house)).slice(0, 8);
  add(24, P.block(
    hi
      ? `गोचर दशा का समर्थन करता है, उसे बदलता नहीं${S} दशा में जो वचन नहीं, वह गोचर नहीं दे सकता — किंतु गोचर बताता है कि वचन कब सक्रिय होगा${S}`
      : `Transits support what the dasha already promised; they do not overrule it. A transit cannot give what the dasha has not undertaken — but it does say when the undertaking becomes live.`,
    workTransits.length
      ? (hi ? `इस समय आपके कर्म-भावों पर ये ग्रह गोचर कर रहे हैं${S}` : `These are the grahas now transiting your houses of work.`)
      : (hi ? `इस समय कर्म-भावों पर कोई प्रमुख गोचर नहीं — यह ठहराव का काल है, और ठहराव में तैयारी की जाती है${S}` : `No major graha is crossing your houses of work just now. That is a flat stretch, and a flat stretch is what preparation is done in.`),
    hi ? `शनि का गोचर सबसे धीमा और सबसे निर्णायक होता है — वह जिस भाव पर जाता है, वहाँ पहले भार डालता है, फिर स्थायित्व${S}` : `Saturn's transit is the slowest and the most decisive: on whatever house it crosses, it puts weight first and permanence afterwards.`,
  ), { bullets: workTransits.map((t) => `${pl(t.planet)} — ${sg(t.sign)}, ${N(t.house)} ${P.l2.house}`) });

  // ── 26. Sade Sati ──────────────────────────────────────────────────────────
  const satTransit = (f.transits || []).find((t) => t.planet === "Saturn");
  const satFromMoon = satTransit?.fromMoon || null;
  const satSign = satTransit?.sign || null;
  add(25, P.block(
    hi
      ? `साढ़े साती वह साढ़े सात वर्ष की अवधि है जब शनि चंद्र राशि से बारहवें, चंद्र राशि पर और दूसरे भाव में गोचर करता है${S} इसे विनाश का काल कहना अनुचित है — यह परिश्रम, उत्तरदायित्व और छँटाई का काल है${S}`
      : `Sade Sati is the seven-and-a-half years in which Saturn transits the twelfth from your Moon, your Moon sign itself, and the second from it. Calling it a period of ruin is wrong: it is a period of labour, responsibility and pruning.`,
    // Say where Saturn actually is relative to this Moon, not just yes/no. The
    // yes/no branch is identical for most charts and reads as boilerplate; the
    // distance from the Moon is different for almost everyone.
    hi
      ? `आपकी चंद्र राशि ${sg(f.sadeSati?.moonSign || f.moonSign)} है${S}${satFromMoon ? ` इस समय शनि चंद्र राशि से ${satFromMoon}वें भाव में, ${sg(satSign)} राशि में गोचर कर रहा है${S}` : ""}`
      : `Your Moon sign is ${sg(f.sadeSati?.moonSign || f.moonSign)}.${satFromMoon ? ` Saturn is presently transiting ${sg(satSign)}, the ${N(satFromMoon)} from that Moon.` : ""}`,
    f.sadeSati?.active
      ? (hi ? `आपकी साढ़े साती इस समय चल रही है${S}${f.sadeSati.currentPhase ? ` वर्तमान चरण: ${f.sadeSati.currentPhase.phase || f.sadeSati.currentPhase.name || ""}${S}` : ""}${f.sadeSati.overallProgress ? ` अवधि लगभग ${Math.round(f.sadeSati.overallProgress * 100)}% पूर्ण हो चुकी है${S}` : ""} कार्यक्षेत्र में इसका सामान्य अर्थ है — अधिक उत्तरदायित्व, कम मान्यता, और जो निरर्थक है उसका छूटते जाना${S} इस अवधि में पद बदलने से पहले सोचें, और जो चल रहा है उसे निभाएँ${S}`
            : `Your Sade Sati is running now.${f.sadeSati.currentPhase ? ` Current phase: ${f.sadeSati.currentPhase.phase || f.sadeSati.currentPhase.name || ""}.` : ""}${f.sadeSati.overallProgress ? ` It is roughly ${Math.round(f.sadeSati.overallProgress * 100)}% elapsed.` : ""} In working life that ordinarily means more responsibility with less acknowledgement, and the falling away of whatever was not load-bearing. Think twice before changing position while it lasts, and finish what is already in hand.`)
      : (hi ? `आपकी साढ़े साती इस समय नहीं चल रही${S} ${satFromMoon === 11 || satFromMoon === 12 ? "शनि चंद्र के निकट आ रहा है — आगामी वर्षों में यह अवधि आरंभ होगी" : "शनि चंद्र से दूर है"}${S} यह काल निर्माण का है — जो अभी बनाया जाएगा वही आगे परखा जाएगा${S}`
            : `Your Sade Sati is not running at present. ${satFromMoon === 11 || satFromMoon === 12 ? "Saturn is approaching your Moon, so the window opens in the next few years." : "Saturn is well away from your Moon."} This is building time: what is put up now is what gets tested later.`),
    hi ? `साढ़े साती सबके जीवन में तीन बार आती है${S} पहली बार शिक्षा में, दूसरी बार करियर के मध्य में, तीसरी बार उत्तरार्ध में — और हर बार वह वही छाँटती है जो टिकने योग्य नहीं${S}` : `Sade Sati comes three times in a life — once during education, once mid-career, once late — and each time it removes what was not going to hold.`,
  ), { data: { active: Boolean(f.sadeSati?.active) } });

  // ── 27. Remedies ───────────────────────────────────────────────────────────
  const needy = h10.lordDignity === "debilitated" || h10.lordCombust ? h10.lord
              : f.saturn?.dignity === "debilitated" ? "Saturn"
              : f.sav[10] !== null && f.sav[10] < 25 ? h10.lord
              : f.karakas.amatyakaraka?.planet || h10.lord;
  const R = P.remedy(needy);
  add(26, P.block(
    hi
      ? `उपाय उसी ग्रह का किया जाता है जिसे सहारे की आवश्यकता है, नौ का नहीं${S} आपकी कुंडली में कर्म के विषय में वह ${pl(needy)} है${S}`
      : `A remedy is done for the graha that needs support, not for all nine. On the subject of work, in your chart, that graha is ${pl(needy)}.`,
    R ? P.ul([R.act, R.day && `${P.head("day") || (hi ? "दिन" : "Day")}: ${R.day}`, R.donate].filter(Boolean)) : "",
    hi
      ? `कर्म भाव का सामान्य उपाय शनिवार का है — किसी श्रमिक को भोजन, अथवा लोहे अथवा काले तिल का दान${S} उपाय कम से कम तैंतालीस दिन निभाया जाता है, तभी उसका अर्थ है${S}`
      : `The ordinary remedy for the karma bhava is Saturday's: food given to someone who works with their hands, or a donation of iron or black sesame. A remedy is held for at least forty-three days, or it is not a remedy.`,
    hi
      ? `उपाय कर्म का स्थान नहीं लेता${S} शास्त्र इसे प्रयास के साथ करने को कहते हैं, प्रयास के बदले नहीं${S}`
      : `A remedy does not replace the work. The classics prescribe it alongside effort, never instead of it.`,
  ), { data: { remedyPlanet: needy } });

  // ── 28. How to use ─────────────────────────────────────────────────────────
  add(27, P.block(
    hi
      ? `यह रिपोर्ट भविष्यवाणी नहीं, दिशा है${S} अध्याय 17 और 18 इसका सार हैं — नौकरी या व्यापार, और किस स्वभाव का कार्य${S}`
      : `This report is a direction, not a prophecy. Chapters 17 and 18 are its substance: the route, and the nature of the work.`,
    hi
      ? `अध्याय 24 की अवधियाँ ध्यान में रखें — बड़ा परिवर्तन उन्हीं में सहज होता है${S} अध्याय 23 की बातों पर पहले से काम करें, और अध्याय 27 का उपाय तैंतालीस दिन निभाएँ${S}`
      : `Keep the windows in chapter 24 in view — a large change sits more easily inside one. Work on chapter 23 before it becomes a problem, and hold the remedy in chapter 27 for forty-three days.`,
    hi
      ? `यह रिपोर्ट आपकी जन्म तिथि, समय और स्थान से बनी है${S} इनमें से कोई भी बदले तो पूरी कुंडली बदल जाती है — इसलिए जन्म समय की शुद्धता सबसे महत्वपूर्ण है${S}`
      : `This report was computed from your date, time and place of birth. Change any one of them and the whole chart changes, which is why the accuracy of the birth time matters more than anything else here.`,
    hi
      ? `किसी बात पर संदेह हो तो हमें WhatsApp पर लिखें — आपकी कुंडली सामने रखकर उत्तर दिया जाएगा${S}`
      : `If anything here is unclear, message us on WhatsApp and it will be answered with your chart in front of us.`,
  ));

  return sec;
}

export { TITLES as CAREER_TITLES };
