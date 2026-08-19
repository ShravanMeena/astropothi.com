# Pothi — Master Plan

## Context

Devpunya already owns a complete, in-house Vedic astrology engine. It was built for B2C
(sell one ₹499 report to one devotee at a time). This plan repoints that same asset at a
B2B market: sell reports **wholesale, white-labelled, in bulk, to the pandits who already
have the customers.**

The strategic case in one paragraph: our marginal cost per report is roughly zero (we own
the ephemeris and the renderer — no per-call API fee to Prokerala or AstrologyAPI). Every
competitor either resells someone else's API at ₹2–₹90/report, or charges the pandit
₹23,000–₹56,000 upfront for Windows software from 2016. We can profitably sell at ₹4 and
still make ~87% gross margin. Nobody with our cost structure has attacked this segment.

**The three findings that shaped this plan:**

1. **The engine ports almost for free.** `server/astro_chart/engine/` is 46 JS files with
   exactly **two** imports outside itself (`utilities/constant/doshas.js` and
   `utilities/llmRunner.js` — and the LLM one is only the optional prose layer, already
   bypassed: `inhouse_dosh.service.js` literally sets `const aiReading = null`). No DB, no
   Sequelize, no config coupling. It lifts into a new repo in a day.
2. **White-labelling is already half-built.** `engine/reporting/branding.js` exposes
   `DEFAULT_BRANDING` + `mergeBranding(overrides)` + `loadLogoBuffer()` with remote-URL
   logo fetch. Every renderer already accepts a branding object. We need to *widen* it
   (photo, shop name, WhatsApp, tagline, per-page footer), not invent it.
3. **We are missing the single most valuable report type.** There is **no Ashtakoot / Guna
   Milan (36-guna matchmaking) engine.** Marriage matching is ~60% of Astrotalk's revenue
   and Tier-A of our buyer list — a matchmaking pandit consumes 2 kundlis + 1 milan per
   case. Six of the eight kootas already exist as constants in `astro-constants.js`
   (`VARNA_MAP`, `VASHYA_MAP`, `GANA_MAP`, `NADI_MAP`, `YONI_MAP`, `TATVA_MAP`); Graha
   Maitri derives from `FRIENDS`/`ENEMIES` in `kundli-facts.js`, Bhakoot and Tara from moon
   sign / nakshatra distance. **This is ~2 weeks of work for the highest-value SKU.**

---

## What we already have (inventory of the donor codebase)

Source: `/Users/shravanmeena/Desktop/DevP/devpunya-node-api-server/server/astro_chart/engine/`

**Compute** — `astronomy-engine` v2, sidereal / approx-Lahiri ayanamsha, Whole Sign houses,
mean-node Rahu. `buildCalculatedKundliData()` returns planets, houses, 10 divisional charts
(D1–D12 + Chalit), Vimshottari dashas to pratyantar, Ashtakavarga (BAV/SAV), panchang,
numerology, astro-details (varna/vashya/yoni/gana/nadi/tatva/paya/ghat-chakra), shadbala,
Sade Sati timeline, 14 dosh detectors with 0–100 severity scoring, Tajika/Varshaphal
(Muntha, Panchavargeeya bala, Mudda dasha), Laal Kitab, monthly transits.

**Seven finished report types**, all deterministic, no LLM on the paid path:

| # | Report | Chapters | Service |
|---|---|---|---|
| 1 | Love | 24 | `inhouse_love.service.js` |
| 2 | Health | 26 | `inhouse_health.service.js` |
| 3 | Kundali Dosh | 28 pages / 14 verdicts | `inhouse_dosh.service.js` |
| 4 | Personalised Horoscope | 22 | `inhouse_horoscope.service.js` |
| 5 | **Premium Kundali** | **64** | `inhouse_kundli.service.js` |
| 6 | Laal Kitaab | 30 | `inhouse_laalkitab.service.js` |
| 7 | Varshaphal | 40 | `inhouse_varshaphal.service.js` |

Plus daily Panchang and 12-sign daily horoscope services.

**Render** — pure `pdfkit`, no HTML/Puppeteer. Bundled Noto Sans Devanagari. Bilingual
en/hi via large static string packs (`report-content-hi.js` 71 KB, `forecast-strings.js`
88 KB, `laalkitab-strings.js` 130 KB). Validator declares 8 languages
(`en hi gu mr bn ta te kn`) but only en/hi have real content packs.

**What is NOT reusable:** the Devpunya order/booking/webhook/delivery stack, the
`dosh_reports` vs `astro_chart_report` double pipeline, the Interakt templates, the
AstroNext vendor branch. All of that is B2C plumbing. Pothi gets a clean one.

---

## The product in five things

1. **Bulk credits.** Prepaid packs. No subscription, no mandate. ₹2,000 → 500 credits.
2. **White label.** His photo, name, shop, phone, WhatsApp, address, logo, tagline — on the
   cover and on every page footer. Zero Pothi branding anywhere the client can see.
3. **Multiple designs.** The differentiator the market has never offered. Same content,
   7+ visual themes — saffron-traditional, wedding red-gold, minimal white, deep blue,
   green, black-gold premium, parchment manuscript. He picks per report. See
   [docs/02-product.md](docs/02-product.md).
4. **Earnings dashboard.** "132 reports · you sold at ₹300 · **₹39,600 earned** · ₹528
   spent · 75x return." This is the retention mechanic, not a vanity chart.
5. **Client book (digital vahi).** Every client he's ever made a report for, with birthday
   reminders that one-tap generate next year's Varshaphal. Turns a one-time buyer into an
   annuity — for him and for our credit burn.

---

## Architecture in one screen

