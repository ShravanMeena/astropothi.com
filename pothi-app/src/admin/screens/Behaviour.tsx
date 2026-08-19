import { useEffect, useState } from "react";
import { adminApi, num, when, ago } from "../api";
import {
  Panel, TableWrap, Th, Td, Tr, Tag, Chip, Loading, Empty, ErrorNote,
  Segmented, BarRow, Tile, Drawer, Note, SubHead
} from "../ui";

type Step = { step: string; people: number; of_first: number; dropped: number };
type Interest = { code: string | null; viewed: number; sampled: number; started: number; paid_click: number };
type Ev = {
  at: string; name: string; category: string; path: string | null;
  anonymous_id: string; session_id: string | null; user_id: string | null;
  source: string | null; campaign: string | null; props: Record<string, unknown> | null;
};
type Hop = {
  at: string; name: string; category: string; path: string | null;
  session: string | null; userId: string | null; props?: Record<string, unknown>;
};

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
  const [err, setErr] = useState("");

  useEffect(() => {
    setFunnel(null); setInterest(null); setEvents(null);
    adminApi.get(`/events/funnel?days=${days}`).then(setFunnel).catch((e) => setErr(e.message));
    adminApi.get(`/events/by-report?days=${days}`).then(setInterest).catch((e) => setErr(e.message));
    adminApi.get(`/events?days=${days}&limit=200`).then(setEvents).catch((e) => setErr(e.message));
  }, [days]);

  const openJourney = async (anonId: string) => {
    setJourney({ id: anonId, hops: [] });
    try { setJourney({ id: anonId, hops: await adminApi.get(`/events/journey/${anonId}`) }); }
    catch (e: any) { setErr(e.message); setJourney(null); }
  };

  const first = funnel?.[0]?.people ?? 0;
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
          <Tile label="Visitors" value={num(first)} />
          <Tile label="Reached checkout"
                value={num(funnel.find((s) => s.step === "Started checkout")?.people ?? 0)} />
          <Tile label="Pressed pay" tone="brass"
                value={num(funnel.find((s) => s.step === "Pressed pay")?.people ?? 0)} />
          <Tile label="Biggest drop" tone="ember" value={num(worst.dropped)}
                hint={`Between "${funnel[funnel.indexOf(worst) - 1]?.step}" and "${worst.step}"`} />
        </div>
      )}

      <Panel title="The funnel"
             sub="Distinct devices reaching each step. A device that skipped a step — an ad landing straight on a report page — is counted where it actually arrived.">
        {!funnel ? <Loading /> : funnel[0]?.people === 0 ? (
          <Empty label="No events recorded in this window yet" />
        ) : (
          <div className="py-1">
            {funnel.map((s, i) => (
              <BarRow key={s.step}
                label={<span className="flex items-center gap-2">
                  {s.step}
                  {i > 0 && s.dropped > 0 && (
                    <span className={`text-[11px] ${s === worst ? "text-ember font-medium" : "text-faint"}`}>
                      −{num(s.dropped)} left here
                    </span>
                  )}
                </span>}
                value={s.people} max={first}
                right={num(s.people)} sub={`${s.of_first}%`}
                tone={i === 0 ? "muted" : "brass"} />
            ))}
          </div>
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

      <Panel title="Latest activity"
             sub="Click any row to replay that device's whole journey — before and after they signed in.">
        {!events ? <Loading /> : events.length === 0 ? <Empty label="No events yet" /> : (
          <TableWrap>
              <thead><tr>
                <Th>When</Th><Th>Event</Th><Th>Page</Th><Th>Detail</Th>
                <Th>Source</Th><Th align="right">Who</Th>
              </tr></thead>
              <tbody>
                {events.map((e, i) => (
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
