import { useEffect, useState } from "react";
import { adminApi, rupees, num, pct, ms, when } from "../api";
import type { Overview as OverviewData, Window } from "../types";
import { Panel, Stat, StatRow, TableWrap, Th, Td, Tr, Loading, ErrorNote, Note, DayChart, FunnelBar, Segmented, Chip } from "../ui";

const WINDOWS: { value: Window; label: string }[] = [
  { value: "today", label: "Today" }, { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" }, { value: "all", label: "All time" }
];

export default function Overview({ window: w, setWindow }: { window: Window; setWindow: (w: Window) => void }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    setErr("");
    adminApi.get(`/overview?window=${w}`)
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [w]);

  if (err) return <ErrorNote error={err} />;
  if (!data) return <Loading />;

  const { funnel, revenue, by_type, by_day, reports, audience } = data;
  const c = revenue.consumer, p = revenue.pandit;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={w} onChange={setWindow} options={WINDOWS} />
        <span className="text-[11px] text-faint">
          as of {when(data.generated_at)} IST
        </span>
      </div>

      {/* ── Money ────────────────────────────────────────────────────────────
          Two panels, never one. The platform has two products sold to two
          audiences; a single "revenue" figure across both would be the sum of
          a book and a wholesale credit pack, which is not a quantity. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Consumers" sub="One person buying one report at retail.">
          <StatRow cols={3}>
            <Stat label="Gross" value={rupees(c.gross_paise)} tone="brass"
                  sub={`${num(c.orders)} paid order${c.orders === 1 ? "" : "s"} · incl. GST`} />
            <Stat label="GST (18%)" value={rupees(c.gst_paise)} sub="already inside gross" />
            <Stat label="Net" value={rupees(c.net_paise)} sub="gross − GST — what we keep" />
          </StatRow>
          <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
            <Stat label="Average order" value={rupees(c.aov_paise)} />
            <Stat label="Refunded" value={rupees(c.refunded_paise)}
                  tone={c.refunded_paise ? "ember" : "plain"}
                  sub={c.refunded_orders ? `${num(c.refunded_orders)} order(s) · net of refunds ${rupees(c.net_of_refunds_paise)}` : "none"} />
          </div>
        </Panel>

        <Panel title="Astrologers" sub="Credit packs bought wholesale by pandits.">
          <StatRow cols={3}>
            <Stat label="Gross" value={rupees(p.gross_paise)} tone="brass"
                  sub={`${num(p.purchases)} purchase${p.purchases === 1 ? "" : "s"} · incl. GST`} />
            <Stat label="GST (18%)" value={rupees(p.gst_paise)} sub="already inside gross" />
            <Stat label="Net" value={rupees(p.net_paise)} sub="gross − GST" />
          </StatRow>
          <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
            <Stat label="Average pack" value={rupees(p.aov_paise)} />
            <Stat label="Credits sold" value={num(p.credits_sold)} sub="capacity, not revenue" />
          </div>
        </Panel>
      </div>

      <Note>
        These two lines are never added together, here or anywhere else in this panel.
        They are different products bought by different people, and one combined figure would
        answer no question anybody has. Note also that the pandit console's “estimated earnings”
        is a third number again — that is what a pandit charges <em>his</em> clients, it is an
        estimate from prices he set himself, and none of it is Pothi's money.
      </Note>

      {/* ── Funnel ─────────────────────────────────────────────────────────── */}
      <Panel title="Where orders go"
             sub={`${num(funnel.orders_created)} created · ${num(funnel.orders_paid)} paid · ${pct(funnel.conversion_pct)} conversion`}>
        <FunnelBar total={funnel.orders_created} segments={[
          { label: "Delivered", count: funnel.by_status.ready?.count || 0, tone: "brass" },
          { label: "Paid, generating", count: (funnel.by_status.paid?.count || 0) + (funnel.by_status.generating?.count || 0), tone: "brass" },
          { label: "Paid, failed to generate", count: funnel.failed, tone: "ember" },
          { label: "Refunded", count: funnel.by_status.refunded?.count || 0, tone: "ember" },
          { label: "Never paid", count: funnel.abandoned, tone: "muted" }
        ]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line">
          <Stat label="Abandoned at checkout" value={num(funnel.abandoned)}
                sub={`${rupees(funnel.abandoned_paise)} of links issued and never paid`} />
          <Stat label="Paid but undelivered" value={num(funnel.failed)}
                tone={funnel.failed ? "ember" : "plain"}
                sub={`${rupees(funnel.failed_paise)} taken, no book sent — retry these first`} />
        </div>
        <Note>
          “Paid but undelivered” is money we hold for a report that failed to render. It <em>is</em>
          counted in consumer gross above, because the payment cleared — leaving it out would hide
          the most expensive rows in the table from the person who has to fix them.
        </Note>
      </Panel>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <Panel title="Revenue by day" sub="IST days. Empty days are drawn as zero, not skipped.">
        <DayChart rows={by_day} />
      </Panel>

      {/* ── By type ────────────────────────────────────────────────────────── */}
      <Panel title="Consumer revenue by report">
        <TableWrap>
          <thead><tr>
            <Th>Report</Th><Th align="right">List price</Th><Th align="right">Paid orders</Th>
            <Th align="right">Gross</Th><Th align="right">Net</Th><Th align="right">Share</Th>
          </tr></thead>
          <tbody>
            {by_type.map((t) => (
              <Tr key={t.report_type}>
                <Td>
                  <div className="font-medium">{t.name_en}</div>
                  <div className="text-[11px] text-faint deva">{t.name_hi}</div>
                </Td>
                <Td align="right" dim>{rupees(t.list_price_paise)}</Td>
                <Td align="right">{num(t.orders)}</Td>
                <Td align="right" className="font-medium">{rupees(t.gross_paise)}</Td>
                <Td align="right" dim>{rupees(t.net_paise)}</Td>
                <Td align="right" dim>
                  {c.gross_paise ? `${((t.gross_paise / c.gross_paise) * 100).toFixed(0)}%` : "—"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      {/* ── Health & audience ──────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Generation" sub="Reports rendered in this window.">
          <StatRow cols={3}>
            <Stat label="Rendered" value={num(reports.total)}
                  sub={reports.by_source.map((s) => `${s.count} ${s.source}`).join(" · ")} />
            <Stat label="Failed" value={num(reports.failed)} tone={reports.failed ? "ember" : "plain"} />
            <Stat label="Typical time" value={ms(reports.avg_ms)} sub={`slowest ${ms(reports.max_ms)}`} />
          </StatRow>
        </Panel>

        <Panel title="Audience" sub="Totals are all-time — only “new” follows the window above.">
          <StatRow cols={4}>
            <Stat label="Buyers" value={num(audience.users.total)}
                  sub={`${num(audience.users.verified)} OTP-verified · ${num(audience.users.joined_in_window)} new`} />
            <Stat label="Suspended" value={num(audience.users.suspended)}
                  tone={audience.users.suspended ? "ember" : "plain"} sub="buyer accounts, right now" />
            <Stat label="Astrologers" value={num(audience.pandits.total)}
                  sub={`${num(audience.pandits.seated)} seated · ${num(audience.pandits.joined_in_window)} new`} />
            <Stat label="Staff" value={num(audience.pandits.admins)} sub="accounts with admin" />
          </StatRow>
          {audience.users.verified < audience.users.total && (
            <Note>
              {num(audience.users.total - audience.users.verified)} buyer account(s) have never entered an OTP.
              That is checkout auto-login working as configured (<code>AUTO_LOGIN_ON_ORDER</code>), not a fault —
              but it does mean those accounts have not proved they own their number.
            </Note>
          )}
        </Panel>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {Object.entries(funnel.by_status).map(([s, v]) => (
          <span key={s} className="inline-flex items-center gap-2 rounded-lg border border-line bg-raised px-2.5 py-1.5">
            <Chip tone={s}>{s}</Chip>
            <span className="text-[12px] tabular-nums text-fg font-medium">{num(v.count)}</span>
            <span className="text-[11px] tabular-nums text-faint">{rupees(v.gross_paise)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
