// ─────────────────────────────────────────────────────────────────────────────
// Couples Challenge — every sentence the book prints, in both languages.
//
// This file IS the product. The other three files in this report are wiring;
// none of them decides whether anyone finishes the thirty days or tells a
// friend. If a question here is bland, no amount of typesetting saves it.
//
// Three rules the questions follow, and the reason for each:
//
//   1. A question names something specific, never a category. "What was the
//      exact moment you knew?" gets an answer; "How did you fall in love?"
//      gets a summary of a story both people already know.
//   2. Every day carries ONE tiny action. The question starts a conversation;
//      the action is what makes it leave the page and become a memory. A day
//      without an action is a day that gets read and forgotten.
//   3. Week 3 asks the hard things, so Week 3 pages carry a `guard` line — an
//      instruction to the listener, printed before the question is answered.
//      A hard question without a rule for listening is how a gift becomes a
//      fight, and this product cannot afford that.
//
// The `you` in these questions is deliberately ambiguous in English and formal
// (आप) in Hindi. Odd-numbered days are addressed to partner 1 and even to
// partner 2 by the mapper, so ADDRESSEE resolves to a real name on the page.
// ─────────────────────────────────────────────────────────────────────────────

/** The four weeks, plus the two closing days. Day → week is derived from this. */
export const WEEKS = [
  { n: 1, from: 1,  to: 7,  key: "reconnect" },
  { n: 2, from: 8,  to: 14, key: "understand" },
  { n: 3, from: 15, to: 21, key: "hard" },
  { n: 4, from: 22, to: 28, key: "dream" },
  // Days 29 and 30 belong to no theme on purpose: the last two days are about
  // the two of them, not about a subject. They lead into the certificate.
  { n: 5, from: 29, to: 30, key: "closing" }
];

export const weekOf = (day) => WEEKS.find((w) => day >= w.from && day <= w.to);

