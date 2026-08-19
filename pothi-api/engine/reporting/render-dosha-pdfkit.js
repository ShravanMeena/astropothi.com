// Dosha report PDF — same visual lineage as the kundli/match reports.
// Cover, summary, AI narrative (if present), per-flagged-dosha pages with
// remedies + lucky values, secondary doshas, closing.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

import { DEFAULT_BRANDING, loadLogoBuffer, mergeBranding } from "./branding.js";
import { translateSign, translateNakshatra } from "../i18n/astrology-labels.js";
import { pickDoshaDetails } from "../i18n/dosha-details-hi.js";
import { isDevanagariScript, t } from "../i18n/report-labels.js";
import { SHLOKA_SHRI_GANESHAYA_HI } from "../i18n/report-content-hi.js";
import { LUCKY_COLOR_HEX } from "../lib/lucky-color-hex.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GANESHA_PATH = path.resolve(__dirname, "../assets", "ganeshji.png");
async function loadGanesha() {
  try { return await readFile(GANESHA_PATH); } catch { return undefined; }
}

const DEVA_REGULAR_PATH = path.resolve(__dirname, "../assets/fonts/NotoSansDevanagari-Regular.ttf");
const DEVA_BOLD_PATH    = path.resolve(__dirname, "../assets/fonts/NotoSansDevanagari-Bold.ttf");

function registerFonts(doc) {
  try {
    doc.registerFont("Devanagari",      DEVA_REGULAR_PATH);
    doc.registerFont("Devanagari-Bold", DEVA_BOLD_PATH);
  } catch (e) {
    console.warn("[dosha-pdf] Devanagari font registration failed:", e instanceof Error ? e.message : e);
  }
}

const W = 595.28;
const H = 841.89;
const M = 40;

const C = {
  navy:   "#1a1464",
  navyD:  "#0a0840",
  gold:   "#c49a2c",
  goldL:  "#fff3e0",
  cream:  "#f9f2e0",
  white:  "#ffffff",
  ink:    "#333333",
  gray:   "#666666",
  mute:   "#888888",
  line:   "#e5d9b6",
  red:    "#c1272d",
  green:  "#1a7a3a",
  orange: "#d07b17",
  tint:   "#f7f1e3"
};

function severityColor(s) {
  switch (s) {
    case "severe":   return C.red;
    case "moderate": return C.orange;
    case "mild":     return C.gold;
    default:         return C.green;
  }
}

