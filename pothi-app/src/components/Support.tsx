import { SUPPORT, prettyPhone, waLink, mailLink, telLink, aboutOrder } from "../lib/support";
import { track } from "../lib/track";

const Whatsapp = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" className={className} aria-hidden>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.18c-.24.68-1.42 1.31-1.95 1.36-.5.05-.97.23-3.27-.68-2.75-1.08-4.5-3.9-4.64-4.08-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27a1 1 0 0 1 .72-.34h.51c.17 0 .39-.06.6.46.24.57.8 1.98.87 2.12.07.14.11.31.02.5-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.87.27.14.45.2.51.32.07.11.07.66-.17 1.34Z" />
  </svg>
);

const Mail = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7.5 8.5 6 8.5-6" />
  </svg>
);

/**
 * The two ways to reach a person, everywhere a buyer might need them.
 *
 * Both are direct links, not a contact form: someone who has paid and has a
 * problem should not have to describe it into a box and wait. WhatsApp opens
 * with the order number already typed.
 *
 * `tone="panel"` is the boxed version for the end of a page; `tone="inline"`
 * is the quiet one-liner for a footer or under a form.
 */
export default function Support({
  orderId, reportName, tone = "panel", where = "page", className = ""
}: {
  orderId?: string; reportName?: string;
  tone?: "panel" | "inline" | "bar"; where?: string; className?: string;
}) {
  const msg = aboutOrder(orderId, reportName);
  const subject = orderId ? `Pothi order ${orderId}` : "Pothi — a question";
  const hit = (channel: string) => track("support_clicked", { channel, where, order_id: orderId });

  if (tone === "inline") {
    return (
      <p className={`text-[13px] text-muted ${className}`}>
        Need help?{" "}
        <a href={waLink(msg)} target="_blank" rel="noreferrer" onClick={() => hit("whatsapp")}
           className="text-brass hover:underline">WhatsApp {prettyPhone()}</a>
        {" · "}
        <a href={mailLink(subject)} onClick={() => hit("email")}
           className="text-brass hover:underline">{SUPPORT.email}</a>
      </p>
    );
  }

  if (tone === "bar") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <a href={waLink(msg)} target="_blank" rel="noreferrer" onClick={() => hit("whatsapp")}
           className="btn btn-sm border border-line text-fg hover:border-brass hover:text-brass gap-2">
          <Whatsapp /> WhatsApp us
        </a>
        <a href={mailLink(subject)} onClick={() => hit("email")}
           className="btn btn-sm border border-line text-fg hover:border-brass hover:text-brass gap-2">
          <Mail /> Email us
        </a>
      </div>
    );
  }

  return (
    <section className={`card p-6 sm:p-7 ${className}`}>
      <h3 className="display text-[19px]">Stuck, or something looks wrong?</h3>
      <p className="text-[14px] text-muted mt-1.5 leading-relaxed max-w-lg">
        A person reads every message — not a bot. Ask about your chart, your reading, your
        payment or your order. {SUPPORT.hours}.
      </p>
      <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
        <a href={waLink(msg)} target="_blank" rel="noreferrer" onClick={() => hit("whatsapp")}
           className="btn btn-sm bg-[#25D366] text-white hover:opacity-90 gap-2 justify-center">
          <Whatsapp /> WhatsApp {prettyPhone()}
        </a>
        <a href={mailLink(subject)} onClick={() => hit("email")}
           className="btn btn-sm btn-line gap-2 justify-center">
          <Mail /> {SUPPORT.email}
        </a>
        {/* Calling matters to the half of our buyers who will never type a message. */}
        <a href={telLink()} onClick={() => hit("call")}
           className="btn btn-sm btn-line justify-center sm:hidden">Call</a>
      </div>
      {orderId && (
        <p className="text-[12.5px] text-faint mt-4">
          Your order number <span className="text-muted font-medium">{orderId}</span> is already
          in the message, so we can pull it up straight away.
        </p>
      )}
    </section>
  );
}