Two new repos inside `/Users/shravanmeena/Desktop/DevP/pothi/`:

```
pothi/
├── pothi-api/          Node 24, Express, ESM, Postgres, Sequelize  (mirrors Devpunya house style)
│   ├── engine/         ← vendored copy of devpunya engine/ + new theme layer + guna-milan
│   ├── server/         auth, account, credits, reports, branding, clients, admin
│   └── scripts/        ensure_*.js idempotent migrations (house pattern)
└── pothi-web/          Vite + React 18 + TS + Tailwind  (NOT CRA — see 03-architecture)
```

Own Postgres database (`pothi`), own Razorpay account, own S3 prefix. **No runtime
dependency on `api.devpunya.com` at all.** The engine is vendored, not imported — with a
`scripts/sync_engine.js` diff tool so upstream astrology fixes can be pulled deliberately.

Full schema, endpoint list and the engine-port procedure: [docs/03-architecture.md](docs/03-architecture.md).

---

## The one hard refactor: content ↔ theme separation

Today each renderer is content and styling fused: `render-report-pdfkit.js` is 3,129 lines
with 68 hardcoded hex colours; the other four have 16–19 each. Themes are impossible until
that is split.

**Do not fork the renderer per theme.** Extract a theme token object and thread it through:

```js
// engine/reporting/themes/kesari.js
export default {
  id: "kesari", name: { en: "Kesari", hi: "केसरी" },
  palette: { ink:"#2B1B0E", accent:"#E07A0C", accentSoft:"#FDF2E2",
             rule:"#D9B382", tableHead:"#F7E3C4", chartLine:"#B5651D" },
  fonts:   { headingEn:"Marcellus", bodyEn:"Inter", headingHi:"Tiro Devanagari", bodyHi:"Noto Sans Devanagari" },
  cover:   { layout:"arch-border", art:"marigold-corner", showPandidPhoto:true },
  page:    { border:"thin-double", watermarkArt:"om-faint", footer:"branded-3col" },
  chart:   { style:"NORTH_INDIAN", cell:"filled" }
}
```

Every `doc.fillColor("#...")` becomes `doc.fillColor(T.palette.accent)`. Sequence:
`render-dosha-pdfkit.js` (667 lines, 19 colours) first as the pilot, then the 3 small ones,
then the 3,129-line monster last with a visual-diff harness. Budget **3 weeks**.

Acceptance test: render chart 5 in all 7 themes × en/hi = 14 PDFs, byte-different, content-identical.

---

## Build phases

| Phase | Weeks | Ships |
|---|---|---|
| 0 · Foundations | 1–2 | Repos, DB, auth (phone+OTP), engine vendored & rendering |
| 1 · Core loop | 3–6 | Branding profile, generate 1 report, credits debit, Razorpay pack, WhatsApp share |
| 2 · Themes | 7–9 | Theme token refactor, 7 designs, per-report picker |
| 3 · The money SKU | 10–12 | **Ashtakoot Guna Milan** + matchmaking report |
| 4 · Retention | 13–15 | Earnings dashboard, client book/vahi, birthday Varshaphal reminders |
| 5 · Scale | 16–20 | Bulk CSV, multi-seat, referral/agent ladder, admin, print partner |

Detail and kill-criteria: [docs/06-roadmap.md](docs/06-roadmap.md).

---

## What will kill this, ranked

1. **Distribution, not product.** Jastro (IIT-Roorkee incubated) built *exactly this* and has
   1,000 downloads. DevDham signed 2,000 pandits and shut down. A pandit roster is not a
   moat. The plan's answer: enumerable lists (Trimbakeshwar's ~150-person public phone
   directory → Prayagwal Mahasabha's 1,884 registered purohits → one ICAS chapter cluster),
   **zero performance marketing**. See [docs/04-pricing-gtm.md](docs/04-pricing-gtm.md).
2. **The real competitor is ₹0.** Jagannatha Hora is free and better at calculation. We do
   not sell calculation. We sell a branded 40-page PDF on the client's WhatsApp in 20 seconds.
3. **Credit arbitrage.** One pandit buys at ₹2,000 and resells generation to ten others. The
   tell is branding diversity — lock the branding profile to the account, cap changes per
   quarter, alert on >2 profiles. One day of work, also required to keep the RBI closed-PPI
   exemption. Ship a legitimate multi-seat plan so the incentive evaporates.
4. **Ayanamsha credibility.** Our engine uses "Approx Lahiri" — an approximation. Pandits
   *will* diff our lagna against Jagannatha Hora and Leostar, and any drift becomes "your
   software is wrong" in a WhatsApp group. **Buy the Swiss Ephemeris Professional Licence
   (CHF 700–750 one-time) and switch to true Lahiri before the first paying pandit.**
   This is the highest-priority non-obvious task in the whole plan.
5. **DMR Act 1954.** Remedy text that names a disease is a criminal offence (s.5, up to 6
   months), and the pandit's logo on the PDF does not help us because we wrote the text.
   Ship a CI lint over the content corpus. See [docs/05-legal.md](docs/05-legal.md).

---

## Immediate next actions

1. Decide the name and buy the domain (`pothi.in` / `pothi.app`). 30 minutes.
2. Order the **Swiss Ephemeris Professional Licence** — long lead time, blocks credibility.
3. Mystery-shop the competition: buy one AstroSage Dhruv month (₹999) and one GrahAI
   recharge (₹6,999) and read their PDFs cover to cover. This is the design brief.
4. Get the Trimbakeshwar Purohit Sangh public visiting-card directory into a spreadsheet
   (~150 names, photos, phone numbers, publicly listed). That is customer #1 through #150.
5. Then start Phase 0.
