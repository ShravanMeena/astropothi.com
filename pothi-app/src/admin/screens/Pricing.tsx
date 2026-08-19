import { useEffect, useState } from "react";
import { adminApi, rupees, when } from "../api";
import {
  Panel, TableWrap, Th, Td, Tr, Chip, Btn, Loading, Empty, ErrorNote, Note, Tag
} from "../ui";

type Row = {
  code: string; name_en: string; chapters: number; tier: string;
  tier_paise: number; override_paise: number | null; price_paise: number;
  note: string | null; set_by: string | null; changed_at: string | null;
};

type Coupon = {
  code: string; kind: "percent" | "flat"; value: number;
  max_discount_paise: number | null; min_amount_paise: number | null;
  report_types: string[] | null; max_uses: number | null; uses: number;
  starts_at: string | null; expires_at: string | null; active: boolean; note: string | null;
};

const rupeesToPaise = (s: string) => Math.round(Number(s) * 100);
const paiseToRupees = (p: number) => String(Math.round(p) / 100);

/**
 * Prices and coupons.
 *
 * The tier price is the default that ships in the code; an override is a row in
 * the database that wins over it. Keeping the two visible side by side is the
 * point — six months from now, "why is Love ₹299" should be answerable without
 * reading a git log.
 */
export default function Pricing() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const load = () => {
    adminApi.get("/pricing").then((r) => { setRows(r); setEdit({}); }).catch((e) => setErr(e.message));
    adminApi.get("/coupons").then(setCoupons).catch((e) => setErr(e.message));
  };
  useEffect(load, []);

  const save = async (code: string) => {
    const v = edit[code];
    if (v === undefined || v === "") return;
    setBusy(code); setErr("");
    try {
      await adminApi.put(`/pricing/${code}`, { price_paise: rupeesToPaise(v) });
      load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  const clear = async (code: string) => {
    setBusy(code); setErr("");
    try { await adminApi.del(`/pricing/${code}`); load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  return (
    <div className="space-y-4">
      {err && <ErrorNote error={err} />}

      <Panel title="Report prices"
             sub="An override takes effect immediately, for every buyer, on the next page load. Existing unpaid orders keep the price they were quoted.">
        {!rows ? <Loading /> : (
          <TableWrap>
              <thead><tr>
                <Th>Report</Th><Th>Tier</Th><Th align="right">Tier price</Th>
                <Th align="right">Charging now</Th><Th align="right" w="200px">Override (₹)</Th>
                <Th>Last change</Th>
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const draft = edit[r.code] ?? (r.override_paise !== null ? paiseToRupees(r.override_paise) : "");
                  const dirty = draft !== (r.override_paise !== null ? paiseToRupees(r.override_paise) : "");
                  return (
                    <Tr key={r.code}>
                      <Td>
                        <div className="font-medium text-fg">{r.name_en}</div>
                        <div className="text-faint text-[11px]">{r.code} · {r.chapters} chapters</div>
                      </Td>
                      <Td><Tag>{r.tier}</Tag></Td>
                      <Td align="right" mono dim>{rupees(r.tier_paise)}</Td>
                      <Td align="right" mono>
                        <span className={r.override_paise !== null ? "text-brass font-semibold" : ""}>
                          {rupees(r.price_paise)}
                        </span>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <input className="field h-8 w-24 text-right tabular-nums text-[12.5px]"
                                 inputMode="decimal" placeholder="—" value={draft}
                                 onChange={(e) => setEdit((p) => ({ ...p, [r.code]: e.target.value }))}
                                 onKeyDown={(e) => { if (e.key === "Enter") save(r.code); }} />
                          <Btn tone={dirty ? "brass" : "line"} disabled={!dirty}
                               busy={busy === r.code} onClick={() => save(r.code)}>Save</Btn>
                          {r.override_paise !== null && (
                            <Btn tone="quiet" title="Fall back to the tier price"
                                 onClick={() => clear(r.code)}>Reset</Btn>
                          )}
                        </div>
                      </Td>
                      <Td dim>
                        {r.changed_at ? <>{when(r.changed_at)}{r.set_by ? ` · ${r.set_by}` : ""}</> : "—"}
                        {r.note && <div className="text-[11px] text-faint">{r.note}</div>}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
          </TableWrap>
        )}
        <Note>
          Tiers exist so the prices stay in proportion to each other. Before they were introduced the
          spread was 4× per thousand words of content — a buyer comparing two reports could see it.
        </Note>
      </Panel>

      <CouponPanel coupons={coupons} reports={rows || []} onChange={load} onError={setErr} />
    </div>
  );
}

function CouponPanel({ coupons, reports, onChange, onError }: {
  coupons: Coupon[] | null; reports: Row[]; onChange: () => void; onError: (s: string) => void;
}) {
  const blank = {
    code: "", kind: "percent" as const, value: "10", max_discount: "",
    report_types: [] as string[], max_uses: "", expires_at: "", note: ""
  };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true); onError("");
    try {
      await adminApi.post("/coupons", {
        code: f.code,
        kind: f.kind,
        // Percent coupons carry a percentage; flat ones carry paise, like every
        // other amount crossing this API.
        value: f.kind === "percent" ? Number(f.value) : rupeesToPaise(f.value),
        max_discount_paise: f.max_discount ? rupeesToPaise(f.max_discount) : null,
        report_types: f.report_types.length ? f.report_types : null,
        max_uses: f.max_uses ? Number(f.max_uses) : null,
        expires_at: f.expires_at || null,
        note: f.note || null
      });
      setF(blank); setOpen(false); onChange();
    } catch (e: any) { onError(e.message); } finally { setBusy(false); }
  };

  const toggle = async (c: Coupon) => {
    onError("");
    try { await adminApi.post(`/coupons/${c.code}/active`, { active: !c.active }); onChange(); }
    catch (e: any) { onError(e.message); }
  };

  return (
    <Panel title="Coupons"
           sub="Checked again on the server when the order is created — a code edited here stops working immediately, even in a tab that already loaded it."
           right={<Btn tone={open ? "quiet" : "brass"} onClick={() => setOpen((o) => !o)}>
                    {open ? "Cancel" : "New coupon"}
                  </Btn>}>
      {open && (
        <div className="border-b border-line bg-sunken/40 px-4 sm:px-5 py-4 grid gap-3 sm:grid-cols-3">
          <label className="text-[11.5px] text-muted">Code
            <input className="field h-9 mt-1 uppercase" value={f.code} maxLength={32}
                   placeholder="DIWALI20"
                   onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
          </label>
          <label className="text-[11.5px] text-muted">Type
            <select className="field h-9 mt-1" value={f.kind}
                    onChange={(e) => setF({ ...f, kind: e.target.value as any })}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat ₹ off</option>
            </select>
          </label>
          <label className="text-[11.5px] text-muted">
            {f.kind === "percent" ? "Percent (max 90)" : "Amount off (₹)"}
            <input className="field h-9 mt-1 tabular-nums" inputMode="decimal" value={f.value}
                   onChange={(e) => setF({ ...f, value: e.target.value })} />
          </label>
          {f.kind === "percent" && (
            <label className="text-[11.5px] text-muted">Cap the discount at (₹, optional)
              <input className="field h-9 mt-1 tabular-nums" inputMode="decimal" value={f.max_discount}
                     placeholder="no cap"
                     onChange={(e) => setF({ ...f, max_discount: e.target.value })} />
            </label>
          )}
          <label className="text-[11.5px] text-muted">Total uses (optional)
            <input className="field h-9 mt-1 tabular-nums" inputMode="numeric" value={f.max_uses}
                   placeholder="unlimited"
                   onChange={(e) => setF({ ...f, max_uses: e.target.value })} />
          </label>
          <label className="text-[11.5px] text-muted">Expires (optional)
            <input className="field h-9 mt-1" type="date" value={f.expires_at}
                   onChange={(e) => setF({ ...f, expires_at: e.target.value })} />
          </label>
          <div className="sm:col-span-3">
            <div className="text-[11.5px] text-muted mb-1.5">
              Limit to reports <span className="text-faint">(none selected = every report)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reports.map((r) => {
                const on = f.report_types.includes(r.code);
                return (
                  <button key={r.code} type="button"
                    onClick={() => setF({ ...f, report_types: on
                      ? f.report_types.filter((c) => c !== r.code)
                      : [...f.report_types, r.code] })}
                    className={`chip ${on ? "bg-fg text-surface" : "bg-sunken text-muted"}`}>
                    {r.name_en}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-3 flex items-center gap-2">
            <Btn tone="brass" busy={busy} disabled={!f.code.trim()} onClick={create}>Create coupon</Btn>
            <span className="text-[11.5px] text-faint">Percent coupons are capped at 90% server-side.</span>
          </div>
        </div>
      )}

      {!coupons ? <Loading /> : coupons.length === 0 ? <Empty label="No coupons yet" /> : (
        <TableWrap>
            <thead><tr>
              <Th>Code</Th><Th>Discount</Th><Th>Applies to</Th>
              <Th align="right">Used</Th><Th>Expires</Th><Th align="right">State</Th>
            </tr></thead>
            <tbody>
              {coupons.map((c) => {
                const dead = !c.active
                  || (c.expires_at && new Date(c.expires_at) < new Date())
                  || (c.max_uses !== null && c.uses >= c.max_uses);
                return (
                  <Tr key={c.code}>
                    <Td mono><span className="font-semibold text-fg">{c.code}</span>
                      {c.note && <div className="text-[11px] text-faint">{c.note}</div>}
                    </Td>
                    <Td>
                      {c.kind === "percent"
                        ? <>{c.value}% off{c.max_discount_paise ? ` · max ${rupees(c.max_discount_paise)}` : ""}</>
                        : <>{rupees(c.value)} off</>}
                    </Td>
                    <Td dim>{c.report_types?.length ? c.report_types.join(", ") : "every report"}</Td>
                    <Td align="right" mono>{c.uses}{c.max_uses !== null ? ` / ${c.max_uses}` : ""}</Td>
                    <Td dim>{c.expires_at ? when(c.expires_at, false) : "—"}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Chip tone={dead ? "failed" : "ready"}>{dead ? "not usable" : "live"}</Chip>
                        <Btn tone="quiet" onClick={() => toggle(c)}>{c.active ? "Disable" : "Enable"}</Btn>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
        </TableWrap>
      )}
    </Panel>
  );
}
