import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { rupees, type ReportItem } from "../lib/api";
import { track } from "../lib/track";

/**
 * The guide: a few questions, then one recommendation.
 *
 * This is a decision tree, not a language model — it cannot be asked anything
 * and it does not pretend otherwise. That is deliberate: a buyer choosing
 * between seven reports needs a confident answer in four taps, and a rule set a
 * jyotishi can audit beats a chatbot that improvises about somebody's marriage.
 */

type Node =
  | { kind: "ask"; id: string; q: string; note?: string; options: { label: string; sub?: string; next: string }[] }
  | { kind: "pick"; id: string; code: string; why: string };

const TREE: Node[] = [
  {
    kind: "ask", id: "start",
    q: "What brought you here?",
    options: [
      { label: "Marriage and relationships", sub: "Timing, compatibility, what the 7th house says", next: "love-why" },
      { label: "Something feels blocked",    sub: "Repeated setbacks, delays, a run of bad luck",   next: "block-why" },
      { label: "Health and energy",          sub: "Constitution and what your chart asks you to watch", next: "pick-health" },
      { label: "It started when we moved",   sub: "The house itself — direction, layout, what sits where", next: "pick-vastu" },
      { label: "I want the whole picture",   sub: "Every house, every planet, top to bottom",       next: "pick-kundli" }
    ]
  },
  {
    kind: "ask", id: "love-why",
    q: "Which part of it?",
    options: [
      { label: "When will it happen?",        sub: "Dasha windows when marriage ripens",   next: "pick-love" },
      { label: "Am I manglik?",               sub: "Tested both ways, with cancellations", next: "pick-dosh" },
      { label: "How will the marriage go?",   sub: "The 7th lord, Venus, and the navamsa", next: "pick-love" }
    ]
  },
  {
    kind: "ask", id: "block-why",
    q: "Has anyone named a dosh to you?",
    note: "Manglik, Kaal Sarp, Sade Sati, Pitra — that sort of thing.",
    options: [
      { label: "Yes, and I want it checked properly", sub: "Fourteen doshas, with the cancellations most readings skip", next: "pick-dosh" },
      { label: "No, but this year has been hard",     sub: "The year ahead, month by month", next: "pick-varshaphal" },
      { label: "I would rather see everything",       sub: "The full reading", next: "pick-kundli" }
    ]
  },
  { kind: "pick", id: "pick-kundli",     code: "kundli",     why: "It reads every house in turn, so nothing you asked about is left out." },
  { kind: "pick", id: "pick-love",       code: "love",       why: "It goes straight at the 7th house, Venus and the navamsa — the placements that decide marriage." },
  { kind: "pick", id: "pick-dosh",       code: "dosh",       why: "It tests fourteen doshas against classical rules and checks the cancellations most readings ignore." },
  { kind: "pick", id: "pick-health",     code: "health",     why: "It reads the lagna, the 6th house and your prakriti — the constitution behind how you feel." },
  { kind: "pick", id: "pick-vastu",      code: "vastu",      why: "It reads the building rather than the birth chart — which direction each room sits in, and where that departs from the mandala." },
  { kind: "pick", id: "pick-varshaphal", code: "varshaphal", why: "It casts the annual chart for your solar return and walks the year month by month." }
];

const at = (id: string) => TREE.find((n) => n.id === id)!;

type Turn = { who: "guide" | "you"; text: string };

