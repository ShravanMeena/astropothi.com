// ─────────────────────────────────────────────────────────────────────────────
// The words the Love report uses for things the chart does not name.
//
// A chart says "Moon in Sagittarius in the 6th". A reader wants to know that
// they attach fast and then get restless. This file is the dictionary between
// the two, in both languages.
//
// Rules that hold everywhere below:
//   · Nothing accuses. Every line is about the reader's own tendency, never
//     about what a partner will do — see docs/05-legal.md on the advertising
//     code. "Your partner will cheat" is not a prediction we are allowed to
//     make, and is not one the chart supports.
//   · Nothing names an illness or promises an outcome.
//   · The Hindi is written to be read aloud, not transliterated from English.
// ─────────────────────────────────────────────────────────────────────────────

/** How quickly, and on what terms, this person attaches. From the Moon. */
export const ATTACHMENT = {
  en: {
    quick:    { label: "You attach quickly",
                body: "You do not hold much back once you have decided someone is yours. Feeling comes first and caution arrives later, which is why the early weeks of a relationship are the easiest part for you and the sixth month is harder." },
    steady:   { label: "You attach slowly and then completely",
                body: "You are not swept away, and you do not pretend to be. What you offer builds in layers, and once it is built it does not move much. People often realise late how committed you already were." },
    measured: { label: "You attach with your head first",
                body: "You need to understand someone before you can feel safe with them. Conversation is how you fall for a person, and a relationship that cannot be talked about is one you will quietly step back from." },
    guarded:  { label: "You open slowly, and only when it is earned",
                body: "You keep a door half-closed until someone has shown you, over time, that they will stay. This is not coldness. It is a rule you made once, probably early, and it has protected you — but it also means people can spend months unsure whether you are interested." },
    intense:  { label: "You attach hard",
                body: "When you are in, you are all the way in, and the relationship becomes the thing you think about. That intensity is real and it is felt by the other person. It also means the ordinary quiet of a settled relationship can feel, wrongly, like something going missing." }
  },
  hi: {
    quick:    { label: "आप जल्दी जुड़ जाते हैं",
                body: "एक बार तय कर लिया कि यह व्यक्ति आपका है, तो आप ज़्यादा कुछ छुपाते नहीं। पहले भावना आती है, सावधानी बाद में — इसलिए रिश्ते के शुरुआती हफ़्ते आपके लिए सबसे आसान होते हैं और छठा महीना सबसे मुश्किल।" },
    steady:   { label: "आप धीरे जुड़ते हैं, पर पूरी तरह",
                body: "आप बहकते नहीं, और बहकने का दिखावा भी नहीं करते। आप जो देते हैं वह परत-दर-परत बनता है, और एक बार बन जाए तो हिलता नहीं। लोग अक्सर देर से समझ पाते हैं कि आप कब के जुड़ चुके थे।" },
    measured: { label: "आप पहले दिमाग़ से जुड़ते हैं",
                body: "किसी के साथ सुरक्षित महसूस करने से पहले आपको उसे समझना पड़ता है। बातचीत ही आपके लिए प्यार में पड़ने का रास्ता है, और जिस रिश्ते पर बात न हो सके, उससे आप चुपचाप पीछे हट जाते हैं।" },
    guarded:  { label: "आप देर से खुलते हैं, और तभी जब सामने वाला कमा ले",
                body: "जब तक कोई समय देकर यह न दिखा दे कि वह रुकेगा, आप दरवाज़ा आधा बंद रखते हैं। यह ठंडापन नहीं है। यह एक नियम है जो आपने कभी बनाया था, शायद बहुत पहले, और इसने आपको बचाया भी है — पर इसका मतलब यह भी है कि सामने वाला महीनों तक यह समझ नहीं पाता कि आपकी दिलचस्पी है या नहीं।" },
    intense:  { label: "आप गहराई से जुड़ते हैं",
                body: "जब आप अंदर होते हैं, पूरे अंदर होते हैं, और रिश्ता वही चीज़ बन जाता है जिसके बारे में आप सोचते रहते हैं। यह तीव्रता असली है और सामने वाले को महसूस भी होती है। पर इसका एक नतीजा यह भी है कि जमे हुए रिश्ते का सामान्य ठहराव आपको ग़लती से ऐसा लगता है जैसे कुछ छूट रहा हो।" }
  }
};

