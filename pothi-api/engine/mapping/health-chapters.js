// ─────────────────────────────────────────────────────────────────────────────
// Health Chart chapter mapper — the exact 26 chapters published for
// astro_chart_listing id = 2.
//
// A health reading has to be careful in a way a career reading does not: this
// names tendencies the chart shows and the routine that steadies them, and it
// never diagnoses, never names a disease as a fact, and never tells anyone to
// stop treatment. Every chapter that touches the body says so.
// ─────────────────────────────────────────────────────────────────────────────

const nth = { en: (n) => ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][n], hi: (n) => `${n}वें` };

const YOGA_TEXT = {
  en: {
    vipreetHealth: "The lord of your 6th house sits in a house of loss, which the classics call a Vipreet yoga — illness that arrives tends to turn into resilience rather than into a long complaint.",
    strongLagnaLord: "Your Lagna lord is dignified. This is the single best protection a chart can carry: recovery is quicker than the illness deserves.",
    beneficKendra: "A benefic occupies an angle of your chart, which guards the constitution through the difficult periods.",
    maleficIn6th: "A malefic in the 6th is a strength, not a weakness — in the house of disease it fights disease.",
    eighthLordHome: "The 8th lord rests in its own house, which steadies longevity.",
  },
  hi: {
    vipreetHealth: "आपका षष्ठेश हानि-भाव में है, जिसे शास्त्र विपरीत योग कहते हैं — जो रोग आता है वह लंबी शिकायत नहीं, बल्कि प्रतिरोध-शक्ति बनकर निकलता है।",
    strongLagnaLord: "आपका लग्नेश बलवान है। कुंडली में इससे बड़ी रक्षा कोई नहीं — रोग जितना बड़ा हो, स्वास्थ्य-लाभ उससे शीघ्र होता है।",
    beneficKendra: "केंद्र भाव में शुभ ग्रह है, जो कठिन दशाओं में भी शरीर की रक्षा करता है।",
    maleficIn6th: "षष्ठ भाव में पाप ग्रह दुर्बलता नहीं, बल है — रोग के भाव में वह रोग से ही लड़ता है।",
    eighthLordHome: "अष्टमेश अपने ही भाव में है, जिससे आयु स्थिर रहती है।",
  },
};

const DIET = {
  en: {
    fire: ["cooling, unhurried food — milk, ghee, sweet fruit, coriander", "chillies, sour pickle, alcohol and eating in anger"],
    earth: ["light, warm, dry food — millet, ginger, honey, bitter greens", "curd at night, fried food, day sleep and heavy dinners"],
    air: ["warm, oily, grounding food — ghee, wheat, sesame, cooked vegetables", "cold food, dry snacks, irregular hours and skipped meals"],
    water: ["warm, light, well-spiced food — barley, ginger, turmeric", "excess salt, cold drinks, late nights and heavy sweets"],
  },
  hi: {
    fire: ["शीतल और शांति से खाया गया आहार — दूध, घी, मीठे फल, धनिया", "मिर्च, खट्टा अचार, मद्य और क्रोध में भोजन"],
    earth: ["हल्का, गर्म और रूखा आहार — बाजरा, अदरक, शहद, कड़वी सब्ज़ियाँ", "रात में दही, तला हुआ भोजन, दिन में शयन और भारी रात्रि-भोजन"],
    air: ["गर्म, स्निग्ध और स्थिर करने वाला आहार — घी, गेहूँ, तिल, पकी सब्ज़ियाँ", "ठंडा भोजन, सूखे नाश्ते, अनियमित समय और भोजन छोड़ना"],
    water: ["गर्म, हल्का और सुगंधित आहार — जौ, अदरक, हल्दी", "अधिक नमक, ठंडे पेय, देर रात जागना और भारी मिष्ठान्न"],
  },
};

