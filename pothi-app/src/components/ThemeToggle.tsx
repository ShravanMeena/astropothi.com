import type { ReactNode } from "react";
import type { Theme } from "../lib/theme";

const OPTS: { id: Theme; label: string; icon: ReactNode }[] = [
  { id: "light", label: "Light", icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> },
  { id: "system", label: "System", icon: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8" /></> },
  { id: "dark", label: "Dark", icon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /> }
];

export default function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line p-0.5 bg-raised" role="group" aria-label="Colour theme">
      {OPTS.map((o) => (
        <button key={o.id} onClick={() => setTheme(o.id)} title={o.label} aria-label={o.label}
          aria-pressed={theme === o.id}
          className={`w-8 h-8 rounded-full grid place-items-center transition
            ${theme === o.id ? "bg-fg text-surface" : "text-faint hover:text-fg"}`}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{o.icon}</svg>
        </button>
      ))}
    </div>
  );
}
