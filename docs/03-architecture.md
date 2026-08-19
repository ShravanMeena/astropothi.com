# 03 · Architecture

## Principle

**Pothi shares nothing with Devpunya at runtime.** Own repo, own Postgres database, own
Razorpay account, own S3 prefix, own domain, own JWT secret. Devpunya is *donor code*:
we copy the astrology engine in and copy proven patterns; we never call `api.devpunya.com`.

Rationale beyond the user's instruction: the Devpunya API is a 51-module monolith carrying a
B2C order/webhook/delivery stack, three Postgres connections, MongoDB, Redis, Pinecone and
SQS pollers. None of that is needed, and coupling a B2B product's uptime to a B2C monolith's
deploys is a bad trade.

---

## Repos

```
/Users/shravanmeena/Desktop/DevP/pothi/
├── docs/               ← these documents
├── pothi-api/          Node 24 · Express 4 · ESM · Postgres · Sequelize
└── pothi-web/          Vite · React 18 · TypeScript · Tailwind
```

Two separate git repos (matching the `devpunya-<role>` sibling convention, renamed
`pothi-<role>`). A React Native app comes later — the web app must be a proper mobile-first
PWA from day one, because ~all traffic is Android phones.

### pothi-api

Follows the Devpunya house style deliberately — same idioms mean no ramp-up cost:

```
pothi-api/
├── bin/www.js  index.js  config.js
├── engine/                       ← vendored astrology engine (see below)
├── server/
│   ├── auth/                     phone+OTP login, JWT
│   ├── account/                  pandit profile, KYC-lite
│   ├── branding/                 branding profile CRUD + change log
│   ├── credits/                  packs, ledger, debit/refund
│   ├── payment/                  razorpay create-order, verify, webhook
│   ├── reports/                  generate, status, list, download, share
│   ├── clients/                  the vahi + birthday reminders
│   ├── themes/                   theme catalogue + sample previews
│   ├── earnings/                 dashboard aggregation
│   ├── referral/                 agent/dealer ladder (phase 5)
│   └── admin/                    accounts, ledger audit, arbitrage alerts
├── database/models/schema/       one file per table, snake_case
├── scripts/                      ensure_*.js idempotent migrations (house pattern)
└── Dockerfile  buildspec.yml
```

Conventions carried over from `devpunya-node-api-server`:
`<domain>.controller.js` / `.service.js` / `.v1.route.js`; each route file exports
`userRoute()` and `noAuth()`; mount at `/api/v1` and `/noauth-api/v1`; `sendOkResponse`
wrapper; `const [err, x] = await to(p)` error-as-value; Sequelize models auto-loaded from
`database/models/schema/`; idempotent `ensure_*.js` scripts instead of a migration CLI.

**Deliberately dropped:** MongoDB, Redis, Pinecone, SQS pollers, the three-DB split, Interakt,
FB CAPI, five payment gateways. One Postgres, one gateway (Razorpay), one queue table.

**Fixed from day one — do not repeat these Devpunya mistakes:**
- **No secrets in the Dockerfile or committed `.env`.** Devpunya's `Dockerfile` hardcodes the
  RDS password, JWT secret and live Razorpay keys into committed image layers, and the admin
  panel ships AWS IAM keys into a browser bundle. Use AWS Secrets Manager (the buildspec
  already has a commented-out path to copy).
- **`generateJWTToken` has an `exp` bug** (`Date.now()/100` instead of `/1000`). Don't port it.
- **Don't build two parallel report pipelines.** Devpunya has `dosh_reports` +
  `astro_chart_report` with two S3 uploaders and two drifting chart-id allowlists. One table,
  one uploader, one allowlist.
- **The webhook must be the source of truth for payment**, not a client-called
  `confirmPayment`. Devpunya's `ASTRO_CHART_REPORT_BOOKING` has no webhook branch, so a paid
  order whose client never calls back never generates.

### pothi-web

**Vite + React 18 + TS + Tailwind — not CRA.** Devpunya's three CRA apps are on
`react-scripts 5`, which is effectively unmaintained; there is no reason to start a new
codebase there. Keep the `src/features/<domain>/{screens,components,api,hooks}` layout the
Devpunya v2 code already uses, so the shape is familiar.

Mobile-first, installable PWA, Hindi as a first-class UI language (i18next), large touch
targets, works on a 3-year-old ₹8,000 Android over 4G. Auth: phone+OTP, JWT in localStorage
with a `Bearer` axios interceptor (same shape as `devpunya-ui/src/utils/api.utils.ts`).

