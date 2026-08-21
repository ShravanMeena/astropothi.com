import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { setUserToken, getUserToken } from "../lib/account";
import { track, identify } from "../lib/track";
import { attribution } from "../lib/attribution";
import { useLang } from "../lib/lang";
import { isWelcomeHeld } from "../lib/qualify";

// Shown once per session; dismissing with X quiets it for 24h.
const SEEN = "pothi.welcome.seen";              // sessionStorage — this visit
const DISMISSED = "pothi.welcome.dismissed";    // localStorage — timestamp of an X close
const DISMISS_HOURS = 24;
const SCROLL_TRIGGER = 0.45;                    // show at ~45% of the page

/**
 * Lead-capture bottom sheet — a mobile number, nothing else.
 *
 * Deliberately independent of the buy CTA and the payment flow: it exists only
 * to collect a number so a report update can reach the visitor on WhatsApp
 * later. It never gates the page, never redirects, and its wording never
 * implies a report has been bought or is being prepared.
 *
 * Trigger is scroll depth (~45%), not an engagement heuristic, so it appears
 * once the visitor has genuinely read into the page. Once per session; an X
 * close silences it for 24 hours via localStorage.
 */
const T = {
  en: {
    eyebrow: "Save your report for later",
    title: "Get your report updates on WhatsApp",
    body: "Save your mobile number to make it easier to receive report updates and important information on WhatsApp.",
    phone: "Mobile number",
    submit: "Get WhatsApp Updates →",
    trust: "🔒 Your number is secure. No spam.",
    bad: "Enter a valid 10-digit Indian mobile number.",
    doneTitle: "✓ Number saved!",
    doneBody: "You can continue checking your report.",
    doneClose: "Continue",
  },
  hi: {
    eyebrow: "रिपोर्ट बाद में भी पाएं",
    title: "अपनी रिपोर्ट का अपडेट WhatsApp पर पाएं",
    body: "अपना मोबाइल नंबर सेव करें। आपकी रिपोर्ट और जरूरी अपडेट WhatsApp पर पाने में आसानी होगी।",
    phone: "मोबाइल नंबर",
    submit: "WhatsApp पर अपडेट पाएं →",
    trust: "🔒 आपका नंबर सुरक्षित है। कोई spam नहीं।",
    bad: "कृपया 10 अंकों का सही भारतीय मोबाइल नंबर डालिए।",
    doneTitle: "✓ नंबर सेव हो गया!",
    doneBody: "अब आप अपनी रिपोर्ट चेक करना जारी रख सकते हैं।",
    doneClose: "जारी रखें",
  },
};

/** Indian mobile: 10 digits, starts 6–9. */
const isValidIndianMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits);

const dismissedRecently = () => {
  try {
    const ts = Number(localStorage.getItem(DISMISSED) || 0);
    return ts > 0 && Date.now() - ts < DISMISS_HOURS * 3600_000;
  } catch { return false; }
};

