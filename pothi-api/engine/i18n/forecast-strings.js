// ─────────────────────────────────────────────────────────────────────────────
// Bilingual string pack for the Varshaphal (chart 7) and Monthly Horoscope
// (chart 4) reports.
//
// Rule of the file: NOTHING here is generated at run time and nothing is
// machine-translated. Every noun is a static lookup and every sentence is a
// template with holes for values the engine computed. `en` and `hi` implement
// the identical key set, so a report never mixes languages — the pack is chosen
// once and every title, label and sentence comes out of it.
// ─────────────────────────────────────────────────────────────────────────────

export const LANGS = ["en", "hi"];

// ── nouns ────────────────────────────────────────────────────────────────────

const SIGN = {
  en: { Aries: "Aries", Taurus: "Taurus", Gemini: "Gemini", Cancer: "Cancer", Leo: "Leo", Virgo: "Virgo", Libra: "Libra", Scorpio: "Scorpio", Sagittarius: "Sagittarius", Capricorn: "Capricorn", Aquarius: "Aquarius", Pisces: "Pisces" },
  hi: { Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क", Leo: "सिंह", Virgo: "कन्या", Libra: "तुला", Scorpio: "वृश्चिक", Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुंभ", Pisces: "मीन" },
};

const PLANET = {
  en: { Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mercury", Jupiter: "Jupiter", Venus: "Venus", Saturn: "Saturn", Rahu: "Rahu", Ketu: "Ketu" },
  hi: { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु" },
};

// dignityOf() returns seven values, not four. The three missing ones fell
// through untranslated, so a Hindi report printed "friend" and "moolatrikona"
// in English mid-sentence.
const DIGNITY = {
  en: {
    exalted: "exalted", own: "in own sign", neutral: "neutral", debilitated: "debilitated",
    moolatrikona: "in moolatrikona", friend: "in a friend's sign", enemy: "in an enemy's sign",
  },
  hi: {
    exalted: "उच्च", own: "स्वराशि में", neutral: "सम", debilitated: "नीच",
    moolatrikona: "मूलत्रिकोण में", friend: "मित्र राशि में", enemy: "शत्रु राशि में",
  },
};

const WEEKDAY = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
};
const WEEKDAY_SHORT = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
};

const MONTH = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्तूबर", "नवंबर", "दिसंबर"],
};
const MONTH_SHORT = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hi: ["जन", "फ़र", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"],
};

const PAKSHA = { en: { shukla: "Shukla", krishna: "Krishna" }, hi: { shukla: "शुक्ल", krishna: "कृष्ण" } };

// Short "what this house is about" phrase — used inside sentences.
const HOUSE_AREA = {
  en: {
    1: "the body, vitality and the year's overall direction", 2: "money kept, family and speech", 3: "courage, siblings and daily effort",
    4: "home, mother, land and peace of mind", 5: "children, learning and creative work", 6: "work, health, competition and debt",
    7: "marriage, partnership and dealings with others", 8: "sudden change, obstacles and hidden matters", 9: "fortune, dharma, father and long journeys",
    10: "career, standing and public conduct", 11: "income, gains and fulfilled wishes", 12: "expense, travel, loss and inner life",
  },
  hi: {
    1: "शरीर, ओज और वर्ष की समग्र दिशा", 2: "संचित धन, कुटुंब और वाणी", 3: "पराक्रम, भाई-बहन और नित्य प्रयास",
    4: "गृह, माता, भूमि और मानसिक शांति", 5: "संतान, विद्या और सृजन कार्य", 6: "कार्य, स्वास्थ्य, प्रतिस्पर्धा और ऋण",
    7: "विवाह, साझेदारी और दूसरों से व्यवहार", 8: "आकस्मिक परिवर्तन, बाधा और गुप्त प्रसंग", 9: "भाग्य, धर्म, पिता और लंबी यात्रा",
    10: "कर्म, प्रतिष्ठा और सार्वजनिक आचरण", 11: "आय, लाभ और इच्छापूर्ति", 12: "व्यय, यात्रा, हानि और आंतरिक जीवन",
  },
};

// What each graha carries — used when naming a transit or a dasha lord.
const KARAKA = {
  en: {
    Sun: "authority, health, father and confidence", Moon: "mind, mother, home and public feeling",
    Mars: "energy, courage, land and disputes", Mercury: "intellect, speech, trade and paperwork",
    Jupiter: "wisdom, wealth, children and protection", Venus: "relationships, comfort, art and vehicles",
    Saturn: "discipline, labour, delay and endurance", Rahu: "ambition, foreign matters and sudden turns",
    Ketu: "detachment, research and letting go",
  },
  hi: {
    Sun: "अधिकार, स्वास्थ्य, पिता और आत्मविश्वास", Moon: "मन, माता, गृह और लोकभाव",
    Mars: "ऊर्जा, साहस, भूमि और विवाद", Mercury: "बुद्धि, वाणी, व्यापार और लेखन",
    Jupiter: "ज्ञान, धन, संतान और रक्षा", Venus: "संबंध, सुख, कला और वाहन",
    Saturn: "अनुशासन, श्रम, विलंब और सहनशीलता", Rahu: "महत्वाकांक्षा, विदेश और आकस्मिक मोड़",
    Ketu: "वैराग्य, शोध और त्याग",
  },
};

const SAHAM_NAME = {
  en: { punya: "Punya Saham", vidya: "Vidya Saham", yasas: "Yasas Saham", mitra: "Mitra Saham", mahatmya: "Mahatmya Saham", asha: "Asha Saham", samartha: "Samartha Saham", bhratru: "Bhratru Saham", pitru: "Pitru Saham", matru: "Matru Saham", putra: "Putra Saham", jeeva: "Jeeva Saham", karma: "Karma Saham", vivaha: "Vivaha Saham", roga: "Roga Saham", artha: "Artha Saham" },
  hi: { punya: "पुण्य सहम", vidya: "विद्या सहम", yasas: "यशस् सहम", mitra: "मित्र सहम", mahatmya: "माहात्म्य सहम", asha: "आशा सहम", samartha: "सामर्थ्य सहम", bhratru: "भ्रातृ सहम", pitru: "पितृ सहम", matru: "मातृ सहम", putra: "पुत्र सहम", jeeva: "जीव सहम", karma: "कर्म सहम", vivaha: "विवाह सहम", roga: "रोग सहम", artha: "अर्थ सहम" },
};
const SAHAM_MEANING = {
  en: { punya: "merit, wellbeing and the good the year returns", vidya: "learning and what can be studied", yasas: "reputation and honour", mitra: "friends, allies and support", mahatmya: "dignity and standing under pressure", asha: "hopes and what is wished for", samartha: "capability and stamina", bhratru: "siblings and peers", pitru: "father and elders", matru: "mother and the home", putra: "children and creative issue", jeeva: "life force and vitality", karma: "work, profession and action", vivaha: "marriage and the spouse", roga: "illness and where health is tested", artha: "wealth and earnings" },
  hi: { punya: "पुण्य, कल्याण और वर्ष का शुभ फल", vidya: "विद्या और अध्ययन", yasas: "यश और सम्मान", mitra: "मित्र, सहयोगी और सहारा", mahatmya: "गरिमा और संकट में प्रतिष्ठा", asha: "आशा और मनोकामना", samartha: "सामर्थ्य और सहनशक्ति", bhratru: "भाई-बहन और सहकर्मी", pitru: "पिता और गुरुजन", matru: "माता और गृह", putra: "संतान और सृजन", jeeva: "प्राणशक्ति और जीवनी शक्ति", karma: "कर्म, व्यवसाय और कार्य", vivaha: "विवाह और जीवनसाथी", roga: "रोग और स्वास्थ्य की परीक्षा", artha: "धन और आय" },
};

const AREA_NAME = {
  en: { career: "Career", finance: "Finance & Investments", money: "Money & Expenses", marriage: "Marriage & Relationships", love: "Love & Relationships", children: "Children & Family", family: "Family & Home", health: "Health", property: "Property & Vehicles", travel: "Travel", education: "Education & Skills", legal: "Legal & Disputes" },
  hi: { career: "कार्यक्षेत्र", finance: "धन और निवेश", money: "धन और व्यय", marriage: "विवाह और संबंध", love: "प्रेम और संबंध", children: "संतान और परिवार", family: "परिवार और गृह", health: "स्वास्थ्य", property: "भूमि और वाहन", travel: "यात्रा", education: "शिक्षा और कौशल", legal: "विधिक और विवाद" },
};

