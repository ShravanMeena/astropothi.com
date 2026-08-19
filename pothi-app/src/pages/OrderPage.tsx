import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, rupees, type OrderStatus } from "../lib/api";
import Support from "../components/Support";
import { track } from "../lib/track";
import BookReader from "../components/BookReader";
import ChartMark from "../components/ChartMark";
import AskReport from "../components/AskReport";

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

  // The last step of the funnel. Fired from here rather than from the server
  // because the fact worth counting is that the BUYER saw their report was
  // ready — a report generated into a tab nobody has open is not a conversion.
  const [announced, setAnnounced] = useState(false);
  useEffect(() => {
    if (o?.status !== "ready" || announced) return;
    setAnnounced(true);
    track("order_ready", { order_id: id, code: o.report_type });
  }, [o?.status, announced, id]);

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
    <div className="shell py-14 text-center">
      <h1 className="display text-[22px]">We could not find that order</h1>
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

        <div className="shell relative z-10 py-11 sm:py-24 text-center">
          <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: .5, ease: [0.22, 0.7, 0.2, 1] }}
            className="mx-auto w-14 h-14 rounded-full border border-brass/40 bg-brassSoft/30
                       text-brass grid place-items-center">
            {waiting
              ? <span className="block w-6 h-6 rounded-full border-2 border-brass border-t-transparent animate-spin" />
              : <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
                     strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
          </motion.div>

          <h1 className="display text-[25px] sm:text-[48px] mt-7">{headline}</h1>
          <p className="lede mt-3">{sub}</p>

          <div className="flex flex-wrap justify-center gap-3 mt-9">
            {st === "ready" ? (
              <>
                <button className="btn-brass h-[52px] px-8 text-[16px]"
                        disabled={!canRead}
                        onClick={() => { track("reader_opened", { order_id: id }); setReading(true); }}>
                  {pages === null ? "Preparing the pages…" : canRead ? "Read it here" : "Reading unavailable"}
                </button>
                <a className={`btn-line h-[52px] ${o?.pdf_url ? "" : "pointer-events-none opacity-40"}`}
                   href={o?.pdf_url || "#"} download
                   onClick={() => track("report_downloaded", { order_id: id })}>
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

      {/* The reader is a full-screen mode, not a section in the page.
          Inline, it put a viewport-tall book inside a scrolling document, and
          on a phone every drag over the book belonged to the book — so the page
          could not be scrolled past it. */}
      <BookReader open={reading && canRead} onClose={() => setReading(false)}
                  shots={pages ?? []}
                  title={o?.report_name_en ?? o?.report_type ?? "Your report"}
                  subtitle={`Order ${o?.public_id ?? ""}`}
                  pdfUrl={o?.pdf_url} />

      {/* Somewhere to put a question, for a reader who is stuck on page 40. */}
      {st === "ready" && (
        <section id="ask" className="shell py-10 sm:py-20 max-w-3xl scroll-mt-20">
          <AskReport publicId={id} language={o?.language} />
        </section>
      )}

      {o && (
        <section className="shell pb-14 sm:pb-20 max-w-3xl">
          <div className="card p-6 sm:p-8 grid sm:grid-cols-2 gap-y-5 gap-x-10 text-[14.5px]">
            {[["Order", o.public_id], ["Invoice", o.invoice_no || "—"],
              ["Report", o.report_name_en ?? o.report_type], ["Design", `${o.design} · ${o.palette}`],
              ["Pages", String(o.page_count ?? "—")], ["Paid", rupees(o.amount_paise)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                <span className="text-muted">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          {/* The order number is already in the WhatsApp message, so a buyer
              with a problem does not have to find and retype it. */}
          <Support className="mt-8" orderId={o.public_id}
                   reportName={o.report_name_en ?? o.report_type} where="order" />

          <div className="text-center mt-10">
            <button className="btn-line" onClick={onHome}>Browse other reports</button>
          </div>
        </section>
      )}
      {/* Reachable from anywhere on the page, including halfway down the book. */}
      {st === "ready" && (
        <button onClick={() => {
                  document.getElementById("ask")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => document.querySelector<HTMLInputElement>(
                    'input[aria-label="Ask your report"]')?.focus(), 600);
                }}
                aria-label="Ask your report"
                className="fixed z-40 bottom-5 right-5 h-14 pl-5 pr-6 rounded-full bg-brass text-surface
                           shadow-lift ring-1 ring-black/10 flex items-center gap-3
                           transition-transform hover:scale-[1.03] active:scale-[.98]"
                style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
               strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.3 9.3 0 0 1-3.3-.6L3 21l1.8-5a8.2 8.2 0 0 1-.8-3.5 8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 8.4Z" />
          </svg>
          <span className="text-[15px] font-medium whitespace-nowrap">Ask your report</span>
        </button>
      )}
    </>
  );
}
