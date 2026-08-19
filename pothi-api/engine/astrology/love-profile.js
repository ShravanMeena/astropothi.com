// ─────────────────────────────────────────────────────────────────────────────
// The reader-facing layer of the Love report.
//
// The old report had one chapter per chart component — "The 7th House",
// "Venus", "The Navamsa" — and told the reader which planets sat where. That
// is a description of a chart, not an answer to a question, and nobody buys a
// chart description. Every classical source says the same thing about this:
// Venus, the Moon and the 7th house must be read TOGETHER, because each alone
// says almost nothing about how a person actually loves.
//
// So this module answers questions instead. Each function below takes the whole
// chart and returns one judgement a reader recognises — how quickly they
// attach, what they need to feel safe, where the fights will start — with the
// placements that produced it attached, so the chapter can always show its
// working.
//
// Everything here is deterministic. No LLM, nothing invented: each judgement is
// a classical rule applied to a computed position, and `why` carries the rule
// that fired so a sceptical reader (or an astrologer) can check it.
// ─────────────────────────────────────────────────────────────────────────────

const ELEMENT = {
  Aries: "fire", Leo: "fire", Sagittarius: "fire",
  Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air",
  Cancer: "water", Scorpio: "water", Pisces: "water"
};

const MODE = {
  Aries: "movable", Cancer: "movable", Libra: "movable", Capricorn: "movable",
  Taurus: "fixed", Leo: "fixed", Scorpio: "fixed", Aquarius: "fixed",
  Gemini: "dual", Virgo: "dual", Sagittarius: "dual", Pisces: "dual"
};

const STRONG = ["exalted", "moolatrikona", "own"];
const WEAK = ["debilitated", "enemy"];

/**
 * A house grade, and a loud complaint if it is missing.
 *
 * computeLifeFacts puts grade/lord/occupants FLAT on facts.houses7 — there is
 * no `.judgement` wrapper, and reading one returned undefined on every chart
 * while `|| "moderate"` made it look like a real verdict. Every dial in this
 * file was reading nothing for a while. So the accessor is now explicit and
 * throws in development rather than defaulting: a wrong path must fail, not
 * quietly average out.
 */
function gradeOfHouse(f, house) {
  const h = f[`houses${house}`];
  if (!h) throw new Error(`love-profile: facts.houses${house} is missing`);
  if (!h.grade) throw new Error(`love-profile: facts.houses${house} has no grade`);
  return h.grade;
}

const el = (sign) => ELEMENT[sign] || "earth";
const mode = (sign) => MODE[sign] || "fixed";
const strong = (d) => STRONG.includes(d);
const weak = (d) => WEAK.includes(d);

/** Houses between two placements, counted the Vedic way (1 = same house). */
const between = (a, b) => ((a - b + 12) % 12) + 1;

/**
 * Does planet A aspect planet B? Everything aspects the 7th from itself; Mars
 * adds 4 and 8, Jupiter 5 and 9, Saturn 3 and 10. Rahu and Ketu are given
 * Jupiter's aspects, which is the common north-Indian convention.
 */
const SPECIAL = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9] };
function aspects(from, to) {
  if (!from || !to) return false;
  const d = between(to.house, from.house);
  return (SPECIAL[from.planet || from.name] || [7]).includes(d);
}

/** Two planets in the same house, which is the tightest relationship there is. */
const conjunct = (a, b) => !!a && !!b && a.house === b.house;

/** Either one aspecting the other, or both sitting together. */
const linked = (a, b) => conjunct(a, b) || aspects(a, b) || aspects(b, a);

/** 0–100, for the dials on the snapshot page. Deliberately never 0 or 100. */
const dial = (score, max) => Math.max(12, Math.min(94, Math.round(50 + (score / max) * 42)));

// ── who is where ─────────────────────────────────────────────────────────────

function pick(f, name) {
  const p = f.placements.find((x) => x.planet === name);
  if (!p) return null;
  return { ...p, name, element: el(p.sign), mode: mode(p.sign) };
}

// ── 1. How they attach ───────────────────────────────────────────────────────

