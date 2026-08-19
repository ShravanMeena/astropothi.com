// Monthly Horoscope report PDF — same lineage as the other reports.
// Cover → month overview + key dates → transit cards → life-area sections.

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
const C = { navy: "#1a1464", navyD: "#0a0840", gold: "#c49a2c", goldL: "#fff3e0", white: "#ffffff", ink: "#333333", gray: "#666666", mute: "#888888", line: "#e5d9b6", red: "#c1272d", green: "#1a7a3a", orange: "#d07b17", tint: "#f7f1e3", blue: "#2456a6" };
const benefics = new Set(["Jupiter", "Venus"]);
const planetColor = (p) => (benefics.has(p) ? C.green : ["Saturn", "Mars", "Rahu", "Ketu"].includes(p) ? C.orange : C.blue);

function pageHeader(doc, title, kicker) {
  doc.rect(0, 0, W, 60).fill(C.navy);
  if (kicker) doc.font("Helvetica").fontSize(8).fillColor(C.goldL).text(kicker.toUpperCase(), 0, 16, { width: W, align: "center", characterSpacing: 2 });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.white).text(title, 0, kicker ? 30 : 22, { width: W, align: "center", characterSpacing: 1.2 });
}
function pageFooter(doc, label) { doc.font("Helvetica").fontSize(8).fillColor(C.gold).text(label, M, H - 18, { width: W - M * 2, align: "right" }); }
function ensureSpace(doc, y, need, kicker, title) { if (y + need <= H - 40) return y; pageFooter(doc, title); doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, title, kicker); return 90; }
function chip(doc, x, y, w, label, value) {
  doc.roundedRect(x, y, w, 56, 8).fillAndStroke(C.tint, C.line);
  doc.font("Helvetica").fontSize(8).fillColor(C.mute).text(String(label).toUpperCase(), x, y + 12, { width: w, align: "center", characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(String(value), x, y + 28, { width: w, align: "center" });
}

function renderCover(doc, h, branding, logo, ganesh, hasDeva) {
  doc.rect(0, 0, W, H).fill(C.navyD); doc.rect(0, 0, W, 6).fill(C.gold);
  if (ganesh) { try { doc.image(ganesh, W / 2 - 34, 70, { width: 68 }); } catch {} }
  doc.font(hasDeva ? "Devanagari" : "Helvetica").fontSize(hasDeva ? 13 : 11).fillColor(C.goldL).text(hasDeva ? "।। श्री गणेशाय नमः ।।" : "|| Shri Ganeshaya Namah ||", 0, 150, { width: W, align: "center" });
  doc.font("Helvetica-Bold").fontSize(30).fillColor(C.gold).text(`${h.month.name} Horoscope`, 0, 216, { width: W, align: "center", characterSpacing: 1 });
  doc.font("Helvetica").fontSize(13).fillColor("#d7d0b7").text(`Your month ahead, mapped onto your birth chart`, 0, 258, { width: W, align: "center" });
  const bx = 90, by = 335, bw = W - 180;
  doc.roundedRect(bx, by, bw, 160, 10).fillAndStroke("#141043", C.gold);
  const rows = [["Name", h.subject.name || "—"], ["Date of Birth", h.subject.birthDate || "—"], ["Month", `${h.month.name} ${h.month.year}`], ["Ascendant (Lagna)", h.profile.lagna || "—"]];
  let ry = by + 18;
  rows.forEach(([k, v]) => { doc.font("Helvetica").fontSize(9).fillColor(C.mute).text(k.toUpperCase(), bx + 22, ry, { characterSpacing: 1 }); doc.font("Helvetica-Bold").fontSize(12).fillColor(C.white).text(String(v), bx + 22, ry + 12, { width: bw - 44 }); ry += 34; });
  if (logo) { try { doc.image(logo, W / 2 - 40, H - 150, { width: 80 }); } catch {} }
  doc.font("Helvetica-Bold").fontSize(16).fillColor(C.gold).text(branding.companyName, 0, H - 60, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.mute).text(branding.domainUrl || "", 0, H - 40, { width: W, align: "center" });
}

function renderOverview(doc, h) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Your Month At A Glance", `${h.month.name} ${h.month.year}`);
  let y = 90;
  const sun = h.transits.find((t) => t.planet === "Sun");
  const cw = (W - M * 2 - 20) / 3;
  chip(doc, M, y, cw, "Month", `${h.month.name} ${h.month.year}`);
  chip(doc, M + cw + 10, y, cw, "Lagna", h.profile.lagna);
  chip(doc, M + (cw + 10) * 2, y, cw, "Sun House", `H${sun.natalHouse}`);
  y += 76;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text("Overview", M, y); y += 20;
  doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(h.summary, M, y, { width: W - M * 2, lineGap: 3 }); y = doc.y + 22;

  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy).text("Key Dates", M, y); y += 20;
  if (!h.keyDates.length) { doc.font("Helvetica").fontSize(10).fillColor(C.gray).text("No major sign-changes this month — a steady run.", M, y, { width: W - M * 2 }); y += 20; }
  h.keyDates.forEach((k) => {
    y = ensureSpace(doc, y, 22, `${h.month.name} ${h.month.year}`, "Your Month At A Glance");
    doc.circle(M + 6, y + 6, 3).fill(C.gold);
    doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(k.label, M + 16, y, { width: W - M * 2 - 20 }); y += 20;
  });
  pageFooter(doc, "Overview");
}

