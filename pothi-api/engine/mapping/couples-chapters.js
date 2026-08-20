// ─────────────────────────────────────────────────────────────────────────────
// Couples Challenge — chapter mapper.
//
// The only report in this catalogue with nothing to compute. Every other mapper
// argues from a chart; this one arranges written questions around two names.
// That makes personalisation the whole job, so it is done properly: the names
// are not on the cover alone, they are in the running header of all thirty
// pages and in the question itself on days that address one partner.
//
// Two rules this file enforces, both of them about absence:
//
//   1. An optional value that is missing removes its whole line. A cover
//      reading "Since ______" is worse than a cover with no date, and a page
//      that prints "{{NAME2}}" is worse than both.
//   2. Days alternate who they are addressed to — odd days to partner 1, even
//      to partner 2 — so that over thirty days each is asked fifteen times by
//      name. Alternating rather than randomising means Day 15, the hardest
//      question in the book, always lands on partner 1, and Day 16 hands the
//      next one to partner 2. Nobody carries the difficult week alone.
// ─────────────────────────────────────────────────────────────────────────────

import { stringsFor, WEEKS, weekOf } from "../i18n/couples-strings.js";

/** Trim, collapse whitespace, and cap — names go on a cover, not in a form. */
const clean = (v, max = 24) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
       "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"]
};

/**
 * "03/2019" → "March 2019" / "मार्च 2019". Returns null for anything it cannot
 * read, which is the signal to drop the line rather than print a half-date.
 */
export function formatMonthYear(value, lang) {
  const m = String(value ?? "").match(/^(\d{1,2})\s*[/-]\s*(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (month < 1 || month > 12) return null;
  // A relationship that starts next year is a typo, not a romance.
  if (year < 1900 || year > new Date().getFullYear()) return null;
  return `${MONTHS[lang === "hi" ? "hi" : "en"][month - 1]} ${year}`;
}

/** "Priya & Arjun" / "प्रिया और अर्जुन" */
const coupleName = (a, b, S) => `${a} ${S.and} ${b}`;

const todayIn = (lang) => {
  const d = new Date();
  const M = MONTHS[lang === "hi" ? "hi" : "en"][d.getMonth()];
  return `${d.getDate()} ${M} ${d.getFullYear()}`;
};

/**
 * @param {object} meta  { partner1_name, partner2_name, start_date, gift_from, gift_message }
 * @param {string} lang  "en" | "hi"
 * @returns {Array} sections in the shape doc-model.js normalises
 */
export function buildCouplesSections(meta, lang = "en") {
  const S = stringsFor(lang);
  const name1 = clean(meta?.partner1_name) || (lang === "hi" ? "आप" : "You");
  const name2 = clean(meta?.partner2_name) || (lang === "hi" ? "आपके साथी" : "Your partner");
  const couple = coupleName(name1, name2, S);
  const since = formatMonthYear(meta?.start_date, lang);
  const giftFrom = clean(meta?.gift_from, 40);
  // 200 chars is what fits on the gift page without the type shrinking.
  const giftMessage = clean(meta?.gift_message, 200);

  const s = [];
  let i = 0;
  const n = () => ++i;

  // ── the gift page, only when there is a gift ───────────────────────────────
  // Printed first so it is the first thing seen after the cover — a gift page
  // buried behind the welcome is a gift page nobody reads.
  if (giftMessage) {
    s.push({
      n: n(), id: "gift",
      title: S.gift.eyebrow(couple),
      subtitle: giftFrom ? S.gift.from(giftFrom) : "",
      summary: `“${giftMessage}”`
    });
  }

  // ── welcome ────────────────────────────────────────────────────────────────
  s.push({
    n: n(), id: "welcome",
    title: S.welcome.title(couple),
    subtitle: S.seriesSubtitle,
    summary: since ? S.since(since) : "",
    body: S.welcome.body
  });

  // ── thirty days, with a check-in at the end of each of the four weeks ──────
  for (let day = 1; day <= 30; day++) {
    const week = weekOf(day);
    const d = S.days[day];
    // Odd days ask partner 1, even days ask partner 2. See the note at the top.
    const addressee = day % 2 === 1 ? name1 : name2;
    const listener = day % 2 === 1 ? name2 : name1;

    const body = [];
    if (d.f) body.push(d.f);
    // The listening rule only exists in Week 3, and it is addressed BY NAME to
    // whoever is not answering — an instruction addressed to "you" in a book
    // two people are reading together is an instruction addressed to nobody.
    if (d.g) body.push(`${S.guardLabel} — ${listener}: ${d.g}`);
    body.push(`${S.actionLabel}: ${d.a}`);

    s.push({
      n: n(),
      id: `day_${day}`,
      // Week 3 questions name the person being asked; the rest stay open, so
      // the naming lands as emphasis rather than as a tic.
      title: d.g ? `${addressee} — ${d.q}` : d.q,
      subtitle: S.runningHeader(couple, day),
      summary: `${S.weeks[week.key].title}`,
      body,
      // Real ruled lines, drawn by the renderer. Written as text they came out
      // blank: only WinAnsi glyphs survive the built-in font encodings, so a row
      // of horizontal bars rendered as nothing at all. The Keepsake layout gives
      // every day a whole leaf, and a page somebody has written on is the reason
      // this book gets kept rather than downloaded and forgotten.
      bullets: [S.writeLine],
      writeLines: 7
    });

    if (day === week.to && week.key !== "closing") {
      s.push({
        n: n(),
        id: `checkin_${week.n}`,
        title: S.checkIn.title(week.n),
        subtitle: S.weeks[week.key].title,
        summary: S.checkIn.intro,
        body: [S.weeks[week.key].note],
        bullets: [...S.checkIn.prompts, S.checkIn.columns(name1, name2)]
      });
    }
  }

  // ── the certificate ────────────────────────────────────────────────────────
  s.push({
    n: n(), id: "certificate",
    title: S.certificate.title,
    subtitle: S.certificate.line(couple),
    summary: S.certificate.footer(since ? S.since(since) : "", todayIn(lang)),
    body: S.certificate.body
  });

  return s;
}

export { WEEKS };
