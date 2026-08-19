// ─────────────────────────────────────────────────────────────────────────────
// Laal Kitab analysis — deterministic, chart-driven (NO LLM).
//
// Grounds every judgment in the already-computed kundli chart:
//   • planet.house      (1..12, whole-sign houses from the Lagna)
//   • planet.sign       + planet.intensity (exalted / debilitated / own / neutral)
//   • planet.retrograde
//
// Combines classical planet significations (karaka) + house domains + the
// planet's computed dignity into a benefic / mixed / malefic verdict, a plain
// reading, a "state" (strong / weak / asleep), Lal-Kitab debt (rin) indications,
// and the well-known Lal Kitab remedies (upaay). Nothing is invented at runtime —
// the rule tables below are fixed classical references; the chart selects which
// apply.
// ─────────────────────────────────────────────────────────────────────────────

// Planet significations (Lal Kitab / classical karaka).
export const KARAKA = {
  Sun:     { hi: "Surya", role: "father, authority, health, government, soul, reputation" },
  Moon:    { hi: "Chandra", role: "mother, mind, emotions, comforts, fluids, public life" },
  Mars:    { hi: "Mangal", role: "brothers, courage, land, energy, disputes, blood" },
  Mercury: { hi: "Budh", role: "intellect, speech, trade, education, nerves, sisters" },
  Jupiter: { hi: "Guru", role: "wisdom, wealth, children, dharma, teachers, fortune" },
  Venus:   { hi: "Shukra", role: "spouse, luxury, vehicles, arts, comforts, marriage" },
  Saturn:  { hi: "Shani", role: "discipline, labour, longevity, servants, delays, karma" },
  Rahu:    { hi: "Rahu", role: "ambition, foreign, illusion, sudden events, obsession" },
  Ketu:    { hi: "Ketu", role: "detachment, spirituality, sons, past-life, mysticism" },
};

// House life-areas (bhava significations).
export const HOUSE_DOMAIN = {
  1:  "self, body, personality and vitality",
  2:  "wealth, family, speech and accumulated savings",
  3:  "courage, siblings, communication and short efforts",
  4:  "mother, home, property, vehicles and inner peace",
  5:  "children, education, intelligence and past merit",
  6:  "enemies, debts, disease, service and daily work",
  7:  "spouse, marriage, partnerships and business",
  8:  "longevity, obstacles, sudden change and hidden matters",
  9:  "fortune, father, dharma, higher learning and long journeys",
  10: "career, status, authority and public conduct",
  11: "gains, income, elder siblings and fulfilment of desires",
  12: "expenses, losses, foreign lands, isolation and moksha",
};

// Natural benefic / malefic disposition.
const NATURAL = {
  Jupiter: "benefic", Venus: "benefic", Moon: "benefic", Mercury: "benefic",
  Sun: "malefic", Mars: "malefic", Saturn: "malefic", Rahu: "malefic", Ketu: "malefic",
};

// Lal Kitab "pakka ghar" (the planet's permanent/strong house) — well-cited set.
export const PAKKA_GHAR = {
  Sun: 1, Moon: 4, Mars: 3, Mercury: 7, Jupiter: 2, Venus: 7, Saturn: 10, Rahu: 12, Ketu: 6,
};

// Houses where each planet is traditionally considered comfortable (benefic) or
// troubled (malefic) in Lal Kitab. Chart selects; nothing invented at runtime.
export const GOOD_HOUSES = {
  Sun: [1, 5, 9, 10, 11], Moon: [1, 2, 4, 5, 7, 9], Mars: [3, 6, 10, 11],
  Mercury: [1, 2, 4, 5, 6, 7, 10, 11], Jupiter: [1, 2, 4, 5, 7, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 7, 9, 11],
  Saturn: [2, 3, 6, 7, 10, 11], Rahu: [3, 6, 11, 12], Ketu: [3, 6, 9, 12],
};
export const HARD_HOUSES = {
  Sun: [4, 7, 12], Moon: [6, 8, 12], Mars: [1, 2, 4, 7, 8, 12],
  Mercury: [3, 8, 9, 12], Jupiter: [3, 6, 8, 12], Venus: [6, 8, 12],
  Saturn: [1, 4, 5, 8, 12], Rahu: [1, 2, 4, 5, 7, 8, 9], Ketu: [1, 2, 4, 5, 7, 8],
};

