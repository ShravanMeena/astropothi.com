// Sade Sati timeline: Saturn's 7.5-year passage through the 12th, 1st and
// 2nd from natal Moon. Computed by sampling Saturn's sidereal sign across
// a ±5-year window from today, then bisecting on each sign change.

import * as Astronomy from "astronomy-engine";

import { SIGNS } from "./astro-constants.js";

const DAY_MS = 86_400_000;

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function ayanamsha(daysSinceJ2000) {
  const T = daysSinceJ2000 / 36525;
  return 23.85306 + 1.396888 * T + 0.000307 * T * T + 2.2e-8 * T * T * T;
}

function normalizeAngle(value) {
  const x = value % 360;
  return x < 0 ? x + 360 : x;
}

function saturnSignIndexAt(date) {
  const days = julianDay(date) - 2451545.0;
  const tropical = normalizeAngle(
    Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Saturn, date, true)).elon
  );
  const sidereal = normalizeAngle(tropical - ayanamsha(days));
  return Math.floor(sidereal / 30);
}

function moonSignIndex(moonSign) {
  return SIGNS.indexOf(moonSign);
}

function fromMoon(moonIdx, offset) {
  return (moonIdx + offset + 12) % 12;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function bisectTransition(target, before, after) {
  // We know saturnSignIndexAt(before) === target side and saturnSignIndexAt(after) is different, or vice versa.
  // Bisect to day precision.
  let lo = before.getTime();
  let hi = after.getTime();
  const startSign = saturnSignIndexAt(before);
  while (hi - lo > DAY_MS) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const midSign = saturnSignIndexAt(new Date(mid));
    if (midSign === startSign) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return new Date(hi);
}

function buildSaturnSegments(centerDate, yearsBefore, yearsAfter) {
  // Sample once a week, then bisect each transition to day precision.
  const stepMs = 7 * DAY_MS;
  const startMs = centerDate.getTime() - yearsBefore * 365.25 * DAY_MS;
  const endMs = centerDate.getTime() + yearsAfter * 365.25 * DAY_MS;

  const samples = [];
  for (let t = startMs; t <= endMs; t += stepMs) {
    const d = new Date(t);
    samples.push({ date: d, signIndex: saturnSignIndexAt(d) });
  }

  const segments = [];
  let segStart = samples[0].date;
  let segSign = samples[0].signIndex;
  for (let i = 1; i < samples.length; i++) {
    const s = samples[i];
    if (s.signIndex !== segSign) {
      // Transition somewhere between samples[i-1] and samples[i]
      const transitionDate = bisectTransition(segSign, samples[i - 1].date, s.date);
      segments.push({ signIndex: segSign, start: segStart, end: transitionDate });
      segStart = transitionDate;
      segSign = s.signIndex;
    }
  }
  segments.push({ signIndex: segSign, start: segStart, end: samples[samples.length - 1].date });
  return segments;
}

export function computeSadeSatiTimeline(moonSign, now = new Date()) {
  const moonIdx = moonSignIndex(moonSign);
  if (moonIdx < 0) {
    return {
      active: false,
      moonSign,
      startDate: null,
      endDate: null,
      totalDays: null,
      daysElapsed: null,
      daysRemaining: null,
      overallProgress: 0,
      phases: [],
      currentPhase: null,
      upcomingPhase: null,
      note: "Moon sign unavailable — cannot compute Sade Sati timeline."
    };
  }

  const arohSign = fromMoon(moonIdx, -1);   // 12th from Moon
  const madhyaSign = fromMoon(moonIdx, 0);  // 1st from Moon
  const avarohSign = fromMoon(moonIdx, 1);  // 2nd from Moon

  // Sample ±5 years for past Sade Sati / current / upcoming detection.
  const segments = buildSaturnSegments(now, 5, 6);

  // Find the segment that contains 'now' to determine current Saturn sign.
  const nowMs = now.getTime();
  const currentSegment = segments.find(s => s.start.getTime() <= nowMs && s.end.getTime() > nowMs);
  const currentSatSign = currentSegment ? currentSegment.signIndex : saturnSignIndexAt(now);

  // Group consecutive segments that fall within {arohSign, madhyaSign, avarohSign}
  // into the next "Sade Sati window" most relevant to the user.
  const phaseSet = new Set([arohSign, madhyaSign, avarohSign]);

  // Find the window centered around 'now' if active, otherwise the next upcoming.
  let windowStartIdx = -1;
  let windowEndIdx = -1;
  // If currently in a Sade Sati phase, find contiguous run that contains now.
  if (phaseSet.has(currentSatSign)) {
    const idxNow = segments.findIndex(s => s === currentSegment);
    let lo = idxNow, hi = idxNow;
    while (lo > 0 && phaseSet.has(segments[lo - 1].signIndex)) lo--;
    while (hi < segments.length - 1 && phaseSet.has(segments[hi + 1].signIndex)) hi++;
    windowStartIdx = lo; windowEndIdx = hi;
  } else {
    // Find the next future segment that falls in the phase set.
    const nextIdx = segments.findIndex(s => s.start.getTime() > nowMs && phaseSet.has(s.signIndex));
    if (nextIdx >= 0) {
      let lo = nextIdx, hi = nextIdx;
      while (lo > 0 && phaseSet.has(segments[lo - 1].signIndex)) lo--;
      while (hi < segments.length - 1 && phaseSet.has(segments[hi + 1].signIndex)) hi++;
      windowStartIdx = lo; windowEndIdx = hi;
    }
  }

  if (windowStartIdx < 0) {
    return {
      active: false,
      moonSign,
      startDate: null,
      endDate: null,
      totalDays: null,
      daysElapsed: null,
      daysRemaining: null,
      overallProgress: 0,
      phases: [],
      currentPhase: null,
      upcomingPhase: null,
      note: "No Sade Sati window detected within ±5 years. Saturn is far from your natal Moon.",
      note_hi: "±5 वर्षों में साढ़े साती की कोई अवधि नहीं मिली। शनि आपके जन्म-चंद्र से दूर है।"
    };
  }

  const windowStart = segments[windowStartIdx].start;
  const windowEnd = segments[windowEndIdx].end;
  const totalDays = Math.round((windowEnd.getTime() - windowStart.getTime()) / DAY_MS);
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.round((nowMs - windowStart.getTime()) / DAY_MS)));
  const overallProgress = Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));

  // Build phase entries — collapse contiguous segments with the same signIndex.
  const phases = [];
  for (let i = windowStartIdx; i <= windowEndIdx; i++) {
    const seg = segments[i];
    const last = phases[phases.length - 1];
    if (last && last.saturnSign === SIGNS[seg.signIndex]) {
      last.endDate = isoDate(seg.end);
      continue;
    }
    const name =
      seg.signIndex === arohSign ? "Aroh"
      : seg.signIndex === madhyaSign ? "Madhya"
      : "Avaroh";
    phases.push({
      name,
      description:
        name === "Aroh"   ? "Rising — Saturn enters the 12th from Moon. Tests around losses, expenses, foreign matters and sleep begin."
      : name === "Madhya" ? "Peak — Saturn sits on the natal Moon. The most intense phase: identity, health, mental peace under review."
      :                     "Setting — Saturn moves to the 2nd from Moon. Tests around money, family, speech and accumulated assets.",
      saturnSign: SIGNS[seg.signIndex],
      startDate: isoDate(seg.start),
      endDate: isoDate(seg.end),
      status: "future",
      progressPercent: 0
    });
  }

  // Annotate each phase with status + progress relative to now.
  const today = isoDate(now);
  let currentPhase = null;
  let upcomingPhase = null;
  for (const p of phases) {
    if (p.endDate <= today) {
      p.status = "past";
      p.progressPercent = 100;
    } else if (p.startDate > today) {
      p.status = "future";
      p.progressPercent = 0;
      if (!upcomingPhase) upcomingPhase = p.name;
    } else {
      p.status = "active";
      const startMs = new Date(p.startDate).getTime();
      const endMs = new Date(p.endDate).getTime();
      const ratio = endMs > startMs ? (nowMs - startMs) / (endMs - startMs) : 0;
      p.progressPercent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      currentPhase = p.name;
    }
  }

  const active = currentPhase !== null;
  const note = active
    ? `Sade Sati is currently active — you are in the ${currentPhase} phase. Discipline, patience and Shani-pacification practice carry the most weight right now.`
    : `Sade Sati is not currently active. The next phase begins ${upcomingPhase ? `with ${upcomingPhase}` : "in the future"}.`;

  const daysRemaining = Math.max(0, totalDays - elapsedDays);

  return {
    active,
    moonSign,
    startDate: isoDate(windowStart),
    endDate: isoDate(windowEnd),
    totalDays,
    daysElapsed: elapsedDays,
    daysRemaining,
    overallProgress,
    phases,
    currentPhase,
    upcomingPhase,
    note
  };
}