export function buildHealthSections(f, P) {
  const L = P.lang;
  const hi = L === "hi";
  const S = P.stop;
  const sec = [];
  const N = (n) => nth[L](n);
  const pl = (p) => P.planet(p);
  const sg = (s) => P.sign(s);
  const dg = (d) => P.dignity(d);
  const T = P.healthTitles;

  const add = (i, body, extra = {}) => sec.push({
    n: i + 1, title: T[i], body,
    ...(extra.placements ? { placements: extra.placements } : {}),
    ...(extra.data ? { data: extra.data } : {}),
    ...(extra.bullets ? { bullets: extra.bullets } : {}),
    ...(extra.advisory ? { advisory: extra.advisory } : {}),
  });

  const grade = (g) => (g === "strong" ? P.l2.strong : g === "moderate" ? P.l2.moderate : P.l2.weak);
  const find = (p) => f.placements.find((x) => x.planet === p);

  // The line that keeps this report honest. It appears wherever the body is named.
  const CARE = hi
    ? `यह ज्योतिषीय प्रवृत्ति है, चिकित्सा निदान नहीं${S} किसी भी लक्षण के लिए चिकित्सक से मिलें${S}`
    : `This is an astrological tendency, not a medical diagnosis. See a doctor for anything you actually feel${S}`;

  /** One graha's health chapter — same shape for all nine. */
  const grahaChapter = (idx, planet) => {
    const q = find(planet);
    if (!q) { add(idx, CARE); return; }
    const weak = q.dignity === "debilitated" || q.dignity === "enemy" || q.combust;
    add(idx, P.block(
      hi
        ? `${pl(planet)} शरीर में ${P.bodyByPlanet(planet)} का अधिकारी है${S} आपकी कुंडली में यह ${sg(q.sign)} में ${N(q.house)} भाव में, ${dg(q.dignity)} है${S}`
        : `${pl(planet)} governs ${P.bodyByPlanet(planet)}. In your chart it stands in ${sg(q.sign)} in the ${N(q.house)} house, ${dg(q.dignity)}${S}`,
      weak
        ? (hi
          ? `यह स्थिति दुर्बल है — इस ग्रह से जुड़े अंगों पर नियमित ध्यान रखें${S}${q.combust ? ` ${pl(planet)} अस्त भी है, जिससे लक्षण देर से प्रकट होते हैं${S}` : ""}`
          : `This placement is under pressure, so the parts it rules are the ones to keep an ordinary eye on${q.combust ? `. Being combust, signs here tend to show late rather than early` : ""}${S}`)
        : (hi
          ? `यह स्थिति सबल है — इस ग्रह से जुड़े अंग स्वाभाविक रूप से मज़बूत रहते हैं${S}`
          : `The placement is sound, so what it rules tends to look after itself${S}`),
      [6, 8, 12].includes(q.house)
        ? (hi ? `${N(q.house)} भाव में होने से इसका फल धीरे-धीरे प्रकट होता है${S}` : `Sitting in the ${N(q.house)}, its effects build slowly rather than arriving at once${S}`)
        : "",
      CARE,
    ), { data: { planet, placement: q }, placements: [q] });
  };

  // ── 1. About ───────────────────────────────────────────────────────────────
  add(0, P.block(
    hi
      ? `यह रिपोर्ट आपकी जन्म कुंडली से स्वास्थ्य के संकेत पढ़ती है${S} इसमें 26 अध्याय हैं और हर निर्णय आपकी अपनी ग्रह-स्थिति से निकला है${S}`
      : `This report reads the indications of health from your own birth chart. It runs to 26 chapters, and every judgement is drawn from your own placements${S}`,
    P.kv([["lagna", sg(f.lagnaSign)], ["rashi", sg(f.moonSign)], ["nakshatra", P.nakshatra(f.nakshatra)]]),
    hi
      ? `महत्वपूर्ण: ज्योतिष प्रवृत्ति बताता है, रोग नहीं${S} यह रिपोर्ट किसी चिकित्सक का स्थान नहीं ले सकती और न ही किसी चल रहे उपचार को रोकने का आधार है${S}`
      : `Important: astrology speaks of tendencies, never of diagnoses. Nothing here replaces a doctor, and nothing here is a reason to stop a treatment you are already on${S}`,
  ));

  // ── 2. Chart profile ───────────────────────────────────────────────────────
  add(1, P.block(
    hi ? `स्वास्थ्य का पूरा पाठ लग्न, लग्नेश, षष्ठ भाव और चंद्रमा पर टिका है${S}` : `The whole reading of health rests on the Lagna, its lord, the 6th house and the Moon${S}`,
    P.ul(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].map((p) => {
      const q = find(p);
      return q ? `${pl(p)} — ${sg(q.sign)}, ${N(q.house)} ${P.l2.house}, ${dg(q.dignity)}` : null;
    }).filter(Boolean)),
  ), { placements: f.placements });

  // ── 3. Constitution ────────────────────────────────────────────────────────
  const [tatvaName, tatvaText] = P.tatva(f.moonSign);
  add(2, P.block(
    hi
      ? `आपकी प्रकृति चंद्र राशि ${sg(f.moonSign)} से निर्धारित होती है — तत्व: ${tatvaName}${S}`
      : `Your constitution is read from the Moon's sign, ${sg(f.moonSign)} — element: ${tatvaName}${S}`,
    tatvaText + S,
    hi
      ? `अध्याय 24 में इसी प्रकृति के अनुसार आहार और दिनचर्या दी गई है${S}`
      : `Chapter 24 gives the food and the routine that suit this constitution${S}`,
  ), { data: { element: P.element(f.moonSign) } });

  // ── 4. Lagna & lord ────────────────────────────────────────────────────────
  const h1 = f.houses1;
  add(3, P.block(
    hi
      ? `लग्न शरीर है और लग्नेश उसकी जीवनशक्ति${S} आपका लग्न ${sg(f.lagnaSign)} है और लग्नेश ${pl(f.lagnaLord)} ${N(h1.lordHouse)} भाव में ${dg(h1.lordDignity)} स्थित है${S}`
      : `The Lagna is the body and its lord is the vitality that runs it. Your Lagna is ${sg(f.lagnaSign)}, and its lord ${pl(f.lagnaLord)} sits in the ${N(h1.lordHouse)} house, ${dg(h1.lordDignity)}${S}`,
    `${P.l2.strength}: ${grade(h1.grade)}${S}`,
    h1.grade === "strong"
      ? (hi ? `लग्नेश बलवान है — रोग आता भी है तो टिकता नहीं${S}` : `A strong Lagna lord means illness, when it comes, does not stay long${S}`)
      : (hi ? `लग्नेश को सहारे की आवश्यकता है — दिनचर्या की नियमितता ही सबसे बड़ा उपाय है${S}` : `The Lagna lord needs support, and regularity of routine is the largest single remedy for that${S}`),
  ), { data: { judgement: h1 } });

  // ── 5. 6th house ───────────────────────────────────────────────────────────
  const h6 = f.houses6;
  add(4, P.block(
    hi
      ? `षष्ठ भाव रोग, ऋण और शत्रु का भाव है — किंतु यही रोग से लड़ने की शक्ति भी देता है${S} आपके षष्ठ भाव में ${h6.occupants.length ? P.planets(h6.occupants) : "कोई ग्रह नहीं"}${S}`
      : `The 6th house holds disease, debt and enemies — and equally the strength that fights all three. In your chart ${h6.occupants.length ? `it holds ${P.planets(h6.occupants)}` : "it stands empty"}${S}`,
    h6.maleficOccupants.length
      ? (hi ? `${P.planets(h6.maleficOccupants)} यहाँ होना शुभ है — रोग के भाव में पाप ग्रह रोग से लड़ता है${S}` : `${P.planets(h6.maleficOccupants)} here is a good thing: a malefic in the house of disease fights disease${S}`)
      : "",
    `${P.l2.strength}: ${grade(h6.grade)}${S}`,
    CARE,
  ), { data: { judgement: h6 } });

  // ── 6. 6th lord ────────────────────────────────────────────────────────────
  add(5, P.block(
    hi
      ? `षष्ठेश ${pl(h6.lord)} ${sg(h6.lordSign)} में ${N(h6.lordHouse)} भाव में है${S} षष्ठेश जहाँ जाता है, वहीं से शरीर पर दबाव आता है${S}`
      : `Your 6th lord ${pl(h6.lord)} is in ${sg(h6.lordSign)} in the ${N(h6.lordHouse)} house. Wherever the 6th lord goes is where the body feels pressure${S}`,
    hi
      ? `अर्थात् ${P.bodyByHouse(h6.lordHouse)} — इस क्षेत्र में नियमित जाँच रखें${S}`
      : `In the body that means ${P.bodyByHouse(h6.lordHouse)}. Ordinary, regular checks there are enough${S}`,
    [6, 8, 12].includes(h6.lordHouse)
      ? (hi ? `षष्ठेश दुःस्थान में है — शास्त्र इसे विपरीत योग कहते हैं, जो रोग को शक्ति में बदलता है${S}` : `The 6th lord in a house of loss is a Vipreet yoga — the classics read it as illness turning into strength${S}`)
      : "",
    CARE,
  ), { data: { judgement: h6 } });

  // ── 7. 8th house ───────────────────────────────────────────────────────────
  const h8 = f.houses8;
  add(6, P.block(
    hi
      ? `अष्टम भाव आयु, पुराने रोग और अचानक आने वाली स्थितियों का भाव है${S} अष्टमेश ${pl(h8.lord)} ${N(h8.lordHouse)} भाव में है${S}`
      : `The 8th house carries longevity, chronic matters and whatever arrives suddenly. Its lord ${pl(h8.lord)} sits in the ${N(h8.lordHouse)} house${S}`,
    `${P.l2.strength}: ${grade(h8.grade)}${S}`,
    CARE,
  ), { data: { judgement: h8 } });

  // ── 8. 12th house ──────────────────────────────────────────────────────────
  const h12 = f.houses12;
  add(7, P.block(
    hi
      ? `द्वादश भाव विश्राम, निद्रा, चिकित्सालय और स्वास्थ्य-लाभ का भाव है${S} द्वादशेश ${pl(h12.lord)} ${N(h12.lordHouse)} भाव में है${S}`
      : `The 12th house is rest, sleep, hospitals and recovery — the house where the body repairs itself. Its lord ${pl(h12.lord)} sits in the ${N(h12.lordHouse)} house${S}`,
    hi
      ? `निद्रा की गुणवत्ता आपके स्वास्थ्य का सबसे विश्वसनीय संकेतक रहेगी${S}`
      : `The quality of your sleep will be the most reliable indicator of your health you have${S}`,
    CARE,
  ), { data: { judgement: h12 } });

  // ── 9–17. The nine grahas ──────────────────────────────────────────────────
  ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
    .forEach((p, i) => grahaChapter(8 + i, p));

  // ── 18. Body house by house ────────────────────────────────────────────────
  add(17, P.block(
    hi
      ? `कालपुरुष सिद्धांत के अनुसार बारह भाव शरीर के बारह भागों को दर्शाते हैं${S} जिन भावों में पीड़ा है, उन्हीं अंगों पर ध्यान चाहिए${S}`
      : `Under the kalapurusha principle the twelve houses map onto twelve parts of the body. The houses under pressure are the parts to watch${S}`,
    P.ul(Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
      const occ = f.placements.filter((p) => p.house === h);
      const mal = occ.filter((p) => ["Saturn", "Mars", "Rahu", "Ketu"].includes(p.planet));
      return `${N(h)} — ${P.bodyByHouse(h)}${mal.length ? ` (${P.planets(mal.map((m) => m.planet))})` : ""}`;
    })),
    CARE,
  ), { placements: f.placements });

  // ── 19. Nakshatra ──────────────────────────────────────────────────────────
  add(18, P.block(
    hi
      ? `आपका जन्म नक्षत्र ${P.nakshatra(f.nakshatra)} है, स्वामी ${pl(f.nakshatraLord)}${S} नक्षत्र का स्वामी शरीर की मूल प्रवृत्ति तय करता है${S}`
      : `Your birth nakshatra is ${P.nakshatra(f.nakshatra)}, ruled by ${pl(f.nakshatraLord)}. The nakshatra lord sets the body's underlying tendency${S}`,
    f.nakshatraLord
      ? (hi ? `${pl(f.nakshatraLord)} शरीर में ${P.bodyByPlanet(f.nakshatraLord)} का अधिकारी है — यही आपकी सबसे संवेदनशील प्रणाली है${S}`
        : `${pl(f.nakshatraLord)} governs ${P.bodyByPlanet(f.nakshatraLord)}, and that is the system in you that reacts first${S}`)
      : "",
    CARE,
  ));

  // ── 20. Ashtakavarga ───────────────────────────────────────────────────────
  add(19, P.block(
    hi
      ? `अष्टकवर्ग भावों को अंकों में तोलता है${S} 28 से कम अंक वाला भाव सहारा माँगता है, 30 से अधिक स्वयं सक्षम है${S}`
      : `Ashtakavarga weighs the houses in points. Below 28 a house asks for support; above 30 it looks after itself${S}`,
    P.ul([
      f.sav[1] != null ? `${N(1)} (${hi ? "शरीर" : "the body"}) — ${f.sav[1]}` : null,
      f.sav[6] != null ? `${N(6)} (${hi ? "रोग" : "disease"}) — ${f.sav[6]}` : null,
      f.sav[8] != null ? `${N(8)} (${hi ? "आयु" : "longevity"}) — ${f.sav[8]}` : null,
      f.sav[12] != null ? `${N(12)} (${hi ? "विश्राम" : "rest"}) — ${f.sav[12]}` : null,
    ].filter(Boolean)),
  ), { data: { sav: f.sav } });

  // ── 21. Yogas ──────────────────────────────────────────────────────────────
  const present = (f.yogas || []).filter((y) => y.detected);
  add(20, P.block(
    hi ? `शास्त्रों में स्वास्थ्य के कुछ निश्चित योग कहे गए हैं${S} आपकी कुंडली में इनकी जाँच की गई${S}` : `The classics name a handful of yogas that bear on health. Each was tested against your chart${S}`,
    present.length
      ? P.ul(present.map((y) => YOGA_TEXT[L][y.key]).filter(Boolean))
      : (hi ? `इनमें से कोई योग नहीं बना — इसका अर्थ है सामान्य स्वास्थ्य, न विशेष रक्षा न विशेष भय${S}` : `None of them is formed, which means ordinary health — neither special protection nor special worry${S}`),
  ), { data: { yogas: f.yogas } });

  // ── 22. Dasha ──────────────────────────────────────────────────────────────
  const watchLords = [...new Set([h6.lord, h8.lord, ...(f.pressure || []).map((p) => p.planet)])].filter(Boolean);
  const watchWindows = (f.timeline || []).filter((w) => watchLords.includes(w.lord)).slice(0, 5);
  add(21, P.block(
    hi
      ? `जिन ग्रहों पर दबाव है, उनकी दशा में शरीर अधिक ध्यान माँगता है${S} आपके लिए ये ग्रह हैं: ${P.planets(watchLords)}${S}`
      : `The body asks for more attention during the periods of the grahas that are under pressure. In your chart those are: ${P.planets(watchLords)}${S}`,
    watchWindows.length
      ? P.ul(watchWindows.map((w) => `${pl(w.lord)} — ${P.fmtDate(w.start)} ${hi ? "से" : "to"} ${P.fmtDate(w.end)}`))
      : (hi ? `उपलब्ध दशा-क्रम में ऐसी कोई अवधि निकट नहीं${S}` : `No such period falls near in the computed sequence${S}`),
    hi ? `वर्तमान दशा: ${pl(f.dasha.maha)}–${pl(f.dasha.antar)}${S}` : `Currently running: ${pl(f.dasha.maha)}–${pl(f.dasha.antar)}${S}`,
    hi ? `इसका अर्थ रोग नहीं, सावधानी है — इन्हीं वर्षों में नियमित जाँच करा लें${S}` : `This does not mean illness. It means these are the years to keep your ordinary check-ups${S}`,
  ), { data: { windows: watchWindows } });

  // ── 23. Transits ───────────────────────────────────────────────────────────
  add(22, P.block(
    hi ? `गोचर इस समय आपके स्वास्थ्य भावों पर इस प्रकार है${S}` : `These are the transits now touching your houses of health${S}`,
    P.ul((f.transits || []).filter((t) => [1, 6, 8, 12].includes(t.house)).slice(0, 6)
      .map((t) => `${pl(t.planet)} — ${sg(t.sign)}, ${N(t.house)} ${P.l2.house}`)),
    f.sadeSati?.active
      ? (hi ? `साढ़े साती चल रही है — नींद, जोड़ और मन पर विशेष ध्यान दें${S}` : `Sade Sati is running: sleep, joints and the mind are the three to look after${S}`)
      : (hi ? `साढ़े साती नहीं चल रही${S}` : `Sade Sati is not running${S}`),
    CARE,
  ));

  // ── 24. Diet & routine ─────────────────────────────────────────────────────
  const el = P.element(f.moonSign);
  const [favour, avoid] = DIET[L][el];
  add(23, P.block(
    hi ? `आपकी ${tatvaName} प्रकृति के अनुसार${S}` : `For your ${tatvaName} constitution${S}`,
    `${hi ? "अनुकूल" : "Favour"}: ${favour}${S}`,
    `${hi ? "कम करें" : "Reduce"}: ${avoid}${S}`,
    hi
      ? `समय पर भोजन और समय पर निद्रा — किसी भी उपाय से अधिक प्रभावी यही दो हैं${S}`
      : `Eat at the same hours and sleep at the same hours. These two do more than any remedy in the next chapter${S}`,
  ), { data: { element: el } });

  // ── 25. Remedies ───────────────────────────────────────────────────────────
  const worst = (f.pressure || [])[0]?.planet || h6.lord;
  const R = P.remedy(worst);
  add(24, P.block(
    hi ? `उपाय उस ग्रह का, जिस पर सबसे अधिक दबाव है — आपकी कुंडली में ${pl(worst)}${S}` : `The remedy is for the graha carrying the most pressure. In your chart that is ${pl(worst)}${S}`,
    R ? P.ul([R.act, R.donate].filter(Boolean)) : "",
    hi
      ? `महामृत्युंजय मंत्र का नित्य पाठ स्वास्थ्य के लिए सर्वमान्य उपाय है${S} उपाय उपचार का पूरक है, विकल्प नहीं${S}`
      : `The daily recitation of the Mahamrityunjaya mantra is the remedy every tradition agrees on for health. A remedy supplements treatment; it never replaces it${S}`,
  ), { data: { remedyPlanet: worst } });

  // ── 26. How to use ─────────────────────────────────────────────────────────
  add(25, P.block(
    hi
      ? `इस रिपोर्ट को भय से नहीं, सावधानी से पढ़ें${S} जिन अंगों का उल्लेख है, उनकी वार्षिक जाँच करा लेना ही पर्याप्त है${S}`
      : `Read this report as caution, not as fear. For the parts of the body it names, an annual check is enough — that is the whole practical instruction${S}`,
    hi
      ? `अध्याय 22 की अवधियों में जाँच नियमित रखें, अध्याय 24 की दिनचर्या अपनाएँ, और अध्याय 25 का उपाय 43 दिन तक निभाएँ${S}`
      : `Keep your check-ups regular in the periods named in chapter 22, follow the routine in chapter 24, and hold the remedy in chapter 25 for forty-three days${S}`,
    hi
      ? `और सबसे महत्वपूर्ण: किसी भी लक्षण के लिए चिकित्सक से मिलें${S} यह रिपोर्ट उनका स्थान नहीं ले सकती${S}`
      : `And above all: see a doctor for anything you actually feel. This report cannot take their place, and was never meant to${S}`,
  ));

  return sec;
}
