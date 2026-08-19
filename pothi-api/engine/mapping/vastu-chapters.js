// ─────────────────────────────────────────────────────────────────────────────
// Vastu Wheel — chapter mapper.
//
// Every verdict here traces to a rule in engine/vastu/rules.js, and every
// chapter names the rule it applied. Where the tradition makes a claim, the
// text says so as tradition ("the classics place…"), never as a finding about
// somebody's health or income — the report is read by people who are already
// worried, and a book that frightens them is a worse product and a worse thing
// to sell.
// ─────────────────────────────────────────────────────────────────────────────

import { ZONES, ZONE, PLACEMENT, PLACEMENTS } from "../vastu/rules.js";

const pick = (o, lang) => (lang === "hi" ? o.hi : o.en);

const L = {
  en: {
    about: "About This Report", mandala: "The Vastu Purusha Mandala",
    facing: "Which Way Your Home Faces", glance: "Your Home at a Glance",
    found: "What This Audit Found", remedies: "Remedies Without Demolition",
    colours: "Colour, Light and Material by Direction", first: "Where to Start",
    zone: (z) => `${z.en} — ${z.deity}`,
    ideal: "Correctly placed", dosh: "Needs attention", acceptable: "Workable",
    notAsked: "Not recorded",
    advisory: "Vastu is a design tradition, not a medical or financial one. This report describes what the classical texts assign to each direction and where your home departs from it. It does not diagnose illness and it does not predict income."
  },
  hi: {
    about: "इस रिपोर्ट के विषय में", mandala: "वास्तु पुरुष मंडल",
    facing: "आपके भवन की दिशा", glance: "आपका भवन — एक दृष्टि में",
    found: "इस परीक्षण में क्या मिला", remedies: "बिना तोड़फोड़ के उपाय",
    colours: "दिशा के अनुसार रंग, प्रकाश और सामग्री", first: "आरंभ कहाँ से करें",
    zone: (z) => `${z.hi} — ${z.deity}`,
    ideal: "सही स्थान पर", dosh: "ध्यान देने योग्य", acceptable: "स्वीकार्य",
    notAsked: "दर्ज नहीं",
    advisory: "वास्तु एक स्थापत्य परंपरा है, चिकित्सा या वित्तीय परामर्श नहीं। यह रिपोर्ट बताती है कि शास्त्र किस दिशा को क्या सौंपते हैं और आपका भवन उससे कहाँ भिन्न है। यह न रोग का निदान करती है, न आय का पूर्वानुमान।"
  }
};

