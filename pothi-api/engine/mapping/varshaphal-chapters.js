// ─────────────────────────────────────────────────────────────────────────────
// Varshaphal chapter mapper — turns the computed Tajika facts into the exact
// 40 chapters published for astro_chart_listing id = 7.
//
// Every chapter is: compute → rule → templated sentence. No LLM, no padding,
// no chapter split across pages. Wording comes only from the language pack, so
// an "hi" report is Hindi end to end.
// ─────────────────────────────────────────────────────────────────────────────

import { LIFE_AREAS, JAPA_COUNT, PLANET_WEEKDAY } from "../astrology/tajika.js";

// Goals of chapter 30, in the order the life-area chapters appear.
const GOAL_KEYS = ["career", "finance", "marriage", "children", "health", "property", "travel", "education", "legal"];
// Chapter number of each life-area chapter, cited by the goal chapter.
const AREA_CHAPTER = { career: 21, finance: 22, marriage: 23, children: 24, health: 25, property: 26, travel: 27, education: 28, legal: 29 };

const uniq = (a) => [...new Set(a)];

// Every date in [from, to] whose weekday is `dow`.
function weekdayDates(from, to, dow) {
  const out = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  while (d.getTime() <= to.getTime()) {
    if (d.getUTCDay() === dow) out.push(new Date(d.getTime()));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const monthOfDate = (months, ms) => months.find((m) => ms >= m.startMs && ms < m.endMs) || null;

export function buildVarshaphalSections(f, P) {
  const t = P.t;
  const T = P.vpTitles;
  const annualPl = f.annual.placements;
  const natalPl = f.natal.placements;
  const sec = [];
  const add = (i, body, placements, data) => sec.push({
    n: i + 1, title: T[i], body,
    ...(placements ? { placements } : {}),
    ...(data ? { data } : {}),
  });

  const dg = (k) => P.dignity(k);
  const pl = (p) => P.planet(p);
  const sg = (s) => P.sign(s);
  // `hRef` is the oblique/in-sentence form, `hName` the standalone table form.
  const hRef = (h) => t.houseRef(h);
  const hName = (h) => t.houseName(h);

  // ── 1. About This Report ───────────────────────────────────────────────────
  add(0, P.block(
    t.vpAbout({
      age: f.year.age, from: P.fmtDate(f.year.start), to: P.fmtDate(f.year.end),
      lagna: sg(f.annual.lagnaSign), varshesh: pl(f.varshesh.lord),
      munthaHouse: f.muntha.house, munthaArea: P.houseArea(f.muntha.house),
    }),
    P.kv([
      ["name", f.subject.name],
      ["birthDetails", `${f.subject.birthDate} · ${f.subject.birthTime}`],
      ["birthPlace", f.subject.birthPlace || "—"],
      ["lagna", sg(f.natal.lagnaSign)],
      ["rashi", sg(f.natal.moonSign)],
      ["nakshatra", P.nakshatra(f.natal.nakshatra)],
    ]),
    `${P.head("method")}: ${t.method("vp")}`,
    t.placementsNote(),
  ), natalPl);

  // ── 2. Solar Return Details ────────────────────────────────────────────────
  const srSun = annualPl.find((p) => p.planet === "Sun");
  add(1, P.block(
    t.vpSolarReturn({
      natalSunLon: f.natal.sunLongitude, instant: P.fmtDateTime(f.year.start),
      lagna: sg(f.annual.lagnaSign), lagnaDeg: t.deg(f.annual.lagnaDegree),
      sunHouse: srSun.house, dayNight: f.year.dayBirth ? P.head("day") : P.head("night"),
    }),
    P.kv([
      ["solarReturn", P.fmtDateTime(f.year.start)],
      ["yearWindow", P.range(f.year.start, f.year.end)],
      ["age", String(f.year.age)],
      ["dayNight", f.year.dayBirth ? P.head("day") : P.head("night")],
      ["annualLagna", `${sg(f.annual.lagnaSign)} ${t.deg(f.annual.lagnaDegree)}`],
      ["annualLagnaLord", pl(f.annual.lagnaLord)],
      ["moonSign", sg(f.annual.moonSign)],
      ["nakshatra", P.nakshatra(f.annual.nakshatra)],
      ["tithi", P.tithi(f.annual.tithiNumber)],
      ["weekday", P.weekday(f.annual.weekdayIndex)],
    ]),
  ), annualPl);

  // ── 3. Year Lord & Muntha ──────────────────────────────────────────────────
  const munthaLordP = f.muntha.lordPlacement;
  add(2, P.block(
    t.vpYearLord({
      lord: pl(f.varshesh.lord), house: f.varshesh.house, dignity: dg(f.varshesh.dignity),
      angular: f.varshesh.angular, score: f.varshesh.score,
      roles: (P.lang === "hi" ? f.varshesh.roles_hi : f.varshesh.roles)?.length
        ? (P.lang === "hi" ? f.varshesh.roles_hi : f.varshesh.roles).join(", ")
        : "",
    }),
    // Each candidate carries its offices in both scripts — the Hindi list was
    // printing the English ones.
    P.ul(f.candidates.map((c) => {
      const roles = (P.lang === "hi" ? c.roles_hi : c.roles) || c.roles || [];
      const kendra = P.lang === "hi" ? " · केंद्र" : " · kendra";
      return `${pl(c.lord)} — ${hName(c.house)}, ${dg(c.dignity)}${c.angular ? kendra : ""}${roles.length ? ` · ${roles.join(", ")}` : ""}`;
    })),
    t.vpMuntha({
      sign: sg(f.muntha.sign), house: f.muntha.house, lord: pl(f.muntha.lord),
      lordHouse: munthaLordP?.house, lordDignity: dg(munthaLordP?.dignity),
      area: P.houseArea(f.muntha.house),
    }),
  ), annualPl, { candidates: f.candidates, muntha: f.muntha });

  // ── 4. The Varsha Chart ────────────────────────────────────────────────────
  const kendra = annualPl.filter((p) => [1, 4, 7, 10].includes(p.house));
  const trikona = annualPl.filter((p) => [5, 9].includes(p.house));
  const retros = annualPl.filter((p) => p.retrograde);
  add(3, P.block(
    t.vpChartLead({
      instant: P.fmtDateTime(f.year.start), lagna: sg(f.annual.lagnaSign),
      kendra: kendra.length, trikona: trikona.length,
      retro: retros.length ? P.planets(retros.map((p) => p.planet)) : "",
    }),
    P.ul(annualPl.map((p) => `${pl(p.planet)} — ${sg(p.sign)} ${t.deg(p.degree)}, ${hName(p.house)}, ${dg(p.dignity)}${p.retrograde ? " · R" : ""} · ${P.nakshatra(p.nakshatra)}`)),
    P.ul(f.annual.houses.map((h) => `${hName(h.house)} — ${sg(h.sign)}, ${P.head("lord")} ${pl(h.lord)}${h.occupants.length ? ` · ${P.planets(h.occupants)}` : ""}`)),
  ), annualPl, { houses: f.annual.houses });

  // ── 5. Tri-Pataki Chakra ───────────────────────────────────────────────────
  add(4, P.block(
    t.vpTripataki({ moonSign: sg(f.tripataki.moonSign), strongest: f.tripataki.strongest }),
    P.ul(f.tripataki.flags.map((fl) => `${P.head("flag")} ${fl.index} (${fl.counts.join(", ")}) — ${fl.members.length ? P.planets(fl.members.map((m) => m.planet)) : P.head("noneFound")} · ${P.verdict(fl.verdict)} (${fl.benefics}/${fl.malefics})`)),
  ), annualPl, { tripataki: f.tripataki });

  // ── 6. Sahams ──────────────────────────────────────────────────────────────
  const reversedCount = f.sahams.filter((s) => s.reversedForNight).length;
  add(5, P.block(
    t.vpSahams({
      dayNight: f.year.dayBirth ? P.head("day") : P.head("night"),
      reversed: reversedCount,
    }),
    P.ul(f.sahams.map((s) => t.vpSahamLine({
      name: P.sahamName(s.key), formula: s.formula, sign: sg(s.sign), deg: t.deg(s.degree),
      house: s.house, lord: pl(s.lord), lordHouse: s.lordHouse, lordDignity: dg(s.lordDignity),
      meaning: P.sahamMeaning(s.key),
    }))),
  ), annualPl, { sahams: f.sahams });

  // ── 7. Panchavargeeya Bala ─────────────────────────────────────────────────
  add(6, P.block(
    t.vpPancha(),
    P.ul(f.panchavargeeya.map((b) => `${pl(b.planet)} — ${b.kshetra} + ${b.uchcha} + ${b.hadda} + ${b.drekkana} + ${b.navamsha} = ${b.total}/80 → ${b.bala}/20 · ${P.grade(b.grade)}`)),
    t.vpPanchaVerdict({
      strongest: pl(f.strongest.planet), strongestBala: f.strongest.bala,
      weakest: pl(f.weakest.planet), weakestBala: f.weakest.bala,
    }),
  ), annualPl, { panchavargeeya: f.panchavargeeya });

  // ── 8. Harsha Bala ─────────────────────────────────────────────────────────
  const harshaSorted = f.harsha.slice().sort((a, b) => b.total - a.total);
  const harshaZero = harshaSorted.filter((h) => h.total === 0).map((h) => h.planet);
  add(7, P.block(
    t.vpHarsha(),
    P.ul(harshaSorted.map((h) => `${pl(h.planet)} — ${h.total}/20 · ${P.grade(h.grade)}${h.scored.length ? ` · ${h.scored.map((r) => P.harshaRule(r)).join(", ")}` : ""}`)),
    t.vpHarshaVerdict({
      top: pl(harshaSorted[0].planet), topPoints: harshaSorted[0].total,
      zero: harshaZero.length ? P.planets(harshaZero) : "",
    }),
  ), annualPl, { harsha: f.harsha });

  // ── 9–20. Month 1 … Month 12 ───────────────────────────────────────────────
  f.months.forEach((m, idx) => {
    const r = m.ruler;
    const lines = [
      t.vpMonth({
        i: m.index, from: P.fmtDate(m.start), to: P.fmtDate(m.end),
        arc: `${(m.index - 1) * 30}°–${m.index * 30}°`,
        sunHouse: m.sunHouse, munthaHouse: m.munthaHouse, munthaArea: P.houseArea(m.munthaHouse),
      }),
      r ? t.vpMonthRuler({
        lord: pl(r.lord), days: r.days, house: r.house, dignity: dg(r.dignity),
        karaka: P.karaka(r.lord), tone: P.tone(m.tone),
      }) : null,
      t.vpMonthEntry({ lagna: sg(m.lagnaSign), moon: sg(m.moonSign), tithi: P.tithi(m.tithiNumber) }),
      m.rulers.length > 1
        ? P.ul(m.rulers.map((x) => `${pl(x.lord)} — ${x.days} ${P.head("dayUnit")} · ${hName(x.house)}, ${dg(x.dignity)}`))
        : null,
      P.kv([
        ["period", P.range(m.start, m.end)],
        ["monthLagna", `${sg(m.lagnaSign)} (${P.head("lord")} ${pl(m.lagnaLord)})`],
        ["sunHouse", `${hName(m.sunHouse)} · ${sg(m.sunSign)}`],
        ["munthaHouse", hName(m.munthaHouse)],
        ["tone", P.tone(m.tone)],
      ]),
    ];
    add(8 + idx, P.block(...lines), annualPl, { month: { index: m.index, start: m.start, end: m.end, munthaHouse: m.munthaHouse, sunHouse: m.sunHouse, tone: m.tone, rulers: m.rulers } });
  });

  // ── 21–29. Life areas ──────────────────────────────────────────────────────
  const areaMonths = (spec) => {
    const lords = uniq(spec.houses.map((h) => f.lordOfHouse(h).lord).concat(spec.karaka));
    return f.months.filter((m) => m.ruler && lords.includes(m.ruler.lord));
  };

  LIFE_AREAS.forEach((spec, i) => {
    const lordInfos = spec.houses.map((h) => {
      const L = f.lordOfHouse(h);
      const occ = f.occupantsOf(h);
      return { ...L, occupants: occ };
    });
    const saham = f.sahamByKey[spec.saham];
    const karakaBala = f.balaByPlanet[spec.karaka];
    const ms = areaMonths(spec);
    const lordLines = lordInfos.map((L) => t.vpLordLine({
      house: L.house, sign: sg(L.sign), lord: pl(L.lord), lordHouse: L.lordHouse,
      dignity: dg(L.lordDignity), retro: L.lordRetro,
      occupants: L.occupants.length ? P.planets(L.occupants) : "",
    })).join(" ");

    add(20 + i, P.block(
      t.vpArea({
        area: P.areaName(spec.key),
        houses: spec.houses.map((h) => t.houseRef(h)).join(" + "),
        lordLines,
      }),
      t.vpAreaSaham({
        saham: P.sahamName(saham.key), sign: sg(saham.sign), house: saham.house,
        lord: pl(saham.lord), lordHouse: saham.lordHouse, lordDignity: dg(saham.lordDignity),
      }),
      t.vpAreaWindows({
        months: ms.map((m) => m.index).join(", "),
        dates: ms.map((m) => P.range(m.start, m.end)).join("; "),
      }),
      P.kv([
        ["karaka", `${pl(spec.karaka)} — ${hName(karakaBala ? karakaBala.house : f.annual.placements.find((p) => p.planet === spec.karaka).house)}, ${karakaBala ? `${karakaBala.bala}/20 · ${P.grade(karakaBala.grade)}` : dg(f.annual.placements.find((p) => p.planet === spec.karaka).dignity)}`],
        ["saham", `${P.sahamName(saham.key)} · ${sg(saham.sign)} ${t.deg(saham.degree)}`],
      ]),
      P.ul(P.areaGuide(spec.key)),
    ), annualPl, { houses: spec.houses, lords: lordInfos, saham, months: ms.map((m) => m.index) });
  });

  // ── 30. Best Months for Each Goal ──────────────────────────────────────────
  const bestLines = GOAL_KEYS.map((key) => {
    const spec = LIFE_AREAS.find((a) => a.key === key);
    const lords = uniq(spec.houses.map((h) => f.lordOfHouse(h).lord).concat(spec.karaka));
    const cands = f.months
      .filter((m) => m.ruler && lords.includes(m.ruler.lord) && m.score >= 1)
      .sort((a, b) => b.score - a.score);
    const goal = `${P.areaName(key)} (§${AREA_CHAPTER[key]})`;
    if (!cands.length) return t.vpBestNone({ goal });
    const m = cands[0];
    return t.vpBest({
      goal, month: m.index, dates: P.range(m.start, m.end),
      lord: pl(m.ruler.lord), dignity: dg(m.ruler.dignity), house: m.ruler.house,
    });
  });
  add(29, P.ul(bestLines), annualPl, { goals: GOAL_KEYS });

  // ── 31. Difficult Windows ──────────────────────────────────────────────────
  const hardMonths = f.months.filter((m) => m.score <= 0);
  add(30, hardMonths.length
    ? P.block(P.ul(hardMonths.map((m) => t.vpDifficult({
      i: m.index, dates: P.range(m.start, m.end),
      reason: [
        m.ruler && m.ruler.score <= 0 ? `${P.head("ruler")} ${pl(m.ruler.lord)} ${dg(m.ruler.dignity)} (${hName(m.ruler.house)})` : null,
        [6, 8, 12].includes(m.munthaHouse) ? `${P.head("muntha")} ${hName(m.munthaHouse)}` : null,
      ].filter(Boolean).join(" · "),
    }))))
    : t.vpDifficultNone(), annualPl, { months: hardMonths.map((m) => m.index) });

  // ── 32. Muhurat — Auspicious Dates ─────────────────────────────────────────
  const vDow = PLANET_WEEKDAY[f.varshesh.lord];
  const goodMonths = f.months.filter((m) => m.score >= 1);
  const muhuratDates = weekdayDates(f.year.start, f.year.end, vDow)
    .filter((d) => { const m = monthOfDate(f.months, d.getTime()); return m && m.score >= 1; })
    .slice(0, 10);
  add(31, P.block(
    t.vpMuhurat({
      weekday: P.weekday(vDow), planet: pl(f.varshesh.lord),
      dates: muhuratDates.length ? muhuratDates.map((d) => P.fmtDate(d)).join(", ") : P.head("noneFound"),
    }),
    hardMonths.length ? t.vpMuhuratAvoid({
      weekday: P.weekday(vDow), months: hardMonths.map((m) => m.index).join(", "),
    }) : null,
    P.kv([["dates", muhuratDates.map((d) => P.fmtDate(d)).join(", ") || P.head("noneFound")], ["month", goodMonths.map((m) => m.index).join(", ")]]),
  ), annualPl, { dates: muhuratDates.map((d) => d.toISOString()) });

  // ── 33. Remedies for the Year ──────────────────────────────────────────────
  const weakPlanet = f.weakest.planet;
  const remedyTargets = uniq([f.varshesh.lord, weakPlanet, f.muntha.lord]);
  add(32, P.block(
    t.vpRemedies({
      lord: pl(f.varshesh.lord), weak: pl(weakPlanet), weakBala: f.weakest.bala,
    }),
    P.ul(remedyTargets.map((p) => {
      const R = P.remedy(p);
      const S = P.stop;
      return `${pl(p)} — ${R.act}${S} ${P.head("mantra")}: ${R.mantra}${S} ${P.head("daan")}: ${R.daan}${S} ${P.head("fastDay")}: ${R.fast}${S}`;
    })),
  ), annualPl, { targets: remedyTargets });

  // ── 34. Mantra & Japa Schedule ─────────────────────────────────────────────
  add(33, P.ul(remedyTargets.map((p) => {
    const R = P.remedy(p);
    const dow = PLANET_WEEKDAY[p];
    const firstDay = weekdayDates(f.year.start, f.year.end, dow)[0];
    const count = JAPA_COUNT[p];
    return t.vpMantra({
      planet: pl(p), mantra: R.mantra, count,
      startDate: firstDay ? P.fmtDate(firstDay) : P.fmtDate(f.year.start),
      weekday: P.weekday(dow), perWeek: Math.ceil(count / 52),
    });
  })), annualPl, { japa: remedyTargets.map((p) => ({ planet: p, count: JAPA_COUNT[p] })) });

  // ── 35. Daan ───────────────────────────────────────────────────────────────
  add(34, P.ul(remedyTargets.map((p) => {
    const R = P.remedy(p);
    const dow = PLANET_WEEKDAY[p];
    const m = f.months.find((x) => x.ruler && x.ruler.lord === p);
    return m
      ? t.vpDaan({ planet: pl(p), daan: R.daan, weekday: P.weekday(dow), month: m.index, dates: P.range(m.start, m.end) })
      : t.vpDaanNone({ planet: pl(p), daan: R.daan, weekday: P.weekday(dow) });
  })), annualPl);

  // ── 36. Fasting Days ───────────────────────────────────────────────────────
  add(35, P.ul(remedyTargets.map((p) => {
    const dow = PLANET_WEEKDAY[p];
    const all = weekdayDates(f.year.start, f.year.end, dow);
    return t.vpFasting({
      planet: pl(p), weekday: P.weekday(dow), count: all.length,
      first: all.length ? P.fmtDate(all[0]) : P.fmtDate(f.year.start),
    });
  })), annualPl);

  // ── 37. Temple Visits ──────────────────────────────────────────────────────
  add(36, P.ul(remedyTargets.map((p) => {
    const R = P.remedy(p);
    const ms = f.months.filter((x) => x.ruler && x.ruler.lord === p).map((x) => x.index);
    return t.vpTemple({
      planet: pl(p), deity: R.deity,
      months: ms.length ? ms.join(", ") : f.months.filter((x) => x.score >= 1).map((x) => x.index).join(", ") || "—",
      weekday: P.weekday(PLANET_WEEKDAY[p]),
    });
  })), annualPl);

  // ── 38. Comparison With Your Natal Chart ───────────────────────────────────
  const moved = f.comparison.filter((c) => c.natalHouse !== c.annualHouse).length;
  const improved = f.comparison.filter((c) => c.dignityShift > 0).length;
  add(37, P.block(
    t.vpCompare({ moved, improved }),
    P.ul(f.comparison.map((c) => t.vpCompareLine({
      planet: pl(c.planet), natalSign: sg(c.natalSign), natalHouse: c.natalHouse, natalDignity: dg(c.natalDignity),
      annualSign: sg(c.annualSign), annualHouse: c.annualHouse, annualDignity: dg(c.annualDignity),
    }))),
  ), natalPl, { comparison: f.comparison, annualPlacements: annualPl });

  // ── 39. Year-End Outlook ───────────────────────────────────────────────────
  const lastPeriod = f.mudda[f.mudda.length - 1];
  add(38, P.block(
    t.vpYearEnd({
      lord: pl(lastPeriod.lord), from: P.fmtDate(lastPeriod.start), to: P.fmtDate(lastPeriod.end),
      dignity: dg(lastPeriod.dignity), house: lastPeriod.house,
      next: P.fmtDateTime(f.nextYear.start), nextMuntha: sg(f.nextYear.munthaSign),
      nextMunthaHouse: f.nextYear.munthaHouseFromNatal,
    }),
    P.kv([
      ["period", P.range(lastPeriod.start, lastPeriod.end)],
      ["solarReturn", P.fmtDateTime(f.nextYear.start)],
      ["muntha", `${sg(f.nextYear.munthaSign)} · ${P.head("lord")} ${pl(f.nextYear.munthaLord)}`],
      ["age", String(f.nextYear.age)],
    ]),
  ), annualPl, { nextYear: f.nextYear });

  // ── 40. How to Use This Report ─────────────────────────────────────────────
  const keyMonth = f.months.slice().sort((a, b) => b.score - a.score)[0];
  add(39, P.block(
    t.vpHowTo({ keyMonth: keyMonth.index }),
    P.kv([
      ["yearLord", `${pl(f.varshesh.lord)} · §3`],
      ["muntha", `${hName(f.muntha.house)} · §3`],
      ["strongest", `${pl(f.strongest.planet)} · §7`],
      ["weakest", `${pl(f.weakest.planet)} · §7`],
      ["month", `${keyMonth.index} · §${8 + keyMonth.index}`],
    ]),
  ), annualPl);

  return sec;
}
