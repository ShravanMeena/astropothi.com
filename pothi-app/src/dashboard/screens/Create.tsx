import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import type { ReportType, Design, Palette } from "../types";
import Preview from "./Preview";
import PdfModal from "../components/PdfModal";
import Generating from "../components/Generating";
import PlaceInput from "../components/PlaceInput";
import { loadDraft, saveDraft, clearDraft, loadStep, saveStep } from "../draft";
import { DateField, TimeField, Select } from "../../components/Picker";

type Step = 1 | 2 | 3;

const BLANK = {
  report_type: "kundli", design: "classic", palette: "saffron", language: "en",
  name: "", gender: "female", dob: "1996-11-04", tob: "18:20",
  pob: "", place_id: "", client_phone: ""
};

export default function Create({ types, designs, palettes, balance, onDone }: {
  types: ReportType[]; designs: Design[]; palettes: Palette[];
  balance: number; onDone: (b: number) => void;
}) {
  const { t, lang } = useI18n();
  const nm = (o: { en: string; hi: string }) => o[lang] || o.en;
  const dv = lang === "hi" ? "deva" : "";

  // Restored from the last session — a long form must survive a refresh.
  const [step, setStepRaw] = useState<Step>(() => Math.min(3, Math.max(1, loadStep())) as Step);
  const [f, setF] = useState(() => loadDraft(BLANK) as typeof BLANK);
  const setStep = (n: Step) => { setStepRaw(n); saveStep(n); };
  useEffect(() => { saveDraft(f); }, [f]);
  const [phase, setPhase] = useState<"idle" | "running" | "settling">("idle");
  const [err, setErr] = useState("");
  const [res, setRes] = useState<any>(null);
  const [showPdf, setShowPdf] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const type = types.find((x) => x.code === f.report_type);
  const typeName = type ? (lang === "hi" ? type.name_hi : type.name_en) : "";
  const affordable = type ? balance >= type.credits : false;

  const go = async () => {
    setPhase("running"); setErr(""); setRes(null);
    try {
      // No coordinates from the client: the server resolves place_id → lat/lon/tz.
      const r = await api.post("/api/v1/reports/generate", f);
      setRes(r); onDone(r.balance); setPhase("settling");
      clearDraft();
    } catch (e: any) {
      setErr(e.status === 402 ? `${t.create.needCredits} — ${e.body?.needed} / ${e.body?.balance}` : e.message);
      setPhase("idle");
    }
  };

  // ── success ───────────────────────────────────────────────────────────────
  if (res && phase === "idle") return (
    <>
      <div className="max-w-lg mx-auto card p-8 text-center rise">
        <div className="mx-auto w-14 h-14 rounded-full bg-brassSoft text-brass grid place-items-center">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h2 className={`display text-[26px] mt-5 ${dv}`}>{t.create.ready}</h2>
        <p className="mt-1.5 text-[14px] text-muted">
          {res.page_count} {t.create.pages} · {res.credits_charged} {t.common.credits}
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-7">
          <button className="btn-brass" onClick={() => setShowPdf(true)}>{t.create.viewPdf}</button>
          <a className="btn-brass" target="_blank" rel="noreferrer"
             href={`https://wa.me/${f.client_phone ? "91" + f.client_phone : ""}?text=${encodeURIComponent(`${f.name}, your report is ready: ${location.origin}${res.pdf_url}`)}`}>
            {t.create.sendWa}
          </a>
        </div>
        <button className="btn-quiet w-full mt-2" onClick={() => { setRes(null); setF(BLANK); setStep(1); }}>
          {t.create.another}
        </button>
      </div>
      {showPdf && (
        <PdfModal url={res.pdf_url} title={`${typeName} — ${f.name}`}
                  subtitle={`${res.design} · ${res.palette} · ${res.page_count} ${t.create.pages}`}
                  onClose={() => setShowPdf(false)} />
      )}
    </>
  );

  const steps = [t.create.step1, t.create.step2, t.create.step3];

  return (
    <>
      {/* extra bottom room so the fixed action bar never covers content */}
      <div className="max-w-6xl mx-auto pb-24 lg:pb-24">
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
          {steps.map((s, i) => {
            const n = (i + 1) as Step;
            return (
              <button key={s} onClick={() => n < step && setStep(n)} disabled={n > step}
                className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <span className={`shrink-0 w-6 h-6 rounded-full grid place-items-center text-[11.5px] font-bold transition
                  ${n < step ? "bg-brass text-fg" : n === step ? "bg-fg text-surface" : "bg-sunken text-muted"}`}>
                  {n < step ? "✓" : n}
                </span>
                <span className={`truncate text-[13px] font-semibold ${dv} ${n === step ? "text-fg" : "text-faint"}`}>{s}</span>
                {i < 2 && <span className="hidden sm:block flex-1 h-px bg-sunken" />}
              </button>
            );
          })}
        </div>

        {step === 1 && (
          <div className="card p-5 sm:p-7 rise">
            <h2 className={`display text-[22px] mb-1 ${dv}`}>{t.create.chooseReport}</h2>
            <div className="divider my-4" />
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {types.map((x) => {
                const on = f.report_type === x.code;
                const can = balance >= x.credits;
                return (
                  <button key={x.code} onClick={() => setF({ ...f, report_type: x.code })}
                    className={`tile ${on ? "tile-on" : "tile-off"}`}>
                    <div className={`font-semibold text-[15.5px] ${lang === "hi" ? "deva" : ""}`}>
                      {lang === "hi" ? x.name_hi : x.name_en}
                    </div>
                    <div className="mt-1 text-[12.5px] text-muted">{x.chapters} {t.create.chapters}</div>
                    <div className={`mt-3 chip ${can ? "bg-sunken text-muted" : "bg-ember/10 text-ember"}`}>
                      {x.credits} {t.create.credits}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card p-5 sm:p-7 max-w-2xl rise">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className={`display text-[22px] ${dv}`}>{t.create.clientDetails}</h2>
              {(f.name || f.pob) && (
                <button className="text-[12px] text-faint hover:text-ember"
                        onClick={() => { clearDraft(); setF(BLANK); }}>{t.create.clearDraft}</button>
              )}
            </div>
            <div className="divider my-4" />
            <div className="grid gap-4">
              <div><label className="label">{t.create.name} *</label>
                <input className="field deva" value={f.name} onChange={set("name")} autoFocus placeholder="—" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">{t.create.dob}</label>
                  <DateField value={f.dob} onChange={(v) => setF({ ...f, dob: v })} /></div>
                <div><label className="label">{t.create.tob}</label>
                  <TimeField value={f.tob} onChange={(v) => setF({ ...f, tob: v })} /></div>
              </div>
              <div><label className="label">{t.create.pob} *</label>
                <PlaceInput value={f.pob} placeId={f.place_id}
                            onChange={(v) => setF({ ...f, ...v })} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">{t.create.gender}</label>
                  <Select value={f.gender} ariaLabel={t.create.gender}
                          onChange={(v) => setF({ ...f, gender: v })}
                          options={[{ value: "female", label: t.create.female },
                                    { value: "male", label: t.create.male },
                                    { value: "other", label: t.create.other }]} /></div>
                <div><label className="label">{t.create.reportLang}</label>
                  <Select value={f.language} ariaLabel={t.create.reportLang}
                          onChange={(v) => setF({ ...f, language: v })}
                          options={[{ value: "en", label: "English" },
                                    { value: "hi", label: "हिन्दी" }]} /></div>
              </div>
              <div><label className="label">{t.create.clientPhone}</label>
                <input className="field" inputMode="numeric" maxLength={10} value={f.client_phone}
                       onChange={(e) => setF({ ...f, client_phone: e.target.value.replace(/\D/g, "") })} /></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] gap-5 rise items-start">
            <div className="space-y-5">
              <div className="card p-5 sm:p-6">
                <h2 className={`display text-[21px] ${dv}`}>{t.create.chooseDesign}</h2>
                <p className="mt-1 text-[13px] text-muted leading-relaxed">{t.create.designHint}</p>
                <div className="mt-4 grid gap-3">
                  {designs.map((d) => {
                    const on = f.design === d.id;
                    return (
                      <button key={d.id} onClick={() => setF({ ...f, design: d.id })}
                        className={`tile ${on ? "tile-on" : "tile-off"} flex items-start gap-3.5`}>
                        <DesignGlyph id={d.id} on={on} />
                        <span className="min-w-0">
                          <span className={`block font-semibold text-[15.5px] ${lang === "hi" ? "deva" : ""}`}>{nm(d.name)}</span>
                          <span className={`block mt-0.5 text-[12.5px] text-muted leading-snug ${lang === "hi" ? "deva" : ""}`}>
                            {nm(d.tagline)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5 sm:p-6">
                <h2 className={`display text-[21px] mb-4 ${dv}`}>{t.create.chooseColour}</h2>
                <div className="flex flex-wrap gap-2.5">
                  {palettes.map((p) => {
                    const on = f.palette === p.id;
                    return (
                      <button key={p.id} onClick={() => setF({ ...f, palette: p.id })} title={nm(p.name)}
                        className={`rounded-xl p-1.5 border-2 transition ${on ? "border-fg" : "border-transparent hover:border-line"}`}>
                        <span className="flex rounded-md overflow-hidden w-[54px] h-8 border border-line/70">
                          {p.swatch.map((c, i) => <span key={i} style={{ background: c }} className="flex-1" />)}
                        </span>
                        <span className={`block mt-1 text-[11px] text-center ${on ? "font-semibold text-fg" : "text-muted"} ${lang === "hi" ? "deva" : ""}`}>
                          {nm(p.name)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview stays pinned on the right and scrolls within itself. */}
            <div className="card p-5 sm:p-6 lg:sticky lg:top-6">
              <div className="flex items-baseline justify-between">
                <h2 className={`display text-[21px] ${dv}`}>{t.create.preview}</h2>
                <span className="eyebrow">{f.design} · {f.palette}</span>
              </div>
              <p className="mt-1 mb-4 text-[12.5px] text-muted">{t.create.previewHint}</p>
              <div className="lg:max-h-[calc(100dvh-300px)] lg:overflow-y-auto lg:pr-1">
                <Preview type={f.report_type} design={f.design} palette={f.palette}
                         lang={f.language} title={typeName} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed action bar — the primary action is always reachable. On mobile it
          sits directly above the tab bar rather than overlapping it. */}
      <div className="fixed inset-x-0 z-40 bg-raised border-t border-line shadow-[0_-6px_20px_-14px_rgba(26,23,20,.35)]
                      bottom-[calc(66px+env(safe-area-inset-bottom))] lg:bottom-0
                      lg:left-[248px] xl:left-[268px]">
        <div className="shell py-3 flex items-center gap-3">
          {step > 1
            ? <button className="btn-line px-5" onClick={() => setStep((step - 1) as Step)}>{t.create.back}</button>
            : <span className="hidden sm:block" />}

          <div className="flex-1 min-w-0 hidden sm:block">
            {err
              ? <span className="text-[13px] text-ember">{err}</span>
              : <span className="text-[13px] text-muted truncate block">
                  <b className={`text-fg ${lang === "hi" ? "deva" : ""}`}>{typeName}</b>
                  {step === 3 && <> · {f.design} · {f.palette}</>}
                </span>}
          </div>

          {step < 3
            ? <button className="btn-brass px-8 ml-auto"
                      disabled={step === 2 && (!f.name.trim() || !f.place_id)}
                      onClick={() => setStep((step + 1) as Step)}>{t.create.next}</button>
            : <button className="btn-brass px-8 ml-auto min-w-[190px]"
                      onClick={go} disabled={phase !== "idle" || !affordable}>
                {affordable ? `${t.create.generate} · ${type?.credits} ${t.create.credits}` : t.create.needCredits}
              </button>}
        </div>
        {err && <div className="sm:hidden shell pb-2 text-[12.5px] text-ember">{err}</div>}
      </div>

      {phase !== "idle" && (
        <Generating chapters={type?.chapters ?? 0} done={phase === "settling"}
                    onFinish={() => setPhase("idle")} />
      )}
    </>
  );
}

/** Tiny wireframe showing how each design lays a page out. */
function DesignGlyph({ id, on }: { id: string; on: boolean }) {
  const line = on ? "#1A1714" : "#BDB3A9";
  const accent = on ? "#C29A3C" : "#DCD5CD";
  return (
    <svg width="42" height="54" viewBox="0 0 42 54" className="shrink-0 rounded-md border border-line bg-raised">
      {id === "classic" && (<>
        <rect x="4" y="4" width="34" height="46" fill="none" stroke={line} strokeWidth=".8" />
        <rect x="8" y="9" width="26" height="5" fill={accent} />
        {[18, 22, 26, 33, 37, 41].map((y) => <rect key={y} x="8" y={y} width="26" height="1.6" fill={line} opacity=".55" />)}
        <rect x="8" y="29" width="17" height="2" fill={accent} />
      </>)}
      {id === "editorial" && (<>
        <rect x="6" y="8" width="12" height="3" fill={accent} />
        {[16, 20, 24, 28, 32, 36, 40].map((y) => <rect key={y} x="6" y={y} width="13" height="1.5" fill={line} opacity=".5" />)}
        {[16, 20, 24, 28, 32].map((y) => <rect key={"b" + y} x="23" y={y} width="13" height="1.5" fill={line} opacity=".5" />)}
      </>)}
      {id === "heritage" && (<>
        <rect x="3" y="3" width="36" height="48" fill="none" stroke={accent} strokeWidth="1.4" />
        <rect x="6" y="6" width="30" height="42" fill="none" stroke={line} strokeWidth=".5" />
        <circle cx="21" cy="20" r="6" fill="none" stroke={accent} strokeWidth="1" />
        <text x="21" y="23.5" textAnchor="middle" fontSize="7" fill={line} fontWeight="700">2</text>
        <rect x="12" y="32" width="18" height="1.8" fill={line} opacity=".55" />
        <rect x="14" y="37" width="14" height="1.8" fill={line} opacity=".4" />
      </>)}
    </svg>
  );
}
