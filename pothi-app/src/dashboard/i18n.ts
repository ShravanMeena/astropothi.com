// UI language. English is the default; Hindi is a toggle. This is SEPARATE from
// the report language, which the pandit picks per report for his client.
import { createContext, useContext } from "react";

export type UiLang = "en" | "hi";

export const STRINGS = {
  en: {
    brand: "Pothi", tagline: "White-label astrology reports for astrologers",
    nav: { home: "Dashboard", create: "New Report", library: "Library", brand: "Branding", billing: "Credits" },
    login: { title: "Sign in", phone: "Mobile number", otp: "One-time password",
             send: "Send OTP", verify: "Sign in", devHint: "Filled in for you — SMS delivery is not switched on yet",
             sub: "Your reports. Your name. Your price.",
             invite: "Invite code", inviteHint: "Ask whoever invited you for the code",
             seatsLeft: "invite-only · {n} of {t} places left", full: "The pilot is full for now." },
    dash: { earnings: "Estimated earnings", reports: "reports", cost: "cost", roi: "return",
            credits: "credits left", topup: "Add credits", byType: "Revenue by report",
            recent: "Recent reports", empty: "No reports yet — create your first one.",
            setPrices: "Set your selling prices", estimate: "Estimated from prices you set" },
    create: { step1: "Report", step2: "Client", step3: "Design", step4: "Review",
              chooseReport: "Choose a report", chapters: "chapters", credits: "credits",
              clientDetails: "Client birth details", name: "Full name", dob: "Date of birth",
              tob: "Time of birth", pob: "Place of birth", gender: "Gender",
              male: "Male", female: "Female", other: "Other",
              reportLang: "Report language", clientPhone: "Client WhatsApp (optional)",
              pobHint: "Start typing a city or town…", pobPick: "Pick a place from the list",
              pobOk: "Location confirmed", draftKept: "Draft saved", clearDraft: "Clear form",
              chooseDesign: "Choose a design", chooseColour: "Choose a colour",
              designHint: "Each design is a different book — layout, structure and length, not just colour.",
              preview: "Live preview", previewHint: "Actual rendered pages of this exact combination",
              fullPages: "full report", showing: "showing first", openSample: "Open full sample",
              generate: "Generate", generating: "Generating…", back: "Back", next: "Continue",
              needCredits: "Not enough credits", ready: "Report ready", pages: "pages",
              viewPdf: "View PDF", sendWa: "Send on WhatsApp", another: "Create another" },
    brandp: { title: "Your branding", sub: "This appears on every page of every report. Pothi never appears.",
              honorific: "Title", displayName: "Your name", shopName: "Shop or institution",
              phone: "Phone", whatsapp: "WhatsApp", address: "Address", logo: "Logo URL",
              sample: "Use sample", tagline: "Tagline", defaults: "Defaults",
              save: "Save", saved: "Saved", trial: "Fill name, phone and logo to receive 10 free credits." },
    billing: { title: "Add credits", sub: "You sell a report for ₹250–₹1,100. It costs you under ₹5.",
               custom: "Choose your own amount", creditsLabel: "credits", perCredit: "per credit",
               packs: "Or pick a pack", buy: "Buy", popular: "Most popular",
               validity: "days validity", gstIncl: "incl. GST", terms:
               "Prices include GST. No refund on generated reports. Unused credits refundable within 7 days." },
    pay: { demo: "Demo payment", order: "Order", subtotal: "Subtotal", gst: "GST 18%",
           total: "Total", pay: "Pay", cancel: "Cancel", processing: "Processing…",
           doNotClose: "Do not close this window", success: "Payment successful",
           added: "credits added", invoice: "Invoice", failed: "Payment failed",
           ok: "Done", noRealMoney: "Demo gateway — no real money is charged",
           upi: "UPI", upiSub: "PhonePe · GPay · Paytm", card: "Card", cardSub: "Visa · Mastercard · RuPay",
           nb: "Net banking", nbSub: "All major banks" },
    viewer: { download: "Download", close: "Close", sample: "Sample report" },
    pilot: { badge: "Free pilot", left: "free reports left", used: "of {t} used",
             note: "You are one of the first {t} astrologers on Pothi. Ten reports, free, no card.",
             ended: "Your free reports are used up — tell us what you think and we will top you up." },
    prices: { title: "Your selling prices", sub: "What you charge your client. Used only to estimate your earnings — we never see or take a cut.",
              price: "You charge", notSet: "Not set", save: "Save prices", saved: "Saved",
              unpriced: "report type(s) with no price — counted as ₹0" },
    clients: { tab: "Clients", reports: "Reports", title: "Client book",
               sub: "Everyone you have made a report for.", search: "Search name or phone…",
               empty: "No clients yet.", birthdays: "Birthdays this week",
               bdayNone: "No client birthdays in the next 7 days.",
               newReport: "New report", born: "Born", none: "—" },
    ledger: { title: "Credit history", purchases: "Purchases", invoice: "Invoice",
              empty: "Nothing yet.", reason: { purchase: "Purchase", generate: "Report", refund: "Refund", bonus: "Bonus", trial: "Trial credits", expiry: "Expired", adjustment: "Adjustment" } },
    gen: {
      title: "Preparing the report",
      hint: "This usually takes a few seconds. Keep this window open.",
      steps: [
        "Casting the birth chart from the ephemeris",
        "Placing the nine grahas across twelve houses",
        "Reading yogas, doshas and the dasha timeline",
        "Writing {n} chapters",
        "Typesetting pages and drawing the chart",
        "Applying your name and branding"
      ]
    },
    common: { signOut: "Sign out", credits: "credits", loading: "Loading…", required: "required" }
  },
  hi: {
    brand: "पोथी", tagline: "ज्योतिषियों के लिए आपके नाम से रिपोर्ट",
    nav: { home: "डैशबोर्ड", create: "नई रिपोर्ट", library: "रिपोर्ट", brand: "पहचान", billing: "क्रेडिट" },
    login: { title: "लॉगिन", phone: "मोबाइल नंबर", otp: "ओटीपी",
             send: "OTP भेजें", verify: "लॉगिन करें", devHint: "अपने आप भर गया — SMS भेजना अभी चालू नहीं है",
             sub: "आपकी रिपोर्ट। आपका नाम। आपका दाम।",
             invite: "निमंत्रण कोड", inviteHint: "जिन्होंने बुलाया है उनसे कोड लें",
             seatsLeft: "केवल निमंत्रण पर · {t} में से {n} जगह बाकी", full: "अभी सभी जगह भर चुकी हैं।" },
    dash: { earnings: "अनुमानित कमाई", reports: "रिपोर्ट", cost: "लागत", roi: "वापसी",
            credits: "क्रेडिट बचे", topup: "क्रेडिट जोड़ें", byType: "किससे कितना",
            recent: "हाल की रिपोर्ट", empty: "अभी कोई रिपोर्ट नहीं — पहली बनाइए।",
            setPrices: "अपने दाम तय करें", estimate: "आपके तय किए दामों से अनुमानित" },
    create: { step1: "रिपोर्ट", step2: "जातक", step3: "डिज़ाइन", step4: "पुष्टि",
              chooseReport: "रिपोर्ट चुनें", chapters: "अध्याय", credits: "क्रेडिट",
              clientDetails: "जातक का जन्म विवरण", name: "पूरा नाम", dob: "जन्म तिथि",
              tob: "जन्म समय", pob: "जन्म स्थान", gender: "लिंग",
              male: "पुरुष", female: "स्त्री", other: "अन्य",
              reportLang: "रिपोर्ट की भाषा", clientPhone: "जातक का WhatsApp (वैकल्पिक)",
              pobHint: "शहर या कस्बे का नाम लिखें…", pobPick: "सूची में से स्थान चुनें",
              pobOk: "स्थान पुष्ट", draftKept: "विवरण सुरक्षित", clearDraft: "फ़ॉर्म साफ़ करें",
              chooseDesign: "डिज़ाइन चुनें", chooseColour: "रंग चुनें",
              designHint: "हर डिज़ाइन एक अलग ग्रंथ है — बनावट, संरचना और लंबाई, सिर्फ़ रंग नहीं।",
              preview: "नमूना", previewHint: "इसी संयोजन के असली पन्ने",
              fullPages: "पूरी रिपोर्ट", showing: "पहले", openSample: "पूरा नमूना खोलें",
              generate: "बनाएँ", generating: "बन रही है…", back: "पीछे", next: "आगे",
              needCredits: "क्रेडिट कम हैं", ready: "रिपोर्ट तैयार", pages: "पन्ने",
              viewPdf: "PDF देखें", sendWa: "WhatsApp भेजें", another: "और बनाएँ" },
    brandp: { title: "आपकी पहचान", sub: "यह हर रिपोर्ट के हर पन्ने पर छपेगा। Pothi कहीं नहीं आएगा।",
              honorific: "आदर", displayName: "आपका नाम", shopName: "दुकान या संस्था",
              phone: "फ़ोन", whatsapp: "WhatsApp", address: "पता", logo: "लोगो URL",
              sample: "नमूना", tagline: "टैगलाइन", defaults: "डिफ़ॉल्ट",
              save: "सहेजें", saved: "सहेजा गया", trial: "नाम, फ़ोन और लोगो भरने पर 10 मुफ़्त क्रेडिट मिलेंगे।" },
    billing: { title: "क्रेडिट जोड़ें", sub: "एक रिपोर्ट आप ₹250–₹1,100 में बेचते हैं। लागत ₹5 से कम।",
               custom: "जितने चाहिए उतने लें", creditsLabel: "क्रेडिट", perCredit: "प्रति क्रेडिट",
               packs: "या तैयार पैक चुनें", buy: "खरीदें", popular: "सबसे लोकप्रिय",
               validity: "दिन वैध", gstIncl: "GST सहित", terms:
               "कीमत GST सहित। बनी हुई रिपोर्ट पर रिफ़ंड नहीं। बिना इस्तेमाल किए क्रेडिट 7 दिन में वापस।" },
    pay: { demo: "डेमो भुगतान", order: "ऑर्डर", subtotal: "मूल्य", gst: "GST 18%",
           total: "कुल", pay: "भुगतान करें", cancel: "रद्द करें", processing: "भुगतान हो रहा है…",
           doNotClose: "विंडो बंद न करें", success: "भुगतान सफल",
           added: "क्रेडिट जुड़ गए", invoice: "बिल संख्या", failed: "भुगतान विफल",
           ok: "ठीक है", noRealMoney: "डेमो गेटवे — कोई असली पैसा नहीं कटेगा",
           upi: "UPI", upiSub: "PhonePe · GPay · Paytm", card: "कार्ड", cardSub: "Visa · Mastercard · RuPay",
           nb: "नेट बैंकिंग", nbSub: "सभी प्रमुख बैंक" },
    viewer: { download: "डाउनलोड", close: "बंद करें", sample: "नमूना रिपोर्ट" },
    pilot: { badge: "नि:शुल्क पायलट", left: "मुफ़्त रिपोर्ट बाकी", used: "{t} में से इस्तेमाल",
             note: "आप Pothi के पहले {t} ज्योतिषियों में हैं। दस रिपोर्ट, मुफ़्त, कोई कार्ड नहीं।",
             ended: "आपकी मुफ़्त रिपोर्ट पूरी हो गईं — अपनी राय बताइए, हम और जोड़ देंगे।" },
    prices: { title: "आपके बिक्री दाम", sub: "आप जातक से जो लेते हैं। सिर्फ़ आपकी कमाई का अनुमान लगाने के लिए — हमारा कोई हिस्सा नहीं।",
              price: "आप लेते हैं", notSet: "तय नहीं", save: "दाम सहेजें", saved: "सहेजा गया",
              unpriced: "रिपोर्ट के दाम तय नहीं — ₹0 गिने जा रहे हैं" },
    clients: { tab: "जातक", reports: "रिपोर्ट", title: "जातक बही",
               sub: "जिन सबकी रिपोर्ट आपने बनाई है।", search: "नाम या फ़ोन खोजें…",
               empty: "अभी कोई जातक नहीं।", birthdays: "इस सप्ताह जन्मदिन",
               bdayNone: "अगले 7 दिनों में किसी जातक का जन्मदिन नहीं।",
               newReport: "नई रिपोर्ट", born: "जन्म", none: "—" },
    ledger: { title: "क्रेडिट इतिहास", purchases: "खरीद", invoice: "बिल",
              empty: "अभी कुछ नहीं।", reason: { purchase: "खरीद", generate: "रिपोर्ट", refund: "वापसी", bonus: "बोनस", trial: "नि:शुल्क क्रेडिट", expiry: "समाप्त", adjustment: "समायोजन" } },
    gen: {
      title: "रिपोर्ट तैयार हो रही है",
      hint: "कुछ ही क्षण लगेंगे। यह विंडो खुली रखें।",
      steps: [
        "पंचांग से जन्म कुंडली बनाई जा रही है",
        "नौ ग्रहों को बारह भावों में स्थापित किया जा रहा है",
        "योग, दोष और दशा-क्रम पढ़े जा रहे हैं",
        "{n} अध्याय लिखे जा रहे हैं",
        "पन्ने सजाए जा रहे हैं और कुंडली बनाई जा रही है",
        "आपका नाम और पहचान लगाई जा रही है"
      ]
    },
    common: { signOut: "लॉगआउट", credits: "क्रेडिट", loading: "लोड हो रहा है…", required: "आवश्यक" }
  }
};

// No `as const`: it narrows every value to its literal, so the Hindi table stops
// being assignable to the English shape and the context type breaks. Widening to
// string is what we want anyway — these are translations, not enums.
export type Strings = typeof STRINGS.en;

export const I18n = createContext<{ lang: UiLang; t: Strings; setLang: (l: UiLang) => void }>({
  lang: "en", t: STRINGS.en, setLang: () => {}
});
export const useI18n = () => useContext(I18n);

const KEY = "pothi.uilang";
export const loadLang = (): UiLang => (localStorage.getItem(KEY) === "hi" ? "hi" : "en");
export const saveLang = (l: UiLang) => localStorage.setItem(KEY, l);