/** How affection is shown, which is not the same as how it is felt. Venus. */
export const EXPRESSION = {
  en: {
    demonstrative: { label: "openly, and quickly",
                     body: "You say it, and you show it, and you would rather over-express than leave someone guessing. A partner who is undemonstrative will read to you as uninterested long before they actually are." },
    practical:     { label: "by doing, not by saying",
                     body: "You show love by handling things — the booking, the errand, the problem they mentioned once. It is a real language and it is easily missed by someone waiting to be told. If a partner has ever said you are not romantic, this is usually the mismatch." },
    verbal:        { label: "in words, and in conversation",
                     body: "Affection, for you, is being talked to. You express it by naming things out loud, and a relationship where the two of you stop talking is one you will feel is over well before it is." },
    devotional:    { label: "quietly, and completely",
                     body: "Your affection is not loud, but it is total, and it comes out in the small private things nobody else sees. You give more than you announce, which is generous and occasionally leaves you feeling unseen." }
  },
  hi: {
    demonstrative: { label: "खुलकर, और जल्दी",
                     body: "आप कहते भी हैं और दिखाते भी हैं, और अंदाज़ा लगाने देने से बेहतर आपको ज़्यादा जता देना लगता है। जो साथी कम जताता है, वह आपको बेरुख़ लगने लगेगा — असल में बेरुख़ होने से बहुत पहले।" },
    practical:     { label: "करके, कहकर नहीं",
                     body: "आप प्यार काम करके दिखाते हैं — वह बुकिंग, वह काम, वह परेशानी जिसका उसने एक बार ज़िक्र किया था। यह भी एक भाषा है, और जो सुनने का इंतज़ार कर रहा हो उसे यह अक्सर दिखती नहीं। अगर किसी साथी ने कभी कहा हो कि आप रोमांटिक नहीं हैं, तो चूक आमतौर पर यहीं होती है।" },
    verbal:        { label: "शब्दों में, बातचीत में",
                     body: "आपके लिए प्यार का मतलब है कि आपसे बात की जाए। आप उसे बोलकर, नाम देकर व्यक्त करते हैं — और जिस रिश्ते में बातचीत रुक जाए, वह आपको ख़त्म लगने लगता है, ख़त्म होने से काफ़ी पहले।" },
    devotional:    { label: "चुपचाप, और पूरी तरह",
                     body: "आपका स्नेह शोर नहीं करता, पर पूरा होता है, और छोटी-छोटी निजी चीज़ों में निकलता है जो किसी और को दिखती नहीं। आप जताने से ज़्यादा देते हैं — यह उदारता है, और कभी-कभी इसी वजह से आपको लगता है कि आपको कोई देख नहीं रहा।" }
  }
};

/** What draws them first, and what they end up committing to. Venus vs 7th. */
export const DRAW = {
  en: { confidence: "confidence and momentum", stability: "steadiness and reliability",
        intelligence: "a quick mind and good conversation", warmth: "warmth and emotional openness" },
  hi: { confidence: "आत्मविश्वास और तेज़ी", stability: "ठहराव और भरोसा",
        intelligence: "तेज़ दिमाग़ और अच्छी बातचीत", warmth: "गर्मजोशी और भावनात्मक खुलापन" }
};

/** Chemistry, kept in the language of pace and warmth. Venus–Mars. */
export const CHEMISTRY = {
  en: {
    immediate: "Attraction arrives fast for you and it is physical before it is anything else. The chart puts Venus and Mars together, which is the classical signature of chemistry that does not need to be built. The thing to know about it is that it can outrun the rest of the relationship — the feeling arrives fully formed while trust, still, is only a few weeks old.",
    strong:    "There is real heat here. Venus and Mars see each other in your chart, so attraction and affection tend to move together rather than pulling in different directions, and physical closeness is one of the ways you repair after a bad week.",
    warm:      "Attraction builds rather than arrives. Venus and Mars sit in a supportive relationship, so the spark is steady instead of sudden — less dramatic at the start, and noticeably more durable at year three.",
    slow:      "You are not someone for whom attraction is instant. Venus and Mars sit apart in your chart, which classically means desire follows closeness rather than leading it. People you were not initially drawn to have probably become attractive to you over time, and that is the pattern, not an accident."
  },
  hi: {
    immediate: "आपके लिए आकर्षण तेज़ी से आता है और सबसे पहले शारीरिक स्तर पर आता है। कुंडली में शुक्र और मंगल साथ हैं, जो उस केमिस्ट्री का शास्त्रीय संकेत है जिसे बनाना नहीं पड़ता। ध्यान देने वाली बात यह है कि यह बाक़ी रिश्ते से आगे निकल सकती है — भावना पूरी बनकर आ जाती है जबकि भरोसा अभी कुछ हफ़्ते पुराना ही होता है।",
    strong:    "यहाँ असली गर्माहट है। आपकी कुंडली में शुक्र और मंगल एक-दूसरे को देखते हैं, इसलिए आकर्षण और स्नेह अलग-अलग दिशाओं में खींचने के बजाय साथ चलते हैं, और किसी बुरे हफ़्ते के बाद शारीरिक नज़दीकी आपके लिए सुलह का एक तरीक़ा भी बनती है।",
    warm:      "आकर्षण आता नहीं, बनता है। शुक्र और मंगल सहयोगी स्थिति में हैं, इसलिए चिंगारी अचानक नहीं, लगातार रहती है — शुरुआत में कम नाटकीय, और तीसरे साल में साफ़ तौर पर ज़्यादा टिकाऊ।",
    slow:      "आप उन लोगों में नहीं हैं जिनके लिए आकर्षण तुरंत होता है। आपकी कुंडली में शुक्र और मंगल अलग बैठे हैं, जिसका शास्त्रीय अर्थ है कि इच्छा नज़दीकी के पीछे चलती है, आगे नहीं। जिन लोगों की ओर पहले आप खिंचे नहीं थे, वे समय के साथ आपको आकर्षक लगने लगे होंगे — यह संयोग नहीं, यही आपका ढंग है।"
  }
};