export default function WelcomeSheet() {
  const [lang] = useLang();
  const t = T[lang === "hi" ? "hi" : "en"];

  // Eligible = no account, not seen this session, not dismissed in the last 24h.
  const eligible = useRef<boolean>((() => {
    try {
      return !getUserToken() && !sessionStorage.getItem(SEEN) && !dismissedRecently();
    } catch {
      return !getUserToken();                       // private mode: this visit only
    }
  })());

  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Trigger: ~45% scroll depth ─────────────────────────────────────────────
  useEffect(() => {
    if (!eligible.current) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      if (!eligible.current) return;
      if (getUserToken()) { eligible.current = false; return; }   // signed in meanwhile
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (pct < SCROLL_TRIGGER) return;
      // Do not land on top of another modal, or on a field being typed into.
      const el = document.activeElement;
      const typing = !!el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
      if (isWelcomeHeld() || typing) return;
      eligible.current = false;                       // once per session
      setOpen(true);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();                                          // in case the page loads pre-scrolled
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Report the show once.
  useEffect(() => {
    if (open) track("welcome_shown", { trigger: "scroll_45", language: lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** X close: quiet for 24h. Other closes: just this session. */
  const close = (how: string) => {
    if (open) track("welcome_dismissed", { how, gave_number: done });
    try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ }
    if (how === "close_button") {
      try { localStorage.setItem(DISMISSED, String(Date.now())); } catch { /* private mode */ }
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close("escape"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (!isValidIndianMobile(digits)) { setErr(t.bad); return; }
    setBusy(true); setErr("");
    try {
      // Same no-OTP lead path the checkout uses; nothing is charged from here.
      const r = await api.post("/noauth-api/v1/user/soft-signin",
        { phone: digits, attribution: attribution() });
      setUserToken(r.token);
      identify();
      track("welcome_submitted", { source: "lead_sheet", language: lang });
      try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ }
      setDone(true);                                  // success state, in-sheet; no redirect
    } catch (e: any) {
      setErr(e.message || t.bad);
    } finally { setBusy(false); }
  };

  const digits = phone.replace(/\D/g, "");
  const tenDigits = digits.length === 10;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: .18 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
               onClick={() => close("backdrop")} aria-hidden />

          <motion.div role="dialog" aria-modal="true" aria-label={t.title}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="relative w-full sm:max-w-[420px] sm:mb-10 bg-raised border-t sm:border border-line
                       sm:rounded-[8px] rounded-t-[14px] shadow-lift px-6 pb-7 pt-3 sm:pt-7">

            <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

            <button onClick={() => close("close_button")} aria-label="Close"
              className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center
                         text-faint hover:text-fg hover:bg-sunken">✕</button>

            {done ? (
              <div className="py-7 text-center">
                <p className="display text-[22px] text-brass leading-tight">{t.doneTitle}</p>
                <p className="text-[14px] text-muted mt-2 leading-relaxed">{t.doneBody}</p>
                <button onClick={() => close("done_continue")} className="btn-brass w-full mt-6 h-[46px]">
                  {t.doneClose}
                </button>
              </div>
            ) : (
              <>
                <p className={`caps text-brass ${lang === "hi" ? "deva" : ""}`}>{t.eyebrow}</p>
                <h2 className={`display text-[22px] sm:text-[24px] mt-1.5 leading-tight ${lang === "hi" ? "deva" : ""}`}>{t.title}</h2>
                <p className={`text-[13.5px] text-muted mt-2 leading-relaxed ${lang === "hi" ? "deva" : ""}`}>{t.body}</p>

                <label className={`label mt-5 block ${lang === "hi" ? "deva" : ""}`} htmlFor="welcome-phone">{t.phone}</label>
                <div className={`field flex items-center gap-2 p-0 px-4 mt-1.5
                                focus-within:ring-4 focus-within:ring-brass/10
                                ${err ? "border-ember focus-within:border-ember" : "focus-within:border-brass"}`}>
                  <span className="text-muted text-[15px] tabular-nums shrink-0">+91</span>
                  <span className="h-5 w-px bg-line shrink-0" />
                  <input id="welcome-phone" ref={inputRef} inputMode="numeric" maxLength={10}
                         autoComplete="tel-national"
                         className="flex-1 min-w-0 h-full bg-transparent outline-none text-[15px] tabular-nums placeholder:text-faint"
                         value={phone} placeholder="98765 43210"
                         onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErr(""); }}
                         onKeyDown={(e) => { if (e.key === "Enter" && tenDigits) submit(); }} />
                </div>
                {err && <p className={`mt-2 text-[13px] text-ember ${lang === "hi" ? "deva" : ""}`}>{err}</p>}

                <button onClick={submit} disabled={busy || !tenDigits}
                        className={`btn-brass w-full mt-4 h-[48px] ${lang === "hi" ? "deva" : ""}`}>
                  {busy ? "…" : t.submit}
                </button>
                <p className={`mt-3 text-center text-[11.5px] text-faint ${lang === "hi" ? "deva" : ""}`}>{t.trust}</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
