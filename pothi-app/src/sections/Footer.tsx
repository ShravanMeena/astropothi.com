import { SUPPORT, waLink, mailLink, prettyPhone } from "../lib/support";
import Logo from "../components/Logo";
export default function Footer({ onAstrologers, onGo }: {
  onAstrologers: () => void; onGo: (path: string) => void;
}) {
  return (
    <footer className="shell py-10">
      <div className="flex flex-col sm:flex-row gap-8 sm:items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <Logo size={20} />
            <span className="deva text-[13px] text-brass">पोथी</span>
          </div>
          <p className="text-[13.5px] text-muted mt-2 max-w-md leading-relaxed">
            Vedic reports computed from an astronomical ephemeris, written out in full.
          </p>
          {/* Spelled out rather than hidden behind the word "Contact" — the
              number is the reassurance, not the link. */}
          <p className="text-[13.5px] text-muted mt-4 leading-relaxed">
            <a href={waLink()} target="_blank" rel="noreferrer" className="text-brass hover:underline">
              WhatsApp {prettyPhone()}
            </a>
            <span className="text-faint"> · </span>
            <a href={mailLink("Pothi — a question")} className="text-brass hover:underline">
              {SUPPORT.email}
            </a>
          </p>
          <p className="text-[12px] text-faint mt-1">{SUPPORT.hours}</p>
        </div>
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-[13.5px] text-muted">
          <button onClick={() => onGo("/reports")} className="hover:text-fg">Reports</button>
          <button onClick={() => onGo("/faq")} className="hover:text-fg">Questions</button>
          <button onClick={() => onGo("/profile")} className="hover:text-fg">Your reports</button>
          <button onClick={onAstrologers} className="hover:text-fg">For astrologers</button>
        </nav>
      </div>
      <div className="rule my-8" />
      {/* Razorpay's onboarding review looks for these four, and the Consumer
          Protection (E-Commerce) Rules require the grievance route to be
          published — so they sit in the footer of every page, not one of them. */}
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted mb-6">
        {[["/terms", "Terms of Service"], ["/privacy", "Privacy Policy"],
          ["/refunds", "Refunds & Cancellation"], ["/contact", "Contact & Grievance"]]
          .map(([to, label]) => (
            <button key={to} onClick={() => onGo(to)} className="hover:text-fg transition">{label}</button>
          ))}
      </nav>
      <p className="text-[12px] text-faint leading-relaxed max-w-3xl">
        Reports are prepared for guidance and reflection. They are not a substitute for
        medical, legal, financial or psychiatric advice. Prices include GST. Not satisfied?
        We refund in full, no questions asked.
      </p>
      <p className="text-[12px] text-faint mt-4">© {new Date().getFullYear()} Pothi</p>
    </footer>
  );
}