/**
 * The Moon is the standard significator of emotional nature — what a person
 * needs in order to feel safe. Its element sets the tempo, its dignity sets how
 * steady it is, and Saturn or Rahu touching it changes the shape of the whole
 * thing: Saturn makes a person slow and careful about opening, Rahu makes the
 * need for reassurance louder.
 */
function attachment(f) {
  const moon = pick(f, "Moon");
  const saturn = pick(f, "Saturn");
  const rahu = pick(f, "Rahu");
  const why = [];

  let style = "steady";
  if (el(moon.sign) === "water") { style = "quick"; why.push("moonWater"); }
  else if (el(moon.sign) === "fire") { style = "quick"; why.push("moonFire"); }
  else if (el(moon.sign) === "air") { style = "measured"; why.push("moonAir"); }
  else { style = "steady"; why.push("moonEarth"); }

  // Saturn on the Moon overrides the element: it slows everything down.
  if (linked(saturn, moon)) { style = "guarded"; why.push("saturnOnMoon"); }
  // Rahu makes attachment intense and hungry for confirmation.
  else if (linked(rahu, moon)) { style = "intense"; why.push("rahuOnMoon"); }

  // A Moon in the 6th, 8th or 12th is classically restless, whatever its sign.
  const unsettled = [6, 8, 12].includes(moon.house);
  if (unsettled) why.push("moonDusthana");
  if (weak(moon.dignity)) why.push("moonWeak");
  if (strong(moon.dignity)) why.push("moonStrong");

  const reassurance = (linked(rahu, moon) ? 2 : 0) + (unsettled ? 1 : 0) + (weak(moon.dignity) ? 1 : 0)
                    - (strong(moon.dignity) ? 1 : 0) - (linked(saturn, moon) ? 1 : 0);

  return {
    style,                                   // quick | steady | measured | guarded | intense
    needsReassurance: reassurance >= 2,
    needsSpace: style === "guarded" || el(moon.sign) === "air",
    opensSlowly: style === "guarded" || style === "measured",
    moonHouse: moon.house, moonSign: moon.sign, moonDignity: moon.dignity,
    why
  };
}

// ── 2. How they show love ────────────────────────────────────────────────────

/**
 * Venus is how affection is expressed rather than how it is felt — the
 * difference the old report never drew. A watery Venus and a watery Moon feel
 * the same and behave differently.
 */
function expression(f) {
  const venus = pick(f, "Venus");
  const why = [`venus${el(venus.sign)[0].toUpperCase()}${el(venus.sign).slice(1)}`];

  const mode_ = {
    fire: "demonstrative",   // says it, shows it, quickly
    earth: "practical",      // does things rather than says them
    air: "verbal",           // talks it through
    water: "devotional"      // feels it, and shows it in small private ways
  }[el(venus.sign)];

  // A combust Venus is the classic "feels far more than it shows".
  const withheld = venus.combust;
  if (withheld) why.push("venusCombust");
  // Retrograde Venus revisits old attachments and second-guesses affection.
  const revisits = venus.retrograde;
  if (revisits) why.push("venusRetrograde");
  if (strong(venus.dignity)) why.push("venusStrong");
  if (weak(venus.dignity)) why.push("venusWeak");

  return {
    mode: mode_, withheld, revisits,
    house: venus.house, sign: venus.sign, dignity: venus.dignity,
    generous: strong(venus.dignity) && !venus.combust,
    why
  };
}

// ── 3. What draws them ───────────────────────────────────────────────────────

/**
 * Attraction is Venus's sign (what looks good to them) crossed with the 7th
 * house sign (what they end up committing to). Those two disagreeing is one of
 * the most useful things a love report can tell somebody, and it is invisible
 * if you give each its own chapter.
 */
function attraction(f) {
  const venus = pick(f, "Venus");
  const seventhSign = f.houses.find((h) => h.house === 7)?.sign;
  const fifth = f.houses5;
  const why = [];

  const draw = {
    fire: "confidence", earth: "stability", air: "intelligence", water: "warmth"
  };
  const first = draw[el(venus.sign)];
  const lasting = draw[el(seventhSign)] || first;
  const split = first !== lasting;
  if (split) why.push("venusSeventhSplit");

  const seventhOccupied = (f.houses7.occupants || []).length > 0;
  if (seventhOccupied) why.push("seventhOccupied");

  return {
    first, lasting, split,
    venusSign: venus.sign, seventhSign,
    fifthGrade: gradeOfHouse(f, 5),
    why
  };
}

