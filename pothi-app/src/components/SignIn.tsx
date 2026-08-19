import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { setUserToken } from "../lib/account";
import { track, identify } from "../lib/track";

/**
 * Sign in with a mobile number. There is no sign-up: the number is the account,
 * created the first time it is used, so a buyer never fills a form to get one.
 */
export default function SignIn({ open, onClose, onDone, reason }: {
  open: boolean; onClose: () => void; onDone?: () => void; reason?: string;
}) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const send = async () => {
    setBusy(true); setErr("");
    try {
      track("signin_otp_sent", {});
      const r = await api.post("/noauth-api/v1/user/otp/send", { phone });
      // The server hands the code back while OTP_REQUIRED is false, because
      // nothing delivers it yet. Sign in with it there and then — showing a
      // buyer a field we have already filled asks them to confirm a formality.
      if (r.dev_otp) { setOtp(r.dev_otp); await verify(r.dev_otp); return; }
      setSent(true);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  // `code` covers the send-then-verify path: setOtp has not landed in state yet.
  const verify = async (code?: string) => {
    setBusy(true); setErr("");
    try {
      const r = await api.post("/noauth-api/v1/user/otp/verify", { phone, otp: code ?? otp });
      setUserToken(r.token);
      // Everything this device did before anyone knew who they were now belongs
      // to this account — that pre-login half is the interesting half.
      track("signed_in", {});
      identify();
      onDone?.();
      onClose();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center p-0 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .18 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-modal aria-label="Sign in"
            initial={{ y: 24, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: .98 }}
            transition={{ duration: .22, ease: [0.22, 0.7, 0.2, 1] }}
            className="relative w-full sm:max-w-[400px] bg-raised border border-line ring-1 ring-brass/20
                       rounded-t-[6px] sm:rounded-[4px] shadow-lift p-7 sm:p-8">
            <button onClick={onClose} aria-label="Close"
              className="absolute top-4 right-4 h-8 w-8 rounded-full grid place-items-center
                         text-faint hover:text-fg hover:bg-sunken">✕</button>

            <p className="caps text-brass">Your account</p>
            <h2 className="display text-[21px] mt-2">Sign in with your mobile</h2>
            <p className="text-[13.5px] text-muted mt-2 leading-relaxed">
              {reason || "Your reports stay here, ready to open whenever you come back."}
            </p>

            <label className="label mt-6">Mobile number</label>
            <div className="field flex items-center gap-2 p-0 px-4
                            focus-within:border-brass focus-within:ring-4 focus-within:ring-brass/10">
              <span className="text-muted text-[15px] tabular-nums shrink-0">+91</span>
              <span className="h-5 w-px bg-line shrink-0" />
              <input className="flex-1 min-w-0 h-full bg-transparent outline-none text-[16px] sm:text-[15px] tabular-nums
                                placeholder:text-faint"
                     inputMode="numeric" maxLength={10} placeholder="98765 43210" autoFocus
                     aria-label="Mobile number" value={phone} disabled={sent}
                     onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                     onKeyDown={(e) => { if (e.key === "Enter" && phone.length === 10 && !sent) send(); }} />
            </div>

            {sent && (
              <div className="mt-4">
                <label className="label">One-time password</label>
                <input className="field text-center text-[20px] tracking-[.5em] font-semibold tabular-nums"
                       inputMode="numeric" maxLength={4} autoFocus value={otp}
                       aria-label="One-time password"
                       onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                       onKeyDown={(e) => { if (e.key === "Enter" && otp.length >= 4) verify(); }} />
                <p className="mt-1.5 text-[12px] text-faint">
                  Sent to +91 {phone}.{" "}
                  <button className="underline hover:text-fg" onClick={() => { setSent(false); setOtp(""); }}>
                    Change number
                  </button>
                </p>
              </div>
            )}

            {err && <p className="mt-3 text-[13.5px] text-ember">{err}</p>}

            <button className="btn-brass w-full mt-6 h-[50px]"
                    disabled={busy || (sent ? otp.length < 4 : phone.length !== 10)}
                    onClick={() => (sent ? verify() : send())}>
              {busy ? "…" : sent ? "Sign in" : "Send OTP"}
            </button>
            <p className="text-[11.5px] text-faint mt-4 leading-relaxed">
              We use your number to keep your reports together and to reach you about an order.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
