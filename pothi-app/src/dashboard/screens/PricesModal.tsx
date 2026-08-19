import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import type { ReportType } from "../types";

/**
 * What HE charges his client. The dashboard's headline earnings number is
 * derived from this, and there was no way to enter it — so any report type he
 * had not priced silently counted as ₹0.
 */
export default function PricesModal({ types, onClose, onSaved }: {
  types: ReportType[]; onClose: () => void; onSaved: () => void;
}) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/v1/earnings/prices").then((rows) => {
      const m: Record<string, string> = {};
      for (const r of rows || []) m[r.report_type] = String(Math.round(r.sale_price_paise / 100));
      setPrices(m);
    }).catch(() => {});
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      // Send every type, including cleared ones — the server removes a price
      // when it arrives as 0, so clearing the field actually clears it.
      await api.put("/api/v1/earnings/prices", {
        prices: types.map((x) => ({
          report_type: x.code,
          sale_price_paise: Math.round(Number(prices[x.code] || 0) * 100)
        }))
      });
      setMsg(t.prices.saved); onSaved();
      setTimeout(onClose, 500);
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-fg/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-raised rounded-t-3xl sm:rounded-2xl shadow-lift rise
                      max-h-[88dvh] flex flex-col">
        <div className="p-6 pb-4">
          <h2 className={`display text-[22px] ${dv}`}>{t.prices.title}</h2>
          <p className={`mt-1.5 text-[13px] text-muted leading-relaxed ${dv}`}>{t.prices.sub}</p>
        </div>
        <div className="px-6 overflow-y-auto flex-1 divide-y divide-line">
          {types.map((x) => (
            <div key={x.code} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className={`text-[14px] font-medium truncate ${lang === "hi" ? "deva" : ""}`}>
                  {lang === "hi" ? x.name_hi : x.name_en}
                </div>
                <div className="text-[11.5px] text-faint">{x.credits} {t.create.credits}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-faint text-[15px]">₹</span>
                <input className="field h-10 w-24 text-right" inputMode="numeric"
                       placeholder={t.prices.notSet}
                       value={prices[x.code] ?? ""}
                       onChange={(e) => setPrices({ ...prices, [x.code]: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 pt-4 flex items-center gap-3 border-t border-line">
          <button className="btn-brass flex-1" onClick={save} disabled={busy}>
            {busy ? "…" : t.prices.save}
          </button>
          <button className="btn-quiet px-5" onClick={onClose}>{t.viewer.close}</button>
          {msg && <span className="text-[13px] text-muted">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
