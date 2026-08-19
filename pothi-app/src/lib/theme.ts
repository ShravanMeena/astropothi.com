import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "pothi.theme";

const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolve = (t: Theme) => (t === "system" ? (systemDark() ? "dark" : "light") : t);

function paint(t: Theme) {
  const dark = resolve(t) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#100E0C" : "#FCFBF8");
}

/** Follows the device by default; an explicit choice is remembered. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(KEY) as Theme) || "system");

  useEffect(() => {
    paint(theme);
    localStorage.setItem(KEY, theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => paint("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, setTheme, isDark: resolve(theme) === "dark" };
}

// Paint before React mounts so there is no flash of the wrong theme.
export function primeTheme() {
  const t = (localStorage.getItem(KEY) as Theme) || "system";
  paint(t);
}
