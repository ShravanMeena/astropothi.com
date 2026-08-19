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
└── pothi-app/          Vite · React 18 · TypeScript · Tailwind
```

> **As built:** the plan called for a separate `pothi-web` for consumers. That was tried and
> reverted — two sites meant two headers, two theme systems and two deploys for one brand.
> `pothi-app` is a single application serving the storefront, the astrologer console and the
> admin panel, routed by path. A React Native app comes later; the web app is mobile-first
> because ~all traffic is Android phones.

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

`snake_case`, `id` BIGINT autoincrement, `timestamps: true`, **`paranoid: true` on every
model** — so raw SQL must always add `AND "deletedAt" IS NULL`. A real bug shipped from
exactly that: raw SQL counted soft-deleted rows while the ORM did not, and pilot seats leaked.

Twelve tables, as built:

| Table | Key columns |
|---|---|
| `pandits` | `phone` unique, `isd_code, name, email, city, state` (GST place-of-supply), `gstin, business_name, status, referred_by, trial_granted_at, invite_code, pilot_seat, is_admin, last_seen_at` |
| `users` | **consumers.** `phone` unique, `isd_code, name, email, birth JSONB, profile JSONB, verified_at, status, last_seen_at` |
| `otp_sessions` | UUID pk, `isd_code, phone, otp, channel, attempts, status, expires_at` — shared by both audiences |
| `branding_profiles` | `pandit_id, honorific, display_name, shop_name, phone, whatsapp, email, address, logo_url, photo_url, signature_url, tagline, chart_style, default_language, default_design, default_palette, ui_language, changes_this_quarter` |
| `branding_change_log` | `pandit_id, changed_fields, before, after, ip, ua` ← arbitrage detection |
| `credit_packs` | `code, name_en, name_hi, price_paise, credits, validity_days, sort_order, highlight, active` |
| `credit_purchases` | `pandit_id, pack_id, amount_paise, gst_paise, credits, razorpay_order_id, razorpay_payment_id, status, invoice_no, expires_at` |
| `credit_ledger` | `pandit_id, delta` (+/−), `reason, ref_type, ref_id, note`. **Append-only; balance is always `SUM(delta)`.** |
| `clients` | `pandit_id, name, gender, dob, tob, tob_unknown, pob, lat, lon, tzone, phone, notes` ← the vahi |
| `reports` | `pandit_id, order_id, source` (`pandit\|consumer`), `client_id, report_type, design, palette, language, status, pdf_url, page_count, credits_charged, report_json, birth_meta, rashi, nakshatra, lagna, share_token, sale_price_paise, error, generated_ms` |
| `orders` | **consumer purchases.** `public_id` unique, `report_type, design, palette, language, user_id, buyer_name, buyer_phone, buyer_email, state, birth JSONB, amount_paise, gst_paise, razorpay_order_id, razorpay_payment_id, razorpay_link_id, razorpay_link_url, status, report_id, invoice_no, whatsapp_sent_at, whatsapp_error, error` |
| `pandit_prices` | `pandit_id, report_type, sale_price_paise` ← powers the earnings dashboard |

> **Diverged from the plan:** `report_types` and `themes` are **code, not rows** — see
> `server/catalog/catalog.js`. They change with a deploy, not at runtime, and a DB table
> would only add a join and a way for the two to disagree. `report_jobs` was never built
> because generation is synchronous (see below).

**Revenue is two separate numbers.** The astrologer console shows "estimated earnings" =
`pandit_prices × reports generated`. That is *the pandit's* revenue and an estimate. Pothi's
revenue is paid `orders.amount_paise` + paid `credit_purchases.amount_paise`. Never sum them.
`amount_paise` is gross and GST-inclusive; `gst_paise` is the tax already inside it.

---

## API surface (v1)

Four namespaces. All four JWTs are signed with the **same secret** and separated by a `kind`
claim, so a token minted for one audience is rejected with 403 by the others — without that
flag a pandit's token would satisfy a buyer route and read somebody else's orders.

| Namespace | Guard | Populates |
|---|---|---|
| `/noauth-api/v1` | none | — |
| `/api/v1` | `authenticate` | `req.pandit` |
| `/user-api/v1` | `authenticateUser` | `req.user` |
| `/admin-api/v1` | staff guard, re-reads `is_admin` per request | staff |

**noauth** — `auth/otp/{send,verify}` (pandits), `user/otp/{send,verify}` (buyers),
`catalog/{report-types,designs,palettes,packs}`, `location/{autocomplete,geocode}`,
`pilot/status`, `webhook/razorpay`, and the storefront:
`shop/catalogue`, `shop/report/:code`, `shop/thumb/:code`, `shop/order`,
`shop/confirm-link`, `shop/confirm`, `shop/order/:publicId`, `shop/order/:publicId/pages`.

**pandit** — `me`, `branding` GET/PUT, `credits/{balance,ledger,packs,purchase,confirm}`,
`reports` GET + `reports/generate`, `clients` GET/POST, `clients/birthdays`,
`earnings/{summary,prices}`.

**buyer** — `me` GET/PUT, `orders`.

> Every namespace must also be listed in `pothi-app/vite.config.ts`. A missing proxy entry
> returns `index.html` with a **200**, and the app breaks silently — this is exactly how the
> astrologer console rendered blank for a while.

### Generation flow — synchronous, webhook-authoritative

> **Diverged from the plan.** The plan specified a job table and polling. Generation
> actually takes 0.4–3.4 s, not 15–25 s, so a queue would have added a worker, a table and a
> polling endpoint to hide latency that is not there. It is synchronous inside
> `settleAndGenerate`, and that function is idempotent.

**Consumer.** `POST /shop/order` resolves the birth place server-side (an unresolvable place
must fail *before* money is taken), creates the order, and asks Razorpay for a **Payment
Link** — not the checkout SDK. A link is one URL that can also be sent over WhatsApp,
survives the buyer changing device, and keeps cards entirely on Razorpay's page.
`options.checkout.prefill` carries the number they already gave us, which removes an entire
screen; the `customer` field does not do this — it only drives Razorpay's own reminders.

```
buyer pays on Razorpay
  ├─ webhook  payment_link.paid  ← the ONLY authority
  │     verify HMAC over req.rawBody → 200 immediately → then work
  └─ browser returns to /order/<public_id> with a signed query string
        re-verified server-side; exists only so a buyer who beats the webhook home
        is not told they still owe money

settleAndGenerate (idempotent)
  render → reports row → PDF to disk/S3 → order.status = ready
  then, OUTSIDE the try: WhatsApp "your report is ready"
```

The notify call sits outside the try on purpose: inside it, a messaging failure would mark a
paid, generated report as `failed`. `orders.whatsapp_sent_at` stops a webhook retry from
messaging the same buyer twice.

**Pandit.** `POST /reports/generate` debits the ledger and inserts the report row in one
transaction — the debit and the report commit together or not at all.

Deciding a payment path by the **order id**, not by whether keys happen to be configured,
matters: a dev order can only ever settle on the dev path (never in production), and a real
order always requires a real signature. Getting this backwards broke credit top-up the day
live keys were added.

---

## Storage & infra

> **Not done yet.** Dev writes PDFs to `pothi-api/out/` and `utilities/storage.js` returns a
> `/files/...` path. `server/shop/reader.service.js` deliberately refuses any `pdf_url` that
> is not local, so the in-browser reader breaks the moment S3 is switched on until that is
> handled. `WEB_ORIGIN` is still `localhost`.

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
