import { useEffect, useState } from "react";
import PdfModal from "../components/PdfModal";
import PricesModal from "./PricesModal";
import { api, rupees } from "../api";
import { useI18n } from "../i18n";
import type { Earnings, Report, ReportType } from "../types";

export default function Home({ balance, onTopup, onCreate, types, pilot }: {
  balance: number; onTopup: () => void; onCreate: () => void; types: ReportType[];
  pilot?: { on: boolean; seats: number; free_reports: number } | null;
}) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const [e, setE] = useState<Earnings | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState<Report | null>(null);
  const [prices, setPrices] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    api.get("/api/v1/earnings/summary").then(setE).catch(() => {});
    api.get("/api/v1/reports").then(setReports).catch(() => {});
  }, [balance, tick]);

  const max = Math.max(1, ...(e?.by_type?.map((x) => x.earned_paise) || [1]));
  // Report types he has actually generated but never priced — those silently
  // contribute ₹0 to the headline number, so say so instead of hiding it.
  const unpriced = (e?.by_type || []).filter((x) => !x.price_paise);

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Earnings — the reason he opens the app */}
        <div className="lg:col-span-2 card p-6 sm:p-8 relative overflow-hidden">
          <div aria-hidden className="absolute -top-24 -right-16 w-72 h-72 rounded-full"
               style={{ background: "radial-gradient(circle,rgba(194,154,60,.14),transparent 65%)" }} />
          <div className="relative">
            <div className={`eyebrow ${dv}`}>{t.dash.earnings}</div>
            <div className="display text-[46px] sm:text-[60px] leading-none mt-2 text-fg">
              {rupees(e?.earned_paise ?? 0)}
            </div>
            <div className={`mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px] text-muted ${dv}`}>
              <span><b className="text-fg">{e?.reports ?? 0}</b> {t.dash.reports}</span>
              <span>{t.dash.cost} <b className="text-fg">{rupees(e?.spent_paise ?? 0)}</b></span>
              {e?.multiple ? <span className="chip bg-brassSoft text-brass">{e.multiple}× {t.dash.roi}</span> : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button onClick={() => setPrices(true)}
                      className="text-[12px] font-semibold text-fg underline underline-offset-2 hover:text-brass">
                {t.dash.setPrices}
              </button>
              <span className="text-[11.5px] text-faint">{t.dash.estimate}</span>
            </div>
            {!!unpriced.length && (
              <button onClick={() => setPrices(true)}
                      className="mt-3 chip bg-ember/10 text-ember hover:bg-ember/70">
                {unpriced.length} {t.prices.unpriced}
              </button>
            )}
          </div>
        </div>

        {/* Credits */}
        <div className="card p-6 sm:p-7 flex flex-col justify-between">
          <div>
            {pilot?.on && <span className="chip bg-fg text-surface mb-2">{t.pilot.badge}</span>}
            <div className={`eyebrow ${dv}`}>{pilot?.on ? t.pilot.left : t.dash.credits}</div>
            <div className="display text-[46px] leading-none mt-2">{balance}</div>
            {pilot?.on && (
              <p className={`mt-2 text-[12px] text-faint leading-snug ${dv}`}>
                {balance > 0
                  ? t.pilot.note.replace(/\{t\}/g, String(pilot.seats))
                  : t.pilot.ended}
              </p>
            )}
          </div>
          <div className="mt-6 grid gap-2">
            <button className="btn-brass w-full" onClick={onCreate}>{t.nav.create}</button>
            {!pilot?.on && <button className="btn-line w-full" onClick={onTopup}>{t.dash.topup}</button>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {!!e?.by_type?.length && (
          <div className="card p-6">
            <h3 className={`display text-[19px] mb-4 ${dv}`}>{t.dash.byType}</h3>
            <div className="space-y-3.5">
              {e.by_type.map((x) => (
                <div key={x.report_type}>
                  <div className="flex items-baseline justify-between text-[13.5px]">
                    <span className={lang === "hi" ? "deva" : ""}>
                      {lang === "hi" ? x.name_hi : x.name_en}
                      <span className="text-faint"> ×{x.count}</span>
                    </span>
                    <span className="font-semibold">{rupees(x.earned_paise)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-sunken overflow-hidden">
                    <div className="h-full rounded-full bg-brass"
                         style={{ width: `${(x.earned_paise / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card p-6">
          <h3 className={`display text-[19px] mb-4 ${dv}`}>{t.dash.recent}</h3>
          {reports.length === 0
            ? <p className={`text-[13.5px] text-faint ${dv}`}>{t.dash.empty}</p>
            : <div className="divide-y divide-line/70 -my-2">
                {reports.slice(0, 6).map((r) => (
                  <button key={r.id} onClick={() => setOpen(r)}
                     className="w-full text-left flex items-center justify-between py-2.5 group">
                    <div className="min-w-0">
                      <div className="font-medium text-[14px] deva truncate">{r.Client?.name || "—"}</div>
                      <div className="text-[11.5px] text-faint truncate">
                        {r.report_type} · {r.design} · {r.palette} · {r.page_count}pp
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-faint group-hover:text-fg shrink-0 ml-3">PDF →</span>
                  </button>
                ))}
              </div>}
        </div>
      </div>
      {prices && (
        <PricesModal types={types} onClose={() => setPrices(false)} onSaved={() => setTick((n) => n + 1)} />
      )}
      {open && (
        <PdfModal url={open.pdf_url} title={open.Client?.name || open.report_type}
                  subtitle={`${open.report_type} · ${open.design} · ${open.palette} · ${open.page_count} pp`}
                  onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
