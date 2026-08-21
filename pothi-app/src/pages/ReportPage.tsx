import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { api, type Design, type Palette } from "../lib/api";
import { priceView } from "../lib/price";
import ChartMark from "../components/ChartMark";
import PageTurner from "../components/PageTurner";
import Engine from "../sections/Engine";
import SampleModal from "../components/SampleModal";
import { COVER_PALETTE } from "../components/ReportCover";
import { track } from "../lib/track";
import WhyUs from "../sections/WhyUs";
import PromoBanners from "../sections/PromoBanners";
// import PitchVideo from "../sections/PitchVideo"; // hidden for now — testimonial wall in its place
import DoshCRO from "../sections/DoshCRO";
import { useLang } from "../lib/lang";
import { ui, pitchFor } from "../lib/reportStrings";
import { useScrollDepth, useSectionView, useQualifiedView } from "../lib/engagement";
import Support from "../components/Support";
import Faq from "../components/Faq";
import Link from "../components/Link";
import { REPORT_FAQ, DOSH_FAQ_HI } from "../content/reportFaq";
import TrustStrip from "../components/TrustStrip";

type Detail = {
  code: string; name_en: string; name_hi: string; design?: string; palette?: string; chapters: number; price_paise: number; approx_pages: number;
  outline: { n: number; title: string; subtitle: string }[];
  sample: { pages: number; images: { page: number; url: string }[]; pdf: string } | null;
};

/** Devanagari name + the one-line promise, per report. */
const PITCH: Record<string, { deva: string; line: string; body: string }> = {
  kundli:     { deva: "कुंडली", line: "The complete reading.", body: "Every house read in turn, every planet, the dasha timeline with dates, ten divisional charts, strengths by bindu, the doshas that actually form, and remedies drawn from your weakest placements." },
  dosh:       { deva: "दोष", line: "Fourteen doshas, checked.", body: "Manglik, Kaal Sarp, Sade Sati, Pitra, Guru Chandal and nine more — tested against classical rules, scored for severity, and checked for the cancellations most readings ignore." },
  love:       { deva: "विवाह", line: "What the chart says about marriage.", body: "The 7th house and its lord, Venus and Mars, the navamsa that decides whether the promise holds, manglik tested both ways, and the dasha windows when marriage ripens." },
  health:     { deva: "आरोग्य", line: "Your constitution, read properly.", body: "Lagna and its lord, the 6th house, the Moon, your tatva and prakriti — and the areas of the body your chart asks you to look after." },
  horoscope:  { deva: "राशिफल", line: "This month against your own chart.", body: "Not a sun-sign column. Every transit placed against your natal houses, the dates that matter, and what each one touches." },
  laalkitab:  { deva: "लाल किताब", line: "The Laal Kitaab reading.", body: "A distinct tradition with its own logic and its own remedies — practical, inexpensive, and drawn from the placements that need help in your chart." },
  couples:    { deva: "तीस दिन", line: "Thirty evenings, one question at a time.", body: "A thirty-day challenge for two people, printed with both your names — on the cover and at the head of every page. One question a day and one small thing to do, in four weeks that build from remembering to planning. Four check-ins to answer separately and compare, room to write on every page, and a certificate at the end with the date you finished." },
  vastu:      { deva: "वास्तु चक्र", line: "Your home, read direction by direction.", body: "Where the entrance, kitchen, bedroom, pooja space, toilets and water sit — each checked against the Vastu Purusha Mandala, with the dosh named, its weight given, and a remedy that needs no demolition." },
  varshaphal: { deva: "वर्षफल", line: "The year ahead.", body: "The annual chart cast for your solar return: Muntha, Panchavargeeya bala, the Mudda dasha and the themes month by month." },
  career:     { deva: "कर्म", line: "What your chart says about work.", body: "The 10th house and its lord, the four grahas that signify livelihood, the Dashamsha read only for work, your Amatyakaraka, and the dasha windows in which a career actually turns. Job or business is answered from the signals found, and each one is printed so you can see what the answer was built from." }
};

/**
 * A design card that shows the layout instead of describing it. The thumbnail
 * is fetched per card rather than with the page, so a design nobody has
 * rendered yet costs a spinner in one tile and not a stalled page.
 */
