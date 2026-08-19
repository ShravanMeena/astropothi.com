// Laal Kitaab report PDF — same visual lineage as the dosh/kundli reports.
// Cover → chart snapshot + planet-house table → planet judgments → rin (debts)
// → upaay (remedies) → do's & don'ts → closing. Deterministic input.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

import { DEFAULT_BRANDING, loadLogoBuffer, mergeBranding } from "./branding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GANESHA_PATH = path.resolve(__dirname, "../assets", "ganeshji.png");
async function loadGanesha() { try { return await readFile(GANESHA_PATH); } catch { return undefined; } }

const DEVA_REGULAR_PATH = path.resolve(__dirname, "../assets/fonts/NotoSansDevanagari-Regular.ttf");
const DEVA_BOLD_PATH = path.resolve(__dirname, "../assets/fonts/NotoSansDevanagari-Bold.ttf");
function registerFonts(doc) {
  try {
    doc.registerFont("Devanagari", DEVA_REGULAR_PATH);
    doc.registerFont("Devanagari-Bold", DEVA_BOLD_PATH);
    return true;
  } catch (e) {
    console.warn("[laalkitab-pdf] Devanagari font registration failed:", e?.message || e);
    return false;
  }
}

const W = 595.28, H = 841.89, M = 40;
const C = {
  navy: "#1a1464", navyD: "#0a0840", gold: "#c49a2c", goldL: "#fff3e0", cream: "#f9f2e0",
  white: "#ffffff", ink: "#333333", gray: "#666666", mute: "#888888", line: "#e5d9b6",
  red: "#c1272d", green: "#1a7a3a", orange: "#d07b17", tint: "#f7f1e3",
};

const verdictColor = (v) => (v === "benefic" ? C.green : v === "malefic" ? C.red : C.orange);
const stateLabel = (s) => ({ strong: "Strong", moderate: "Moderate", weak: "Weak", asleep: "Asleep" }[s] || s);

function pageHeader(doc, title, kicker) {
  doc.rect(0, 0, W, 60).fill(C.navy);
  if (kicker) doc.font("Helvetica").fontSize(8).fillColor(C.goldL).text(kicker.toUpperCase(), 0, 16, { width: W, align: "center", characterSpacing: 2 });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.white).text(title, 0, kicker ? 30 : 22, { width: W, align: "center", characterSpacing: 1.2 });
}
function pageFooter(doc, label) {
  doc.font("Helvetica").fontSize(8).fillColor(C.gold).text(label, M, H - 18, { width: W - M * 2, align: "right" });
}
function ensureSpace(doc, y, need, kicker, title) {
  if (y + need <= H - 40) return y;
  pageFooter(doc, title);
  doc.addPage({ size: "A4", margin: 0 });
  pageHeader(doc, title, kicker);
  return 90;
}

function renderCover(doc, subject, branding, logo, ganesh, hasDeva) {
  doc.rect(0, 0, W, H).fill(C.navyD);
  doc.rect(0, 0, W, 6).fill(C.gold);
  if (ganesh) { try { doc.image(ganesh, W / 2 - 34, 70, { width: 68 }); } catch {} }
  doc.font(hasDeva ? "Devanagari" : "Helvetica").fontSize(hasDeva ? 13 : 11).fillColor(C.goldL)
    .text(hasDeva ? "।। श्री गणेशाय नमः ।।" : "|| Shri Ganeshaya Namah ||", 0, 150, { width: W, align: "center" });
  doc.font("Helvetica-Bold").fontSize(30).fillColor(C.gold).text("Laal Kitaab Report", 0, 220, { width: W, align: "center", characterSpacing: 1 });
  doc.font("Helvetica").fontSize(13).fillColor("#d7d0b7").text("Planet-in-house judgments & remedies from your chart", 0, 262, { width: W, align: "center" });

  const bx = 90, by = 340, bw = W - 180;
  doc.roundedRect(bx, by, bw, 150, 10).fillAndStroke("#141043", C.gold);
  const rows = [
    ["Name", subject.name || "—"],
    ["Date of Birth", subject.birthDate || "—"],
    ["Time of Birth", subject.birthTime || "—"],
    ["Place of Birth", subject.birthPlace || "—"],
  ];
  let ry = by + 20;
  rows.forEach(([k, v]) => {
    doc.font("Helvetica").fontSize(9).fillColor(C.mute).text(k.toUpperCase(), bx + 22, ry, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.white).text(String(v), bx + 22, ry + 12, { width: bw - 44 });
    ry += 32;
  });

  if (logo) { try { doc.image(logo, W / 2 - 40, H - 150, { width: 80 }); } catch {} }
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.gold).text(branding.companyName, 0, H - 60, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.mute).text(branding.domainUrl || "", 0, H - 40, { width: W, align: "center" });
}