const REMEDY = {
  kitchen: { en: "If the kitchen cannot move, keep the cooking flame itself in the south-east corner of that room and face east while cooking. A fire placed correctly inside a wrong room recovers most of what the rule is after.",
             hi: "यदि रसोई नहीं बदली जा सकती, तो चूल्हा उसी कक्ष के आग्नेय कोण में रखें और पकाते समय मुख पूर्व की ओर रखें। गलत कक्ष में भी सही स्थान पर रखी अग्नि नियम का अधिकांश प्रयोजन पूरा कर देती है।" },
  toilet:   { en: "A toilet that cannot be moved is managed, not cured: keep the door shut, keep it dry, add a sea-salt bowl changed weekly, and keep no water storage or prayer object on the shared wall.",
              hi: "जो शौचालय हटाया नहीं जा सकता, उसका प्रबंध किया जाता है: द्वार बंद रखें, सूखा रखें, सेंधा नमक का पात्र रखें और साप्ताहिक बदलें, तथा साझा दीवार पर जल-भंडार या पूजा-वस्तु न रखें।" },
  master_bedroom: { en: "Where the master bedroom sits wrong, weight is the remedy — put the heaviest almirah along the south-west wall of the room and sleep with the head to the south.",
                    hi: "यदि मुख्य शयनकक्ष गलत दिशा में है तो भार ही उपाय है — सबसे भारी अलमारी कक्ष की नैऋत्य दीवार से लगाएँ और सिरहाना दक्षिण की ओर रखें।" },
  pooja:    { en: "A prayer space in the wrong quarter should at least face east or north, sit above floor level, and share no wall with a toilet or a kitchen flame.",
              hi: "गलत दिशा के पूजा स्थान का मुख कम से कम पूर्व या उत्तर हो, वह भूमि-तल से ऊपर हो, और शौचालय या चूल्हे से दीवार साझा न करे।" },
  water:    { en: "Underground water belongs to the north-east. Where it is elsewhere, keep an open water vessel in the north-east instead — the direction is being honoured, not the plumbing.",
              hi: "भूमिगत जल का स्थान ईशान है। अन्यत्र होने पर ईशान में खुला जल-पात्र रखें — यहाँ दिशा का सम्मान है, नल-व्यवस्था का नहीं।" },
  entrance: { en: "An entrance cannot usually move. Light it well, keep the threshold clean and unobstructed, and hang nothing above the door that presses down on it.",
              hi: "द्वार प्रायः बदला नहीं जा सकता। उसे भरपूर प्रकाशित रखें, देहरी स्वच्छ और अवरोधरहित रखें, और द्वार के ऊपर कोई भारी वस्तु न लगाएँ।" },
  staircase:{ en: "A staircase in a light quarter is heavy where lightness was intended. Keep the space beneath it open and unstored, and light the stairwell brightly.",
              hi: "हल्की दिशा में सीढ़ी वहाँ भार डालती है जहाँ हल्कापन अपेक्षित था। उसके नीचे का स्थान खुला रखें और सीढ़ी को भरपूर प्रकाशित रखें।" },
  store:    { en: "Storage is the easiest thing in a house to move. If it sits in a light quarter, thin it out rather than rebuild anything.",
              hi: "भंडार घर की सबसे सरलता से बदली जाने वाली वस्तु है। यदि वह हल्की दिशा में है तो निर्माण नहीं, सामान घटाइए।" }
};

const COLOUR = {
  N:  { en: "green and pale blue, and as much daylight as the wall will give",           hi: "हरा और हल्का नीला, और दीवार जितना प्रकाश दे सके" },
  NE: { en: "white, cream and light blue; keep this corner the lightest in the house",   hi: "श्वेत, क्रीम और हल्का नीला; यह कोना घर में सबसे हल्का रहे" },
  E:  { en: "white and light green, with the morning sun allowed in",                    hi: "श्वेत और हल्का हरा, प्रातःकालीन सूर्य को आने दें" },
  SE: { en: "red, orange and the warm metals — this is the fire quarter",                hi: "लाल, नारंगी और उष्ण धातुएँ — यह अग्नि का कोण है" },
  S:  { en: "red and terracotta, with heavier furniture",                                hi: "लाल और गेरुआ, भारी फर्नीचर के साथ" },
  SW: { en: "earth tones, browns and deep yellows; the heaviest wall in the house",      hi: "मिट्टी के रंग, भूरा और गहरा पीला; घर की सबसे भारी दीवार" },
  W:  { en: "blue and white, metal and glass",                                           hi: "नीला और श्वेत, धातु और काँच" },
  NW: { en: "white, grey and pale cream; keep it airy and uncluttered",                  hi: "श्वेत, धूसर और हल्का क्रीम; इसे हवादार और खुला रखें" },
  C:  { en: "left open and unpainted by furniture — the centre wants nothing on it",     hi: "खुला रखें, फर्नीचर से न भरें — केंद्र पर कुछ नहीं चाहिए" }
};