/** How they deliver a sentence, and what happens to it in an argument. Mercury. */
export const COMMUNICATION = {
  en: {
    direct:     { label: "You say what you mean",
                  body: "You put the thing on the table. It saves enormous amounts of time and it lands hard on someone who needed a warm-up first." },
    practical:  { label: "You talk about what to do, not what you feel",
                  body: "Your instinct in a difficult conversation is to solve it. That is useful and it is not always what is wanted — sometimes the other person needs the feeling acknowledged before the plan arrives." },
    analytical: { label: "You want to understand it before you settle it",
                  body: "You examine a disagreement from several sides, which is genuinely fair-minded and can read as coldness to someone who is upset right now." },
    indirect:   { label: "You signal rather than state",
                  body: "You would rather hint than confront, and you expect a partner to notice. When they do not, the hurt is real and invisible to them. This is the single most fixable thing in your relationships." },
    blunt:      { label: "You are sharper than you intend to be",
                  body: "Mars touches Mercury in your chart, so your sentences come out faster and harder than you meant. You forget an argument in an hour; the other person is still holding the phrasing three days later." },
    measured:   { label: "You choose your words carefully",
                  body: "Saturn touches Mercury, so you say less than you think and you say it late. What you do say is considered and reliable. What goes unsaid can pile up quietly." },
    expansive:  { label: "You talk it all the way through",
                  body: "You explain, contextualise and reassure at length. It comes from generosity. It can also bury the one sentence that mattered." }
  },
  hi: {
    direct:     { label: "आप जो सोचते हैं, वही कहते हैं",
                  body: "आप बात सीधे सामने रख देते हैं। इससे बहुत समय बचता है, और जिसे पहले थोड़ी भूमिका चाहिए थी उस पर यह भारी पड़ता है।" },
    practical:  { label: "आप बात करते हैं कि करना क्या है, यह नहीं कि महसूस क्या हो रहा है",
                  body: "मुश्किल बातचीत में आपकी सहज प्रवृत्ति उसे हल करने की होती है। यह काम की बात है, पर हमेशा वही नहीं होती जो चाही जा रही हो — कभी-कभी सामने वाले को हल से पहले यह चाहिए कि उसकी भावना को स्वीकार किया जाए।" },
    analytical: { label: "आप निपटाने से पहले समझना चाहते हैं",
                  body: "आप असहमति को कई तरफ़ से देखते हैं। यह सचमुच निष्पक्ष रवैया है, और जो इसी वक़्त परेशान है उसे यह ठंडापन लग सकता है।" },
    indirect:   { label: "आप कहते नहीं, इशारा करते हैं",
                  body: "टकराव के बजाय आप संकेत देना पसंद करते हैं, और उम्मीद रखते हैं कि साथी समझ जाएगा। जब वह नहीं समझता, चोट असली होती है और उसे दिखती तक नहीं। आपके रिश्तों में सबसे आसानी से ठीक होने वाली बात यही है।" },
    blunt:      { label: "आप जितना चाहते हैं, उससे तीखे निकल जाते हैं",
                  body: "आपकी कुंडली में मंगल बुध को छूता है, इसलिए वाक्य इरादे से ज़्यादा तेज़ और सख़्त निकलते हैं। आप झगड़ा एक घंटे में भूल जाते हैं; सामने वाला तीन दिन बाद भी वही शब्द पकड़े बैठा होता है।" },
    measured:   { label: "आप शब्द सोच-समझकर चुनते हैं",
                  body: "शनि बुध को छूता है, इसलिए आप सोचते ज़्यादा हैं, कहते कम, और देर से कहते हैं। जो आप कहते हैं वह सोचा-समझा और भरोसेमंद होता है। जो नहीं कहा जाता, वह चुपचाप जमा होता रहता है।" },
    expansive:  { label: "आप पूरी बात खोलकर करते हैं",
                  body: "आप समझाते हैं, संदर्भ देते हैं, आश्वस्त करते हैं — लंबा। यह उदारता से आता है। और कभी-कभी इसी में वह एक वाक्य दब जाता है जो असल में मायने रखता था।" }
  }
};

