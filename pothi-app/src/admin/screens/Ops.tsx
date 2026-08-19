import { useEffect, useState } from "react";
import { adminApi, rupees, num, when } from "../api";
import type { PaymentLink, Catalogue, Environment } from "../types";
import { Panel, TableWrap, Th, Td, Tr, Chip, Tag, Loading, Empty, ErrorNote, Note, Stat, StatRow, Facts, SubHead } from "../ui";

export default function Ops({ environment }: { environment: Environment | null }) {
  const [links, setLinks] = useState<PaymentLink[] | null>(null);
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.get("/ops/payment-links?limit=100").then(setLinks).catch((e) => setErr(e.message));
    adminApi.get("/ops/catalogue").then(setCat).catch((e) => setErr(e.message));
  }, []);

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
            <Note>
              <strong className="text-ember">OTP_BYPASS is set.</strong> Anyone who knows that code can sign in as
              any phone number — including an admin's — and this panel is reachable from the ordinary astrologer
              login. config.js forces the bypass to null when NODE_ENV=production, so this is a development-only
              exposure, but it does mean this environment has no real access control.
            </Note>
          )}
        </Panel>
      )}

      <Panel title="Payment links" sub={`${num(links?.length || 0)} most recent`}>
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
        <Note>
          This schema has no webhook-delivery table, so failed deliveries cannot be listed — there is no log to
          read. What is shown instead is the observable consequence: a link with no payment id against it. That is
          either a buyer who never paid or a webhook that never arrived, and these rows cannot tell the two apart.
          Razorpay's own dashboard can.
        </Note>
      </Panel>

      {cat && (
        <Panel title="Catalogue" sub={cat.source}>
          <TableWrap>
            <thead><tr>
              <Th>Report</Th><Th align="right">Chapters</Th><Th align="right">Consumer price</Th>
              <Th align="right">Net of GST</Th><Th align="right">Credits</Th><Th>Sellable</Th>
            </tr></thead>
            <tbody>
              {cat.reports.map((t) => (
                <Tr key={t.code}>
                  <Td>
                    <div className="font-medium">{t.name_en}</div>
                    <div className="text-[11px] text-faint deva">{t.name_hi}</div>
                  </Td>
                  <Td align="right">{t.chapters}</Td>
                  <Td align="right" className="font-medium">{rupees(t.consumer_price_paise)}</Td>
                  <Td align="right" dim>
                    {t.consumer_price_paise ? rupees(Math.round(t.consumer_price_paise / (1 + cat.gst_rate_pct / 100))) : "—"}
                  </Td>
                  <Td align="right">
                    {t.pilot_credits !== t.credits
                      ? <><span className="text-brass font-medium">{t.pilot_credits}</span>{" "}
                          <span className="text-faint line-through">{t.credits}</span></>
                      : t.credits}
                  </Td>
                  <Td>{t.ready ? <Tag>live</Tag> : <Chip tone="failed">not ready</Chip>}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
          <Note>
            Prices live in <code>server/catalog/catalog.js</code>, not in database rows — they change with a
            deploy, not from this screen. There is deliberately no price editor here: a price typed into an admin
            form would diverge from the one the renderer and the invoice use.
            {cat.pilot.on && " While the pilot runs every report costs 1 credit regardless of type, which is why the credit column is struck through."}
          </Note>
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

      <div>
        <SubHead>Not built</SubHead>
        <div className="card p-4 text-[12.5px] text-muted leading-relaxed space-y-1.5">
          <p>· <strong className="text-fg">Webhook delivery log.</strong> No table exists to read; adding one means a schema change and a write in the webhook handler.</p>
          <p>· <strong className="text-fg">Refunds.</strong> The <code>refunded</code> status is reported wherever it appears, but nothing here can issue one — that is a Razorpay action with money attached.</p>
          <p>· <strong className="text-fg">Editing prices or catalogue.</strong> Those are code, by design.</p>
          <p>· <strong className="text-fg">Granting or revoking staff.</strong> Only <code>scripts/ensure_admin.js</code> can do it, which is what makes this panel un-escalatable from the API.</p>
        </div>
      </div>
    </div>
  );
}
