import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { rupees } from "../lib/api";
import { userApi, clearUserToken, useMe, type BuyerProfile, type BuyerOrder } from "../lib/account";
import ChartMark from "../components/ChartMark";
import Support from "../components/Support";

const STATUS: Record<string, { label: string; tone: string }> = {
  created:    { label: "Awaiting payment", tone: "text-faint border-line" },
  paid:       { label: "Paid",             tone: "text-brass border-brass/40" },
  generating: { label: "Writing…",         tone: "text-brass border-brass/40" },
  ready:      { label: "Ready",            tone: "text-brass border-brass/40" },
  failed:     { label: "Failed",           tone: "text-ember border-ember/40" },
  refunded:   { label: "Refunded",         tone: "text-faint border-line" }
};

const INTERESTS = ["Career", "Marriage", "Health", "Money", "Children", "Property",
                   "Education", "Travel abroad", "Litigation", "Spiritual growth"];
const PRACTICES = ["Daily puja", "Fasting (vrat)", "Mantra japa", "Meditation",
                   "Temple visits", "Reading scripture", "Yoga", "Charity (daan)"];
const DEVTAS = ["Ganesha", "Shiva", "Vishnu", "Krishna", "Rama", "Hanuman",
                "Durga", "Lakshmi", "Saraswati", "Kali", "Surya", "Kuldevta"];

/** A tag you can switch on and off. Nothing here is required. */
function Chips({ options, value = [], onToggle }: {
  options: string[]; value?: string[]; onToggle: (x: string) => void;
}) {
  const toggle = onToggle;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((x) => {
        const on = value.includes(x);
        return (
          <button key={x} type="button" onClick={() => toggle(x)} aria-pressed={on}
            className={`rounded-full px-3.5 h-9 text-[13.5px] border transition
              ${on ? "border-brass bg-brassSoft/40 text-brass font-medium"
                   : "border-line text-muted hover:border-faint hover:text-fg"}`}>
            {x}
          </button>
        );
      })}
    </div>
  );
}

