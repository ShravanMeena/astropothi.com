// Generates Meta creative variants: 3 angles x 3 placements.
// Images stay deliberately light on text — Meta suppresses reach on busy
// creative, and the selling copy belongs in the ad fields, not the picture.

import { writeFileSync, mkdirSync } from "node:fs";

const SIZES = {
  "1x1":  { w: 1080, h: 1080 },   // feed square
  "4x5":  { w: 1080, h: 1350 },   // feed portrait — best performing
  "9x16": { w: 1080, h: 1920 }    // story / reel / status
};

const ANGLES = {
  // A — identity. A pandit's reputation IS his business; the artefact he hands
  // over should carry his name, not a software company's.
  naam: {
    kicker: "10 ज्योतिषियों को आमंत्रण",
    h1: ["हर पन्ने पर", "आपका नाम।"],
    sub: "आपकी फ़ोटो · आपकी संस्था · आपका नंबर",
    covers: ["classic", "heritage", "editorial"],
    stat: null
  },
  // B — craft. Good calculation on cheap paper reads as cheap work.
  chhapai: {
    kicker: "तीन अलग डिज़ाइन",
    h1: ["छपाई ऐसी,", "जैसी आपकी विद्या।"],
    sub: "पारंपरिक · आधुनिक · राजसी",
    covers: ["classic", "heritage"],
    stat: null
  },
  // C — division of labour. Straight from the strongest objection-handler in the
  // research: it does not do the reading, it does the typing.
  ganana: {
    kicker: "10 ज्योतिषियों को आमंत्रण",
    h1: ["गणना हम करें।", "फ़ैसला आपका।"],
    sub: "50–135 पन्ने की वैदिक कुंडली, आपके नाम से",
    covers: ["heritage"],
    stat: { big: "20 सेकंड", small: "में तैयार — पढ़ना और सलाह आपका काम" }
  }
};

const css = (s, a) => {
  const tall = s.h / s.w >= 1.6, sq = s.h === s.w;
  const pad = tall ? 150 : sq ? 72 : 76;
  const k = tall ? 1.18 : sq ? 0.92 : 1;
  return `
  .ad{width:${s.w}px;height:${s.h}px;padding:${pad}px 76px;justify-content:space-between}
  .brand .en{font-size:${34 * k}px} .brand .hi{font-size:${21 * k}px}
  .eyebrow{font-size:${20 * k}px;padding:${10 * k}px ${20 * k}px;margin-top:${26 * k}px}
  h1{font-size:${(sq ? 82 : 92) * k}px;margin-top:${24 * k}px}
  .sub{font-size:${26 * k}px;margin-top:${18 * k}px}
  .covers{gap:${24 * k}px;margin:${20 * k}px 0}
  /* A stat block costs ~110px of vertical room, so the artwork gives it back —
     otherwise the CTA and the required disclaimer fall off the canvas. */
  .covers img{height:${(a.covers.length === 1 ? (tall ? 700 : sq ? 470 : 620)
                        : a.covers.length === 2 ? (tall ? 560 : sq ? 400 : 500)
                        : (tall ? 470 : sq ? 330 : 430)) - (a.stat ? (tall ? 150 : sq ? 110 : 140) : 0)}px}
  .covers img.side{height:${(a.covers.length === 3 ? (tall ? 400 : sq ? 285 : 370) : 0) || 1}px}
  .statline{margin-top:${16 * k}px}
  .statline b{display:block;font-family:Fraunces,serif;color:#E8CE92;font-size:${58 * k}px;line-height:1}
  .statline span{display:block;color:#A79E8C;font-size:${20 * k}px;margin-top:${8 * k}px}
  .row{display:flex;align-items:center;gap:${16 * k}px;margin-top:${22 * k}px;flex-wrap:wrap}
  .cta{font-size:${26 * k}px;padding:${19 * k}px ${32 * k}px}
  .code{font-size:${21 * k}px;padding:${19 * k}px ${24 * k}px}
  .foot{font-size:${15 * k}px;margin-top:${18 * k}px}`;
};

mkdirSync("gen", { recursive: true });
const made = [];
for (const [an, a] of Object.entries(ANGLES)) {
  for (const [sn, s] of Object.entries(SIZES)) {
    const imgs = a.covers.map((c, i) => {
      const side = a.covers.length === 3 && i !== 1;
      return `<img class="${side ? "side" : ""}" src="../assets/${c}.png" alt="">`;
    }).join("\n      ");
    const html = `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<link rel="stylesheet" href="../ad.css"><style>${css(s, a)}</style></head><body>
<div class="ad">
  <div>
    <div class="brand"><span class="en">Pothi</span><span class="hi">पोथी</span></div>
    <span class="eyebrow"><span class="dot"></span>${a.kicker}</span>
    <h1>${a.h1[0]}<br><em>${a.h1[1]}</em></h1>
    <p class="sub">${a.sub}</p>
  </div>
  <div class="covers">
      ${imgs}
  </div>
  <div>
    ${a.stat ? `<div class="statline"><b>${a.stat.big}</b><span>${a.stat.small}</span></div>` : ""}
    <div class="row">
      <span class="cta">WhatsApp पर बात करें →</span>
      <span class="code">POTHI10</span>
    </div>
    <p class="foot">दाम आप तय करें — हमारा कोई हिस्सा नहीं। रिपोर्ट मार्गदर्शन हेतु हैं; चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं।</p>
  </div>
</div></body></html>`;
    const name = `${an}-${sn}`;
    writeFileSync(`gen/${name}.html`, html);
    made.push([name, s.w, s.h]);
  }
}
writeFileSync("gen/manifest.json", JSON.stringify(made));
console.log(`  ${made.length} creatives written to gen/`);
