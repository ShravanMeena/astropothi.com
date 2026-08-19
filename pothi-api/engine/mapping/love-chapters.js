// ─────────────────────────────────────────────────────────────────────────────
// Love report chapters.
//
// The old version had one chapter per chart component — "The 7th House", "Venus
// — The Significator of Love", "The 7th Lord in the Navamsa" — and each said
// which planets sat there. Twenty-four chapters, 1,071 words, forty-five words
// a chapter, and not one of them answered a question anybody actually has. A
// buyer does not want to be told that Saturn and Rahu occupy the seventh house.
// They want to know whether this will last, why the same argument keeps
// happening, and what to do about it.
//
// So the order is inverted here. Every chapter is a question, and each one
// synthesises several placements to answer it — because Venus alone, or the
// Moon alone, says almost nothing. The chart is still in the report, in full,
// as the final chapter: evidence for the reader who wants to check the working,
// rather than the reading itself.
//
// Every judgement still comes from engine/astrology/love-profile.js, which is
// deterministic and classical. Nothing here is invented and nothing predicts
// what another person will do — see docs/05-legal.md.
// ─────────────────────────────────────────────────────────────────────────────

import { buildLoveProfile } from "../astrology/love-profile.js";
import { lovePack } from "../i18n/love-strings.js";

const nth = {
  en: (n) => ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][n],
  hi: (n) => `${n}वें`
};

/** A 0–100 dial as a word, so the snapshot reads without a chart. */
const band = (v, L) => {
  const en = v >= 72 ? "strong" : v >= 56 ? "good" : v >= 44 ? "mixed" : v >= 30 ? "needs work" : "difficult";
  const hi = { strong: "मज़बूत", good: "अच्छा", mixed: "मिला-जुला", "needs work": "ध्यान चाहिए", difficult: "कठिन" };
  return L === "hi" ? hi[en] : en;
};

