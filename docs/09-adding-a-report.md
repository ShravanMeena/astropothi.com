# Where the nine reports come from, and how to add another

## The chain, for every report

Birth details go in one end, a typeset book comes out the other. Five stages,
and only stage 3 is different per report.

```
input {name, dob, tob, pob, lat, lon, gender, language}
  │
  1 ── engine/astrology/normalize-kundli-data.js
  │      buildCalculatedKundliData(request)
  │      The actual sky: astronomy-engine + Lahiri ayanamsha → planets, houses,
  │      dashas, ascendant. ONE source of planetary truth, shared by every report.
  │
  2 ── engine/astrology/*.js
  │      Pull out the facts this report argues from:
  │        life-facts.js              kundli / love / health
  │        detect-doshas.js           dosh   (+ manglik-cancellations.js,
  │                                           sade-sati-timeline.js)
  │        laal-kitab.js              laalkitab
  │        transit-horoscope.js       horoscope (+ monthly-transit.js)
  │        varshaphal.js, tajika.js   varshaphal
  │        ashtakavarga.js            strengths, used by kundli
  │
  3 ── engine/mapping/<type>-chapters.js        ← THE REPORT'S IDENTITY
  │      buildXSections(facts, strings) → [{ n, title, subtitle, body… }]
  │      This is the file that decides what the book actually says.
  │        dosh-chapters.js       1054 lines
  │        dosh-sections.js        907
  │        varshaphal-chapters.js  389
  │        love-chapters.js        336
  │        health-chapters.js      301
  │        horoscope-chapters.js   258
  │
  4 ── engine/i18n/*.js
  │      The sentences themselves, en + hi. life-strings.js, laalkitab-strings.js,
  │      forecast-strings.js, dosha-details-hi.js …
  │
  5 ── engine/reporting/doc-model.js → render-report.js
         Normalise to one shape, then lay out the PDF in the chosen design and
         palette. Shared by every report — none has its own renderer.
```

**Stage 6, added later: `engine/ai/enrich.js`.** A chapter shorter than 90 words
is handed to a model to expand — one call per report, temperature 0. The split it
enforces is the point: **facts stay computed and are never touched** (placements,
signs, houses, degrees, dasha dates, dosh scores, bindus), and only the
*explanation* around them is written. The output is checked before it is
accepted, and any paragraph that states a placement, sign, house or date not
already present in the computed text is rejected — you will see
`[enrich] rejected "…": introduced "Taurus"` in the log when that fires.

So the earlier claim on this line — that nothing calls an LLM — is no longer
true, and the reports are no longer bit-for-bit reproducible. What *is* still
true, and is the part that matters, is that no astrological fact comes from a
model. Set `AI_ENRICH_REPORTS=false` to turn it off; the test suite does exactly
that so the assertions stay deterministic.

## Where a report is *registered*

Two files, and they must agree:

**`engine/render.js`** — maps a code to its generator.

```js
const GENERATORS = {
  health: { mod: "./reports/health.js", fn: "generateInhouseHealth",
            en: "Health Report", hi: "स्वास्थ्य कुंडली" },
  …
};
```

**`server/catalog/catalog.js`** — what it costs and whether it is sold.

```js
export const REPORT_TYPES = [
  { code: "health", name_en: "Health Report", name_hi: "स्वास्थ्य कुंडली",
    chapters: 26, credits: 2, engine: "health", ready: true },
  …
];
// Price comes from a TIER, not a per-report number — see PRICE_TIERS.
const TIER_OF = { health: "focused", … };   // flagship | full | focused
```

`credits` is what a pandit pays. `CONSUMER_PRICES` is what a buyer pays.
`ready: false` hides a report from `SELLABLE` and therefore from the storefront.

## To REMOVE a report

Set `ready: false` in `REPORT_TYPES`. That is the whole change.

It disappears from the catalogue, the storefront, `/reports` and the pandit's
Create screen. Orders already placed keep working, and the generator stays on
disk so you can switch it back on. Do **not** delete the row — existing
`orders.report_type` and `reports.report_type` values still reference the code,
and `getReportType()` returning null will break their pages.

## To ADD a report

### The work that matters

1. **`engine/mapping/<new>-chapters.js`** — write `buildXSections(facts, strings)`
   returning the chapter list. Copy `health-chapters.js` for the smallest
   working example. This is 90% of the effort and the only part that decides
   whether the book is worth ₹299.
2. **`engine/i18n/`** — add the en/hi sentence templates it needs.
3. **`engine/astrology/`** — only if the report needs a calculation nothing else
   does. Most do not; `life-facts.js` already exposes most placements.

### The wiring — 4 files

4. **`engine/reports/<new>.js`** — the generator. ~86 lines; `health.js` is the
   template. Normalise dob/tob, build the chart, compute facts, build sections,
   return `{ report, pdfBuffer, kundliData }`.
5. **`engine/render.js`** — add the `GENERATORS` entry.
6. **`server/catalog/catalog.js`** — add to `REPORT_TYPES` and `CONSUMER_PRICES`.

### The presentation — 5 more places, easy to forget

These are hardcoded per-report maps. Miss them and the report ships looking
half-finished:

7. **`engine/reporting/render-report.js` → `COVER_ART`** — the cover's Devanagari
   subtitle, which houses to light up in the chart, and the strapline.
   **This one falls back to `COVER_ART.kundli`**, so a new report will print
   "जन्म कुंडली" on its cover — wrong, not merely missing.
8. **`pothi-app/src/components/ReportCover.tsx` → `COVER_PALETTE`** — its
   colourway. Falls back to gold, so it will look like the Kundali.
9. **`pothi-app/src/pages/ReportPage.tsx` → `PITCH`** — Devanagari name, headline
   and body on the detail page. Missing → that whole block silently disappears.
10. **`pothi-app/src/pages/ReportsPage.tsx` → `BLURB`** and
    **`pothi-app/src/sections/Reports.tsx` → `BLURB`** — the card copy.
11. **`pothi-app/src/components/Guide.tsx` → `TREE`** — optional, but the guide
    will never recommend a report that has no branch.

### Then

```bash
cd pothi-api  && npm test          # layout, content, shop, payments, invariants
cd pothi-api  && npm run covers    # rebuild the storefront's static cover PNGs
```

The preview cache invalidates itself (it fingerprints the renderer source), but
the static covers under `pothi-app/public/covers/` do not — that is what
`npm run covers` is for.

## Honest note on the current design

Adding a report touches **ten** places across two codebases, and four of them
are hardcoded lookup tables that fail quietly or, worse, fall back to the wrong
value. That was fine for the first seven, written in one go. If reports are going
to be added regularly, the right fix is one manifest per report — code, names,
price, credits, palette, cover art, copy — that both the API and the frontend
read, so there is a single place to edit and a single place to forget.

## Which of the seven is actually thin

Line counts are a fair proxy for how much a generator knows:

| report | mapper | measured depth |
|---|---|---|
| dosh | 1054 + 907 | strong |
| varshaphal | 389 | strong |
| laalkitab | 913 (in the generator) | strong |
| kundli | via life-facts | strongest, 245 words/chapter |
| love | 336 | **thin — 44 words/chapter, 40% identical across charts** |
| health | 301 | **thin — 56 words/chapter, 49% identical** |
| horoscope | 258 | middling |

Love and Health are sold at ₹299 and are the two weakest books. Deepening their
mappers is worth more than an eighth report.

The obvious eighth is **Guna Milan (Ashtakoot match-making)** — it needs two
charts rather than one, so it also needs a second birth form, but it is the
highest-value SKU missing from a marriage-driven market.
