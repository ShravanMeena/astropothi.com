import { useEffect, useState } from "react";

/**
 * Real pages, real URLs — a ₹699 product needs a page a buyer can read, share
 * and come back to, not a modal that vanishes on refresh.
 *
 *   /                  storefront
 *   /reports           all seven, side by side
 *   /faq               questions, grouped
 *   /report/:code      what is inside, sample pages, price
 *   /buy/:code         checkout
 *   /profile           your account: every order, and what you tell us
 *   /order/:publicId   the finished report
 *   /astrologers       the console
 */
export type Route =
  | { name: "home" }
  | { name: "reports" }
  | { name: "faq" }
  | { name: "profile" }
  | { name: "report"; code: string }
  | { name: "buy"; code: string }
  | { name: "order"; id: string }
  | { name: "dashboard" };

function parse(path: string): Route {
  const p = path.replace(/\/+$/, "") || "/";
  if (p.startsWith("/astrologers")) return { name: "dashboard" };
  if (p === "/reports") return { name: "reports" };
  if (p === "/faq") return { name: "faq" };
  if (p === "/profile") return { name: "profile" };
  const rep = p.match(/^\/report\/([a-z]+)$/);
  if (rep) return { name: "report", code: rep[1] };
  const buy = p.match(/^\/buy\/([a-z]+)$/);
  if (buy) return { name: "buy", code: buy[1] };
  const ord = p.match(/^\/order\/([A-Za-z0-9_-]+)$/);
  if (ord) return { name: "order", id: ord[1] };
  return { name: "home" };
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
  return { route, go };
}