// ── 4. Chemistry ─────────────────────────────────────────────────────────────

/**
 * Venus and Mars together is the classical marker of physical chemistry;
 * separated and unrelated, attraction builds slowly instead of igniting. Kept
 * deliberately in the language of warmth and pace rather than anything
 * explicit — see docs/05-legal.md on advertising standards.
 */
function chemistry(f) {
  const venus = pick(f, "Venus");
  const mars = pick(f, "Mars");
  const why = [];

  let level = "steady";
  if (conjunct(venus, mars)) { level = "immediate"; why.push("venusMarsConjunct"); }
  else if (linked(venus, mars)) { level = "strong"; why.push("venusMarsAspect"); }
  else if ([1, 5, 7, 9].includes(between(mars.house, venus.house))) { level = "warm"; why.push("venusMarsTrine"); }
  else { level = "slow"; why.push("venusMarsApart"); }

  const eighth = gradeOfHouse(f, 8);
  const intensityRisk = level === "immediate" && (weak(mars.dignity) || mars.house === 8);
  if (intensityRisk) why.push("marsUnsteady");

  return { level, intensityRisk, eighthGrade: eighth, marsHouse: mars.house, marsSign: mars.sign, why };
}

// ── 5. How they talk ─────────────────────────────────────────────────────────

/**
 * Mercury and the 3rd house. This is the section that makes a love report
 * useful rather than mystical, because "we fight about nothing" is almost
 * always a difference in how two people deliver a sentence.
 */
function communication(f) {
  const merc = pick(f, "Mercury");
  const mars = pick(f, "Mars");
  const saturn = pick(f, "Saturn");
  const jup = pick(f, "Jupiter");
  const third = f.houses.find((h) => h.house === 3);
  const why = [];

  let style = {
    fire: "direct", earth: "practical", air: "analytical", water: "indirect"
  }[el(merc.sign)];

  if (linked(mars, merc)) { style = "blunt"; why.push("mercuryMars"); }
  else if (linked(saturn, merc)) { style = "measured"; why.push("mercurySaturn"); }
  else if (linked(jup, merc)) { style = "expansive"; why.push("mercuryJupiter"); }
  else why.push(`mercury${el(merc.sign).replace(/^./, (c) => c.toUpperCase())}`);

  if (merc.combust) why.push("mercuryCombust");
  if (merc.retrograde) why.push("mercuryRetrograde");

  return {
    style,                                   // direct | practical | analytical | indirect | blunt | measured | expansive
    thinksBeforeSpeaking: merc.retrograde || linked(saturn, merc),
    saysItPlainly: style === "direct" || style === "blunt",
    withdrawsInConflict: linked(saturn, merc) || el(merc.sign) === "water",
    sign: merc.sign, house: merc.house, dignity: merc.dignity,
    thirdStrength: third?.strength || "medium",
    why
  };
}

// ── 6. Where the friction starts ─────────────────────────────────────────────

/**
 * Returned as {trigger, shows, helps} because a warning without a next step is
 * just anxiety. Nothing here predicts a person's behaviour — each is written as
 * a tendency in the chart, which is also what the advertising rules require.
 */
