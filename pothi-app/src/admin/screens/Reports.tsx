import { useCallback, useEffect, useState } from "react";
import { adminApi, num, when, ms } from "../api";
import type { ReportRow, Catalogue } from "../types";
import { Panel, TableWrap, PinnedHead, Th, Td, Tr, Chip, Tag, Loading, Empty, ErrorNote, Search, Segmented, Hint, Btn, Confirm } from "../ui";

const SOURCES = [{ value: "all", label: "All" }, { value: "consumer", label: "Consumer" }, { value: "pandit", label: "Astrologer" }];
const STATUSES = [{ value: "all", label: "Any" }, { value: "ready", label: "Ready" }, { value: "failed", label: "Failed" }, { value: "generating", label: "Generating" }];

export default function Reports() {
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [types, setTypes] = useState<Catalogue["reports"]>([]);
  const [busy, setBusy] = useState("");
  // { row, force } — force is set when the server has told us it is a paid report.
  const [pending, setPending] = useState<{ row: ReportRow; force: boolean } | null>(null);
  const [warn, setWarn] = useState("");

  useEffect(() => { adminApi.get("/ops/catalogue").then((c: Catalogue) => setTypes(c.reports)).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    adminApi.get(`/reports?source=${source}&status=${status}&report_type=${type}&q=${encodeURIComponent(q)}&limit=200`)
      .then((d) => { setRows(d.reports); setTotal(d.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [source, status, type, q]);

  useEffect(load, [load]);

  async function setStatusOf(r: ReportRow, status: string) {
    setBusy(r.id); setErr("");
    try { await adminApi.post(`/reports/${r.id}/status`, { status }); load(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }

  /**
   * Delete asks once, and asks a second time only when the server says the
   * report belongs to a paid order — so clearing test rows is one click and
   * removing a buyer's only report is not.
   */
  async function doDelete(r: ReportRow, force: boolean) {
    setBusy(r.id); setErr("");
    try {
      await adminApi.del(`/reports/${r.id}${force ? "?force=true" : ""}`);
      setPending(null); setWarn(""); load();
    } catch (e) {
      const err = e as Error & { body?: { needs_force?: boolean } };
      // The server, not the browser, decides when a second confirmation is
      // needed — it is the side that knows whether an order was paid.
      if (err.body?.needs_force) { setWarn(err.message); setPending({ row: r, force: true }); }
      else { setPending(null); setErr(err.message); }
    } finally { setBusy(""); }
  }

  return (
    <Panel title="Reports" sub={`${num(total)} generated`}
           right={<div className="flex flex-wrap items-center gap-2 justify-end">
             <Segmented value={source} onChange={setSource} options={SOURCES} />
             <Segmented value={status} onChange={setStatus} options={STATUSES} />
             <Search value={q} onChange={setQ} placeholder="Rashi, nakshatra, lagna, token" />
           </div>}>
      <div className="flex flex-wrap gap-1.5 px-4 sm:px-5 py-3 border-b border-line">
        <button onClick={() => setType("all")}
                className={`chip ${type === "all" ? "bg-fg text-surface" : "bg-sunken text-muted hover:text-fg"}`}>
          All reports
        </button>
        {types.map((t) => (
          <button key={t.code} onClick={() => setType(t.code)}
                  className={`chip ${type === t.code ? "bg-fg text-surface" : "bg-sunken text-muted hover:text-fg"}`}>
            {t.name_en}
          </button>
        ))}
      </div>

      {err && <ErrorNote error={err} />}
      {loading ? <Loading /> : !rows.length ? <Empty label="No reports match." /> : (
        <TableWrap pin>
          <PinnedHead><tr>
            <Th w="60px">Id</Th><Th>Report</Th><Th>For</Th><Th>Belongs to</Th>
            <Th align="right">Pages</Th><Th align="right">Time <Hint>Consumer reports were not timed before this panel existed, so older rows are blank. The figure is not recoverable, so nothing is shown rather than a guess.</Hint></Th><Th>Status</Th><Th align="right">Made</Th><Th />
          </tr></PinnedHead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td mono dim>{r.id}</Td>
                <Td>
                  <div>{r.report_name}</div>
                  <div className="text-[11px] text-faint">{r.design} · {r.palette} · {r.language}</div>
                </Td>
                <Td>
                  <div>{r.subject_name || "—"}</div>
                  <div className="text-[11px] text-faint">
                    {[r.rashi, r.nakshatra, r.lagna].filter(Boolean).join(" · ") || ""}
                  </div>
                </Td>
                <Td>
                  {r.owner
                    ? <><Tag>{r.owner.kind === "pandit" ? "astrologer" : "order"}</Tag>{" "}
                        <span className="text-muted">{r.owner.label}</span></>
                    : <span className="text-faint">unattached</span>}
                  {r.credits_charged > 0 && <div className="text-[11px] text-faint">{r.credits_charged} credit(s)</div>}
                </Td>
                <Td align="right">{r.page_count ?? "—"}</Td>
                <Td align="right" dim>{ms(r.generated_ms)}</Td>
                <Td>
                  <Chip tone={r.status}>{r.status}</Chip>
                  {r.error && <div className="mt-1 text-[10.5px] text-ember break-words max-w-[220px]">{r.error}</div>}
                </Td>
                <Td align="right" dim>{when(r.created_at)}</Td>
                <Td align="right">
                  <div className="flex items-center gap-2 justify-end">
                    {r.pdf_url
                      ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-brass underline whitespace-nowrap">PDF</a>
                      : <span className="text-faint">—</span>}
                    {/* Marking a report ready is a correction to the row, not a
                        re-render — the server refuses it when there is no PDF. */}
                    {r.status !== "ready" && r.pdf_url && (
                      <Btn busy={busy === r.id} onClick={() => setStatusOf(r, "ready")}>Mark ready</Btn>
                    )}
                    {r.status === "ready" && (
                      <Btn tone="quiet" busy={busy === r.id} onClick={() => setStatusOf(r, "failed")}>Mark failed</Btn>
                    )}
                    <Btn tone="danger" busy={busy === r.id} onClick={() => { setWarn(""); setPending({ row: r, force: false }); }}>Delete</Btn>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Confirm
        key={pending?.row.id || "none"}
        open={!!pending}
        tone="danger"
        confirmLabel={pending?.force ? "Delete anyway" : "Delete report"}
        busy={busy === pending?.row.id}
        title={pending?.force ? "This report belongs to a paid order" : `Delete report ${pending?.row.id}?`}
        onCancel={() => { setPending(null); setWarn(""); }}
        onConfirm={() => pending && doDelete(pending.row, pending.force)}
        body={warn
          ? <span className="text-ember">{warn}</span>
          : <>It disappears from every list here. The PDF file itself is left in storage —
             unpicking a file that has already been delivered is not something a click should do.</>}
      />
    </Panel>
  );
}
