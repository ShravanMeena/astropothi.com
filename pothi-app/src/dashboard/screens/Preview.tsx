import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import type { Preview as P } from "../types";
import PdfModal from "../components/PdfModal";

/**
 * Real rendered pages of this exact (report × design × palette × language).
 * Server-rendered from the engine and rasterised, so it can never drift from
 * what the client actually receives.
 */
export default function Preview({ type, design, palette, lang, title }:
  { type: string; design: string; palette: string; lang: string; title: string }) {
  const { t } = useI18n();
  const [p, setP] = useState<P | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [full, setFull] = useState(false);

  useEffect(() => {
    let dead = false;
    setLoading(true); setErr(""); setP(null);
    api.get(`/noauth-api/v1/catalog/preview?type=${type}&design=${design}&palette=${palette}&lang=${lang}`)
      .then((r) => !dead && setP(r))
      .catch((e) => !dead && setErr(e.message))
      .finally(() => !dead && setLoading(false));
    return () => { dead = true; };
  }, [type, design, palette, lang]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[1/1.414] rounded-lg bg-sunken animate-pulse" />
        ))}
        {!loading && p?.images.map((im) => (
          <button key={im.page} onClick={() => setFull(true)}
            className="group relative rounded-lg overflow-hidden border border-line bg-raised
                       hover:shadow-lift hover:-translate-y-0.5 transition-all">
            <img src={im.url} alt={`Page ${im.page}`} className="w-full block" loading="lazy" />
            <span className="absolute bottom-1 right-1 chip bg-fg/80 text-surface text-[10px]">{im.page}</span>
          </button>
        ))}
      </div>

      {err && <p className="mt-3 text-[13.5px] text-ember">{err}</p>}

      {p && (
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-muted">
          <span><b className="text-fg">{p.total_pages}</b> {t.create.pages} · {t.create.showing} {p.images.length}</span>
          <button onClick={() => setFull(true)} className="font-semibold text-fg hover:text-brass">
            {t.create.openSample} →
          </button>
        </div>
      )}

      {full && p && (
        <PdfModal url={p.pdf} title={`${title} — ${t.viewer.sample}`}
                  subtitle={`${design} · ${palette} · ${p.total_pages} ${t.create.pages}`}
                  onClose={() => setFull(false)} />
      )}
    </>
  );
}
