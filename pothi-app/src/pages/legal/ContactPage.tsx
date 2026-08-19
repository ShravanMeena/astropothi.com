import LegalPage, { Clause, P, Bullets, Table } from "./LegalPage";
import Support from "../../components/Support";
import { LEGAL, operator } from "../../lib/legal";
import { SUPPORT, prettyPhone } from "../../lib/support";

export default function ContactPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <LegalPage
      onGo={onGo}
      title="Contact & Grievance"
      lede="One number, one address, and a named process if the first two do not sort it out."
    >
      <Clause n={1} title="Reaching a person">
        <P>
          The fastest route is WhatsApp — a person reads every message, and the order number
          tells us what to look at.
        </P>
        <Support tone="bar" where="contact" className="pt-1" />
        <Table
          head={["", ""]}
          rows={[
            ["WhatsApp", prettyPhone()],
            ["Phone", `+91 ${prettyPhone()}`],
            ["Email", SUPPORT.email],
            ["Hours", SUPPORT.hours],
            ["Operator", operator()],
            ["Registered address", LEGAL.address ?? "to be published — see the notice above"],
            ["Registered office email", LEGAL.officeEmail],
            ["Registered office phone", LEGAL.officePhone],
            ["GSTIN", LEGAL.gstin ?? "to be published — see the notice above"]
          ]}
        />
      </Clause>

      <Clause n={2} title="Grievance officer">
        <P>
          Appointed under rule 4(5) of the Consumer Protection (E-Commerce) Rules 2020, and the
          point of contact for complaints about a report, an order, a refund, or anything to do
          with your personal data under the Digital Personal Data Protection Act 2023.
        </P>
        <Table
          head={["", ""]}
          rows={[
            ["Name", LEGAL.grievanceOfficer ?? "to be appointed and published"],
            ["Email", LEGAL.grievanceEmail],
            ["Data protection", LEGAL.dpoEmail],
            ["Phone", prettyPhone(LEGAL.grievancePhone)],
            ["Acknowledgement", "within 48 hours"],
            ["Resolution", "within 30 days"]
          ]}
        />
      </Clause>

      <Clause n={3} title="How to complain, and what happens next">
        <Bullets items={[
          <>Send your <strong>order number</strong> and one line about what is wrong to {SUPPORT.email}, with “Grievance” in the subject.</>,
          "We acknowledge within 48 hours with a reference you can quote back.",
          "We investigate and reply with an answer and the reason for it, within 30 days and usually within three working days.",
          "If you asked for a refund, we start it the same day. We do not review it first — see the Refunds page."
        ]} />
      </Clause>

      <Clause n={4} title="If we do not resolve it">
        <P>
          You are not stuck with our answer. Depending on what the complaint is about, you can go
          to:
        </P>
        <Bullets items={[
          <><strong>National Consumer Helpline</strong> — 1915, or{" "}
            <a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer"
               className="text-brass hover:underline">consumerhelpline.gov.in</a>,
            for anything about the purchase.</>,
          <><strong>The consumer commission</strong> for your district, under the Consumer
            Protection Act 2019.</>,
          <><strong>The Data Protection Board of India</strong>, for a complaint about your
            personal data that we have not resolved.</>,
          <><strong>Your card issuer or bank</strong>, for a payment you do not recognise —
            though clause 3 is usually faster.</>
        ]} />
      </Clause>

      <Clause n={5} title="Astrologers">
        <P>
          If you are an astrologer or a purohit and want to generate reports under your own name
          and branding rather than ours, that is a separate product with separate terms. Write to{" "}
          {SUPPORT.email} and say so.
        </P>
      </Clause>
    </LegalPage>
  );
}