// Authentic, widely-published Lal Kitab upaay (remedies) per planet. Safe,
// low-cost home remedies — the system Lal Kitab is loved for.
export const UPAAY = {
  Sun: [
    "Offer water (arghya) to the rising Sun at sunrise daily.",
    "Donate wheat or jaggery on Sundays; avoid taking gifts of these from others.",
    "Keep good relations with your father; serve elders.",
  ],
  Moon: [
    "Offer milk or water at a Shiva temple on Mondays.",
    "Keep a silver item or a small pot of water by your bedside.",
    "Serve and respect your mother; donate rice or white items.",
  ],
  Mars: [
    "Recite Hanuman Chalisa on Tuesdays; offer red lentils (masoor) at a temple.",
    "Keep harmony with brothers; avoid needless disputes.",
    "Donate sweets to children; keep a sweet tongue.",
  ],
  Mercury: [
    "Feed green fodder to a cow; donate green moong on Wednesdays.",
    "Pierce a hole in a copper coin and keep it, or float it in flowing water.",
    "Respect sisters, daughters and aunts; give to eunuchs/needy.",
  ],
  Jupiter: [
    "Apply saffron/haldi tilak; offer besan-laddu or bananas at a temple on Thursdays.",
    "Serve teachers, elders and priests; water a peepal tree.",
    "Keep gold or a yellow item; never disrespect the guru or knowledge.",
  ],
  Venus: [
    "Donate white items (curd, rice, silver) on Fridays.",
    "Keep cleanliness and fragrance in the home; respect the spouse and women.",
    "Feed cows; avoid moral/relationship misconduct.",
  ],
  Saturn: [
    "Serve labourers and the underprivileged; feed crows and stray dogs.",
    "Offer mustard oil at a Shani/Hanuman temple on Saturdays.",
    "Keep conduct honest and disciplined; avoid alcohol and intoxicants.",
  ],
  Rahu: [
    "Keep a solid silver item; flow barley or coal in running water.",
    "Donate to lepers/the destitute; keep the head covered in temples.",
    "Avoid deceit and shortcuts; respect in-laws and elders.",
  ],
  Ketu: [
    "Feed dogs (especially black/spotted); keep a dog if possible.",
    "Donate a two-coloured blanket; serve at a temple.",
    "Respect sons and the spiritual path; keep ears/feet clean.",
  ],
};

// Lal Kitab "rin" (ancestral / karmic debts). Each debt is tied to a
// significator planet + life-house; we mark it INDICATED only when the chart
// actually afflicts that significator (debilitated, in a hard house, or joined
// with Rahu/Ketu/Saturn). Deterministic — the chart decides.
const RIN_RULES = [
  { key: "pitra", name: "Pitra Rin (Ancestral / Paternal Debt)", significators: ["Sun", "Jupiter"], house: 9,
    theme: "duties toward father, ancestors and dharma" },
  { key: "matra", name: "Matra Rin (Maternal Debt)", significators: ["Moon"], house: 4,
    theme: "duties toward mother and the home" },
  { key: "stri", name: "Stri Rin (Debt of the Feminine)", significators: ["Venus"], house: 7,
    theme: "conduct in marriage and respect toward women" },
  { key: "swa", name: "Swa Rin (Self / Karmic Debt)", significators: ["Mercury", "Saturn"], house: 6,
    theme: "past actions, service and honesty in work" },
];

const PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

function planetByName(planets, name) {
  return (planets || []).find((p) => p.name === name) || null;
}

// Combine dignity (intensity) + house comfort into a benefic/mixed/malefic verdict.
function judgePlanet(p) {
  const good = (GOOD_HOUSES[p.name] || []).includes(p.house);
  const hard = (HARD_HOUSES[p.name] || []).includes(p.house);
  const exalted = p.intensity === "Highly Favorable";
  const debilitated = p.intensity === "Unfavorable";
  const own = p.intensity === "Favorable";

  // Score: dignity dominates, house placement adjusts.
  let score = 0;
  if (exalted) score += 2; else if (own) score += 1; else if (debilitated) score -= 2;
  if (good) score += 1; if (hard) score -= 1;
  if (p.retrograde) score -= 0.5;

  let verdict, state;
  if (score >= 2) { verdict = "benefic"; state = "strong"; }
  else if (score <= -2) { verdict = "malefic"; state = "weak"; }
  else { verdict = "mixed"; state = "moderate"; }

  // "Asleep/blind" planet (soya/andha graha): debilitated or deeply afflicted.
  if (debilitated || (hard && !exalted && !own && score <= -1.5)) state = "asleep";

  return { verdict, state, exalted, debilitated, own, good, hard };
}