function EditionCard({ code, d, palette, on, onPick }: {
  code: string; d: Design; palette: string; on: boolean; onPick: () => void;
}) {
  const [thumb, setThumb] = useState<string | null>(null);
  // Its own hook rather than a prop: the card is a leaf and threading the
  // language down through the picker would be three signatures for one word.
  const [lang] = useLang();
  useEffect(() => {
    let live = true;
    setThumb(null);
    api.get(`/noauth-api/v1/shop/thumb/${code}?design=${d.id}&palette=${palette}`)
      .then((r: { url: string | null }) => { if (live) setThumb(r.url); })
      .catch(() => {});
    return () => { live = false; };
  }, [code, d.id, palette]);

  return (
    <button onClick={onPick} aria-pressed={on}
      className={`relative text-left rounded-[3px] border overflow-hidden transition-all duration-300
        ${on ? "border-brass bg-raised shadow-lift" : "border-line bg-raised/60 hover:border-faint"}`}>
      {on && <span className="absolute inset-x-0 top-0 h-px bg-brass z-10" />}
      <span className="block bg-sunken border-b border-line p-5 sm:p-7">
        <span className="block mx-auto w-[62%] aspect-[1/1.414] rounded-[2px] overflow-hidden
                         border border-line shadow-soft bg-raised">
          {thumb
            ? <img src={thumb} alt={`${d.name[lang]} layout`} className="w-full block" loading="lazy" />
            : <span className="block w-full h-full animate-pulse" />}
        </span>
      </span>
      <span className="block p-5">
        <span className="block font-serif text-[19px]">{d.name[lang]}</span>
        <span className="block text-[13.5px] text-muted mt-1.5 leading-snug">{d.tagline[lang]}</span>
      </span>
    </button>
  );
}

