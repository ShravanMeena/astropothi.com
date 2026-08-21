import type { Window as AdminWindow } from "../types";
import { useCallback, useEffect, useState } from "react";
import { adminApi, num, when, ago, rupees, ms , dur} from "../api";
import {
  Panel, TableWrap, Th, Td, Tr, Tag, Loading, Empty, ErrorNote,
   Tile, Drawer, SubHead, ActivityChart, FunnelSteps, RangeBar } from "../ui";

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
type Src = { source: string; devices: number; events: number; is_meta: boolean };
type Traffic = { sources: Src[]; meta: { devices: number; events: number } };
type Hop = {
  at: string; name: string; category: string; path: string | null;
  session: string | null; userId: string | null; props?: Record<string, unknown>;
};

/** How many raw events to show before asking. Enough to see a pattern, few
 *  enough that the charts above stay on the same screen. */
const EVENT_PREVIEW = 25;

/** Every dwell bucket, in order — rendered even at zero so the panel is a full
 *  distribution rather than the two bars that happened to have data. Must match
 *  the labels the API emits in admin.service.js/dwell(). */
const DWELL_BUCKETS = [
  "1. nothing after the first moment",
  "2. under 15 seconds",
  "3. 15 to 60 seconds",
  "4. 1 to 5 minutes",
  "5. over 5 minutes",
];

/** The friendly name for each Meta placement, so "an" reads as what it is. */
const PLACEMENT: Record<string, string> = {
  fb: "Facebook feed", ig: "Instagram", meta: "Meta", an: "Audience Network",
  "instagram.com": "Instagram referral", facebook: "Facebook", instagram: "Instagram",
  audience_network: "Audience Network", messenger: "Messenger", msg: "Messenger",
};

/**
 * What people do on the site, and where they stop doing it.
 *
 * Everything here counts DEVICES, not events: one person refreshing a report
 * page eleven times is one interested person, and a table that says eleven
 * would send us optimising the wrong thing.
 */
