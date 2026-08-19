import { useEffect, useState } from "react";
import { api, setToken } from "../api";
import { setAdminToken, clearAdminToken } from "../../admin/api";
import { useI18n, type UiLang } from "../i18n";
import ChartMark from "../../components/ChartMark";
import ThemeToggle from "../../components/ThemeToggle";
import { useTheme } from "../../lib/theme";

export default function Login({ onDone }: { onDone: () => void }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [phone, setPhone] = useState("9660801827");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [invite, setInvite] = useState("");
  const [needsInvite, setNeedsInvite] = useState(false);
  const [pilot, setPilot] = useState<{ on: boolean; seats: number; seats_left: number; free_reports: number } | null>(null);

  useEffect(() => { api.get("/noauth-api/v1/pilot/status").then(setPilot).catch(() => {}); }, []);

  const send = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api.post("/noauth-api/v1/auth/otp/send", { phone });
      setSent(true); if (r.dev_otp) setOtp(r.dev_otp);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api.post("/noauth-api/v1/auth/otp/verify", { phone, otp, invite_code: invite });
      setToken(r.token);
      // Staff accounts get a second, separate token. Same door, different key —
      // there is no admin button anywhere, the row decides what loads next.
      // The else-branch matters: without it, an admin token left in storage by
      // an earlier session would hand the panel to whoever signs in next.
      if (r.admin_token) setAdminToken(r.admin_token);
      else clearAdminToken();
      onDone();
    } catch (e: any) {
      setErr(e.message);
      // The server tells us when a code is required, so we only ask once it is.
      if (e.body?.needs_invite) setNeedsInvite(true);
      if (e.body?.pilot) setPilot(e.body.pilot);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Left: the pitch. Hidden on mobile so the form is immediate. */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden
                      grain lamp border-r border-line p-12 xl:p-16">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2
                                    -translate-x-1/2 -translate-y-1/2 w-[720px] max-w-[130%]
                                    text-brass opacity-[.14] dark:opacity-[.18]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>

        <div className="relative z-10 flex items-baseline gap-2.5">
          <span className="display text-[34px]">Pothi</span>
          <span className="deva text-[19px] text-brass">पोथी</span>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-brass" />
            <span className="caps text-brass">For astrologers</span>
          </div>
          <h1 className="display text-[42px] xl:text-[54px] leading-[1.05] mt-6">
            Your reports.<br />Your name.<br /><span className="foil">Your price.</span>
          </h1>
          <p className="lede mt-6">
            Generate a 50–135 page Vedic report carrying your photo, your shop and your
            phone on every page. Share it on WhatsApp in under a minute.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-5">
            {[["7", "report types"], ["3", "designs"], ["10", "free reports"]].map(([n, l]) => (
              <div key={l} className="border-t border-line pt-4">
                <div className="display foil text-[32px] leading-none">{n}</div>
                <div className="caps text-faint mt-2">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[12.5px] text-faint">
          No Pothi branding on any report you send.
        </div>
      </div>

      {/* Right: the form */}
      <div className="relative flex flex-col justify-center px-5 sm:px-10 py-12 bg-sunken">
        <div className="absolute top-5 right-5"><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="w-full max-w-[400px] mx-auto card p-7 sm:p-9">
          <div className="lg:hidden mb-10 text-center">
            <div className="display text-[34px]">Pothi</div>
            <div className="deva text-[16px] text-brass mt-0.5">पोथी</div>
            <p className="mt-2.5 text-[14px] text-muted">{t.login.sub}</p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className={`display text-[26px] ${lang === "hi" ? "deva" : ""}`}>{t.login.title}</h2>
            <div className="inline-flex rounded-lg border border-line bg-raised p-0.5">
              {(["en", "hi"] as UiLang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`min-w-[2.5rem] px-2 h-8 rounded-[7px] text-[12px] font-semibold transition
                    leading-none flex items-center justify-center
                    ${lang === l ? "bg-fg text-surface" : "text-muted"}`}>
                  <span className={l === "hi" ? "deva text-[13px]" : ""}>{l === "en" ? "EN" : "हिं"}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="label">{t.login.phone}</label>
          <div className="flex gap-2 mb-5">
            <div className="h-12 px-3.5 grid place-items-center rounded-xl border border-line bg-sunken text-muted text-[15px] font-medium tabular-nums shrink-0">+91</div>
            <input className="field" inputMode="numeric" maxLength={10} disabled={sent}
                   value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
          </div>

          {pilot?.on && (
            <div className="mb-5 flex items-center gap-2 flex-wrap">
              <span className="chip bg-fg text-surface">{t.pilot.badge}</span>
              <span className="text-[12.5px] text-muted">
                {t.login.seatsLeft.replace("{n}", String(pilot.seats_left)).replace("{t}", String(pilot.seats))}
              </span>
            </div>
          )}

          {sent && (
            <div className="mt-4 rise">
              <label className="label">{t.login.otp}</label>
              <input className="field text-center text-[20px] tracking-[.5em] font-semibold" inputMode="numeric"
                     maxLength={4} autoFocus value={otp}
                     onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
              <p className="mt-1.5 text-[12px] text-faint">{t.login.devHint}</p>
            </div>
          )}

          {(needsInvite || (pilot?.on && sent)) && (
            <div className="mt-4 rise">
              <label className="label">{t.login.invite}</label>
              <input className="field uppercase tracking-[.2em] font-semibold" value={invite}
                     onChange={(e) => setInvite(e.target.value.toUpperCase().slice(0, 24))}
                     placeholder="——————" autoCapitalize="characters" />
              <p className="mt-1.5 text-[12px] text-faint">{t.login.inviteHint}</p>
            </div>
          )}

          {err && <p className="mt-3 text-[13.5px] text-ember">{err}</p>}

          <button className="btn-brass w-full mt-7 h-[50px]"
                  disabled={busy || (!sent ? phone.length !== 10 : otp.length < 4)}
                  onClick={sent ? verify : send}>
            {busy ? "…" : sent ? t.login.verify : t.login.send}
          </button>
        </div>
      </div>
    </div>
  );
}
