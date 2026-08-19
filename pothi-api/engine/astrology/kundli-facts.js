// ─────────────────────────────────────────────────────────────────────────────
// Derived chart facts for the 64-chapter Premium Kundali.
//
// Everything here is computed from the kundliData the astronomy engine already
// produced (planets, houses, divisional charts, dashas, ashtakavarga, doshas).
// No prose, no LLM: this module only turns positions into the further FACTS the
// chapters quote — dignity, aspects, combustion, planetary strength, yogas,
// divisional charts and dated dasha windows.
//
//   buildChartFacts(kundliData) → { … }
// ─────────────────────────────────────────────────────────────────────────────

import { vargaSign as classicalVargaSign } from "./varga.js";
import { SIGNS, SignLords, DashaOrder, DashaYears } from "./astro-constants.js";
import { buildDashaWindows } from "./normalize-kundli-data.js";
import { computeSadeSatiTimeline } from "./sade-sati-timeline.js";

export const ABBR = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};
export const GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
export const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// ── static domain tables (dignity / karaka / house domain / varga rules) ─────

export const EXALT = { Sun: "Aries", Moon: "Taurus", Mars: "Capricorn", Mercury: "Virgo", Jupiter: "Cancer", Venus: "Pisces", Saturn: "Libra", Rahu: "Taurus", Ketu: "Scorpio" };
export const DEBIL = { Sun: "Libra", Moon: "Scorpio", Mars: "Cancer", Mercury: "Pisces", Jupiter: "Capricorn", Venus: "Virgo", Saturn: "Aries", Rahu: "Scorpio", Ketu: "Taurus" };
export const OWN = {
  Sun: ["Leo"], Moon: ["Cancer"], Mars: ["Aries", "Scorpio"], Mercury: ["Gemini", "Virgo"],
  Jupiter: ["Sagittarius", "Pisces"], Venus: ["Taurus", "Libra"], Saturn: ["Capricorn", "Aquarius"]
};
// Moolatrikona sign with its degree band.
export const MOOLA = {
  Sun: ["Leo", 0, 20], Moon: ["Taurus", 4, 30], Mars: ["Aries", 0, 12], Mercury: ["Virgo", 16, 20],
  Jupiter: ["Sagittarius", 0, 10], Venus: ["Libra", 0, 15], Saturn: ["Aquarius", 0, 20]
};
export const FRIENDS = {
  Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"], Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"], Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"], Rahu: ["Venus", "Saturn", "Mercury"], Ketu: ["Mars", "Venus", "Saturn"]
};
export const ENEMIES = {
  Sun: ["Venus", "Saturn"], Moon: [], Mars: ["Mercury"], Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"], Venus: ["Sun", "Moon"], Saturn: ["Sun", "Moon", "Mars"],
  Rahu: ["Sun", "Moon", "Mars"], Ketu: ["Sun", "Moon"]
};

// Vedic aspects as house-counts forward from the occupied house.
export const ASPECT_OFFSETS = {
  Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9]
};

// Combustion orbs in degrees from the Sun (retrograde orb where it differs).
export const COMBUST_ORB = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
export const COMBUST_ORB_RETRO = { Mercury: 12, Venus: 8 };

// Directional (dig) strength: the house each planet is strongest in.
export const DIG_HOUSE = { Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Moon: 4, Venus: 4, Saturn: 7 };
// Naisargika (natural) strength in virupas, Parashara's order.
export const NAISARGIKA = { Sun: 60, Moon: 51.43, Venus: 42.85, Jupiter: 34.28, Mercury: 25.7, Mars: 17.14, Saturn: 8.57 };
// Kendradi (house-class) strength.
export const HOUSE_STRENGTH = { 1: 100, 2: 65, 3: 55, 4: 90, 5: 85, 6: 40, 7: 90, 8: 25, 9: 85, 10: 100, 11: 70, 12: 30 };

export const PANCHA_MAHAPURUSHA = { Mars: "Ruchaka", Mercury: "Bhadra", Jupiter: "Hamsa", Venus: "Malavya", Saturn: "Sasa" };

