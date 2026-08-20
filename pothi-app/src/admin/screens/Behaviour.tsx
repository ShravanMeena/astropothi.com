import { useEffect, useState } from "react";
import { adminApi, num, when, ago, rupees } from "../api";
import {
  Panel, TableWrap, Th, Td, Tr, Tag, Chip, Loading, Empty, ErrorNote,
  Segmented, Tile, Drawer, Note, SubHead, ActivityChart, FunnelSteps
} from "../ui";

type Step = { step: string; people: number; of_first: number; dropped: number };
type Day = { day: string; visitors: number; viewed: number; checkout: number; pay: number; events: number };
type Interest = { code: string | null; viewed: number; sampled: number; started: number; paid_click: number };
type Ev = {
  at: string; name: string; category: string; path: string | null;
  anonymous_id: string; session_id: string | null; user_id: string | null;
  source: string | null; campaign: string | null; props: Record<string, unknown> | null;
};
type Money = { source: string; medium?: string; campaign: string;
               orders?: number; paid?: number; buyers?: number; revenue_paise: string | number };
type Hop = {
  at: string; name: string; category: string; path: string | null;
  session: string | null; userId: string | null; props?: Record<string, unknown>;
};

/** How many raw events to show before asking. Enough to see a pattern, few
 *  enough that the charts above stay on the same screen. */
const EVENT_PREVIEW = 25;

const WINDOWS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" }
];

/**
 * What people do on the site, and where they stop doing it.
 *
 * Everything here counts DEVICES, not events: one person refreshing a report
 * page eleven times is one interested person, and a table that says eleven
 * would send us optimising the wrong thing.
 */