export default function ReportPage({ code, designs, palettes, onBuy }: {
  code: string; designs: Design[]; palettes: Palette[];
  onBuy: (code: string, design: string, palette: string) => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  // Starts empty and is filled from the first response. A report may pin its
  // typesetting — the Couples Challenge is one page per day in Keepsake — and
  // hard-coding "heritage" here showed a sample of a book nobody would receive.
  const [design, setDesign] = useState("");
  const [palette, setPalette] = useState(() => COVER_PALETTE[code] || "gold");
  const [allChapters, setAllChapters] = useState(false);
  const [sample, setSample] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  // The sticky bar and the hero button are the same offer. Showing both at once
  // is the page asking twice, and on a 390px screen the bar covers content
  // while an identical button sits above it. So the bar appears only once the
  // real one has scrolled away.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaSeen, setCtaSeen] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaSeen(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [code, d]);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // The stack drifts up and the chart rotates as the hero leaves — slow enough
  // to read as depth rather than as an effect.
  const stackY  = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const markRot = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 16]);

  // …and follow it when the buyer moves between reports without a full load.
  useEffect(() => { setPalette(COVER_PALETTE[code] || "gold"); }, [code]);

  const [lang] = useLang();
  const t = ui(lang);

  useEffect(() => {
    setD(null); setErr("");
    // `design` is empty until the first response says which edition this report
    // is published in; leaving it out of the query lets the server decide.
    const q = new URLSearchParams({ palette, lang });
    if (design) q.set("design", design);
    api.get(`/noauth-api/v1/shop/report/${code}?${q}`)
      .then((r) => {
        setD(r);
        // Adopt whatever the server chose, so the edition picker below opens on
        // the edition being shown rather than on its own idea of a default.
        if (!design && r.design) setDesign(r.design);
      })
      .catch((e) => setErr(e.message));
    // `lang` belongs here: the chapter list and every sample image come back
    // translated, so a language change is a refetch, not a re-render.
  }, [code, design, palette, lang]);

  const pitch = pitchFor(code, lang, PITCH);

  // Where they got to, and what they stopped at. `code` and `language` ride on
  // every event so the funnel can be cut by report and by which language the
  // page was read in — the whole point of translating this page is to find out
  // whether it sells better in Hindi, and that is unanswerable without it.
  // ViewContent — the ad set's conversion event — waits for real engagement.
  useQualifiedView(code);
  useScrollDepth({ code, language: lang });
  const seenPages   = useSectionView<HTMLElement>("sample_pages", { code, language: lang });
  const seenEditions = useSectionView<HTMLElement>("editions",    { code, language: lang });
  const seenContents = useSectionView<HTMLElement>("contents",    { code, language: lang });
  const seenClose    = useSectionView<HTMLElement>("closing_cta", { code, language: lang });
  // approx_pages is the classic render; the sample knows the count for the
  // design actually on screen.
  const pages = d?.sample?.pages ?? d?.approx_pages ?? null;
  const shown = d ? (allChapters ? d.outline : d.outline.slice(0, 14)) : [];
  const shots = d?.sample?.images ?? [];
  const pv = priceView(d ?? undefined);
  const price = pv.nowText;

  // One trust line, used under every dosh CTA so the page reads consistently.
  const doshTrust = (extra = "") => (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] sm:text-[13px] text-muted ${lang === "hi" ? "deva" : ""} ${extra}`}>
      {(lang === "hi"
        ? ["कोई Subscription नहीं", "1 मिनट में रिपोर्ट", "100% Money Back"]
        : ["No subscription", "Report in 1 minute", "100% money-back"]
      ).map((x, i) => (
        <span key={x} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-line">·</span>}
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8"
               strokeLinecap="round" strokeLinejoin="round" className="text-brass shrink-0" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
          <span>{x}</span>
        </span>
      ))}
    </p>
  );

  return (
    <>
      {/* ── The promo strip, first thing on the page ──────────────────────
          Above the hero, because 4 of 77 visitors scroll past the first
          screen and an ad click lands here. Only the dosh report has these
          banners; they are about the fourteen doshas specifically. ── */}
      {code === "dosh" && <PromoBanners where="report_dosh" onBuy={() => { track("report_cta_click", { code, where: "banner", language: lang }); onBuy(code, design, palette); }} />}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden grain lamp border-b border-line">
        {/* The chart is the architecture of the page, not an ornament on it. */}
        <motion.div style={{ rotate: markRot, x: "-50%", y: "-50%" }}
          className="pointer-events-none absolute left-1/2 top-1/2 w-[880px] max-w-[128vw] text-brass opacity-[.16] dark:opacity-[.2]">
          {/* the scroll tilt lives on the parent; this inner turn never stops,
              so the mark is breathing even when the page is still */}
          <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 320, repeat: Infinity, ease: "linear" }}>
            <ChartMark className="w-full h-auto" weight={0.32} />
          </motion.div>
        </motion.div>

        <div className="shell relative z-10 pt-4 pb-5 sm:pt-6 sm:pb-24">
          <div className="mt-0 sm:mt-10 grid lg:grid-cols-[1.02fr_.98fr] gap-y-14 gap-x-16 items-center">
            <div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="h-px w-8 bg-brass" />
                <span className="caps text-brass hidden sm:inline">
                  {d && pages ? t.chaptersPages(d.chapters, pages) : t.fallbackEyebrow}
                </span>
              </div>

              {code === "dosh" ? (
                /* Message-match to the Meta ad: continue its exact psychological
                   question rather than the generic report name. Bilingual — the
                   toggle (default Hindi) decides which the visitor reads. */
                <>
                  <h1 className={`mt-1 sm:mt-4 display text-[26px] sm:text-[46px] lg:text-[52px]
                                 leading-[1.25] sm:leading-[1.15] font-semibold ${lang === "hi" ? "deva" : ""}`}>
                    {lang === "hi"
                      ? "क्या आपको भी कहा गया था कि आपकी कुंडली में दोष है?"
                      : "Were you told your chart has a dosh?"}
                  </h1>
                  <p className={`mt-4 sm:mt-6 text-[16px] sm:text-[20px] text-fg leading-relaxed max-w-prose2 ${lang === "hi" ? "deva" : ""}`}>
                    {lang === "hi"
                      ? "पहले ख़ुद जाँचिए। हो सकता है जो दोष आपको बताया गया था, वह आपकी कुंडली में हो ही नहीं।"
                      : "Check for yourself first. The dosh you were told about may not be in your chart at all."}
                  </p>
                  <p className={`mt-3 hidden sm:block text-[14.5px] text-muted leading-relaxed max-w-prose2 ${lang === "hi" ? "deva" : ""}`}>
                    {lang === "hi"
                      ? "आपकी जन्म कुंडली पर 14 प्रमुख दोषों की व्यक्तिगत जाँच — कौन सा वास्तव में है, कौन सा नहीं, प्रभाव कितना है, कोई योग उसे कम करता है या नहीं, और लागू होने पर सही उपाय क्या।"
                      : "A personal check of 14 major doshas on your birth chart — which is real, which is not, how strong it is, whether a yoga reduces it, and the right remedy where one applies."}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="mt-0 sm:mt-6">
                    <span className="deva foil block text-[24px] sm:text-[64px] leading-[1.18] font-semibold -ml-[.02em]">
                      {pitch?.deva}
                    </span>
                    <span className="display block text-[25px] sm:text-[64px] lg:text-[74px] leading-[1.02] sm:leading-[.98] mt-1">
                      {(lang === "hi" ? d?.name_hi : d?.name_en) || " "}
                    </span>
                    {d && pages && (
                      <span className="mt-1 block text-[12.5px] text-faint sm:hidden">
                        {t.chaptersPages(d.chapters, pages)}
                      </span>
                    )}
                  </h1>
                  {pitch && (
                    <>
                      <p className="mt-4 sm:mt-7 text-[19px] sm:text-[24px] font-serif text-fg leading-snug">{pitch.line}</p>
                      <p className="lede mt-4 max-w-prose2">{pitch.body}</p>
                    </>
                  )}
                </>
              )}
              {/* Four reasons to buy, and deliberately not the four the banner
                  strip above already gives. That one covers what is checked,
                  that it is written out in full, that it is quick, and that the
                  remedies are usable — so repeating any of them here is the
                  thing that made this block feel hollow. These are the ones it
                  does not: the scoring, the chat, the chapter-per-dosh
                  structure and the language. Every one is checked against the
                  product: 28 chapters in the catalogue, a 0–100 severity band
                  in detect-doshas.js, AskReport on the order page, and the full
                  Devanagari label set in report-labels.js. */}
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:hidden">
                {t.perks.map(([label, sub]) => (
                  <li key={label} className="flex gap-2">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                         strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                         className="text-brass shrink-0 mt-[3px]" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium leading-snug">{label}</span>
                      <span className="block text-[11.5px] text-faint leading-snug mt-0.5">{sub}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {err && <p className="mt-4 text-[14px] text-ember">{err}</p>}

              {/* Side by side, not stacked. Two full-width buttons in a column
                  read as a list of steps — "generate, then read a sample" —
                  when they are alternatives. Buy takes the wider share. */}
              <div ref={ctaRef} className="mt-5 sm:mt-10 flex items-center gap-3">
                <button className="btn-brass h-[52px] px-5 sm:px-8 text-[15px] sm:text-[16px] flex-[1.35] sm:flex-none"
                        onClick={() => { track("report_cta_click", { code, where: "hero", language: lang }); onBuy(code, design, palette); }}>
                  {code === "dosh" ? (
                    <span className={lang === "hi" ? "deva" : ""}>{lang === "hi" ? `मेरी कुंडली जांचें — ${price}` : `Check my chart — ${price}`}</span>
                  ) : (<>
                    <span className="sm:hidden">{t.buyShort(price)}</span>
                    <span className="hidden sm:inline">{t.buyLong(price)}</span>
                  </>)}
                </button>
                {d?.sample && (
                  <button className="btn-line h-[52px] px-4 sm:px-7 text-[15px] flex-1 sm:flex-none"
                          onClick={() => { track("sample_opened", { code, language: lang }); setSample(true); }}>
                    {t.sample}
                  </button>
                )}
              </div>

              {/* Dosh: one small trust line under the CTA, identical everywhere. */}
              {code === "dosh" && doshTrust("mt-4")}
              {/* One line on a phone.
                  This was three stacked blocks — the speed line, a refund pill
                  and a three-badge strip — running to roughly two hundred
                  pixels, with "100% refund, no questions" printed twice inside
                  it. On a screen where almost nobody scrolls, that is the space
                  the product itself needed. Desktop keeps the fuller version. */}
              {code !== "dosh" && (<>
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted sm:hidden">
                  <span className="text-brass font-medium">{t.refundStrong}</span>
                  <span className="text-line">·</span><span>{t.secureShort}</span>
                  <span className="text-line">·</span><span>{t.fastShort}</span>
                </p>
                <p className="mt-3.5 text-[12.5px] sm:text-[13px] text-faint hidden sm:block">{t.fastLine}</p>
                <div className="mt-5 hidden sm:inline-flex items-center gap-2.5 rounded-full border border-brass/35
                                bg-brassSoft/25 dark:bg-brass/10 pl-3 pr-4 py-2">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brass shrink-0" aria-hidden>
                    <path d="M12 3l7.5 3v5.2c0 4.4-3 8.3-7.5 9.6-4.5-1.3-7.5-5.2-7.5-9.6V6z" /><path d="m9 12 2.2 2.2L15.5 10" />
                  </svg>
                  <p className="text-[13px] leading-tight text-fg"><strong>{t.refundStrong}</strong><span className="text-muted">{t.refundRest}</span></p>
                </div>
                <TrustStrip className="mt-5 hidden sm:flex" />
              </>)}
            </div>

            {/* Desktop only. On a phone this sat directly under the refund
                line, pushing everything that sells the report below a
                full-height picture of a book the reader has not bought yet —
                and the sample is one tap away from the button above it. */}
            <motion.div style={{ y: stackY }}
                        className="hidden lg:block relative mx-auto w-full max-w-[380px]">
              <PageTurner shots={shots} single maxW={380} showChrome={false} />
              <p className="mt-6 text-center caps text-faint">
                {t.tapToTurn(designs.find((x) => x.id === design)?.name[lang] ?? "")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── The three facts that decide the sale ─────────────────────────── */}

      {/* Pitch video hidden for now — testimonial wall lives inside DoshCRO,
          under "How it works".
          {code === "dosh" && <PitchVideo />} */}
      {code === "dosh" && <DoshCRO onBuy={() => onBuy(code, design, palette)} price={price} />}

      {/* ── The sample, as a book you turn ──────────────────────────────── */}
      {shots.length > 1 && (
        <section ref={seenPages} className="relative overflow-hidden grain border-b border-line">
          <div className="shell relative z-10 py-5 sm:py-24">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="caps text-brass">{t.inside}</p>
                <h2 className="display text-[23px] sm:text-[44px] mt-3">{t.turnPages}</h2>
              </div>
              <p className="lede max-w-[38ch]">
                {t.realSpreads}
              </p>
            </div>

            <div className="mt-12 sm:mt-16">
              <PageTurner shots={shots} scrollFlip maxW={780}
                          caption={t.sampleCaption((lang === "hi" ? d?.name_hi : d?.name_en) ?? "")} />
            </div>
          </div>
        </section>
      )}

      {/* Moved out of the hero deliberately. At the top it competed with the
          price and the refund for the same glance; here it lands after the
          reader has seen what is actually in the book, which is the moment
          "what if I do not understand it" occurs to them. */}
      <section className="shell py-5 sm:py-12">
        <div className="card p-5 sm:p-8 flex gap-4 sm:gap-6 items-start max-w-3xl mx-auto">
          <span className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-brassSoft/50 dark:bg-brass/15
                           text-brass grid place-items-center">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.3 9.3 0 0 1-3.3-.6L3 21l1.8-5a8.2 8.2 0 0 1-.8-3.5 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 8.4Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="display text-[19px] sm:text-[24px] leading-snug">
              {t.askEyebrow}
            </h2>
            <p className="text-[13.5px] sm:text-[15px] text-muted mt-2 leading-relaxed">
              {t.askBody(d?.chapters ?? "")}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {t.askExamples.map((q) => (
                <span key={q} className="rounded-full border border-line bg-sunken
                                         px-3 py-1.5 text-[11.5px] text-muted">{q}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WhyUs />

      <Engine />

      {/* ── Design and colour ────────────────────────────────────────────── */}
      {/* Desktop only. A phone buyer gets Heritage — the presentation edition,
          and what the checkout already defaults to — rather than a three-way
          layout decision made on a 390px screen. */}
      {/* Desktop only. Four design cards, each fetching its own rendered
          thumbnail, is a picker on a wide screen and a long download on a
          phone — where the reader has already seen the actual sample above.
          `lg` rather than `sm`: a 700px window is not a desktop either. */}
      <section ref={seenEditions} className="hidden lg:block border-y border-line bg-sunken">
        <div className="shell py-5 sm:py-12">
          <p className="caps text-brass">{t.chooseEdition}</p>
          <h2 className="display text-[22px] sm:text-[38px] mt-3">{t.threeTypesettings}</h2>
          <p className="lede mt-3 max-w-prose2">
            {t.editionsNote}
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {designs.map((x) => (
              <EditionCard key={x.id} code={code} d={x} palette={palette}
                           on={design === x.id} onPick={() => setDesign(x.id)} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            {palettes.map((p) => (
              <button key={p.id} onClick={() => setPalette(p.id)} title={p.name[lang]}
                aria-label={p.name[lang]} aria-pressed={palette === p.id}
                className={`rounded-[2px] p-[3px] border transition
                  ${palette === p.id ? "border-brass" : "border-transparent hover:border-line"}`}>
                <span className="flex rounded-[1px] overflow-hidden w-14 h-8 border border-line">
                  {p.swatch.map((c, i) => <span key={i} style={{ background: c }} className="flex-1" />)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── The real table of contents ───────────────────────────────────── */}
      <section ref={seenContents} className="shell py-5 sm:py-14">
        <p className="caps text-brass">{t.whatsInside}</p>
        <h2 className="display text-[21px] sm:text-[36px] mt-2">
          {d ? t.allChapters(d.chapters) : t.contents}
        </h2>
        <p className="mt-2 text-[14px] sm:text-[17px] leading-relaxed text-muted max-w-prose2">
          {t.contentsBody}
        </p>

        {/* Tighter rows on a phone. This ran to fifteen hundred pixels — the
            tallest block on the page — for what is a list of chapter titles.
            The subtitles are the bulk of it, and they are detail for somebody
            already reading, so they wait for the desktop width. */}
        <ol className="mt-5 sm:mt-10 grid md:grid-cols-2 gap-x-14">
          {shown.map((c, i) => (
            <motion.li key={c.n}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .45, delay: Math.min(i, 13) * .035, ease: [0.22, 0.7, 0.2, 1] }}
              className="group flex gap-3 sm:gap-5 py-2 sm:py-4 border-b border-line">
              <span className="font-serif text-[13px] text-brass pt-[3px] w-7 shrink-0 tabular-nums">
                {String(c.n).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-[14.5px] sm:text-[16px] font-medium leading-snug transition-colors
                                 group-hover:text-brass">{c.title}</span>
                {c.subtitle && (
                  <span className="hidden sm:block text-[13.5px] text-muted mt-1">{c.subtitle}</span>
                )}
              </span>
            </motion.li>
          ))}
        </ol>
        {d && d.outline.length > shown.length && (
          <button className="btn-line mt-5 sm:mt-10" onClick={() => setAllChapters(true)}>
            {t.showAll(d.outline.length)}
          </button>
        )}
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      {/* ── Who it is for, and the questions this report raises ──────────────
          The FAQPage schema in lib/seo.ts is built from this same array, so the
          structured data can only describe answers that are on the page. ── */}
      {REPORT_FAQ[code] && (() => {
        // Dosh in Hindi mode uses the full Hindi FAQ so the section never mixes
        // languages; every other case keeps the existing (English) content.
        const hiDosh = code === "dosh" && lang === "hi";
        const faq = hiDosh ? DOSH_FAQ_HI : REPORT_FAQ[code];
        const deva = lang === "hi" ? "deva" : "";
        return (
        <section className="border-t border-line">
          <div className="shell py-5 sm:py-12 max-w-prose2">
            <h2 className={`display text-[21px] sm:text-[28px] leading-tight ${deva}`}>
              {lang === "hi" ? "यह रिपोर्ट किसके लिए है?" : "Who is this for?"}
            </h2>
            <p className={`mt-3 text-[15px] leading-relaxed text-muted ${deva}`}>{faq.forWhom}</p>

            <h3 className={`display text-[18px] sm:text-[22px] mt-9 ${deva}`}>
              {lang === "hi" ? "इस रिपोर्ट से जुड़े सवाल" : "Questions about this report"}
            </h3>
            <div className="mt-4">
              <Faq items={faq.faqs} idPrefix={`faq-${code}`} />
            </div>

            <p className={`mt-6 text-[13.5px] text-muted ${deva}`}>
              {lang === "hi" ? "कुंडली कैसे गणना होती है: " : "How the chart behind it is computed: "}
              <Link to="/methodology" className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass">
                {lang === "hi" ? "पद्धति" : "the methodology"}
              </Link>
              {code === "dosh" && (
                <>
                  {" · "}
                  <Link to="/learn" className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass">
                    {lang === "hi" ? "चौदहों दोष, समझाए हुए" : "all fourteen doshas, explained"}
                  </Link>
                </>
              )}
              {" · "}
              <Link to="/reports" className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass">
                {lang === "hi" ? "बाक़ी रिपोर्ट" : "the other reports"}
              </Link>
            </p>
          </div>
        </section>
        );
      })()}

      <section ref={seenClose} className="relative overflow-hidden grain lamp border-t border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[560px] max-w-[110vw] text-brass opacity-[.18]">
          <motion.div animate={{ rotate: [-3.5, 3.5, -3.5], scale: [1, 1.025, 1] }}
                      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}>
            <ChartMark className="w-full h-auto" draw={false} weight={0.4} numerals={false} />
          </motion.div>
        </div>
        <div className="shell relative z-10 py-7 sm:py-28 text-center">
          <span className="mx-auto mb-8 block h-8 w-px bg-gradient-to-b from-transparent to-brass" />
          <p className="deva foil text-[23px] sm:text-[40px] leading-[1.2] font-semibold">{pitch?.deva}</p>
          <h2 className="display text-[24px] sm:text-[46px] mt-3 max-w-[16ch] mx-auto leading-[1.05]">
            {t.closeLine}
          </h2>
          <div className="mt-10">
            <button className="btn-brass h-[54px] px-9 text-[16px]"
                    onClick={() => { track("report_cta_click", { code, where: "closing", language: lang }); onBuy(code, design, palette); }}>
              {code === "dosh" ? <span className={lang === "hi" ? "deva" : ""}>{lang === "hi" ? `मेरी कुंडली जांचें — ${price}` : `Check my chart — ${price}`}</span> : t.buyLong(price)}
            </button>
          </div>
          {code === "dosh" ? (
            <div className="mt-4 flex justify-center">{doshTrust()}</div>
          ) : (<>
            <p className="mt-4 text-[13px] text-faint">{t.allWeNeed}</p>
            <p className="mt-2 text-[13px] text-brass">{t.refundLine}</p>
          </>)}
          <div aria-hidden className="h-20 sm:hidden" />
        </div>
      </section>

      {/* The page ends on its own terms: one quiet line saying a person exists,
          then the buy button in the bar. No footer, no support card. */}
      <div className="shell pb-12 sm:pb-16 -mt-4">
        <Support tone="mini" where={`report/${code}`} />
      </div>

      {/* Thirty seconds on one report is interest; the ask is reasonable by
          then and an interruption before it. */}
      {/* SoftSignIn used to fire here after thirty seconds. WelcomeSheet now asks
          on arrival, and the two together stacked one modal on another and asked
          for the same phone number twice — the second one also wanting a name.
          One ask per visit, or it stops being an offer and becomes a toll. */}

      <SampleModal open={sample} onClose={() => setSample(false)} shots={shots}
                   title={(lang === "hi" ? d?.name_hi : d?.name_en) ?? ""} pdfUrl={d?.sample?.pdf} />

      {/* Mobile: the price and the button follow the reader down the page. This
          is the page paid traffic lands on; it must never be more than a thumb
          away from buying. */}
      <div className={`sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line
                       bg-surface/95 backdrop-blur-xl transition-transform duration-200
                       ${ctaSeen ? "translate-y-full" : "translate-y-0"}`}
           aria-hidden={ctaSeen}
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="shell py-3 flex items-center gap-4">
          <div className="shrink-0">
            <div className="flex items-baseline gap-1.5">
              {pv.discounted && (
                <span className="text-[13px] text-faint line-through decoration-faint/70">{pv.listText}</span>
              )}
              <span className="display text-[20px] leading-none">{price}</span>
            </div>
            <div className="text-[11px] text-faint mt-1">
              {d ? t.chaptersCount(d.chapters) : "\u00a0"}
            </div>
          </div>
          <button className="btn-brass flex-1 h-[50px] text-[15.5px]"
                  onClick={() => { track("report_cta_click", { code, where: "sticky", language: lang }); onBuy(code, design, palette); }}>
            {code === "dosh" ? <span className={lang === "hi" ? "deva" : ""}>{lang === "hi" ? `मेरी कुंडली जांचें — ${price}` : `Check my chart — ${price}`}</span> : t.buyBare}
          </button>
        </div>
      </div>
    </>
  );
}
