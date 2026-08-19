# Build an admin panel for Pothi

Paste this whole file as your first message in the new chat.

---

## What Pothi is

Pothi sells computed Vedic astrology reports as typeset PDF books. Two audiences,
deliberately kept apart:

- **Consumers** buy one report for themselves. No account needed up front — the
  mobile number they enter at checkout *becomes* the account.
- **Astrologers ("pandits")** buy credits and generate white-labelled reports
  carrying their own branding. Currently in an invite-only free pilot (10 seats).

Seven report types, all deterministic (no LLM): `kundli` (64 chapters), `dosh`
(28), `love` (24), `health` (26), `horoscope` (22), `laalkitab` (30),
`varshaphal` (40).

## Where the code is

```
/Users/shravanmeena/Desktop/DevP/pothi/
├── pothi-api/     Node 24, Express 4, ESM, PostgreSQL 16, Sequelize. Port 4050.
│                  Start: npm run dev  (nodemon bin/www.js)
└── pothi-app/     Vite + React 18 + TypeScript + Tailwind 3. Port 5190.
                   Start: npm run dev
```

Database: local Postgres, database name `pothi`. Config in `pothi-api/config.js`,
secrets in `pothi-api/.env` (gitignored).

## What I want built

A **third surface**: an internal admin panel. Not the storefront, not the pandit
console — a staff tool. Suggested route `/admin` in `pothi-app`, or a separate
app if you argue that is cleaner.

It must answer, at a glance and in detail:

**Money**
- Orders created vs paid vs ready vs failed vs refunded, today / 7d / 30d / all
- Gross revenue, GST portion, net — from consumer orders AND pandit credit packs,
  kept as separate lines (see the revenue trap below)
- Conversion: created → paid rate, and where orders die
- Average order value, revenue by report type, revenue by day (chart)
- Failed and abandoned orders, with the reason, and a way to retry generation

**Users**
- List/search consumer accounts by phone, name, email
- One user's page: profile, everything they told us (interests, ishta devta,
  practices, notes), every order, lifetime value, whether OTP-verified
- Flag/suspend an account (`users.status` is already `active | suspended`)

**Reports**
- Every generated report: type, design, palette, language, pages, ms to generate,
  which pandit or which consumer order it belongs to
- Open the PDF; regenerate a failed one

**Astrologers**
- Pandit list, pilot seats used, credits balance and ledger, branding profile,
  how many reports each has generated, their set prices

**Operations**
- Payment links and their state; webhook deliveries and failures
- Pilot seat management (grant/revoke)
- The catalogue: prices per report type

## The database — real schema

Every model is Sequelize with `paranoid: true` and `timestamps: true`, so every
table has `createdAt`, `updatedAt`, `deletedAt`.

| table | columns |
|---|---|
| `pandits` | id, isd_code, phone, name, email, city, state, gstin, business_name, status, referred_by, trial_granted_at, invite_code, pilot_seat, last_seen_at |
| `users` | id, isd_code, phone, name, email, birth (jsonb), profile (jsonb), verified_at, status, last_seen_at |
| `orders` | id, public_id, report_type, design, palette, language, user_id, buyer_name, buyer_phone, buyer_email, state, birth (jsonb), amount_paise, gst_paise, razorpay_order_id, razorpay_payment_id, razorpay_link_id, razorpay_link_url, status, report_id, invoice_no, error |
| `reports` | id, pandit_id, order_id, source, client_id, report_type, design, palette, language, status, pdf_url, page_count, credits_charged, report_json, birth_meta, rashi, nakshatra, lagna, share_token, shared_at, sale_price_paise, error, generated_ms |
| `credit_purchases` | id, pandit_id, pack_id, amount_paise, gst_paise, credits, razorpay_order_id, razorpay_payment_id, status, invoice_no, expires_at |
| `credit_ledger` | id, pandit_id, delta, reason, ref_type, ref_id, note |
| `credit_packs` | id, code, name_en, name_hi, price_paise, credits, validity_days, sort_order, highlight, active |
| `clients` | id, pandit_id, name, gender, dob, tob, tob_unknown, pob, lat, lon, tzone, phone, notes |
| `branding_profiles` | id, pandit_id, honorific, display_name, shop_name, phone, whatsapp, email, address, logo_url, photo_url, signature_url, tagline, chart_style, default_language, default_design, default_palette, ui_language, changes_this_quarter, quarter_started_at |
| `branding_change_log` | id, pandit_id, changed_fields, before, after, ip, ua |
| `pandit_prices` | id, pandit_id, report_type, sale_price_paise |
| `otp_sessions` | id, isd_code, phone, otp, channel, attempts, status, expires_at |

Enums:
- `orders.status`: `created | paid | generating | ready | failed | refunded`
- `reports.status`: `generating | ready | failed`; `reports.source`: `pandit | consumer`
- `credit_purchases.status`: `created | paid | failed`

Associations live in one place: `pothi-api/database/index.js`.

## API architecture

Three namespaces, mounted in `pothi-api/index.js`:

```
/noauth-api/v1/*   public          (catalogue, shop, OTP send/verify, webhook)
/api/v1/*          pandit token    authenticate()      → req.pandit
/user-api/v1/*     consumer token  authenticateUser()  → req.user
```

Both token kinds are JWTs signed with the same secret and separated by a `kind`
claim (`"pandit"` / `"user"`) — see `pothi-api/platform/auth.js`. Crossing them is
rejected with 403.

**There is no admin auth yet. You have to add it.** Do NOT reuse the pandit or
user token. Add a fourth namespace `/admin-api/v1/*` with `kind: "admin"`, backed
by its own `admins` table (phone or email + OTP, or a seeded password — your
call, but say which and why). An admin token must never be mintable from the
public OTP endpoints.

Route files follow one shape: `server/<area>/<area>.route.js` exporting
`noAuth()` and/or `userRoute()`, with service logic in `<area>.service.js`.
Responses go through `utilities/http.js` → `{ success, results }` or
`{ success:false, message }`.

## Design language (the frontend already has one — match it)

`pothi-app` uses **semantic CSS tokens**, not a colour scale. In `src/index.css`:
`--surface --raised --sunken --line --fg --muted --faint --brass --brass-soft --ember`,
exposed to Tailwind as `bg-surface text-fg border-line text-brass` etc. Dark mode
is a `.dark` class on `<html>`, following the device by default, with a toggle.

**Trap that already cost me hours:** the codebase used to contain hundreds of
`text-ink-400`, `bg-brass-400`, `bg-ember-100` classes. Those numbered scales are
**not defined** in `tailwind.config.js`, so they compiled to nothing and whole
screens rendered unstyled. Use the semantic tokens only. Never `bg-white` or
`text-white` — they don't survive dark mode; use `bg-raised` / `text-surface`.

Component classes already available: `.shell .card .field .label .btn-brass
.btn-line .btn-quiet .btn-sm .chip .rule .caps .display .lede .foil .grain .lamp`.

The storefront look is dark-first, gold ("brass") accents, Fraunces serif
display + Inter body, Framer Motion for movement. An admin tool should be calmer
and denser than the storefront — but use the same tokens so it feels like the
same company. Data-dense tables, real numbers, no decorative filler.

## Things that will bite you

1. **Soft deletes.** Every table is paranoid. Sequelize hides `deletedAt`-set rows
   automatically, but **raw SQL does not** — always add `AND "deletedAt" IS NULL`.
   A real bug shipped from exactly this: raw SQL counted deleted rows while the
   ORM didn't, and pilot seats leaked.

2. **The revenue trap.** The pandit console shows "estimated earnings" =
   `pandit_prices × reports generated`. That is **the pandit's** revenue, is an
   estimate, and is **not Pothi's money**. Platform revenue is only:
   paid `orders.amount_paise` + paid `credit_purchases.amount_paise`.
   Never add these together into one number.

3. **`amount_paise` is gross, GST inclusive.** `gst_paise` is the tax portion
   already inside it. Net = amount − gst. GST is 18%.

4. **Payments are Razorpay Payment Links**, not the checkout SDK. The order
   carries `razorpay_link_id` / `razorpay_link_url`. The **webhook is the only
   authority** on payment: `POST /noauth-api/v1/webhook/razorpay`, HMAC over the
   RAW body (`req.rawBody`, captured in `index.js`). Never mark an order paid
   from admin UI without going through `Shop.settleAndGenerate` — it is
   idempotent and does the generation.

5. **Vite dev proxy.** `vite.config.ts` must list every API namespace you add.
   A missing entry returns `index.html` with a 200 and the app silently breaks
   — this exact bug made the whole pandit console render blank.

6. **Dates.** `orders.createdAt` is a real timestamp, but report `dob`/`tob` are
   plain strings. Day-boundary reporting should use IST explicitly
   (`AT TIME ZONE 'Asia/Kolkata'`), not the server's local zone.

7. **Preview/PDF caching.** `server/catalog/preview.service.js` fingerprints the
   renderer source into its cache key so previews self-invalidate. If you touch
   the renderer, previews rebuild automatically — they take a few seconds each.

## Testing — this repo has a culture, keep it

`pothi-api` has real tests, run with `npm test`:
`test:layout` (21), `test:content` (21), `test:credits` (8), `test:pilot` (7),
`test:shop` (13), `test:payments` (21), plus 480 astrology invariants.

Write tests for the admin work in the same style — plain scripts under
`pothi-api/scripts/`, asserting against a running API, printing `✓/✗` and exiting
non-zero on failure. At minimum cover: admin auth cannot be obtained from a
consumer or pandit token; revenue totals match a hand-computed SQL figure;
suspending a user actually blocks their token.

## How I want you to work

- Verify before you assert. Read the actual file or query the actual DB rather
  than assuming a column exists.
- Use Playwright to check flows in a real browser, not just that it compiles.
- `npm run typecheck` in `pothi-app` must stay clean (it checks
  `tsconfig.app.json` — the default `tsconfig.json` checks **zero** files).
- Tell me plainly what you did not build and what is still unsafe.

Start by reading the code and telling me your plan for admin auth before you
build the panel.
