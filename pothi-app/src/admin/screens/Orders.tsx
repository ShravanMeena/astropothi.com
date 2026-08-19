import { useCallback, useEffect, useState } from "react";
import { adminApi, rupees, num, when, ms } from "../api";
import type { OrderRow, OrderDetail } from "../types";
import { Panel, TableWrap, PinnedHead, Th, Td, Tr, Chip, Loading, Empty, ErrorNote, Search, Segmented, Btn, Drawer, Facts, SubHead, Note } from "../ui";

const FILTERS = [
  { value: "all", label: "All" }, { value: "ready", label: "Delivered" },
  { value: "failed", label: "Failed" }, { value: "created", label: "Unpaid" },
  { value: "refunded", label: "Refunded" }
];

export default function Orders() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    adminApi.get(`/orders?status=${status}&q=${encodeURIComponent(q)}&limit=200`)
      .then((d) => { setRows(d.orders); setTotal(d.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [status, q]);

  useEffect(load, [load]);

  return (
    <>
      <Panel title="Orders" sub={`${num(total)} matching`}
             right={<div className="flex flex-wrap items-center gap-2 justify-end">
               <Segmented value={status} onChange={setStatus} options={FILTERS} />
               <Search value={q} onChange={setQ} placeholder="Order id, phone, name, invoice" />
             </div>}>
        {err && <ErrorNote error={err} />}
        {loading ? <Loading /> : !rows.length ? <Empty label="No orders match." /> : (
          <TableWrap pin>
            <PinnedHead><tr>
              <Th>Order</Th><Th>Report</Th><Th>Buyer</Th><Th>Status</Th>
              <Th align="right">Amount</Th><Th align="right">Placed</Th>
            </tr></PinnedHead>
            <tbody>
              {rows.map((o) => (
                <Tr key={o.public_id} onClick={() => setOpen(o.public_id)} active={open === o.public_id}>
                  <Td mono>{o.public_id}</Td>
                  <Td>
                    <div>{o.report_name}</div>
                    <div className="text-[11px] text-faint">{o.design} · {o.palette} · {o.language}</div>
                  </Td>
                  <Td>
                    <div>{o.buyer_name || o.subject_name || "—"}</div>
                    <div className="text-[11px] text-faint">{o.buyer_phone || ""}</div>
                  </Td>
                  <Td>
                    <Chip tone={o.status}>{o.status}</Chip>
                    {o.status === "failed" && <div className="mt-1 text-[10.5px] text-ember">paid, not delivered</div>}
                  </Td>
                  <Td align="right">
                    <div className="font-medium">{rupees(o.amount_paise)}</div>
                    <div className="text-[10.5px] text-faint">{o.paid ? "received" : "not received"}</div>
                  </Td>
                  <Td align="right" dim>{when(o.created_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <OrderDrawer publicId={open} onClose={() => setOpen(null)} onChanged={load} />
    </>
  );
}

function OrderDrawer({ publicId, onClose, onChanged }: {
  publicId: string | null; onClose: () => void; onChanged: () => void;
}) {
  const [d, setD] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setD(null); setErr(""); setMsg("");
    if (!publicId) return;
    adminApi.get(`/orders/${publicId}`).then(setD).catch((e) => setErr(e.message));
  }, [publicId]);

  const retry = async () => {
    if (!publicId) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await adminApi.post(`/orders/${publicId}/retry`);
      setMsg(r.rerendered ? `Re-rendered — order is now ${r.status}.`
                          : `A finished report already existed and was adopted (report ${r.adopted_report_id}).`);
      setD(await adminApi.get(`/orders/${publicId}`));
      onChanged();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const birth = (d?.birth || {}) as Record<string, string | number>;

  return (
    <Drawer open={!!publicId} onClose={onClose}
            title={d ? `${d.report_name} · ${d.public_id}` : publicId || ""}
            sub={d ? `${rupees(d.amount_paise)} · ${when(d.created_at)} IST` : undefined}>
      {err && <ErrorNote error={err} />}
      {msg && <div className="rounded-lg border border-line bg-sunken px-3.5 py-2.5 text-[12.5px] text-fg">{msg}</div>}
      {!d ? <Loading /> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={d.status}>{d.status}</Chip>
            <Chip tone={d.paid ? "paid" : "created"}>{d.paid ? "money received" : "no money received"}</Chip>
            {d.report?.pdf_url && (
              <a href={d.report.pdf_url} target="_blank" rel="noreferrer" className="btn btn-line btn-sm">Open PDF</a>
            )}
            {d.status === "failed" && <Btn tone="brass" onClick={retry} busy={busy}>Retry generation</Btn>}
            {d.status === "created" && d.razorpay_link_url && (
              <a href={d.razorpay_link_url} target="_blank" rel="noreferrer" className="btn btn-line btn-sm">Open payment link</a>
            )}
          </div>

          {d.error && (
            <div>
              <SubHead>Failure</SubHead>
              <pre className="rounded-lg border border-ember/40 bg-ember/8 p-3 text-[11.5px] text-ember whitespace-pre-wrap break-words">{d.error}</pre>
            </div>
          )}

          <div>
            <SubHead>Order</SubHead>
            <Facts rows={[
              ["Report", `${d.report_name} (${d.report_type})`],
              ["Design", `${d.design} · ${d.palette} · ${d.language}`],
              ["Gross", rupees(d.amount_paise)],
              ["GST", `${rupees(d.gst_paise)} (already inside gross)`],
              ["Net", rupees(d.amount_paise - d.gst_paise)],
              ["Invoice", d.invoice_no || "not issued"],
              ["Place of supply", d.state || "—"],
              ["Placed", `${when(d.created_at)} IST`],
              ["Updated", `${when(d.updated_at)} IST`]
            ]} />
          </div>

          <div>
            <SubHead>Buyer</SubHead>
            <Facts rows={[
              ["Name", d.buyer_name],
              ["Phone", d.buyer_phone],
              ["Email", d.buyer_email],
              ["Account", d.user ? `#${d.user.id} · ${d.user.status}` : "no account linked"]
            ]} />
          </div>

          <div>
            <SubHead>Birth details used</SubHead>
            <Facts rows={[
              ["Name", birth.name as string],
              ["Born", `${birth.dob ?? "—"} ${birth.tob ?? ""}`],
              ["Place", birth.pob as string],
              ["Coordinates", birth.lat !== undefined ? `${birth.lat}, ${birth.lon} (tz ${birth.tzone})` : "—"],
              ["Gender", birth.gender as string]
            ]} />
          </div>

          <div>
            <SubHead>Payment</SubHead>
            <Facts rows={[
              ["Link id", d.razorpay_link_id || "—"],
              ["Payment id", d.razorpay_payment_id || "—"],
              ["Link", d.razorpay_link_url
                ? <a className="text-brass underline break-all" href={d.razorpay_link_url} target="_blank" rel="noreferrer">{d.razorpay_link_url}</a>
                : "—"]
            ]} />
            <Note>
              Payment state is owned by the Razorpay webhook. There is no “mark as paid” here on purpose —
              a button that forged it would make every revenue figure in this panel a guess.
            </Note>
          </div>

          {d.report && (
            <div>
              <SubHead>Report</SubHead>
              <Facts rows={[
                ["Id", d.report.id],
                ["Status", <Chip tone={d.report.status}>{d.report.status}</Chip>],
                ["Pages", d.report.page_count],
                ["Generated in", ms(d.report.generated_ms)],
                ["Chart", [d.report.rashi, d.report.nakshatra, d.report.lagna].filter(Boolean).join(" · ") || "—"]
              ]} />
            </div>
          )}

          {!!d.orphan_reports.length && (
            <div>
              <SubHead>Unlinked reports</SubHead>
              <Note>
                {d.orphan_reports.length} report(s) exist for this order but are not the one the order points at.
                That is the signature of a generate that produced a book and then failed to file it — a retry will
                adopt a finished one rather than re-rendering.
              </Note>
              <ul className="mt-2 space-y-1.5 text-[12px]">
                {d.orphan_reports.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <Chip tone={r.status}>{r.status}</Chip>
                    <span className="text-muted">#{r.id} · {r.page_count ?? "?"}pp · {when(r.created_at)}</span>
                    {r.pdf_url && <a className="text-brass underline" href={r.pdf_url} target="_blank" rel="noreferrer">PDF</a>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
