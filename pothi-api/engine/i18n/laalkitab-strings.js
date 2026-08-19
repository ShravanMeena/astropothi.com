// Laal Kitaab report strings — static, deterministic, one table per language.
// Nothing here is generated at runtime and nothing is translated by a model:
// the report builder picks a pack (`en` | `hi`) and interpolates chart values
// into these fixed templates. Both packs MUST expose the same key set —
// buildStringPack() throws if they drift.

// ── vocabulary ───────────────────────────────────────────────────────────────

const PLANET_EN = {
  Sun: "Sun", Moon: "Moon", Mars: "Mars", Mercury: "Mercury", Jupiter: "Jupiter",
  Venus: "Venus", Saturn: "Saturn", Rahu: "Rahu", Ketu: "Ketu",
};
const PLANET_HI = {
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु",
  Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु",
};

const ABBR_EN = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};
const ABBR_HI = {
  Sun: "सू", Moon: "चं", Mars: "मं", Mercury: "बु", Jupiter: "गु",
  Venus: "शु", Saturn: "श", Rahu: "रा", Ketu: "के",
};

const SIGN_EN = {
  Aries: "Aries", Taurus: "Taurus", Gemini: "Gemini", Cancer: "Cancer", Leo: "Leo", Virgo: "Virgo",
  Libra: "Libra", Scorpio: "Scorpio", Sagittarius: "Sagittarius", Capricorn: "Capricorn",
  Aquarius: "Aquarius", Pisces: "Pisces",
};
const SIGN_HI = {
  Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क", Leo: "सिंह", Virgo: "कन्या",
  Libra: "तुला", Scorpio: "वृश्चिक", Sagittarius: "धनु", Capricorn: "मकर",
  Aquarius: "कुंभ", Pisces: "मीन",
};

const NAK_HI = {
  Ashwini: "अश्विनी", Bharani: "भरणी", Krittika: "कृत्तिका", Rohini: "रोहिणी", Mrigashira: "मृगशिरा",
  Ardra: "आर्द्रा", Punarvasu: "पुनर्वसु", Pushya: "पुष्य", Ashlesha: "आश्लेषा", Magha: "मघा",
  "Purva Phalguni": "पूर्वा फाल्गुनी", "Uttara Phalguni": "उत्तरा फाल्गुनी", Hasta: "हस्त", Chitra: "चित्रा",
  Swati: "स्वाति", Vishakha: "विशाखा", Anuradha: "अनुराधा", Jyeshtha: "ज्येष्ठा", Mula: "मूल",
  "Purva Ashadha": "पूर्वाषाढ़ा", "Uttara Ashadha": "उत्तराषाढ़ा", Shravana: "श्रवण", Dhanishta: "धनिष्ठा",
  Shatabhisha: "शतभिषा", "Purva Bhadrapada": "पूर्व भाद्रपद", "Uttara Bhadrapada": "उत्तर भाद्रपद", Revati: "रेवती",
};

const YOGA_HI = {
  Vishkumbha: "विष्कुम्भ", Preeti: "प्रीति", Ayushman: "आयुष्मान", Saubhagya: "सौभाग्य", Shobhana: "शोभन",
  Atiganda: "अतिगण्ड", Sukarma: "सुकर्मा", Dhriti: "धृति", Shoola: "शूल", Ganda: "गण्ड", Vriddhi: "वृद्धि",
  Dhruva: "ध्रुव", Vyaghata: "व्याघात", Harshana: "हर्षण", Vajra: "वज्र", Siddhi: "सिद्धि",
  Vyatipata: "व्यतीपात", Variyana: "वरीयान", Parigha: "परिघ", Shiva: "शिव", Siddha: "सिद्ध",
  Sadhya: "साध्य", Shubha: "शुभ", Shukla: "शुक्ल", Brahma: "ब्रह्म", Indra: "इन्द्र", Vaidhriti: "वैधृति",
};

const KARANA_HI = {
  Bava: "बव", Balava: "बालव", Kaulava: "कौलव", Taitila: "तैतिल", Garaja: "गर", Vanija: "वणिज",
  Vishti: "विष्टि", Shakuni: "शकुनि", Chatushpada: "चतुष्पद", Naga: "नाग", Kimstughna: "किंस्तुघ्न",
};

const WEEKDAY_HI = {
  Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार",
  Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार",
};

const MONTH_EN = {
  Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", May: "May", Jun: "Jun",
  Jul: "Jul", Aug: "Aug", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec",
};
const MONTH_HI = {
  Jan: "जनवरी", Feb: "फ़रवरी", Mar: "मार्च", Apr: "अप्रैल", May: "मई", Jun: "जून",
  Jul: "जुलाई", Aug: "अगस्त", Sep: "सितंबर", Oct: "अक्तूबर", Nov: "नवंबर", Dec: "दिसंबर",
};

const PAKSHA_HI = { "Shukla Paksha": "शुक्ल पक्ष", "Krishna Paksha": "कृष्ण पक्ष" };
const GAN_HI = { Deva: "देव", Manushya: "मनुष्य", Rakshasa: "राक्षस" };
const NADI_HI = { Aadi: "आदि", Madhya: "मध्य", Antya: "अंत्य" };

