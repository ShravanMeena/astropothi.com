import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ── shared behaviour ──────────────────────────────────────────────────────
   One dismiss rule for every picker: click outside, or press Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  // Held in a ref so the listener is attached once per open, not re-attached on
  // every render — callers pass an inline arrow, which is a new function each
  // time and was tearing the listener down and rebuilding it constantly.
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    /**
     * pointerdown, not mousedown.
     *
     * On Android the month and year `<select>` open as a native overlay, and
     * choosing an option dispatches a mousedown whose target is that overlay —
     * outside this panel. The panel closed before the change applied, so the
     * date could be set once and never corrected. pointerdown fires from the
     * real touch, and the two guards below reject the synthetic ones.
     */
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      // A native select overlay's option is not in the document, and neither is
      // an element React has already unmounted. Either way it is not an
      // "outside click" — it is the browser's own UI.
      if (!document.contains(t)) return;
      if (ref.current?.contains(t)) return;
      closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return ref;
}

const panel = "absolute z-40 mt-2 rounded-[3px] border border-line bg-raised shadow-lift " +
              "ring-1 ring-brass/15 overflow-hidden";
const anim = {
  initial: { opacity: 0, y: -6, scale: .985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: .985 },
  transition: { duration: .16, ease: [0.22, 0.7, 0.2, 1] as const }
};

