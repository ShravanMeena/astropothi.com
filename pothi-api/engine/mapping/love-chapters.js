// ─────────────────────────────────────────────────────────────────────────────
// Love Chart chapter mapper — the exact 24 chapters published for
// astro_chart_listing id = 1.
//
// Every chapter is written from this native's own placements. Where a rule has
// a yes/no answer (manglik, for instance) the answer is stated plainly rather
// than hedged, because a devotee paying for a marriage reading is owed one.
// ─────────────────────────────────────────────────────────────────────────────

const nth = { en: (n) => ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][n], hi: (n) => `${n}वें` };

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

  const add = (i, body, extra = {}) => sec.push({
    n: i + 1, title: T[i], body,
    ...(extra.placements ? { placements: extra.placements } : {}),
    ...(extra.data ? { data: extra.data } : {}),
    ...(extra.bullets ? { bullets: extra.bullets } : {}),
    ...(extra.summary ? { summary: extra.summary } : {}),
    ...(extra.advisory ? { advisory: extra.advisory } : {}),
  });

  const grade = (g) => (g === "strong" ? P.l2.strong : g === "moderate" ? P.l2.moderate : P.l2.weak);

  /** "Venus in Gemini, 10th house, in a friend's sign" — used all through. */
  const describe = (p) => {
    const q = f.placements.find((x) => x.planet === p);
    if (!q) return "";
    return hi
      ? `${pl(p)} ${sg(q.sign)} में, ${N(q.house)} भाव में, ${dg(q.dignity)}`
      : `${pl(p)} in ${sg(q.sign)}, ${N(q.house)} house, ${dg(q.dignity)}`;
  };

  // ── 1. About ───────────────────────────────────────────────────────────────
  add(0, P.block(
    hi
      ? `यह रिपोर्ट आपकी जन्म कुंडली से विवाह और प्रेम के प्रश्न को पढ़ती है। इसमें 24 अध्याय हैं और हर निर्णय आपकी अपनी ग्रह-स्थिति से निकाला गया है — कोई सामान्य राशिफल नहीं${S}`
      : `This report reads the question of love and marriage from your own birth chart. It runs to 24 chapters, and every judgement in it is drawn from your own planetary positions — not from a sun-sign column${S}`,
    P.kv([
      ["lagna", sg(f.lagnaSign)],
      ["rashi", sg(f.moonSign)],
      ["nakshatra", P.nakshatra(f.nakshatra)],
    ]),
    hi
      ? `अध्याय 3 से 11 विवाह के भावों को एक-एक करके पढ़ते हैं, 12 से 14 नवांश को, 15 और 16 दोषों को, 17 और 18 समय को, और 19 से 24 आपके जीवनसाथी, इस बंधन की शक्ति और उपायों को${S}`
      : `Chapters 3 to 11 read the houses of marriage one by one, 12 to 14 the navamsa, 15 and 16 the doshas, 17 and 18 the timing, and 19 to 24 your partner, the strength of the bond and the remedies${S}`,
  ));

  // ── 2. Chart profile ───────────────────────────────────────────────────────
  add(1, P.block(
    hi
      ? `विवाह का कोई भी निर्णय लग्न, चंद्रमा और शुक्र की स्थिति जाने बिना नहीं हो सकता${S} आपकी कुंडली में ये इस प्रकार हैं${S}`
      : `No judgement about marriage can be made without first fixing the Lagna, the Moon and Venus. In your chart they stand as follows${S}`,
    P.ul([describe("Venus"), describe("Mars"), describe("Moon"), describe("Jupiter")]),
  ), { placements: f.placements });

  // ── 3. The 7th house ───────────────────────────────────────────────────────
  const h7 = f.houses7;
  add(2, P.block(
    hi
      ? `सप्तम भाव विवाह, जीवनसाथी और हर प्रकार की साझेदारी का भाव है${S} आपके सप्तम भाव में ${h7.occupants.length ? P.planets(h7.occupants) + " स्थित " + (h7.occupants.length > 1 ? "हैं" : "है") : "कोई ग्रह नहीं"}${S}`
      : `The 7th house is the house of marriage, of the spouse, and of every partnership you enter. In your chart ${h7.occupants.length ? `it holds ${P.planets(h7.occupants)}` : "no planet occupies it"}${S}`,
    h7.aspects.length
      ? (hi ? `इस भाव पर ${P.planets(h7.aspects)} की दृष्टि है${S}` : `${P.planets(h7.aspects)} ${h7.aspects.length > 1 ? "cast their glance" : "casts its glance"} on this house${S}`)
      : (hi ? `इस भाव पर किसी ग्रह की दृष्टि नहीं — विवाह का फल पूर्णतः सप्तमेश पर निर्भर करेगा${S}` : `No planet aspects it, so the whole reading rests on the 7th lord${S}`),
    `${P.l2.strength}: ${grade(h7.grade)}`,
  ), { data: { house: 7, judgement: h7 } });

  // ── 4. The 7th lord ────────────────────────────────────────────────────────
  add(3, P.block(
    hi
      ? `आपके सप्तम भाव का स्वामी ${pl(h7.lord)} है, जो ${sg(h7.lordSign)} में ${N(h7.lordHouse)} भाव में बैठा है और ${dg(h7.lordDignity)} है${S} सप्तमेश जहाँ बैठता है, विवाह का फल वहीं से आता है${S}`
      : `The lord of your 7th house is ${pl(h7.lord)}, placed in ${sg(h7.lordSign)} in the ${N(h7.lordHouse)} house, ${dg(h7.lordDignity)}. Wherever the 7th lord sits is where the marriage will be felt${S}`,
    hi
      ? `अर्थात् आपके विवाह का केंद्र ${P.houseArea(h7.lordHouse)} रहेगा${S}`
      : `In practice that means your married life will centre on ${P.houseArea(h7.lordHouse)}${S}`,
    h7.lordCombust ? (hi ? `सप्तमेश अस्त है — विवाह के प्रश्न पर स्पष्टता देर से आती है${S}` : `The 7th lord is combust: clarity in matters of marriage arrives late rather than never${S}`) : "",
    h7.lordRetrograde ? (hi ? `सप्तमेश वक्री है — पुराने संबंध या पुनर्विचार का योग बनता है${S}` : `The 7th lord is retrograde: old connections resurface, and decisions get revisited${S}`) : "",
  ), { data: { lord: h7.lord, house: h7.lordHouse } });

  // ── 5. Venus ───────────────────────────────────────────────────────────────
  const v = f.venus;
  add(4, P.block(
    hi
      ? `शुक्र प्रेम, आकर्षण और वैवाहिक सुख का कारक है${S} आपकी कुंडली में शुक्र ${sg(v.sign)} में ${N(v.house)} भाव में, ${dg(v.dignity)} है${S}`
      : `Venus is the significator of love, attraction and marital comfort. In your chart Venus stands in ${sg(v.sign)} in the ${N(v.house)} house, ${dg(v.dignity)}${S}`,
    v.combust
      ? (hi ? `शुक्र सूर्य के निकट अस्त है — प्रेम में आपकी अपेक्षा और वास्तविकता के बीच अंतर रह सकता है, और आप अपनी भावनाएँ खुलकर नहीं कहते${S}` : `Venus is combust — burnt by proximity to the Sun. Affection is felt strongly but expressed sparingly, and what you want is not always what you say you want${S}`)
      : (hi ? `शुक्र अस्त नहीं है — आप अपनी भावनाएँ स्पष्ट रूप से व्यक्त कर पाते हैं${S}` : `Venus is not combust, so affection here is expressed openly rather than swallowed${S}`),
    hi
      ? `${N(v.house)} भाव में शुक्र होने से आपका प्रेम ${P.houseArea(v.house)} से जुड़ा रहेगा${S}`
      : `Venus in the ${N(v.house)} ties your affections to ${P.houseArea(v.house)}${S}`,
  ), { data: { venus: v }, placements: f.placements.filter((x) => x.planet === "Venus") });

  // ── 6. Mars ────────────────────────────────────────────────────────────────
  const mars = f.mars;
  add(5, P.block(
    hi
      ? `मंगल आवेग, इच्छा और टकराव का कारक है${S} आपका मंगल ${sg(mars.sign)} में ${N(mars.house)} भाव में, ${dg(mars.dignity)} है${S}`
      : `Mars carries desire, drive and friction. Yours is in ${sg(mars.sign)} in the ${N(mars.house)} house, ${dg(mars.dignity)}${S}`,
    [1, 2, 4, 7, 8, 12].includes(mars.house)
      ? (hi ? `मंगल विवाह-संबंधी भाव में है — इसका विस्तृत परीक्षण अध्याय 15 में है${S}` : `Mars sits in one of the houses that bear on marriage; chapter 15 tests that properly${S}`)
      : (hi ? `मंगल विवाह के संवेदनशील भावों से बाहर है — यह अपने आप में शुभ संकेत है${S}` : `Mars is clear of the houses that trouble marriage, which is a quiet blessing in itself${S}`),
  ));

  // ── 7. Moon ────────────────────────────────────────────────────────────────
  const mn = f.moon;
  add(6, P.block(
    hi
      ? `विवाह में मन का मेल शरीर के मेल से अधिक टिकाऊ होता है${S} आपका चंद्रमा ${sg(mn.sign)} में ${N(mn.house)} भाव में है — इससे पता चलता है कि आपको किस प्रकार का साथ चाहिए${S}`
      : `In marriage the meeting of minds outlasts everything else. Your Moon is in ${sg(mn.sign)} in the ${N(mn.house)} house, and that is what tells us the kind of company you actually need${S}`,
    hi
      ? `आपका मन ${P.houseArea(mn.house)} में शांति खोजता है${S} जीवनसाथी से आप यही चाहेंगे कि वह इस क्षेत्र को समझे${S}`
      : `Your mind looks for its peace in ${P.houseArea(mn.house)}. What you will ask of a partner, without ever saying it aloud, is that they understand this${S}`,
  ));

  // ── 8. 5th house ───────────────────────────────────────────────────────────
  const h5 = f.houses5;
  add(7, P.block(
    hi
      ? `पंचम भाव प्रेम, आकर्षण और प्रेम-संबंध का भाव है — विवाह से पहले की कहानी यहीं लिखी होती है${S} इसका स्वामी ${pl(h5.lord)} ${N(h5.lordHouse)} भाव में है${S}`
      : `The 5th house is romance, attraction and the courtship that comes before any wedding. Its lord ${pl(h5.lord)} sits in the ${N(h5.lordHouse)} house${S}`,
    `${P.l2.strength}: ${grade(h5.grade)}`,
    h5.occupants.length ? (hi ? `पंचम भाव में ${P.planets(h5.occupants)}${S}` : `Occupying the 5th: ${P.planets(h5.occupants)}${S}`) : "",
  ), { data: { house: 5, judgement: h5 } });

  // ── 9. 2nd house ───────────────────────────────────────────────────────────
  const h2 = f.houses2;
  add(8, P.block(
    hi
      ? `द्वितीय भाव विवाह के बाद के कुटुंब, संचित धन और वाणी का भाव है${S} विवाह टिकता है या नहीं, यह अक्सर द्वितीय भाव बताता है — क्योंकि यहीं से साथ रहने का दैनिक व्यवहार आता है${S}`
      : `The 2nd house is the family you build after marriage, the money you keep and the words you use. Whether a marriage lasts is often written here, because this is where daily conduct lives${S}`,
    `${pl(h2.lord)} — ${sg(h2.lordSign)}, ${N(h2.lordHouse)} ${P.l2.house}, ${dg(h2.lordDignity)}${S}`,
    `${P.l2.strength}: ${grade(h2.grade)}`,
  ), { data: { house: 2, judgement: h2 } });

  // ── 10. 8th house ──────────────────────────────────────────────────────────
  const h8 = f.houses8;
  add(9, P.block(
    hi
      ? `अष्टम भाव घनिष्ठता, जीवनसाथी का धन और बंधन की आयु देखता है${S} यह भाव कठिन माना जाता है, किंतु विवाह में यही गहराई भी देता है${S}`
      : `The 8th house holds intimacy, the partner's resources, and how long the bond endures. It is a difficult house by nature, but in marriage it is also the one that gives depth${S}`,
    `${pl(h8.lord)} — ${N(h8.lordHouse)} ${P.l2.house}, ${dg(h8.lordDignity)}${S}`,
    h8.maleficOccupants.length
      ? (hi ? `${P.planets(h8.maleficOccupants)} अष्टम भाव में — विवाह में धैर्य और खुलकर बात करने की आवश्यकता रहेगी${S}` : `${P.planets(h8.maleficOccupants)} in the 8th asks for patience and for saying things out loud rather than storing them${S}`)
      : (hi ? `अष्टम भाव में कोई पाप ग्रह नहीं — घनिष्ठता सहज रहेगी${S}` : `No malefic occupies the 8th, so intimacy comes without struggle${S}`),
  ), { data: { house: 8, judgement: h8 } });

  // ── 11. 12th house ─────────────────────────────────────────────────────────
  const h12 = f.houses12;
  add(10, P.block(
    hi
      ? `द्वादश भाव शय्या-सुख, एकांत और निजी जीवन का भाव है${S} शास्त्र इसे विवाह-सुख का सूक्ष्म परीक्षण मानते हैं${S}`
      : `The 12th house governs the bed, privacy and the life two people share when no one is watching. The classics treat it as the subtler test of marital happiness${S}`,
    `${pl(h12.lord)} — ${N(h12.lordHouse)} ${P.l2.house}, ${dg(h12.lordDignity)}${S}`,
    h12.occupants.includes("Venus")
      ? (hi ? `शुक्र द्वादश भाव में — शास्त्रों में यह शय्या-सुख के लिए उत्तम कहा गया है${S}` : `Venus in the 12th is called excellent for this by the classics — it is one of the few places a "bad" house is a blessing${S}`)
      : "",
  ), { data: { house: 12, judgement: h12 } });

  // ── 12. Navamsa ────────────────────────────────────────────────────────────
  const d9 = f.navamsa;
  add(11, P.block(
    hi
      ? `नवांश (D9) विवाह की कुंडली है${S} जन्म कुंडली वादा करती है, नवांश बताता है कि वह वादा निभेगा या नहीं${S} आपका नवांश लग्न ${sg(d9.lagnaSign)} है${S}`
      : `The navamsa is the chart of marriage. The birth chart makes the promise; the navamsa says whether it is kept. Your navamsa Lagna is ${sg(d9.lagnaSign)}${S}`,
    P.ul((d9.placements || []).slice(0, 9).map((p) => `${pl(p.planet)} — ${sg(p.sign)}`)),
  ), { data: { navamsa: d9 }, placements: d9.placements });

  // ── 13. Venus in navamsa ───────────────────────────────────────────────────
  const vD9 = (d9.placements || []).find((p) => p.planet === "Venus");
  add(12, P.block(
    hi
      ? `नवांश में शुक्र ${sg(vD9?.sign)} में है${S} जन्म कुंडली में शुक्र ${sg(v.sign)} में था — दोनों को साथ पढ़ने से प्रेम का वास्तविक स्वरूप सामने आता है${S}`
      : `In the navamsa your Venus falls in ${sg(vD9?.sign)}, where in the birth chart it stood in ${sg(v.sign)}. Read together, the two say what your affection is actually made of${S}`,
    vD9 && vD9.sign === v.sign
      ? (hi ? `दोनों कुंडलियों में एक ही राशि — इसे वर्गोत्तम कहते हैं और यह शुक्र को अत्यंत बलवान बनाता है${S}` : `The same sign in both charts is called vargottama, and it makes Venus unusually strong — what you feel and what you show are the same thing${S}`)
      : (hi ? `दोनों भिन्न हैं — जो आप दिखाते हैं और जो भीतर अनुभव करते हैं, उनमें अंतर रहता है${S}` : `The two differ, so what you show in affection and what you feel underneath are not quite the same${S}`),
  ));

  // ── 14. 7th lord in navamsa ────────────────────────────────────────────────
  const l7D9 = (d9.placements || []).find((p) => p.planet === h7.lord);
  add(13, P.block(
    hi
      ? `सप्तमेश ${pl(h7.lord)} नवांश में ${sg(l7D9?.sign)} में है${S} यही स्थिति बताती है कि विवाह का वादा कितना टिकाऊ है${S}`
      : `Your 7th lord ${pl(h7.lord)} falls in ${sg(l7D9?.sign)} in the navamsa. This placement, more than any other, says how durable the promise of marriage is${S}`,
    l7D9 && l7D9.sign === h7.lordSign
      ? (hi ? `सप्तमेश वर्गोत्तम है — विवाह का वादा दृढ़ है${S}` : `The 7th lord is vargottama: the promise holds${S}`)
      : "",
  ));

  // ── 15. Manglik ────────────────────────────────────────────────────────────
  const mg = f.manglik;
  const mgVerdict = !mg.detected ? P.l2.absent : mg.severity === "cancelled" ? P.l2.cancelled : P.l2.present;
  add(14, P.block(
    hi
      ? `मांगलिक दोष तब बनता है जब मंगल लग्न, चंद्र या शुक्र से 1, 2, 4, 7, 8 या 12वें भाव में हो${S} आपकी कुंडली में मंगल ${N(mg.houseFromLagna)} भाव में ${sg(mg.sign)} राशि में है${S}`
      : `Manglik dosha is raised when Mars occupies the 1st, 2nd, 4th, 7th, 8th or 12th from the Lagna, the Moon or Venus. In your chart Mars is in the ${N(mg.houseFromLagna)} house in ${sg(mg.sign)}${S}`,
    `${P.l2.verdict}: ${mgVerdict}${S}`,
    mg.detected
      ? (hi ? `किन-किन से बना: ${mg.from.map((x) => (x === "lagna" ? "लग्न" : x === "moon" ? "चंद्र" : "शुक्र")).join(", ")}${S}`
        : `Raised from: ${mg.from.map((x) => (x === "lagna" ? "the Lagna" : x === "moon" ? "the Moon" : "Venus")).join(", ")}${S}`)
      : (hi ? `किसी भी संदर्भ से यह दोष नहीं बनता — इस विषय की चिंता छोड़ दीजिए${S}` : `It is not raised from any of the three references. You may set this worry down${S}`),
    // Only meaningful when the dosha was raised in the first place — listing
    // cancellations under a "Not present" verdict reads as a contradiction.
    mg.detected && mg.cancellations.length
      ? (hi ? `भंग के कारण: ${mg.cancellations.length}${S} शास्त्र कहते हैं कि दो या अधिक भंग होने पर यह दोष प्रभावहीन हो जाता है${S}`
        : `Cancellations found: ${mg.cancellations.length}. The classics hold that two or more cancellations render the dosha inoperative${S}`)
      : "",
  ), { data: { manglik: mg }, advisory: mg.detected && mg.severity !== "cancelled"
    ? (hi ? `विवाह से पूर्व मंगल के सामान्य उपाय करें — अध्याय 23 देखें${S}` : `Take the ordinary Mars remedies before marriage — chapter 23 lists them${S}`)
    : undefined });

  // ── 16. Other doshas ───────────────────────────────────────────────────────
  const otherIssues = [];
  if (h7.maleficOccupants.length) otherIssues.push(hi ? `सप्तम भाव में ${P.planets(h7.maleficOccupants)}` : `${P.planets(h7.maleficOccupants)} in the 7th`);
  if (h7.lordCombust) otherIssues.push(hi ? "सप्तमेश अस्त" : "the 7th lord combust");
  if (v.combust) otherIssues.push(hi ? "शुक्र अस्त" : "Venus combust");
  if (f.sadeSati?.active) otherIssues.push(hi ? "साढ़े साती चल रही है" : "Sade Sati running");
  add(15, P.block(
    hi
      ? `मांगलिक के अतिरिक्त और कौन-सी स्थितियाँ विवाह को प्रभावित करती हैं, यह यहाँ देखा गया है${S}`
      : `Beyond manglik, these are the conditions in your chart that bear on marriage${S}`,
    otherIssues.length ? P.ul(otherIssues) : (hi ? `कोई अन्य दोष नहीं मिला${S}` : `Nothing else of concern was found${S}`),
  ), { data: { issues: otherIssues.length } });

  // ── 17. Timing ─────────────────────────────────────────────────────────────
  const tm = f.timing;
  add(16, P.block(
    hi
      ? `विवाह उस दशा में फलित होता है जो सप्तम भाव, सप्तमेश या शुक्र को सक्रिय करे${S} आपकी कुंडली में ये ग्रह हैं: ${P.planets(tm.activators)}${S}`
      : `Marriage ripens in a period that activates the 7th house, its lord, or Venus. In your chart those are: ${P.planets(tm.activators)}${S}`,
    tm.windows.length
      ? P.ul(tm.windows.map((w) => `${pl(w.lord)} — ${P.fmtDate(w.start)} ${hi ? "से" : "to"} ${P.fmtDate(w.end)}`))
      : (hi ? `उपलब्ध दशा-क्रम में इनमें से कोई अवधि नहीं मिली${S}` : `No such window falls inside the computed dasha sequence${S}`),
    hi ? `वर्तमान दशा: ${pl(f.dasha.maha)}–${pl(f.dasha.antar)}${S}` : `Currently running: ${pl(f.dasha.maha)}–${pl(f.dasha.antar)}${S}`,
  ), { data: { windows: tm.windows } });

  // ── 18. Transits ───────────────────────────────────────────────────────────
  add(17, P.block(
    hi
      ? `गोचर दशा का समर्थन करता है, उसे बदलता नहीं${S} इस समय आपके विवाह भावों पर ये ग्रह गोचर कर रहे हैं${S}`
      : `Transits support what the dasha has already promised; they do not overrule it. These are the transits now touching your houses of marriage${S}`,
    P.ul((f.transits || []).filter((t) => [7, 5, 2, 8].includes(t.house)).slice(0, 6)
      .map((t) => `${pl(t.planet)} — ${sg(t.sign)}, ${N(t.house)} ${P.l2.house}`)),
    f.sadeSati?.active
      ? (hi ? `साढ़े साती चल रही है — निर्णय धीरे और सोच-समझकर लें${S}` : `Sade Sati is running: take decisions slowly, and take advice${S}`)
      : "",
  ));

  // ── 19. Partner ────────────────────────────────────────────────────────────
  add(18, P.block(
    hi
      ? `सप्तम भाव में स्थित ग्रह, अथवा उसका अभाव होने पर सप्तमेश, जीवनसाथी का स्वरूप बताता है${S} आपके लिए यह ${pl(f.partnerPlanet)} है — अर्थात् ${P.partnerBy(f.partnerPlanet)}${S}`
      : `The planet in the 7th — or, when it is empty, its lord — describes the partner. For you that is ${pl(f.partnerPlanet)}: ${P.partnerBy(f.partnerPlanet)}${S}`,
    hi
      ? `दिशा: ${P.direction(f.partnerPlanet)} — शास्त्र कहते हैं कि जीवनसाथी इसी दिशा से आता है${S}`
      : `Direction: ${P.direction(f.partnerPlanet)}. The classics hold that the partner comes from this direction relative to your birthplace${S}`,
  ), { data: { partnerPlanet: f.partnerPlanet } });

  // ── 20. Love or arranged ───────────────────────────────────────────────────
  const loveSignals = [
    h5.occupants.includes("Venus"), [5, 7, 11].includes(v.house),
    (f.chart.aspectsOnHouse[7] || []).includes("Venus"),
    h5.lordHouse === 7 || h7.lordHouse === 5,
  ].filter(Boolean).length;
  add(19, P.block(
    hi
      ? `पंचम (प्रेम) और सप्तम (विवाह) भावों के बीच संबंध जितना गहरा हो, प्रेम-विवाह की संभावना उतनी अधिक${S}`
      : `The closer the link between the 5th house (love) and the 7th (marriage), the more the chart leans towards a love match${S}`,
    loveSignals >= 2
      ? (hi ? `आपकी कुंडली में ${loveSignals} ऐसे संकेत मिले — प्रेम-विवाह का योग स्पष्ट है${S}` : `Your chart shows ${loveSignals} such links, so a love match is clearly indicated${S}`)
      : loveSignals === 1
        ? (hi ? `एक संकेत मिला — दोनों संभव हैं, परिचय किसी परिचित के माध्यम से हो सकता है${S}` : `One such link is present: either route is open, and an introduction through someone known is likely${S}`)
        : (hi ? `कोई सीधा संकेत नहीं — परिवार द्वारा तय विवाह की ओर झुकाव है${S}` : `No direct link is present, so the chart leans towards an arranged match${S}`),
  ), { data: { loveSignals } });

  // ── 21. Strengths ──────────────────────────────────────────────────────────
  const strengths = [];
  if (h7.grade === "strong") strengths.push(hi ? "सप्तम भाव बलवान है" : "the 7th house itself is strong");
  if (!v.combust) strengths.push(hi ? "शुक्र अस्त नहीं है" : "Venus is unburnt and free to give");
  if (h7.goodAspects.length) strengths.push(hi ? `सप्तम भाव पर ${P.planets(h7.goodAspects)} की शुभ दृष्टि` : `${P.planets(h7.goodAspects)} watches over the 7th`);
  if (!mg.detected || mg.severity === "cancelled") strengths.push(hi ? "मांगलिक दोष प्रभावी नहीं" : "manglik is not operative");
  if (h2.grade !== "weak") strengths.push(hi ? "कुटुंब भाव स्थिर है" : "the family house is steady");
  add(20, P.block(
    hi ? `हर कुंडली में कुछ ऐसा होता है जिस पर विवाह टिकता है${S} आपकी कुंडली में ये हैं${S}` : `Every chart has something the marriage can rest on. In yours, these${S}`,
  ), { bullets: strengths.length ? strengths : [hi ? "सप्तमेश अपना कार्य कर रहा है" : "the 7th lord is doing its work"] });

  // ── 22. Friction ───────────────────────────────────────────────────────────
  const frictions = [];
  if (h7.maleficOccupants.length) frictions.push(hi ? `सप्तम भाव में ${P.planets(h7.maleficOccupants)} — मतभेद खुलकर सामने आएँगे` : `${P.planets(h7.maleficOccupants)} in the 7th: disagreements will be out in the open, not hidden`);
  if (v.combust) frictions.push(hi ? "शुक्र अस्त — भावनाएँ कही नहीं जातीं" : "Venus combust: affection gets felt but not said");
  if (h7.lordDignity === "debilitated") frictions.push(hi ? "सप्तमेश नीच का — अपेक्षाएँ पूरी होने में देर" : "the 7th lord is debilitated: expectations take longer to be met");
  if (mg.detected && mg.severity === "strong") frictions.push(hi ? "मांगलिक दोष प्रबल — क्रोध पर संयम आवश्यक" : "manglik is strongly raised: temper needs managing");
  if (h8.maleficOccupants.length) frictions.push(hi ? "अष्टम भाव में पाप ग्रह — घनिष्ठता में धैर्य चाहिए" : "malefics in the 8th: intimacy needs patience");
  add(21, P.block(
    hi ? `जिस बात को पहले से जान लिया जाए, वह आधी सुलझ जाती है${S}` : `A difficulty seen in advance is half resolved. These are yours${S}`,
  ), { bullets: frictions.length ? frictions : [hi ? "कोई बड़ा टकराव-बिंदु नहीं मिला" : "no major point of friction was found"] });

  // ── 23. Remedies ───────────────────────────────────────────────────────────
  const remedyPlanet = mg.detected && mg.severity !== "cancelled" ? "Mars" : v.combust ? "Venus" : h7.lord;
  const R = P.remedy(remedyPlanet);
  add(22, P.block(
    hi
      ? `उपाय उसी ग्रह का किया जाता है जो सुधार चाहता है${S} आपकी कुंडली में वह ${pl(remedyPlanet)} है${S}`
      : `A remedy is done for the graha that needs help, not for all nine. In your chart that is ${pl(remedyPlanet)}${S}`,
    R ? P.ul([R.act, R.day && `${P.head("day") || "Day"}: ${R.day}`, R.donate].filter(Boolean)) : "",
    hi
      ? `साथ ही: गुरुवार को पीली वस्तु का दान और शुक्रवार को श्वेत वस्तु का दान विवाह-सुख के सामान्य उपाय हैं${S}`
      : `Alongside: a yellow offering on Thursday and a white one on Friday are the ordinary remedies for marital happiness${S}`,
  ), { data: { remedyPlanet } });

  // ── 24. How to use ─────────────────────────────────────────────────────────
  add(23, P.block(
    hi
      ? `यह रिपोर्ट भविष्यवाणी नहीं, दिशा है${S} अध्याय 15 और 16 के निर्णय अंतिम हैं — उन्हें दोबारा किसी से पूछने की आवश्यकता नहीं${S}`
      : `This report is a direction, not a prophecy. The verdicts in chapters 15 and 16 are settled — you do not need to have them checked again${S}`,
    hi
      ? `अध्याय 17 की अवधियों को ध्यान में रखें, अध्याय 22 की बातों पर पहले से काम करें, और अध्याय 23 का उपाय कम से कम 43 दिन तक निभाएँ${S}`
      : `Keep the windows in chapter 17 in mind, work on chapter 22 before it becomes a problem, and hold the remedy in chapter 23 for at least forty-three days${S}`,
    hi
      ? `किसी भी बात पर संदेह हो तो हमें WhatsApp पर लिखें — आचार्य आपकी कुंडली देखकर उत्तर देंगे${S}`
      : `If anything here is unclear, message us on WhatsApp and an acharya will answer with your chart in front of them${S}`,
  ));

  return sec;
}