const HI_ORD_NOM = ["पहला", "दूसरा", "तीसरा", "चौथा", "पाँचवाँ", "छठा", "सातवाँ", "आठवाँ", "नवाँ", "दसवाँ", "ग्यारहवाँ", "बारहवाँ"];
const HI_ORD = ["पहले", "दूसरे", "तीसरे", "चौथे", "पाँचवें", "छठे", "सातवें", "आठवें", "नवें", "दसवें", "ग्यारहवें", "बारहवें"];
function enOrd(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// State words used by the placements table, the chart legend and the readings.
const STATE_EN = {
  strong: "strong", comfortable: "comfortable", "needs upay": "needs upay",
  workable: "workable", sleeping: "sleeping", blind: "blind", neutral: "neutral",
};
const STATE_HI = {
  strong: "प्रबल", comfortable: "सहज", "needs upay": "उपाय चाहिए",
  workable: "सामान्य", sleeping: "सोया हुआ", blind: "अंधा", neutral: "तटस्थ",
};
// Same states in a form that can follow "X is …" inside a sentence.
const STATE_PHRASE_EN = {
  strong: "strong", comfortable: "comfortable", "needs upay": "in need of upay",
  workable: "workable", sleeping: "asleep", blind: "blind", neutral: "neutral",
};
const STATE_PHRASE_HI = {
  strong: "प्रबल", comfortable: "सहज", "needs upay": "उपाय का ज़रूरतमंद",
  workable: "सामान्य", sleeping: "सोया हुआ", blind: "अंधा", neutral: "तटस्थ",
};

// ── what each graha gives, and what it charges ───────────────────────────────

const GIFT_EN = {
  Sun: "standing, authority and the nerve to be seen",
  Moon: "peace of mind, a settled home and an instinct for people",
  Mars: "courage, physical energy and the ability to finish a hard thing",
  Mercury: "quick understanding, trade sense and clean speech",
  Jupiter: "wisdom, protection, money that stays and the goodwill of elders",
  Venus: "comfort, taste, marriage happiness and money that arrives easily",
  Saturn: "patience, staying power and results that come late but hold",
  Rahu: "ambition, foreign openings and luck that arrives from nowhere",
  Ketu: "detachment, sharp intuition and freedom from other people's needs",
};
const GIFT_HI = {
  Sun: "मान, अधिकार और सामने आने का आत्मविश्वास",
  Moon: "मन की शांति, बसा हुआ घर और लोगों को पढ़ लेने की समझ",
  Mars: "साहस, शारीरिक ऊर्जा और कठिन काम पूरा करने की क्षमता",
  Mercury: "तेज़ समझ, व्यापार-बुद्धि और साफ़ वाणी",
  Jupiter: "ज्ञान, रक्षा, टिकने वाला धन और बड़ों का आशीर्वाद",
  Venus: "सुख, रुचि, वैवाहिक सुख और सहजता से आने वाला धन",
  Saturn: "धैर्य, टिके रहने की शक्ति और देर से मिलने वाले पक्के परिणाम",
  Rahu: "महत्वाकांक्षा, विदेश के अवसर और अचानक मिलने वाला लाभ",
  Ketu: "वैराग्य, तीखी अंतर्दृष्टि और दूसरों की अपेक्षाओं से मुक्ति",
};

const COST_EN = {
  Sun: "pride that will not ask for help, and friction with the father or the boss",
  Moon: "moods that follow the room, and comfort bought instead of earned",
  Mars: "temper, haste, and things signed in anger",
  Mercury: "nerves, over-talking, and paperwork left half-finished",
  Jupiter: "advice given where none was asked, and generosity that becomes a burden",
  Venus: "indulgence, and buying peace rather than making it",
  Saturn: "delay, isolation, and work done resentfully",
  Rahu: "shortcuts, obsession, and gains that do not stay",
  Ketu: "sudden withdrawal, and responsibilities dropped without warning",
};
const COST_HI = {
  Sun: "अहंकार जो मदद नहीं माँगता, और पिता या अधिकारी से टकराव",
  Moon: "माहौल के साथ बदलता मन, और मेहनत की जगह ख़रीदा हुआ आराम",
  Mars: "क्रोध, जल्दबाज़ी, और गुस्से में किए गए हस्ताक्षर",
  Mercury: "घबराहट, ज़रूरत से ज़्यादा बोलना, और अधूरे छूटे काग़ज़ात",
  Jupiter: "बिना माँगे दी गई सलाह, और उदारता जो बोझ बन जाती है",
  Venus: "भोग-विलास, और शांति बनाने की जगह उसे ख़रीद लेना",
  Saturn: "देरी, अकेलापन, और मन मारकर किया गया काम",
  Rahu: "शॉर्टकट, जुनून, और ऐसा लाभ जो टिकता नहीं",
  Ketu: "अचानक पीछे हट जाना, और बिना बताए छोड़ी गई ज़िम्मेदारी",
};

// ── houses ───────────────────────────────────────────────────────────────────

const ARENA_EN = {
  1: "your own body, temperament and the first impression you make",
  2: "money kept, family under one roof, and what you say",
  3: "courage, younger siblings and the small daily efforts",
  4: "mother, house, land and peace of mind",
  5: "children, study, and anything you bet on",
  6: "work, enemies, borrowing and treatable illness",
  7: "marriage, partners and everything done with another person",
  8: "sudden change, inheritance, and matters that stay hidden",
  9: "fortune, father, long journeys and what you believe",
  10: "career, standing and what you are publicly known for",
  11: "income, gains, elder siblings and the network you draw on",
  12: "expense, sleep, foreign lands and what you give away",
};
const ARENA_HI = {
  1: "अपना शरीर, स्वभाव और पहला प्रभाव",
  2: "जमा धन, एक छत के नीचे परिवार, और आपकी वाणी",
  3: "साहस, छोटे भाई-बहन और रोज़ के छोटे प्रयास",
  4: "माता, घर, ज़मीन और मन की शांति",
  5: "संतान, पढ़ाई, और हर वह चीज़ जिस पर आप दाँव लगाते हैं",
  6: "काम, शत्रु, कर्ज़ और ठीक हो जाने वाली बीमारी",
  7: "विवाह, साझेदार और हर वह काम जो किसी और के साथ होता है",
  8: "अचानक बदलाव, विरासत, और छिपे रहने वाले मामले",
  9: "भाग्य, पिता, लंबी यात्राएँ और आपकी आस्था",
  10: "व्यवसाय, प्रतिष्ठा और जिस काम से आप जाने जाते हैं",
  11: "आय, लाभ, बड़े भाई-बहन और आपका संपर्क-जाल",
  12: "ख़र्च, नींद, विदेश और जो आप दान करते हैं",
};

const DOMAIN_EN = {
  1: "self, body, personality and vitality",
  2: "wealth, family, speech and accumulated savings",
  3: "courage, siblings, communication and short efforts",
  4: "mother, home, property, vehicles and inner peace",
  5: "children, education, intelligence and past merit",
  6: "enemies, debts, disease, service and daily work",
  7: "spouse, marriage, partnerships and business",
  8: "longevity, obstacles, sudden change and hidden matters",
  9: "fortune, father, dharma, higher learning and long journeys",
  10: "career, status, authority and public conduct",
  11: "gains, income, elder siblings and fulfilment of desires",
  12: "expenses, losses, foreign lands, isolation and moksha",
};
const DOMAIN_HI = {
  1: "तन, व्यक्तित्व और जीवनशक्ति",
  2: "धन, कुटुंब, वाणी और संचय",
  3: "पराक्रम, भाई-बहन, संवाद और छोटे प्रयास",
  4: "माता, गृह, भूमि, वाहन और सुख",
  5: "संतान, विद्या, बुद्धि और पूर्व पुण्य",
  6: "शत्रु, ऋण, रोग, सेवा और दैनिक कार्य",
  7: "जीवनसाथी, विवाह, साझेदारी और व्यापार",
  8: "आयु, बाधा, आकस्मिक परिवर्तन और गुप्त बातें",
  9: "भाग्य, पिता, धर्म, उच्च शिक्षा और लंबी यात्रा",
  10: "कर्म, पद, अधिकार और सार्वजनिक आचरण",
  11: "लाभ, आय, बड़े भाई-बहन और इच्छापूर्ति",
  12: "व्यय, हानि, विदेश, एकांत और मोक्ष",
};

const KARAKA_EN = {
  Sun: "father, authority, health, government, soul, reputation",
  Moon: "mother, mind, emotions, comforts, fluids, public life",
  Mars: "brothers, courage, land, energy, disputes, blood",
  Mercury: "intellect, speech, trade, education, nerves, sisters",
  Jupiter: "wisdom, wealth, children, dharma, teachers, fortune",
  Venus: "spouse, luxury, vehicles, arts, comforts, marriage",
  Saturn: "discipline, labour, longevity, servants, delays, karma",
  Rahu: "ambition, foreign, illusion, sudden events, obsession",
  Ketu: "detachment, spirituality, sons, past-life, mysticism",
};
const KARAKA_HI = {
  Sun: "पिता, अधिकार, स्वास्थ्य, सरकार, आत्मा और प्रतिष्ठा",
  Moon: "माता, मन, भावनाएँ, सुख, जल-तत्व और लोकप्रियता",
  Mars: "भाई, साहस, भूमि, ऊर्जा, विवाद और रक्त",
  Mercury: "बुद्धि, वाणी, व्यापार, शिक्षा, स्नायु और बहनें",
  Jupiter: "ज्ञान, धन, संतान, धर्म, गुरु और भाग्य",
  Venus: "जीवनसाथी, विलासिता, वाहन, कला, सुख और विवाह",
  Saturn: "अनुशासन, श्रम, आयु, सेवक, देरी और कर्म",
  Rahu: "महत्वाकांक्षा, विदेश, भ्रम, आकस्मिक घटनाएँ और जुनून",
  Ketu: "वैराग्य, अध्यात्म, पुत्र, पूर्वजन्म और रहस्य",
};

// ── the acts ─────────────────────────────────────────────────────────────────

const DAILY_ACT_EN = {
  Sun: "offer water to the rising sun",
  Moon: "offer milk or water at a Shiva temple and keep silver on you",
  Mars: "give something sweet to a younger sibling or to children",
  Mercury: "float a holed copper coin in running water",
  Jupiter: "put on a saffron tilak and serve an elder or teacher",
  Venus: "give away something white — curd, rice or milk",
  Saturn: "feed a black dog and give mustard oil to someone who works with their hands",
  Rahu: "float barley in running water",
  Ketu: "feed a dog, and keep your ears and feet clean",
};
const DAILY_ACT_HI = {
  Sun: "उगते सूर्य को जल अर्पित करें",
  Moon: "शिव मंदिर में दूध या जल चढ़ाएँ और चाँदी पास रखें",
  Mars: "छोटे भाई-बहन या बच्चों को कुछ मीठा दें",
  Mercury: "छेद किया हुआ ताँबे का सिक्का बहते पानी में बहाएँ",
  Jupiter: "केसर का तिलक लगाएँ और किसी बड़े या गुरु की सेवा करें",
  Venus: "सफ़ेद वस्तु — दही, चावल या दूध — दान करें",
  Saturn: "काले कुत्ते को रोटी खिलाएँ और मेहनतकश को सरसों का तेल दें",
  Rahu: "जौ बहते पानी में बहाएँ",
  Ketu: "कुत्ते को खाना खिलाएँ, और कान-पैर साफ़ रखें",
};

const ANNUAL_ACT_EN = {
  Sun: "on your birthday, give away wheat or jaggery in your father's name",
  Moon: "once a year give a silver item or a pot of water to a household with none",
  Mars: "on your birthday, give away one item of iron — that settles Mars for the year",
  Mercury: "once a year pay for a child's schoolbooks; never take a gift of green cloth",
  Jupiter: "once a year water a peepal tree through the hot months and pay a teacher's dues",
  Venus: "once a year give a cow its fodder for a full month; keep the house fragrant on Fridays",
  Saturn: "donate a blanket in winter — Lal Kitab counts warmth given as Saturn settled",
  Rahu: "once a year flow coal or barley in a river and give to the destitute",
  Ketu: "once a year give away a two-coloured blanket and feed street dogs for a fortnight",
};
const ANNUAL_ACT_HI = {
  Sun: "जन्मदिन पर पिता के नाम गेहूँ या गुड़ दान करें",
  Moon: "वर्ष में एक बार किसी ज़रूरतमंद घर को चाँदी की वस्तु या जल का पात्र दें",
  Mars: "जन्मदिन पर लोहे की एक वस्तु दान करें — इससे वर्ष भर के लिए मंगल शांत रहता है",
  Mercury: "वर्ष में एक बार किसी बच्चे की किताबों का ख़र्च उठाएँ; हरे कपड़े का उपहार कभी न लें",
  Jupiter: "वर्ष में एक बार गर्मियों भर पीपल को जल दें और गुरु का ऋण चुकाएँ",
  Venus: "वर्ष में एक महीने गाय को चारा खिलाएँ; शुक्रवार को घर सुगंधित रखें",
  Saturn: "सर्दियों में कंबल दान करें — लाल किताब दी हुई गर्मी को चुकाया हुआ शनि मानती है",
  Rahu: "वर्ष में एक बार कोयला या जौ नदी में बहाएँ और असहायों को दान दें",
  Ketu: "वर्ष में एक बार दो रंग का कंबल दान करें और पखवाड़े भर गली के कुत्तों को खिलाएँ",
};

// Third, standing instruction per graha — used as maintenance where no upay is due.
const MAINT_EN = {
  Sun: "Keep good relations with your father; serve elders.",
  Moon: "Serve and respect your mother; donate rice or white items.",
  Mars: "Keep harmony with brothers; keep a sweet tongue.",
  Mercury: "Respect sisters, daughters and aunts; give to the needy.",
  Jupiter: "Never disrespect the guru or knowledge; serve teachers and priests.",
  Venus: "Keep cleanliness and fragrance in the home; respect the spouse and women.",
  Saturn: "Keep conduct honest and disciplined; avoid alcohol and intoxicants.",
  Rahu: "Avoid deceit and shortcuts; respect in-laws and elders.",
  Ketu: "Respect sons and the spiritual path; keep ears and feet clean.",
};
const MAINT_HI = {
  Sun: "पिता से संबंध अच्छे रखें; बड़ों की सेवा करें।",
  Moon: "माता का सम्मान और सेवा करें; चावल या सफ़ेद वस्तु दान करें।",
  Mars: "भाइयों से मेल रखें; वाणी मीठी रखें।",
  Mercury: "बहन, बेटी और बुआ का सम्मान करें; ज़रूरतमंदों को दें।",
  Jupiter: "गुरु और ज्ञान का कभी अपमान न करें; शिक्षकों की सेवा करें।",
  Venus: "घर की स्वच्छता और सुगंध बनाए रखें; जीवनसाथी और स्त्रियों का सम्मान करें।",
  Saturn: "आचरण ईमानदार और अनुशासित रखें; नशे से दूर रहें।",
  Rahu: "छल और शॉर्टकट से बचें; ससुराल पक्ष और बड़ों का सम्मान करें।",
  Ketu: "पुत्र और आध्यात्मिक मार्ग का सम्मान करें; कान और पैर साफ़ रखें।",
};

const GEM_EN = {
  Sun: "Ruby", Moon: "Pearl", Mars: "Red coral", Mercury: "Emerald", Jupiter: "Yellow sapphire",
  Venus: "Diamond / white sapphire", Saturn: "Blue sapphire", Rahu: "Hessonite (gomed)", Ketu: "Cat's eye",
};
const GEM_HI = {
  Sun: "माणिक", Moon: "मोती", Mars: "मूंगा", Mercury: "पन्ना", Jupiter: "पुखराज",
  Venus: "हीरा / सफ़ेद पुखराज", Saturn: "नीलम", Rahu: "गोमेद", Ketu: "लहसुनिया",
};

// Birthday give-away item, keyed by the planet being settled.
const BIRTHDAY_ITEM_EN = {
  Sun: "wheat or jaggery", Moon: "rice or milk", Mars: "iron", Mercury: "green moong",
  Jupiter: "something yellow", Venus: "something white", Saturn: "mustard oil or a blanket",
  Rahu: "barley", Ketu: "a two-coloured blanket",
};
const BIRTHDAY_ITEM_HI = {
  Sun: "गेहूँ या गुड़", Moon: "चावल या दूध", Mars: "लोहा", Mercury: "हरी मूंग",
  Jupiter: "कोई पीली वस्तु", Venus: "कोई सफ़ेद वस्तु", Saturn: "सरसों का तेल या कंबल",
  Rahu: "जौ", Ketu: "दो रंग का कंबल",
};

export const VOCAB = {
  en: {
    planet: PLANET_EN, abbr: ABBR_EN, sign: SIGN_EN, nak: null, yoga: null, karana: null,
    weekday: null, paksha: null, gan: null, nadi: null, month: MONTH_EN,
    state: STATE_EN, statePhrase: STATE_PHRASE_EN,
    gift: GIFT_EN, cost: COST_EN, arena: ARENA_EN, domain: DOMAIN_EN, karaka: KARAKA_EN,
    dailyAct: DAILY_ACT_EN, annualAct: ANNUAL_ACT_EN, maint: MAINT_EN, gem: GEM_EN,
    birthdayItem: BIRTHDAY_ITEM_EN, ord: enOrd, ordNom: enOrd,
  },
  hi: {
    planet: PLANET_HI, abbr: ABBR_HI, sign: SIGN_HI, nak: NAK_HI, yoga: YOGA_HI, karana: KARANA_HI,
    weekday: WEEKDAY_HI, paksha: PAKSHA_HI, gan: GAN_HI, nadi: NADI_HI, month: MONTH_HI,
    state: STATE_HI, statePhrase: STATE_PHRASE_HI,
    gift: GIFT_HI, cost: COST_HI, arena: ARENA_HI, domain: DOMAIN_HI, karaka: KARAKA_HI,
    dailyAct: DAILY_ACT_HI, annualAct: ANNUAL_ACT_HI, maint: MAINT_HI, gem: GEM_HI,
    birthdayItem: BIRTHDAY_ITEM_HI, ord: (n) => HI_ORD[n - 1] || `${n}वें`, ordNom: (n) => HI_ORD_NOM[n - 1] || `${n}वाँ`,
  },
};

// ── chapter titles (order = the published 30-page contents) ──────────────────

export const TITLES = {
  en: {
    about: "About This Report",
    birth: "Birth Details & Teva",
    placements: "Planet Placements",
    ascendant: "Ascendant & House Ruler",
    key: "Key Judgments",
    dormant: "Blind & Sleeping Planets",
    benefic: "Benefic Planets in This Chart",
    malefic: "Malefic & Watchful Planets",
    planet: (p) => `${PLANET_EN[p]} — Full Reading`,
    rin: {
      pitru: "Pitru Rin — Ancestral Debt",
      matru: "Matru Rin — Mother's Debt",
      stree: "Stree Rin — Debt of the Woman",
      guru: "Guru Rin — Debt of the Teacher",
      atma: "Atma Rin — Debt of the Self",
      bhratru: "Bhratru Rin — Debt of the Brother",
    },
    rinSummary: "Rin Summary & Settlement Order",
    daily: "Daily Upay (43-day cycle)",
    weekly: "Weekly Upay by Planet",
    annual: "Annual Upay",
    dosDonts: "Do's & Don'ts for This Chart",
    gems: "Gemstones — and Why Lal Kitab Warns Against Most",
    varshphal: "Varshphal — The Year Ahead",
    howTo: "How to Use This Report",
  },
  hi: {
    about: "इस रिपोर्ट के बारे में",
    birth: "जन्म विवरण और टेवा",
    placements: "ग्रह स्थिति",
    ascendant: "लग्न और लग्नेश",
    key: "मुख्य निर्णय",
    dormant: "अंधे और सोए हुए ग्रह",
    benefic: "इस कुंडली के शुभ ग्रह",
    malefic: "अशुभ और सावधानी वाले ग्रह",
    planet: (p) => `${PLANET_HI[p]} — विस्तृत फल`,
    rin: {
      pitru: "पितृ ऋण — पूर्वजों का ऋण",
      matru: "मातृ ऋण — माता का ऋण",
      stree: "स्त्री ऋण — स्त्री का ऋण",
      guru: "गुरु ऋण — गुरु का ऋण",
      atma: "आत्म ऋण — स्वयं का ऋण",
      bhratru: "भ्रातृ ऋण — भाई का ऋण",
    },
    rinSummary: "ऋण सारांश और चुकाने का क्रम",
    daily: "दैनिक उपाय (43 दिन का चक्र)",
    weekly: "ग्रह अनुसार साप्ताहिक उपाय",
    annual: "वार्षिक उपाय",
    dosDonts: "इस कुंडली के लिए — क्या करें, क्या न करें",
    gems: "रत्न — और लाल किताब अधिकतर रत्नों से क्यों मना करती है",
    varshphal: "वर्षफल — आने वाला वर्ष",
    howTo: "इस रिपोर्ट का उपयोग कैसे करें",
  },
};

// ── chart-triggered do's and don'ts (text only; the placement rules live in
//    the report builder, so both languages fire on exactly the same charts) ──

export const RULE_TEXT = {
  en: {
    dont: {
      rahuFifth: "No speculation, betting or lottery — Rahu sits in the {h}.",
      rahuSelf: "Do not take money or ornaments as a gift from in-laws — Rahu is in the {h}.",
      rahuHidden: "Do not deal in second-hand property or take shortcuts with papers — Rahu is in the {h}.",
      ketuLeave: "Do not walk out of a commitment mid-way — Ketu in the {h} makes leaving feel like clarity.",
      saturnHard: "Avoid alcohol, and never take work you intend to do resentfully — Saturn is in the {h}.",
      saturnLend: "Do not lend what you cannot write off; Saturn in the {h} returns money slowly.",
      marsAnger: "Do not sign, borrow or argue on a Tuesday — Mars in the {h} regrets fast decisions.",
      sunAuthority: "Avoid open conflict with your father, your boss or a government office — Sun is in the {h}.",
      moonWater: "Do not keep stale water at home and do not sleep in a dark, damp room — Moon is in the {h}.",
      venusIndulge: "Avoid moral shortcuts in relationships and impulse luxury spending — Venus is in the {h}.",
      mercuryPapers: "Do not sign contracts unread and do not gossip about business — Mercury is in the {h}.",
      jupiterLend: "Do not lend to relatives — Jupiter in the {h} turns the gift into a grievance.",
      fallback: "Do not accept gifts of {p}'s own items; in Lal Kitab a gift transfers the planet's condition, not just the object.",
    },
    do: {
      marsExercise: "Take physical exercise daily — Mars in the {h} turns unspent energy into temper.",
      jupiterAccounts: "Keep your own accounts and give a fixed share away — Jupiter in the {h} grows what is shared.",
      moonHome: "Keep the house clean and the mother content — Moon in the {h} makes her health a barometer for the chart.",
      sunElders: "Honour elders before asking anything of them — the Sun in the {h} pays that back in standing.",
      mercuryWriting: "Put agreements in writing the same day — Mercury in the {h} rewards clean paperwork.",
      venusHome: "Keep the home fragrant and the spouse respected — Venus in the {h} pays through the household.",
      saturnLabour: "Serve people who work with their hands — Saturn in the {h} settles through labour honoured.",
      ketuDog: "Keep a dog, or feed one daily — Ketu in the {h} settles with animals.",
      rahuSilver: "Keep a solid silver item on you — Rahu in the {h} is willing but needs an anchor.",
      fallback: "Keep {p}'s significations clean — {role} — because {p} rules this chart from the {h}.",
    },
  },
  hi: {
    dont: {
      rahuFifth: "सट्टा, जुआ या लॉटरी बिल्कुल नहीं — राहु {h} भाव में है।",
      rahuSelf: "ससुराल पक्ष से धन या आभूषण उपहार में न लें — राहु {h} भाव में है।",
      rahuHidden: "पुरानी संपत्ति का सौदा न करें और काग़ज़ों में शॉर्टकट न लें — राहु {h} भाव में है।",
      ketuLeave: "किसी वचन को बीच में छोड़कर न जाएँ — {h} भाव का केतु छोड़ने को समझदारी जैसा दिखाता है।",
      saturnHard: "नशे से बचें, और ऐसा काम कभी न लें जिसे मन मारकर करना पड़े — शनि {h} भाव में है।",
      saturnLend: "उतना ही उधार दें जितना भूल सकें; {h} भाव का शनि पैसा धीरे लौटाता है।",
      marsAnger: "मंगलवार को हस्ताक्षर, उधार या बहस न करें — {h} भाव का मंगल जल्दबाज़ी पर पछताता है।",
      sunAuthority: "पिता, अधिकारी या सरकारी दफ़्तर से खुला टकराव न लें — सूर्य {h} भाव में है।",
      moonWater: "घर में बासी पानी न रखें और अंधेरे, सीलन वाले कमरे में न सोएँ — चंद्र {h} भाव में है।",
      venusIndulge: "रिश्तों में नैतिक शॉर्टकट और बिना सोचे विलासिता के ख़र्च से बचें — शुक्र {h} भाव में है।",
      mercuryPapers: "बिना पढ़े अनुबंध पर हस्ताक्षर न करें और व्यापार की बातें इधर-उधर न करें — बुध {h} भाव में है।",
      jupiterLend: "रिश्तेदारों को उधार न दें — {h} भाव का गुरु उस दान को शिकायत बना देता है।",
      fallback: "{p} की अपनी वस्तुएँ उपहार में न लें; लाल किताब में उपहार वस्तु नहीं, ग्रह की दशा साथ लाता है।",
    },
    do: {
      marsExercise: "रोज़ शारीरिक व्यायाम करें — {h} भाव का मंगल बची हुई ऊर्जा को क्रोध बना देता है।",
      jupiterAccounts: "अपना हिसाब स्वयं रखें और एक निश्चित हिस्सा दान करें — {h} भाव का गुरु बाँटी हुई चीज़ बढ़ाता है।",
      moonHome: "घर साफ़ और माता को प्रसन्न रखें — {h} भाव का चंद्र उनके स्वास्थ्य को कुंडली का पैमाना बना देता है।",
      sunElders: "बड़ों से कुछ माँगने से पहले उनका सम्मान करें — {h} भाव का सूर्य इसे प्रतिष्ठा में लौटाता है।",
      mercuryWriting: "समझौते उसी दिन लिखित करें — {h} भाव का बुध साफ़ काग़ज़ात का फल देता है।",
      venusHome: "घर सुगंधित और जीवनसाथी सम्मानित रखें — {h} भाव का शुक्र गृहस्थी के रास्ते फल देता है।",
      saturnLabour: "हाथ से काम करने वालों की सेवा करें — {h} भाव का शनि श्रम के सम्मान से शांत होता है।",
      ketuDog: "कुत्ता पालें, या रोज़ किसी कुत्ते को खिलाएँ — {h} भाव का केतु पशुओं से शांत होता है।",
      rahuSilver: "ठोस चाँदी की वस्तु पास रखें — {h} भाव का राहु साथ देना चाहता है पर उसे लंगर चाहिए।",
      fallback: "{p} के कारकत्व साफ़ रखें — {role} — क्योंकि {p} इस कुंडली को {h} भाव से चला रहा है।",
    },
  },
};

// ── the six rin (text only — the placement rules live in the report builder) ──
// `why` is indexed by clause position, so both languages describe the same test.

export const RIN_TEXT = {
  en: {
    pitru: {
      rule: "Venus, Mercury or Rahu in the 2nd, 5th, 9th or 12th house — the houses of family, progeny, father and loss.",
      why: ["sits in the house of the fathers", "the karaka of the father's line is in a house of loss"],
      theme: "unfinished business inherited with the family line",
      shows: [
        "Effort that produces less than it should, especially in property and paperwork.",
        "A recurring obstacle around the father or a father-figure at work.",
        "Delays that lift the moment an elder is served without being asked.",
      ],
      settlement: [
        "Serve the eldest living male relative, unasked, on a Thursday, for 43 weeks. Where none survives, feed an elderly stranger the meal you eat.",
        "During Pitru Paksha, put out food in the father's name for the full fortnight.",
        "Never take wheat, jaggery or gold as a gift while this is being settled.",
      ],
      clear: "The father's line is not making a claim on this chart. Fortune and property move at their own pace here, not against a headwind.",
      upkeep: "Keep the yearly Pitru Paksha offering anyway — Lal Kitab treats it as the cheapest insurance in the book.",
    },
    matru: {
      rule: "Ketu in the 4th house; or the Moon in the 6th, 8th or 12th; or the Moon sitting with Ketu.",
      why: ["occupies the mother's own house", "the karaka of the mother is in a house of loss", "the Moon is joined by Ketu"],
      theme: "duties toward the mother and toward the house you live in",
      shows: [
        "Peace of mind that does not last in the house, however good the house is.",
        "Property or land matters that stall for reasons nobody can name.",
        "The mother's health tracking the chart's fortunes closely.",
      ],
      settlement: [
        "Serve your mother before she asks, on Mondays, for 43 weeks. Where she is not living, feed an elderly woman the same meal.",
        "Keep a silver item or a filled pot of water in the north-east of the house; never sell inherited silver.",
        "Give rice or milk away on Mondays — never accept them as a gift.",
      ],
      clear: "The relationship with the mother is a source of strength in this chart rather than a karmic obligation. No remedy is required.",
      upkeep: "Keep water in a clean vessel at home and the mother's word respected — that is enough to hold this.",
    },
    stree: {
      rule: "Sun, Moon or Rahu in the 2nd or 7th house; or Venus in the 6th, 8th or 12th.",
      why: ["sits in the house of family and marriage", "the karaka of the wife is in a house of loss"],
      theme: "conduct in marriage and what is owed to the women of the family line",
      shows: [
        "Marriage or partnership that carries an unexplained weight from the start.",
        "Money that leaves through the household rather than through the work.",
        "Old family grievances involving a woman resurfacing at the wrong moment.",
      ],
      settlement: [
        "Give something to a woman of the family — sister, daughter, aunt — unasked, on a Friday, for 43 weeks.",
        "Never speak harshly to the spouse in front of others; Lal Kitab reads that as the debt renewing itself.",
        "Give away white items on Fridays and keep the bedroom clean and uncluttered.",
      ],
      clear: "No debt is carried toward the women of the family line. Marriage in this chart is not obstructed by ancestral obligation — whatever it costs, it costs in the present tense.",
      upkeep: "Keep the household's women respected and the Friday giving small but regular; that is all this needs.",
    },
    guru: {
      rule: "Rahu or Ketu in the 5th or 9th house; or Jupiter in the 3rd, 6th, 8th or 12th.",
      why: ["sits in the house of learning and belief", "the guru's own karaka is in a house of loss"],
      theme: "instruction taken and not repaid",
      shows: [
        "A tendency to shortcut instruction — to believe one has understood before one has.",
        "Courses, trainings and books started in threes and finished in none.",
        "Advice that turns out to be right, arriving from someone who was not thanked.",
      ],
      settlement: [
        "Give something to a teacher or a student, unasked, once a year, and never argue with a teacher in public.",
        "Finish one course of study completely rather than three partially — Lal Kitab treats completion itself as the remedy.",
        "Water a peepal tree on Thursdays and keep saffron in the house.",
      ],
      clear: "Knowledge in this chart is not borrowed against. What is learned here is kept, and teachers tend to give this native more than they are asked for.",
      upkeep: "Keep one book finished before the next is opened, and thank the person who taught you the trade.",
    },
    atma: {
      rule: "Saturn or Rahu in the 1st house; or Mercury in the 8th or 12th; or the ascendant lord dormant.",
      why: ["sits on the ascendant itself", "the karaka of one's own judgement is hidden away", "the ascendant lord is dormant"],
      theme: "promises made to oneself and quietly broken",
      shows: [
        "Work delivered for everyone except yourself.",
        "Health treated as negotiable until it stops being negotiable.",
        "A standing suspicion that you are further behind than you actually are.",
      ],
      settlement: [
        "Fix one thing you owe yourself — sleep, a debt, a medical check — and hold it for 43 days without telling anyone.",
        "Keep your own word to yourself as strictly as you keep it to a client.",
        "Give away one item you have kept but never used, each month, until this lifts.",
      ],
      clear: "Self-worth is not karmically obstructed here. Where this native doubts himself the cause is circumstantial rather than ancestral, and it passes when the circumstance does.",
      upkeep: "Keep one small promise to yourself every week; that is the whole of the maintenance.",
    },
    bhratru: {
      rule: "Mars in the 4th, 8th or 12th house; or Rahu in the 3rd; or Mars joined by Rahu or Ketu.",
      why: ["the karaka of brothers is in a house of loss", "occupies the house of siblings and courage", "Mars is joined by Rahu", "Mars is joined by Ketu"],
      theme: "what is owed to brothers, cousins and the people who backed you early",
      shows: [
        "Support given to siblings that is never quite acknowledged.",
        "Property or family business disputes that flare up and go quiet without resolving.",
        "Courage that arrives late in a confrontation and too hot when it does.",
      ],
      settlement: [
        "Do one thing for a brother or a cousin, unasked, on a Tuesday, for 43 weeks.",
        "Keep something sweet in the house and give sweets to children — Lal Kitab reads a bitter house as a bitter Mars.",
        "Give away an iron item on your birthday; never take iron or a weapon as a gift.",
      ],
      clear: "Nothing is owed to the sibling line here. Brothers and early backers in this chart are an asset rather than an outstanding account.",
      upkeep: "Call the sibling who backed you first, and keep sweets in the house — that keeps Mars quiet.",
    },
  },
  hi: {
    pitru: {
      rule: "शुक्र, बुध या राहु का दूसरे, पाँचवें, नवें या बारहवें भाव में होना — ये कुटुंब, संतान, पिता और हानि के भाव हैं।",
      why: ["पितरों के भाव में बैठा है", "पिता-वंश का कारक हानि के भाव में है"],
      theme: "कुल-परंपरा के साथ मिला हुआ अधूरा लेन-देन",
      shows: [
        "मेहनत के अनुपात में कम फल, विशेषकर संपत्ति और काग़ज़ी कामों में।",
        "पिता या कार्यक्षेत्र में पिता-तुल्य व्यक्ति से बार-बार आने वाली अड़चन।",
        "ऐसी देरी जो किसी बड़े की बिना कहे सेवा करते ही हट जाती है।",
      ],
      settlement: [
        "43 सप्ताह तक हर गुरुवार, बिना कहे, परिवार के सबसे बड़े पुरुष की सेवा करें। कोई न हो तो किसी वृद्ध को वही भोजन कराएँ जो आप खाते हैं।",
        "पितृ पक्ष में पूरे पखवाड़े पिता के नाम भोजन निकालें।",
        "जब तक यह ऋण चुक न जाए, गेहूँ, गुड़ या सोना उपहार में कभी न लें।",
      ],
      clear: "पिता-वंश का इस कुंडली पर कोई दावा नहीं है। यहाँ भाग्य और संपत्ति अपनी गति से चलते हैं, किसी विपरीत हवा के विरुद्ध नहीं।",
      upkeep: "फिर भी पितृ पक्ष का वार्षिक अर्पण करते रहें — लाल किताब इसे सबसे सस्ता बीमा मानती है।",
    },
    matru: {
      rule: "केतु का चौथे भाव में होना; या चंद्र का छठे, आठवें या बारहवें भाव में होना; या चंद्र का केतु के साथ बैठना।",
      why: ["माता के अपने भाव में बैठा है", "माता का कारक हानि के भाव में है", "चंद्र के साथ केतु बैठा है"],
      theme: "माता के प्रति और जिस घर में आप रहते हैं उसके प्रति कर्तव्य",
      shows: [
        "घर कितना भी अच्छा हो, मन की शांति टिकती नहीं।",
        "ज़मीन-जायदाद के मामले बिना किसी स्पष्ट कारण के अटक जाते हैं।",
        "माता का स्वास्थ्य कुंडली के भाग्य के साथ-साथ चलता है।",
      ],
      settlement: [
        "43 सप्ताह तक हर सोमवार, माता के माँगने से पहले उनकी सेवा करें। वे न हों तो किसी वृद्ध स्त्री को वही भोजन कराएँ।",
        "घर के ईशान कोण में चाँदी की वस्तु या भरा हुआ जल-पात्र रखें; विरासत की चाँदी कभी न बेचें।",
        "सोमवार को चावल या दूध दान करें — इन्हें उपहार में कभी न लें।",
      ],
      clear: "इस कुंडली में माता से संबंध कर्ज़ नहीं, शक्ति का स्रोत है। किसी उपाय की आवश्यकता नहीं।",
      upkeep: "घर में साफ़ बर्तन में जल रखें और माता की बात का मान रखें — इतना ही पर्याप्त है।",
    },
    stree: {
      rule: "सूर्य, चंद्र या राहु का दूसरे या सातवें भाव में होना; या शुक्र का छठे, आठवें या बारहवें भाव में होना।",
      why: ["कुटुंब और विवाह के भाव में बैठा है", "पत्नी का कारक हानि के भाव में है"],
      theme: "विवाह में आचरण, और कुल की स्त्रियों के प्रति दायित्व",
      shows: [
        "विवाह या साझेदारी जो शुरू से ही एक अनकहा बोझ लिए चलती है।",
        "धन काम के रास्ते नहीं, गृहस्थी के रास्ते बाहर जाता है।",
        "किसी स्त्री से जुड़ी पुरानी पारिवारिक शिकायत का ग़लत समय पर उभर आना।",
      ],
      settlement: [
        "43 सप्ताह तक हर शुक्रवार, परिवार की किसी स्त्री — बहन, बेटी, बुआ — को बिना माँगे कुछ दें।",
        "जीवनसाथी से दूसरों के सामने कठोर वचन कभी न बोलें; लाल किताब इसे ऋण के नवीनीकरण के रूप में पढ़ती है।",
        "शुक्रवार को सफ़ेद वस्तुएँ दान करें और शयनकक्ष साफ़-सुथरा रखें।",
      ],
      clear: "कुल की स्त्रियों के प्रति कोई ऋण नहीं है। इस कुंडली में विवाह पर पूर्वजों के दायित्व की रुकावट नहीं — जो भी क़ीमत है, वह वर्तमान की है।",
      upkeep: "घर की स्त्रियों का सम्मान बनाए रखें और शुक्रवार का दान छोटा पर नियमित रखें; इतना ही चाहिए।",
    },
    guru: {
      rule: "राहु या केतु का पाँचवें या नवें भाव में होना; या गुरु का तीसरे, छठे, आठवें या बारहवें भाव में होना।",
      why: ["विद्या और आस्था के भाव में बैठा है", "गुरु का अपना कारक हानि के भाव में है"],
      theme: "ली गई शिक्षा जिसका मूल्य नहीं चुकाया गया",
      shows: [
        "शिक्षा में शॉर्टकट की प्रवृत्ति — समझने से पहले ही समझ लेने का भरोसा।",
        "पाठ्यक्रम, प्रशिक्षण और किताबें तीन-तीन शुरू, एक भी पूरी नहीं।",
        "सही सिद्ध होने वाली सलाह, जो ऐसे व्यक्ति से आई जिसका धन्यवाद नहीं हुआ।",
      ],
      settlement: [
        "वर्ष में एक बार किसी शिक्षक या विद्यार्थी को बिना माँगे कुछ दें, और शिक्षक से सार्वजनिक रूप से बहस कभी न करें।",
        "तीन अधूरे पाठ्यक्रमों की जगह एक पूरा करें — लाल किताब पूर्णता को ही उपाय मानती है।",
        "गुरुवार को पीपल को जल दें और घर में केसर रखें।",
      ],
      clear: "इस कुंडली में ज्ञान उधार का नहीं है। यहाँ जो सीखा जाता है वह टिकता है, और शिक्षक इस जातक को माँगे से अधिक देते हैं।",
      upkeep: "अगली किताब खोलने से पहले पिछली पूरी करें, और जिसने काम सिखाया उसका आभार मानें।",
    },
    atma: {
      rule: "शनि या राहु का लग्न में होना; या बुध का आठवें या बारहवें भाव में होना; या लग्नेश का निष्क्रिय होना।",
      why: ["स्वयं लग्न पर बैठा है", "अपने निर्णय का कारक छिपा हुआ है", "लग्नेश निष्क्रिय है"],
      theme: "स्वयं से किए गए वे वादे जो चुपचाप तोड़ दिए गए",
      shows: [
        "काम सबके लिए पूरा होता है, अपने लिए नहीं।",
        "स्वास्थ्य को तब तक टाला जाता है जब तक वह टलना बंद न कर दे।",
        "यह स्थायी संदेह कि आप वास्तव में जितने हैं उससे पीछे हैं।",
      ],
      settlement: [
        "अपने प्रति एक बकाया — नींद, कोई कर्ज़, कोई जाँच — तय करें और 43 दिन बिना किसी को बताए निभाएँ।",
        "अपना वचन स्वयं के लिए उतनी ही सख़्ती से निभाएँ जितना किसी ग्राहक के लिए निभाते हैं।",
        "हर महीने एक ऐसी वस्तु दान करें जो रखी तो है पर कभी काम नहीं आई — जब तक यह भार हटे।",
      ],
      clear: "यहाँ आत्म-सम्मान पर कोई कार्मिक रुकावट नहीं है। यह जातक जहाँ स्वयं पर संदेह करता है, उसका कारण परिस्थिति है, पूर्वजन्म नहीं — परिस्थिति बदलते ही वह हट जाता है।",
      upkeep: "हर सप्ताह स्वयं से किया एक छोटा वादा निभाएँ; बस इतना ही रखरखाव है।",
    },
    bhratru: {
      rule: "मंगल का चौथे, आठवें या बारहवें भाव में होना; या राहु का तीसरे भाव में होना; या मंगल के साथ राहु या केतु का बैठना।",
      why: ["भाइयों का कारक हानि के भाव में है", "भाई-बहन और पराक्रम के भाव में बैठा है", "मंगल के साथ राहु बैठा है", "मंगल के साथ केतु बैठा है"],
      theme: "भाइयों, भाई-बंधुओं और शुरुआत में साथ देने वालों के प्रति दायित्व",
      shows: [
        "भाई-बहनों को दी गई सहायता, जिसे कभी पूरी तरह स्वीकार नहीं किया जाता।",
        "संपत्ति या पारिवारिक व्यापार के विवाद, जो भड़कते हैं और बिना निपटे ठंडे पड़ जाते हैं।",
        "टकराव में साहस देर से आता है, और आता है तो कुछ ज़्यादा गरम।",
      ],
      settlement: [
        "43 सप्ताह तक हर मंगलवार, भाई या भाई-बंधु के लिए बिना कहे एक काम करें।",
        "घर में कुछ मीठा रखें और बच्चों को मिठाई दें — लाल किताब कड़वे घर को कड़वा मंगल मानती है।",
        "जन्मदिन पर लोहे की वस्तु दान करें; लोहा या हथियार उपहार में कभी न लें।",
      ],
      clear: "यहाँ भाई-वंश का कोई ऋण नहीं है। इस कुंडली में भाई और शुरुआती सहयोगी बकाया नहीं, संपत्ति हैं।",
      upkeep: "जिस भाई ने पहले साथ दिया था उसे फ़ोन करें, और घर में मिठाई रखें — इससे मंगल शांत रहता है।",
    },
  },
};

// ── sentence templates ───────────────────────────────────────────────────────
// Every argument is a value already computed from the chart (and already
// localised by the report builder). No sentence is assembled anywhere else.

const T_EN = {
  listJoin: (a) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}` : a[0] || ""),
  house: (h, o) => `${o(h)} house`,
  cap: (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),

  aboutIntro: "Lal Kitab — the 'red book' — judges a chart by which HOUSE a planet sits in rather than which sign. That single shift is why its remedies are so specific and so cheap: a planet is either sitting comfortably, or it is uncomfortable and needs a small corrective act called an upay.",
  aboutCast: (a) =>
    `Cast for ${a.name}, this chart has a ${a.lagnaSign} ascendant ruled by ${a.lagnaLord}, which itself sits in the ${a.lagnaLordHouse}. ` +
    `${a.comfortableN} of the nine grahas are sitting comfortably (${a.comfortable || "none"}) and ${a.targetN} need an upay (${a.targets || "none"})` +
    `${a.dormantN ? ` — of those, ${a.dormantN} are dormant rather than hostile (${a.dormant}): they give neither result until they are woken` : ", and none is dormant"}. ` +
    `Of the six ancestral debts, ${a.debtN === 0 ? "none is carried" : `${a.debtN} ${a.debtN === 1 ? "is" : "are"} carried: ${a.debts}`}.`,
  aboutHowToLabel: "How to read the next 29 chapters:",
  aboutHowTo: [
    "Chapters 2–4 establish the teva — the Lal Kitab chart — and where each graha sits.",
    "Chapters 5–17 judge the planets one by one: comfortable, needing upay, or dormant.",
    "Chapters 18–23 test each of the six ancestral debts and report the verdict either way.",
    "Chapters 24–30 are the remedies, the year ahead, and the do's and don'ts.",
  ],
  aboutClose: "Nothing in this report was written in advance. Every judgment below is computed from your birth date, time and place.",

  birthCastLabel: "Chart cast for:",
  birthPanchangLabel: "Panchang at birth:",
  birthTevaLabel: "Teva basics:",
  birthRows: {
    name: (v) => `Name — ${v}`,
    dob: (v) => `Date of birth — ${v}`,
    tob: (v) => `Time of birth — ${v}`,
    place: (v) => `Place of birth — ${v}`,
    ayanamsa: (v) => `Ayanamsa — Lahiri (sidereal), ${v}`,
    houseSystem: (v) => `House system — Whole Sign, counted from the ${v} ascendant`,
    weekday: (v) => `Weekday — ${v}`,
    tithi: (v, p) => `Tithi — ${v} (${p})`,
    nakshatra: (v, p) => `Nakshatra — ${v}, pada ${p}`,
    yogaKarana: (y, k) => `Yoga — ${y} · Karana — ${k}`,
    sun: (r, s) => `Sunrise ${r} · Sunset ${s}`,
    lagna: (s, l) => `Lagna (ascendant) — ${s}, ruled by ${l}`,
    rashi: (s, l) => `Rashi (Moon sign) — ${s}, ruled by ${l}`,
    nakLord: (n, g, d) => `Nakshatra lord — ${n} · Gan — ${g} · Nadi — ${d}`,
    dasha: (m, a) => `Running dasha — ${m} mahadasha, ${a} antardasha`,
  },
  birthNote: "Lal Kitab is unusually forgiving of an approximate birth time — a whole-sign house placement rarely shifts within an hour. Where the time is uncertain, the judgments below still hold.",

  placeLabel: "Where each graha sits:",
  placeRow: (p, h, st, extras) => `${p} — ${h} · ${st}${extras.length ? ` · ${extras.join(", ")}` : ""}`,
  extraAscRuler: "ascendant ruler",
  extraPakka: "in its pakka ghar",
  extraRetro: "retrograde",
  occupiedLine: (s) => `Occupied houses: ${s}.`,
  occupiedItem: (h, abbrs) => `${h} (${abbrs})`,
  emptyLine: (s) => `Empty houses: ${s}. In Lal Kitab an empty house is not a dead house; it takes its result from the planet that sees it and from the house's own lord.`,
  emptyNone: "Every house in this chart is tenanted — there is no empty house to read by drishti alone.",
  placeClose: "Read this table with the chapters that follow — the house number is the whole judgment in Lal Kitab; the sign only colours it.",

  ascPara: (sign, lord, house, arena, ok, stateWord) =>
    `${sign} rises in this chart, so ${lord} rules the whole teva. ${lord} itself sits in the ${house} — ${arena} — which is where this native's life is actually run from. ` +
    (ok
      ? `Whatever ${lord} is doing, the chart does: here it is ${stateWord}, so the chart carries itself without needing to be rescued.`
      : `Whatever ${lord} is doing, the chart does: here it is ${stateWord}, so the whole chart moves in fits until it is corrected.`),
  ascTenanted: (list, gifts) => `The 1st house is tenanted by ${list}. In Lal Kitab a planet on the ascendant is worn on the face — ${gifts}.`,
  ascTenantGift: (p, g) => `${p} shows as ${g}`,
  ascEmpty: (lord, house, seen) =>
    `No planet sits in the 1st house. The body and temperament are therefore read from ${lord} in the ${house}, and from ${seen || "the ascendant sign alone"}.`,
  ascEmptySeen: (list, many) => `${list}, which ${many ? "see" : "sees"} the ascendant from across the chart`,
  ascDrishti: (list) => `Lal Kitab drishti on the 1st house comes from ${list} — that is who else has a say in how this person comes across.`,
  ascDrishtiItem: (p, h) => `${p} (${h})`,
  ascAsksLabel: "What this asks:",
  ascAsk1: (lord) => `Treat ${lord} as the chart's switch — its upay comes before any other planet's.`,
  ascAsk2Tenant: (p, act, day) => `${p} on the ascendant needs an outlet: ${act} on ${day}.`,
  ascAsk2Empty: (house) => `With an empty 1st house, guard the ${house} instead — that is where this chart is exposed.`,
  ascAsk3: (sign, gift, cost) => `Keep the ${sign} lagna's own quality honest: ${gift} is what it offers, ${cost} is what it charges when ignored.`,

  keyIntro: "The three judgments that decide this chart:",
  keyRole: { rules: "rules the chart", strain: "carries the most strain", support: "is the chart's strongest support", second: "needs the second correction" },
  keyItem: (i, p, h, role, karaka, arena, tail) => `${i}. ${p} in the ${h} — ${role}. ${p} governs ${karaka}; the ${h} is ${arena}. ${tail}`,
  keyTailGood: (st, gift) => `It is ${st} here, so ${gift} is available without being fought for.`,
  keyTailDormant: (kind) => `It is ${kind} here — it gives neither result until it is woken.`,
  keyTailBad: (cost, gift) => `It is uncomfortable here, so ${cost} shows up before ${gift} does.`,
  keyClose: "Everything in chapters 9 to 17 is a longer version of these three. If you read nothing else, read them.",

  dormIntro: "Lal Kitab separates a planet that harms you from one that has simply gone dormant. A dormant planet gives neither result — its house stays quiet and its gifts never arrive. It is not punishing; it is waiting to be woken.",
  dormSleeping: (p, h, pakka, arena) => `${p} in the ${h} is asleep: it sits alone, no planet's drishti falls on that house, and its permanent seat (the ${pakka}) is empty. ${arena} — that whole area stays quiet.`,
  dormBlind: (p, h, pakka) => `${p} in the ${h} is blind: the ${h} is a house it can neither use nor be hurt by, and its permanent seat is the ${pakka}. It looks busy and delivers nothing.`,
  dormNone: (states) => `No graha is dormant in this chart. Every planet is either being used or being felt: ${states}. That is rarer than it sounds and it means no upay here is spent on merely waking something up.`,
  dormStateItem: (p, st) => `${p} ${st}`,
  dormWokenLabel: "How a dormant planet is woken:",
  dormWoken: [
    "A fixed act, repeated — Lal Kitab values consistency over scale.",
    "Something given away rather than acquired.",
    "Kept up for 43 days without a break; a missed day restarts the count.",
  ],
  dormStart: (p, act, day) => `Start with ${p}: ${act} on ${day}.`,
  dormNoStart: "With nothing dormant, the upay in chapter 24 goes to the planets under strain instead.",

  benLabel: "Working in your favour:",
  benRow: (p, h, arena, gift) => `${p} (${h}) — ${arena}; brings ${gift}.`,
  benNone: "No graha in this chart is sitting in unqualified comfort. That is not a verdict of doom — it means this chart is built by remedy rather than by inheritance, and the upay in chapter 24 do the work that a benefic would otherwise do for free.",
  benBase: (n, areas, targetsN) => `${n} graha${n > 1 ? "s" : ""} covering ${areas} is the base this chart stands on. It does not need rescuing — it needs ${targetsN} specific leak${targetsN === 1 ? "" : "s"} closed.`,
  benProtect: "Protect them: do not take gifts of a strong planet's own items (Lal Kitab is strict about this), and do not add a gemstone to a planet that is already comfortable — chapter 28 explains why.",
  benCheapest: (p, h) => `Watch which planet is closest to comfortable — ${p} in the ${h} — because it is the cheapest one to bring over.`,

  malLabel: "Where the pressure sits:",
  malRow: (p, h, reason, cost, arena) => `${p} (${h}) — ${reason}. Expect ${cost} around ${arena}.`,
  malReasonDormant: (kind) => `${kind} — dormant rather than hostile`,
  malReasonHard: (p) => `a hard house for ${p}`,
  malReasonDebilitated: (sign) => `debilitated in ${sign}`,
  malReasonStrain: "under strain",
  malNone: "No graha in this chart is hostile or dormant. There is nothing here to defend against — the do's in chapter 27 are about keeping it that way, not about repair.",
  malOrderDebt: (debt, chapter, planets) => `Order of treatment: Lal Kitab treats the debt before the planet. Settle ${debt} first (chapter ${chapter}), then attend ${planets}. Doing these out of order wastes the effort.`,
  malOrderNoDebt: (planets) => `Order of treatment: no rin is blocking the way here, so go straight down this list: ${planets}. Doing these out of order wastes the effort.`,
  malDrishti: (items) => `Watch which house each of these sees, not just where it sits: ${items}.`,
  malDrishtiItem: (p, houses) => `${p} throws drishti on the ${houses}`,

  pHeader: (p, hindiName, h, sign, deg, nak, pada, motion) => `${p} (${hindiName}) in the ${h} · ${sign} ${deg} · ${nak} pada ${pada} · ${motion}`,
  pRetro: "retrograde",
  pDirect: "direct",
  pIntro: (p, karaka, h, arena, domain, gift, cost) =>
    `${p} carries ${karaka}. The ${h} is ${arena} — formally, ${domain}. Put together: ${gift} lands on ${arena}, and when it goes wrong it goes wrong as ${cost}.`,
  pStateSleeping: (p, h, pakka) => `${p} is asleep here — alone in the house, unseen by any drishti, with its pakka ghar (the ${pakka}) empty. It gives neither result until the upay wakes it.`,
  pStateBlind: (p, h) => `${p} is blind here — the ${h} is a house it can neither use nor be damaged by, so it consumes attention and returns nothing.`,
  pStateGood: (p, gift) => `${p} is comfortable here. ${gift} is available on ordinary effort, and this is one of the placements the rest of the chart borrows from.`,
  pStateBad: (p, cost, gift, act, day) => `${p} needs an upay here. ${cost} arrives before ${gift} does, and the correction is cheap: ${act} on ${day}.`,
  pStateWorkable: (p) => `${p} is workable here — neither a gift nor a problem. It follows whatever the rest of the chart is doing.`,
  pNotesLabel: "Notes:",
  pDigExalted: (sign, p) => `Exalted in ${sign} — this is the strongest form of ${p} there is, and it needs no propping up.`,
  pDigDebilitated: (sign) => `Debilitated in ${sign} — the results still come, but late, and only after the correction is made.`,
  pDigOwn: (sign, p) => `In its own sign ${sign} — ${p} answers to nobody else here, which steadies everything it touches.`,
  pDigNeutral: (sign, disp, dispHouse, p) => `In ${sign}, ruled by ${disp}${dispHouse ? `, so ${p}'s results here are paid out through ${disp} in the ${dispHouse}` : ""}.`,
  pCompanyCo: (h, list, first, p) => `Shares the ${h} with ${list} — in Lal Kitab a shared house is a shared result; ${first}'s condition is read into ${p}'s.`,
  pCompanySeen: (list) => `Sits alone but is seen from the ${list} — that drishti is what keeps this house awake.`,
  pCompanySeenItem: (h, p) => `${h} by ${p}`,
  pCompanyAlone: (h) => `Sits alone in the ${h} with no drishti falling on it — nothing else in the chart is supporting or interfering with this placement.`,
  pDrishti: (h, houses, many, p) => `From the ${h} it throws Lal Kitab drishti on ${houses} — ${many ? "those houses carry" : "that house carries"} ${p}'s stamp too.`,
  pDrishtiItem: (h, short) => `the ${h} (${short})`,
  pPakkaIn: (p) => `This is ${p}'s pakka ghar, its permanent seat. Results here are durable and rarely need repeating.`,
  pPakkaOut: (p, pakka, held) => `${p}'s pakka ghar is the ${pakka}, currently ${held || "empty"} — that seat is worth keeping clean.`,
  pPakkaHeld: (list) => `held by ${list}`,
  pRetroNote: (p) => `Retrograde at birth: ${p}'s results turn inward and arrive later than expected, usually after a second attempt.`,
  pUpay: (act, day, maint) => `Upay: ${act} on ${day}, for 43 unbroken days. ${maint}`,
  pMaint: (maint, p) => `Maintenance: ${maint} Do not accept ${p}'s own items as a gift.`,
};

