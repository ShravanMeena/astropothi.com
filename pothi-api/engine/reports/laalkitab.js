// In-house Laal Kitaab report generation — deterministic, chart-driven (no LLM).
// Contract: generateInhouseLaalKitab(input) → { report, pdfBuffer, kundliData }
// where `report` is the report_json rendered by the astro-chart report screens.
//
// `report.sections` is a 30-chapter book that mirrors the published sample
// (astro_chart_listing id=6 → content.sample.pages). Every chapter is computed
// from this native's own chart — placements, Lal Kitab drishti, dormancy, the
// six rin (each reported present OR not present with the rule that was tested),
// the upay cycle, and the dasha/transit year ahead.
//
// LANGUAGE: `input.language` ("en" | "hi") selects a string pack in
// engine/i18n/laalkitab-strings.js. Chart logic here is language-blind — it
// computes values, then hands them to the pack's fixed templates. No sentence
// is written outside that pack and nothing is machine-translated.

import tzlookup from "tz-lookup";
import { buildCalculatedKundliData, buildDashaWindows } from "../astrology/normalize-kundli-data.js";
import { SIGNS } from "../astrology/astro-constants.js";
import {
  analyzeLaalKitab,
  PAKKA_GHAR,
  GOOD_HOUSES,
  HARD_HOUSES,
} from "../astrology/laal-kitab.js";
import { buildStringPack } from "../i18n/laalkitab-strings.js";
import { buildLaalKitaabPdf } from "../reporting/render-laalkitab-pdfkit.js";

const pad = (n) => String(n).padStart(2, "0");

function normalizeBirthDate(dob) {
  if (!dob) throw new Error("dob is required");
  let y, m, d;
  if (dob.includes("-")) [y, m, d] = dob.split("-").map(Number);
  else if (dob.includes("/")) [d, m, y] = dob.split("/").map(Number);
  else throw new Error("dob must be YYYY-MM-DD or DD/MM/YYYY");
  if (!y || !m || !d) throw new Error(`could not parse dob: ${dob}`);
  return `${y}-${pad(m)}-${pad(d)}`;
}
function normalizeBirthTime(tob) {
  if (!tob) return "12:00";
  const m = String(tob).trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) return "12:00";
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3] === "PM" && hour !== 12) hour += 12;
  if (m[3] === "AM" && hour === 12) hour = 0;
  return `${pad(hour)}:${pad(min)}`;
}
function resolveTimezone(lat, lon) {
  try { const tz = tzlookup(Number(lat), Number(lon)); if (tz) return tz; } catch { /* */ }
  return "Asia/Kolkata";
}

// ─────────────────────────────────────────────────────────────────────────────
// Structural Lal Kitab tables. These decide WHICH rule fires; the wording of
// every rule lives in the string pack, so both languages judge identically.
// ─────────────────────────────────────────────────────────────────────────────

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

// Lal Kitab drishti (house-to-house sight); houses 3 and 9 have the triple sight.
const DRISHTI = {
  1: [7], 2: [8], 3: [9, 10, 11], 4: [10], 5: [11], 6: [12],
  7: [1], 8: [2], 9: [3, 4, 5], 10: [4], 11: [5], 12: [6],
};

// Weekday each graha is worked on. Rahu rides Wednesday and Ketu Tuesday —
// the nodes have no weekday of their own.
const PLANET_DAY = {
  Sun: "Sunday", Moon: "Monday", Mars: "Tuesday", Mercury: "Wednesday",
  Jupiter: "Thursday", Venus: "Friday", Saturn: "Saturday",
  Rahu: "Wednesday", Ketu: "Tuesday",
};

// Chart-triggered advice. `key` selects the sentence from RULE_TEXT.
const DONT_RULES = [
  { p: "Rahu", h: [5], key: "rahuFifth" },
  { p: "Rahu", h: [1, 2, 7], key: "rahuSelf" },
  { p: "Rahu", h: [4, 8, 9], key: "rahuHidden" },
  { p: "Ketu", h: [1, 2, 4, 5, 7], key: "ketuLeave" },
  { p: "Saturn", h: [1, 4, 5, 8, 12], key: "saturnHard" },
  { p: "Saturn", h: [2, 3, 6, 7, 10, 11], key: "saturnLend" },
  { p: "Mars", h: [1, 2, 4, 7, 8, 12], key: "marsAnger" },
  { p: "Sun", h: [4, 7, 12], key: "sunAuthority" },
  { p: "Moon", h: [6, 8, 12], key: "moonWater" },
  { p: "Venus", h: [6, 8, 12], key: "venusIndulge" },
  { p: "Mercury", h: [3, 8, 9, 12], key: "mercuryPapers" },
  { p: "Jupiter", h: [3, 6, 8, 12], key: "jupiterLend" },
];
const DO_RULES = [
  { p: "Mars", h: [1, 3, 6, 10, 11], key: "marsExercise" },
  { p: "Jupiter", h: [1, 2, 4, 5, 7, 9, 10, 11], key: "jupiterAccounts" },
  { p: "Moon", h: [1, 2, 4, 5, 7, 9], key: "moonHome" },
  { p: "Sun", h: [1, 5, 9, 10, 11], key: "sunElders" },
  { p: "Mercury", h: [1, 2, 4, 5, 6, 7, 10, 11], key: "mercuryWriting" },
  { p: "Venus", h: [1, 2, 3, 4, 5, 7, 9, 11], key: "venusHome" },
  { p: "Saturn", h: [2, 3, 6, 7, 10, 11], key: "saturnLabour" },
  { p: "Ketu", h: [3, 6, 9, 12], key: "ketuDog" },
  { p: "Rahu", h: [3, 6, 11, 12], key: "rahuSilver" },
];