/**
 * Friction, always as three parts: what sets it off, how it shows, what helps.
 * A warning with no next step is just anxiety.
 */
export const TRIGGERS = {
  en: {
    heat:         { t: "Heat that arrives before thought",
                    s: "A small disagreement escalates in under a minute, and both of you are surprised by how fast it got there.",
                    h: "Name the pattern out loud when you are calm, and agree that either of you may call a twenty-minute pause without it counting as walking away." },
    distance:     { t: "Going quiet instead of going in",
                    s: "When things are heavy, you get formal and correct rather than warm, and the room gets colder without anything being said.",
                    h: "Say the sentence “I need a bit of time, I am not leaving.” It costs nothing and it removes the fear that the silence is a verdict." },
    insecurity:   { t: "A need to know where you stand",
                    s: "Ambiguity is unbearable, so you check, re-read, and ask again — and the asking itself starts to feel like the problem.",
                    h: "Ask for a rhythm rather than reassurance: a fixed time each week where the two of you actually talk about the relationship, so it does not have to be asked for." },
    silence:      { t: "Withdrawing mid-argument",
                    s: "You stop talking to avoid saying something you cannot take back. The other person reads it as being shut out." },
    sharpWords:   { t: "The phrasing, not the point",
                    s: "You are usually right about the substance and wrong about the delivery, and the delivery is what gets remembered." },
    reassurance:  { t: "Needing it said again",
                    s: "You know you are loved and you still need to hear it, and asking repeatedly makes you feel small." },
    ego:          { t: "Neither of you conceding",
                    s: "A disagreement stops being about the thing and becomes about who gives way first." },
    dailyFriction:{ t: "The small stuff",
                    s: "Not one big issue but a steady drip of chores, timings and logistics." }
  },
  hi: {
    heat:         { t: "सोच से पहले आ जाने वाली गर्मी",
                    s: "छोटी-सी असहमति एक मिनट से कम में बढ़ जाती है, और दोनों हैरान रह जाते हैं कि बात इतनी जल्दी यहाँ कैसे पहुँची।",
                    h: "शांत मन से इस पैटर्न को नाम दीजिए, और यह तय कीजिए कि दोनों में से कोई भी बीस मिनट का विराम माँग सकता है — और उसे छोड़कर जाना नहीं माना जाएगा।" },
    distance:     { t: "अंदर जाने के बजाय चुप हो जाना",
                    s: "जब बात भारी होती है, आप गर्मजोशी के बजाय औपचारिक और सही हो जाते हैं, और बिना कुछ कहे कमरा ठंडा पड़ जाता है।",
                    h: "यह वाक्य कह दीजिए — “मुझे थोड़ा समय चाहिए, मैं जा नहीं रहा/रही।” इसमें कुछ नहीं लगता, और यह डर हट जाता है कि यह चुप्पी कोई फ़ैसला है।" },
    insecurity:   { t: "यह जानने की ज़रूरत कि आप कहाँ खड़े हैं",
                    s: "अनिश्चितता असहनीय लगती है, इसलिए आप जाँचते हैं, दोबारा पढ़ते हैं, फिर पूछते हैं — और पूछना ही समस्या जैसा लगने लगता है।",
                    h: "आश्वासन के बजाय एक लय माँगिए: हफ़्ते में एक तय समय जब आप दोनों सचमुच रिश्ते पर बात करें, ताकि उसे माँगना न पड़े।" },
    silence:      { t: "बहस के बीच में हट जाना",
                    s: "आप बोलना बंद कर देते हैं ताकि कुछ ऐसा न निकल जाए जो वापस न लिया जा सके। सामने वाला इसे दरवाज़ा बंद करना समझता है।" },
    sharpWords:   { t: "बात नहीं, कहने का ढंग",
                    s: "मुद्दे पर आप आमतौर पर सही होते हैं और कहने के ढंग पर ग़लत — और याद ढंग ही रह जाता है।" },
    reassurance:  { t: "दोबारा सुनने की ज़रूरत",
                    s: "आप जानते हैं कि आपसे प्यार है, फिर भी सुनना ज़रूरी लगता है, और बार-बार पूछना आपको ख़ुद छोटा महसूस कराता है।" },
    ego:          { t: "दोनों में से कोई न झुके",
                    s: "असहमति मुद्दे की नहीं रह जाती, यह हो जाती है कि पहले कौन झुकेगा।" },
    dailyFriction:{ t: "छोटी-छोटी बातें",
                    s: "कोई एक बड़ा मुद्दा नहीं, बल्कि काम, समय और इंतज़ाम की लगातार टपकती बूँदें।" }
  }
};

