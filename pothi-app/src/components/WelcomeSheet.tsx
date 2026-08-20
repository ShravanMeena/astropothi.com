import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { setUserToken, getUserToken } from "../lib/account";
import { track, identify } from "../lib/track";
import { attribution } from "../lib/attribution";
import { useLang, type Lang } from "../lib/lang";

const SEEN = "pothi.welcome.seen";

/** The code shown on the sheet. It is a real, active coupon — see the note below. */
export const WELCOME_COUPON = "POTHI99";

const T = {
  en: {
    eyebrow: "Welcome",
    title: "₹200 off your first report",
    body: "Enter this code at checkout. Leave your number and your report reaches you the moment it is ready.",
    copy: "Copy",
    copied: "Copied",
    phone: "Mobile number",
    phoneHint: "So your report can find you later",
    langLabel: "Read reports in",
    submit: "Save my code",
    skip: "Just browsing",
    done: "Saved. The code is yours whenever you are ready.",
    bad: "A 10-digit mobile number, please."
  },
  hi: {
    eyebrow: "स्वागत है",
    title: "पहली रिपोर्ट पर ₹200 की छूट",
    body: "चेकआउट पर यह कोड डालिए। नंबर दे दीजिए, ताकि तैयार होते ही रिपोर्ट सीधे आप तक पहुँच जाए।",
    copy: "कॉपी",
    copied: "कॉपी हो गया",
    phone: "मोबाइल नंबर",
    phoneHint: "ताकि रिपोर्ट बाद में आप तक पहुँच सके",
    langLabel: "रिपोर्ट किस भाषा में पढ़ेंगे",
    submit: "मेरा कोड सेव करें",
    skip: "अभी सिर्फ़ देख रहा हूँ",
    done: "सेव हो गया। कोड आपका है, जब चाहें इस्तेमाल कीजिए।",
    bad: "कृपया 10 अंकों का मोबाइल नंबर डालिए।"
  }
};

/**
 * The first thing a visitor sees, and the only thing we ask them for.
 *
 * Three rules it follows, and the reason for each:
 *
 *   1. **It is not a gate.** Clicking the backdrop, pressing Escape or taking
 *      the "just browsing" door all close it, and none of them ask twice this
 *      visit. A modal that has to be defeated before the product can be seen
 *      costs more visitors than a coupon wins.
 *   2. **It asks for a number and a language, and nothing else.** Not a name,
 *      not an email, not a birth date — every extra field on a first-touch form
 *      is a reason to close it, and the checkout asks for what it needs anyway.
 *   3. **The coupon is real.** POTHI99 is an active flat ₹200 code in the
 *      database. Printing a code the checkout would reject is worse than
 *      printing no code at all, so if it is ever retired this component must be
 *      retired with it.
 *
 * Every outcome is tracked — shown, dismissed, submitted, and how it was
 * dismissed — because the interesting number here is not how many people give a
 * number, it is how many close it instantly and whether they stay afterwards.
 */
