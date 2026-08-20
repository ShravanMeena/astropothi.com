import { useEffect, useState } from "react";
import { adminApi, rupees, num, when } from "../api";
import type { PaymentLink, Catalogue, CatalogueStatus, Environment } from "../types";
import { Panel, TableWrap, Th, Td, Tr, Chip, Tag, Loading, Empty, ErrorNote, Hint, Stat, StatRow, Facts, Btn, Confirm } from "../ui";

export default function Ops({ environment }: { environment: Environment | null }) {
  const [links, setLinks] = useState<PaymentLink[] | null>(null);
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [status, setStatus] = useState<CatalogueStatus[] | null>(null);
  const [busy, setBusy] = useState("");
  const [pending, setPending] = useState<CatalogueStatus | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.get("/ops/payment-links?limit=100").then(setLinks).catch((e) => setErr(e.message));
    adminApi.get("/ops/catalogue").then(setCat).catch((e) => setErr(e.message));
    loadStatus();
  }, []);

  function loadStatus() {
    adminApi.get("/catalogue/status").then(setStatus).catch((e) => setErr(e.message));
  }

  // Putting something back on sale is harmless and goes straight through.
  // Taking it off is the one that needs a reason recorded.
  function toggle(t: CatalogueStatus) {
    if (!t.sellable) return apply(t, "");
    setPending(t);
  }

  async function apply(t: CatalogueStatus, note: string) {
    setBusy(t.code); setErr(""); setPending(null);
    try {
      await adminApi.post(`/catalogue/${t.code}/status`, { sellable: !t.sellable, note });
      loadStatus();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }

  async function clearOverride(t: CatalogueStatus) {
    setBusy(t.code); setErr("");
    try {
      await adminApi.del(`/catalogue/${t.code}/status`);
      loadStatus();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }

  // A link that exists with no payment against it is either an unpaid link or a
  // webhook that never landed. We cannot tell which apart without a delivery log.
  const unsettled = (links || []).filter((l) => !l.settled && l.status === "created");

  return (
    <div className="space-y-4">
      {err && <ErrorNote error={err} />}

      {environment && (
        <Panel title="This environment" sub="Settings that change what every number in this panel means.">
          <div className="px-4 sm:px-5 py-4">
            <Facts rows={[
              ["Mode", <Chip tone={environment.env === "production" ? "ready" : "created"}>{environment.env}</Chip>],
              ["Consumer brand", environment.consumer_brand],
              ["Web origin", environment.web_origin],
              ["Razorpay", environment.razorpay_configured
                ? <>configured{environment.webhook_secret_configured ? " · webhook secret set" : " · ⚠ no webhook secret"}</>
                : "not configured — orders settle through the local dev path"],
              ["Checkout auto-login", environment.auto_login_on_order
                ? "on — a typed mobile number signs the buyer in, before payment"
                : "off — buyers must enter an OTP"],
              ["OTP bypass", environment.otp_bypass_enabled
                ? <span className="text-ember">ENABLED — one fixed code signs in as any phone, including staff</span>
                : "off"],
              ["Pilot", environment.pilot.on
                ? `on · ${environment.pilot.seats} seats · ${environment.pilot.reports} free reports · code ${environment.pilot.inviteCode}`
                : "off"]
            ]} />
          </div>
          {environment.otp_bypass_enabled && (
            <div className="flex items-start gap-2.5 border-t border-ember/30 bg-ember/8 px-5 py-3">
              <span className="mt-px text-ember text-[13px] leading-none">▲</span>
              <p className="text-[12px] leading-relaxed text-ember">
                <strong>OTP_BYPASS is set.</strong> One fixed code signs in as any phone, including staff — this
                environment has no real access control. Forced to null when NODE_ENV=production.
              </p>
            </div>
          )}
        </Panel>
      )}

      <Panel title="Payment links" sub={`${num(links?.length || 0)} most recent`}
             right={<Hint>This schema has no webhook-delivery table, so failed deliveries cannot be listed. What is shown is the observable consequence: a link with no payment id. That is either a buyer who never paid or a webhook that never arrived, and these rows cannot tell the two apart — Razorpay's dashboard can.</Hint>}>
        {!links ? <Loading /> : !links.length ? <Empty label="No payment links issued." /> : (
          <>
            <StatRow cols={3}>
              <Stat label="Settled" value={num(links.filter((l) => l.settled).length)} tone="brass"
                    sub="a payment id came back against the link" />
              <Stat label="Awaiting payment" value={num(unsettled.length)}
                    sub={rupees(unsettled.reduce((n, l) => n + l.amount_paise, 0))} />
              <Stat label="Paid, no payment id" value={num(links.filter((l) => !l.settled && l.status !== "created").length)}
                    tone={links.some((l) => !l.settled && l.status !== "created") ? "ember" : "plain"}
                    sub="settled some other way — worth a look" />
            </StatRow>
            <div className="border-t border-line">
              <TableWrap>
                <thead><tr>
                  <Th>Order</Th><Th>Link</Th><Th>Payment</Th><Th>Status</Th>
                  <Th align="right">Amount</Th><Th align="right">Issued</Th>
                </tr></thead>
                <tbody>
                  {links.map((l) => (
                    <Tr key={l.link_id}>
                      <Td mono>{l.public_id}</Td>
                      <Td mono dim>{l.link_id}</Td>
                      <Td mono dim>{l.payment_id || "—"}</Td>
                      <Td>
                        <Chip tone={l.status}>{l.status}</Chip>
                        {!l.settled && l.status !== "created" && <div className="mt-1 text-[10.5px] text-ember">no payment id</div>}
                      </Td>
                      <Td align="right">{rupees(l.amount_paise)}</Td>
                      <Td align="right" dim>{when(l.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </>
        )}
      </Panel>

      {status && (
        <Panel title="Catalogue" sub="What is on sale right now. Taking a report off hides it from the storefront immediately."
               right={<Hint>catalog.js decides what EXISTS; this switch decides what is on sale. Turning one off removes its card, 404s its page, and refuses checkout for anyone with a stale tab open — it never touches orders already placed.</Hint>}>
          <TableWrap>
            <thead><tr>
              <Th>Report</Th><Th align="right">Chapters</Th><Th align="right">Price</Th>
              <Th align="right">Paid orders</Th><Th>State</Th><Th />
            </tr></thead>
            <tbody>
              {status.map((t) => (
                <Tr key={t.code}>
                  <Td>
                    <div className="font-medium">{t.name_en}</div>
                    <div className="text-[11px] text-faint deva">{t.name_hi}</div>
                  </Td>
                  <Td align="right">{t.subject === "property" ? "—" : t.chapters}</Td>
                  <Td align="right" className="font-medium">{rupees(t.price_paise)}</Td>
                  <Td align="right" dim={!t.paid_orders}>{num(t.paid_orders)}</Td>
                  <Td>
                    {t.sellable ? <Tag>on sale</Tag> : <Chip tone="failed">off sale</Chip>}
                    {t.override !== null && (
                      <div className="mt-1 text-[10.5px] text-faint">
                        overridden{t.set_by ? ` by ${t.set_by}` : ""}
                        {t.note ? ` — ${t.note}` : ""}
                      </div>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex gap-1.5 justify-end">
                      <Btn tone={t.sellable ? "danger" : "brass"} busy={busy === t.code}
                           onClick={() => toggle(t)}>
                        {t.sellable ? "Take off sale" : "Put on sale"}
                      </Btn>
                      {t.override !== null && (
                        <Btn tone="quiet" busy={busy === t.code}
                             title={`Fall back to catalog.js, which says ${t.default_ready ? "on sale" : "off sale"}`}
                             onClick={() => clearOverride(t)}>Reset</Btn>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      {cat && !cat.pilot.on && (
        <Panel title="Credit packs">
          <TableWrap>
            <thead><tr><Th>Pack</Th><Th align="right">Price</Th><Th align="right">Credits</Th><Th align="right">Per credit</Th><Th align="right">Validity</Th></tr></thead>
            <tbody>
              {cat.packs.map((p) => (
                <Tr key={p.code}>
                  <Td><div className="font-medium">{p.name_en}</div><div className="text-[11px] text-faint deva">{p.name_hi}</div></Td>
                  <Td align="right">{rupees(p.price_paise)}</Td>
                  <Td align="right">{num(p.credits)}</Td>
                  <Td align="right" dim>{p.credits ? rupees(Math.round(p.price_paise / p.credits)) : "—"}</Td>
                  <Td align="right" dim>{p.validity_days}d</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}

      <Confirm
        key={pending?.code || "none"}
        open={!!pending}
        tone="danger"
        confirmLabel="Take off sale"
        title={`Take ${pending?.name_en} off sale?`}
        notePrompt="Why? (shown in this table)"
        busy={busy === pending?.code}
        onCancel={() => setPending(null)}
        onConfirm={(note) => pending && apply(pending, note)}
        body={<>
          It disappears from the storefront at once — no card, no page, and checkout
          refuses it even for someone with the tab already open.
          {pending && pending.paid_orders > 0 && (
            <div className="mt-2 text-ember">
              {pending.paid_orders} paid order(s) already exist. Those orders and their
              reports are untouched; it simply stops being offered.
            </div>
          )}
        </>}
      />

      <Panel title="Not built" sub="Deliberate gaps, so nobody goes looking.">
        <div className="grid sm:grid-cols-2 gap-px bg-line">
          {[
            ["Webhook delivery log", "No table exists to read."],
            ["Refunds", "Reported where they appear; issuing one is a Razorpay action."],
            ["Editing prices", "The catalogue is code, by design."],
            ["Granting staff", "Only scripts/ensure_admin.js — that is what makes this un-escalatable."]
          ].map(([t, d]) => (
            <div key={t} className="bg-raised px-4 py-3">
              <div className="text-[12.5px] font-medium text-fg">{t}</div>
              <div className="mt-0.5 text-[11.5px] text-muted leading-snug">{d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