function triggers(f, comm, att) {
  const mars = pick(f, "Mars");
  const saturn = pick(f, "Saturn");
  const rahu = pick(f, "Rahu");
  const sun = pick(f, "Sun");
  const out = [];

  const seventh = f.houses7 || {};
  const sixth = f.houses.find((h) => h.house === 6);

  if (mars.house === 7 || aspects(mars, { house: 7 }) || f.manglik?.detected) {
    out.push({ key: "heat", severity: f.manglik?.severity === "strong" ? "high" : "medium",
               why: f.manglik?.detected ? "manglik" : "marsOnSeventh" });
  }
  if (saturn.house === 7 || aspects(saturn, { house: 7 })) {
    out.push({ key: "distance", severity: "medium", why: "saturnOnSeventh" });
  }
  if (rahu.house === 7 || rahu.house === 5) {
    out.push({ key: "insecurity", severity: "medium", why: "rahuOnRelationshipHouse" });
  }
  if (comm.withdrawsInConflict) {
    out.push({ key: "silence", severity: "medium", why: "withdrawal" });
  }
  if (comm.style === "blunt") {
    out.push({ key: "sharpWords", severity: "medium", why: "mercuryMars" });
  }
  if (att.needsReassurance) {
    out.push({ key: "reassurance", severity: "medium", why: "moonNeedsConfirmation" });
  }
  if (sun.house === 7 || (seventh.maleficOccupants || []).includes("Sun")) {
    out.push({ key: "ego", severity: "medium", why: "sunOnSeventh" });
  }
  if ((sixth?.occupants || []).length >= 2) {
    out.push({ key: "dailyFriction", severity: "low", why: "sixthCrowded" });
  }

  // Never hand a reader a wall of warnings. The strongest four are enough to
  // act on, and a list of eight reads as a horoscope of doom.
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 4);
}

// ── 7. What is working ───────────────────────────────────────────────────────

function strengths(f, expr, chem, comm, att) {
  const out = [];
  const jup = pick(f, "Jupiter");
  const venus = pick(f, "Venus");
  const moon = pick(f, "Moon");
  const seventh = f.houses7 || {};
  const nav = f.navamsa || {};

  if (seventh.grade === "strong") out.push({ key: "partnership", why: "seventhStrong" });
  if ((seventh.goodAspects || []).includes("Jupiter") || aspects(jup, { house: 7 }))
    out.push({ key: "protection", why: "jupiterOnSeventh" });
  if (strong(venus.dignity) && !venus.combust) out.push({ key: "affection", why: "venusStrong" });
  if (expr.generous) out.push({ key: "warmth", why: "venusGenerous" });
  if (expr.mode === "practical") out.push({ key: "reliability", why: "venusEarth" });
  if (expr.mode === "devotional") out.push({ key: "loyalty", why: "venusWater" });
  if (chem.level === "immediate" || chem.level === "strong") out.push({ key: "spark", why: "venusMars" });
  if (comm.saysItPlainly) out.push({ key: "plainSpeaking", why: "mercuryDirect" });
  if (comm.style === "analytical" || comm.style === "expansive") out.push({ key: "talking", why: "mercuryOpen" });
  if (gradeOfHouse(f, 2) === "strong") out.push({ key: "family", why: "secondStrong" });
  if (gradeOfHouse(f, 5) === "strong") out.push({ key: "romance", why: "fifthStrong" });
  if ((nav.dignified || []).includes("Venus")) out.push({ key: "navamsaVenus", why: "venusDignifiedD9" });
  if ((nav.vargottama || []).length) out.push({ key: "consistency", why: "vargottama" });
  if (strong(moon.dignity)) out.push({ key: "steadiness", why: "moonStrong" });
  if (att.style === "steady") out.push({ key: "constancy", why: "moonEarth" });
  if ((f.manglik?.cancellations || []).length) out.push({ key: "doshaCancelled", why: "manglikCancelled" });

  // A report that lists no strengths is a report nobody finishes. If the chart
  // is genuinely difficult, say the true minimum rather than nothing.
  if (!out.length) out.push({ key: "selfAwareness", why: "default" });
  return out.slice(0, 5);
}

// ── 8. What needs work ───────────────────────────────────────────────────────

/**
 * Never "red flags", and never about the partner. The advertising rules and
 * plain decency both point the same way: these are the reader's own patterns to
 * watch, phrased as tendencies, with something to do about each.
 */
