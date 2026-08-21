import { useEffect, useState } from "react";
import { track } from "./track";

/**
 * Which language the visitor reads in.
 *
 * Deliberately NOT the whole site. Only the report detail page — the page ads
 * land on, and the only page where the decision to spend ₹499 is actually made —
 * answers to this. Translating the marketing pages as well would be a much
 * larger job for a much smaller return, and a half-translated site reads worse
 * than an English one.
 *
 * What it does change on that page is everything the buyer judges the product
 * by: the pitch, the chapter list, and the sample pages, which the server
 * re-renders from the real engine in the chosen language. A Hindi chapter list
 * beside English sample images would be worse than either.
 *
 * English is the default because the checkout, the receipts and the support
 * replies are English, and a visitor who never touches this control should not
 * be handed a Hindi page and an English invoice.
 */
export type Lang = "en" | "hi";

const KEY = "pothi.lang";

export const isLang = (v: unknown): v is Lang => v === "en" || v === "hi";

/**
 * The stored choice, or Hindi by default.
 *
 * The paid traffic this site runs on is Hindi (the Meta dosh campaign), and a
 * Hindi visitor landing on an English page is the message-mismatch that loses
 * the click. So an untouched visitor starts in Hindi; the toggle still lets
 * anyone switch to English, and that choice is remembered.
 */
export function storedLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return isLang(v) ? v : "hi";
  } catch {
    return "hi";                                  // private mode
  }
}

/**
 * Changing the language is a page-level event, so every listener has to hear
 * about it — the header control, the page body and the sample strip are three
 * separate trees. A storage event only fires in OTHER tabs, so this one is
 * dispatched by hand for the tab that made the change.
 */
const EVENT = "pothi:lang";

export function setStoredLang(next: Lang, where: string) {
  try { localStorage.setItem(KEY, next); } catch { /* private mode: this visit only */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  track("language_selected", { language: next, where });
}

export function useLang(): [Lang, (next: Lang, where: string) => void] {
  const [lang, setLang] = useState<Lang>(storedLang);

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (isLang(next)) setLang(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && isLang(e.newValue)) setLang(e.newValue);
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return [lang, setStoredLang];
}
