/**
 * The Manglik cancellation clauses, as prose for the learn pages.
 *
 * The clauses themselves — which ones exist, whether each is a full
 * cancellation or a partial mitigation, and the classical authority behind it —
 * are taken verbatim from engine/astrology/detect-doshas.js, which is the code
 * that actually runs on a paying customer's chart. Nothing here is a new
 * astrological claim; if the engine's rules change, this file is wrong and must
 * be updated with it. scripts/content_check.js fails when the two drift.
 *
 * The Hindi is a translation of that same English, not separate content. Term
 * choices follow engine/i18n/dosha-details-hi.js so the site and the reports
 * use one vocabulary. Classical sources keep their Devanagari names.
 */
export const MANGLIK_CLAUSES = [
  {
    key: "own-sign",
    weight: "full",
    en: { label: "Mars in his own sign — Aries or Scorpio",
          detail: "Classical texts (Bhavishya Phaladeepika, Saravali) hold that Mars in his own sign neutralises the Manglik effect entirely. Mars expresses cleanly, without affliction." },
    hi: { label: "मंगल स्वराशि में — मेष अथवा वृश्चिक",
          detail: "शास्त्र (भविष्य फलदीपिका, सारावली) मानते हैं कि स्वराशिस्थ मंगल मांगलिक प्रभाव को पूर्णतः निरस्त कर देता है। मंगल तब बिना पीड़ा के, अपने शुद्ध रूप में फल देता है।" }
  },
  {
    key: "exalted",
    weight: "full",
    en: { label: "Mars exalted in Capricorn",
          detail: "Exalted Mars is at his peak strength and discipline. The classical view is that the Manglik harm dissolves; the energy expresses as drive, leadership and clean ambition rather than friction." },
    hi: { label: "मंगल मकर राशि में उच्च का",
          detail: "उच्च का मंगल अपने चरम बल और अनुशासन में होता है। शास्त्रीय मत है कि तब मांगलिक हानि विलीन हो जाती है — वही ऊर्जा टकराव के स्थान पर उद्यम, नेतृत्व और स्वच्छ महत्वाकांक्षा बनकर प्रकट होती है।" }
  },
  {
    key: "jupiter-conjunct",
    weight: "partial",
    en: { label: "Mars conjunct Jupiter (Guru-Mangal yoga)",
          detail: "Jupiter's wisdom tempers Mars's heat. Marriage friction softens substantially; the dosha is treated as substantially reduced in classical match-making." },
    hi: { label: "मंगल-गुरु युति (गुरु-मंगल योग)",
          detail: "गुरु का विवेक मंगल की उष्णता को संयत करता है। वैवाहिक टकराव पर्याप्त रूप से कम होता है; शास्त्रीय गुण-मिलान में दोष को काफ़ी घटा हुआ माना जाता है।" }
  },
  {
    key: "moon-conjunct",
    weight: "partial",
    en: { label: "Mars conjunct the Moon",
          detail: "The Moon's emotional nature draws the heat out of Mars. Several authorities hold this as a cancellation of Manglik dosha." },
    hi: { label: "मंगल-चंद्र युति",
          detail: "चंद्रमा की भावप्रधान प्रकृति मंगल की उष्णता को खींच लेती है। कई आचार्य इसे मांगलिक दोष का निवारण मानते हैं।" }
  },
  {
    key: "jupiter-aspect",
    weight: "partial",
    en: { label: "Jupiter aspecting Mars (5th, 7th or 9th aspect)",
          detail: "Jupiter's protective aspect lands on Mars — the wisdom-aspect cushions the Mars house. Marriage friction is softened; classical authorities treat this as a substantial cancellation." },
    hi: { label: "गुरु की दृष्टि मंगल पर (पंचम, सप्तम अथवा नवम दृष्टि)",
          detail: "गुरु की रक्षक दृष्टि मंगल पर पड़ती है — यह ज्ञान-दृष्टि मंगल के भाव को सुरक्षा देती है। वैवाहिक टकराव मृदु होता है; शास्त्रकार इसे पर्याप्त निवारण मानते हैं।" }
  },
  {
    key: "7th-friendly-sign",
    weight: "partial",
    en: { label: "Mars in the 7th house in a sign that tempers him",
          detail: "Mars in the 7th house in certain signs is held by several authorities — notably the Mansagari — to be Manglik-cancelled, because the sign tempers Mars's marital aggression." },
    hi: { label: "सप्तम भाव में मंगल, अनुकूल राशि में",
          detail: "सप्तम भाव में कुछ विशेष राशियों में स्थित मंगल को कई आचार्य — विशेषकर मानसागरी — मांगलिक-निरस्त मानते हैं, क्योंकि वह राशि मंगल की वैवाहिक उग्रता को संयत कर देती है।" }
  },
  {
    key: "mercury-conjunct",
    weight: "mitigator",
    en: { label: "Mars conjunct Mercury",
          detail: "Mercury's intellect channels Mars's force into communication and skill. Severity reduces — though this is not a complete cancellation." },
    hi: { label: "मंगल-बुध युति",
          detail: "बुध की बुद्धि मंगल के वेग को संवाद और कौशल की दिशा दे देती है। तीव्रता घटती है — यद्यपि यह पूर्ण निवारण नहीं है।" }
  },
  {
    key: "venus-conjunct",
    weight: "mitigator",
    en: { label: "Mars conjunct Venus",
          detail: "Venus rules marriage; conjunction with Mars in a marital house can heighten passion but mitigates outright friction. Severity reduces." },
    hi: { label: "मंगल-शुक्र युति",
          detail: "शुक्र विवाह का कारक है; वैवाहिक भाव में मंगल से युति आवेग तो बढ़ा सकती है, किन्तु प्रत्यक्ष टकराव को घटाती है। तीव्रता कम होती है।" }
  },
  {
    key: "saturn-aspect",
    weight: "mitigator",
    en: { label: "Saturn aspecting Mars (3rd, 7th or 10th aspect)",
          detail: "Saturn slows and disciplines Mars. The impulsive heat that drives marital friction is held in check; severity is reduced." },
    hi: { label: "शनि की दृष्टि मंगल पर (तृतीय, सप्तम अथवा दशम दृष्टि)",
          detail: "शनि मंगल को धीमा और अनुशासित करता है। जो आवेगपूर्ण उष्णता वैवाहिक टकराव उत्पन्न करती है, वह नियंत्रित रहती है; तीव्रता घटती है।" }
  },
  {
    key: "retrograde",
    weight: "mitigator",
    en: { label: "Mars retrograde",
          detail: "A retrograde Mars expresses inwardly rather than outwardly. Several authorities — including B. V. Raman — hold that retrogression reduces the manifest Manglik effect." },
    hi: { label: "मंगल वक्री",
          detail: "वक्री मंगल बाहर की अपेक्षा भीतर की ओर फल देता है। कई आचार्य — बी. वी. रमन सहित — मानते हैं कि वक्रत्व प्रकट मांगलिक प्रभाव को घटाता है।" }
  }
];
