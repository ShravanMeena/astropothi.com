// Varshaphal (annual) report PDF — same lineage as the dosh/laal-kitab reports.
// Cover → year overview (solar return, Muntha, Varshesh, office-bearers) →
// annual chart → Mudda dasha timeline → remedies. Deterministic input.

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
function registerFonts(doc) { try { doc.registerFont("Devanagari", DEVA_REGULAR_PATH); doc.registerFont("Devanagari-Bold", DEVA_BOLD_PATH); return true; } catch { return false; } }

const W = 595.28, H = 841.89, M = 40;
const C = { navy: "#1a1464", navyD: "#0a0840", gold: "#c49a2c", goldL: "#fff3e0", white: "#ffffff", ink: "#333333", gray: "#666666", mute: "#888888", line: "#e5d9b6", red: "#c1272d", green: "#1a7a3a", orange: "#d07b17", tint: "#f7f1e3" };
const condColor = (c) => (c === "Highly Favorable" || c === "Favorable" ? C.green : c === "Unfavorable" ? C.red : C.orange);

function pageHeader(doc, title, kicker) {
  doc.rect(0, 0, W, 60).fill(C.navy);
  if (kicker) doc.font("Helvetica").fontSize(8).fillColor(C.goldL).text(kicker.toUpperCase(), 0, 16, { width: W, align: "center", characterSpacing: 2 });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.white).text(title, 0, kicker ? 30 : 22, { width: W, align: "center", characterSpacing: 1.2 });
}
function pageFooter(doc, label) { doc.font("Helvetica").fontSize(8).fillColor(C.gold).text(label, M, H - 18, { width: W - M * 2, align: "right" }); }
function ensureSpace(doc, y, need, kicker, title) {
  if (y + need <= H - 40) return y;
  pageFooter(doc, title); doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, title, kicker); return 90;
}

function renderCover(doc, subject, year, branding, logo, ganesh, hasDeva) {
  doc.rect(0, 0, W, H).fill(C.navyD); doc.rect(0, 0, W, 6).fill(C.gold);
  if (ganesh) { try { doc.image(ganesh, W / 2 - 34, 70, { width: 68 }); } catch {} }
  doc.font(hasDeva ? "Devanagari" : "Helvetica").fontSize(hasDeva ? 13 : 11).fillColor(C.goldL).text(hasDeva ? "।। श्री गणेशाय नमः ।।" : "|| Shri Ganeshaya Namah ||", 0, 150, { width: W, align: "center" });
  doc.font("Helvetica-Bold").fontSize(30).fillColor(C.gold).text("Varshaphal Report", 0, 220, { width: W, align: "center", characterSpacing: 1 });
  doc.font("Helvetica").fontSize(13).fillColor("#d7d0b7").text("Your Tajika annual (solar-return) forecast", 0, 262, { width: W, align: "center" });
  const bx = 90, by = 340, bw = W - 180;
  doc.roundedRect(bx, by, bw, 160, 10).fillAndStroke("#141043", C.gold);
  const rows = [["Name", subject.name || "—"], ["Date of Birth", subject.birthDate || "—"], ["Solar-Year From", year.fromLabel || "—"], ["Your Age This Year", String(year.age)]];
  let ry = by + 18;
  rows.forEach(([k, v]) => {
    doc.font("Helvetica").fontSize(9).fillColor(C.mute).text(k.toUpperCase(), bx + 22, ry, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.white).text(String(v), bx + 22, ry + 12, { width: bw - 44 });
    ry += 34;
  });
  if (logo) { try { doc.image(logo, W / 2 - 40, H - 150, { width: 80 }); } catch {} }
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.gold).text(branding.companyName, 0, H - 60, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.mute).text(branding.domainUrl || "", 0, H - 40, { width: W, align: "center" });
}