/** Generic repair advice, used when a trigger has no bespoke `h`. */
export const TRIGGER_HELP = {
  en: {
    silence:      "Agree in advance what a pause means, and put a time on it. “Give me an hour” is a promise; walking out is not.",
    sharpWords:   "Slow the first sentence down. You are not wrong often; you are simply fast, and one deliberate breath before speaking changes most of it.",
    reassurance:  "Tell a partner plainly that you need it said sometimes. Almost nobody minds. What they mind is guessing.",
    ego:          "Separate being right from being heard. You can concede the argument and still keep the point.",
    dailyFriction:"Decide the recurring things once — who does what, and when — so they stop being negotiated weekly."
  },
  hi: {
    silence:      "पहले से तय कीजिए कि विराम का मतलब क्या है, और उस पर समय लगाइए। “मुझे एक घंटा दीजिए” एक वादा है; उठकर चले जाना नहीं।",
    sharpWords:   "पहला वाक्य धीमा कीजिए। आप अक्सर ग़लत नहीं होते, बस तेज़ होते हैं — और बोलने से पहले एक सोची हुई साँस अधिकांश चीज़ें बदल देती है।",
    reassurance:  "साथी से साफ़ कह दीजिए कि आपको कभी-कभी सुनना ज़रूरी लगता है। लगभग किसी को इससे दिक़्क़त नहीं होती। दिक़्क़त अंदाज़ा लगाने से होती है।",
    ego:          "सही होने और सुने जाने को अलग कीजिए। आप बहस छोड़ भी सकते हैं और बात रख भी सकते हैं।",
    dailyFriction:"बार-बार आने वाली चीज़ें एक बार तय कर लीजिए — कौन क्या करेगा और कब — ताकि हर हफ़्ते उन पर मोलभाव न हो।"
  }
};

