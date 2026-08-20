import type { Lang } from "./lang";

/**
 * The checkout, in both languages.
 *
 * Kept apart from `reportStrings` because the two pages fail differently: the
 * report page persuades, the checkout instructs. Every string here is either a
 * label somebody has to act on or an error somebody has to fix, so the Hindi is
 * written to be *followed* rather than admired — short, imperative, and saying
 * what to do rather than what went wrong.
 */
export const BUY = {
  en: {
    // Block titles
    blockSubjectCouple: "The two of you",
    blockSubjectProperty: "The home being read",
    blockSubjectPerson: "Who the reading is for",
    blockWritten: "How you want it written",
    blockSend: "Where to send it",

    headingProperty: "About your home",
    headingPerson: "Your birth details",
    subProperty: "The facing decides everything else — stand inside your main door looking out.",
    subPerson: "Birth time matters most: it fixes the ascendant and every house.",

    // Fields
    yourName: "Your name",
    yourNameHint: "goes on the cover",
    yourNamePh: "As you would like it printed",
    partnerName: "Your partner's name",
    partnerNameHint: "goes on the cover too",
    partnerNamePh: "As they would like it printed",
    since: "Together since",
    sinceHint: "optional — month and year",
    fullName: "Full name",
    printName: "Name to print on the report",
    ownerPh: "The owner's name",
    dob: "Date of birth",
    tob: "Time of birth",
    pob: "Place of birth",
    pobHint: "pick from the list",
    gender: "Gender",
    select: "Select",
    female: "Female", male: "Male", other: "Other",
    language: "Report language",
    english: "English", hindi: "Hindi",
    whatsapp: "WhatsApp number",
    whatsappNote: "We use this to reach you about this order.",
    email: "Email",
    optional: "optional",
    emailPh: "you@example.com",
    coupon: "Coupon code",
    apply: "Apply",
    remove: "Remove",
    total: "Total",
    back: "← Back",
    payAmount: (amount: string) => `Pay ${amount} securely`,
    noteProperty: "The facing matters more than anything else here — it decides what belongs in every other corner. Stand inside your main door looking out; that is the direction the home faces.",
    notePerson: "Birth time matters more than anything else here — it fixes the ascendant and every house cusp. Use a birth certificate if you have one.",
    legal: "Price includes GST. Not satisfied with your report? We refund the full amount, no questions asked. Prepared for guidance; not a substitute for medical, legal or financial advice.",
    selectDate: "Select date",
    selectTime: "Select time",
    placePh: "Start typing a city or town…",
    pay: "Pay securely",

    // Errors — each says what to do, not merely what is wrong.
    errName: "Whose chart is this? Enter the full name.",
    errNameProperty: "Whose home is this? Enter the name to print on it.",
    errPartner1: "Enter your name — it goes on the cover.",
    errPartner2: "Enter your partner's name — it goes on the cover too.",
    errSince: "Use month/year, like 03/2019.",
    errFacing: "Which way the main entrance faces — this is what the whole report is read from.",
    errDob: "Choose the date of birth.",
    errTob: "Choose the time of birth — it fixes the ascendant.",
    errPlacePick: "Pick the birth place from the list so we can resolve its coordinates.",
    errPlaceEmpty: "Enter the birth place and pick it from the list.",
    errGender: "Pick one — the reading differs.",
    errLanguage: "Which language should the report be written in?",
    errPhone: "Enter a 10-digit mobile number.",
    errEmail: "That email address does not look right.",
    errCoupon: "Could not check that code.",

    // Stages, while the order is being placed
    stagePay: "Taking you to payment",
    stagePaySub: "Razorpay's secure page is opening. Do not close this tab.",
    stagePrep: "Preparing your report",
    stagePrepSub: "This takes a few seconds. Please stay on the page."
  },

  hi: {
    blockSubjectCouple: "आप दोनों",
    blockSubjectProperty: "जिस घर की जाँच है",
    blockSubjectPerson: "यह रिपोर्ट किसके लिए है",
    blockWritten: "कैसी लिखी जाए",
    blockSend: "कहाँ भेजें",

    headingProperty: "आपके घर के बारे में",
    headingPerson: "आपके जन्म का विवरण",
    subProperty: "मुख की दिशा से ही बाक़ी सब तय होता है — मुख्य द्वार के भीतर खड़े होकर बाहर की ओर देखिए।",
    subPerson: "जन्म समय सबसे ज़रूरी है: इसी से लग्न और हर भाव तय होता है।",

    yourName: "आपका नाम",
    yourNameHint: "आवरण पर छपेगा",
    yourNamePh: "जैसा छपवाना चाहें",
    partnerName: "साथी का नाम",
    partnerNameHint: "यह भी आवरण पर छपेगा",
    partnerNamePh: "जैसा वे छपवाना चाहें",
    since: "कब से साथ",
    sinceHint: "वैकल्पिक — महीना और साल",
    fullName: "पूरा नाम",
    printName: "रिपोर्ट पर छपने वाला नाम",
    ownerPh: "मालिक का नाम",
    dob: "जन्म तिथि",
    tob: "जन्म समय",
    pob: "जन्म स्थान",
    pobHint: "सूची में से चुनिए",
    gender: "लिंग",
    select: "चुनिए",
    female: "स्त्री", male: "पुरुष", other: "अन्य",
    language: "रिपोर्ट की भाषा",
    english: "अंग्रेज़ी", hindi: "हिन्दी",
    whatsapp: "WhatsApp नंबर",
    whatsappNote: "इसी नंबर पर हम इस ऑर्डर के बारे में संपर्क करेंगे।",
    email: "ईमेल",
    optional: "वैकल्पिक",
    emailPh: "you@example.com",
    coupon: "कूपन कोड",
    apply: "लगाइए",
    remove: "हटाइए",
    total: "कुल",
    back: "← वापस",
    payAmount: (amount: string) => `${amount} सुरक्षित भुगतान कीजिए`,
    noteProperty: "यहाँ सबसे ज़्यादा मायने मुख की दिशा रखती है — उसी से तय होता है कि हर कोने में क्या उचित है। मुख्य द्वार के भीतर खड़े होकर बाहर देखिए; वही दिशा भवन की दिशा है।",
    notePerson: "यहाँ सबसे ज़्यादा मायने जन्म का समय रखता है — उसी से लग्न और हर भाव की संधि तय होती है। जन्म प्रमाणपत्र हो तो उसी से लीजिए।",
    legal: "क़ीमत में GST शामिल है। रिपोर्ट पसंद न आए तो पूरी रक़म वापस, बिना कोई सवाल। यह मार्गदर्शन के लिए है; चिकित्सा, क़ानूनी या वित्तीय सलाह का विकल्प नहीं।",
    selectDate: "तिथि चुनिए",
    selectTime: "समय चुनिए",
    placePh: "शहर या क़स्बे का नाम लिखिए…",
    pay: "सुरक्षित भुगतान",

    errName: "यह कुंडली किसकी है? पूरा नाम लिखिए।",
    errNameProperty: "यह घर किसका है? जो नाम छपवाना है वह लिखिए।",
    errPartner1: "अपना नाम लिखिए — यह आवरण पर छपेगा।",
    errPartner2: "साथी का नाम लिखिए — यह भी आवरण पर छपेगा।",
    errSince: "महीना/साल इस तरह लिखिए — 03/2019।",
    errFacing: "मुख्य द्वार किस दिशा में खुलता है — पूरी रिपोर्ट इसी से पढ़ी जाती है।",
    errDob: "जन्म तिथि चुनिए।",
    errTob: "जन्म समय चुनिए — इसी से लग्न तय होता है।",
    errPlacePick: "जन्म स्थान सूची में से चुनिए, ताकि उसके अक्षांश-देशांतर निकाले जा सकें।",
    errPlaceEmpty: "जन्म स्थान लिखिए और सूची में से चुनिए।",
    errGender: "एक चुनिए — पढ़ाई अलग होती है।",
    errLanguage: "रिपोर्ट किस भाषा में लिखी जाए?",
    errPhone: "10 अंकों का मोबाइल नंबर लिखिए।",
    errEmail: "यह ईमेल पता ठीक नहीं लग रहा।",
    errCoupon: "यह कोड जाँचा नहीं जा सका।",

    stagePay: "भुगतान पर ले जा रहे हैं",
    stagePaySub: "Razorpay का सुरक्षित पन्ना खुल रहा है। यह टैब बंद न करें।",
    stagePrep: "आपकी रिपोर्ट तैयार हो रही है",
    stagePrepSub: "इसमें कुछ सेकंड लगते हैं। कृपया पन्ने पर बने रहिए।"
  }
};

export const buyUi = (lang: Lang) => BUY[lang === "hi" ? "hi" : "en"];
