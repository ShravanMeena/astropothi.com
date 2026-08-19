import LegalPage, { Clause, P, Bullets, Callout, Table } from "./LegalPage";
import { SUPPORT, prettyPhone } from "../../lib/support";

export default function RefundsPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <LegalPage
      onGo={onGo}
      title="Refunds & Cancellation"
      lede="If the report was not worth it to you, tell us and we will refund it. No conditions, no form, no argument."
    >
      <Clause n={1} title="The promise">
        <Callout>
          <strong>100% refund, no questions asked.</strong> If you are not satisfied with what we
          gave you — for any reason at all — write to us and we will refund the full amount you
          paid. You do not have to justify it, prove anything, or delete the report.
        </Callout>
        <P>
          We would rather refund you and keep your trust than keep ₹399 and lose it. If a report
          did not help you, we did not do our job, and that is our problem to fix.
        </P>
      </Clause>

      <Clause n={2} title="What “no questions asked” actually means">
        <P>
          It means what it says, so there is nothing hidden below. To be completely unambiguous:
        </P>
        <Bullets items={[
          "You do not have to explain why. One line saying you want a refund is enough.",
          "It does not matter that the report was already generated, downloaded or read.",
          "It does not matter that the calculation was correct — if the reading was not useful to you, that still counts.",
          "You keep the PDF. We do not ask you to delete it or return anything.",
          "You do not lose your account, your other reports, or the right to buy again.",
          "There is no restocking fee, processing fee or deduction. You get the full amount, including the GST component."
        ]} />
      </Clause>

      <Clause n={3} title="Cancelling before you pay">
        <P>
          Close the tab. Nothing has happened, there is no order and no charge. Generation only
          starts once Razorpay confirms the payment.
        </P>
      </Clause>

      <Clause n={4} title="We would rather fix it — but only if you want that">
        <P>
          A refund is always available. Often what you actually wanted was the report, so these
          are offered as an <em>alternative</em>, never as a condition. Ask for the refund and you
          get the refund.
        </P>
        <Table
          head={["If", "We can instead"]}
          rows={[
            ["You entered the wrong birth date, time or place",
             "Re-generate it with the right details, free"],
            ["You picked the wrong report",
             "Swap it — you pay only a price difference, and we refund one if the new report is cheaper"],
            ["You wanted it in the other language",
             "Send you the other one, free"],
            ["You wanted a different design or palette",
             "Re-typeset it, free"],
            ["A chapter is missing or looks broken",
             "Fix it and re-issue the whole report"]
          ]}
        />
      </Clause>

      <Clause n={5} title="How to ask, and how long it takes">
        <P>
          WhatsApp {prettyPhone()} or email {SUPPORT.email} with your order number — it is on the
          order page, on your invoice, and on the last page of the PDF. “Please refund this” is a
          complete request.
        </P>
        <Table
          head={["Step", "Within"]}
          rows={[
            ["We acknowledge", "48 hours"],
            ["We start the refund with Razorpay", "the same day, and we do not review it first"],
            ["The money reaches your account", "5–7 working days, set by your bank, not by us"]
          ]}
        />
        <P>
          Refunds go back to the method you paid with. We cannot send one to a different card,
          account or UPI ID — that is a payment-network rule, not our preference.
        </P>
      </Clause>

      <Clause n={6} title="A payment that failed but left your account">
        <P>
          If your bank debited you but the order still shows as unpaid, the money never reached
          us, so there is nothing on our side to refund — your bank reverses it automatically,
          usually within 5–7 working days. Do not pay again. Send us the order number and we will
          confirm what we can see while you wait.
        </P>
      </Clause>

      <Clause n={7} title="Chargebacks">
        <P>
          Please just ask us. A refund is same-day and unconditional; a chargeback takes your bank
          weeks and gets you the same money. If you have already raised one, tell us and we will
          not contest it.
        </P>
      </Clause>

      <Clause n={8} title="Your statutory rights">
        <P>
          This policy is more generous than the law requires, and it does not replace your rights
          under the Consumer Protection Act 2019. Nothing here limits them.
        </P>
      </Clause>
    </LegalPage>
  );
}
