/**
 * The support block that closes every report.
 *
 * A buyer who has a question about their reading is holding a PDF, not a
 * browser tab — so the contact has to be *in the paper*, and it has to be
 * tappable. pdfkit's `link` option turns the text into a real annotation, so
 * `wa.me` opens WhatsApp and `mailto:` opens their mail app straight from the
 * reader.
 *
 * The numbers come from branding, which is per-pandit for the white-label
 * product and from CONSUMER_SUPPORT_* for our own reports. A pandit's report
 * must carry the pandit's contact, never ours.
 */

/** Strip everything but digits, then add 91 if it is a bare Indian number. */
export function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export const waLink = (phone, text) => {
  const n = waNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export const mailLink = (email, subject) => {
  const e = String(email || "").trim();
  if (!e.includes("@")) return null;
  return `mailto:${e}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
};

/** A pretty 96608 01827 rather than a wall of ten digits. */
export function prettyPhone(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return String(phone || "");
}

/**
 * Draw the block. Returns the y it finished at, so callers can lay out beneath
 * it; returns `y` untouched when there is nothing to show, so a report with no
 * contact configured gets no empty heading.
 */
export function drawSupportBlock(doc, {
  x, y, width, branding, t, lang, colors, reference
}) {
  const phone = branding.mobile || branding.landline;
  const email = branding.email;
  if (!phone && !email) return y;

  const ink = colors?.ink || "#1a1a1a";
  const accent = colors?.accent || "#b8541a";
  const faint = colors?.faint || "#6b6b6b";
  const subject = reference ? `Pothi report ${reference}` : "Pothi report";
  const greeting = reference
    ? `Namaste, I have a question about my report ${reference}.`
    : "Namaste, I have a question about my Pothi report.";

  doc.font("Helvetica-Bold").fontSize(11).fillColor(accent)
    .text(t("SUPPORT_TITLE", lang), x, y, { width, align: "center" });
  let cy = doc.y + 4;

  doc.font("Helvetica").fontSize(8.5).fillColor(faint)
    .text(t("SUPPORT_BODY", lang), x, cy, { width, align: "center", lineGap: 1.5 });
  cy = doc.y + 8;

  // Two tappable rows rather than one run-on line: on a phone the tap target
  // for a link inside a sentence is a few millimetres wide.
  const row = (label, value, link) => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(ink);
    const labelText = `${label}   `;
    const labelW = doc.widthOfString(labelText);
    doc.font("Helvetica").fontSize(10);
    const valueW = doc.widthOfString(value);
    const startX = x + (width - (labelW + valueW)) / 2;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(faint).text(labelText, startX, cy, { lineBreak: false });
    doc.font("Helvetica").fontSize(10).fillColor(accent)
      .text(value, startX + labelW, cy, { lineBreak: false, link, underline: false });
    cy += 16;
  };

  if (phone) row(t("SUPPORT_WHATSAPP", lang), prettyPhone(phone), waLink(phone, greeting));
  if (email) row(t("SUPPORT_EMAIL", lang), email, mailLink(email, subject));

  return cy;
}