// Static practical guidance per life area. Selected by area key, never written
// per-run; the chart decides which line is emphasised, not what the line says.
const AREA_GUIDE = {
  en: {
    career: ["Judge a job change by the 10th lord's dignity, not by mood.", "Written commitments hold better than spoken ones in a demanding window."],
    finance: ["Keep borrowing inside what the 11th supports; the 12th decides the leak.", "Long holdings suit a strong 2nd lord; trading does not."],
    money: ["Track the fixed outflow first — the 12th house shows where it hides.", "A gain promised in a demanding window usually arrives late, not never."],
    marriage: ["Discuss, do not decide, while the 7th lord is weak or retrograde.", "Fix the date inside a supportive window; the ceremony holds better."],
    love: ["Say the plain thing early; a demanding 7th punishes hints.", "Meet on a good-Chandra-bala day if a hard conversation is due."],
    children: ["The 5th lord's condition matters more than the 5th house's occupants.", "Study and creative work respond first when the 5th is supported."],
    family: ["The 4th carries the mother and the house; settle both together.", "Peace at home rises and falls with the Moon's weekly house."],
    health: ["Treat the 6th as routine and the 8th as the sudden; they are not the same.", "Sleep and food fix more of the 6th than medicine does."],
    property: ["Registry and possession are 4th-house matters; finance is 2nd/11th.", "Verify papers when Mars or Saturn touches the 4th."],
    travel: ["Short trips read from the 3rd, long ones from the 9th, relocation from the 12th.", "A retrograde ruler means rebooking, not cancellation."],
    education: ["Admissions read from the 4th and 9th; results from the 5th.", "Revision suits a retrograde Mercury better than a new syllabus does."],
    legal: ["The 6th wins by persistence; the 8th settles by compromise.", "File and reply on time — delay costs more than argument."],
  },
  hi: {
    career: ["नौकरी बदलने का निर्णय दशम भावेश की स्थिति देखकर करें, मन की स्थिति देखकर नहीं।", "कठिन अवधि में मौखिक वचन से अधिक लिखित अनुबंध टिकते हैं।"],
    finance: ["ऋण उतना ही लें जितना एकादश भाव सह सके; व्यय द्वादश भाव तय करता है।", "बलवान द्वितीयेश दीर्घकालिक निवेश देता है, सट्टा नहीं।"],
    money: ["पहले स्थिर व्यय देखें — द्वादश भाव बताता है कि रिसाव कहाँ है।", "कठिन अवधि में वचन दिया गया लाभ विलंब से आता है, रुकता नहीं।"],
    marriage: ["सप्तमेश निर्बल या वक्री हो तो बात करें, निर्णय न लें।", "शुभ अवधि में तिथि निश्चित करें; संबंध अधिक स्थिर रहता है।"],
    love: ["स्पष्ट बात पहले कहें; पीड़ित सप्तम भाव संकेतों को नहीं समझता।", "कठिन संवाद हो तो उत्तम चंद्रबल वाले दिन मिलें।"],
    children: ["पंचम भाव के ग्रहों से अधिक पंचमेश की स्थिति महत्वपूर्ण है।", "पंचम भाव को बल मिलते ही विद्या और सृजन कार्य पहले सुधरते हैं।"],
    family: ["चतुर्थ भाव माता और गृह दोनों रखता है; दोनों को साथ संभालें।", "गृह की शांति चंद्रमा के साप्ताहिक भाव के साथ घटती-बढ़ती है।"],
    health: ["षष्ठ भाव को दिनचर्या और अष्टम को आकस्मिकता मानें; दोनों एक नहीं हैं।", "षष्ठ भाव का अधिकांश दोष निद्रा और आहार से सुधरता है, औषधि से कम।"],
    property: ["रजिस्ट्री और कब्ज़ा चतुर्थ भाव के विषय हैं; धन द्वितीय/एकादश का।", "चतुर्थ भाव पर मंगल या शनि हो तो कागज़ात की जाँच अवश्य करें।"],
    travel: ["लघु यात्रा तृतीय से, दीर्घ यात्रा नवम से और स्थानांतरण द्वादश से देखें।", "स्वामी वक्री हो तो यात्रा टलती है, रद्द नहीं होती।"],
    education: ["प्रवेश चतुर्थ और नवम से, परिणाम पंचम से देखें।", "बुध वक्री हो तो नया पाठ्यक्रम नहीं, पुनरावृत्ति उपयुक्त है।"],
    legal: ["षष्ठ भाव धैर्य से जीतता है; अष्टम समझौते से निपटता है।", "समय पर आवेदन और उत्तर दें — विलंब तर्क से महँगा पड़ता है।"],
  },
};

const VERDICT = {
  en: { supportive: "supportive", strained: "strained", mixed: "mixed", empty: "empty", demanding: "demanding", quiet: "quiet" },
  hi: { supportive: "अनुकूल", strained: "दबावयुक्त", mixed: "मिश्रित", empty: "रिक्त", demanding: "श्रमसाध्य", quiet: "शांत" },
};
const TONE = {
  en: { strong: "strong", steady: "steady", mixed: "mixed", testing: "testing" },
  hi: { strong: "बलवान", steady: "स्थिर", mixed: "मिश्रित", testing: "परीक्षा-प्रधान" },
};
const GRADE = {
  en: { veryStrong: "very strong", strong: "strong", moderate: "moderate", weak: "weak", none: "no points" },
  hi: { veryStrong: "अति बलवान", strong: "बलवान", moderate: "मध्यम", weak: "निर्बल", none: "शून्य" },
};
const CHANDRA = {
  en: { good: "good", neutral: "ordinary", weak: "low", chandrashtama: "Chandrashtama" },
  hi: { good: "उत्तम", neutral: "सामान्य", weak: "मंद", chandrashtama: "चंद्राष्टम" },
};
const HARSHA_RULE = {
  en: {
    joy: "in its house of joy", hemisphere: "in its own hemisphere",
    sect: "in agreement with a day/night pravesh", gender: "in a sign of its own gender",
  },
  hi: {
    joy: "अपने हर्ष-भाव में", hemisphere: "अपने गोलार्ध में",
    sect: "दिन/रात्रि प्रवेश के अनुरूप", gender: "अपने लिंग की राशि में",
  },
};
const COLOUR = {
  en: { saffron: "saffron", white: "white", red: "red", green: "green", yellow: "yellow", cream: "cream", blue: "dark blue", grey: "grey", brown: "brown" },
  hi: { saffron: "केसरिया", white: "श्वेत", red: "लाल", green: "हरा", yellow: "पीला", cream: "क्रीम", blue: "गहरा नीला", grey: "धूसर", brown: "भूरा" },
};

// Remedial reference table — one row per graha, fixed, classical.
const REMEDY = {
  en: {
    Sun: { mantra: "Om Suryaya Namah", daan: "wheat, jaggery and copper", deity: "Surya", act: "offer water to the rising Sun", fast: "Sunday" },
    Moon: { mantra: "Om Chandraya Namah", daan: "rice, milk and silver", deity: "Shiva", act: "offer milk or water at a Shiva temple", fast: "Monday" },
    Mars: { mantra: "Om Mangalaya Namah", daan: "red masoor dal and jaggery", deity: "Hanuman", act: "recite the Hanuman Chalisa", fast: "Tuesday" },
    Mercury: { mantra: "Om Budhaya Namah", daan: "green moong and green cloth", deity: "Ganesha", act: "feed green fodder to a cow", fast: "Wednesday" },
    Jupiter: { mantra: "Om Gurave Namah", daan: "gram flour, turmeric and bananas", deity: "Vishnu / Brihaspati", act: "water a peepal tree and apply a turmeric tilak", fast: "Thursday" },
    Venus: { mantra: "Om Shukraya Namah", daan: "curd, rice and white cloth", deity: "Lakshmi", act: "keep cleanliness and offer white sweets", fast: "Friday" },
    Saturn: { mantra: "Om Shanaischaraya Namah", daan: "black sesame, mustard oil and iron", deity: "Shani / Hanuman", act: "offer mustard oil at a Shani temple and feed the needy", fast: "Saturday" },
    Rahu: { mantra: "Om Rahave Namah", daan: "black gram and a dark blanket", deity: "Durga", act: "keep the head covered in a temple and avoid shortcuts", fast: "Saturday" },
    Ketu: { mantra: "Om Ketave Namah", daan: "a two-coloured blanket and sesame", deity: "Ganesha", act: "feed dogs and serve at a temple", fast: "Tuesday" },
  },
  hi: {
    Sun: { mantra: "ॐ सूर्याय नमः", daan: "गेहूँ, गुड़ और ताँबा", deity: "सूर्य", act: "उगते सूर्य को जल अर्पित करें", fast: "रविवार" },
    Moon: { mantra: "ॐ चन्द्राय नमः", daan: "चावल, दूध और चाँदी", deity: "शिव", act: "शिव मंदिर में दूध या जल अर्पित करें", fast: "सोमवार" },
    Mars: { mantra: "ॐ मंगलाय नमः", daan: "लाल मसूर दाल और गुड़", deity: "हनुमान", act: "हनुमान चालीसा का पाठ करें", fast: "मंगलवार" },
    Mercury: { mantra: "ॐ बुधाय नमः", daan: "हरी मूँग और हरा वस्त्र", deity: "गणेश", act: "गाय को हरा चारा खिलाएँ", fast: "बुधवार" },
    Jupiter: { mantra: "ॐ गुरवे नमः", daan: "बेसन, हल्दी और केला", deity: "विष्णु / बृहस्पति", act: "पीपल में जल दें और हल्दी का तिलक लगाएँ", fast: "गुरुवार" },
    Venus: { mantra: "ॐ शुक्राय नमः", daan: "दही, चावल और श्वेत वस्त्र", deity: "लक्ष्मी", act: "स्वच्छता रखें और श्वेत मिष्टान्न अर्पित करें", fast: "शुक्रवार" },
    Saturn: { mantra: "ॐ शनैश्चराय नमः", daan: "काले तिल, सरसों तेल और लोहा", deity: "शनि / हनुमान", act: "शनि मंदिर में सरसों तेल चढ़ाएँ और निर्धन को भोजन दें", fast: "शनिवार" },
    Rahu: { mantra: "ॐ राहवे नमः", daan: "काला उड़द और गहरा कंबल", deity: "दुर्गा", act: "मंदिर में सिर ढँककर जाएँ और छल से बचें", fast: "शनिवार" },
    Ketu: { mantra: "ॐ केतवे नमः", daan: "दो रंग का कंबल और तिल", deity: "गणेश", act: "कुत्तों को भोजन दें और मंदिर में सेवा करें", fast: "मंगलवार" },
  },
};

// ── chapter titles (must match astro_chart_listing sample pages exactly) ─────

