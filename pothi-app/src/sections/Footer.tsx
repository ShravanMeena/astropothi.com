import { LEGAL } from "../lib/legal";
import { useLang } from "../lib/lang";
import { homeUi } from "../lib/homeStrings";
import Link from "../components/Link";
import { SUPPORT, waLink, mailLink, prettyPhone } from "../lib/support";
import Logo from "../components/Logo";
export default function Footer({ onAstrologers }: {
  onAstrologers: () => void;
}) {
  const [lang] = useLang();
  const h = homeUi(lang);
  return (
    <footer className="shell py-10">
      <div className="flex flex-col sm:flex-row gap-8 sm:items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <Logo size={20} />
            <span className="deva text-[13px] text-brass">पोथी</span>
          </div>
          <p className="text-[13.5px] text-muted mt-2 max-w-md leading-relaxed">
            {h.footerLede}
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
          <p className="text-[12px] text-faint mt-1">{h.supportHours}</p>
        </div>
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-[13.5px] text-muted">
          <Link to="/reports" className="hover:text-fg">{h.footerReports}</Link>
          <Link to="/methodology" className="hover:text-fg">{h.footerHow}</Link>
          <Link to="/learn" className="hover:text-fg">{h.footerDoshas}</Link>
          <Link to="/hi/learn" className="hover:text-fg" hrefLang="hi">दोष — हिन्दी में</Link>
          <Link to="/faq" className="hover:text-fg">{h.footerFaq}</Link>
          <Link to="/about" className="hover:text-fg">{h.footerAbout}</Link>
          <Link to="/profile" className="hover:text-fg">{h.footerYours}</Link>
          <button onClick={onAstrologers} className="hover:text-fg">{h.footerAstrologers}</button>
        </nav>
      </div>
      <div className="rule my-8" />
      {/* Razorpay's onboarding review looks for these four, and the Consumer
          Protection (E-Commerce) Rules require the grievance route to be
          published — so they sit in the footer of every page, not one of them. */}
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted mb-6">
        {[["/terms", h.legalTerms], ["/privacy", h.legalPrivacy],
          ["/refunds", h.legalRefunds], ["/contact", h.legalGrievance]]
          .map(([to, label]) => (
            <Link key={to} to={to} className="hover:text-fg transition">{label}</Link>
          ))}
      </nav>
      <p className="text-[12px] text-faint leading-relaxed max-w-3xl">
        {h.footerDisclaimer}
      </p>
      {/* The brand and the entity behind it. "Pothi" here was left over from the
          rename and appeared on every indexed page, contradicting both. */}
      <p className="text-[12px] text-faint mt-4">
        © {new Date().getFullYear()} {LEGAL.brand} · operated by {LEGAL.entity}
      </p>
    </footer>
  );
}