/** What is working. Positively framed, and specific enough to be believed. */
export const STRENGTHS = {
  en: {
    partnership:  "The seventh house — the house of committed partnership — is well set in your chart. Whatever else is difficult, being in a relationship suits you; you are not someone who does better alone.",
    protection:   "Jupiter's aspect falls on your house of marriage. Classically this is the single most protective placement a relationship can have: it does not prevent trouble, it tends to bring help when trouble arrives.",
    affection:    "Venus is strong in your chart. Affection is something you have plenty of and give easily, and people generally feel warmer around you than you realise.",
    warmth:       "You are generous in a relationship without keeping score, which is rarer than it sounds and is usually the reason people stay.",
    reliability:  "You are dependable in the small daily ways that actually hold a household together. Grand gestures are not the point; being reachable is.",
    loyalty:      "Loyalty is not a decision you have to renew. Once you are committed you stay, and a partner can feel that quite early.",
    spark:        "There is genuine physical warmth in this chart. Attraction is not something you will have to work at.",
    plainSpeaking:"You say things rather than storing them, so problems in your relationships tend to get aired while they are still small.",
    talking:      "You are willing to have the conversation. A great many relationships fail purely because nobody would, and that is not your failure mode.",
    family:       "Your second house is strong, so family life around a relationship tends to settle rather than strain. In-laws and household are more likely to be a support than a battleground.",
    romance:      "The fifth house is well placed — courtship, romance and play come naturally to you, and they do not disappear once a relationship becomes ordinary.",
    navamsaVenus: "Venus is dignified in your navamsa, the divisional chart classically read for marriage. Whatever the early years look like, the marriage chart itself is sound.",
    consistency:  "A planet in your chart is vargottama — the same sign in the birth chart and the marriage chart. Classically this means what you are in courtship is what you are in marriage. There is no second version of you waiting.",
    steadiness:   "Your Moon is strong. You are emotionally more stable than most, and you are the one people steady themselves against.",
    constancy:    "You do not run hot and cold. A partner always knows which version of you they are getting, and that is worth more than intensity.",
    doshaCancelled:"Your chart carries manglik dosha, but it also carries the classical cancellation for it. This matters practically: it is the objection most often raised at a match, and the answer is already in your chart.",
    selfAwareness:"This is not an easy chart for relationships, and you probably already know that. Knowing it is itself the strength — most of the difficulty here responds to being seen clearly."
  },
  hi: {
    partnership:  "आपकी कुंडली में सप्तम भाव — साथ का भाव — अच्छी स्थिति में है। बाक़ी जो भी मुश्किल हो, रिश्ते में रहना आपको सूट करता है; आप उन लोगों में नहीं हैं जो अकेले बेहतर रहते हैं।",
    protection:   "आपके विवाह भाव पर गुरु की दृष्टि है। शास्त्रीय रूप से किसी रिश्ते के लिए यह सबसे रक्षक स्थिति मानी जाती है: यह मुश्किल रोकती नहीं, पर मुश्किल आने पर मदद ले आती है।",
    affection:    "आपकी कुंडली में शुक्र बलवान है। स्नेह आपके पास भरपूर है और आप उसे सहजता से देते हैं — लोग आपके आसपास आपकी सोच से ज़्यादा गर्माहट महसूस करते हैं।",
    warmth:       "आप रिश्ते में हिसाब रखे बिना उदार होते हैं। यह सुनने में जितना आम लगता है उतना है नहीं, और आमतौर पर लोग इसी वजह से टिकते हैं।",
    reliability:  "रोज़मर्रा की जिन छोटी बातों से घर सचमुच चलता है, उनमें आप भरोसेमंद हैं। बड़े दिखावे की बात नहीं है; उपलब्ध होने की बात है।",
    loyalty:      "वफ़ादारी आपके लिए हर बार दोहराने वाला फ़ैसला नहीं है। एक बार जुड़ गए तो जुड़े रहते हैं, और साथी को यह काफ़ी जल्दी महसूस हो जाता है।",
    spark:        "इस कुंडली में असली शारीरिक गर्माहट है। आकर्षण आपको मेहनत से नहीं बनाना पड़ेगा।",
    plainSpeaking:"आप बातें जमा करने के बजाय कह देते हैं, इसलिए आपके रिश्तों में समस्याएँ छोटी रहते हुए ही सामने आ जाती हैं।",
    talking:      "आप बातचीत करने को तैयार रहते हैं। बहुत सारे रिश्ते सिर्फ़ इसलिए टूटते हैं कि कोई बात करने को तैयार नहीं था — यह आपकी कमज़ोरी नहीं है।",
    family:       "आपका द्वितीय भाव मज़बूत है, इसलिए रिश्ते के आसपास का पारिवारिक जीवन खिंचने के बजाय जमता है। ससुराल और घर लड़ाई का मैदान कम, सहारा ज़्यादा बनने की संभावना रखते हैं।",
    romance:      "पंचम भाव अच्छी स्थिति में है — प्रेम, रोमांस और खिलंदड़ापन आपके लिए सहज हैं, और रिश्ता सामान्य हो जाने पर भी ये ख़त्म नहीं होते।",
    navamsaVenus: "आपके नवांश में — जो विवाह के लिए पढ़ा जाने वाला वर्ग है — शुक्र सम्मानित स्थिति में है। शुरुआती साल जैसे भी दिखें, विवाह की कुंडली अपने आप में मज़बूत है।",
    consistency:  "आपकी कुंडली में एक ग्रह वर्गोत्तम है — जन्म कुंडली और विवाह कुंडली दोनों में एक ही राशि। शास्त्रीय अर्थ यह है कि प्रेम में आप जो हैं, विवाह में भी वही रहेंगे। आपका कोई दूसरा रूप छुपा नहीं बैठा है।",
    steadiness:   "आपका चंद्रमा बलवान है। आप भावनात्मक रूप से अधिकांश लोगों से ज़्यादा स्थिर हैं, और लोग आपके सहारे ख़ुद को सँभालते हैं।",
    constancy:    "आप कभी गर्म कभी ठंडे नहीं होते। साथी को हमेशा पता होता है कि उसे आपका कौन-सा रूप मिलेगा, और यह तीव्रता से ज़्यादा क़ीमती है।",
    doshaCancelled:"आपकी कुंडली में मंगल दोष है, पर उसका शास्त्रीय परिहार भी मौजूद है। व्यावहारिक रूप से यह मायने रखता है: रिश्ता तय करते समय सबसे ज़्यादा यही आपत्ति उठती है, और उसका उत्तर आपकी कुंडली में पहले से है।",
    selfAwareness:"रिश्तों के लिए यह आसान कुंडली नहीं है, और शायद आप यह जानते भी हैं। जानना ही अपने आप में ताक़त है — यहाँ की अधिकांश कठिनाई साफ़ देखे जाने पर हल्की हो जाती है।"
  }
};

