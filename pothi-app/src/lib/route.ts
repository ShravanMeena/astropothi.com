import { useEffect, useState } from "react";

/**
 * Real pages, real URLs — a ₹699 product needs a page a buyer can read, share
 * and come back to, not a modal that vanishes on refresh.
 *
 *   /                  storefront
 *   /reports           all seven, side by side
 *   /faq               questions, grouped
 *   /methodology       how a chart is computed — the page a careful buyer and
 *                      an answer engine both ask for before trusting a number
 *   /about             who operates this
 *   /learn             the dosha explainers, English
 *   /learn/:slug       one dosha, explained from the engine's own rules
 *   /hi/learn          the same in Hindi — /hi is a language prefix, not a
 *                      separate site; the two are paired with hreflang
 *   /report/:code      what is inside, sample pages, price
 *   /buy/:code         checkout
 *   /profile           your account: every order, and what you tell us
 *   /order/:publicId   the finished report
 *   /terms /privacy /refunds /contact   the policies a payment gateway and the
 *                      Consumer Protection (E-Commerce) Rules both require
 *   /astrologers       the console
 */
/** Kept as an exported list so the sitemap generator cannot drift from routing. */
export const LEGAL_SLUGS = ["terms", "privacy", "refunds", "contact"] as const;
export type LegalSlug = typeof LEGAL_SLUGS[number];

/** Content languages. The UI chrome stays English; articles are translated. */
export type Lang = "en" | "hi";

export type Route =
  | { name: "home" }
  | { name: "reports" }
  | { name: "faq" }
  | { name: "methodology" }
  | { name: "about" }
  | { name: "learn"; lang: Lang }
  | { name: "article"; slug: string; lang: Lang }
  | { name: "legal"; page: LegalSlug }
  | { name: "profile" }
  | { name: "report"; code: string }
  | { name: "buy"; code: string }
  | { name: "order"; id: string }
  | { name: "dashboard" }
  /** Anything we do not recognise. Rendered as a real 404, never as home. */
  | { name: "notfound"; path: string };

function parse(path: string): Route {
  const p = path.replace(/\/+$/, "") || "/";
  if (p.startsWith("/astrologers")) return { name: "dashboard" };
  if (p === "/reports") return { name: "reports" };
  if (p === "/faq") return { name: "faq" };
  if (p === "/methodology") return { name: "methodology" };
  if (p === "/about") return { name: "about" };

  // /hi is a language prefix on the content routes only — strip it once here
  // rather than duplicating every match below.
  const hi = p.startsWith("/hi/") || p === "/hi";
  const q = hi ? p.slice(3) || "/" : p;
  const lang: Lang = hi ? "hi" : "en";
  // Deliberately no bare "/hi". Only the learn section is translated, so a
  // Hindi homepage does not exist to send anyone to — and a path that renders
  // content in the app but is absent from the sitemap gets a 404 from the
  // server and content from the browser, which is the worst of both.
  if (q === "/learn" && (!hi || p === "/hi/learn")) return { name: "learn", lang };
  const art = q.match(/^\/learn\/([a-z0-9-]+)$/);
  if (art) return { name: "article", slug: art[1], lang };
  const legal = LEGAL_SLUGS.find((l) => p === `/${l}`);
  if (legal) return { name: "legal", page: legal };
  if (p === "/profile") return { name: "profile" };
  const rep = p.match(/^\/report\/([a-z]+)$/);
  if (rep) return { name: "report", code: rep[1] };
  const buy = p.match(/^\/buy\/([a-z]+)$/);
  if (buy) return { name: "buy", code: buy[1] };
  const ord = p.match(/^\/order\/([A-Za-z0-9_-]+)$/);
  if (ord) return { name: "order", id: ord[1] };
  if (p === "/") return { name: "home" };
  // Returning home for an unknown path made every typo, every stale inbound
  // link and every crawler probe render the storefront under its own URL — a
  // soft 404, and as many duplicates of the homepage as there are bad links.
  return { name: "notfound", path: p };
}

/**
 * The app's one navigate function, published for components that are not
 * handed `go` as a prop.
 *
 * App calls useRoute() once and owns the routing state; a second useRoute()
 * elsewhere would get its own useState and change the URL without re-rendering
 * anything. So rather than thread `go` through every intermediate component or
 * stand up a context for a single function, App registers it here on mount.
 */
let navigator: ((to: string) => void) | null = null;
export const setNavigator = (fn: (to: string) => void) => { navigator = fn; };
export function navigate(to: string) {
  if (navigator) navigator(to);
  else window.location.href = to;   // before mount, or in a test
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(parse(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = (to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, "", to);
    setRoute(parse(to));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  // Published so <Link> can navigate without a prop chain.
  useEffect(() => { setNavigator(go); });

  return { route, go };
}