function severityLabel(s, lang) {
  switch (s) {
    case "severe":   return t("DOSHA_STAT_SEVERE", lang);
    case "moderate": return t("DOSHA_STAT_MODERATE", lang);
    case "mild":     return t("DOSHA_STAT_MILD", lang);
    default:         return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

function pageHeader(doc, title, kicker) {
  // Paint the page white first. Only the cover was doing this, so every other
  // page shipped with a transparent background — fine in a viewer that assumes
  // white, wrong anywhere that composites onto something else (dark-mode PDF
  // readers, thumbnailers, some print pipelines), where a sparse page came out
  // as a dark slab with text floating on it.
  doc.rect(0, 0, W, H).fill(C.white);
  doc.rect(0, 0, W, 60).fill(C.navy);
  if (kicker) {
    doc.font("Helvetica").fontSize(8).fillColor(C.goldL)
      .text(kicker.toUpperCase(), 0, 16, { width: W, align: "center", characterSpacing: 2 });
  }
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.white)
    .text(title, 0, kicker ? 30 : 22, { width: W, align: "center", characterSpacing: 1.2 });
}

/**
 * Footer: "Page 4 · Pitru Dosh".
 *
 * Callers pass only the section name. They used to compose the whole string as
 * `${PAGE_PREFIX} · ${name}`, which rendered "Page · Pitru Dosh" — the prefix is
 * just the word "Page", so every chapter page carried a footer with no number on
 * it. The count is tracked on the doc (see buildDoshaPdf) rather than passed
 * down through every render function.
 */
function pageFooter(doc, sectionLabel, lang) {
  const n = doc.__pageNo;
  const label = n
    ? `${t("DOSHA_PAGE_PREFIX", lang)} ${n} · ${sectionLabel}`
    : sectionLabel;
  doc.font("Helvetica").fontSize(8).fillColor(C.gold)
    .text(label, M, H - 18, { width: W - M * 2, align: "right" });
}

// ── Cover ─────────────────────────────────────────────────────────────────
function renderCover(doc, input, branding, logoBuffer, ganeshBuffer) {
  const lang = input.language;
  doc.rect(0, 0, W, H).fill(C.white);

  // Faint paisley
  for (let i = 0; i < 24; i++) {
    doc.circle(Math.random() * W, Math.random() * H, 20 + Math.random() * 40)
      .strokeColor("#f1f1f1").lineWidth(0.4).stroke();
  }

  if (ganeshBuffer) {
    try {
      const size = 220;
      doc.image(ganeshBuffer, (W - size) / 2, 70, { fit: [size, size], align: "center" });
    } catch { /* ignore */ }
  }

  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.gold)
    .text(isDevanagariScript(lang) ? SHLOKA_SHRI_GANESHAYA_HI : "|| Shri Ganeshaya Namah ||",
          0, 320, { width: W, align: "center" });

  const bandY = 420;
  doc.rect(0, bandY, W, 160).fill(C.navy);
  doc.font("Helvetica").fontSize(14).fillColor(C.goldL)
    .text(t("DOSHA_REPORT_BANNER", lang), 0, bandY + 22, { width: W, align: "center", characterSpacing: 3 });

  doc.font("Helvetica-Bold").fontSize(24).fillColor(C.white)
    .text(input.subject.name || "Subject", 0, bandY + 60, { width: W, align: "center" });

  doc.font("Helvetica").fontSize(11).fillColor("#d7d0b7")
    .text(`${input.subject.birthDate}  ·  ${input.subject.birthTime}  ·  ${input.subject.birthPlace}`,
          0, bandY + 100, { width: W, align: "center" });

  if (input.subject.moonSign) {
    const moonLine = `${t("DOSHA_LBL_MOON", lang)} ${translateSign(input.subject.moonSign, lang)}`
      + (input.subject.moonNakshatra ? `  ·  ${t("DOSHA_LBL_NAKSHATRA", lang)} ${translateNakshatra(input.subject.moonNakshatra, lang)}` : "")
      + (input.subject.ascendant ? `  ·  ${t("DOSHA_LBL_ASCENDANT", lang)} ${translateSign(input.subject.ascendant, lang)}` : "");
    doc.font("Helvetica").fontSize(10).fillColor("#bdb69e")
      .text(moonLine, 0, bandY + 124, { width: W, align: "center" });
  }

  // Footer
  doc.font("Helvetica").fontSize(10).fillColor(C.gray)
    .text(t("COVER_GENERATED_BY", lang), 0, H - 200, { width: W, align: "center" });
  if (logoBuffer) {
    try {
      const lw = 140, lh = 60;
      doc.image(logoBuffer, (W - lw) / 2, H - 190, { fit: [lw, lh], align: "center" });
    } catch { /* ignore */ }
  } else {
    doc.font("Helvetica-Bold").fontSize(20).fillColor(C.navy)
      .text(branding.companyName, 0, H - 170, { width: W, align: "center" });
  }
  doc.font("Helvetica").fontSize(8).fillColor(C.gray)
    .text(branding.companyInfo ?? "", 0, H - 120, { width: W, align: "center" });

  // Contact strip (only when partner supplied any contact info — keeps
  // the default cover clean for non-branded reports).
  const contactLines = [];
  if (branding.domainUrl) contactLines.push(branding.domainUrl);
  if (branding.email)     contactLines.push(branding.email);
  if (branding.mobile)    contactLines.push(branding.mobile);
  if (branding.landline && branding.landline !== branding.mobile) contactLines.push(branding.landline);
  if (contactLines.length) {
    doc.font("Helvetica").fontSize(8).fillColor(C.gray)
      .text(contactLines.join("  ·  "), 0, H - 100, { width: W, align: "center" });
  }
}

