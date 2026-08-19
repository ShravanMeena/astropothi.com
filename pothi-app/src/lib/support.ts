// One place for the support contact. It appears in the site footer, on every
// order, in the profile and inside the generated PDF — and a phone number that
// is right in three of those four places is worse than one that is wrong in
// all four, because nobody goes looking for the stale one.
//
// The PDF's copy comes from CONSUMER_SUPPORT_PHONE / CONSUMER_SUPPORT_EMAIL in
// pothi-api/.env. Change both together.

export const SUPPORT = {
  phone: "9660801827",
  email: "shravanmeena47@gmail.com",
  hours: "9am – 9pm, every day"
};

/** 96608 01827 — easier to read back over the phone than ten digits in a row. */
export const prettyPhone = (p = SUPPORT.phone) =>
  p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p;

/** wa.me needs the country code and no punctuation. */
export function waLink(text?: string) {
  const digits = SUPPORT.phone.replace(/\D/g, "");
  const n = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const mailLink = (subject?: string, body?: string) => {
  const q = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`
  ].filter(Boolean).join("&");
  return `mailto:${SUPPORT.email}${q ? `?${q}` : ""}`;
};

export const telLink = () => `tel:+91${SUPPORT.phone.replace(/\D/g, "")}`;

/**
 * The message we pre-fill. Naming the order turns "it's not working" into
 * something answerable without a round trip.
 */
export const aboutOrder = (publicId?: string, reportName?: string) =>
  publicId
    ? `Namaste, I need help with my Pothi order ${publicId}${reportName ? ` (${reportName})` : ""}.`
    : "Namaste, I have a question about Pothi.";
