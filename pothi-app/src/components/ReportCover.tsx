import { useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * One colourway per report, so nine books do not look like nine copies of one
 * on a shelf.
 *
 * The server owns this now — it is in the catalogue payload as `cover_palette`,
 * because the boot warmer has to pre-render exactly the variant the storefront
 * will ask for, and two copies of the map meant it could warm one the shop
 * never requested. This stays as the fallback for a caller that has no
 * catalogue row to hand.
 */
export const COVER_PALETTE: Record<string, string> = {
  kundli:     "gold",
  dosh:       "slate",
  love:       "saffron",
  health:     "emerald",
  horoscope:  "indigo",
  laalkitab:  "crimson",
  varshaphal: "parchment",
  vastu:      "emerald",
  career:     "slate"
};

/**
 * The real rendered cover of a report, fetched per card.
 *
 * Per-card rather than with the page payload on purpose: a design nobody has
 * rendered yet costs a placeholder in one tile instead of stalling the whole
 * grid behind seven cold renders.
 */
export default function ReportCover({ code, design = "heritage", palette, className = "" }: {
  code: string; design?: string; palette?: string; className?: string;
}) {
  const pal = palette || COVER_PALETTE[code] || "gold";
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setUrl(null);
    api.get(`/noauth-api/v1/shop/thumb/${code}?design=${design}&palette=${pal}`)
      .then((r: { url: string | null }) => { if (live) setUrl(r.url); })
      .catch(() => {});
    return () => { live = false; };
  }, [code, design, pal]);

  return (
    <span className={`block self-start aspect-[1/1.414] rounded-[2px] overflow-hidden border border-line
                      bg-sunken shadow-soft transition-all duration-500
                      group-hover:shadow-lift group-hover:-translate-y-1.5 ${className}`}>
      {url ? <img src={url} alt="" className="w-full block" loading="lazy" />
           : <span className="block w-full h-full animate-pulse" />}
    </span>
  );
}
