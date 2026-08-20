import { LEGAL } from "./legal";
import { SUPPORT } from "./support";
import type { ReportItem } from "./api";

/**
 * Every page's head, in one place.
 *
 * The site is a single-page app: one index.html, one title, one description,
 * served for every URL. Google can run the JavaScript and eventually see the
 * real page, but three things follow from that which cost real traffic:
 *
 *   · Every URL arrives at the crawler identical, so they compete with each
 *     other and most get dropped as duplicates before rendering is even queued.
 *   · Bing barely executes JavaScript.
 *   · The crawlers behind ChatGPT, Perplexity and Claude do not execute it at
 *     all. They see `<div id="root"></div>` — which is why the site cannot be
 *     cited by an answer engine today.
 *
 * This file fixes the first problem and `scripts/prerender.js` fixes the other
 * two by snapshotting what these values produce into real HTML at build time.
 *
 * Nothing here asserts anything the product cannot back up. No ratings, no
 * review counts, no "India's most trusted" — see docs/05-legal.md on why a
 * decorative superlative is a real liability under the CPA.
 */

export const SITE = {
  name: "astropothi",
  /** Must match site.config.json, which the sitemap generator also reads. */
  origin: "https://astropothi.com",
  tagline: "Vedic reports, computed and explained"
};

export type Meta = {
  title: string;
  description: string;
  /** Path only. The canonical is built from SITE.origin. */
  path: string;
  /** Extra JSON-LD for this page, on top of the site-wide graph. */
  jsonLd?: object[];
  /** Trail for the breadcrumb list and the visible breadcrumbs. */
  crumbs?: { name: string; path: string }[];
  noindex?: boolean;
};

const abs = (p: string) => `${SITE.origin}${p === "/" ? "/" : p.replace(/\/+$/, "")}`;

/* ── The site-wide graph, emitted on every page ───────────────────────────── */

export function siteGraph() {
  const org: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${SITE.origin}/#organization`,
    name: SITE.name,
    url: SITE.origin,
    description:
      "Vedic astrology reports computed from an astronomical ephemeris and written out in full, in English or Hindi.",
    email: SUPPORT.email,
    telephone: `+91${SUPPORT.phone}`,
    // Only stated because the operator publishes it. An address we cannot
    // evidence is a false statement in structured data, not a formatting
    // choice — see lib/legal.ts.
    ...(LEGAL.entity ? { legalName: LEGAL.entity } : {}),
    ...(LEGAL.address
      ? { address: { "@type": "PostalAddress", streetAddress: LEGAL.address, addressCountry: "IN" } }
      : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: `+91${SUPPORT.phone}`,
      email: SUPPORT.email,
      areaServed: "IN",
      availableLanguage: ["en", "hi"]
    }
  };

  const site = {
    "@type": "WebSite",
    "@id": `${SITE.origin}/#website`,
    url: SITE.origin,
    name: SITE.name,
    publisher: { "@id": `${SITE.origin}/#organization` },
    inLanguage: ["en", "hi"]
  };

  return [org, site];
}

/* ── Per-page metadata ────────────────────────────────────────────────────── */

const REPORT_SEO: Record<string, { title: string; description: string; question: string }> = {
  kundli: {
    title: "Premium Kundali Report — 64 Chapters",
    description:
      "Every house and planet read in turn, the Vimshottari dasha timeline with dates, ten divisional charts and Ashtakavarga strengths — computed from your exact birth time.",
    question: "What is in a premium kundali report?"
  },
  dosh: {
    title: "Kundali Dosh Report — 14 Doshas Tested",
    description:
      "Manglik, Kaal Sarp, Pitru, Nadi, Bhakoot and more, each tested against your own chart: what forms, what is cancelled, how severe, and the classical remedies.",
    question: "Which doshas are in my kundali?"
  },
  love: {
    title: "Love & Marriage Report from Your Birth Chart",
    description:
      "How you attach, what you need from a partner and where friction starts — read from the 7th house, Venus, Mars and the navamsa, with the dasha windows for marriage.",
    question: "What does my kundali say about marriage?"
  },
  health: {
    title: "Health & Prakriti Report from Your Birth Chart",
    description:
      "Your Lagna and its lord, the 6th house, the Moon, your tatva and prakriti, and what the chart asks you to look after. For reflection, not medical diagnosis.",
    question: "What does my birth chart say about my constitution?"
  },
  horoscope: {
    title: "Personalised Monthly Horoscope from Your Chart",
    description:
      "Not a sun-sign column. Every transit placed against your natal houses, the dates that matter this month, and what each one touches.",
    question: "How is a personalised horoscope different from a sun-sign one?"
  },
  laalkitab: {
    title: "Lal Kitab Report — Remedies from a Different Tradition",
    description:
      "The Lal Kitab reading with its own logic and its own upaay: practical, inexpensive remedies drawn from the placements in your chart that need help.",
    question: "What is a Lal Kitab report?"
  },
  varshaphal: {
    title: "Varshaphal — Your Year Ahead from the Solar Return",
    description:
      "The annual chart cast for your solar return: Muntha, Panchavargeeya bala, the Mudda dasha, and the themes month by month for the year ahead.",
    question: "What is Varshaphal in Vedic astrology?"
  },
  career: {
    title: "Career & Livelihood Report from Your Birth Chart",
    description:
      "The 10th house and its lord, the four grahas that signify livelihood, the Dashamsha read for work alone, your Amatyakaraka, and the dasha windows in which a career turns.",
    question: "What does my kundali say about my career?"
  },
  vastu: {
    title: "Vastu Report — Your Home, Direction by Direction",
    description:
      "Nine directions checked against the Vastu Purusha Mandala — entrance, kitchen, bedroom, pooja space, water. Every dosh named, with remedies that need no demolition.",
    question: "How is a Vastu report prepared for a home?"
  }
};

