import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigate } from "../lib/route";

/**
 * A real link.
 *
 * Every navigation on this site used to be a <button onClick={go}>. To a
 * person that is indistinguishable from a link; to everything else it is not:
 *
 *   · A crawler cannot follow it. Before this component the built homepage
 *     contained zero <a href> pointing anywhere on the site, so Google could
 *     only ever find pages through the sitemap — no crawl paths between pages,
 *     no anchor text, and nothing telling it which pages we consider important.
 *   · Cmd-click, middle-click and "open in new tab" all did nothing.
 *   · The status bar showed no destination on hover.
 *   · A screen reader announced "button", not "link".
 *
 * So this renders an <a href> and intercepts the plain-left-click case only,
 * letting the browser handle every modified click the way the user expects.
 */
export default function Link({
  to, children, onClick, ...rest
}: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Anything other than a plain primary click is the browser's business:
    // a new tab, a new window, a download, a saved bookmark.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={handle} {...rest}>{children}</a>;
}