function renderSnapshot(doc, analysis) {
  doc.addPage({ size: "A4", margin: 0 });
  pageHeader(doc, "Your Chart Snapshot", "Laal Kitaab");
  let y = 90;
  const s = analysis.summary;
  const chips = [["Lagna", s.lagna], ["Rashi", s.rashi], ["Nakshatra", s.nakshatra]].filter((c) => c[1]);
  const cw = (W - M * 2 - (chips.length - 1) * 10) / chips.length;
  chips.forEach((c, i) => {
    const cx = M + i * (cw + 10);
    doc.roundedRect(cx, y, cw, 56, 8).fillAndStroke(C.tint, C.line);
    doc.font("Helvetica").fontSize(8).fillColor(C.mute).text(String(c[0]).toUpperCase(), cx, y + 12, { width: cw, align: "center", characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text(String(c[1]), cx, y + 28, { width: cw, align: "center" });
  });
  y += 80;

  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text("Planet Placements", M, y); y += 22;
  // Table header
  const cols = [["Planet", 90], ["House", 55], ["Sign", 95], ["Dignity", 110], ["Verdict", 90], ["State", 65]];
  let x = M;
  doc.rect(M, y, W - M * 2, 22).fill(C.navy);
  cols.forEach(([label, w]) => { doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(label, x + 6, y + 6, { width: w - 8 }); x += w; });
  y += 22;
  analysis.judgments.forEach((j, idx) => {
    if (y + 22 > H - 40) { pageFooter(doc, "Snapshot"); doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Your Chart Snapshot", "Laal Kitaab"); y = 90; }
    doc.rect(M, y, W - M * 2, 22).fill(idx % 2 ? "#faf6ea" : C.white);
    x = M;
    const cells = [
      `${j.name} (${j.hindi})`, String(j.house), j.sign, j.dignity,
      j.verdict.charAt(0).toUpperCase() + j.verdict.slice(1), stateLabel(j.state),
    ];
    cells.forEach((val, ci) => {
      const w = cols[ci][1];
      const col = ci === 4 ? verdictColor(j.verdict) : C.ink;
      doc.font(ci === 4 ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(col).text(String(val), x + 6, y + 6, { width: w - 8, ellipsis: true });
      x += w;
    });
    y += 22;
  });
  pageFooter(doc, "Snapshot");
}

function renderJudgments(doc, analysis) {
  doc.addPage({ size: "A4", margin: 0 });
  pageHeader(doc, "Planet-in-House Judgments", "Laal Kitaab");
  let y = 90;
  analysis.judgments.forEach((j) => {
    y = ensureSpace(doc, y, 104, "Laal Kitaab", "Planet-in-House Judgments");
    const cardH = 96;
    doc.roundedRect(M, y, W - M * 2, cardH, 8).fillAndStroke(C.tint, C.line);
    doc.circle(M + 18, y + 20, 10).fill(verdictColor(j.verdict));
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(`${j.name} in House ${j.house}`, M + 38, y + 12);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(verdictColor(j.verdict)).text(`${j.verdict.toUpperCase()} · ${stateLabel(j.state).toUpperCase()}`, M + 38, y + 30);
    doc.font("Helvetica").fontSize(9).fillColor(C.ink).text(j.reading, M + 14, y + 46, { width: W - M * 2 - 28, height: 44, lineGap: 1.5 });
    y += cardH + 10;
  });
  pageFooter(doc, "Judgments");
}

function renderRin(doc, analysis) {
  doc.addPage({ size: "A4", margin: 0 });
  pageHeader(doc, "Rin (Debt) Analysis", "Laal Kitaab");
  let y = 90;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("Lal Kitab reads certain karmic/ancestral debts from the chart. Below, each debt is marked as indicated only where your chart afflicts its significator.", M, y, { width: W - M * 2 }); y += 40;
  analysis.rin.forEach((r) => {
    y = ensureSpace(doc, y, 64, "Laal Kitaab", "Rin (Debt) Analysis");
    const col = r.present ? C.red : C.green;
    doc.roundedRect(M, y, W - M * 2, 56, 8).fillAndStroke(r.present ? "#fdf2f2" : "#f2faf4", col);
    if (r.present) doc.circle(M + 20, y + 16, 5).fill(col);
    else { doc.circle(M + 20, y + 16, 5).lineWidth(1.2).stroke(col); }
    doc.font("Helvetica-Bold").fontSize(11).fillColor(col).text(r.name, M + 32, y + 10, { width: W - M * 2 - 46 });
    doc.font("Helvetica").fontSize(9).fillColor(C.ink).text(r.reason, M + 32, y + 28, { width: W - M * 2 - 46, height: 22, ellipsis: true });
    y += 64;
  });
  pageFooter(doc, "Rin Analysis");
}

function renderUpaay(doc, analysis) {
  doc.addPage({ size: "A4", margin: 0 });
  pageHeader(doc, "Upaay — Your Remedies", "Laal Kitaab");
  let y = 90;
  if (!analysis.upaay.length) {
    doc.font("Helvetica").fontSize(10).fillColor(C.green).text("Your planets are well placed — maintain the general good-conduct upaay below.", M, y, { width: W - M * 2 });
    y += 30;
  }
  analysis.upaay.forEach((u) => {
    const need = 40 + u.remedies.length * 16;
    y = ensureSpace(doc, y, need, "Laal Kitaab", "Upaay — Your Remedies");
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(`${u.planet}`, M, y);
    doc.font("Helvetica").fontSize(8.5).fillColor(C.mute).text(u.reason, M, y + 16, { width: W - M * 2 }); y += 34;
    u.remedies.forEach((r) => {
      doc.circle(M + 6, y + 6, 2).fill(C.gold);
      doc.font("Helvetica").fontSize(9.5).fillColor(C.ink).text(r, M + 16, y, { width: W - M * 2 - 20 });
      y += 16;
    });
    y += 8;
  });

  // Do's & Don'ts
  y = ensureSpace(doc, y, 40 + (analysis.dos.length + analysis.donts.length) * 15, "Laal Kitaab", "Upaay — Your Remedies");
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.green).text("Do", M, y); y += 20;
  analysis.dos.forEach((d) => { doc.circle(M + 5, y + 5, 3).fill(C.green); doc.font("Helvetica").fontSize(9.5).fillColor(C.ink).text(d, M + 14, y, { width: W - M * 2 - 20 }); y += 16; });
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.red).text("Don't", M, y); y += 20;
  analysis.donts.forEach((d) => { doc.circle(M + 5, y + 5, 3).fill(C.red); doc.font("Helvetica").fontSize(9.5).fillColor(C.ink).text(d, M + 14, y, { width: W - M * 2 - 20 }); y += 16; });
  pageFooter(doc, "Upaay");
}

export async function buildLaalKitaabPdf(input) {
  const branding = mergeBranding(input.branding || DEFAULT_BRANDING);
  const [logo, ganesh] = await Promise.all([loadLogoBuffer(branding), loadGanesha()]);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const hasDeva = registerFonts(doc);
      renderCover(doc, input.subject || {}, branding, logo, ganesh, hasDeva);
      renderSnapshot(doc, input.analysis);
      renderJudgments(doc, input.analysis);
      renderRin(doc, input.analysis);
      renderUpaay(doc, input.analysis);

      doc.end();
    } catch (e) { reject(e); }
  });
}
