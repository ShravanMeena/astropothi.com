// ─────────────────────────────────────────────────────────────────────────────
// Monthly Horoscope chapter mapper — turns the computed transit facts into the
// exact 22 chapters published for astro_chart_listing id = 4.
//
// Chart-specific throughout: transits are placed in the native's own houses,
// the week pages are real day tables computed one chart per day, and nothing is
// written by an LLM. All wording comes from the language pack.
// ─────────────────────────────────────────────────────────────────────────────

import { MONTH_AREAS, PLANET_WEEKDAY } from "../astrology/monthly-transit.js";

// Which chapter each life-area page is, in published order.
const AREA_ORDER = ["career", "money", "love", "family", "health", "travel", "education", "property"];

export function buildHoroscopeSections(f, P) {
  const t = P.t;
  const T = P.hsTitles;
  const sec = [];
  const add = (i, body, placements, data) => sec.push({
    n: i + 1, title: T[i], body,
    ...(placements ? { placements } : {}),
    ...(data ? { data } : {}),
  });

  const pl = (p) => P.planet(p);
  const sg = (s) => P.sign(s);
  const dg = (k) => P.dignity(k);
  const natalPl = f.natal.placements;
  const trPl = f.transitPlacements;
  const dayList = (doms) => doms.join(", ");
  // `houseRef` is the in-sentence form; `hName` the standalone table form.
  const hName = (h) => t.houseName(h);

  // ── 1. About This Report ───────────────────────────────────────────────────
  add(0, P.block(
    t.hsAbout({
      month: P.monthName(f.month.index), year: f.month.year,
      lagna: sg(f.natal.lagnaSign), moon: sg(f.natal.moonSign),
      from: P.fmtDate(f.month.start), to: P.fmtDate(f.month.end), days: f.month.days,
    }),
    P.kv([
      ["name", f.subject.name],
      ["birthDetails", `${f.subject.birthDate} · ${f.subject.birthTime}`],
      ["birthPlace", f.subject.birthPlace || "—"],
      ["lagna", sg(f.natal.lagnaSign)],
      ["rashi", sg(f.natal.moonSign)],
      ["nakshatra", P.nakshatra(f.natal.nakshatra)],
    ]),
    `${P.head("method")}: ${t.method("hs")}`,
    t.placementsNote(),
  ), natalPl);

  // ── 2. Month at a Glance ───────────────────────────────────────────────────
  add(1, P.block(
    t.hsGlance({
      sunHouse: f.sunHouse, sunArea: P.houseArea(f.sunHouse),
      ingressCount: f.ingresses.length,
      busiestHouse: f.busiestHouse ? f.busiestHouse.house : f.sunHouse,
      busiestPlanets: f.busiestHouse ? P.planets(f.busiestHouse.planets) : P.planets(["Sun"]),
      maha: pl(f.dasha.maha), antar: pl(f.dasha.antar),
    }),
    P.kv([
      ["yearWindow", P.range(f.month.start, f.month.end)],
      ["sunHouse", `${hName(f.sunHouse)} · ${P.houseArea(f.sunHouse)}`],
      ["ingressCount", String(f.ingresses.length)],
      ["busiestHouse", f.busiestHouse ? `${hName(f.busiestHouse.house)} · ${P.planets(f.busiestHouse.planets)}` : "—"],
      ["luckyDays", dayList(f.lucky.days) || P.head("noneFound")],
      ["dasha", `${pl(f.dasha.maha)} – ${pl(f.dasha.antar)} – ${pl(f.dasha.pratyantar)}`],
    ]),
  ), trPl, { busiestHouse: f.busiestHouse, ingresses: f.ingresses.length });

  // ── 3. Key Transits ────────────────────────────────────────────────────────
  const retroNames = f.transits.filter((x) => x.retrograde).map((x) => x.planet);
  add(2, P.block(
    t.hsTransits({ ingressCount: f.ingresses.length, retro: retroNames.length ? P.planets(retroNames) : "" }),
    P.ul(f.transits.map((x) => t.hsTransitLine({
      planet: pl(x.planet), sign: sg(x.endSign), house: x.house, area: P.houseArea(x.house),
      karaka: P.karaka(x.planet), dignity: dg(x.dignity), retro: x.retrograde,
      // Every crossing is reported, not only the first — a fast planet can
      // change sign twice inside one month.
      ingressText: x.ingresses.map((g) => t.hsIngressClause({
        toSign: sg(g.toSign), date: P.fmtDate(g.date), fromHouse: g.fromHouse, toHouse: g.toHouse,
      })).join(""),
    }))),
  ), trPl, { transits: f.transits, ingresses: f.ingresses });

  // ── 4. Your Chart This Month ───────────────────────────────────────────────
  const overlap = f.transits.filter((x) => {
    const nat = natalPl.find((p) => p.planet === x.planet);
    return nat && nat.house === x.house;
  });
  add(3, P.block(
    t.hsChart({ overlap: overlap.length }),
    P.ul(natalPl.map((p) => {
      const tr = trPl.find((x) => x.planet === p.planet);
      return `${pl(p.planet)} — ${P.head("natal")}: ${sg(p.sign)} ${t.deg(p.degree)}, ${hName(p.house)}, ${dg(p.dignity)} · ${P.head("transit")}: ${tr ? `${sg(tr.sign)}, ${hName(tr.house)}, ${dg(tr.dignity)}${tr.retrograde ? " · R" : ""}` : "—"}`;
    })),
    P.ul(f.natal.houses.map((h) => `${hName(h.house)} — ${sg(h.sign)}, ${P.head("lord")} ${pl(h.lord)}${h.occupants.length ? ` · ${P.planets(h.occupants)}` : ""}`)),
  ), natalPl, { transitPlacements: trPl, houses: f.natal.houses });

  // ── 5–8. Week 1 … Week 4 ───────────────────────────────────────────────────
  f.weeks.forEach((w, idx) => {
    const good = w.days.filter((d) => d.chandraBala === "good").map((d) => d.dom);
    const hard = w.days.filter((d) => d.chandraBala === "chandrashtama" || d.chandraBala === "weak").map((d) => d.dom);
    const ing = w.days.flatMap((d) => d.ingressPlanets.map((p) => `${d.dom} — ${pl(p)}`));
    add(4 + idx, P.block(
      t.hsWeek({
        from: P.fmtDate(w.days[0].date), to: P.fmtDate(w.days[w.days.length - 1].date),
        good: dayList(good), hard: dayList(hard),
        ingress: ing.length ? `${P.head("ingress")}: ${ing.join(", ")}.` : "",
      }),
      P.ul(w.days.map((d) => t.hsDayRow({
        dom: String(d.dom).padStart(2, "0"), weekday: P.weekdayShort(d.weekday),
        moonSign: sg(d.moonSign), moonHouse: d.moonHouse,
        tithi: P.tithi(d.tithiNumber),
        chandra: P.chandra(d.chandraBala),
        ingress: d.ingressPlanets.length ? `${P.head("ingress")}: ${P.planets(d.ingressPlanets)}` : "",
      }))),
      P.kv([
        ["weekOf", `${w.days.length}`],
        ["best", dayList(good) || P.head("noneFound")],
        ["caution", dayList(hard) || P.head("noneFound")],
      ]),
    ), trPl, { week: w.index, days: w.days.map((d) => ({ iso: d.iso, moonSign: d.moonSign, moonHouse: d.moonHouse, chandraBala: d.chandraBala, tithi: d.tithi })) });
  });

  // ── 9–16. Life areas ───────────────────────────────────────────────────────
  AREA_ORDER.forEach((key, i) => {
    const spec = MONTH_AREAS.find((s) => s.key === key);
    const a = f.areas[key];
    const hits = a.hits.length
      ? a.hits.map((h) => `${pl(h.planet)} (${hName(h.house)}${h.retrograde ? ", R" : ""})`).join(", ")
      : P.head("noTransit");
    add(8 + i, P.block(
      t.hsArea({
        area: P.areaName(key),
        houses: spec.houses.map((h) => t.houseRef(h)).join(" + "),
        verdict: P.verdict(a.verdict),
        hits,
        karakaLine: a.karaka
          ? t.hsAreaKaraka({ karaka: pl(spec.karaka), house: a.karaka.house, retro: a.karaka.retrograde })
          : "",
      }),
      P.ul(a.lords.map((L) => t.hsAreaLord({
        house: L.house, sign: sg(L.sign), lord: pl(L.lord),
        natalHouse: L.natalHouse, transitHouse: L.transitHouse, retro: L.retrograde,
      }))),
      a.ingresses.length
        ? P.ul(a.ingresses.map((g) => `${P.fmtDate(g.date)} — ${pl(g.planet)} → ${sg(g.toSign)}, ${hName(g.toHouse)}`))
        : null,
      t.hsAreaDays({ days: dayList(a.bestDays) }),
      P.ul(P.areaGuide(key)),
    ), trPl, { houses: spec.houses, lords: a.lords, verdict: a.verdict, bestDays: a.bestDays });
  });

  // ── 17. Lucky Days, Colours & Numbers ──────────────────────────────────────
  add(16, P.block(
    t.hsLucky({ lagnaLord: pl(f.lucky.lagnaLord), moonLord: pl(f.lucky.moonLord) }),
    P.kv([
      ["luckyDays", dayList(f.lucky.days) || P.head("noneFound")],
      ["weekday", f.lucky.weekdays.map((d) => P.weekday(d)).join(", ")],
      ["colours", f.lucky.colours.map((c) => P.colour(c)).join(", ")],
      ["numbers", f.lucky.numbers.join(", ")],
    ]),
    f.lucky.bestDays.length
      ? t.hsLuckyBest({ days: dayList(f.lucky.bestDays), weekdays: f.lucky.weekdays.map((d) => P.weekday(d)).join(", ") })
      : null,
  ), trPl, { lucky: f.lucky });

  // ── 18. Dasha Context ──────────────────────────────────────────────────────
  add(17, P.block(
    t.hsDasha({
      maha: pl(f.dasha.maha), antar: pl(f.dasha.antar), praty: pl(f.dasha.pratyantar),
      window: !!f.dasha.window, from: f.dasha.window?.start, to: f.dasha.window?.end,
    }),
    P.ul(f.dasha.lords.map((L) => t.hsDashaLord({
      lord: pl(L.lord), natalHouse: L.natalHouse, natalSign: sg(L.natalSign),
      natalDignity: dg(L.natalDignity), transitHouse: L.transitHouse,
    }))),
    f.dasha.upcoming.length
      ? P.ul(f.dasha.upcoming.map((w) => `${w.start} – ${w.end} · ${pl(w.maha)} / ${pl(w.antar)}`))
      : null,
  ), natalPl, { dasha: f.dasha });

  // ── 19. Moon Phases & Your Mood ────────────────────────────────────────────
  const nm = f.phases.find((p) => p.type === "new");
  const fm = f.phases.find((p) => p.type === "full");
  add(18, P.block(
    f.phases.length
      ? t.hsPhases({
        newMoon: nm ? P.fmtDate(nm.date) : "", newSign: nm ? sg(nm.moonSign) : "", newHouse: nm?.house,
        fullMoon: fm ? P.fmtDate(fm.date) : "", fullSign: fm ? sg(fm.moonSign) : "", fullHouse: fm?.house,
      })
      : t.hsPhasesNone(),
    P.ul(f.days.filter((d) => d.tithiNumber === 15 || d.tithiNumber === 30 || d.chandraBala === "good").slice(0, 12).map((d) =>
      `${String(d.dom).padStart(2, "0")} ${P.weekdayShort(d.weekday)} — ${sg(d.moonSign)}, ${hName(d.moonHouse)} · ${P.chandra(d.chandraBala)}`)),
    P.kv([
      ["newMoon", nm ? `${P.fmtDate(nm.date)} · ${sg(nm.moonSign)} · ${hName(nm.house)}` : P.head("noneFound")],
      ["fullMoon", fm ? `${P.fmtDate(fm.date)} · ${sg(fm.moonSign)} · ${hName(fm.house)}` : P.head("noneFound")],
    ]),
  ), trPl, { phases: f.phases });

  // ── 20. Cautions & Avoidances ──────────────────────────────────────────────
  add(19, P.block(
    t.hsCautions({
      chandrashtama: f.cautions.chandrashtama.length ? dayList(f.cautions.chandrashtama) : [],
      weak: f.cautions.weak.length ? dayList(f.cautions.weak) : [],
    }),
    f.cautions.maleficHouses.length
      ? P.ul(f.cautions.maleficHouses.map((m) => t.hsCautionMalefic({ planet: pl(m.planet), house: m.house, area: P.houseArea(m.house) })))
      : null,
    f.cautions.retrograde.length
      ? P.ul(f.cautions.retrograde.map((r) => `${pl(r.planet)} — ${hName(r.house)} · ${r.days} ${P.head("dayUnit")}`))
      : null,
  ), trPl, { cautions: f.cautions });

  // ── 21. Remedies for the Month ─────────────────────────────────────────────
  const worstMalefic = f.cautions.maleficHouses.slice().sort((a, b) =>
    (a.dignity === "debilitated" ? -1 : 0) - (b.dignity === "debilitated" ? -1 : 0))[0];
  const target = worstMalefic ? worstMalefic.planet
    : f.cautions.retrograde.length ? f.cautions.retrograde[0].planet
    : f.dasha.antar;
  const targetHouse = worstMalefic ? worstMalefic.house
    : f.cautions.retrograde.length ? f.cautions.retrograde[0].house
    : (f.dasha.lords.find((L) => L.lord === target)?.transitHouse ?? f.sunHouse);
  const R = P.remedy(target);
  add(20, P.block(
    t.hsRemedy({
      planet: pl(target),
      reason: t.hsCautionMalefic({ planet: pl(target), house: targetHouse, area: P.houseArea(targetHouse) }),
      act: R.act, mantra: R.mantra, weekday: P.weekday(PLANET_WEEKDAY[target]), daan: R.daan,
    }),
    P.kv([
      ["mantra", R.mantra],
      ["daan", R.daan],
      ["deity", R.deity],
      ["fastDay", R.fast],
      ["best", dayList(f.lucky.bestDays) || dayList(f.lucky.days) || P.head("noneFound")],
    ]),
  ), trPl, { remedyPlanet: target, house: targetHouse });

  // ── 22. Next Month — Early Outlook ─────────────────────────────────────────
  const changed = f.nextMonth.transits.filter((x) => x.changed);
  add(21, P.block(
    t.hsNext({
      month: P.monthName(f.nextMonth.index),
      transits: f.nextMonth.transits.slice(0, 4).map((x) => `${pl(x.planet)} ${sg(x.sign)} (${hName(x.house)})`).join(", "),
      days: f.nextMonth.days,
      ingresses: f.nextMonth.ingresses.map((g) => `${P.fmtDate(g.date)} ${pl(g.planet)} → ${sg(g.toSign)}, ${hName(g.toHouse)}`).join("; "),
    }),
    changed.length
      ? P.ul(changed.map((x) => `${pl(x.planet)} — ${sg(x.sign)}, ${hName(x.house)} → ${sg(x.laterSign)}, ${hName(x.laterHouse)}`))
      : null,
    t.hsNextNote(),
  ), trPl, { nextMonth: f.nextMonth });

  return sec;
}
