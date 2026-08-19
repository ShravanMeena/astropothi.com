import LegalPage, { Clause, P, Bullets, Callout } from "./LegalPage";
import { LEGAL, operator } from "../../lib/legal";
import { SUPPORT, prettyPhone } from "../../lib/support";

export default function TermsPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <LegalPage
      onGo={onGo}
      title="Terms of Service"
      lede="What you are buying, what it is not, and what each of us owes the other. Written to be read, not to be survived."
    >
      <Clause n={1} title="Who we are, and who you are">
        <P>
          {LEGAL.brand} is a brand of <strong>{operator()}</strong>, {LEGAL.address}
          {LEGAL.gstin ? ` (GSTIN ${LEGAL.gstin})` : ""}. In these terms “we” and “us” mean
          {" "}{operator()}, and “you” means the person buying or reading a report. The
          registered office can be reached at {LEGAL.officeEmail} or {LEGAL.officePhone}; for
          anything about an order, the support line in clause 13 is far faster.
        </P>
        <P>
          By placing an order you accept these terms and the{" "}
          <button onClick={() => onGo("/privacy")} className="text-brass hover:underline">Privacy Policy</button>.
          If you do not accept them, do not order. You must be 18 or older to buy. You may order a
          report about a child only if you are that child's parent or legal guardian.
        </P>
      </Clause>

      <Clause n={2} title="What a report is">
        <P>
          A report is a computed document. We take the birth details you give us, compute the
          chart from an astronomical ephemeris using the Lahiri (Chitrapaksha) ayanamsa, and
          write out what the classical rules say about that chart, in English or Hindi, as a PDF
          of between roughly 15 and 90 pages depending on which report you buy.
        </P>
        <P>
          The astronomy is arithmetic and we stand behind it. The interpretation is a
          traditional reading of that arithmetic and is offered for reflection.
        </P>
        <Callout>
          A report is not advice. It is not medical, psychological, legal, financial or
          investment advice, and it is not a diagnosis, a prognosis or a treatment. Nothing in a
          report should be used to decide whether to seek, continue, change or stop any medical
          treatment. For anything that matters, consult a qualified professional.
        </Callout>
        <P>
          We make no promise about outcomes, and we do not claim a report will cure, prevent or
          relieve any illness or condition. Any remedy described is a traditional practice, not a
          treatment.
        </P>
      </Clause>

      <Clause n={3} title="Your birth details, and why accuracy is on you">
        <P>
          Everything in a report follows from four things: date of birth, time of birth, place of
          birth, and — for a Vastu report — the direction your building faces. Change the birth
          time by ten minutes and the ascendant, the houses and the dasha dates all move.
        </P>
        <Callout>
          We compute what you tell us. A report generated from a wrong birth time is not a
          defective report, and clause 7 does not cover it. Please check the details on the
          form before you pay — they are shown back to you before payment for exactly that reason.
        </Callout>
        <P>
          If you genuinely do not know your birth time, say so before you order and we will tell
          you which report still makes sense; some of them lean far harder on the exact time than
          others.
        </P>
      </Clause>

      <Clause n={4} title="Price, tax and coupons">
        <Bullets items={[
          <>All prices shown are in Indian rupees and <strong>include GST</strong>. The tax
            component is shown on your invoice.</>,
          <>The price you are shown at checkout is the price you pay. We may change prices at any
            time, but a change never affects an order already placed.</>,
          <>A coupon is valid only as stated on it — for the reports it names, within its dates,
            and up to its usage limit. We validate it again when your order is created, so a code
            that has expired between loading the page and paying will not apply.</>,
          <>Coupons have no cash value, cannot be exchanged for money, and may be withdrawn at any
            time before they are used.</>
        ]} />
      </Clause>

      <Clause n={5} title="Payment">
        <P>
          Payments are taken through Razorpay on Razorpay's own hosted page. We never see or
          store your card, UPI or netbanking credentials. Your order is confirmed when Razorpay
          confirms the payment to us, not when you press pay.
        </P>
        <P>
          If money leaves your account but the payment does not reach us, the order will show as
          unpaid. Do not pay twice — contact us on {prettyPhone()} with the order number and we
          will trace it. Failed authorisations are released by your bank, typically within
          5–7 working days.
        </P>
      </Clause>

      <Clause n={6} title="Your account">
        <P>
          Your mobile number is your account. When you buy a report we create an account on that
          number so the report is waiting for you next time, and so you can find every report you
          have ever bought in one place.
        </P>
        <Callout>
          Anyone who enters your mobile number at checkout may be shown that account's order
          history. We do this because asking for a one-time password mid-purchase loses buyers,
          and we have judged the trade-off deliberately. Use a number you control. If you would
          rather your history was protected by a one-time password every time, tell us and we
          will turn that on for your account.
        </Callout>
        <P>
          Do not share your number with someone you would not want reading your reports, and tell
          us at once if you think someone else is using your account.
        </P>
      </Clause>

      <Clause n={7} title="Delivery, and what happens when it goes wrong">
        <P>
          Reports are generated within about a minute of payment. There is nothing to ship. You
          receive the report three ways: on the order page in your browser, as a PDF you can
          download and keep, and as a WhatsApp message to the number you gave us.
        </P>
        <Callout>
          If you are not satisfied with the report, for any reason, we refund it in full. No
          questions asked, no conditions, and you keep the file. Nothing in these terms narrows
          that.
        </Callout>
        <P>
          Where the fault is clearly ours — generation failed, the PDF will not open, the chart
          does not match the details you entered, or you were charged twice — we will offer to
          fix and re-issue it as well. That is an offer, never a condition: if you want the money
          back instead, you get the money back.
        </P>
        <P>
          Refunds and cancellation are set out in full on the{" "}
          <button onClick={() => onGo("/refunds")} className="text-brass hover:underline">
            Refunds &amp; Cancellation
          </button>{" "}page, which forms part of these terms.
        </P>
      </Clause>

      <Clause n={8} title="The report assistant">
        <P>
          Every finished report can be asked questions in plain language. The answers are
          produced by an AI model that has been given the text of your report and is instructed
          to answer from it.
        </P>
        <Bullets items={[
          "It can be wrong, and it can misread its own source. Treat an answer as a summary of the report, not as a new finding.",
          "The report itself, not the assistant, is the thing you bought.",
          "Your questions and its answers are stored against your order so the conversation survives a reload and so we can see where the reports are unclear. See the Privacy Policy.",
          "Do not use it for medical, legal or financial questions. It will decline, and if it does not, clause 2 still applies."
        ]} />
      </Clause>

      <Clause n={9} title="What you may and may not do with a report">
        <P>
          The report we generate for you is yours. Read it, print it, keep it, and share it with
          your family or your own astrologer.
        </P>
        <P>
          The underlying interpretation text, layout, designs and software remain ours. You may
          not resell reports, sell access to the generator, scrape the site, or use our text to
          build a competing product or to train a model. If you are an astrologer who wants to
          generate reports under your own name, that is a different product — write to us.
        </P>
      </Clause>

      <Clause n={10} title="When we can close an account">
        <P>
          We may refuse an order or close an account for fraudulent payment, chargeback abuse,
          coupon abuse, scraping or bulk automated ordering, abuse directed at our staff, or any
          use that breaks the law. Where we close an account we refund any order that has been
          paid for but not delivered.
        </P>
      </Clause>

      <Clause n={11} title="Liability">
        <P>
          We are liable for delivering the report you paid for. We are not liable for decisions
          you take after reading it. To the maximum extent Indian law allows, our total liability
          for any claim connected with a report is limited to the amount you paid for that
          report.
        </P>
        <P>
          Nothing here limits liability that cannot be limited by law, including liability for
          fraud or for death or personal injury caused by negligence. Your rights under the
          Consumer Protection Act 2019 are unaffected by anything in these terms.
        </P>
      </Clause>

      <Clause n={12} title="Changes to these terms">
        <P>
          We may update these terms. The version in force for your order is the version published
          on the day you ordered, and the date at the top of this page tells you when it last
          changed. A material change will be flagged at checkout rather than made quietly.
        </P>
      </Clause>

      <Clause n={13} title="Governing law, and talking to us first">
        <P>
          These terms are governed by the laws of India, and the courts at {LEGAL.jurisdiction}{" "}
          have exclusive jurisdiction.
        </P>
        <P>
          Before any of that: write to us. Almost everything is a re-generation or a refund, and
          both are faster than a complaint. WhatsApp {prettyPhone()} or email {SUPPORT.email}. If
          we have not sorted it out, our grievance process and the officer responsible are on
          the{" "}
          <button onClick={() => onGo("/contact")} className="text-brass hover:underline">
            Contact &amp; Grievance
          </button>{" "}page.
        </P>
      </Clause>
    </LegalPage>
  );
}
