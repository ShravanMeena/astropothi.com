import LegalPage, { Clause, P, Bullets, Callout, Table, DataList } from "./LegalPage";
import { LEGAL, operator } from "../../lib/legal";
import { SUPPORT, prettyPhone } from "../../lib/support";

export default function PrivacyPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <LegalPage
      onGo={onGo}
      title="Privacy Policy"
      lede="Your birth time is not ordinary data. This page says exactly what we hold, who else sees it, how long we keep it, and how to make us delete it."
    >
      <Clause n={1} title="Who is responsible">
        <P>
          <strong>{operator()}</strong>, {LEGAL.address}, is the Data Fiduciary for the personal
          data described here, under the Digital Personal Data Protection Act 2023. {LEGAL.brand}
          {" "}is one of its brands.
        </P>
        <P>
          For anything about your data, write to <strong>{LEGAL.dpoEmail}</strong>. For anything
          about an order, WhatsApp {prettyPhone()} or email {SUPPORT.email} — it is the faster
          route and reaches the same people. Our grievance process is on the{" "}
          <button onClick={() => onGo("/contact")} className="text-brass hover:underline">
            Contact &amp; Grievance
          </button>{" "}page.
        </P>
      </Clause>

      <Clause n={2} title="What we collect">
        <DataList items={[
          { term: "Name, gender, date, time and place of birth",
            note: "It is the input to the calculation. There is no report without it.",
            meta: "You type it on the order form" },
          { term: "Coordinates and timezone of your birth place",
            note: "The chart needs a precise latitude, longitude and UTC offset, so we resolve the place you picked into those.",
            meta: "Resolved by us when you order" },
          { term: "For a Vastu report: the direction your building faces, its type, city and room layout",
            note: "It is the input to that calculation. No birth details are used.",
            meta: "You type it on the order form" },
          { term: "Mobile number",
            note: "It is your account, the delivery channel for the report, and how we reach you about the order.",
            meta: "You type it at checkout" },
          { term: "Email address",
            note: "An alternative way to reach you. Optional.",
            meta: "Only if you give it" },
          { term: "State",
            note: "Place of supply for GST on your invoice.",
            meta: "At checkout" },
          { term: "Anything you add to your profile — interests, notes, what you follow",
            note: "To make later reports more relevant. Entirely optional, and you can empty it at any time.",
            meta: "Only if you fill it in" },
          { term: "Order and payment records: amount, tax, coupon, Razorpay reference, invoice number",
            note: "We are required to keep them, and you need them for a refund.",
            meta: "When you pay" },
          { term: "The generated report, as a PDF and as text",
            note: "So you can re-download it, read it in the browser, and ask it questions.",
            meta: "When it is generated" },
          { term: "Your questions to the report assistant, and its answers",
            note: "So the conversation survives a reload, and so we can see which chapters readers find unclear.",
            meta: "When you use the assistant" },
          { term: "Behaviour on the site: pages seen, buttons pressed, which report you looked at, where you stopped",
            note: "To understand which reports people want, and where the checkout loses them.",
            meta: "As you browse" },
          { term: "A device identifier, IP address, browser user-agent, and the utm_* tags on the link you arrived by",
            note: "To count devices rather than clicks, to know which advertisement worked, and for security.",
            meta: "As you browse" },
          { term: "One-time passwords",
            note: "To sign you in.",
            meta: "When you sign in" }
        ]} />
      </Clause>

      <Clause n={3} title="Three things worth knowing before you read further">
        <Callout>
          <strong>Your mobile number alone opens your order history.</strong> When you buy, we
          sign you in on the number you typed, without a one-time password. Anyone who enters
          that number at checkout can be shown the reports bought on it. Ask us and we will
          require a one-time password on your account instead.
        </Callout>
        <Callout>
          <strong>We record browsing from before you tell us who you are.</strong> A random
          identifier is stored in your browser on your first visit. When you later sign in, that
          earlier browsing is joined to your account — so the pages you looked at before you
          bought become part of your record. That is the whole reason it exists: it tells us
          which reports people consider and abandon.
        </Callout>
        <Callout>
          <strong>Your questions to the assistant are stored, and staff can read them.</strong>{" "}
          People ask reports about marriage, money, illness and grief. If you would rather a
          question was not kept, do not type it — and tell us if you want a conversation deleted.
        </Callout>
      </Clause>

      <Clause n={4} title="What we use it for, and nothing else">
        <Bullets items={[
          "Computing and delivering the report you asked for.",
          "Taking payment, issuing your invoice, and handling refunds.",
          "Letting you sign in and find your past reports.",
          "Answering your questions about your report, including through the assistant.",
          "Understanding how the site is used, so we can fix what is not working.",
          "Meeting our tax, accounting and legal obligations."
        ]} />
        <P>
          Your birth details are used to generate the report you ordered and to let you re-read
          it. They are not used for anything else.
        </P>
        <Callout>
          We do not sell your data, and we never will. We do not share your birth details with
          advertisers, data brokers or any other business, and we do not use them to build
          advertising audiences.
        </Callout>
      </Clause>

      <Clause n={5} title="Who else touches it">
        <P>
          Only these, only for the job named, and each under a contract that forbids using your
          data for anything else.
        </P>
        <DataList items={[
          { term: "Razorpay — India",
            note: "Gets your name, mobile number, email if you gave one, and the amount, to take the payment. We never receive your card or UPI credentials." },
          { term: "MSG91 — India",
            note: "Gets your mobile number and a link to your report, to deliver it and your one-time passwords over WhatsApp and SMS." },
          { term: "Amazon Web Services, Bedrock — Mumbai region",
            note: "Gets chapter text from your report and your questions to the assistant, to write the fuller explanations and answer you." },
          { term: "Amazon Web Services, S3 — Mumbai region",
            note: "Stores the finished PDF so you can download it again." },
          { term: "Google Maps Platform",
            note: "Gets the birth place name you typed, to turn it into coordinates. Called from our server, never from your browser, so Google does not see your device." },
          { term: "Our hosting provider — India region",
            note: "Runs the service, and therefore holds everything at rest." }
        ]} />
        <P>
          We will also disclose data where the law requires it, or to establish or defend a legal
          claim. We do not transfer personal data outside India except as shown above, and we do
          not transfer it to any country the Central Government has restricted under s.16 of the
          DPDP Act.
        </P>
      </Clause>

      <Clause n={6} title="How long we keep it">
        <Table
          head={["What", "Kept for"]}
          rows={[
            ["Your account and birth details", "Until you ask us to delete them"],
            ["Generated reports and their PDFs", "Until you ask us to delete them, so you can re-download"],
            ["Assistant conversations", "Until you ask us to delete them, or the order is deleted"],
            ["Order, invoice and payment records", "Eight years, as required by tax and company law — this is the one thing we cannot delete on request"],
            ["Behavioural events", "26 months, then deleted"],
            ["One-time passwords", "Minutes. They expire and are then unusable"]
          ]}
        />
      </Clause>

      <Clause n={7} title="Your rights">
        <P>Under the DPDP Act 2023 you can ask us to:</P>
        <Bullets items={[
          <><strong>Show you</strong> the personal data we hold about you, and who we have shared it with.</>,
          <><strong>Correct</strong> anything wrong, incomplete or out of date — including a birth time you entered wrongly.</>,
          <><strong>Delete</strong> your data. We will, except for the invoice records law requires us to keep, and we will tell you exactly what was retained and why.</>,
          <><strong>Withdraw consent</strong> at any time. Withdrawing it stops future processing; it does not undo what was lawfully done before.</>,
          <><strong>Nominate</strong> someone to exercise these rights if you die or become incapacitated.</>,
          <><strong>Complain</strong> — to us first, and to the Data Protection Board of India if we do not resolve it.</>
        ]} />
        <P>
          Write to {SUPPORT.email} or WhatsApp {prettyPhone()}. We will acknowledge within 48
          hours and complete the request within 30 days. There is no charge.
        </P>
      </Clause>

      <Clause n={8} title="Children">
        <P>
          A kundli is often commissioned for a newborn, so this needs saying plainly. You may
          order a report about a child only if you are that child's parent or legal guardian, and
          by ordering you confirm that you are.
        </P>
        <P>
          We do not knowingly process a child's personal data without verifiable parental
          consent, and we never track, profile or advertise to children. If you believe a child's
          data has reached us without proper consent, tell us and we will delete it.
        </P>
      </Clause>

      <Clause n={9} title="Ordering a report about someone else">
        <P>
          If you order a report about another adult — a partner, a parent, a prospective match —
          you are giving us their birth details. Please have their permission. You are
          responsible for having it, and we will delete their data on their request just as we
          would on yours.
        </P>
      </Clause>

      <Clause n={10} title="Security, and being honest about it">
        <P>
          Traffic is encrypted in transit. Payment credentials never reach our servers. Access to
          the database is restricted to the people who need it, staff accounts are separate from
          buyer accounts, and every administrative action is tied to a named account.
        </P>
        <P>
          No system is perfectly secure. If a breach affects your data we will notify you and the
          Data Protection Board as the DPDP Act requires, and we will tell you what happened
          rather than a sanitised version of it.
        </P>
      </Clause>

      <Clause n={11} title="Cookies, and what we do instead">
        <P>
          We do not use advertising or third-party tracking cookies, and there is nothing on this
          site from an advertising network. What we do use is browser storage: a random device
          identifier that persists, a visit identifier that lasts until you close the tab, your
          sign-in token, and your light or dark theme choice.
        </P>
        <P>
          Clearing your browser storage removes all of it. The site keeps working; we simply stop
          recognising the device.
        </P>
      </Clause>

      <Clause n={12} title="Changes">
        <P>
          If we change this policy in a way that affects what we collect or who sees it, we will
          say so on the site rather than only changing the date at the top.
        </P>
      </Clause>
    </LegalPage>
  );
}