const T_EN2 = {
  rinDetected: "Detected in this chart.",
  rinNotPresent: "Checked — not present in this chart.",
  rinRuleLabel: (rule) => `The rule: ${rule}`,
  rinChartShows: (witnesses) => `What your chart actually shows: ${witnesses}. None of those placements meets the rule, so this debt is not carried.`,
  rinWitnessItem: (p, h) => `${p} in the ${h}`,
  rinTriggered: (hits, theme) => `What triggered it: ${hits}. In Lal Kitab this is not blame; it is ${theme}, inherited rather than earned.`,
  rinHitItem: (text, why) => `${text} — ${why}`,
  rinHitPlacement: (p, h) => `${p} is in the ${h}`,
  rinHitConjunction: (a, b, h) => `${a} and ${b} share the ${h}`,
  rinHitLagnaDormant: (p, h, kind) => `${p}, the ascendant lord, is ${kind} in the ${h}`,
  rinWeight: (p, h, arena) => `${p} in the ${h} puts the weight on ${arena}, so that is where the debt is felt first.`,
  rinShowsLabel: "How it shows up:",
  rinSettlementLabel: "Settlement:",
  rinAlongside: (p, act, day) => `Alongside it, run ${p}'s own upay: ${act} on ${day}.`,
  rinUpkeep: (u) => `Keeping it that way: ${u}`,

  rsGlanceLabel: "The six debts at a glance:",
  rsRowAbsent: (name) => `${name} — not present`,
  rsRowPresent: (name, hits, rank) => `${name} — present (${hits}) · settle ${rank}`,
  rsRank: ["first", "second", "third", "fourth", "fifth", "sixth"],
  rsOrderLine: (order, planet, debt) => `Settlement order: ${order}. Lal Kitab holds that an unsettled debt blocks the upay for any planet involved in it — ${planet}'s remedies will not take hold until ${debt} is actively being settled. Work top-down.`,
  rsOrderItem: (i, name) => `${i}) ${name}`,
  rsNoDebt: (names) => `No debt is carried in this chart. All six significators were tested against their own rule and none fired: ${names}. That means every upay in the next chapters lands directly on its planet with nothing blocking it — an advantage most charts do not have.`,
  rsNotCarried: (names) => `Debts not carried: ${names || "none"}. Do not spend remedies there; Lal Kitab counts unnecessary remedies as interference.`,

  dailyLabel: "The upay that matter for this chart:",
  dailyRow: (p, h, st, act, day) => `${p} (${h}, ${st}) — ${act} · start on a ${day}`,
  dailyNone: "No graha in this chart is under enough strain to require a 43-day cycle. Keep the weekly acts in the next chapter instead — in Lal Kitab a chart that needs nothing is maintained, not treated.",
  dailyPriority: (p, reason) => `Do them one at a time, in that order. ${p} is the priority because it is ${reason}.`,
  dailyReasonDormant: (kind) => `${kind} — dormant placements cost the most and are the cheapest to fix`,
  dailyReasonStrain: (h) => `carrying the most strain in the ${h}`,
  dailyRulesLabel: "Rules of the cycle:",
  dailyRules: [
    "43 continuous days. A missed day restarts the count.",
    "Perform it yourself — a remedy done by proxy does not register.",
    "Tell no one you are doing it.",
    "One planet at a time. Lal Kitab is explicit that a stacked practice cancels itself.",
  ],

  weekLabel: "The week, read from this chart:",
  weekBoth: (day, act, node, nodeHouse, nodeAct) => `${day} — ${act}; and for ${node} (${nodeHouse}), ${nodeAct}.`,
  weekLord: (day, act, lord, st, h) => `${day} — ${act} (${lord} is ${st} in the ${h}).`,
  weekNode: (day, lord, node, nodeHouse, nodeAct) => `${day} — ${lord} needs nothing; use the day for ${node} in the ${nodeHouse}: ${nodeAct}.`,
  weekNone: (day, lord, st, h) => `${day} — nothing required. ${lord} is ${st} in the ${h}; just don't accept ${lord}'s own items as a gift today.`,
  weekNodeNote: "Rahu is worked on a Wednesday and Ketu on a Tuesday, alongside the day's own lord — the nodes have no weekday of their own in Lal Kitab.",
  weekOneDay: (day, p) => `If you keep only one day, keep ${day} — that is ${p}'s day, and ${p} is this chart's first correction.`,
  weekMaint: "With no planet under strain, this week is maintenance: keep the day-acts light and consistent rather than adding new ones.",

  annualLabel: "Once a year, for this chart:",
  annualItem: (act, p, st, h) => `${act} — ${p} is ${st} in the ${h}.`,
  annualPitru: "During Pitru Paksha, offer food in the father's name for the full fortnight — this chart carries Pitru Rin and that fortnight is when it is cheapest to settle.",
  annualLagna: (act, lord) => `${act} — ${lord} rules this chart and an annual act keeps a comfortable ruler comfortable.`,
  annualBirthday: (p, item) => `On your birthday specifically: give away one item belonging to ${p} — ${item}. Lal Kitab reads the birthday as the one day the whole chart is re-cast.`,
  annualNotLabel: "What not to do:",
  annualNot: [
    "Do not add remedies beyond these. A stacked practice cancels itself.",
    "Do not do an annual act on someone else's behalf and count it as your own.",
    "Do not restart a 43-day cycle inside an annual act — they are separate systems.",
  ],

  doLabel: "Do:",
  dontLabel: "Don't:",
  ddClose: "Every line above is tied to a placement in your own chart, not to general advice. Where a line surprises you, check the planet's chapter — the reason will be there.",

  gemsIntro: "Lal Kitab is famously reluctant about gemstones. Where classical Vedic astrology prescribes a stone to strengthen a planet, Lal Kitab warns that strengthening an already-uncomfortable planet makes matters worse, and prefers a karmic act that costs almost nothing.",
  gemsForChart: "For this chart:",
  gemAvoid: (gem, p, kind, h) => `${gem} (${p}) — Avoid. ${p} is ${kind} in the ${h}, not weak; a stone amplifies a planet that is already stuck.`,
  gemNotNeeded: (gem, p, st, h) => `${gem} (${p}) — Not needed. ${p} is already ${st} in the ${h}.`,
  gemNotAdvised: (gem, p, h) => `${gem} (${p}) — Not advised. ${p} is uncomfortable in the ${h}; Lal Kitab treats that with the upay in chapter 24, not with a stone.`,
  gemSapphire: (h, st) => `Blue sapphire deserves its own line, because it is the stone people reach for first. Saturn sits in the ${h} here and is ${st} — either way, Lal Kitab does not permit a trial-and-error approach with this stone. The Saturday act in chapter 24 is the route it sanctions.`,
  gemWornLabel: "If a stone is worn anyway:",
  gemWorn: [
    "Test it for 40 days before committing to it.",
    "Remove it immediately if sleep worsens, expenses rise, or family friction increases.",
    "Never wear two planets' stones together — in Lal Kitab that is the same error as stacking upay.",
  ],

  vpToneLabel: "Tone of the year:",
  vpTone: (maha, mahaSt, antar, antarSt, tail) => `The year runs under ${maha} mahadasha with ${antar} antardasha. ${maha} is ${mahaSt}; ${antar} is ${antarSt}. ${tail}`,
  vpToneForward: "That combination pushes forward — this is a year to commit rather than to wait.",
  vpToneDormant: "The antardasha lord is dormant, so this is a consolidating year rather than an expansive one: the openings are there but they do not announce themselves.",
  vpToneCorrect: "The antardasha lord is under strain, so progress this year comes from correction rather than from momentum — run its upay before making large commitments.",
  vpToneUnknown: "The running dasha could not be resolved for this chart.",
  vpTransitsLabel: "Transits over your teva:",
  vpSaturn: (sign, h, arena) => `Saturn is transiting ${sign} — your ${h}. Expect slow, structural pressure on ${arena}. Saturn pays for patience here and punishes shortcuts.`,
  vpJupiter: (sign, h, arena) => `Jupiter is transiting ${sign} — your ${h}. This is where the year opens up: ${arena}.`,
  vpSadeSati: (h, moonSign) => `Saturn is in the ${h} from your Moon sign (${moonSign}) — the Sade Sati window. Not a disaster; a long, tiring correction. Keep the Saturday act without fail.`,
  vpNoSadeSati: (h, moonSign) => `Saturn is in the ${h} from your Moon sign (${moonSign}) — outside the Sade Sati window, so mental load stays manageable this year.`,
  vpRahu: (sign, h) => `Rahu is transiting ${sign}${h ? ` — your ${h}` : ""}; that is the area where an unusual, unearned-looking opportunity turns up. Verify the paperwork.`,
  vpPeriodLabel: "Period by period:",
  vpPeriod: (start, end, maha, antar, active, lord, st, arena) =>
    `${start} – ${end} · ${maha}/${antar}${active ? " (running now)" : ""} — ${lord} is ${st}, so ${arena} carries the year's weight in this stretch.`,
  vpKeepCycle: (p, kind, h) => `Through all of it, keep ${p}'s 43-day cycle running. A dasha period cannot deliver through a planet that is ${kind} in the ${h}.`,
  vpNoStrain: "With no planet under strain, this year is about not adding new obligations — the chart is already carrying itself.",
  vpStateIn: (st, h) => `${st} in your ${h}`,

  htLabel: "In order:",
  htDebt: (name, chapter) => `Begin with ${name} (chapter ${chapter}) — everything else waits on it.`,
  htNoDebt: "No rin is blocking this chart, so start straight at the upay — that is unusual and it saves you months.",
  htUpay: (p, act, day) => `Start one 43-day cycle, not three. ${p}'s is the priority: ${act} on ${day}.`,
  htNoUpay: "Keep the weekly acts in chapter 25; nothing here needs a 43-day cycle.",
  htLord: (lord, h) => `Re-read ${lord}'s chapter first when things stall — ${lord} rules this chart from the ${h} and it is the switch everything else runs through.`,
  htQuarterly: "Re-read the nine planet chapters once a quarter; placements read differently as life moves against them.",
  htVisible: "Keep the do's and don'ts somewhere visible. Those lines are the cheapest part of the whole system.",
  htLedger: (supportsN, targetsN, debtsN) =>
    `A note on this chart specifically: ${supportsN} graha${supportsN === 1 ? " is" : "s are"} working in your favour and ${targetsN} need${targetsN === 1 ? "s" : ""} attention. ` +
    `${debtsN === 0 ? "No ancestral debt is outstanding." : `${debtsN} of six ancestral debts are outstanding.`} That is the whole ledger — nothing in this report is hidden from that summary.`,
  htClose: "Lal Kitab was written for ordinary people with ordinary means. Nothing here requires an expensive ritual, a priest, or a gemstone. It requires that you do a small thing repeatedly, quietly, and without telling anyone. That is the whole system.",

  summaryOverall: (strong, weak, debts) =>
    `Read in the Lal Kitab style, your chart shows ${strong} as your supporting planet(s), while ${weak} need strengthening. ` +
    `Debt indications: ${debts}. The judgments, debts and simple home upaay across the 30 chapters below are drawn directly from your planetary placements.`,
  summaryNoneStrong: "none clearly dominant",
  summaryNoneWeak: "none seriously afflicted",
  summaryNoDebt: "no debts indicated",
  summaryRecommend: (p, act, day) => `Focus first on ${p}: ${act} on ${day}. Keep the do's, avoid the don'ts, and repeat it for a full 43-day cycle before adding anything else.`,
  summaryRecommendNone: "Your planets are well placed. Maintain good conduct, serve elders and keep the weekly upay to preserve the balance.",
};

