import type { Window as AdminWindow } from "../types";
import { useCallback, useEffect, useState } from "react";
import { adminApi, rupees, num, when, ago } from "../api";
import type { UserRow, UserDetail } from "../types";
import { Panel, TableWrap, PinnedHead, Th, Td, Tr, Chip, Tag, Loading, Empty, ErrorNote, Search, Btn, Drawer, Facts, SubHead, Hint, RangeBar } from "../ui";

export default function Users({ window: w, setWindow }: { window: AdminWindow; setWindow: (w: AdminWindow) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    adminApi.get(`/users?q=${encodeURIComponent(q)}&window=${w}&limit=200`)
      .then((d) => { setRows(d.users); setTotal(d.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [q, w]);

  useEffect(load, [load]);

  return (
    <>
      <RangeBar value={w} onChange={setWindow} />
      <Panel title="Buyers" sub={`${num(total)} account${total === 1 ? "" : "s"} · ordered by lifetime value`}
             right={<Search value={q} onChange={setQ} placeholder="Phone, name or email" />}>
        {err && <ErrorNote error={err} />}
        {loading ? <Loading /> : !rows.length ? <Empty label="No accounts match." /> : (
          <TableWrap pin>
            <PinnedHead><tr>
              <Th>Account</Th><Th>Verified <Hint>Has entered an OTP at least once. Accounts without it were created by checkout auto-login, which signs a buyer in on a typed mobile number alone — so the name on the order is claimed, not proven.</Hint></Th><Th align="right">Orders</Th>
              <Th align="right">Lifetime value</Th><Th align="right">Last seen</Th><Th>Status</Th>
            </tr></PinnedHead>
            <tbody>
              {rows.map((u) => (
                <Tr key={u.id} onClick={() => setOpen(u.id)} active={open === u.id}>
                  <Td>
                    <div className="font-medium">{u.name || "—"}</div>
                    <div className="text-[11px] text-faint font-mono">{u.phone}{u.email ? ` · ${u.email}` : ""}</div>
                  </Td>
                  <Td>{u.verified ? <Tag>OTP</Tag> : <span className="text-[11px] text-faint">auto-login only</span>}</Td>
                  <Td align="right">
                    <span className="font-medium">{num(u.paid_orders)}</span>
                    <span className="text-faint"> / {num(u.orders)}</span>
                  </Td>
                  <Td align="right" className="font-medium">{rupees(u.ltv_paise)}</Td>
                  <Td align="right" dim>{ago(u.last_seen_at)}</Td>
                  <Td><Chip tone={u.status}>{u.status}</Chip></Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <UserDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />
    </>
  );
}

function UserDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<UserDetail | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (!id) return;
    adminApi.get(`/users/${id}`).then(setD).catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => { setD(null); setErr(""); reload(); }, [id, reload]);

  const toggle = async () => {
    if (!d) return;
    setBusy(true); setErr("");
    try {
      await adminApi.post(`/users/${d.id}/status`, { status: d.status === "active" ? "suspended" : "active" });
      reload(); onChanged();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const p = d?.profile || {};
  const list = (v?: string[]) => (v && v.length ? v.join(", ") : null);
  const birth = (d?.birth || {}) as Record<string, string | number>;

  return (
    <Drawer open={!!id} onClose={onClose}
            title={d ? (d.name || d.phone) : ""}
            sub={d ? `${d.isd_code} ${d.phone} · joined ${when(d.created_at, false)}` : undefined}>
      {err && <ErrorNote error={err} />}
      {!d ? <Loading /> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={d.status}>{d.status}</Chip>
            {d.verified ? <Tag>OTP-verified</Tag> : <Tag>never verified</Tag>}
            <Btn tone={d.status === "active" ? "danger" : "brass"} onClick={toggle} busy={busy}>
              {d.status === "active" ? "Suspend account" : "Restore account"}
            </Btn>
          </div>

          <div>
            <SubHead>Account</SubHead>
            <Facts rows={[
              ["Name", d.name || "not given"],
              ["Email", d.email || "not given"],
              ["Verified", d.verified ? `yes, ${when(d.verified_at)}` : "no — every session came from checkout auto-login"],
              ["Last seen", ago(d.last_seen_at)],
              ["Lifetime value", <span className="font-medium">{rupees(d.ltv_paise)}</span>],
              ["Orders", `${d.orders.length} on this account`]
            ]} />
          </div>

          {!!Object.keys(p).length && (
            <div>
              <SubHead>What they told us</SubHead>
              <Facts rows={([
                ["Ishta devta", p.ishta_devta],
                ["Tradition", p.tradition],
                ["Gotra", p.gotra],
                ["City", p.city],
                ["Languages", list(p.languages)],
                ["Interests", list(p.interests)],
                ["Practices", list(p.practices)],
                ["Looking for", p.looking_for],
                ["Notes", p.notes]
              ] as [string, string | null | undefined][]).filter(([, v]) => v)} />
            </div>
          )}

          {!!Object.keys(birth).length && (
            <div>
              <SubHead>Saved birth details</SubHead>
              <Facts rows={[
                ["Name", birth.name as string],
                ["Born", `${birth.dob ?? "—"} ${birth.tob ?? ""}`],
                ["Place", birth.pob as string]
              ]} />
            </div>
          )}

          <div>
            <SubHead right={<span className="text-[11px] text-faint">{d.orders.length}</span>}>Orders</SubHead>
            {!d.orders.length ? <Empty label="No orders." /> : (
              <div className="rounded-lg border border-line overflow-hidden">
                <TableWrap>
                  <thead><tr><Th>Order</Th><Th>Report</Th><Th>Status</Th><Th align="right">Amount</Th><Th align="right">When</Th></tr></thead>
                  <tbody>
                    {d.orders.map((o) => (
                      <Tr key={o.public_id}>
                        <Td mono>{o.public_id}</Td>
                        <Td>{o.report_name}</Td>
                        <Td><Chip tone={o.status}>{o.status}</Chip></Td>
                        <Td align="right">{rupees(o.amount_paise)}</Td>
                        <Td align="right" dim>{when(o.created_at, false)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>
            )}
          </div>

          {!!d.unclaimed_orders.length && (
            <div>
              <SubHead>Orders on this number, not on this account</SubHead>
              <ul className="mt-2 space-y-1 text-[12px] text-muted">
                {d.unclaimed_orders.map((o) => (
                  <li key={o.public_id} className="font-mono">{o.public_id} · {o.status} · {rupees(o.amount_paise)}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
