// Birth-input normalizers shared by everything that feeds the astrology engine.
//
// `buildCalculatedKundliData` is strict about its input: birthDate must be
// "YYYY-MM-DD", birthTime 24h "HH:MM", and timezone a real IANA zone (it uses
// Intl internally, so the float tzone a booking carries — 5.5 — is not enough).
// Stored birth details are looser than that, so every caller has to normalize
// first.
//
// NOTE: the five inhouse_*.service.js report generators each carry their own
// private copy of these functions. They are byte-identical to these; folding
// them in is worthwhile cleanup but touches the paid-report path, so it is
// deliberately left out of the change that introduced this file.

import tzlookup from "tz-lookup";

const pad = (n) => String(n).padStart(2, "0");

// dob: "YYYY-MM-DD" or "DD/MM/YYYY" → "YYYY-MM-DD"
export function normalizeBirthDate(dob) {
  if (!dob) throw new Error("dob is required");
  let y, m, d;
  if (String(dob).includes("-")) {
    [y, m, d] = String(dob).split("T")[0].split("-").map(Number);
  } else if (String(dob).includes("/")) {
    [d, m, y] = String(dob).split("/").map(Number);
  } else {
    throw new Error("dob must be YYYY-MM-DD or DD/MM/YYYY");
  }
  if (!y || !m || !d) throw new Error(`could not parse dob: ${dob}`);
  return `${y}-${pad(m)}-${pad(d)}`;
}

// tob: "HH:MM" or "HH:MM AM/PM" → 24h "HH:MM"
export function normalizeBirthTime(tob) {
  if (!tob) throw new Error("tob is required");
  const m = String(tob).trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) throw new Error("tob must be HH:MM or HH:MM AM/PM");
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3] === "PM" && hour !== 12) hour += 12;
  if (m[3] === "AM" && hour === 12) hour = 0;
  return `${pad(hour)}:${pad(min)}`;
}

// Resolve a precise IANA timezone from lat/lon; IST when lookup fails.
export function resolveTimezone(lat, lon) {
  try {
    const tz = tzlookup(Number(lat), Number(lon));
    if (tz) return tz;
  } catch {
    /* fall through */
  }
  return "Asia/Kolkata";
}

/**
 * Turn a stored birth_meta blob into the exact shape the engine expects.
 * @param {object} birth {name, dob, tob, pob, lat, lon, gender}
 */
export function toEngineRequest(birth, { language = "en" } = {}) {
  const gender = ["male", "female", "other"].includes(birth?.gender) ? birth.gender : "male";
  return {
    fullName: birth?.name || "User",
    gender,
    birthDate: normalizeBirthDate(birth?.dob),
    birthTime: normalizeBirthTime(birth?.tob),
    birthPlace: birth?.pob || "",
    latitude: Number(birth?.lat),
    longitude: Number(birth?.lon),
    timezone: resolveTimezone(birth?.lat, birth?.lon),
    language: language === "hi" ? "hi" : "en",
  };
}