const VP_TITLES = {
  en: [
    "About This Report", "Solar Return Details", "Year Lord & Muntha", "The Varsha Chart", "Tri-Pataki Chakra",
    "Sahams — Sensitive Points", "Panchavargeeya Bala", "Harsha Bala",
    "Month 1 — Detailed", "Month 2 — Detailed", "Month 3 — Detailed", "Month 4 — Detailed", "Month 5 — Detailed", "Month 6 — Detailed",
    "Month 7 — Detailed", "Month 8 — Detailed", "Month 9 — Detailed", "Month 10 — Detailed", "Month 11 — Detailed", "Month 12 — Detailed",
    "Career This Year", "Finance & Investments", "Marriage & Relationships", "Children & Family", "Health Through the Year",
    "Property & Vehicles", "Travel & Relocation", "Education & Skills", "Legal & Disputes",
    "Best Months for Each Goal", "Difficult Windows to Plan Around", "Muhurat — Auspicious Dates", "Remedies for the Year",
    "Mantra & Japa Schedule", "Daan — What to Give and When", "Fasting Days", "Temple Visits",
    "Comparison With Your Natal Chart", "Year-End Outlook", "How to Use This Report",
  ],
  hi: [
    "इस रिपोर्ट के बारे में", "सूर्य-प्रवेश विवरण", "वर्षेश और मुंथा", "वर्ष कुंडली", "त्रि-पताकी चक्र",
    "सहम — संवेदनशील बिंदु", "पंचवर्गीय बल", "हर्ष बल",
    "मास 1 — विस्तृत", "मास 2 — विस्तृत", "मास 3 — विस्तृत", "मास 4 — विस्तृत", "मास 5 — विस्तृत", "मास 6 — विस्तृत",
    "मास 7 — विस्तृत", "मास 8 — विस्तृत", "मास 9 — विस्तृत", "मास 10 — विस्तृत", "मास 11 — विस्तृत", "मास 12 — विस्तृत",
    "इस वर्ष कार्यक्षेत्र", "धन और निवेश", "विवाह और संबंध", "संतान और परिवार", "वर्षभर स्वास्थ्य",
    "भूमि और वाहन", "यात्रा और स्थानांतरण", "शिक्षा और कौशल", "विधिक और विवाद",
    "प्रत्येक लक्ष्य हेतु श्रेष्ठ मास", "सावधानी योग्य कठिन अवधि", "मुहूर्त — शुभ तिथियाँ", "वर्ष के उपाय",
    "मंत्र और जप विधान", "दान — क्या और कब", "व्रत के दिन", "मंदिर दर्शन",
    "जन्म कुंडली से तुलना", "वर्षांत दृष्टि", "इस रिपोर्ट का उपयोग कैसे करें",
  ],
};

const HS_TITLES = {
  en: [
    "About This Report", "Month at a Glance", "Key Transits", "Your Chart This Month",
    "Week 1 — Day by Day", "Week 2 — Day by Day", "Week 3 — Day by Day", "Week 4 — Day by Day",
    "Career & Work", "Money & Expenses", "Love & Relationships", "Family & Home", "Health & Energy",
    "Travel", "Education & Exams", "Property Matters", "Lucky Days, Colours & Numbers", "Dasha Context",
    "Moon Phases & Your Mood", "Cautions & Avoidances", "Remedies for the Month", "Next Month — Early Outlook",
  ],
  hi: [
    "इस रिपोर्ट के बारे में", "मास का सार", "प्रमुख गोचर", "इस मास आपकी कुंडली",
    "सप्ताह 1 — दिन-प्रतिदिन", "सप्ताह 2 — दिन-प्रतिदिन", "सप्ताह 3 — दिन-प्रतिदिन", "सप्ताह 4 — दिन-प्रतिदिन",
    "कार्य और व्यवसाय", "धन और व्यय", "प्रेम और संबंध", "परिवार और गृह", "स्वास्थ्य और ऊर्जा",
    "यात्रा", "शिक्षा और परीक्षा", "भूमि-भवन प्रसंग", "शुभ दिन, रंग और अंक", "दशा संदर्भ",
    "चंद्र कलाएँ और आपका मन", "सावधानियाँ और वर्जनाएँ", "इस मास के उपाय", "अगला मास — प्रारंभिक दृष्टि",
  ],
};

// ── generic labels ───────────────────────────────────────────────────────────

const LBL = {
  en: {
    name: "Name", birthDetails: "Birth details", birthPlace: "Birth place", lagna: "Lagna", rashi: "Moon sign", nakshatra: "Nakshatra",
    solarReturn: "Solar return", yearWindow: "Year window", age: "Age this year", dayNight: "Pravesh",
    day: "day", night: "night", annualLagna: "Annual Lagna", annualLagnaLord: "Annual Lagna lord", muntha: "Muntha",
    munthaLord: "Muntha lord", yearLord: "Year Lord (Varshesh)", basis: "Basis of selection", roles: "Offices held",
    planet: "Planet", sign: "Sign", house: "House", degree: "Degree", condition: "Condition", retrograde: "Retrograde",
    nakshatraCol: "Nakshatra", occupants: "Occupants", lord: "Lord", formula: "Formula", meaning: "Signifies",
    total: "Total", grade: "Grade", points: "Points", rules: "Rules met", flag: "Flag", members: "Planets", verdict: "Verdict",
    from: "From", to: "To", ruler: "Ruling Mudda lord", period: "Period", tone: "Tone", month: "Month",
    monthLagna: "Month Lagna", monthMoon: "Moon at month entry", tithi: "Tithi", sunHouse: "Sun's house",
    munthaHouse: "Muntha house", chapterMap: "Where to read more", houses: "Houses read", karaka: "Karaka",
    saham: "Saham", best: "Best days", caution: "Caution", weekday: "Weekday", dates: "Dates", mantra: "Mantra",
    japa: "Japa count", daan: "Daan", deity: "Deity", act: "Act", fastDay: "Fast day", startOn: "Start on",
    natal: "Natal", annual: "Annual", shift: "Change", dasha: "Dasha", maha: "Mahadasha", antar: "Antardasha",
    pratyantar: "Pratyantardasha", transit: "Transit", ingress: "Ingress", moonSign: "Moon sign",
    chandraBala: "Chandra bala", luckyDays: "Supportive days", colours: "Colours", numbers: "Numbers",
    newMoon: "New Moon (Amavasya)", fullMoon: "Full Moon (Purnima)", weekOf: "Days covered",
    method: "How this was computed", strongest: "Strongest", weakest: "Weakest", noneFound: "None in this chart",
    ingressCount: "Sign changes this month", busiestHouse: "Most activated house", note: "Note",
    noTransit: "no planet transits them this month",
    dayUnit: "days", tithiLabel: "Tithi",
  },
  hi: {
    name: "नाम", birthDetails: "जन्म विवरण", birthPlace: "जन्म स्थान", lagna: "लग्न", rashi: "चंद्र राशि", nakshatra: "नक्षत्र",
    solarReturn: "सूर्य प्रवेश", yearWindow: "वर्ष अवधि", age: "इस वर्ष आयु", dayNight: "प्रवेश",
    day: "दिन", night: "रात्रि", annualLagna: "वर्ष लग्न", annualLagnaLord: "वर्ष लग्नेश", muntha: "मुंथा",
    munthaLord: "मुंथेश", yearLord: "वर्षेश", basis: "चयन का आधार", roles: "धारित पद",
    planet: "ग्रह", sign: "राशि", house: "भाव", degree: "अंश", condition: "स्थिति", retrograde: "वक्री",
    nakshatraCol: "नक्षत्र", occupants: "स्थित ग्रह", lord: "स्वामी", formula: "सूत्र", meaning: "कारकत्व",
    total: "योग", grade: "श्रेणी", points: "अंक", rules: "पूर्ण नियम", flag: "पताका", members: "ग्रह", verdict: "निष्कर्ष",
    from: "से", to: "तक", ruler: "मुद्दा दशानाथ", period: "अवधि", tone: "प्रकृति", month: "मास",
    monthLagna: "मास लग्न", monthMoon: "मास प्रवेश पर चंद्र", tithi: "तिथि", sunHouse: "सूर्य का भाव",
    munthaHouse: "मुंथा भाव", chapterMap: "और कहाँ पढ़ें", houses: "विचारित भाव", karaka: "कारक",
    saham: "सहम", best: "श्रेष्ठ दिन", caution: "सावधानी", weekday: "वार", dates: "तिथियाँ", mantra: "मंत्र",
    japa: "जप संख्या", daan: "दान", deity: "देवता", act: "कर्म", fastDay: "व्रत का दिन", startOn: "प्रारंभ",
    natal: "जन्म", annual: "वर्ष", shift: "परिवर्तन", dasha: "दशा", maha: "महादशा", antar: "अंतर्दशा",
    pratyantar: "प्रत्यंतर्दशा", transit: "गोचर", ingress: "राशि परिवर्तन", moonSign: "चंद्र राशि",
    chandraBala: "चंद्रबल", luckyDays: "अनुकूल दिन", colours: "रंग", numbers: "अंक",
    newMoon: "अमावस्या", fullMoon: "पूर्णिमा", weekOf: "सम्मिलित दिन",
    method: "गणना कैसे हुई", strongest: "सर्वाधिक बली", weakest: "सर्वाधिक निर्बल", noneFound: "इस कुंडली में नहीं",
    ingressCount: "इस मास राशि परिवर्तन", busiestHouse: "सर्वाधिक सक्रिय भाव", note: "टिप्पणी",
    noTransit: "इस मास इनमें कोई ग्रह गोचर नहीं करता",
    dayUnit: "दिन", tithiLabel: "तिथि",
  },
};

// Hindi ordinals for houses. `NOM` is the subject form ("दूसरा भाव है"), `OBL`
// the oblique form used after a postposition ("दूसरे भाव में").
const HI_HOUSE_NOM = { 1: "पहला", 2: "दूसरा", 3: "तीसरा", 4: "चौथा", 5: "पाँचवाँ", 6: "छठा", 7: "सातवाँ", 8: "आठवाँ", 9: "नौवाँ", 10: "दसवाँ", 11: "ग्यारहवाँ", 12: "बारहवाँ" };
const HI_HOUSE_OBL = { 1: "पहले", 2: "दूसरे", 3: "तीसरे", 4: "चौथे", 5: "पाँचवें", 6: "छठे", 7: "सातवें", 8: "आठवें", 9: "नौवें", 10: "दसवें", 11: "ग्यारहवें", 12: "बारहवें" };

// Nakshatra names — proper nouns, so they get their own explicit table rather
// than being left in Latin script inside a Hindi report.
const NAKSHATRA_NAME = {
  en: null, // engine values are already the English names
  hi: {
    Ashwini: "अश्विनी", Bharani: "भरणी", Krittika: "कृत्तिका", Rohini: "रोहिणी", Mrigashira: "मृगशिरा",
    Ardra: "आर्द्रा", Punarvasu: "पुनर्वसु", Pushya: "पुष्य", Ashlesha: "आश्लेषा", Magha: "मघा",
    "Purva Phalguni": "पूर्वा फाल्गुनी", "Uttara Phalguni": "उत्तरा फाल्गुनी", Hasta: "हस्त", Chitra: "चित्रा",
    Swati: "स्वाति", Vishakha: "विशाखा", Anuradha: "अनुराधा", Jyeshtha: "ज्येष्ठा", Mula: "मूल",
    "Purva Ashadha": "पूर्वाषाढ़ा", "Uttara Ashadha": "उत्तराषाढ़ा", Shravana: "श्रवण", Dhanishta: "धनिष्ठा",
    Shatabhisha: "शतभिषा", "Purva Bhadrapada": "पूर्वा भाद्रपद", "Uttara Bhadrapada": "उत्तरा भाद्रपद", Revati: "रेवती",
  },
};

