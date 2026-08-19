import { type ReactNode } from "react";
import ChartMark from "../../components/ChartMark";
import { LEGAL, legalComplete, openGaps } from "../../lib/legal";
import Support from "../../components/Support";

/**
 * The frame every policy page shares.
 *
 * These are read in two very different situations — by a buyer who is annoyed,
 * and by a payment gateway's onboarding reviewer. Both want to find one clause
 * quickly, so the pages are plainly typeset with real headings and no
 * decoration beyond the banner.
 */
export default function LegalPage({ title, lede, children, onGo }: {
  title: string; lede: string; children: ReactNode; onGo: (path: string) => void;
}) {
  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[620px] max-w-[120vw] text-brass opacity-[.10] dark:opacity-[.14]">
          <ChartMark className="w-full h-auto" weight={0.3} />
        </div>
        <div className="shell relative z-10 py-10 sm:py-20">
          <p className="caps text-brass">Legal</p>
          <h1 className="display text-[25px] sm:text-[46px] mt-3 leading-[1.05]">{title}</h1>
          <p className="lede mt-4 max-w-prose2">{lede}</p>
          <p className="text-[13px] text-faint mt-5">Last updated {LEGAL.updated}</p>
        </div>
      </section>

      {/* A nag for us, never for a buyer.
          Two reasons this is dev-only. A customer-facing page that admits it is
          unfinished destroys the trust the page exists to create, and the fix
          it names is a source file, which is nobody's business but ours. The
          guard that actually stops a launch is `npm run legal:check --strict`
          in the deploy pipeline, not a banner someone can stop noticing. */}
      {import.meta.env.DEV && !legalComplete() && (
        <div className="shell pt-8">
          <div className="rounded-xl border border-ember/40 bg-ember/8 px-4 py-3.5 max-w-prose2">
            <p className="text-[11px] uppercase tracking-[.18em] text-ember/70 font-semibold">
              Development only — not shown to buyers
            </p>
            <p className="text-[12.5px] text-ember leading-relaxed mt-1.5">
              Still to be completed before launch: {openGaps().join("; ")}. Set them in{" "}
              <code>src/lib/legal.ts</code>.
            </p>
          </div>
        </div>
      )}

      <section className="shell py-12 sm:py-16 max-w-prose2">
        <div>{children}</div>

        <div className="rule my-12" />
        <Support where="legal" />

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted">
          {[["/terms", "Terms of Service"], ["/privacy", "Privacy Policy"],
            ["/refunds", "Refunds & Cancellation"], ["/contact", "Contact & Grievance"]]
            .map(([to, label]) => (
              <button key={to} onClick={() => onGo(to)} className="hover:text-fg transition">{label}</button>
            ))}
        </div>
      </section>
    </>
  );
}

/** A numbered clause. Numbering is explicit so a buyer can quote "clause 7" at us. */
export const Clause = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="mt-10 scroll-mt-24" id={`clause-${n}`}>
    <h2 className="display text-[21px] sm:text-[23px] flex gap-3">
      <span className="text-brass tabular-nums">{n}.</span>
      <span>{title}</span>
    </h2>
    <div className="mt-3 space-y-3.5">{children}</div>
  </section>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px] leading-[1.75] text-muted">{children}</p>
);

export const Bullets = ({ items }: { items: ReactNode[] }) => (
  <ul className="space-y-2.5 pl-1">
    {items.map((it, i) => (
      <li key={i} className="text-[15px] leading-[1.75] text-muted flex gap-3">
        <span aria-hidden className="mt-[9px] h-1 w-1 rounded-full bg-brass shrink-0" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

/** For the clauses a reader must not skim past. */
export const Callout = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-line bg-raised px-4 py-3.5">
    <p className="text-[14.5px] leading-relaxed text-fg">{children}</p>
  </div>
);

/**
 * A two-column table, for short pairs like "Acknowledgement / 48 hours".
 *
 * Deliberately capped at two columns. A prose column is 640px wide, and a third
 * column of sentences in that space pushes the second one off the edge — which
 * is exactly how the first draft of "What we collect" hid its own answers.
 * Anything wider belongs in DataList below.
 */
export const Table = ({ head, rows }: { head: [string, string]; rows: [ReactNode, ReactNode][] }) => (
  <div className="rounded-xl border border-line overflow-hidden">
    <table className="w-full text-[14px]">
      {(head[0] || head[1]) && (
        <thead>
          <tr>{head.map((h, i) => (
            <th key={i} className="caps text-faint text-left px-4 py-2.5 border-b border-line">{h}</th>
          ))}</tr>
        </thead>
      )}
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line last:border-0 align-top">
            <td className="px-4 py-3 text-fg font-medium w-[38%]">{r[0]}</td>
            <td className="px-4 py-3 text-muted leading-relaxed">{r[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * What a wide table wants to be at 640px: each row stacked, the subject first
 * and its qualifiers beneath. Reads the same on a phone and a laptop, and
 * nothing scrolls sideways.
 */
export const DataList = ({ items }: {
  items: { term: ReactNode; note?: ReactNode; meta?: ReactNode }[];
}) => (
  <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
    {items.map((it, i) => (
      <div key={i} className="px-4 py-3.5">
        <div className="text-[14.5px] text-fg font-medium leading-snug">{it.term}</div>
        {it.note && <div className="text-[13.5px] text-muted leading-relaxed mt-1">{it.note}</div>}
        {it.meta && <div className="text-[12px] text-faint mt-1.5">{it.meta}</div>}
      </div>
    ))}
  </div>
);
