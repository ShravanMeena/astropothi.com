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

/**
 * Light by default; an explicit choice is remembered.
 *
 * It followed the device, which meant a visitor whose phone was in dark mode
 * met a dark storefront — and the covers, the palettes and the gold leaf are
 * all designed against paper. The device preference is still one click away in
 * the footer toggle, and "system" still works once chosen.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(KEY) as Theme) || "light");

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
  const t = (localStorage.getItem(KEY) as Theme) || "light";
  paint(t);
}