// ── Summary page ─────────────────────────────────────────────────────────
function renderSummary(doc, input) {
  const lang = input.language;
  pageHeader(doc, t("DOSHA_PAGE_SUMMARY", lang), t("DOSHA_KICKER_OVERVIEW", lang));
  let y = 90;

  // Stat band (5 columns)
  const stats = [
    [String(input.summary.present),  t("DOSHA_STAT_ACTIVE", lang),   C.red],
    [String(input.summary.severe),   t("DOSHA_STAT_SEVERE", lang),   C.red],
    [String(input.summary.moderate), t("DOSHA_STAT_MODERATE", lang), C.orange],
    [String(input.summary.mild),     t("DOSHA_STAT_MILD", lang),     C.gold],
    [String(input.summary.total),    t("DOSHA_STAT_CHECKED", lang),  C.navy]
  ];
  const cellW = (W - M * 2) / stats.length;
  doc.save();
  doc.roundedRect(M, y, W - M * 2, 60, 8).fillAndStroke(C.tint, C.line);
  doc.restore();
  stats.forEach(([num, label, col], i) => {
    const cx = M + i * cellW + cellW / 2;
    doc.font("Helvetica-Bold").fontSize(20).fillColor(col)
      .text(num, cx - 30, y + 10, { width: 60, align: "center" });
    doc.font("Helvetica").fontSize(8).fillColor(C.mute)
      .text(label.toUpperCase(), cx - 40, y + 38, { width: 80, align: "center", characterSpacing: 1 });
  });
  y += 80;

  // Subject card
  doc.save();
  doc.roundedRect(M, y, W - M * 2, 90, 8).fillAndStroke(C.white, C.line);
  doc.restore();
  doc.font("Helvetica").fontSize(8).fillColor(C.mute)
    .text(t("DOSHA_LBL_SUBJECT", lang), M + 14, y + 10, { characterSpacing: 1.2 });
  doc.font("Helvetica-Bold").fontSize(14).fillColor(C.navy)
    .text(input.subject.name || "Subject", M + 14, y + 24, { width: W - M * 2 - 28 });

  const rows = [
    [t("DOSHA_LBL_BORN", lang),       `${input.subject.birthDate}  ·  ${input.subject.birthTime}`],
    [t("DOSHA_LBL_PLACE", lang),      input.subject.birthPlace],
    [t("DOSHA_LBL_MOON", lang),       translateSign(input.subject.moonSign, lang) || "—"],
    [t("DOSHA_LBL_NAKSHATRA", lang),  translateNakshatra(input.subject.moonNakshatra, lang) || "—"],
    [t("DOSHA_LBL_ASCENDANT", lang),  translateSign(input.subject.ascendant, lang) || "—"]
  ];
  const colW2 = (W - M * 2 - 28) / 5;
  rows.forEach(([k, v], i) => {
    const cx = M + 14 + i * colW2;
    doc.font("Helvetica").fontSize(7).fillColor(C.mute).text(k.toUpperCase(), cx, y + 50, { characterSpacing: 1 });
    doc.font("Helvetica").fontSize(9).fillColor(C.ink).text(v, cx, y + 62, { width: colW2 - 4, ellipsis: true });
  });
  y += 110;

  // Flagged / clean lists
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text(t("DOSHA_FLAGGED_HEADER", lang), M, y);
  y += 20;

  if (input.flagged.length === 0 && input.secondaryFlagged.length === 0) {
    doc.save();
    doc.roundedRect(M, y, W - M * 2, 50, 8).fillAndStroke("#f2faf4", C.green);
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.green).text(t("DOSHA_CLEAR_TITLE", lang), M + 14, y + 16);
    doc.font("Helvetica").fontSize(9).fillColor(C.ink)
      .text(t("DOSHA_CLEAR_BODY", lang), M + 14, y + 30, { width: W - M * 2 - 28 });
    y += 70;
  } else {
    const detailsForLang = pickDoshaDetails(lang);
    [...input.flagged, ...input.secondaryFlagged].forEach(d => {
      const sevCol = severityColor(d.severity);
      const dName = (detailsForLang && detailsForLang[d.key] && detailsForLang[d.key].name) || d.name;
      doc.save();
      doc.roundedRect(M, y, W - M * 2, 30, 6).fillAndStroke(C.white, C.line);
      doc.restore();
      // Severity dot
      doc.circle(M + 12, y + 15, 4).fill(sevCol);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy).text(dName, M + 24, y + 8, { width: 320 });
      doc.font("Helvetica").fontSize(9).fillColor(sevCol)
        .text(severityLabel(d.severity, lang), W - M - 80, y + 10, { width: 70, align: "right" });
      y += 36;
    });
  }

  pageFooter(doc, t("DOSHA_PAGE_SUMMARY", lang), lang);
}

