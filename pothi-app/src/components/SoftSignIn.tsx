import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { setUserToken, getUserToken } from "../lib/account";
import { track, identify } from "../lib/track";

const DISMISSED = "pothi.softsignin.dismissed";

/**
 * A quiet ask, after someone has stayed a while.
 *
 * Fired on a timer rather than on arrival: a modal in the first seconds is an
 * interruption, whereas after half a minute on one report the visitor has shown
 * they are interested and the ask is reasonable. Name and number only — the
 * birth details still belong on the order form, and asking for them twice is
 * how a funnel loses people.
 *
 * It is a sheet on a phone and a card on a desktop, it never appears twice, and
 * dismissing it is remembered. Signing in here does not commit the visitor to
 * anything; it means their report finds them later.
 */
export default function SoftSignIn({ delayMs = 30000, context }: {
  delayMs?: number; context?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (getUserToken()) return;                       // already known to us
    try { if (sessionStorage.getItem(DISMISSED)) return; } catch { /* private mode */ }
    const t = setTimeout(() => {
      if (getUserToken()) return;
      setOpen(true);
      track("signin_opened", { via: "soft", where: context });
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, context]);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(DISMISSED, "1"); } catch { /* fine */ }
  };

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) return setErr("Your name, so we know what to call you.");
    if (digits.length !== 10) return setErr("A 10-digit mobile number, please.");
    setBusy(true); setErr("");
    try {
      // The same no-OTP path the checkout uses. See config.autoLoginOnOrder and
      // the note about it in the Terms — typing a number signs you in but is
      // not proof you own it, and nothing is charged from here.
      const r = await api.post("/noauth-api/v1/user/soft-signin", { phone: digits, name: name.trim() });
      setUserToken(r.token);
      track("signed_in", { via: "soft", where: context });
      identify();
      setDone(true);
      setTimeout(close, 1600);
    } catch (e: any) {
      setErr(e.message || "That did not go through. Try again in a moment.");
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .2 }} role="dialog" aria-modal aria-label="Save your place">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={close} />

          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ duration: .26, ease: [0.22, 0.7, 0.2, 1] }}
            className="relative w-full sm:max-w-[400px] bg-raised border border-line
                       rounded-t-3xl sm:rounded-2xl shadow-lift p-6 sm:p-7"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
            <button onClick={close} aria-label="Not now"
                    className="absolute top-4 right-4 h-9 w-9 rounded-full grid place-items-center
                               text-faint hover:text-fg hover:bg-sunken transition">✕</button>

            {done ? (
              <div className="py-4 text-center">
                <p className="display text-[20px]">Saved.</p>
                <p className="text-[13.5px] text-muted mt-1.5">
                  Your reports will be waiting on this number.
                </p>
              </div>
            ) : (
              <>
                <p className="caps text-brass">Save your place</p>
                <h2 className="display text-[21px] sm:text-[23px] mt-2 leading-snug pr-8">
                  Should we keep this for you?
                </h2>
                <p className="text-[13.5px] text-muted mt-2 leading-relaxed">
                  Leave your name and number and every report you buy stays in one place —
                  no password, and nothing is charged.
                </p>

                <div className="mt-5 space-y-2.5">
                  <input className="field" placeholder="Your name" value={name} autoComplete="name"
                         onChange={(e) => { setName(e.target.value); setErr(""); }} />
                  <div className="field flex items-center gap-2 p-0 pl-4 pr-4
                                  focus-within:border-brass focus-within:ring-4 focus-within:ring-brass/10">
                    <span className="text-muted text-[15px] shrink-0">+91</span>
                    <span className="h-5 w-px bg-line shrink-0" />
                    <input className="flex-1 min-w-0 h-full bg-transparent outline-none
                                      text-[16px] sm:text-[15px] tabular-nums placeholder:text-faint"
                           inputMode="numeric" maxLength={10} placeholder="98765 43210"
                           autoComplete="tel-national" value={phone}
                           onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErr(""); }}
                           onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
                  </div>
                </div>
                {err && <p className="text-[12.5px] text-ember mt-2">{err}</p>}

                <button className="btn-brass w-full h-[50px] mt-4" disabled={busy} onClick={submit}>
                  {busy ? "…" : "Save my place"}
                </button>
                <button onClick={close}
                        className="w-full mt-2 py-2 text-[13px] text-faint hover:text-muted transition">
                  No thanks, I am just looking
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