function planetReading(p, j) {
  const karaka = KARAKA[p.name];
  const domain = HOUSE_DOMAIN[p.house];
  const dignity = j.exalted ? "exalted" : j.debilitated ? "debilitated" : j.own ? "in its own sign" : `in ${p.sign}`;
  const pakka = PAKKA_GHAR[p.name] === p.house ? " This is close to its Lal Kitab permanent seat, adding stability." : "";
  const retro = p.retrograde ? " Being retrograde, its results come with delay and inward focus." : "";

  const tone = {
    strong:   `${p.name} is well placed and ${dignity}, blessing matters of ${domain}.`,
    moderate: `${p.name} gives mixed results here — steady effort in matters of ${domain} pays off.`,
    weak:     `${p.name} is under strain (${dignity}), so matters of ${domain} need care and remedy.`,
    asleep:   `${p.name} is "asleep" (soya graha) here and ${dignity}; its gifts stay dormant until awakened by upaay.`,
  }[j.state];

  return `${p.name} (${karaka.hi}) sits in house ${p.house}, governing ${domain}. As the karaka of ${karaka.role}, ${tone}${pakka}${retro}`;
}

export function analyzeLaalKitab(kundliData) {
  const planets = (kundliData && kundliData.planets) || [];
  const ad = kundliData?.astroDetails || {};

  const judgments = PLANET_ORDER.map((name) => {
    const p = planetByName(planets, name);
    if (!p) return null;
    const j = judgePlanet(p);
    return {
      name,
      hindi: KARAKA[name].hi,
      house: p.house,
      sign: p.sign,
      retrograde: !!p.retrograde,
      nature: NATURAL[name],
      verdict: j.verdict,          // benefic | mixed | malefic
      state: j.state,              // strong | moderate | weak | asleep
      dignity: p.intensity,
      pakka_ghar: PAKKA_GHAR[name],
      in_pakka_ghar: PAKKA_GHAR[name] === p.house,
      significations: KARAKA[name].role,
      reading: planetReading(p, j),
    };
  }).filter(Boolean);

  // Weak / asleep / malefic planets need remedy.
  const needsRemedy = judgments.filter((j) => j.state === "weak" || j.state === "asleep" || (j.verdict === "malefic"));
  const upaay = needsRemedy.map((j) => ({
    planet: j.name,
    reason: `${j.name} is ${j.state} in house ${j.house} — strengthen it with these Lal Kitab upaay.`,
    remedies: UPAAY[j.name] || [],
  }));

  // Rin (debts) — indicated only when the significator is actually afflicted.
  const rin = RIN_RULES.map((rule) => {
    const sig = rule.significators
      .map((n) => judgments.find((j) => j.name === n))
      .filter(Boolean);
    const afflicted = sig.filter((j) => j.state === "weak" || j.state === "asleep" || (j.verdict === "malefic" && j.dignity === "Unfavorable"));
    // Also: Rahu/Ketu sitting in the debt's life-house intensifies the debt.
    const nodeInHouse = judgments.find((j) => (j.name === "Rahu" || j.name === "Ketu") && j.house === rule.house);
    const present = afflicted.length > 0 || !!nodeInHouse;
    const reasons = [];
    afflicted.forEach((j) => reasons.push(`${j.name} is ${j.state}`));
    if (nodeInHouse) reasons.push(`${nodeInHouse.name} occupies the ${rule.house}th house`);
    return {
      key: rule.key,
      name: rule.name,
      present,
      theme: rule.theme,
      reason: present ? `Indicated: ${reasons.join("; ")}. Attend to ${rule.theme}.` : `Not indicated — significators are well placed.`,
      remedy_planets: rule.significators,
    };
  });

  const strong = judgments.filter((j) => j.state === "strong").map((j) => j.name);
  const weak = judgments.filter((j) => j.state === "weak" || j.state === "asleep").map((j) => j.name);
  const activeRin = rin.filter((r) => r.present);

  const dos = [];
  const donts = [];
  needsRemedy.slice(0, 4).forEach((j) => {
    const r = (UPAAY[j.name] || [])[0];
    if (r) dos.push(r);
  });
  // Standard Lal Kitab don'ts drawn from the afflicted planets.
  if (weak.includes("Saturn")) donts.push("Avoid alcohol, non-veg on Saturdays and dishonest dealings.");
  if (weak.includes("Sun")) donts.push("Avoid conflict with father and government authorities.");
  if (weak.includes("Venus")) donts.push("Avoid moral misconduct and disrespect toward women/spouse.");
  if (weak.includes("Moon")) donts.push("Avoid harshness toward mother; don't keep dirty water at home.");
  if (!donts.length) donts.push("Keep conduct honest and clean; don't accept charity of your weak planet's items.");

  const summary = {
    lagna: ad.ascendant,
    rashi: ad.sign,
    nakshatra: kundliData?.panchang?.nakshatra,
    strong_planets: strong,
    weak_planets: weak,
    debts_indicated: activeRin.map((r) => r.name),
  };

  return { summary, judgments, rin, upaay, dos, donts };
}
