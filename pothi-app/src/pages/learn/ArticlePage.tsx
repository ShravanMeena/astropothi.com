import { findArticle, articlesIn, type Article } from "../../content/doshas.generated";
import type { Lang } from "../../lib/route";
import { str } from "./strings";
import Link from "../../components/Link";
import ChartMark from "../../components/ChartMark";
import { track } from "../../lib/track";

/**
 * One dosha, explained.
 *
 * The reading order is the order a person actually asks in — what is it, how
 * does it form, what does it mean, does it apply to me, what cancels it, what
 * do I do — rather than the order the source data happens to sit in.
 *
 * Two selling points are placed in the body rather than only at the end,
 * because the moment someone finishes reading how a dosha forms is the moment
 * they want to know whether it is in their own chart, and that is the product.
 * They are placed after "how it forms" and after the cancellations, and nowhere
 * else: a page that interrupts every section stops being a page worth reading,
 * and Google's helpful-content system reads that as an ad with an article
 * wrapped round it.
 */

const dir = (lang: Lang) => (lang === "hi" ? "deva" : "");

function Section({ title, lang, children }: { title: string; lang: Lang; children: React.ReactNode }) {
  return (
    <section className="mt-10 sm:mt-14">
      {/* `display` is Fraunces, which has no Devanagari — a Hindi heading set
          in it falls back to whatever the browser happens to have. */}
      <h2 className={`display text-[21px] sm:text-[28px] leading-tight ${dir(lang)}`}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function P({ children, lang }: { children: React.ReactNode; lang: Lang }) {
  return (
    <p className={`text-[15px] sm:text-[16px] leading-[1.75] text-muted ${dir(lang)}`}>{children}</p>
  );
}

/** The inline nudge. Quiet, and only where the question it answers just arose. */
function InlineCta({ lang, where }: { lang: Lang; where: string }) {
  const t = str(lang);
  const to = lang === "hi" ? "/report/dosh" : "/report/dosh";
  return (
    <div className="mt-6 rounded-xl border border-line bg-sunken/60 p-4 sm:p-5
                    flex flex-wrap items-center justify-between gap-3">
      <p className={`text-[14px] sm:text-[15px] text-muted max-w-[46ch] ${dir(lang)}`}>{t.inlineCta}</p>
      <Link to={to} onClick={() => track("learn_cta_clicked", { where, lang })}
            className="btn-brass h-[42px] px-5 text-[14px] shrink-0">
        {t.inlineBtn}
      </Link>
    </div>
  );
}

/** The full offer, at the end, where someone who read the whole page lands. */
function EndCta({ lang, slug }: { lang: Lang; slug: string }) {
  const t = str(lang);
  return (
    <section className="mt-14 rounded-2xl border border-line overflow-hidden">
      <div className="relative grain lamp p-6 sm:p-10">
        <h2 className={`display text-[22px] sm:text-[30px] leading-tight ${dir(lang)}`}>{t.ctaTitle}</h2>
        <p className={`mt-3 text-[15px] leading-relaxed text-muted max-w-prose2 ${dir(lang)}`}>{t.ctaBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/report/dosh" onClick={() => track("learn_cta_clicked", { where: "end", slug, lang })}
                className="btn-brass h-[50px] px-7 text-[15px]">{t.ctaBtn}</Link>
          <Link to="/reports" className="btn-line h-[50px]">{t.ctaAlt}</Link>
        </div>
      </div>
    </section>
  );
}

export default function ArticlePage({ slug, lang, notFound }: {
  slug: string; lang: Lang; notFound: React.ReactNode;
}) {
  const a = findArticle(slug, lang);
  if (!a) return <>{notFound}</>;
  const t = str(lang);
  const base = lang === "hi" ? "/hi" : "";
  const others = articlesIn(lang).filter((x) => x.slug !== slug).slice(0, 6);

  return (
    <article>
      <header className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[640px] max-w-[128vw] text-brass opacity-[.12] dark:opacity-[.16]">
          <ChartMark className="w-full h-auto" weight={0.32} draw={false} />
        </div>
        <div className="shell relative z-10 py-10 sm:py-16 max-w-prose2">
          <nav className="flex items-center gap-2 text-[13px] text-faint">
            <Link to={`${base}/learn`} className="hover:text-fg">{t.backToIndex}</Link>
            <span>·</span>
            <Link to={lang === "hi" ? `/learn/${slug}` : `/hi/learn/${slug}`}
                  className="hover:text-fg" hrefLang={lang === "hi" ? "en" : "hi"}>
              {t.other}
            </Link>
          </nav>
          <h1 className={`display mt-4 text-[27px] sm:text-[44px] leading-[1.08] ${dir(lang)}`}>{a.title}</h1>
          <p className={`lede mt-4 ${dir(lang)}`}>{a.blurb}</p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[13.5px]">
            <div className="flex gap-2">
              <dt className="text-faint">{t.ruler}</dt>
              <dd className={dir(lang)}>{a.ruler}</dd>
            </div>
            {a.affects && (
              <div className="flex gap-2">
                <dt className="text-faint">{t.affects}</dt>
                <dd className={dir(lang)}>{a.affects}</dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <div className="shell max-w-prose2 pb-16 sm:pb-24">
        <div className="pt-8"><P lang={lang}>{a.intro}</P></div>

        {a.rule && (
          <Section title={t.secForms} lang={lang}>
            <div className="rounded-xl border-l-2 border-brass bg-sunken/50 px-4 py-3 sm:px-5 sm:py-4">
              <p className={`text-[15px] sm:text-[16px] leading-[1.7] ${dir(lang)}`}>{a.rule}</p>
            </div>
            <InlineCta lang={lang} where="after-rule" />
          </Section>
        )}

        <Section title={t.secMeans} lang={lang}><P lang={lang}>{a.significance}</P></Section>

        <Section title={t.secEffects} lang={lang}>
          <ul className="grid gap-2.5">
            {a.effects.map((e, i) => (
              <li key={i} className={`flex gap-3 text-[15px] leading-[1.7] text-muted ${dir(lang)}`}>
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                {e}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.secPresent} lang={lang}><P lang={lang}>{a.whenPresent}</P></Section>
        {a.whenAbsent && <Section title={t.secAbsent} lang={lang}><P lang={lang}>{a.whenAbsent}</P></Section>}

        {a.clauses.length > 0 && (
          <Section title={t.secClauses} lang={lang}>
            <P lang={lang}>{t.clausesLede}</P>
            <ul className="mt-5 grid gap-3">
              {a.clauses.map((c) => (
                <li key={c.label} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className={`text-[15px] font-semibold ${dir(lang)}`}>{c.label}</h3>
                    <span className={`text-[11px] ${
                      lang === "hi" ? "deva" : "uppercase tracking-[.14em]"} ${
                      c.weight === "full" ? "text-brass" : "text-faint"}`}>
                      {c.weight === "full" ? t.full : c.weight === "partial" ? t.partial : t.mitigator}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-[14.5px] leading-[1.7] text-muted ${dir(lang)}`}>{c.detail}</p>
                </li>
              ))}
            </ul>
            <InlineCta lang={lang} where="after-clauses" />
          </Section>
        )}

        <Section title={t.secRemedies} lang={lang}>
          <ol className="grid gap-3">
            {a.remedies.map((r, i) => (
              <li key={r.title} className="flex gap-4">
                <span className="font-mono text-[12px] text-brass pt-1 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={`text-[15px] font-semibold ${dir(lang)}`}>{r.title}</h3>
                  <p className={`mt-1 text-[14.5px] leading-[1.7] text-muted ${dir(lang)}`}>{r.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {a.lucky && (
          <Section title={t.secLucky} lang={lang}>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4">
              {(Object.keys(t.lucky) as (keyof typeof t.lucky)[])
                .filter((k) => a.lucky![k] != null && a.lucky![k] !== "")
                .map((k) => (
                  <div key={k}>
                    <dt className={`text-[11px] text-faint ${
                      lang === "hi" ? "deva" : "uppercase tracking-[.14em]"}`}>{t.lucky[k]}</dt>
                    <dd className={`mt-1 text-[14.5px] ${dir(lang)}`}>{String(a.lucky![k])}</dd>
                  </div>
                ))}
            </dl>
          </Section>
        )}

        <Section title={t.secSeverity} lang={lang}>
          <P lang={lang}>{t.severityLede}</P>
          <ul className="mt-4 flex flex-wrap gap-2">
            {a.severity.filter((s) => s.min > 0).map((s) => (
              <li key={s.min} className="rounded-full border border-line px-3.5 py-1.5 text-[13px]">
                <span className="font-mono text-faint">{s.min}+</span>{" "}
                <span className={dir(lang)}>{s.label}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.secFaq} lang={lang}>
          <dl className="grid gap-5">
            {a.faqs.map((f) => (
              <div key={f.q} className="border-t border-line pt-4">
                <dt className={`text-[15.5px] font-semibold leading-snug ${dir(lang)}`}>{f.q}</dt>
                <dd className={`mt-1.5 text-[14.5px] leading-[1.7] text-muted ${dir(lang)}`}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <EndCta lang={lang} slug={slug} />

        <Section title={t.related} lang={lang}>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {others.map((o: Article) => (
              <li key={o.slug}>
                <Link to={`${base}/learn/${o.slug}`}
                      className={`block rounded-lg border border-line px-4 py-3 text-[14.5px]
                                  hover:border-faint transition ${dir(lang)}`}>
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <p className={`mt-12 text-[12.5px] leading-relaxed text-faint ${dir(lang)}`}>{t.disclaimer}</p>
      </div>
    </article>
  );
}
