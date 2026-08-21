import type { QA } from "../components/Faq";

/**
 * Per-report "who is this for" and the questions that report specifically
 * raises.
 *
 * Two reasons this exists.
 *
 * The honest one: reportMeta() was emitting a FAQPage containing a question
 * that appeared nowhere on the page. Structured data has to describe what a
 * visitor can read, and it did not. These answers are rendered on the page and
 * the schema is built from this same array, so the two cannot come apart.
 *
 * The useful one: a report page said what the book contains and never said who
 * should buy it. "Who is this for" is the sentence that lets somebody rule
 * themselves in or out, which is worth more than another adjective.
 *
 * Chapter counts, page counts and prices are NOT written here — they come from
 * the catalogue at runtime, because they change and a number typed into prose
 * goes stale silently.
 */
export type ReportCopy = { forWhom: string; faqs: QA[] };

export const REPORT_FAQ: Record<string, ReportCopy> = {
  kundli: {
    forWhom: "Someone who wants their whole chart read once, properly, and kept — rather than a question answered. It is the widest of the reports and the one the others are chapters of.",
    faqs: [
      { q: "How is this different from a free online kundli?",
        a: "A free tool gives you the chart and a paragraph. This reads every house and every planet in turn, gives the Vimshottari dasha timeline with dates, the divisional charts and the Ashtakavarga strengths, and writes each of them out." },
      { q: "Do I need to know my exact birth time?",
        a: "The closer the better. The ascendant and everything keyed to the houses depend on it; the Moon sign, nakshatra and dasha periods stay reliable within about an hour. If the time turns out to be wrong we regenerate the report free." },
      { q: "Can I read it in Hindi?",
        a: "Yes. Choose Hindi at checkout and the whole book is set in Devanagari, including planet, sign and nakshatra names." }
    ]
  },
  dosh: {
    forWhom: "Anyone who has been told they have a dosh and never told what that actually means — most often before a marriage. It is also the report to read if you want the question closed either way.",
    faqs: [
      { q: "What if no dosh is found in my chart?",
        a: "The report still tells you which doshas were checked and why each one does not apply — or why its effect is reduced or cancelled. The point is not to find a dosh but to state your chart clearly, so a clean chart is just as useful an answer." },
      { q: "Is this a one-time payment?",
        a: "Yes. It is a one-time payment. No recurring subscription and no hidden charges." },
      { q: "Is the report built from my own birth details?",
        a: "Yes. Your chart is computed from the date, time and place of birth you give, and every dosh is tested against that chart — not a generic article, your own report." },
      { q: "What if I do not like the report?",
        a: "Full refund, no questions asked. If it is not useful to you, message us on WhatsApp and the full amount is returned." },
      { q: "Which doshas does this check?",
        a: "Manglik, Kaal Sarp, Sade Sati, Pitra, Guru Chandal, Shrapit, Angarak, Grahan, Vish Yoga, Kemadruma, Paap Kartari, Shakat, Gandmool and Daridra — fourteen in all, each against your own chart." },
      { q: "What about cancellations?",
        a: "They are the part most readings skip. Manglik alone has ten classical clauses that reduce or cancel it, and the report checks each one against your chart and shows which apply — which is why the same placement is serious in one chart and irrelevant in the next." }
    ]
  },
  love: {
    forWhom: "Someone deciding about a relationship, or wondering why the same pattern keeps returning. It reads the chart for attachment and partnership rather than for compatibility scores.",
    faqs: [
      { q: "Is this a compatibility match between two people?",
        a: "No. This reads one chart — how you attach, what you need from a partner, where friction tends to start, and the dasha windows in which marriage ripens. It does not score two charts against each other." },
      { q: "What is it read from?",
        a: "The 7th house and its lord, Venus and Mars, and the navamsa — the divisional chart traditionally read for marriage — together with the dasha timeline." },
      { q: "Will it tell me when I will get married?",
        a: "It gives the dasha periods in which the 7th house is activated, with dates, and says what the tradition holds those periods to mean. It does not promise a marriage or a date." }
    ]
  },
  health: {
    forWhom: "Someone who wants the constitutional picture their chart describes — tendencies and areas to look after — as a starting point for reflection, not for diagnosis.",
    faqs: [
      { q: "Is this medical advice?",
        a: "No, and it is not a diagnosis. It is a traditional reading of constitution and tendency. Anything that concerns you about your health belongs with a doctor." },
      { q: "What does it actually read?",
        a: "Your Lagna and its lord, the 6th house, the Moon, and your tatva and prakriti — and from those, the areas of the body the chart traditionally asks you to look after." }
    ]
  },
  horoscope: {
    forWhom: "Someone who reads monthly horoscopes and has noticed they are written for a twelfth of the world at a time.",
    faqs: [
      { q: "How is this different from a sun-sign horoscope?",
        a: "A sun-sign column is one of twelve texts written for everyone born in a month. This places each transit against your own natal houses, so the same transit means something different for your chart than for someone else's." },
      { q: "What period does it cover?",
        a: "The month ahead, with the dates on which each transit becomes exact and which of your houses it touches." }
    ]
  },
  laalkitab: {
    forWhom: "Someone who already knows their chart and wants the Lal Kitab view of it — a different tradition, with its own rules and its own remedies.",
    faqs: [
      { q: "How is Lal Kitab different from standard Vedic astrology?",
        a: "It reads the same chart by a different set of rules, and its remedies — upaay — are practical and inexpensive rather than ritual-heavy. It is a distinct tradition, not a summary of the other one." },
      { q: "Do I need a standard kundli first?",
        a: "No. This report is complete on its own, and computed from the same birth details." }
    ]
  },
  varshaphal: {
    forWhom: "Someone planning a specific year, who wants the annual chart rather than the birth chart.",
    faqs: [
      { q: "What is Varshaphal?",
        a: "An annual chart cast for the moment the Sun returns to its natal position — your solar return. It is read for the year that follows, not for the life." },
      { q: "What does it include?",
        a: "The Muntha, the Panchavargeeya bala, the Mudda dasha, and the themes month by month for that year." }
    ]
  },
  career: {
    forWhom: "Someone at a fork — job or their own thing, staying or moving — who wants to know what their chart already says about how they earn.",
    faqs: [
      { q: "Does it name a profession?",
        a: "It reads the significations: the 10th house and its lord, the four grahas that signify livelihood, the Dashamsha read for work alone, and your Amatyakaraka. It describes the shape of the work the chart points to rather than printing a job title." },
      { q: "Does it answer job versus business?",
        a: "It answers from the signals it finds, and prints each signal so you can see what the answer was built from." }
    ]
  },
  vastu: {
    forWhom: "Someone who owns or is about to take a home and wants it checked against the classical rules — including tenants, since none of the remedies require construction.",
    faqs: [
      { q: "Do I need my birth details for this?",
        a: "No. A Vastu report is about a building, so it asks for the property's facing and layout instead of a birth time." },
      { q: "Will the remedies mean breaking walls?",
        a: "No. Every dosh is named with the rule behind it, and the remedies given are ones that need no demolition." }
    ]
  },
  couples: {
    forWhom: "Two people who want something to do together rather than something to read — and whoever is buying them a gift.",
    faqs: [
      { q: "Is this an astrology report?",
        a: "No. The Couples Challenge is a keepsake book of questions for two people to work through together, printed with both your names. It is not computed from a birth chart." },
      { q: "How is it meant to be used?",
        a: "One chapter at a time, together, with weekly check-ins built into the structure." }
    ]
  }
};

