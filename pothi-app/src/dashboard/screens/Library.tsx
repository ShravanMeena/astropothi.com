import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import type { Report } from "../types";
import PdfModal from "../components/PdfModal";

type Client = {
  id: string; name: string; phone?: string; dob?: string; tob?: string; pob?: string;
};
type Tab = "reports" | "clients";

export default function Library({ onCreate }: { onCreate: () => void }) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const [tab, setTab] = useState<Tab>("reports");
  const [rows, setRows] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bdays, setBdays] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Report | null>(null);

  useEffect(() => { api.get("/api/v1/reports").then(setRows).catch(() => {}); }, []);
  useEffect(() => {
    if (tab !== "clients") return;
    api.get(`/api/v1/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setClients).catch(() => {});
  }, [tab, q]);
  useEffect(() => { api.get("/api/v1/clients/birthdays?days=7").then(setBdays).catch(() => {}); }, []);

  const shownReports = rows.filter((r) =>
    !q || (r.Client?.name || "").toLowerCase().includes(q.toLowerCase()) || r.report_type.includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="inline-flex rounded-xl border border-line bg-raised p-1">
          {(["reports", "clients"] as Tab[]).map((x) => (
            <button key={x} onClick={() => setTab(x)}
              className={`px-4 h-9 rounded-lg text-[13.5px] font-semibold transition ${dv}
                ${tab === x ? "bg-fg text-surface" : "text-muted hover:text-fg"}`}>
              {x === "reports" ? t.clients.reports : t.clients.tab}
            </button>
          ))}
        </div>
        <input className="field sm:max-w-xs" value={q} onChange={(e) => setQ(e.target.value)}
               placeholder={tab === "clients" ? t.clients.search : "Search…"} />
      </div>

      {/* The annuity: every client needs a fresh Varshaphal each year. */}
      {tab === "clients" && (
        <div className="card p-5">
          <h3 className={`display text-[18px] mb-3 ${dv}`}>{t.clients.birthdays}</h3>
          {bdays.length === 0
            ? <p className={`text-[13.5px] text-faint ${dv}`}>{t.clients.bdayNone}</p>
            : <div className="flex flex-wrap gap-2">
                {bdays.map((c) => (
                  <button key={c.id} onClick={onCreate}
                          className="chip bg-brassSoft text-brass hover:bg-brass/50 h-9 px-3">
                    <span className="deva font-semibold">{c.name}</span>
                    <span className="opacity-70">· {c.dob}</span>
                  </button>
                ))}
              </div>}
        </div>
      )}

      {tab === "reports" && (
        shownReports.length === 0
          ? <div className="card p-10 text-center text-[14px] text-faint">{t.dash.empty}</div>
          : <div className="card overflow-hidden">
              <table className="hidden sm:table w-full text-[13.5px]">
                <thead>
                  <tr className="text-left text-muted border-b border-line/70">
                    {["Client", "Report", "Design", "Pages", "Credits", ""].map((h) => (
                      <th key={h} className="font-semibold px-5 py-3">{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {shownReports.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-sunken/60">
                      <td className="px-5 py-3 deva font-medium">{r.Client?.name || "—"}</td>
                      <td className="px-5 py-3 text-muted">{r.report_type}</td>
                      <td className="px-5 py-3 text-muted">{r.design} · {r.palette}</td>
                      <td className="px-5 py-3 text-muted">{r.page_count}</td>
                      <td className="px-5 py-3 text-muted">{r.credits_charged}</td>
                      <td className="px-5 py-3 text-right">
                        <button className="btn-line btn-sm" onClick={() => setOpen(r)}>PDF</button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
              <div className="sm:hidden divide-y divide-line">
                {shownReports.map((r) => (
                  <button key={r.id} onClick={() => setOpen(r)} className="w-full text-left flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <div className="font-medium deva truncate">{r.Client?.name || "—"}</div>
                      <div className="text-[12px] text-faint">{r.report_type} · {r.design} · {r.page_count}pp</div>
                    </div>
                    <span className="text-[12px] font-semibold text-muted ml-3 shrink-0">PDF →</span>
                  </button>))}
              </div>
            </div>
      )}

      {tab === "clients" && (
        clients.length === 0
          ? <div className={`card p-10 text-center text-[14px] text-faint ${dv}`}>{t.clients.empty}</div>
          : <div className="card overflow-hidden divide-y divide-line">
              {clients.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="font-medium deva truncate">{c.name}</div>
                    <div className="text-[12px] text-faint truncate">
                      {[c.dob && `${t.clients.born} ${c.dob}${c.tob ? ` · ${c.tob}` : ""}`, c.pob, c.phone]
                        .filter(Boolean).join("  ·  ") || t.clients.none}
                    </div>
                  </div>
                  <button className="btn-line btn-sm shrink-0" onClick={onCreate}>{t.clients.newReport}</button>
                </div>))}
            </div>
      )}

      {open && (
        <PdfModal url={open.pdf_url} title={open.Client?.name || open.report_type}
                  subtitle={`${open.report_type} · ${open.design} · ${open.palette} · ${open.page_count} pp`}
                  onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
