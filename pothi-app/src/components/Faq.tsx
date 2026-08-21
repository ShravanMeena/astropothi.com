import { useState } from "react";

/**
 * Questions and answers, visible in the HTML.
 *
 * Two rules this component exists to enforce:
 *
 *   · The answer is in the markup whether or not the panel is open. Collapsing
 *     it with `hidden` keeps it in the DOM and in the page source, so the
 *     FAQPage schema built from the same array describes text a visitor can
 *     actually reach. Schema for content that is not on the page is the single
 *     most commonly penalised structured-data abuse, and rendering only the
 *     open panel would quietly commit it.
 *   · One source. The caller passes the array here and to the schema builder,
 *     so the two cannot drift.
 *
 * Buttons, aria-expanded and a real region id, so a screen reader gets the same
 * affordance a mouse does.
 */
export type QA = { q: string; a: string };

export default function Faq({ items, idPrefix, deva = false }: {
  items: QA[]; idPrefix: string; deva?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <dl className="grid gap-0">
      {items.map((it, i) => {
        const id = `${idPrefix}-${i}`;
        const isOpen = open === i;
        return (
          <div key={it.q} className="border-t border-line last:border-b">
            <dt>
              <button type="button" aria-expanded={isOpen} aria-controls={`${id}-a`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-4 text-left group">
                <span className={`text-[15px] sm:text-[16px] font-semibold leading-snug ${deva ? "deva" : ""}`}>
                  {it.q}
                </span>
                <span aria-hidden className={`mt-1 shrink-0 text-faint transition-transform duration-200
                                              ${isOpen ? "rotate-45" : ""} group-hover:text-brass`}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </dt>
            {/* `hidden` rather than unmounting: the answer stays in the HTML for
                the crawler and for find-in-page. */}
            <dd id={`${id}-a`} hidden={!isOpen}
                className={`pb-4 -mt-1 text-[14.5px] leading-relaxed text-muted max-w-prose2 ${deva ? "deva" : ""}`}>
              {it.a}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
