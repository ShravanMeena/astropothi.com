# pothi-api

Node 24 · Express · ESM · Postgres · Sequelize. Own DB, own auth, own everything —
**no runtime dependency on Devpunya.** The astrology engine is vendored (see `engine/index.js`).

## Run

```bash
createdb pothi          # once
cp .env.example .env    # once
npm install
npm start               # :4050, syncs schema in dev
./scripts/smoke.sh      # end-to-end: login → branding → credits → generate → earnings
```

Other scripts:
```bash
node scripts/verify_all.js          # 7 types × 3 designs × 7 palettes × en/hi → out/matrix/
node scripts/verify_all.js --quick  # 21 combos (all designs, one palette), fast
npm test                            # layout + content + credits
npm run test:layout                 # header/footer must never touch the page frame
npm run audit:data                  # % of each report that is static across 8 different charts
npm run audit:astro                 # chart invariants — nodes, dashas, houses, bindus
npm run audit:text                  # depth, duplicate sentences, placeholder leaks
npm run test:credits                # the money path — 8 assertions
npm run test:pilot                  # invite gate, seat cap, 10 free reports
npm run test:content                # PDF text vs source sections — catches silent truncation
npm run render -- --type kundli --lang hi
```

## Status

**Working end to end.** A pandit can log in, set up his white-label profile, receive trial
credits, generate a real 66-page branded PDF in ~1.9 s, and see his estimated earnings.

| Area | State |
|---|---|
| Engine port | ✅ 5 npm deps, zero Devpunya imports |
| **All 7 report types** | ✅ 7 types × 3 designs × 7 palettes × en/hi |
| **Designs × Palettes** | ✅ **3 designs** (structure) × **7 palettes** (colour), independent axes |
| **Sample preview** | ✅ real rendered pages before he spends a credit |
| Auth (phone + OTP + JWT) | ✅ dev OTP inline; WhatsApp dispatch is a TODO |
| Branding / white label | ✅ **0 brand leaks**; no fallback logo at all |
| Credits (append-only ledger) | ✅ 8/8 money tests incl. concurrent replay |
| Report generation | ✅ synchronous, 0.4–3.4 s |
| Client book (vahi) | ✅ dedupes on name+dob+tob, inside the transaction |
| Earnings dashboard | ✅ estimate from prices he sets himself |
| Credit packs + custom top-up | ✅ **dummy** gateway; real plumbing behind it |
| Guna Milan | ❌ not started (phase 3) |
| S3 | ⚠️ code path exists, dev writes to `out/` |

See [../OPEN-ITEMS.md](../OPEN-ITEMS.md) — 4 items found during the port.

## Layout

```
engine/            vendored astrology engine — pure functions, no DB/network
  astrology/       chart computation (astronomy-engine)
  mapping/         chapter builders
  i18n/            en/hi string packs
  reporting/       pdfkit renderers
    designs/       3 structural designs (classic / editorial / heritage)
    palettes/      7 colour palettes — pair with any design
    style.js       design × palette → one style object
    doc-model.js   normalises all 7 report shapes into one model
    render-report.js  THE renderer — every report goes through it
  reports/         the 7 report generators
server/<domain>/   <domain>.route.js + .service.js, exports userRoute()/noAuth()
platform/auth.js   JWT sign + authenticate middleware
database/          Sequelize loader + models/schema/*.js
```

## API

Public `/noauth-api/v1` — `auth/otp/send`, `auth/otp/verify`, `catalog/{report-types,designs,palettes,packs}`

Authed `/api/v1` (Bearer) — `me`, `branding` GET/PUT, `credits/{balance,ledger,packs}`,
`reports` GET + `reports/generate` POST, `reports/:id`, `clients` GET/POST,
`clients/birthdays`, `earnings/summary`, `earnings/prices` GET/PUT,
`credits/purchase` + `credits/confirm` (dummy gateway)

Preview: `GET /noauth-api/v1/catalog/preview?type=&design=&palette=&lang=` — renders the real engine
output, rasterises the first 4 pages with `pdftoppm`, caches to disk. ~6 s cold, ~10 ms warm.