const EN = {
  seriesTitle: "30 Days, 30 Questions",
  seriesSubtitle: "A personalised love challenge, made for the two of you",
  since: (when) => `Since ${when}`,
  runningHeader: (couple, day) => `${couple} · Day ${day} of 30`,
  and: "&",

  weeks: {
    reconnect:  { title: "Reconnect & Remember Us",            note: "Start where it is easy. This week is only about remembering out loud." },
    understand: { title: "Understand Each Other Better",       note: "Less history, more mechanics. How each of you actually works." },
    hard:       { title: "Talk About the Hard (But Safe) Stuff", note: "The week that earns the other three. Read the listening rule on every page — it is not decoration." },
    dream:      { title: "Dream, Plan, and Deepen Intimacy",   note: "Forward-facing. What you are building, and what you want more of." },
    closing:    { title: "The Last Two Days",                  note: "No theme. Just the two of you, looking back at the month." }
  },

  gift:      { eyebrow: (couple) => `A gift for ${couple}`, from: (who) => `— from ${who}` },
  writeLine: "Space to write, if you want to",
  actionLabel: "Today's tiny action",
  guardLabel: "Before you begin",

  welcome: {
    title: (couple) => `${couple} — this is yours.`,
    body: [
      "For the next thirty days, you have one question a day and one small thing to do. That is all. No scores, no homework, nothing to get right.",
      "Some questions take two minutes. Some will take the whole evening, and those are usually the ones worth having. Answer out loud if you can — reading an answer is not the same as hearing it.",
      "Miss a day and nothing breaks. Pick it up the next evening. The point was never the streak.",
      "One rule, and it matters most in Week 3: whoever is listening, listens all the way to the end before replying."
    ]
  },

  checkIn: {
    title: (n) => `Week ${n} — Check-in`,
    intro: "Answer these separately, then read them to each other.",
    prompts: [
      "Which day this week did you think about afterwards?",
      "What did you learn that you did not already know?",
      "One thing your partner did this week that you noticed and did not say out loud.",
      "Say it now."
    ],
    columns: (a, b) => `${a} ______________   ·   ${b} ______________`
  },

  certificate: {
    title: "Thirty days.",
    line: (couple) => `${couple} finished the 30-day challenge together.`,
    body: [
      "You asked each other thirty questions. Some were easy. At least one was not, and you asked it anyway — that is the part worth keeping.",
      "Nothing here expires. Turn back to any day whenever the house gets quiet."
    ],
    footer: (since, today) => [since, `Completed ${today}`].filter(Boolean).join(" · ")
  },

  days: {
    1:  { q: "What was the exact moment you knew?", f: "Not the first date. The moment underneath it — when something quietly settled and you stopped wondering.", a: "Tell each other where you were standing. The room, the light, the time of day." },
    2:  { q: "What is a small thing I do that you have never told me you like?", f: "Not the big things. The habit you would miss without being able to explain why.", a: "Say it out loud today, once." },
    3:  { q: "Which photograph of us would you keep, if you could keep only one?", f: "Not the best one. The one you would actually choose.", a: "Find it. Look at it together for a full minute." },
    4:  { q: "What did you think of me in the first week, honestly?", f: "Before you decided anything. The first read.", a: "No editing. Say the unflattering part too." },
    5:  { q: "Which place we have been to would you go back to tomorrow?", f: "Somewhere you have already been, not somewhere you want to go.", a: "Put a date on the calendar. Any date. It can move." },
    6:  { q: "What is something we used to do that we quietly stopped doing?", f: "Nothing dramatic. The thing that fell off without either of you deciding.", a: "Do it this week. Doing it badly counts." },
    7:  { q: "When in the last year did you feel closest to me?", f: "A specific evening, not a period.", a: "Recreate one small part of that evening tonight." },

    8:  { q: "How do you know when I am not okay, before I say it?", f: "You already know. This is asking you to say how.", a: "Name the exact tell." },
    9:  { q: "When you are upset, do you want space or company?", f: "Most fights about comfort are really this question, unasked.", a: "Agree on one word that means 'the other one, please'." },
    10: { q: "What did love look like in your family — and did you want that?", f: "How the adults around you did it, not how they described it.", a: "Name one thing you kept, and one you left behind." },
    11: { q: "What makes you feel most appreciated — words, time, or something done for you?", f: "There is usually one that lands and two that do not.", a: "Give the other one exactly that, today." },
    12: { q: "Which part of your day do you most wish I asked about?", f: "The part you would talk about if anybody asked.", a: "Ask about it tomorrow, unprompted." },
    13: { q: "What do you think I worry about that I never mention?", f: "Guess. Being wrong is useful here too.", a: "Guess first. Then be corrected." },
    14: { q: "What is one thing about you that I still misread?", f: "Something you have explained before and it did not land.", a: "Explain it once more, patiently. Last time." },

    15: { q: "What is something you have wanted to say for a while, and haven't?", f: "Not an accusation. A thing you have been carrying quietly, because the moment never seemed right.", a: "Swap tomorrow — this question belongs to both of you.", g: "Your only job is to listen, then say one sentence back: what you heard. Not what you think about it." },
    16: { q: "What is the argument we keep having in different clothes?", f: "The one that is never really about the dishes.", a: "Name it. Give it a short, slightly silly name you can both use later.", g: "Describe the pattern, not the last time it happened. No examples with dates." },
    17: { q: "When we fight, what do you need from me in the first ten minutes?", f: "The first ten minutes decide the next two hours.", a: "Write both answers somewhere you will actually see them.", g: "Answer for yourself only. Do not answer on the other's behalf." },
    18: { q: "Is there something you gave up for us that you still miss?", f: "It does not have to be anyone's fault to still be true.", a: "Ask what a small piece of it could look like now.", g: "This is not a request for an apology. Do not offer one." },
    19: { q: "Where do you feel alone even when I am in the room?", f: "The loneliness that has nothing to do with distance.", a: "Sit with it. Tomorrow is soon enough to do something about it.", g: "No fixing today. No solutions, no plans. Only listening." },
    20: { q: "What is something you have forgiven me for without ever telling me?", f: "You let it go. This is just saying that you did.", a: "Say thank you. That is the whole action.", g: "Receive it without explaining yourself. The explanation is not the point today." },
    21: { q: "What would you want me to do differently, if you knew for certain I would not take it badly?", f: "The thing you soften every time you nearly say it.", a: "Pick one. Only one. Start this week.", g: "Take it as information, not as a verdict. You asked." },

    22: { q: "What do you want our ordinary Tuesday to look like in five years?", f: "Not the holidays. The Tuesday.", a: "Describe the morning, not the milestones." },
    23: { q: "What is one thing you want us to be brave about?", f: "Something you have both been circling for a while.", a: "Say the first step out loud, however small." },
    24: { q: "What makes you feel wanted — not loved, wanted?", f: "They are different, and only one of them is usually being said.", a: "Be specific. Vague answers help nobody." },
    25: { q: "What is something you want to try together that you have never asked for?", f: "Anywhere in the relationship. Not only in bed.", a: "Ask now. 'Not yet' is a complete answer." },
    26: { q: "What would you like more of, and what would you like less of?", f: "One of each. This is a trade, not a complaint.", a: "Say both. Then agree on one change each." },
    27: { q: "What is a promise you would make me today that you did not make at the start?", f: "You know more now than you did then.", a: "Write it down. Both of you. Keep the paper." },
    28: { q: "How do you want to be loved when you are old and difficult?", f: "You will be. So will they.", a: "Answer seriously first. Then laugh about it." },

    29: { q: "What changed in these thirty days?", f: "Something did, even if it is small and hard to name.", a: "Answer separately, then read both answers aloud." },
    30: { q: "Which question do you want to ask me again a year from now?", f: "Pick one from these thirty. There is usually an obvious one.", a: "Set a reminder for that date. Today, before you close this book." }
  }
};