// ── Helpers for content pages ────────────────────────────────────────────

function ensureSpace(doc, neededY, currentY, label, lang) {
  if (currentY + neededY > H - 60) {
    doc.addPage({ size: "A4", margin: 0 });
    pageHeader(doc, label, t("DOSHA_KICKER_DETAIL", lang));
    return 90;
  }
  return currentY;
}

function drawSection(doc, title, y) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.red).text(title.toUpperCase(), M, y, { characterSpacing: 1.2 });
  doc.moveTo(M, y + 14).lineTo(W - M, y + 14).strokeColor(C.line).lineWidth(0.5).stroke();
  return y + 22;
}

function drawWrappedText(doc, text, x, y, w, opts = {}) {
  doc.font(opts.font ?? "Helvetica").fontSize(opts.size ?? 10).fillColor(opts.color ?? C.ink);
  const h = doc.heightOfString(text, { width: w, lineGap: opts.lineGap ?? 2 });
  doc.text(text, x, y, { width: w, lineGap: opts.lineGap ?? 2 });
  return y + h;
}

// ── Per-dosha page ───────────────────────────────────────────────────────
function renderDoshaPage(doc, item, detail, index, input) {
  const lang = input.language;
  // Use the localized dosha name (from the Hindi details table) for the title,
  // header and all running labels below.
  item = { ...item, name: (detail && detail.name) || item.name };
  doc.addPage({ size: "A4", margin: 0 });
  pageHeader(doc, item.name, `${t("DOSHA_KICKER_DETAIL", lang)} ${String(index).padStart(2, "0")}`);

  let y = 90;

  // Severity chip + ruler
  const sevCol = severityColor(item.severity);
  doc.save();
  doc.roundedRect(M, y, W - M * 2, 56, 8).fillAndStroke(C.tint, C.line);
  doc.restore();
  doc.font("Helvetica-Bold").fontSize(14).fillColor(C.navy)
    .text(item.name, M + 14, y + 12, { width: W - M * 2 - 100 });
  doc.font("Helvetica").fontSize(9).fillColor(C.mute)
    .text(detail ? `${t("DOSHA_RULER_PREFIX", lang)} ${detail.ruler}` : "", M + 14, y + 32, { width: W - M * 2 - 100 });

  // Severity pill on right
  const pillW = 90, pillH = 22, pillX = W - M - 14 - pillW, pillY = y + 17;
  doc.save();
  doc.roundedRect(pillX, pillY, pillW, pillH, 11).fill(sevCol);
  doc.restore();
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white)
    .text(severityLabel(item.severity, lang), pillX, pillY + 6, { width: pillW, align: "center" });

  y += 70;

  // Intro
  if (detail?.intro) {
    y = drawSection(doc, t("DOSHA_SEC_ABOUT", lang), y);
    y = drawWrappedText(doc, detail.intro, M, y, W - M * 2, { size: 10, lineGap: 3 });
    y += 10;
  }

  // Reason
  y = ensureSpace(doc, 60, y, item.name, lang);
  y = drawSection(doc, t("DOSHA_SEC_REASON", lang), y);
  y = drawWrappedText(doc, item.reason, M, y, W - M * 2, { size: 10, lineGap: 3 });
  y += 10;

  // What this means
  if (detail?.whenPresent) {
    y = ensureSpace(doc, 60, y, item.name, lang);
    y = drawSection(doc, t("DOSHA_SEC_MEANS", lang), y);
    y = drawWrappedText(doc, detail.whenPresent, M, y, W - M * 2, { size: 10, lineGap: 3 });
    y += 10;
  }

  // Sade Sati timeline (only on sade_sati page)
  if (item.key === "sade_sati" && input.sadeSati) {
    y = ensureSpace(doc, 200, y, item.name, lang);
    y = drawSection(doc, t("DOSHA_SEC_SADESATI", lang), y);
    const ss = input.sadeSati;
    y = drawWrappedText(doc, ss.note, M, y, W - M * 2, { size: 10, color: C.ink, lineGap: 3 });
    y += 8;
    if (ss.startDate && ss.endDate) {
      // Progress bar
      const barX = M, barY = y, barW = W - M * 2, barH = 8;
      doc.save();
      doc.roundedRect(barX, barY, barW, barH, 4).fill(C.line);
      doc.roundedRect(barX, barY, barW * (ss.overallProgress / 100), barH, 4).fill(C.gold);
      doc.restore();
      y += barH + 6;
      doc.font("Helvetica").fontSize(8).fillColor(C.mute)
        .text(`${t("DOSHA_WINDOW", lang)}: ${ss.startDate} → ${ss.endDate}`, M, y);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(C.navy)
        .text(`${ss.overallProgress}% ${t("DOSHA_COMPLETE", lang)}`, M, y, { width: W - M * 2, align: "right" });
      y += 14;
      // Phase rows
      for (const p of ss.phases) {
        y = ensureSpace(doc, 30, y, item.name, lang);
        const pCol = p.status === "active" ? C.gold : p.status === "past" ? C.green : C.mute;
        doc.save();
        doc.roundedRect(M, y, W - M * 2, 26, 6).fillAndStroke(C.white, C.line);
        doc.restore();
        doc.circle(M + 14, y + 13, 4).fill(pCol);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(C.navy).text(p.name, M + 24, y + 8, { width: 80 });
        doc.font("Helvetica").fontSize(8).fillColor(C.mute)
          .text(`${p.startDate} → ${p.endDate} · ${t("DOSHA_SATURN_IN", lang)} ${translateSign(p.saturnSign, lang)}`, M + 110, y + 9, { width: 320 });
        doc.font("Helvetica-Bold").fontSize(8).fillColor(pCol)
          .text(p.status === "active" ? `${p.progressPercent}%` : p.status, W - M - 60, y + 9, { width: 50, align: "right" });
        y += 32;
      }
      y += 10;
    }
  }

  // Manglik cancellations (only on manglik page)
  if (item.key === "manglik" && input.manglik) {
    const m = input.manglik;
    y = ensureSpace(doc, 100, y, item.name, lang);
    y = drawSection(doc, t("DOSHA_SEC_CANCELLATIONS", lang), y);

    // Verdict pill
    const verdictMap = {
      "no-dosha":              { label: t("DOSHA_VERDICT_NONE", lang),      color: C.green  },
      "fully-cancelled":       { label: t("DOSHA_VERDICT_CANCELLED", lang), color: C.green  },
      "substantially-reduced": { label: t("DOSHA_VERDICT_REDUCED", lang),   color: C.gold   },
      "partially-reduced":     { label: t("DOSHA_VERDICT_PARTIAL", lang),   color: C.orange },
      "active":                { label: t("DOSHA_VERDICT_ACTIVE", lang),    color: C.red    }
    };
    const v = verdictMap[m.netVerdict] ?? verdictMap.active;
    const vw = 160, vh = 22;
    doc.save();
    doc.roundedRect(M, y, vw, vh, 11).fill(v.color);
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white)
      .text(v.label, M, y + 6, { width: vw, align: "center" });
    y += vh + 8;

    y = drawWrappedText(doc, m.summary, M, y, W - M * 2, { size: 10, lineGap: 3 });
    y += 6;

    const allChecks = [
      ...m.cancellations.map(c => ({ ...c, kind: "cancellation" })),
      ...m.mitigators.map(c => ({ ...c, kind: "mitigator" }))
    ];
    for (const c of allChecks) {
      y = ensureSpace(doc, 60, y, item.name, lang);
      const wCol = c.weight === "full" ? C.green : c.weight === "partial" ? C.gold : C.red;
      doc.save();
      doc.roundedRect(M, y, W - M * 2, 50, 6).fillAndStroke(C.white, C.line);
      doc.restore();
      doc.save();
      doc.roundedRect(M + 8, y + 8, 60, 18, 9).fill(wCol);
      doc.restore();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white)
        .text(c.weight === "full" ? t("DOSHA_WEIGHT_FULL", lang) : c.weight === "partial" ? t("DOSHA_WEIGHT_PARTIAL", lang) : t("DOSHA_WEIGHT_NOTE", lang), M + 8, y + 13, { width: 60, align: "center" });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.navy)
        .text(c.label, M + 78, y + 8, { width: W - M * 2 - 90 });
      doc.font("Helvetica").fontSize(8).fillColor(C.ink)
        .text(c.detail, M + 78, y + 22, { width: W - M * 2 - 90, lineGap: 1.5 });
      y += 56;
    }
    y += 6;
  }

  // Effects
  if (detail && detail.effects.length > 0) {
    y = ensureSpace(doc, 60, y, item.name, lang);
    y = drawSection(doc, t("DOSHA_SEC_EFFECTS", lang), y);
    for (const e of detail.effects) {
      y = ensureSpace(doc, 18, y, item.name, lang);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.gold).text("•", M + 4, y);
      const h = doc.heightOfString(e, { width: W - M * 2 - 18, lineGap: 2 });
      doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
        .text(e, M + 18, y, { width: W - M * 2 - 18, lineGap: 2 });
      y += h + 4;
    }
    y += 6;
  }

  // The lucky-values grid is drawn BEFORE the remedies.
  //
  // It is a fixed two-row block (~130pt) that cannot be split, so drawn last it
  // orphaned: the remedy list filled the page exactly, the grid did not fit, and
  // it landed alone on a fresh sheet — an eight-cell table on an otherwise blank
  // page, three times over in an eight-page report.
  //
  // Choosing the order by measuring the remedies first was tried and is worse:
  // when the chapter overflows, holding the grid back just recreates the orphan,
  // because the remedies then expand to fill the space the grid would have used.
  // Drawn first the grid always has room, and what spills is the remedy list —
  // which can break across pages and carries real content when it does.
  const drawLuckyGrid = () => {
    // Lucky values grid
    if (detail) {
      y = ensureSpace(doc, 130, y, item.name, lang);
      y = drawSection(doc, t("DOSHA_SEC_LUCKY", lang), y);
      const cells = [
        [t("DOSHA_LUCKY_COLOR", lang),     detail.lucky.color],
        [t("DOSHA_LUCKY_DAY", lang),       detail.lucky.day],
        [t("DOSHA_LUCKY_NUMBER", lang),    String(detail.lucky.number)],
        [t("DOSHA_LUCKY_GEMSTONE", lang),  detail.lucky.gemstone],
        [t("DOSHA_LUCKY_METAL", lang),     detail.lucky.metal],
        [t("DOSHA_LUCKY_DIRECTION", lang), detail.lucky.direction],
        [t("DOSHA_LUCKY_DEITY", lang),     detail.lucky.deity],
        [t("DOSHA_LUCKY_MANTRA", lang),    detail.lucky.mantra]
      ];
      const cellsPerRow = 4;
      const cw = (W - M * 2) / cellsPerRow;
      const ch = 50;
      const colorLabel = t("DOSHA_LUCKY_COLOR", lang);
      cells.forEach(([k, v], i) => {
        const col = i % cellsPerRow;
        const row = Math.floor(i / cellsPerRow);
        const cx = M + col * cw;
        const cy = y + row * ch;
        doc.save();
        doc.roundedRect(cx + 2, cy, cw - 4, ch - 4, 6).fillAndStroke(C.tint, C.line);
        doc.restore();
        doc.font("Helvetica").fontSize(7).fillColor(C.mute)
          .text(k.toUpperCase(), cx + 10, cy + 6, { width: cw - 16, characterSpacing: 1 });
        // Color swatch on Color row
        if (k === colorLabel) {
          const firstColor = v.split(/[&/]/)[0].trim();
          // Hindi color names won't match LUCKY_COLOR_HEX (which is keyed by
          // English names). Map the most common Hindi colour words back to
          // English so the swatch still shows the right tint.
          const hiToEn = {
            "लाल":"Red","नारंगी":"Orange","केसरिया":"Saffron","पीला":"Yellow","स्वर्ण":"Gold","सोना":"Gold",
            "हरा":"Green","नीला":"Blue","गहरा नीला":"Dark Blue","श्वेत":"White","सफेद":"White","रजत":"Silver",
            "गुलाबी":"Pink","क्रीम":"Cream","काला":"Black","नील":"Indigo","धूसर":"Grey",
            "धुएँ जैसा धूसर":"Smoky Grey","पन्ने जैसा हरा":"Emerald Green"
          };
          const colorKey = hiToEn[firstColor] ?? firstColor;
          const hex = LUCKY_COLOR_HEX[colorKey] ?? "#cccccc";
          doc.save();
          doc.circle(cx + 14, cy + 28, 5).fill(hex).strokeColor(C.line).lineWidth(0.5).stroke();
          doc.restore();
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.navy)
            .text(v, cx + 24, cy + 24, { width: cw - 30, ellipsis: true });
        } else {
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.navy)
            .text(v, cx + 10, cy + 22, { width: cw - 16, ellipsis: true });
        }
      });
      y += Math.ceil(cells.length / cellsPerRow) * ch + 4;
    }
  };

  if (detail) drawLuckyGrid();

  // Remedies
  if (detail && detail.remedies.length > 0) {
    y = ensureSpace(doc, 60, y, item.name, lang);
    y = drawSection(doc, t("DOSHA_SEC_REMEDIES", lang), y);
    detail.remedies.forEach((r, i) => {
      y = ensureSpace(doc, 50, y, item.name, lang);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.navy)
        .text(`${i + 1}. ${r.title}`, M, y, { width: W - M * 2 });
      y += 14;
      const h = doc.heightOfString(r.detail, { width: W - M * 2 - 14, lineGap: 2 });
      doc.font("Helvetica").fontSize(9).fillColor(C.ink)
        .text(r.detail, M + 14, y, { width: W - M * 2 - 14, lineGap: 2 });
      y += h + 8;
    });
  } else if (item.remedy) {
    y = ensureSpace(doc, 40, y, item.name, lang);
    y = drawSection(doc, t("DOSHA_SEC_REMEDY", lang), y);
    y = drawWrappedText(doc, item.remedy, M, y, W - M * 2, { size: 9.5, lineGap: 2 });
    y += 6;
  }


  pageFooter(doc, item.name, lang);
}

