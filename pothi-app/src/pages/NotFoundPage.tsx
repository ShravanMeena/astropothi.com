import { useEffect } from "react";
import ChartMark from "../components/ChartMark";
import { track } from "../lib/track";

/**
 * A real 404.
 *
 * Until now an unknown path rendered the storefront, which meant a typo, an
 * old link or a crawler probe each produced a full copy of the homepage under
 * its own URL — a soft 404 to Google and duplicate content to everyone else.
 *
 * The static HTML for this route carries `noindex` via the head manager, and
 * the prerenderer writes it to 404.html so the server can answer with a real
 * status code rather than 200.
 */
export default function NotFoundPage({ path, onGo }: { path: string; onGo: (to: string) => void }) {
  useEffect(() => {
    // Useful signal: a spike here is almost always a link we broke ourselves.
    track("not_found", { path });
  }, [path]);

  return (
    <section className="relative overflow-hidden grain lamp">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[640px] max-w-[128vw] text-brass opacity-[.12] dark:opacity-[.16]">
        <ChartMark className="w-full h-auto" weight={0.32} />
      </div>
      <div className="shell relative z-10 py-20 sm:py-32 text-center">
        <p className="eyebrow">404</p>
        <h1 className="display mt-4 text-[28px] sm:text-[48px] leading-[1.05] max-w-[18ch] mx-auto">
          There is nothing at this address
        </h1>
        <p className="lede mt-5 max-w-prose2 mx-auto">
          The page you asked for does not exist. If you followed a link from us,
          it is our mistake — tell us and we will fix it.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <button className="btn-brass h-[52px] px-8 text-[16px]" onClick={() => onGo("/reports")}>
            Browse the reports
          </button>
          <button className="btn-line h-[52px]" onClick={() => onGo("/")}>Go home</button>
        </div>
      </div>
    </section>
  );
}
