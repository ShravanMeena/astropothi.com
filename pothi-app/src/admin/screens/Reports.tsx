import { useCallback, useEffect, useState } from "react";
import { adminApi, num, when, ms } from "../api";
import type { ReportRow, Catalogue } from "../types";
import { Panel, TableWrap, PinnedHead, Th, Td, Tr, Chip, Tag, Loading, Empty, ErrorNote, Search, Segmented, Note } from "../ui";

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

  useEffect(() => { adminApi.get("/ops/catalogue").then((c: Catalogue) => setTypes(c.reports)).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    adminApi.get(`/reports?source=${source}&status=${status}&report_type=${type}&q=${encodeURIComponent(q)}&limit=200`)
      .then((d) => { setRows(d.reports); setTotal(d.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [source, status, type, q]);

  useEffect(load, [load]);

  const timed = rows.filter((r) => r.generated_ms !== null).length;

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
            <Th align="right">Pages</Th><Th align="right">Time</Th><Th>Status</Th><Th align="right">Made</Th><Th />
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
                  {r.pdf_url
                    ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-brass underline whitespace-nowrap">PDF</a>
                    : <span className="text-faint">—</span>}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {!loading && timed < rows.length && (
        <Note>
          {rows.length - timed} of these have no generation time recorded. Consumer reports were not timed
          before this panel existed; new ones are. There is no way to recover the figure for older rows,
          so the column stays blank rather than showing a made-up number.
        </Note>
      )}
      <Note>
        A report failing to generate is not the same as an order failing. A pandit's failed generate is rolled
        back inside its transaction and costs him no credit, so it usually leaves no row here at all — the place
        to look for those is the order list.
      </Note>
    </Panel>
  );
}
