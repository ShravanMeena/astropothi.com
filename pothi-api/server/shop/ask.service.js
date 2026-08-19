// "Ask this report" — finding the answer inside a book somebody already owns.
//
// This is retrieval over the buyer's OWN chapters, not a language model. It
// cannot invent an answer, and it never states anything the report does not
// already say: every reply is a passage from their book with the chapter it
// came from. That is a deliberate limit, not a missing feature — a chart is
// deterministic, and a chatbot improvising about somebody's marriage on top of
// a deterministic report would make the product less trustworthy, not more.
//
// It answers two kinds of question:
//   1. "what does it say about marriage?"  → the chapters that discuss it
//   2. "what is a dasha?"                  → a plain definition of the jargon

import db from "../../database/index.js";

const STOP = new Set(("a an the is are was were of in on for to my me i you your yours and or " +
  "what when where which how why does do did will shall can could about tell show me " +
  "kya hai mera meri kab kaise kyon ka ki ke ko se mein").split(" "));

/**
 * Terms a reader uses vs terms the report uses. Without this, "job" finds
 * nothing in a book that says "career" and "the 10th house".
 */
const SYNONYMS = {
  marriage: ["marriage", "spouse", "wedding", "7th", "seventh", "navamsa", "venus", "partner", "shaadi", "saadi", "sadi", "vivah", "byah", "marry", "married"],
  love: ["love", "romance", "relationship", "venus", "5th", "fifth", "prem"],
  money: ["wealth", "money", "income", "dhana", "2nd", "second", "11th", "eleventh", "gains", "finance", "paisa", "dhan"],
  career: ["career", "profession", "work", "job", "10th", "tenth", "karma", "naukri", "business"],
  health: ["health", "body", "illness", "6th", "sixth", "constitution", "prakriti", "swasthya", "rog"],
  education: ["education", "study", "learning", "4th", "5th", "mercury", "shiksha", "padhai"],
  children: ["children", "child", "5th", "fifth", "santan", "putra"],
  father: ["father", "9th", "ninth", "sun", "pita"],
  mother: ["mother", "4th", "fourth", "moon", "mata"],
  property: ["property", "home", "house", "land", "4th", "vehicle", "makan", "zameen"],
  travel: ["travel", "foreign", "abroad", "12th", "9th", "videsh"],
  timing: ["when", "timing", "dasha", "antardasha", "mahadasha", "period", "window", "date", "year", "kab", "kabhi", "samay", "hogi", "hoga", "ripens"],
  remedy: ["remedy", "remedies", "upay", "mantra", "gemstone", "donation", "fast", "puja"],
  dosh: ["dosh", "dosha", "manglik", "mangal", "kaal sarp", "pitru", "sade sati", "shani"],
  // Vastu reads a building, so its vocabulary shares almost nothing with the
  // chart reports above.
  direction: ["direction", "facing", "north", "south", "east", "west", "ishan", "nairutya",
              "agneya", "vayavya", "brahmasthan", "zone", "mandala", "disha", "corner"],
  kitchen: ["kitchen", "rasoi", "cooking", "agni", "flame", "south-east"],
  entrance: ["entrance", "door", "gate", "main door", "darwaza", "threshold"],
  bedroom: ["bedroom", "sleep", "shayan", "master bedroom", "south-west"],
  toilet: ["toilet", "bathroom", "washroom", "shauchalay", "sewage"],
  pooja: ["pooja", "puja", "prayer", "mandir", "temple", "ishan", "north-east"]
};