function renderTransits(doc, h) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "This Month's Transits", `${h.month.name} ${h.month.year}`);
  let y = 90;
  h.transits.forEach((t) => {
    y = ensureSpace(doc, y, 98, `${h.month.name} ${h.month.year}`, "This Month's Transits");
    const cardH = 90;
    doc.roundedRect(M, y, W - M * 2, cardH, 8).fillAndStroke(C.tint, C.line);
    doc.circle(M + 18, y + 20, 9).fill(planetColor(t.planet));
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(`${t.planet} in ${t.sign}  ·  your ${ord(t.natalHouse)} house`, M + 36, y + 12);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(t.retrograde ? C.red : C.mute).text(t.retrograde ? "RETROGRADE" : "DIRECT", M + 36, y + 30);
    doc.font("Helvetica").fontSize(9).fillColor(C.ink).text(t.reading, M + 14, y + 44, { width: W - M * 2 - 28, height: 40, lineGap: 1.5 });
    y += cardH + 10;
  });
  pageFooter(doc, "Transits");
}

function renderAreas(doc, h) {
  doc.addPage({ size: "A4", margin: 0 }); pageHeader(doc, "Life Areas This Month", `${h.month.name} ${h.month.year}`);
  let y = 90;
  const items = [["Career & Money", h.areas.career], ["Love & Relationships", h.areas.love], ["Health & Energy", h.areas.health], ["Learning & Travel", h.areas.growth]];
  items.forEach(([title, body]) => {
    y = ensureSpace(doc, y, 70, `${h.month.name} ${h.month.year}`, "Life Areas This Month");
    doc.roundedRect(M, y, W - M * 2, 60, 8).fillAndStroke(C.white, C.line);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy).text(title, M + 14, y + 10);
    doc.font("Helvetica").fontSize(9.5).fillColor(C.ink).text(body, M + 14, y + 28, { width: W - M * 2 - 28, height: 26, ellipsis: true });
    y += 70;
  });
  pageFooter(doc, "Life Areas");
}

export async function buildHoroscopePdf(input) {
  const branding = mergeBranding(input.branding || DEFAULT_BRANDING);
  const [logo, ganesh] = await Promise.all([loadLogoBuffer(branding), loadGanesha()]);
  const h = input.horoscope;
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
      const hasDeva = registerFonts(doc);
      renderCover(doc, h, branding, logo, ganesh, hasDeva);
      renderOverview(doc, h);
      renderTransits(doc, h);
      renderAreas(doc, h);
      doc.end();
    } catch (e) { reject(e); }
  });
}

function ord(n) { const s = ["th", "st", "nd", "rd"], k = n % 100; return n + (s[(k - 20) % 10] || s[k] || s[0]); }