// ── sentence templates ───────────────────────────────────────────────────────
// Each function receives already-localized nouns plus computed numbers.

const TPL = {
  en: {
    ord: (n) => { const s = ["th", "st", "nd", "rd"], k = n % 100; return `${n}${s[(k - 20) % 10] || s[k] || s[0]}`; },
    houseRef: (n) => `${TPL.en.ord(n)} house`,
    houseName: (n) => `${TPL.en.ord(n)} house`,
    list: (items) => items.join(", "),
    deg: (d) => `${Math.floor(d)}°${String(Math.round((d % 1) * 60)).padStart(2, "0")}'`,

    method: (kind) => kind === "vp"
      ? "Every figure in this report is calculated from your own birth data: the solar-return instant is found by bisecting the Sun's sidereal longitude against its natal value, the annual chart is cast for that instant at your birth place, and every judgment below follows a stated Tajika rule applied to those numbers. Where a classical formula is used, the formula is printed with the result so you can verify it."
      : "This report is not a sun-sign column. Your birth chart is cast first, then one chart is computed for local midday on every day of the month; each transiting planet is placed into YOUR houses counted from your Lagna, and each dated statement below comes from that day-by-day series.",
    subject: (o) => `${o.name} · ${o.dob} · ${o.tob} · ${o.pob || "—"}`,
    placementsNote: () => "The placements table on this page is the data the chart diagram is drawn from — planet, sign, house and degree, exactly as computed.",

    vpAbout: (o) => `This is your ${TPL.en.ord(o.age)} solar year. It begins at the Varsha Pravesh on ${o.from} and closes at the next return on ${o.to}. The annual Lagna rises in ${o.lagna}, the year-lord (Varshesh) is ${o.varshesh}, and the Muntha has advanced to your ${TPL.en.houseRef(o.munthaHouse)} — so ${o.munthaArea} stays lit for the whole year.`,
    vpSolarReturn: (o) => `The Sun returned to its natal sidereal longitude of ${o.natalSunLon}° at ${o.instant}. The chart for that moment has ${o.lagna} rising at ${o.lagnaDeg}, and the Sun stands in the ${TPL.en.houseRef(o.sunHouse)} of it — a ${o.dayNight} pravesh, which is what decides the day/night switch used by the Sahams and by Harsha Bala later in this report.`,
    vpYearLord: (o) => `${o.lord} takes the year. It is placed in the ${TPL.en.houseRef(o.house)} of the annual chart and is ${o.dignity}${o.angular ? ", and it is angular" : ""}. It was chosen over the other office-bearers on dignity plus angularity, scoring ${o.score}. ${o.roles ? `It holds these offices: ${o.roles}.` : "It holds no additional office."}`,
    vpMuntha: (o) => `The Muntha has moved to ${o.sign}, the ${TPL.en.houseRef(o.house)} of the annual chart. Its lord ${o.lord} sits in the ${TPL.en.houseRef(o.lordHouse)} and is ${o.lordDignity}, so ${o.area} is the ground the year is worked on, and ${o.lord}'s condition is what decides how easily it moves.`,
    vpChartLead: (o) => `Cast for ${o.instant}, ${o.lagna} rising. ${o.kendra} planet(s) occupy the angles and ${o.trikona} the trines — those are the placements that carry the year. ${o.retro ? `Retrograde this year: ${o.retro}.` : "No planet is retrograde in the annual chart."}`,
    vpTripataki: (o) => `The Tri-Pataki is drawn from the Moon of the varsha chart, which is in ${o.moonSign}. Counting the twelve signs from there, they are dealt onto three flags in rotation — flag 1 takes counts 1, 4, 7 and 10; flag 2 takes 2, 5, 8 and 11; flag 3 takes 3, 6, 9 and 12. Flag ${o.strongest} carries the best balance of benefics this year.`,
    vpSahams: (o) => `Sahams are Tajika sensitive points: an arc measured between two positions of the annual chart and thrown onto the Lagna. This is a ${o.dayNight} pravesh${o.reversed ? `, so the ${o.reversed} reversible formulas below are taken in their reversed order, as the classical rule requires` : ", so every formula below is taken in its direct day order"}. Each row prints the formula it was computed with.`,
    vpSahamLine: (o) => `${o.name} — ${o.formula} → ${o.sign} ${o.deg}, the ${TPL.en.houseRef(o.house)}. Lord ${o.lord} is in the ${TPL.en.houseRef(o.lordHouse)}, ${o.lordDignity}. Signifies ${o.meaning}.`,
    vpPancha: () => "Panchavargeeya Bala is the Tajika five-fold strength: Kshetra (sign, max 30), Uchcha (distance from exaltation, max 20), Hadda (Egyptian terms, max 15), Drekkana (decanate by planetary gender, max 10) and Navamsha (max 5). The eighty-point total is divided by four to give the classical 0–20 reading: above 15 is very strong, 10–15 strong, 5–10 moderate, below 5 weak.",
    vpPanchaVerdict: (o) => `${o.strongest} is the best-resourced planet of your year at ${o.strongestBala}/20, and ${o.weakest} the least at ${o.weakestBala}/20. Give ${o.strongest} the work that must succeed, and do not build the year's plan on ${o.weakest} alone.`,
    vpHarsha: () => "Harsha Bala scores four conditions at five points each, to a maximum of twenty: the planet in its own house of joy; in its own hemisphere (diurnal planets above the horizon, nocturnal below); in agreement with a day or night pravesh; and in a sign of its own gender — masculine planets in odd signs, feminine and neuter planets in even signs.",
    vpHarshaVerdict: (o) => `${o.top} is in the best condition of joy this year with ${o.topPoints} of 20. ${o.zero ? `${o.zero} scores nothing here — it can still act through dignity, but it does so without ease.` : "Every planet takes at least one condition, so nothing in the year is entirely comfortless."}`,
    vpMonth: (o) => `Solar month ${o.i} runs from ${o.from} to ${o.to} — the stretch in which the Sun crosses ${o.arc} of its annual arc, standing in your ${TPL.en.houseRef(o.sunHouse)}. The Masa Muntha has advanced to the ${TPL.en.houseRef(o.munthaHouse)}, so ${o.munthaArea} is this month's ground.`,
    vpMonthRuler: (o) => `${o.lord} runs the larger part of it (${o.days} days), placed in the ${TPL.en.houseRef(o.house)} of the annual chart and ${o.dignity}. It carries ${o.karaka}. Read the month as ${o.tone}.`,
    vpMonthEntry: (o) => `At the Masa Pravesh, ${o.lagna} rises and the Moon is in ${o.moon} — ${o.tithi}.`,
    vpArea: (o) => `${o.area} is read from the ${o.houses} of the annual chart. ${o.lordLines}`,
    vpAreaSaham: (o) => `Its saham, ${o.saham}, falls in ${o.sign} in the ${TPL.en.houseRef(o.house)}; that saham's lord ${o.lord} is ${o.lordDignity} in the ${TPL.en.houseRef(o.lordHouse)}.`,
    vpAreaWindows: (o) => o.months.length
      ? `The Mudda periods that activate this area fall in month(s) ${o.months} — ${o.dates}.`
      : "No Mudda sub-period this year is run by a lord of these houses, so this area moves on background momentum rather than on a dated push.",
    vpLordLine: (o) => `The ${TPL.en.houseRef(o.house)} is ${o.sign}; its lord ${o.lord} is in the ${TPL.en.houseRef(o.lordHouse)}, ${o.dignity}${o.retro ? ", retrograde" : ""}${o.occupants ? `. Occupied by ${o.occupants}` : ", with no planet in it"}.`,
    vpBest: (o) => `${o.goal}: month ${o.month} (${o.dates}), run by ${o.lord} ${o.dignity} in the ${TPL.en.houseRef(o.house)}.`,
    vpBestNone: (o) => `${o.goal}: no month is clearly favoured — spread the effort instead of waiting for a window.`,
    vpDifficult: (o) => `Month ${o.i} (${o.dates}) — ${o.reason}. Keep new commitments small here; finish what is already running.`,
    vpDifficultNone: () => "No solar month of this year combines a weak Mudda lord with a difficult Muntha house. There is no window that needs to be planned around — which is worth knowing before anyone tells you otherwise.",
    vpMuhurat: (o) => `${o.weekday} is ${o.planet}'s day, and ${o.planet} is your year-lord. Inside the supportive windows of this year, these ${o.weekday}s fall: ${o.dates}. Use them for beginnings — a signature, a first payment, a first meeting.`,
    vpMuhuratAvoid: (o) => `Avoid opening anything new on the ${o.weekday}s that fall inside month(s) ${o.months} — the difficult windows listed in the previous chapter. Those dates are fine for continuing work, not for starting it.`,
    vpRemedies: (o) => `Two planets carry this year's work: ${o.lord}, because it is the year-lord, and ${o.weak}, because it is the weakest by Panchavargeeya Bala at ${o.weakBala}/20. Strengthening the first steadies the whole year; strengthening the second stops the year's weakest link from deciding the outcome.`,
    vpMantra: (o) => `${o.planet}: ${o.mantra}. The classical japa count is ${o.count}. Begin on ${o.startDate}, the first ${o.weekday} of your year, and complete it across the year — roughly ${o.perWeek} repetitions a week.`,
    vpDaan: (o) => `${o.planet} — give ${o.daan} on ${o.weekday}. The strongest month for it is month ${o.month} (${o.dates}), when ${o.planet}'s own Mudda period runs.`,
    vpDaanNone: (o) => `${o.planet} — give ${o.daan} on ${o.weekday}, any week of the year; ${o.planet} holds no Mudda period of its own this year.`,
    vpFasting: (o) => `${o.planet}: fast on ${o.weekday}. There are ${o.count} of them in this solar year; the first falls on ${o.first}.`,
    vpTemple: (o) => `${o.planet} — visit a ${o.deity} temple. Best in month(s) ${o.months}, and on ${o.weekday}.`,
    vpCompare: (o) => `${o.moved} of the nine grahas sit in a different house this year than at birth, and ${o.improved} are in better dignity than they were natally. The natal chart says what you are; the annual chart says what this one year does with it.`,
    vpCompareLine: (o) => `${o.planet}: natal ${o.natalSign} (${TPL.en.houseRef(o.natalHouse)}, ${o.natalDignity}) → annual ${o.annualSign} (${TPL.en.houseRef(o.annualHouse)}, ${o.annualDignity}).`,
    vpYearEnd: (o) => `The year closes under ${o.lord}'s Mudda period, from ${o.from} to ${o.to}, with ${o.lord} ${o.dignity} in the ${TPL.en.houseRef(o.house)}. The next Varsha Pravesh is on ${o.next}, when the Muntha moves to ${o.nextMuntha} — the ${TPL.en.houseRef(o.nextMunthaHouse)} from your natal Lagna. Finish this year's open matters before that date.`,
    vpHowTo: (o) => `Read chapter 3 first — the year-lord and the Muntha are the two facts everything else is measured against. Then go to month ${o.keyMonth}, the strongest window of your year, and place your important decisions there. The life-area chapters (21–29) answer specific questions; the remedy chapters (33–37) are the part you actually repeat.`,

    hsAbout: (o) => `This is your reading for ${o.month} ${o.year}, computed against your own chart — Lagna ${o.lagna}, Moon in ${o.moon}. The month runs ${o.from} to ${o.to}, ${o.days} days, and every dated line in it comes from a chart cast for that day.`,
    hsGlance: (o) => `The Sun spends this month in your ${TPL.en.houseRef(o.sunHouse)}, so ${o.sunArea} takes the light. ${o.ingressCount ? `${o.ingressCount} planet(s) change sign inside the month` : "No planet changes sign inside the month"}, and your ${TPL.en.houseRef(o.busiestHouse)} is the most crowded with ${o.busiestPlanets}. Underneath it all, ${o.maha}–${o.antar} dasha is running.`,
    hsTransits: (o) => `Eight bodies are tracked. ${o.ingressCount ? `${o.ingressCount} change sign this month, dated below.` : "None changes sign this month, so the pattern below holds from the 1st to the last day."} ${o.retro ? `Retrograde: ${o.retro}.` : "No planet is retrograde this month."}`,
    hsTransitLine: (o) => `${o.planet} ends the month in ${o.sign} — your ${TPL.en.houseRef(o.house)} (${o.area}). It carries ${o.karaka}, and is ${o.dignity}${o.retro ? " and retrograde" : ""}.${o.ingressText || ""}`,
    hsIngressClause: (o) => ` It enters ${o.toSign} on ${o.date}, moving from your ${TPL.en.houseRef(o.fromHouse)} to the ${TPL.en.houseRef(o.toHouse)}.`,
    hsChart: (o) => `Your natal placements are fixed; the transit column is where each planet actually is this month. The gap between the two columns is the month. This month ${o.overlap ? `${o.overlap} planet(s) transit the very house they occupy natally` : "no planet transits its own natal house"}.`,
    hsWeek: (o) => `${o.from} to ${o.to}. ${o.good.length ? `Supportive by Chandra bala: ${o.good}.` : "No day this week carries good Chandra bala."} ${o.hard.length ? `Handle carefully: ${o.hard}.` : ""} ${o.ingress || ""}`,
    hsDayRow: (o) => `${o.dom} ${o.weekday} · Moon ${o.moonSign} (${TPL.en.houseRef(o.moonHouse)}) · ${o.tithi} · ${o.chandra}${o.ingress ? ` · ${o.ingress}` : ""}`,
    hsArea: (o) => `${o.area} is read from your ${o.houses}. This month that reads ${o.verdict}: ${o.hits}. ${o.karakaLine}`,
    hsAreaLord: (o) => `The ${TPL.en.houseRef(o.house)} is ${o.sign}; its lord ${o.lord} sits natally in your ${TPL.en.houseRef(o.natalHouse)} and transits your ${TPL.en.houseRef(o.transitHouse)} this month${o.retro ? ", retrograde" : ""}.`,
    hsAreaKaraka: (o) => `Its karaka ${o.karaka} transits your ${TPL.en.houseRef(o.house)}${o.retro ? " and is retrograde" : ""}.`,
    hsAreaDays: (o) => o.days.length ? `The Moon supports these houses on: ${o.days}.` : "The Moon does not reach these houses in supportive condition this month.",
    hsLucky: (o) => `Your Lagna lord is ${o.lagnaLord} and your Moon-sign lord is ${o.moonLord}; the colours and numbers below come from those two, not from a generic sun-sign list. The supportive days are the days the Moon transits 1, 3, 6, 7, 10 or 11 from your natal Moon.`,
    hsLuckyBest: (o) => `The best of them are ${o.days} — good Chandra bala falling on ${o.weekdays}, the weekday(s) of your Lagna and Moon lords.`,
    hsDasha: (o) => `You are running ${o.maha} mahadasha, ${o.antar} antardasha, ${o.praty} pratyantardasha${o.window ? ` (${o.from} to ${o.to})` : ""}. A transit only delivers what the running dasha allows, which is why this chapter sits under the transit chapters and not above them.`,
    hsDashaLord: (o) => `${o.lord} is natally in your ${TPL.en.houseRef(o.natalHouse)} (${o.natalSign}, ${o.natalDignity}) and transits your ${TPL.en.houseRef(o.transitHouse)} this month.`,
    hsPhases: (o) => `${o.newMoon ? `The New Moon falls on ${o.newMoon} in ${o.newSign}, your ${TPL.en.houseRef(o.newHouse)} — the low point of the month's energy and the right time to begin quietly rather than loudly.` : ""} ${o.fullMoon ? `The Full Moon falls on ${o.fullMoon} in ${o.fullSign}, your ${TPL.en.houseRef(o.fullHouse)} — matters come to a head there.` : ""}`.trim(),
    hsPhasesNone: () => "Neither a New nor a Full Moon falls inside this calendar month, so the emotional rhythm stays even throughout.",
    hsCautions: (o) => `${o.chandrashtama.length ? `Chandrashtama — the Moon transiting the 8th from your natal Moon — falls on ${o.chandrashtama}. Do not sign, travel long, or start treatment on those days if it can wait.` : "No Chandrashtama day falls in this month."} ${o.weak.length ? `Lower energy on ${o.weak}.` : ""}`,
    hsCautionMalefic: (o) => `${o.planet} transits your ${TPL.en.houseRef(o.house)} this month — ${o.area}. Keep that area conservative.`,
    hsRemedy: (o) => `${o.planet} is the planet to work with this month: ${o.reason} Do this — ${o.act}. Chant ${o.mantra} on ${o.weekday}, and give ${o.daan}.`,
    hsNext: (o) => `${o.month} opens with ${o.transits}. ${o.ingresses.length ? `Sign changes in its first ${o.days} days: ${o.ingresses}.` : `No planet changes sign in the first ${o.days} days of it.`}`,
    hsNextNote: () => "This is a look-ahead only — the full month is read in its own report, where every day is computed rather than projected.",

    vpSummary: (o) => `Your ${TPL.en.ord(o.age)} solar year runs ${o.from} to ${o.to}. ${o.varshesh} rules it from the ${TPL.en.houseRef(o.varsheshHouse)} (${o.varsheshDignity}), the Muntha stands in the ${TPL.en.houseRef(o.munthaHouse)}, and by Panchavargeeya Bala ${o.strongest} is your strongest planet of the year and ${o.weakest} the weakest. ${o.goodMonths} of the twelve solar months score supportive and ${o.hardMonths} need care.`,
    vpRecommendation: (o) => `Work with ${o.lord} first — ${o.act} — and keep ${o.mantra} on ${o.weekday} through the year. Place important beginnings in month ${o.keyMonth} (${o.keyDates}), and keep month(s) ${o.hardMonths || "—"} for finishing rather than starting.`,
    hsSummary: (o) => `In ${o.month} ${o.year} the Sun crosses your ${TPL.en.houseRef(o.sunHouse)}, ${o.ingressCount} planet(s) change sign, and ${o.retroCount} are retrograde. ${o.goodDays} day(s) carry good Chandra bala and ${o.hardDays} do not. The reading runs against Lagna ${o.lagna} with ${o.maha}–${o.antar} dasha in force.`,
    hsRecommendation: (o) => `Put decisions on ${o.bestDays || o.goodDays}, and keep ${o.avoidDays || "the low-Chandra-bala days"} for routine work. This month's remedial focus is ${o.planet}: ${o.act}.`,
  },

  hi: {
    ord: (n) => `${n}वें`,
    houseRef: (n) => `${HI_HOUSE_OBL[n] || `${n}वें`} भाव`,
    houseName: (n) => `${HI_HOUSE_NOM[n] || `${n}वाँ`} भाव`,
    list: (items) => items.join(", "),
    deg: (d) => `${Math.floor(d)}°${String(Math.round((d % 1) * 60)).padStart(2, "0")}'`,

    method: (kind) => kind === "vp"
      ? "इस रिपोर्ट का प्रत्येक आँकड़ा आपके जन्म विवरण से गणित किया गया है: सूर्य की सायन-निरयण देशांतर की जन्म-स्थिति से तुलना कर द्विभाजन विधि से वर्ष-प्रवेश का क्षण निकाला गया, उसी क्षण की वर्ष कुंडली आपके जन्म स्थान पर बनाई गई, और नीचे का प्रत्येक निष्कर्ष उन्हीं अंकों पर लागू ताजिक नियम से निकला है। जहाँ शास्त्रीय सूत्र प्रयुक्त हुआ है, वहाँ फल के साथ सूत्र भी छापा गया है ताकि आप स्वयं जाँच सकें।"
      : "यह सूर्य-राशि आधारित सामान्य भविष्यफल नहीं है। पहले आपकी जन्म कुंडली बनाई जाती है, फिर मास के प्रत्येक दिन के स्थानीय मध्याह्न की एक कुंडली बनाई जाती है; प्रत्येक गोचर ग्रह को आपके लग्न से गिने गए भावों में रखा जाता है, और नीचे की प्रत्येक तिथि-सहित पंक्ति उसी दैनिक श्रृंखला से निकली है।",
    subject: (o) => `${o.name} · ${o.dob} · ${o.tob} · ${o.pob || "—"}`,
    placementsNote: () => "इस पृष्ठ की ग्रह-स्थिति तालिका ही वह आँकड़ा है जिससे कुंडली का चित्र बनता है — ग्रह, राशि, भाव और अंश, ठीक जैसे गणित हुए।",

    vpAbout: (o) => `यह आपका ${o.age}वाँ सौर वर्ष है। इसका आरंभ ${o.from} के वर्ष-प्रवेश से होता है और समाप्ति ${o.to} के अगले प्रवेश पर। वर्ष लग्न ${o.lagna} उदय हो रहा है, वर्षेश ${o.varshesh} है, और मुंथा बढ़कर आपके ${TPL.hi.houseRef(o.munthaHouse)} में आ गई है — अतः ${o.munthaArea} पूरे वर्ष प्रकाशित रहेगा।`,
    vpSolarReturn: (o) => `सूर्य अपनी जन्मकालीन निरयण देशांतर ${o.natalSunLon}° पर ${o.instant} को लौटा। उस क्षण की कुंडली में ${o.lagna} लग्न ${o.lagnaDeg} पर उदित है और सूर्य उसके ${TPL.hi.houseRef(o.sunHouse)} में स्थित है — अर्थात ${o.dayNight} प्रवेश, और यही आगे सहम तथा हर्ष बल की दिन/रात्रि गणना तय करता है।`,
    vpYearLord: (o) => `इस वर्ष का स्वामित्व ${o.lord} को मिला है। यह वर्ष कुंडली के ${TPL.hi.houseRef(o.house)} में ${o.dignity} है${o.angular ? " तथा केंद्रस्थ है" : ""}। अन्य अधिकारी ग्रहों की तुलना में बल एवं केंद्रस्थिति के आधार पर ${o.score} अंक पाकर इसका चयन हुआ। ${o.roles ? `यह इन पदों को धारण करता है: ${o.roles}।` : "इसके पास कोई अतिरिक्त पद नहीं है।"}`,
    vpMuntha: (o) => `मुंथा ${o.sign} राशि में, अर्थात वर्ष कुंडली के ${TPL.hi.houseRef(o.house)} में आ गई है। इसका स्वामी ${o.lord} ${TPL.hi.houseRef(o.lordHouse)} में ${o.lordDignity} है, अतः ${o.area} ही वह भूमि है जिस पर यह वर्ष चलेगा, और ${o.lord} की स्थिति ही तय करेगी कि कार्य कितनी सुगमता से बढ़ें।`,
    vpChartLead: (o) => `${o.instant} के लिए निर्मित, ${o.lagna} लग्न। ${o.kendra} ग्रह केंद्र में और ${o.trikona} ग्रह त्रिकोण में हैं — यही स्थितियाँ वर्ष को उठाती हैं। ${o.retro ? `इस वर्ष वक्री: ${o.retro}।` : "वर्ष कुंडली में कोई ग्रह वक्री नहीं है।"}`,
    vpTripataki: (o) => `त्रि-पताकी चक्र वर्ष कुंडली के चंद्रमा से बनाया जाता है, जो ${o.moonSign} में है। वहाँ से बारह राशियाँ गिनकर उन्हें क्रम से तीन पताकाओं पर बाँटा जाता है — पहली पताका पर 1, 4, 7 और 10; दूसरी पर 2, 5, 8 और 11; तीसरी पर 3, 6, 9 और 12। इस वर्ष ${o.strongest} क्रमांक की पताका पर शुभ ग्रहों का संतुलन सर्वोत्तम है।`,
    vpSahams: (o) => `सहम ताजिक शास्त्र के संवेदनशील बिंदु हैं: वर्ष कुंडली की दो स्थितियों के बीच का अंतर लग्न पर आरोपित किया जाता है। यह ${o.dayNight} प्रवेश है${o.reversed ? `, अतः नीचे के ${o.reversed} विपर्यय-योग्य सूत्र शास्त्रीय नियमानुसार उलटे क्रम में लिए गए हैं` : ", अतः नीचे का प्रत्येक सूत्र दिवा-क्रम में ही लिया गया है"}। प्रत्येक पंक्ति में वही सूत्र छपा है जिससे वह बिंदु निकला।`,
    vpSahamLine: (o) => `${o.name} — ${o.formula} → ${o.sign} ${o.deg}, अर्थात ${TPL.hi.houseName(o.house)}। स्वामी ${o.lord} ${TPL.hi.houseRef(o.lordHouse)} में ${o.lordDignity} है। कारकत्व: ${o.meaning}।`,
    vpPancha: () => "पंचवर्गीय बल ताजिक की पाँच-अंगी बल गणना है: क्षेत्र बल (राशि, अधिकतम 30), उच्च बल (उच्च बिंदु से दूरी, अधिकतम 20), हद्दा बल (मिस्री हद्दा, अधिकतम 15), द्रेष्काण बल (ग्रह के लिंग अनुसार द्रेष्काण, अधिकतम 10) तथा नवांश बल (अधिकतम 5)। अस्सी अंकों के योग को चार से भाग देकर शास्त्रीय 0–20 मान मिलता है: 15 से ऊपर अति बलवान, 10–15 बलवान, 5–10 मध्यम, 5 से नीचे निर्बल।",
    vpPanchaVerdict: (o) => `इस वर्ष ${o.strongest} सर्वाधिक साधन-संपन्न ग्रह है — ${o.strongestBala}/20, और ${o.weakest} सबसे निर्बल — ${o.weakestBala}/20। जो कार्य अवश्य सफल होना चाहिए वह ${o.strongest} को सौंपें, और वर्ष की योजना केवल ${o.weakest} के भरोसे न बनाएँ।`,
    vpHarsha: () => "हर्ष बल चार स्थितियों को पाँच-पाँच अंक देता है, अधिकतम बीस: ग्रह अपने हर्ष-भाव में हो; अपने गोलार्ध में हो (दिवा ग्रह क्षितिज के ऊपर, रात्रि ग्रह नीचे); दिन अथवा रात्रि प्रवेश के अनुरूप हो; तथा अपने लिंग की राशि में हो — पुरुष ग्रह विषम राशि में, स्त्री एवं नपुंसक ग्रह सम राशि में।",
    vpHarshaVerdict: (o) => `इस वर्ष हर्ष की दृष्टि से ${o.top} सर्वोत्तम स्थिति में है — 20 में से ${o.topPoints} अंक। ${o.zero ? `${o.zero} को यहाँ शून्य अंक मिले — वह बल के आधार पर कार्य तो कर सकता है, पर सहजता से नहीं।` : "प्रत्येक ग्रह को कम से कम एक स्थिति प्राप्त है, अतः वर्ष में कुछ भी पूर्णतः असहज नहीं है।"}`,
    vpMonth: (o) => `सौर मास ${o.i} की अवधि ${o.from} से ${o.to} तक है — इसी में सूर्य अपने वार्षिक चाप का ${o.arc} भाग पार करता है और आपके ${TPL.hi.houseRef(o.sunHouse)} में स्थित रहता है। मास मुंथा बढ़कर ${TPL.hi.houseRef(o.munthaHouse)} में आ गई है, अतः इस मास की भूमि ${o.munthaArea} है।`,
    vpMonthRuler: (o) => `इसका बड़ा भाग (${o.days} दिन) ${o.lord} के अधीन है, जो वर्ष कुंडली के ${TPL.hi.houseRef(o.house)} में ${o.dignity} है। यह ${o.karaka} का कारक है। अतः इस मास को ${o.tone} समझें।`,
    vpMonthEntry: (o) => `मास प्रवेश के समय ${o.lagna} लग्न उदित है और चंद्रमा ${o.moon} में है — ${o.tithi}।`,
    vpArea: (o) => `${o.area} का विचार वर्ष कुंडली के ${o.houses} से किया जाता है। ${o.lordLines}`,
    vpAreaSaham: (o) => `इसका सहम ${o.saham} ${o.sign} राशि में ${TPL.hi.houseRef(o.house)} में पड़ता है; उस सहम का स्वामी ${o.lord} ${TPL.hi.houseRef(o.lordHouse)} में ${o.lordDignity} है।`,
    vpAreaWindows: (o) => o.months.length
      ? `इस क्षेत्र को सक्रिय करने वाली मुद्दा अवधि ${o.months} मास में पड़ती है — ${o.dates}।`
      : "इस वर्ष कोई मुद्दा अंतर्दशा इन भावों के स्वामी की नहीं है, अतः यह क्षेत्र किसी निश्चित तिथि-खंड से नहीं, सामान्य गति से आगे बढ़ेगा।",
    vpLordLine: (o) => `${TPL.hi.houseName(o.house)} ${o.sign} है; इसका स्वामी ${o.lord} ${TPL.hi.houseRef(o.lordHouse)} में ${o.dignity} है${o.retro ? ", वक्री" : ""}${o.occupants ? `। इसमें ${o.occupants} स्थित हैं` : ", इसमें कोई ग्रह नहीं"}।`,
    vpBest: (o) => `${o.goal}: मास ${o.month} (${o.dates}), स्वामी ${o.lord} जो ${TPL.hi.houseRef(o.house)} में ${o.dignity} है।`,
    vpBestNone: (o) => `${o.goal}: कोई मास स्पष्ट रूप से श्रेष्ठ नहीं है — किसी अवधि की प्रतीक्षा करने के बजाय प्रयास पूरे वर्ष बाँटें।`,
    vpDifficult: (o) => `मास ${o.i} (${o.dates}) — ${o.reason}। इस अवधि में नए वचन सीमित रखें; जो चल रहा है उसे पूरा करें।`,
    vpDifficultNone: () => "इस वर्ष का कोई भी सौर मास ऐसा नहीं है जिसमें निर्बल मुद्दा स्वामी और कष्टकारी मुंथा भाव दोनों साथ हों। अतः बचकर चलने योग्य कोई अवधि नहीं है — यह जान लेना भी उतना ही आवश्यक है।",
    vpMuhurat: (o) => `${o.weekday} ${o.planet} का वार है और ${o.planet} ही आपका वर्षेश है। इस वर्ष की अनुकूल अवधियों में ये ${o.weekday} पड़ते हैं: ${o.dates}। इन्हें आरंभ के लिए प्रयोग करें — हस्ताक्षर, पहला भुगतान, पहली भेंट।`,
    vpMuhuratAvoid: (o) => `${o.months} मास में पड़ने वाले ${o.weekday} को कोई नया कार्य आरंभ न करें — ये वही कठिन अवधियाँ हैं जो पिछले अध्याय में दी गई हैं। इन तिथियों पर चल रहा कार्य आगे बढ़ाना उचित है, नया आरंभ नहीं।`,
    vpRemedies: (o) => `इस वर्ष का भार दो ग्रह उठाते हैं: ${o.lord}, क्योंकि वह वर्षेश है, और ${o.weak}, क्योंकि पंचवर्गीय बल में वह सबसे निर्बल है — ${o.weakBala}/20। पहले को बल देने से पूरा वर्ष स्थिर होता है; दूसरे को बल देने से वर्ष की सबसे कमजोर कड़ी परिणाम तय नहीं कर पाती।`,
    vpMantra: (o) => `${o.planet}: ${o.mantra}। शास्त्रीय जप संख्या ${o.count} है। आरंभ ${o.startDate} से करें, जो आपके वर्ष का पहला ${o.weekday} है, और वर्षभर में पूर्ण करें — लगभग ${o.perWeek} जप प्रति सप्ताह।`,
    vpDaan: (o) => `${o.planet} — ${o.weekday} को ${o.daan} का दान करें। इसके लिए सर्वोत्तम मास ${o.month} (${o.dates}) है, जब ${o.planet} की अपनी मुद्दा अवधि चलती है।`,
    vpDaanNone: (o) => `${o.planet} — ${o.weekday} को ${o.daan} का दान करें, वर्ष के किसी भी सप्ताह में; इस वर्ष ${o.planet} की अपनी कोई मुद्दा अवधि नहीं है।`,
    vpFasting: (o) => `${o.planet}: ${o.weekday} का व्रत रखें। इस सौर वर्ष में ऐसे ${o.count} दिन हैं; पहला ${o.first} को पड़ता है।`,
    vpTemple: (o) => `${o.planet} — ${o.deity} मंदिर के दर्शन करें। ${o.months} मास में और ${o.weekday} को सर्वोत्तम।`,
    vpCompare: (o) => `नौ ग्रहों में से ${o.moved} इस वर्ष जन्म कुंडली से भिन्न भाव में हैं, और ${o.improved} की स्थिति जन्म कुंडली से बेहतर है। जन्म कुंडली बताती है कि आप क्या हैं; वर्ष कुंडली बताती है कि यह एक वर्ष उसका क्या करता है।`,
    vpCompareLine: (o) => `${o.planet}: जन्म में ${o.natalSign} (${TPL.hi.houseName(o.natalHouse)}, ${o.natalDignity}) → वर्ष में ${o.annualSign} (${TPL.hi.houseName(o.annualHouse)}, ${o.annualDignity})।`,
    vpYearEnd: (o) => `वर्ष का अंत ${o.lord} की मुद्दा अवधि में होता है, ${o.from} से ${o.to} तक, जिसमें ${o.lord} ${TPL.hi.houseRef(o.house)} में ${o.dignity} है। अगला वर्ष-प्रवेश ${o.next} को है, जब मुंथा ${o.nextMuntha} में जाएगी — आपके जन्म लग्न से ${TPL.hi.houseName(o.nextMunthaHouse)}। उस तिथि से पहले इस वर्ष के अधूरे कार्य पूर्ण कर लें।`,
    vpHowTo: (o) => `पहले अध्याय 3 पढ़ें — वर्षेश और मुंथा वे दो तथ्य हैं जिनसे शेष सब मापा जाता है। फिर मास ${o.keyMonth} देखें, जो आपके वर्ष की सबसे बलवान अवधि है, और महत्वपूर्ण निर्णय वहीं रखें। जीवन-क्षेत्र वाले अध्याय (21–29) विशेष प्रश्नों का उत्तर देते हैं; उपाय वाले अध्याय (33–37) वह भाग हैं जिन्हें वास्तव में दोहराना है।`,

    hsAbout: (o) => `यह ${o.month} ${o.year} का आपका फल है, जो आपकी अपनी कुंडली पर गणित है — लग्न ${o.lagna}, चंद्रमा ${o.moon} में। मास ${o.from} से ${o.to} तक, कुल ${o.days} दिन, और इसकी प्रत्येक तिथि-सहित पंक्ति उसी दिन की कुंडली से निकली है।`,
    hsGlance: (o) => `इस मास सूर्य आपके ${TPL.hi.houseRef(o.sunHouse)} में रहता है, अतः ${o.sunArea} पर प्रकाश पड़ता है। ${o.ingressCount ? `मास के भीतर ${o.ingressCount} ग्रह राशि बदलते हैं` : "मास के भीतर कोई ग्रह राशि नहीं बदलता"}, और आपका ${TPL.hi.houseName(o.busiestHouse)} सर्वाधिक भरा है — ${o.busiestPlanets}। इन सबके नीचे ${o.maha}–${o.antar} दशा चल रही है।`,
    hsTransits: (o) => `आठ ग्रह देखे गए हैं। ${o.ingressCount ? `इनमें ${o.ingressCount} इस मास राशि बदलते हैं, तिथि नीचे दी गई है।` : "कोई भी इस मास राशि नहीं बदलता, अतः नीचे की स्थिति पहली से अंतिम तिथि तक बनी रहती है।"} ${o.retro ? `वक्री: ${o.retro}।` : "इस मास कोई ग्रह वक्री नहीं है।"}`,
    hsTransitLine: (o) => `${o.planet} मास के अंत में ${o.sign} में है — आपका ${TPL.hi.houseName(o.house)} (${o.area})। यह ${o.karaka} का कारक है और ${o.dignity} है${o.retro ? " तथा वक्री है" : ""}।${o.ingressText || ""}`,
    hsIngressClause: (o) => ` ${o.date} को यह ${o.toSign} में प्रवेश करता है, अर्थात आपके ${TPL.hi.houseRef(o.fromHouse)} से ${TPL.hi.houseRef(o.toHouse)} में।`,
    hsChart: (o) => `आपकी जन्म स्थितियाँ स्थिर हैं; गोचर स्तंभ बताता है कि इस मास प्रत्येक ग्रह वास्तव में कहाँ है। दोनों स्तंभों का अंतर ही यह मास है। इस मास ${o.overlap ? `${o.overlap} ग्रह ठीक उसी भाव में गोचर कर रहे हैं जिसमें वे जन्म कुंडली में हैं` : "कोई ग्रह अपने जन्म भाव में गोचर नहीं कर रहा"}।`,
    hsWeek: (o) => `${o.from} से ${o.to} तक। ${o.good.length ? `चंद्रबल से अनुकूल: ${o.good}।` : "इस सप्ताह किसी दिन उत्तम चंद्रबल नहीं है।"} ${o.hard.length ? `सावधानी से चलें: ${o.hard}।` : ""} ${o.ingress || ""}`,
    hsDayRow: (o) => `${o.dom} ${o.weekday} · चंद्र ${o.moonSign} (${TPL.hi.houseName(o.moonHouse)}) · ${o.tithi} · ${o.chandra}${o.ingress ? ` · ${o.ingress}` : ""}`,
    hsArea: (o) => `${o.area} का विचार आपके ${o.houses} से होता है। इस मास यह ${o.verdict} है: ${o.hits}। ${o.karakaLine}`,
    hsAreaLord: (o) => `${TPL.hi.houseName(o.house)} ${o.sign} है; इसका स्वामी ${o.lord} जन्म कुंडली में आपके ${TPL.hi.houseRef(o.natalHouse)} में है और इस मास आपके ${TPL.hi.houseRef(o.transitHouse)} में गोचर कर रहा है${o.retro ? ", वक्री" : ""}।`,
    hsAreaKaraka: (o) => `इसका कारक ${o.karaka} आपके ${TPL.hi.houseRef(o.house)} में गोचर कर रहा है${o.retro ? " और वक्री है" : ""}।`,
    hsAreaDays: (o) => o.days.length ? `चंद्रमा इन तिथियों को इन भावों को बल देता है: ${o.days}।` : "इस मास चंद्रमा अनुकूल स्थिति में इन भावों तक नहीं पहुँचता।",
    hsLucky: (o) => `आपका लग्नेश ${o.lagnaLord} है और चंद्र राशीश ${o.moonLord}; नीचे दिए रंग और अंक इन्हीं दो से निकले हैं, किसी सामान्य सूर्य-राशि सूची से नहीं। अनुकूल दिन वे हैं जब चंद्रमा आपकी जन्म राशि से 1, 3, 6, 7, 10 या 11वें भाव में गोचर करता है।`,
    hsLuckyBest: (o) => `इनमें सर्वश्रेष्ठ ${o.days} हैं — उत्तम चंद्रबल के साथ ${o.weekdays}, जो आपके लग्नेश और चंद्र राशीश के वार हैं।`,
    hsDasha: (o) => `आप ${o.maha} महादशा, ${o.antar} अंतर्दशा और ${o.praty} प्रत्यंतर्दशा में हैं${o.window ? ` (${o.from} से ${o.to})` : ""}। गोचर उतना ही फल देता है जितना चलती दशा अनुमति दे — इसीलिए यह अध्याय गोचर अध्यायों के नीचे रखा गया है, ऊपर नहीं।`,
    hsDashaLord: (o) => `${o.lord} जन्म कुंडली में आपके ${TPL.hi.houseRef(o.natalHouse)} में है (${o.natalSign}, ${o.natalDignity}) और इस मास आपके ${TPL.hi.houseRef(o.transitHouse)} में गोचर कर रहा है।`,
    hsPhases: (o) => `${o.newMoon ? `अमावस्या ${o.newMoon} को ${o.newSign} में पड़ती है, अर्थात आपका ${TPL.hi.houseName(o.newHouse)} — मास की ऊर्जा का न्यूनतम बिंदु; आरंभ शांत रीति से करें, प्रचार से नहीं।` : ""} ${o.fullMoon ? `पूर्णिमा ${o.fullMoon} को ${o.fullSign} में पड़ती है, अर्थात आपका ${TPL.hi.houseName(o.fullHouse)} — वहीं विषय अपने चरम पर पहुँचते हैं।` : ""}`.trim(),
    hsPhasesNone: () => "इस कैलेंडर मास में न अमावस्या पड़ती है न पूर्णिमा, अतः मन की गति पूरे मास समान रहती है।",
    hsCautions: (o) => `${o.chandrashtama.length ? `चंद्राष्टम — जन्म चंद्र से आठवें भाव में चंद्रमा का गोचर — ${o.chandrashtama} को पड़ता है। इन दिनों यथासंभव हस्ताक्षर, दीर्घ यात्रा या नया उपचार आरंभ न करें।` : "इस मास कोई चंद्राष्टम दिन नहीं है।"} ${o.weak.length ? `${o.weak} को ऊर्जा मंद रहती है।` : ""}`,
    hsCautionMalefic: (o) => `${o.planet} इस मास आपके ${TPL.hi.houseRef(o.house)} में गोचर कर रहा है — ${o.area}। इस क्षेत्र में संयम रखें।`,
    hsRemedy: (o) => `इस मास जिस ग्रह पर कार्य करना है वह ${o.planet} है: ${o.reason} यह करें — ${o.act}। ${o.weekday} को ${o.mantra} का जप करें और ${o.daan} का दान करें।`,
    hsNext: (o) => `${o.month} का आरंभ इस स्थिति से होता है: ${o.transits}। ${o.ingresses.length ? `इसके प्रथम ${o.days} दिनों में राशि परिवर्तन: ${o.ingresses}।` : `इसके प्रथम ${o.days} दिनों में कोई ग्रह राशि नहीं बदलता।`}`,
    hsNextNote: () => "यह केवल प्रारंभिक दृष्टि है — पूरा मास अपनी अलग रिपोर्ट में पढ़ा जाता है, जहाँ प्रत्येक दिन अनुमान से नहीं, गणना से निकाला जाता है।",

    vpSummary: (o) => `आपका ${o.age}वाँ सौर वर्ष ${o.from} से ${o.to} तक चलता है। इसका स्वामी ${o.varshesh} है जो ${TPL.hi.houseRef(o.varsheshHouse)} में ${o.varsheshDignity} है, मुंथा ${TPL.hi.houseRef(o.munthaHouse)} में है, और पंचवर्गीय बल के अनुसार इस वर्ष ${o.strongest} सर्वाधिक बली तथा ${o.weakest} सर्वाधिक निर्बल ग्रह है। बारह सौर मासों में से ${o.goodMonths} अनुकूल हैं और ${o.hardMonths} में सावधानी अपेक्षित है।`,
    vpRecommendation: (o) => `सबसे पहले ${o.lord} पर कार्य करें — ${o.act} — और वर्षभर ${o.weekday} को ${o.mantra} का जप बनाए रखें। महत्वपूर्ण आरंभ मास ${o.keyMonth} (${o.keyDates}) में रखें, तथा ${o.hardMonths || "—"} मास को नए कार्य के बजाय अधूरे कार्य पूर्ण करने में लगाएँ।`,
    hsSummary: (o) => `${o.month} ${o.year} में सूर्य आपके ${TPL.hi.houseRef(o.sunHouse)} से गुजरता है, ${o.ingressCount} ग्रह राशि बदलते हैं और ${o.retroCount} वक्री हैं। ${o.goodDays} दिन उत्तम चंद्रबल वाले हैं और ${o.hardDays} दिन नहीं। यह फल लग्न ${o.lagna} पर आधारित है और ${o.maha}–${o.antar} दशा प्रभावी है।`,
    hsRecommendation: (o) => `निर्णय ${o.bestDays || o.goodDays} तिथियों पर रखें, और ${o.avoidDays || "मंद चंद्रबल वाले दिन"} को सामान्य कार्य के लिए रखें। इस मास का उपाय-केंद्र ${o.planet} है: ${o.act}।`,
  },
};