export default function Guide({ items, open, onClose, onReport, onBuy }: {
  items: ReportItem[]; open: boolean; onClose: () => void;
  onReport: (code: string) => void; onBuy: (code: string) => void;
}) {
  const [id, setId] = useState("start");
  const [log, setLog] = useState<Turn[]>([]);
  const feed = useRef<HTMLDivElement>(null);
  const node = at(id);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [id, log.length]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const answer = (label: string, next: string) => {
    track("guide_answered", { choice: label, next });
    setLog((l) => [...l, { who: "you", text: label }]);
    setId(next);
  };
  const restart = () => { setLog([]); setId("start"); };

  const rec = node.kind === "pick" ? items.find((r) => r.code === node.code) : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: .97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: .97 }}
          transition={{ duration: .22, ease: [0.22, 0.7, 0.2, 1] }}
          role="dialog" aria-label="Which report suits me"
          className="fixed z-50 bottom-4 right-4 left-4 sm:left-auto sm:w-[400px]
                     rounded-[4px] border border-line bg-raised shadow-lift ring-1 ring-brass/20
                     overflow-hidden flex flex-col max-h-[min(620px,calc(100dvh-2rem))]">

          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line bg-sunken">
            <div>
              <div className="caps text-brass">Which report suits me</div>
              <div className="text-[13px] text-faint mt-1">Four taps, then a straight answer.</div>
            </div>
            <button onClick={onClose} aria-label="Close"
                    className="h-8 w-8 rounded-full grid place-items-center text-faint hover:text-fg hover:bg-raised">✕</button>
          </div>

          <div ref={feed} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
            {log.map((t, n) => (
              <motion.div key={n} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={t.who === "you" ? "flex justify-end" : ""}>
                <span className={`inline-block max-w-[85%] rounded-[3px] px-3.5 py-2 text-[14px] leading-snug
                  ${t.who === "you" ? "bg-brass text-surface" : "bg-sunken text-fg"}`}>
                  {t.text}
                </span>
              </motion.div>
            ))}

            {node.kind === "ask" ? (
              <motion.div key={node.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[15.5px] font-medium">{node.q}</p>
                {node.note && <p className="text-[13px] text-faint mt-1.5">{node.note}</p>}
                <div className="grid gap-2 mt-4">
                  {node.options.map((o) => (
                    <button key={o.label} onClick={() => answer(o.label, o.next)}
                      className="text-left rounded-[3px] border border-line bg-surface px-4 py-3
                                 transition hover:border-brass hover:bg-sunken">
                      <span className="block text-[14.5px] font-medium">{o.label}</span>
                      {o.sub && <span className="block text-[12.5px] text-muted mt-0.5 leading-snug">{o.sub}</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key={node.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="caps text-brass">Start here</p>
                <h3 className="display text-[24px] mt-2">{rec?.name_en ?? node.code}</h3>
                <p className="text-[14px] text-muted mt-2 leading-relaxed">{node.why}</p>
                {rec && (
                  <p className="text-[13px] text-faint mt-3">
                    {rec.chapters} chapters · {rupees(rec.price_paise)}
                  </p>
                )}
                <div className="grid gap-2 mt-5">
                  <button className="btn-brass w-full"
                          onClick={() => { track("guide_recommended", { code: node.code, action: "buy" }); onBuy(node.code); onClose(); }}>
                    Fill in my birth details
                  </button>
                  <button className="btn-line w-full"
                          onClick={() => { track("guide_recommended", { code: node.code, action: "read" }); onReport(node.code); onClose(); }}>
                    See what's inside first
                  </button>
                  <button className="btn-quiet w-full" onClick={restart}>Ask me again</button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The always-there button that opens it. */
export function GuideButton({ onClick, hidden }: { onClick: () => void; hidden?: boolean }) {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          initial={{ opacity: 0, scale: .8, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: .8, y: 12 }} transition={{ duration: .22 }}
          onClick={onClick}
          className="fixed z-40 bottom-5 right-5 h-14 pl-5 pr-6 rounded-full bg-brass text-surface
                     shadow-lift ring-1 ring-black/10 flex items-center gap-3
                     transition-transform hover:scale-[1.03] active:scale-[.98]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
               strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.3 9.3 0 0 1-3.3-.6L3 21l1.8-5a8.2 8.2 0 0 1-.8-3.5 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 8.4Z" />
          </svg>
          <span className="text-[15px] font-medium whitespace-nowrap">Which report?</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
