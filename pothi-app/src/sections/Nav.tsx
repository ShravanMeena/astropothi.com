import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import type { Theme } from "../lib/theme";
import Logo from "../components/Logo";
import Link from "../components/Link";

export default function Nav({ onAstrologers, signedIn, onSignIn, onProfile, theme, setTheme }: {
  onAstrologers: () => void;
  signedIn: boolean; onSignIn: () => void; onProfile: () => void;
  theme: Theme; setTheme: (t: Theme) => void;
}) {
  // Reports and Questions are their own pages now, so they must navigate rather
  // than jump to an anchor that only exists on the home page.
  const [menu, setMenu] = useState(false);
  // A real <a href>, so the header is a crawl path and cmd-click works.
  const link = (path: string, label: string) => (
    <Link to={path} className="hover:text-fg transition">{label}</Link>
  );
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-line">
      <div className="shell h-16 flex items-center justify-between gap-4">
        <Link to="/" aria-label="astropothi home" className="flex items-baseline gap-2 shrink-0">
          <Logo size={20} />
          <span className="deva text-[13px] text-brass hidden lg:inline">पोथी</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[14.5px] text-muted">
          {link("/reports", "Reports")}
          {link("/methodology", "How it works")}
          {link("/learn", "Doshas")}
          {link("/faq", "Questions")}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* On a phone the header had a three-way theme switch, an account
              circle and a CTA fighting for 390px. The theme switch is a setting,
              not a top-level action — it moves to the menu below. */}
          <div className="hidden sm:block"><ThemeToggle theme={theme} setTheme={setTheme} /></div>
          {/* Deliberately quiet. Astrologers arrive through our team, not this link. */}
          <button onClick={onAstrologers}
                  className="hidden md:inline text-[13.5px] text-faint hover:text-fg transition">
            For astrologers
          </button>
          {signedIn ? (
            <button onClick={onProfile} aria-label="Your account"
                    className="h-9 w-9 rounded-full border border-line text-muted grid place-items-center
                               hover:border-brass hover:text-brass transition">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
                   strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="3.4" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
            </button>
          ) : (
            <button onClick={onSignIn}
                    className="hidden sm:inline text-[13.5px] text-muted hover:text-fg transition">
              Sign in
            </button>
          )}
          {/* The menu carries everything that does not fit: the nav links, the
              theme switch, sign in. Nothing is unreachable on a phone. */}
          <button onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}
                  className="md:hidden h-9 w-9 rounded-full border border-line text-muted
                             grid place-items-center hover:border-brass hover:text-brass transition">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
                 strokeWidth="1.9" strokeLinecap="round">
              {menu ? <path d="M6 6l12 12M18 6L6 18" />
                    : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
            </svg>
          </button>
          {/* No CTA in the header.
              Every page that sells already carries one: the hero button, the
              card grid, and the bar pinned to the bottom of a report page. A
              fourth in the chrome competed with all of them and was the least
              contextual of the four — it did not know which report the reader
              was looking at. */}
        </div>
      </div>

      {menu && (
        <div className="md:hidden border-t border-line bg-surface">
          <div className="shell py-3 flex flex-col">
            {[["/reports", "Reports"], ["/methodology", "How it works"], ["/learn", "Doshas"], ["/faq", "Questions"], ["/about", "About"]].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenu(false)}
                    className="py-3 text-left text-[15px] text-fg border-b border-line">
                {label}
              </Link>
            ))}
            {!signedIn && (
              <button onClick={() => { setMenu(false); onSignIn(); }}
                      className="py-3 text-left text-[15px] text-fg border-b border-line">
                Sign in
              </button>
            )}
            <button onClick={() => { setMenu(false); onAstrologers(); }}
                    className="py-3 text-left text-[15px] text-muted">
              For astrologers
            </button>
            <div className="pt-3 pb-1"><ThemeToggle theme={theme} setTheme={setTheme} /></div>
          </div>
        </div>
      )}
    </header>
  );
}
