# 06 · Roadmap

Assumes a small team. Weeks are elapsed, not ideal-engineer-weeks.

## Week 0 — before any code

| Task | Why it's first |
|---|---|
| Buy the domain, settle the name | Everything else references it |
| **Order the Swiss Ephemeris Professional Licence** (CHF 700–750) | Long lead time, blocks the credibility fix |
| Buy 1 month of AstroSage Dhruv (₹999) and one GrahAI recharge (₹6,999); read both PDFs cover to cover | This is the design brief. Do not design themes without it |
| Scrape the Trimbakeshwar Purohit Sangh public visiting-card directory into a sheet | ~150 names with phone numbers = customers #1–150 |
| Razorpay MCC approval in writing; CA on the GST-on-advance question | Both can block launch and both take weeks |
| Check the Maharashtra Anti-Superstition Act schedule | Trimbakeshwar is in MH — this gates phase 1 GTM |

---

## Phase 0 · Foundations — weeks 1–2

- `pothi-api` + `pothi-web` repos, Docker, ECR/ECS, S3+CloudFront, Sentry, Secrets Manager
  (**no secrets in the Dockerfile — that is the one Devpunya pattern we do not copy**)
- Postgres `pothi`, schema per [03-architecture.md](03-architecture.md), `ensure_*.js` scripts
- Auth: phone + OTP + JWT (port `devpunya .../server/login/`, **fix the `exp` bug**)
- **Port the engine**: copy tree, delete `engine/ai/`, inline `doshas.js`, de-duplicate the
  7 birth-input normaliser copies, neutralise `DEFAULT_BRANDING`, write `scripts/sync_engine.js`
- Prove it: a CLI script renders all 7 existing report types in en + hi to local PDFs

**Exit:** `node scripts/render_local.js --type 5 --lang hi` writes a correct 64-chapter PDF
from a clean repo with no Devpunya dependency.

## Phase 1 · The core loop — weeks 3–6

- Branding profile CRUD + asset upload + `branding_change_log`
- Widen the branding shape in the engine (photo, shopName, whatsapp, tagline, signature,
  honorific) and thread it into cover + every page footer
- Credits: packs, append-only `credit_ledger`, `SELECT … FOR UPDATE` debit in the same
  transaction as the report insert, auto-refund on terminal job failure
- Razorpay order + **webhook-authoritative** crediting (HMAC on `req.rawBody`), GST tax invoice PDF
- `POST /reports/generate` → job table → worker → S3 → status polling
- Web: login, onboarding wizard, new-report form with Google Places autocomplete, progress
  screen, preview, **WhatsApp share as the primary CTA**, download
- Trial: 10 free credits released on *uploading a logo*, not on signup

**Exit:** a real pandit, on his own phone, with no help, generates a report carrying his
branding and WhatsApps it to a client. **Ship it to 5 Trimbakeshwar purohits and watch.**

**Kill-criterion:** if fewer than 3 of the first 10 hand-held pandits sell a report to a real
customer within 7 days, stop and re-diagnose before building themes.

## Phase 2 · Themes — weeks 7–9

The differentiator. Three weeks, mostly refactor.

- Extract `engine/reporting/themes/` tokens (`_base.js` + registry + `getTheme`)
- Convert renderers in order: `render-dosha-pdfkit.js` (667 lines, 19 colours) as pilot →
  horoscope → varshaphal → laalkitab → **`render-report-pdfkit.js` (3,129 lines, 68 colours) last**,
  behind a visual-diff harness
- Build 7 themes; commission real ornament/border artwork — this is the one place to spend on
  a designer, because "it looks beautiful" *is* the sale
- Theme picker with real thumbnails; sample gallery on the public site
- **Test every theme at 1-bit mono** (cheap laser printers) and as a WhatsApp thumbnail
- Typeset Devanagari and Latin separately; do not scale one font for both

**Exit:** chart 5 × 7 themes × 2 languages = 14 PDFs, byte-different, extracted-text-identical.

## Phase 3 · The money SKU — weeks 10–12

