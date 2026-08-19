import * as Astronomy from "astronomy-engine";

import {
  SIGNS, NAKSHATRAS, VARNA_MAP, VASHYA_MAP, GANA_MAP,
  NADI_MAP, YONI_MAP, TATVA_MAP, GHAT_CHAKRA_MAP,
  PAYA_MAP, NAME_ALPHABET_TABLE, yunjaFromNakshatraIndex,
  SignLords, DashaOrder, DashaYears, YOGAS, KARANAS
} from "./astro-constants.js";
import { detectDoshas, doshasFromEntries } from "./detect-doshas.js";
import { computeAshtakavarga } from "./ashtakavarga.js";
import { vargaSign as classicalVargaSign } from "./varga.js";

const NAKSHATRA_SIZE = 360 / 27;
const PADA_SIZE = NAKSHATRA_SIZE / 4;

function normalizeAngle(value) {
  return ((value % 360) + 360) % 360;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

function signIndexFromLongitude(longitude) {
  return Math.floor(normalizeAngle(longitude) / 30);
}

function signFromLongitude(longitude) {
  return SIGNS[signIndexFromLongitude(longitude)];
}

function degreeInSign(longitude) {
  return normalizeAngle(longitude) % 30;
}

function nakshatraIndex(longitude) {
  return Math.floor(normalizeAngle(longitude) / NAKSHATRA_SIZE);
}

function nakshatraFromLongitude(longitude) {
  return NAKSHATRAS[nakshatraIndex(longitude)];
}

function nakshatraPadaFromLongitude(longitude) {
  return Math.floor((normalizeAngle(longitude) % NAKSHATRA_SIZE) / PADA_SIZE) + 1;
}

function getOffsetMinutes(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset"
  });

  const timeZonePart = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "GMT+0";
  const match = timeZonePart.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);

  if (!match) return 0;

  const hours = Number(match[1]);
  const minutes = Number(match[2] || "0");
  return hours * 60 + Math.sign(hours || 1) * minutes;
}

function toUtcDate(input) {
  const [year, month, day] = input.birthDate.split("-").map(Number);
  const [hour, minute] = input.birthTime.split(":").map(Number);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = getOffsetMinutes(new Date(naiveUtc), input.timezone);
  return new Date(naiveUtc - offsetMinutes * 60 * 1000);
}

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function ayanamsha(daysSinceJ2000) {
  // Lahiri (Chitrapaksha) ayanamsha via Swiss-Ephemeris anchor + IAU 2006 general
  // precession in ecliptic longitude. Anchor: 23°51'11" at J2000.0.
  // Precession series (arcsec → deg per Julian century): 5028.796195, 1.1054348, 0.00007964.
  const T = daysSinceJ2000 / 36525;
  return 23.85306 + 1.396888 * T + 0.000307 * T * T + 2.2e-8 * T * T * T;
}

function eclipticLongitudeOf(body, date) {
  const vec = Astronomy.GeoVector(body, date, true);
  return normalizeAngle(Astronomy.Ecliptic(vec).elon);
}

function tropicalPlanetLongitudes(date, daysSinceJ2000) {
  return {
    Sun:     eclipticLongitudeOf(Astronomy.Body.Sun,     date),
    Moon:    normalizeAngle(Astronomy.EclipticGeoMoon(date).lon),
    Mars:    eclipticLongitudeOf(Astronomy.Body.Mars,    date),
    Mercury: eclipticLongitudeOf(Astronomy.Body.Mercury, date),
    Jupiter: eclipticLongitudeOf(Astronomy.Body.Jupiter, date),
    Venus:   eclipticLongitudeOf(Astronomy.Body.Venus,   date),
    Saturn:  eclipticLongitudeOf(Astronomy.Body.Saturn,  date),
    // Mean lunar ascending node (Rahu) — classical Vedic convention uses mean node, not true node.
    Rahu:    normalizeAngle(125.04452 - 0.0529538083 * daysSinceJ2000)
  };
}

