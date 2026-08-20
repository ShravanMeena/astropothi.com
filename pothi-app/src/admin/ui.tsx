import { useEffect, useRef, useState, type ReactNode } from "react";
import { rupees, num } from "./api";

/**
 * Admin primitives.
 *
 * Two rules, both learned the hard way in this codebase:
 *
 *   - Semantic tokens only. `bg-brass-400`, `text-ink-500` and friends are not
 *     defined in tailwind.config.js, compile to nothing, and render an unstyled
 *     screen that looks like a load failure. If a colour is wanted that the
 *     token set does not have, the answer is to use one it does — not to invent
 *     a scale. There is deliberately no green here: "paid" is brass.
 *   - Never bg-white / text-white. They survive one theme and ruin the other.
 *     `bg-raised` and `text-surface` are the theme-aware equivalents.
 */

// ── Layout ───────────────────────────────────────────────────────────────────

export function Panel({ title, sub, right, children, className = "" }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3.5 border-b border-line">
          <div className="min-w-0">
            {title && <h2 className="text-[13.5px] font-semibold text-fg leading-tight">{title}</h2>}
            {sub && <p className="mt-0.5 text-[11.5px] text-faint leading-snug">{sub}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone = "plain" }: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: "plain" | "brass" | "ember";
}) {
  const colour = tone === "brass" ? "text-brass" : tone === "ember" ? "text-ember" : "text-fg";
  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="caps text-faint">{label}</div>
      <div className={`mt-1.5 font-serif text-[26px] leading-none tracking-tightest tabular-nums ${colour}`}>{value}</div>
      {sub && <div className="mt-1.5 text-[11.5px] text-muted leading-snug">{sub}</div>}
    </div>
  );
}

