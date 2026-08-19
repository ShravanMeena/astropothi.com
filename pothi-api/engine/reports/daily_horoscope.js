// In-house Daily Horoscope for all 12 signs — real transits from the same
// engine as the Dosh/Kundli reports (astronomy-engine, Lahiri sidereal).
//
// A generic sun/moon-sign daily horoscope is, astrologically, today's planetary
// transits read against each zodiac sign taken as the Lagna (ascendant). We
// compute today's planet positions ONCE, then for each of the 12 signs map the
// planets onto whole-sign houses from that sign and synthesise a reading. No
// birth data, no LLM — deterministic and cacheable once per day.
//
// Contract: computeDailyHoroscopes({ date, lat, lon }) → { date, signs: [...] }

import { buildCalculatedKundliData } from "../astrology/normalize-kundli-data.js";
import { SIGNS } from "../astrology/astro-constants.js";

const pad = (n) => String(n).padStart(2, "0");

const SYMBOL = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};
const DATE_RANGE = {
  Aries: "Mar 21 – Apr 19", Taurus: "Apr 20 – May 20", Gemini: "May 21 – Jun 20",
  Cancer: "Jun 21 – Jul 22", Leo: "Jul 23 – Aug 22", Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22", Scorpio: "Oct 23 – Nov 21", Sagittarius: "Nov 22 – Dec 21",
  Capricorn: "Dec 22 – Jan 19", Aquarius: "Jan 20 – Feb 18", Pisces: "Feb 19 – Mar 20",
};
const ELEMENT = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};
const SIGN_LORD = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun",
  Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter",
  Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};
const PLANET_COLOR = {
  Sun: "Saffron", Moon: "Pearl White", Mars: "Coral Red", Mercury: "Emerald Green",
  Jupiter: "Golden Yellow", Venus: "Rose Pink", Saturn: "Deep Blue",
};
const HOUSE_AREA = {
  1: "yourself, health and drive", 2: "money, family and speech", 3: "courage and communication",
  4: "home, comfort and inner peace", 5: "romance, children and creativity", 6: "work, routine and rivals",
  7: "partnerships and close relationships", 8: "change and the unexpected", 9: "luck, travel and learning",
  10: "career and reputation", 11: "income, gains and friends", 12: "rest, expenses and letting go",
};
const KARAKA = {
  Jupiter: "growth and good fortune", Venus: "warmth, love and comfort", Mercury: "clear thinking and useful conversations",
  Sun: "confidence and recognition", Mars: "energy and initiative", Saturn: "discipline and patience",
  Moon: "your changing mood and instincts",
};
const BENEFIC = ["Jupiter", "Venus", "Mercury", "Moon"];
const MALEFIC = ["Saturn", "Mars", "Rahu", "Ketu"];
const MOODS = ["Optimistic", "Focused", "Serene", "Energetic", "Reflective", "Confident", "Content", "Inspired"];

const signIdx = (s) => SIGNS.indexOf(s);
const houseOf = (sign, lagnaSign) => ((signIdx(sign) - signIdx(lagnaSign) + 12) % 12) + 1;
function ordinal(n) { const s = ["th", "st", "nd", "rd"], k = n % 100; return n + (s[(k - 20) % 10] || s[k] || s[0]); }

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// simple in-memory day cache (recompute is cheap; resets on deploy)
const cache = new Map();

export function computeDailyHoroscopes(input = {}) {
  const lat = input.lat != null ? Number(input.lat) : 28.6139;
  const lon = input.lon != null ? Number(input.lon) : 77.2090;
  const now = input.date ? new Date(input.date) : new Date();
  const dayKey = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  const cacheKey = `${dayKey}:${lat.toFixed(1)}:${lon.toFixed(1)}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Today's transiting planets — computed once (noon UTC for stability).
  const transitChart = buildCalculatedKundliData({
    fullName: "T", gender: "male",
    birthDate: dayKey, birthTime: "12:00", birthPlace: "",
    latitude: lat, longitude: lon, timezone: "UTC", language: "en",
  });
  const planetSign = {};
  transitChart.planets.forEach((p) => { planetSign[p.name] = p.sign; });

  const signs = SIGNS.map((lagna) => {
    // Map each transiting planet to a house from this sign-as-Lagna.
    const houses = {};
    Object.entries(planetSign).forEach(([name, sign]) => {
      if (sign) houses[name] = houseOf(sign, lagna);
    });

    const moonHouse = houses.Moon || 1;
    const moonArea = HOUSE_AREA[moonHouse];

    // Strongest benefic in an important house (1,4,5,7,9,10,11).
    const goodHouses = [1, 4, 5, 7, 9, 10, 11];
    const benefic = BENEFIC.find((b) => b !== "Moon" && goodHouses.includes(houses[b]));
    // A malefic sitting in a tender house (6,8,12) → gentle caution.
    const hardHouses = [6, 8, 12];
    const malefic = MALEFIC.find((m) => hardHouses.includes(houses[m]));

    const sentences = [];
    sentences.push(`The Moon moves through your ${ordinal(moonHouse)} house today, bringing ${moonArea} into focus.`);
    if (benefic) {
      sentences.push(`${benefic} favours your ${ordinal(houses[benefic])} house, opening ${KARAKA[benefic]}.`);
    } else {
      sentences.push(`No planet dominates, so steady effort carries you further than bold moves.`);
    }
    if (malefic) {
      sentences.push(`Go slow with ${HOUSE_AREA[houses[malefic]]}, where ${malefic} asks for patience.`);
    } else {
      sentences.push(`Work and relationships feel supportive — trust your instincts.`);
    }
    sentences.push(`A short dawn prayer keeps the day calm and hopeful.`);

    const seed = hash(dayKey + lagna);
    const benefics = Object.entries(houses).filter(([n, h]) => BENEFIC.includes(n) && goodHouses.includes(h)).length;
    const mood = benefics >= 2 ? "Optimistic" : MOODS[seed % MOODS.length];

    return {
      key: lagna.toLowerCase(),
      name: lagna,
      symbol: SYMBOL[lagna],
      dateRange: DATE_RANGE[lagna],
      element: ELEMENT[lagna],
      text: sentences.join(" "),
      luckyColor: PLANET_COLOR[SIGN_LORD[lagna]] || "Saffron",
      luckyNumber: (seed % 9) + 1,
      mood,
    };
  });

  const result = {
    date: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(now),
    signs,
    engine: "inhouse_daily_horoscope",
  };
  cache.set(cacheKey, result);
  return result;
}
