// ─────────────────────────────────────────────────────────────────────────────
// The 28 rendered pages of the dosh report.
//
// Titles, count and order are identical to the sample stored on
// astro_chart_listing id 3 (content->sample->pages). Every page is built from
// engine-computed values dropped into static bilingual templates — no LLM, and
// nothing asserted that the engine cannot compute.
//
// Page shape matches the kundali generator: { id, page, title, subtitle, body,
// bullets, summary }. Chart-bearing pages also carry `placements` (structured
// planet/house data) and `dosh_ids` so the UI can draw the chart and link the
// page back to the verdicts in doshas[].
// ─────────────────────────────────────────────────────────────────────────────

import { t, sg, pl, nk, oh, od, deg, joinList, ordinal, signAtOffset, weekdayFor, gemFor, mantraFor, shrineFor, colorLoc, dayLoc, tithiLoc, termLoc } from "./dosh-i18n.js";
import { buildDashaWindows } from "../astrology/normalize-kundli-data.js";

/**
 * Severity and calculation labels arrive in English from the mapper and the
 * ephemeris. They were being interpolated straight into Hindi sentences.
 */
const SEV_HI = { High: "उच्च", Moderate: "मध्यम", Low: "अल्प", None: "शून्य" };
const META_HI = { "Approx Lahiri": "लाहिड़ी (अनुमानित)", Lahiri: "लाहिड़ी", sidereal: "निरयण", tropical: "सायन" };
const sevL = (v, lang) => (lang === "hi" ? SEV_HI[String(v || "").trim()] || v : v);
const metaL = (v, lang) => (lang === "hi" ? META_HI[String(v || "").trim()] || v : v);


const PAGE = (lang, en, hi) => t(lang, en, hi);

/**
 * The verdict as structured data, so the renderer can colour it.
 *
 * The subtitle already said "Present · 59/100", but a string cannot be styled —
 * the reader had to parse severity out of grey text. Bands follow the same
 * thresholds the "How Severity Is Scored" chapter explains, so the colour and
 * the prose can never disagree.
 */
export function statusOf(detected, severity, cancelled) {
  if (!detected) return { kind: "absent", severity: "none", score: 0 };
  if (cancelled) return { kind: "cancelled", severity: "none", score: Number(severity) || 0 };
  // These bands are the ones chapter 4 prints. If they ever drift apart the
  // report will colour a dosh one way and explain it another.
  const n = Number(severity) || 0;
  return {
    kind: "present",
    severity: n >= 75 ? "severe" : n >= 55 ? "high" : n >= 30 ? "moderate" : "mild",
    score: n
  };
}