const HI = {
  seriesTitle: "30 दिन, 30 सवाल",
  seriesSubtitle: "सिर्फ़ आप दोनों के लिए बनी एक प्रेम चुनौती",
  since: (when) => `${when} से`,
  runningHeader: (couple, day) => `${couple} · दिन ${day} / 30`,
  and: "और",

  weeks: {
    reconnect:  { title: "फिर से जुड़ें — हमें याद कीजिए",        note: "शुरुआत वहीं से जहाँ आसान है। यह हफ़्ता सिर्फ़ बोलकर याद करने का है।" },
    understand: { title: "एक-दूजे को बेहतर समझें",                note: "कम इतिहास, ज़्यादा तरीक़ा। आप दोनों असल में चलते कैसे हैं।" },
    hard:       { title: "मुश्किल बातें — सुरक्षित तरीक़े से",      note: "यही हफ़्ता बाक़ी तीनों को सार्थक बनाता है। हर पन्ने पर सुनने का नियम लिखा है — वह सजावट नहीं है।" },
    dream:      { title: "सपने, योजना और नज़दीकी",                note: "आगे की ओर। आप क्या बना रहे हैं, और क्या और चाहिए।" },
    closing:    { title: "आख़िरी दो दिन",                        note: "कोई विषय नहीं। बस आप दोनों, बीते महीने को देखते हुए।" }
  },

  gift:      { eyebrow: (couple) => `${couple} के लिए एक तोहफ़ा`, from: (who) => `— ${who} की ओर से` },
  writeLine: "चाहें तो यहाँ लिखिए",
  actionLabel: "आज का छोटा काम",
  guardLabel: "शुरू करने से पहले",

  welcome: {
    title: (couple) => `${couple} — यह आपकी है।`,
    body: [
      "अगले तीस दिन, रोज़ एक सवाल और एक छोटा-सा काम। बस इतना। कोई नंबर नहीं, कोई होमवर्क नहीं, कुछ भी 'सही' करने का दबाव नहीं।",
      "कुछ सवाल दो मिनट लेंगे। कुछ में पूरी शाम निकल जाएगी — और अक्सर वही सबसे क़ीमती होते हैं। हो सके तो बोलकर जवाब दीजिए; पढ़ लेना और सुन लेना एक बात नहीं है।",
      "कोई दिन छूट जाए तो कुछ नहीं बिगड़ता। अगली शाम उठा लीजिए। बात कभी लगातार गिनती की थी ही नहीं।",
      "एक नियम, और तीसरे हफ़्ते में यह सबसे ज़रूरी है: जो सुन रहा है, वह जवाब देने से पहले पूरी बात सुनेगा।"
    ]
  },

  checkIn: {
    title: (n) => `सप्ताह ${n} — समीक्षा`,
    intro: "इनके जवाब अलग-अलग लिखिए, फिर एक-दूसरे को पढ़कर सुनाइए।",
    prompts: [
      "इस हफ़्ते का कौन-सा दिन बाद में भी याद आता रहा?",
      "ऐसा क्या पता चला जो पहले से मालूम नहीं था?",
      "इस हफ़्ते साथी ने कुछ ऐसा किया जो आपने देखा पर कहा नहीं।",
      "अब कह दीजिए।"
    ],
    columns: (a, b) => `${a} ______________   ·   ${b} ______________`
  },

  certificate: {
    title: "तीस दिन पूरे।",
    line: (couple) => `${couple} ने यह 30-दिन की चुनौती साथ में पूरी की।`,
    body: [
      "आपने एक-दूसरे से तीस सवाल पूछे। कुछ आसान थे। कम-से-कम एक आसान नहीं था, और आपने फिर भी पूछा — असली बात वही है।",
      "यह कहीं ख़त्म नहीं होता। जब भी घर में सन्नाटा हो, किसी भी दिन पर लौट आइए।"
    ],
    footer: (since, today) => [since, `पूरा हुआ ${today}`].filter(Boolean).join(" · ")
  },

  days: {
    1:  { q: "वह ठीक कौन-सा पल था जब आपको यक़ीन हो गया?", f: "पहली मुलाक़ात नहीं। उसके नीचे वाला पल — जब कुछ चुपचाप जम गया और सवाल पूछना बंद हो गया।", a: "एक-दूसरे को बताइए कि आप उस वक़्त कहाँ खड़े थे। कमरा, रोशनी, दिन का कौन-सा समय।" },
    2:  { q: "मेरी कौन-सी छोटी आदत आपको अच्छी लगती है, जो आपने कभी बताई नहीं?", f: "बड़ी बातें नहीं। वह आदत जिसकी कमी खलेगी, पर वजह बताना मुश्किल होगा।", a: "आज एक बार बोलकर कह दीजिए।" },
    3:  { q: "हमारी कौन-सी एक तस्वीर रखते, अगर सिर्फ़ एक ही रख सकते?", f: "सबसे अच्छी नहीं। वह जो आप सच में चुनते।", a: "उसे ढूँढिए। पूरे एक मिनट साथ में देखिए।" },
    4:  { q: "पहले हफ़्ते मेरे बारे में सच में क्या सोचा था?", f: "कुछ तय करने से पहले। पहली राय।", a: "बिना छाँटे बताइए। खटकने वाली बात भी।" },
    5:  { q: "हम जहाँ-जहाँ गए, उनमें से कहाँ कल ही दोबारा चले जाएँ?", f: "जहाँ जा चुके हैं, वहाँ — जहाँ जाना है वहाँ नहीं।", a: "कैलेंडर पर एक तारीख़ लिख दीजिए। कोई भी। बदली जा सकती है।" },
    6:  { q: "ऐसा क्या था जो हम करते थे और चुपचाप छूट गया?", f: "कुछ बड़ा नहीं। वह जो बिना किसी के तय किए छूट गया।", a: "इसी हफ़्ते कीजिए। ठीक-ठाक हो तो भी गिना जाएगा।" },
    7:  { q: "पिछले साल कब आपको मेरे सबसे ज़्यादा नज़दीक होना महसूस हुआ?", f: "कोई एक शाम बताइए, कोई दौर नहीं।", a: "आज रात उस शाम का एक छोटा हिस्सा दोहराइए।" },

    8:  { q: "मेरे कहने से पहले आपको कैसे पता चल जाता है कि मैं ठीक नहीं हूँ?", f: "आपको पता है। यह सवाल बस यह पूछ रहा है कि कैसे।", a: "वह निशानी ठीक-ठीक बताइए।" },
    9:  { q: "परेशान होने पर आपको अकेली जगह चाहिए या किसी का साथ?", f: "दिलासे को लेकर होने वाले ज़्यादातर झगड़े असल में यही सवाल हैं, बिना पूछे।", a: "एक शब्द तय कीजिए जिसका मतलब हो — 'दूसरा वाला, प्लीज़'।" },
    10: { q: "आपके घर में प्यार कैसा दिखता था — और क्या आप वैसा चाहते थे?", f: "बड़ों ने जैसा किया, वैसा — जैसा बताया वैसा नहीं।", a: "एक चीज़ बताइए जो आपने रखी, और एक जो छोड़ दी।" },
    11: { q: "आपको सबसे ज़्यादा क़दर कब महसूस होती है — शब्दों से, वक़्त से, या किसी काम से?", f: "आम तौर पर एक ही असर करता है, दो नहीं।", a: "आज ठीक वही दीजिए, जो उन्होंने बताया।" },
    12: { q: "आपके दिन का कौन-सा हिस्सा है जिसके बारे में आप चाहते हैं कि मैं पूछूँ?", f: "वह हिस्सा जिस पर आप बोलते, अगर कोई पूछता।", a: "कल बिना याद दिलाए, ख़ुद पूछिए।" },
    13: { q: "आपको क्या लगता है, मैं किस बात से डरता/डरती हूँ जो कभी कहता/कहती नहीं?", f: "अंदाज़ा लगाइए। यहाँ ग़लत होना भी काम का है।", a: "पहले अंदाज़ा लगाइए। फिर सुधार सुनिए।" },
    14: { q: "आपके बारे में ऐसी कौन-सी बात है जो मैं अब भी ग़लत समझता/समझती हूँ?", f: "जो आप पहले भी समझा चुके हैं और बात बनी नहीं।", a: "एक बार और, इत्मीनान से समझाइए। आख़िरी बार।" },

    15: { q: "ऐसी कौन-सी बात है जो आप बहुत दिनों से कहना चाहते हैं, और कह नहीं पाए?", f: "कोई इल्ज़ाम नहीं। वह बात जो आप चुपचाप उठाए घूम रहे हैं, क्योंकि सही मौक़ा कभी लगा ही नहीं।", a: "कल अदला-बदली — यह सवाल दोनों का है।", g: "आपका सिर्फ़ एक काम है: सुनना, फिर एक वाक्य में बताना कि आपने क्या सुना। अपनी राय नहीं।" },
    16: { q: "वह कौन-सी बहस है जो हर बार नए रूप में लौट आती है?", f: "वह जो असल में कभी बर्तनों को लेकर होती ही नहीं।", a: "उसे एक छोटा, थोड़ा मज़ाकिया नाम दीजिए जो आगे दोनों इस्तेमाल कर सकें।", g: "तरीक़ा बताइए, पिछली बार का क़िस्सा नहीं। तारीख़ों वाले उदाहरण नहीं।" },
    17: { q: "झगड़े के पहले दस मिनट में आपको मुझसे क्या चाहिए?", f: "पहले दस मिनट अगले दो घंटे तय कर देते हैं।", a: "दोनों जवाब कहीं ऐसी जगह लिखिए जहाँ सच में नज़र पड़े।", g: "सिर्फ़ अपने लिए जवाब दीजिए। दूसरे की तरफ़ से नहीं।" },
    18: { q: "क्या कुछ ऐसा है जो आपने हमारे लिए छोड़ा और अब भी याद आता है?", f: "किसी की ग़लती न हो, फिर भी बात सच हो सकती है।", a: "पूछिए — उसका एक छोटा हिस्सा अब कैसा दिख सकता है।", g: "यह माफ़ी की माँग नहीं है। माफ़ी मत माँगिए।" },
    19: { q: "कहाँ आपको मेरे कमरे में होते हुए भी अकेलापन लगता है?", f: "वह अकेलापन जिसका दूरी से कोई लेना-देना नहीं।", a: "आज बस उसके साथ बैठिए। कुछ करने के लिए कल भी है।", g: "आज कुछ ठीक नहीं करना। न हल, न योजना। सिर्फ़ सुनना।" },
    20: { q: "ऐसा क्या है जो आपने मुझे बताए बिना माफ़ कर दिया?", f: "आपने जाने दिया। यह बस इतना कहना है कि जाने दिया।", a: "शुक्रिया कहिए। बस इतना ही काम है।", g: "बिना सफ़ाई दिए सुन लीजिए। आज सफ़ाई की बात नहीं है।" },
    21: { q: "अगर पक्का हो कि मैं बुरा नहीं मानूँगा/मानूँगी — तो आप क्या बदलवाना चाहेंगे?", f: "वह बात जिसे आप कहते-कहते हर बार नरम कर देते हैं।", a: "एक चुनिए। सिर्फ़ एक। इसी हफ़्ते शुरू।", g: "इसे जानकारी समझिए, फ़ैसला नहीं। पूछा आपने ही था।" },

    22: { q: "पाँच साल बाद हमारा एक आम मंगलवार कैसा हो?", f: "छुट्टियाँ नहीं। मंगलवार।", a: "सुबह का हाल बताइए, उपलब्धियाँ नहीं।" },
    23: { q: "किस बात में आप चाहते हैं कि हम हिम्मत दिखाएँ?", f: "कुछ ऐसा जिसके इर्द-गिर्द आप दोनों काफ़ी दिनों से घूम रहे हैं।", a: "पहला क़दम बोलकर कहिए, चाहे कितना भी छोटा हो।" },
    24: { q: "आपको कब 'चाहा हुआ' महसूस होता है — प्यार नहीं, चाहत?", f: "दोनों अलग हैं, और आम तौर पर एक ही कहा जाता है।", a: "साफ़-साफ़ कहिए। गोल-मोल जवाब से किसी को कुछ नहीं मिलता।" },
    25: { q: "साथ में ऐसा क्या करना चाहते हैं जो आपने कभी माँगा नहीं?", f: "रिश्ते में कहीं भी। सिर्फ़ बिस्तर की बात नहीं।", a: "अब पूछिए। 'अभी नहीं' भी पूरा जवाब है।" },
    26: { q: "क्या ज़्यादा चाहिए, और क्या कम?", f: "एक-एक। यह अदला-बदली है, शिकायत नहीं।", a: "दोनों बताइए। फिर एक-एक बदलाव पर राज़ी हो जाइए।" },
    27: { q: "आज आप मुझसे कौन-सा वादा करेंगे जो शुरू में नहीं किया था?", f: "अब आप उससे ज़्यादा जानते हैं जितना तब जानते थे।", a: "लिख लीजिए। दोनों। काग़ज़ सँभालकर रखिए।" },
    28: { q: "जब आप बूढ़े और ज़िद्दी हो जाएँ, तब आपको कैसे प्यार चाहिए?", f: "आप होंगे। वे भी होंगे।", a: "पहले गंभीरता से जवाब दीजिए। फिर हँस लीजिए।" },

    29: { q: "इन तीस दिनों में क्या बदला?", f: "कुछ तो बदला है, भले छोटा हो और नाम देना मुश्किल।", a: "अलग-अलग लिखिए, फिर दोनों जवाब पढ़कर सुनाइए।" },
    30: { q: "कौन-सा सवाल आप एक साल बाद मुझसे दोबारा पूछना चाहेंगे?", f: "इन्हीं तीस में से चुनिए। आम तौर पर एक साफ़ दिखता है।", a: "उस तारीख़ का रिमाइंडर लगाइए। आज ही, किताब बंद करने से पहले।" }
  }
};

export const STRINGS = { en: EN, hi: HI };

/** Sentences for one language. Anything other than "hi" is English. */
export const stringsFor = (lang) => (lang === "hi" ? HI : EN);