export default function WelcomeSheet() {
  const [lang, setLang] = useLang();
  /**
   * Open on the first paint, computed rather than switched on by an effect.
   *
   * It used to start closed and be opened from a mount effect, which meant two
   * things went wrong at once: the sheet appeared a frame late, and if anything
   * remounted this component the state was lost while the "seen" flag was
   * already set — so it opened, vanished, and never came back. Deriving it here
   * makes a remount recompute the same answer instead of forgetting it.
   */
  const [open, setOpen] = useState(() => {
    try {
      return !getUserToken() && !sessionStorage.getItem(SEEN);
    } catch {
      return !getUserToken();                       // private mode: this visit only
    }
  });
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = T[lang];

  // Report it once, without touching the flag. The flag now records that the
  // visitor ANSWERED — took the code or closed it — not that we rendered it,
  // so a remount reopens the sheet rather than silently burying it.
  useEffect(() => {
    if (!open) return;
    track("welcome_shown", { coupon: WELCOME_COUPON, language: lang });
    // Fires on mount only: changing language inside the sheet is not a new show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Answered. Whether they took the code or waved it away, do not ask again. */
  const close = (how: string) => {
    if (open) track("welcome_dismissed", { how, gave_number: done });
    try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close("escape"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(WELCOME_COUPON); } catch { /* no clipboard */ }
    setCopied(true);
    track("welcome_coupon_copied", { coupon: WELCOME_COUPON });
    setTimeout(() => setCopied(false), 1800);
  };

  const choose = (next: Lang) => {
    setLang(next, "welcome_sheet");
    // The sheet itself re-renders in the chosen language, so the choice shows
    // its own consequence before the visitor has to trust it.
  };

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { setErr(t.bad); return; }
    setBusy(true); setErr("");
    try {
      // The same no-OTP path the checkout uses. Typing a number signs you in
      // and is not proof you own it; nothing is charged from here.
      const r = await api.post("/noauth-api/v1/user/soft-signin",
        { phone: digits, attribution: attribution() });
      setUserToken(r.token);
      identify();
      track("welcome_submitted", { coupon: WELCOME_COUPON, language: lang });
      try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ }
      setDone(true);
      setTimeout(() => setOpen(false), 1600);
    } catch (e: any) {
      setErr(e.message || "Could not save that. Try again.");
    } finally { setBusy(false); }
  };

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

            {/* The grab handle is the affordance that says this can be pushed
                away. Kept on desktop too, because the sheet rises from the
                bottom there as well and the handle is what makes it read as a
                sheet rather than a dialog that landed in the wrong place. */}
            <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

            <button onClick={() => close("close_button")} aria-label="Close"
              className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center
                         text-faint hover:text-fg hover:bg-sunken">✕</button>

            {done ? (
              <p className="py-8 text-center text-[15px] text-fg">{t.done}</p>
            ) : (
              <>
                <p className="caps text-brass">{t.eyebrow}</p>
                <h2 className="display text-[24px] mt-1.5 leading-tight">{t.title}</h2>
                <p className="text-[13.5px] text-muted mt-2 leading-relaxed">{t.body}</p>

                <button onClick={copy}
                  className="mt-4 w-full flex items-center justify-between gap-3 rounded-[5px]
                             border border-dashed border-brass/60 bg-brass/[.06] px-4 h-[52px]
                             hover:bg-brass/[.1] transition">
                  <span className="font-mono text-[19px] tracking-[.12em] text-brass font-semibold">
                    {WELCOME_COUPON}
                  </span>
                  <span className="text-[12px] text-muted">{copied ? t.copied : t.copy}</span>
                </button>

                <label className="label mt-5 block">{t.langLabel}</label>
                <div className="mt-1.5 inline-flex rounded-[5px] border border-line p-0.5 w-full">
                  {(["en", "hi"] as Lang[]).map((l) => (
                    <button key={l} onClick={() => choose(l)}
                      className={`flex-1 h-9 rounded-[3px] text-[13px] font-medium transition
                                  ${lang === l ? "bg-fg text-surface" : "text-muted hover:text-fg"}`}>
                      {l === "en" ? "English" : "हिन्दी"}
                    </button>
                  ))}
                </div>

                <label className="label mt-5 block" htmlFor="welcome-phone">{t.phone}</label>
                <div className="field flex items-center gap-2 p-0 px-4 mt-1.5
                                focus-within:border-brass focus-within:ring-4 focus-within:ring-brass/10">
                  <span className="text-muted text-[15px] tabular-nums shrink-0">+91</span>
                  <span className="h-5 w-px bg-line shrink-0" />
                  <input id="welcome-phone" ref={inputRef} inputMode="numeric" maxLength={10}
                         className="flex-1 min-w-0 h-full bg-transparent outline-none text-[15px] tabular-nums
                                    placeholder:text-faint"
                         value={phone} placeholder="98765 43210"
                         onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErr(""); }}
                         onKeyDown={(e) => { if (e.key === "Enter" && phone.length === 10) submit(); }} />
                </div>
                <p className="mt-1.5 text-[11.5px] text-faint">{t.phoneHint}</p>
                {err && <p className="mt-2 text-[13px] text-ember">{err}</p>}

                <button onClick={submit} disabled={busy || phone.length !== 10}
                        className="btn-brass w-full mt-4 h-[48px]">
                  {busy ? "…" : t.submit}
                </button>
                <button onClick={() => close("skip_link")}
                        className="w-full mt-2.5 h-9 text-[13px] text-muted hover:text-fg">
                  {t.skip}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