// ── AI Reading page ──────────────────────────────────────────────────────
function renderAiReadingPage(doc, reading, lang) {
  doc.addPage({ size: "A4", margin: 0 });
  const aiTitle = t("DOSHA_AI_TITLE", lang);
  pageHeader(doc, aiTitle, t("DOSHA_KICKER_NARRATIVE", lang));
  let y = 90;

  if (reading.overallReading) {
    y = drawSection(doc, t("DOSHA_AI_OVERALL", lang), y);
    y = drawWrappedText(doc, reading.overallReading, M, y, W - M * 2, { size: 10.5, lineGap: 3 });
    y += 14;
  }

  if (reading.perDosha.length > 0) {
    y = drawSection(doc, t("DOSHA_AI_PER_DOSHA", lang), y);
    for (const d of reading.perDosha) {
      y = ensureSpace(doc, 70, y, aiTitle, lang);
      doc.save();
      doc.roundedRect(M, y, W - M * 2, 20, 4).fill(C.tint);
      doc.restore();
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.navy)
        .text(d.name, M + 10, y + 6, { width: W - M * 2 - 20 });
      y += 26;
      const h = doc.heightOfString(d.narrative, { width: W - M * 2, lineGap: 3 });
      doc.font("Helvetica").fontSize(10).fillColor(C.ink)
        .text(d.narrative, M, y, { width: W - M * 2, lineGap: 3 });
      y += h + 12;
    }
  }

  if (reading.closingGuidance) {
    y = ensureSpace(doc, 80, y, aiTitle, lang);
    y = drawSection(doc, t("DOSHA_AI_GUIDANCE", lang), y);
    y = drawWrappedText(doc, reading.closingGuidance, M, y, W - M * 2, { size: 10.5, lineGap: 3 });
  }

  pageFooter(doc, aiTitle, lang);
}

