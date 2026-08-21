import { buildCalculatedKundliData } from "../../engine/astrology/normalize-kundli-data.js";
import { detectDoshas, analyzeManglikCancellations } from "../../engine/astrology/detect-doshas.js";
import * as Loc from "../location/location.service.js";

/**
 * One true answer about the visitor's own chart, free, before they buy.
 *
 * The report detail page is read by 5% of the people who land on it — measured,
 * not guessed: 77 devices opened one in thirty days and 4 scrolled past the
 * first screen. So every claim we make below the fold is addressed to nobody,
 * and the only thing worth putting on that first screen is something about the
 * visitor rather than about us.
 *
 * This is that. It runs the same detector the paid report runs, on their real
 * birth details, and hands back the answer to the question that made them click
 * the ad: am I Manglik. It is not a teaser — when the answer is "no", it says
 * no, plainly, and that is a good outcome for someone who has been told
 * otherwise for years.
 *
 * Deliberately NOT returned: the other thirteen doshas' verdicts, any
 * interpretation, any remedy. Those are the report. And no count of "how many
 * others were flagged" either — a number withheld is suspense manufactured out
 * of somebody's anxiety, which is not a thing to sell with.
 *
 * Cheap by construction: an ephemeris calculation and a rules pass, roughly
 * 300ms. No language model, no PDF, no database write.
 */

/**
 * Crude per-IP limiter, in memory.
 *
 * There is no rate limiter anywhere in this service, and this is the first
 * unauthenticated endpoint that does real CPU work — an ephemeris solve per
 * call. A single process is all we run, so a Map is honest about what it is;
 * if this ever runs on two containers, move it to the database.
 */
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;

export function rateLimited(ip) {
  const now = Date.now();
  const seen = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  seen.push(now);
  HITS.set(ip, seen);
  // Bounded cleanup so a long-running process cannot grow this without limit.
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (!v.some((t) => now - t < WINDOW_MS)) HITS.delete(k);
  }
  return seen.length > MAX_PER_WINDOW;
}

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export async function chartCheck({ dob, tob, place_id, pob, name, tob_unknown }) {
  const unknownTime = Boolean(tob_unknown);
  if (!dob) throw Object.assign(new Error("Date of birth is required"), { code: 400 });
  if (!tob && !unknownTime) throw Object.assign(new Error("Time of birth is required"), { code: 400 });
  if (!place_id && !pob) throw Object.assign(new Error("Birth place is required"), { code: 400 });

  // Resolved server-side, exactly as the paid flow does it — a chart cast from
  // browser-supplied coordinates is not the chart we would sell them.
  const hit = await Loc.geocode({ placeId: place_id, address: pob });
  if (!hit) throw Object.assign(new Error("Could not find that birth place — pick one from the list"), { code: 400 });

  const base = {
    fullName: name || "Guest",
    name: name || "Guest",
    birthDate: dob,
    // Noon is the least-wrong stand-in when the time is unknown: it minimises
    // the maximum error on anything that moves with the day. It does NOT rescue
    // the ascendant, which is why the Manglik verdict is withheld below.
    birthTime: unknownTime ? "12:00" : tob,
    placeOfBirth: hit.formatted || pob,
    latitude: hit.lat,
    longitude: hit.lon,
    timezone: hit.timezone || "Asia/Kolkata"
  };
  const k = buildCalculatedKundliData(base);

  const entries = detectDoshas(k);
  const list = Array.isArray(entries) ? entries : entries?.entries || [];
  const manglik = list.find((e) => e.key === "manglik") || null;
  const m = analyzeManglikCancellations(k) || null;

  const mars = (k.planets || []).find((p) => p.name === "Mars");
  const ad = k.astroDetails || {};

  /*
   * Without a birth time there is no Manglik answer to give.
   *
   * Measured on one date and place: across a single day the ascendant moves
   * through six signs, Mars lands in the 12th, 10th, 8th, 6th, 4th and 2nd
   * house in turn, and the Manglik verdict flips four times. A verdict from a
   * guessed time would be a coin toss printed as a fact, which is worse than
   * saying we cannot tell.
   *
   * What survives is what does not depend on the ascendant. The Moon crosses a
   * sign roughly every two and a half days, so the Moon sign holds for a whole
   * date; the nakshatra usually does too, and is flagged when it does not.
   */
  if (unknownTime) {
    // Does the nakshatra actually hold for this date, or does it turn over?
    const early = buildCalculatedKundliData({ ...base, birthTime: "00:30" });
    const late  = buildCalculatedKundliData({ ...base, birthTime: "23:30" });
    const nakStable =
      (early.astroDetails?.nakshatra || early.panchang?.nakshatra) ===
      (late.astroDetails?.nakshatra || late.panchang?.nakshatra);
    const moonStable = early.astroDetails?.sign === late.astroDetails?.sign;

    return {
      time_known: false,
      chart: {
        moon_sign: moonStable ? (ad.sign || null) : null,
        nakshatra: nakStable ? (ad.nakshatra || k.panchang?.nakshatra || null) : null,
        ascendant: null,
        place: hit.formatted || pob
      },
      // Stated as numbers rather than as a warning, because the numbers are the
      // argument for going and finding the birth certificate.
      why: {
        ascendant_signs_in_a_day: 6,
        manglik_flips_in_a_day: 4
      },
      manglik: null,
      checks_in_report: list.length
    };
  }

  return {
    time_known: true,
    // Proof that something real was computed from their details, in the
    // vocabulary they already recognise from every other kundli site.
    chart: {
      moon_sign: ad.sign || null,
      nakshatra: ad.nakshatra || k.panchang?.nakshatra || null,
      ascendant: ad.ascendant || null,
      place: hit.formatted || pob
    },
    manglik: {
      present: !!manglik?.present,
      severity: manglik?.severity || "none",
      score: manglik?.score ?? 0,
      mars_house: mars?.house ?? null,
      mars_sign: mars?.sign ?? null,
      mars_house_label: mars?.house ? ordinal(mars.house) : null,
      // How many classical clauses reduce it, and their names. This is the part
      // most readings skip, and it is why the same placement is serious in one
      // chart and irrelevant in the next.
      cancellations: (m?.cancellations || []).map((c) => c.label),
      mitigators: (m?.mitigators || []).map((c) => c.label),
      verdict: m?.netVerdict || null
    },
    // Stated so the offer is concrete, not so a number can dangle.
    checks_in_report: list.length
  };
}