function Orders({ orders, onOpen }: { orders: BuyerOrder[]; onOpen: (id: string) => void }) {
  if (!orders.length) {
    return (
      <div className="rounded-[3px] border border-line bg-sunken p-8 text-center">
        <p className="text-[15px] text-muted">No reports yet.</p>
      </div>
    );
  }
  return (
    <div className="border-t border-line">
      {orders.map((o, i) => {
        const st = STATUS[o.status] ?? STATUS.created;
        return (
          <motion.div key={o.public_id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .35, delay: Math.min(i, 8) * .04 }}
            className="border-b border-line py-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[16px] font-medium">{o.report_type}</span>
                <span className={`text-[11px] uppercase tracking-[.14em] border rounded-full px-2.5 py-0.5 ${st.tone}`}>
                  {st.label}
                </span>
              </div>
              <div className="text-[13px] text-faint mt-1.5">
                {o.subject_name ? `${o.subject_name} · ` : ""}
                {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {o.page_count ? ` · ${o.page_count} pages` : ""} · {o.public_id}
              </div>
            </div>
            <div className="display text-[18px] tabular-nums">{rupees(o.amount_paise)}</div>
            <div className="flex gap-2">
              {o.status === "ready" && (
                <button className="btn-brass btn-sm" onClick={() => onOpen(o.public_id)}>Read</button>
              )}
              {o.status === "created" && o.pay_url && (
                <a className="btn-line btn-sm" href={o.pay_url}>Complete payment</a>
              )}
              {o.status !== "created" && (
                <button className="btn-line btn-sm" onClick={() => onOpen(o.public_id)}>Details</button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function ProfilePage({ onOpenOrder, onHome, onSignIn }: {
  onOpenOrder: (id: string) => void; onHome: () => void; onSignIn: () => void;
}) {
  const { signedIn, data, err, reload } = useMe();
  const [f, setF] = useState<BuyerProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data?.user) setF(data.user); }, [data?.user]);

  if (!signedIn) {
    return (
      <section className="shell py-24 sm:py-32 text-center">
        <h1 className="display text-[32px] sm:text-[42px]">Your reports live here</h1>
        <p className="lede mt-4 max-w-prose2 mx-auto">
          Sign in with the mobile number you ordered on and every report you have bought
          appears here, ready to open.
        </p>
        <button className="btn-brass h-[52px] px-8 text-[16px] mt-9" onClick={onSignIn}>
          Sign in with your mobile
        </button>
      </section>
    );
  }

  const p = f?.profile ?? {};
  const setP = (k: string, v: unknown) =>
    setF((prev) => (prev ? { ...prev, profile: { ...prev.profile, [k]: v } } : prev));

  // Adding or removing a tag reads the list off the latest state, never off the
  // render that drew the chip.
  const toggleP = (k: "interests" | "practices", x: string) =>
    setF((prev) => {
      if (!prev) return prev;
      const cur: string[] = (prev.profile as any)[k] ?? [];
      const next = cur.includes(x) ? cur.filter((v) => v !== x) : [...cur, x];
      return { ...prev, profile: { ...prev.profile, [k]: next } };
    });

  const save = async () => {
    if (!f) return;
    setBusy(true); setSaved(false);
    try {
      await userApi.put("/user-api/v1/me", { name: f.name, email: f.email, ...f.profile });
      setSaved(true); reload();
      setTimeout(() => setSaved(false), 2500);
    } finally { setBusy(false); }
  };

  return (
    <>
      <section className="relative overflow-hidden grain lamp border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[720px] max-w-[128vw] text-brass opacity-[.12] dark:opacity-[.16]">
          <ChartMark className="w-full h-auto" weight={0.32} />
        </div>
        <div className="shell relative z-10 py-14 sm:py-20 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="caps text-brass">Your account</p>
            <h1 className="display text-[34px] sm:text-[46px] mt-3">
              {f?.name?.trim() || `+91 ${f?.phone ?? ""}`}
            </h1>
            <p className="text-[13.5px] text-faint mt-2 tabular-nums">
              +91 {f?.phone} · {data?.orders.length ?? 0} report{(data?.orders.length ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
          <button className="btn-quiet" onClick={() => { clearUserToken(); onHome(); }}>Sign out</button>
        </div>
      </section>

      {err && <p className="shell mt-6 text-[14px] text-ember">{err}</p>}

      <section className="shell py-14 sm:py-20 grid lg:grid-cols-[1.15fr_.85fr] gap-x-16 gap-y-14">
        <div>
          <h2 className="display text-[26px] sm:text-[32px]">Your reports</h2>
          <p className="lede mt-2">Every book you have ordered, oldest at the bottom.</p>
          <div className="mt-8">
            <Orders orders={data?.orders ?? []} onOpen={onOpenOrder} />
          </div>
        </div>

        <div>
          <h2 className="display text-[26px] sm:text-[32px]">About you</h2>
          <p className="lede mt-2">
            All optional. What you share here shapes what we emphasise in future readings —
            leave any of it blank.
          </p>

          <div className="mt-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="field deva" value={f?.name ?? ""}
                       onChange={(e) => setF((prev) => (prev ? { ...prev, name: e.target.value } : prev))} />
              </div>
              <div>
                <label className="label">Email <span className="text-faint">optional</span></label>
                <input className="field" type="email" value={f?.email ?? ""}
                       onChange={(e) => setF((prev) => (prev ? { ...prev, email: e.target.value } : prev))} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Ishta devta</label>
                <input className="field deva" list="devtas" placeholder="Whoever you turn to"
                       value={p.ishta_devta ?? ""} onChange={(e) => setP("ishta_devta", e.target.value)} />
                <datalist id="devtas">{DEVTAS.map((d) => <option key={d} value={d} />)}</datalist>
              </div>
              <div>
                <label className="label">Gotra <span className="text-faint">optional</span></label>
                <input className="field deva" value={p.gotra ?? ""}
                       onChange={(e) => setP("gotra", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">What you are asking about</label>
              <Chips options={INTERESTS} value={p.interests} onToggle={(x) => toggleP("interests", x)} />
            </div>

            <div>
              <label className="label">What you practise</label>
              <Chips options={PRACTICES} value={p.practices} onToggle={(x) => toggleP("practices", x)} />
            </div>

            <div>
              <label className="label">Anything else worth knowing</label>
              <textarea className="field h-28 py-3 leading-relaxed resize-none deva"
                        placeholder="A question you keep coming back to, a remedy you were given, a date that matters…"
                        value={p.notes ?? ""} onChange={(e) => setP("notes", e.target.value)} />
            </div>

            <div className="flex items-center gap-4">
              <button className="btn-brass h-[48px] px-7" onClick={save} disabled={busy || !f}>
                {busy ? "Saving…" : "Save"}
              </button>
              {saved && <span className="text-[13.5px] text-brass">Saved</span>}
            </div>
          </div>
        </div>
      </section>

      {/* The orders page is where a buyer lands when something has gone wrong
          with an order, so the way to reach us belongs here rather than only
          in the footer. */}
      <section className="shell pb-16 sm:pb-24 max-w-3xl">
        <Support where="profile" />
      </section>
    </>
  );
}
