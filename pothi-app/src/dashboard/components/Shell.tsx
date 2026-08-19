import type { ReactNode } from "react";
import { useI18n, type UiLang } from "../i18n";
import ThemeToggle from "../../components/ThemeToggle";
import { useTheme } from "../../lib/theme";

export type Tab = "home" | "create" | "library" | "brand" | "billing";

const ICONS: Record<Tab, ReactNode> = {
  home:    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  create:  <path d="M12 5v14M5 12h14" />,
  library: <path d="M4 5h6v14H4zM14 5h6v14h-6z" />,
  brand:   <path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z" />,
  billing: <path d="M3 7h18v10H3zM3 11h18" />
};

function Icon({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
         stroke="currentColor" strokeWidth={active ? 2.1 : 1.7}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[tab]}
    </svg>
  );
}

export default function Shell({ tab, setTab, balance, pilot, onSignOut, children }: {
  tab: Tab; setTab: (t: Tab) => void; balance: number;
  pilot?: { on: boolean; free_reports: number } | null;
  onSignOut: () => void; children: ReactNode;
}) {
  const { t, lang, setLang } = useI18n();
  // The console follows the same device-preference theme as the storefront, and
  // gets the same override — a pandit works in this all day.
  const { theme, setTheme } = useTheme();
  // Nothing is for sale during the pilot, so the Credits tab would be a dead end.
  const tabs: Tab[] = pilot?.on
    ? ["home", "create", "library", "brand"]
    : ["home", "create", "library", "brand", "billing"];
  const label = (x: Tab) => t.nav[x === "create" ? "create" : x];

  const LangToggle = () => (
    <div className="inline-flex rounded-lg border border-line bg-raised p-0.5">
      {(["en", "hi"] as UiLang[]).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`min-w-[2.5rem] px-2 h-8 rounded-[7px] text-[12px] font-semibold transition
            leading-none flex items-center justify-center
            ${lang === l ? "bg-fg text-surface" : "text-muted hover:text-fg"}`}>
          <span className={l === "hi" ? "deva text-[13px]" : ""}>{l === "en" ? "EN" : "हिं"}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[248px] xl:w-[268px] shrink-0 flex-col border-r border-line/70 bg-raised/60 backdrop-blur">
        <div className="px-6 py-6">
          <div className="flex items-baseline gap-2">
            <span className="display text-[26px] text-fg">Pothi</span>
            <span className="deva text-[15px] text-brass">पोथी</span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-faint">{t.tagline}</p>
        </div>

        <nav className="px-3 flex-1">
          {tabs.map((x) => (
            <button key={x} onClick={() => setTab(x)}
              className={`relative w-full flex items-center gap-3 pl-4 pr-3 h-11 rounded-[3px] mb-1
                text-[14.5px] transition
                ${tab === x ? "bg-sunken text-brass font-semibold"
                            : "text-muted hover:bg-sunken/60 hover:text-fg"}`}>
              {tab === x && <span aria-hidden className="absolute left-0 inset-y-1.5 w-[2px] rounded-full bg-brass" />}
              <Icon tab={x} active={tab === x} />
              <span className={lang === "hi" ? "deva" : ""}>{label(x)}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-3">
          <div className="w-full card-quiet p-3.5">
            <div className="text-[26px] leading-none font-serif font-semibold text-fg">{balance}</div>
            <div className="mt-1 text-[12px] text-muted">
              {pilot?.on ? t.pilot.left : t.dash.credits}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <LangToggle />
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
          <button className="btn-quiet btn-sm w-full" onClick={onSignOut}>{t.common.signOut}</button>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-sunken/85 backdrop-blur border-b border-line/70">
        <div className="shell h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="display text-[21px]">Pothi</span>
            <span className="deva text-[13px] text-brass">पोथी</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="chip bg-fg text-surface">{balance}
              <span className="opacity-70 font-normal">{pilot?.on ? t.pilot.left : t.common.credits}</span></span>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <LangToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0 pb-28 lg:pb-10">
        <div className="shell py-5 sm:py-7 lg:py-9">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-raised/95 backdrop-blur border-t border-line"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length},minmax(0,1fr))` }}>
          {tabs.map((x) => (
            <button key={x} onClick={() => setTab(x)}
              className={`py-2.5 flex flex-col items-center gap-1 transition
                ${tab === x ? "text-fg" : "text-faint"}`}>
              <Icon tab={x} active={tab === x} />
              <span className={`text-[10.5px] font-medium ${lang === "hi" ? "deva" : ""}`}>{label(x)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
