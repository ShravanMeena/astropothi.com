import type { Lang } from "./lang";

/**
 * The home page, in both languages.
 *
 * The report page had to translate because it is where money is decided. This
 * translates for a plainer reason: a visitor who has asked for Hindi and then
 * lands on the home page should not be handed English. The two files stay
 * separate because they are edited for different reasons — this one is
 * marketing copy, `reportStrings` is a product description.
 */
export const HOME = {
  en: {
    heroEyebrow: "Vedic · computed, then explained",
    heroDeva: "जन्म कुंडली",
    heroTitleA: "Your birth chart,",
    heroTitleB: "read properly.",
    heroLede: "A 64-chapter kundali computed from your exact birth time — every line traceable to a planetary position we can show you.",
    heroCta: "See every report",
    scrollToOpen: "scroll to open",
    bookAlt: "A printed astropothi Vedic report, open at a chapter page",

    howEyebrow: "How it works",
    howTitle: "Three steps, no account.",
    howSteps: [
      { t: "Your birth details", d: "Date, exact time, and place. The time matters more than anything else — it fixes the ascendant and every house cusp." },
      { t: "Choose how it looks", d: "Three designs, seven colourways. Classic, Editorial or Heritage — a different book each time, not a recolour." },
      { t: "Read it in a minute", d: "The book is typeset and delivered while you wait — on this page and on WhatsApp." }
    ],

    designsEyebrow: "The designs",
    designsTitle: "Three books, not three colours.",
    designsLede: "The same reading, laid out three different ways. The structure changes, not the palette — one runs to 53 pages, another to 135.",
    designLines: {
      classic: "Traditional Vedic setting. Serif throughout, a fine ruled border, chapters running one after another.",
      heritage: "A presentation edition. Gold frame, corner medallions, a title page for every long chapter.",
      editorial: "Modern and quiet. Two columns, generous margins, no ornament — a magazine rather than a manuscript."
    } as Record<string, string>,

    footerLede: "Vedic reports computed from an astronomical ephemeris, written out in full.",
    footerReports: "Reports", footerHow: "How it is computed", footerDoshas: "Doshas explained",
    footerFaq: "Questions", footerAbout: "About", footerYours: "Your reports",
    footerAstrologers: "For astrologers", footerContact: "Contact",
    legalTerms: "Terms of Service", legalPrivacy: "Privacy Policy",
    legalRefunds: "Refunds & Cancellation", legalGrievance: "Contact & Grievance",
    footerDisclaimer: "Reports are prepared for guidance and reflection. They are not a substitute for medical, legal, financial or psychiatric advice. Prices include GST. Not satisfied? We refund in full, no questions asked.",

    closeTitle: "Read what your chart actually says.",
    closeLede: "Computed from your exact birth time, written out in full, delivered in under a minute.",
    closeBrowse: (n: number) => `Browse all ${n} reports`,
    closeFaq: "Read the questions",
    reportsEyebrow: "The reports",
    reportsTitle: (n: string) => `${n} readings. One engine.`,
    // Spelled from the catalogue, not typed into the heading — this said
    // "Seven" for a while after the eighth report shipped.
    numberWords: ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
                  "Eight", "Nine", "Ten", "Eleven", "Twelve"],
    reportsMostComplete: "Most complete",
    reportsSeeInside: "See what's inside →",
    reportsLede: "Each one is computed, then written out in full — no summaries, no filler.",
    allReports: (n: number) => `All ${n} reports →`,
    notSure: "Not sure which one?",

    // The banner strip: one question and one line per report.
    banners: {
      kundli:     { q: "Your whole chart, read properly",   s: "64 chapters · every house, every planet, every dasha" },
      dosh:       { q: "Is something actually blocked?",    s: "14 doshas tested — what forms, what is cancelled" },
      love:       { q: "Will this one last?",               s: "How you love, where the friction is, and the timing" },
      health:     { q: "What your body asks of you",        s: "Constitution, the 6th house, and what to look after" },
      horoscope:  { q: "This month, against your chart",    s: "Not a sun-sign column — your transits, with dates" },
      laalkitab:  { q: "The remedies nobody else gives",    s: "A different tradition, with its own practical upaay" },
      varshaphal: { q: "What this year holds",              s: "Your solar return, Muntha, and month-by-month themes" },
      career:     { q: "Job, or your own thing?",           s: "The 10th house, the Dashamsha, and when work turns" },
      vastu:      { q: "Why the house feels wrong",         s: "Nine directions checked — with remedies, no demolition" },
      couples:    { q: "Thirty evenings, together",         s: "30 questions, both your names on the cover" }
    } as Record<string, { q: string; s: string }>,

    chaptersCount: (n: number) => `${n} chapters`,
    chaptersPages: (n: number) => `${n} chapters · up to 135 pages`,
    oneTime: "one-time",
    bookNow: "Book now",
    chShort: "ch",
    whichReport: "Which report?",
    supportHours: "9am – 9pm, every day",

    // The shelf: one hook and one description per report.
    cards: {
      kundli:     { f: "The whole picture",        t: "Every house and planet, the dasha timeline with dates, ten divisional charts, and remedies from your weakest placements." },
      dosh:       { f: "Something feels blocked",  t: "Fourteen classical doshas tested — what forms, what is cancelled, how severe it is, and what to do." },
      love:       { f: "Marriage and partnership", t: "How you love, what you need from a partner, where the friction starts, and whether it lasts." },
      health:     { f: "Constitution and energy",  t: "Lagna, the 6th house, the Moon, your tatva and prakriti — and what your body asks you to look after." },
      horoscope:  { f: "The month ahead",          t: "Not a sun-sign column. Every transit placed against your own houses, with the dates that matter." },
      laalkitab:  { f: "Practical remedies",       t: "A different tradition with its own logic and its own upaay — inexpensive, and drawn from your chart." },
      varshaphal: { f: "The year ahead",           t: "Your solar return: Muntha, Panchavargeeya bala, the Mudda dasha, and the themes month by month." },
      career:     { f: "Work and livelihood",      t: "The 10th house, its lord and the Dashamsha — which direction of work suits you, and when it turns." },
      vastu:      { f: "The home itself",          t: "Nine directions checked against the Vastu Purusha Mandala, each dosh named with the rule behind it." },
      couples:    { f: "For the two of you",       t: "Thirty evenings, thirty questions, both your names on the cover — with room to write and a certificate at the end." }
    } as Record<string, { f: string; t: string }>
  },

  hi: {
    heroEyebrow: "वैदिक · गणना से, फिर व्याख्या",
    heroDeva: "जन्म कुंडली",
    heroTitleA: "आपकी कुंडली,",
    heroTitleB: "ठीक से पढ़ी हुई।",
    heroLede: "आपके सटीक जन्म समय से बनी 64 अध्यायों की कुंडली — हर पंक्ति किसी ग्रह-स्थिति तक जाती है, जो हम आपको दिखा सकते हैं।",
    heroCta: "सभी रिपोर्ट देखिए",
    scrollToOpen: "खोलने के लिए स्क्रॉल कीजिए",
    bookAlt: "astropothi की छपी हुई वैदिक रिपोर्ट, एक अध्याय के पन्ने पर खुली हुई",

    howEyebrow: "कैसे काम करता है",
    howTitle: "तीन क़दम, कोई खाता नहीं।",
    howSteps: [
      { t: "आपके जन्म का विवरण", d: "तिथि, सटीक समय और स्थान। समय सबसे ज़्यादा मायने रखता है — उसी से लग्न और हर भाव की संधि तय होती है।" },
      { t: "रूप चुनिए", d: "तीन डिज़ाइन, सात रंग। Classic, Editorial या Heritage — हर बार अलग किताब, सिर्फ़ रंग बदला हुआ नहीं।" },
      { t: "एक मिनट में पढ़िए", d: "किताब आपके सामने ही छपकर तैयार होती है — इसी पन्ने पर और WhatsApp पर।" }
    ],

    designsEyebrow: "डिज़ाइन",
    designsTitle: "तीन किताबें, तीन रंग नहीं।",
    designsLede: "वही पढ़ाई, तीन अलग तरीक़ों से छपी हुई। ढाँचा बदलता है, रंग नहीं — एक 53 पृष्ठ की बनती है, दूसरी 135 की।",
    designLines: {
      classic: "पारंपरिक वैदिक शैली। पूरे में सेरिफ़, एक महीन रेखा का हाशिया, अध्याय एक के बाद एक चलते हुए।",
      heritage: "प्रस्तुति संस्करण। स्वर्ण फ़्रेम, कोनों पर पदक, हर लंबे अध्याय का अपना शीर्षक पृष्ठ।",
      editorial: "आधुनिक और शांत। दो कॉलम, खुले हाशिये, कोई अलंकरण नहीं — पांडुलिपि से ज़्यादा पत्रिका।"
    } as Record<string, string>,

    footerLede: "खगोलीय गणना से बनी वैदिक रिपोर्ट, पूरी लिखी हुई।",
    footerReports: "रिपोर्ट", footerHow: "गणना कैसे होती है", footerDoshas: "दोष समझिए",
    footerFaq: "सवाल", footerAbout: "हमारे बारे में", footerYours: "आपकी रिपोर्ट",
    footerAstrologers: "ज्योतिषियों के लिए", footerContact: "संपर्क",
    legalTerms: "सेवा की शर्तें", legalPrivacy: "निजता नीति",
    legalRefunds: "रिफ़ंड और रद्दीकरण", legalGrievance: "संपर्क एवं शिकायत",
    footerDisclaimer: "रिपोर्ट मार्गदर्शन और आत्म-चिंतन के लिए बनाई जाती हैं। ये चिकित्सा, क़ानूनी, वित्तीय या मानसिक स्वास्थ्य संबंधी सलाह का विकल्प नहीं हैं। क़ीमतों में GST शामिल है। पसंद न आए? पूरी रक़म वापस, बिना कोई सवाल।",

    closeTitle: "पढ़िए कि आपकी कुंडली असल में क्या कहती है।",
    closeLede: "आपके सटीक जन्म समय से गणना, पूरी लिखी हुई, एक मिनट से कम में आपके पास।",
    closeBrowse: (n: number) => `सभी ${n} रिपोर्ट देखिए`,
    closeFaq: "सवाल-जवाब पढ़िए",
    reportsEyebrow: "रिपोर्ट",
    reportsTitle: (n: string) => `${n} पढ़ाइयाँ। एक ही गणित।`,
    numberWords: ["", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात",
                  "आठ", "नौ", "दस", "ग्यारह", "बारह"],
    reportsMostComplete: "सबसे विस्तृत",
    reportsSeeInside: "भीतर क्या है →",
    reportsLede: "हर एक गणना से बनती है, फिर पूरी लिखी जाती है — न सार, न भराव।",
    allReports: (n: number) => `सभी ${n} रिपोर्ट →`,
    notSure: "समझ नहीं आ रहा कौन-सी लें?",

    banners: {
      kundli:     { q: "पूरी कुंडली, ठीक से पढ़ी हुई",        s: "64 अध्याय · हर भाव, हर ग्रह, हर दशा" },
      dosh:       { q: "क्या सच में कुछ रुका हुआ है?",        s: "14 दोषों की जाँच — कौन बनता है, कौन कट जाता है" },
      love:       { q: "क्या यह रिश्ता टिकेगा?",              s: "आप कैसे प्यार करते हैं, टकराव कहाँ है, और समय क्या कहता है" },
      health:     { q: "आपका शरीर आपसे क्या माँगता है",       s: "प्रकृति, षष्ठ भाव, और किस बात का ध्यान रखना है" },
      horoscope:  { q: "यह महीना, आपकी कुंडली पर",            s: "सूर्य-राशि का कॉलम नहीं — आपके गोचर, तारीख़ों के साथ" },
      laalkitab:  { q: "वे उपाय जो और कोई नहीं बताता",         s: "अलग परंपरा, अपने ही व्यावहारिक उपाय" },
      varshaphal: { q: "यह साल क्या लेकर आया है",             s: "वर्ष कुंडली, मुंथा, और मास दर मास" },
      career:     { q: "नौकरी, या अपना काम?",                 s: "दशम भाव, दशांश, और काम कब मोड़ लेता है" },
      vastu:      { q: "घर कुछ ठीक क्यों नहीं लगता",          s: "नौ दिशाओं की जाँच — उपाय के साथ, बिना तोड़फोड़" },
      couples:    { q: "तीस शामें, साथ में",                  s: "30 सवाल, आवरण पर आप दोनों के नाम" }
    } as Record<string, { q: string; s: string }>,

    chaptersCount: (n: number) => `${n} अध्याय`,
    chaptersPages: (n: number) => `${n} अध्याय · 135 पृष्ठ तक`,
    oneTime: "एक बार का शुल्क",
    bookNow: "अभी लीजिए",
    chShort: "अध्याय",
    whichReport: "कौन-सी रिपोर्ट?",
    supportHours: "सुबह 9 से रात 9, रोज़",

    cards: {
      kundli:     { f: "पूरी तस्वीर",              t: "हर भाव और ग्रह, तारीख़ों के साथ दशा क्रम, दस वर्ग कुंडलियाँ, और सबसे कमज़ोर स्थितियों के उपाय।" },
      dosh:       { f: "कुछ रुका हुआ लगता है",      t: "चौदह शास्त्रीय दोषों की जाँच — कौन बनता है, कौन कट जाता है, कितना तीव्र है, और क्या करना है।" },
      love:       { f: "विवाह और साथ",             t: "आप कैसे प्यार करते हैं, साथी से क्या चाहिए, टकराव कहाँ से शुरू होता है, और रिश्ता टिकेगा या नहीं।" },
      health:     { f: "प्रकृति और ऊर्जा",          t: "लग्न, षष्ठ भाव, चंद्रमा, आपका तत्व और प्रकृति — और शरीर आपसे किस बात का ध्यान माँगता है।" },
      horoscope:  { f: "आने वाला महीना",           t: "सूर्य-राशि का कॉलम नहीं। हर गोचर आपके अपने भावों पर रखा हुआ, ज़रूरी तारीख़ों के साथ।" },
      laalkitab:  { f: "व्यावहारिक उपाय",          t: "अलग परंपरा, अपना तर्क और अपने उपाय — सस्ते, और आपकी अपनी कुंडली से निकले हुए।" },
      varshaphal: { f: "आने वाला साल",             t: "आपकी वर्ष कुंडली: मुंथा, पंचवर्गीय बल, मुद्दा दशा, और मास दर मास के विषय।" },
      career:     { f: "काम और जीविका",            t: "दशम भाव, उसका स्वामी और दशांश — किस दिशा का काम अनुकूल है, और वह कब मोड़ लेता है।" },
      vastu:      { f: "घर की अपनी जाँच",          t: "वास्तु पुरुष मंडल पर नौ दिशाओं की जाँच, हर दोष का नाम और उसके पीछे का नियम।" },
      couples:    { f: "आप दोनों के लिए",          t: "तीस शामें, तीस सवाल, आवरण पर आप दोनों के नाम — लिखने की जगह और अंत में एक प्रमाणपत्र।" }
    } as Record<string, { f: string; t: string }>
  }
};

export const homeUi = (lang: Lang) => HOME[lang === "hi" ? "hi" : "en"];
