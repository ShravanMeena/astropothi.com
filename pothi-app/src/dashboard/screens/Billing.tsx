import { useEffect, useState } from "react";
import { api, rupees } from "../api";
import { useI18n } from "../i18n";
import PaymentSheet, { type PendingOrder } from "./PaymentSheet";

type Pack = { code: string; name_en: string; name_hi: string; price_paise: number;
              credits: number; validity_days: number; gst_paise: number; per_credit_paise: number };
type Rate = { rate_paise: number; min: number; max: number };
type Entry = { id: string; delta: number; reason: string; note?: string; createdAt: string };
type Purchase = { id: string; amount_paise: number; credits: number; status: string; invoice_no?: string; createdAt: string };

export default function Billing({ onCredited }: { onCredited: (b: number) => void }) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const [packs, setPacks] = useState<Pack[]>([]);
  const [rate, setRate] = useState<Rate | null>(null);
  const [custom, setCustom] = useState("100");
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [ledger, setLedger] = useState<Entry[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    api.get("/api/v1/credits/packs").then(setPacks).catch(() => {});
    api.get("/api/v1/credits/custom-rate").then(setRate).catch(() => {});
    refreshHistory();
  }, []);

  const refreshHistory = () => {
    api.get("/api/v1/credits/ledger?limit=20").then(setLedger).catch(() => {});
    api.get("/api/v1/credits/purchases").then(setPurchases).catch(() => {});
  };

  const start = async (body: { pack?: string; credits?: number }, key: string) => {
    setBusy(key); setErr("");
    try { setOrder(await api.post("/api/v1/credits/purchase", body)); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  const confirm = async () => {
    const r = await api.post("/api/v1/credits/confirm", { razorpay_order_id: order!.order_id });
    onCredited(r.balance);
    refreshHistory();
    return { credits: r.credits, invoice_no: r.invoice_no };
  };

  const n = Math.floor(Number(custom) || 0);
  const ok = rate && n >= rate.min && n <= rate.max;
  const total = rate ? n * rate.rate_paise : 0;

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className={`display text-[28px] ${dv}`}>{t.billing.title}</h1>
        <p className={`mt-1.5 text-[14px] text-muted ${dv}`}>{t.billing.sub}</p>
      </div>

      {err && <div className="card p-4 text-[13.5px] text-ember bg-ember/60 border-ember/25">{err}</div>}

      <div className="card p-5 sm:p-6">
        <div className={`eyebrow mb-3 ${dv}`}>{t.billing.custom}</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="field sm:flex-1" inputMode="numeric" value={custom}
                 onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 5))} />
          <button className="btn-brass sm:w-44" disabled={!ok || !!busy} onClick={() => start({ credits: n }, "custom")}>
            {busy === "custom" ? "…" : rupees(total)}
          </button>
        </div>
        {rate && (
          <p className="mt-2 text-[12px] text-faint">
            ₹{(rate.rate_paise / 100).toFixed(2)} {t.billing.perCredit} · {rate.min}–{rate.max}
          </p>
        )}
      </div>

      <div className={`eyebrow px-1 ${dv}`}>{t.billing.packs}</div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.filter((p) => p.price_paise > 0).map((p) => {
          const hero = p.code === "standard";
          return (
            <div key={p.code}
              className={`card p-5 relative flex flex-col ${hero ? "ring-1 ring-fg border-fg" : ""}`}>
              {hero && (
                <span className={`absolute -top-2.5 left-5 chip bg-fg text-surface ${dv}`}>{t.billing.popular}</span>
              )}
              <div className={`font-semibold text-[16px] ${lang === "hi" ? "deva" : ""}`}>
                {lang === "hi" ? p.name_hi : p.name_en}
              </div>
              <div className="display text-[34px] mt-2">{rupees(p.price_paise)}</div>
              <div className="mt-1 text-[13px] text-muted">
                {p.credits} {t.billing.creditsLabel} · ₹{(p.per_credit_paise / 100).toFixed(2)}
              </div>
              <div className="mt-0.5 text-[11.5px] text-faint">
                {p.validity_days} {t.billing.validity} · {rupees(p.gst_paise)} {t.billing.gstIncl}
              </div>
              <button className={`${hero ? "btn-brass" : "btn-line"} w-full mt-5`} disabled={!!busy}
                      onClick={() => start({ pack: p.code }, p.code)}>
                {busy === p.code ? "…" : t.billing.buy}
              </button>
            </div>
          );
        })}
      </div>

      <p className={`text-[11.5px] text-faint leading-relaxed px-1 ${dv}`}>{t.billing.terms}</p>

      {/* Where his money went, and the invoices for it. */}
      <div className="grid lg:grid-cols-2 gap-4 pt-2">
        <div className="card p-5">
          <h3 className={`display text-[18px] mb-3 ${dv}`}>{t.ledger.title}</h3>
          {ledger.length === 0
            ? <p className={`text-[13px] text-faint ${dv}`}>{t.ledger.empty}</p>
            : <div className="divide-y divide-line -my-2">
                {ledger.map((x) => (
                  <div key={x.id} className="flex items-center justify-between py-2 text-[13px]">
                    <div className="min-w-0">
                      <span className={dv}>{(t.ledger.reason as any)[x.reason] || x.reason}</span>
                      {x.note && <span className="text-faint"> · {x.note}</span>}
                    </div>
                    <span className={`font-semibold shrink-0 ml-3 ${x.delta > 0 ? "text-brass" : "text-muted"}`}>
                      {x.delta > 0 ? "+" : ""}{x.delta}
                    </span>
                  </div>))}
              </div>}
        </div>

        <div className="card p-5">
          <h3 className={`display text-[18px] mb-3 ${dv}`}>{t.ledger.purchases}</h3>
          {purchases.filter((p) => p.status === "paid").length === 0
            ? <p className={`text-[13px] text-faint ${dv}`}>{t.ledger.empty}</p>
            : <div className="divide-y divide-line -my-2">
                {purchases.filter((p) => p.status === "paid").map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 text-[13px]">
                    <div className="min-w-0">
                      <div>{rupees(p.amount_paise)} <span className="text-faint">· {p.credits} {t.billing.creditsLabel}</span></div>
                      {p.invoice_no && <div className="text-[11px] text-faint">{t.ledger.invoice} {p.invoice_no}</div>}
                    </div>
                    <span className="text-[11.5px] text-faint shrink-0 ml-3">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>))}
              </div>}
        </div>
      </div>

      {order && <PaymentSheet order={order} onConfirm={confirm} onClose={() => setOrder(null)} />}
    </div>
  );
}
