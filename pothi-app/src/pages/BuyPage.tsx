import { useEffect, useRef, useState } from "react";
import { api, rupees, type ReportItem } from "../lib/api";
import PlaceInput from "../sections/PlaceInput";
import { DateField, TimeField, Select } from "../components/Picker";
import { setUserToken } from "../lib/account";

const STAGES = [
  "Casting the chart from the ephemeris",
  "Placing nine grahas across twelve houses",
  "Reading yogas, doshas and the dasha timeline",
  "Writing the chapters",
  "Typesetting the pages"
];

/**
 * A labelled field that can show what is wrong with it.
 *
 * The error styling is applied to whatever `.field` sits inside, so the date
 * picker, the place autocomplete and a plain input all light up the same way
 * without each one needing to know about validation.
 */
function Field({ label, hint, error, id, children }: {
  label: string; hint?: string; error?: string; id?: string; children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <label className="label">
        {label}{hint && <span className="text-faint font-normal"> {hint}</span>}
      </label>
      <div className={error
        ? "[&_.field]:border-ember [&_.field]:ring-4 [&_.field]:ring-ember/15"
        : ""}>
        {children}
      </div>
      {error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-ember" role="alert">
          <svg viewBox="0 0 16 16" width="13" height="13" className="mt-[2px] shrink-0"
               fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="8" cy="8" r="6.4" /><path d="M8 5v3.6M8 10.8v.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/** A numbered step: a heading in the margin, the fields beside it. */
function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid sm:grid-cols-[7.5rem_1fr] gap-x-8 gap-y-5">
      <div className="sm:pt-1">
        <div className="font-serif text-[13px] text-brass tabular-nums">{n}</div>
        <h2 className="text-[15px] font-medium mt-1 leading-snug">{title}</h2>
      </div>
      <div className="grid gap-5 min-w-0">{children}</div>
    </section>
  );
}

export default function BuyPage({ item, design, palette, onDone, onBack }: {
  item: ReportItem | undefined; design: string; palette: string;
  onDone: (publicId: string) => void; onBack: () => void;
}) {
  const [f, setF] = useState({
    name: "", gender: "female", dob: "", tob: "", pob: "", place_id: "",
    language: "en", buyer_phone: "", buyer_email: ""
  });
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(-1);
  const [err, setErr] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  // An error clears the moment the field it belongs to is filled in — leaving it
  // shouting after the buyer has fixed it is its own kind of wrong.
  const patch = (v: Partial<typeof f>) => {
    setF((prev) => ({ ...prev, ...v }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(v)) delete next[k === "pob" ? "place_id" : k];
      return next;
    });
  };
  const set = (k: string) => (e: any) => patch({ [k]: e.target.value } as Partial<typeof f>);

  /** What is missing, in the order it appears on the page. */
  const validate = (v: typeof f) => {
    const e: Record<string, string> = {};
    if (!v.name.trim())          e.name = "Whose chart is this? Enter the full name.";
    if (!v.dob)                  e.dob = "Choose the date of birth.";
    if (!v.tob)                  e.tob = "Choose the time of birth — it fixes the ascendant.";
    if (!v.place_id)             e.place_id = v.pob.trim()
      ? "Pick the birth place from the list so we can resolve its coordinates."
      : "Enter the birth place and pick it from the list.";
    if (v.buyer_phone.length !== 10) e.buyer_phone = "Enter a 10-digit mobile number.";
    if (v.buyer_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.buyer_email))
      e.buyer_email = "That email address does not look right.";
    return e;
  };

  useEffect(() => {
    if (stage < 0) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1100);
    return () => clearInterval(t);
  }, [stage < 0]);


  const submit = async () => {
    if (!item) return;

    // The button stays enabled on purpose: a disabled button that will not say
    // why is the reason people abandon this form.
    const bad = validate(f);
    if (Object.keys(bad).length) {
      setErrors(bad); setErr("");
      const first = Object.keys(bad)[0];
      const el = formRef.current?.querySelector<HTMLElement>(`#field-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input,button,textarea")?.focus({ preventScroll: true });
      return;
    }
    setBusy(true); setErr(""); setStage(-1);
    try {
      const o = await api.post("/noauth-api/v1/shop/order",
        { ...f, buyer_name: f.name, report_type: item.code, design, palette });

      // The number they just gave us is the account, so the server signs them in
      // with the order. From here the report lands on their profile by itself.
      if (o.token) setUserToken(o.token);

      // Live payments: leave for Razorpay's hosted page. It redirects back to
      // /order/<public_id>, where the return is verified and the report waits.
      if (o.pay_url) { window.location.href = o.pay_url; return; }

      // Payments not configured — the local path, clearly labelled as such.
      setStage(0);
      await api.post("/noauth-api/v1/shop/confirm", { razorpay_order_id: o.razorpay_order_id });
      await new Promise((r) => setTimeout(r, 1200));
      onDone(o.public_id);
    } catch (e: any) {
      if (/birth place/i.test(e.message)) setErrors({ place_id: e.message });
      else setErr(e.message);
      setBusy(false); setStage(-1);
    }
  };

  if (busy) return (
    <div className="shell py-28 sm:py-40 text-center">
      <div className="mx-auto w-10 h-10 rounded-full border-2 border-brass border-t-transparent animate-spin" />
      <h1 className="display text-[28px] mt-8">
        {stage < 0 ? "Taking you to payment" : "Preparing your report"}
      </h1>
      <p className="text-[14px] text-muted mt-2">
        {stage < 0
          ? "Razorpay's secure page is opening. Do not close this tab."
          : "This takes a few seconds. Please stay on the page."}
      </p>
      <div className="mt-9 space-y-2.5 inline-block text-left">
        {STAGES.map((s, i) => (
          <div key={s} className={`flex items-center gap-3 text-[14.5px] transition
            ${i < stage ? "text-faint" : i === stage ? "text-fg font-medium" : "text-faint"}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i <= stage ? "bg-brass" : "bg-line"}`} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="shell py-10 sm:py-14 max-w-3xl pb-32 sm:pb-14">
      <button onClick={onBack} className="text-[13.5px] text-faint hover:text-fg">← Back</button>

      <div className="mt-6 flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="display text-[32px] sm:text-[40px]">Your birth details</h1>
        <div className="text-right">
          <div className="text-[13px] text-faint">{item?.name_en}</div>
          <div className="display text-[26px]">{item ? rupees(item.price_paise) : ""}</div>
        </div>
      </div>
      <p className="lede mt-3">
        Birth time matters more than anything else here — it fixes the ascendant and every
        house cusp. Use a birth certificate if you have one.
      </p>

      <div ref={formRef} className="mt-10 space-y-10">
        <Block n="01" title="Who the reading is for">
        <Field id="field-name" label="Full name" error={errors.name}>
          <input className="field deva" value={f.name} onChange={set("name")} autoFocus
                 aria-invalid={!!errors.name} placeholder="As you would like it printed" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field id="field-dob" label="Date of birth" error={errors.dob}>
            <DateField value={f.dob} onChange={(v) => patch({ dob: v })} />
          </Field>
          <Field id="field-tob" label="Time of birth" error={errors.tob}>
            <TimeField value={f.tob} onChange={(v) => patch({ tob: v })} />
          </Field>
        </div>
        <Field id="field-place_id" label="Place of birth" error={errors.place_id}
               hint="pick from the list">
          <PlaceInput value={f.pob} placeId={f.place_id} onChange={(v) => patch(v)} />
        </Field>
        </Block>

        <Block n="02" title="How you want it written">
        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className="label">Gender</label>
            <Select value={f.gender} ariaLabel="Gender"
                    onChange={(v) => patch({ gender: v })}
                    options={[{ value: "female", label: "Female" },
                              { value: "male", label: "Male" },
                              { value: "other", label: "Other" }]} /></div>
          <div><label className="label">Report language</label>
            <Select value={f.language} ariaLabel="Report language"
                    onChange={(v) => patch({ language: v })}
                    options={[{ value: "en", label: "English" },
                              { value: "hi", label: "हिन्दी" }]} /></div>
        </div>
        </Block>

        <Block n="03" title="Where to send it">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field id="field-buyer_phone" label="WhatsApp number" error={errors.buyer_phone}>
            <div className={`field flex items-center gap-2 p-0 pl-4 pr-4
                             focus-within:border-brass focus-within:ring-4 focus-within:ring-brass/10`}>
              <span className="text-muted text-[15px] tabular-nums shrink-0">+91</span>
              <span className="h-5 w-px bg-line shrink-0" />
              <input className="flex-1 min-w-0 h-full bg-transparent outline-none text-[15px]
                                placeholder:text-faint tabular-nums"
                     inputMode="numeric" maxLength={10} placeholder="98765 43210"
                     aria-label="WhatsApp number" aria-invalid={!!errors.buyer_phone}
                     value={f.buyer_phone}
                     onChange={(e) => patch({ buyer_phone: e.target.value.replace(/\D/g, "") })} />
            </div>
            {!errors.buyer_phone &&
              <p className="text-[12px] text-faint mt-1.5">We use this to reach you about this order.</p>}
          </Field>
          <Field id="field-buyer_email" label="Email" hint="optional" error={errors.buyer_email}>
            <input className="field" type="email" value={f.buyer_email} onChange={set("buyer_email")}
                   aria-invalid={!!errors.buyer_email} placeholder="you@example.com" />
          </Field>
        </div>
        </Block>
      </div>

      {err && <p className="mt-4 text-[14px] text-ember">{err}</p>}

      {/* Desktop: the button sits at the end of the form, where the eye lands. */}
      <div className="mt-8 hidden sm:flex flex-wrap items-center gap-4">
        <button className="btn-brass h-[52px] px-8 text-[16px]" disabled={busy} onClick={submit}>
          Pay {item ? rupees(item.price_paise) : ""} securely
        </button>
        <span className="text-[13px] text-faint">Secure payment on Razorpay · UPI, card or netbanking</span>
      </div>

      <p className="text-[12px] text-faint mt-6 max-w-prose2 leading-relaxed">
        Price includes GST. Reports are generated on payment and are non-refundable once
        delivered. Prepared for guidance; not a substitute for medical, legal or financial advice.
      </p>

      {/*
        Mobile: the form is taller than the screen, so a button at the bottom of
        it is off-screen for the whole time somebody is filling the form in.
        Pin it, with the price beside it — on a phone the buyer should always be
        able to see what they are about to pay and get on with paying it.
      */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line
                      bg-surface/95 backdrop-blur-xl"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="shell py-3 flex items-center gap-4">
          <div className="shrink-0">
            <div className="display text-[20px] leading-none">
              {item ? rupees(item.price_paise) : ""}
            </div>
            <div className="text-[11px] text-faint mt-1">incl. GST</div>
          </div>
          <button className="btn-brass flex-1 h-[50px] text-[15.5px]" disabled={busy} onClick={submit}>
            {busy ? "…" : "Pay securely"}
          </button>
        </div>
      </div>
    </div>
  );
}
