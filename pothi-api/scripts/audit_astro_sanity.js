#!/usr/bin/env node
// Astrological sanity: things that are TRUE for every chart ever cast.
//
// A pandit checks the lagna, the planet degrees and the dasha dates against his
// own software within the first minute. These are the invariants that, if
// broken, he spots instantly and never comes back.

import { buildCalculatedKundliData } from "../engine/astrology/normalize-kundli-data.js";

const CHARTS = [
  ["1992-03-17","09:42",25.3176,82.9739,"Varanasi"],
  ["1978-11-02","23:05", 9.9312,76.2673,"Kochi"],
  ["1965-06-28","04:15",28.6139,77.2090,"Delhi"],
  ["2001-01-09","17:50",22.5726,88.3639,"Kolkata"],
  ["1986-09-21","12:00",13.0827,80.2707,"Chennai"],
  ["1958-04-03","06:55",31.6340,74.8723,"Amritsar"],
  ["2024-02-29","00:05",19.0760,72.8777,"Mumbai"],   // leap day, just past midnight
  ["1999-12-31","23:59",26.9124,75.7873,"Jaipur"]    // year boundary
];

const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
               "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
// Vimshottari: the nine mahadashas must total 120 years.
const VIM = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };

const d0 = (d) => d.toISOString().slice(0, 10);
let fail = 0, checks = 0;
const bad = (chart, msg) => { console.log(`  ✗ [${chart}] ${msg}`); fail++; };
const ok = () => { checks++; };

for (const [dob, tob, lat, lon, place] of CHARTS) {
  const tag = `${place} ${dob}`;
  let k;
  try {
    k = buildCalculatedKundliData({ fullName: "T", gender: "male", birthDate: dob,
      birthTime: tob, timezone: "Asia/Kolkata", latitude: lat, longitude: lon });
  } catch (e) { bad(tag, `threw: ${e.message}`); continue; }

  const planets = k.planets || [];

  // 1. Sun and Moon are never retrograde. Ever.
  for (const p of planets) {
    if ((p.name === "Sun" || p.name === "Moon") && p.retrograde) bad(tag, `${p.name} marked retrograde`);
    else ok();
  }
  // 2. Rahu and Ketu are always retrograde (mean node), and always 180° apart.
  const ra = planets.find((p) => p.name === "Rahu"), ke = planets.find((p) => p.name === "Ketu");
  if (ra && ke) {
    // The field is `longitude` (0–360 sidereal); `degree` is within-sign.
    const d = ((ra.longitude - ke.longitude) % 360 + 360) % 360;
    if (Math.abs(d - 180) > 0.5) bad(tag, `Rahu–Ketu axis is ${d.toFixed(2)}°, not 180°`); else ok();
    if (!ra.retrograde || !ke.retrograde) bad(tag, "nodes should be retrograde (mean node)"); else ok();
    if (ra.sign === ke.sign) bad(tag, "Rahu and Ketu in the same sign"); else ok();
  }
  // 3. Every planet sits in a real sign and a house 1..12.
  for (const p of planets) {
    if (!SIGNS.includes(p.sign)) bad(tag, `${p.name} in unknown sign "${p.sign}"`); else ok();
    if (!(p.house >= 1 && p.house <= 12)) bad(tag, `${p.name} in house ${p.house}`); else ok();
    const deg = Number(p.degree);
    if (!(deg >= 0 && deg < 30)) bad(tag, `${p.name} degree ${deg} outside 0–30`); else ok();
  }
  // 4. Twelve houses, twelve distinct signs, in zodiacal order from the lagna.
  const houses = k.houses || [];
  if (houses.length !== 12) bad(tag, `${houses.length} houses, expected 12`);
  else {
    ok();
    if (new Set(houses.map((h) => h.sign)).size !== 12) bad(tag, "houses do not span 12 distinct signs"); else ok();
    const first = SIGNS.indexOf(houses[0].sign);
    const ordered = houses.every((h, i) => SIGNS.indexOf(h.sign) === (first + i) % 12);
    if (!ordered) bad(tag, "house signs not in zodiacal order (whole-sign)"); else ok();
    if (k.ascendant?.sign && houses[0].sign !== k.ascendant.sign)
      bad(tag, `house 1 is ${houses[0].sign} but ascendant says ${k.ascendant.sign}`); else ok();
  }
  // 5. Vimshottari mahadashas total 120 years and run in the classical order.
  const md = k.dashas?.vimshottariTimeline || [];
  if (Array.isArray(md) && md.length) {
    // Shape is { mahaDasha, start, end } with dates as "01 May 1986".
    const yrs = md.reduce((a, d) => a + (VIM[d.mahaDasha] ?? 0), 0);
    if (md.length !== 9) bad(tag, `${md.length} mahadashas, expected 9`); else ok();
    if (md.length === 9 && Math.abs(yrs - 120) > 0.01) bad(tag, `mahadashas total ${yrs} years, not 120`); else ok();
    if (new Set(md.map((d) => d.mahaDasha)).size !== md.length) bad(tag, "a mahadasha lord repeats"); else ok();
    // Each period's span must match its classical length, within a day.
    for (const d of md) {
      const a = new Date(d.start), b = new Date(d.end);
      if (isNaN(a) || isNaN(b)) { bad(tag, `unparseable dasha dates ${d.start}–${d.end}`); continue; }
      const years = (b - a) / (365.2425 * 864e5);
      const want = VIM[d.mahaDasha];
      if (want && Math.abs(years - want) > 0.02)
        bad(tag, `${d.mahaDasha} dasha runs ${years.toFixed(2)}y, classical is ${want}y`); else ok();
    }
    const dates = md.map((d) => new Date(d.start)).filter((d) => !isNaN(d));
    const sorted = dates.every((d, i) => i === 0 || d >= dates[i - 1]);
    if (dates.length && !sorted) bad(tag, "dasha periods are not chronological"); else ok();
    // The 120-year cycle must straddle the birth date.
    const born = new Date(`${dob}T00:00:00+05:30`);
    const last = new Date(md[md.length - 1].end);
    if (dates[0] && last && !(dates[0] <= born && born <= last))
      bad(tag, `birth ${dob} falls outside the dasha cycle ${d0(dates[0])}–${d0(last)}`); else ok();
  }
  // 6. Ashtakavarga: the sarvashtakavarga always totals 337 bindus.
  if (k.ashtakavarga?.total != null) {
    if (k.ashtakavarga.total !== 337) bad(tag, `SAV total is ${k.ashtakavarga.total}, not 337`); else ok();
    const sum = Object.values(k.ashtakavarga.savBySign || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    if (sum !== 337) bad(tag, `savBySign sums to ${sum}, not 337`); else ok();
  }
  // 7. Panchang basics inside range.
  const t = k.panchang?.tithiNumber;
  if (t != null && !(t >= 1 && t <= 30)) bad(tag, `tithi number ${t} outside 1–30`); else ok();
}

console.log(`\n  ${checks} invariants held, ${fail} broken across ${CHARTS.length} charts`);
process.exit(fail ? 1 : 0);