export function buildVastuSections(audit, input, lang = "en") {
  const t = L[lang] || L.en;
  const s = [];
  const n = () => s.length + 1;
  const nm = (p) => pick(PLACEMENT[p], lang);
  const zn = (k) => pick(ZONE[k], lang);
  const at = (p) => audit.findings.find((f) => f.placement === p);

  const label = (v) => (v === "ideal" ? t.ideal : v === "dosh" ? t.dosh : t.acceptable);
  const doshas = audit.findings.filter((f) => f.verdict === "dosh");

  // 1 ── about
  s.push({ n: n(), id: "about", title: t.about,
    subtitle: lang === "hi" ? `${s.length + 23} अध्याय` : "What these chapters cover",
    summary: lang === "hi"
      ? "यह रिपोर्ट आपके भवन की दिशा और कक्षों के स्थान की जाँच वास्तु पुरुष मंडल के शास्त्रीय नियमों से करती है।"
      : "This report checks your home's orientation and room placement against the classical rules of the Vastu Purusha Mandala.",
    paras: [ lang === "hi"
      ? "प्रत्येक निष्कर्ष उस नियम के साथ दिया गया है जिससे वह निकला है। जहाँ आपने कोई कक्ष दर्ज नहीं किया, वहाँ रिपोर्ट मौन है — अनुमान नहीं लगाती।"
      : "Every verdict is given with the rule that produced it. Where you did not record a room, the report says nothing rather than guessing." ],
    advisory: t.advisory });

  // 2 ── at a glance
  s.push({ n: n(), id: "glance", title: t.glance,
    subtitle: `${pick(audit.facingZone, lang)} · ${audit.score ?? "—"}/100`,
    summary: lang === "hi"
      ? `आपका भवन ${pick(audit.facingZone, lang)} मुखी है। दर्ज ${audit.asked} स्थानों में ${audit.counts.ideal} सही, ${audit.counts.dosh} ध्यान योग्य।`
      : `Your home faces ${pick(audit.facingZone, lang)}. Of ${audit.asked} placements recorded, ${audit.counts.ideal} sit correctly and ${audit.counts.dosh} need attention.`,
    table: {
      head: lang === "hi" ? ["स्थान", "दिशा", "स्थिति"] : ["Placement", "Direction", "Status"],
      rows: PLACEMENTS.map((p) => {
        const f = at(p.key);
        return [nm(p.key), f ? zn(f.zoneKey) : "—", f ? label(f.verdict) : t.notAsked];
      })
    },
    bullets: [
      lang === "hi" ? `वास्तु अंक: ${audit.score ?? "—"} / 100` : `Vastu score: ${audit.score ?? "—"} / 100`,
      lang === "hi" ? `गंभीर: ${audit.counts.high}` : `High severity: ${audit.counts.high}`
    ] });

  // 3 ── the mandala
  s.push({ n: n(), id: "mandala", title: t.mandala,
    subtitle: lang === "hi" ? "नौ क्षेत्र" : "Nine zones",
    summary: lang === "hi"
      ? "मंडल भवन को नौ क्षेत्रों में बाँटता है; प्रत्येक का एक अधिष्ठाता, एक तत्व और एक निर्धारित उपयोग है।"
      : "The mandala divides a building into nine zones, each with a presiding deity, an element, and an assigned use.",
    table: {
      head: lang === "hi" ? ["क्षेत्र", "तत्व", "किसका"] : ["Zone", "Element", "Governs"],
      rows: ZONES.map((z) => [pick(z, lang), z.element, pick(z.governs, lang)])
    } });

  // 4 ── facing
  const fz = audit.facingZone;
  s.push({ n: n(), id: "facing", title: t.facing, subtitle: pick(fz, lang),
    summary: lang === "hi"
      ? `${pick(fz, lang)} मुखी भवन ${pick(fz.governs, lang)} से जोड़ा जाता है।`
      : `A ${pick(fz, lang)}-facing building is associated with ${pick(fz.governs, lang)}.`,
    paras: [ lang === "hi"
      ? `${pick(fz, lang)} दिशा के अधिष्ठाता ${fz.deity} हैं और इसका तत्व ${fz.element} है। मुख की दिशा भवन का दोष या गुण तय नहीं करती — वह केवल यह तय करती है कि भीतर क्या कहाँ रखा जाना चाहिए।`
      : `${pick(fz, lang)} is presided over by ${fz.deity}, and its element is ${fz.element}. The facing does not by itself make a building good or bad — it sets what should sit where inside it.` ] });

  // 5–13 ── one chapter per zone
  for (const z of ZONES) {
    const here = audit.findings.filter((f) => f.zoneKey === z.key);
    const wrong = here.filter((f) => f.verdict === "dosh");
    s.push({ n: n(), id: `zone_${z.key}`, title: t.zone(z),
      subtitle: pick(z.governs, lang),
      summary: here.length
        ? (lang === "hi" ? `यहाँ है: ${here.map((f) => nm(f.placement)).join(", ")}।`
                         : `Here you have: ${here.map((f) => nm(f.placement)).join(", ")}.`)
        : (lang === "hi" ? "इस क्षेत्र में कुछ दर्ज नहीं है।" : "Nothing was recorded in this zone."),
      paras: [
        lang === "hi"
          ? `${pick(z, lang)} का तत्व ${z.element} है और शास्त्र इसे ${pick(z.governs, lang)} सौंपते हैं।`
          : `${pick(z, lang)} carries the element ${z.element}, and the classics assign it ${pick(z.governs, lang)}.`,
        wrong.length
          ? (lang === "hi"
              ? `यहाँ ${wrong.map((f) => nm(f.placement)).join(" और ")} रखना शास्त्र-विरुद्ध है; उपयुक्त दिशा ${wrong[0].better.map(zn).join(" या ")} है।`
              : `Placing ${wrong.map((f) => nm(f.placement)).join(" and ")} here runs against the rule; the fitting direction is ${wrong[0].better.map(zn).join(" or ")}.`)
          : (lang === "hi" ? "इस क्षेत्र में कोई विरोध नहीं मिला।" : "Nothing in this zone contradicts the rule.")
      ],
      bullets: [
        (lang === "hi" ? "उपयुक्त: " : "Suits: ") + z.ideal.join(", "),
        (lang === "hi" ? "वर्जित: " : "Avoid: ") + z.avoid.join(", "),
        (lang === "hi" ? "रंग: " : "Colour: ") + pick(COLOUR[z.key], lang)
      ] });
  }

  // 14–21 ── one chapter per placement asked about
  for (const p of PLACEMENTS) {
    const f = at(p.key);
    if (!f) continue;
    const z = ZONE[f.zoneKey];
    s.push({ n: n(), id: `place_${p.key}`, title: nm(p.key),
      subtitle: `${zn(f.zoneKey)} — ${label(f.verdict)}`,
      summary: f.verdict === "ideal"
        ? (lang === "hi" ? `${nm(p.key)} ${zn(f.zoneKey)} में है, जो शास्त्रोक्त स्थान है।`
                         : `Your ${nm(p.key).toLowerCase()} is in ${zn(f.zoneKey)}, which is where the texts put it.`)
        : f.verdict === "dosh"
          ? (lang === "hi" ? `${nm(p.key)} ${zn(f.zoneKey)} में है, जो इस स्थान के लिए वर्जित दिशा है।`
                           : `Your ${nm(p.key).toLowerCase()} is in ${zn(f.zoneKey)}, a direction the texts keep it out of.`)
          : (lang === "hi" ? `${nm(p.key)} ${zn(f.zoneKey)} में है — न आदर्श, न वर्जित।`
                           : `Your ${nm(p.key).toLowerCase()} is in ${zn(f.zoneKey)} — neither ideal nor forbidden.`),
      paras: [
        lang === "hi"
          ? `${zn(f.zoneKey)} ${pick(z.governs, lang)} से जुड़ा है और इसका तत्व ${z.element} है।`
          : `${zn(f.zoneKey)} is associated with ${pick(z.governs, lang)}, and its element is ${z.element}.`,
        f.better.length
          ? (lang === "hi" ? `शास्त्रोक्त दिशा: ${f.better.map(zn).join(" या ")}।`
                           : `The direction the texts prefer: ${f.better.map(zn).join(" or ")}.`)
          : (lang === "hi" ? "इसे बदलने की आवश्यकता नहीं।" : "Nothing here needs to move.")
      ],
      bullets: f.verdict === "dosh" && REMEDY[p.key] ? [pick(REMEDY[p.key], lang)] : [],
      advisory: f.severity === "high"
        ? (lang === "hi" ? "यह उन स्थानों में है जिन पर शास्त्र सबसे अधिक बल देते हैं।"
                         : "This is one of the placements the texts weigh most heavily.")
        : undefined });
  }

  // 22 ── what was found
  s.push({ n: n(), id: "found", title: t.found,
    subtitle: doshas.length
      ? (lang === "hi" ? `${doshas.length} ध्यान योग्य` : `${doshas.length} to attend to`)
      : (lang === "hi" ? "कुछ भी वर्जित नहीं" : "Nothing forbidden"),
    summary: doshas.length
      ? (lang === "hi" ? "नीचे केवल वे स्थान हैं जो शास्त्र-विरुद्ध हैं, गंभीरता के क्रम में।"
                       : "Only the placements that contradict the rule, in order of weight.")
      : (lang === "hi" ? "आपने जो दर्ज किया, उसमें कोई वर्जित स्थान नहीं मिला।"
                       : "Nothing you recorded sits in a direction the texts forbid."),
    table: doshas.length ? {
      head: lang === "hi" ? ["स्थान", "है", "होना चाहिए", "गंभीरता"] : ["Placement", "Is in", "Belongs in", "Severity"],
      rows: [...doshas].sort((a, b) => b.weight - a.weight)
        .map((f) => [nm(f.placement), zn(f.zoneKey), f.better.map(zn).join(" / "), f.severity])
    } : undefined,
    advisory: t.advisory });

  // 23 ── remedies
  s.push({ n: n(), id: "remedies", title: t.remedies,
    subtitle: lang === "hi" ? "जो आज किया जा सकता है" : "What can be done today",
    summary: lang === "hi"
      ? "इनमें से किसी उपाय में निर्माण या तोड़फोड़ नहीं है।"
      : "None of these remedies involves construction or demolition.",
    bullets: doshas.length
      ? doshas.map((f) => `${nm(f.placement)} — ${pick(REMEDY[f.placement] || REMEDY.entrance, lang)}`)
      : [lang === "hi" ? "कोई सुधार अपेक्षित नहीं। केंद्र खुला और स्वच्छ रखें।"
                       : "No correction is called for. Keep the centre open and uncluttered."] });

  // 24 ── colour and light
  s.push({ n: n(), id: "colours", title: t.colours,
    subtitle: lang === "hi" ? "नौ दिशाएँ" : "Nine directions",
    summary: lang === "hi"
      ? "रंग सबसे सस्ता वास्तु उपाय है और अकेला ऐसा जो किराए के घर में भी किया जा सकता है।"
      : "Colour is the cheapest Vastu remedy, and the only one that also works in a rented home.",
    table: {
      head: lang === "hi" ? ["दिशा", "रंग और सामग्री"] : ["Direction", "Colour and material"],
      rows: ZONES.map((z) => [pick(z, lang), pick(COLOUR[z.key], lang)])
    } });

  // 25 ── where to start
  const first = [...doshas].sort((a, b) => b.weight - a.weight).slice(0, 3);
  s.push({ n: n(), id: "first", title: t.first,
    subtitle: lang === "hi" ? "क्रम में" : "In order",
    summary: first.length
      ? (lang === "hi" ? "सब एक साथ मत कीजिए। इसी क्रम से आरंभ कीजिए।"
                       : "Do not do everything at once. Start in this order.")
      : (lang === "hi" ? "आरंभ करने को कुछ नहीं — केवल बनाए रखिए।"
                       : "Nothing to start — only to maintain."),
    bullets: first.length
      ? first.map((f, i) => `${i + 1}. ${nm(f.placement)} — ${zn(f.zoneKey)} → ${f.better.map(zn).join(" / ")}`)
      : [lang === "hi" ? "ब्रह्मस्थान खुला रखें और ईशान हल्का।"
                       : "Keep the Brahmasthan open and the north-east light."],
    advisory: t.advisory });

  return s;
}
