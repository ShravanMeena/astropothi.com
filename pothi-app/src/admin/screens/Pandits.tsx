import { useCallback, useEffect, useState } from "react";
import { adminApi, rupees, num, when, ago, ms } from "../api";
import type { PanditRow, PanditDetail, Catalogue } from "../types";
import { Panel, TableWrap, PinnedHead, Th, Td, Tr, Chip, Tag, Loading, Empty, ErrorNote, Btn, Drawer, Facts, SubHead, Hint, Stat, StatRow } from "../ui";

export default function Pandits() {
  const [rows, setRows] = useState<PanditRow[]>([]);
  const [pilot, setPilot] = useState<Catalogue["pilot"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    Promise.all([adminApi.get("/pandits"), adminApi.get("/ops/catalogue")])
      .then(([p, c]) => { setRows(p); setPilot((c as Catalogue).pilot); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <>
      {pilot && (
        <Panel title="Pilot" sub={pilot.on ? "Invite-only, nothing for sale." : "Not running — paid credit packs are live."}
               className="mb-4">
          <StatRow cols={4}>
            <Stat label="Seats" value={num(pilot.seats)} />
            <Stat label="Taken" value={num(pilot.seats_taken)} tone="brass" />
            <Stat label="Left" value={num(pilot.seats_left)} tone={pilot.seats_left ? "plain" : "ember"} />
            <Stat label="Free reports each" value={num(pilot.free_reports)} sub="1 credit per report while the pilot runs" />
          </StatRow>
        </Panel>
      )}

      <Panel title="Astrologers" sub={`${num(rows.length)} account${rows.length === 1 ? "" : "s"}`}>
        {err && <ErrorNote error={err} />}
        {loading ? <Loading /> : !rows.length ? <Empty label="No astrologers yet." /> : (
          <TableWrap pin>
            <PinnedHead><tr>
              <Th w="52px">Seat</Th><Th>Account</Th><Th align="right">Credits</Th>
              <Th align="right">Reports</Th><Th align="right">Paid us <Hint>What this astrologer spent on credit packs — real platform revenue. What he charges his own clients is his, is an estimate from prices he sets himself, and is not ours.</Hint></Th><Th align="right">Last seen</Th><Th>Status</Th>
            </tr></PinnedHead>
            <tbody>
              {rows.map((p) => (
                <Tr key={p.id} onClick={() => setOpen(p.id)} active={open === p.id}>
                  <Td align="right" dim>{p.pilot_seat ?? "—"}</Td>
                  <Td>
                    <div className="font-medium">
                      {p.name || p.business_name || "—"} {p.is_admin && <Tag>staff</Tag>}
                    </div>
                    <div className="text-[11px] text-faint font-mono">{p.phone}{p.city ? ` · ${p.city}` : ""}</div>
                  </Td>
                  <Td align="right" className="font-medium">{num(p.balance)}</Td>
                  <Td align="right">{num(p.reports_ready)}</Td>
                  <Td align="right">{rupees(p.spent_paise)}</Td>
                  <Td align="right" dim>{ago(p.last_seen_at)}</Td>
                  <Td><Chip tone={p.status}>{p.status}</Chip></Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <PanditDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />
    </>
  );
}

function PanditDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<PanditDetail | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const reload = useCallback(() => {
    if (!id) return;
    adminApi.get(`/pandits/${id}`).then(setD).catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => { setD(null); setErr(""); reload(); }, [id, reload]);

  const act = async (what: string, fn: () => Promise<unknown>) => {
    setBusy(what); setErr("");
    try { await fn(); reload(); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(""); }
  };

  const b = d?.branding;

  return (
    <Drawer open={!!id} onClose={onClose}
            title={d ? (d.name || d.business_name || d.phone) : ""}
            sub={d ? `${d.phone}${d.pilot_seat ? ` · pilot seat ${d.pilot_seat}` : ""}` : undefined}>
      {err && <ErrorNote error={err} />}
      {!d ? <Loading /> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={d.status}>{d.status}</Chip>
            {d.is_admin && <Tag>staff</Tag>}
            <Btn tone={d.status === "active" ? "danger" : "brass"} busy={busy === "status"}
                 onClick={() => act("status", () => adminApi.post(`/pandits/${d.id}/status`,
                   { status: d.status === "active" ? "suspended" : "active" }))}>
              {d.status === "active" ? "Suspend" : "Restore"}
            </Btn>
            {d.pilot_seat
              ? <Btn tone="danger" busy={busy === "pilot"}
                     onClick={() => act("pilot", () => adminApi.post(`/pandits/${d.id}/pilot`, { grant: false }))}>
                  Revoke pilot seat
                </Btn>
              : <Btn tone="brass" busy={busy === "pilot"}
                     onClick={() => act("pilot", () => adminApi.post(`/pandits/${d.id}/pilot`, { grant: true }))}>
                  Grant pilot seat
                </Btn>}
          </div>

          <StatRow cols={3}>
            <Stat label="Credit balance" value={num(d.balance)} tone="brass" sub="SUM(ledger), never a stored column" />
            <Stat label="Reports made" value={num(d.reports.filter((r) => r.status === "ready").length)} />
            <Stat label="Paid us" value={rupees(d.purchases.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount_paise, 0))} />
          </StatRow>

          <div>
            <SubHead>Account</SubHead>
            <Facts rows={[
              ["Business", d.business_name || "—"],
              ["Email", d.email || "—"],
              ["Location", [d.city, d.state].filter(Boolean).join(", ") || "—"],
              ["GSTIN", d.gstin || "—"],
              ["Invite code", d.invite_code || "—"],
              ["Trial granted", d.trial_granted_at ? when(d.trial_granted_at) : "no"],
              ["Joined", when(d.created_at, false)],
              ["Last seen", ago(d.last_seen_at)]
            ]} />
          </div>

          {b && (
            <div>
              <SubHead>Branding on his PDFs</SubHead>
              <Facts rows={[
                ["Display name", [b.honorific, b.display_name].filter(Boolean).join(" ") || "—"],
                ["Shop", b.shop_name as string],
                ["Contact", [b.whatsapp || b.phone, b.email].filter(Boolean).join(" · ") || "—"],
                ["Tagline", b.tagline as string],
                ["Chart style", b.chart_style as string],
                ["Defaults", `${b.default_design} · ${b.default_palette} · ${b.default_language}`],
                ["Identity changes", `${b.changes_this_quarter ?? 0} this quarter`],
                ["Assets", [b.logo_url && "logo", b.photo_url && "photo", b.signature_url && "signature"].filter(Boolean).join(", ") || "none"]
              ]} />
            </div>
          )}

          <div>
            <SubHead>His prices</SubHead>
            <div className="rounded-lg border border-line overflow-hidden">
              <TableWrap>
                <thead><tr><Th>Report</Th><Th align="right">He charges</Th></tr></thead>
                <tbody>
                  {d.prices.map((p) => (
                    <Tr key={p.report_type}>
                      <Td>{p.name_en}</Td>
                      <Td align="right" dim={p.sale_price_paise === null}>
                        {p.sale_price_paise === null ? "not set" : rupees(p.sale_price_paise)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </div>

          <div>
            <SubHead right={<span className="text-[11px] text-faint">{d.ledger.length} entries</span>}>Credit ledger</SubHead>
            {!d.ledger.length ? <Empty label="No ledger entries." /> : (
              <div className="rounded-lg border border-line overflow-hidden">
                <TableWrap>
                  <thead><tr><Th align="right" w="60px">Δ</Th><Th>Reason</Th><Th>Note</Th><Th align="right">When</Th></tr></thead>
                  <tbody>
                    {d.ledger.map((l) => (
                      <Tr key={l.id}>
                        <Td align="right" className={l.delta > 0 ? "text-brass font-medium" : "text-muted"}>
                          {l.delta > 0 ? `+${l.delta}` : l.delta}
                        </Td>
                        <Td>{l.reason}</Td>
                        <Td dim>{l.note || (l.ref_type ? `${l.ref_type} ${l.ref_id ?? ""}` : "—")}</Td>
                        <Td align="right" dim>{when(l.created_at, false)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>
            )}
          </div>

          <div>
            <SubHead>Credit purchases</SubHead>
            {!d.purchases.length ? <Empty label="No purchases." /> : (
              <div className="rounded-lg border border-line overflow-hidden">
                <TableWrap>
                  <thead><tr><Th>Status</Th><Th align="right">Amount</Th><Th align="right">Credits</Th><Th>Invoice</Th><Th align="right">When</Th></tr></thead>
                  <tbody>
                    {d.purchases.map((c) => (
                      <Tr key={c.id}>
                        <Td><Chip tone={c.status}>{c.status}</Chip></Td>
                        <Td align="right">{rupees(c.amount_paise)}</Td>
                        <Td align="right">{num(c.credits)}</Td>
                        <Td mono dim>{c.invoice_no || "—"}</Td>
                        <Td align="right" dim>{when(c.created_at, false)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>
            )}
          </div>

          <div>
            <SubHead>Recent reports</SubHead>
            {!d.reports.length ? <Empty label="None generated." /> : (
              <div className="rounded-lg border border-line overflow-hidden">
                <TableWrap>
                  <thead><tr><Th>Report</Th><Th>For</Th><Th align="right">Pages</Th><Th align="right">Time</Th><Th /></tr></thead>
                  <tbody>
                    {d.reports.map((r) => (
                      <Tr key={r.id}>
                        <Td>{r.report_name}</Td>
                        <Td dim>{r.subject_name || "—"}</Td>
                        <Td align="right">{r.page_count ?? "—"}</Td>
                        <Td align="right" dim>{ms(r.generated_ms)}</Td>
                        <Td align="right">
                          {r.pdf_url && <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-brass underline">PDF</a>}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