export default function Behaviour({ window: w, setWindow }: { window: AdminWindow; setWindow: (w: AdminWindow) => void }) {
  /**
   * The shared window, in the units these endpoints speak.
   *
   * This screen had its own 7/30/90 selector, which meant two range controls on
   * one page disagreeing about what "the period" was. "All time" maps to 180 —
   * the ceiling activityByDay() clamps to anyway, so asking for more would
   * silently return less than it claimed.
   */
  const days = ({ today: "1", "7d": "7", "30d": "30", all: "180" } as const)[w];
  const [source, setSource] = useState("");
  const [drop, setDrop] = useState<{ last_event: string; devices: number; avg_seconds: number; avg_events: string }[] | null>(null);
  const [dwell, setDwell] = useState<{ bucket: string; devices: number }[] | null>(null);
  const [sources, setSources] = useState<{ source: string; devices: number }[]>([]);
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
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [err, setErr] = useState("");
  // Refresh without a page reload. `silent` keeps the current numbers on screen
  // while the next set is fetched — a manual or auto refresh should not blink
  // every panel back to a spinner, which is what nulling the state would do.
  const [refreshing, setRefreshing] = useState(false);
  const [auto, setAuto] = useState(() => localStorage.getItem("pothi.behaviour.auto") === "1");

  const load = useCallback((silent = false) => {
    if (!silent) {
      setFunnel(null); setInterest(null); setEvents(null);
      setRev(null); setAcq(null); setByDay(null); setTraffic(null);
    }
    setErr("");
    setRefreshing(true);
    const jobs = [
      adminApi.get(`/events/traffic?days=${days}`).then(setTraffic).catch(() => {}),
      adminApi.get(`/events/by-day?days=${days}`).then(setByDay).catch((e) => setErr(e.message)),
      adminApi.get(`/events/funnel?days=${days}&source=${encodeURIComponent(source)}`).then(setFunnel).catch((e) => setErr(e.message)),
      adminApi.get(`/events/drop-off?days=${days}&source=${encodeURIComponent(source)}`).then(setDrop).catch(() => {}),
      adminApi.get(`/events/dwell?days=${days}&source=${encodeURIComponent(source)}`).then(setDwell).catch(() => {}),
      adminApi.get(`/events/by-report?days=${days}`).then(setInterest).catch((e) => setErr(e.message)),
      adminApi.get(`/events?days=${days}&source=${encodeURIComponent(source)}&limit=200`).then(setEvents).catch((e) => setErr(e.message)),
      adminApi.get(`/events/sources?days=${days}`).then(setSources).catch(() => {}),
      adminApi.get(`/events/revenue-by-source?days=${days}`).then(setRev).catch((e) => setErr(e.message)),
      adminApi.get(`/events/acquisition?days=${Math.max(90, Number(days))}`).then(setAcq).catch((e) => setErr(e.message)),
    ];
    Promise.allSettled(jobs).finally(() => setRefreshing(false));
  }, [days, source]);

  // Initial load, and whenever the window or source changes — not silent, so a
  // deliberate filter change does show it is refetching.
  useEffect(() => { load(false); }, [load]);

  // Auto-refresh, off by default and remembered. Silent so it never interrupts
  // reading. Cleared on unmount and whenever it is turned off.
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, [auto, load]);

  const toggleAuto = () => setAuto((v) => {
    const next = !v;
    try { localStorage.setItem("pothi.behaviour.auto", next ? "1" : "0"); } catch { /* private mode */ }
    return next;
  });

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
    <div className="space-y-5">
      <RangeBar value={w} onChange={setWindow} right={
        sources.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Built from what is in the window, not a hardcoded list — a new
                channel appears here the day it sends its first event. */}
            <button onClick={() => setSource("")}
                    className={`chip ${source === "" ? "bg-fg text-surface" : "bg-sunken text-muted"}`}>
              All sources
            </button>
            {sources.map((s) => (
              <button key={s.source} onClick={() => setSource(s.source)}
                      className={`chip ${source === s.source ? "bg-fg text-surface" : "bg-sunken text-muted"}`}>
                {s.source} <span className="opacity-60">{s.devices}</span>
              </button>
            ))}
          </div>
        )
      } />
      {err && <ErrorNote error={err} />}

      <div className="flex items-center justify-between gap-4">
        <span className="text-[11.5px] text-faint">
          {funnel ? `${num(first)} devices in this window` : ""}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {/* Auto-refresh, remembered across visits. When on, every panel
              silently refetches on a timer without touching the page. */}
          <button onClick={toggleAuto}
                  className={`chip inline-flex items-center gap-1.5 ${
                    auto ? "bg-brassSoft/70 text-brass" : "bg-sunken text-muted"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${auto ? "bg-brass animate-pulse" : "bg-faint"}`} />
            Auto-refresh {auto ? "on" : "off"}
          </button>
          <button onClick={() => load(true)} disabled={refreshing}
                  className="chip inline-flex items-center gap-1.5 bg-sunken text-fg hover:bg-line disabled:opacity-50">
            <span className={refreshing ? "inline-block animate-spin" : ""}>↻</span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
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

      <Panel title="Latest activity"
             sub="Grouped by device, newest first — one visitor's journey, and where it stopped."
             right={events && events.length > EVENT_PREVIEW && (
               <button onClick={() => setShowAll((v) => !v)}
                       className="text-[11.5px] text-brass hover:underline">
                 {showAll ? `Show ${EVENT_PREVIEW}` : `Show all ${num(events.length)}`}
               </button>
             )}>
        {!events ? <Loading /> : events.length === 0 ? <Empty label="No events yet" /> : (
          <div className="space-y-2 px-4 sm:px-5 py-4">
            {groupByDevice(showAll ? events : events.slice(0, EVENT_PREVIEW)).map((g) => (
              <Session key={g.key} g={g} onOpen={() => openJourney(g.anonymous_id)} />
            ))}
          </div>
        )}
      </Panel>

      {/* ── Where the journey ended, and how long it lasted ─────────────────
          The funnel counts arrivals at each step. It cannot show where a
          journey STOPPED — a device that quits after viewing a report simply
          fails to appear in the next bar, and the gap looks the same whether
          one person left or forty did. These two answer that directly, and they
          are the pair that told us the ad traffic was different in kind rather
          than just smaller: 41 of 49 fb devices did nothing at all after the
          first moment, against 1 in 49 reaching checkout. ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Where they stopped"
               sub="The last thing each device did before leaving, and how long it stayed.">
          {!drop ? <Loading /> : drop.length === 0 ? <Empty label="Nothing in this window" /> : (
            <TableWrap>
              <thead><tr><Th>Last thing they did</Th><Th align="right">Devices</Th>
                <Th align="right">Stayed</Th><Th align="right">Events</Th></tr></thead>
              <tbody>
                {drop.map((r) => {
                  const share = Math.round((r.devices / Math.max(1, drop.reduce((n, x) => n + x.devices, 0))) * 100);
                  return (
                    <Tr key={r.last_event}>
                      <Td>
                        <span className="font-medium text-fg">{r.last_event}</span>
                        <div className="mt-1 h-1 rounded-full bg-line overflow-hidden max-w-[220px]">
                          <div className="h-full rounded-full bg-brass" style={{ width: `${share}%` }} />
                        </div>
                      </Td>
                      <Td align="right">{num(r.devices)} <span className="text-faint">{share}%</span></Td>
                      {/* Zero is the finding, not a missing value: they fired
                          nothing after the events that arrive on mount. */}
                      <Td align="right" dim>{dur(r.avg_seconds)}</Td>
                      <Td align="right" dim>{r.avg_events}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <Panel title="How long they stayed"
               sub="The shape of dwell time — most bounce on load, a few actually read.">
          {!dwell ? <Loading /> : dwell.length === 0 ? <Empty label="Nothing in this window" /> : (
            <div className="space-y-2.5 px-4 sm:px-5 py-4">
              {DWELL_BUCKETS.map((name) => {
                const b = { bucket: name, devices: dwell.find((d) => d.bucket === name)?.devices ?? 0 };
                const total = Math.max(1, dwell.reduce((n, x) => n + x.devices, 0));
                const pct = Math.round((b.devices / total) * 100);
                const dead = b.bucket.startsWith("1.");
                return (
                  <div key={b.bucket}>
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className={dead ? "text-ember" : "text-fg"}>{b.bucket.replace(/^\d\.\s*/, "")}</span>
                      <span className="tabular-nums">{num(b.devices)} <span className="text-faint">{pct}%</span></span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-line overflow-hidden">
                      <div className={`h-full rounded-full ${dead ? "bg-ember" : "bg-brass"}`}
                           style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Activity, day by day"
             sub="Distinct devices per day, and the share that reached the pay button.">
        {!byDay ? <Loading /> : byDay.every((d) => d.visitors === 0)
          ? <Empty label="No activity recorded in this window yet" />
          : <ActivityChart rows={byDay} height={96} />}
      </Panel>

      <Panel title="The funnel"
             sub="Distinct devices reaching each step — counted where they arrived, even if they skipped one.">
        {!funnel ? <Loading /> : funnel[0]?.people === 0 ? (
          <Empty label="No events recorded in this window yet" />
        ) : (
          <FunnelSteps steps={funnel} worst={worst?.step} />
        )}
      </Panel>

      <Panel title="Interest by report"
             sub="Which reports get looked at, and how far the look travels — viewed vs paid is the gap.">
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

      {/* One Meta campaign scatters across five source values (fb · ig · meta ·
          an · instagram.com). This pulls them back together so "how much did
          Meta send" is one number, not a mental sum. */}
      <Panel title="Where visitors came from"
             sub="Every traffic source in the window — Meta's placements pulled back into one.">
        {!traffic ? <Loading /> : traffic.sources.length === 0 ? <Empty label="No traffic in this window" /> : (() => {
          const metaRows = traffic.sources.filter((s) => s.is_meta).sort((a, b) => b.devices - a.devices);
          const others = traffic.sources.filter((s) => !s.is_meta).sort((a, b) => b.devices - a.devices);
          const maxDev = Math.max(1, traffic.meta.devices, ...others.map((s) => s.devices));
          const bar = (d: number) => (
            <div className="mt-1 h-1 rounded-full bg-line overflow-hidden max-w-[220px]">
              <div className="h-full rounded-full bg-brass" style={{ width: `${(d / maxDev) * 100}%` }} />
            </div>
          );
          return (
            <TableWrap>
              <thead><tr>
                <Th>Source</Th><Th align="right">Unique users</Th><Th align="right">Events</Th>
              </tr></thead>
              <tbody>
                {metaRows.length > 0 && (
                  <>
                    {/* The rollup counts DISTINCT devices, so it can be smaller
                        than the placements below it add up to — one person who
                        touched fb and meta is one Meta user, counted once. */}
                    <Tr>
                      <Td>
                        <span className="font-semibold text-brass">Meta — all placements</span>
                        {bar(traffic.meta.devices)}
                      </Td>
                      <Td align="right"><span className="font-semibold text-brass tabular-nums">{num(traffic.meta.devices)}</span></Td>
                      <Td align="right" mono>{num(traffic.meta.events)}</Td>
                    </Tr>
                    {metaRows.map((s) => (
                      <Tr key={s.source}>
                        <Td>
                          <span className="pl-4 text-muted">↳ {s.source}</span>
                          {PLACEMENT[s.source.toLowerCase()] && (
                            <span className="ml-1.5 text-[11px] text-faint">{PLACEMENT[s.source.toLowerCase()]}</span>
                          )}
                        </Td>
                        <Td align="right" mono dim>{num(s.devices)}</Td>
                        <Td align="right" mono dim>{num(s.events)}</Td>
                      </Tr>
                    ))}
                  </>
                )}
                {others.map((s) => (
                  <Tr key={s.source}>
                    <Td><span className="font-medium text-fg">{s.source}</span>{bar(s.devices)}</Td>
                    <Td align="right" mono>{num(s.devices)}</Td>
                    <Td align="right" mono dim>{num(s.events)}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          );
        })()}
      </Panel>

      {/* Read from the orders table, not from the event stream. Events are
          stitched by a browser-local id that a cleared cache breaks, and the
          row with money on it must not depend on that. */}
      <Panel title="Where the money came from"
             sub="Last touch — the click that closed the sale, taken from the order itself.">
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
             sub="First touch — the click that earned the buyer, held for the life of the account.">
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
                    <HopDetail path={h.path} props={h.props} />
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

/**
 * Who this row belongs to, as a value you can actually scan for.
 *
 * It used to print a grey "known buyer" chip for anyone signed in, which told
 * you a person existed but not *which* person — so a list of forty rows gave no
 * way to see that six of them were one visitor. Now the id is printed, and its
 * colour is derived from the id itself, so the same Who is the same colour all
 * the way down the page and a journey stands out without opening it.
 *
 * A signed-in buyer shows their user id; everyone else shows the first eight
 * characters of the device id. Both are ids we generated, not personal data.
 *
 * "known" rather than "signed in": identify() backfills user_id onto rows from
 * before they signed in, so it means this device belongs to a buyer — not that
 * they were logged in at that moment.
 */
const WHO_TONES = [
  "text-brass", "text-ember", "text-emerald-600 dark:text-emerald-400",
  "text-sky-600 dark:text-sky-400", "text-violet-600 dark:text-violet-400",
  "text-rose-600 dark:text-rose-400", "text-amber-600 dark:text-amber-400",
  "text-teal-600 dark:text-teal-400"
];

function Who({ userId, anonId }: { userId: string | null; anonId: string }) {
  const key = userId ? `u${userId}` : anonId;
  // Cheap, stable string hash — the same id must pick the same colour on every
  // render and every page load, so Math.random or an index will not do.
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const tone = WHO_TONES[h % WHO_TONES.length];
  return (
    <span className={`font-mono text-[11px] ${tone}`} title={userId ? `user ${userId}` : `device ${anonId}`}>
      {userId ? `#${userId}` : anonId.slice(0, 8)}
      {userId && <span className="ml-1 opacity-60">buyer</span>}
    </span>
  );
}

/**
 * Consecutive events from one device, folded into a journey.
 *
 * The stream arrives newest-first and interleaved, so reading it meant holding
 * four devices in your head at once. Grouping by device — in the order the
 * devices last appeared — turns it into "this visitor did A then B then left",
 * which is the only form in which a drop is visible.
 *
 * Each group's own events are re-sorted oldest-first, because a journey read
 * backwards is not a journey.
 */
function groupByDevice(rows: Ev[]) {
  const order: string[] = [];
  const byDevice = new Map<string, Ev[]>();
  for (const e of rows) {
    if (!byDevice.has(e.anonymous_id)) { byDevice.set(e.anonymous_id, []); order.push(e.anonymous_id); }
    byDevice.get(e.anonymous_id)!.push(e);
  }
  return order.map((id) => {
    const list = [...byDevice.get(id)!].sort((a, b) => +new Date(a.at) - +new Date(b.at));
    const first = list[0], last = list[list.length - 1];

    /*
     * Where they came from, read off the landing URL.
     *
     * app_events stores source, medium and campaign as columns but not
     * utm_content or utm_term — and those are the ones that say WHICH creative
     * and WHICH placement, which is the question when four ads share a
     * campaign. The full query string is on the path, so it is parsed here
     * rather than adding columns for something already recorded.
     */
    const [landing, query = ""] = (first.path || "").split("?");
    const qs = new URLSearchParams(query);
    const utm: [string, string][] = [];
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"]) {
      const v = qs.get(k);
      if (v) utm.push([k.replace("utm_", ""), v]);
    }
    // A click id means the click was real and paid, even when the utm tags are
    // missing — which they are on about half of Meta's own placements.
    const clickId = ["fbclid", "gclid", "ttclid", "twclid"].find((k) => qs.has(k)) || null;

    return {
      key: id + last.at,
      anonymous_id: id,
      user_id: last.user_id,
      source: last.source,
      campaign: last.campaign,
      at: last.at,
      landing: landing || "/",
      utm,
      clickId,
      lastEvent: last.name,
      spanSecs: Math.round((+new Date(last.at) - +new Date(first.at)) / 1000),
      // The steps worth seeing without expanding anything. Everything else is
      // page_view and scroll noise, and a wall of sixty chips hides exactly the
      // six that matter.
      milestones: [...new Set(list.map((e) => e.name))].filter((n) => MILESTONES.has(n)),
      events: list
    };
  });
}

/**
 * One visitor's visit, as a card you can read in two seconds.
 *
 * The first version printed every event as a chip in a row — sixty-six of them
 * for an engaged visitor — which is a wall, not a journey: the two chips that
 * matter (buy_clicked, checkout_started) sat in the middle of sixty that did
 * not. And it showed the LAST path, so the one thing you actually want from
 * this screen while paying for ads — which ad they came from — was nowhere.
 *
 * So: where they came from and where they landed in the header, the steps that
 * mean something below it, and the raw chain only when asked for.
 */
function Session({ g, onOpen }: { g: ReturnType<typeof groupByDevice>[number]; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const paid = g.milestones.includes("order_ready");
  const reachedCheckout = g.milestones.includes("checkout_started");

  return (
    <div className={`rounded-lg border transition ${
      paid ? "border-brass/50 bg-brassSoft/10"
      : reachedCheckout ? "border-line bg-sunken/40"
      : "border-line"}`}>
      <div className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Who userId={g.user_id} anonId={g.anonymous_id} />
          <span className="text-[11px] text-faint">{ago(g.at)}</span>
          <span className="ml-auto text-[11px] text-faint tabular-nums">
            {g.events.length} event{g.events.length === 1 ? "" : "s"}
            {g.spanSecs > 0 && <> · {ms(g.spanSecs * 1000)}</>}
          </span>
        </div>

        {/* Landed on — the page, then how they got to it. */}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[11px] text-faint">landed on</span>
          <span className="font-mono text-[11.5px] text-fg">{g.landing}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {g.utm.length === 0 && !g.clickId && (
            <span className="chip bg-sunken text-muted text-[10.5px]">
              {g.source || "direct"}{g.campaign ? ` · ${g.campaign}` : ""}
            </span>
          )}
          {g.utm.map(([k, v]) => (
            <span key={k} className="chip bg-sunken text-muted text-[10.5px]" title={`utm_${k}=${v}`}>
              <span className="text-faint">{k}</span>&nbsp;{v.length > 22 ? `…${v.slice(-10)}` : v}
            </span>
          ))}
          {g.clickId && (
            <span className="chip bg-sunken text-faint text-[10.5px]" title="a real ad click carried a click id">
              {g.clickId}
            </span>
          )}
        </div>

        {/* What actually happened. Nothing here means nothing happened. */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {g.milestones.length === 0 ? (
            <span className="text-[11.5px] text-ember">
              nothing but page loads — ended on {g.lastEvent}
            </span>
          ) : g.milestones.map((m) => (
            <span key={m} className={`chip text-[11px] ${
              /order_ready/.test(m) ? "bg-brass text-surface"
              : /pay_clicked|payment_redirected|checkout_started/.test(m) ? "bg-brassSoft/70 text-brass"
              : "bg-sunken text-fg"}`}>
              {m}
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button onClick={() => setOpen((v) => !v)}
                  className="text-[11px] text-brass hover:underline">
            {open ? "Hide the full chain" : `All ${g.events.length} steps`}
          </button>
          <button onClick={onOpen} className="text-[11px] text-muted hover:text-fg hover:underline">
            Whole history for this device
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line/60 px-3 py-2 flex flex-wrap items-center gap-1">
          {g.events.map((e, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-line text-[10px]">→</span>}
              <span className={`chip text-[10.5px] ${
                MILESTONES.has(e.name) ? "bg-sunken text-fg" : "bg-transparent text-faint"}`}
                title={[e.path, summarise(e.props)].filter((x) => x && x !== "—").join("  ·  ")}>
                {e.name}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Events that mean something happened, as opposed to something rendered. */
const MILESTONES = new Set([
  "report_engaged", "sample_opened", "chart_check_done", "welcome_submitted",
  "buy_clicked", "checkout_started", "checkout_field_error", "pay_clicked",
  "payment_redirected", "signed_in", "order_ready", "reader_opened", "chat_question"
]);


/**
 * One hop in a device's journey, with everything we know about it — not just
 * the URL.
 *
 * The path used to print raw, which meant a 180-character fbclid drowned the one
 * useful thing on the line. Here the query string is split off the pathname and
 * shown as named chips (source · campaign · content, and the click id as its own
 * short tag), and the event's own properties are turned into readable chips —
 * WHICH banner (its index and name), which report code, an amount in rupees —
 * so "banner_viewed" says banner #0 · man-holding-smartphone, not nothing.
 */
function HopDetail({ path, props }: { path: string | null; props?: Record<string, unknown> }) {
  const [pathname, query = ""] = (path || "").split("?");
  const qs = new URLSearchParams(query);
  const utm: [string, string][] = [];
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = qs.get(k);
    if (v) utm.push([k.replace("utm_", ""), v]);
  }
  const clickId = ["fbclid", "gclid", "ttclid", "twclid"].find((k) => qs.has(k));
  const detail = hopChips(props);

  return (
    <>
      <div className="text-[11.5px] text-muted font-mono truncate" title={pathname}>{pathname || "—"}</div>
      {(detail.length > 0 || utm.length > 0 || clickId) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {detail.map((d, i) => (
            <span key={`d${i}`} className="chip bg-sunken text-fg text-[10.5px]">{d}</span>
          ))}
          {utm.map(([k, v]) => (
            <span key={k} className="chip bg-sunken text-muted text-[10.5px]" title={`utm_${k}=${v}`}>
              <span className="text-faint">{k}</span>&nbsp;{v.length > 22 ? `…${v.slice(-10)}` : v}
            </span>
          ))}
          {clickId && (
            <span className="chip bg-sunken text-faint text-[10.5px]" title="a real ad click carried a click id">
              {clickId}
            </span>
          )}
        </div>
      )}
    </>
  );
}

/**
 * An event's properties as readable chips. Banner gets pulled out specially —
 * its index and name are the whole point of the event — and money is shown in
 * rupees rather than the paise it is stored in. Everything else falls through to
 * the same small keep-list summarise() uses.
 */
function hopChips(props?: Record<string, unknown> | null): string[] {
  if (!props) return [];
  const out: string[] = [];
  // Which banner: "#0 · man-holding-smartphone". The index answers "which one in
  // the carousel", the name answers "which creative".
  const isBanner = props.banner !== undefined || props.index !== undefined;
  if (isBanner && props.index !== undefined) out.push(`banner #${props.index}`);
  if (props.banner !== undefined) out.push(String(props.banner));
  // Money is stored in paise; nobody reads paise.
  const paise = Number(props.amount_paise ?? props.discount_paise);
  if (Number.isFinite(paise) && paise > 0) out.push(`₹${Math.round(paise / 100)}`);

  const keep = ["code", "coupon", "q", "channel", "order_id", "fields", "reason",
    "depth", "section", "from", "where", "severity", "manglik", "language", "slug", "design", "how", "offer"];
  for (const k of keep) {
    if (props[k] === undefined) continue;
    const v = props[k];
    const s = Array.isArray(v) ? v.join(", ") : String(v);
    out.push(k === "code" ? s : `${k}: ${s.length > 40 ? `${s.slice(0, 40)}…` : s}`);
  }
  return out;
}

function summarise(props: Record<string, unknown> | null | undefined) {
  if (!props) return "—";
  // Anything worth reading in a row. "how" was missing, so every
  // welcome_dismissed showed a blank Detail — the one column that would have
  // said whether people close the sheet, press Escape, or take the skip link.
  const keep = [
    "how", "code", "coupon", "q", "channel", "order_id", "fields", "reason", "amount_paise",
    "depth", "section", "from", "where", "manglik", "severity", "offer", "language", "slug", "design"
  ];
  const bits = keep
    .filter((k) => props[k] !== undefined)
    .map((k) => {
      const v = props[k];
      const s = Array.isArray(v) ? v.join(", ") : String(v);
      return k === "code" ? s : `${k}: ${s.length > 40 ? `${s.slice(0, 40)}…` : s}`;
    });
  return bits.length ? bits.join(" · ") : "—";
}
