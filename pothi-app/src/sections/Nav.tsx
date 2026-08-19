import ThemeToggle from "../components/ThemeToggle";
import type { Theme } from "../lib/theme";

export default function Nav({ onBuy, onAstrologers, onGo, signedIn, onSignIn, onProfile, theme, setTheme }: {
  onBuy: () => void; onAstrologers: () => void; onGo: (path: string) => void;
  signedIn: boolean; onSignIn: () => void; onProfile: () => void;
  theme: Theme; setTheme: (t: Theme) => void;
}) {
  // Reports and Questions are their own pages now, so they must navigate rather
  // than jump to an anchor that only exists on the home page.
  const link = (path: string, label: string) => (
    <button onClick={() => onGo(path)} className="hover:text-fg transition">{label}</button>
  );
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-line">
      <div className="shell h-16 flex items-center justify-between gap-4">
        <button onClick={() => onGo("/")} className="flex items-baseline gap-2 shrink-0">
          <span className="display text-[21px]">Pothi</span>
          <span className="deva text-[13px] text-brass hidden sm:inline">पोथी</span>
        </button>

        <nav className="hidden md:flex items-center gap-8 text-[14.5px] text-muted">
          {link("/reports", "Reports")}
          {link("/#how", "How it works")}
          {link("/faq", "Questions")}
        </nav>

        <div className="flex items-center gap-3">
          {/* Deliberately quiet. Astrologers arrive through our team, not this link. */}
          <ThemeToggle theme={theme} setTheme={setTheme} />
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
          <button className="btn-dark btn-sm" onClick={onBuy}>
            <span className="hidden xs:inline">Get your report</span>
            <span className="xs:hidden">Get report</span>
          </button>
        </div>
      </div>
    </header>
  );
}
