import { SIGNS } from "./astro-constants.js";

const MALEFICS = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
const GANDMOOL_NAKSHATRAS = new Set([
  "Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Mula", "Revati"
]);

// ── Manglik (Mangal) Dosha — detection + classical cancellations ─────────────
// Inlined here so Manglik has a SINGLE home: detection and every cancellation /
// mitigator are evaluated in one place. analyzeManglikCancellations is exported
// (and re-exported by manglik-cancellations.js for back-compat) for the AI
// prompt and PDF renderer, but the detectDoshas() Manglik verdict is derived
// from this same function — there is no second, divergent evaluation.
const OWN_SIGNS_OF_MARS = new Set(["Aries", "Scorpio"]);
const EXALTATION_SIGN_OF_MARS = "Capricorn";
const HARMLESS_SIGNS_FOR_7TH = new Set(["Cancer", "Leo", "Sagittarius", "Pisces"]);
const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

function ordSuffix(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function isOpposite(houseA, houseB) {
  return ((houseA - houseB + 12) % 12) === 6 || ((houseB - houseA + 12) % 12) === 6;
}

export function analyzeManglikCancellations(data) {
  const mars = data.planets.find(p => p.name === "Mars");
  if (!mars) {
    return { marsHouse: null, marsSign: null, marsRetrograde: null, isManglik: false,
      netVerdict: "no-dosha", cancellations: [], mitigators: [],
      summary: "Mars position unavailable — cannot evaluate Manglik dosha." };
  }

  const isManglik = MANGLIK_HOUSES.includes(mars.house);
  if (!isManglik) {
    return { marsHouse: mars.house, marsSign: mars.sign, marsRetrograde: mars.retrograde, isManglik: false,
      netVerdict: "no-dosha", cancellations: [], mitigators: [],
      summary: `Mars is in the ${mars.house}${ordSuffix(mars.house)} house — outside the six Manglik houses (1, 2, 4, 7, 8, 12). The dosha does not apply.` };
  }

  const cancellations = [];
  const mitigators = [];

  // 1. Mars in own sign (Aries / Scorpio)
  if (OWN_SIGNS_OF_MARS.has(mars.sign)) {
    cancellations.push({ key: "own-sign", label: `Mars in own sign (${mars.sign})`, applies: true, weight: "full",
      detail: "Classical texts (Bhavishya Phaladeepika, Saravali) hold that Mars in his own sign — Aries or Scorpio — neutralises the Manglik effect entirely. Mars expresses cleanly without affliction." });
  }
  // 2. Mars exalted in Capricorn
  if (mars.sign === EXALTATION_SIGN_OF_MARS) {
    cancellations.push({ key: "exalted", label: "Mars exalted in Capricorn", applies: true, weight: "full",
      detail: "Exalted Mars is at his peak strength and discipline. The classical view is that the Manglik harm dissolves; the energy expresses as drive, leadership and clean ambition rather than friction." });
  }
  // 3. Mars conjunct Jupiter (Guru-Mangal yoga partial cancellation)
  const jup = data.planets.find(p => p.name === "Jupiter");
  if (jup && jup.house === mars.house) {
    cancellations.push({ key: "jupiter-conjunct", label: "Mars conjunct Jupiter", applies: true, weight: "partial",
      detail: "Jupiter's wisdom tempers Mars's heat. Marriage friction softens substantially; the dosha is treated as substantially reduced in classical match-making." });
  }
  // 4. Mars conjunct Moon
  const moon = data.planets.find(p => p.name === "Moon");
  if (moon && moon.house === mars.house) {
    cancellations.push({ key: "moon-conjunct", label: "Mars conjunct Moon", applies: true, weight: "partial",
      detail: "The Moon's emotional nature draws the heat out of Mars. Several authorities hold this as a cancellation of Manglik dosha." });
  }
  // 5. Mars conjunct Mercury or Venus — partial mitigation
  const mer = data.planets.find(p => p.name === "Mercury");
  if (mer && mer.house === mars.house) {
    mitigators.push({ key: "mercury-conjunct", label: "Mars conjunct Mercury", applies: true, weight: "partial",
      detail: "Mercury's intellect channels Mars's force into communication and skill. Severity reduces — though not a complete cancellation." });
  }
  const ven = data.planets.find(p => p.name === "Venus");
  if (ven && ven.house === mars.house) {
    mitigators.push({ key: "venus-conjunct", label: "Mars conjunct Venus", applies: true, weight: "partial",
      detail: "Venus rules marriage; conjunction with Mars in a marital house can heighten passion but mitigates outright friction. Severity reduces." });
  }
  // 6. Jupiter aspecting Mars (5th, 7th, 9th aspect)
  if (jup) {
    const diff = ((mars.house - jup.house + 12) % 12) + 1;
    if ([5, 7, 9].includes(diff)) {
      cancellations.push({ key: "jupiter-aspect", label: `Jupiter aspecting Mars (${diff}${ordSuffix(diff)} aspect)`, applies: true, weight: "partial",
        detail: "Jupiter's protective aspect lands on Mars — the wisdom-aspect cushions the Mars house. Marriage friction is softened; classical authorities treat this as substantial cancellation." });
    }
  }
  // 7. Saturn aspecting Mars (3rd, 7th, 10th)
  const sat = data.planets.find(p => p.name === "Saturn");
  if (sat) {
    const diff = ((mars.house - sat.house + 12) % 12) + 1;
    if ([3, 7, 10].includes(diff)) {
      mitigators.push({ key: "saturn-aspect", label: `Saturn aspecting Mars (${diff}${ordSuffix(diff)} aspect)`, applies: true, weight: "partial",
        detail: "Saturn slows and disciplines Mars. The impulsive heat that drives marital friction is held in check; severity is reduced." });
    }
  }
  // 8. Mars in 7th in friendly/neutral signs that traditions accept
  if (mars.house === 7 && HARMLESS_SIGNS_FOR_7TH.has(mars.sign)) {
    cancellations.push({ key: "7th-friendly-sign", label: `Mars in 7th in ${mars.sign}`, applies: true, weight: "partial",
      detail: `Mars in the 7th house in ${mars.sign} is held by several authorities (notably the Mansagari) to be Manglik-cancelled because the sign tempers Mars's marital aggression.` });
  }
  // 9. Mars retrograde — some authorities hold the dosha is reduced
  if (mars.retrograde) {
    mitigators.push({ key: "retrograde", label: "Mars retrograde", applies: true, weight: "partial",
      detail: "A retrograde Mars expresses inwardly rather than outwardly. Several authorities — including BV Raman — hold that retrogression reduces the manifest Manglik effect." });
  }
  // 10. Mars-Rahu opposition — does NOT cancel; flag as escalator
  const rahu = data.planets.find(p => p.name === "Rahu");
  if (rahu && isOpposite(mars.house, rahu.house)) {
    mitigators.push({ key: "mars-rahu-opposition-warning", label: "Warning — Mars opposite Rahu", applies: true, weight: "none",
      detail: "Mars opposite Rahu does NOT cancel the dosha — it amplifies the volatile axis. Worth knowing alongside the cancellation picture." });
  }

  const fullCancellations = cancellations.filter(c => c.weight === "full");
  const partialCancellations = cancellations.filter(c => c.weight === "partial");

  let netVerdict, summary;
  if (fullCancellations.length > 0) {
    netVerdict = "fully-cancelled";
    summary = `Mars sits in the ${mars.house}${ordSuffix(mars.house)} house, but ${fullCancellations.length} classical full cancellation${fullCancellations.length > 1 ? "s apply" : " applies"} — the Manglik effect is held to be neutralised. Standard match-making criteria can proceed.`;
  } else if (partialCancellations.length >= 2) {
    netVerdict = "substantially-reduced";
    summary = `Mars is Manglik-positioned, but ${partialCancellations.length} partial cancellations stack — the dosha is substantially reduced. Marriage compatibility can be evaluated normally with light Mars remedies.`;
  } else if (partialCancellations.length === 1 || mitigators.length > 0) {
    netVerdict = "partially-reduced";
    summary = `Mars is Manglik-positioned with one partial cancellation or mitigator. Severity is reduced but not removed — Mars remedies remain advisable, and matching with a like Manglik is still classically preferred.`;
  } else {
    netVerdict = "active";
    summary = `Mars in the ${mars.house}${ordSuffix(mars.house)} house gives full-strength Manglik dosha — no classical cancellations are present in this chart. Follow the standard remedies and consider matching with another Manglik.`;
  }

  return { marsHouse: mars.house, marsSign: mars.sign, marsRetrograde: mars.retrograde, isManglik: true,
    netVerdict, cancellations, mitigators, summary };
}

function signIndex(sign) {
  return SIGNS.indexOf(sign);
}

function angularSeparation(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function housesBetween(fromSign, toSign) {
  const fi = signIndex(fromSign);
  const ti = signIndex(toSign);
  if (fi < 0 || ti < 0) return 0;
  return ((ti - fi + 12) % 12) + 1;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function conjunct(a, b, orb = 12) {
  if (!a || !b) return false;
  if (a.sign === b.sign) return true;
  return angularSeparation(a.longitude, b.longitude) < orb;
}

// ── Severity scoring ────────────────────────────────────────────────────────
// Each present dosha now carries a chart-specific `score` (0-100) instead of a
// fixed tier. Scores map to labels via the bands the report already documents
// (1-29 Mild, 30-54 Moderate, 55-74 High, 75-100 Severe — dosh-report-mapper).
// `closeness` grades a conjunction: an exact (0°) conjunction scores 1, one at
// the edge of the orb scores ~0, and a same-sign-but-wide pairing keeps a small
// floor so it still registers (it is classically a conjunction).
function closeness(a, b, orb) {
  if (!a || !b) return 0;
  const sep = angularSeparation(a.longitude, b.longitude);
  if (sep >= orb) return a.sign === b.sign ? 0.3 : 0;
  return 1 - sep / orb;
}

function scoreBand(floor, span, factor) {
  const f = Math.max(0, Math.min(1, factor));
  return Math.round(floor + span * f);
}

function labelForScore(n) {
  if (n >= 75) return "severe";
  if (n >= 55) return "high";
  if (n >= 30) return "moderate";
  if (n >= 1) return "mild";
  return "none";
}

export function detectDoshas(data) {
  const { planets, houses, transitSnapshot } = data;
  const P = (n) => planets.find(p => p.name === n);
  const entries = [];

  // push helper: derive the coarse `severity` label from the numeric score so
  // every consumer (mapper, narrate, doshasFromEntries) stays consistent.
  const add = (e) => {
    const score = e.present ? Math.max(1, Math.round(e.score ?? 0)) : 0;
    entries.push({ ...e, score, severity: e.present ? labelForScore(score) : "none" });
  };

  // ── Manglik Dosha (single source of truth) ─────────────────────────────────
  // Detection AND classical cancellations are evaluated together here via
  // analyzeManglikCancellations — there is no longer a second, cancellation-
  // blind Manglik verdict. A fully-cancelled Manglik is reported as NOT present
  // (it must not surface as an active "moderate" dosha); partial cancellations
  // and mitigators reduce the score within the active band.
  {
    const mars = P("Mars");
    const m = analyzeManglikCancellations(data); // { isManglik, netVerdict, marsHouse, cancellations, mitigators, summary }

    // House weight — 7th/8th (marriage, longevity) are the harshest placements.
    const HOUSE_WEIGHT = { 7: 1.0, 8: 0.85, 1: 0.7, 4: 0.6, 12: 0.55, 2: 0.5 };
    const activeBase = scoreBand(50, 30, HOUSE_WEIGHT[m.marsHouse] ?? 0.6); // ~65-80

    let present = false;
    let score = 0;
    switch (m.netVerdict) {
      case "active":
        present = true; score = activeBase; break;
      case "partially-reduced":
        present = true; score = Math.round(activeBase * 0.6); break;   // → Moderate
      case "substantially-reduced":
        present = true; score = Math.round(activeBase * 0.4); break;   // → Mild
      case "fully-cancelled":
      case "no-dosha":
      default:
        present = false; score = 0; break;
    }

    add({
      key: "manglik",
      name: "Manglik Dosha",
      name_hi: "मांगलिक दोष",
      present,
      score,
      // Reason now always reflects the reconciled verdict (placement + the
      // cancellation picture), not a placement-only statement.
      reason: m.summary || (mars
        ? `Mars occupies the ${ordinal(mars.house)} house.`
        : "Mars position not available."),
      reason_hi: m.summary_hi || (mars
        ? `मंगल ${mars.house}वें भाव में है${present ? "" : " — यह छह मांगलिक भावों (1, 2, 4, 7, 8, 12) में नहीं आता"}।`
        : "मंगल की स्थिति उपलब्ध नहीं।"),
      // Machine-readable verdict so the report/UI can show "cancelled" honestly.
      manglikVerdict: m.netVerdict,
      cancellations: (m.cancellations || []).map(c => c.label),
      mitigators: (m.mitigators || []).map(c => c.label),
      remedy: present ? "Recite Hanuman Chalisa on Tuesdays; donate red masoor dal and red cloth." : undefined,
    });
  }

  // ── Kaal Sarp Dosha ───────────────────────────────────────────────────────
  {
    const rahu = P("Rahu"), ketu = P("Ketu");
    const others = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    let present = false;
    let reason = "Planets are distributed across both sides of the Rahu–Ketu axis.";
    let reason_hi = "ग्रह राहु–केतु अक्ष के दोनों ओर बँटे हुए हैं।";
    let score = 0;
    if (rahu && ketu) {
      const rLon = rahu.longitude;
      const inForwardArc = (lon) => ((lon - rLon + 360) % 360) < 180;
      const forwardAll = others.every(n => { const p = P(n); return p ? inForwardArc(p.longitude) : false; });
      const backwardAll = others.every(n => { const p = P(n); return p ? !inForwardArc(p.longitude) : false; });
      present = forwardAll || backwardAll;
      if (present) {
        reason = `All seven classical planets are hemmed on one side of the Rahu (${rahu.sign}) – Ketu (${ketu.sign}) axis.`;
        reason_hi = `सातों शास्त्रीय ग्रह राहु (${rahu.sign}) – केतु (${ketu.sign}) अक्ष के एक ही ओर सिमटे हुए हैं।`;
        // Partial ("leaking") Kaal Sarp — a planet sitting almost on a node — is
        // less severe than a clean hemming. Grade by how close the nearest
        // planet is to either node.
        const nearestToAxis = Math.min(...others.map(n => {
          const p = P(n); if (!p) return 180;
          return Math.min(angularSeparation(p.longitude, rahu.longitude), angularSeparation(p.longitude, ketu.longitude));
        }));
        score = nearestToAxis < 6 ? 68 : 82; // leaking vs clean
      }
    }
    add({ key: "kaal_sarp", name: "Kaal Sarp Dosha", name_hi: "काल सर्प दोष", present, score, reason, reason_hi,
      remedy: present ? "Perform Kaal Sarp Nivaran pooja at Trimbakeshwar; chant Mahamrityunjaya mantra daily." : undefined,
        remedy_hi: present ? "त्र्यंबकेश्वर में काल सर्प निवारण पूजा कराएँ; प्रतिदिन महामृत्युंजय मंत्र का जाप करें।" : undefined });
  }

  // ── Sade Sati ─────────────────────────────────────────────────────────────
  {
    const moon = P("Moon");
    const moonSign = moon?.sign;
    const saturnTransitSign = transitSnapshot?.saturnSign;
    let present = false;
    let reason = "Transit Saturn is outside the 12th/1st/2nd band from natal Moon.";
    let reason_hi = "गोचर का शनि जन्म-चंद्र से 12वें/1ले/2रे भाव की पट्टी से बाहर है।";
    let score = 0;
    if (moonSign && saturnTransitSign) {
      const dist = housesBetween(moonSign, saturnTransitSign);
      present = dist === 12 || dist === 1 || dist === 2;
      if (present) {
        // Peak (Madhya, 1st-from-Moon) is the heaviest phase; Rising then Setting.
        const phase = dist === 12 ? "Rising (Aroh)" : dist === 1 ? "Peak (Madhya)" : "Setting (Avaroh)";
        const PHASE_WEIGHT = { 1: 1.0, 12: 0.7, 2: 0.55 };
        score = scoreBand(50, 30, PHASE_WEIGHT[dist] ?? 0.7);
        reason = `Transit Saturn is in ${saturnTransitSign} — the ${ordinal(dist)} from natal Moon (${moonSign}). Phase: ${phase}.`;
        reason_hi = `गोचर का शनि ${saturnTransitSign} में है — जन्म-चंद्र (${moonSign}) से ${dist}वें भाव में। चरण: ${dist === 12 ? "आरोह" : dist === 1 ? "मध्य" : "अवरोह"}।`;
      } else {
        reason = `Transit Saturn is in ${saturnTransitSign} — the ${ordinal(dist)} from natal Moon (${moonSign}).`;
        reason_hi = `गोचर का शनि ${saturnTransitSign} में है — जन्म-चंद्र (${moonSign}) से ${dist}वें भाव में।`;
      }
    }
    add({ key: "sade_sati", name: "Sade Sati", name_hi: "साढ़े साती", present, score, reason, reason_hi,
      remedy: present ? "Worship Shani on Saturdays; donate black sesame, iron, mustard oil; chant Dasaratha Shani Stotra." : undefined,
        remedy_hi: present ? "शनिवार को शनिदेव की पूजा करें; काले तिल, लोहा और सरसों का तेल दान करें; दशरथ शनि स्तोत्र का पाठ करें।" : undefined });
  }

  // ── Pitra Dosha ───────────────────────────────────────────────────────────
  {
    const sun = P("Sun"), rahu = P("Rahu"), ketu = P("Ketu"), saturn = P("Saturn");
    const sunCloseness = Math.max(closeness(sun, rahu, 15), closeness(sun, ketu, 15), closeness(sun, saturn, 15));
    const sunAfflicted = conjunct(sun, rahu, 15) || conjunct(sun, ketu, 15) || conjunct(sun, saturn, 15);
    const ninthOccupants = planets.filter(p => p.house === 9).map(p => p.name);
    const ninthAfflicted = ninthOccupants.includes("Rahu") || ninthOccupants.includes("Ketu") || ninthOccupants.includes("Saturn");
    const present = Boolean(sunAfflicted) || ninthAfflicted;
    const parts = [];
    if (sunAfflicted) parts.push("Sun is conjoined by Rahu, Ketu, or Saturn.");
    if (ninthAfflicted) parts.push(`9th house (ancestors) is occupied by ${ninthOccupants.filter(n => ["Rahu", "Ketu", "Saturn"].includes(n)).join(", ")}.`);
    // Base on tightest Sun affliction; +10 if the 9th is also afflicted (both → stronger).
    let score = present ? scoreBand(40, 25, sunCloseness) + (ninthAfflicted ? 10 : 0) : 0;
    if (present && !sunAfflicted) score = 45; // 9th-only affliction
    add({ key: "pitra_dosha", name: "Pitra Dosha", name_hi: "पितृ दोष", present, score: Math.min(score, 85),
      reason: present ? parts.join(" ") : "Sun and the 9th house are free from Rahu/Ketu/Saturn affliction.",
      reason_hi: present
        ? "सूर्य राहु, केतु अथवा शनि से युत है, अथवा पितरों का नवम भाव इनसे प्रभावित है।"
        : "सूर्य और नवम भाव राहु/केतु/शनि के प्रभाव से मुक्त हैं।",
      remedy: present ? "Offer tarpan to ancestors on Amavasya; perform Pitra Paksha shraddha; donate to Brahmins." : undefined,
      remedy_hi: present ? "अमावस्या को पितरों का तर्पण करें; पितृ पक्ष में श्राद्ध कराएँ; ब्राह्मणों को दान दें।" : undefined });
  }

  // ── Guru Chandal Dosha ────────────────────────────────────────────────────
  {
    const jup = P("Jupiter"), rahu = P("Rahu"), ketu = P("Ketu");
    let present = false, which = "", score = 0;
    if (conjunct(jup, rahu, 15)) { present = true; which = "Rahu"; score = scoreBand(45, 30, closeness(jup, rahu, 15)); }
    else if (conjunct(jup, ketu, 15)) { present = true; which = "Ketu"; score = scoreBand(45, 30, closeness(jup, ketu, 15)); }
    add({ key: "guru_chandal", name: "Guru Chandal Dosha", name_hi: "गुरु चांडाल दोष", present, score,
      reason: present ? `Jupiter is conjoined with ${which} — wisdom contaminated by shadow.` : "Jupiter is clear of tight conjunction with Rahu or Ketu.",
      reason_hi: present ? `गुरु ${which} से युत है — ज्ञान पर छाया का प्रभाव।` : "गुरु राहु अथवा केतु की निकट युति से मुक्त है।",
      remedy: present ? "Chant Guru Beej mantra — Om Gram Greem Graum Sah Gurave Namah; feed cows on Thursdays." : undefined });
  }

  // ── Shrapit Dosha (Saturn + Rahu) ─────────────────────────────────────────
  {
    const sat = P("Saturn"), rahu = P("Rahu");
    const present = conjunct(sat, rahu, 12);
    add({ key: "shrapit", name: "Shrapit Dosha", name_hi: "श्रापित दोष", present, score: present ? scoreBand(55, 30, closeness(sat, rahu, 12)) : 0,
      reason: present ? `Saturn (${sat?.sign}) and Rahu (${rahu?.sign}) are conjoined — carryover curse pattern.` : "Saturn and Rahu are not tightly conjoined.",
      reason_hi: present ? `शनि (${sat?.sign}) और राहु (${rahu?.sign}) युत हैं — पूर्वजन्म के श्राप का योग।` : "शनि और राहु निकट युति में नहीं हैं।",
      remedy: present ? "Perform Shrapit Dosha Nivaran pooja; recite Mahamrityunjaya; worship Lord Shiva." : undefined });
  }

  // ── Angarak Dosha (Mars + Rahu) ───────────────────────────────────────────
  {
    const mars = P("Mars"), rahu = P("Rahu");
    const present = conjunct(mars, rahu, 12);
    add({ key: "angarak", name: "Angarak Dosha", name_hi: "अंगारक दोष", present, score: present ? scoreBand(55, 30, closeness(mars, rahu, 12)) : 0,
      reason: present ? `Mars (${mars?.sign}) and Rahu (${rahu?.sign}) are conjoined — volatile, accident-prone pattern.` : "Mars and Rahu are not tightly conjoined.",
      reason_hi: present ? `मंगल (${mars?.sign}) और राहु (${rahu?.sign}) युत हैं — उग्र एवं दुर्घटना-प्रवण योग।` : "मंगल और राहु निकट युति में नहीं हैं।",
      remedy: present ? "Worship Hanuman; chant Mangal Beej mantra; donate masoor dal on Tuesdays." : undefined });
  }

  // ── Grahan Dosha ──────────────────────────────────────────────────────────
  {
    const sun = P("Sun"), moon = P("Moon"), rahu = P("Rahu"), ketu = P("Ketu");
    const sunGrahan = conjunct(sun, rahu, 10) || conjunct(sun, ketu, 10);
    const moonGrahan = conjunct(moon, rahu, 10) || conjunct(moon, ketu, 10);
    const present = sunGrahan || moonGrahan;
    const tight = Math.max(closeness(sun, rahu, 10), closeness(sun, ketu, 10), closeness(moon, rahu, 10), closeness(moon, ketu, 10));
    const parts = [];
    if (sunGrahan) parts.push("Sun is eclipsed by a nodal axis.");
    if (moonGrahan) parts.push("Moon is eclipsed by a nodal axis.");
    add({ key: "grahan", name: "Grahan Dosha", name_hi: "ग्रहण दोष", present, score: present ? scoreBand(45, 30, tight) : 0,
      reason: present ? parts.join(" ") : "Sun and Moon are free from close Rahu/Ketu conjunction.",
      reason_hi: present ? "सूर्य अथवा चंद्र राहु/केतु से निकट युत है — ग्रहण योग।" : "सूर्य और चंद्र राहु/केतु की निकट युति से मुक्त हैं।",
      remedy: present ? "Perform Navagraha pooja; recite Surya Kavach and Chandra Kavach." : undefined });
  }

  // ── Vish Yoga (Moon + Saturn) ─────────────────────────────────────────────
  {
    const moon = P("Moon"), sat = P("Saturn");
    const present = conjunct(moon, sat, 12);
    add({ key: "vish_yoga", name: "Vish Yoga", name_hi: "विष योग", present, score: present ? scoreBand(40, 30, closeness(moon, sat, 12)) : 0,
      reason: present ? "Moon is conjoined with Saturn — emotional heaviness / Vish pattern." : "Moon and Saturn are not tightly conjoined.",
      reason_hi: present ? "चंद्र शनि से युत है — मन पर भार, विष योग।" : "चंद्र और शनि निकट युति में नहीं हैं।",
      remedy: present ? "Worship Lord Shiva on Mondays; chant Chandra and Shani mantras." : undefined });
  }

  // ── Kemadruma Dosha ───────────────────────────────────────────────────────
  {
    const moon = P("Moon");
    if (moon) {
      const moonHouse = moon.house;
      const second = ((moonHouse % 12) + 1);
      const twelfth = ((moonHouse + 10) % 12) + 1;
      const isSupport = (p) => p.name !== "Moon" && p.name !== "Rahu" && p.name !== "Ketu";
      const neighbours = planets.filter(p => isSupport(p) && (p.house === second || p.house === twelfth));
      const conjunctMoon = planets.filter(p => isSupport(p) && p.house === moonHouse);
      const present = neighbours.length === 0 && conjunctMoon.length === 0;
      add({ key: "kemadruma", name: "Kemadruma Dosha", name_hi: "केमद्रुम दोष", present, score: present ? 45 : 0,
        reason_hi: present ? "चंद्र से दूसरे और बारहवें भाव में कोई ग्रह नहीं, और चंद्र के साथ भी कोई नहीं — चंद्र असहाय है।" : "चंद्र को दूसरे, बारहवें अथवा अपने ही भाव में ग्रह का सहारा प्राप्त है।",
        reason: present ? "No planet occupies the 2nd or 12th from Moon, and Moon is unsupported — isolated Moon." : "Moon has planetary support in the 2nd, 12th, or the same house.",
        remedy: present ? "Worship Moon on Mondays; offer white sweets and milk; chant Chandra mantra." : undefined,
        remedy_hi: present ? "सोमवार को चंद्रदेव की पूजा करें; श्वेत मिष्ठान्न और दूध अर्पित करें; चंद्र मंत्र का जाप करें।" : undefined });
    }
  }

  // ── Paap Kartari Yoga ─────────────────────────────────────────────────────
  {
    const paap12 = planets.some(p => p.house === 12 && MALEFICS.includes(p.name));
    const paap2 = planets.some(p => p.house === 2 && MALEFICS.includes(p.name));
    const present = paap12 && paap2;
    add({ key: "paap_kartari", name: "Paap Kartari Yoga", name_hi: "पाप कर्तरी योग", present, score: present ? 48 : 0,
      reason: present ? "Malefics occupy both the 12th and 2nd from Lagna — the Ascendant is hemmed between them." : "Ascendant is not hemmed between malefics.",
      reason_hi: present ? "लग्न से बारहवें और दूसरे — दोनों भावों में पाप ग्रह हैं, लग्न इनके बीच घिरा है।" : "लग्न पाप ग्रहों के बीच नहीं घिरा है।",
      remedy: present ? "Strengthen the Lagna lord; recite Ishta Devata mantra and Gayatri daily." : undefined });
  }

  // ── Shakat Dosha ──────────────────────────────────────────────────────────
  {
    const moon = P("Moon"), jup = P("Jupiter");
    if (moon && jup) {
      const dist = housesBetween(jup.sign, moon.sign);
      const present = dist === 6 || dist === 8 || dist === 12;
      add({ key: "shakat", name: "Shakat Dosha", name_hi: "शकट दोष", present, score: present ? 22 : 0,
        reason_hi: present ? `चंद्र गुरु से ${dist}वें भाव में है — शकट स्थिति।` : `चंद्र गुरु से ${dist}वें भाव में है — शकट भावों से बाहर।`,
        reason: present ? `Moon is in the ${ordinal(dist)} from Jupiter — Shakat position.` : `Moon is in the ${ordinal(dist)} from Jupiter — outside the Shakat houses.`,
        remedy: present ? "Strengthen Jupiter — chant Guru mantra; consider Yellow Sapphire after consultation." : undefined,
        remedy_hi: present ? "गुरु को बल दें — गुरु मंत्र का जाप करें; परामर्श के बाद ही पुखराज धारण करें।" : undefined });
    }
  }

  // ── Gandmool Dosha ────────────────────────────────────────────────────────
  {
    const moon = P("Moon");
    const present = moon ? GANDMOOL_NAKSHATRAS.has(moon.nakshatra) : false;
    // 1st pada of a Gandmool nakshatra is classically the most severe.
    const pada = data?.panchang?.nakshatraPada ?? moon?.nakshatraPada;
    const score = present ? (pada === 1 ? 45 : pada === 4 ? 35 : 25) : 0;
    add({ key: "gandmool", name: "Gandmool Dosha", name_hi: "गंडमूल दोष", present, score,
      reason_hi: moon
        ? (present
          ? `चंद्र ${moon.nakshatra} नक्षत्र में है${pada ? ` (पाद ${pada})` : ""} — यह राहु, केतु अथवा बुध द्वारा शासित संधि-नक्षत्र है।`
          : `चंद्र ${moon.nakshatra} नक्षत्र में है — यह गंडमूल नक्षत्र नहीं है।`)
        : "चंद्र की स्थिति उपलब्ध नहीं।",
      reason: moon ? (present ? `Moon is in ${moon.nakshatra}${pada ? ` (pada ${pada})` : ""} — a junctional nakshatra ruled by Rahu, Ketu, or Mercury.` : `Moon is in ${moon.nakshatra} — not a Gandmool nakshatra.`) : "Moon position not available.",
      remedy: present ? "Perform Gandmool shanti pooja on the same nakshatra day; chant the ruling planet's mantra." : undefined,
        remedy_hi: present ? "उसी नक्षत्र के दिन गंडमूल शांति पूजा कराएँ; नक्षत्र-स्वामी के मंत्र का जाप करें।" : undefined });
  }

  // ── Daridra Dosha ─────────────────────────────────────────────────────────
  {
    const eleventh = houses.find(h => h.house === 11);
    const twelfthOccupants = planets.filter(p => p.house === 12).map(p => p.name);
    const present = Boolean(eleventh && twelfthOccupants.includes(eleventh.lord));
    add({ key: "daridra", name: "Daridra Dosha", name_hi: "दरिद्र दोष", present, score: present ? 50 : 0,
      reason: present ? `Lord of the 11th (${eleventh?.lord}) is placed in the 12th house — earning energy leaks into loss.` : "Lord of the 11th house is not placed in the 12th.",
      reason_hi: present ? `लाभेश (${eleventh?.lord}) द्वादश भाव में है — आय व्यय में बह जाती है।` : "लाभेश द्वादश भाव में नहीं है।",
      remedy: present ? "Worship Goddess Lakshmi on Fridays; chant Kuber mantra; donate on Purnima." : undefined });
  }

  return entries;
}

export function doshasFromEntries(entries) {
  const byKey = Object.fromEntries(entries.map(e => [e.key, e]));
  const presentEntries = entries.filter(e => e.present);
  const details = presentEntries.length
    ? presentEntries.map(e => `${e.name}: ${e.reason}`)
    : ["No major classical doshas are active in this chart based on the computed positions."];
  return {
    manglik: byKey.manglik?.present ?? false,
    sadeSati: byKey.sade_sati?.present ?? false,
    kaalSarp: byKey.kaal_sarp?.present ?? false,
    pitraDosha: byKey.pitra_dosha?.present ?? false,
    guruChandal: byKey.guru_chandal?.present ?? false,
    details,
    list: entries
  };
}