// ── pack ─────────────────────────────────────────────────────────────────────

export function getPack(language) {
  const L = language === "hi" ? "hi" : "en";
  const t = TPL[L];
  const fmtDate = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${String(x.getUTCDate()).padStart(2, "0")} ${MONTH_SHORT[L][x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  };
  const fmtDateTime = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${fmtDate(x)}, ${String(x.getUTCHours()).padStart(2, "0")}:${String(x.getUTCMinutes()).padStart(2, "0")} UTC`;
  };
  return {
    lang: L,
    sign: (s) => SIGN[L][s] || s,
    planet: (p) => PLANET[L][p] || p,
    planets: (arr) => (arr || []).map((p) => PLANET[L][p] || p).join(", "),
    dignity: (k) => DIGNITY[L][k] || k,
    weekday: (i) => WEEKDAY[L][i],
    weekdayShort: (i) => WEEKDAY_SHORT[L][i],
    monthName: (i) => MONTH[L][i],
    paksha: (k) => PAKSHA[L][k] || k,
    nakshatra: (n) => (L === "hi" ? NAKSHATRA_NAME.hi[n] || n : n),
    // "13 Krishna Paksha" → localized "कृष्ण 13" / "Krishna 13"
    tithi: (num) => `${PAKSHA[L][num <= 15 ? "shukla" : "krishna"]} ${((num - 1) % 15) + 1}`,
    houseArea: (h) => HOUSE_AREA[L][h],
    karaka: (p) => KARAKA[L][p],
    sahamName: (k) => SAHAM_NAME[L][k],
    sahamMeaning: (k) => SAHAM_MEANING[L][k],
    areaName: (k) => AREA_NAME[L][k],
    areaGuide: (k) => AREA_GUIDE[L][k] || [],
    verdict: (k) => VERDICT[L][k] || k,
    tone: (k) => TONE[L][k] || k,
    grade: (k) => GRADE[L][k] || k,
    chandra: (k) => CHANDRA[L][k] || k,
    harshaRule: (k) => HARSHA_RULE[L][k] || k,
    colour: (k) => COLOUR[L][k] || k,
    remedy: (p) => REMEDY[L][p],
    lbl: LBL[L],
    t,
    vpTitles: VP_TITLES[L],
    hsTitles: HS_TITLES[L],
    fmtDate,
    fmtDateTime,
    range: (a, b) => `${fmtDate(a)} – ${fmtDate(b)}`,
    kv: (rows) => rows.filter(Boolean).map(([k, v]) => `${LBL[L][k] || k}: ${v}`).join("\n"),
    ul: (items) => items.filter(Boolean).map((s) => `• ${s}`).join("\n"),
    block: (...parts) => parts.filter((p) => p && String(p).trim()).join("\n\n"),
    head: (key) => LBL[L][key] || key,
    // Sentence terminator — the danda in Hindi, the full stop in English.
    stop: L === "hi" ? "।" : ".",
  };
}

export { SIGN, PLANET, DIGNITY, WEEKDAY, MONTH, HOUSE_AREA, KARAKA, SAHAM_NAME, SAHAM_MEANING, AREA_NAME, AREA_GUIDE, REMEDY, VP_TITLES, HS_TITLES, LBL, TPL };


/**
 * Rewrite English-formatted dates ("12 Nov 2002") into Devanagari months.
 *
 * Dates are built upstream by kundli-facts / normalize-kundli-data with a fixed
 * English month table that knows nothing about the report language, so every
 * report that prints a dasha window leaked "Nov", "Jul", "Oct" into otherwise
 * Hindi sentences. Applied to finished sections, and only to genuinely
 * date-shaped text, so an English word resembling a month is never touched.
 */
const MONTH_DEVANAGARI = {
  Jan: "जन", Feb: "फ़र", Mar: "मार्च", Apr: "अप्रैल", May: "मई", Jun: "जून",
  Jul: "जुल", Aug: "अग", Sep: "सित", Oct: "अक्तू", Nov: "नव", Dec: "दिस",
};
const DATE_RE = /\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\b/g;

/**
 * Planet and sign names that reach a Hindi sentence in English.
 *
 * The detectors compose their reasons from raw chart values ("kendra lord
 * Mercury", "Transit Saturn is in Pisces"), so even a fully translated sentence
 * template ends up with Latin nouns inside it. Longest-first so "Sagittarius"
 * is replaced before any shorter substring of it.
 */
// The five Mahapurusha yogas are named, classical combinations — in a Hindi
// report their names belong in Devanagari like everything else.
const YOGA_NAME_HI = {
  Ruchaka: "रुचक", Bhadra: "भद्र", Hamsa: "हंस", Malavya: "मालव्य", Sasa: "शश",
};

/**
 * Tokens that appear inside computed notation rather than prose — saham
 * formulas ("Moon + Lagna − Sun"), gana and paksha values. Sorted longest-first
 * with everything else, so "LagnaLord" is replaced before "Lagna".
 */
const TOKEN_HI = {
  LagnaLord: "लग्नेश", Lagna: "लग्न", Punya: "पुण्य", Vidya: "विद्या", Yasas: "यश",
  Mitra: "मित्र", Deva: "देव", Manushya: "मनुष्य", Rakshasa: "राक्षस",
  "Shukla Paksha": "शुक्ल पक्ष", "Krishna Paksha": "कृष्ण पक्ष",
  Shukla: "शुक्ल", Krishna: "कृष्ण", Paksha: "पक्ष",
};

const TERM_HI = Object.entries({ ...PLANET.hi, ...SIGN.hi, ...YOGA_NAME_HI, ...NAKSHATRA_NAME.hi, ...TOKEN_HI })
  .filter(([en, hi]) => en && hi && en !== hi)
  .sort((a, b) => b[0].length - a[0].length);

export function localizeTerms(text) {
  return TERM_HI.reduce((acc, [en, hi]) => acc.replace(new RegExp(`\\b${en}\\b`, "g"), hi), text);
}

export function localizeDates(node) {
  if (typeof node === "string") {
    return localizeTerms(node.replace(DATE_RE, (_, d, m, y) => `${d} ${MONTH_DEVANAGARI[m]} ${y}`));
  }
  if (Array.isArray(node)) return node.map(localizeDates);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = localizeDates(v);
    return out;
  }
  return node;
}
