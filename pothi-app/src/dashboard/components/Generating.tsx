import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";

const STEP_MS = 1150;
const MIN_TOTAL_MS = 6000;   // the moment should feel substantial, not instant

/**
 * The generation moment. Rendering takes 0.4–3s, which reads as "nothing
 * happened" — so the stages are paced over ~7s and narrate the real work.
 * It never finishes before the server has answered.
 */
export default function Generating({ chapters, done, onFinish }: {
  chapters: number; done: boolean; onFinish: () => void;
}) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const steps = t.gen.steps;

  const [i, setI] = useState(0);
  const [pct, setPct] = useState(0);

  // Refs so the completion effect depends ONLY on `done`. Depending on `i` made
  // every narration tick clear its own completion timer — the animation hung.
  const iRef = useRef(0);
  const startedAt = useRef(Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => { iRef.current = i; }, [i]);

  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  // Creep to 92%; only the server's answer completes it.
  useEffect(() => {
    const id = setInterval(() => setPct((p) => (p < 92 ? p + Math.max(0.5, (92 - p) / 30) : p)), 70);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    const elapsed = Date.now() - startedAt.current;
    const stagesLeft = (steps.length - 1 - iRef.current) * 380;
    const wait = Math.max(stagesLeft + 250, MIN_TOTAL_MS - elapsed);
    const a = setTimeout(() => {
      setI(steps.length - 1);
      setPct(100);
    }, wait);
    const b = setTimeout(() => finishRef.current(), wait + 700);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [done, steps.length]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-fg/88 backdrop-blur-sm px-5">
      <div className="w-full max-w-[440px] text-center">
        <svg viewBox="0 0 120 120" className="mx-auto w-32 h-32 sm:w-36 sm:h-36" aria-hidden>
          <defs>
            <style>{`
              .dw { stroke-dasharray: 200; stroke-dashoffset: 200; animation: draw 2.1s ease-in-out infinite alternate; }
              .dw2 { animation-delay: .28s } .dw3 { animation-delay: .56s }
              @keyframes draw { to { stroke-dashoffset: 0 } }
              .pulse { animation: pl 2.4s ease-in-out infinite }
              @keyframes pl { 0%,100%{opacity:.25} 50%{opacity:1} }
            `}</style>
          </defs>
          <rect x="12" y="12" width="96" height="96" fill="none" stroke="#C29A3C" strokeWidth="1.4" className="dw" />
          <path d="M12 12 108 108M108 12 12 108" fill="none" stroke="#C29A3C" strokeWidth="1" className="dw dw2" />
          <path d="M60 12 108 60 60 108 12 60Z" fill="none" stroke="#E8CE92" strokeWidth="1" className="dw dw3" />
          {[[60, 34], [86, 60], [60, 86], [34, 60]].map(([cx, cy], k) => (
            <circle key={k} cx={cx} cy={cy} r="2.6" fill="#C29A3C" className="pulse"
                    style={{ animationDelay: `${k * 0.3}s` }} />
          ))}
        </svg>

        <h2 className={`display text-[24px] text-surface mt-6 ${dv}`}>{t.gen.title}</h2>

        <div className="mt-6 h-1 rounded-full bg-raised/12 overflow-hidden">
          <div className="h-full rounded-full bg-brass transition-all duration-300 ease-out"
               style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-6 space-y-2.5 text-left">
          {steps.map((s, k) => {
            const state = k < i ? "done" : k === i ? "now" : "todo";
            return (
              <div key={s} className={`flex items-center gap-3 transition-all duration-300
                ${state === "todo" ? "opacity-30" : "opacity-100"}`}>
                <span className={`shrink-0 w-4 h-4 rounded-full grid place-items-center transition
                  ${state === "done" ? "bg-brass" : state === "now" ? "bg-transparent border-2 border-brass" : "bg-raised/15"}`}>
                  {state === "done" && (
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#0E0C0A"
                         strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  )}
                  {state === "now" && <span className="w-1.5 h-1.5 rounded-full bg-brass animate-ping" />}
                </span>
                <span className={`text-[13.5px] ${dv} ${state === "now" ? "text-surface font-medium" : "text-faint"}`}>
                  {s.replace("{n}", String(chapters))}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-7 text-[11.5px] text-muted">{t.gen.hint}</p>
      </div>
    </div>
  );
}