export function buildSections(ctx, chapters, cancellations, minorPatterns) {
  const lang = ctx.lang;
  const C = Object.fromEntries(chapters.map((c) => [c.id, c]));
  const detected = chapters.filter((c) => c.detected);
  const absent = chapters.filter((c) => !c.detected);
  const meta = ctx.kundliData?.calculationMeta || {};
  const subject = ctx.kundliData?.subject || {};
  const S = [];

  const chartPage = (extra) => ({ placements: ctx.placements, ...extra });

  // ── 1 ──────────────────────────────────────────────────────────────────────
  S.push({
    id: "about_report", page: 1,
    title: PAGE(lang, "About This Report", "इस रिपोर्ट के बारे में"),
    subtitle: PAGE(lang, "What was checked, and how", "क्या जाँचा गया और कैसे"),
    body: [
      t(lang,
        `This report checks ${chapters.length} classical doshas against your birth chart and prints the verdict for every one of them — including the ones that are not there. Reporting an absence takes as much computation as reporting a presence, and it is the half that most dosh reports leave out.`,
        `यह रिपोर्ट आपकी जन्म-कुंडली पर ${chapters.length} शास्त्रीय दोषों की जाँच करती है और प्रत्येक का निर्णय छापती है — उन दोषों का भी जो उपस्थित नहीं हैं। अनुपस्थिति बताने में उतनी ही गणना लगती है जितनी उपस्थिति बताने में, और यही वह आधा भाग है जिसे अधिकांश दोष-रिपोर्ट छोड़ देती हैं।`),
      t(lang,
        `Nothing here is written by a language model. Each verdict is produced by the same rule the classical text states, applied to positions computed for ${subject.birthDate || "your birth date"} at ${subject.birthTime || "your birth time"} in ${subject.birthPlace || "your birth place"} — sidereal positions, Lahiri ayanamsha, Whole Sign houses.`,
        `यहाँ कुछ भी किसी भाषा-मॉडल का लिखा हुआ नहीं है। प्रत्येक निर्णय उसी शास्त्रीय नियम से निकला है, जो ${subject.birthDate || "आपकी जन्म तिथि"} को ${subject.birthTime || "आपके जन्म समय"} पर ${subject.birthPlace || "आपके जन्म स्थान"} हेतु गणना की गई ग्रह-स्थितियों पर लागू किया गया — निरयन स्थिति, लाहिड़ी अयनांश, पूर्ण-राशि भाव पद्धति।`),
      detected.length
        ? t(lang,
          `${detected.length} of the ${chapters.length} came back present and ${absent.length} came back absent. Every absent chapter names the rule that would have triggered the dosh and the measured position that keeps it from forming, so you can see the check was actually run.`,
          `${chapters.length} में से ${detected.length} उपस्थित मिले और ${absent.length} अनुपस्थित। प्रत्येक अनुपस्थित अध्याय में वह नियम भी दिया गया है जिससे दोष बनता, और वह मापी गई स्थिति भी जिसके कारण वह नहीं बना — ताकि आप देख सकें कि जाँच वास्तव में हुई है।`)
        : t(lang,
          `None of the ${chapters.length} came back present. Every chapter still names the rule and the measured position that keeps the dosh from forming, so the clean result is evidenced rather than merely asserted.`,
          `${chapters.length} में से कोई भी उपस्थित नहीं मिला। फिर भी प्रत्येक अध्याय में नियम और वह मापी गई स्थिति दी गई है जिसके कारण दोष नहीं बनता — ताकि यह शुद्ध परिणाम केवल कहा नहीं, प्रमाणित भी हो।`),
    ],
    bullets: [
      t(lang, `Ayanamsha: ${meta.ayanamsha || "Lahiri"}${meta.ayanamshaDegrees ? ` (${meta.ayanamshaDegrees.toFixed(4)}°)` : ""}`, `अयनांश: ${metaL(meta.ayanamsha, lang) || "लाहिड़ी"}${meta.ayanamshaDegrees ? ` (${meta.ayanamshaDegrees.toFixed(4)}°)` : ""}`),
      t(lang, `House system: ${meta.houseSystem || "Whole Sign"} · Zodiac: ${meta.zodiac || "sidereal"}`, `भाव पद्धति: पूर्ण राशि · राशिचक्र: निरयन`),
      t(lang, `Ascendant: ${sg(ctx.lagna, lang)}, ruled by ${pl(ctx.lagnaLord, lang)}`, `लग्न: ${sg(ctx.lagna, lang)}, स्वामी ${pl(ctx.lagnaLord, lang)}`),
      t(lang, `Moon: ${sg(ctx.moonSign, lang)} in ${nk(ctx.moonNakshatra, lang)} nakshatra`, `चंद्र: ${sg(ctx.moonSign, lang)}, नक्षत्र ${nk(ctx.moonNakshatra, lang)}`),
      t(lang, `Doshas checked: ${chapters.length} · Present: ${detected.length} · Absent: ${absent.length}`, `जाँचे गए दोष: ${chapters.length} · उपस्थित: ${detected.length} · अनुपस्थित: ${absent.length}`),
    ],
    summary: t(lang, "Every dosh in this report was tested against computed positions — the absent ones are reported as plainly as the present ones.",
      "इस रिपोर्ट का प्रत्येक दोष गणना की गई स्थितियों पर परखा गया है — अनुपस्थित दोष भी उतनी ही स्पष्टता से बताए गए हैं जितने उपस्थित।"),
  });

  // ── 2 ──────────────────────────────────────────────────────────────────────
  S.push(chartPage({
    id: "birth_details_chart", page: 2,
    title: PAGE(lang, "Birth Details & Chart", "जन्म विवरण और कुंडली"),
    subtitle: PAGE(lang, "The positions every verdict is drawn from", "वे स्थितियाँ जिनसे प्रत्येक निर्णय निकला है"),
    body: [
      t(lang,
        `Born ${subject.birthDate || "—"} at ${subject.birthTime || "—"}, ${subject.birthPlace || "—"}. The ascendant rises in ${sg(ctx.lagna, lang)}, ruled by ${pl(ctx.lagnaLord, lang)}, and the Moon stands in ${sg(ctx.moonSign, lang)} in ${nk(ctx.moonNakshatra, lang)} nakshatra${ctx.moon ? `, ${oh(ctx.moon.house, lang)}` : ""}.`,
        `जन्म ${subject.birthDate || "—"} को ${subject.birthTime || "—"} बजे, ${subject.birthPlace || "—"}। लग्न ${sg(ctx.lagna, lang)} है, स्वामी ${pl(ctx.lagnaLord, lang)}, तथा चंद्रमा ${sg(ctx.moonSign, lang)} में ${nk(ctx.moonNakshatra, lang)} नक्षत्र में${ctx.moon ? `, ${oh(ctx.moon.house, lang)} में` : ""} स्थित है।`),
      t(lang,
        `The table below is the whole chart in nine lines: each planet's sign, its degree within that sign, and the house it occupies counted from the ascendant. Every dosh verdict in this report is a rule applied to these nine rows and to the transit of Saturn — there is no other input.`,
        `नीचे दी गई तालिका ही नौ पंक्तियों में सम्पूर्ण कुंडली है: प्रत्येक ग्रह की राशि, उस राशि में उसका अंश, और लग्न से गिना गया भाव। इस रिपोर्ट का हर दोष-निर्णय इन्हीं नौ पंक्तियों तथा शनि के गोचर पर लागू किया गया नियम है — इसके अतिरिक्त कोई आधार नहीं।`),
      t(lang,
        `Panchang at birth: ${ctx.panchang?.tithi || "—"} tithi, ${ctx.panchang?.yoga || "—"} yoga, ${ctx.panchang?.karana || "—"} karana, ${ctx.panchang?.weekday || "—"}. If you take this report to an astrologer, this page is the one to hand over — it lets them verify the cast in under a minute.`,
        `जन्म के समय पंचांग: तिथि ${tithiLoc(ctx.panchang?.tithi, "hi")}, योग ${termLoc(ctx.panchang?.yoga, "hi")}, करण ${termLoc(ctx.panchang?.karana, "hi")}, वार ${termLoc(ctx.panchang?.weekday, "hi")}। यदि आप यह रिपोर्ट किसी ज्योतिषी को दिखाएँ तो यही पृष्ठ दें — इससे वे एक मिनट में कुंडली सत्यापित कर सकेंगे।`),
    ],
    bullets: ctx.placements.map((p) =>
      t(lang, `${p.planet} — ${p.sign} ${p.degree}° · house ${p.house}${p.retrograde ? " · retrograde" : ""}`,
        `${p.planet} — ${p.sign} ${p.degree}° · भाव ${p.house}${p.retrograde ? " · वक्री" : ""}`)),
    summary: t(lang, `Nine placements, one ascendant and one Saturn transit — the complete input set for all ${chapters.length} verdicts.`,
      `नौ ग्रह-स्थितियाँ, एक लग्न और शनि का एक गोचर — इन्हीं से सभी ${chapters.length} निर्णय निकले हैं।`),
  }));

  // ── 3 ──────────────────────────────────────────────────────────────────────
  S.push({
    id: "dosh_summary", page: 3,
    title: PAGE(lang, "Dosh Summary", "दोष सारांश"),
    subtitle: detected.length
      ? t(lang, `${detected.length} present · ${absent.length} absent`, `${detected.length} उपस्थित · ${absent.length} अनुपस्थित`)
      : t(lang, "No dosh present", "कोई दोष उपस्थित नहीं"),
    body: [
      detected.length
        ? t(lang,
          `Present in this chart: ${joinList(detected.map((d) => `${d.name} (${d.severity}/100)`), lang)}. Nothing else on the checked list forms.`,
          `इस कुंडली में उपस्थित: ${joinList(detected.map((d) => `${d.name} (${d.severity}/100)`), lang)}। जाँची गई सूची में शेष कोई दोष नहीं बनता।`)
        : t(lang,
          "No dosh on the checked list forms in this chart. That is a computed result, not a courtesy — the measured position that blocks each one is printed in its own chapter.",
          "जाँची गई सूची का कोई भी दोष इस कुंडली में नहीं बनता। यह गणना का परिणाम है, शिष्टाचार नहीं — प्रत्येक दोष को रोकने वाली मापी गई स्थिति उसके अपने अध्याय में दी गई है।"),
      detected.length
        ? t(lang,
          `The highest score belongs to ${detected.slice().sort((a, b) => b.severity - a.severity)[0].name} at ${detected.slice().sort((a, b) => b.severity - a.severity)[0].severity}/100, which is where your attention and any remedy budget should go first. Doshas below 30 are notes, not projects.`,
          `सर्वाधिक अंक ${detected.slice().sort((a, b) => b.severity - a.severity)[0].name} का है — ${detected.slice().sort((a, b) => b.severity - a.severity)[0].severity}/100 — अतः ध्यान और उपाय पहले वहीं लगाएँ। 30 से नीचे के दोष केवल जानकारी हैं, कार्य-योजना नहीं।`)
        : t(lang,
          "With nothing present, this report's value is the record: it tells you exactly which claims about your chart are not true, and on what measurement.",
          "जब कुछ उपस्थित ही नहीं है, तब इस रिपोर्ट का मूल्य प्रमाण-पत्र के रूप में है: यह ठीक-ठीक बताती है कि आपकी कुंडली के विषय में कौन-से दावे सत्य नहीं हैं और किस माप के आधार पर।"),
      minorPatterns.length
        ? t(lang,
          `Four secondary patterns were also checked — ${joinList(minorPatterns.map((m) => m.name), lang)} — of which ${minorPatterns.filter((m) => m.detected).length} ${minorPatterns.filter((m) => m.detected).length === 1 ? "is" : "are"} present. They own no chapter because they change no decision on their own.`,
          `चार गौण योगों की भी जाँच हुई — ${joinList(minorPatterns.map((m) => m.name), lang)} — जिनमें से ${minorPatterns.filter((m) => m.detected).length} उपस्थित हैं। इनका अलग अध्याय नहीं है क्योंकि ये स्वयं किसी निर्णय को नहीं बदलते।`)
        : t(lang, "No secondary patterns were available to check for this chart.", "इस कुंडली के लिए किसी गौण योग की जाँच उपलब्ध नहीं थी।"),
    ],
    bullets: chapters.map((c) =>
      t(lang, `${c.name} — ${c.detected ? `present, ${c.severity_label} (${c.severity}/100)` : "absent"} · ${c.affects}`,
        `${c.name} — ${c.detected ? `उपस्थित, ${sevL(c.severity_label, lang)} (${c.severity}/100)` : "अनुपस्थित"} · ${c.affects}`)),
    summary: t(lang, `${detected.length} of ${chapters.length} doshas present; ${absent.length} tested and absent.`,
      `${chapters.length} में से ${detected.length} दोष उपस्थित; ${absent.length} जाँचे गए और अनुपस्थित पाए गए।`),
    dosh_ids: chapters.map((c) => c.id),
  });

  // ── 4 ──────────────────────────────────────────────────────────────────────
  S.push({
    id: "severity_scoring", page: 4,
    title: PAGE(lang, "How Severity Is Scored", "गंभीरता कैसे मापी जाती है"),
    subtitle: PAGE(lang, "Why a number, not an adjective", "अंक क्यों, विशेषण क्यों नहीं"),
    body: [
      t(lang,
        "A dosh is not simply on or off. The same combination can be tight or wide, in a strong sign or a weak one, in a house that matters or one that barely does. Every present dosh here therefore carries a 0-100 score computed from those factors instead of a blanket label.",
        "दोष केवल 'है' या 'नहीं है' नहीं होता। वही योग निकट भी हो सकता है और दूर भी, बलवान राशि में भी और निर्बल में भी, महत्वपूर्ण भाव में भी और गौण भाव में भी। इसीलिए यहाँ प्रत्येक उपस्थित दोष को एक ही ठप्पे के बजाय इन कारकों से गणना किया गया 0-100 का अंक दिया गया है।"),
      t(lang,
        "Conjunction doshas score on closeness: an exact degree-to-degree conjunction scores at the top of its band and one at the edge of the permitted orb scores near the bottom. House doshas score on which house is involved. Transit doshas score on phase, with the peak phase weighted heaviest.",
        "युति से बनने वाले दोषों का अंक निकटता से बनता है: अंश-दर-अंश सटीक युति अपने वर्ग के शीर्ष पर और स्वीकृत सीमा के किनारे की युति निचले सिरे पर आती है। भाव से बनने वाले दोषों का अंक इस पर निर्भर करता है कि कौन-सा भाव संलग्न है। गोचर वाले दोषों का अंक चरण से बनता है, जिसमें मध्य चरण सबसे भारी माना जाता है।"),
      detected.length
        ? t(lang,
          `On that scale this chart reads: ${detected.map((d) => `${d.name} ${d.severity}/100 (${d.severity_label})`).join(", ")}.`,
          `इस पैमाने पर आपकी कुंडली इस प्रकार है: ${detected.map((d) => `${d.name} ${d.severity}/100 (${sevL(d.severity_label, lang)})`).join(", ")}।`)
        : t(lang,
          "Nothing in this chart scored above zero. There is no hidden severity being withheld — a zero here means the rule was applied and not satisfied.",
          "इस कुंडली में किसी का अंक शून्य से ऊपर नहीं गया। कोई गंभीरता छिपाई नहीं गई है — यहाँ शून्य का अर्थ है कि नियम लगाया गया और पूरा नहीं हुआ।"),
    ],
    bullets: [
      t(lang, "1-29 — Mild: worth knowing, not worth reorganising your life around.", "1-29 — मंद: जानने योग्य, किन्तु जीवन बदलने योग्य नहीं।"),
      t(lang, "30-54 — Moderate: a real factor in one life area; a steady remedy routine is enough.", "30-54 — मध्यम: जीवन के किसी एक क्षेत्र में वास्तविक कारक; नियमित उपाय पर्याप्त हैं।"),
      t(lang, "55-74 — High: acts noticeably during its own planetary period; remedies plus practical caution.", "55-74 — उच्च: अपनी दशा में स्पष्ट फल देता है; उपाय के साथ व्यावहारिक सतर्कता भी।"),
      t(lang, "75-100 — Severe: the dominant signature for its life area; treat the remedy plan as a standing commitment.", "75-100 — प्रबल: उस जीवन-क्षेत्र का प्रमुख लक्षण; उपाय योजना को स्थायी नियम मानें।"),
      t(lang, "0 — Not present: the rule was tested against your positions and not satisfied.", "0 — अनुपस्थित: नियम आपकी स्थितियों पर परखा गया और पूरा नहीं हुआ।"),
    ],
    summary: t(lang, "Scores come from orb, house and phase — not from a dosh's reputation.", "अंक युति की दूरी, भाव और चरण से बनते हैं — दोष की प्रसिद्धि से नहीं।"),
  });

  // ── 5-7 Mangal ─────────────────────────────────────────────────────────────
  const mangal = C.mangal_dosh;
  const manglik = ctx.manglik;
  const mars = ctx.mars;
  S.push(chartPage({
    id: "mangal_formation", page: 5,
    title: PAGE(lang, "Mangal Dosh — Formation", "मंगल दोष — निर्माण"),
    subtitle: mangal.detected
      ? t(lang, `Present · ${mangal.severity}/100`, `उपस्थित · ${mangal.severity}/100`)
      : t(lang, "Not present", "अनुपस्थित"),
    status: statusOf(mangal.detected, mangal.severity, mangal.cancelled),
    body: [
      mangal.rule,
      mangal.short_description,
      mangal.detected
        ? t(lang,
          `House weighting matters here: the 7th and 8th are the harshest placements because they are the houses of marriage and longevity, the 1st, 4th and 12th are moderate, and the 2nd is the mildest. Mars in ${mars ? oh(mars.house, lang) : "—"} is what sets the base score before any cancellation is applied.`,
          `भाव का भार यहाँ महत्वपूर्ण है: सप्तम और अष्टम सबसे कठोर हैं क्योंकि वे विवाह और आयु के भाव हैं, प्रथम, चतुर्थ और द्वादश मध्यम हैं, तथा द्वितीय सबसे हल्का। ${mars ? oh(mars.house, lang) : "—"} में स्थित मंगल से ही निवारण लगने से पूर्व का मूल अंक बनता है।`)
        : t(lang,
          `The rule is positional and admits no interpretation: Mars is either in one of those six houses or it is not. ${mangal.why_not} Marriage decisions in your case are not gated by Mangal Dosh at all.`,
          `यह नियम पूर्णतः स्थिति-आधारित है, इसमें व्याख्या की गुंजाइश नहीं: मंगल या तो उन छह भावों में है, या नहीं। ${mangal.why_not} आपके विषय में विवाह-निर्णय मंगल दोष से बिल्कुल भी बाधित नहीं हैं।`),
    ],
    bullets: [
      t(lang, `Mars: ${mars ? `${sg(mars.sign, lang)} ${deg(mars.degree)}, ${oh(mars.house, lang)}${mars.retrograde ? ", retrograde" : ""}` : "—"}`, `मंगल: ${mars ? `${sg(mars.sign, lang)} ${deg(mars.degree)}, ${oh(mars.house, lang)}${mars.retrograde ? ", वक्री" : ""}` : "—"}`),
      t(lang, "Manglik houses counted from the ascendant: 1, 2, 4, 7, 8, 12", "लग्न से गिने जाने वाले मांगलिक भाव: 1, 2, 4, 7, 8, 12"),
      t(lang, `Ascendant used for the count: ${sg(ctx.lagna, lang)}`, `गणना हेतु लग्न: ${sg(ctx.lagna, lang)}`),
      t(lang, `Verdict: ${mangal.detected ? `dosh forms, scored ${mangal.severity}/100 (${mangal.severity_label})` : "dosh does not form"}`, `निर्णय: ${mangal.detected ? `दोष बनता है, अंक ${mangal.severity}/100 (${mangal.severity_label})` : "दोष नहीं बनता"}`),
    ],
    summary: mangal.detected
      ? t(lang, `Mars occupies a Manglik house — the formation rule is satisfied.`, `मंगल मांगलिक भाव में है — निर्माण का नियम पूरा होता है।`)
      : t(lang, "Mars is outside the six Manglik houses — the formation rule is not satisfied.", "मंगल छह मांगलिक भावों से बाहर है — निर्माण का नियम पूरा नहीं होता।"),
    dosh_ids: ["mangal_dosh"],
  }));

  const mangalClauses = cancellations.filter((c) => c.dosh_id === "mangal_dosh");
  const mangalFired = mangalClauses.filter((c) => c.applies === true);
  S.push({
    id: "mangal_cancellation", page: 6,
    title: PAGE(lang, "Mangal Dosh — Cancellation", "मंगल दोष — निवारण"),
    subtitle: t(lang, `${mangalFired.length} of ${mangalClauses.length} clauses fire`, `${mangalClauses.length} में से ${mangalFired.length} नियम लागू`),
    body: [
      t(lang,
        "Mangal Dosh has more classical cancellation clauses than any other dosh, and they come from the same texts that state the rule. A report that quotes the formation and omits the cancellations is telling you half of what its own source says.",
        "मंगल दोष के निवारण-नियम अन्य किसी भी दोष से अधिक हैं, और वे उन्हीं ग्रंथों से आते हैं जो दोष का नियम बताते हैं। जो रिपोर्ट केवल निर्माण बताकर निवारण छोड़ देती है, वह अपने ही स्रोत की आधी बात कह रही है।"),
      manglik?.netVerdict
        ? t(lang,
          `Every clause was evaluated against your Mars. The reconciled verdict is "${manglik.netVerdict.replace(/-/g, " ")}" — ${mangalFired.length} clause${mangalFired.length === 1 ? "" : "s"} fire and ${mangalClauses.length - mangalFired.length - mangalClauses.filter((c) => c.applies === null).length} were tested and do not.`,
          `प्रत्येक नियम आपके मंगल पर परखा गया। समेकित निर्णय है — ${mangalFired.length} नियम लागू होते हैं तथा ${mangalClauses.length - mangalFired.length - mangalClauses.filter((c) => c.applies === null).length} परखे गए और लागू नहीं होते।`)
        : t(lang, "Every clause was evaluated against your Mars; the result for each is listed below.", "प्रत्येक नियम आपके मंगल पर परखा गया; प्रत्येक का परिणाम नीचे दिया गया है।"),
      mangal.detected
        ? t(lang,
          "Where a clause fires, the score already reflects it — the number on the previous page is post-cancellation, not pre. You are not being asked to subtract anything yourself.",
          "जहाँ कोई नियम लागू होता है, वहाँ अंक में उसका प्रभाव पहले ही सम्मिलित है — पिछले पृष्ठ का अंक निवारण के बाद का है, पहले का नहीं। आपको स्वयं कुछ घटाना नहीं है।")
        : t(lang,
          "These clauses did not need to be used here, because the dosh never formed. They are printed so that if someone later claims Mangal Dosh from a differently-cast chart, you can check the cancellations yourself.",
          "यहाँ इन नियमों की आवश्यकता ही नहीं पड़ी, क्योंकि दोष बना ही नहीं। ये इसलिए दिए गए हैं कि यदि कोई भविष्य में किसी अन्य ढंग से बनी कुंडली से मंगल दोष बताए, तो आप निवारण स्वयं जाँच सकें।"),
    ],
    bullets: mangalClauses.map((c) =>
      `${c.applies === true ? t(lang, "APPLIES", "लागू") : c.applies === null ? t(lang, "needs partner chart", "जीवनसाथी की कुंडली अपेक्षित") : t(lang, "does not apply", "लागू नहीं")} · ${c.detail}`),
    summary: t(lang, `${mangalFired.length} classical Mangal cancellations apply to this chart.`, `इस कुंडली पर ${mangalFired.length} शास्त्रीय मंगल-निवारण लागू होते हैं।`),
    dosh_ids: ["mangal_dosh"],
  });

  S.push({
    id: "mangal_remedies", page: 7,
    title: PAGE(lang, "Mangal Dosh — Remedies", "मंगल दोष — उपाय"),
    subtitle: mangal.detected ? t(lang, "Practice, in order of weight", "उपाय, महत्व के क्रम में") : t(lang, "None required", "किसी उपाय की आवश्यकता नहीं"),
    body: [
      mangal.detected
        ? t(lang,
          `Mars responds to routine and to physical discipline more than to expense. ${weekdayFor("Mars", lang)} is his weekday; the practices below are ordered so the cheapest and most repeatable come first.`,
          `मंगल व्यय से नहीं, नियमितता और शारीरिक अनुशासन से प्रसन्न होता है। ${weekdayFor("Mars", lang)} उसका वार है; नीचे दिए उपाय इस क्रम में हैं कि सबसे सरल और नियमित रूप से दोहराने योग्य पहले आएँ।`)
        : t(lang,
          `No Mars-pacification is indicated for you, because there is no Mangal Dosh to pacify. Anyone prescribing a Mangal remedy on this chart is prescribing for a condition it does not have.`,
          `आपके लिए मंगल-शान्ति का कोई उपाय निर्दिष्ट नहीं है, क्योंकि शांत करने योग्य मंगल दोष है ही नहीं। इस कुंडली पर मंगल-उपाय बताने वाला उस रोग की औषधि दे रहा है जो है ही नहीं।`),
      mangal.detected
        ? t(lang,
          "Hold whichever practice you choose for forty days before judging it, and change one thing at a time. A remedy that moves around the day stops working, whatever the mantra is.",
          "जो भी उपाय चुनें, उसे परखने से पहले चालीस दिन तक निभाएँ, और एक बार में एक ही परिवर्तन करें। जो उपाय दिन में इधर-उधर खिसकता रहे वह काम करना बंद कर देता है, मंत्र चाहे कोई भी हो।")
        : t(lang,
          `If you still want a Mars practice for its own sake — courage, stamina, a steadier temper — the ${weekdayFor("Mars", lang)} Hanuman Chalisa is the traditional one, and it is devotional rather than corrective in your case.`,
          `यदि आप फिर भी मंगल-संबंधी कोई अभ्यास चाहें — साहस, सहनशक्ति, स्थिर स्वभाव के लिए — तो ${weekdayFor("Mars", lang)} की हनुमान चालीसा पारम्परिक अभ्यास है, और आपके विषय में वह सुधारात्मक नहीं, भक्ति-भाव का अभ्यास है।`),
      mangal.detected
        ? t(lang, `The concentrated form of this practice is ${mangal.remedy_puja_name}. It replaces neither the weekday mantra nor the donation — it is the same intent, performed once with full procedure.`,
          `इस अभ्यास का संकेन्द्रित रूप है ${mangal.remedy_puja_name}। यह न वार-मंत्र का स्थान लेती है न दान का — यह वही भाव है, एक बार पूर्ण विधि से किया गया।`)
        : t(lang, "Keep this page as a record. It states, with the measurement behind it, that no Mangal remedy is owed by you to anyone.",
          "इस पृष्ठ को प्रमाण के रूप में रखें। यह माप सहित यह बताता है कि आप पर किसी को कोई मंगल-उपाय देय नहीं है।"),
    ],
    bullets: mangal.detected ? mangal.remedies : [
      t(lang, `Mars weekday: ${weekdayFor("Mars", lang)} — devotional, not corrective, for this chart.`, `मंगल का वार: ${weekdayFor("Mars", lang)} — इस कुंडली के लिए भक्ति-भाव, सुधार नहीं।`),
      t(lang, `Mars beej mantra, if wanted: ${mantraFor("Mars", lang)}`, `मंगल बीज मंत्र, यदि इच्छा हो: ${mantraFor("Mars", lang)}`),
      t(lang, `Red coral (Moonga) is the Mars stone — do not wear it on the strength of a dosh you do not have.`, `मूंगा मंगल का रत्न है — जो दोष है ही नहीं, उसके आधार पर इसे धारण न करें।`),
      t(lang, "No Kumbh Vivaah, no Mangal-nivaran ritual and no matching restriction applies to you.", "आप पर न कुम्भ विवाह, न मंगल-निवारण अनुष्ठान, न कोई मिलान-प्रतिबंध लागू होता है।"),
    ],
    summary: mangal.detected
      ? t(lang, `${mangal.remedies.length} Mars practices, weighted by effort.`, `${mangal.remedies.length} मंगल-उपाय, श्रम के क्रम में।`)
      : t(lang, "No Mangal remedy is indicated by this chart.", "इस कुंडली से कोई मंगल-उपाय निर्दिष्ट नहीं होता।"),
    dosh_ids: ["mangal_dosh"],
  });

  // ── 8 Kaal Sarp ────────────────────────────────────────────────────────────
  const ks = C.kaal_sarp_dosh;
  S.push(chartPage({
    id: "kaal_sarp_check", page: 8,
    title: PAGE(lang, "Kaal Sarp Dosh — Full Check", "काल सर्प दोष — पूर्ण जाँच"),
    subtitle: ks.detected ? t(lang, `Present · ${ks.severity}/100`, `उपस्थित · ${ks.severity}/100`) : t(lang, "Not present", "अनुपस्थित"),
    status: statusOf(ks.detected, ks.severity, ks.cancelled),
    body: [
      ks.rule,
      ks.short_description,
      ks.detected ? ks.what_to_be_aware_of : (ks.why_not || ""),
    ],
    bullets: [
      ...ctx.placements.filter((p) => !["Rahu", "Ketu"].includes(p.planet_en))
        .map((p) => t(lang, `${p.planet} — ${p.sign}, house ${p.house}`, `${p.planet} — ${p.sign}, भाव ${p.house}`)),
      t(lang, `Rahu — ${sg(ctx.rahu?.sign, lang)}, house ${ctx.rahu?.house ?? "—"} · Ketu — ${sg(ctx.ketu?.sign, lang)}, house ${ctx.ketu?.house ?? "—"}`,
        `राहु — ${sg(ctx.rahu?.sign, lang)}, भाव ${ctx.rahu?.house ?? "—"} · केतु — ${sg(ctx.ketu?.sign, lang)}, भाव ${ctx.ketu?.house ?? "—"}`),
    ],
    summary: ks.detected
      ? t(lang, "All seven planets fall on one side of the nodal axis.", "सातों ग्रह नोड-अक्ष के एक ही ओर पड़ते हैं।")
      : t(lang, "Planets fall on both sides of the nodal axis, so the yoga does not close.", "ग्रह नोड-अक्ष के दोनों ओर हैं, अतः योग बनता ही नहीं।"),
    dosh_ids: ["kaal_sarp_dosh"],
  }));

  // ── 9-11 Pitru ─────────────────────────────────────────────────────────────
  const pitru = C.pitru_dosh;
  const ninth = ctx.houses.find((h) => h.house === 9);
  S.push(chartPage({
    id: "pitru_formation", page: 9,
    title: PAGE(lang, "Pitru Dosh — Formation", "पितृ दोष — निर्माण"),
    subtitle: pitru.detected ? t(lang, `Present · ${pitru.severity}/100`, `उपस्थित · ${pitru.severity}/100`) : t(lang, "Not present", "अनुपस्थित"),
    status: statusOf(pitru.detected, pitru.severity, pitru.cancelled),
    body: [
      pitru.rule,
      pitru.short_description,
      t(lang,
        `The two tests are independent: the Sun can be afflicted while the 9th house is clean, or the reverse. Your 9th house falls in ${sg(ninth?.sign, lang)}, ruled by ${pl(ninth?.lord, lang)}, and holds ${ninth?.occupants?.length ? joinList(ninth.occupants.map((n) => pl(n, lang)), lang) : t(lang, "no planet", "कोई ग्रह नहीं")}.`,
        `दोनों परीक्षण स्वतंत्र हैं: सूर्य पीड़ित हो सकता है जबकि नवम भाव शुद्ध हो, अथवा इसके विपरीत। आपका नवम भाव ${sg(ninth?.sign, lang)} में है, स्वामी ${pl(ninth?.lord, lang)}, और उसमें ${ninth?.occupants?.length ? joinList(ninth.occupants.map((n) => pl(n, lang)), lang) : "कोई ग्रह नहीं"} है।`),
    ],
    bullets: [
      t(lang, `Sun: ${ctx.sun ? `${sg(ctx.sun.sign, lang)} ${deg(ctx.sun.degree)}, house ${ctx.sun.house}` : "—"}`, `सूर्य: ${ctx.sun ? `${sg(ctx.sun.sign, lang)} ${deg(ctx.sun.degree)}, भाव ${ctx.sun.house}` : "—"}`),
      t(lang, `9th house: ${sg(ninth?.sign, lang)}, lord ${pl(ninth?.lord, lang)}`, `नवम भाव: ${sg(ninth?.sign, lang)}, स्वामी ${pl(ninth?.lord, lang)}`),
      t(lang, "Affliction orb used for the Sun: 15°", "सूर्य हेतु प्रयुक्त पीड़ा-सीमा: 15°"),
      t(lang, `Verdict: ${pitru.detected ? `forms, ${pitru.severity}/100` : "does not form"}`, `निर्णय: ${pitru.detected ? `बनता है, ${pitru.severity}/100` : "नहीं बनता"}`),
    ],
    summary: pitru.detected
      ? t(lang, "The ancestral flag is raised by measurement, not by assumption.", "पितृ-संकेत अनुमान से नहीं, माप से उठा है।")
      : t(lang, "Neither the Sun nor the 9th house carries the affliction the rule requires.", "न सूर्य पर, न नवम भाव पर वह पीड़ा है जो नियम माँगता है।"),
    dosh_ids: ["pitru_dosh"],
  }));

  S.push({
    id: "pitru_affects", page: 10,
    title: PAGE(lang, "Pitru Dosh — What It Affects", "पितृ दोष — किन क्षेत्रों पर प्रभाव"),
    subtitle: pitru.detected ? t(lang, `Life area: ${pitru.affects}`, `जीवन क्षेत्र: ${pitru.affects}`) : t(lang, "Not applicable to this chart", "इस कुंडली पर लागू नहीं"),
    body: [
      pitru.what_does_this_mean,
      pitru.detected ? pitru.what_to_be_aware_of : pitru.what_to_be_aware_of,
      pitru.detected
        ? t(lang,
          "One correction worth making: Pitru Dosh is not a claim that your ancestors did something wrong. It is read as an unfinished obligation in the lineage, and the classical response is offering rather than atonement.",
          "एक बात स्पष्ट कर लेना उचित है: पितृ दोष यह नहीं कहता कि आपके पूर्वजों ने कोई अपराध किया। इसे वंश में शेष रह गए किसी दायित्व के रूप में पढ़ा जाता है, और शास्त्रोक्त उत्तर प्रायश्चित नहीं, अर्पण है।")
        : t(lang,
          "Ancestral rites remain worth doing regardless of this verdict — Pitru Paksha and Amavasya tarpan are practices of remembrance, not remedies for a defect. Nothing on this page is owed by you.",
          "इस निर्णय से स्वतंत्र, पितृ-कर्म फिर भी करने योग्य हैं — पितृ पक्ष और अमावस्या का तर्पण स्मरण के आचार हैं, किसी दोष के उपाय नहीं। इस पृष्ठ पर आप पर कुछ भी देय नहीं है।"),
    ],
    bullets: ([
        t(lang, "Paternal relationship and the father's health.", "पिता से संबंध तथा उनका स्वास्थ्य।"),
        t(lang, "Continuity in the family line — childbirth, adoption, family property.", "वंश की निरंतरता — संतान, गोद, पैतृक संपत्ति।"),
        t(lang, "Recurring obstacles that repeat across generations rather than arriving once.", "वे बाधाएँ जो एक बार नहीं, पीढ़ी-दर-पीढ़ी दोहराई जाती हैं।"),
        t(lang, `9th house of dharma and fortune, here ruled by ${pl(ninth?.lord, lang)}.`, `धर्म और भाग्य का नवम भाव, जिसका स्वामी यहाँ ${pl(ninth?.lord, lang)} है।`),
    ]),
    summary: pitru.detected
      ? t(lang, "Family, lineage and the father's line are the areas this flag touches.", "यह संकेत परिवार, वंश और पितृ-पक्ष के क्षेत्रों को छूता है।")
      : t(lang, "No ancestral obstruction is indicated by the computed positions.", "गणना की गई स्थितियों से कोई पितृ-बाधा संकेतित नहीं होती।"),
    dosh_ids: ["pitru_dosh"],
  });

  S.push({
    id: "pitru_remedies", page: 11,
    title: PAGE(lang, "Pitru Dosh — Remedies", "पितृ दोष — उपाय"),
    subtitle: pitru.detected ? t(lang, "Offering, not atonement", "अर्पण, प्रायश्चित नहीं") : t(lang, "None required", "किसी उपाय की आवश्यकता नहीं"),
    body: [
      pitru.detected
        ? t(lang,
          `The ancestral remedies are seasonal rather than daily: Amavasya each month and the Pitru Paksha fortnight each year are the two fixed dates, and ${weekdayFor("Sun", lang)} is the Sun's weekday for the daily part.`,
          `पितृ-उपाय दैनिक नहीं, ऋतु-आधारित हैं: प्रत्येक माह की अमावस्या तथा प्रति वर्ष पितृ पक्ष — ये दो निश्चित तिथियाँ हैं, और दैनिक भाग के लिए ${weekdayFor("Sun", lang)} सूर्य का वार है।`)
        : t(lang,
          "No corrective ancestral rite is indicated for you. Shraddha and tarpan performed out of remembrance remain entirely appropriate; what is not appropriate is being sold a Pitru-dosh nivaran on this chart.",
          "आपके लिए कोई सुधारात्मक पितृ-कर्म निर्दिष्ट नहीं है। स्मरण-भाव से किया गया श्राद्ध और तर्पण पूर्णतः उचित है; अनुचित यह है कि इस कुंडली पर आपको पितृ-दोष निवारण बेचा जाए।"),
      pitru.detected
        ? t(lang,
          "The classical instruction is to give in a way that cannot be repaid — a meal to someone who cannot return it, a donation made without the giver being named. That, not the size of the ritual, is the mechanism.",
          "शास्त्रीय निर्देश यह है कि दान ऐसे दिया जाए जिसका बदला संभव न हो — ऐसे व्यक्ति को भोजन जो लौटा न सके, ऐसा दान जिसमें देने वाले का नाम न हो। विधि की भव्यता नहीं, यही वास्तविक तंत्र है।")
        : t(lang,
          "If you keep the ancestral fortnight anyway — many families do — treat it as continuity rather than correction. The report has nothing to add to it.",
          "यदि आप फिर भी पितृ पक्ष निभाते हैं — कई परिवार निभाते हैं — तो उसे सुधार नहीं, परंपरा की निरंतरता मानें। रिपोर्ट को इसमें कुछ जोड़ना नहीं है।"),
      pitru.detected
        ? t(lang, `The concentrated form is ${pitru.remedy_puja_name}, performed once with full procedure — ideally during Pitru Paksha rather than at an arbitrary time.`,
          `इसका संकेन्द्रित रूप है ${pitru.remedy_puja_name}, जो पूर्ण विधि से एक बार किया जाता है — यथासंभव किसी भी समय नहीं, पितृ पक्ष में।`)
        : t(lang, "Keep this page with the summary page; together they are the record that no ancestral remedy is outstanding from you.",
          "इस पृष्ठ को सारांश पृष्ठ के साथ रखें; दोनों मिलकर यह प्रमाण हैं कि आप पर कोई पितृ-उपाय शेष नहीं है।"),
    ],
    bullets: pitru.detected ? pitru.remedies : [
      t(lang, "Amavasya tarpan — remembrance, open to everyone, dosh or no dosh.", "अमावस्या तर्पण — स्मरण का आचार, दोष हो या न हो, सबके लिए खुला।"),
      t(lang, "Pitru Paksha shraddha — the annual family observance, unchanged by this report.", "पितृ पक्ष श्राद्ध — वार्षिक पारिवारिक आचार, इस रिपोर्ट से अपरिवर्तित।"),
      t(lang, `Sun's weekday is ${weekdayFor("Sun", lang)} — offering water at sunrise is devotional here, not remedial.`, `सूर्य का वार ${weekdayFor("Sun", lang)} है — सूर्योदय पर जल अर्पण यहाँ भक्ति है, उपाय नहीं।`),
      t(lang, "No Gaya shraddha, Narayan Bali or dosh-nivaran ritual is indicated by these positions.", "इन स्थितियों से न गया श्राद्ध, न नारायण बलि, न कोई दोष-निवारण अनुष्ठान निर्दिष्ट होता है।"),
    ],
    summary: pitru.detected
      ? t(lang, `${pitru.remedies.length} ancestral practices, anchored to two fixed dates.`, `${pitru.remedies.length} पितृ-उपाय, दो निश्चित तिथियों पर आधारित।`)
      : t(lang, "No ancestral remedy is indicated by this chart.", "इस कुंडली से कोई पितृ-उपाय निर्दिष्ट नहीं होता।"),
    dosh_ids: ["pitru_dosh"],
  });

  // ── 12-14 the match-making kootas ──────────────────────────────────────────
  for (const [page, id, titleEn, titleHi] of [
    [12, "nadi_dosh", "Nadi Dosh", "नाड़ी दोष"],
    [13, "bhakoot_dosh", "Bhakoot Dosh", "भकूट दोष"],
    [14, "gana_dosh", "Gana Dosh", "गण दोष"],
  ]) {
    const c = C[id];
    S.push({
      id: `${id}_page`, page,
      title: PAGE(lang, titleEn, titleHi),
      subtitle: t(lang, "A two-chart rule — stated for you, settled at matching", "दो-कुंडली नियम — आपकी स्थिति यहाँ, निर्णय मिलान के समय"),
      body: [c.rule, c.short_description, c.why_not, c.what_does_this_mean].filter(Boolean),
      bullets: [
        t(lang, `Your value: ${c.short_description.split(/[.।]/)[0]}`, `आपका मान: ${c.short_description.split(/[.।]/)[0]}`),
        t(lang, `Points at stake in Ashtakoot: ${id === "nadi_dosh" ? "8" : id === "bhakoot_dosh" ? "7" : "6"} of 36`, `अष्टकूट में दाँव पर गुण: 36 में से ${id === "nadi_dosh" ? "8" : id === "bhakoot_dosh" ? "7" : "6"}`),
        t(lang, `Would form only against: ${joinList((c.partner_risk || []).map((x) => (id === "nadi_dosh" ? nk(x, lang) : id === "bhakoot_dosh" ? sg(x, lang) : x)), lang, "or") || "—"}`,
          `केवल इनके साथ बनेगा: ${joinList((c.partner_risk || []).map((x) => (id === "nadi_dosh" ? nk(x, lang) : id === "bhakoot_dosh" ? sg(x, lang) : x)), lang, "या") || "—"}`),
        id === "nadi_dosh"
          ? t(lang, "Verdict from your chart alone: your Nadi is fixed, the dosh is not — it needs a second Moon to exist at all.",
            "केवल आपकी कुंडली से निर्णय: आपकी नाड़ी निश्चित है, दोष नहीं — उसके अस्तित्व के लिए दूसरा चंद्रमा चाहिए।")
          : id === "bhakoot_dosh"
            ? t(lang, "Verdict from your chart alone: your Moon sign is fixed, the axis is not — the axis only exists between two Moon signs.",
              "केवल आपकी कुंडली से निर्णय: आपकी चंद्र-राशि निश्चित है, स्थिति नहीं — वह स्थिति दो चंद्र-राशियों के बीच ही बनती है।")
            : t(lang, "Verdict from your chart alone: your Gana is fixed, the pairing is not — the dosh is a comparison, never a property of one chart.",
              "केवल आपकी कुंडली से निर्णय: आपका गण निश्चित है, जोड़ा नहीं — यह दोष तुलना है, किसी एक कुंडली का गुण नहीं।"),
      ],
      summary: c.what_to_be_aware_of,
      dosh_ids: [id],
    });
  }

  // ── 15 Kemadruma ───────────────────────────────────────────────────────────
  const kem = C.kemadruma_dosh;
  S.push(chartPage({
    id: "kemadruma_page", page: 15,
    title: PAGE(lang, "Kemadruma Dosh", "केमद्रुम दोष"),
    subtitle: kem.detected ? t(lang, `Present · ${kem.severity}/100`, `उपस्थित · ${kem.severity}/100`) : t(lang, "Not present", "अनुपस्थित"),
    status: statusOf(kem.detected, kem.severity, kem.cancelled),
    body: [kem.rule, kem.short_description, kem.detected ? kem.what_to_be_aware_of : (kem.why_not || "")].filter(Boolean),
    bullets: (() => {
      const moon = ctx.moon;
      if (!moon) return [t(lang, "Moon position unavailable.", "चंद्रमा की स्थिति उपलब्ध नहीं।")];
      const second = (moon.house % 12) + 1;
      const twelfth = ((moon.house + 10) % 12) + 1;
      const occ = (h) => ctx.planets.filter((p) => p.house === h && p.name !== "Moon").map((p) => pl(p.name, lang));
      return [
        t(lang, `Moon: ${sg(moon.sign, lang)} ${deg(moon.degree)}, house ${moon.house}`, `चंद्र: ${sg(moon.sign, lang)} ${deg(moon.degree)}, भाव ${moon.house}`),
        t(lang, `House ${twelfth} (12th from Moon): ${occ(twelfth).length ? joinList(occ(twelfth), lang) : "empty"}`, `भाव ${twelfth} (चंद्र से द्वादश): ${occ(twelfth).length ? joinList(occ(twelfth), lang) : "रिक्त"}`),
        t(lang, `House ${second} (2nd from Moon): ${occ(second).length ? joinList(occ(second), lang) : "empty"}`, `भाव ${second} (चंद्र से द्वितीय): ${occ(second).length ? joinList(occ(second), lang) : "रिक्त"}`),
        t(lang, `With the Moon: ${occ(moon.house).length ? joinList(occ(moon.house), lang) : "no planet"}`, `चंद्र के साथ: ${occ(moon.house).length ? joinList(occ(moon.house), lang) : "कोई ग्रह नहीं"}`),
      ];
    })(),
    summary: kem.detected
      ? t(lang, "The Moon stands without planetary neighbours on either side.", "चंद्रमा के दोनों ओर कोई ग्रह-पड़ोसी नहीं है।")
      : t(lang, "The Moon has support, so the isolation the yoga describes does not occur.", "चंद्रमा को सहारा प्राप्त है, अतः इस योग का वर्णित एकाकीपन बनता ही नहीं।"),
    dosh_ids: ["kemadruma_dosh"],
  }));

  // ── 16 the shadow conjunctions ─────────────────────────────────────────────
  const shadow = ["grahan_dosh", "guru_chandal_dosh", "angarak_dosh", "shrapit_dosh"].map((id) => C[id]);
  const shadowPresent = shadow.filter((c) => c.detected);
  S.push(chartPage({
    id: "shadow_conjunctions", page: 16,
    title: PAGE(lang, "Grahan, Guru Chandal & Angarak", "ग्रहण, गुरु चांडाल और अंगारक"),
    subtitle: shadowPresent.length
      ? t(lang, `${shadowPresent.length} of 4 present`, `4 में से ${shadowPresent.length} उपस्थित`)
      : t(lang, "All four absent", "चारों अनुपस्थित"),
    body: [
      t(lang,
        "These four doshas share one mechanism: a shadow planet — Rahu or Ketu — joined to something else. Grahan takes a luminary, Guru Chandal takes Jupiter, Angarak takes Mars and Shrapit takes Saturn. In each case the test is the same two-part classical one: the two either share a sign, or fall within the orb. Both halves are checked below.",
        "इन चारों दोषों का तंत्र एक ही है: छाया ग्रह — राहु अथवा केतु — का किसी अन्य से जुड़ जाना। ग्रहण प्रकाशक को पकड़ता है, गुरु चांडाल गुरु को, अंगारक मंगल को और श्रापित शनि को। प्रत्येक की परीक्षा वही दो-भागीय शास्त्रीय नियम है: या तो दोनों एक ही राशि में हों, या निर्धारित सीमा के भीतर। नीचे दोनों भाग जाँचे गए हैं।"),
      shadowPresent.length
        ? t(lang,
          `Present here: ${joinList(shadowPresent.map((c) => `${c.name} (${c.severity}/100)`), lang)}. Each is listed below with the measured separation that produced it.`,
          `यहाँ उपस्थित: ${joinList(shadowPresent.map((c) => `${c.name} (${c.severity}/100)`), lang)}। नीचे प्रत्येक के साथ वह मापा गया अंतर दिया गया है जिससे वह बना।`)
        : t(lang,
          "None of the four forms in this chart. All four separations were measured and every one of them is wider than the orb its rule requires.",
          "इस कुंडली में चारों में से कोई नहीं बनता। चारों अंतर मापे गए और प्रत्येक अपने नियम की निर्धारित सीमा से अधिक निकला।"),
      shadowPresent.length
        ? shadowPresent[0].what_to_be_aware_of
        : t(lang,
          "This matters commercially: Grahan and Guru Chandal are among the most frequently claimed doshas in paid consultations precisely because they sound severe. On your chart, none of them is available to claim.",
          "व्यावहारिक दृष्टि से यह महत्वपूर्ण है: सशुल्क परामर्श में ग्रहण और गुरु चांडाल का दावा सबसे अधिक इसीलिए किया जाता है क्योंकि ये सुनने में गंभीर लगते हैं। आपकी कुंडली पर इनमें से किसी का दावा संभव ही नहीं।"),
    ],
    bullets: shadow.map((c) => `${c.name} — ${c.detected ? t(lang, `present, ${c.severity}/100`, `उपस्थित, ${c.severity}/100`) : t(lang, "absent", "अनुपस्थित")} · ${c.short_description}`),
    summary: shadowPresent.length
      ? t(lang, `${shadowPresent.length} shadow conjunction${shadowPresent.length === 1 ? "" : "s"} measured inside orb.`, `${shadowPresent.length} छाया-युति सीमा के भीतर मापी गई।`)
      : t(lang, "No shadow conjunction falls inside its orb in this chart.", "इस कुंडली में कोई भी छाया-युति अपनी सीमा के भीतर नहीं आती।"),
    dosh_ids: ["grahan_dosh", "guru_chandal_dosh", "angarak_dosh", "shrapit_dosh"],
  }));

  // ── 17-18 Sade Sati ────────────────────────────────────────────────────────
  const ss = ctx.sadeSati;
  const sade = C.sade_sati;
  const phaseBullets = (ss?.phases || []).map((p) => {
    const nameHi = { Aroh: "आरोह", Madhya: "मध्य", Avaroh: "अवरोह" }[p.name] || p.name;
    const statusHi = { past: "बीत चुका", active: "चल रहा", future: "आगामी" }[p.status] || p.status;
    return t(lang,
      `${p.name} — Saturn in ${sg(p.saturnSign, lang)}, ${p.startDate} to ${p.endDate} (${p.status}${p.status === "active" ? `, ${p.progressPercent}% through` : ""})`,
      `${nameHi} — शनि ${sg(p.saturnSign, lang)} में, ${p.startDate} से ${p.endDate} (${statusHi}${p.status === "active" ? `, ${p.progressPercent}% पूर्ण` : ""})`);
  });
  S.push({
    id: "sade_sati_phase", page: 17,
    title: PAGE(lang, "Shani Sade Sati — Current Phase", "शनि साढ़े साती — वर्तमान चरण"),
    subtitle: ss?.active
      ? t(lang, `Active — ${ss.currentPhase} phase`, `सक्रिय — ${ss.currentPhase} चरण`)
      : t(lang, "Not currently running", "इस समय नहीं चल रही"),
    body: [
      sade.short_description,
      ss?.active
        ? t(lang,
          `You are ${ss.overallProgress}% through the passage with ${ss.daysRemaining} days remaining of ${ss.totalDays}. That figure matters more than the label: the second half of Sade Sati behaves very differently from the first, and remedies started late still land in the rebuilding half.`,
          `आप इस अवधि का ${ss.overallProgress}% पूर्ण कर चुके हैं; कुल ${ss.totalDays} दिनों में से ${ss.daysRemaining} दिन शेष हैं। यह आँकड़ा नाम से अधिक महत्वपूर्ण है: साढ़े साती का उत्तरार्ध पूर्वार्ध से बहुत भिन्न होता है, और देर से आरंभ किए गए उपाय भी पुनर्निर्माण वाले भाग में फल देते हैं।`)
        : t(lang,
          `Saturn is not on the Sade Sati axis for you today. If a prediction has been sold to you on the basis of a running Sade Sati, this page and the dates below are what to check it against.`,
          `आज आपके लिए शनि साढ़े साती के अक्ष पर नहीं है। यदि आपको चलती हुई साढ़े साती बताकर कोई भविष्यवाणी बेची गई है, तो यही पृष्ठ और नीचे दी गई तिथियाँ उसे परखने का आधार हैं।`),
      ss?.startDate
        ? t(lang,
          `The window nearest today for a ${sg(ctx.moonSign, lang)} Moon is dated ${ss.startDate} to ${ss.endDate}, computed by tracking Saturn's sign changes day by day rather than by rounding to a 30-month rule of thumb.`,
          `${sg(ctx.moonSign, lang)} चंद्र-राशि के लिए आज के निकटतम अवधि की तिथियाँ ${ss.startDate} से ${ss.endDate} हैं, जो 30 महीने के अनुमान से नहीं, बल्कि शनि के राशि-परिवर्तन को दिन-प्रतिदिन ट्रैक करके निकाली गई हैं।`)
        : t(lang,
          `No Sade Sati window falls within the five-year search on either side of today for a ${sg(ctx.moonSign, lang)} Moon.`,
          `${sg(ctx.moonSign, lang)} चंद्र-राशि के लिए आज से पाँच वर्ष आगे-पीछे की खोज में कोई साढ़े साती अवधि नहीं मिलती।`),
    ],
    bullets: phaseBullets.length ? phaseBullets : [
      t(lang, `Natal Moon: ${sg(ctx.moonSign, lang)}`, `जन्म चंद्र: ${sg(ctx.moonSign, lang)}`),
      t(lang, `Transit Saturn: ${sg(ctx.saturnTransitSign, lang)}`, `गोचर शनि: ${sg(ctx.saturnTransitSign, lang)}`),
      t(lang, `Distance from Moon: ${ctx.saturnFromMoon ? od(ctx.saturnFromMoon, lang) : "—"} sign (Sade Sati needs the 12th, 1st or 2nd)`, `चंद्र से दूरी: ${ctx.saturnFromMoon ? od(ctx.saturnFromMoon, lang) : "—"} राशि (साढ़े साती हेतु 12वीं, 1वीं या 2वीं आवश्यक)`),
    ],
    summary: ss?.active
      ? t(lang, `Running — ${ss.currentPhase} phase, ${ss.overallProgress}% complete.`, `चल रही है — ${ss.currentPhase} चरण, ${ss.overallProgress}% पूर्ण।`)
      : t(lang, "Sade Sati is not running for you at present.", "इस समय आपके लिए साढ़े साती नहीं चल रही।"),
    dosh_ids: ["sade_sati"],
  });

  S.push({
    id: "sade_sati_effects", page: 18,
    title: PAGE(lang, "Sade Sati — What It Actually Does", "साढ़े साती — वास्तव में क्या करती है"),
    subtitle: PAGE(lang, "Separating the mechanism from the folklore", "तंत्र और लोक-मान्यता का अंतर"),
    body: [
      t(lang,
        "Saturn's work in this passage is subtraction. It removes what was being carried without being used — a role held out of habit, a friendship running on obligation, an expense nobody had reviewed. What is experienced as misfortune is usually the removal itself, not its outcome.",
        "इस अवधि में शनि का कार्य घटाना है। वह उसे हटाता है जो बिना उपयोग के ढोया जा रहा था — आदतवश निभाया गया कोई पद, दायित्व के बोझ से चलती कोई मित्रता, वह व्यय जिसकी किसी ने समीक्षा ही नहीं की। जिसे दुर्भाग्य समझा जाता है, वह प्रायः यह हटना ही होता है, उसका परिणाम नहीं।"),
      ctx.moon
        ? t(lang,
          `Because the passage is measured from the natal Moon and yours sits in ${oh(ctx.moon.house, lang)}, that is where the pressure is felt earliest and where the discipline is demanded first. The Moon's house, not the ascendant's, sets the address for a Saturn transit.`,
          `यह अवधि जन्म-चंद्र से मापी जाती है और आपका चंद्रमा ${oh(ctx.moon.house, lang)} में है, अतः दबाव सबसे पहले वहीं अनुभव होता है और अनुशासन की माँग भी वहीं से आती है। शनि-गोचर का पता लग्न का भाव नहीं, चंद्रमा का भाव तय करता है।`)
        : t(lang, "The passage is measured from the natal Moon, so the house the Moon occupies is where the pressure lands first.", "यह अवधि जन्म-चंद्र से मापी जाती है, अतः चंद्रमा जिस भाव में हो, दबाव सबसे पहले वहीं पड़ता है।"),
      t(lang,
        "What it does not do: it does not cause accidents, it does not void marriages, and it does not respond to being paid off. Sleep, food and a fixed daily routine move the needle further than any single ritual — the classical remedies work largely by enforcing exactly that discipline.",
        "यह क्या नहीं करती: यह दुर्घटना नहीं कराती, विवाह नहीं तोड़ती, और धन देकर टाली नहीं जा सकती। निद्रा, आहार और नियत दिनचर्या किसी भी एक अनुष्ठान से अधिक अंतर लाते हैं — शास्त्रोक्त उपाय भी मुख्यतः इसी अनुशासन को लागू कराकर काम करते हैं।"),
    ],
    bullets: [
      t(lang, "Rising (Aroh) — Saturn in the 12th from Moon: expenses, sleep, travel and things ending quietly.", "आरोह — चंद्र से द्वादश में शनि: व्यय, निद्रा, यात्रा और चुपचाप समाप्त होती बातें।"),
      t(lang, "Peak (Madhya) — Saturn on the Moon: identity, health and mental stamina under direct review.", "मध्य — चंद्रमा पर शनि: पहचान, स्वास्थ्य और मानसिक सहनशक्ति की सीधी परीक्षा।"),
      t(lang, "Setting (Avaroh) — Saturn in the 2nd from Moon: money, family and speech; the rebuilding half.", "अवरोह — चंद्र से द्वितीय में शनि: धन, परिवार और वाणी; पुनर्निर्माण का भाग।"),
      t(lang, "It arrives roughly three times in a full lifespan — the first is usually hardest because it is unfamiliar.", "पूरे जीवन में यह लगभग तीन बार आती है — पहली बार सबसे कठिन लगती है क्योंकि वह अपरिचित होती है।"),
    ],
    summary: t(lang, "Sade Sati removes what is unused and rewards routine; it is a structural period, not a curse.",
      "साढ़े साती वही हटाती है जो अनुपयोगी है और दिनचर्या को फल देती है; यह व्यवस्था का काल है, कोई शाप नहीं।"),
    dosh_ids: ["sade_sati"],
  });

  // ── 19 Shani Dhaiya ────────────────────────────────────────────────────────
  const dh = C.shani_dhaiya;
  S.push({
    id: "shani_dhaiya_page", page: 19,
    title: PAGE(lang, "Shani Dhaiya", "शनि ढैया"),
    subtitle: dh.detected ? t(lang, `Running · ${dh.severity}/100`, `चल रही · ${dh.severity}/100`) : t(lang, "Not running", "नहीं चल रही"),
    body: [dh.rule, dh.short_description, dh.what_does_this_mean, dh.detected ? dh.what_to_be_aware_of : (dh.why_not || "")].filter(Boolean),
    bullets: [
      t(lang, `Natal Moon: ${sg(ctx.moonSign, lang)} · Transit Saturn: ${sg(ctx.saturnTransitSign, lang)}`, `जन्म चंद्र: ${sg(ctx.moonSign, lang)} · गोचर शनि: ${sg(ctx.saturnTransitSign, lang)}`),
      t(lang, `Saturn stands ${ctx.saturnFromMoon ? od(ctx.saturnFromMoon, lang) : "—"} from the Moon; Dhaiya needs the 4th or the 8th.`, `शनि चंद्रमा से ${ctx.saturnFromMoon ? od(ctx.saturnFromMoon, lang) : "—"} है; ढैया हेतु चतुर्थ अथवा अष्टम आवश्यक है।`),
      t(lang, `4th from your Moon: ${sg(signAtOffset(ctx.moonSign, 4), lang)} · 8th from your Moon: ${sg(signAtOffset(ctx.moonSign, 8), lang)}`, `आपके चंद्र से चतुर्थ: ${sg(signAtOffset(ctx.moonSign, 4), lang)} · अष्टम: ${sg(signAtOffset(ctx.moonSign, 8), lang)}`),
      t(lang, "Duration when it runs: about two and a half years — one Saturn sign.", "जब चलती है तब अवधि: लगभग ढाई वर्ष — शनि की एक राशि।"),
    ],
    summary: dh.detected
      ? t(lang, "Dhaiya is open on the 4th/8th axis and is the shorter of the two Saturn windows.", "ढैया चतुर्थ/अष्टम अक्ष पर खुली है और शनि की दोनों अवधियों में छोटी है।")
      : t(lang, "Neither the 4th nor the 8th from your Moon holds Saturn today.", "आज आपके चंद्र से न चतुर्थ में शनि है, न अष्टम में।"),
    dosh_ids: ["shani_dhaiya"],
  });

  // ── 20 Chandra ─────────────────────────────────────────────────────────────
  const ch = C.chandra_dosh;
  S.push(chartPage({
    id: "chandra_page", page: 20,
    title: PAGE(lang, "Chandra Dosh & Mental Weather", "चंद्र दोष और मानसिक स्थिति"),
    subtitle: ch.detected ? t(lang, `Present · ${ch.severity}/100`, `उपस्थित · ${ch.severity}/100`) : t(lang, "Not present", "अनुपस्थित"),
    status: statusOf(ch.detected, ch.severity, ch.cancelled),
    body: [ch.rule, ch.short_description, ch.what_does_this_mean, ch.what_to_be_aware_of].filter(Boolean),
    bullets: [
      t(lang, `Moon: ${ctx.moon ? `${sg(ctx.moon.sign, lang)} ${deg(ctx.moon.degree)}, house ${ctx.moon.house}, ${nk(ctx.moon.nakshatra, lang)}` : "—"}`,
        `चंद्र: ${ctx.moon ? `${sg(ctx.moon.sign, lang)} ${deg(ctx.moon.degree)}, भाव ${ctx.moon.house}, ${nk(ctx.moon.nakshatra, lang)}` : "—"}`),
      t(lang, `Distance from the Sun: ${ctx.elongation != null ? `${Math.round(ctx.elongation)}°` : "—"} — under 72° is a Kshina (weak) Moon.`,
        `सूर्य से दूरी: ${ctx.elongation != null ? `${Math.round(ctx.elongation)}°` : "—"} — 72° से कम होने पर चंद्रमा क्षीण माना जाता है।`),
      t(lang, `Paksha at birth: ${ctx.panchang?.paksha || "—"} · tithi ${ctx.panchang?.tithi || "—"}`, `जन्म का पक्ष: ${termLoc(ctx.panchang?.paksha, "hi")} · तिथि ${tithiLoc(ctx.panchang?.tithi, "hi")}`),
      t(lang, `Affliction orbs used: Saturn 12°, Rahu and Ketu 10°.`, `प्रयुक्त पीड़ा-सीमाएँ: शनि 12°, राहु और केतु 10°।`),
    ],
    summary: ch.detected
      ? t(lang, `The Moon carries a measured affliction: ${joinList(ch.triggers || [], lang)}.`, `चंद्रमा पर मापी गई पीड़ा है: ${joinList(ch.triggers || [], lang)}।`)
      : t(lang, "The Moon is unafflicted within orb — emotional recovery is structurally intact.", "सीमा के भीतर चंद्रमा अपीड़ित है — भावनात्मक पुनर्प्राप्ति की क्षमता सुरक्षित है।"),
    dosh_ids: ["chandra_dosh"],
  }));

  // ── 21 Cancellations ───────────────────────────────────────────────────────
  const fired = cancellations.filter((c) => c.applies === true);
  const working = fired.filter((c) => c.dosh_present);
  const idle = fired.filter((c) => !c.dosh_present);
  const notFired = cancellations.filter((c) => c.applies === false);
  const pendingC = cancellations.filter((c) => c.applies === null);
  S.push({
    id: "cancellations_applied", page: 21,
    title: PAGE(lang, "Cancellations Applied", "लागू निवारण नियम"),
    subtitle: t(lang, `${fired.length} of ${cancellations.length} clauses fire`, `${cancellations.length} में से ${fired.length} नियम लागू`),
    body: [
      t(lang,
        "Every classical dosh comes with classical cancellations — clauses from the same texts that switch the dosh off when a particular planet is strong, aspected or well placed. All of them were tested here, and the ones that failed are shown too.",
        "प्रत्येक शास्त्रीय दोष के साथ शास्त्रीय निवारण भी आते हैं — उन्हीं ग्रंथों के नियम जो किसी ग्रह के बलवान, दृष्ट अथवा शुभ स्थित होने पर दोष को समाप्त कर देते हैं। यहाँ सभी परखे गए हैं, और जो लागू नहीं हुए वे भी दिखाए गए हैं।"),
      working.length
        ? t(lang,
          `${working.length} clause${working.length === 1 ? " is" : "s are"} doing real work on a dosh you actually carry: ${joinList([...new Set(working.map((c) => c.dosh))], lang)}. The severity scores already account for them.`,
          `${working.length} नियम वास्तव में उन दोषों पर काम कर रहे हैं जो आपकी कुंडली में हैं: ${joinList([...new Set(working.map((c) => c.dosh))], lang)}। गंभीरता के अंकों में इनका प्रभाव पहले ही सम्मिलित है।`)
        : t(lang,
          "No cancellation is currently reducing a dosh you carry — either the doshas present have no applicable clause, or none is present at all.",
          "इस समय कोई निवारण आपके किसी उपस्थित दोष को घटा नहीं रहा — या तो उपस्थित दोषों पर कोई नियम लागू नहीं होता, या कोई दोष उपस्थित ही नहीं है।"),
      idle.length
        ? t(lang,
          `A further ${idle.length} clause${idle.length === 1 ? " fires" : "s fire"} against ${joinList([...new Set(idle.map((c) => c.dosh))], lang)}, which never formed in your chart to begin with. They are printed because they are genuine protection: had the placement gone the other way, these would have cancelled it.`,
          `${idle.length} और नियम ${joinList([...new Set(idle.map((c) => c.dosh))], lang)} पर लागू होते हैं, जो आपकी कुंडली में बने ही नहीं। ये इसलिए छापे गए हैं क्योंकि ये वास्तविक सुरक्षा हैं: यदि ग्रह-स्थिति दूसरी होती तो ये उसे निरस्त कर देते।`)
        : t(lang,
          "No clause fires idly — every clause that fired is attached to a dosh that is actually present.",
          "कोई नियम निष्प्रयोजन लागू नहीं हुआ — जो भी लागू हुआ है वह किसी उपस्थित दोष से ही जुड़ा है।"),
      pendingC.length
        ? t(lang,
          `${pendingC.length} clauses are two-chart rules; they depend on a partner's horoscope and cannot be settled from yours alone. They are printed with the reasoning so you can apply them when a match is proposed.`,
          `${pendingC.length} नियम दो-कुंडली के हैं; वे जीवनसाथी की कुंडली पर निर्भर हैं और अकेली आपकी कुंडली से तय नहीं हो सकते। इन्हें तर्क सहित इसलिए दिया गया है कि संबंध प्रस्तावित होने पर आप स्वयं लागू कर सकें।`)
        : t(lang, "Every clause relevant here could be settled from your own horoscope.", "यहाँ प्रासंगिक प्रत्येक नियम आपकी अपनी कुंडली से ही तय हो गया।"),
    ],
    bullets: [
      ...working.map((c) => `${t(lang, "APPLIES", "लागू")} · ${c.dosh}: ${c.detail}`),
      ...idle.slice(0, 5).map((c) => `${t(lang, "would apply", "लागू होता")} · ${c.dosh}: ${c.detail}`),
      ...notFired.slice(0, 6).map((c) => `${t(lang, "does not apply", "लागू नहीं")} · ${c.dosh}: ${c.detail}`),
      ...pendingC.map((c) => `${t(lang, "needs partner chart", "जीवनसाथी की कुंडली अपेक्षित")} · ${c.dosh}: ${c.detail}`),
    ].slice(0, 18),
    summary: t(lang,
      `${working.length} cancellations actively reduce a dosh, ${idle.length} fire on doshas you do not have, ${notFired.length} were tested and do not apply, ${pendingC.length} need a partner's chart.`,
      `${working.length} निवारण किसी उपस्थित दोष को घटा रहे हैं, ${idle.length} उन दोषों पर लागू हैं जो हैं ही नहीं, ${notFired.length} परखे गए और लागू नहीं हुए, ${pendingC.length} के लिए जीवनसाथी की कुंडली आवश्यक है।`),
  });

  // ── 22 Timing ──────────────────────────────────────────────────────────────
  let windows = [];
  try {
    const birthUtc = ctx.kundliData?.calculationMeta?.birthUtc ? new Date(ctx.kundliData.calculationMeta.birthUtc) : null;
    if (ctx.moon && birthUtc) windows = buildDashaWindows({ moonLongitude: ctx.moon.longitude, birthUtc, years: 25, lookbackYears: 3 });
  } catch { windows = []; }
  const timeline = ctx.dashas?.vimshottariTimeline || [];
  const nextWindowFor = (planet) => {
    const ruled = windows.filter((w) => w.maha === planet || w.antar === planet);
    return ruled.find((w) => w.active) || ruled.find((w) => !w.past) || null;
  };
  const timingBullets = detected.map((d) => {
    const planet = String(d.planet_en || "").split(/[-\s]/)[0];
    const w = nextWindowFor(planet);
    const maha = timeline.find((x) => x.mahaDasha === planet);
    if (w) {
      return t(lang,
        `${d.name} (${d.planet}) — ${w.active ? "acting now" : "next acts"} in the ${pl(w.maha, "en")}/${pl(w.antar, "en")} period, ${w.start} to ${w.end}.`,
        `${d.name} (${d.planet}) — ${w.active ? "अभी सक्रिय" : "अगली बार सक्रिय"}, ${pl(w.maha, lang)}/${pl(w.antar, lang)} दशा में, ${w.start} से ${w.end} तक।`);
    }
    if (maha) {
      return t(lang,
        `${d.name} (${d.planet}) — its ${pl(planet, "en")} mahadasha runs ${maha.start} to ${maha.end}; no sub-period of that planet falls inside the next 25 years.`,
        `${d.name} (${d.planet}) — ${pl(planet, lang)} की महादशा ${maha.start} से ${maha.end} तक है; अगले 25 वर्षों में उस ग्रह की कोई अंतर्दशा नहीं आती।`);
    }
    return t(lang, `${d.name} (${d.planet}) — no period of its ruling planet falls inside the dated window computed for you.`,
      `${d.name} (${d.planet}) — आपके लिए निकाली गई तिथि-सीमा में इसके स्वामी ग्रह की कोई दशा नहीं आती।`);
  });
  for (const m of minorPatterns.filter((p) => p.detected)) {
    timingBullets.push(t(lang,
      `${m.name} — a secondary pattern; it colours the periods of ${m.planet} rather than driving them.`,
      `${m.name} — गौण योग; यह ${m.planet} की दशाओं को रंग देता है, उन्हें चलाता नहीं।`));
  }
  S.push({
    id: "timing", page: 22,
    title: PAGE(lang, "Timing — When Each Dosh Peaks", "समय — कौन सा दोष कब चरम पर होता है"),
    subtitle: t(lang, `Current period: ${pl(ctx.dashas?.currentMahaDasha, "en")} / ${pl(ctx.dashas?.currentAntarDasha, "en")}`,
      `वर्तमान दशा: ${pl(ctx.dashas?.currentMahaDasha, lang)} / ${pl(ctx.dashas?.currentAntarDasha, lang)}`),
    body: [
      t(lang,
        "A dosh is not switched on for a whole lifetime. In the Vimshottari system a planet delivers its results during its own mahadasha and antardasha, so a dosh formed by Mars is loud in a Mars period and quiet outside it. This single fact removes most of the dread a dosh report creates.",
        "कोई दोष जीवन भर चालू नहीं रहता। विंशोत्तरी पद्धति में ग्रह अपनी ही महादशा और अंतर्दशा में फल देता है, अतः मंगल से बना दोष मंगल की दशा में मुखर और उसके बाहर शांत रहता है। यह एक तथ्य ही दोष-रिपोर्ट से उपजे अधिकांश भय को हटा देता है।"),
      t(lang,
        `You are currently running the ${pl(ctx.dashas?.currentMahaDasha, "en")} mahadasha with ${pl(ctx.dashas?.currentAntarDasha, "en")} antardasha and ${pl(ctx.dashas?.currentPratyantarDasha, "en")} pratyantardasha. That combination, not the dosh list, is what is shaping this stretch of your life.`,
        `इस समय आपकी ${pl(ctx.dashas?.currentMahaDasha, lang)} महादशा, ${pl(ctx.dashas?.currentAntarDasha, lang)} अंतर्दशा तथा ${pl(ctx.dashas?.currentPratyantarDasha, lang)} प्रत्यंतर्दशा चल रही है। दोषों की सूची नहीं, यही संयोग आपके जीवन के इस दौर को आकार दे रहा है।`),
      detected.length
        ? t(lang,
          "The dated windows below are when the doshas you carry are able to act. Outside them the remedy routine can drop to maintenance level rather than intensive practice.",
          "नीचे दी गई तिथियाँ वे अवधियाँ हैं जब आपके दोष फल दे सकते हैं। उनके बाहर उपाय गहन अभ्यास के बजाय केवल नियमित स्तर पर रखे जा सकते हैं।")
        : t(lang,
          "With no dosh present, none of the dated periods below is a warning. The mahadasha sequence is printed so you can see how timing works and apply it to any future reading.",
          "कोई दोष उपस्थित न होने से नीचे दी गई कोई भी अवधि चेतावनी नहीं है। महादशा-क्रम इसलिए दिया गया है कि आप समय के इस तंत्र को समझ सकें और भविष्य के किसी भी फलादेश पर लागू कर सकें।"),
    ],
    bullets: timingBullets.length ? timingBullets : timeline.slice(0, 6).map((x) =>
      t(lang, `${pl(x.mahaDasha, "en")} mahadasha — ${x.start} to ${x.end}`, `${pl(x.mahaDasha, lang)} महादशा — ${x.start} से ${x.end}`)),
    summary: t(lang, "Doshas act inside their own planetary periods; outside them they are dormant.",
      "दोष अपनी ही दशाओं में फल देते हैं; उनके बाहर वे सुप्त रहते हैं।"),
    dosh_ids: detected.map((d) => d.id),
  });

  // ── 23 Daily remedies ──────────────────────────────────────────────────────
  const dailyBullets = detected.map((d) => {
    const planet = String(d.planet_en || "").split(/[-\s]/)[0];
    return t(lang,
      `${d.name}: chant "${mantraFor(planet, "en") || "the beej mantra of " + planet}" 108 times, at the same hour each day.`,
      `${d.name}: प्रतिदिन एक ही समय पर "${mantraFor(planet, "hi") || pl(planet, lang) + " का बीज मंत्र"}" का 108 बार जप करें।`);
  });
  S.push({
    id: "remedy_daily", page: 23,
    title: PAGE(lang, "Remedy Plan — Daily", "उपाय योजना — दैनिक"),
    subtitle: detected.length
      ? t(lang, `${detected.length} active ${detected.length === 1 ? "practice" : "practices"}, one sitting`, `${detected.length} सक्रिय उपाय, एक ही बैठक में`)
      : t(lang, "Maintenance practice only", "केवल नियमित अभ्यास"),
    body: [
      t(lang,
        "Remedies work by repetition at a fixed hour, not by expense. Ten minutes held for forty days does more than an elaborate ritual performed once, because what is being corrected is attention and routine.",
        "उपाय व्यय से नहीं, नियत समय पर दोहराव से काम करते हैं। चालीस दिन तक दस मिनट का अभ्यास एक बार किए गए भव्य अनुष्ठान से अधिक फल देता है, क्योंकि सुधार वास्तव में ध्यान और दिनचर्या का होता है।"),
      detected.length
        ? t(lang,
          `Your daily set is short because only ${detected.length} of the ${chapters.length} doshas checked is active. Do them in one sitting, ideally between sunrise and an hour after, heaviest planet first.`,
          `आपका दैनिक अभ्यास संक्षिप्त है क्योंकि जाँचे गए ${chapters.length} दोषों में से केवल ${detected.length} सक्रिय हैं। इन्हें एक ही बैठक में करें, यथासंभव सूर्योदय से एक घंटे के भीतर, और सबसे भारी ग्रह पहले।`)
        : t(lang,
          `Nothing here is corrective, because no dosh is active. What is listed is maintenance keyed to your ascendant lord ${pl(ctx.lagnaLord, lang)} and your Moon in ${sg(ctx.moonSign, lang)} — enough to keep a clean chart clean.`,
          `यहाँ कुछ भी सुधारात्मक नहीं है, क्योंकि कोई दोष सक्रिय नहीं है। जो दिया गया है वह आपके लग्नेश ${pl(ctx.lagnaLord, lang)} तथा ${sg(ctx.moonSign, lang)} स्थित चंद्रमा से जुड़ा नियमित अभ्यास है — शुद्ध कुंडली को शुद्ध बनाए रखने के लिए पर्याप्त।`),
      t(lang,
        "One rule holds regardless: pick the hour before you pick the practice. A remedy that moves around the day stops working, whatever the mantra is.",
        "एक नियम सदैव लागू है: उपाय चुनने से पहले समय चुनें। जो उपाय दिन में इधर-उधर खिसकता रहे, वह काम करना बंद कर देता है — मंत्र चाहे कोई भी हो।"),
    ],
    bullets: dailyBullets.length ? dailyBullets : [
      t(lang, `Offer water to the Sun at sunrise — the universal daily practice, and the one a ${sg(ctx.lagna, lang)} ascendant benefits from most.`,
        `सूर्योदय पर सूर्य को जल अर्पित करें — यह सर्वसामान्य दैनिक अभ्यास है, और ${sg(ctx.lagna, lang)} लग्न के लिए सर्वाधिक हितकर।`),
      t(lang, `Chant "${mantraFor(ctx.lagnaLord, "en") || "your ascendant lord's beej mantra"}" 108 times — strengthening the chart's ruler is the correct use of a clean chart.`,
        `"${mantraFor(ctx.lagnaLord, "hi") || "लग्नेश का बीज मंत्र"}" का 108 बार जप करें — शुद्ध कुंडली का सही उपयोग उसके स्वामी को बल देना है।`),
      t(lang, "Keep five minutes of silence before sleep — the Moon's own maintenance, and the cheapest insurance against a difficult transit later.",
        "सोने से पूर्व पाँच मिनट मौन रखें — यह चंद्रमा का अपना अभ्यास है, और आगे आने वाले कठिन गोचर के विरुद्ध सबसे सस्ता बीमा।"),
      t(lang, `Light a lamp on ${dayLoc(ctx.numerology?.luckyDay, "en") || "your chosen day"} — a fixed weekly anchor for the daily practice.`,
        `${dayLoc(ctx.numerology?.luckyDay, "hi") || "अपने चुने हुए दिन"} को दीपक जलाएँ — दैनिक अभ्यास के लिए एक निश्चित साप्ताहिक आधार।`),
    ],
    summary: t(lang, "Short, fixed-hour daily practice held for forty days — the format matters more than the length.",
      "नियत समय पर चालीस दिन तक किया गया संक्षिप्त दैनिक अभ्यास — अवधि से अधिक महत्वपूर्ण उसका ढाँचा है।"),
  });

  // ── 24 Weekly & annual ─────────────────────────────────────────────────────
  const weeklyBullets = detected.map((d) => {
    const planet = String(d.planet_en || "").split(/[-\s]/)[0];
    return t(lang,
      `${d.name}: keep ${weekdayFor(planet, "en")} as its day — a simple fast until sunset and a donation matched to ${d.planet}.`,
      `${d.name}: ${weekdayFor(planet, lang)} को इसका दिन मानें — सूर्यास्त तक सरल उपवास तथा ${d.planet} से संबंधित वस्तु का दान।`);
  });
  for (const m of minorPatterns.filter((p) => p.detected)) {
    weeklyBullets.push(t(lang, `${m.name}: one annual observance is sufficient — a secondary pattern does not need a weekly slot.`,
      `${m.name}: वर्ष में एक बार पर्याप्त है — गौण योग के लिए साप्ताहिक स्थान आवश्यक नहीं।`));
  }
  weeklyBullets.push(t(lang, "Amavasya: a meal given to someone who cannot return the favour — the monthly clearing, useful in every chart.",
    "अमावस्या: ऐसे व्यक्ति को भोजन जो बदला न दे सके — मासिक शुद्धि, हर कुंडली के लिए उपयोगी।"));
  weeklyBullets.push(t(lang, "Pitru Paksha: tarpan and a meal for the ancestors, whether or not Pitru Dosh is present.",
    "पितृ पक्ष: तर्पण और पितरों हेतु भोजन, पितृ दोष हो या न हो।"));
  weeklyBullets.push(t(lang, `Your birth nakshatra ${nk(ctx.moonNakshatra, "en")} returns every 27 days — the natural date to renew the longer practices.`,
    `आपका जन्म नक्षत्र ${nk(ctx.moonNakshatra, lang)} हर 27 दिन में लौटता है — दीर्घ अभ्यासों को नवीनीकृत करने की स्वाभाविक तिथि।`));
  S.push({
    id: "remedy_weekly_annual", page: 24,
    title: PAGE(lang, "Remedy Plan — Weekly & Annual", "उपाय योजना — साप्ताहिक और वार्षिक"),
    subtitle: PAGE(lang, "The slower cycle", "धीमा चक्र"),
    body: [
      t(lang,
        "Weekly practice is where donation and fasting belong. Each planet owns a weekday, and giving on that day towards the affected life area is the classical mechanism — the point is that it costs you something small and regular, not that the item is exotic.",
        "दान और उपवास का स्थान साप्ताहिक अभ्यास है। प्रत्येक ग्रह का एक वार होता है, और उस दिन प्रभावित जीवन-क्षेत्र की दिशा में दान करना ही शास्त्रोक्त विधि है — महत्व वस्तु की दुर्लभता का नहीं, इस बात का है कि वह आपको नियमित रूप से थोड़ा खर्च कराए।"),
      detected.length
        ? t(lang,
          "The weekly slots below follow only the planets that are actually active in your chart. Nothing has been added for a dosh you do not have, which is why this list is shorter than a generic remedy calendar.",
          "नीचे दिए साप्ताहिक कार्य केवल उन ग्रहों के अनुसार हैं जो आपकी कुंडली में वास्तव में सक्रिय हैं। जो दोष है ही नहीं उसके लिए कुछ नहीं जोड़ा गया — इसीलिए यह सूची किसी सामान्य उपाय-पंचांग से छोटी है।")
        : t(lang,
          "With no active dosh, the weekly layer is optional. What remains is the seasonal practice that benefits any chart, kept deliberately short.",
          "कोई दोष सक्रिय न होने से साप्ताहिक स्तर वैकल्पिक है। जो शेष है वह ऋतु-आधारित अभ्यास है जो हर कुंडली के लिए हितकर होता है, और जानबूझकर संक्षिप्त रखा गया है।"),
      t(lang,
        "Annual practice is anchored to two dates that do not move: the new moon nearest your birthday, and the ancestral fortnight. Put both in a calendar rather than trusting memory.",
        "वार्षिक अभ्यास दो अचल तिथियों पर टिका है: जन्मदिन के निकटतम अमावस्या, और पितृ पक्ष। दोनों को स्मृति के भरोसे न छोड़कर पंचांग में अंकित करें।"),
    ],
    bullets: weeklyBullets,
    summary: t(lang, "Weekly donation on the planet's own weekday; two fixed annual observances.",
      "ग्रह के अपने वार पर साप्ताहिक दान; दो निश्चित वार्षिक आचार।"),
  });

  // ── 25 Temple & puja ───────────────────────────────────────────────────────
  const templeBullets = detected.map((d) => {
    const planet = String(d.planet_en || "").split(/[-\s]/)[0];
    return `${d.name} → ${shrineFor(planet, lang) || t(lang, `a Navagraha shrine, with the offering directed to ${d.planet}`, `नवग्रह मंदिर, अर्पण ${d.planet} की ओर निर्दिष्ट करते हुए`)}`;
  });
  const pujaNames = detected.map((d) => d.remedy_puja_name).filter(Boolean);
  S.push({
    id: "temple_puja", page: 25,
    title: PAGE(lang, "Temple & Puja Recommendations", "मंदिर और पूजा सुझाव"),
    subtitle: pujaNames.length
      ? t(lang, `${pujaNames.length} puja${pujaNames.length === 1 ? "" : "s"} indicated`, `${pujaNames.length} पूजा निर्दिष्ट`)
      : t(lang, "No corrective puja indicated", "कोई सुधारात्मक पूजा निर्दिष्ट नहीं"),
    body: [
      pujaNames.length
        ? t(lang,
          `Your chart indicates ${joinList(pujaNames, "en")}. A puja is a concentrated form of the daily practice — same planet, same intent, performed once with full procedure. It replaces neither the daily mantra nor the weekly donation.`,
          `आपकी कुंडली ${joinList(pujaNames, lang)} की ओर संकेत करती है। पूजा दैनिक अभ्यास का संकेन्द्रित रूप है — वही ग्रह, वही भाव, एक बार पूर्ण विधि से। यह न दैनिक मंत्र का स्थान लेती है, न साप्ताहिक दान का।`)
        : t(lang,
          "No corrective puja is indicated by this chart. Any temple visit below is devotional rather than remedial, and nobody should be selling you a dosh-nivaran ritual on the strength of this report.",
          "इस कुंडली से कोई सुधारात्मक पूजा निर्दिष्ट नहीं होती। नीचे दिया गया कोई भी मंदिर-दर्शन उपाय नहीं, भक्ति है — और इस रिपोर्ट के आधार पर आपको कोई दोष-निवारण अनुष्ठान नहीं बेचा जाना चाहिए।"),
      t(lang,
        "Choose the temple by the planet, not by distance or fame. A local shrine visited on the right weekday with the right offering outranks a famous one visited once at the wrong time.",
        "मंदिर ग्रह के अनुसार चुनें, दूरी अथवा प्रसिद्धि के अनुसार नहीं। सही वार पर सही अर्पण के साथ किया गया स्थानीय दर्शन, गलत समय पर एक बार किए गए प्रसिद्ध दर्शन से श्रेष्ठ है।"),
      t(lang,
        `Your ascendant lord is ${pl(ctx.lagnaLord, "en")}, which makes its shrine the right default when no specific dosh is being addressed — strengthening the chart's ruler benefits every house at once.`,
        `आपके लग्न के स्वामी ${pl(ctx.lagnaLord, lang)} हैं, अतः जब कोई विशेष दोष लक्ष्य न हो तब उन्हीं का मंदिर उपयुक्त विकल्प है — कुंडली के स्वामी को बल देने से एक साथ सभी भावों को लाभ होता है।`),
    ],
    bullets: templeBullets.length ? templeBullets : [
      `${pl(ctx.lagnaLord, lang)} → ${shrineFor(ctx.lagnaLord, lang) || t(lang, "a Navagraha shrine", "नवग्रह मंदिर")}`,
      t(lang, `Moon in ${sg(ctx.moonSign, "en")} → ${shrineFor("Moon", "en")}`, `${sg(ctx.moonSign, lang)} का चंद्रमा → ${shrineFor("Moon", "hi")}`),
      t(lang, "A Navagraha circuit once a year — nine planets, one visit, no dosh required.", "वर्ष में एक बार नवग्रह दर्शन — नौ ग्रह, एक यात्रा, किसी दोष की आवश्यकता नहीं।"),
      t(lang, "Any temple on your birth-nakshatra day, which recurs every 27 days.", "अपने जन्म-नक्षत्र के दिन कोई भी मंदिर, जो हर 27 दिन में आता है।"),
    ],
    summary: pujaNames.length
      ? t(lang, `Indicated: ${joinList(pujaNames, "en")}.`, `निर्दिष्ट: ${joinList(pujaNames, lang)}।`)
      : t(lang, "No remedial puja is required by this chart.", "इस कुंडली को किसी उपाय-पूजा की आवश्यकता नहीं।"),
  });

  // ── 26 Gemstone ────────────────────────────────────────────────────────────
  const gemBullets = detected.map((d) => {
    const planet = String(d.planet_en || "").split(/[-\s]/)[0];
    const stone = gemFor(planet, lang);
    return t(lang,
      `${d.name} → ${stone || "no classical stone"}, worn on ${weekdayFor(planet, "en")}, and only after a live consultation.`,
      `${d.name} → ${stone || "कोई शास्त्रीय रत्न नहीं"}, ${weekdayFor(planet, lang)} को धारण करें, और वह भी प्रत्यक्ष परामर्श के बाद ही।`);
  });
  const lagnaStone = gemFor(ctx.lagnaLord, lang);
  S.push({
    id: "gemstone", page: 26,
    title: PAGE(lang, "Gemstone Guidance", "रत्न मार्गदर्शन"),
    subtitle: PAGE(lang, "What to wear, and what not to", "क्या धारण करें और क्या नहीं"),
    body: [
      t(lang,
        "A gemstone amplifies its planet. That is the entire mechanism, and it is why a stone chosen for a dosh can make the dosh louder rather than quieter — amplifying an afflicted planet is not a remedy, it is a magnifier.",
        "रत्न अपने ग्रह को बढ़ाता है। यही उसका सम्पूर्ण तंत्र है, और इसीलिए दोष के नाम पर चुना गया रत्न दोष को शांत करने के बजाय और मुखर कर सकता है — पीड़ित ग्रह को बढ़ाना उपाय नहीं, आवर्धन है।"),
      lagnaStone
        ? t(lang,
          `The safe default for you is the stone of your ascendant lord ${pl(ctx.lagnaLord, "en")} — ${gemFor(ctx.lagnaLord, "en")}. Strengthening the ruler of the chart lifts every house it governs and cannot backfire the way a malefic's stone can.`,
          `आपके लिए सुरक्षित विकल्प आपके लग्नेश ${pl(ctx.lagnaLord, lang)} का रत्न — ${lagnaStone} — है। कुंडली के स्वामी को बल देने से उसके सभी भावों को लाभ होता है, और यह किसी क्रूर ग्रह के रत्न की भाँति उल्टा नहीं पड़ता।`)
        : t(lang, "The safe default is the stone of the ascendant lord, which strengthens the chart's ruler rather than any single affliction.",
          "सुरक्षित विकल्प लग्नेश का रत्न है, जो किसी एक पीड़ा के बजाय कुंडली के स्वामी को बल देता है।"),
      t(lang,
        "Blue sapphire and hessonite are the two stones most often sold on the back of a dosh report and the two most likely to cause harm. Neither should be worn without a trial period, and neither should be worn merely because a report — including this one — printed a dosh name.",
        "नीलम और गोमेद — ये दो रत्न दोष-रिपोर्ट के आधार पर सर्वाधिक बेचे जाते हैं और इन्हीं से हानि की संभावना भी सबसे अधिक है। इन्हें बिना परीक्षण-अवधि के धारण न करें, और केवल इसलिए तो कभी न करें कि किसी रिपोर्ट में — इसमें भी — किसी दोष का नाम छपा है।"),
    ],
    bullets: gemBullets.length ? gemBullets : [
      lagnaStone
        ? t(lang, `${gemFor(ctx.lagnaLord, "en")} for ${pl(ctx.lagnaLord, "en")} — the ascendant lord, and the only stone this chart clearly supports.`,
          `${lagnaStone} — लग्नेश ${pl(ctx.lagnaLord, lang)} हेतु; इस कुंडली में स्पष्ट रूप से यही एक रत्न समर्थित है।`)
        : t(lang, "Ascendant lord's stone — the only clearly supported choice here.", "लग्नेश का रत्न — यहाँ स्पष्ट रूप से समर्थित एकमात्र विकल्प।"),
      t(lang, "No corrective stone is indicated: with no active dosh there is nothing to counterweight.",
        "कोई सुधारात्मक रत्न निर्दिष्ट नहीं है: जब कोई दोष सक्रिय ही नहीं, तब संतुलन के लिए कुछ चाहिए ही नहीं।"),
      t(lang, `Lucky colour ${colorLoc(ctx.numerology?.luckyColor, "en") || "—"} and number ${ctx.numerology?.lifePathNumber ?? "—"} are numerological, not gemmological — use them for choices, not for stones.`,
        `शुभ रंग ${colorLoc(ctx.numerology?.luckyColor, "hi") || "—"} और शुभ अंक ${ctx.numerology?.lifePathNumber ?? "—"} अंक-शास्त्र से हैं, रत्न-शास्त्र से नहीं — इन्हें निर्णयों में लें, रत्न चुनने में नहीं।`),
      t(lang, "Trial rule: wear any stone in contact with the skin for a fortnight before buying a certified one.",
        "परीक्षण नियम: प्रमाणित रत्न खरीदने से पूर्व किसी भी रत्न को पंद्रह दिन त्वचा से स्पर्श कराते हुए धारण करके देखें।"),
    ],
    summary: t(lang, "Amplify the ascendant lord; never buy a stone on the strength of a dosh name alone.",
      "लग्नेश को बल दें; केवल किसी दोष के नाम पर कोई रत्न कभी न खरीदें।"),
  });

  // ── 27 What you can safely ignore ──────────────────────────────────────────
  const ignorable = absent.map((c) => `${c.name} — ${t(lang, "not present", "अनुपस्थित")}. ${c.why_not || c.short_description}`);
  const minorAbsent = minorPatterns.filter((p) => !p.detected).map((p) => p.short_description);
  const minorPresent = minorPatterns.filter((p) => p.detected);
  S.push({
    id: "safely_ignore", page: 27,
    title: PAGE(lang, "What You Can Safely Ignore", "जिन दोषों की चिंता न करें"),
    subtitle: t(lang, `${absent.length} of ${chapters.length} doshas do not apply to you`, `${chapters.length} में से ${absent.length} दोष आप पर लागू नहीं`),
    body: [
      t(lang,
        `${absent.length} of the ${chapters.length} doshas in this report are not present in your chart. If any of them is quoted at you — in a match-making conversation, a temple queue or a paid consultation — this page is the answer, with the measurement printed beside each name.`,
        `इस रिपोर्ट के ${chapters.length} दोषों में से ${absent.length} आपकी कुंडली में उपस्थित ही नहीं हैं। यदि इनमें से कोई आपको बताया जाए — विवाह की बातचीत में, मंदिर की पंक्ति में, अथवा किसी सशुल्क परामर्श में — तो यही पृष्ठ उत्तर है, और प्रत्येक नाम के साथ उसका माप भी दिया गया है।`),
      minorPresent.length
        ? t(lang,
          `Of the four secondary patterns, ${joinList(minorPresent.map((p) => p.name), "en")} ${minorPresent.length === 1 ? "is" : "are"} present but minor — a note, not a remedy programme. The rest are absent.`,
          `चार गौण योगों में से ${joinList(minorPresent.map((p) => p.name), lang)} उपस्थित हैं किन्तु गौण — ये केवल जानकारी हैं, उपाय-योजना नहीं। शेष अनुपस्थित हैं।`)
        : t(lang,
          "All four secondary patterns — Paap Kartari, Shakat, Gandmool and Daridra — were checked and none is present either.",
          "चारों गौण योग — पाप कर्तरी, शकट, गंडमूल और दरिद्र — जाँचे गए और इनमें से भी कोई उपस्थित नहीं है।"),
      t(lang,
        "One caution in the other direction: absence today is not permanent for the transit items. Sade Sati and Shani Dhaiya are schedules that open and close on Saturn's cycle, and the signs that will open yours are printed on their own pages.",
        "एक सावधानी विपरीत दिशा में भी: गोचर से जुड़े विषयों में आज की अनुपस्थिति स्थायी नहीं है। साढ़े साती और शनि ढैया शनि के चक्र पर खुलने-बंद होने वाली अवधियाँ हैं, और जिन राशियों पर आपकी अवधि खुलेगी वे उन्हीं के पृष्ठों पर दी गई हैं।"),
    ],
    bullets: [...ignorable, ...minorAbsent].slice(0, 18),
    summary: t(lang,
      `${absent.length} doshas absent and ${minorPatterns.filter((p) => !p.detected).length} secondary patterns absent — none of them needs your money.`,
      `${absent.length} दोष अनुपस्थित तथा ${minorPatterns.filter((p) => !p.detected).length} गौण योग अनुपस्थित — इनमें से किसी पर धन व्यय की आवश्यकता नहीं।`),
    dosh_ids: absent.map((c) => c.id),
  });

  // ── 28 How to use ──────────────────────────────────────────────────────────
  S.push({
    id: "how_to_use", page: 28,
    title: PAGE(lang, "How to Use This Report", "इस रिपोर्ट का उपयोग कैसे करें"),
    subtitle: PAGE(lang, "Order of operations", "किस क्रम में पढ़ें"),
    body: [
      detected.length
        ? t(lang,
          `Start with the ${detected.length === 1 ? "chapter" : "chapters"} that came back present — ${joinList(detected.map((d) => d.name), "en")} — and read the severity score before the prose. A score under 30 does not warrant reorganising anything; it warrants the daily practice on page 23 and nothing more.`,
          `उन अध्यायों से आरंभ करें जो उपस्थित मिले — ${joinList(detected.map((d) => d.name), lang)} — और विवरण से पहले गंभीरता का अंक देखें। 30 से कम अंक किसी पुनर्व्यवस्था की माँग नहीं करता; वह केवल पृष्ठ 23 के दैनिक अभ्यास की माँग करता है, उससे अधिक कुछ नहीं।`)
        : t(lang,
          "Start with the summary on page 3 and the scoring page. Nothing came back present, so the useful part of this report is the record of what was checked — keep it for the next time someone tells you a dosh is blocking something.",
          "पृष्ठ 3 के सारांश और गंभीरता वाले पृष्ठ से आरंभ करें। कुछ भी उपस्थित नहीं मिला, अतः इस रिपोर्ट का उपयोगी भाग यह प्रमाण है कि क्या-क्या जाँचा गया — इसे अगली बार के लिए रखें जब कोई कहे कि कोई दोष आपका काम रोक रहा है।"),
      t(lang,
        "Then read the cancellations page. It is the page that changes decisions: a dosh with a cancellation firing is a different situation from the same dosh without one, and almost no report prints both sides.",
        "इसके बाद निवारण वाला पृष्ठ पढ़ें। यही वह पृष्ठ है जो निर्णय बदलता है: जिस दोष पर कोई निवारण लागू है, वह उसी दोष से बिल्कुल भिन्न स्थिति है जिस पर नहीं है — और लगभग कोई रिपोर्ट दोनों पक्ष नहीं छापती।"),
      t(lang,
        "Give any remedy forty days before you judge it, and change one thing at a time. If you take this to an astrologer, hand over page 2 — the placement table lets them verify the chart in under a minute instead of re-casting it.",
        "किसी भी उपाय को परखने से पहले चालीस दिन दें, और एक बार में एक ही परिवर्तन करें। यदि आप इसे किसी ज्योतिषी को दिखाएँ तो पृष्ठ 2 दें — ग्रह-स्थिति की तालिका से वे कुंडली दोबारा बनाए बिना एक मिनट में सत्यापन कर सकेंगे।"),
    ],
    bullets: [
      t(lang, "Page 2 — placement table: hand this to any astrologer to verify the chart.", "पृष्ठ 2 — ग्रह-स्थिति तालिका: कुंडली सत्यापन हेतु किसी भी ज्योतिषी को यही दें।"),
      t(lang, "Page 3 — the one-page verdict, if you read nothing else.", "पृष्ठ 3 — यदि और कुछ न पढ़ें तो एक पृष्ठ का निर्णय यही है।"),
      t(lang, "Page 21 — cancellations: read before acting on any dosh chapter.", "पृष्ठ 21 — निवारण: किसी भी दोष-अध्याय पर कार्य करने से पहले इसे पढ़ें।"),
      t(lang, "Page 22 — timing: check whether a dosh is even in season before treating it.", "पृष्ठ 22 — समय: किसी दोष का उपचार करने से पहले देखें कि वह इस समय सक्रिय भी है या नहीं।"),
      t(lang, "Pages 23-24 — the actual routine, in daily and weekly form.", "पृष्ठ 23-24 — वास्तविक दिनचर्या, दैनिक और साप्ताहिक रूप में।"),
      t(lang, "Re-read the Sade Sati and Dhaiya pages when Saturn changes sign, roughly every two and a half years.", "शनि के राशि बदलने पर — लगभग हर ढाई वर्ष में — साढ़े साती और ढैया के पृष्ठ पुनः पढ़ें।"),
    ],
    summary: t(lang, "Severity first, cancellations second, timing third — then the routine, held for forty days.",
      "पहले गंभीरता, फिर निवारण, फिर समय — उसके बाद दिनचर्या, चालीस दिन तक निरंतर।"),
  });

  return S.sort((a, b) => a.page - b.page);
}
