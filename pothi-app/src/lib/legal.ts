import { SUPPORT } from "./support";

/**
 * Who we legally are.
 *
 * astropothi is a brand operated by DreamyHook Digital Media. The entity name,
 * registered address and jurisdiction below are taken from the parent's own
 * published policies at dreamyhook.consulting, so the two cannot contradict
 * each other — if a buyer or a gateway compares them, they must match.
 *
 * A field left `null` is a real gap and must not be filled with a plausible
 * guess: a registered name, GSTIN or officer that is wrong is worse than one
 * that is missing, because it is a false statement on a page the CCPA, a
 * consumer forum and a payment gateway all read as a representation. Where one
 * is missing the pages say so in plain words.
 */
export const LEGAL = {
  /** Trading name — the one buyers see. */
  brand: "astropothi",

  /**
   * As published by the parent. Note there is no "Private Limited" or "LLP"
   * suffix on it, so this is the trade name rather than a proven incorporated
   * name — correct it if the entity is in fact incorporated.
   */
  entity: "DreamyHook Digital Media",

  address: "Plot 25B, Industrial Area Sector 32, Gurugram, Haryana 122001, India",

  /**
   * Not published by the parent. This one matters: our checkout says prices
   * include GST and our orders record a gst_paise component, which only makes
   * sense with a registration behind it. Resolve before launch.
   */
  gstin: null as string | null,

  /**
   * Consumer Protection (E-Commerce) Rules 2020 r.4(5) wants a *named* officer,
   * published, acknowledging within 48 hours and resolving within a month. The
   * parent does not name one either, so this stays open — a generic mailbox
   * does not satisfy the rule.
   */
  grievanceOfficer: null as string | null,
  grievanceEmail: SUPPORT.email,
  grievancePhone: SUPPORT.phone,

  /** The parent's data-protection mailbox, for DPDP requests. */
  dpoEmail: "dpo@dreamyhook.in",

  /** The registered office's own contact, distinct from buyer support. */
  officeEmail: "hello@dreamyhook.in",
  officePhone: "+91 70427 49169",

  /** Bump when the text changes materially. Shown at the top of each policy. */
  updated: "20 August 2026",

  /** Matches the parent's terms, so the two never name different courts. */
  jurisdiction: "Gurugram, Haryana"
};

/**
 * What is still missing, in words a reader can act on. Returning the specific
 * gaps rather than a boolean keeps the on-page notice honest as they close one
 * at a time.
 */
export function openGaps() {
  const gaps: string[] = [];
  if (!LEGAL.entity) gaps.push("the registered entity name");
  if (!LEGAL.address) gaps.push("the registered address");
  if (!LEGAL.grievanceOfficer)
    gaps.push("a named grievance officer, required by rule 4(5) of the Consumer Protection (E-Commerce) Rules 2020");
  if (!LEGAL.gstin)
    gaps.push("the GSTIN — these pages and the checkout both state that prices include GST");
  return gaps;
}

/** True when the pages carry everything a gateway and the CPA rules expect. */
export const legalComplete = () => openGaps().length === 0;

/** The operator's name in running text, without ever guessing the entity. */
export const operator = () => LEGAL.entity ?? LEGAL.brand;