function chip(doc, x, y, w, label, value) {
  doc.roundedRect(x, y, w, 56, 8).fillAndStroke(C.tint, C.line);
  doc.font("Helvetica").fontSize(8).fillColor(C.mute).text(String(label).toUpperCase(), x, y + 12, { width: w, align: "center", characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(String(value), x, y + 28, { width: w, align: "center" });
}

function renderOverview(doc, v) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Your Year At A Glance", "Varshaphal");
  let y = 90;
  const cw = (W - M * 2 - 20) / 3;
  chip(doc, M, y, cw, "Annual Lagna", `${v.annualLagna.sign}`);
  chip(doc, M + cw + 10, y, cw, "Muntha", `H${v.muntha.house} · ${v.muntha.sign}`);
  chip(doc, M + (cw + 10) * 2, y, cw, "Year Lord", v.varshesh.lord);
  y += 76;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text("Theme of the Year", M, y); y += 20;
  doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(v.theme, M, y, { width: W - M * 2, lineGap: 3 });
  y = doc.y + 24;

  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text("Office-Bearers (Varshesh candidates)", M, y); y += 20;
  doc.font("Helvetica").fontSize(8.5).fillColor(C.mute).text("The year-lord is chosen as the strongest office-bearer by dignity + angularity in the annual chart.", M, y, { width: W - M * 2 }); y += 22;
  const cols = [["Planet", 90], ["House", 55], ["Condition", 120], ["Angular", 70], ["Role", 180]];
  let x = M; doc.rect(M, y, W - M * 2, 22).fill(C.navy);
  cols.forEach(([l, w]) => { doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(l, x + 6, y + 6, { width: w - 8 }); x += w; }); y += 22;
  v.candidates.forEach((c, i) => {
    doc.rect(M, y, W - M * 2, 22).fill(i === 0 ? "#fff3d6" : i % 2 ? "#faf6ea" : C.white); x = M;
    const roleText = i === 0 ? ["Year Lord", ...c.roles].join(", ") : (c.roles.join(", ") || "—");
    const cells = [c.lord, `H${c.house}`, c.condition, c.angular ? "Yes" : "—", roleText];
    cells.forEach((val, ci) => { const w = cols[ci][1]; doc.font(ci === 0 || (ci === 4 && i === 0) ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(ci === 2 ? condColor(c.condition) : ci === 4 && i === 0 ? C.gold : C.ink).text(String(val), x + 6, y + 6, { width: w - 8, ellipsis: true }); x += w; });
    y += 22;
  });
  pageFooter(doc, "Year Overview");
}

function renderAnnualChart(doc, v) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Your Annual Chart", "Varshaphal");
  let y = 90;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text(`Cast for the solar-return moment (${v.year.fromLabel}) — the planets that colour your whole year.`, M, y, { width: W - M * 2 }); y += 34;
  const cols = [["Planet", 110], ["Sign", 120], ["House", 70], ["Condition", 130], ["Retro", 60]];
  let x = M; doc.rect(M, y, W - M * 2, 22).fill(C.navy);
  cols.forEach(([l, w]) => { doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(l, x + 6, y + 6, { width: w - 8 }); x += w; }); y += 22;
  v.annualPlanets.forEach((p, i) => {
    doc.rect(M, y, W - M * 2, 22).fill(i % 2 ? "#faf6ea" : C.white); x = M;
    const cells = [p.name, p.sign, `H${p.house}`, p.condition, p.retrograde ? "R" : "—"];
    cells.forEach((val, ci) => { const w = cols[ci][1]; doc.font("Helvetica").fontSize(8.5).fillColor(ci === 3 ? condColor(p.condition) : C.ink).text(String(val), x + 6, y + 6, { width: w - 8 }); x += w; });
    y += 22;
  });
  pageFooter(doc, "Annual Chart");
}

function renderMudda(doc, v) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Month-by-Month (Mudda Dasha)", "Varshaphal");
  let y = 90;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray).text("The year unfolds through these planetary sub-periods (Varsha-Vimshottari). Each window carries the theme of its ruling planet as placed in your annual chart.", M, y, { width: W - M * 2 }); y += 40;
  v.mudda.forEach((m) => {
    y = ensureSpace(doc, y, 78, "Varshaphal", "Month-by-Month (Mudda Dasha)");
    doc.roundedRect(M, y, W - M * 2, 70, 8).fillAndStroke(C.tint, C.line);
    doc.circle(M + 18, y + 20, 9).fill(condColor(m.condition));
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(`${m.lord}`, M + 36, y + 10);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.gold).text(`${m.startLabel}  to  ${m.endLabel}`, M + 36, y + 28);
    doc.font("Helvetica").fontSize(9).fillColor(C.ink).text(m.theme, M + 14, y + 44, { width: W - M * 2 - 28, height: 22, ellipsis: true });
    y += 78;
  });
  pageFooter(doc, "Mudda Dasha");
}

function renderRemedies(doc, v, remedies) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Strengthen Your Year-Lord", "Varshaphal");
  let y = 90;
  doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(`Your Varshesh (year-lord) is ${v.varshesh.lord}. Strengthening it steadies the whole year — especially the affairs of house ${v.muntha.house} (where your Muntha sits).`, M, y, { width: W - M * 2, lineGap: 3 });
  y = doc.y + 20;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(`Upaay for ${v.varshesh.lord}`, M, y); y += 22;
  (remedies || []).forEach((r) => {
    y = ensureSpace(doc, y, 20, "Varshaphal", "Strengthen Your Year-Lord");
    doc.circle(M + 6, y + 6, 3).fill(C.gold);
    doc.font("Helvetica").fontSize(9.5).fillColor(C.ink).text(r, M + 16, y, { width: W - M * 2 - 20 }); y += 18;
  });
  pageFooter(doc, "Remedies");
}

export async function buildVarshaphalPdf(input) {
  const branding = mergeBranding(input.branding || DEFAULT_BRANDING);
  const [logo, ganesh] = await Promise.all([loadLogoBuffer(branding), loadGanesha()]);
  const v = input.varshaphal;
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
      const hasDeva = registerFonts(doc);
      renderCover(doc, v.subject, v.year, branding, logo, ganesh, hasDeva);
      renderOverview(doc, v);
      renderAnnualChart(doc, v);
      renderMudda(doc, v);
      renderRemedies(doc, v, input.remedies);
      doc.end();
    } catch (e) { reject(e); }
  });
}
