import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, rupees, type OrderStatus } from "../lib/api";
import PageTurner from "../components/PageTurner";
import ChartMark from "../components/ChartMark";

type Shot = { page: number; url: string };

export default function OrderPage({ id, onHome, onProfile }: {
  id: string; onHome: () => void; onProfile: () => void;
}) {
  const [o, setO] = useState<OrderStatus | null>(null);
  const [pages, setPages] = useState<Shot[] | null>(null);
  const [reading, setReading] = useState(false);
  const [err, setErr] = useState("");
  const [settling, setSettling] = useState(false);

  /**
   * Razorpay redirects back here with its own query parameters after a payment
   * link is paid. The webhook is what actually marks the order paid; this hand
   * is only so a buyer who beats the webhook home is not told they still owe
   * money. The server re-verifies the signature — a redirect is not evidence.
   */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const linkId = q.get("razorpay_payment_link_id");
    if (!linkId) return;
    setSettling(true);
    api.post("/noauth-api/v1/shop/confirm-link", {
      razorpay_payment_link_id: linkId,
      razorpay_payment_id: q.get("razorpay_payment_id"),
      razorpay_payment_link_status: q.get("razorpay_payment_link_status"),
      razorpay_payment_link_reference_id: q.get("razorpay_payment_link_reference_id"),
      razorpay_signature: q.get("razorpay_signature")
    })
      .then(setO)
      .catch(() => { /* the webhook will finish it; polling below picks it up */ })
      .finally(() => {
        setSettling(false);
        // Strip the gateway's parameters so a refresh is not a re-submit.
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, []);

  useEffect(() => {
    api.get(`/noauth-api/v1/shop/order/${id}`).then(setO).catch((e) => setErr(e.message));
  }, [id]);

  /**
   * Until the order is finished, keep asking. The webhook may land a second
   * after the buyer does, and a report takes a few seconds to typeset.
   */
  useEffect(() => {
    if (!o || ["ready", "failed", "refunded"].includes(o.status)) return;
    const t = setInterval(() => {
      api.get(`/noauth-api/v1/shop/order/${id}`).then(setO).catch(() => {});
    }, 2500);
    return () => clearInterval(t);
  }, [id, o?.status]);

  // The pages are rasterised on the server the first time anyone asks, which
  // takes a few seconds on a long book — so fetch them alongside the order
  // rather than making the reader wait for a click.
  useEffect(() => {
    if (o?.status !== "ready") return;
    let live = true;
    api.get(`/noauth-api/v1/shop/order/${id}/pages`)
      .then((r: { pages: Shot[] }) => { if (live) setPages(r.pages ?? []); })
      .catch(() => { if (live) setPages([]); });
    return () => { live = false; };
  }, [id, o?.status]);

  if (err) return (
    <div className="shell py-28 text-center">
      <h1 className="display text-[28px]">We could not find that order</h1>
      <p className="lede mt-3">{err}</p>
      <button className="btn-line mt-7" onClick={onHome}>Back to reports</button>
    </div>
  );

  const canRead = !!pages?.length;
  const st = o?.status;
  const waiting = settling || st === "created" || st === "paid" || st === "generating";
  const headline = !o ? "Loading…"
    : st === "ready"    ? "Your report is ready"
    : st === "failed"   ? "Something went wrong"
    : st === "refunded" ? "This order was refunded"
    : st === "created"  ? "Waiting for payment"
                        : "Writing your report";
  const sub = !o ? ""
    : st === "ready"    ? `${o.page_count ?? "—"} pages · order ${o.public_id}`
    : st === "failed"   ? "Your payment is safe. Write to us and we will fix this or refund you."
    : st === "created"  ? "We have not seen the payment yet. If you have paid, this updates by itself."
                        : "The chart is computed and the chapters are being typeset. This page updates itself.";

  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[760px] max-w-[128vw] text-brass opacity-[.13] dark:opacity-[.17]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>

        <div className="shell relative z-10 py-16 sm:py-24 text-center">
          <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: .5, ease: [0.22, 0.7, 0.2, 1] }}
            className="mx-auto w-14 h-14 rounded-full border border-brass/40 bg-brassSoft/30
                       text-brass grid place-items-center">
            {waiting
              ? <span className="block w-6 h-6 rounded-full border-2 border-brass border-t-transparent animate-spin" />
              : <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
                     strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
          </motion.div>

          <h1 className="display text-[34px] sm:text-[48px] mt-7">{headline}</h1>
          <p className="lede mt-3">{sub}</p>

          <div className="flex flex-wrap justify-center gap-3 mt-9">
            {st === "ready" ? (
              <>
                <button className="btn-brass h-[52px] px-8 text-[16px]"
                        disabled={!canRead} onClick={() => setReading(true)}>
                  {pages === null ? "Preparing the pages…" : canRead ? "Read it here" : "Reading unavailable"}
                </button>
                <a className={`btn-line h-[52px] ${o?.pdf_url ? "" : "pointer-events-none opacity-40"}`}
                   href={o?.pdf_url || "#"} download>
                  Download PDF
                </a>
              </>
            ) : (
              <button className="btn-line h-[52px]" onClick={onProfile}>All your reports</button>
            )}
          </div>
          <p className="mt-4 text-[13px] text-faint">
            Keep this page — your report stays available at this link.
          </p>
        </div>
      </section>

      {/* The book itself. Rendered once the reader is opened so a buyer who only
          wants the file never pays for a few dozen page images. */}
      {reading && canRead && (
        <section className="relative overflow-hidden grain border-b border-line">
          <div className="shell relative z-10 py-14 sm:py-20">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-10">
              <div>
                <p className="caps text-brass">Reading</p>
                <h2 className="display text-[26px] sm:text-[34px] mt-2">{o?.report_name_en ?? o?.report_type}</h2>
              </div>
              <button className="btn-quiet" onClick={() => setReading(false)}>Close reader</button>
            </div>
            <PageTurner shots={pages!} maxW={880} keyboard caption={`Order ${o?.public_id}`} />
          </div>
        </section>
      )}

      {o && (
        <section className="shell py-14 sm:py-20 max-w-3xl">
          <div className="card p-6 sm:p-8 grid sm:grid-cols-2 gap-y-5 gap-x-10 text-[14.5px]">
            {[["Order", o.public_id], ["Invoice", o.invoice_no || "—"],
              ["Report", o.report_name_en ?? o.report_type], ["Design", `${o.design} · ${o.palette}`],
              ["Pages", String(o.page_count ?? "—")], ["Paid", rupees(o.amount_paise)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                <span className="text-muted">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button className="btn-line" onClick={onHome}>Browse other reports</button>
          </div>
        </section>
      )}
    </>
  );
}