function growth(f, att, comm, chem) {
  const out = [];
  const venus = pick(f, "Venus");
  const mars = pick(f, "Mars");
  const moon = pick(f, "Moon");
  const seventh = f.houses7 || {};

  if (seventh.grade === "weak") out.push({ key: "expectations", why: "seventhWeak" });
  if ((seventh.maleficOccupants || []).length >= 2) out.push({ key: "pressure", why: "maleficsInSeventh" });
  if (venus.combust) out.push({ key: "unspoken", why: "venusCombust" });
  if (weak(venus.dignity)) out.push({ key: "selfWorth", why: "venusWeak" });
  if (att.needsReassurance) out.push({ key: "reassurance", why: "moonNeedy" });
  if (att.style === "guarded") out.push({ key: "opening", why: "saturnOnMoon" });
  if ([6, 8, 12].includes(moon.house)) out.push({ key: "restlessness", why: "moonDusthana" });
  if (comm.withdrawsInConflict) out.push({ key: "withdrawal", why: "conflictSilence" });
  if (comm.style === "blunt") out.push({ key: "tone", why: "mercuryMars" });
  if (chem.intensityRisk) out.push({ key: "pace", why: "marsUnsteady" });
  if (mars.house === 8) out.push({ key: "intensity", why: "marsEighth" });
  if (f.manglik?.detected && !(f.manglik.cancellations || []).length)
    out.push({ key: "temper", why: "manglikUncancelled" });
  if (gradeOfHouse(f, 12) === "weak") out.push({ key: "privacy", why: "twelfthWeak" });
  if (att.style === "intense") out.push({ key: "holdingTight", why: "rahuOnMoon" });
  if (att.needsSpace) out.push({ key: "space", why: "moonNeedsAir" });
  if (venus.retrograde) out.push({ key: "past", why: "venusRetrograde" });

  if (!out.length) out.push({ key: "complacency", why: "default" });
  return out.slice(0, 5);
}

// ── 9. Will it last ──────────────────────────────────────────────────────────

/**
 * The navamsa is the classical chart of marriage, so long-term potential leans
 * on it rather than on the rasi 7th house alone — a strong 7th with a wrecked
 * D9 is the standard picture of a relationship that starts well and strains
 * later, and vice versa.
 */
function longTerm(f) {
  const seventh = f.houses7 || {};
  const nav = f.navamsa || {};
  const saturn = pick(f, "Saturn");
  const jup = pick(f, "Jupiter");
  const why = [];
  let score = 0;

  if (seventh.grade === "strong") { score += 2; why.push("seventhStrong"); }
  else if (seventh.grade === "weak") { score -= 2; why.push("seventhWeak"); }

  if ((nav.dignified || []).includes("Venus")) { score += 1; why.push("venusStrongD9"); }
  if ((nav.debilitated || []).includes("Venus")) { score -= 1; why.push("venusWeakD9"); }
  if ((nav.vargottama || []).length) { score += 1; why.push("vargottama"); }
  if ((nav.inKendra || []).includes("Jupiter")) { score += 1; why.push("jupiterKendraD9"); }

  // Saturn is the planet of endurance. On the 7th it is heavy early and steady
  // late — worth saying, because the reader will feel the early part first.
  const saturnOnSeventh = saturn.house === 7 || aspects(saturn, { house: 7 });
  if (saturnOnSeventh) why.push("saturnEndurance");
  if (aspects(jup, { house: 7 })) { score += 1; why.push("jupiterOnSeventh"); }
  if (f.manglik?.detected && !(f.manglik.cancellations || []).length) { score -= 1; why.push("manglikUncancelled"); }

  return {
    score,
    grade: score >= 2 ? "supportive" : score >= 0 ? "workable" : "needs care",
    slowStart: saturnOnSeventh,
    dial: dial(score, 6),
    why
  };
}

// ── 10. Love or arranged ─────────────────────────────────────────────────────

/**
 * A tendency, never a verdict. The classical markers are a link between the 5th
 * (courtship) and the 7th (commitment), and Venus or Rahu touching either.
 */