/** A row of stats that stays readable when it wraps. */
export const StatRow = ({ children, cols = 4 }: { children: ReactNode; cols?: number }) => (
  <div className={`grid divide-y sm:divide-y-0 sm:divide-x divide-line
                   grid-cols-1 sm:grid-cols-2 ${cols >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
    {children}
  </div>
);

// ── Tables ───────────────────────────────────────────────────────────────────
// Wrapped in an overflow-x container: a dense table must scroll inside itself
// rather than making the whole page scroll sideways.

/**
 * `pin` caps the table at viewport height and freezes the header row.
 *
 * Without it a 200-row order list scrolls its own column headings off the top,
 * and by row 40 nobody can tell which ₹ column is gross and which is net.
 * Sticky only works against a scroll container, which is why the height cap and
 * the pinned header have to arrive together.
 */
export const TableWrap = ({ children, pin }: { children: ReactNode; pin?: boolean }) => (
  <div className={pin ? "overflow-auto max-h-[calc(100dvh-15rem)]" : "overflow-x-auto"}>
    <table className="w-full text-[12.5px] border-collapse">{children}</table>
  </div>
);

export const Th = ({ children, align = "left", w, pin }: {
  children?: ReactNode; align?: "left" | "right"; w?: string; pin?: boolean;
}) => (
  <th style={w ? { width: w } : undefined}
      className={`caps text-faint font-semibold whitespace-nowrap px-3 py-2.5 border-b border-line
                  ${align === "right" ? "text-right" : "text-left"}
                  ${pin ? "sticky top-0 z-10 bg-raised" : ""}`}>{children}</th>
);

/** Header row that pins itself — saves passing `pin` to every single Th. */
export const PinnedHead = ({ children }: { children: ReactNode }) => (
  <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-raised">{children}</thead>
);

export const Td = ({ children, align = "left", mono, dim, className = "" }: {
  children?: ReactNode; align?: "left" | "right"; mono?: boolean; dim?: boolean; className?: string;
}) => (
  <td className={`px-3 py-2.5 align-top border-b border-line/60 ${align === "right" ? "text-right tabular-nums" : ""}
                  ${mono ? "font-mono text-[11.5px]" : ""} ${dim ? "text-muted" : "text-fg"} ${className}`}>
    {children}
  </td>
);

export const Tr = ({ children, onClick, active }: { children: ReactNode; onClick?: () => void; active?: boolean }) => (
  <tr onClick={onClick}
      className={`${onClick ? "cursor-pointer" : ""} transition-colors
                  ${active ? "bg-sunken" : onClick ? "hover:bg-sunken/60" : ""}`}>
    {children}
  </tr>
);

// ── Chips ────────────────────────────────────────────────────────────────────

/**
 * Status colouring. `failed` is ember because it is money taken and a book not
 * delivered — the one row on any screen that should catch the eye.
 */
const TONES: Record<string, string> = {
  ready:      "bg-brassSoft text-brass",
  paid:       "bg-brassSoft text-brass",
  active:     "bg-brassSoft text-brass",
  generating: "bg-sunken text-muted",
  created:    "bg-sunken text-muted",
  failed:     "bg-ember/12 text-ember",
  refunded:   "bg-ember/12 text-ember",
  suspended:  "bg-ember/12 text-ember"
};

export const Chip = ({ children, tone }: { children: ReactNode; tone?: string }) => (
  <span className={`chip ${TONES[tone || ""] || "bg-sunken text-muted"}`}>{children}</span>
);

export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded px-1.5 py-0.5 text-[10.5px] bg-sunken text-muted">{children}</span>
);

// ── Controls ─────────────────────────────────────────────────────────────────

export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-raised p-0.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 h-8 rounded-[7px] text-[12px] font-medium transition whitespace-nowrap
            ${value === o.value ? "bg-fg text-surface" : "text-muted hover:text-fg"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Debounced so typing a phone number is one query, not ten. */
export function Search({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const first = useRef(true);
  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => onChange(local), 260);
    return () => clearTimeout(t);
  }, [local]);
  return (
    <div className="relative">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
           className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder={placeholder}
             className="field h-9 pl-9 pr-3 text-[13px] rounded-lg w-full sm:w-[260px]" />
    </div>
  );
}

export const Btn = ({ children, onClick, tone = "line", disabled, busy, title }: {
  children: ReactNode; onClick?: () => void; tone?: "line" | "brass" | "quiet" | "danger";
  disabled?: boolean; busy?: boolean; title?: string;
}) => (
  <button onClick={onClick} disabled={disabled || busy} title={title}
    className={`btn btn-sm ${tone === "brass" ? "btn-brass" : tone === "quiet" ? "btn-quiet"
                : tone === "danger" ? "btn-line border-ember/50 text-ember hover:border-ember" : "btn-line"}`}>
    {busy ? "…" : children}
  </button>
);

// ── States ───────────────────────────────────────────────────────────────────

export const Loading = ({ label = "Loading" }: { label?: string }) => (
  <div className="px-5 py-10 text-center text-[12.5px] text-faint">{label}…</div>
);

export const Empty = ({ label }: { label: string }) => (
  <div className="px-5 py-10 text-center text-[12.5px] text-faint">{label}</div>
);

export const ErrorNote = ({ error }: { error: string }) => (
  <div className="mx-4 my-3 rounded-lg border border-ember/40 bg-ember/8 px-3.5 py-2.5 text-[12.5px] text-ember">
    {error}
  </div>
);

/** A stated caveat, not decoration. Used where a number needs a footnote. */
export const Note = ({ children }: { children: ReactNode }) => (
  <p className="px-4 sm:px-5 py-2.5 text-[11.5px] leading-relaxed text-faint border-t border-line bg-sunken/40">
    {children}
  </p>
);

// ── Charts ───────────────────────────────────────────────────────────────────

/**
 * Daily gross, two series side by side — consumer and astrologer.
 *
 * Side by side and never stacked: stacking would draw one combined bar, which
 * is precisely the number this business must not have. The y-axis is shared so
 * the two are comparable, and the max is printed so nobody has to guess scale.
 */
export function DayChart({ rows }: {
  rows: { day: string; consumer_gross_paise: number; pandit_gross_paise: number; orders_paid: number }[];
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.consumer_gross_paise, r.pandit_gross_paise]));
  const [hover, setHover] = useState<number | null>(null);
  const active = hover === null ? null : rows[hover];

  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-4 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-brass" />Consumers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-fg/35" />Astrologers
          </span>
        </div>
        <div className="text-[11px] text-faint tabular-nums">
          {active ? <><span className="text-fg">{active.day}</span>{" · "}
            <span className="text-brass">{rupees(active.consumer_gross_paise)}</span>{" · "}
            <span className="text-muted">{rupees(active.pandit_gross_paise)}</span></>
            : <>peak {rupees(max)}/day</>}
        </div>
      </div>

      <div className="flex items-end gap-[3px] h-[120px]" onMouseLeave={() => setHover(null)}>
        {rows.map((r, i) => (
          <div key={r.day} onMouseEnter={() => setHover(i)}
               className="flex-1 min-w-0 h-full flex items-end justify-center gap-[2px] group">
            <span className="w-1/2 max-w-[9px] rounded-t-[2px] bg-brass transition-all"
                  style={{ height: `${Math.max(r.consumer_gross_paise ? 2 : 0, (r.consumer_gross_paise / max) * 100)}%`,
                           opacity: hover === null || hover === i ? 1 : 0.35 }} />
            <span className="w-1/2 max-w-[9px] rounded-t-[2px] bg-fg/35 transition-all"
                  style={{ height: `${Math.max(r.pandit_gross_paise ? 2 : 0, (r.pandit_gross_paise / max) * 100)}%`,
                           opacity: hover === null || hover === i ? 1 : 0.35 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] text-faint tabular-nums">
        <span>{rows[0]?.day}</span><span>{rows[rows.length - 1]?.day}</span>
      </div>
    </div>
  );
}

/** Where orders die, drawn to scale rather than described. */
export function FunnelBar({ segments, total }: {
  segments: { label: string; count: number; tone: "brass" | "ember" | "muted" }[]; total: number;
}) {
  const safe = Math.max(1, total);
  const bg = { brass: "bg-brass", ember: "bg-ember", muted: "bg-fg/20" };
  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-sunken">
        {segments.filter((s) => s.count > 0).map((s) => (
          <div key={s.label} className={bg[s.tone]} style={{ width: `${(s.count / safe) * 100}%` }} title={`${s.label}: ${s.count}`} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px]">
            <span className={`w-2 h-2 rounded-[2px] ${bg[s.tone]}`} />
            <span className="text-muted">{s.label}</span>
            <span className="tabular-nums text-fg font-medium">{num(s.count)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

export function Drawer({ open, onClose, title, sub, children }: {
  open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-fg/25 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative w-full sm:w-[560px] lg:w-[620px] h-full overflow-y-auto
                        bg-surface border-l border-line shadow-lift">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4
                           bg-surface/95 backdrop-blur border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-fg leading-tight truncate">{title}</h3>
            {sub && <p className="mt-0.5 text-[11.5px] text-faint">{sub}</p>}
          </div>
          <button onClick={onClose} className="btn btn-quiet btn-sm px-2.5 -mr-1" aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="p-5 space-y-5">{children}</div>
      </aside>
    </div>
  );
}

/** Label/value pairs inside a drawer. */
export const Facts = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="grid grid-cols-[minmax(96px,auto)_1fr] gap-x-4 gap-y-2 text-[12.5px]">
    {rows.map(([k, v], i) => (
      <div key={i} className="contents">
        <dt className="text-faint">{k}</dt>
        <dd className="text-fg break-words min-w-0">{v ?? "—"}</dd>
      </div>
    ))}
  </dl>
);

export const SubHead = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-2">
    <h4 className="caps text-faint">{children}</h4>
    {right}
  </div>
);

// ── Visual primitives ────────────────────────────────────────────────────────
// The first version of this panel explained itself in prose: every figure came
// with a paragraph. It read like documentation. These earn the same points with
// shape and colour instead, and the prose survives only as a tooltip.

/** A caveat that stays out of the way until you ask for it. */
export function Hint({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
              onClick={() => setOpen((v) => !v)} aria-label="Why"
              className="w-4 h-4 rounded-full border border-line text-faint hover:text-brass hover:border-brass
                         text-[9px] font-bold grid place-items-center transition shrink-0">?</button>
      {open && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-40 w-[260px]
                         rounded-lg border border-line bg-raised shadow-lift px-3 py-2
                         text-[11.5px] leading-relaxed text-muted font-normal normal-case tracking-normal text-left">
          {children}
        </span>
      )}
    </span>
  );
}

/** Sparkline. No axes, no labels — it exists to show shape, not to be read. */
export function Spark({ values, height = 34, tone = "brass" }: {
  values: number[]; height?: number; tone?: "brass" | "muted";
}) {
  // Fewer than four active days is not a trend. Two spikes at the right-hand
  // edge of thirty zeros reads as a rendering artefact, not a shape — better to
  // show nothing until there is something to see.
  if (values.filter((v) => v > 0).length < 4) return null;
  const max = Math.max(1, ...values);
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) => 100 - (v / max) * 92 - 4;
  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const id = `sp${tone}${values.length}`;
  const stroke = tone === "brass" ? "rgb(var(--brass))" : "rgb(var(--fg) / .4)";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full block" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity=".26" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${line} 100,100`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.6"
                vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** The headline figure on a card. Gold leaf, because it is the point of the card. */
export function Metric({ value, label, hint, foil }: {
  value: ReactNode; label: ReactNode; hint?: ReactNode; foil?: boolean;
}) {
  return (
    <div>
      <div className="caps text-faint flex items-center gap-1.5">{label}{hint && <Hint>{hint}</Hint>}</div>
      <div className={`mt-2 font-serif tracking-tightest tabular-nums leading-none
                       text-[34px] sm:text-[40px] ${foil ? "foil" : "text-fg"}`}>{value}</div>
    </div>
  );
}

/** Small supporting figure. Three of these sit under one Metric. */
export const Mini = ({ label, value, tone = "plain" }: {
  label: string; value: ReactNode; tone?: "plain" | "ember" | "brass";
}) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-[.14em] text-faint truncate">{label}</div>
    <div className={`mt-1 text-[15px] font-medium tabular-nums truncate
                     ${tone === "ember" ? "text-ember" : tone === "brass" ? "text-brass" : "text-fg"}`}>{value}</div>
  </div>
);

/** Conversion, as a shape you can read at a glance rather than a percentage. */
export function Ring({ pct: value, label, sub }: { pct: number | null; label: string; sub?: string }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
          <circle cx="42" cy="42" r={r} fill="none" stroke="rgb(var(--fg) / .1)" strokeWidth="7" />
          <circle cx="42" cy="42" r={r} fill="none" stroke="rgb(var(--brass))" strokeWidth="7"
                  strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`}
                  transform="rotate(-90 42 42)" />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-serif text-[19px] tabular-nums text-fg">
          {value === null ? "—" : `${Math.round(v)}%`}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-fg">{label}</div>
        {sub && <div className="mt-0.5 text-[11.5px] text-muted leading-snug">{sub}</div>}
      </div>
    </div>
  );
}

/** Label · bar · value. Replaces a six-column table nobody scanned. */
export function BarRow({ label, sub, value, max, right, tone = "brass" }: {
  label: ReactNode; sub?: ReactNode; value: number; max: number; right: ReactNode; tone?: "brass" | "muted";
}) {
  const w = max > 0 ? Math.max(value > 0 ? 1.5 : 0, (value / max) * 100) : 0;
  return (
    <div className="px-4 sm:px-5 py-2.5 hover:bg-sunken/50 transition-colors">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] text-fg truncate">{label}</span>
        <span className="text-[13px] font-medium tabular-nums text-fg shrink-0">{right}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-sunken overflow-hidden">
          <div className={`h-full rounded-full ${tone === "brass" ? "bg-brass" : "bg-fg/25"}`}
               style={{ width: `${w}%` }} />
        </div>
        {sub && <span className="text-[11px] text-faint tabular-nums shrink-0 w-16 text-right">{sub}</span>}
      </div>
    </div>
  );
}

/** A compact tile for the secondary numbers — six of these in one strip. */
export const Tile = ({ label, value, tone = "plain", hint }: {
  label: string; value: ReactNode; tone?: "plain" | "brass" | "ember"; hint?: ReactNode;
}) => (
  <div className="card px-4 py-3.5">
    <div className="caps text-faint flex items-center gap-1.5">{label}{hint && <Hint>{hint}</Hint>}</div>
    <div className={`mt-1.5 font-serif text-[24px] leading-none tabular-nums tracking-tightest
                     ${tone === "brass" ? "text-brass" : tone === "ember" ? "text-ember" : "text-fg"}`}>{value}</div>
  </div>
);

/**
 * Confirmation, in the panel rather than in a native dialog.
 *
 * `confirm()` and `prompt()` were the first version of this. They work, but a
 * browser chrome dialog in the middle of a styled tool looks like a bug, cannot
 * show the consequence in more than one line, and cannot carry the note that a
 * catalogue change is supposed to record. This can do all three.
 *
 * `danger` exists because two of the three callers destroy something.
 */
export function Confirm({ open, title, body, confirmLabel = "Confirm", tone = "brass",
                          notePrompt, busy, onConfirm, onCancel }: {
  open: boolean; title: ReactNode; body?: ReactNode;
  confirmLabel?: string; tone?: "brass" | "danger";
  /** When set, a text field is shown and its value is handed to onConfirm. */
  notePrompt?: string;
  busy?: boolean;
  onConfirm: (note: string) => void; onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  useEffect(() => { if (open) setNote(""); }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onCancel]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-fg/35 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-[440px] card p-5 shadow-lift">
        <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
        {body && <div className="mt-2 text-[12.5px] leading-relaxed text-muted">{body}</div>}
        {notePrompt && (
          <div className="mt-4">
            <label className="label">{notePrompt}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} autoFocus
                   className="field h-10 text-[13px]" placeholder="optional" />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Btn tone="quiet" onClick={onCancel}>Cancel</Btn>
          <Btn tone={tone} busy={busy} onClick={() => onConfirm(note)}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}