/**
 * Dosh in Hindi. The dosh page is where the Hindi ad lands, so its "who is this
 * for" and FAQ have a full Hindi version — shown in Hindi mode, while the
 * English set above still feeds the SEO schema and English mode.
 */
export const DOSH_FAQ_HI: { forWhom: string; faqs: QA[] } = {
  forWhom: "हर वो व्यक्ति जिसे कहा गया कि उसकी कुंडली में दोष है, पर कभी साफ़ नहीं बताया गया कि इसका मतलब क्या — अक्सर शादी से पहले। यह वह रिपोर्ट है जो इस सवाल को दोनों तरफ़ से बंद कर देती है।",
  faqs: [
    { q: "अगर मेरी कुंडली में कोई दोष नहीं निकला तो?",
      a: "तब भी रिपोर्ट बताएगी कि कौन-कौन से दोष जाँचे गए और आपकी कुंडली में वे क्यों लागू नहीं होते, या उनका प्रभाव क्यों कम/निष्प्रभावी है। उद्देश्य सिर्फ़ दोष ढूँढना नहीं, बल्कि आपकी कुंडली की स्थिति साफ़-साफ़ समझाना है — इसलिए एक साफ़ कुंडली भी उतनी ही उपयोगी जानकारी है।" },
    { q: "क्या यह एक बार का payment है?",
      a: "हाँ, यह एक बार का payment है। कोई recurring subscription नहीं, कोई छुपा शुल्क नहीं।" },
    { q: "क्या रिपोर्ट मेरी अपनी जन्म जानकारी से बनती है?",
      a: "हाँ। आपकी दी हुई जन्म तारीख़, समय और स्थान से कुंडली की गणना होती है, और हर दोष उसी कुंडली पर जाँचा जाता है — कोई सामान्य लेख नहीं, आपकी अपनी रिपोर्ट।" },
    { q: "अगर रिपोर्ट पसंद न आए?",
      a: "पूरा पैसा वापस, बिना कोई सवाल। अगर रिपोर्ट आपके काम की न लगे, तो हमें WhatsApp पर लिखिए और पूरी राशि लौटा दी जाएगी।" },
    { q: "यह कौन-कौन से दोष जाँचती है?",
      a: "मांगलिक, काल सर्प, साढ़े साती, पितृ, गुरु चांडाल, श्रापित, अंगारक, ग्रहण, विष योग, केमद्रुम, पाप कर्तरी, शकट, गंडमूल और दरिद्र — कुल चौदह, हर एक आपकी अपनी कुंडली पर।" },
    { q: "निवारण के बारे में क्या?", 
      a: "यही वह हिस्सा है जो अधिकतर रिपोर्ट छोड़ देती हैं। अकेले मांगलिक के दस शास्त्रीय नियम हैं जो उसे कम या रद्द करते हैं, और रिपोर्ट हर एक को आपकी कुंडली पर जाँचती है — इसीलिए एक ही स्थिति एक कुंडली में गंभीर और दूसरी में निरर्थक होती है।" }
  ]
};
