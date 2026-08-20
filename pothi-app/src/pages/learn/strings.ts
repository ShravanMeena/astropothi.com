import type { Lang } from "../../lib/route";

/**
 * The chrome around a learn article, in both languages.
 *
 * The site's global nav and footer stay English — translating the whole
 * interface is a separate piece of work, and a half-translated one reads worse
 * than an untranslated one. What is translated here is everything inside the
 * article: its headings, its call to action and its disclaimer. A Hindi reader
 * should never hit an English sentence in the part of the page that is making
 * a claim or asking for money.
 */
const S = {
  en: {
    eyebrow: "Learn",
    indexTitle: "Doshas, explained",
    indexLede: "Fourteen doshas, each explained from the same rules our reports run on — what forms it, what cancels it, and what the classical texts prescribe.",
    indexNote: "Written from the engine, not around it. Every rule below is the rule that runs on a paying customer's chart.",
    ruler: "Signifying planet",
    affects: "Chiefly affects",
    secForms: "How it forms",
    secMeans: "What it signifies",
    secPresent: "When it is present",
    secAbsent: "When it is not",
    secEffects: "What it tends to show up as",
    secClauses: "The cancellations",
    clausesLede: "Most sources name the dosha and stop. The texts also name the conditions that cancel it — which is why the same placement can be serious in one chart and irrelevant in the next.",
    full: "Full cancellation",
    partial: "Partial cancellation",
    mitigator: "Reduces severity",
    secRemedies: "Classical remedies",
    secLucky: "Associations",
    secFaq: "Common questions",
    secSeverity: "How severity is graded",
    severityLede: "Saying a dosha is present tells you almost nothing on its own. Our reports grade it 0–100 from the chart and print the band:",
    ctaTitle: "Is this in your chart?",
    ctaBody: "The Dosh report tests all fourteen against your own birth chart — what forms, what is cancelled, how severe it reads, and what to do. Computed from your exact birth time, in English or Hindi.",
    ctaBtn: "Get the Dosh report",
    ctaAlt: "See all reports",
    inlineCta: "This page explains the rule. Your chart is what decides whether it applies.",
    inlineBtn: "Check my chart",
    related: "Other doshas",
    otherLabel: "Read this in Hindi",
    other: "पढ़ें हिन्दी में",
    backToIndex: "All doshas",
    disclaimer: "For reflection and guidance. Not medical, legal or financial advice. Consult a qualified astrologer before wearing any gemstone, and a qualified professional for anything that matters.",
    lucky: {
      color: "Colour", day: "Day", number: "Number", gemstone: "Gemstone",
      metal: "Metal", direction: "Direction", deity: "Deity", mantra: "Mantra"
    }
  },
  hi: {
    eyebrow: "जानें",
    indexTitle: "दोष, विस्तार से",
    indexLede: "चौदह दोष — प्रत्येक उन्हीं नियमों से समझाया गया जिन पर हमारी रिपोर्ट चलती है। क्या बनाता है, क्या निरस्त करता है, और शास्त्र क्या कहते हैं।",
    indexNote: "यह सामग्री हमारे गणना-इंजन से निकली है, उसके आसपास लिखी नहीं गई। नीचे दिया हर नियम वही है जो एक ग्राहक की कुंडली पर चलता है।",
    ruler: "कारक ग्रह",
    affects: "मुख्य प्रभाव-क्षेत्र",
    secForms: "यह कैसे बनता है",
    secMeans: "इसका अर्थ",
    secPresent: "जब यह उपस्थित हो",
    secAbsent: "जब यह न हो",
    secEffects: "प्रायः किस रूप में प्रकट होता है",
    secClauses: "निवारण",
    clausesLede: "अधिकांश स्रोत दोष का नाम बताकर रुक जाते हैं। शास्त्र उन शर्तों को भी बताते हैं जो उसे निरस्त कर देती हैं — इसीलिए एक ही स्थिति किसी कुंडली में गंभीर और किसी में निरर्थक हो सकती है।",
    full: "पूर्ण निवारण",
    partial: "आंशिक निवारण",
    mitigator: "तीव्रता घटाता है",
    secRemedies: "शास्त्रोक्त उपाय",
    secLucky: "सम्बद्ध विवरण",
    secFaq: "सामान्य प्रश्न",
    secSeverity: "तीव्रता कैसे आँकी जाती है",
    severityLede: "केवल यह कह देना कि दोष है, अपने आप में लगभग कुछ नहीं बताता। हमारी रिपोर्ट कुंडली से इसे 0–100 अंक देती है और श्रेणी छापती है:",
    ctaTitle: "क्या यह आपकी कुंडली में है?",
    ctaBody: "दोष रिपोर्ट चौदहों दोषों को आपकी अपनी जन्म कुंडली पर जाँचती है — क्या बनता है, क्या निरस्त होता है, तीव्रता कितनी है, और क्या करें। आपके सटीक जन्म समय से गणना, हिन्दी या अंग्रेज़ी में।",
    ctaBtn: "दोष रिपोर्ट लें",
    ctaAlt: "सभी रिपोर्ट देखें",
    inlineCta: "यह पृष्ठ नियम समझाता है। यह लागू होता है या नहीं, यह आपकी कुंडली तय करेगी।",
    inlineBtn: "मेरी कुंडली जाँचें",
    related: "अन्य दोष",
    otherLabel: "इसे अंग्रेज़ी में पढ़ें",
    other: "Read in English",
    backToIndex: "सभी दोष",
    disclaimer: "यह सामग्री चिंतन और मार्गदर्शन हेतु है। यह चिकित्सकीय, विधिक अथवा वित्तीय परामर्श नहीं है। कोई भी रत्न धारण करने से पूर्व योग्य ज्योतिषी से, और किसी भी महत्वपूर्ण निर्णय हेतु सम्बन्धित विशेषज्ञ से परामर्श करें।",
    lucky: {
      color: "रंग", day: "दिन", number: "अंक", gemstone: "रत्न",
      metal: "धातु", direction: "दिशा", deity: "देवता", mantra: "मंत्र"
    }
  }
} as const;

export const str = (lang: Lang) => S[lang];

/** The other language's URL for the same page — the hreflang pair. */
export const altPath = (lang: Lang, path: string) =>
  lang === "hi" ? path.replace(/^\/hi/, "") || "/" : `/hi${path}`;