/** Jargon, explained the way a person would explain it out loud. */
export const GLOSSARY = {
  lagna: { en: "Your ascendant — the sign that was rising on the eastern horizon at the minute you were born. It sets which sign sits in your 1st house, and therefore where every other house falls. It changes roughly every two hours, which is why birth time matters so much.",
           hi: "लग्न — जन्म के समय पूर्वी क्षितिज पर उदित राशि। इसी से प्रथम भाव तय होता है और शेष सभी भाव उसी क्रम में बैठते हैं। यह लगभग हर दो घंटे में बदलता है, इसीलिए जन्म समय इतना महत्वपूर्ण है।" },
  rashi: { en: "Your moon sign — the sign the Moon occupied at birth. In Vedic astrology this, not the sun sign, is what most predictions are read from.",
           hi: "चंद्र राशि — जन्म के समय चंद्रमा जिस राशि में था। वैदिक ज्योतिष में अधिकांश फलादेश सूर्य राशि से नहीं, इसी से पढ़े जाते हैं।" },
  nakshatra: { en: "The lunar mansion holding your Moon. The zodiac is divided into 27 of them, each about 13°20' wide, and each has a ruling planet that shapes your dasha sequence.",
               hi: "नक्षत्र — चंद्रमा जिस लुनार भाग में स्थित है। राशिचक्र 27 नक्षत्रों में बँटा है, प्रत्येक लगभग 13°20' का, और प्रत्येक का एक स्वामी ग्रह है जो आपकी दशा-क्रम तय करता है।" },
  dasha: { en: "A planetary period. The Vimshottari system divides a 120-year life among the nine grahas, and whichever planet is running its dasha colours that stretch of your life most strongly.",
           hi: "दशा — ग्रह का काल। विंशोत्तरी पद्धति 120 वर्ष के जीवन को नौ ग्रहों में बाँटती है, और जिस ग्रह की दशा चल रही हो वही उस काल पर सबसे अधिक प्रभाव डालता है।" },
  antardasha: { en: "The sub-period inside a dasha. A major period of eighteen years is divided again among all nine planets, and the sub-period is usually what you actually feel month to month.",
                hi: "अंतर्दशा — किसी दशा के भीतर का उप-काल। अठारह वर्ष की महादशा फिर नौ ग्रहों में बँटती है, और मास-दर-मास अनुभव प्रायः इसी का होता है।" },
  house: { en: "One of the twelve divisions of your chart, each covering an area of life — the 1st is you and your body, the 7th marriage, the 10th career, and so on.",
           hi: "भाव — कुंडली के बारह विभागों में से एक, प्रत्येक जीवन के किसी क्षेत्र का — प्रथम आप और आपका शरीर, सप्तम विवाह, दशम कर्म, इत्यादि।" },
  dosh: { en: "A combination the classical texts flag as difficult. A dosh is a measurement, not a verdict — most have cancellation rules, and this report tests those too.",
          hi: "दोष — शास्त्रों द्वारा कठिन बताया गया योग। दोष एक माप है, निर्णय नहीं — अधिकांश के निवारण-नियम होते हैं, और यह रिपोर्ट उन्हें भी परखती है।" },
  manglik: { en: "Mars sitting in the 1st, 2nd, 4th, 7th, 8th or 12th house from the ascendant. It is positional and admits no interpretation — Mars is in one of those houses or it is not.",
             hi: "मांगलिक — लग्न से प्रथम, द्वितीय, चतुर्थ, सप्तम, अष्टम या द्वादश भाव में मंगल। यह पूर्णतः स्थिति-आधारित है — मंगल उन भावों में है या नहीं है।" },
  navamsa: { en: "The D9 chart, made by dividing each sign into nine parts. Marriage and the deeper strength of a planet are read from it, which is why a planet can look strong in the main chart and weak here.",
             hi: "नवांश — D9 कुंडली, प्रत्येक राशि को नौ भागों में बाँटकर बनी। विवाह और ग्रह का गहरा बल इसी से पढ़ा जाता है, इसीलिए कोई ग्रह मुख्य कुंडली में बली और यहाँ निर्बल हो सकता है।" },
  ashtakavarga: { en: "A scoring system that gives each house a number of bindus (points). The twelve houses always total 337, so a house above the average of about 28 is one your chart supports.",
                  hi: "अष्टकवर्ग — प्रत्येक भाव को बिंदु देने की पद्धति। बारह भावों का योग सदैव 337 होता है, अतः लगभग 28 के औसत से ऊपर का भाव वह है जिसे कुंडली सहारा देती है।" },
  bindu: { en: "A point in the Ashtakavarga count. More bindus in a house means the planets collectively support that area of life.",
           hi: "बिंदु — अष्टकवर्ग की गणना का अंक। किसी भाव में अधिक बिंदु का अर्थ है कि ग्रह मिलकर उस क्षेत्र को सहारा देते हैं।" },
  retrograde: { en: "A planet that appears to move backwards from Earth. Marked (R) in your tables. It is an apparent motion, not a real one, and classically it intensifies rather than reverses a planet's results.",
                hi: "वक्री — पृथ्वी से देखने पर पीछे चलता प्रतीत होने वाला ग्रह। तालिका में (R) से दर्शित। यह आभासी गति है, वास्तविक नहीं, और शास्त्रानुसार यह फल उलटती नहीं, तीव्र करती है।" },
  yoga: { en: "A named combination of planets that the texts treat as a unit — some fortunate, some difficult. Your report lists only the ones that actually form in your chart.",
          hi: "योग — ग्रहों का नामित संयोग जिसे शास्त्र एक इकाई मानते हैं — कुछ शुभ, कुछ कठिन। आपकी रिपोर्ट केवल वही सूचीबद्ध करती है जो वास्तव में बनते हैं।" },
  vastu: { en: "The design tradition that assigns each of the eight directions and the centre a use. A Vastu dosh is a placement contradicting that assignment — nothing more.",
           hi: "वास्तु — वह स्थापत्य परंपरा जो आठ दिशाओं और केंद्र को उपयोग सौंपती है। वास्तु दोष उसी सौंपे गए उपयोग का उल्लंघन है — इससे अधिक कुछ नहीं।" }
};