// The six rin. Clause order matches RIN_TEXT[lang][key].why[i].
const RIN_SPECS = [
  { key: "pitru", chapter: 18, witnesses: ["Venus", "Mercury", "Rahu", "Sun", "Jupiter"], clauses: [
    { planets: ["Venus", "Mercury", "Rahu"], houses: [2, 5, 9, 12] },
    { planets: ["Sun", "Jupiter"], houses: [6, 8, 12] },
  ] },
  { key: "matru", chapter: 19, witnesses: ["Ketu", "Moon"], clauses: [
    { planets: ["Ketu"], houses: [4] },
    { planets: ["Moon"], houses: [6, 8, 12] },
    { conjunction: ["Moon", "Ketu"] },
  ] },
  { key: "stree", chapter: 20, witnesses: ["Sun", "Moon", "Rahu", "Venus"], clauses: [
    { planets: ["Sun", "Moon", "Rahu"], houses: [2, 7] },
    { planets: ["Venus"], houses: [6, 8, 12] },
  ] },
  { key: "guru", chapter: 21, witnesses: ["Rahu", "Ketu", "Jupiter"], clauses: [
    { planets: ["Rahu", "Ketu"], houses: [5, 9] },
    { planets: ["Jupiter"], houses: [3, 6, 8, 12] },
  ] },
  { key: "atma", chapter: 22, witnesses: ["Saturn", "Rahu", "Mercury"], clauses: [
    { planets: ["Saturn", "Rahu"], houses: [1] },
    { planets: ["Mercury"], houses: [8, 12] },
    { lagnaLordDormant: true },
  ] },
  { key: "bhratru", chapter: 23, witnesses: ["Mars", "Rahu"], clauses: [
    { planets: ["Mars"], houses: [4, 8, 12] },
    { planets: ["Rahu"], houses: [3] },
    { conjunction: ["Mars", "Rahu"] },
    { conjunction: ["Mars", "Ketu"] },
  ] },
];