export function buildLoveSections(f, P) {
  const L = P.lang;
  const hi = L === "hi";
  const S = P.stop;
  const sec = [];
  const N = (n) => nth[L](n);
  const pl = (p) => P.planet(p);
  const sg = (s) => P.sign(s);
  const dg = (d) => P.dignity(d);
  const T = P.loveTitles;
  const V = lovePack(L);
  const p = buildLoveProfile(f);

  const add = (i, body, extra = {}) => sec.push({
    n: i + 1, title: T[i], body,
    ...(extra.placements ? { placements: extra.placements } : {}),
    ...(extra.data ? { data: extra.data } : {}),
    ...(extra.bullets ? { bullets: extra.bullets } : {}),
    ...(extra.summary ? { summary: extra.summary } : {}),
    ...(extra.advisory ? { advisory: extra.advisory } : {}),
  });

  /** "Venus in Pisces, 9th house, exalted" — the evidence line under a claim. */
  const where = (planet) => {
    const q = f.placements.find((x) => x.planet === planet);
    if (!q) return "";
    return hi
      ? `${pl(planet)} ${sg(q.sign)} में, ${N(q.house)} भाव में, ${dg(q.dignity)}`
      : `${pl(planet)} in ${sg(q.sign)}, ${N(q.house)} house, ${dg(q.dignity)}`;
  };

  // ── 0. About ───────────────────────────────────────────────────────────────
  add(0, P.block(
    hi
      ? `यह रिपोर्ट आपकी अपनी जन्म कुंडली से पढ़ी गई है — जन्म की तारीख़, समय और स्थान से निकाली गई ग्रह-स्थितियों से, किसी सामान्य राशिफल से नहीं${S} जन्म समय दस मिनट बदल दीजिए तो लग्न, भाव और दशाएँ सब बदल जाती हैं, और यह रिपोर्ट भी${S}`
      : `This report is read from your own birth chart — from planetary positions computed for your date, time and place of birth, not from a sun-sign column${S} Change the birth time by ten minutes and the ascendant, the houses and the dasha periods all move, and this report moves with them${S}`,
    hi
      ? `यह रिपोर्ट ग्रहों के क्रम में नहीं, आपके सवालों के क्रम में लिखी गई है${S} हर अध्याय एक सवाल का जवाब है, और हर जवाब कई स्थितियों को साथ पढ़कर बना है — क्योंकि अकेला शुक्र या अकेला चंद्रमा बहुत कम बताता है${S} कुंडली पूरी की पूरी आख़िरी अध्याय में है, प्रमाण के तौर पर${S}`
      : `It is written in the order of your questions rather than the order of the planets${S} Each chapter answers one question, and each answer reads several placements together — because Venus alone, or the Moon alone, says very little${S} The chart itself is in the final chapter, in full, as evidence${S}`,
    P.kv([
      ["lagna", sg(f.lagnaSign)],
      ["rashi", sg(f.moonSign)],
      ["nakshatra", P.nakshatra(f.nakshatra)],
    ]),
    hi
      ? `एक बात साफ़ रहे: यह रिपोर्ट आपके बारे में है${S} यह किसी और के व्यवहार की भविष्यवाणी नहीं करती, और न कर सकती है${S} जो यहाँ लिखा है वह आपकी अपनी प्रवृत्तियाँ हैं — और वही एकमात्र चीज़ है जिसे आप बदल सकते हैं${S}`
      : `One thing to be clear about: this report is about you${S} It does not predict another person's behaviour, and it cannot${S} What is written here are your own tendencies — which are also the only thing you can actually change${S}`
  ));

  // ── 1. Snapshot ────────────────────────────────────────────────────────────
  const d = p.dials;
  const dialLine = (labelEn, labelHi, v) =>
    `${hi ? labelHi : labelEn} — ${band(v, L)} (${v}/100)`;

  add(1, P.block(
    hi
      ? `आपकी सबसे बड़ी ताक़त: ${(V.strength(p.theme.strength) || "").split(S)[0]}${S}`
      : `Your biggest strength: ${(V.strength(p.theme.strength) || "").split(".")[0]}.`,
    hi
      ? `सबसे ज़्यादा ध्यान माँगने वाली बात: ${(V.growth(p.theme.challenge) || "").split(S)[0]}${S}`
      : `The thing that most needs your attention: ${(V.growth(p.theme.challenge) || "").split(".")[0]}.`,
    hi
      ? `लंबी दौड़ में यह रिश्ता ${p.longTerm.grade === "supportive" ? "सहयोगी" : p.longTerm.grade === "workable" ? "निभने लायक़" : "देखभाल माँगने वाला"} दिखता है${S}`
      : `Over the long run this reads as ${p.longTerm.grade}${S}`
  ), {
    summary: hi
      ? `${sg(f.lagnaSign)} लग्न, ${sg(f.moonSign)} राशि — नीचे के छह आँकड़े इसी कुंडली से निकले हैं${S}`
      : `${sg(f.lagnaSign)} ascendant, Moon in ${sg(f.moonSign)} — the six figures below are read from that chart${S}`,
    bullets: [
      dialLine("Relationship strength", "रिश्ते की मज़बूती", d.strength),
      dialLine("Emotional connection", "भावनात्मक जुड़ाव", d.emotional),
      dialLine("Attraction and chemistry", "आकर्षण और केमिस्ट्री", d.chemistry),
      dialLine("Communication", "बातचीत", d.communication),
      dialLine("Long-term potential", "लंबी दौड़ की संभावना", d.longTerm),
      dialLine("Domestic stability", "घरेलू स्थिरता", d.stability)
    ],
    data: { dials: d, theme: p.theme }
  });

  // ── 2. How you are in love ─────────────────────────────────────────────────
  const att = V.attachment(p.attachment.style);
  const expr = V.expression(p.expression.mode);
  add(2, P.block(
    `${att.label}${S}`,
    att.body,
    hi
      ? `स्नेह आप ${expr.label} व्यक्त करते हैं${S} ${expr.body}`
      : `You express affection ${expr.label}${S} ${expr.body}`,
    p.expression.withheld
      ? (hi
          ? `एक बात जोड़ने लायक़ है${S} आपकी कुंडली में शुक्र अस्त है — सूर्य के इतने पास कि उसका अपना प्रकाश दिखता नहीं${S} शास्त्रीय अर्थ सीधा है: आप जितना महसूस करते हैं, उसका एक हिस्सा ही बाहर पहुँचता है${S}`
          : `One thing worth adding${S} Venus is combust in your chart — so close to the Sun that its own light is not visible${S} The classical meaning is plain: a fraction of what you feel is what actually reaches the other person${S}`)
      : "",
    p.expression.revisits
      ? (hi
          ? `शुक्र वक्री भी है, जो पुराने लगावों की ओर लौटने का संकेत है${S} आप रिश्तों को मन में दोबारा जीते हैं, और यह ख़त्म हो चुकी बातों को भी खुला रखता है${S}`
          : `Venus is also retrograde, the marker of returning to old attachments${S} You re-live relationships in your head, and that keeps finished things open longer than they need to be${S}`)
      : ""
  ), {
    placements: [where("Moon"), where("Venus")].filter(Boolean),
    data: { attachment: p.attachment, expression: p.expression }
  });

  // ── 3. What you need ───────────────────────────────────────────────────────
  const needs = [];
  if (p.attachment.needsReassurance)
    needs.push(hi ? "यह सुनना कि सब ठीक है — कभी-कभी, बिना माँगे" : "To be told it is fine — sometimes, without having to ask");
  if (p.attachment.needsSpace)
    needs.push(hi ? "अपनी जगह, बिना यह समझाए कि जगह क्यों चाहिए" : "Room of your own, without having to justify wanting it");
  if (p.attachment.opensSlowly)
    needs.push(hi ? "धैर्य — शुरुआत में जल्दी न मचाया जाए" : "Patience early on, and not being rushed");
  needs.push(p.expression.mode === "practical"
    ? (hi ? "ऐसा साथी जो कामों में जताए गए प्यार को पहचान सके" : "A partner who can read love that is shown by doing")
    : (hi ? "ऐसा साथी जो कहे भी, सिर्फ़ करे नहीं" : "A partner who says it, not only does it"));
  needs.push(hi ? "भरोसा कि जो कहा गया है वह टिकेगा" : "Confidence that what was said will still be true next month");

  add(3, P.block(
    hi
      ? `“मुझे क्या चाहिए” का जवाब आमतौर पर “एक अच्छा इंसान” होता है, जो सच है और किसी काम का नहीं${S}`
      : `Asked what they need, most people say "someone kind", which is true and useless${S}`,
    hi
      ? `आपका चंद्रमा ${sg(p.attachment.moonSign)} में ${N(p.attachment.moonHouse)} भाव में है, और यही बताता है कि सुरक्षित महसूस करने के लिए आपको क्या चाहिए — यह वह चीज़ नहीं जिसे आप चुनते हैं, यह वह है जो आप हैं${S}`
      : `Your Moon is in ${sg(p.attachment.moonSign)} in the ${N(p.attachment.moonHouse)} house, and that is what says what you need in order to feel safe — not something you choose, something you are${S}`,
    hi
      ? `जिस साथी के साथ ये चीज़ें नहीं मिलतीं, वह बुरा इंसान नहीं होता — बस आपके लिए महँगा पड़ता है${S}`
      : `A partner who cannot give these is not a bad person — they are simply expensive for you${S}`
  ), {
    bullets: needs,
    advisory: hi
      ? `इनमें से कोई भी माँगना अनुचित नहीं है${S} अनुचित यह उम्मीद रखना है कि सामने वाला बिना बताए जान जाएगा${S}`
      : `None of these is an unreasonable thing to ask for${S} What is unreasonable is expecting someone to work them out unprompted${S}`
  });

  // ── 4. How your heart works ────────────────────────────────────────────────
  add(4, P.block(
    hi
      ? `भावनात्मक तालमेल का मतलब यह नहीं है कि दोनों एक जैसा महसूस करें${S} इसका मतलब है कि दोनों को पता हो कि दूसरा कैसे महसूस करता है${S} अधिकांश ग़लतफ़हमियाँ अलग होने से नहीं, अलग होने की जानकारी न होने से आती हैं${S}`
      : `Emotional compatibility does not mean two people feel the same way${S} It means each knows how the other feels things${S} Most misunderstandings come not from being different but from not knowing you are${S}`,
    hi
      ? `आपके भीतर भावना ${p.attachment.style === "quick" || p.attachment.style === "intense" ? "तेज़ी से उठती है और साफ़ दिखती है" : p.attachment.style === "guarded" ? "धीरे उठती है और देर से दिखती है" : "स्थिर रहती है और कम दिखती है"}${S} ${p.attachment.needsReassurance ? `और उसे समय-समय पर पुष्टि चाहिए होती है${S}` : `और उसे लगातार पुष्टि की ज़रूरत नहीं पड़ती${S}`}`
      : `Inside you, feeling ${p.attachment.style === "quick" || p.attachment.style === "intense" ? "rises fast and shows plainly" : p.attachment.style === "guarded" ? "rises slowly and shows late" : "stays level and shows little"}${S} ${p.attachment.needsReassurance ? `and it needs periodic confirmation${S}` : `and it does not need constant confirmation${S}`}`,
    hi
      ? `अकेलापन आपको रिश्ते के अंदर तब महसूस होता है जब ${p.attachment.needsSpace ? "आपकी जगह पर सवाल उठाया जाए" : p.attachment.opensSlowly ? "आपसे जल्दी खुलने की माँग हो" : "बातचीत रुक जाए"}${S} यह वह क्षण है जिसे पहचानना सीखना है — क्योंकि इसका असली कारण अक्सर वह नहीं होता जो उस वक़्त लगता है${S}`
      : `Loneliness inside a relationship arrives for you when ${p.attachment.needsSpace ? "your need for room is treated as a problem" : p.attachment.opensSlowly ? "you are pushed to open faster than you can" : "the talking stops"}${S} That is the moment worth learning to recognise, because its real cause is usually not the one it appears to have at the time${S}`
  ), { placements: [where("Moon")] });

  // ── 5. Communication ───────────────────────────────────────────────────────
  const comm = V.communication(p.communication.style);
  add(5, P.block(
    `${comm.label}${S}`,
    comm.body,
    p.communication.withdrawsInConflict
      ? (hi
          ? `बहस में आपका ढर्रा पीछे हटने का है${S} आपके लिए यह हालात को बिगड़ने से रोकना है${S} सामने वाले के लिए यह सज़ा जैसा लगता है — और यही अंतर अधिकांश झगड़ों को उनकी असली लंबाई से दोगुना कर देता है${S}`
          : `In an argument your instinct is to step back${S} To you that is stopping things getting worse${S} To the other person it reads as punishment — and that single mismatch is what doubles the length of most arguments${S}`)
      : (hi
          ? `बहस में आप मैदान में बने रहते हैं${S} यह अच्छी बात है, बशर्ते बात मुद्दे पर रहे और ढंग पर न चली जाए${S}`
          : `In an argument you stay in the room${S} That is a good thing, as long as it stays about the point and does not become about the delivery${S}`),
    p.communication.thinksBeforeSpeaking
      ? (hi
          ? `आप बोलने से पहले सोचते हैं, इसलिए आपका जवाब देर से आता है${S} इंतज़ार को चुप्पी न समझा जाए, इसके लिए इतना कह देना काफ़ी है कि “मैं सोच रहा/रही हूँ”${S}`
          : `You think before you speak, so your answer arrives late${S} Saying "I am thinking about it" is enough to stop the wait being mistaken for silence${S}`)
      : ""
  ), {
    placements: [where("Mercury")].filter(Boolean),
    bullets: [
      hi ? "असहमति के समय: नतीजे पर तुरंत मत पहुँचिए" : "In a disagreement: do not jump to the conclusion",
      hi ? "अनुमान की जगह सीधा सवाल पूछिए" : "Ask the specific question instead of assuming the answer",
      hi ? "हर बहस में पुरानी बातें वापस मत लाइए" : "Do not bring old arguments into the current one",
      hi ? "चुप्पी को अपने आप अस्वीकार मत समझिए" : "Do not read silence as rejection by default"
    ]
  });

  // ── 6. Attraction and chemistry ────────────────────────────────────────────
  add(6, P.block(
    V.chemistry(p.chemistry.level),
    p.attraction.split
      ? (hi
          ? `यहाँ एक बात है जो ध्यान देने लायक़ है${S} पहली नज़र में आपको ${V.draw(p.attraction.first)} खींचता है, पर जिस चीज़ के साथ आप असल में जमते हैं वह ${V.draw(p.attraction.lasting)} है${S} शुक्र ${sg(p.attraction.venusSign)} में है और आपका सप्तम भाव ${sg(p.attraction.seventhSign)} का — दोनों अलग बात कह रहे हैं${S} यही वजह है कि जो लोग शुरू में सबसे रोमांचक लगते हैं, वे लंबे समय में सबसे मुश्किल साबित होते रहे होंगे${S}`
          : `There is something here worth sitting with${S} What catches your eye first is ${V.draw(p.attraction.first)}, but what you actually settle with is ${V.draw(p.attraction.lasting)}${S} Venus is in ${sg(p.attraction.venusSign)} and your seventh house is ${sg(p.attraction.seventhSign)} — the two are saying different things${S} This is usually why the people who seemed most exciting at the start turned out to be the hardest to stay with${S}`)
      : (hi
          ? `आपके साथ यह सीधा है: जो आपको पहले खींचता है — ${V.draw(p.attraction.first)} — वही चीज़ लंबे समय तक चलती भी है${S} शुक्र और सप्तम भाव एक ही बात कह रहे हैं, जो उतना आम नहीं है जितना लगता है${S}`
          : `With you this is unusually simple: what draws you first — ${V.draw(p.attraction.first)} — is also what lasts${S} Venus and the seventh house are saying the same thing, which is less common than it sounds${S}`),
    p.chemistry.intensityRisk
      ? (hi
          ? `एक सावधानी${S} जिस रफ़्तार से यहाँ आकर्षण बनता है, वह भरोसे की रफ़्तार से तेज़ है${S} इसका मतलब यह नहीं कि यह ग़लत है — बस यह कि बाक़ी चीज़ों को पकड़ने का समय देना होगा${S}`
          : `One caution${S} Attraction here moves faster than trust does${S} That does not make it wrong — it means the rest has to be given time to catch up${S}`)
      : ""
  ), { placements: [where("Venus"), where("Mars")].filter(Boolean) });

  // ── 7. Friction ────────────────────────────────────────────────────────────
  const trigParas = p.triggers.map((t) => {
    const x = V.trigger(t.key);
    if (!x) return "";
    const help = V.triggerHelp(t.key);
    return hi
      ? `${x.t}${S}\n${x.s}\n${help ? `क्या मदद करेगा: ${help}` : ""}`
      : `${x.t}${S}\n${x.s}\n${help ? `What helps: ${help}` : ""}`;
  }).filter(Boolean);

  add(7, P.block(
    hi
      ? `हर रिश्ते में टकराव होता है${S} सवाल यह नहीं कि होगा या नहीं, सवाल यह है कि कहाँ से शुरू होगा — और यह कुंडली से पढ़ा जा सकता है${S} नीचे जो लिखा है वह आपकी अपनी प्रवृत्तियाँ हैं, किसी और का व्यवहार नहीं${S}`
      : `Every relationship has friction${S} The question is not whether, it is where it starts — and that can be read from the chart${S} What follows are your own tendencies, not a forecast of anyone else's behaviour${S}`,
    ...trigParas
  ), {
    advisory: hi
      ? `इनमें से कोई भी अटल नहीं है${S} एक ढर्रे को नाम दे देना ही उसका आधा असर ख़त्म कर देता है, क्योंकि फिर वह “हम हमेशा लड़ते हैं” नहीं रहता, “यह वाली बात हमें छेड़ देती है” बन जाता है${S}`
      : `None of these is fixed${S} Naming a pattern removes half its force, because it stops being "we always fight" and becomes "this particular thing sets us off"${S}`,
    data: { triggers: p.triggers }
  });

  // ── 8. Strengths ───────────────────────────────────────────────────────────
  add(8, P.block(
    ...p.strengths.map((s) => V.strength(s.key)).filter(Boolean)
  ), {
    summary: hi
      ? `जब कुछ मुश्किल चल रहा हो, यही वे चीज़ें हैं जिन पर वापस लौटा जा सकता है${S}`
      : `When something is going wrong, these are the things there are to come back to${S}`
  });

  // ── 9. Will it last ────────────────────────────────────────────────────────
  add(9, P.block(
    hi
      ? `लंबी दौड़ में यह कुंडली ${p.longTerm.grade === "supportive" ? "सहयोगी दिखती है" : p.longTerm.grade === "workable" ? "निभने लायक़ दिखती है" : "देखभाल माँगती दिखती है"}${S}`
      : `Over the long run this chart reads as ${p.longTerm.grade}${S}`,
    hi
      ? `यह निर्णय आपके सप्तम भाव के साथ-साथ आपके नवांश से निकला है, जिसका लग्न ${sg(f.navamsa?.lagnaSign)} है${S} नवांश ही वह वर्ग है जिसे शास्त्र विवाह के लिए पढ़ता है — मज़बूत सप्तम और कमज़ोर नवांश उस रिश्ते की तस्वीर है जो अच्छा शुरू होकर बाद में खिंचता है, और उल्टा भी उतना ही सच है${S}`
      : `That judgement comes from your seventh house together with your navamsa, whose ascendant is ${sg(f.navamsa?.lagnaSign)}${S} The navamsa is the divisional chart the classics read for marriage — a strong seventh with a weak navamsa is the picture of a relationship that starts well and strains later, and the reverse holds just as much${S}`,
    p.longTerm.slowStart
      ? (hi
          ? `आपकी कुंडली में शनि विवाह भाव को छूता है${S} इसका शास्त्रीय अर्थ अकेलापन नहीं, देरी और भार है — शुरुआती साल ज़्यादा मेहनत माँगते हैं और बाद के साल ज़्यादा स्थिर होते हैं${S} शनि जो देता है देर से देता है, और फिर वापस नहीं लेता${S}`
          : `Saturn touches the house of marriage in your chart${S} The classical meaning of that is not loneliness but delay and weight — the early years ask more work and the later years are steadier${S} What Saturn gives, it gives late and does not take back${S}`)
      : "",
    hi
      ? `ध्यान रखिए: कुंडली प्रवृत्ति बताती है, निश्चितता नहीं${S} जो लोग इसे निभाते हैं वे वही होते हैं जिन्होंने वही किया जो अगले दो अध्यायों में लिखा है${S}`
      : `Understand what this is not: a chart shows tendency, not certainty${S} The people it works out for are the ones who did the things in the next two chapters${S}`
  ), {
    bullets: p.growth.map((g) => V.growth(g.key)).filter(Boolean),
    data: { longTerm: p.longTerm }
  });

  // ── 10. Love to partnership ────────────────────────────────────────────────
  const lean = p.marriagePath.lean;
  add(10, P.block(
    hi
      ? `प्रेम और विवाह एक ही चीज़ नहीं हैं, और कुंडली दोनों को अलग-अलग पढ़ती है${S} आपका पंचम भाव ${sg(f.houses.find((h) => h.house === 5)?.sign)} का है और सप्तम ${sg(f.houses.find((h) => h.house === 7)?.sign)} का — पहला प्रेम का, दूसरा साथ निभाने का${S} जिनके ये दोनों जुड़े हों, उनके लिए प्यार ही शादी बन जाता है${S} जिनके अलग हों, उनके लिए ये दो अलग कहानियाँ रहती हैं${S}`
      : `Love and marriage are not the same thing, and the chart reads them separately${S} Your fifth house is ${sg(f.houses.find((h) => h.house === 5)?.sign)} and your seventh is ${sg(f.houses.find((h) => h.house === 7)?.sign)} — the first is romance, the second is partnership${S} Where the two are linked, love turns into marriage${S} Where they are not, they stay two different stories${S}`,
    lean === "love"
      ? (hi
          ? `आपकी कुंडली में ये जुड़े हुए हैं${S} शास्त्रीय संकेत प्रेम विवाह की ओर झुकते हैं — यानी जिस व्यक्ति से आप ख़ुद जुड़ेंगे, उसी के साथ बात आगे बढ़ने की संभावना ज़्यादा है${S}`
          : `In your chart they are linked${S} The classical markers lean towards a love marriage — the person you choose yourself is the more likely route${S}`)
      : lean === "family-led"
        ? (hi
            ? `आपकी कुंडली में ये अपेक्षाकृत अलग हैं${S} संकेत परिवार के ज़रिए तय होने वाले रिश्ते की ओर झुकते हैं, या कम से कम ऐसे रिश्ते की ओर जिसमें परिवार की भूमिका बड़ी रहेगी${S}`
            : `In your chart they sit relatively apart${S} The markers lean towards a match arrived at through family, or at least one in which family plays a large part${S}`)
        : (hi
            ? `आपकी कुंडली इस पर दोनों तरफ़ खुली है${S} न प्रेम विवाह के संकेत प्रबल हैं, न परिवार के ज़रिए तय होने के — व्यवहार में इसका मतलब यह है कि यह फ़ैसला परिस्थिति तय करेगी, कुंडली नहीं${S}`
            : `Your chart is open both ways${S} Neither the love-marriage markers nor the family-led ones are strong — which in practice means circumstance will decide this, not the chart${S}`),
    p.marriagePath.familyInvolved
      ? (hi
          ? `एक बात और${S} आपके द्वितीय और चतुर्थ भाव की स्थिति बताती है कि परिवार इस फ़ैसले में मौजूद रहेगा — विरोध के रूप में ज़रूरी नहीं, पर मौजूद${S} इसे पहले से मान लेना बाद की बहुत सारी बहस बचा देता है${S}`
          : `One more thing${S} Your second and fourth houses say family will be present in this decision — not necessarily as opposition, but present${S} Accepting that in advance saves a great deal of argument later${S}`)
      : "",
    hi
      ? `शादी के बाद का जीवन द्वितीय भाव से पढ़ा जाता है${S} आपके यहाँ यह ${f.houses2?.grade === "strong" ? "मज़बूत है — घर और ससुराल सहारा बनने की ओर झुके हैं" : f.houses2?.grade === "weak" ? "दबाव में है — घरेलू व्यवस्था और पैसा वे जगहें हैं जहाँ ध्यान देना होगा" : "मिला-जुला है — कुछ चीज़ें आसानी से बैठेंगी, कुछ पर काम करना होगा"}${S}`
      : `Life after marriage is read from the second house${S} In your chart it is ${f.houses2?.grade === "strong" ? "strong — household and in-laws lean towards being a support" : f.houses2?.grade === "weak" ? "under pressure — household arrangements and money are where the attention will be needed" : "mixed — some of it will settle easily and some will need work"}${S}`
  ), { data: { marriagePath: p.marriagePath } });

  // ── 11. Timing ─────────────────────────────────────────────────────────────
  const windows = (f.timing?.windows || []).slice(0, 4);
  const fmt = (iso) => {
    const dt = new Date(iso);
    return Number.isNaN(dt.getTime()) ? "" : `${dt.getFullYear()}`;
  };
  const WHY = {
    en: { occupies7: "the period lord sits in your house of partnership",
          lords7: "the period lord rules your house of partnership",
          venusPeriod: "a Venus period, classically the one that ripens marriage",
          aspects7: "the period lord aspects your house of partnership" },
    hi: { occupies7: "इस दशा का स्वामी आपके सप्तम भाव में बैठा है",
          lords7: "इस दशा का स्वामी आपके सप्तम भाव का स्वामी है",
          venusPeriod: "शुक्र की दशा, जिसे शास्त्र विवाह पकाने वाली दशा मानता है",
          aspects7: "इस दशा का स्वामी सप्तम भाव को देखता है" }
  };

  add(11, P.block(
    hi
      ? `दशाएँ समय की गणना हैं — वे बताती हैं कि कौन-सा दौर किस विषय को आगे लाता है${S} वे तारीख़ नहीं बतातीं, और जो कोई तारीख़ बताए उससे सावधान रहिए${S}`
      : `Dasha periods are a computation of time — they say which stretch of life brings which subject forward${S} They do not name a date, and anyone who names one should be treated with suspicion${S}`,
    ...windows.map((w) => {
      const why = (WHY[L] || WHY.en)[w.why] || w.why;
      return hi
        ? `${pl(w.lord)} की दशा, ${fmt(w.start)}–${fmt(w.end)} — ${why}${S}`
        : `${pl(w.lord)} period, ${fmt(w.start)}–${fmt(w.end)} — ${why}${S}`;
    }),
    hi
      ? `इन दौरों में जो होता है वह “शादी हो जाना” नहीं है${S} जो होता है वह यह है कि विषय सामने आ जाता है — मुलाक़ात, बातचीत, फ़ैसला, या वह स्पष्टता जो पहले नहीं थी${S}`
      : `What happens in these windows is not "marriage happens"${S} What happens is that the subject comes forward — a meeting, a conversation, a decision, or a clarity that was not there before${S}`
  ), {
    data: { windows },
    advisory: hi
      ? `किसी दशा को शुभ या अशुभ मानकर फ़ैसले टालिए मत${S} इनका उपयोग तैयारी के लिए है, इंतज़ार के लिए नहीं${S}`
      : `Do not postpone decisions because a period looks unfavourable${S} These are for preparation, not for waiting${S}`
  });

  // ── 12. Practical guidance ─────────────────────────────────────────────────
  const doList = [];
  if (p.expression.withheld || p.expression.mode === "practical")
    doList.push(hi ? "महीने में एक बार वह बात कह दीजिए जो आप आमतौर पर करके दिखाते हैं" : "Once a month, say the thing you would normally show by doing");
  if (p.communication.withdrawsInConflict)
    doList.push(hi ? "हटने से पहले यह कहिए कि आप लौटेंगे, और कब" : "Before withdrawing, say that you will come back, and when");
  if (p.attachment.needsReassurance)
    doList.push(hi ? "हफ़्ते में एक तय समय रखिए जब रिश्ते पर ही बात हो" : "Keep one fixed time a week to talk about the relationship itself");
  if (p.attraction.split)
    doList.push(hi ? "जिस व्यक्ति की ओर आप खिंच रहे हैं, उससे पूछिए कि क्या वह वही है जिसके साथ आप रहना चाहते हैं" : "Ask whether the person you are drawn to is the person you want to live with");
  if (p.chemistry.level === "immediate")
    doList.push(hi ? "बड़े फ़ैसले तीन महीने बाद कीजिए, तीन हफ़्ते बाद नहीं" : "Make the big decisions at three months, not at three weeks");
  doList.push(hi ? "जो अपेक्षा कभी बोली नहीं गई, उसे इस हफ़्ते बोल दीजिए" : "Say the one expectation that has never been said out loud");

  add(12, P.block(
    hi
      ? `नीचे की हर बात आपकी अपनी स्थितियों से निकली है${S} इनमें से एक भी सामान्य सलाह नहीं है — हर एक ऊपर के किसी अध्याय का सीधा नतीजा है${S}`
      : `Each of the following comes from your own placements${S} None of it is general advice — every line is the direct consequence of one of the chapters above${S}`
  ), {
    bullets: doList,
    summary: hi
      ? `प्रतिबद्धता से पहले पूछने लायक़ सवाल${S}`
      : `Questions worth asking before committing${S}`,
    advisory: (hi
      ? [`हम भविष्य को किस समय-सीमा में देखते हैं?`,
         `टकराव के समय हमें जगह चाहिए या बातचीत?`,
         `परिवार की भागीदारी की हमारी सीमाएँ क्या हैं?`,
         `पैसा और ज़िम्मेदारी कैसे सँभालेंगे?`,
         `क्या हम एक-दूसरे के अपने लक्ष्यों का साथ देंगे?`]
      : [`What timeline do we each picture for the future?`,
         `In conflict, do we need space or conversation?`,
         `What are our boundaries around family involvement?`,
         `How will we handle money and responsibility?`,
         `Will we support each other's separate goals?`]).join("\n")
  });

  // ── 13. The letter ─────────────────────────────────────────────────────────
  add(13, P.block(
    hi
      ? `आपके लिए प्रेम सिर्फ़ आकर्षण नहीं है${S} ${p.attachment.needsReassurance ? "आपके लिए यह यह जानना भी है कि आप जिस ज़मीन पर खड़े हैं वह कल भी वहीं रहेगी" : p.attachment.opensSlowly ? "आपके लिए यह वह भरोसा है जो समय देकर कमाया जाता है" : "आपके लिए यह वह साथ है जो रोज़ के छोटे कामों में दिखता है"}${S}`
      : `Love, for you, is not only attraction${S} ${p.attachment.needsReassurance ? "It is also knowing that the ground you are standing on will still be there tomorrow" : p.attachment.opensSlowly ? "It is the trust that gets earned by time" : "It is the companionship that shows up in the small daily things"}${S}`,
    hi
      ? `इसलिए किसी रिश्ते में आगे बढ़ने से पहले यह देखना ज़रूरी है कि सामने वाला सिर्फ़ आपकी ख़ुशी में नहीं, आपकी अनिश्चितता में भी आपके साथ खड़ा रहता है या नहीं${S} जो लोग अच्छे दिनों में साथ होते हैं वे बहुत मिलते हैं${S} फ़र्क़ बुरे हफ़्ते में पता चलता है${S}`
      : `So before going further with anyone, the thing worth watching is whether they stay with you in your uncertainty and not only in your happiness${S} People who are present on the good days are common${S} The difference shows up in a bad week${S}`,
    hi
      ? `और एक बात जो कुंडली नहीं बता सकती, पर कहनी ज़रूरी है${S} यहाँ जो लिखा है वह प्रवृत्ति है, फ़ैसला नहीं${S} जिन लोगों की कुंडली में सब कुछ अनुकूल था और जिन्होंने ध्यान नहीं दिया, उनके रिश्ते टूटे हैं${S} और जिनकी कुंडली कठिन थी और जिन्होंने ईमानदारी से काम किया, उनके निभे हैं${S} कुंडली आपको वह जानकारी देती है जो दूसरों के पास नहीं होती${S} उसका क्या करना है, यह आपके हाथ में है${S}`
      : `And one thing the chart cannot tell you, which needs saying anyway${S} What is written here is tendency, not verdict${S} Relationships have ended between people whose charts were entirely favourable and who did not pay attention${S} And they have lasted between people whose charts were difficult and who did the work honestly${S} A chart gives you information other people do not have${S} What you do with it is yours${S}`
  ));

  // ── 14. The chart, as evidence ─────────────────────────────────────────────
  const seventh = f.houses7 || {};
  add(14, P.block(
    hi
      ? `यह अध्याय पाठ नहीं, प्रमाण है — ऊपर का हर निर्णय इन्हीं स्थितियों से निकला है और यहाँ जाँचा जा सकता है${S}`
      : `This chapter is not the reading, it is the evidence — every judgement above came from these placements and can be checked here${S}`,
    hi
      ? `सप्तम भाव ${sg(f.houses.find((h) => h.house === 7)?.sign)} का है, स्वामी ${pl(seventh.lord)} — ${seventh.occupants?.length ? `भाव में ${seventh.occupants.map(pl).join(", ")}` : "भाव रिक्त"}${seventh.aspects?.length ? `, दृष्टि ${seventh.aspects.map(pl).join(", ")}` : ""}${S}`
      : `The seventh house is ${sg(f.houses.find((h) => h.house === 7)?.sign)}, its lord ${pl(seventh.lord)} — ${seventh.occupants?.length ? `occupied by ${seventh.occupants.map(pl).join(", ")}` : "unoccupied"}${seventh.aspects?.length ? `, aspected by ${seventh.aspects.map(pl).join(", ")}` : ""}${S}`,
    hi
      ? `नवांश लग्न ${sg(f.navamsa?.lagnaSign)}${(f.navamsa?.vargottama || []).length ? `, वर्गोत्तम: ${(f.navamsa.vargottama).map(pl).join(", ")}` : ""}${S}`
      : `Navamsa ascendant ${sg(f.navamsa?.lagnaSign)}${(f.navamsa?.vargottama || []).length ? `, vargottama: ${(f.navamsa.vargottama).map(pl).join(", ")}` : ""}${S}`,
    f.manglik?.detected
      ? (hi
          ? `मंगल दोष: उपस्थित (${f.manglik.from.join(", ")} से, ${f.manglik.severity})${(f.manglik.cancellations || []).length ? `, परिहार: ${f.manglik.cancellations.join(", ")}` : ", कोई शास्त्रीय परिहार नहीं"}${S}`
          : `Manglik dosha: present (from ${f.manglik.from.join(", ")}, ${f.manglik.severity})${(f.manglik.cancellations || []).length ? `, cancellation: ${f.manglik.cancellations.join(", ")}` : ", no classical cancellation"}${S}`)
      : (hi ? `मंगल दोष: अनुपस्थित${S}` : `Manglik dosha: absent${S}`)
  ), {
    placements: ["Venus", "Mars", "Moon", "Mercury", "Jupiter", "Saturn"].map(where).filter(Boolean),
    bullets: [
      hi ? `पंचम भाव: ${f.houses5?.grade || "—"}` : `Fifth house: ${f.houses5?.grade || "—"}`,
      hi ? `सप्तम भाव: ${seventh.grade || "—"}` : `Seventh house: ${seventh.grade || "—"}`,
      hi ? `द्वितीय भाव: ${f.houses2?.grade || "—"}` : `Second house: ${f.houses2?.grade || "—"}`,
      hi ? `अष्टम भाव: ${f.houses8?.grade || "—"}` : `Eighth house: ${f.houses8?.grade || "—"}`,
      hi ? `द्वादश भाव: ${f.houses12?.grade || "—"}` : `Twelfth house: ${f.houses12?.grade || "—"}`
    ]
  });

  return sec;
}
