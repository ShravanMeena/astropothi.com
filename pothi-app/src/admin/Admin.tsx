import { useEffect, useState, type ReactNode } from "react";
import { adminApi, clearAdminToken } from "./api";
import type { Environment, Me, Window } from "./types";
import { useTheme } from "../lib/theme";
import ThemeToggle from "../components/ThemeToggle";
import Overview from "./screens/Overview";
import Orders from "./screens/Orders";
import Users from "./screens/Users";
import Reports from "./screens/Reports";
import Pandits from "./screens/Pandits";
import Ops from "./screens/Ops";
import Behaviour from "./screens/Behaviour";
import Pricing from "./screens/Pricing";

type Tab = "overview" | "orders" | "users" | "reports" | "behaviour" | "pricing" | "pandits" | "ops";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <path d="M3 13h6V3H3zM13 21h8V11h-8zM13 7h8V3h-8zM3 21h6v-4H3z" /> },
  { id: "orders",   label: "Orders",   icon: <path d="M3 7h18v13H3zM3 7l2-3h14l2 3M9 12h6" /> },
  { id: "users",    label: "Buyers",   icon: <path d="M4 20a8 8 0 0 1 16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /> },
  { id: "reports",  label: "Reports",  icon: <path d="M5 3h11l4 4v14H5zM16 3v4h4M9 12h6M9 16h6" /> },
  { id: "behaviour", label: "Behaviour", icon: <path d="M3 3v18h18M7 15l4-5 3 3 5-7" /> },
  { id: "pricing",  label: "Pricing",  icon: <path d="M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.8 5 3.3 5 1.4 5 3.4-2.2 3.3-5 3.3-5-1.4-5-3.3" /> },
  { id: "pandits",  label: "Astrologers", icon: <path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z" /> },
  { id: "ops",      label: "Operations", icon: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /> }
];

/**
 * The staff panel.
 *
 * Reached only by signing in at /astrologers with an account whose is_admin is
 * set — there is no link to it, no route to type, and no button anywhere in the
 * product. The console and this panel are the same door with different keys.
 */
export default function Admin({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  // Today by default, on every tab. The panel is read to answer "what happened
  // today", and a 30-day default quietly answered a different question.
  const [window_, setWindow] = useState<Window>("today");
  const [me, setMe] = useState<Me | null>(null);
  const [env, setEnv] = useState<Environment | null>(null);
  const [fatal, setFatal] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    adminApi.get("/me")
      .then((m: Me) => { setMe(m); setEnv(m.environment); })
      .catch((e) => {
        // 401/403 here means the row lost is_admin, or the token expired. Either
        // way the panel is no longer ours — drop the key rather than showing a
        // shell full of failed requests.
        if (e.status === 401 || e.status === 403) { clearAdminToken(); onSignOut(); }
        else setFatal(e.message);
      });
  }, [onSignOut]);

  const signOut = () => { clearAdminToken(); onSignOut(); };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-surface">
      {/* Sidebar — denser and quieter than the storefront, same tokens. */}
      <aside className="hidden lg:flex lg:w-[212px] shrink-0 flex-col border-r border-line bg-raised/50
                        lg:sticky lg:top-0 lg:h-dvh">
        <div className="shrink-0 px-5 py-5 border-b border-line">
          <div className="flex items-baseline gap-2">
            <span className="display text-[20px] text-fg">Pothi</span>
            <span className="caps text-brass">Admin</span>
          </div>
          <p className="mt-1 text-[11px] text-faint">Internal · staff only</p>
        </div>

        <nav className="p-2 flex-1 overflow-y-auto min-h-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative w-full flex items-center gap-2.5 pl-3.5 pr-3 h-9 rounded-md mb-0.5
                          text-[13px] transition text-left
                          ${tab === t.id ? "bg-sunken text-brass font-semibold"
                                         : "text-muted hover:bg-sunken/60 hover:text-fg"}`}>
              {tab === t.id && <span aria-hidden className="absolute left-0 inset-y-1.5 w-[2px] rounded-full bg-brass" />}
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                   strokeWidth={tab === t.id ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {t.icon}
              </svg>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-line space-y-2.5">
          {env && env.env !== "production" && (
            <div className="rounded-md border border-line bg-sunken px-2.5 py-1.5 text-[10.5px] text-muted">
              <span className="caps text-brass">{env.env}</span>
              {env.otp_bypass_enabled && <div className="mt-0.5 text-ember">OTP bypass on</div>}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-faint font-mono truncate">{me?.phone || ""}</span>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
          <button onClick={signOut} className="btn btn-quiet btn-sm w-full">Sign out</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="display text-[18px]">Pothi</span>
            <span className="caps text-brass">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={signOut} className="btn btn-quiet btn-sm">Sign out</button>
          </div>
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`chip whitespace-nowrap ${tab === t.id ? "bg-fg text-surface" : "bg-sunken text-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 min-w-0 w-full max-w-[1600px] p-4 sm:p-5 lg:p-6">
        {fatal && (
          <div className="card p-5 text-[13px] text-ember">
            {fatal}
          </div>
        )}
        {!fatal && (
          <>
            {tab === "overview" && <Overview window={window_} setWindow={setWindow} />}
            {tab === "orders"   && <Orders window={window_} setWindow={setWindow} />}
            {tab === "users"    && <Users window={window_} setWindow={setWindow} />}
            {tab === "reports"  && <Reports window={window_} setWindow={setWindow} />}
            {tab === "behaviour" && <Behaviour window={window_} setWindow={setWindow} />}
            {tab === "pricing"  && <Pricing />}
            {tab === "pandits"  && <Pandits />}
            {tab === "ops"      && <Ops environment={env} />}
          </>
        )}
      </main>
    </div>
  );
}
