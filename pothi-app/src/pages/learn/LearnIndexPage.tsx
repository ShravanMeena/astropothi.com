import { articlesIn } from "../../content/doshas.generated";
import type { Lang } from "../../lib/route";
import { str } from "./strings";
import Link from "../../components/Link";
import ChartMark from "../../components/ChartMark";

/**
 * The index of the dosha explainers.
 *
 * Its job is to be the hub the fourteen articles link back to, so the crawler
 * sees a shape rather than fourteen orphans, and to give a reader who arrived
 * on one dosha a reason to read a second.
 */
export default function LearnIndexPage({ lang }: { lang: Lang }) {
  const t = str(lang);
  const base = lang === "hi" ? "/hi" : "";
  const items = articlesIn(lang);
  const deva = lang === "hi" ? "deva" : "";

  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[720px] max-w-[128vw] text-brass opacity-[.13] dark:opacity-[.17]">
          <ChartMark className="w-full h-auto" weight={0.32} draw={false} />
        </div>
        <div className="shell relative z-10 py-12 sm:py-20 text-center">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className={`display mt-4 text-[28px] sm:text-[48px] leading-[1.05] ${deva}`}>{t.indexTitle}</h1>
          <p className={`lede mt-5 max-w-prose2 mx-auto ${deva}`}>{t.indexLede}</p>
          <p className="mt-6">
            <Link to={lang === "hi" ? "/learn" : "/hi/learn"} hrefLang={lang === "hi" ? "en" : "hi"}
                  className="text-[13.5px] text-brass hover:underline underline-offset-4">
              {t.other}
            </Link>
          </p>
        </div>
      </section>

      <section className="shell py-10 sm:py-16">
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <li key={a.slug}>
              <Link to={`${base}/learn/${a.slug}`}
                    className="group block h-full rounded-xl border border-line p-5 sm:p-6
                               transition hover:border-faint hover:shadow-soft">
                <h2 className={`display text-[18px] sm:text-[21px] leading-snug ${deva}`}>{a.name}</h2>
                <p className={`mt-2 text-[14px] leading-relaxed text-muted ${deva}`}>{a.blurb}</p>
                <span className="mt-3 inline-block text-[12.5px] text-faint">{a.ruler}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className={`mt-10 max-w-prose2 text-[13.5px] leading-relaxed text-faint ${deva}`}>{t.indexNote}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/report/dosh" className="btn-brass h-[50px] px-7 text-[15px]">{t.ctaBtn}</Link>
          <Link to="/reports" className="btn-line h-[50px]">{t.ctaAlt}</Link>
        </div>
      </section>
    </>
  );
}