// Classical Trimsamsa (D30) rulers by degree band — odd signs, then even signs.
const TRIMSAMSA_ODD = [[5, "Mars"], [10, "Saturn"], [18, "Jupiter"], [25, "Mercury"], [30, "Venus"]];
const TRIMSAMSA_EVEN = [[5, "Venus"], [12, "Mercury"], [20, "Jupiter"], [25, "Saturn"], [30, "Mars"]];

// The sixteen vargas of the Shodashavarga scheme.
export const SHODASHAVARGA = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

// ── small helpers ────────────────────────────────────────────────────────────

export const norm = (x) => ((x % 360) + 360) % 360;
export const signIdx = (sign) => SIGNS.indexOf(sign);
export const houseFrom = (fromIdx, toIdx) => ((toIdx - fromIdx + 12) % 12) + 1;
export const dms = (deg) => {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return m === 60 ? `${d + 1}°00'` : `${d}°${String(m).padStart(2, "0")}'`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function parseShortDate(s) {
  const m = String(s || "").match(/^(\d{2}) (\w{3}) (\d{4})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1])));
}
export const fmtDate = (d) => `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

// Classical Parashari varga. One implementation, in engine/astrology/varga.js,
// so a chapter can never contradict the divisional tables in the PDF — and so
// there is one place to be right rather than three places to be wrong.
// (Imported, not just re-exported: `export … from` creates no local binding,
//  and this file calls it itself further down.)
export const vargaSignOf = (longitude, divisor) => classicalVargaSign(longitude, divisor);

// Classical Hora (D2): first half of an odd sign is the Sun's hora, second half
// the Moon's; reversed in even signs.
export function horaLordOf(longitude) {
  const lon = norm(longitude);
  const s = Math.floor(lon / 30);
  const firstHalf = (lon % 30) < 15;
  const odd = s % 2 === 0; // Aries is sign 0 and is odd in the classical count
  return odd === firstHalf ? "Sun" : "Moon";
}

export function trimsamsaLordOf(longitude) {
  const lon = norm(longitude);
  const s = Math.floor(lon / 30);
  const inSign = lon % 30;
  const table = s % 2 === 0 ? TRIMSAMSA_ODD : TRIMSAMSA_EVEN;
  for (const [limit, lord] of table) if (inSign < limit) return lord;
  return table[table.length - 1][1];
}

// ── dignity ──────────────────────────────────────────────────────────────────

export function dignityOf(planet) {
  const { name, sign, degree } = planet;
  if (EXALT[name] === sign) return "exalted";
  if (DEBIL[name] === sign) return "debilitated";
  const mt = MOOLA[name];
  if (mt && mt[0] === sign && degree >= mt[1] && degree < mt[2]) return "moolatrikona";
  if ((OWN[name] || []).includes(sign)) return "own";
  const dispositor = SignLords[sign];
  if ((FRIENDS[name] || []).includes(dispositor)) return "friend";
  if ((ENEMIES[name] || []).includes(dispositor)) return "enemy";
  return "neutral";
}

const DIGNITY_SCORE = { exalted: 100, moolatrikona: 92, own: 85, friend: 65, neutral: 50, enemy: 30, debilitated: 15 };

// ── main builder ─────────────────────────────────────────────────────────────

export function buildChartFacts(kundliData) {
  const planets = kundliData.planets || [];
  const houses = kundliData.houses || [];
  const ascSign = kundliData.ascendant?.sign;
  const ascIdx = signIdx(ascSign);
  const byName = Object.fromEntries(planets.map((p) => [p.name, p]));
  const P = (n) => byName[n];
  const H = (n) => houses.find((h) => h.house === n);

  // Which houses each planet rules, counted from the Lagna.
  const lordships = {};
  for (const g of GRAHAS) lordships[g] = [];
  for (const h of houses) if (lordships[h.lord]) lordships[h.lord].push(h.house);

  // Aspects: houses each planet throws its glance on, and who looks at a house.
  const aspectsFrom = {};
  for (const p of planets) {
    aspectsFrom[p.name] = (ASPECT_OFFSETS[p.name] || [7]).map((o) => ((p.house - 1 + o - 1) % 12) + 1);
  }
  const aspectsOnHouse = {};
  for (let h = 1; h <= 12; h += 1) {
    aspectsOnHouse[h] = planets.filter((p) => aspectsFrom[p.name].includes(h)).map((p) => p.name);
  }

  // Combustion — angular distance from the Sun against the classical orb.
  const sun = P("Sun");
  const combust = {};
  for (const p of planets) {
    if (p.name === "Sun" || p.name === "Rahu" || p.name === "Ketu" || !sun) continue;
    let diff = Math.abs(norm(p.longitude - sun.longitude));
    if (diff > 180) diff = 360 - diff;
    const orb = (p.retrograde && COMBUST_ORB_RETRO[p.name]) || COMBUST_ORB[p.name];
    if (orb != null) combust[p.name] = { combust: diff < orb, distance: diff, orb };
  }

  // Ashtakavarga lookups.
  const av = kundliData.ashtakavarga || {};
  const savByHouse = (h) => (av.houses || []).find((x) => x.house === h)?.score ?? null;
  const bavInOwnSign = {};
  for (const g of SEVEN) {
    const row = av.bavBySign?.[g];
    const p = P(g);
    if (row && p) bavInOwnSign[g] = row[signIdx(p.sign)];
  }
  const savRank = (av.houses || [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((x, i) => ({ house: x.house, score: x.score, rank: i + 1 }));
  const savRankOf = (h) => savRank.find((x) => x.house === h) || null;

  // Composite planetary strength. This is not the full six-fold Shadbala in
  // virupas — it is a weighted score over the components this engine can
  // actually compute: dignity, directional strength, house class, motion,
  // natural strength and Ashtakavarga bindus.
  const strength = SEVEN.map((name) => {
    const p = P(name);
    if (!p) return null;
    const dig = dignityOf(p);
    const digBala = (() => {
      const best = DIG_HOUSE[name];
      let d = Math.abs(p.house - best);
      if (d > 6) d = 12 - d;
      return Math.round(100 - (d / 6) * 100);
    })();
    const motion = name === "Sun" || name === "Moon" ? 60 : p.retrograde ? 85 : 55;
    const combustPenalty = combust[name]?.combust ? 20 : 0;
    const bav = bavInOwnSign[name];
    const bavScore = bav == null ? 50 : Math.round((bav / 8) * 100);
    const natural = Math.round((NAISARGIKA[name] / 60) * 100);
    const raw =
      DIGNITY_SCORE[dig] * 0.3 +
      digBala * 0.2 +
      (HOUSE_STRENGTH[p.house] ?? 50) * 0.2 +
      motion * 0.1 +
      natural * 0.1 +
      bavScore * 0.1;
    const score = Math.max(0, Math.round(raw - combustPenalty));
    return { planet: name, score, dignity: dig, digBala, houseClass: HOUSE_STRENGTH[p.house] ?? 50, motion, bindus: bav ?? null, combust: Boolean(combust[name]?.combust) };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  // ── divisional charts ──────────────────────────────────────────────────────
  const varga = (divisor) => {
    const lagnaSign = vargaSignOf(kundliData.ascendant.longitude, divisor);
    const lIdx = signIdx(lagnaSign);
    const placements = planets.map((p) => {
      const sign = vargaSignOf(p.longitude, divisor);
      return {
        planet: p.name,
        abbr: ABBR[p.name],
        sign,
        house: houseFrom(lIdx, signIdx(sign)),
        degree: dms(p.degree)
      };
    });
    const vargottama = placements.filter((x) => x.sign === P(x.planet).sign).map((x) => x.planet);
    const dignified = placements.filter((x) => EXALT[x.planet] === x.sign || (OWN[x.planet] || []).includes(x.sign)).map((x) => x.planet);
    const debilitated = placements.filter((x) => DEBIL[x.planet] === x.sign).map((x) => x.planet);
    const inKendra = placements.filter((x) => [1, 4, 7, 10].includes(x.house)).map((x) => x.planet);
    return { divisor, lagnaSign, lagnaLord: SignLords[lagnaSign], placements, vargottama, dignified, debilitated, inKendra, at: (n) => placements.find((x) => x.planet === n) };
  };

  // Own/exalted count across the sixteen vargas — a computed strength tally.
  const shodashaTally = SEVEN.map((name) => {
    const p = P(name);
    let count = 0;
    for (const d of SHODASHAVARGA) {
      const s = d === 1 ? p.sign : vargaSignOf(p.longitude, d);
      if (EXALT[name] === s || (OWN[name] || []).includes(s)) count += 1;
    }
    return { planet: name, count };
  }).sort((a, b) => b.count - a.count);

  // ── yogas ──────────────────────────────────────────────────────────────────
  const kendraLords = [...new Set([1, 4, 7, 10].map((h) => H(h)?.lord).filter(Boolean))];
  const trikonaLords = [...new Set([1, 5, 9].map((h) => H(h)?.lord).filter(Boolean))];

  const rajaYogas = [];
  const yogakarakas = GRAHAS.filter((g) =>
    lordships[g].some((h) => [4, 7, 10].includes(h)) && lordships[g].some((h) => [5, 9].includes(h))
  );
  for (const g of yogakarakas) {
    rajaYogas.push({ name: "Yogakaraka", planets: [g], houses: lordships[g], reason: `rules both a kendra and a trikona (houses ${lordships[g].join(", ")})`, reason_hi: `केंद्र और त्रिकोण दोनों का स्वामी है (भाव ${lordships[g].join(", ")})`, name_hi: "योगकारक", house: P(g)?.house });
  }
  for (const k of kendraLords) {
    for (const t of trikonaLords) {
      if (k === t) continue;
      const pk = P(k); const pt = P(t);
      if (!pk || !pt) continue;
      if (pk.house === pt.house) {
        rajaYogas.push({ name: "Raja Yoga (conjunction)", planets: [k, t], house: pk.house, reason: `kendra lord ${k} and trikona lord ${t} sit together in house ${pk.house}`, reason_hi: `केंद्रेश ${k} और त्रिकोणेश ${t} ${pk.house}वें भाव में साथ बैठे हैं`, name_hi: "राज योग (युति)" });
      } else if (aspectsFrom[k].includes(pt.house) && aspectsFrom[t].includes(pk.house)) {
        rajaYogas.push({ name: "Raja Yoga (mutual aspect)", planets: [k, t], house: pk.house, reason: `kendra lord ${k} in house ${pk.house} and trikona lord ${t} in house ${pt.house} aspect each other`, reason_hi: `${pk.house}वें भाव का केंद्रेश ${k} और ${pt.house}वें भाव का त्रिकोणेश ${t} परस्पर दृष्टि रखते हैं`, name_hi: "राज योग (परस्पर दृष्टि)" });
      }
    }
  }
  // Parivartana (exchange) between any two house lords.
  const exchanges = [];
  for (const a of houses) {
    for (const b of houses) {
      if (a.house >= b.house) continue;
      const pa = P(a.lord); const pb = P(b.lord);
      if (!pa || !pb || a.lord === b.lord) continue;
      if (pa.house === b.house && pb.house === a.house) {
        exchanges.push({ houses: [a.house, b.house], lords: [a.lord, b.lord] });
      }
    }
  }

  const dhanaHouses = [2, 5, 9, 11];
  const dhanaYogas = [];
  for (let i = 0; i < dhanaHouses.length; i += 1) {
    for (let j = i + 1; j < dhanaHouses.length; j += 1) {
      const a = dhanaHouses[i]; const b = dhanaHouses[j];
      const la = H(a)?.lord; const lb = H(b)?.lord;
      const pa = P(la); const pb = P(lb);
      if (!pa || !pb) continue;
      if (la === lb) {
        dhanaYogas.push({ planets: [la], houses: [a, b], reason: `${la} rules both the ${a}th and the ${b}th and sits in house ${pa.house}`, reason_hi: `${la} ${a}वें और ${b}वें दोनों का स्वामी है और ${pa.house}वें भाव में है` });
      } else if (pa.house === pb.house) {
        dhanaYogas.push({ planets: [la, lb], houses: [a, b], reason: `${a}th lord ${la} and ${b}th lord ${lb} sit together in house ${pa.house}`, reason_hi: `${a}वें भाव का स्वामी ${la} और ${b}वें भाव का स्वामी ${lb} ${pa.house}वें भाव में साथ हैं` });
      } else if (pa.house === b || pb.house === a) {
        dhanaYogas.push({ planets: [la, lb], houses: [a, b], reason: pa.house === b ? `${a}th lord ${la} is placed in the ${b}th` : `${b}th lord ${lb} is placed in the ${a}th`,
          reason_hi: pa.house === b ? `${a}वें भाव का स्वामी ${la} ${b}वें भाव में है` : `${b}वें भाव का स्वामी ${lb} ${a}वें भाव में है` });
      }
    }
  }

  const mahapurusha = Object.entries(PANCHA_MAHAPURUSHA).map(([name, yoga]) => {
    const p = P(name);
    if (!p) return null;
    const dig = dignityOf(p);
    const present = ["own", "moolatrikona", "exalted"].includes(dig) && [1, 4, 7, 10].includes(p.house);
    return { yoga, planet: name, present, sign: p.sign, house: p.house, dignity: dig };
  }).filter(Boolean);

  // Vipreet Raja Yoga — a dusthana lord placed in a dusthana.
  const vipreet = [6, 8, 12].map((h) => {
    const lord = H(h)?.lord; const p = P(lord);
    if (!p || ![6, 8, 12].includes(p.house)) return null;
    return { house: h, lord, placedIn: p.house };
  }).filter(Boolean);

  // Neecha Bhanga — a debilitated planet whose dispositor or exaltation lord
  // sits in a kendra from the Lagna or the Moon.
  const moon = P("Moon");
  const neechaBhanga = planets.filter((p) => dignityOf(p) === "debilitated").map((p) => {
    const dispositor = P(SignLords[p.sign]);
    const exaltLord = P(SignLords[EXALT[p.name]]);
    const kendraFromLagna = (q) => q && [1, 4, 7, 10].includes(q.house);
    const kendraFromMoon = (q) => q && moon && [1, 4, 7, 10].includes(houseFrom(signIdx(moon.sign), signIdx(q.sign)));
    const cancels = [dispositor, exaltLord].filter((q) => kendraFromLagna(q) || kendraFromMoon(q));
    return { planet: p.name, sign: p.sign, house: p.house, cancelled: cancels.length > 0, by: cancels.map((q) => q.name) };
  });

  // Moon-based yogas.
  const moonIdxSign = moon ? signIdx(moon.sign) : -1;
  const supportOf = (offset) => planets.filter((p) => !["Moon", "Rahu", "Ketu", "Sun"].includes(p.name) && houseFrom(moonIdxSign, signIdx(p.sign)) === offset).map((p) => p.name);
  const second = supportOf(2);
  const twelfth = supportOf(12);
  const moonYogas = {
    sunapha: second.length > 0 && twelfth.length === 0 ? second : [],
    anapha: twelfth.length > 0 && second.length === 0 ? twelfth : [],
    durudhura: second.length > 0 && twelfth.length > 0 ? [...twelfth, ...second] : [],
    kemadruma: second.length === 0 && twelfth.length === 0
  };
  const jup = P("Jupiter");
  const gajaKesari = Boolean(jup && moon && [1, 4, 7, 10].includes(houseFrom(moonIdxSign, signIdx(jup.sign))));
  const budhaAditya = Boolean(P("Mercury") && sun && P("Mercury").house === sun.house);
  const chandraMangala = Boolean(moon && P("Mars") && moon.house === P("Mars").house);
  const amala = (() => {
    const tenthFromLagna = planets.filter((p) => p.house === 10 && ["Jupiter", "Venus", "Mercury"].includes(p.name)).map((p) => p.name);
    const tenthFromMoon = moon ? planets.filter((p) => houseFrom(moonIdxSign, signIdx(p.sign)) === 10 && ["Jupiter", "Venus", "Mercury"].includes(p.name)).map((p) => p.name) : [];
    return [...new Set([...tenthFromLagna, ...tenthFromMoon])];
  })();

  // ── dasha windows ──────────────────────────────────────────────────────────
  const birthUtc = kundliData.calculationMeta?.birthUtc ? new Date(kundliData.calculationMeta.birthUtc) : null;
  const timeline = (kundliData.dashas?.vimshottariTimeline || []).map((m) => ({
    ...m, startDate: parseShortDate(m.start), endDate: parseShortDate(m.end)
  }));
  const now = new Date();
  const activeMaha = timeline.find((m) => m.startDate && m.endDate && now >= m.startDate && now < m.endDate) || timeline[0] || null;

  let antarWindows = [];
  if (moon && birthUtc) {
    antarWindows = buildDashaWindows({ moonLongitude: moon.longitude, birthUtc, fromDate: now, years: 25, lookbackYears: 25 });
  }
  const currentAntar = antarWindows.find((w) => w.active) || null;
  const antarInCurrentMaha = activeMaha ? antarWindows.filter((w) => w.maha === activeMaha.mahaDasha) : [];

  // Pratyantar sub-periods over the next 24 months.
  const horizon = now.getTime() + 730 * 86400000;
  const pratyantars = [];
  for (const w of antarWindows) {
    if (w.endMs < now.getTime() || w.startMs > horizon) continue;
    const total = w.endMs - w.startMs;
    const start = DashaOrder.indexOf(w.antar);
    let cursor = w.startMs;
    for (let i = 0; i < DashaOrder.length; i += 1) {
      const lord = DashaOrder[(start + i) % DashaOrder.length];
      const next = cursor + (total * DashaYears[lord]) / 120;
      if (next >= now.getTime() && cursor <= horizon) {
        pratyantars.push({
          maha: w.maha, antar: w.antar, pratyantar: lord,
          start: fmtDate(new Date(cursor)), end: fmtDate(new Date(next)),
          active: now.getTime() >= cursor && now.getTime() < next
        });
      }
      cursor = next;
    }
  }

  // ── transits ───────────────────────────────────────────────────────────────
  const ts = kundliData.transitSnapshot || {};
  const transitOf = (sign) => {
    if (!sign) return null;
    const idx = signIdx(sign);
    return {
      sign,
      fromLagna: ascIdx >= 0 ? houseFrom(ascIdx, idx) : null,
      fromMoon: moonIdxSign >= 0 ? houseFrom(moonIdxSign, idx) : null
    };
  };
  const transits = {
    saturn: transitOf(ts.saturnSign),
    jupiter: transitOf(ts.jupiterSign),
    rahu: transitOf(ts.rahuSign),
    ketu: transitOf(ts.ketuSign),
    moon: transitOf(ts.moonSign)
  };

  // Saturn's 7.5-year passage over the natal Moon, sampled by the engine.
  let sadeSati = null;
  try { sadeSati = moon ? computeSadeSatiTimeline(moon.sign, now) : null; } catch { sadeSati = null; }

  const natalPlacements = planets.map((p) => ({
    planet: p.name, abbr: ABBR[p.name], sign: p.sign, house: p.house, degree: dms(p.degree)
  }));

  return {
    P, H, byName, planets, houses, ascSign, ascIdx, ascLord: SignLords[ascSign],
    lordships, aspectsFrom, aspectsOnHouse, combust,
    savByHouse, savRankOf, savRank, bavInOwnSign, avTotal: av.total ?? null,
    strength, varga, shodashaTally,
    rajaYogas, yogakarakas, exchanges, dhanaYogas, mahapurusha, vipreet, neechaBhanga,
    moonYogas, gajaKesari, budhaAditya, chandraMangala, amala,
    timeline, activeMaha, antarWindows, currentAntar, antarInCurrentMaha, pratyantars,
    transits, sadeSati, natalPlacements, now
  };
}