Admin is a separate route group inside the same app behind a role check — not a second
deployment. (Devpunya's Netlify-deployed MUI admin panel is the odd one out; don't replicate.)

---

## Porting the engine

`devpunya-node-api-server/server/astro_chart/engine/` — 46 JS files, 5.2 MB (of which 2.4 MB
is one background JPEG). **Verified: it has exactly two imports outside its own tree.**

| External import | Fix |
|---|---|
| `utilities/constant/doshas.js` | Copy the file into `engine/lib/doshas.js`. It's a static registry (23 canonical doshas + synonyms). |
| `utilities/llmRunner.js` | Only reached from `engine/ai/*`, which is the optional prose layer and **already bypassed** on the paid path. Delete `engine/ai/` entirely for v1 and drop the eager re-exports from `engine/index.js` (its own header warns they construct Bedrock clients on import). |

Everything else is relative-internal. Port procedure:

1. `cp -R` the engine tree into `pothi-api/engine/`.
2. Delete `engine/ai/`; inline `doshas.js`; clean `engine/index.js` barrel.
3. Copy the 7 `inhouse_*.service.js` wrappers into `engine/reports/` and **de-duplicate the
   birth-input normalisers** — each of the 7 carries its own copy of `normalizeBirthDate` /
   `normalizeBirthTime` / `resolveTimezone`; `engine/lib/birth-input.js` is the shared version
   and its header says the copies were left only because they sat on a live paid path. That
   constraint doesn't apply to a greenfield repo. Collapse to one.
4. Replace `DEFAULT_BRANDING` (Devpunya name/logo/email) with a neutral default.
5. Add `engine/reporting/themes/` and thread the token object (see [02-product.md](02-product.md)).
6. Add `engine/astrology/guna-milan.js` + `engine/reports/milan.js`.
7. Add `scripts/sync_engine.js` — a diff tool against the Devpunya path so upstream astrology
   corrections can be reviewed and pulled deliberately. **Vendored, not auto-synced.**

### The ayanamsha upgrade — do this before the first paying pandit

The engine's `calculationMeta.ayanamsha` literally reads **`"Approx Lahiri"`**. Pandits will
diff our lagna against Jagannatha Hora and Leostar, and any drift becomes "your software is
wrong" in a WhatsApp group — the objection with the least recoverable damage.

Buy the **Swiss Ephemeris Professional Licence (CHF 700–750 one-time, 99 years)** — AGPL is
not an option for a network-served app. Swap `astronomy-engine`'s approximation for true
Lahiri via `swisseph` behind an interface so both can run side by side, then run
`scripts/audit_ayanamsha.js` diffing 500 charts old-vs-new and against published tables.
Then publish a "How we calculate" page: Swiss Ephemeris, NASA JPL DE431, Lahiri/Chitrapaksha,
<1/1000 arcsecond. Free credibility.

While in there, fix the known accuracy bugs already logged on the Devpunya side
(weekday sunrise-vaar convention, lagna house mismatch on a 1:30 AM birth) — a B2B product
cannot ship those.

---

## Database schema (Postgres, `pothi`)

Naming per house style: `snake_case`, `id` BIGINT autoincrement, timestamps, `paranoid`.

| Table | Key columns |
|---|---|
| `pandits` | `id, phone` unique, `isd_code, name, email, city, state` (**mandatory — GST place-of-supply**), `gstin, business_name, status, referred_by, last_seen_at` |
| `otp_sessions` | UUID pk, `isd_code, phone, otp, channel, attempts, status` |
| `branding_profiles` | `pandit_id, display_name, honorific, shop_name, phone, whatsapp, email, address, logo_url, photo_url, signature_url, tagline, chart_style, default_language, default_theme_id` |
| `branding_change_log` | `pandit_id, changed_fields JSONB, before JSONB, after JSONB, ip, ua` ← **arbitrage detection** |
| `credit_packs` | `id, code, name, price_paise, credits, validity_days, active` |
| `credit_purchases` | `pandit_id, pack_id, amount_paise, gst_paise, credits, razorpay_order_id, razorpay_payment_id, status, invoice_no, invoice_url, expires_at` |
| `credit_ledger` | `pandit_id, delta` (+/−), `balance_after, reason` (`purchase\|generate\|refund\|bonus\|expiry`), `ref_type, ref_id`. **Append-only. Balance is always `SUM(delta)`, never a mutable column.** |
| `report_types` | `id, code, name_en, name_hi, chapters, credits, engine_key, active` |
| `themes` | `id, code, name_en, name_hi, preview_url, active, min_tier` |
| `clients` | `pandit_id, name, gender, dob, tob, tob_unknown, pob, lat, lon, tzone, phone, notes` ← the vahi |
| `reports` | `pandit_id, client_id, report_type_id, theme_id, language, status, pdf_url, page_count, credits_charged, report_json JSONB, birth_meta JSONB, share_token, shared_at, sale_price_paise, expires_at` |
| `report_jobs` | `report_id, status, attempts, error, started_at, finished_at` |
| `pandit_prices` | `pandit_id, report_type_id, sale_price_paise` ← powers the earnings dashboard |
| `referrals` / `agents` | phase 5 |

