import type { QA } from "../components/Faq";
import { SUPPORT } from "../lib/support";

/**
 * The questions people ask before buying, answered from what the product
 * actually does.
 *
 * Every answer here was checked against the code that runs, not against what
 * would sound good:
 *
 *   · the ayanamsa, zodiac and house system come from
 *     engine/astrology/normalize-kundli-data.js, which stamps them into every
 *     report's calculation footer;
 *   · the 480 invariants are what scripts/audit_astro_sanity.js asserts, across
 *     eight reference charts;
 *   · "under a minute", "no account", the browser reader, the refund and the
 *     two languages are all existing behaviour on the order page.
 *
 * Nothing here promises an outcome. No guaranteed marriage, no guaranteed
 * wealth, no claim that astrology is scientifically established — the astronomy
 * is, the interpretation is a tradition, and the wording keeps those apart.
 *
 * Shared by the homepage section and the FAQPage schema, so the structured data
 * can only ever describe text that is on the page.
 */
export const SITE_FAQ: QA[] = [
  {
    q: "What is astropothi?",
    a: "astropothi makes personalised Vedic astrology reports. You give a date of birth, an exact birth time and a birthplace; the chart is computed from an astronomical ephemeris and written out in full as a typeset PDF — between 22 and 64 chapters depending on which report you choose, in English or Hindi."
  },
  {
    q: "How does astropothi create a personalised report?",
    a: "Your birth details are resolved to a latitude, longitude and time zone, then to a moment in Universal Time. Planetary positions are computed for that moment, converted to the sidereal zodiac, and cast into a chart. Everything after that — houses, divisional charts, the dasha timeline, dosha tests, strengths — is derived from your chart, and the written chapters are built around those computed values."
  },
  {
    q: "Why is birth time important?",
    a: "It sets the ascendant, and the ascendant decides where every house falls. Ten minutes moves it by roughly two and a half degrees, which can move a planet from one house to the next and change what the report says. Your Moon sign, nakshatra and dasha periods are far more forgiving — they stay reliable within about an hour."
  },
  {
    q: "What information do I need to generate a report?",
    a: "For a birth-chart report: your name, date of birth, time of birth and birthplace. A Vastu report asks about the property instead — its facing and layout. The Couples Challenge asks for both names. You also give a phone number so the finished report can find you again."
  },
  {
    q: "Which astrology system does astropothi use?",
    a: "Sidereal Vedic astrology with the Lahiri (Chitrapaksha) ayanamsa and whole-sign houses — the standard north Indian convention. Every report prints the ayanamsa value and the Julian day it used, so any astrologer can re-cast your chart and check the arithmetic."
  },
  {
    q: "What is included in an astropothi report?",
    a: "Written chapters, not a summary. Depending on the report: every house and planet read in turn, the Vimshottari dasha timeline with dates, divisional charts, Ashtakavarga strengths, dosha tests with their cancellation clauses, and classical remedies. Each report page lists its own chapters in full before you buy."
  },
  {
    q: "Are the reports personalised, or the same for everyone?",
    a: "Personalised. Two people get the same text only if they were born at the same moment in the same place. The chapters are generated from your chart rather than selected from pre-written paragraphs."
  },
  {
    q: "How do I receive my report?",
    a: "On screen, usually in under a minute. The order page opens it as a book you can turn, page by page, and the PDF is there to download. No account is needed to buy, and you can ask questions about your own report afterwards."
  },
  {
    q: "What if I do not know my exact birth time?",
    a: "Give the closest time you have — a birth certificate or hospital record is the best source. The Moon sign, nakshatra and dasha periods stay reliable within about an hour; the ascendant and anything keyed to the houses may not. If the time turns out to be wrong, we regenerate the report for free."
  },
  {
    q: "What if the report is not what I expected?",
    a: `You get all of your money back — no conditions, no form, and you keep the file. Message ${SUPPORT.phone} or email ${SUPPORT.email} and we refund it in full.`
  },
  {
    q: "Is this a prediction, or advice?",
    a: "Neither. The astronomy is computed and checkable; what a placement traditionally signifies is a system of belief, and we present it as that. The reports are for reflection and guidance. They are not medical, legal, financial or psychiatric advice, and nothing in them should replace a qualified professional."
  }
];
