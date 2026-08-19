import { useEffect, useState } from "react";
import { adminApi, rupees, num, ms, when } from "../api";
import type { Overview as OverviewData, Window } from "../types";
import {
  Panel, TableWrap, PinnedHead, Th, Td, Tr, Loading, ErrorNote, Segmented,
  DayChart, Spark, Metric, Mini, Ring, BarRow, Tile, Chip
} from "../ui";

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
  const topType = Math.max(1, ...by_type.map((t) => t.gross_paise));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={w} onChange={setWindow} options={WINDOWS} />
        <span className="text-[11px] text-faint">{when(data.generated_at)} IST</span>
      </div>

      {/* Two products, two audiences, two cards. Never one total — the tooltip
          carries the reason so the card can just show the money. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card relative overflow-hidden lamp">
          <div className="relative z-10 p-5">
            <Metric foil value={rupees(c.gross_paise)} label="Consumers · gross"
                    hint="Retail sales to buyers. Kept separate from astrologer revenue — they are different products bought by different people, so one combined total would answer no question." />
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Mini label="Net" value={rupees(c.net_paise)} />
              <Mini label="GST 18%" value={rupees(c.gst_paise)} />
              <Mini label="Avg order" value={rupees(c.aov_paise)} />
            </div>
          </div>
          <div className="px-px">
            <Spark values={by_day.map((d) => d.consumer_gross_paise)} />
          </div>
          <div className="relative z-10 flex items-center justify-between px-5 py-2.5 border-t border-line text-[11.5px]">
            <span className="text-muted">{num(c.orders)} paid orders</span>
            {c.refunded_paise > 0
              ? <span className="text-ember">{rupees(c.refunded_paise)} refunded</span>
              : <span className="text-faint">no refunds</span>}
          </div>
        </section>

        <section className="card relative overflow-hidden">
          <div className="relative z-10 p-5">
            <Metric value={rupees(p.gross_paise)} label="Astrologers · gross"
                    hint="Credit packs bought wholesale by pandits. What a pandit charges HIS clients is a third number again — an estimate from prices he sets himself, and not Pothi's money." />
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Mini label="Net" value={rupees(p.net_paise)} />
              <Mini label="GST 18%" value={rupees(p.gst_paise)} />
              <Mini label="Avg pack" value={rupees(p.aov_paise)} />
            </div>
          </div>
          <div className="px-px">
            <Spark values={by_day.map((d) => d.pandit_gross_paise)} tone="muted" />
          </div>
          <div className="relative z-10 flex items-center justify-between px-5 py-2.5 border-t border-line text-[11.5px]">
            <span className="text-muted">{num(p.purchases)} purchases</span>
            <span className="text-faint">{num(p.credits_sold)} credits</span>
          </div>
        </section>
      </div>

      {/* The funnel, as a shape. Two numbers matter: what never paid, and what
          paid and never arrived. */}
      <Panel>
        <div className="grid gap-5 lg:grid-cols-[auto_1fr] items-center p-5">
          <Ring pct={funnel.conversion_pct} label="Created → paid"
                sub={`${num(funnel.orders_paid)} of ${num(funnel.orders_created)} orders`} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile label="Delivered" value={num(funnel.by_status.ready?.count || 0)} tone="brass" />
            <Tile label="In flight"
                  value={num((funnel.by_status.paid?.count || 0) + (funnel.by_status.generating?.count || 0))} />
            <Tile label="Never paid" value={num(funnel.abandoned)}
                  hint={`${rupees(funnel.abandoned_paise)} of payment links issued and never paid.`} />
            <Tile label="Paid, undelivered" value={num(funnel.failed)}
                  tone={funnel.failed ? "ember" : "plain"}
                  hint={`${rupees(funnel.failed_paise)} taken for reports that failed to render. Counted in gross above, because the payment cleared — retry these first.`} />
          </div>
        </div>
      </Panel>

      <Panel title="Revenue by day" sub="IST days">
        <DayChart rows={by_day} />
      </Panel>

      {/* Was a six-column table. Now it is a ranked bar chart, which is the only
          question anyone asked of it: what sells. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="What sells" sub="Consumer gross by report">
          <div className="py-1">
            {by_type.map((t) => (
              <BarRow key={t.report_type} label={t.name_en} value={t.gross_paise} max={topType}
                      right={rupees(t.gross_paise)}
                      sub={t.orders ? `${t.orders}×` : "—"} tone={t.gross_paise ? "brass" : "muted"} />
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Tile label="Rendered" value={num(reports.total)} />
            <Tile label="Failed" value={num(reports.failed)} tone={reports.failed ? "ember" : "plain"} />
            <Tile label="Typical" value={ms(reports.avg_ms)}
                  hint={`Averaged over successful renders only. Slowest in this window: ${ms(reports.max_ms)}.`} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Tile label="Buyers" value={num(audience.users.total)}
                  hint={`All-time total. ${num(audience.users.joined_in_window)} joined in this window; ${num(audience.users.verified)} have ever entered an OTP.`} />
            <Tile label="Astrologers" value={num(audience.pandits.total)}
                  hint={`${num(audience.pandits.seated)} hold a pilot seat.`} />
            <Tile label="Suspended"
                  value={num(audience.users.suspended + audience.pandits.suspended)}
                  tone={audience.users.suspended + audience.pandits.suspended ? "ember" : "plain"}
                  hint="Accounts suspended right now, across buyers and astrologers. Not affected by the window." />
          </div>
          <Panel title="Order states">
            <TableWrap>
              <PinnedHead><tr>
                <Th>State</Th><Th align="right">Orders</Th><Th align="right">Value</Th>
              </tr></PinnedHead>
              <tbody>
                {Object.entries(funnel.by_status).map(([s, v]) => (
                  <Tr key={s}>
                    <Td><Chip tone={s}>{s}</Chip></Td>
                    <Td align="right">{num(v.count)}</Td>
                    <Td align="right" dim={!v.gross_paise}>{rupees(v.gross_paise)}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          </Panel>
        </div>
      </div>
    </div>
  );
}