function isPlanetRetrograde(body, date) {
  const t0 = eclipticLongitudeOf(body, date);
  const tomorrow = new Date(date.getTime() + 86_400_000);
  const t1 = eclipticLongitudeOf(body, tomorrow);
  let diff = t1 - t0;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

function ascendantLongitude(date, daysSinceJ2000, latitude, longitude) {
  const gmstHours = Astronomy.SiderealTime(date);
  const lst = normalizeAngle(gmstHours * 15 + longitude);
  const epsilon = 23.4392911 - daysSinceJ2000 * (46.8150 / (3600 * 36525));
  const phi = toRadians(latitude);
  const lstRad = toRadians(lst);
  const epsRad = toRadians(epsilon);

  // Meeus, Astronomical Algorithms, eq. 13.6:
  //   tan(λ_asc) = -cos(θ) / (sin(ε)·tan(φ) + cos(ε)·sin(θ))
  // The bare atan2 returns the value in (-π, π], which mathematically
  // satisfies tan(λ)=... but is 180° off from the actual Ascendant
  // (it gives the Descendant instead). The Ascendant must lie within
  // 180° ahead of the MC in zodiacal order, so we compute the MC and
  // shift by 180° when the raw value falls in the wrong half.
  const ascRaw = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(phi) * Math.sin(epsRad)
  );
  const mc = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad));
  const ascDeg = normalizeAngle(toDegrees(ascRaw));
  const mcDeg  = normalizeAngle(toDegrees(mc));
  // The Ascendant is the point of the ecliptic 0° < (asc - MC) ≤ 180°
  // ahead of the MC. If our raw atan2 fell on the wrong side, add 180°.
  const delta = normalizeAngle(ascDeg - mcDeg);
  return delta > 180 ? normalizeAngle(ascDeg + 180) : ascDeg;
}

function houseFromAscendant(planetLongitude, ascLongitude) {
  // Whole Sign Houses (the system our calculationMeta declares): a planet's
  // house is simply the sign-distance from the Lagna sign, not its degree-
  // distance from the Lagna degree. House 1 = the sign of the Lagna,
  // House 2 = the next sign, … regardless of the Lagna's degree within its
  // sign. Equal-Houses (the previous degree-based formula) is a different
  // system and gave off-by-one house numbers whenever a planet sat in the
  // same sign as the Lagna but at a lower degree.
  const planetSign = Math.floor(normalizeAngle(planetLongitude) / 30);
  const ascSign    = Math.floor(normalizeAngle(ascLongitude) / 30);
  return ((planetSign - ascSign + 12) % 12) + 1;
}

// Classical Parashari rules live in one place; see the note in varga.js for
// what the old uniform formula got wrong.
const vargaSign = (longitude, divisionalFactor) => classicalVargaSign(longitude, divisionalFactor);

