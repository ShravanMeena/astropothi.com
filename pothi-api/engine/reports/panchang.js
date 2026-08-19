// In-house Daily Panchang — same engine that powers the Dosh/Kundli reports.
//
// Tithi / Nakshatra / Yoga / Karana come from `buildCalculatedKundliData`
// (astronomy-engine, Lahiri sidereal) evaluated at LOCAL SUNRISE — the Vedic
// reference instant for "the panchang of the day". Day timings (Rahu Kaal,
// Abhijit & Brahma Muhurat) are derived from the REAL sunrise/sunset for the
// requested location, so they are exact rather than assumed.
//
// Contract: computeDailyPanchang({ lat, lon, timezone, date }) → plain object.

import * as Astronomy from "astronomy-engine";
import { buildCalculatedKundliData } from "../astrology/normalize-kundli-data.js";

const pad = (n) => String(n).padStart(2, "0");
const RAHU_SEGMENT = [8, 2, 7, 5, 6, 4, 3]; // by local weekday, 0 = Sunday

// Sunrise / sunset as real Date instants for the local calendar day containing `date`.
function riseSet(date, lat, lon) {
  const observer = new Astronomy.Observer(Number(lat), Number(lon), 0);
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, dayStart, 2);
  const set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, dayStart, 2);
  return { sunrise: rise?.date || null, sunset: set?.date || null };
}

// Format a Date in the target IANA timezone as "6:12 AM".
function fmtTime(d, timezone) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
}

function fmtRange(a, b, timezone) {
  return `${fmtTime(a, timezone)} – ${fmtTime(b, timezone)}`;
}

// Local calendar parts (date + weekday) in the target timezone.
function localParts(d, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "long",
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    y: get("year"), m: get("month"), day: get("day"), weekday: get("weekday"),
    localTime: new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(d),
  };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const VAAR_HI = { Sunday: "Ravivaar", Monday: "Somvaar", Tuesday: "Mangalvaar", Wednesday: "Budhvaar", Thursday: "Guruvaar", Friday: "Shukravaar", Saturday: "Shanivaar" };

export function computeDailyPanchang(input = {}) {
  const timezone = input.timezone || "Asia/Kolkata";
  const lat = input.lat != null ? Number(input.lat) : 28.6139;   // Delhi default
  const lon = input.lon != null ? Number(input.lon) : 77.2090;
  const now = input.date ? new Date(input.date) : new Date();

  const { sunrise, sunset } = riseSet(now, lat, lon);

  // Evaluate the chart at sunrise (fallback to now if rise/set unavailable).
  const ref = sunrise || now;
  const lp = localParts(ref, timezone);
  const chart = buildCalculatedKundliData({
    fullName: "P", gender: "male",
    birthDate: `${lp.y}-${lp.m}-${lp.day}`,
    birthTime: lp.localTime,
    birthPlace: "", latitude: lat, longitude: lon, timezone, language: "en",
  });
  const p = chart.panchang;

  // Weekday from the LOCAL calendar day (not UTC).
  const weekdayName = localParts(now, timezone).weekday;
  const weekdayIdx = WEEKDAYS.indexOf(weekdayName);

  // Day-timing muhurtas from the real sunrise/sunset window.
  let rahuKaal = "—", abhijit = "—", brahma = "—";
  if (sunrise && sunset) {
    const dayLen = sunset.getTime() - sunrise.getTime();
    const seg = dayLen / 8;
    const rIdx = RAHU_SEGMENT[weekdayIdx] ?? 5;
    const rStart = new Date(sunrise.getTime() + (rIdx - 1) * seg);
    rahuKaal = fmtRange(rStart, new Date(rStart.getTime() + seg), timezone);

    const noon = new Date(sunrise.getTime() + dayLen / 2);
    abhijit = fmtRange(new Date(noon.getTime() - 24 * 60000), new Date(noon.getTime() + 24 * 60000), timezone);

    brahma = fmtRange(new Date(sunrise.getTime() - 96 * 60000), new Date(sunrise.getTime() - 48 * 60000), timezone);
  }

  const gregorian = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now);

  return {
    date: gregorian,
    weekday: weekdayName,
    vaar: VAAR_HI[weekdayName] || weekdayName,
    tithi: p.tithi,               // e.g. "7 Shukla Paksha"
    tithiNumber: p.tithiNumber,
    paksha: p.paksha,
    nakshatra: p.nakshatra,
    nakshatraPada: p.nakshatraPada,
    yoga: p.yoga,
    karana: p.karana,
    sunrise: fmtTime(sunrise, timezone),
    sunset: fmtTime(sunset, timezone),
    rahuKaal,
    abhijitMuhurat: abhijit,
    brahmaMuhurat: brahma,
    location: { lat, lon, timezone },
    engine: "inhouse_panchang",
  };
}
