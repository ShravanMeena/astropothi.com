import { LEGAL } from "../lib/legal";
import Link from "../components/Link";
import { SUPPORT, waLink, mailLink, prettyPhone } from "../lib/support";
import Logo from "../components/Logo";
export default function Footer({ onAstrologers }: {
  onAstrologers: () => void;
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
            <a href={mailLink("astropothi — a question")} className="text-brass hover:underline">
              {SUPPORT.email}
            </a>
          </p>
          <p className="text-[12px] text-faint mt-1">{SUPPORT.hours}</p>
        </div>
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-[13.5px] text-muted">
          <Link to="/reports" className="hover:text-fg">Reports</Link>
          <Link to="/methodology" className="hover:text-fg">How it is computed</Link>
          <Link to="/learn" className="hover:text-fg">Doshas explained</Link>
          <Link to="/hi/learn" className="hover:text-fg" hrefLang="hi">दोष — हिन्दी में</Link>
          <Link to="/faq" className="hover:text-fg">Questions</Link>
          <Link to="/about" className="hover:text-fg">About</Link>
          <Link to="/profile" className="hover:text-fg">Your reports</Link>
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
            <Link key={to} to={to} className="hover:text-fg transition">{label}</Link>
          ))}
      </nav>
      <p className="text-[12px] text-faint leading-relaxed max-w-3xl">
        Reports are prepared for guidance and reflection. They are not a substitute for
        medical, legal, financial or psychiatric advice. Prices include GST. Not satisfied?
        We refund in full, no questions asked.
      </p>
      {/* The brand and the entity behind it. "Pothi" here was left over from the
          rename and appeared on every indexed page, contradicting both. */}
      <p className="text-[12px] text-faint mt-4">
        © {new Date().getFullYear()} {LEGAL.brand} · operated by {LEGAL.entity}
      </p>
    </footer>
  );
}