function marriagePath(f) {
  const fifthLord = f.houses.find((h) => h.house === 5)?.lord;
  const seventhLord = f.houses.find((h) => h.house === 7)?.lord;
  const fl = fifthLord ? pick(f, fifthLord) : null;
  const sl = seventhLord ? pick(f, seventhLord) : null;
  const venus = pick(f, "Venus");
  const rahu = pick(f, "Rahu");
  const why = [];
  let love = 0;

  if (fl && sl && conjunct(fl, sl)) { love += 2; why.push("fifthSeventhConjunct"); }
  if (fl && fl.house === 7) { love += 2; why.push("fifthLordInSeventh"); }
  if (sl && sl.house === 5) { love += 2; why.push("seventhLordInFifth"); }
  if (venus.house === 5 || venus.house === 7) { love += 1; why.push("venusInRomanceHouse"); }
  if (rahu.house === 5 || rahu.house === 7) { love += 1; why.push("rahuInRomanceHouse"); }
  if (fl && sl && linked(fl, sl)) { love += 1; why.push("fifthSeventhAspect"); }

  // The 2nd and 4th carry the family's part in the decision.
  const familyWeight = (gradeOfHouse(f, 2) === "strong" ? 1 : 0)
                     + ((f.houses.find((h) => h.house === 4)?.strength === "strong") ? 1 : 0);
  if (familyWeight >= 1) why.push("familyInvolved");

  return {
    lean: love >= 3 ? "love" : love >= 1 ? "either" : "family-led",
    confidence: love >= 4 ? "clear" : love >= 2 ? "moderate" : "slight",
    familyInvolved: familyWeight >= 1,
    why
  };
}

// ── 11. The snapshot dials ───────────────────────────────────────────────────

function dials(f, lt, chem, comm, att) {
  const seventh = f.houses7 || {};
  const venus = pick(f, "Venus");
  const moon = pick(f, "Moon");
  const g = { strong: 2, moderate: 0, weak: -2 };
  const chemScore = { immediate: 3, strong: 2, warm: 1, slow: -1 };
  const dg = (d) => (strong(d) ? 2 : weak(d) ? -2 : 0);

  // Each dial sums several signals rather than one, so two different charts do
  // not land on the same six numbers — which is what a single-input dial does.
  return {
    strength: dial((g[seventh.grade] ?? 0)
                   + ((seventh.maleficOccupants || []).length ? -1 : 1), 3),
    emotional: dial(dg(moon.dignity)
                    + (att.needsReassurance ? -1 : 1)
                    + ([6, 8, 12].includes(moon.house) ? -1 : 1), 4),
    chemistry: dial((chemScore[chem.level] ?? 0) + (chem.intensityRisk ? -1 : 0), 3),
    communication: dial((comm.saysItPlainly ? 1 : 0)
                        + (comm.withdrawsInConflict ? -2 : 1)
                        + (comm.style === "blunt" ? -1 : 0)
                        + (comm.thirdStrength === "strong" ? 1 : comm.thirdStrength === "low" ? -1 : 0), 3),
    longTerm: lt.dial,
    stability: dial((g[gradeOfHouse(f, 2)] ?? 0) + dg(venus.dignity), 4)
  };
}

// ── the whole profile ────────────────────────────────────────────────────────

export function buildLoveProfile(f) {
  const att = attachment(f);
  const expr = expression(f);
  const attr = attraction(f);
  const chem = chemistry(f);
  const comm = communication(f);
  const trig = triggers(f, comm, att);
  const str = strengths(f, expr, chem, comm, att);
  const grow = growth(f, att, comm, chem);
  // Being drawn to one kind of person and committing to another is the most
  // useful thing this report can tell somebody, and it is invisible unless
  // Venus and the 7th are read against each other. It belongs near the top of
  // the growth list, not buried.
  if (attr.split) grow.unshift({ key: "drawnVsChosen", why: "venusSeventhSplit" });
  const lt = longTerm(f);
  const path = marriagePath(f);

  return {
    attachment: att,
    expression: expr,
    attraction: attr,
    chemistry: chem,
    communication: comm,
    triggers: trig,
    strengths: str,
    growth: grow,
    longTerm: lt,
    marriagePath: path,
    dials: dials(f, lt, chem, comm, att),
    // The one-line theme at the very top of the report. Deliberately built from
    // the two strongest signals rather than an average, because an average of a
    // difficult chart and an easy one reads as "medium", which helps nobody.
    theme: {
      strength: str[0]?.key || "selfAwareness",
      challenge: grow[0]?.key || "complacency",
      focus: lt.grade === "needs care" ? "patience" : lt.slowStart ? "time" : "clarity"
    }
  };
}

export const _internals = { attachment, expression, attraction, chemistry, communication, triggers, longTerm, marriagePath, aspects, between };
