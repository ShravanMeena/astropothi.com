import type { Lang } from "./lang";

/**
 * The report detail page, in both languages.
 *
 * This is the only page that translates, and the reason is narrow: it is where
 * an ad lands and where ₹499 is decided. The chapter list and the sample images
 * already come from the server in the chosen language — this file is the copy
 * around them, so a Hindi reader is not handed Hindi sample pages framed by an
 * English page.
 *
 * The Devanagari titles (`deva`) are NOT translations of the English names; they
 * are what the book itself prints on its cover, so they are the same in both
 * languages and live here only once.
 */

export type Pitch = { deva: string; line: string; body: string };

/** Section headings and buttons — everything on the page that is not a report. */
export const UI = {
  en: {
    back: "← All reports",
    fallbackEyebrow: "Vedic report",
    chaptersPages: (c: number, p: number) => `${c} chapters · ${p} pages`,
    buyShort: (price: string) => `Get it — ${price}`,
    buyLong: (price: string) => `Generate mine — ${price}`,
    inside: "Inside the book",
    turnPages: "Turn the pages.",
    chooseEdition: "Choose the edition",
    threeTypesettings: "Three typesettings. Seven inks.",
    whatsInside: "What's inside",
    allWeNeed: "Birth date, time and place is all we need.",
    contents: "Contents",
    chapters: "Chapters",
    oneTime: "One-time",
    sample: "Sample",
    fastLine: "PDF in under a minute · No account needed",
    pagesLabel: "Pages",
    allChapters: (n: number) => `All ${n} chapters.`,
    showAll: (n: number) => `Show all ${n} chapters`,
    contentsBody: "The actual table of contents — not a summary of one. Every chapter is written from your own placements.",
    askExamples: [
      "What does this say about my marriage?",
      "Which period is difficult?",
      "Explain chapter 7 simply"
    ],

    // Sample strip
    tapToTurn: (edition: string) => `Tap the page to turn · ${edition} edition`,
    realSpreads: "Real spreads from this exact edition — the opening chapters and two pages from deep inside, where the reading actually lives.",
    sampleCaption: (name: string) => `${name} · sample`,
    pageOf: (a: number, b: number) => `Page ${a} · ${b}`,

    // Ask
    askEyebrow: "Ask your report anything",
    askBody: (n: number | string) => `A ${n}-chapter book is a lot to hold in your head. Once it is ready, ask it in your own words and it answers from your own chapters — in English or Hindi, as often as you like, at no extra cost.`,

    // Editions
    editionsNote: "The pages above re-render as you choose — this is the book you receive.",

    // Close
    closeLine: "Your chart, written out in full.",
    refundLine: "100% refund, no questions asked, if it is not worth it to you.",
    needHelp: "Need help?",
    supportTitle: "Stuck, or something looks wrong?",
    supportBody: (hours: string) => `A person reads every message — not a bot. Ask about your chart, your reading, your payment or your order. ${hours}.`,
    supportCall: "Call",

    // Why us
    whyEyebrow: "Why astropothi",
    whyTitle: "The chart is the same. The book is not.",
    whyLede: "Every service casts the same chart from the same ephemeris. What differs is what lands in your hands afterwards.",
    usual: "The usual report",
    usualShort: "Usual",
    whyFootnote: "“The usual report” describes what the large Indian astrology services currently sell at this price. Compare for yourself before buying — the sample above is free.",
    navReports: "Reports", navHow: "How it works", navDoshas: "Doshas",
    navFaq: "Questions", navAbout: "About", navAstrologers: "For astrologers",
    navSignIn: "Sign in",
    pageLabel: (label: string, of: string) => `Page ${label}${of}`,
    pageOfSuffix: (n: number) => ` of ${n}`,
    buyBare: "Generate mine",
    chaptersCount: (n: number) => `${n} chapters`,
    refundStrong: "100% refund",
    refundRest: ", no questions asked",
    trustSecure: "100% secure payments",
    trustRefund: "100% refund, no questions",
    trustComputed: "Computed, never templated",
    engineEyebrow: "Computed, not copied",
    engineTitleA: "Nine grahas.",
    engineTitleB: "One ephemeris.",
    engineLede: "Every fact in your book — every sign, house, date and score — is computed from your own chart. The explanation around those facts is written in plain language, and it may never introduce a placement the calculation did not find.",
    engineFacts: [
      ["Sidereal, Lahiri", "Chitrapaksha ayanamsha, within 2.3 arcseconds of the reference value."],
      ["480 invariants", "Every chart is checked: nodes exactly 180° apart, dashas totalling 120 years, Ashtakavarga summing to 337."],
      ["Your minute, not your day", "Lagna moves a full sign every two hours. We use the birth time you give us."],
      ["Facts, then plain language", "The chart is arithmetic and never guessed. What it means is explained in words anyone can read — checked, so it can only explain what was computed."]
    ] as [string, string][],
    rows: [
      { what: "Length", them: "6–20 pages, mostly headings", us: "25–88 pages, every chapter written out" },
      { what: "Written by", them: "A template with your name dropped in", us: "Computed from your minute of birth, then explained" },
      { what: "Delivery", them: "24–72 hours, by email", us: "Under a minute, on this page and on WhatsApp" },
      { what: "Questions after", them: "Pay again for a consultation", us: "Ask the report itself, free, as often as you like" },
      { what: "Language", them: "English, or a machine translation", us: "Written in Hindi or English, both properly typeset" },
      { what: "If you dislike it", them: "No refund", us: "100% refund, no questions asked" }
    ]
  },
  hi: {
    back: "← सभी रिपोर्ट",
    fallbackEyebrow: "वैदिक रिपोर्ट",
    chaptersPages: (c: number, p: number) => `${c} अध्याय · ${p} पृष्ठ`,
    buyShort: (price: string) => `लीजिए — ${price}`,
    buyLong: (price: string) => `मेरी रिपोर्ट बनाइए — ${price}`,
    inside: "किताब के भीतर",
    turnPages: "पन्ने पलटिए।",
    chooseEdition: "संस्करण चुनिए",
    threeTypesettings: "तीन छपाई शैलियाँ। सात रंग।",
    whatsInside: "भीतर क्या है",
    allWeNeed: "बस जन्म की तारीख़, समय और स्थान चाहिए।",
    contents: "अनुक्रम",
    chapters: "अध्याय",
    oneTime: "एक बार का शुल्क",
    sample: "नमूना",
    fastLine: "एक मिनट से कम में PDF · खाता बनाने की ज़रूरत नहीं",
    pagesLabel: "पृष्ठ",
    allChapters: (n: number) => `पूरे ${n} अध्याय।`,
    showAll: (n: number) => `सभी ${n} अध्याय देखिए`,
    contentsBody: "यह असली अनुक्रम है, उसका सार नहीं। हर अध्याय आपकी अपनी ग्रह-स्थिति से लिखा जाता है।",
    askExamples: [
      "मेरे विवाह के बारे में यह क्या कहती है?",
      "कौन-सा समय कठिन है?",
      "सातवाँ अध्याय आसान भाषा में समझाइए"
    ],

    tapToTurn: (edition: string) => `पन्ना पलटने के लिए छुएँ · ${edition} संस्करण`,
    realSpreads: "इसी संस्करण के असली पन्ने — शुरुआती अध्याय और भीतर से दो पन्ने, जहाँ असली पढ़ाई है।",
    sampleCaption: (name: string) => `${name} · नमूना`,
    pageOf: (a: number, b: number) => `पृष्ठ ${a} · ${b}`,

    askEyebrow: "अपनी रिपोर्ट से कुछ भी पूछिए",
    askBody: (n: number | string) => `${n} अध्यायों की किताब एक साथ याद रखना आसान नहीं। तैयार होने के बाद अपनी भाषा में पूछिए — जवाब आपके अपने अध्यायों से आएगा, हिन्दी या अंग्रेज़ी में, जितनी बार चाहें, बिना किसी अतिरिक्त शुल्क के।`,

    editionsNote: "ऊपर के पन्ने आपकी पसंद के साथ बदलते हैं — यही किताब आपको मिलेगी।",

    closeLine: "आपकी कुंडली, पूरी लिखी हुई।",
    refundLine: "पसंद न आए तो 100% रिफ़ंड, बिना कोई सवाल।",
    needHelp: "मदद चाहिए?",
    supportTitle: "कहीं अटक गए, या कुछ ठीक नहीं लग रहा?",
    supportBody: (hours: string) => `हर संदेश एक इंसान पढ़ता है — कोई बॉट नहीं। अपनी कुंडली, रिपोर्ट, भुगतान या ऑर्डर — किसी भी बारे में पूछिए। ${hours}।`,
    supportCall: "कॉल कीजिए",

    whyEyebrow: "astropothi क्यों",
    whyTitle: "कुंडली वही है। किताब वही नहीं।",
    whyLede: "हर सेवा उसी गणित से वही कुंडली बनाती है। फ़र्क़ इसमें है कि आपके हाथ में आख़िर आता क्या है।",
    usual: "आम रिपोर्ट",
    usualShort: "आम",
    whyFootnote: "“आम रिपोर्ट” से मतलब उन बड़ी भारतीय ज्योतिष सेवाओं से है जो इसी क़ीमत पर बिकती हैं। ख़रीदने से पहले ख़ुद तुलना कीजिए — ऊपर का नमूना मुफ़्त है।",
    navReports: "रिपोर्ट", navHow: "कैसे काम करता है", navDoshas: "दोष",
    navFaq: "सवाल", navAbout: "हमारे बारे में", navAstrologers: "ज्योतिषियों के लिए",
    navSignIn: "साइन इन",
    pageLabel: (label: string, of: string) => `पृष्ठ ${label}${of}`,
    pageOfSuffix: (n: number) => ` / ${n}`,
    buyBare: "मेरी रिपोर्ट बनाइए",
    chaptersCount: (n: number) => `${n} अध्याय`,
    refundStrong: "100% रिफ़ंड",
    refundRest: ", बिना कोई सवाल",
    trustSecure: "100% सुरक्षित भुगतान",
    trustRefund: "100% रिफ़ंड, बिना सवाल",
    trustComputed: "गणना से बनी, साँचे से नहीं",
    engineEyebrow: "गणना से, नक़ल से नहीं",
    engineTitleA: "नौ ग्रह।",
    engineTitleB: "एक ही गणित।",
    engineLede: "आपकी किताब की हर बात — हर राशि, भाव, तिथि और अंक — आपकी अपनी कुंडली से गणना करके निकाली जाती है। उसके आस-पास की व्याख्या सरल भाषा में लिखी जाती है, और वह कोई ऐसी स्थिति नहीं जोड़ सकती जो गणना में मिली ही न हो।",
    engineFacts: [
      ["निरयण, लाहिड़ी", "चित्रपक्ष अयनांश, मानक मान से 2.3 आर्कसेकंड के भीतर।"],
      ["480 जाँचें", "हर कुंडली परखी जाती है: राहु-केतु ठीक 180° पर, दशाओं का योग 120 वर्ष, अष्टकवर्ग का योग 337।"],
      ["आपका मिनट, सिर्फ़ दिन नहीं", "लग्न हर दो घंटे में पूरी राशि बदल देता है। हम वही जन्म समय लेते हैं जो आप देते हैं।"],
      ["पहले तथ्य, फिर सरल भाषा", "कुंडली गणित है, अनुमान कभी नहीं। उसका अर्थ ऐसी भाषा में समझाया जाता है जो कोई भी पढ़ सके — और जाँचा जाता है, ताकि वह सिर्फ़ वही समझा सके जो गणना में निकला।"]
    ] as [string, string][],
    rows: [
      { what: "लंबाई", them: "6–20 पृष्ठ, ज़्यादातर शीर्षक", us: "25–88 पृष्ठ, हर अध्याय पूरा लिखा हुआ" },
      { what: "किसने लिखी", them: "एक तैयार साँचा, जिसमें आपका नाम डाल दिया गया", us: "आपके जन्म के मिनट से गणना, फिर व्याख्या" },
      { what: "कब मिलेगी", them: "24–72 घंटे, ईमेल पर", us: "एक मिनट से कम में, इसी पन्ने पर और WhatsApp पर" },
      { what: "बाद के सवाल", them: "परामर्श के लिए फिर से पैसे", us: "रिपोर्ट से ही पूछिए — मुफ़्त, जितनी बार चाहें" },
      { what: "भाषा", them: "अंग्रेज़ी, या मशीन का अनुवाद", us: "हिन्दी या अंग्रेज़ी में लिखी, दोनों ठीक से छपी" },
      { what: "पसंद न आए तो", them: "कोई रिफ़ंड नहीं", us: "100% रिफ़ंड, बिना कोई सवाल" }
    ]
  }
};