const bullets = (arr) => arr.filter(Boolean).map((b) => `• ${b}`).join("\n");
const block = (...parts) => parts.filter((p) => p && String(p).trim()).join("\n\n");
function degStr(deg) {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${pad(m === 60 ? 59 : m)}'`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart facts — everything the 30 chapters read from. Language-blind.
// ─────────────────────────────────────────────────────────────────────────────

function buildFacts(kundliData, analysis, subject, L) {
  const planets = kundliData.planets || [];
  const P = Object.fromEntries(planets.map((p) => [p.name, p]));
  const J = Object.fromEntries(analysis.judgments.map((j) => [j.name, j]));
  const houseOf = (n) => P[n]?.house;
  const occupants = (h) => PLANETS.filter((n) => houseOf(n) === h);
  const seesFrom = (n) => DRISHTI[houseOf(n)] || [];
  const aspectsOn = (h) => PLANETS.filter((n) => (DRISHTI[houseOf(n)] || []).includes(h));

  // Dormancy — Lal Kitab separates a planet that harms you from one that gives
  // nothing at all. Criteria are printed in the chapter that uses them.
  const dormancy = {};
  for (const n of PLANETS) {
    const h = houseOf(n);
    const alone = occupants(h).length === 1;
    const unseen = aspectsOn(h).filter((x) => x !== n).length === 0;
    const seatEmpty = occupants(PAKKA_GHAR[n]).length === 0 && PAKKA_GHAR[n] !== h;
    const good = (GOOD_HOUSES[n] || []).includes(h);
    const hard = (HARD_HOUSES[n] || []).includes(h);
    if (alone && unseen && seatEmpty) dormancy[n] = "sleeping";
    else if (!good && !hard && PAKKA_GHAR[n] !== h) dormancy[n] = "blind";
    else dormancy[n] = null;
  }

  // Canonical state key; the pack turns it into a word.
  const stateKey = (n) => {
    if (dormancy[n] === "sleeping") return "sleeping";
    if (dormancy[n] === "blind") return "blind";
    const j = J[n];
    if (!j) return "neutral";
    if (j.state === "strong") return "strong";
    if (j.state === "weak" || j.state === "asleep" || j.verdict === "malefic") return "needs upay";
    if ((GOOD_HOUSES[n] || []).includes(houseOf(n))) return "comfortable";
    return "workable";
  };

  const severity = (n) => {
    let s = 0;
    const j = J[n];
    if (j?.state === "asleep" || j?.state === "weak") s += 3;
    if (j?.verdict === "malefic") s += 2;
    if ((HARD_HOUSES[n] || []).includes(houseOf(n))) s += 2;
    if (j?.dignity === "Unfavorable") s += 2;
    if (j?.dignity === "Highly Favorable") s -= 3;
    if ((GOOD_HOUSES[n] || []).includes(houseOf(n))) s -= 2;
    if (PAKKA_GHAR[n] === houseOf(n)) s -= 1;
    // A dormant planet always needs work, however good its dignity looks.
    if (dormancy[n]) s = Math.max(s, 2);
    return s;
  };
  const targets = PLANETS.filter((n) => severity(n) > 0).sort((a, b) => severity(b) - severity(a));
  const supports = PLANETS.filter((n) => severity(n) <= 0).sort((a, b) => severity(a) - severity(b));

  const lagnaSign = kundliData.astroDetails?.ascendant;
  const lagnaLord = kundliData.astroDetails?.ascendantLord;

  // Structured chart data the UI draws from — never parsed back out of prose.
  const placements = PLANETS.map((n) => {
    const p = P[n];
    return {
      planet: L.P(n),
      planet_en: n,
      abbr: L.abbr(n),
      sign: L.sign(p.sign),
      sign_en: p.sign,
      sign_num: SIGNS.indexOf(p.sign) + 1,
      house: p.house,
      degree: Number(p.degree.toFixed(2)),
      degree_str: degStr(p.degree),
      nakshatra: L.nak(p.nakshatra),
      retrograde: !!p.retrograde,
      state: L.state(stateKey(n)),
    };
  });

  return {
    subject, kundliData, analysis, P, J, L,
    houseOf, occupants, seesFrom, aspectsOn,
    dormancy, stateKey, severity, targets, supports,
    lagnaSign, lagnaLord, lagnaLordHouse: houseOf(lagnaLord),
    placements,
    // localisation shortcuts used by every chapter
    p: (n) => L.P(n),
    h: (x) => L.house(x),
    hN: (x) => L.houseN(x),
    st: (n) => L.state(stateKey(n)),
    stPhrase: (n) => L.statePhrase(stateKey(n)),
    day: (n) => L.weekday(PLANET_DAY[n]),
    act: (n) => L.dailyAct(n),
  };
}

// Which rin clauses actually fire.
function evaluateRin(spec, f) {
  const L = f.L;
  const text = L.rin[spec.key];
  const hits = [];
  spec.clauses.forEach((c, i) => {
    const why = text.why[i];
    if (c.conjunction) {
      const [a, b] = c.conjunction;
      if (f.houseOf(a) && f.houseOf(a) === f.houseOf(b)) {
        hits.push({ text: L.t.rinHitConjunction(f.p(a), f.p(b), f.h(f.houseOf(a))), why, planet: a });
      }
      return;
    }
    if (c.lagnaLordDormant) {
      const lord = f.lagnaLord;
      if (lord && f.dormancy[lord]) {
        hits.push({ text: L.t.rinHitLagnaDormant(f.p(lord), f.h(f.houseOf(lord)), L.state(f.dormancy[lord])), why, planet: lord });
      }
      return;
    }
    for (const p of c.planets) {
      const h = f.houseOf(p);
      if (h && c.houses.includes(h)) hits.push({ text: L.t.rinHitPlacement(f.p(p), f.h(h)), why, planet: p });
    }
  });
  return { spec, key: spec.key, chapter: spec.chapter, present: hits.length > 0, hits };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapters 1–17
// ─────────────────────────────────────────────────────────────────────────────

function chapterAbout(f, rinResults) {
  const L = f.L, T = L.t;
  const debts = rinResults.filter((r) => r.present);
  const comfortable = PLANETS.filter((n) => ["strong", "comfortable"].includes(f.stateKey(n)));
  const dormant = PLANETS.filter((n) => f.dormancy[n]);
  return {
    title: L.titles.about,
    body: block(
      T.aboutIntro,
      T.aboutCast({
        name: f.subject.name,
        lagnaSign: L.sign(f.lagnaSign),
        lagnaLord: f.p(f.lagnaLord),
        lagnaLordHouse: f.h(f.lagnaLordHouse),
        comfortableN: comfortable.length, comfortable: comfortable.map(f.p).join(", "),
        targetN: f.targets.length, targets: f.targets.map(f.p).join(", "),
        dormantN: dormant.length, dormant: dormant.map(f.p).join(", "),
        debtN: debts.length, debts: debts.map((d) => L.titles.rin[d.key].split(" —")[0]).join(", "),
      }),
      T.aboutHowToLabel + "\n" + bullets(T.aboutHowTo),
      T.aboutClose,
    ),
  };
}

function chapterBirthDetails(f) {
  const L = f.L, T = L.t, R = L.t.birthRows;
  const k = f.kundliData;
  const pan = k.panchang || {};
  const ad = k.astroDetails || {};
  return {
    title: L.titles.birth,
    body: block(
      T.birthCastLabel + "\n" + bullets([
        R.name(f.subject.name),
        R.dob(f.subject.birthDate),
        R.tob(f.subject.birthTime),
        R.place(f.subject.birthPlace || "—"),
        R.ayanamsa(degStr(k.calculationMeta?.ayanamshaDegrees || 0)),
        R.houseSystem(L.sign(f.lagnaSign)),
      ]),
      T.birthPanchangLabel + "\n" + bullets([
        R.weekday(L.weekday(pan.weekday)),
        R.tithi(L.tithi(pan.tithi), L.paksha(pan.paksha)),
        R.nakshatra(L.nak(pan.nakshatra), pan.nakshatraPada),
        R.yogaKarana(L.yoga(pan.yoga), L.karana(pan.karana)),
        R.sun(pan.sunrise, pan.sunset),
      ]),
      T.birthTevaLabel + "\n" + bullets([
        R.lagna(L.sign(ad.ascendant), f.p(ad.ascendantLord)),
        R.rashi(L.sign(ad.sign), f.p(ad.signLord)),
        R.nakLord(f.p(ad.nakshatraLord), L.gan(ad.gan), L.nadi(ad.nadi)),
        R.dasha(f.p(k.dashas?.currentMahaDasha), f.p(k.dashas?.currentAntarDasha)),
      ]),
      T.birthNote,
    ),
    placements: f.placements,
  };
}

function chapterPlacements(f) {
  const L = f.L, T = L.t;
  const rows = PLANETS.map((n) => {
    const h = f.houseOf(n);
    const extras = [];
    if (n === f.lagnaLord) extras.push(T.extraAscRuler);
    if (PAKKA_GHAR[n] === h) extras.push(T.extraPakka);
    if (f.P[n].retrograde && !["Rahu", "Ketu"].includes(n)) extras.push(T.extraRetro);
    return T.placeRow(f.p(n), f.h(h), f.st(n), extras);
  });
  const all = Array.from({ length: 12 }, (_, i) => i + 1);
  const filled = all.filter((h) => f.occupants(h).length);
  const empty = all.filter((h) => !f.occupants(h).length);
  return {
    title: L.titles.placements,
    body: block(
      T.placeLabel + "\n" + bullets(rows),
      T.occupiedLine(filled.map((h) => T.occupiedItem(L.ordinal(h), f.occupants(h).map((n) => L.abbr(n)).join(" "))).join(", ")),
      empty.length ? T.emptyLine(L.list(empty.map((h) => L.ordinal(h)))) : T.emptyNone,
      T.placeClose,
    ),
    placements: f.placements,
  };
}

function chapterAscendant(f) {
  const L = f.L, T = L.t;
  const lord = f.lagnaLord;
  const lh = f.lagnaLordHouse;
  const first = f.occupants(1);
  const seen = f.aspectsOn(1).filter((n) => !first.includes(n));
  const ok = !f.dormancy[lord] && !["needs upay"].includes(f.stateKey(lord));
  return {
    title: L.titles.ascendant,
    body: block(
      T.ascPara(L.sign(f.lagnaSign), f.p(lord), f.h(lh), L.arena(lh), ok, f.stPhrase(lord)),
      first.length
        ? T.ascTenanted(L.list(first.map(f.p)), first.map((n) => T.ascTenantGift(f.p(n), L.gift(n).split(/[,،]/)[0])).join("; "))
        : T.ascEmpty(f.p(lord), f.h(lh), seen.length ? T.ascEmptySeen(L.list(seen.map(f.p)), seen.length > 1) : null),
      seen.length ? T.ascDrishti(L.list(seen.map((n) => T.ascDrishtiItem(f.p(n), f.h(f.houseOf(n)))))) : "",
      T.ascAsksLabel + "\n" + bullets([
        T.ascAsk1(f.p(lord)),
        first.length ? T.ascAsk2Tenant(f.p(first[0]), f.act(first[0]), f.day(first[0])) : T.ascAsk2Empty(f.h(lh)),
        T.ascAsk3(L.sign(f.lagnaSign), L.gift(lord), L.cost(lord)),
      ]),
    ),
    placements: f.placements,
  };
}

function chapterKeyJudgments(f) {
  const L = f.L, T = L.t;
  const picks = [];
  const add = (n, role) => { if (n && !picks.some((p) => p.n === n)) picks.push({ n, role }); };
  add(f.lagnaLord, T.keyRole.rules);
  add(f.targets[0], T.keyRole.strain);
  add(f.supports[0], T.keyRole.support);
  add(f.targets[1], T.keyRole.second);
  const three = picks.slice(0, 3);
  return {
    title: L.titles.key,
    body: block(
      T.keyIntro,
      three.map((pick, i) => {
        const n = pick.n;
        const h = f.houseOf(n);
        const key = f.stateKey(n);
        const tail = ["strong", "comfortable"].includes(key)
          ? T.keyTailGood(f.stPhrase(n), L.gift(n))
          : f.dormancy[n]
            ? T.keyTailDormant(L.state(f.dormancy[n]))
            : T.keyTailBad(L.cost(n), L.gift(n));
        return T.keyItem(i + 1, f.p(n), f.h(h), pick.role, L.karaka(n), L.arena(h), tail);
      }).join("\n\n"),
      T.keyClose,
    ),
    placements: f.placements,
  };
}

function chapterDormant(f) {
  const L = f.L, T = L.t;
  const sleeping = PLANETS.filter((n) => f.dormancy[n] === "sleeping");
  const blind = PLANETS.filter((n) => f.dormancy[n] === "blind");
  const first = sleeping[0] || blind[0];
  return {
    title: L.titles.dormant,
    body: block(
      T.dormIntro,
      sleeping.length || blind.length
        ? [
            ...sleeping.map((n) => T.dormSleeping(f.p(n), f.h(f.houseOf(n)), f.h(PAKKA_GHAR[n]), L.cap(L.arena(f.houseOf(n))))),
            ...blind.map((n) => T.dormBlind(f.p(n), f.h(f.houseOf(n)), f.h(PAKKA_GHAR[n]))),
          ].join("\n\n")
        : T.dormNone(PLANETS.map((n) => T.dormStateItem(f.p(n), f.stPhrase(n))).join(", ")),
      T.dormWokenLabel + "\n" + bullets([
        ...T.dormWoken,
        first ? T.dormStart(f.p(first), f.act(first), f.day(first)) : T.dormNoStart,
      ]),
    ),
    placements: f.placements,
  };
}

function chapterBenefics(f) {
  const L = f.L, T = L.t;
  const good = f.supports;
  const weakest = f.targets[f.targets.length - 1];
  return {
    title: L.titles.benefic,
    body: block(
      good.length ? T.benLabel : "",
      good.length
        ? bullets(good.map((n) => T.benRow(f.p(n), f.h(f.houseOf(n)), L.arena(f.houseOf(n)), L.gift(n))))
        : T.benNone,
      good.length
        ? T.benBase(good.length, L.list([...new Set(good.map((n) => L.arenaShort(f.houseOf(n))))]), f.targets.length)
        : "",
      good.length ? T.benProtect : (weakest ? T.benCheapest(f.p(weakest), f.h(f.houseOf(weakest))) : ""),
    ),
    placements: f.placements,
  };
}

function chapterMalefics(f, rinResults) {
  const L = f.L, T = L.t;
  const bad = f.targets;
  const firstDebt = rinResults.find((r) => r.present);
  const reasonFor = (n) => {
    const h = f.houseOf(n);
    if (f.dormancy[n]) return T.malReasonDormant(L.state(f.dormancy[n]));
    if ((HARD_HOUSES[n] || []).includes(h)) return T.malReasonHard(f.p(n));
    if (f.J[n]?.dignity === "Unfavorable") return T.malReasonDebilitated(L.sign(f.P[n].sign));
    return T.malReasonStrain;
  };
  return {
    title: L.titles.malefic,
    body: block(
      bad.length ? T.malLabel : "",
      bad.length
        ? bullets(bad.map((n) => T.malRow(f.p(n), f.h(f.houseOf(n)), reasonFor(n), L.cost(n), L.arena(f.houseOf(n)))))
        : T.malNone,
      bad.length
        ? (firstDebt
            ? T.malOrderDebt(L.titles.rin[firstDebt.key].split(" —")[0], firstDebt.chapter, L.list(bad.slice(0, 2).map(f.p)))
            : T.malOrderNoDebt(L.list(bad.slice(0, 3).map(f.p))))
        : "",
      bad.length
        ? T.malDrishti(bad.slice(0, 3).map((n) => T.malDrishtiItem(f.p(n), L.list(f.seesFrom(n).map((x) => f.h(x))))).join("; "))
        : "",
    ),
    placements: f.placements,
  };
}

function chapterPlanet(f, n) {
  const L = f.L, T = L.t;
  const p = f.P[n];
  const j = f.J[n];
  const h = p.house;
  const co = f.occupants(h).filter((x) => x !== n);
  const seen = f.aspectsOn(h).filter((x) => x !== n);
  const sees = DRISHTI[h] || [];
  const dispositor = p.signLord;
  const dispHouse = f.houseOf(dispositor);
  const key = f.stateKey(n);
  const isRetro = p.retrograde && !["Rahu", "Ketu"].includes(n);

  const stateLine =
    f.dormancy[n] === "sleeping" ? T.pStateSleeping(f.p(n), f.h(h), f.h(PAKKA_GHAR[n]))
      : f.dormancy[n] === "blind" ? T.pStateBlind(f.p(n), f.h(h))
        : ["strong", "comfortable"].includes(key) ? T.pStateGood(f.p(n), L.cap(L.gift(n)))
          : key === "needs upay" ? T.pStateBad(f.p(n), L.cap(L.cost(n)), L.gift(n), f.act(n), f.day(n))
            : T.pStateWorkable(f.p(n));

  const dignityLine =
    j?.dignity === "Highly Favorable" ? T.pDigExalted(L.sign(p.sign), f.p(n))
      : j?.dignity === "Unfavorable" ? T.pDigDebilitated(L.sign(p.sign))
        : j?.dignity === "Favorable" ? T.pDigOwn(L.sign(p.sign), f.p(n))
          : T.pDigNeutral(L.sign(p.sign), f.p(dispositor), dispHouse ? f.h(dispHouse) : null, f.p(n));

  const companyLine = co.length
    ? T.pCompanyCo(f.h(h), L.list(co.map(f.p)), f.p(co[0]), f.p(n))
    : seen.length
      ? T.pCompanySeen(L.list(seen.map((x) => T.pCompanySeenItem(f.h(f.houseOf(x)), f.p(x)))))
      : T.pCompanyAlone(f.h(h));

  const notes = [
    dignityLine,
    companyLine,
    T.pDrishti(f.h(h), L.list(sees.map((x) => T.pDrishtiItem(f.h(x), L.arenaShort(x)))), sees.length > 1, f.p(n)),
    PAKKA_GHAR[n] === h
      ? T.pPakkaIn(f.p(n))
      : T.pPakkaOut(f.p(n), f.h(PAKKA_GHAR[n]), f.occupants(PAKKA_GHAR[n]).length ? T.pPakkaHeld(L.list(f.occupants(PAKKA_GHAR[n]).map(f.p))) : null),
    isRetro ? T.pRetroNote(f.p(n)) : null,
    key === "needs upay" || f.dormancy[n]
      ? T.pUpay(f.act(n), f.day(n), L.maint(n))
      : T.pMaint(L.maint(n), f.p(n)),
  ];

  return {
    title: L.titles.planet(n),
    body: block(
      T.pHeader(f.p(n), n, f.h(h), L.sign(p.sign), degStr(p.degree), L.nak(p.nakshatra), p.pada, isRetro ? T.pRetro : T.pDirect),
      T.pIntro(f.p(n), L.karaka(n), f.h(h), L.arena(h), L.domain(h), L.gift(n), L.cost(n)),
      stateLine,
      T.pNotesLabel + "\n" + bullets(notes),
    ),
    placements: f.placements,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapters 18–30
// ─────────────────────────────────────────────────────────────────────────────

function chapterRin(f, result) {
  const L = f.L, T = L.t;
  const spec = result.spec;
  const text = L.rin[spec.key];
  const witnesses = spec.witnesses
    .filter((w) => f.houseOf(w))
    .map((w) => T.rinWitnessItem(f.p(w), f.h(f.houseOf(w))))
    .join(", ");

  if (!result.present) {
    return {
      title: L.titles.rin[spec.key],
      body: block(
        T.rinNotPresent,
        T.rinRuleLabel(text.rule),
        T.rinChartShows(witnesses),
        text.clear,
        T.rinUpkeep(text.upkeep),
      ),
    };
  }

  const trigger = result.hits[0];
  const tHouse = f.houseOf(trigger.planet);
  return {
    title: L.titles.rin[spec.key],
    body: block(
      T.rinDetected,
      T.rinRuleLabel(text.rule),
      T.rinTriggered(result.hits.map((hit) => T.rinHitItem(hit.text, hit.why)).join("; "), text.theme),
      T.rinWeight(f.p(trigger.planet), f.h(tHouse), L.arena(tHouse)),
      T.rinShowsLabel + "\n" + bullets(text.shows),
      T.rinSettlementLabel + "\n" + bullets([
        ...text.settlement,
        T.rinAlongside(f.p(trigger.planet), f.act(trigger.planet), f.day(trigger.planet)),
      ]),
    ),
  };
}

function chapterRinSummary(f, rinResults) {
  const L = f.L, T = L.t;
  const present = rinResults.filter((r) => r.present);
  const absent = rinResults.filter((r) => !r.present);
  const ordered = present.slice().sort((a, b) => b.hits.length - a.hits.length || rinResults.indexOf(a) - rinResults.indexOf(b));
  const shortName = (r) => L.titles.rin[r.key].split(" —")[0];
  return {
    title: L.titles.rinSummary,
    body: block(
      T.rsGlanceLabel + "\n" + bullets(rinResults.map((r) =>
        r.present
          ? T.rsRowPresent(shortName(r), r.hits.map((h) => h.text).join("; "), T.rsRank[ordered.indexOf(r)] || String(ordered.indexOf(r) + 1))
          : T.rsRowAbsent(shortName(r)))),
      present.length
        ? T.rsOrderLine(ordered.map((r, i) => T.rsOrderItem(i + 1, shortName(r))).join(" · "), f.p(ordered[0].hits[0].planet), shortName(ordered[0]))
        : T.rsNoDebt(absent.map(shortName).join(", ")),
      present.length ? T.rsNotCarried(absent.map(shortName).join(", ")) : "",
    ),
    placements: f.placements,
  };
}

function chapterDailyUpay(f) {
  const L = f.L, T = L.t;
  const picks = f.targets.slice(0, 3);
  const first = picks[0];
  return {
    title: L.titles.daily,
    body: block(
      picks.length ? T.dailyLabel : "",
      picks.length
        ? bullets(picks.map((n) => T.dailyRow(f.p(n), f.h(f.houseOf(n)), f.st(n), f.act(n), f.day(n))))
        : T.dailyNone,
      first
        ? T.dailyPriority(f.p(first), f.dormancy[first] ? T.dailyReasonDormant(L.state(f.dormancy[first])) : T.dailyReasonStrain(f.h(f.houseOf(first))))
        : "",
      T.dailyRulesLabel + "\n" + bullets(T.dailyRules),
    ),
  };
}

function chapterWeeklyUpay(f) {
  const L = f.L, T = L.t;
  const DAY_LORD = [["Sunday", "Sun"], ["Monday", "Moon"], ["Tuesday", "Mars"], ["Wednesday", "Mercury"],
    ["Thursday", "Jupiter"], ["Friday", "Venus"], ["Saturday", "Saturn"]];
  const nodeFor = { Wednesday: "Rahu", Tuesday: "Ketu" };
  const rows = DAY_LORD.map(([day, lord]) => {
    const d = L.weekday(day);
    const needs = f.targets.includes(lord);
    const node = nodeFor[day];
    const nodeNeeds = node && f.targets.includes(node);
    if (needs && nodeNeeds) return T.weekBoth(d, f.act(lord), f.p(node), f.h(f.houseOf(node)), f.act(node));
    if (needs) return T.weekLord(d, f.act(lord), f.p(lord), f.stPhrase(lord), f.h(f.houseOf(lord)));
    if (nodeNeeds) return T.weekNode(d, f.p(lord), f.p(node), f.h(f.houseOf(node)), f.act(node));
    return T.weekNone(d, f.p(lord), f.stPhrase(lord), f.h(f.houseOf(lord)));
  });
  return {
    title: L.titles.weekly,
    body: block(
      T.weekLabel + "\n" + bullets(rows),
      T.weekNodeNote,
      f.targets.length ? T.weekOneDay(f.day(f.targets[0]), f.p(f.targets[0])) : T.weekMaint,
    ),
  };
}

function chapterAnnualUpay(f, rinResults) {
  const L = f.L, T = L.t;
  const acts = [];
  f.targets.slice(0, 2).forEach((n) => acts.push(T.annualItem(L.annualAct(n), f.p(n), f.stPhrase(n), f.h(f.houseOf(n)))));
  if (rinResults.find((r) => r.key === "pitru" && r.present)) acts.push(T.annualPitru);
  if (!["comfortable", "strong"].includes(f.stateKey("Saturn"))) {
    acts.push(T.annualItem(L.annualAct("Saturn"), f.p("Saturn"), f.stPhrase("Saturn"), f.h(f.houseOf("Saturn"))));
  }
  if (!acts.length) acts.push(T.annualLagna(L.annualAct(f.lagnaLord), f.p(f.lagnaLord)));
  const birthdayPlanet = f.targets[0] || f.lagnaLord;
  return {
    title: L.titles.annual,
    body: block(
      T.annualLabel + "\n" + bullets([...new Set(acts)]),
      T.annualBirthday(f.p(birthdayPlanet), L.birthdayItem(birthdayPlanet)),
      T.annualNotLabel + "\n" + bullets(T.annualNot),
    ),
  };
}

function chapterDosDonts(f) {
  const L = f.L, T = L.t;
  const dos = [];
  const donts = [];
  for (const r of DO_RULES) {
    const h = f.houseOf(r.p);
    if (r.h.includes(h) && !f.dormancy[r.p]) dos.push(L.rule.do[r.key].replace("{h}", f.h(h)));
  }
  for (const r of DONT_RULES) {
    const h = f.houseOf(r.p);
    if (r.h.includes(h)) donts.push(L.rule.dont[r.key].replace("{h}", f.h(h)));
  }
  // Fill from the chart's own priority planets rather than leaving a list short.
  f.targets.forEach((n) => {
    if (dos.length < 5) dos.push(L.maint(n));
    if (donts.length < 5) donts.push(L.rule.dont.fallback.replace(/\{p\}/g, f.p(n)));
  });
  if (!dos.length) {
    dos.push(L.rule.do.fallback.replace(/\{p\}/g, f.p(f.lagnaLord)).replace("{role}", L.karaka(f.lagnaLord)).replace("{h}", f.h(f.lagnaLordHouse)));
  }
  if (!donts.length) {
    donts.push(L.rule.dont.fallback.replace(/\{p\}/g, f.p(f.supports[0] || f.lagnaLord)));
  }
  return {
    title: L.titles.dosDonts,
    body: block(
      T.doLabel + "\n" + bullets([...new Set(dos)].slice(0, 6)),
      T.dontLabel + "\n" + bullets([...new Set(donts)].slice(0, 6)),
      T.ddClose,
    ),
  };
}

function chapterGemstones(f) {
  const L = f.L, T = L.t;
  const shortlist = [...new Set([...f.targets.slice(0, 3), ...f.supports.slice(0, 2), f.lagnaLord])].filter(Boolean);
  const rows = shortlist.map((n) => {
    const h = f.h(f.houseOf(n));
    if (f.dormancy[n]) return T.gemAvoid(L.gem(n), f.p(n), L.state(f.dormancy[n]), h);
    if (["strong", "comfortable"].includes(f.stateKey(n))) return T.gemNotNeeded(L.gem(n), f.p(n), f.stPhrase(n), h);
    return T.gemNotAdvised(L.gem(n), f.p(n), h);
  });
  return {
    title: L.titles.gems,
    body: block(
      T.gemsIntro,
      T.gemsForChart + "\n" + bullets(rows),
      T.gemSapphire(f.h(f.houseOf("Saturn")), f.stPhrase("Saturn")),
      T.gemWornLabel + "\n" + bullets(T.gemWorn),
    ),
  };
}

function chapterVarshphal(f) {
  const L = f.L, T = L.t;
  const k = f.kundliData;
  let windows = [];
  try {
    windows = buildDashaWindows({
      moonLongitude: f.P.Moon?.longitude,
      birthUtc: new Date(k.calculationMeta?.birthUtc),
      years: 1,
    }).slice(0, 5);
  } catch { windows = []; }

  const maha = k.dashas?.currentMahaDasha;
  const antar = k.dashas?.currentAntarDasha;
  const stateIn = (n) => (f.houseOf(n) ? T.vpStateIn(f.stPhrase(n), f.h(f.houseOf(n))) : f.stPhrase(n));
  const tone = maha && antar
    ? T.vpTone(f.p(maha), stateIn(maha), f.p(antar), stateIn(antar),
        ["strong", "comfortable"].includes(f.stateKey(antar)) ? T.vpToneForward
          : f.dormancy[antar] ? T.vpToneDormant : T.vpToneCorrect)
    : T.vpToneUnknown;

  const t = k.transitSnapshot || {};
  const houseFrom = (fromSign, sign) => {
    const a = SIGNS.indexOf(fromSign), b = SIGNS.indexOf(sign);
    return a < 0 || b < 0 ? null : ((b - a + 12) % 12) + 1;
  };
  const satH = houseFrom(f.lagnaSign, t.saturnSign);
  const jupH = houseFrom(f.lagnaSign, t.jupiterSign);
  const rahuH = houseFrom(f.lagnaSign, t.rahuSign);
  const satFromMoon = houseFrom(k.astroDetails?.sign, t.saturnSign);
  const first = f.targets[0];

  return {
    title: L.titles.varshphal,
    body: block(
      T.vpToneLabel, tone,
      T.vpTransitsLabel + "\n" + bullets([
        satH ? T.vpSaturn(L.sign(t.saturnSign), f.hN(satH), L.arena(satH)) : null,
        jupH ? T.vpJupiter(L.sign(t.jupiterSign), f.hN(jupH), L.arena(jupH)) : null,
        satFromMoon
          ? ([12, 1, 2].includes(satFromMoon)
              ? T.vpSadeSati(f.h(satFromMoon), L.sign(k.astroDetails?.sign))
              : T.vpNoSadeSati(f.h(satFromMoon), L.sign(k.astroDetails?.sign)))
          : null,
        t.rahuSign ? T.vpRahu(L.sign(t.rahuSign), rahuH ? f.hN(rahuH) : null) : null,
      ]),
      windows.length
        ? T.vpPeriodLabel + "\n" + bullets(windows.map((w) =>
            T.vpPeriod(L.date(w.start), L.date(w.end), f.p(w.maha), f.p(w.antar), w.active, f.p(w.antar), stateIn(w.antar), L.arena(f.houseOf(w.antar)))))
        : "",
      first
        ? T.vpKeepCycle(f.p(first), f.dormancy[first] ? L.state(f.dormancy[first]) : f.stPhrase(first), f.h(f.houseOf(first)))
        : T.vpNoStrain,
    ),
    placements: f.placements,
  };
}

function chapterHowToUse(f, rinResults) {
  const L = f.L, T = L.t;
  const firstDebt = rinResults.find((r) => r.present);
  const firstUpay = f.targets[0];
  return {
    title: L.titles.howTo,
    body: block(
      T.htLabel + "\n" + bullets([
        firstDebt ? T.htDebt(L.titles.rin[firstDebt.key].split(" —")[0], firstDebt.chapter) : T.htNoDebt,
        firstUpay ? T.htUpay(f.p(firstUpay), f.act(firstUpay), f.day(firstUpay)) : T.htNoUpay,
        T.htLord(f.p(f.lagnaLord), f.h(f.lagnaLordHouse)),
        T.htQuarterly,
        T.htVisible,
      ]),
      T.htLedger(f.supports.length, f.targets.length, rinResults.filter((r) => r.present).length),
      T.htClose,
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Assemble the 30 chapters in the published order.
// ─────────────────────────────────────────────────────────────────────────────

function buildSections(analysis, kundliData, subject, L) {
  const f = buildFacts(kundliData, analysis, subject, L);

  // Chapters 18–22 carry a dedicated page each; Bhratru Rin is judged too and
  // reported in the summary (chapter 23), matching the published contents.
  const rinResults = RIN_SPECS.map((spec) => evaluateRin(spec, f));
  const dedicated = ["pitru", "matru", "stree", "guru", "atma"]
    .map((key) => chapterRin(f, rinResults.find((r) => r.key === key)));

  const sections = [
    chapterAbout(f, rinResults),
    chapterBirthDetails(f),
    chapterPlacements(f),
    chapterAscendant(f),
    chapterKeyJudgments(f),
    chapterDormant(f),
    chapterBenefics(f),
    chapterMalefics(f, rinResults),
    ...PLANETS.map((n) => chapterPlanet(f, n)),
    ...dedicated,
    chapterRinSummary(f, rinResults),
    chapterDailyUpay(f),
    chapterWeeklyUpay(f),
    chapterAnnualUpay(f, rinResults),
    chapterDosDonts(f),
    chapterGemstones(f),
    chapterVarshphal(f),
    chapterHowToUse(f, rinResults),
  ];

  return { sections, facts: f, rinResults };
}

export async function generateInhouseLaalKitab(input) {
  const { name, dob, tob, pob, lat, lon, gender } = input;
  const language = input.language === "hi" ? "hi" : "en";
  const L = buildStringPack(language);

  const birthDate = normalizeBirthDate(dob);
  const birthTime = normalizeBirthTime(tob);
  const timezone = resolveTimezone(lat, lon);
  const astroGender = gender === "male" || gender === "female" || gender === "other" ? gender : "male";

  const kundliData = buildCalculatedKundliData({
    fullName: name || "User",
    gender: astroGender,
    birthDate, birthTime, birthPlace: pob || "",
    latitude: Number(lat), longitude: Number(lon), timezone, language,
  });

  const analysis = analyzeLaalKitab(kundliData);
  const s = analysis.summary;
  const subject = { name: name || "User", birthDate, birthTime, birthPlace: pob || "" };
  const { sections, facts, rinResults } = buildSections(analysis, kundliData, subject, L);

  const strong = s.strong_planets.length ? s.strong_planets.map((n) => L.P(n)).join(", ") : L.t.summaryNoneStrong;
  const weak = s.weak_planets.length ? s.weak_planets.map((n) => L.P(n)).join(", ") : L.t.summaryNoneWeak;
  const debts = rinResults.filter((r) => r.present);
  const overall_summary = L.t.summaryOverall(
    strong, weak,
    debts.length ? debts.map((r) => L.titles.rin[r.key].split(" —")[0]).join(", ") : L.t.summaryNoDebt,
  );

  const general_recommendation = facts.targets.length
    ? L.t.summaryRecommend(facts.p(facts.targets[0]), facts.act(facts.targets[0]), facts.day(facts.targets[0]))
    : L.t.summaryRecommendNone;

  const report = {
    generated_by: "inhouse_laalkitab",
    chart_id: 6,
    language,
    kundali_profile: { rashi: s.rashi, nakshatra: s.nakshatra, lagna: s.lagna },
    overall_summary,
    sections,
    general_recommendation,
    // structured payload — the UI draws the chart from this, never from prose
    laalkitab: {
      judgments: analysis.judgments,
      rin: analysis.rin,
      upaay: analysis.upaay,
      dos: analysis.dos,
      donts: analysis.donts,
      placements: facts.placements,
      dormancy: facts.dormancy,
      rin_six: rinResults.map((r) => ({
        key: r.key,
        name: L.titles.rin[r.key],
        present: r.present,
        rule: L.rin[r.key].rule,
        triggers: r.hits.map((h) => h.text),
      })),
      priority_upay: facts.targets.map((n) => ({
        planet: L.P(n), planet_en: n, house: facts.houseOf(n),
        act: L.dailyAct(n), day: L.weekday(PLANET_DAY[n]),
      })),
    },
  };

  const pdfBuffer = await buildLaalKitaabPdf({
    subject: { name: name || "User", birthDate, birthTime, birthPlace: pob || "" },
    analysis,
    language,
  });

  return { report, pdfBuffer, kundliData };
}