// ── Public entrypoint ────────────────────────────────────────────────────
export async function buildDoshaPdf(input) {
  // Partner branding (if any) merges over DEFAULT_BRANDING — every absent
  // field falls back to the devpunyastro default, so a request with no
  // branding gives the standard look.
  const branding = mergeBranding(input.branding);
  const [logoBuffer, ganeshBuffer] = await Promise.all([loadLogoBuffer(branding), loadGanesha()]);
  const lang = input.language;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      // Page counter for the footer. The constructor creates page 1 before any
      // listener can be attached, so start at 1 and count the rest.
      doc.__pageNo = 1;
      doc.on("pageAdded", () => { doc.__pageNo += 1; });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Register Devanagari fonts so Hindi/Marathi text renders with proper
      // glyphs. The monkey-patch below routes Helvetica → Devanagari for
      // those languages so we don't need to edit every .font() call.
      registerFonts(doc);
      if (isDevanagariScript(lang)) {
        const originalFont = doc.font.bind(doc);
        doc.font = ((src, ...rest) => {
          if (src === "Helvetica")         return originalFont("Devanagari",      ...rest);
          if (src === "Helvetica-Bold")    return originalFont("Devanagari-Bold", ...rest);
          if (src === "Helvetica-Oblique") return originalFont("Devanagari",      ...rest);
          return originalFont(src, ...rest);
        });
        // characterSpacing inserts gaps between every glyph, which breaks
        // Devanagari shaping (matras/conjuncts detach → "व्यिक्तगत" instead of
        // "व्यक्तिगत"). Strip it for all text in Devanagari mode.
        const originalText = doc.text.bind(doc);
        doc.text = ((str, ...rest) => {
          const last = rest[rest.length - 1];
          if (last && typeof last === "object" && last.characterSpacing) last.characterSpacing = 0;
          return originalText(str, ...rest);
        });
      }

      // Cover
      renderCover(doc, input, branding, logoBuffer, ganeshBuffer);

      // Summary
      doc.addPage({ size: "A4", margin: 0 });
      renderSummary(doc, input);

      // AI reading (if present) — high-value, surface early
      if (input.aiReading) renderAiReadingPage(doc, input.aiReading, lang);

      // For Hindi/Marathi, pull dosha details from the Hindi mirror table.
      // For any dosha key missing from the Hindi table, fall back to the
      // English copy the caller already passed in.
      const detailsForLang = pickDoshaDetails(lang);
      const detailFor = (key) =>
        (detailsForLang && detailsForLang[key]) || input.details[key];

      // Major flagged
      input.flagged.forEach((d, i) => {
        renderDoshaPage(doc, d, detailFor(d.key), i + 1, input);
      });

      // Secondary flagged
      input.secondaryFlagged.forEach((d, i) => {
        renderDoshaPage(doc, d, detailFor(d.key), input.flagged.length + i + 1, input);
      });

      // If nothing flagged, render a clean-chart closing page
      if (input.flagged.length === 0 && input.secondaryFlagged.length === 0) {
        doc.addPage({ size: "A4", margin: 0 });
        pageHeader(doc, t("DOSHA_CLEAR_PAGE_TITLE", lang), t("DOSHA_KICKER_CLOSING", lang));
        let y = 110;
        doc.save();
        doc.roundedRect(M, y, W - M * 2, 80, 8).fillAndStroke("#f2faf4", C.green);
        doc.restore();
        doc.font("Helvetica-Bold").fontSize(14).fillColor(C.green)
          .text(t("DOSHA_CLEAR_NO_MAJOR", lang), M + 14, y + 18, { width: W - M * 2 - 28 });
        doc.font("Helvetica").fontSize(10).fillColor(C.ink)
          .text(t("DOSHA_CLEAR_LONG", lang),
                M + 14, y + 40, { width: W - M * 2 - 28, lineGap: 2 });
        pageFooter(doc, t("DOSHA_KICKER_CLOSING", lang), lang);
      }

      doc.end();
    } catch (e) { reject(e); }
  });
}
