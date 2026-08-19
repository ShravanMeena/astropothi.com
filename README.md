# Pothi — white-label astrology reports for pandits

**One line:** A pandit buys 500 report credits for ₹2,000, enters a client's birth details,
picks a design, and gets a 40–200 page PDF carrying *his* name, photo, shop and phone —
which he sells to his client for ₹250–₹1,100 and shares on WhatsApp.

**We charge ₹4. He charges ₹300. His first customer pays for the whole pack.**

---

## Why "Pothi"

पोथी — the bound manuscript a pandit hands across the table. It is the physical object
we are digitising, the word every buyer in the target segment already knows, and it is
not a category label ("kundli software") that anchors us to the ₹499 Vyapar price ceiling.
Short, Devanagari-native, no newspaper/brand collision (unlike *Patrika*).

Alternates if `pothi.in` / `pothi.app` is taken, in preference order:
`Patri` (पत्री, from *janam patri* — most literal), `Jyotish Setu`, `PatriPro`.
Renaming is a folder rename plus a find-replace at this stage — do not over-deliberate.

**This is a separate product from Devpunya.** Own server, own client, own DB, own repo,
own Razorpay account, own domain. Devpunya's codebase is *reference and donor code only*.

---

## Documents

| Doc | What's in it |
|---|---|
| [PLAN.md](PLAN.md) | The master build plan — read this first |
| [docs/01-market.md](docs/01-market.md) | Competitors, real pricing, TAM, the buyer, sourced |
| [docs/02-product.md](docs/02-product.md) | Screens, the theme system, the earnings dashboard |
| [docs/03-architecture.md](docs/03-architecture.md) | Repos, stack, DB schema, how the engine is ported |
| [docs/04-pricing-gtm.md](docs/04-pricing-gtm.md) | Credit ladder, unit economics, the 90-day GTM |
| [docs/05-legal.md](docs/05-legal.md) | GST, DMR Act, RBI PPI exemption, disclaimers |
| [docs/06-roadmap.md](docs/06-roadmap.md) | 6 phases, what ships when, kill-criteria |
| [docs/08-consumer.md](docs/08-consumer.md) | Selling direct to consumers — and protecting the white-label side |
| [docs/07-outreach.md](docs/07-outreach.md) | How to reach pandits legally — and what gets us banned |
| [OPEN-ITEMS.md](OPEN-ITEMS.md) | Live issues found while building — read before shipping |
| [pothi-api/README.md](pothi-api/README.md) | How to run the API + what works today |

## The two surfaces, one site

`pothi-app` is a single application serving both audiences:

| Path | Who | What |
|---|---|---|
| `/` | **Consumers** | Storefront — buy one report, no account. This is where the ads point. |
| `/astrologers` | **Astrologers** | The console — credits, white-label branding, client book. Reached by one quiet link; recruited by the team, never by ads. |

One brand, one palette, one deploy. `pothi-api` serves both.
