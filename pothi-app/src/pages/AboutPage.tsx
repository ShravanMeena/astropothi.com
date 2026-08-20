import { LEGAL } from "../lib/legal";
import { SUPPORT, prettyPhone, telLink, mailLink } from "../lib/support";
import ChartMark from "../components/ChartMark";

/**
 * Who is behind this.
 *
 * Answer engines and buyers both discount a site that will not say who runs
 * it. What they discount even harder is a fabricated team page — so this
 * states the operating entity, which is real and published, and says nothing
 * about staff, founders or credentials we cannot evidence. If a named person
 * is ever added here it must be a person who exists.
 */
export default function AboutPage({ onGo }: { onGo: (to: string) => void }) {
  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[720px] max-w-[128vw] text-brass opacity-[.13] dark:opacity-[.17]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>
        <div className="shell relative z-10 py-12 sm:py-24 text-center">
          <p className="eyebrow">About</p>
          <h1 className="display mt-4 text-[28px] sm:text-[52px] leading-[1.05] max-w-[20ch] mx-auto">
            What astropothi is
          </h1>
        </div>
      </section>

      <section className="shell py-10 sm:py-20">
        <div className="max-w-prose2 grid gap-5 text-[15px] sm:text-[16px] leading-relaxed text-muted">
          <p>
            astropothi makes long-form Vedic astrology reports. You give a birth
            date, time and place; we compute the chart from an astronomical
            ephemeris and write it out in full — between 22 and 64 chapters
            depending on which report you choose — as a typeset PDF you can read
            in the browser or keep.
          </p>
          <p>
            The reason it exists is narrow. A free kundli site gives you a chart
            and a paragraph. A consultation gives you an hour and no document. We
            wanted the thing in between: the whole chart actually read out, in
            writing, that you can return to in two years when a dasha changes.
          </p>
          <p>
            Everything numerical is computed and checked before any text is
            written — <button className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass" onClick={() => onGo("/methodology")}>the methodology page</button>{" "}
            sets out exactly how, including where a language model is used and
            where it is deliberately not.
          </p>
          <p>
            Reports are available in English and Hindi. Payment is by Razorpay.
            If a report is not worth what you paid, we refund all of it — no
            conditions and no form — and you keep the file.
          </p>
        </div>

        <div className="mt-12 max-w-prose2 rounded-xl border border-line p-5 sm:p-7">
          <h2 className="display text-[19px] sm:text-[23px]">Who operates it</h2>
          <dl className="mt-4 grid gap-2 text-[14px] sm:text-[15px]">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-faint">Brand</dt><dd>{LEGAL.brand}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-faint">Operated by</dt><dd>{LEGAL.entity}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-faint">Registered address</dt><dd>{LEGAL.address}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-faint">Support</dt>
              <dd>
                <a className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass" href={telLink()}>{prettyPhone()}</a>
                {" · "}
                <a className="underline decoration-brass/50 underline-offset-4 hover:decoration-brass" href={mailLink("astropothi")}>{SUPPORT.email}</a>
                <span className="text-faint"> · {SUPPORT.hours}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button className="btn-brass h-[52px] px-8 text-[16px]" onClick={() => onGo("/reports")}>
            See the reports
          </button>
          <button className="btn-line h-[52px]" onClick={() => onGo("/methodology")}>How it is computed</button>
        </div>
      </section>
    </>
  );
}
