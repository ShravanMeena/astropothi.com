import { motion } from "framer-motion";
import { type ReportItem } from "../lib/api";
import ReportCard from "../components/ReportCard";
import ChartMark from "../components/ChartMark";


export default function ReportsPage({ items, onPick, onAskGuide }: {
  items: ReportItem[]; onPick: (code: string) => void; onAskGuide: () => void;
}) {
  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[860px] max-w-[128vw] text-brass opacity-[.14] dark:opacity-[.18]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>
        <div className="shell relative z-10 py-11 sm:py-24">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-brass" />
            <span className="caps text-brass">{items.length} readings</span>
          </div>
          <h1 className="display text-[26px] sm:text-[60px] leading-[1.02] mt-6 max-w-[16ch]">
            One engine. Many ways of reading.
          </h1>
          <p className="lede mt-5 max-w-prose2">
            Every report is computed from the same ephemeris and the same birth moment.
            They differ in what they look at, not in how carefully they look.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button className="btn-brass h-[52px] px-8 text-[16px]" onClick={onAskGuide}>
              Not sure? Answer four questions
            </button>
          </div>
        </div>
      </section>

      <section className="shell py-11 sm:py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((r, i) => (
            <motion.div key={r.code}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .45, delay: Math.min(i, 6) * .05, ease: [0.22, 0.7, 0.2, 1] }}>
              <ReportCard item={r} onPick={onPick} featured={r.code === "kundli"} />
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