Indexes: `reports(pandit_id, created_at)`, `reports(share_token)` unique,
`credit_ledger(pandit_id, id)`, `clients(pandit_id, phone)`, `pandits(phone)` unique.

---

## API surface (v1)

Auth `/api/v1/*` · public `/noauth-api/v1/*`.

**noauth** — `POST /auth/otp/send`, `POST /auth/otp/verify`, `GET /catalog/report-types`,
`GET /catalog/themes`, `GET /catalog/packs`, `GET /samples?type=&theme=`,
`GET /location/autocomplete`, `GET /location/geocode` (Google Places, server-side key —
copy `devpunya .../server/location/location.controller.js`),
`GET /r/:token` (client-facing share page), `POST /webhook/razorpay`.

**auth** — `GET/PUT /branding`, `POST /branding/asset` (multer memory, 5 MB),
`GET /credits/balance`, `GET /credits/ledger`, `POST /credits/purchase` → razorpay order,
`GET /credits/invoices/:id`, `POST /reports/generate`, `GET /reports/:id/status`,
`GET /reports`, `GET /reports/:id/download`, `POST /reports/:id/share`,
`POST /reports/:id/regenerate` (different theme, 1 credit),
`GET/POST/PUT /clients`, `GET /clients/birthdays`, `GET/PUT /prices`,
`GET /earnings/summary`, `GET /earnings/timeseries`.

### Generation flow (webhook-authoritative, credit-safe)

```
POST /reports/generate
  ├─ validate birth input (zod — reuse engine/validators/generate-kundli.js)
  ├─ SELECT balance FOR UPDATE ─ insufficient? → 402 with the recharge CTA
  ├─ INSERT reports(status=queued) + credit_ledger(delta=−N, reason=generate, ref=report)
  │     ↑ single transaction. The debit and the report row commit together or not at all.
  └─ enqueue report_jobs

worker: buildCalculatedKundliData → sections → theme render (pdfkit) → S3 → status=ready
        on terminal failure → INSERT credit_ledger(delta=+N, reason=refund) and tell him
```

Sync generation is tempting (15–25 s) but a job table is required anyway for bulk CSV in
phase 5, and a 25-second HTTP request on rural 4G will time out. Poll `/status`.

Payment: `POST /credits/purchase` creates the Razorpay order; **the webhook credits the
ledger** (HMAC-verified against `req.rawBody`, captured in `index.js` via
`express.json({ verify })` — copy `devpunya .../server/payment/razorpay.js`
`validateWebhook`/`verifySignature`). The client-side confirm is a UX accelerator only, and
must be idempotent against the webhook by `razorpay_order_id`.

---

## Storage & infra

S3 `pothi-content` @ `ap-south-1` behind CloudFront. Prefixes `reports/<pandit_id>/<report_id>.pdf`,
`branding/<pandit_id>/`, `samples/`. **Get the IAM prefix right at bucket-creation time** —
Devpunya's report PDFs are all still crammed under `dosh-reports/` because the IAM policy only
granted PutObject on that one prefix. Report PDFs are private objects served through signed
URLs or the `/r/:token` proxy, never a public bucket.

Deploy: Docker → ECR → ECS, mirroring `devpunya-node-api-server/buildspec.yml`. Web: static
build → S3+CloudFront (or Vercel — it's a static SPA, don't over-engineer).

Observability from day one: Sentry both sides, structured request logs, and a
**generation-success-rate** metric per report type × theme × language. A silently failing
theme is a refund and a lost pandit.