export default function Behaviour() {
  const [days, setDays] = useState("30");
  const [funnel, setFunnel] = useState<Step[] | null>(null);
  const [interest, setInterest] = useState<Interest[] | null>(null);
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [journey, setJourney] = useState<{ id: string; hops: Hop[] } | null>(null);
  const [byDay, setByDay] = useState<Day[] | null>(null);
  // The raw stream is exhaust, not a report. Two hundred rows inline made this
  // screen fourteen thousand pixels tall and buried every chart above it — the
  // signal was there, you just had to scroll past the log to disbelieve it.
  const [showAll, setShowAll] = useState(false);
  const [rev, setRev] = useState<Money[] | null>(null);
  const [acq, setAcq] = useState<Money[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setFunnel(null); setInterest(null); setEvents(null); setRev(null); setAcq(null); setByDay(null);
    adminApi.get(`/events/by-day?days=${days}`).then(setByDay).catch((e) => setErr(e.message));
    adminApi.get(`/events/funnel?days=${days}`).then(setFunnel).catch((e) => setErr(e.message));
    adminApi.get(`/events/by-report?days=${days}`).then(setInterest).catch((e) => setErr(e.message));
    adminApi.get(`/events?days=${days}&limit=200`).then(setEvents).catch((e) => setErr(e.message));
    adminApi.get(`/events/revenue-by-source?days=${days}`).then(setRev).catch((e) => setErr(e.message));
    adminApi.get(`/events/acquisition?days=${Math.max(90, Number(days))}`).then(setAcq).catch((e) => setErr(e.message));
  }, [days]);

  const openJourney = async (anonId: string) => {
    setJourney({ id: anonId, hops: [] });
    try { setJourney({ id: anonId, hops: await adminApi.get(`/events/journey/${anonId}`) }); }
    catch (e: any) { setErr(e.message); setJourney(null); }
  };

  const first = funnel?.[0]?.people ?? 0;

  /**
   * Percent change between the two halves of the window.
   *
   * Not against a separately-fetched previous period: the same series is already
   * here, and a second round trip to say "up 12%" is a second thing that can be
   * out of date with the first. Null until both halves have something in them —
   * a jump from zero is not a percentage, it is a first day.
   */
  const delta = (key: "visitors" | "checkout" | "pay") => {
    if (!byDay || byDay.length < 4) return null;
    const half = Math.floor(byDay.length / 2);
    const sum = (rows: Day[]) => rows.reduce((n, r) => n + r[key], 0);
    const before = sum(byDay.slice(0, half));
    const after = sum(byDay.slice(half));
    if (!before) return null;
    return ((after - before) / before) * 100;
  };

  // The step that loses the most people is the one worth fixing this week.
  const worst = (funnel || []).slice(1).reduce<Step | null>(
    (w, s) => (!w || s.dropped > w.dropped ? s : w), null);
  const maxViewed = Math.max(1, ...(interest || []).map((i) => i.viewed || 0));

  return (
    <div className="space-y-4">
      {err && <ErrorNote error={err} />}

      <div className="flex items-center justify-between gap-4">
        <Segmented value={days} onChange={setDays} options={WINDOWS} />
        {funnel && (
          <span className="text-[11.5px] text-faint">
            {num(first)} devices in this window
          </span>
        )}
      </div>

      {funnel && worst && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Tile label="Visitors" value={num(first)}
                series={byDay?.map((d) => d.visitors)} delta={delta("visitors")} />
          <Tile label="Reached checkout"
                value={num(funnel.find((s) => s.step === "Started checkout")?.people ?? 0)}
                series={byDay?.map((d) => d.checkout)} delta={delta("checkout")} />
          <Tile label="Pressed pay" tone="brass"
                value={num(funnel.find((s) => s.step === "Pressed pay")?.people ?? 0)}
                series={byDay?.map((d) => d.pay)} delta={delta("pay")} />
          <Tile label="Biggest drop" tone="ember" value={num(worst.dropped)}
                hint={`Between "${funnel[funnel.indexOf(worst) - 1]?.step}" and "${worst.step}"`} />
        </div>
      )}

      <Panel title="Activity, day by day"
             sub="Distinct devices per day, with the share of them that reached the pay button. Everything else on this screen is a total for the whole window — this is the only view that shows whether today is like last Tuesday.">
        {!byDay ? <Loading /> : byDay.every((d) => d.visitors === 0)
          ? <Empty label="No activity recorded in this window yet" />
          : <ActivityChart rows={byDay} />}
      </Panel>

      <Panel title="The funnel"
             sub="Distinct devices reaching each step, each bar as wide as the people who got there. A device that skipped a step — an ad landing straight on a report page — is counted where it actually arrived.">
        {!funnel ? <Loading /> : funnel[0]?.people === 0 ? (
          <Empty label="No events recorded in this window yet" />
        ) : (
          <FunnelSteps steps={funnel} worst={worst?.step} />
        )}
        <Note>
          Steps are counted independently, so a later step can exceed an earlier one — that is a
          signal, not a bug: it means people are arriving mid-funnel from an ad or a shared link.
        </Note>
      </Panel>

      <Panel title="Interest by report"
             sub="Which reports get looked at, and how far that look travels. The gap between viewed and paid is where the money is being left.">
        {!interest ? <Loading /> : interest.length === 0 ? <Empty label="Nothing viewed yet" /> : (
          <TableWrap>
              <thead><tr>
                <Th>Report</Th><Th align="right">Viewed</Th><Th align="right">Opened sample</Th>
                <Th align="right">Started checkout</Th><Th align="right">Pressed pay</Th>
                <Th align="right">View → pay</Th><Th w="120px" />
              </tr></thead>
              <tbody>
                {interest.map((r) => {
                  const rate = r.viewed ? Math.round((r.paid_click / r.viewed) * 100) : 0;
                  return (
                    <Tr key={r.code || "—"}>
                      <Td><span className="font-medium text-fg">{r.code || "—"}</span></Td>
                      <Td align="right" mono>{num(r.viewed)}</Td>
                      <Td align="right" mono dim>{num(r.sampled)}</Td>
                      <Td align="right" mono>{num(r.started)}</Td>
                      <Td align="right" mono>{num(r.paid_click)}</Td>
                      <Td align="right" mono>
                        <span className={rate >= 5 ? "text-brass font-semibold" : rate === 0 ? "text-faint" : ""}>
                          {rate}%
                        </span>
                      </Td>
                      <Td>
                        <div className="h-1.5 rounded-full bg-sunken overflow-hidden">
                          <div className="h-full bg-brass rounded-full"
                               style={{ width: `${(r.viewed / maxViewed) * 100}%` }} />
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
          </TableWrap>
        )}
      </Panel>

      {/* Read from the orders table, not from the event stream. Events are
          stitched by a browser-local id that a cleared cache breaks, and the
          row with money on it must not depend on that. */}
      <Panel title="Where the money came from"
             sub="Grouped on last touch — the click that closed the sale. Taken from the order itself, stamped at checkout.">
        {!rev ? <Loading /> : rev.length === 0 ? <Empty label="No orders in this window" /> : (
          <TableWrap>
            <thead><tr>
              <Th>Source</Th><Th>Medium</Th><Th>Campaign</Th>
              <Th align="right">Orders</Th><Th align="right">Paid</Th><Th align="right">Revenue</Th>
            </tr></thead>
            <tbody>
              {rev.map((r, i) => (
                <Tr key={i}>
                  <Td><span className="font-medium text-fg">{r.source}</span></Td>
                  <Td dim>{r.medium}</Td>
                  <Td dim>{r.campaign}</Td>
                  <Td align="right" mono>{num(r.orders)}</Td>
                  <Td align="right" mono>{num(r.paid)}</Td>
                  <Td align="right" mono>
                    <span className={Number(r.revenue_paise) > 0 ? "text-brass font-semibold" : "text-faint"}>
                      {rupees(Number(r.revenue_paise))}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title="Which campaign won the customer"
             sub="First touch, held on the buyer for the life of the account. The click above closed a sale; this one earned the relationship.">
        {!acq ? <Loading /> : acq.length === 0 ? <Empty label="No buyers yet" /> : (
          <TableWrap>
            <thead><tr>
              <Th>Source</Th><Th>Campaign</Th>
              <Th align="right">Buyers</Th><Th align="right">Orders</Th><Th align="right">Revenue</Th>
            </tr></thead>
            <tbody>
              {acq.map((r, i) => (
                <Tr key={i}>
                  <Td><span className="font-medium text-fg">{r.source}</span></Td>
                  <Td dim>{r.campaign}</Td>
                  <Td align="right" mono>{num(r.buyers)}</Td>
                  <Td align="right" mono>{num(r.orders)}</Td>
                  <Td align="right" mono>{rupees(Number(r.revenue_paise))}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title="Latest activity"
             sub="The raw stream, newest first. Click any row to replay that device's whole journey — before and after they signed in."
             right={events && events.length > EVENT_PREVIEW && (
               <button onClick={() => setShowAll((v) => !v)}
                       className="text-[11.5px] text-brass hover:underline">
                 {showAll ? `Show ${EVENT_PREVIEW}` : `Show all ${num(events.length)}`}
               </button>
             )}>
        {!events ? <Loading /> : events.length === 0 ? <Empty label="No events yet" /> : (
          <TableWrap>
              <thead><tr>
                <Th>When</Th><Th>Event</Th><Th>Page</Th><Th>Detail</Th>
                <Th>Source</Th><Th align="right">Who</Th>
              </tr></thead>
              <tbody>
                {(showAll ? events : events.slice(0, EVENT_PREVIEW)).map((e, i) => (
                  <Tr key={`${e.at}-${i}`} onClick={() => openJourney(e.anonymous_id)}>
                    <Td dim mono>{ago(e.at)}</Td>
                    <Td><span className="font-medium text-fg">{e.name}</span>
                      <div className="text-[11px] text-faint">{e.category}</div></Td>
                    <Td dim mono>{e.path || "—"}</Td>
                    <Td dim>{summarise(e.props)}</Td>
                    <Td dim>{e.campaign || e.source || "—"}</Td>
                    <Td align="right">
                      {/* "known" not "signed in": user_id is backfilled onto
                          rows from before they signed in, so it says this
                          device belongs to a buyer, not that they were logged
                          in at the time. */}
                      {e.user_id
                        ? <Chip tone="ready">known buyer</Chip>
                        : <span className="text-faint text-[11px] font-mono">{e.anonymous_id.slice(0, 8)}</span>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
          </TableWrap>
        )}
        {events && events.length > EVENT_PREVIEW && !showAll && (
          <Note>
            Showing the newest {EVENT_PREVIEW} of {num(events.length)} events in this window.
          </Note>
        )}
      </Panel>

      <Drawer open={!!journey} onClose={() => setJourney(null)}
              title="One device, start to finish"
              sub={journey ? <span className="font-mono">{journey.id}</span> : ""}>
        {!journey?.hops.length ? <Loading /> : (
          <div className="px-1 py-2">
            <SubHead right={<span className="text-[11.5px] text-faint">{journey.hops.length} steps</span>}>
              Journey
            </SubHead>
            <ol className="mt-2 relative pl-5">
              <span aria-hidden className="absolute left-[6px] top-2 bottom-2 w-px bg-line" />
              {journey.hops.map((h, i) => {
                // The moment they stopped being anonymous. Taken from the
                // signed_in EVENT, not from user_id: identify() backfills that
                // column onto every earlier row, so by the time we read it,
                // every hop looks signed in.
                const justSignedIn = h.name === "signed_in";
                return (
                  <li key={i} className="relative py-2">
                    <span aria-hidden
                          className={`absolute -left-5 top-3.5 w-[9px] h-[9px] rounded-full ring-2 ring-raised
                                      ${justSignedIn ? "bg-brass" : "bg-line"}`} />
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] text-fg font-medium">{h.name}</span>
                      <span className="text-[11px] text-faint tabular-nums shrink-0">{when(h.at)}</span>
                    </div>
                    <div className="text-[11.5px] text-muted">
                      {h.path || "—"}{h.props ? ` · ${summarise(h.props)}` : ""}
                    </div>
                    {justSignedIn && (
                      <div className="mt-1"><Tag>signed in here</Tag></div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/** The one or two properties worth showing in a row this narrow. */
function summarise(props: Record<string, unknown> | null | undefined) {
  if (!props) return "—";
  const keep = ["code", "coupon", "q", "channel", "order_id", "fields", "reason", "amount_paise"];
  const bits = keep
    .filter((k) => props[k] !== undefined)
    .map((k) => {
      const v = props[k];
      const s = Array.isArray(v) ? v.join(", ") : String(v);
      return k === "code" ? s : `${k}: ${s.length > 40 ? `${s.slice(0, 40)}…` : s}`;
    });
  return bits.length ? bits.join(" · ") : "—";
}
