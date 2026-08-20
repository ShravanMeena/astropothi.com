import { useEffect } from "react";
import { SITE, siteGraph, breadcrumbLd, abs, type Meta } from "../lib/seo";

/**
 * Writes one route's head. Mounted once in App with the current route's Meta.
 *
 * Every tag this manages carries data-seo so it can be replaced wholesale on
 * the next route without touching the tags Vite put in index.html. Leaving a
 * previous page's og:image or canonical behind is the classic failure of a
 * hand-rolled head manager, and it is worse than having none: the crawler is
 * told, with confidence, the wrong URL.
 *
 * The prerenderer reads the DOM this produces, so anything set here ends up in
 * the static HTML that Bing and the AI crawlers get.
 */

const OG_IMAGE = "/og/astropothi-og.png";

function tag(sel: string, make: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(`${sel}[data-seo]`);
  if (!el) {
    el = make();
    el.setAttribute("data-seo", "");
    document.head.appendChild(el);
  }
  return el;
}

function meta(attr: "name" | "property", key: string, content: string) {
  if (!content) {
    document.head.querySelector(`meta[${attr}="${key}"][data-seo]`)?.remove();
    return;
  }
  const el = tag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute(attr, key);
    return m;
  });
  el.setAttribute("content", content);
}

/**
 * index.html ships a description so a browser tab is not blank before React
 * mounts. It has no data-seo, so tag() would not find it and would append a
 * second one — leaving every page with two <meta name="description">, one of
 * them the generic shell copy. Google picks whichever it likes. Adopt the
 * shell's tags on first run instead of racing them.
 */
function adoptShellTags() {
  document.head
    .querySelectorAll('meta[name="description"]:not([data-seo]), link[rel="canonical"]:not([data-seo]), meta[property^="og:"]:not([data-seo]), meta[name^="twitter:"]:not([data-seo])')
    .forEach((el) => el.remove());
}

export default function Seo({ meta: m }: { meta: Meta }) {
  useEffect(() => {
    adoptShellTags();
    const url = abs(m.path);

    document.title = m.title;
    document.documentElement.lang = "en";

    meta("name", "description", m.description);

    // A noindex page still gets a canonical and a title — it is reachable by a
    // link someone pasted, and we would rather it be understood than guessed.
    meta("name", "robots", m.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");

    const link = tag('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.rel = "canonical";
      return l;
    }) as HTMLLinkElement;
    link.href = url;

    meta("property", "og:type", m.path === "/" ? "website" : "article");
    meta("property", "og:site_name", SITE.name);
    meta("property", "og:title", m.title);
    meta("property", "og:description", m.description);
    meta("property", "og:url", url);
    meta("property", "og:image", `${SITE.origin}${OG_IMAGE}`);
    meta("property", "og:locale", "en_IN");

    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", m.title);
    meta("name", "twitter:description", m.description);
    meta("name", "twitter:image", `${SITE.origin}${OG_IMAGE}`);

    // One graph per page. Several <script type="application/ld+json"> blocks
    // are legal, but a single @graph is what Google's own docs recommend and it
    // makes the @id cross-references between Organization and everything else
    // resolvable without the parser having to merge documents.
    document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((n) => n.remove());
    const graph = [
      ...siteGraph(),
      ...(m.crumbs?.length ? [breadcrumbLd(m.crumbs)] : []),
      ...(m.jsonLd || [])
    ];
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-seo", "");
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(s);

    // The prerenderer waits for this before snapshotting. Set last, so it can
    // only mean "the head for this route is complete".
    document.documentElement.dataset.seoReady = "1";
    return () => { delete document.documentElement.dataset.seoReady; };
  }, [m]);

  return null;
}
