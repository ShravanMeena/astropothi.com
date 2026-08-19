import { useEffect, useState } from "react";
import { rupees } from "../api";
import { useI18n } from "../i18n";

export type PendingOrder = {
  order_id: string; amount_paise: number; credits: number;
  gst_paise: number; pack: string; prefill?: { contact?: string; name?: string };
};
type Stage = "review" | "processing" | "done" | "failed";

/**
 * DEMO payment sheet. No money moves — it mirrors a real gateway so the
 * confirmation UX is built. Switching to Razorpay swaps this component only.
 */
export default function PaymentSheet({ order, onConfirm, onClose }: {
  order: PendingOrder;
  onConfirm: () => Promise<{ credits: number; invoice_no: string }>;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const [stage, setStage] = useState<Stage>("review");
  const [method, setMethod] = useState("upi");
  const [res, setRes] = useState<{ credits: number; invoice_no: string } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && stage === "review" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [stage, onClose]);

  const pay = async () => {
    setStage("processing"); setErr("");
    await new Promise((r) => setTimeout(r, 1300));
    try { setRes(await onConfirm()); setStage("done"); }
    catch (e: any) { setErr(e.message || t.pay.failed); setStage("failed"); }
  };

  const methods = [["upi", t.pay.upi, t.pay.upiSub], ["card", t.pay.card, t.pay.cardSub], ["nb", t.pay.nb, t.pay.nbSub]];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-fg/60 backdrop-blur-sm" onClick={() => stage === "review" && onClose()} />
      <div className="relative w-full sm:max-w-[400px] bg-raised rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-lift rise">
        <div className="bg-fg text-surface px-6 py-5 flex items-center justify-between">
          <div>
            <div className={`text-[10.5px] uppercase tracking-[.16em] text-brass font-bold ${dv}`}>{t.pay.demo}</div>
            <div className="display text-[20px] mt-0.5">Pothi</div>
          </div>
          <div className="text-right">
            <div className="display text-[26px]">{rupees(order.amount_paise)}</div>
            <div className="text-[11px] text-faint">{order.credits} {t.common.credits}</div>
          </div>
        </div>

        {stage === "review" && (
          <div className="p-6">
            <div className="text-[12.5px] text-muted mb-4">
              {order.prefill?.contact && <>+91 {order.prefill.contact} · </>}{t.pay.order} {order.order_id.slice(-8)}
            </div>
            <div className="space-y-2 mb-5">
              {methods.map(([id, label, sub]) => (
                <button key={id} onClick={() => setMethod(id)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition
                    ${method === id ? "border-fg bg-sunken" : "border-line/80 hover:border-line"}`}>
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 grid place-items-center
                    ${method === id ? "border-fg" : "border-line"}`}>
                    {method === id && <span className="w-2 h-2 rounded-full bg-fg" />}
                  </span>
                  <span>
                    <span className={`block font-semibold text-[14px] ${dv}`}>{label}</span>
                    <span className="block text-[11.5px] text-faint">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-sunken border border-line/70 p-3.5 text-[13px] space-y-1.5 mb-5">
              <div className="flex justify-between"><span className={`text-muted ${dv}`}>{t.pay.subtotal}</span><span>{rupees(order.amount_paise - order.gst_paise)}</span></div>
              <div className="flex justify-between"><span className={`text-muted ${dv}`}>{t.pay.gst}</span><span>{rupees(order.gst_paise)}</span></div>
              <div className="flex justify-between font-bold pt-1.5 border-t border-line"><span className={dv}>{t.pay.total}</span><span>{rupees(order.amount_paise)}</span></div>
            </div>
            <button className="btn-brass w-full" onClick={pay}>{t.pay.pay} {rupees(order.amount_paise)}</button>
            <button className="btn-quiet w-full mt-1.5" onClick={onClose}>{t.pay.cancel}</button>
            <p className="mt-3 text-[11px] text-center text-faint">{t.pay.noRealMoney}</p>
          </div>
        )}

        {stage === "processing" && (
          <div className="p-12 text-center">
            <div className="mx-auto w-9 h-9 rounded-full border-[3px] border-fg border-t-transparent animate-spin" />
            <div className={`mt-5 font-semibold ${dv}`}>{t.pay.processing}</div>
            <div className="text-[13px] text-faint mt-1">{t.pay.doNotClose}</div>
          </div>
        )}

        {stage === "done" && res && (
          <div className="p-9 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-brassSoft text-brass grid place-items-center">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4"
                   strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div className={`display text-[23px] mt-4 ${dv}`}>{t.pay.success}</div>
            <div className={`mt-1 text-muted ${dv}`}>{res.credits} {t.pay.added}</div>
            <div className="mt-3 text-[11.5px] text-faint">{t.pay.invoice} {res.invoice_no}</div>
            <button className="btn-brass w-full mt-7" onClick={onClose}>{t.pay.ok}</button>
          </div>
        )}

        {stage === "failed" && (
          <div className="p-9 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-ember/10 text-ember grid place-items-center text-2xl font-bold">!</div>
            <div className={`display text-[23px] mt-4 ${dv}`}>{t.pay.failed}</div>
            <div className="mt-1 text-[13.5px] text-muted">{err}</div>
            <button className="btn-line w-full mt-7" onClick={onClose}>{t.pay.cancel}</button>
          </div>
        )}
      </div>
    </div>
  );
}
