import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

/**
 * In-app PDF viewer. The pandit never leaves the product to look at his own
 * work — he reads it here and downloads from here.
 */
export default function PdfModal({ url, title, subtitle, onClose }: {
  url: string; title: string; subtitle?: string; onClose: () => void;
}) {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [onClose]);

  const filename = `${title.replace(/[^\wऀ-ॿ]+/g, "_")}.pdf`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-fg/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-14 bg-fg text-surface shrink-0">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[14.5px] truncate deva">{title}</div>
          {subtitle && <div className="text-[11.5px] text-faint truncate">{subtitle}</div>}
        </div>
        <a href={url} download={filename}
           className="btn btn-sm bg-brass text-fg hover:bg-brass shrink-0">
          {t.viewer.download}
        </a>
        <button onClick={onClose} aria-label={t.viewer.close}
                className="btn btn-sm text-surface/80 hover:text-surface hover:bg-raised/10 shrink-0 px-2.5">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 relative bg-sunken">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-faint">
            <div className="flex flex-col items-center gap-3">
              <span className="w-7 h-7 rounded-full border-[3px] border-brass border-t-transparent animate-spin" />
              <span className="text-[13px]">{t.common.loading}</span>
            </div>
          </div>
        )}
        {/* The browser's own PDF engine — all pages, real scroll, real zoom.
            Opens at exactly 100%; the viewer's own controls take it from there.
            (`view=Fit` overrides zoom, and `view=FitH` forced ~150%.) */}
        <iframe src={`${url}#zoom=100`} title={title} onLoad={() => setLoaded(true)}
                className="w-full h-full border-0 bg-raised" />
      </div>
    </div>
  );
}