/** Per-report headline and body. `deva` is shared — it is the book's own title. */
const PITCH_HI: Record<string, { line: string; body: string }> = {
  kundli: {
    line: "पूरी कुंडली, पूरी तरह पढ़ी हुई।",
    body: "चौंसठ अध्याय — लग्न से लेकर दशा-अंतर्दशा तक। हर भाव, हर ग्रह, हर योग क्रम से पढ़ा गया, और हर बात आपकी अपनी कुंडली की गणना से निकली हुई — किसी सामान्य राशिफल से नहीं।"
  },
  dosh: {
    line: "चौदह दोष, जाँचे हुए।",
    body: "मंगल, काल सर्प, पितृ, ग्रहण, केमद्रुम और बाक़ी — हर एक की गणना से जाँच, उसकी तीव्रता का अंक, निवारण के शास्त्रीय नियम, और जो दोष आपकी कुंडली में हैं ही नहीं उनका भी साफ़ उल्लेख।"
  },
  love: {
    line: "विवाह के बारे में कुंडली क्या कहती है।",
    body: "सप्तम भाव, उसका स्वामी, शुक्र और मंगल की स्थिति — साथी का स्वभाव, विवाह का समय, और वे बातें जिन पर ध्यान देना ज़रूरी है।"
  },
  health: {
    line: "आपकी प्रकृति, ठीक से पढ़ी हुई।",
    body: "षष्ठ भाव और ग्रहों के शरीर-अधिकार से बनी एक पढ़ाई — किस अंग पर ध्यान चाहिए, कौन-सा समय सावधानी का है, और दिनचर्या में क्या बदलना उचित है। यह चिकित्सा नहीं है और न ही उसका विकल्प।"
  },
  horoscope: {
    line: "यह महीना, आपकी अपनी कुंडली पर।",
    body: "सामान्य राशिफल नहीं। इस महीने के गोचर आपकी जन्म कुंडली पर रखे गए हैं — कौन-सा ग्रह किस भाव से गुज़र रहा है, और उसका आपके लिए क्या अर्थ है।"
  },
  laalkitab: {
    line: "लाल किताब की पढ़ाई।",
    body: "अपनी ही परंपरा, अपने ही नियमों और अपने ही उपायों के साथ — ऋण, टेवा और वे सरल उपाय जिनके लिए न रत्न चाहिए न महँगा अनुष्ठान।"
  },
  varshaphal: {
    line: "आने वाला वर्ष।",
    body: "वर्ष कुंडली और ताजिक योगों से बना वार्षिक फल — मास दर मास, मुंथा की स्थिति के साथ, ताकि साल की दिशा पहले से दिखे।"
  },
  career: {
    line: "कर्म के बारे में कुंडली क्या कहती है।",
    body: "दशम भाव, उसका स्वामी और कर्मेश की स्थिति — किस दिशा का काम अनुकूल है, कब बदलाव का समय है, और स्वतंत्र काम बनाम नौकरी में कुंडली किसकी ओर झुकती है।"
  },
  vastu: {
    line: "आपका घर, दिशा दर दिशा।",
    body: "प्रवेश, रसोई, शयनकक्ष, पूजा स्थान, शौचालय और जल — हर एक वास्तु पुरुष मंडल पर जाँचा गया, दोष का नाम और भार बताया गया, और ऐसा उपाय दिया गया जिसमें तोड़फोड़ न हो।"
  },
  couples: {
    line: "तीस शामें, एक बार में एक सवाल।",
    body: "दो लोगों के लिए तीस दिन की चुनौती, जिस पर आप दोनों के नाम छपे हैं — आवरण पर भी और हर पन्ने के ऊपर भी। रोज़ एक सवाल और एक छोटा काम, चार हफ़्तों में बँटा — यादों से शुरू होकर योजनाओं तक। लिखने की जगह, चार साप्ताहिक समीक्षाएँ, और अंत में एक प्रमाणपत्र।"
  }
};

/**
 * The pitch in the reader's language.
 *
 * Falls back to English rather than to nothing: a report added without Hindi
 * copy should still sell, and a blank hero is the one outcome worse than an
 * untranslated one. See docs/09-adding-a-report.md — this is the eleventh place
 * a new report has to be registered.
 */
export function pitchFor(code: string, lang: Lang, en: Record<string, Pitch>): Pitch | undefined {
  const base = en[code];
  if (!base) return undefined;
  if (lang !== "hi") return base;
  const hi = PITCH_HI[code];
  return hi ? { deva: base.deva, line: hi.line, body: hi.body } : base;
}

export const ui = (lang: Lang) => UI[lang === "hi" ? "hi" : "en"];