/** The trigger every picker shares, so they line up with .field inputs. */
function Trigger({ open, filled, children, onClick, ...rest }: {
  open: boolean; filled: boolean; children: React.ReactNode; onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" onClick={onClick} aria-haspopup="dialog" aria-expanded={open}
      className={`field flex items-center justify-between text-left
                  ${filled ? "text-fg" : "text-faint"} ${open ? "border-brass ring-4 ring-brass/10" : ""}`}
      {...rest}>
      <span className="truncate">{children}</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
           strokeWidth="2" className={`shrink-0 ml-2 text-faint transition-transform duration-200
                                       ${open ? "rotate-180" : ""}`}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

/* ── Select ───────────────────────────────────────────────────────────────── */

export function Select({ value, onChange, options, ariaLabel, placeholder = "Select" }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; ariaLabel?: string;
  /** Shown until a real choice is made, so an unanswered field looks unanswered. */
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <Trigger open={open} filled={!!current} onClick={() => setOpen(!open)} aria-label={ariaLabel}>
        {current?.label ?? placeholder}
      </Trigger>
      <AnimatePresence>
        {open && (
          <motion.div {...anim} className={`${panel} left-0 right-0 py-1.5`} role="listbox">
            {options.map((o) => (
              <button key={o.value} type="button" role="option" aria-selected={o.value === value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[15px] transition
                  ${o.value === value ? "text-brass bg-brassSoft/40" : "text-fg hover:bg-sunken"}`}>
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Date of birth ────────────────────────────────────────────────────────── */

const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
const WD = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
// Day-of-week and length via UTC, so a browser east or west of Greenwich cannot
// shift somebody's birthday by one day.
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const firstWeekday = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).getUTCDay();

export function DateField({ value, onChange, minYear = 1920 }: {
  value: string; onChange: (v: string) => void; minYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const today = new Date();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? { y: +value.slice(0, 4), m: +value.slice(5, 7) - 1, d: +value.slice(8, 10) } : null;
  const [view, setView] = useState(() => parsed ?? { y: 1995, m: 0, d: 0 });

  // Reopening on a chosen date should land on that month, not wherever the user
  // last browsed to.
  useLayoutEffect(() => { if (open && parsed) setView(parsed); }, [open]);

  const years = Array.from({ length: today.getFullYear() - minYear + 1 },
                           (_, i) => today.getFullYear() - i);
  const shift = (by: number) => {
    const m = view.m + by;
    setView({ ...view, y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });
  };

  const total = daysIn(view.y, view.m);
  const lead = firstWeekday(view.y, view.m);
  const future = (d: number) => new Date(Date.UTC(view.y, view.m, d)) > today;

  return (
    <div className="relative" ref={ref}>
      <Trigger open={open} filled={!!parsed} onClick={() => setOpen(!open)} aria-label="Date of birth">
        {parsed ? `${parsed.d} ${MONTHS[parsed.m]} ${parsed.y}` : "Select date"}
      </Trigger>
      <AnimatePresence>
        {open && (
          <motion.div {...anim} className={`${panel} left-0 w-[336px] p-4`} role="dialog"
                      aria-label="Choose date of birth">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous month" onClick={() => shift(-1)}
                className="h-8 w-8 rounded-full grid place-items-center text-muted hover:text-brass hover:bg-sunken">←</button>
              <div className="flex-1 grid grid-cols-[1.4fr_1fr] gap-2">
                <select value={view.m} aria-label="Month"
                        onChange={(e) => setView({ ...view, m: +e.target.value })}
                        className="h-9 rounded-[2px] border border-line bg-surface text-[13.5px] px-2 outline-none focus:border-brass">
                  {MONTHS.map((m, n) => <option key={m} value={n}>{m}</option>)}
                </select>
                <select value={view.y} aria-label="Year"
                        onChange={(e) => setView({ ...view, y: +e.target.value })}
                        className="h-9 rounded-[2px] border border-line bg-surface text-[13.5px] px-2 outline-none focus:border-brass">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button type="button" aria-label="Next month" onClick={() => shift(1)}
                className="h-8 w-8 rounded-full grid place-items-center text-muted hover:text-brass hover:bg-sunken">→</button>
            </div>

            <div className="grid grid-cols-7 mt-4 mb-1">
              {WD.map((w, n) => <span key={n} className="text-center caps text-faint">{w}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: lead }).map((_, n) => <span key={`x${n}`} />)}
              {Array.from({ length: total }, (_, n) => n + 1).map((d) => {
                const on = parsed && parsed.y === view.y && parsed.m === view.m && parsed.d === d;
                const off = future(d);
                return (
                  <button key={d} type="button" disabled={off}
                    onClick={() => { onChange(iso(view.y, view.m, d)); setOpen(false); }}
                    className={`h-9 rounded-full text-[14px] tabular-nums transition
                      ${on ? "bg-brass text-surface font-medium"
                           : off ? "text-faint/40 cursor-default"
                                 : "text-fg hover:bg-sunken"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Time of birth ────────────────────────────────────────────────────────── */

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const ok = /^\d{2}:\d{2}$/.test(value);
  const H = ok ? +value.slice(0, 2) : 9;
  const M = ok ? +value.slice(3, 5) : 0;
  const pm = H >= 12;
  const h12 = H % 12 === 0 ? 12 : H % 12;

  const emit = (nh12: number, nm: number, npm: boolean) =>
    onChange(`${pad(npm ? (nh12 % 12) + 12 : nh12 % 12)}:${pad(nm)}`);

  // Bring the current value into view when the panel opens — scrolling to 47
  // through a 60-row list is not something a buyer should have to do.
  const cols = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    cols.current?.querySelectorAll<HTMLElement>("[data-on='1']")
      .forEach((el) => el.scrollIntoView({ block: "center" }));
  }, [open]);

  const Col = ({ items, active, onPick, label }: {
    items: number[]; active: number; onPick: (n: number) => void; label: string;
  }) => (
    <div className="flex-1 min-w-0">
      <div className="caps text-faint text-center pb-2 border-b border-line">{label}</div>
      <div className="h-[188px] overflow-y-auto py-1 scroll-smooth">
        {items.map((n) => (
          <button key={n} type="button" data-on={n === active ? "1" : "0"} onClick={() => onPick(n)}
            className={`w-full h-9 text-[14.5px] tabular-nums rounded-[2px] transition
              ${n === active ? "bg-brass text-surface font-medium" : "text-fg hover:bg-sunken"}`}>
            {pad(n)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <Trigger open={open} filled={ok} onClick={() => setOpen(!open)} aria-label="Time of birth">
        {ok ? `${pad(h12)}:${pad(M)} ${pm ? "PM" : "AM"}` : "Select time"}
      </Trigger>
      <AnimatePresence>
        {open && (
          <motion.div {...anim} className={`${panel} left-0 w-[290px] p-4`} role="dialog"
                      aria-label="Choose time of birth">
            <div ref={cols} className="flex gap-3">
              <Col label="Hour" items={Array.from({ length: 12 }, (_, n) => n + 1)}
                   active={h12} onPick={(n) => emit(n, M, pm)} />
              <Col label="Min" items={Array.from({ length: 60 }, (_, n) => n)}
                   active={M} onPick={(n) => emit(h12, n, pm)} />
              <div className="w-[62px] shrink-0">
                <div className="caps text-faint text-center pb-2 border-b border-line">&nbsp;</div>
                <div className="py-1 space-y-1">
                  {[["AM", false], ["PM", true]].map(([t, v]) => (
                    <button key={t as string} type="button" onClick={() => emit(h12, M, v as boolean)}
                      className={`w-full h-9 text-[13.5px] rounded-[2px] transition
                        ${pm === v ? "bg-brass text-surface font-medium" : "text-fg hover:bg-sunken"}`}>
                      {t as string}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="btn-brass btn-sm w-full mt-4">Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