const words = (q) => String(q || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ")
  .split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** Expand a query with the words the report itself is likely to use. */
function expand(terms) {
  const out = new Set(terms);
  for (const t of terms) {
    for (const [, list] of Object.entries(SYNONYMS)) {
      if (list.includes(t)) list.forEach((x) => out.add(x));
    }
  }
  return [...out];
}

/** The sentence in `text` that best answers the query, with a little around it. */
function bestSnippet(text, terms) {
  const sentences = String(text).split(/(?<=[.।])\s+/).filter((x) => x.length > 30);
  let best = { score: -1, at: 0 };
  sentences.forEach((sn, i) => {
    const low = sn.toLowerCase();
    const score = terms.reduce((s, t) => s + (low.includes(t) ? 1 : 0), 0);
    if (score > best.score) best = { score, at: i };
  });
  if (best.score <= 0) return sentences.slice(0, 2).join(" ");
  return sentences.slice(Math.max(0, best.at), best.at + 2).join(" ");
}

/**
 * @returns {{ kind:"passages"|"definition"|"none", …}}
 */
export async function ask(publicId, query, lang = "en") {
  const q = String(query || "").trim();
  if (!q) return { kind: "none", query: q };
  const terms = words(q);

  // A jargon question is answered from the glossary, whatever report they hold.
  for (const [term, def] of Object.entries(GLOSSARY)) {
    if (terms.includes(term) || terms.some((t) => t.startsWith(term.slice(0, 5)) && term.length > 4)) {
      return { kind: "definition", query: q, term, answer: def[lang === "hi" ? "hi" : "en"] };
    }
  }

  const order = await db.Order.findOne({ where: { public_id: publicId } });
  if (!order || order.status !== "ready" || !order.report_id) return { kind: "none", query: q };
  const report = await db.Report.findByPk(order.report_id);
  const sections = report?.report_json?.sections;
  if (!Array.isArray(sections) || !sections.length) return { kind: "none", query: q };

  const wanted = expand(terms);
  const scored = sections.map((sec) => {
    const title = (sec.title + " " + (sec.subtitle || "")).toLowerCase();
    const body = String(sec.text || "").toLowerCase();
    // A term in the chapter title is a much stronger signal than one buried in
    // a paragraph, so it counts for more.
    const score = wanted.reduce((s, t) =>
      s + (title.includes(t) ? 3 : 0) + (body.split(t).length - 1 > 0 ? 1 : 0), 0);
    return { sec, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

  if (!scored.length) return { kind: "none", query: q };
  return {
    kind: "passages", query: q,
    hits: scored.map(({ sec }) => ({
      n: sec.n, title: sec.title, subtitle: sec.subtitle,
      passage: bestSnippet(sec.text, wanted)
    }))
  };
}

/** Questions worth offering, drawn from the chapters this buyer actually has. */
export async function suggestions(publicId, lang = "en") {
  const order = await db.Order.findOne({ where: { public_id: publicId } });
  if (!order?.report_id) return [];
  const report = await db.Report.findByPk(order.report_id);
  const sections = report?.report_json?.sections || [];
  const has = (re) => sections.some((s) => re.test(s.title));
  const en = [
    has(/marriage|7th|Love/i) && "What does it say about marriage?",
    has(/dasha|Mahadasha/i)   && "Which period am I running now?",
    has(/Dosh/i)              && "Which doshas are present?",
    has(/remed/i)             && "What remedies does it give?",
    has(/career|10th/i)       && "What does it say about career?",
    has(/direction|Zone|Mandala/i) && "Which direction is the problem?",
    "What is a dasha?"
  ];
  const hi = [
    has(/marriage|7th|Love|विवाह/i) && "विवाह के बारे में क्या लिखा है?",
    has(/dasha|Mahadasha|दशा/i)     && "इस समय कौन सी दशा चल रही है?",
    has(/Dosh|दोष/i)                && "कौन से दोष हैं?",
    has(/remed|उपाय/i)              && "क्या उपाय बताए गए हैं?",
    "दशा क्या होती है?"
  ];
  return (lang === "hi" ? hi : en).filter(Boolean).slice(0, 5);
}