**Ashtakoot Guna Milan.** Highest-value report a pandit sells (₹1,500–8,000) and ~60% of the
category's revenue is marriage-related.

- `engine/astrology/guna-milan.js` — 8 kootas / 36 points. Six maps already exist in
  `astro-constants.js`; Graha Maitri derives from `FRIENDS`/`ENEMIES` in `kundli-facts.js`;
  Bhakoot and Tara from moon-sign / nakshatra distance
- Manglik comparison across both charts (reuse `analyzeManglikCancellations`), Bhakoot/Nadi
  cancellation rules, dasha-sandhi
- ~30-chapter bilingual milan report + the `vivah` theme as its default
- Two-person birth-input form, saved as a pair in the client book

**Exit:** 20 milan reports cross-checked against Jagannatha Hora / AstroSage output koota by
koota. Any mismatch is a bug, not a "different school".

**Also in this window:** the **Swiss Ephemeris swap** and `scripts/audit_ayanamsha.js`
(500 charts, old vs new vs published tables), plus the two known accuracy bugs (weekday
sunrise-vaar convention; the lagna-house mismatch on a 1:30 AM birth). *Ship this before the
first pandit outside the pilot group.*

## Phase 4 · Retention — weeks 13–15

- Earnings dashboard + `pandit_prices` (he sets his own selling price per type)
- Client Book / vahi: search, past reports, free re-download for 12 months
- **Birthday Varshaphal reminders** — push + WhatsApp, one-tap generate-and-send. The annuity
- Credit expiry warnings at 30/7/1 day with the rollover-on-repurchase offer
- Hindi WhatsApp support channel — a real differentiator given the "support is a scam"
  reputation of the incumbents

**Exit:** second-pack rate at 60 days ≥ 30% in the pilot cohort.

## Phase 5 · Scale — weeks 16–20

- Bulk CSV generation (marriage bureaus — the highest reports-per-account segment)
- Multi-seat / shop plan — **removes the credit-arbitrage incentive rather than policing it**
- Referral + Jyotish Mitra agent + distributor ladder; scratch-card voucher codes for
  samagri distributors and CSC/Spice Money agents
- Admin: accounts, ledger audit, **>2-branding-profile arbitrage alert**, refund tooling
- Print fulfilment via a POD partner (40 credits + ₹399–499 flat)
- Regional languages: Marathi and Telugu next (Leostar taxes multilingual +40% — undercut it)
- Public sample gallery + SEO landing pages per city/segment

---

## The three numbers that decide whether this is a business

Everything else is noise until these are healthy:

| Metric | Target | Why |
|---|---|---|
| **First sale within 7 days of signup** | ≥ 40% | The activation event. If he never sells one, nothing else matters |
| **Reports per pandit per month** | ≥ 20 | Below this, the pack lasts 2 years and breakage is just churn |
| **Second-pack rate at 60 days** | ≥ 30% | The only real proof of retention. DevDham had 2,000 pandits and no repeat purchase |

## Honest risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Distribution fails (the Jastro outcome) | **Critical** | Enumerable lists, zero ad spend, door-to-door proof case at Trimbakeshwar first |
| Free software is good enough | High | Sell design + WhatsApp + earnings, never calculation |
| Ayanamsha accuracy attacked in a WhatsApp group | High | Swiss Ephemeris + published methodology page + koota-level cross-checks |
| Credit arbitrage | Medium | Branding lock + change log + >2-profile alert + a real multi-seat plan |
| DMR Act exposure via remedy text | Medium (criminal) | CI lint over the corpus; rewrite the Health report register |
| Astrotalk builds this | Medium | They own 45,634 astrologers. Approach them early **as a supplier** rather than waiting to be flattened |
| Market is simply too small | Medium | Honest SAM is 50k–150k accounts ≈ ₹20–60 cr ceiling on credit packs. AstroSage, who own this segment, are a ₹60 cr business. **This is a good ₹20–40 cr business, not a unicorn — plan the cost base accordingly** |
