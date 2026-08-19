// ─────────────────────────────────────────────────────────────────────────────
// THE renderer. design (structure) × palette (colour) → the book.
//
// Design drives real structural differences, not styling:
//   classic    chapters flow inline, 1 column, banner cover
//   editorial  chapter per page, TWO columns, typographic cover, no ornament
//   heritage   a title page per chapter, drop caps, medallions, blessing page
// ─────────────────────────────────────────────────────────────────────────────

import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { mergeBranding, loadLogoBuffer } from "./branding.js";
import { composeStyle } from "./style.js";
import { L } from "./doc-model.js";
import { waLink, mailLink, prettyPhone } from "./support.js";

const A4 = { w: 595.28, h: 841.89 };
const ASSETS = path.resolve(import.meta.dirname, "../assets");
const FONTS = {
  deva: path.join(ASSETS, "fonts/NotoSansDevanagari-Regular.ttf"),
  devaBold: path.join(ASSETS, "fonts/NotoSansDevanagari-Bold.ttf")
};
const read = (p) => readFile(p).catch(() => undefined);

export async function renderReportPdf({ doc: model, designId, paletteId, branding: brandingIn }) {
  const st = composeStyle(designId, paletteId);
  const { P, D, spec } = st;
  const branding = mergeBranding(brandingIn || {});
  const [logo, photo, ganesh] = await Promise.all([
    loadLogoBuffer(branding),
    branding.photoUrl
      ? fetch(branding.photoUrl).then((r) => (r.ok ? r.arrayBuffer().then(Buffer.from) : undefined)).catch(() => undefined)
      : undefined,
    read(path.join(ASSETS, "ganeshji.png"))
  ]);

  const M = D.margin, CW = A4.w - M * 2;
  const hi = model.lang === "hi";
  const t = L[model.lang] || L.en;
  const S = (n) => n * st.scale;

  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false,
      info: { Title: `${model.title} — ${model.subject.name}`,
              Author: branding.panditName || branding.companyName || "" } });
    const chunks = [];
    pdf.on("data", (c) => chunks.push(c));
    pdf.on("end", () => resolve({ buffer: Buffer.concat(chunks), pages: pageNo }));
    pdf.on("error", reject);

    let hasDeva = true;
    try { pdf.registerFont("Deva", FONTS.deva); pdf.registerFont("Deva-Bold", FONTS.devaBold); }
    catch { hasDeva = false; }

    const isDeva = (v) => /[ऀ-ॿ]/.test(String(v ?? ""));
    // Font follows the CONTENT: a Devanagari shop name inside an English report
    // must still render, and Devanagari must never be uppercased or tracked.
    const FT = (v, bold) => (isDeva(v) && hasDeva ? (bold ? "Deva-Bold" : "Deva")
                                                 : (bold ? "Helvetica-Bold" : "Helvetica"));
    // Body copy gets a serif in classic/heritage — long-form reading on paper is
    // measurably easier in a serif, and it separates them from editorial's sans.
    const serif = spec.bodyFace === "serif";
    const BODY  = serif ? "Times-Roman" : "Helvetica";
    const BODYI = serif ? "Times-Italic" : "Helvetica-Oblique";
    const F = (bold) => (hi && hasDeva ? (bold ? "Deva-Bold" : "Deva")
                                       : (bold ? (serif ? "Times-Bold" : "Helvetica-Bold") : BODY));
    // Display face for headings, chosen by the design — not hardcoded to sans.
    const headSerif = (spec.headingFace || spec.bodyFace) === "serif";
    const HD = (v, bold = true) =>
      (isDeva(v) && hasDeva ? (bold ? "Deva-Bold" : "Deva")
        : headSerif ? (bold ? "Times-Bold" : "Times-Roman")
                    : (bold ? "Helvetica-Bold" : "Helvetica"));
    const FS = (n) => (hi ? S(n) + 1 : S(n));
    const up = (v) => (isDeva(v) ? String(v) : String(v ?? "").toUpperCase());
    const tr = (v, n) => (isDeva(v) ? 0 : n);

    let pageNo = 0, y = 0;
    let col = 0, colTop = 0;                       // two-column state
    const colW = spec.columns === 2 ? (CW - 24) / 2 : CW;
    const colX = (i) => M + i * (colW + 24);
    // Body copy runs at `measure` of the column and is centred in it, so a
    // single-column A4 page reads at ~70 characters instead of ~95.
    const MEASURE = spec.measure ?? 1;
    const bodyW = () => (spec.columns === 2 ? colW : Math.round(CW * MEASURE));
    const bodyX = () => (spec.columns === 2 ? colX(col) : M + Math.round((CW - CW * MEASURE) / 2));
    const textW = bodyW;
    const textX = bodyX;
    const ALIGN = spec.align || "justify";

    // ── furniture ───────────────────────────────────────────────────────────
    function border() {
      if (spec.border === "none") return;
      if (spec.border === "hairline") {
        pdf.lineWidth(0.6).strokeColor(P.rule).rect(M - 14, M - 14, CW + 28, A4.h - (M - 14) * 2).stroke();
      } else if (spec.border === "double") {
        pdf.lineWidth(1.5).strokeColor(P.rule).rect(M - 20, M - 18, CW + 40, A4.h - (M - 18) * 2).stroke();
        pdf.lineWidth(0.5).strokeColor(P.accent).rect(M - 14, M - 12, CW + 28, A4.h - (M - 12) * 2).stroke();
      }
    }
    function ornament() {
      if (spec.ornament === "corner") {
        // Inside the frame, short — a corner detail, not a second border.
        pdf.save().lineWidth(0.9).strokeColor(P.accent).opacity(0.55);
        const s = 10, o = 6;
        for (const [cx, cy, dx, dy] of [[M-o,M-o,1,1],[M+CW+o,M-o,-1,1],[M-o,A4.h-M+o,1,-1],[M+CW+o,A4.h-M+o,-1,-1]])
          pdf.moveTo(cx, cy + dy*s).lineTo(cx, cy).lineTo(cx + dx*s, cy).stroke();
        pdf.restore();
      } else if (spec.ornament === "medallion") {
        for (const [cx, cy] of [[M-20,M-18],[M+CW+20,M-18],[M-20,A4.h-M+18],[M+CW+20,A4.h-M+18]]) {
          pdf.circle(cx, cy, 4.5).fillAndStroke(P.accent, P.rule);
          pdf.circle(cx, cy, 1.6).fill(P.paper);
        }
      }
    }
    function header(label) {
      const txt = label || model.title;
      if (spec.header === "minimal") {
        pdf.font(FT(txt, false)).fontSize(S(7)).fillColor(P.inkSoft)
           .text(up(txt), M, M - 20, { width: CW, align: "left", characterSpacing: tr(txt, 1.4) });
        return M + 6;
      }
      if (spec.header === "ornate") {
        pdf.font(FT(txt, false)).fontSize(FS(7.6)).fillColor(P.inkSoft)
           .text(txt, M, M - 38, { width: CW, align: "center" });
        return M + 4;
      }
      // rule
      pdf.font(FT(txt, false)).fontSize(FS(7.5)).fillColor(P.inkSoft).text(txt, M, M - 22, { width: CW });
      pdf.lineWidth(0.6).strokeColor(P.rule).moveTo(M, M - 8).lineTo(M + CW, M - 8).stroke();
      return M + 4;
    }
    function footer() {
      const fy = A4.h - M - 8;
      const who = [branding.panditName, branding.companyName].filter(Boolean).join("  ·  ");
      if (spec.footer === "ornate") {
        pdf.lineWidth(0.5).strokeColor(P.rule).moveTo(M + 30, fy - 9).lineTo(M + CW - 30, fy - 9).stroke();
        pdf.circle(A4.w / 2, fy - 9, 2).fill(P.accent);
      } else if (spec.footer === "line" && spec.border === "none") {
        pdf.lineWidth(0.4).strokeColor(P.rule).moveTo(M, fy - 9).lineTo(M + CW, fy - 9).stroke();
      }
      pdf.fontSize(S(7.2)).fillColor(P.inkSoft);
      pdf.font(FT(who, false)).text(who, M, fy, { width: CW * 0.62, align: "left", lineBreak: false });
      pdf.font("Helvetica").text(branding.mobile || "", M + CW * 0.62, fy, { width: CW * 0.23, lineBreak: false });
      pdf.font("Helvetica").text(String(pageNo), M + CW * 0.85, fy, { width: CW * 0.15, align: "right", lineBreak: false });
    }
    function newPage(label) {
      pdf.addPage({ size: "A4", margin: 0 }); pageNo++;
      pdf.rect(0, 0, A4.w, A4.h).fill(P.paper);
      border(); ornament();
      colTop = header(label); y = colTop; col = 0;
      footer();
      return y;
    }
    /** In two-column mode, overflow moves to column 2 before a new page. */
    function need(px, label) {
      if (y + px <= A4.h - M - 30) return;
      if (spec.columns === 2 && col === 0) { col = 1; y = colTop; return; }
      newPage(label);
    }

    /**
     * What makes one report's cover different from another's.
     *
     * `houses` are the bhavas this book actually argues from, and they are the
     * ones lit up in the chart on the cover — so a Love report opens on the 7th
     * and a Health report on the 6th. Every line here is descriptive of what is
     * inside; none of it is decoration invented for the page.
     */
    const COVER_ART = {
      kundli:     { deva: "जन्म कुंडली",   houses: [1],        line: { en: "Every house, every planet, read in turn",
                                                                       hi: "प्रत्येक भाव और ग्रह का क्रमवार विवेचन" } },
      dosh:       { deva: "दोष विचार",     houses: [1, 7, 8],  line: { en: "Fourteen doshas, tested and weighed",
                                                                       hi: "चौदह दोषों की परीक्षा और निर्णय" } },
      love:       { deva: "विवाह विचार",   houses: [7],        line: { en: "The seventh house and what it promises",
                                                                       hi: "सप्तम भाव और उसका वचन" } },
      health:     { deva: "आरोग्य विचार",  houses: [6],        line: { en: "Constitution, and what to look after",
                                                                       hi: "प्रकृति और सावधानी योग्य क्षेत्र" } },
      horoscope:  { deva: "मासिक राशिफल",  houses: [],         line: { en: "This month against your own chart",
                                                                       hi: "आपकी कुंडली पर इस मास का गोचर" } },
      laalkitab:  { deva: "लाल किताब",     houses: [],         line: { en: "A tradition with its own remedies",
                                                                       hi: "अपने ही उपायों वाली परंपरा" } },
      varshaphal: { deva: "वर्षफल",        houses: [],         line: { en: "The year ahead, month by month",
                                                                       hi: "आने वाला वर्ष, मास दर मास" } },
      // The one report about a building rather than a person.
      vastu:      { deva: "वास्तु चक्र",   houses: [],         line: { en: "Nine directions, and what belongs in each",
                                                                       hi: "नौ दिशाएँ, और प्रत्येक में क्या उचित है" } }
    };
    const art = COVER_ART[model.reportType] || COVER_ART.kundli;

    /**
     * The native's own D1 chart, in the North Indian square.
     *
     * Drawn rather than illustrated, so it is the buyer's actual sky and not a
     * stock graphic — and it differs on every single cover we print.
     */
    function drawChart(x0, y0, s, { line, ink, accent, highlight = [], weight = 1.2 } = {}) {
      pdf.lineWidth(weight).strokeColor(line);
      pdf.rect(x0, y0, s, s).stroke();
      pdf.moveTo(x0, y0).lineTo(x0 + s, y0 + s).stroke();
      pdf.moveTo(x0 + s, y0).lineTo(x0, y0 + s).stroke();
      pdf.moveTo(x0 + s/2, y0).lineTo(x0 + s, y0 + s/2)
         .lineTo(x0 + s/2, y0 + s).lineTo(x0, y0 + s/2).lineTo(x0 + s/2, y0).stroke();

      const q = s / 4;
      const centres = [[s/2,q*0.62],[q*0.62,q*0.5],[q*0.5,q*1.4],[q,s/2],[q*0.5,s-q*1.4],[q*0.62,s-q*0.5],
                       [s/2,s-q*0.62],[s-q*0.62,s-q*0.5],[s-q*0.5,s-q*1.4],[s-q,s/2],[s-q*0.5,q*1.4],[s-q*0.62,q*0.5]];
      const bySign = {};
      for (const p of model.planets) (bySign[p.sign] ??= []).push(p.name.slice(0, 2));
      const signs = model.houses.length ? model.houses.map((h) => h.sign) : Object.keys(bySign);

      centres.forEach(([dx, dy], i) => {
        if (!signs[i]) return;
        const lit = highlight.includes(i + 1);
        const nx = x0 + dx, ny = y0 + dy - s * 0.072;
        const fs = Math.max(5.6, s * 0.038);

        // A tinted disc, not a colour swap: accent-on-line is two golds and
        // reads as no difference at all on a dark cover.
        if (lit) {
          pdf.circle(nx, ny + fs * 0.38, fs * 0.86).fill(accent);
          pdf.font("Helvetica-Bold").fontSize(fs).fillColor(P.coverBg);
        } else {
          pdf.font("Helvetica").fontSize(fs).fillColor(line);
        }
        pdf.text(String(i + 1), nx - 20, ny, { width: 40, align: "center" });

        const occ = bySign[signs[i]] || [];
        if (occ.length) {
          pdf.font(FT(occ.join(" "), true)).fontSize(Math.max(5.8, s * 0.042))
             .fillColor(lit ? accent : ink)
             .text(occ.join(" "), nx - s * 0.12, y0 + dy + s * 0.012,
                   { width: s * 0.24, align: "center" });
        }
      });
    }

    /**
     * For the two reports that carry no natal chart, a zodiac ring instead of a
     * blank half-page. Twelve divisions, the same twelve the book walks through.
     */
    function drawWheel(cx, cy, r, { line, accent }) {
      pdf.lineWidth(0.8).strokeColor(line);
      pdf.circle(cx, cy, r).stroke();
      pdf.circle(cx, cy, r * 0.66).stroke();
      pdf.lineWidth(0.5);
      for (let i = 0; i < 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        pdf.moveTo(cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66)
           .lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r).stroke();
        const m = (a + (15 * Math.PI / 180));
        pdf.font("Helvetica").fontSize(Math.max(5.5, r * 0.085)).fillColor(line)
           .text(String(i + 1), cx + Math.cos(m) * r * 0.83 - 10,
                                cy + Math.sin(m) * r * 0.83 - 4, { width: 20, align: "center" });
      }
      pdf.lineWidth(0.9).strokeColor(accent).circle(cx, cy, r * 0.2).stroke();
    }

    /** Whichever centrepiece this report has earned. */
    function centrepiece(top, size, { line, ink, accent }) {
      if (model.planets.length) {
        drawChart((A4.w - size) / 2, top, size, { line, ink, accent, highlight: art.houses });
        return top + size;
      }
      drawWheel(A4.w / 2, top + size / 2, size / 2, { line, accent });
      return top + size;
    }

    /**
     * The verdict, in colour.
     *
     * A reader should be able to flip through and see at a glance which doshas
     * apply and how hard, without reading a word. These five are fixed rather
     * than palette-derived, because a status colour that changes with the
     * chosen ink is not a status colour — green must mean clear in every
     * edition. They are chosen to stay legible on a light page and a dark one.
     */
    const STATUS = {
      absent:    { fill: "#1E7A4B", label: { en: "NOT PRESENT", hi: "अनुपस्थित" } },
      cancelled: { fill: "#2F7DBF", label: { en: "CANCELLED",   hi: "निवारण सहित" } },
      mild:      { fill: "#B8912B", label: { en: "MILD",        hi: "मंद" } },
      moderate:  { fill: "#C9761F", label: { en: "MODERATE",    hi: "मध्यम" } },
      high:      { fill: "#C2451A", label: { en: "HIGH",        hi: "उच्च" } },
      severe:    { fill: "#96201B", label: { en: "SEVERE",      hi: "प्रबल" } }
    };
    const statusOf = (st) =>
      !st ? null : STATUS[st.kind === "present" ? st.severity : st.kind] || null;

    /** A filled pill with the verdict, and a score bar when there is a score. */
    function statusChip(st, cx, cy) {
      const look = statusOf(st);
      if (!look) return 0;
      const text = look.label[hi ? "hi" : "en"];
      const showScore = st.kind === "present" && st.score > 0;

      pdf.font(FT(text, true)).fontSize(S(7.6));
      const tw = pdf.widthOfString(text) + 18;
      const sw = showScore ? 52 : 0;
      const w = tw + sw, h = 17, x = cx - w / 2;

      pdf.roundedRect(x, cy, tw, h, h / 2).fill(look.fill);
      pdf.fillColor("#FFFFFF").text(text, x, cy + 4.6, { width: tw, align: "center" });

      if (showScore) {
        // The bar IS the score, so the number is not repeated under it — the
        // subtitle above already prints "Present · 59/100". The empty track is
        // the status colour at low opacity, because a neutral grey track
        // disappears on a light page.
        const bx = x + tw + 8, bw = 44, by = cy + h / 2 - 3.5;
        pdf.fillOpacity(0.18).roundedRect(bx, by, bw, 7, 3.5).fill(look.fill).fillOpacity(1);
        pdf.roundedRect(bx, by, Math.max(4, bw * (st.score / 100)), 7, 3.5).fill(look.fill);
      }
      return h + 6;
    }

    // ── cover ───────────────────────────────────────────────────────────────
    const dark = isDark(P.coverBg);
    function cover() {
      pdf.addPage({ size: "A4", margin: 0 }); pageNo++;
      pdf.rect(0, 0, A4.w, A4.h).fill(P.coverBg);
      const ink = P.coverInk, acc = P.coverAccent;

      if (spec.cover === "editorial") {
        // Typographic. No deity art, no frame — the name is the hero.
        pdf.rect(M, 0, 3, A4.h).fill(acc);
        pdf.font(FT(model.title, false)).fontSize(S(10)).fillColor(acc)
           .text(up(model.title), M + 22, 120, { width: CW - 22, characterSpacing: tr(model.title, 3) });
        pdf.font(FT(model.subject.name, true)).fontSize(FS(40)).fillColor(ink)
           .text(model.subject.name, M + 22, 160, { width: CW - 22, lineGap: -4 });
        pdf.font(FT(birthLine(), false)).fontSize(S(10.5)).fillColor(P.inkSoft)
           .text(birthLine(), M + 22, pdf.y + 14, { width: CW - 22 });
        pdf.font(FT(art.deva, false)).fontSize(S(12)).fillColor(acc)
           .text(art.deva, M + 22, pdf.y + 10, { width: CW - 22 });
        profileRow(M + 22, 330, CW - 22, ink, acc, "flat");

        // Set flush to the rule rather than centred — this cover is a grid.
        if (model.planets.length) {
          drawChart(M + 22, 414, 210, { line: acc, ink, accent: acc, highlight: art.houses });
        } else {
          drawWheel(M + 127, 520, 105, { line: acc, accent: acc });
        }
        pdf.font(FT(art.line[hi ? "hi" : "en"], false)).fontSize(S(9)).fillColor(P.inkSoft)
           .text(art.line[hi ? "hi" : "en"], M + 240, 430, { width: CW - 240 });

        pdf.lineWidth(0.6).strokeColor(P.rule).moveTo(M + 22, A4.h - 210).lineTo(M + CW, A4.h - 210).stroke();
        panditBlock(A4.h - 192, ink, acc, "left", M + 22, CW - 22);

      } else if (spec.cover === "heritage") {
        pdf.lineWidth(3).strokeColor(acc).rect(26, 26, A4.w - 52, A4.h - 52).stroke();
        pdf.lineWidth(0.8).strokeColor(acc).rect(34, 34, A4.w - 68, A4.h - 68).stroke();
        for (const [cx, cy] of [[26,26],[A4.w-26,26],[26,A4.h-26],[A4.w-26,A4.h-26]]) {
          pdf.circle(cx, cy, 7).fillAndStroke(acc, acc);
          pdf.circle(cx, cy, 3).fill(P.coverBg);
        }
        if (ganesh) try { pdf.image(ganesh, A4.w/2 - 36, 76, { width: 72 }); } catch {}
        pdf.font(F(0)).fontSize(FS(11.5)).fillColor(acc)
           .text(hi ? "।। श्री गणेशाय नमः ।।" : "|| Shri Ganeshaya Namah ||", 0, 168, { width: A4.w, align: "center" });
        pdf.lineWidth(0.8).strokeColor(acc).moveTo(A4.w/2 - 70, 196).lineTo(A4.w/2 + 70, 196).stroke();
        pdf.font(F(1)).fontSize(FS(27)).fillColor(acc).text(model.title, 0, 214, { width: A4.w, align: "center" });
        // The report's own name in Devanagari, so two books never open alike.
        pdf.font(FT(art.deva, true)).fontSize(FS(13)).fillColor(dark ? "#cbbfa4" : P.inkSoft)
           .text(art.deva, 0, 250, { width: A4.w, align: "center" });
        pdf.font(FT(model.subject.name, true)).fontSize(FS(20)).fillColor(ink)
           .text(model.subject.name, 0, 278, { width: A4.w, align: "center" });
        pdf.font(FT(birthLine(), false)).fontSize(S(9.4)).fillColor(dark ? "#cbbfa4" : P.inkSoft)
           .text(birthLine(), 0, 306, { width: A4.w, align: "center" });

        // The buyer's own sky, filling what used to be half a blank page.
        centrepiece(336, 224, { line: acc, ink, accent: acc });

        pdf.font(FT(art.line[hi ? "hi" : "en"], false)).fontSize(S(9)).fillColor(acc)
           .text(art.line[hi ? "hi" : "en"], 0, 566, { width: A4.w, align: "center" });
        profileRow(70, 596, A4.w - 140, ink, acc, "panel");
        panditBlock(A4.h - 142, ink, acc, "center", 0, A4.w);

      } else {
        // banner
        if (ganesh) try { pdf.image(ganesh, A4.w/2 - 38, 92, { width: 76 }); } catch {}
        pdf.font(F(0)).fontSize(FS(11.5)).fillColor(dark ? acc : P.accent)
           .text(hi ? "।। श्री गणेशाय नमः ।।" : "|| Shri Ganeshaya Namah ||", 0, 194, { width: A4.w, align: "center" });
        pdf.rect(0, 252, A4.w, 104).fill(P.accent);
        pdf.font(F(1)).fontSize(FS(19)).fillColor("#FFFFFF").text(model.title, 0, 270, { width: A4.w, align: "center" });
        pdf.font(FT(model.subject.name, true)).fontSize(FS(24)).fillColor("#FFFFFF")
           .text(model.subject.name, 0, 300, { width: A4.w, align: "center" });
        pdf.font(FT(birthLine(), false)).fontSize(S(9.6)).fillColor("#FFFFFF")
           .text(birthLine(), 0, 332, { width: A4.w, align: "center" });
        pdf.font(FT(art.deva, false)).fontSize(S(11)).fillColor(P.accent)
           .text(art.deva, 0, 368, { width: A4.w, align: "center" });
        centrepiece(392, 180, { line: P.accent, ink, accent: P.accent });   // ends 572
        pdf.font(FT(art.line[hi ? "hi" : "en"], false)).fontSize(S(9)).fillColor(P.inkSoft)
           .text(art.line[hi ? "hi" : "en"], 0, 582, { width: A4.w, align: "center" });
        profileRow(70, 606, A4.w - 140, ink, P.accent, "panel");   // 56pt tall → ends 662
        panditBlock(A4.h - 118, ink, P.accent, "center", 0, A4.w); // clamps to ~685
      }
      footer();
    }

    const birthLine = () => {
      if (model.subject.dob || model.subject.tob) {
        return [model.subject.dob, model.subject.tob, model.subject.pob].filter(Boolean).join("  ·  ");
      }
      // No birth moment — this is a building. Say what it is instead of nothing.
      return [model.subject.facingName, model.subject.propertyType, model.subject.pob]
        .filter(Boolean).join("  ·  ");
    };

    function profileRow(x0, top, w, ink, acc, style) {
      let items = [[t.rashi, model.profile.rashi], [t.nakshatra, model.profile.nakshatra],
                   [t.lagna, model.profile.lagna]].filter(([, v]) => v);
      // Horoscope and Varshaphal carry no natal profile, and an empty band above
      // the imprint is worse than saying something true about the book.
      if (!items.length) {
        items = [
          [hi ? "अध्याय" : "Chapters", String(model.sections.length)],
          [hi ? "भाषा" : "Language", hi ? "हिन्दी" : "English"],
          [hi ? "तैयार" : "Prepared", new Date().toLocaleDateString(hi ? "hi-IN" : "en-IN",
                 { day: "numeric", month: "short", year: "numeric" })]
        ];
      }
      const gap = 14, bw = (w - gap * (items.length - 1)) / items.length;
      let x = x0;
      for (const [k, v] of items) {
        if (style === "flat") pdf.lineWidth(0.7).strokeColor(P.rule).moveTo(x, top).lineTo(x + bw, top).stroke();
        else {
          pdf.roundedRect(x, top, bw, 56, 5).fillOpacity(dark ? 0.12 : 1)
             .fillAndStroke(dark ? "#FFFFFF" : P.accentSoft, acc).fillOpacity(1);
        }
        const ty = style === "flat" ? top + 8 : top + 11;
        pdf.font(FT(k, false)).fontSize(S(7)).fillColor(dark ? "#c3b9a2" : P.inkSoft)
           .text(up(k), x, ty, { width: bw, align: style === "flat" ? "left" : "center", characterSpacing: tr(k, 1.1) });
        pdf.font(FT(v, true)).fontSize(FS(12)).fillColor(dark ? acc : ink)
           .text(String(v), x, ty + 14, { width: bw, align: style === "flat" ? "left" : "center" });
        x += bw + gap;
      }
    }

    function panditBlock(prefTop, ink, acc, align, x0, w) {
      const img = photo || logo, iw = 50;
      const parts = [];
      if (t.preparedBy) parts.push({ k: "label", v: t.preparedBy, s: S(7.4), g: 8 });
      if (img) parts.push({ k: "img", g: 10 });
      if (branding.panditName) parts.push({ k: "t", v: branding.panditName, s: FS(15), b: 1, c: acc, g: 3 });
      if (branding.companyName && branding.companyName !== branding.panditName)
        parts.push({ k: "t", v: branding.companyName, s: FS(11), c: ink, g: 2 });
      if (branding.tagline) parts.push({ k: "t", v: branding.tagline, s: S(8.4), c: dark ? "#a89e88" : P.inkSoft, g: 3 });
      const contact = [branding.mobile, branding.email].filter(Boolean).join("  ·  ");
      if (contact) parts.push({ k: "t", v: contact, s: S(9), c: dark ? "#c3b9a2" : P.inkSoft, g: 2 });
      if (branding.address) parts.push({ k: "t", v: branding.address, s: S(8), c: dark ? "#a89e88" : P.inkSoft, g: 0 });

      let total = 0;
      for (const p of parts) {
        if (p.k === "img") p.h = iw;
        else { pdf.font(FT(p.v, !!p.b)).fontSize(p.s); p.h = pdf.heightOfString(String(p.v), { width: w }); }
        total += p.h + p.g;
      }
      let yy = Math.max(150, Math.min(prefTop, A4.h - M - 34 - total));
      for (const p of parts) {
        if (p.k === "img") {
          try { pdf.image(img, align === "center" ? A4.w/2 - iw/2 : x0, yy, { fit: [iw, iw] }); } catch {}
        } else if (p.k === "label") {
          pdf.font(FT(p.v, false)).fontSize(p.s).fillColor(dark ? "#a89e88" : P.inkSoft)
             .text(up(p.v), x0, yy, { width: w, align, characterSpacing: tr(p.v, 1.5) });
        } else {
          pdf.font(FT(p.v, !!p.b)).fontSize(p.s).fillColor(p.c).text(String(p.v), x0, yy, { width: w, align });
        }
        yy += p.h + p.g;
      }
    }

    // ── front matter ────────────────────────────────────────────────────────
    function blessingPage() {
      newPage();
      // This leaf is deliberately quiet, but a 60pt icon on an A4 page reads as
      // an accident rather than an invocation. It is the only image in the book
      // and the page is already spent on it, so let it carry the page.
      const IW = 168;
      const cy = A4.h / 2 - 150;
      if (ganesh) try { pdf.image(ganesh, A4.w / 2 - IW / 2, cy, { width: IW }); } catch {}
      let by = cy + (ganesh ? IW + 34 : 20);

      pdf.font(F(0)).fontSize(FS(15)).fillColor(P.accent)
         .text(hi ? "।। शुभम् भवतु ।।" : "|| Shubham Bhavatu ||", 0, by, { width: A4.w, align: "center" });
      by = pdf.y + 16;

      pdf.lineWidth(0.7).strokeColor(P.accent)
         .moveTo(A4.w / 2 - 46, by).lineTo(A4.w / 2 + 46, by).stroke();
      pdf.circle(A4.w / 2, by, 2.2).fill(P.accent);
      by += 20;

      pdf.font(F(0)).fontSize(FS(11.5)).fillColor(P.inkSoft)
         .text(hi
           ? `यह ${model.title} ${model.subject.name} के लिए विशेष रूप से तैयार की गई है।`
           : `This ${model.title} has been prepared especially for ${model.subject.name}.`,
           M + 60, by, { width: CW - 120, align: "center", lineGap: 4 });
    }

    function h1(s) {
      pdf.font(HD(s)).fontSize(FS(19)).fillColor(P.accent).text(s, M, y, { width: CW });
      y = pdf.y + 6;
      if (spec.divider === "ornament") {
        pdf.lineWidth(0.8).strokeColor(P.rule).moveTo(M, y).lineTo(M + 70, y).stroke();
        pdf.circle(M + 78, y, 2.2).fill(P.accent);
      } else {
        pdf.lineWidth(1.2).strokeColor(P.accent).moveTo(M, y).lineTo(M + 46, y).stroke();
      }
      y += D.gapPara + 4;
    }

    function detailsPage() {
      newPage(t.details); h1(t.details);
      const rows = [
        [t.born, [model.subject.dob, model.subject.tob].filter(Boolean).join(" · ")],
        [t.place, model.subject.pob], [t.rashi, model.profile.rashi],
        [t.nakshatra, model.profile.nakshatra], [t.lagna, model.profile.lagna]
      ].filter(([, v]) => v);
      kvTable(rows);
      if (model.planets.length) { y += D.gapSec; h2(t.planetary); planetTable(); }
    }

    function profileGridPage() {
      newPage(t.details); h1(t.details);
      const cells = [
        [t.born, [model.subject.dob, model.subject.tob].filter(Boolean).join(" · ")],
        [t.place, model.subject.pob], [t.rashi, model.profile.rashi],
        [t.nakshatra, model.profile.nakshatra], [t.lagna, model.profile.lagna],
        [t.planetary, `${model.planets.length}`]
      ].filter(([, v]) => v);
      const cw = (CW - 16) / 2, ch = 62;
      cells.forEach(([k, v], i) => {
        const cx = M + (i % 2) * (cw + 16), cy2 = y + Math.floor(i / 2) * (ch + 12);
        pdf.lineWidth(0.7).strokeColor(P.rule).moveTo(cx, cy2).lineTo(cx + cw, cy2).stroke();
        pdf.font(FT(k, false)).fontSize(S(7.4)).fillColor(P.inkSoft)
           .text(up(k), cx, cy2 + 9, { width: cw, characterSpacing: tr(k, 1.3) });
        pdf.font(FT(v, true)).fontSize(FS(13)).fillColor(P.ink).text(String(v), cx, cy2 + 24, { width: cw });
      });
      y += Math.ceil(cells.length / 2) * (ch + 12) + D.gapSec;
      if (model.planets.length) { h2(t.planetary); planetTable(); }
    }

    function h2(s) {
      need(34);
      pdf.font(HD(s)).fontSize(FS(12.5)).fillColor(P.accent).text(s, textX(), y, { width: textW() });
      y = pdf.y + 5;
    }

    function kvTable(rows) {
      const rh = 23, kw = 155;
      rows.forEach(([k, v], i) => {
        need(rh);
        if (i % 2) pdf.rect(M, y, CW, rh).fill(P.tableAlt);
        pdf.font(FT(k, false)).fontSize(FS(9)).fillColor(P.inkSoft).text(k, M + 8, y + 6, { width: kw - 12, lineBreak: false });
        pdf.font(FT(v, true)).fontSize(FS(9.6)).fillColor(P.ink).text(String(v), M + kw, y + 6, { width: CW - kw - 8, lineBreak: false });
        pdf.lineWidth(0.4).strokeColor(P.rule).moveTo(M, y + rh).lineTo(M + CW, y + rh).stroke();
        y += rh;
      });
      y += D.gapPara;
    }

    function planetTable() {
      const cols = [t.planet, t.sign, t.house, t.degree], cw = [CW*0.32, CW*0.30, CW*0.14, CW*0.24], rh = 19;
      need(rh * 3);
      pdf.rect(M, y, CW, rh).fill(P.tableHead);
      let cx = M;
      cols.forEach((c, i) => { pdf.font(FT(c, true)).fontSize(FS(8.5)).fillColor(P.ink).text(c, cx+6, y+5, { width: cw[i]-8, lineBreak: false }); cx += cw[i]; });
      y += rh;
      model.planets.forEach((p, r) => {
        need(rh);
        if (r % 2) pdf.rect(M, y, CW, rh).fill(P.tableAlt);
        const cells = [p.name + (p.retrograde ? " (R)" : ""), p.sign, String(p.house ?? ""),
                       typeof p.degree === "number" ? `${p.degree.toFixed(2)}°` : String(p.degree ?? "")];
        let x2 = M;
        cells.forEach((c, i) => { pdf.font(FT(c, false)).fontSize(FS(8.5)).fillColor(P.ink).text(c, x2+6, y+5, { width: cw[i]-8, lineBreak: false }); x2 += cw[i]; });
        pdf.lineWidth(0.3).strokeColor(P.rule).moveTo(M, y+rh).lineTo(M+CW, y+rh).stroke();
        y += rh;
      });
      y += D.gapPara;
    }

    function chartPage() {
      if (!model.planets.length) return;
      newPage(t.chart); h1(t.chart);
      const s = Math.min(CW, 350), x0 = M + (CW - s) / 2, y0 = y + 8;
      pdf.lineWidth(spec.border === "none" ? 0.9 : 1.1).strokeColor(P.chartLine);
      pdf.rect(x0, y0, s, s).stroke();
      pdf.moveTo(x0, y0).lineTo(x0+s, y0+s).stroke();
      pdf.moveTo(x0+s, y0).lineTo(x0, y0+s).stroke();
      pdf.moveTo(x0+s/2, y0).lineTo(x0+s, y0+s/2).lineTo(x0+s/2, y0+s).lineTo(x0, y0+s/2).lineTo(x0+s/2, y0).stroke();
      const q = s/4;
      const centres = [[s/2,q*0.62],[q*0.62,q*0.5],[q*0.5,q*1.4],[q,s/2],[q*0.5,s-q*1.4],[q*0.62,s-q*0.5],
                       [s/2,s-q*0.62],[s-q*0.62,s-q*0.5],[s-q*0.5,s-q*1.4],[s-q,s/2],[s-q*0.5,q*1.4],[s-q*0.62,q*0.5]];
      const bySign = {};
      for (const p of model.planets) (bySign[p.sign] ??= []).push(p.name.slice(0, 2));
      const signs = model.houses.length ? model.houses.map((h) => h.sign) : Object.keys(bySign);
      centres.forEach(([dx, dy], i) => {
        if (!signs[i]) return;
        pdf.font("Helvetica").fontSize(S(7)).fillColor(P.inkSoft).text(String(i+1), x0+dx-20, y0+dy-20, { width: 40, align: "center" });
        const occ = bySign[signs[i]] || [];
        if (occ.length) pdf.font(FT(occ.join(" "), true)).fontSize(S(7.6)).fillColor(P.accent)
          .text(occ.join(" "), x0+dx-34, y0+dy-6, { width: 68, align: "center" });
      });
      y = y0 + s + D.gapSec;

      // The chart used to sit alone on the page with half a leaf of white under
      // it. The twelve houses with their lords and occupants is the table a
      // reader reaches for next, and it is already computed.
      if (model.houses.length) houseTable();
    }

    function houseTable() {
      const cols = [t.house, t.sign, t.lord, t.occupants];
      const cw = [CW * 0.12, CW * 0.26, CW * 0.22, CW * 0.40], rh = 19;
      need(rh * 4, t.chart);
      h2(t.houses);
      pdf.rect(M, y, CW, rh).fill(P.tableHead);
      let cx = M;
      cols.forEach((c, i) => {
        pdf.font(FT(c, true)).fontSize(FS(8.5)).fillColor(P.ink)
           .text(c, cx + 6, y + 5, { width: cw[i] - 8, lineBreak: false });
        cx += cw[i];
      });
      y += rh;
      model.houses.forEach((hh, r) => {
        need(rh, t.chart);
        if (r % 2) pdf.rect(M, y, CW, rh).fill(P.tableAlt);
        const occ = (hh.occupants || []).join(", ") || t.empty;
        const cells = [String(hh.house), hh.sign, hh.lord || t.empty, occ];
        let x = M;
        cells.forEach((v, i) => {
          pdf.font(FT(v, i === 0)).fontSize(FS(8.8)).fillColor(i === 0 ? P.accent : P.ink)
             .text(v, x + 6, y + 5, { width: cw[i] - 8, lineBreak: false });
          x += cw[i];
        });
        pdf.lineWidth(0.4).strokeColor(P.rule).moveTo(M, y + rh).lineTo(M + CW, y + rh).stroke();
        y += rh;
      });
      y += D.gapSec;
    }

    /**
     * The two numbers in a kundali worth drawing rather than listing.
     *
     * Both come straight from the computed chart — no smoothing, no invented
     * scale. Printed only when the chart produced them, so a report that has
     * neither never shows an empty axis.
     */
    function graphsPage() {
      const g = model.graphs || {};
      if (!g.bindus?.length && !g.dashaTimeline?.length) return;
      newPage(t.strengths); h1(t.strengths);

      // ── Ashtakavarga: bindus per house, against the average ───────────────
      if (g.bindus.length) {
        h2(t.bindus);
        const total = g.bindus.reduce((a, b) => a + (b.score || 0), 0);
        const avg = total / g.bindus.length;                 // 337 / 12 ≈ 28
        const max = Math.max(...g.bindus.map((b) => b.score || 0), avg) * 1.12;
        const H = 132, bw = CW / g.bindus.length, gap = bw * 0.28;

        pdf.font(FT(t.bindusNote, false)).fontSize(S(8.6)).fillColor(P.inkSoft)
           .text(t.bindusNote.replace("{total}", String(total)).replace("{avg}", avg.toFixed(1)),
                 M, y, { width: CW });
        y = pdf.y + 10;

        const base = y + H;
        g.bindus.forEach((b, i) => {
          const v = b.score || 0;
          const bh = Math.max(2, (v / max) * H);
          const bx = M + i * bw + gap / 2, bwid = bw - gap;
          // Above the average is the whole point of the chart, so it is the
          // only thing that gets the accent.
          const strong = v >= avg;
          pdf.fillOpacity(strong ? 1 : 0.32)
             .rect(bx, base - bh, bwid, bh).fill(P.accent).fillOpacity(1);
          pdf.font(FT(String(v), true)).fontSize(S(7.4)).fillColor(P.ink)
             .text(String(v), bx - 4, base - bh - 11, { width: bwid + 8, align: "center" });
          pdf.font("Helvetica").fontSize(S(7)).fillColor(P.inkSoft)
             .text(String(b.house ?? i + 1), bx - 4, base + 5, { width: bwid + 8, align: "center" });
        });
        // The average line, labelled — a bar chart without it says nothing.
        const ay = base - (avg / max) * H;
        pdf.lineWidth(0.7).strokeColor(P.accent).dash(3, { space: 2.5 })
           .moveTo(M, ay).lineTo(M + CW, ay).stroke().undash();
        pdf.font(FT(t.average, false)).fontSize(S(6.8)).fillColor(P.accent)
           .text(`${t.average} ${avg.toFixed(1)}`, M, ay - 9, { width: CW, align: "right" });
        pdf.lineWidth(0.6).strokeColor(P.rule).moveTo(M, base).lineTo(M + CW, base).stroke();
        y = base + 20 + D.gapSec;
      }

      // ── Vimshottari: the whole life on one line ──────────────────────────
      if (g.dashaTimeline.length) {
        need(96, t.strengths);
        h2(t.dashaLine);
        const segs = g.dashaTimeline
          .map((d) => ({ ...d, s: Date.parse(d.start), e: Date.parse(d.end) }))
          .filter((d) => !isNaN(d.s) && !isNaN(d.e) && d.e > d.s);
        if (segs.length) {
          const t0 = segs[0].s, t1 = segs[segs.length - 1].e, span = t1 - t0;
          const H = 26;
          let x = M;
          segs.forEach((d, i) => {
            const w = (CW * (d.e - d.s)) / span;
            const now = d.mahaDasha === g.currentDasha;
            pdf.fillOpacity(now ? 1 : 0.22).rect(x, y, w, H).fill(P.accent).fillOpacity(1);
            pdf.lineWidth(0.4).strokeColor(P.bg).rect(x, y, w, H).stroke();
            if (w > 16) {
              pdf.font(FT(d.mahaDasha, now)).fontSize(S(7)).fillColor(now ? "#FFFFFF" : P.ink)
                 .text(d.mahaDasha.slice(0, w > 34 ? 9 : 2), x, y + H / 2 - 4,
                       { width: w, align: "center", lineBreak: false });
            }
            // A year label under every other boundary, so they never collide.
            if (i % 2 === 0) {
              pdf.font("Helvetica").fontSize(S(6.4)).fillColor(P.inkSoft)
                 .text(String(new Date(d.s).getUTCFullYear()), x - 12, y + H + 22,
                       { width: 24, align: "center" });
            }
            x += w;
          });
          // Where the reader is standing on that line.
          const nowMs = Date.now();
          if (nowMs > t0 && nowMs < t1) {
            const nx = M + (CW * (nowMs - t0)) / span;
            pdf.lineWidth(1.2).strokeColor(P.ink).moveTo(nx, y - 4).lineTo(nx, y + H + 8).stroke();
            // Below the band, not above it — above collides with the heading.
            pdf.font(FT(t.today, true)).fontSize(S(6.6)).fillColor(P.ink)
               .text(t.today, nx - 26, y + H + 11, { width: 52, align: "center" });
          }
          y += H + 38 + D.gapPara;
        }
      }
    }

    function tocPage() {
      newPage(t.contents); h1(t.contents);
      const half = Math.ceil(model.sections.length / 2);
      const twoCol = model.sections.length > 20;
      const tocGap = 26;
      const tocW = (CW - tocGap) / 2;
      const tocX = (c) => M + c * (tocW + tocGap);
      model.sections.forEach((s, i) => {
        if (twoCol) {
          const c = i < half ? 0 : 1, row = i < half ? i : i - half;
          const yy = y + row * 14;
          pdf.font(FT(s.title, false)).fontSize(FS(8.4)).fillColor(P.ink);
          let line = `${s.n}. ${s.title}`;
          if (pdf.widthOfString(line) > tocW) {
            while (line.length > 4 && pdf.widthOfString(line + "\u2026") > tocW) line = line.slice(0, -1);
            line = line.replace(/[\s\u2014-]+$/, "") + "\u2026";
          }
          pdf.text(line, tocX(c), yy, { width: tocW, lineBreak: false });
        } else {
          need(15, t.contents);
          pdf.font(FT(s.title, false)).fontSize(FS(9.5)).fillColor(P.ink);
          let one = `${s.n}.  ${s.title}`;
          if (pdf.widthOfString(one) > CW - 40) {
            while (one.length > 4 && pdf.widthOfString(one + "\u2026") > CW - 40) one = one.slice(0, -1);
            one = one.replace(/[\s\u2014-]+$/, "") + "\u2026";
          }
          pdf.text(one, M + 4, y, { width: CW - 40, lineBreak: false });
          y += 15;
        }
      });
      if (twoCol) y += half * 14;
    }

    // ── body ────────────────────────────────────────────────────────────────
    /** Flow a string across columns/pages. Never clips, never drops text. */
    function flowText(txt, xFn, wFn) {
      let remaining = txt;
      while (remaining) {
        const w = wFn(), x = xFn();
        const space = A4.h - M - 30 - y;
        if (space < 42) { need(999); continue; }
        pdf.font(F(0)).fontSize(FS(D.body)).fillColor(P.ink);
        if (pdf.heightOfString(remaining, { width: w, lineGap: D.lead }) <= space) {
          pdf.text(remaining, x, y, { width: w, lineGap: D.lead, align: ALIGN });
          y = pdf.y + D.gapPara;
          return;
        }
        const words = remaining.split(" ");
        let fit = "", i = 0;
        while (i < words.length) {
          const next = fit ? `${fit} ${words[i]}` : words[i];
          if (pdf.heightOfString(next, { width: w, lineGap: D.lead }) > space) break;
          fit = next; i++;
        }
        if (!fit) { need(999); continue; }
        pdf.text(fit, x, y, { width: w, lineGap: D.lead, align: ALIGN });
        y = pdf.y + D.gapPara;
        remaining = words.slice(i).join(" ");
        if (remaining) need(999);
      }
    }

    function para(s, opts = {}) {
      // Heritage: decorative initial. The first few lines set beside the capital,
      // the REMAINDER flows full width below it. An earlier version clipped the
      // paragraph to the indented block with `height:`, which silently threw away
      // everything past two lines — for single-paragraph chapters that was the
      // whole chapter.
      if (opts.dropCap && spec.dropCap && s.length > 340 && !hi) {
        const first = s[0], rest = s.slice(1);
        const capFont = serif ? "Times-Bold" : "Helvetica-Bold";
        const capSize = S(30);
        const lh = FS(D.body) + D.lead;
        const indentLines = 3;
        const block = lh * indentLines;
        need(block + 22);

        const w = textW(), x = textX();
        pdf.font(capFont).fontSize(capSize);
        const capW = pdf.widthOfString(first) + 7;

        // How much of the paragraph fits alongside the capital?
        pdf.font(F(0)).fontSize(FS(D.body));
        const words = rest.split(" ");
        let head = "", i = 0;
        while (i < words.length) {
          const next = head ? `${head} ${words[i]}` : words[i];
          if (pdf.heightOfString(next, { width: w - capW, lineGap: D.lead }) > block) break;
          head = next; i++;
        }
        const tail = words.slice(i).join(" ");

        pdf.font(capFont).fontSize(capSize).fillColor(P.accent)
           .text(first, x, y - 3, { lineBreak: false });
        pdf.font(F(0)).fontSize(FS(D.body)).fillColor(P.ink)
           .text(head, x + capW, y, { width: w - capW, lineGap: D.lead, align: ALIGN });

        // Clear the capital, but no further — forcing the full block left a gap
        // above the remainder when the head only filled two lines.
        pdf.font(capFont).fontSize(capSize);
        const capH = pdf.currentLineHeight();
        y = Math.max(pdf.y, y + capH * 0.72);
        if (tail) flowText(tail, textX, textW);
        else y += D.gapPara;
        return;
      }

      flowText(s, textX, textW);
    }

    /** A quiet left-ruled note. Used for advisories so a chapter never shows
     *  two identical filled boxes stacked on each other. */
    function note(txt) {
      const w = textW(), label = hi ? "\u0938\u0941\u091d\u093e\u0935" : "Advice";
      const inner = w - 18;
      pdf.font(BODYI).fontSize(FS(D.body - 0.6));
      const h = pdf.heightOfString(txt, { width: inner, lineGap: D.lead }) + 22;
      need(h + 8);
      pdf.lineWidth(2).strokeColor(P.accent).moveTo(textX(), y + 2).lineTo(textX(), y + h - 4).stroke();
      pdf.font(FT(label, true)).fontSize(FS(7.6)).fillColor(P.accent)
         .text(up(label), textX() + 14, y + 2, { width: inner, characterSpacing: tr(label, 1.2) });
      pdf.font(BODYI).fontSize(FS(D.body - 0.6)).fillColor(P.inkSoft)
         .text(txt, textX() + 14, y + 14, { width: inner, lineGap: D.lead });
      y += h + D.gapPara;
    }

    function summary(txt) {
      const w = textW();
      if (spec.summaryStyle === "lede") {
        // Editorial: a larger intro paragraph rather than a box.
        pdf.font(F(0)).fontSize(FS(D.body + 1.6)).fillColor(P.inkSoft);
        const h = pdf.heightOfString(txt, { width: w, lineGap: D.lead + 1 });
        need(h + 10);
        pdf.text(txt, textX(), y, { width: w, lineGap: D.lead + 1 });
        y = pdf.y + D.gapPara + 4;
        return;
      }
      const label = hi ? "सार" : "In brief";
      pdf.font(F(0)).fontSize(FS(D.body - 0.5));
      const inner = w - 28;
      const h = pdf.heightOfString(txt, { width: inner, lineGap: D.lead }) + 34;
      need(h + 8);
      if (spec.summaryStyle === "panel") {
        pdf.rect(textX(), y, w, h).fillAndStroke(P.accentSoft, P.rule);
        pdf.rect(textX(), y, 3, h).fill(P.accent);
      } else {
        pdf.roundedRect(textX(), y, w, h, 5).fillAndStroke(P.accentSoft, P.rule);
      }
      pdf.font(FT(label, true)).fontSize(FS(8)).fillColor(P.accent)
         .text(up(label), textX() + 14, y + 10, { width: inner, characterSpacing: tr(label, 1.2) });
      pdf.font(F(0)).fontSize(FS(D.body - 0.5)).fillColor(P.ink)
         .text(txt, textX() + 14, y + 24, { width: inner, lineGap: D.lead });
      y += h + D.gapPara;
    }

    function bullets(items) {
      // Only WinAnsi glyphs survive the built-in Times/Helvetica encodings —
      // U+25C6 rendered as literal "%A" garbage in the serif designs.
      const glyph = spec.ornament === "medallion" ? "\u2022" : "\u2013";
      const w = textW(), indent = 15;
      y += 2;
      for (const b of items) {
        pdf.font(F(0)).fontSize(FS(D.body - 0.2));
        const h = pdf.heightOfString(b, { width: w - indent, lineGap: D.lead });
        need(h + 7);
        pdf.font(serif ? "Times-Roman" : "Helvetica").fontSize(FS(D.body - 0.2)).fillColor(P.accent)
           .text(glyph, textX(), y, { width: indent - 4, lineBreak: false });
        pdf.font(F(0)).fillColor(P.ink)
           .text(b, textX() + indent, y, { width: w - indent, lineGap: D.lead, align: "left" });
        y = pdf.y + 6;
      }
      y += 4;
    }

    /** Roughly how tall this chapter's body will be, in points. */
    function chapterHeight(s) {
      const w = textW();
      let h = 0;
      pdf.font(F(0)).fontSize(FS(D.body));
      for (const p of s.paras) h += pdf.heightOfString(p, { width: w, lineGap: D.lead }) + D.gapPara;
      for (const b of s.bullets) h += pdf.heightOfString(b, { width: w - 15, lineGap: D.lead }) + 6;
      if (s.summary) h += pdf.heightOfString(s.summary, { width: w - 28, lineGap: D.lead }) + 40;
      if (s.advisory) h += pdf.heightOfString(s.advisory, { width: w - 18, lineGap: D.lead }) + 30;
      return h;
    }

    /** Decorative chapter opener drawn at the top of the CONTENT page. Used when
     *  a chapter is too short to justify a leaf of its own — a page carrying four
     *  lines of text is not premium, it is empty. */
    function chapterOpener(s) {
      const w = textW(), x = textX();
      pdf.font("Helvetica").fontSize(S(7.6)).fillColor(P.inkSoft)
         .text(up(hi ? "अध्याय" : "Chapter"), x, y, { width: w, align: "center", characterSpacing: tr("Chapter", 2.2) });
      y = pdf.y + 4;
      pdf.font(serif ? "Times-Bold" : "Helvetica-Bold").fontSize(S(30)).fillColor(P.accent)
         .text(String(s.n), x, y, { width: w, align: "center" });
      y = pdf.y + 6;
      pdf.lineWidth(0.8).strokeColor(P.rule).moveTo(x + w / 2 - 36, y).lineTo(x + w / 2 + 36, y).stroke();
      pdf.circle(x + w / 2, y, 2.2).fill(P.accent);
      y += 12;
      pdf.font(HD(s.title)).fontSize(FS(17)).fillColor(P.ink)
         .text(s.title, x, y, { width: w, align: "center" });
      y = pdf.y + 3;
      if (s.subtitle) {
        pdf.font(FT(s.subtitle, false)).fontSize(FS(9.6)).fillColor(P.inkSoft)
           .text(s.subtitle, x, y, { width: w, align: "center" });
        y = pdf.y;
      }
      if (s.status) y += statusChip(s.status, x + w / 2, y + 6);
      y += D.gapSec;
    }

    /** A full leaf announcing the chapter. Only for chapters long enough to earn it. */
    function chapterTitlePage(s) {
      newPage(model.title);
      const cy = A4.h / 2 - 70;
      pdf.font("Helvetica").fontSize(S(9)).fillColor(P.inkSoft)
         .text(up(hi ? "अध्याय" : "Chapter"), 0, cy, { width: A4.w, align: "center", characterSpacing: 2.4 });
      pdf.font(HD("0")).fontSize(S(46)).fillColor(P.accent)
         .text(String(s.n), 0, cy + 18, { width: A4.w, align: "center" });
      pdf.lineWidth(0.8).strokeColor(P.rule).moveTo(A4.w/2 - 44, cy + 82).lineTo(A4.w/2 + 44, cy + 82).stroke();
      pdf.circle(A4.w/2, cy + 82, 2.6).fill(P.accent);
      pdf.font(HD(s.title)).fontSize(FS(20)).fillColor(P.ink)
         .text(s.title, M + 40, cy + 102, { width: CW - 80, align: "center" });
      if (s.subtitle)
        pdf.font(FT(s.subtitle, false)).fontSize(FS(10)).fillColor(P.inkSoft)
           .text(s.subtitle, M + 50, pdf.y + 8, { width: CW - 100, align: "center" });
      if (s.status) statusChip(s.status, A4.w / 2, pdf.y + 14);
      newPage(model.title);
    }

    function sectionHead(s) {
      const w = textW();
      pdf.font(HD(s.title)).fontSize(FS(spec.columns === 2 ? 13.5 : 15.5)).fillColor(P.accent)
         .text(`${s.n}.  ${s.title}`, textX(), y, { width: w });
      y = pdf.y + 4;
      if (s.subtitle) {
        pdf.font(FT(s.subtitle, false)).fontSize(S(9.4)).fillColor(P.inkSoft).text(s.subtitle, textX(), y, { width: w });
        y = pdf.y + 3;
      }
      if (s.status) {
        // Left-aligned head, so the chip sits under the text rather than centred.
        const look = statusOf(s.status);
        if (look) {
          pdf.font(FT(look.label[hi ? "hi" : "en"], true)).fontSize(S(7.6));
          y += statusChip(s.status, textX() + pdf.widthOfString(look.label[hi ? "hi" : "en"]) / 2 + 9
                          + (s.status.kind === "present" && s.status.score > 0 ? 24 : 0), y + 2);
        }
      }
      if (spec.divider !== "space") {
        pdf.lineWidth(0.7).strokeColor(P.rule).moveTo(textX(), y + 5).lineTo(textX() + w, y + 5).stroke();
        y += 13;
      } else y += 10;
    }

    function backMatter() {
      if (spec.backMatter.includes("colophon")) {
        newPage();
        const cy = A4.h / 2 - 40;
        pdf.font(F(0)).fontSize(FS(9.5)).fillColor(P.inkSoft)
           .text(hi ? "यह ग्रंथ तैयार किया गया" : "This volume was prepared by", 0, cy, { width: A4.w, align: "center" });
        pdf.font(FT(branding.panditName, true)).fontSize(FS(15)).fillColor(P.accent)
           .text(branding.panditName || "", 0, cy + 20, { width: A4.w, align: "center" });
        if (branding.companyName)
          pdf.font(FT(branding.companyName, false)).fontSize(FS(10.5)).fillColor(P.ink)
             .text(branding.companyName, 0, cy + 44, { width: A4.w, align: "center" });
        pdf.circle(A4.w/2, cy + 80, 3).fill(P.accent);
      }
      // The closing page carries the disclaimer AND the way to reach a human.
      // A buyer with a question is holding a PDF, not a browser tab, so the
      // contact has to be in the paper and it has to be tappable — pdfkit's
      // link annotation makes wa.me and mailto: open the real app.
      //
      // Laid out as one centred group rather than dropped at a fixed y: this
      // page used to be 700pt of white with two lines floating in it.
      newPage();
      closingPage();
    }

    function closingPage() {
      const phone = branding.mobile || branding.landline;
      const email = branding.email;
      const rows  = (phone ? 1 : 0) + (email ? 1 : 0);
      const inner = CW - 96;

      // Measure first, then place, so the block sits on the optical centre
      // whatever the language does to the line count.
      pdf.font(FT(t.supportBody, false)).fontSize(FS(8.6));
      const bodyH = rows ? pdf.heightOfString(t.supportBody, { width: inner - 56, lineGap: 2.2 }) : 0;
      const cardH = rows ? 30 + bodyH + 14 + rows * (FS(10.5) + 12) + 18 : 0;
      pdf.font(F(0)).fontSize(FS(9));
      const discH = pdf.heightOfString(t.disclaimer, { width: CW - 136, lineGap: 2.6 }) + FS(10) + 14;
      const refH  = model.reference ? 30 : 0;
      const total = cardH + (cardH && discH ? 40 : 0) + discH + refH;

      let y0 = Math.max(160, (A4.h - total) / 2);

      if (rows) {
        pdf.roundedRect(M + 48, y0, inner, cardH, 6)
           .fillOpacity(dark ? 0.10 : 1).fill(dark ? "#FFFFFF" : P.accentSoft).fillOpacity(1);
        pdf.roundedRect(M + 48, y0, inner, cardH, 6)
           .lineWidth(0.7).strokeColor(P.accent).stroke();
        supportBlock(y0 + 18, inner);
        y0 += cardH + 40;
      }

      pdf.font(F(1)).fontSize(FS(10)).fillColor(P.inkSoft)
         .text(hi ? "सूचना" : "Disclaimer", M, y0, { width: CW, align: "center" });
      pdf.font(F(0)).fontSize(FS(9)).fillColor(P.inkSoft)
         .text(t.disclaimer, M + 68, pdf.y + 8, { width: CW - 136, align: "center", lineGap: 2.6 });

      // Quoting the order number is the difference between "my report is wrong"
      // and a message we can act on without a round trip.
      if (model.reference) {
        // Letter-spacing splits Devanagari conjuncts and strands the matras, so
        // the Hindi label gets none — see tr().
        const refLabel = `${hi ? "संदर्भ" : "REFERENCE"}   ${model.reference}`;
        pdf.font(FT(refLabel, false)).fontSize(S(7.6)).fillColor(dark ? "#8d8474" : P.rule)
           .text(refLabel, M, pdf.y + 16,
                 { width: CW, align: "center", characterSpacing: tr(refLabel, 1.2) });
      }
    }

    /**
     * Returns the y it finished at. When no contact is configured it returns
     * `top` untouched — a white-label report for a pandit who gave us no phone
     * gets no empty heading, and never gets ours.
     */
    function supportBlock(top, width) {
      const phone = branding.mobile || branding.landline;
      const email = branding.email;
      if (!phone && !email) return top;
      const x0 = M + (CW - width) / 2;

      const ref = model.reference || "";
      const greeting = hi
        ? `नमस्ते, मुझे अपनी रिपोर्ट${ref ? ` (${ref})` : ""} के बारे में एक प्रश्न पूछना है।`
        : `Namaste, I have a question about my report${ref ? ` ${ref}` : ""}.`;

      let yy = top;
      pdf.font(FT(t.supportTitle, true)).fontSize(FS(11)).fillColor(P.accent)
         .text(t.supportTitle, x0, yy, { width, align: "center" });
      yy = pdf.y + 5;
      pdf.font(FT(t.supportBody, false)).fontSize(FS(8.6)).fillColor(P.inkSoft)
         .text(t.supportBody, x0 + 28, yy, { width: width - 56, align: "center", lineGap: 2.2 });
      yy = pdf.y + 12;

      // Two rows, not one run-on line: a link buried mid-sentence is a tap
      // target a few millimetres wide on a phone.
      const row = (label, value, link) => {
        pdf.font(FT(label, false)).fontSize(FS(8.4));
        const lw = pdf.widthOfString(label + "   ");
        pdf.font(F(1)).fontSize(FS(10.5));
        const vw = pdf.widthOfString(value);
        const sx = x0 + (width - (lw + vw)) / 2;
        pdf.font(FT(label, false)).fontSize(FS(8.4)).fillColor(P.inkSoft)
           .text(label + "   ", sx, yy + 2, { lineBreak: false });
        pdf.font(F(1)).fontSize(FS(10.5)).fillColor(P.accent)
           .text(value, sx + lw, yy, { lineBreak: false });
        // The annotation is placed by hand rather than through text({link}):
        // with lineBreak:false and no width pdfkit computes a NaN rect and the
        // whole document fails to serialise.
        const rowH = FS(10.5) + 4;
        if (link) {
          pdf.link(sx + lw, yy - 2, vw, rowH, link);
          pdf.lineWidth(0.5).strokeColor(P.accent)
             .moveTo(sx + lw, yy + FS(10.5) + 1).lineTo(sx + lw + vw, yy + FS(10.5) + 1).stroke();
        }
        yy += rowH + 8;
      };
      if (phone) row(t.supportWhatsapp, prettyPhone(phone), waLink(phone, greeting));
      if (email) row(t.supportEmail, email, mailLink(email, hi ? `पोथी रिपोर्ट ${ref}`.trim() : `Pothi report ${ref}`.trim()));
      return yy;
    }

    // ── assemble ────────────────────────────────────────────────────────────
    try {
      cover();
      for (const fm of spec.frontMatter) {
        // A Vastu report has no birth moment and no chart, so the pages that
        // exist to present them would print as empty leaves. Skip rather than
        // render a heading with nothing under it.
        const hasBirth = Boolean(model.subject.dob || model.subject.pob || model.planets.length);
        if (fm === "blessing") blessingPage();
        else if (fm === "details" && hasBirth) detailsPage();
        else if (fm === "profileGrid" && hasBirth) profileGridPage();
        else if (fm === "chart") { chartPage(); graphsPage(); }
        else if (fm === "toc" && model.sections.length > 3) tocPage();
      }

      // A title leaf is a real convention, but only for chapters long enough to
      // run past a page. At a 55% threshold a 64-chapter kundali produced 64
      // half-empty leaves — half the book. Require more than a full page of body.
      const LEAF_MIN = (A4.h - M * 2) * 1.35;

      // A chapter of forty words does not deserve a page of its own. Below this
      // it continues on the current leaf instead, which is what turned the Love
      // report from twenty-four mostly-blank pages into a book somebody can read
      // without flipping past white space.
      const OWN_PAGE_MIN = 190;

      model.sections.forEach((s, i) => {
        let opener = "head";
        if (spec.chapterOpen === "titlepage") {
          const h = chapterHeight(s);
          // chapterTitlePage() opens its own leaf and then the content page, so
          // it must NOT be preceded by a newPage — that left a blank sheet.
          if (h >= LEAF_MIN) { chapterTitlePage(s); opener = "none"; }
          else if (h >= OWN_PAGE_MIN) { newPage(model.title); opener = "inpage"; }
          else {
            // Short chapter: flow it, but never split its heading from its body.
            need(h + 40, model.title);
            y += D.gapSec;
            opener = "inpage";
          }
        } else if (spec.chapterOpen === "newpage" || i === 0) {
          newPage(model.title);
        } else {
          need(96, model.title); y += D.gapSec;
        }

        if (opener === "inpage") chapterOpener(s);
        else if (opener === "head") sectionHead(s);
        if (s.summary) summary(s.summary);
        s.paras.forEach((p, pi) => para(p, { dropCap: pi === 0 }));
        if (s.bullets.length) bullets(s.bullets);
        if (s.advisory) (spec.advisoryStyle === "note" ? note : summary)(s.advisory);
      });

      backMatter();
      pdf.end();
    } catch (e) { reject(e); }
  });
}

function isDark(hex) {
  const c = String(hex).replace("#", "");
  if (c.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i+2), 16));
  return 0.299*r + 0.587*g + 0.114*b < 128;
}