const T_HI = {
  listJoin: (a) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} और ${a[a.length - 1]}` : a[0] || ""),
  house: (h, o) => `${o(h)} भाव`,
  cap: (s) => s,

  aboutIntro: "लाल किताब — 'लाल पोथी' — कुंडली को इस आधार पर पढ़ती है कि ग्रह किस भाव में बैठा है, किस राशि में नहीं। यही एक बदलाव उसके उपायों को इतना निश्चित और इतना सस्ता बनाता है: ग्रह या तो सहज बैठा है, या असहज है और उसे एक छोटे सुधारक कर्म — उपाय — की ज़रूरत है।",
  aboutCast: (a) =>
    `${a.name} के लिए बनी इस कुंडली में ${a.lagnaSign} लग्न है, जिसका स्वामी ${a.lagnaLord} है और वह स्वयं ${a.lagnaLordHouse} में बैठा है। ` +
    `नौ ग्रहों में से ${a.comfortableN} सहज बैठे हैं (${a.comfortable || "कोई नहीं"}) और ${a.targetN} को उपाय चाहिए (${a.targets || "कोई नहीं"})` +
    `${a.dormantN ? ` — इनमें से ${a.dormantN} शत्रु नहीं, निष्क्रिय हैं (${a.dormant}): जगाए जाने तक ये न शुभ फल देते हैं न अशुभ` : ", और कोई निष्क्रिय नहीं है"}। ` +
    `छह पूर्वज-ऋणों में से ${a.debtN === 0 ? "एक भी नहीं है" : `${a.debtN} हैं: ${a.debts}`}।`,
  aboutHowToLabel: "आगे के 29 अध्याय कैसे पढ़ें:",
  aboutHowTo: [
    "अध्याय 2–4 टेवा — लाल किताब की कुंडली — और हर ग्रह की स्थिति बताते हैं।",
    "अध्याय 5–17 एक-एक ग्रह का निर्णय देते हैं: सहज, उपाय का ज़रूरतमंद, या निष्क्रिय।",
    "अध्याय 18–23 छहों पूर्वज-ऋणों की जाँच करते हैं और दोनों ही स्थिति में निर्णय बताते हैं।",
    "अध्याय 24–30 में उपाय, आने वाला वर्ष, और क्या करें–क्या न करें हैं।",
  ],
  aboutClose: "इस रिपोर्ट में कुछ भी पहले से लिखा हुआ नहीं है। नीचे का हर निर्णय आपकी जन्म तिथि, समय और स्थान से गणना करके निकाला गया है।",

  birthCastLabel: "कुंडली किसके लिए बनी:",
  birthPanchangLabel: "जन्म के समय का पंचांग:",
  birthTevaLabel: "टेवा के मूल तत्व:",
  birthRows: {
    name: (v) => `नाम — ${v}`,
    dob: (v) => `जन्म तिथि — ${v}`,
    tob: (v) => `जन्म समय — ${v}`,
    place: (v) => `जन्म स्थान — ${v}`,
    ayanamsa: (v) => `अयनांश — लाहिड़ी (निरयन), ${v}`,
    houseSystem: (v) => `भाव पद्धति — पूर्ण राशि (होल साइन), ${v} लग्न से गिनी गई`,
    weekday: (v) => `वार — ${v}`,
    tithi: (v, p) => `तिथि — ${v} (${p})`,
    nakshatra: (v, p) => `नक्षत्र — ${v}, पाद ${p}`,
    yogaKarana: (y, k) => `योग — ${y} · करण — ${k}`,
    sun: (r, s) => `सूर्योदय ${r} · सूर्यास्त ${s}`,
    lagna: (s, l) => `लग्न — ${s}, स्वामी ${l}`,
    rashi: (s, l) => `राशि (चंद्र राशि) — ${s}, स्वामी ${l}`,
    nakLord: (n, g, d) => `नक्षत्र स्वामी — ${n} · गण — ${g} · नाड़ी — ${d}`,
    dasha: (m, a) => `चल रही दशा — ${m} महादशा, ${a} अंतर्दशा`,
  },
  birthNote: "लाल किताब जन्म समय के अनुमान को लेकर असामान्य रूप से उदार है — एक घंटे के भीतर पूर्ण-राशि भाव प्रायः नहीं बदलता। जहाँ समय अनिश्चित हो, वहाँ भी नीचे दिए निर्णय टिके रहते हैं।",

  placeLabel: "कौन सा ग्रह कहाँ बैठा है:",
  placeRow: (p, h, st, extras) => `${p} — ${h} · ${st}${extras.length ? ` · ${extras.join(", ")}` : ""}`,
  extraAscRuler: "लग्नेश",
  extraPakka: "अपने पक्के घर में",
  extraRetro: "वक्री",
  occupiedLine: (s) => `भरे हुए भाव: ${s}।`,
  occupiedItem: (h, abbrs) => `${h} (${abbrs})`,
  emptyLine: (s) => `खाली भाव: ${s}। लाल किताब में खाली भाव मरा हुआ भाव नहीं होता; उसका फल उस ग्रह से आता है जो उसे देखता है, और उस भाव के अपने स्वामी से।`,
  emptyNone: "इस कुंडली का हर भाव भरा हुआ है — केवल दृष्टि से पढ़ा जाने वाला कोई खाली भाव नहीं है।",
  placeClose: "इस तालिका को आगे के अध्यायों के साथ पढ़ें — लाल किताब में भाव संख्या ही पूरा निर्णय है; राशि केवल रंग देती है।",

  ascPara: (sign, lord, house, arena, ok, stateWord) =>
    `इस कुंडली में ${sign} लग्न उदय हो रहा है, इसलिए पूरे टेवा का स्वामी ${lord} है। ${lord} स्वयं ${house} में बैठा है — ${arena} — और यहीं से इस जातक का जीवन वास्तव में चलता है। ` +
    (ok
      ? `${lord} जो करता है, कुंडली वही करती है: यहाँ वह ${stateWord} है, इसलिए कुंडली को बचाने की ज़रूरत नहीं, वह स्वयं को सँभाल लेती है।`
      : `${lord} जो करता है, कुंडली वही करती है: यहाँ वह ${stateWord} है, इसलिए सुधार होने तक पूरी कुंडली रुक-रुक कर चलती है।`),
  ascTenanted: (list, gifts) => `लग्न भाव में ${list} बैठा है। लाल किताब में लग्न पर बैठा ग्रह चेहरे पर पहना जाता है — ${gifts}।`,
  ascTenantGift: (p, g) => `${p} ${g} के रूप में दिखता है`,
  ascEmpty: (lord, house, seen) =>
    `लग्न भाव में कोई ग्रह नहीं है। इसलिए शरीर और स्वभाव ${house} में बैठे ${lord} से पढ़े जाते हैं, और ${seen || "केवल लग्न राशि से"}।`,
  ascEmptySeen: (list, many) => `${list} से, जो कुंडली के दूसरे छोर से लग्न को ${many ? "देखते हैं" : "देखता है"}`,
  ascDrishti: (list) => `लग्न भाव पर लाल किताब की दृष्टि ${list} से आती है — इस व्यक्ति की छवि पर इनका भी कहना है।`,
  ascDrishtiItem: (p, h) => `${p} (${h})`,
  ascAsksLabel: "यह क्या माँगता है:",
  ascAsk1: (lord) => `${lord} को कुंडली का स्विच मानें — इसका उपाय बाकी सब ग्रहों से पहले आता है।`,
  ascAsk2Tenant: (p, act, day) => `लग्न पर बैठे ${p} को निकास चाहिए: ${day} को ${act}।`,
  ascAsk2Empty: (house) => `लग्न खाली होने से इसकी जगह ${house} की रक्षा करें — यही वह जगह है जहाँ यह कुंडली खुली हुई है।`,
  ascAsk3: (sign, gift, cost) => `${sign} लग्न का अपना गुण ईमानदारी से निभाएँ: यह ${gift} देता है, और उपेक्षा करने पर ${cost} वसूलता है।`,

  keyIntro: "इस कुंडली को तय करने वाले तीन निर्णय:",
  keyRole: { rules: "कुंडली का स्वामी है", strain: "सबसे अधिक दबाव उठा रहा है", support: "इस कुंडली का सबसे बड़ा सहारा है", second: "दूसरे सुधार की माँग करता है" },
  keyItem: (i, p, h, role, karaka, arena, tail) => `${i}. ${h} में ${p} — ${role}। ${p} ${karaka} का कारक है; इस भाव का क्षेत्र है ${arena}। ${tail}`,
  keyTailGood: (st, gift) => `यहाँ यह ${st} है, इसलिए ${gift} बिना संघर्ष के मिलता है।`,
  keyTailDormant: (kind) => `यहाँ यह ${kind} है — जगाए जाने तक न शुभ फल देता है न अशुभ।`,
  keyTailBad: (cost, gift) => `यहाँ यह असहज है, इसलिए ${gift} से पहले ${cost} सामने आता है।`,
  keyClose: "अध्याय 9 से 17 तक इन्हीं तीनों का विस्तृत रूप है। और कुछ न पढ़ें, तो ये तीन ज़रूर पढ़ें।",

  dormIntro: "लाल किताब हानि करने वाले ग्रह और केवल निष्क्रिय हो चुके ग्रह में अंतर करती है। निष्क्रिय ग्रह कोई फल नहीं देता — उसका भाव चुप पड़ा रहता है और उसकी देनें कभी आती ही नहीं। वह दंड नहीं दे रहा; वह जगाए जाने की प्रतीक्षा कर रहा है।",
  dormSleeping: (p, h, pakka, arena) => `${h} का ${p} सोया हुआ है: वह अकेला बैठा है, उस भाव पर किसी ग्रह की दृष्टि नहीं है, और उसका पक्का घर (${pakka}) खाली है। ${arena} — यह पूरा क्षेत्र चुप पड़ा रहता है।`,
  dormBlind: (p, h, pakka) => `${h} का ${p} अंधा है: यह ऐसा भाव है जिसका वह न उपयोग कर सकता है, न जिससे उसे हानि होती है, और उसका पक्का घर ${pakka} है। वह व्यस्त दिखता है और देता कुछ नहीं।`,
  dormNone: (states) => `इस कुंडली में कोई ग्रह निष्क्रिय नहीं है। हर ग्रह या तो काम आ रहा है या महसूस हो रहा है: ${states}। यह जितना लगता है उससे कहीं दुर्लभ है, और इसका अर्थ है कि यहाँ कोई उपाय केवल किसी को जगाने में ख़र्च नहीं होता।`,
  dormStateItem: (p, st) => `${p} ${st}`,
  dormWokenLabel: "निष्क्रिय ग्रह कैसे जगाया जाता है:",
  dormWoken: [
    "एक निश्चित कर्म, बार-बार — लाल किताब बड़े पैमाने से अधिक निरंतरता को महत्व देती है।",
    "कुछ अर्जित करने के बजाय कुछ दिया हुआ।",
    "43 दिन बिना नागा — एक दिन छूटने पर गिनती फिर से शुरू होती है।",
  ],
  dormStart: (p, act, day) => `${p} से शुरू करें: ${day} को ${act}।`,
  dormNoStart: "कोई ग्रह निष्क्रिय न होने से अध्याय 24 के उपाय दबाव वाले ग्रहों पर लगते हैं।",

  benLabel: "आपके पक्ष में काम कर रहे ग्रह:",
  benRow: (p, h, arena, gift) => `${p} (${h}) — ${arena}; देता है ${gift}।`,
  benNone: "इस कुंडली में कोई ग्रह बिना शर्त सहज नहीं बैठा है। यह कोई विनाश का निर्णय नहीं — इसका अर्थ है कि यह कुंडली विरासत से नहीं, उपाय से बनती है, और अध्याय 24 के उपाय वही काम करते हैं जो कोई शुभ ग्रह मुफ़्त में कर देता।",
  benBase: (n, areas, targetsN) => `${areas} को सँभालते ${n} ग्रह ही इस कुंडली का आधार हैं। इसे बचाने की ज़रूरत नहीं — इसके ${targetsN} निश्चित छेद बंद करने की ज़रूरत है।`,
  benProtect: "इनकी रक्षा करें: प्रबल ग्रह की अपनी वस्तुएँ उपहार में न लें (लाल किताब इस पर सख़्त है), और जो ग्रह पहले से सहज है उस पर रत्न न चढ़ाएँ — कारण अध्याय 28 में है।",
  benCheapest: (p, h) => `देखें कि कौन सा ग्रह सहज होने के सबसे क़रीब है — ${h} का ${p} — क्योंकि उसे पार लाना सबसे सस्ता है।`,

  malLabel: "दबाव कहाँ है:",
  malRow: (p, h, reason, cost, arena) => `${p} (${h}) — ${reason}। ${arena} के आसपास ${cost} की अपेक्षा रखें।`,
  malReasonDormant: (kind) => `${kind} — शत्रु नहीं, निष्क्रिय`,
  malReasonHard: (p) => `${p} के लिए कठिन भाव`,
  malReasonDebilitated: (sign) => `${sign} में नीच`,
  malReasonStrain: "दबाव में",
  malNone: "इस कुंडली में कोई ग्रह शत्रु या निष्क्रिय नहीं है। यहाँ बचाव के लिए कुछ नहीं — अध्याय 27 की सूची मरम्मत के लिए नहीं, इसी स्थिति को बनाए रखने के लिए है।",
  malOrderDebt: (debt, chapter, planets) => `उपचार का क्रम: लाल किताब ग्रह से पहले ऋण का उपचार करती है। पहले ${debt} चुकाएँ (अध्याय ${chapter}), फिर ${planets} को साधें। क्रम बदलने पर मेहनत बेकार जाती है।`,
  malOrderNoDebt: (planets) => `उपचार का क्रम: यहाँ कोई ऋण रास्ता नहीं रोक रहा, इसलिए सीधे इसी क्रम से चलें: ${planets}। क्रम बदलने पर मेहनत बेकार जाती है।`,
  malDrishti: (items) => `केवल यह न देखें कि ये कहाँ बैठे हैं, यह भी देखें कि किस भाव को देखते हैं: ${items}।`,
  malDrishtiItem: (p, houses) => `${p} की दृष्टि ${houses} पर है`,

  pHeader: (p, hindiName, h, sign, deg, nak, pada, motion) => `${h} में ${p} · ${sign} ${deg} · ${nak} पाद ${pada} · ${motion}`,
  pRetro: "वक्री",
  pDirect: "मार्गी",
  pIntro: (p, karaka, h, arena, domain, gift, cost) =>
    `${p} ${karaka} का कारक है। ${h} का क्षेत्र है — ${arena}; शास्त्रीय रूप में ${domain}। दोनों मिलाकर: ${gift} ${arena} पर उतरता है, और बिगड़ने पर वह ${cost} के रूप में बिगड़ता है।`,
  pStateSleeping: (p, h, pakka) => `${p} यहाँ सोया हुआ है — भाव में अकेला, किसी दृष्टि से अनदेखा, और उसका पक्का घर (${pakka}) खाली। उपाय से जगाए जाने तक यह कोई फल नहीं देता।`,
  pStateBlind: (p, h) => `${p} ${h} में अंधा है — यह ऐसा भाव है जिसका वह न उपयोग कर सकता है, न जिससे उसे हानि होती है, इसलिए यह ध्यान खाता है और लौटाता कुछ नहीं।`,
  pStateGood: (p, gift) => `${p} यहाँ सहज है। ${gift} सामान्य प्रयास से मिल जाता है, और बाकी कुंडली इसी स्थिति से उधार लेती है।`,
  pStateBad: (p, cost, gift, act, day) => `${p} को यहाँ उपाय चाहिए। ${gift} से पहले ${cost} आता है, और सुधार सस्ता है: ${day} को ${act}।`,
  pStateWorkable: (p) => `${p} यहाँ सामान्य है — न देन, न समस्या। बाकी कुंडली जो करती है, यह उसी के साथ चलता है।`,
  pNotesLabel: "टिप्पणियाँ:",
  pDigExalted: (sign, p) => `${sign} में उच्च का — यह ${p} का सबसे प्रबल रूप है, इसे किसी सहारे की ज़रूरत नहीं।`,
  pDigDebilitated: (sign) => `${sign} में नीच का — फल फिर भी आता है, पर देर से, और सुधार होने के बाद ही।`,
  pDigOwn: (sign, p) => `अपनी ही राशि ${sign} में — यहाँ ${p} किसी और के अधीन नहीं, जिससे जो कुछ यह छूता है वह स्थिर रहता है।`,
  pDigNeutral: (sign, disp, dispHouse, p) => `${sign} में, जिसका स्वामी ${disp} है${dispHouse ? `, इसलिए यहाँ ${p} का फल ${dispHouse} में बैठे ${disp} के रास्ते मिलता है` : ""}।`,
  pCompanyCo: (h, list, first, p) => `${h} को ${list} के साथ बाँटता है — लाल किताब में साझा भाव साझा फल है; ${first} की दशा ${p} की दशा में पढ़ी जाती है।`,
  pCompanySeen: (list) => `अकेला बैठा है पर ${list} की दृष्टि इस पर है — यही दृष्टि इस भाव को जगाए रखती है।`,
  pCompanySeenItem: (h, p) => `${h} से ${p}`,
  pCompanyAlone: (h) => `${h} में अकेला बैठा है और उस पर किसी की दृष्टि नहीं — कुंडली में कोई और इस स्थिति को न सहारा दे रहा है न बिगाड़ रहा है।`,
  pDrishti: (h, houses, many, p) => `${h} से यह ${houses} पर लाल किताब की दृष्टि डालता है — ${many ? "इन भावों पर भी" : "इस भाव पर भी"} ${p} की छाप है।`,
  pDrishtiItem: (h, short) => `${h} (${short})`,
  pPakkaIn: (p) => `यह ${p} का पक्का घर है, उसका स्थायी आसन। यहाँ का फल टिकाऊ होता है और उसे बार-बार दोहराना नहीं पड़ता।`,
  pPakkaOut: (p, pakka, held) => `${p} का पक्का घर ${pakka} है, जो इस समय ${held || "खाली है"} — उस आसन को साफ़ रखना लाभदायक है।`,
  pPakkaHeld: (list) => `${list} के अधिकार में है`,
  pRetroNote: (p) => `जन्म के समय वक्री: ${p} का फल भीतर की ओर मुड़ता है और अपेक्षा से देर में आता है, प्रायः दूसरे प्रयास के बाद।`,
  pUpay: (act, day, maint) => `उपाय: ${day} को ${act}, लगातार 43 दिन। ${maint}`,
  pMaint: (maint, p) => `रखरखाव: ${maint} ${p} की अपनी वस्तुएँ उपहार में न लें।`,
};

const T_HI2 = {
  rinDetected: "इस कुंडली में पाया गया।",
  rinNotPresent: "जाँच की गई — इस कुंडली में नहीं है।",
  rinRuleLabel: (rule) => `नियम: ${rule}`,
  rinChartShows: (witnesses) => `आपकी कुंडली में वास्तव में यह है: ${witnesses}। इनमें से कोई भी स्थिति नियम पर खरी नहीं उतरती, इसलिए यह ऋण नहीं है।`,
  rinWitnessItem: (p, h) => `${h} में ${p}`,
  rinTriggered: (hits, theme) => `किससे बना: ${hits}। लाल किताब में यह दोष नहीं है; यह ${theme} है, कमाया हुआ नहीं, विरासत में मिला हुआ।`,
  rinHitItem: (text, why) => `${text} — ${why}`,
  rinHitPlacement: (p, h) => `${p} ${h} में है`,
  rinHitConjunction: (a, b, h) => `${a} और ${b} एक साथ ${h} में हैं`,
  rinHitLagnaDormant: (p, h, kind) => `लग्नेश ${p} ${h} में ${kind} है`,
  rinWeight: (p, h, arena) => `${h} का ${p} भार ${arena} पर डालता है, इसलिए यह ऋण सबसे पहले वहीं महसूस होता है।`,
  rinShowsLabel: "यह कैसे प्रकट होता है:",
  rinSettlementLabel: "चुकाने का उपाय:",
  rinAlongside: (p, act, day) => `इसके साथ ${p} का अपना उपाय भी चलाएँ: ${day} को ${act}।`,
  rinUpkeep: (u) => `इसे ऐसे ही बनाए रखने के लिए: ${u}`,

  rsGlanceLabel: "छहों ऋण एक नज़र में:",
  rsRowAbsent: (name) => `${name} — नहीं है`,
  rsRowPresent: (name, hits, rank) => `${name} — है (${hits}) · ${rank} चुकाएँ`,
  rsRank: ["पहले", "दूसरे", "तीसरे", "चौथे", "पाँचवें", "छठे"],
  rsOrderLine: (order, planet, debt) => `चुकाने का क्रम: ${order}। लाल किताब मानती है कि बिना चुका ऋण उस ऋण से जुड़े हर ग्रह के उपाय को रोक देता है — जब तक ${debt} सक्रिय रूप से चुकाया न जाए, ${planet} के उपाय फल नहीं पकड़ेंगे। ऊपर से नीचे की ओर चलें।`,
  rsOrderItem: (i, name) => `${i}) ${name}`,
  rsNoDebt: (names) => `इस कुंडली में कोई ऋण नहीं है। छहों कारकों की उनके अपने नियम पर जाँच हुई और एक भी नहीं बना: ${names}। इसका अर्थ है कि आगे के अध्यायों का हर उपाय सीधे अपने ग्रह पर लगेगा, बीच में कोई रुकावट नहीं — यह सुविधा अधिकतर कुंडलियों को नहीं मिलती।`,
  rsNotCarried: (names) => `जो ऋण नहीं हैं: ${names || "कोई नहीं"}। वहाँ उपाय ख़र्च न करें; लाल किताब अनावश्यक उपाय को हस्तक्षेप मानती है।`,

  dailyLabel: "इस कुंडली के लिए महत्वपूर्ण उपाय:",
  dailyRow: (p, h, st, act, day) => `${p} (${h}, ${st}) — ${act} · ${day} से शुरू करें`,
  dailyNone: "इस कुंडली में कोई ग्रह इतने दबाव में नहीं कि 43 दिन का चक्र चाहिए। इसकी जगह अगले अध्याय के साप्ताहिक कर्म निभाएँ — लाल किताब में जिस कुंडली को कुछ नहीं चाहिए, उसका उपचार नहीं, रखरखाव होता है।",
  dailyPriority: (p, reason) => `एक बार में एक ही करें, इसी क्रम में। ${p} पहले है क्योंकि वह ${reason}।`,
  dailyReasonDormant: (kind) => `${kind} है — निष्क्रिय स्थिति सबसे महँगी पड़ती है और सबसे सस्ते में ठीक होती है`,
  dailyReasonStrain: (h) => `${h} में सबसे अधिक दबाव उठा रहा है`,
  dailyRulesLabel: "चक्र के नियम:",
  dailyRules: [
    "43 दिन लगातार। एक दिन छूटा तो गिनती फिर से शुरू।",
    "स्वयं करें — किसी और से कराया उपाय दर्ज नहीं होता।",
    "किसी को न बताएँ कि आप यह कर रहे हैं।",
    "एक समय में एक ही ग्रह। लाल किताब स्पष्ट कहती है कि उपायों का ढेर एक-दूसरे को काट देता है।",
  ],

  weekLabel: "इस कुंडली से पढ़ा गया सप्ताह:",
  weekBoth: (day, act, node, nodeHouse, nodeAct) => `${day} — ${act}; और ${nodeHouse} के ${node} के लिए ${nodeAct}।`,
  weekLord: (day, act, lord, st, h) => `${day} — ${act} (${lord} ${h} में ${st} है)।`,
  weekNode: (day, lord, node, nodeHouse, nodeAct) => `${day} — ${lord} को कुछ नहीं चाहिए; यह दिन ${nodeHouse} के ${node} के लिए रखें: ${nodeAct}।`,
  weekNone: (day, lord, st, h) => `${day} — कुछ आवश्यक नहीं। ${lord} ${h} में ${st} है; बस आज ${lord} की अपनी वस्तुएँ उपहार में न लें।`,
  weekNodeNote: "राहु का उपाय बुधवार को और केतु का मंगलवार को, उस दिन के अपने स्वामी के साथ किया जाता है — लाल किताब में छाया ग्रहों का अपना कोई वार नहीं है।",
  weekOneDay: (day, p) => `यदि केवल एक दिन निभा सकें तो ${day} निभाएँ — यह ${p} का दिन है, और ${p} इस कुंडली का पहला सुधार है।`,
  weekMaint: "कोई ग्रह दबाव में न होने से यह सप्ताह रखरखाव का है: नए कर्म जोड़ने के बजाय दिन के कर्म हल्के और नियमित रखें।",

  annualLabel: "इस कुंडली के लिए, वर्ष में एक बार:",
  annualItem: (act, p, st, h) => `${act} — ${p} ${h} में ${st} है।`,
  annualPitru: "पितृ पक्ष में पूरे पखवाड़े पिता के नाम भोजन अर्पित करें — इस कुंडली में पितृ ऋण है और वही पखवाड़ा उसे चुकाने का सबसे सस्ता समय है।",
  annualLagna: (act, lord) => `${act} — ${lord} इस कुंडली का स्वामी है और वार्षिक कर्म सहज स्वामी को सहज बनाए रखता है।`,
  annualBirthday: (p, item) => `विशेष रूप से जन्मदिन पर: ${p} की एक वस्तु दान करें — ${item}। लाल किताब जन्मदिन को वह एक दिन मानती है जब पूरी कुंडली दोबारा ढलती है।`,
  annualNotLabel: "क्या न करें:",
  annualNot: [
    "इनसे अधिक उपाय न जोड़ें। उपायों का ढेर स्वयं को काट देता है।",
    "किसी और की ओर से किया वार्षिक कर्म अपना मानकर न गिनें।",
    "वार्षिक कर्म के भीतर 43 दिन का चक्र दोबारा शुरू न करें — ये दो अलग व्यवस्थाएँ हैं।",
  ],

  doLabel: "क्या करें:",
  dontLabel: "क्या न करें:",
  ddClose: "ऊपर की हर पंक्ति आपकी अपनी कुंडली की किसी स्थिति से जुड़ी है, सामान्य सलाह नहीं है। कोई पंक्ति चौंकाए तो उस ग्रह का अध्याय देखें — कारण वहीं मिलेगा।",

  gemsIntro: "लाल किताब रत्नों को लेकर प्रसिद्ध रूप से अनिच्छुक है। जहाँ शास्त्रीय वैदिक ज्योतिष ग्रह को बल देने के लिए रत्न बताता है, वहाँ लाल किताब चेतावनी देती है कि पहले से असहज ग्रह को और बल देना बात बिगाड़ देता है — और वह उसकी जगह लगभग मुफ़्त पड़ने वाला कर्म चुनती है।",
  gemsForChart: "इस कुंडली के लिए:",
  gemAvoid: (gem, p, kind, h) => `${gem} (${p}) — न पहनें। ${p} ${h} में ${kind} है, निर्बल नहीं; रत्न उस ग्रह को और बढ़ा देता है जो पहले ही अटका हुआ है।`,
  gemNotNeeded: (gem, p, st, h) => `${gem} (${p}) — आवश्यकता नहीं। ${p} ${h} में पहले से ही ${st} है।`,
  gemNotAdvised: (gem, p, h) => `${gem} (${p}) — सलाह नहीं। ${p} ${h} में असहज है; लाल किताब इसका उपचार रत्न से नहीं, अध्याय 24 के उपाय से करती है।`,
  gemSapphire: (h, st) => `नीलम की अपनी अलग पंक्ति बनती है, क्योंकि लोग सबसे पहले यही रत्न उठाते हैं। यहाँ शनि ${h} में है और ${st} है — दोनों ही स्थिति में लाल किताब इस रत्न के साथ आज़माइश की अनुमति नहीं देती। वह अध्याय 24 का शनिवार वाला कर्म ही मान्य मानती है।`,
  gemWornLabel: "फिर भी रत्न पहनना ही हो तो:",
  gemWorn: [
    "पक्का करने से पहले 40 दिन उसकी परख करें।",
    "नींद बिगड़े, ख़र्च बढ़े या घर में कलह बढ़े तो तुरंत उतार दें।",
    "दो ग्रहों के रत्न कभी एक साथ न पहनें — लाल किताब में यह उपायों के ढेर जैसी ही भूल है।",
  ],

  vpToneLabel: "वर्ष का स्वभाव:",
  vpTone: (maha, mahaSt, antar, antarSt, tail) => `यह वर्ष ${maha} महादशा और ${antar} अंतर्दशा में चल रहा है। ${maha} ${mahaSt} है; ${antar} ${antarSt} है। ${tail}`,
  vpToneForward: "यह जोड़ आगे धकेलता है — यह प्रतीक्षा का नहीं, निर्णय लेकर जुट जाने का वर्ष है।",
  vpToneDormant: "अंतर्दशा का स्वामी निष्क्रिय है, इसलिए यह विस्तार का नहीं, जमाव का वर्ष है: अवसर हैं, पर वे स्वयं घोषणा नहीं करते।",
  vpToneCorrect: "अंतर्दशा का स्वामी दबाव में है, इसलिए इस वर्ष प्रगति गति से नहीं, सुधार से आएगी — बड़े निर्णय लेने से पहले उसका उपाय चलाएँ।",
  vpToneUnknown: "इस कुंडली की चल रही दशा निकाली नहीं जा सकी।",
  vpTransitsLabel: "आपके टेवा पर गोचर:",
  vpSaturn: (sign, h, arena) => `शनि ${sign} में गोचर कर रहा है — आपका ${h}। ${arena} पर धीमा, ढाँचागत दबाव रहेगा। यहाँ शनि धैर्य का फल देता है और शॉर्टकट का दंड।`,
  vpJupiter: (sign, h, arena) => `गुरु ${sign} में गोचर कर रहा है — आपका ${h}। वर्ष यहीं से खुलता है: ${arena}।`,
  vpSadeSati: (h, moonSign) => `शनि आपकी चंद्र राशि (${moonSign}) से ${h} में है — यह साढ़े साती का समय है। यह आपदा नहीं; एक लंबा, थकाने वाला सुधार है। शनिवार का कर्म बिना नागा निभाएँ।`,
  vpNoSadeSati: (h, moonSign) => `शनि आपकी चंद्र राशि (${moonSign}) से ${h} में है — साढ़े साती के बाहर, इसलिए इस वर्ष मानसिक भार सँभलने लायक रहता है।`,
  vpRahu: (sign, h) => `राहु ${sign} में गोचर कर रहा है${h ? ` — आपका ${h}` : ""}; यही वह क्षेत्र है जहाँ कोई असामान्य, बिना कमाया-सा अवसर सामने आता है। काग़ज़ात ज़रूर जाँचें।`,
  vpPeriodLabel: "अवधि दर अवधि:",
  vpPeriod: (start, end, maha, antar, active, lord, st, arena) =>
    `${start} – ${end} · ${maha}/${antar}${active ? " (अभी चल रही)" : ""} — ${lord} ${st} है, इसलिए इस दौर में वर्ष का भार ${arena} उठाता है।`,
  vpKeepCycle: (p, kind, h) => `इस पूरे वर्ष ${p} का 43 दिन का चक्र चलता रहने दें। जो ग्रह ${h} में ${kind} है, दशा उसके रास्ते फल नहीं दे पाती।`,
  vpNoStrain: "कोई ग्रह दबाव में न होने से यह वर्ष नई ज़िम्मेदारियाँ न जोड़ने का है — कुंडली पहले से ही स्वयं को सँभाल रही है।",
  vpStateIn: (st, h) => `आपके ${h} में ${st}`,

  htLabel: "इसी क्रम में:",
  htDebt: (name, chapter) => `${name} से शुरू करें (अध्याय ${chapter}) — बाकी सब उसी की प्रतीक्षा में है।`,
  htNoDebt: "इस कुंडली में कोई ऋण रास्ता नहीं रोक रहा, इसलिए सीधे उपाय से शुरू करें — यह असामान्य है और इससे कई महीने बचते हैं।",
  htUpay: (p, act, day) => `तीन नहीं, एक ही 43 दिन का चक्र शुरू करें। ${p} का पहले: ${day} को ${act}।`,
  htNoUpay: "अध्याय 25 के साप्ताहिक कर्म निभाते रहें; यहाँ किसी को 43 दिन के चक्र की ज़रूरत नहीं।",
  htLord: (lord, h) => `जब भी काम रुके, सबसे पहले ${lord} का अध्याय दोबारा पढ़ें — ${lord} इस कुंडली को ${h} से चला रहा है और बाकी सब उसी स्विच से होकर जाता है।`,
  htQuarterly: "नौ ग्रहों के अध्याय हर तीन महीने में दोबारा पढ़ें; जीवन आगे बढ़ने पर वही स्थितियाँ अलग अर्थ देती हैं।",
  htVisible: "क्या करें–क्या न करें वाली सूची कहीं सामने रखें। पूरी व्यवस्था में वही सबसे सस्ता हिस्सा है।",
  htLedger: (supportsN, targetsN, debtsN) =>
    `विशेष रूप से इस कुंडली के बारे में: ${supportsN} ग्रह आपके पक्ष में काम कर रहे हैं और ${targetsN} को ध्यान चाहिए। ` +
    `${debtsN === 0 ? "कोई पूर्वज-ऋण बकाया नहीं है।" : `छह में से ${debtsN} पूर्वज-ऋण बकाया हैं।`} यही पूरा हिसाब है — इस रिपोर्ट में इस सारांश से कुछ भी छिपा नहीं है।`,
  htClose: "लाल किताब साधारण साधनों वाले साधारण लोगों के लिए लिखी गई थी। यहाँ किसी महँगे अनुष्ठान, पुरोहित या रत्न की ज़रूरत नहीं। ज़रूरत बस इतनी है कि आप एक छोटा-सा काम बार-बार, चुपचाप, और बिना किसी को बताए करते रहें। यही पूरी व्यवस्था है।",

  summaryOverall: (strong, weak, debts) =>
    `लाल किताब की शैली में पढ़ने पर आपकी कुंडली में ${strong} सहारा देने वाले ग्रह हैं, जबकि ${weak} को बल चाहिए। ` +
    `ऋण संकेत: ${debts}। नीचे के 30 अध्यायों के निर्णय, ऋण और घर में हो जाने वाले सरल उपाय सीधे आपकी ग्रह स्थितियों से निकाले गए हैं।`,
  summaryNoneStrong: "कोई स्पष्ट रूप से प्रबल नहीं",
  summaryNoneWeak: "कोई गंभीर रूप से पीड़ित नहीं",
  summaryNoDebt: "कोई ऋण संकेत नहीं",
  summaryRecommend: (p, act, day) => `पहले ${p} पर ध्यान दें: ${day} को ${act}। क्या करें का पालन करें, क्या न करें से बचें, और कुछ और जोड़ने से पहले पूरे 43 दिन का चक्र दोहराएँ।`,
  summaryRecommendNone: "आपके ग्रह अच्छी स्थिति में हैं। आचरण अच्छा रखें, बड़ों की सेवा करें और संतुलन बनाए रखने के लिए साप्ताहिक उपाय निभाते रहें।",
};

// ── pack assembly + key-parity guard ─────────────────────────────────────────

const PACKS = {
  en: { ...T_EN, ...T_EN2 },
  hi: { ...T_HI, ...T_HI2 },
};

function keyPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v) && typeof v !== "function") out.push(...keyPaths(v, path));
    else out.push(path);
  }
  return out;
}

export function assertPackParity() {
  const missing = [];
  for (const [a, b] of [["en", "hi"], ["hi", "en"]]) {
    const other = new Set(keyPaths(PACKS[b]));
    keyPaths(PACKS[a]).forEach((k) => { if (!other.has(k)) missing.push(`${k} present in ${a}, missing in ${b}`); });
    const otherTitles = new Set(keyPaths(TITLES[b]));
    keyPaths(TITLES[a]).forEach((k) => { if (!otherTitles.has(k)) missing.push(`title ${k} present in ${a}, missing in ${b}`); });
    const otherRin = new Set(keyPaths(RIN_TEXT[b]));
    keyPaths(RIN_TEXT[a]).forEach((k) => { if (!otherRin.has(k)) missing.push(`rin ${k} present in ${a}, missing in ${b}`); });
    const otherRule = new Set(keyPaths(RULE_TEXT[b]));
    keyPaths(RULE_TEXT[a]).forEach((k) => { if (!otherRule.has(k)) missing.push(`rule ${k} present in ${a}, missing in ${b}`); });
  }
  return missing;
}

// The single entry point the report builder uses.
export function buildStringPack(language) {
  const lang = language === "hi" ? "hi" : "en";
  const v = VOCAB[lang];
  const t = PACKS[lang];
  const localised = (map, value) => (map && map[value]) || value;
  return {
    lang,
    t,
    titles: TITLES[lang],
    rin: RIN_TEXT[lang],
    rule: RULE_TEXT[lang],
    P: (n) => v.planet[n] || n,
    abbr: (n) => v.abbr[n] || n,
    sign: (s) => localised(v.sign, s),
    nak: (s) => localised(v.nak, s),
    yoga: (s) => localised(v.yoga, s),
    karana: (s) => localised(v.karana, s),
    weekday: (s) => localised(v.weekday, s),
    paksha: (s) => localised(v.paksha, s),
    gan: (s) => localised(v.gan, s),
    nadi: (s) => localised(v.nadi, s),
    tithi: (s) => {
      // engine gives "8 Krishna Paksha" — localise the paksha half only
      const m = String(s || "").match(/^(\d+)\s+(.*)$/);
      return m ? `${m[1]} ${localised(v.paksha, m[2])}` : s;
    },
    date: (s) => String(s || "").replace(/\b([A-Z][a-z]{2})\b/g, (m) => (v.month && v.month[m]) || m),
    state: (s) => v.state[s] || s,
    statePhrase: (s) => v.statePhrase[s] || s,
    gift: (n) => v.gift[n], cost: (n) => v.cost[n],
    arena: (h) => v.arena[h], arenaShort: (h) => (v.arena[h] || "").split(/[,،]/)[0],
    domain: (h) => v.domain[h], karaka: (n) => v.karaka[n],
    dailyAct: (n) => v.dailyAct[n], annualAct: (n) => v.annualAct[n],
    maint: (n) => v.maint[n], gem: (n) => v.gem[n], birthdayItem: (n) => v.birthdayItem[n],
    ordinal: (n) => v.ord(n),
    house: (h) => t.house(h, v.ord),
    // house phrase in subject position ("the 8th house is …" / "आठवाँ भाव … है")
    houseN: (h) => t.house(h, v.ordNom),
    list: (a) => t.listJoin(a.filter(Boolean)),
    cap: (s) => t.cap(s),
  };
}