function chartFromSignMapping(planets, divisor) {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const sign = SIGNS[index];
      const occupants = planets.filter((planet) => vargaSign(planet.longitude, divisor) === sign).map((planet) => planet.name);
      return [(index + 1).toString(), occupants.length ? occupants : ["-"]];
    })
  );
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShortDate(date) {
  return `${String(date.getUTCDate()).padStart(2, "0")} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function addYears(date, years) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + Math.round(years * 365.2425));
  return next;
}

function buildVimshottariTimeline(moonLongitude, birthDate) {
  const moonNakshatra = nakshatraIndex(moonLongitude);
  const currentLord = DashaOrder[moonNakshatra % DashaOrder.length];
  const portionElapsed = (normalizeAngle(moonLongitude) % NAKSHATRA_SIZE) / NAKSHATRA_SIZE;
  const elapsedYears = DashaYears[currentLord] * portionElapsed;
  let cursor = addYears(birthDate, -elapsedYears);

  return Array.from({ length: DashaOrder.length }, (_, index) => {
    const mahaDasha = DashaOrder[(moonNakshatra + index) % DashaOrder.length];
    const startDate = new Date(cursor.getTime());
    const endDate = addYears(startDate, DashaYears[mahaDasha]);
    cursor = endDate;
    return {
      mahaDasha,
      start: formatShortDate(startDate),
      end: formatShortDate(endDate),
      startDate,
      endDate
    };
  });
}

// Expand the Vimshottari timeline into dated maha→antar sub-periods. The chart
// snapshot only exposes whole mahadashas plus the *currently* running antar, so
// nothing downstream could answer "when" questions ("shaadi kab hogi") with a
// real date range. Same arithmetic as currentAntarAndPratyantar below, just
// enumerated instead of collapsed to the active period.
export function buildDashaWindows({ moonLongitude, birthUtc, fromDate = new Date(), years = 20, lookbackYears = 0 }) {
  const now = fromDate.getTime();
  // Periods that have already been running matter as much as coming ones: they
  // are what the native has actually been living through, and are what lets a
  // reading say "this has been your situation since <date>".
  const from = lookbackYears ? addYears(fromDate, -lookbackYears).getTime() : now;
  const horizon = addYears(fromDate, years).getTime();
  const windows = [];

  for (const maha of buildVimshottariTimeline(moonLongitude, birthUtc)) {
    if (maha.endDate.getTime() < from || maha.startDate.getTime() > horizon) continue;

    const total = maha.endDate.getTime() - maha.startDate.getTime();
    const startIndex = DashaOrder.indexOf(maha.mahaDasha);
    let cursor = maha.startDate.getTime();

    for (let index = 0; index < DashaOrder.length; index += 1) {
      const antar = DashaOrder[(startIndex + index) % DashaOrder.length];
      const next = cursor + (total * DashaYears[antar]) / 120;
      // Keep a period if any part of it still lies ahead of `fromDate`.
      if (next >= from && cursor <= horizon) {
        windows.push({
          maha: maha.mahaDasha,
          antar,
          start: formatShortDate(new Date(cursor)),
          end: formatShortDate(new Date(next)),
          startMs: cursor,
          endMs: next,
          active: now >= cursor && now < next,
          past: next <= now
        });
      }
      cursor = next;
    }
  }

  return windows.sort((a, b) => a.startMs - b.startMs);
}

// Narrow dated windows down to the ones ruled by planets that actually matter
// for a question. `planetRoles` maps planet → why it matters, e.g.
// { Venus: "7th lord", Jupiter: "karaka of marriage" } — the reason is carried
// through so the narrator can cite it instead of inventing one.
export function activatingWindows(windows, planetRoles = {}, { limit = 6 } = {}) {
  const roleFor = (planet) => planetRoles[planet];

  const scored = [];
  for (const w of windows) {
    const mahaRole = roleFor(w.maha);
    const antarRole = roleFor(w.antar);
    if (!mahaRole && !antarRole) continue;

    // Rank by how specifically the period is ruled by a relevant planet. Without
    // this, a 20-year mahadasha run by a topic planet floods the list with its
    // own sub-periods and crowds out the sharper windows further out.
    const strength = mahaRole && antarRole ? 3 : antarRole ? 2 : 1;

    const why = w.maha === w.antar
      ? `${w.maha} (${mahaRole || antarRole}) mahadasha and antardasha together`
      : [
          mahaRole && `${w.maha} (${mahaRole}) mahadasha`,
          antarRole && `${w.antar} (${antarRole}) antardasha`
        ].filter(Boolean).join(" + ");

    // An already-running period is what the devotee is living through, so it
    // always earns its place regardless of how specific it is.
    scored.push({ ...w, why, _rank: w.active ? 4 : strength });
  }

  return scored
    .sort((a, b) => b._rank - a._rank || a.startMs - b.startMs)
    .slice(0, limit)
    .sort((a, b) => a.startMs - b.startMs)
    .map(({ _rank, ...w }) => w);
}

export function pratyantarWithinAntar(antarLord, antarStartMs, antarEndMs) {
  const total = antarEndMs - antarStartMs;
  const now = Date.now();
  const startIndex = DashaOrder.indexOf(antarLord);
  if (startIndex < 0 || total <= 0) return antarLord;
  let cursor = antarStartMs;
  for (let index = 0; index < DashaOrder.length; index += 1) {
    const lord = DashaOrder[(startIndex + index) % DashaOrder.length];
    const segment = (total * DashaYears[lord]) / 120;
    const next = cursor + segment;
    if (now >= cursor && now < next) return lord;
    cursor = next;
  }
  return antarLord;
}

function currentAntarAndPratyantar(mahaLord, mahaStart, mahaEnd) {
  const total = mahaEnd.getTime() - mahaStart.getTime();
  const now = Date.now();
  const startIndex = DashaOrder.indexOf(mahaLord);
  let cursor = mahaStart.getTime();
  for (let index = 0; index < DashaOrder.length; index += 1) {
    const antarLord = DashaOrder[(startIndex + index) % DashaOrder.length];
    const segment = (total * DashaYears[antarLord]) / 120;
    const next = cursor + segment;
    if (now >= cursor && now < next) {
      return {
        antar: antarLord,
        pratyantar: pratyantarWithinAntar(antarLord, cursor, next)
      };
    }
    cursor = next;
  }
  return { antar: mahaLord, pratyantar: mahaLord };
}

export function computeSunriseSunset(date, latitude, longitude, timezone) {
  try {
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    // Anchor the search to the start of the local day so we get the rise/set that contains `date`.
    const localDayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, localDayStart, 2);
    const set  = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, localDayStart, 2);
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: true });
    return {
      sunrise: rise ? fmt.format(rise.date) : "—",
      sunset:  set  ? fmt.format(set.date)  : "—"
    };
  } catch {
    return { sunrise: "—", sunset: "—" };
  }
}

function numerologyFromInput(input) {
  const birthDigits = input.birthDate.replace(/\D/g, "").split("").map(Number);
  let lifePath = birthDigits.reduce((sum, digit) => sum + digit, 0);
  while (lifePath > 9 && ![11, 22].includes(lifePath)) {
    lifePath = String(lifePath).split("").reduce((sum, d) => sum + Number(d), 0);
  }

  const nameValue = input.fullName.toUpperCase().replace(/[^A-Z]/g, "").split("").reduce((sum, char) => sum + (char.charCodeAt(0) - 64), 0);
  let destinyNumber = nameValue;
  while (destinyNumber > 9 && ![11, 22].includes(destinyNumber)) {
    destinyNumber = String(destinyNumber).split("").reduce((sum, d) => sum + Number(d), 0);
  }

  return {
    lifePathNumber: lifePath,
    destinyNumber,
    luckyColor: ["Gold", "Saffron", "Sky Blue", "White", "Emerald", "Maroon"][(lifePath + destinyNumber) % 6],
    luckyDay: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][destinyNumber % 7]
  };
}

function allPlanetsWithinArc(longitudes, start, end) {
  if (start <= end) return longitudes.every(l => l >= start && l <= end);
  return longitudes.every(l => l >= start || l <= end);
}

function getPlanetIntensity(name, sign) {
  const exaltation = { Sun: "Aries", Moon: "Taurus", Mars: "Capricorn", Mercury: "Virgo", Jupiter: "Cancer", Venus: "Pisces", Saturn: "Libra", Rahu: "Taurus", Ketu: "Scorpio" };
  const debilitation = { Sun: "Libra", Moon: "Scorpio", Mars: "Cancer", Mercury: "Pisces", Jupiter: "Capricorn", Venus: "Virgo", Saturn: "Aries", Rahu: "Scorpio", Ketu: "Taurus" };

  if (exaltation[name] === sign) return "Highly Favorable";
  if (debilitation[name] === sign) return "Unfavorable";
  if (SignLords[sign] === name) return "Favorable";
  return "Neutral";
}

// Karana from Sun–Moon elongation. There are 60 karanas in a lunar month
// (one per 6°): the 1st is the fixed Kimstughna, then the 7 movable karanas
// repeat 8 times (covering karanas 2–57), then the 3 fixed karanas Shakuni,
// Chatushpada, Naga. The previous `KARANAS[k % 11]` was wrong (it cycled all
// 11 names every 11 karanas).
function computeKarana(moonSunAngle) {
  const k = Math.floor(normalizeAngle(moonSunAngle) / 6); // 0..59
  if (k === 0) return "Kimstughna";
  if (k >= 57) return ["Shakuni", "Chatushpada", "Naga"][k - 57];
  const movable = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"];
  return movable[(k - 1) % 7];
}

export function buildCalculatedKundliData(input) {
  const birthUtc = toUtcDate(input);
  const jd = julianDay(birthUtc);
  const daysSinceJ2000 = jd - 2451545.0;
  const ayan = ayanamsha(daysSinceJ2000);
  const tropical = tropicalPlanetLongitudes(birthUtc, daysSinceJ2000);
  const ascTropical = ascendantLongitude(birthUtc, daysSinceJ2000, input.latitude, input.longitude);
  const ascSidereal = normalizeAngle(ascTropical - ayan);
  const ascSign = signFromLongitude(ascSidereal);

  const longitudes = {
    Sun: normalizeAngle(tropical.Sun - ayan),
    Moon: normalizeAngle(tropical.Moon - ayan),
    Mars: normalizeAngle(tropical.Mars - ayan),
    Mercury: normalizeAngle(tropical.Mercury - ayan),
    Jupiter: normalizeAngle(tropical.Jupiter - ayan),
    Venus: normalizeAngle(tropical.Venus - ayan),
    Saturn: normalizeAngle(tropical.Saturn - ayan),
    Rahu: normalizeAngle(tropical.Rahu - ayan),
    Ketu: normalizeAngle(tropical.Rahu + 180 - ayan)
  };

  const retrogradeFlags = {
    Sun: false, Moon: false, Rahu: true, Ketu: true,
    Mars:    isPlanetRetrograde(Astronomy.Body.Mars,    birthUtc),
    Mercury: isPlanetRetrograde(Astronomy.Body.Mercury, birthUtc),
    Jupiter: isPlanetRetrograde(Astronomy.Body.Jupiter, birthUtc),
    Venus:   isPlanetRetrograde(Astronomy.Body.Venus,   birthUtc),
    Saturn:  isPlanetRetrograde(Astronomy.Body.Saturn,  birthUtc)
  };

  const planets = (Object.keys(longitudes)).map((name) => {
    const lon = longitudes[name];
    const s = signFromLongitude(lon);
    return {
      name,
      longitude: lon,
      sign: s,
      house: houseFromAscendant(lon, ascSidereal),
      degree: degreeInSign(lon),
      nakshatra: nakshatraFromLongitude(lon),
      pada: nakshatraPadaFromLongitude(lon),
      retrograde: retrogradeFlags[name],
      signLord: SignLords[s],
      nakshatraLord: DashaOrder[nakshatraIndex(lon) % 9],
      intensity: getPlanetIntensity(name, s)
    };
  });

  const houses = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const cuspStart = normalizeAngle(ascSidereal + index * 30);
    const sign = signFromLongitude(cuspStart);
    const occupants = planets.filter((p) => p.house === house).map((p) => p.name);
    return { house, sign, cuspStart, cuspMiddle: normalizeAngle(cuspStart + 15), cuspEnd: normalizeAngle(cuspStart + 30), lord: SignLords[sign], occupants, strength: (occupants.length > 1 ? "high" : occupants.length === 1 ? "medium" : "low") };
  });

  const moonLong = longitudes.Moon;
  const moonSign = signFromLongitude(moonLong);
  const moonNak = nakshatraFromLongitude(moonLong);
  const moonSunAngle = normalizeAngle(moonLong - longitudes.Sun);
  const tithiNum = Math.floor(moonSunAngle / 12) + 1;
  const paksha = tithiNum <= 15 ? "Shukla Paksha" : "Krishna Paksha";

  const vimshottariTimeline = buildVimshottariTimeline(moonLong, birthUtc);
  const activeMaha = vimshottariTimeline.find((i) => Date.now() >= i.startDate.getTime() && Date.now() < i.endDate.getTime()) || vimshottariTimeline[0];
  const currentMahaDasha = activeMaha.mahaDasha;
  const { antar: currentAntarDasha, pratyantar: currentPratyantarDasha } =
    currentAntarAndPratyantar(activeMaha.mahaDasha, activeMaha.startDate, activeMaha.endDate);
  const { sunrise: computedSunrise, sunset: computedSunset } = computeSunriseSunset(birthUtc, input.latitude, input.longitude, input.timezone);

  const transitDate = new Date();
  const transitDays = julianDay(transitDate) - 2451545.0;
  const transitTropical = tropicalPlanetLongitudes(transitDate, transitDays);
  const trAyan = ayanamsha(transitDays);
  const transitSnapshot = {
    moonSign: signFromLongitude(normalizeAngle(transitTropical.Moon - trAyan)),
    saturnSign: signFromLongitude(normalizeAngle(transitTropical.Saturn - trAyan)),
    jupiterSign: signFromLongitude(normalizeAngle(transitTropical.Jupiter - trAyan)),
    rahuSign: signFromLongitude(normalizeAngle(transitTropical.Rahu - trAyan)),
    ketuSign: signFromLongitude(normalizeAngle(transitTropical.Rahu + 180 - trAyan))
  };

  const ascendantInfo = { sign: ascSign, degree: degreeInSign(ascSidereal), longitude: ascSidereal };
  const doshaEntries = detectDoshas({
    planets,
    houses,
    ascendant: ascendantInfo,
    transitSnapshot
  });
  const doshas = doshasFromEntries(doshaEntries);

  const ascSignIdx = signIndexFromLongitude(ascSidereal);
  const ashtakavarga = computeAshtakavarga({
    ascendantSignIndex: ascSignIdx,
    signIndexByContributor: {
      Sun:       signIndexFromLongitude(longitudes.Sun),
      Moon:      signIndexFromLongitude(longitudes.Moon),
      Mars:      signIndexFromLongitude(longitudes.Mars),
      Mercury:   signIndexFromLongitude(longitudes.Mercury),
      Jupiter:   signIndexFromLongitude(longitudes.Jupiter),
      Venus:     signIndexFromLongitude(longitudes.Venus),
      Saturn:    signIndexFromLongitude(longitudes.Saturn),
      Ascendant: ascSignIdx
    }
  });

  return {
    subject: input,
    // birthUtc is carried out so callers can re-derive dasha windows
    // (buildDashaWindows) without re-parsing birth date/time/timezone.
    calculationMeta: { ayanamsha: "Lahiri (Chitrapaksha)", ayanamshaDegrees: ayan, julianDay: Number(jd.toFixed(5)), zodiac: "sidereal", houseSystem: "Whole Sign", birthUtc: birthUtc.toISOString(), calculatedAt: new Date().toISOString() },
    panchang: {
      tithi: `${((tithiNum - 1) % 15) + 1} ${paksha}`, tithiNumber: tithiNum, nakshatra: moonNak, nakshatraPada: nakshatraPadaFromLongitude(moonLong),
      yoga: YOGAS[Math.floor(normalizeAngle(longitudes.Sun + longitudes.Moon) / NAKSHATRA_SIZE) % 27],
      // Weekday must be the LOCAL calendar day of birth (what the customer reads
      // on a calendar), not the UTC day. getUTCDay() on birthUtc rolls back to the
      // previous day for any birth between 00:00–offset local (e.g. 1:30 AM IST →
      // previous-day 20:00 UTC → wrong weekday). Format birthUtc in the birth's
      // IANA zone instead.
      karana: computeKarana(moonSunAngle), paksha, weekday: new Intl.DateTimeFormat("en-US", { timeZone: input.timezone, weekday: "long" }).format(birthUtc),
      sunrise: computedSunrise, sunset: computedSunset
    },
    ascendant: ascendantInfo,
    planets,
    houses,
    houseCusps: houses.map(h => ({ house: h.house, sign: h.sign, degree: `${Math.floor(h.cuspStart % 30)}°`, sandhiSign: h.sign, sandhiDegree: `${Math.floor(h.cuspEnd % 30)}°` })),
    divisionalCharts: {
      d1: Object.fromEntries(houses.map((h) => [h.house.toString(), h.occupants.length ? h.occupants : ["-"]])),
      d2: chartFromSignMapping(planets, 2), d3: chartFromSignMapping(planets, 3), d4: chartFromSignMapping(planets, 4), d5: chartFromSignMapping(planets, 5), d7: chartFromSignMapping(planets, 7), d8: chartFromSignMapping(planets, 8), d9: chartFromSignMapping(planets, 9), d10: chartFromSignMapping(planets, 10), d12: chartFromSignMapping(planets, 12), chalit: chartFromSignMapping(planets, 1)
    },
    dashas: { currentMahaDasha, currentAntarDasha, currentPratyantarDasha, vimshottariTimeline: vimshottariTimeline.map(({ startDate: _s, endDate: _e, ...item }) => item) },
    doshas,
    transitSnapshot,
    ashtakavarga: {
      houses: ashtakavarga.houses,
      total: ashtakavarga.total,
      bavBySign: ashtakavarga.bavBySign,
      savBySign: ashtakavarga.savBySign
    },
    numerology: numerologyFromInput(input),
    astroDetails: {
      varna: VARNA_MAP[moonSign] || "Unknown", vashya: VASHYA_MAP[moonSign] || "Unknown", yoni: YONI_MAP[moonNak] || "Unknown", gan: GANA_MAP[moonNak] || "Unknown", nadi: NADI_MAP[moonNak] || "Unknown",
      sign: moonSign, signLord: SignLords[moonSign], nakshatraLord: DashaOrder[nakshatraIndex(moonLong) % 9],
      charan: nakshatraPadaFromLongitude(moonLong),
      yunja: yunjaFromNakshatraIndex(nakshatraIndex(moonLong)),
      tatva: TATVA_MAP[moonSign] || "Unknown",
      nameAlphabet: NAME_ALPHABET_TABLE[moonNak]?.[nakshatraPadaFromLongitude(moonLong) - 1] || "—",
      paya: PAYA_MAP[moonSign] || "Copper",
      ascendant: ascSign, ascendantLord: SignLords[ascSign]
    },
    ghatChakra: GHAT_CHAKRA_MAP[moonSign] || GHAT_CHAKRA_MAP["Aries"],
    yearlyThemes: [],
    shadbala: [],
    chartSvgs: { d1: "", d9: "" }
  };
}