/** What to watch. Never an accusation, always the reader's own pattern. */
export const GROWTH = {
  en: {
    drawnVsChosen:"You are drawn to one kind of person and you commit to another. Venus says what catches your eye; the seventh house says what you actually settle with, and in your chart they disagree. This is worth knowing before you decide someone is wrong for you — the person who excites you and the person who suits you may genuinely not be the same person, and the work is choosing knowingly rather than being surprised by it at thirty-four.",
    expectations: "The seventh house is under some strain, which classically shows up as expectations that were never spoken aloud and then went unmet. Almost all of this is fixable by saying the expectation.",
    pressure:     "There is more than one difficult planet in your house of partnership. Relationships are likely to feel like work more often than they feel effortless — not doomed, but genuinely requiring attention that other people do not have to give.",
    unspoken:     "Venus is combust in your chart — too close to the Sun to be seen. Classically this is the person who feels a great deal and shows a fraction of it. Your partner is probably not receiving what you think you are sending.",
    selfWorth:    "Venus is not comfortable in your chart, which often shows as accepting less than you would advise a friend to accept. Watch for the moment you start explaining away behaviour you would not tolerate on someone else's behalf.",
    reassurance:  "You need more reassurance than you would like to admit, and the not-admitting is the expensive part. Asked for plainly, it is a small thing; left unasked, it comes out as testing.",
    opening:      "Saturn's touch on your Moon means you open slowly. The cost is real: people move on while you are still deciding whether it is safe to be interested.",
    restlessness: "Your Moon sits in a restless house. Contentment can feel, wrongly, like something is missing — and the danger is looking for the problem in the relationship when it is in the temperament.",
    withdrawal:   "You go quiet when it matters most. To you it is self-control; from outside it is a door closing.",
    tone:         "Your delivery is sharper than your intent. The point survives; the phrasing is what gets quoted back to you.",
    pace:         "Things move fast physically and slower in every other way. Letting the rest catch up is the whole task.",
    intensity:    "Mars sits in the eighth house — depth, secrecy and intensity. Relationships rarely stay shallow for you, which is a gift and occasionally a weight.",
    temper:       "Your chart carries manglik dosha without a clear classical cancellation. In practice, the thing to manage is the speed at which a disagreement becomes heat, not the fact of the dosha.",
    privacy:      "The twelfth house is strained, which classically touches privacy and the private life of a marriage. Be deliberate about what stays between the two of you.",
    holdingTight: "Rahu touches your Moon, so attachment can tip into holding on. The grip is the thing to watch, not the feeling under it.",
    space:        "You need more room than most people do, and a partner can read that need as a verdict on them.",
    past:         "Venus is retrograde in your chart — the classical marker of returning to old attachments and re-examining them. Be honest about which door you are keeping open.",
    complacency:  "There is no obvious fault line here, which brings its own risk: relationships that are easy at the start are the ones people stop tending."
  },
  hi: {
    drawnVsChosen:"आप एक तरह के व्यक्ति की ओर खिंचते हैं और साथ किसी और के साथ निभाते हैं। शुक्र बताता है कि नज़र किस पर ठहरती है; सप्तम भाव बताता है कि आप असल में किसके साथ जमते हैं — और आपकी कुंडली में दोनों अलग हैं। किसी को अपने लिए ग़लत मान लेने से पहले यह जान लेना ज़रूरी है: जो आपको रोमांचित करता है और जो आपको सूट करता है, वे सचमुच एक व्यक्ति न हों — और काम यह है कि यह चुनाव जानते हुए किया जाए, चौंतीस की उम्र में चौंककर नहीं।",
    expectations: "सप्तम भाव पर कुछ दबाव है, जो शास्त्रीय रूप से उन अपेक्षाओं के रूप में दिखता है जो कभी बोली नहीं गईं और फिर पूरी नहीं हुईं। इसका लगभग पूरा हिस्सा अपेक्षा कह देने भर से ठीक हो जाता है।",
    pressure:     "आपके साथ के भाव में एक से ज़्यादा कठिन ग्रह हैं। रिश्ते सहज लगने के बजाय मेहनत जैसे लगने की संभावना ज़्यादा है — टूटे हुए नहीं, पर सचमुच उतना ध्यान माँगते हुए जितना दूसरों को नहीं देना पड़ता।",
    unspoken:     "आपकी कुंडली में शुक्र अस्त है — सूर्य के इतने पास कि दिखाई न दे। शास्त्रीय रूप से यह वह व्यक्ति है जो बहुत महसूस करता है और उसका थोड़ा-सा दिखाता है। आपका साथी शायद वह नहीं पा रहा जो आपको लगता है कि आप भेज रहे हैं।",
    selfWorth:    "आपकी कुंडली में शुक्र सहज नहीं है, जो अक्सर इस रूप में दिखता है कि आप उससे कम स्वीकार कर लेते हैं जितना आप किसी दोस्त को स्वीकार करने की सलाह देते। उस पल पर ध्यान दीजिए जब आप ऐसे व्यवहार के लिए सफ़ाई देने लगें जिसे किसी और के लिए आप बर्दाश्त न करते।",
    reassurance:  "आपको उससे ज़्यादा आश्वासन चाहिए जितना आप मानना चाहेंगे, और महँगा हिस्सा न मानना ही है। साफ़ माँग लिया जाए तो यह छोटी बात है; न माँगा जाए तो यह परखने के रूप में बाहर आता है।",
    opening:      "आपके चंद्रमा पर शनि का स्पर्श है, इसलिए आप देर से खुलते हैं। इसकी क़ीमत असली है: जब तक आप तय कर रहे होते हैं कि दिलचस्पी लेना सुरक्षित है या नहीं, लोग आगे बढ़ चुके होते हैं।",
    restlessness: "आपका चंद्रमा बेचैन भाव में है। संतोष ग़लती से ऐसा लग सकता है जैसे कुछ छूट रहा हो — और ख़तरा यह है कि आप समस्या रिश्ते में ढूँढने लगें जबकि वह स्वभाव में है।",
    withdrawal:   "जब सबसे ज़्यादा ज़रूरत होती है, तब आप चुप हो जाते हैं। आपके लिए यह संयम है; बाहर से यह दरवाज़ा बंद होना है।",
    tone:         "आपका कहने का ढंग इरादे से तीखा है। बात बच जाती है; लौटकर आपको ढंग सुनाया जाता है।",
    pace:         "शारीरिक रूप से चीज़ें तेज़ चलती हैं और बाक़ी हर तरह से धीमी। बाक़ी को पकड़ने का मौक़ा देना ही पूरा काम है।",
    intensity:    "मंगल अष्टम भाव में है — गहराई, गोपनीयता और तीव्रता। आपके रिश्ते शायद ही कभी सतही रह पाते हैं, जो एक वरदान है और कभी-कभी बोझ भी।",
    temper:       "आपकी कुंडली में मंगल दोष है और उसका स्पष्ट शास्त्रीय परिहार नहीं है। व्यवहार में सँभालने वाली चीज़ दोष होना नहीं, बल्कि वह रफ़्तार है जिससे असहमति गर्मी बन जाती है।",
    privacy:      "द्वादश भाव दबाव में है, जो शास्त्रीय रूप से निजता और वैवाहिक जीवन के निजी हिस्से को छूता है। यह तय रखिए कि क्या सिर्फ़ आप दोनों के बीच रहेगा।",
    holdingTight: "राहु आपके चंद्रमा को छूता है, इसलिए जुड़ाव पकड़ में बदल सकता है। ध्यान पकड़ पर देना है, उसके नीचे की भावना पर नहीं।",
    space:        "आपको अधिकांश लोगों से ज़्यादा जगह चाहिए, और साथी इस ज़रूरत को अपने ऊपर फ़ैसला समझ सकता है।",
    past:         "आपकी कुंडली में शुक्र वक्री है — पुराने लगावों की ओर लौटने और उन्हें दोबारा जाँचने का शास्त्रीय संकेत। इस बारे में ईमानदार रहिए कि आप कौन-सा दरवाज़ा खुला रखे हुए हैं।",
    complacency:  "यहाँ कोई स्पष्ट दरार नहीं दिखती, और इसका अपना ख़तरा है: जो रिश्ते शुरू में आसान होते हैं, लोग उन्हीं की देखभाल करना छोड़ देते हैं।"
  }
};

export function lovePack(language) {
  const L = language === "hi" ? "hi" : "en";
  return {
    attachment: (k) => ATTACHMENT[L][k] || ATTACHMENT[L].steady,
    expression: (k) => EXPRESSION[L][k] || EXPRESSION[L].practical,
    draw: (k) => DRAW[L][k] || k,
    chemistry: (k) => CHEMISTRY[L][k] || CHEMISTRY[L].warm,
    communication: (k) => COMMUNICATION[L][k] || COMMUNICATION[L].practical,
    trigger: (k) => TRIGGERS[L][k],
    triggerHelp: (k) => TRIGGERS[L][k]?.h || TRIGGER_HELP[L][k] || "",
    strength: (k) => STRENGTHS[L][k],
    growth: (k) => GROWTH[L][k]
  };
}
