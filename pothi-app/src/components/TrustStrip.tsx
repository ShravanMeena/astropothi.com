/**
 * The three things a buyer checks before typing a card number.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE EDITING `SOCIAL_PROOF`.
 *
 * Everything printed here is a claim we make in an advertisement, and under the
 * Consumer Protection Act 2019 s.89 a false or misleading one carries up to two
 * years and ₹10 lakh — ₹50 lakh on repeat — with the CCPA able to fine
 * independently. ASCI has upheld complaints against astrology advertising
 * specifically. See docs/05-legal.md §2.
 *
 * So every line below has to be true on the day it is displayed:
 *
 *   · "Secure payments · Razorpay"  — true: we never touch card details.
 *   · "100% refund"                 — true: it is our published policy.
 *   · SOCIAL_PROOF                  — a count. It must match the database.
 *
 * A user count of "5 Lakh+" was requested. At the time of writing the orders
 * table holds 154 delivered reports from 4 distinct buyers, so that claim would
 * be wrong by roughly five orders of magnitude, and it is the single easiest
 * thing for a competitor or a regulator to disprove. The honest line is below.
 * Change it when the number changes — not before.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useLang } from "../lib/lang";
import { ui } from "../lib/reportStrings";
// The claims are keys now rather than sentences, so the Hindi and the English
// wording live together and cannot drift apart. WHAT each one asserts is
// unchanged — read the note above before touching any of them, in either
// language. `trustComputed` is the honest line that replaced a customer count.
const ITEMS: { icon: "lock" | "shield" | "star"; key: "trustSecure" | "trustRefund" | "trustComputed" }[] = [
  { icon: "lock",   key: "trustSecure" },
  { icon: "shield", key: "trustRefund" },
  { icon: "star",   key: "trustComputed" }
];

const Icon = ({ kind }: { kind: "lock" | "shield" | "star" }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
       className="text-brass shrink-0" aria-hidden>
    {kind === "lock" && <><rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" /></>}
    {kind === "shield" && <><path d="M12 3l7.5 3v5.2c0 4.4-3 8.3-7.5 9.6-4.5-1.3-7.5-5.2-7.5-9.6V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" /></>}
    {kind === "star" && <path d="m12 4 2.5 5.3 5.5.7-4 4 1 5.6L12 17l-5 2.6 1-5.6-4-4 5.5-.7z" />}
  </svg>
);

export default function TrustStrip({ className = "" }: { className?: string }) {
  const [lang] = useLang();
  const t = ui(lang);
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {ITEMS.map((it) => (
        <li key={it.key} className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <Icon kind={it.icon} />
          {t[it.key]}
        </li>
      ))}
    </ul>
  );
}

/** The payment line on its own, for directly beside a pay button. */
export function SecureNote({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-[11.5px] text-faint ${className}`}>
      <Icon kind="lock" />
      Secure payment on Razorpay · UPI, card or netbanking
    </p>
  );
}
