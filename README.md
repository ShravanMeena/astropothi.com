# Pothi — computed Vedic reports, sold two ways

**पोथी** — the bound manuscript a jyotishi hands across the table. That is the object
this product digitises.

One engine, two customers:

- **Consumers** buy one report for themselves, at `/`. No account needed up front — the
  mobile number they enter at checkout *becomes* the account. This is where paid ads point.
- **Astrologers ("pandits")** buy credits at `/astrologers` and generate the same books
  carrying *their* name, photo, shop and phone. Recruited by the team, never by ads.

Every **fact** in a report is computed: positions come from an astronomical ephemeris
using the Lahiri (Chitrapaksha) ayanamsha, and the chapters are derived from the chart.
Nothing about a chart is ever guessed.

The **explanation** around those facts is written by a model at generation time, for
chapters the templates leave thin — and it is fact-checked before it is printed: an
expansion naming a sign or a date its chapter never mentioned is discarded, not shown.
Computed sentences are never rewritten, only added to. Set `AI_ENRICH_REPORTS=false`
to ship the templates untouched.

**This is a separate product from Devpunya.** Own server, own client, own DB, own Razorpay
account, own domain. Devpunya's codebase was *reference and donor code only*.

---

## Run it

```bash
createdb pothi                       # once
cd pothi-api  && cp .env.example .env && npm install && npm run dev    # :4050
cd pothi-app  && npm install && npm run dev                            # :5190
```

The API syncs its schema on boot in development. `pothi-app` proxies `/api`, `/user-api`,
`/admin-api`, `/noauth-api` and `/files` to `:4050` — **every namespace must be listed in
`vite.config.ts`**, or the request silently returns `index.html` with a 200.

## The three surfaces

| Path | Who | What |
|---|---|---|
| `/` `/reports` `/faq` | Consumers | Storefront. Seven reports, each in its own colourway. |
| `/report/:code` | Consumers | The page ads land on: real sample pages, real chapter list. |
| `/buy/:code` → `/order/:id` | Consumers | Checkout via a Razorpay Payment Link, then the finished book. |
| `/profile` | Consumers | Every order they have made, plus what they choose to tell us. |
| `/astrologers` | Astrologers | The console — credits, white-label branding, client book. |
| `/admin` | Staff | Orders, revenue, users, reports. Separate auth. |

## The seven reports

`kundli` (64 chapters) · `dosh` (28) · `love` (24) · `health` (26) · `horoscope` (22) ·
`laalkitab` (30) · `varshaphal` (40). Three typesettings — Classic, Editorial, Heritage —
and seven palettes, as independent axes. See
[docs/09-adding-a-report.md](docs/09-adding-a-report.md) for how a report is built and
what it takes to add or remove one.

## Tests

`npm test` in `pothi-api` runs everything:

| Suite | Proves |
|---|---|
| `test:layout` | header and footer never touch the page frame |
| `test:content` | every source chapter survives into the PDF — catches silent truncation |
| `test:credits` | the pandit money path, including concurrent replays |
| `test:pilot` | invite gate, seat cap, free reports |
| `test:shop` | consumer purchase end to end, settled the way production settles it |
| `test:payments` | payment links + **webhook**: forged signatures, duplicates, unknown ids |
| `test:whatsapp` | delivery rules, in forced dry-run — it can never send or spend |
| `test:admin` | staff auth cannot be reached with a buyer or pandit token |
| `test:pricing` | price overrides reach the shop; coupons cannot be forged, reused past their limit, or spent by an abandoned cart |
| `test:events` | behavioural ingest, the `sendBeacon` text/plain path, identify backfill, and the funnel |
| `audit:reports` | Kundali + Dosh prose cross-checked against the chart, in **both languages** |
| `audit:astro` | 480 chart invariants across 8 charts |
| `audit:text` / `audit:data` | depth, duplicate sentences, how much of a report is static |

Also: `npm run covers` rebuilds the storefront's static cover images from the live
renderer — run it after any change to the PDF cover, or the marketing site shows a book
you no longer print.

## Documents

| Doc | What's in it |
|---|---|
| [PLAN.md](PLAN.md) | The master build plan |
| [OPEN-ITEMS.md](OPEN-ITEMS.md) | Live issues and what still blocks launch — **read before shipping** |
| [docs/01-market.md](docs/01-market.md) | Competitors, real pricing, TAM, the buyer |
| [docs/02-product.md](docs/02-product.md) | Screens, the design system, the earnings dashboard |
| [docs/03-architecture.md](docs/03-architecture.md) | Stack, schema, API surface, storage |
| [docs/04-pricing-gtm.md](docs/04-pricing-gtm.md) | Credit ladder, unit economics, GTM |
| [docs/05-legal.md](docs/05-legal.md) | GST, DMR Act, RBI PPI exemption, disclaimers |
| [docs/06-roadmap.md](docs/06-roadmap.md) | Phases, what ships when, kill-criteria |
| [docs/07-outreach.md](docs/07-outreach.md) | Reaching pandits legally |
| [docs/08-consumer.md](docs/08-consumer.md) | Selling direct, without damaging the white-label side |
| [docs/09-adding-a-report.md](docs/09-adding-a-report.md) | Where the reports come from; adding an eighth |
| [docs/10-deploy.md](docs/10-deploy.md) | Deploying to GCP — VM, Cloud SQL, GCS, and the order of operations |
| [docs/11-redeploy.md](docs/11-redeploy.md) | **`./deploy.sh`** — shipping changes, admin grants, migrations, rollback |
| [ADMIN-PANEL-PROMPT.md](ADMIN-PANEL-PROMPT.md) | Self-contained brief for building the admin panel |
| [pothi-api/README.md](pothi-api/README.md) | API: run, scripts, current state |

---

## What is not done

Short version — the full list with detail is in [OPEN-ITEMS.md](OPEN-ITEMS.md).

1. **Nobody can log in in production.** The OTP is generated and logged to the server
   console; there is no SMS or WhatsApp delivery, and the `dev_otp` field is stripped
   outside development. This is the single hardest blocker.
2. **Nothing is deployed.** `WEB_ORIGIN` is still `http://localhost:5190`, which is where
   Razorpay returns buyers after payment.
3. **The Razorpay webhook is not registered** — it cannot reach localhost. Orders currently
   settle only through the browser redirect, so a buyer who pays and closes the tab is
   charged and never gets a report.
4. **PDFs are on local disk.** S3 is unconfigured, and the in-browser reader deliberately
   refuses anything that is not a local `/files/` path.
5. **WhatsApp delivery is built but cannot send** — the MSG91 sender number has no active
   subscription on the account.
6. **Love and Health are thin** — 44 and 56 words per chapter against Kundali's 246, and
   both sell at ₹299.