const suffix = (t: string) => `${t} | ${SITE.name}`;

export function homeMeta(): Meta {
  return {
    path: "/",
    title: suffix("Vedic Astrology Reports from Your Birth Chart"),
    description:
      "Vedic astrology reports computed from an astronomical ephemeris using your exact birth time — kundali, dosha, marriage, career — written out in full. English or Hindi.",
    jsonLd: [
      {
        "@type": "WebPage",
        "@id": `${SITE.origin}/#webpage`,
        url: SITE.origin,
        name: suffix("Vedic Astrology Reports"),
        isPartOf: { "@id": `${SITE.origin}/#website` },
        about: { "@id": `${SITE.origin}/#organization` }
      }
    ]
  };
}

export function reportsMeta(items: ReportItem[]): Meta {
  return {
    path: "/reports",
    title: suffix("All Vedic Astrology Reports"),
    description:
      `${items.length || "Nine"} Vedic reports from one birth chart: full kundali, doshas, marriage, health, career, Lal Kitab, Varshaphal, transits and Vastu. English or Hindi.`,
    crumbs: [{ name: "Reports", path: "/reports" }],
    jsonLd: items.length
      ? [
          {
            "@type": "ItemList",
            name: "Vedic astrology reports",
            numberOfItems: items.length,
            itemListElement: items.map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: abs(`/report/${r.code}`),
              name: r.name_en
            }))
          }
        ]
      : []
  };
}

export function reportMeta(item: ReportItem | undefined, code: string, pages?: number): Meta {
  const s = REPORT_SEO[code];
  const name = item?.name_en || code;
  const path = `/report/${code}`;

  const product = item
    ? [
        {
          "@type": "Product",
          "@id": `${abs(path)}#product`,
          name,
          description: s?.description,
          url: abs(path),
          brand: { "@id": `${SITE.origin}/#organization` },
          category: "Vedic astrology report",
          // No aggregateRating and no review. We have neither, and inventing
          // them is the single most commonly penalised structured-data abuse.
          offers: {
            "@type": "Offer",
            url: abs(path),
            price: (item.price_paise / 100).toFixed(2),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            seller: { "@id": `${SITE.origin}/#organization` },
            // Matches the published policy, which really is unconditional.
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "IN",
              returnPolicyCategory: "https://schema.org/MerchantReturnUnlimitedWindow",
              refundType: "https://schema.org/FullRefund"
            }
          }
        }
      ]
    : [];

  return {
    path,
    title: suffix(s?.title.replace(` | ${SITE.name}`, "") || name),
    description: s?.description || `${name} computed from your birth chart.`,
    crumbs: [
      { name: "Reports", path: "/reports" },
      { name, path }
    ],
    jsonLd: [
      ...product,
      ...(s
        ? [
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: s.question,
                  acceptedAnswer: { "@type": "Answer", text: s.description }
                }
              ]
            }
          ]
        : [])
    ],
    ...(pages ? {} : {})
  };
}

export function faqMeta(qa: { q: string; a: string }[]): Meta {
  return {
    path: "/faq",
    title: suffix("Questions About Vedic Reports and Birth Times"),
    description:
      "How the chart is computed, why the birth time matters, which conventions are followed, what arrives and when, and how refunds work.",
    crumbs: [{ name: "Questions", path: "/faq" }],
    jsonLd: qa.length
      ? [
          {
            "@type": "FAQPage",
            // Only the questions actually printed on the page. Schema that
            // describes content a visitor cannot see is a manual-action risk.
            mainEntity: qa.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a }
            }))
          }
        ]
      : []
  };
}

export function methodologyMeta(): Meta {
  return {
    path: "/methodology",
    title: suffix("How a Report Is Computed"),
    description:
      "The ephemeris, the Lahiri ayanamsa, whole-sign houses, the 480 invariants every chart is checked against, and exactly where language is written rather than computed.",
    crumbs: [{ name: "Methodology", path: "/methodology" }]
  };
}

export function aboutMeta(): Meta {
  return {
    path: "/about",
    title: suffix("About — Who Makes These Reports and How"),
    description:
      "What astropothi is, who operates it, how the reports are produced, and how to use an astrological reading responsibly.",
    crumbs: [{ name: "About", path: "/about" }]
  };
}

const LEGAL_SEO: Record<string, { title: string; description: string }> = {
  terms: {
    title: "Terms of Service",
    description: "What you are buying, what it is not, and what each of us owes the other."
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "Exactly what we hold, who else sees it, how long we keep it, and how to make us delete it. Your birth time is not ordinary data."
  },
  refunds: {
    title: "Refunds — 100% Back, No Questions Asked",
    description:
      "If the report was not worth it to you, we refund the full amount. No conditions, no form, and you keep the file."
  },
  contact: {
    title: "Contact & Grievance",
    description: "WhatsApp, phone and email, plus the grievance process and how to escalate."
  }
};

export function legalMeta(slug: string): Meta {
  const s = LEGAL_SEO[slug] || { title: slug, description: "" };
  return {
    path: `/${slug}`,
    title: suffix(s.title),
    description: s.description,
    crumbs: [{ name: s.title, path: `/${slug}` }]
  };
}

/** Everything a buyer or a signed-in reader touches. Never indexed. */
export function privateMeta(path: string, title: string): Meta {
  return { path, title: suffix(title), description: "", noindex: true };
}

export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path)
    }))
  };
}

export { abs };
