import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { api, rupees, type Design, type Palette } from "../lib/api";
import ChartMark from "../components/ChartMark";
import PageTurner from "../components/PageTurner";
import Engine from "../sections/Engine";
import SampleModal from "../components/SampleModal";
import { COVER_PALETTE } from "../components/ReportCover";
import CountUp from "../components/CountUp";
import { track } from "../lib/track";

type Detail = {
  code: string; name_en: string; chapters: number; price_paise: number; approx_pages: number;
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
            ? <img src={thumb} alt={`${d.name.en} layout`} className="w-full block" loading="lazy" />
            : <span className="block w-full h-full animate-pulse" />}
        </span>
      </span>
      <span className="block p-5">
        <span className="block font-serif text-[19px]">{d.name.en}</span>
        <span className="block text-[13.5px] text-muted mt-1.5 leading-snug">{d.tagline.en}</span>
      </span>
    </button>
  );
}

export default function ReportPage({ code, designs, palettes, onBuy, onHome }: {
  code: string; designs: Design[]; palettes: Palette[];
  onBuy: (code: string, design: string, palette: string) => void; onHome: () => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [design, setDesign] = useState("heritage");
  const [palette, setPalette] = useState(() => COVER_PALETTE[code] || "gold");
  const [allChapters, setAllChapters] = useState(false);
  const [sample, setSample] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // The stack drifts up and the chart rotates as the hero leaves — slow enough
  // to read as depth rather than as an effect.
  const stackY  = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const markRot = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 16]);

  // …and follow it when the buyer moves between reports without a full load.
  useEffect(() => { setPalette(COVER_PALETTE[code] || "gold"); }, [code]);

  useEffect(() => {
    setD(null); setErr("");
    api.get(`/noauth-api/v1/shop/report/${code}?design=${design}&palette=${palette}`)
      .then(setD).catch((e) => setErr(e.message));
  }, [code, design, palette]);

  const pitch = PITCH[code];
  // approx_pages is the classic render; the sample knows the count for the
  // design actually on screen.
  const pages = d?.sample?.pages ?? d?.approx_pages ?? null;
  const shown = d ? (allChapters ? d.outline : d.outline.slice(0, 14)) : [];
  const shots = d?.sample?.images ?? [];
  const price = d ? rupees(d.price_paise) : "…";

  return (
    <>
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

        <div className="shell relative z-10 pt-6 pb-16 sm:pb-24">
          <button onClick={onHome} className="caps text-faint hover:text-fg transition">← All reports</button>

          <div className="mt-10 grid lg:grid-cols-[1.02fr_.98fr] gap-y-14 gap-x-16 items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-brass" />
                <span className="caps text-brass">
                  {d ? `${d.chapters} chapters · ${pages} pages` : "Vedic report"}
                </span>
              </div>

              <h1 className="mt-6">
                <span className="deva foil block text-[44px] sm:text-[64px] leading-[1.18] font-semibold -ml-[.02em]">
                  {pitch?.deva}
                </span>
                <span className="display block text-[40px] sm:text-[64px] lg:text-[74px] leading-[.98] mt-1">
                  {d?.name_en || " "}
                </span>
              </h1>

              {pitch && (
                <>
                  <p className="mt-7 text-[21px] sm:text-[24px] font-serif text-fg leading-snug">{pitch.line}</p>
                  <p className="lede mt-4 max-w-prose2">{pitch.body}</p>
                </>
              )}
              {err && <p className="mt-4 text-[14px] text-ember">{err}</p>}

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button className="btn-brass h-[52px] px-8 text-[16px]"
                        onClick={() => onBuy(code, design, palette)}>
                  Generate mine — {price}
                </button>
                {d?.sample && (
                  <button className="btn-line h-[52px]"
                          onClick={() => { track("sample_opened", { code }); setSample(true); }}>
                    Read a sample
                  </button>
                )}
              </div>
              <p className="mt-4 text-[13px] text-faint">
                Delivered as a PDF in under a minute · No account needed
              </p>

              {/* The guarantee sits with the buy button, not buried in a policy
                  page. The whole objection to a ₹399 reading is "what if it is
                  worthless to me" — answering it anywhere else is answering it
                  too late. */}
              <div className="mt-6 inline-flex items-start gap-3 rounded-xl border border-brass/35
                              bg-brassSoft/25 dark:bg-brass/10 px-4 py-3 max-w-prose2">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
                     strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                     className="text-brass shrink-0 mt-px" aria-hidden>
                  <path d="M12 3l7.5 3v5.2c0 4.4-3 8.3-7.5 9.6-4.5-1.3-7.5-5.2-7.5-9.6V6z" />
                  <path d="m9 12 2.2 2.2L15.5 10" />
                </svg>
                <p className="text-[13.5px] leading-relaxed text-fg">
                  <strong>100% refund, no questions asked.</strong>{" "}
                  <span className="text-muted">
                    Not satisfied with your report? Message us and we return the full amount. You
                    do not have to explain why, and you keep the file.
                  </span>
                </p>
              </div>
            </div>

            {/* The artefact, at a size you can actually judge — and turnable,
                because a book that only sits there is a photograph. */}
            <motion.div style={{ y: stackY }} className="relative mx-auto w-full max-w-[380px]">
              <PageTurner shots={shots} single maxW={380} showChrome={false} />
              <p className="mt-6 text-center caps text-faint">
                Tap the page to turn · {designs.find((x) => x.id === design)?.name.en ?? ""} edition
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── The three facts that decide the sale ─────────────────────────── */}
      <section className="border-b border-line bg-sunken">
        <div className="shell grid grid-cols-3 divide-x divide-line">
          {[
            [d ? String(d.chapters) : "—", "Chapters"],
            [pages ? String(pages) : "—", "Pages"],
            [price, "One-time"]
          ].map(([v, k], i) => (
            <div key={i} className="py-8 sm:py-10 px-4 text-center">
              <div className="display foil text-[38px] sm:text-[52px] leading-none">
                <CountUp value={v} />
              </div>
              <div className="caps text-faint mt-3">{k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── The sample, as a book you turn ──────────────────────────────── */}
      {shots.length > 1 && (
        <section className="relative overflow-hidden grain border-b border-line">
          <div className="shell relative z-10 py-16 sm:py-24">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="caps text-brass">Inside the book</p>
                <h2 className="display text-[30px] sm:text-[44px] mt-3">Turn the pages.</h2>
              </div>
              <p className="lede max-w-[38ch]">
                Real spreads from this exact edition — the opening chapters and two
                pages from deep inside, where the reading actually lives.
              </p>
            </div>

            <div className="mt-12 sm:mt-16">
              <PageTurner shots={shots} scrollFlip maxW={780}
                          caption={`${d?.name_en ?? ""} · sample`} />
            </div>
          </div>
        </section>
      )}

      <Engine />

      {/* ── Design and colour ────────────────────────────────────────────── */}
      <section className="border-y border-line bg-sunken">
        <div className="shell py-16 sm:py-20">
          <p className="caps text-brass">Choose the edition</p>
          <h2 className="display text-[28px] sm:text-[38px] mt-3">Three typesettings. Seven inks.</h2>
          <p className="lede mt-3 max-w-prose2">
            The pages above re-render as you choose — this is the book you receive.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {designs.map((x) => (
              <EditionCard key={x.id} code={code} d={x} palette={palette}
                           on={design === x.id} onPick={() => setDesign(x.id)} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            {palettes.map((p) => (
              <button key={p.id} onClick={() => setPalette(p.id)} title={p.name.en}
                aria-label={p.name.en} aria-pressed={palette === p.id}
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
      <section className="shell py-16 sm:py-24">
        <p className="caps text-brass">What's inside</p>
        <h2 className="display text-[30px] sm:text-[44px] mt-3">
          {d ? `All ${d.chapters} chapters.` : "Contents"}
        </h2>
        <p className="lede mt-3 max-w-prose2">
          The actual table of contents — not a summary of one. Every chapter is written
          from your own placements.
        </p>

        <ol className="mt-12 grid md:grid-cols-2 gap-x-14">
          {shown.map((c, i) => (
            <motion.li key={c.n}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: .45, delay: Math.min(i, 13) * .035, ease: [0.22, 0.7, 0.2, 1] }}
              className="group flex gap-5 py-4 border-b border-line">
              <span className="font-serif text-[13px] text-brass pt-[3px] w-7 shrink-0 tabular-nums">
                {String(c.n).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-[16px] font-medium leading-snug transition-colors
                                 group-hover:text-brass">{c.title}</span>
                {c.subtitle && <span className="block text-[13.5px] text-muted mt-1">{c.subtitle}</span>}
              </span>
            </motion.li>
          ))}
        </ol>
        {d && d.outline.length > shown.length && (
          <button className="btn-line mt-10" onClick={() => setAllChapters(true)}>
            Show all {d.outline.length} chapters
          </button>
        )}
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden grain lamp border-t border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[560px] max-w-[110vw] text-brass opacity-[.18]">
          <motion.div animate={{ rotate: [-3.5, 3.5, -3.5], scale: [1, 1.025, 1] }}
                      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}>
            <ChartMark className="w-full h-auto" draw={false} weight={0.4} numerals={false} />
          </motion.div>
        </div>
        <div className="shell relative z-10 py-20 sm:py-28 text-center">
          <span className="mx-auto mb-8 block h-8 w-px bg-gradient-to-b from-transparent to-brass" />
          <p className="deva foil text-[30px] sm:text-[40px] leading-[1.2] font-semibold">{pitch?.deva}</p>
          <h2 className="display text-[32px] sm:text-[46px] mt-3 max-w-[16ch] mx-auto leading-[1.05]">
            Your chart, written out in full.
          </h2>
          <div className="mt-10">
            <button className="btn-brass h-[54px] px-9 text-[16px]"
                    onClick={() => onBuy(code, design, palette)}>
              Generate mine — {price}
            </button>
          </div>
          <p className="mt-4 text-[13px] text-faint">Birth date, time and place is all we need.</p>
          {/* Repeated at the bottom because this is where the reader who scrolled
              the whole page decides, and they should not have to scroll back up
              to be reminded there is nothing to lose. */}
          <p className="mt-2 text-[13px] text-brass">
            100% refund, no questions asked, if it is not worth it to you.
          </p>
          <div aria-hidden className="h-20 sm:hidden" />
        </div>
      </section>

      <SampleModal open={sample} onClose={() => setSample(false)} shots={shots}
                   title={d?.name_en ?? ""} pdfUrl={d?.sample?.pdf} />

      {/* Mobile: the price and the button follow the reader down the page. This
          is the page paid traffic lands on; it must never be more than a thumb
          away from buying. */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line
                      bg-surface/95 backdrop-blur-xl"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="shell py-3 flex items-center gap-4">
          <div className="shrink-0">
            <div className="display text-[20px] leading-none">{price}</div>
            <div className="text-[11px] text-faint mt-1">
              {d ? `${d.chapters} chapters` : "\u00a0"}
            </div>
          </div>
          <button className="btn-brass flex-1 h-[50px] text-[15.5px]"
                  onClick={() => onBuy(code, design, palette)}>
            Generate mine
          </button>
        </div>
      </div>
    </>
  );
}
