# 08 · Selling direct to consumers

The platform now serves two buyers off one engine:

- **Pothi (B2B)** — a pandit buys credits, generates under *his* name, resells at ₹250–₹1,100.
- **Consumer (B2C)** — a person buys one report for themselves, under *our* name.

This document is about the second, and about the one thing that can break the first.

---

## 1. The conflict, and how to survive it

The white-label promise is *"your name, never ours."* A pandit who discovers we also sell to
his client for ₹499 has learned that his supplier competes with him. He leaves, and — because
this segment lives in WhatsApp groups — he takes others with him.

**It is done in this market, and it costs the B2B side.** AstroSage runs both: 80M consumer
downloads *and* Dhruv Astro for astrologers. Dhruv has **four reviews on Techjockey**.
Astro-Vision does the same with LifeSign and NetDirect. In both cases the consumer brand
thrives and the astrologer product is an afterthought with no mindshare.

Since B2C is the brutally contested side (Astrotalk ₹1,182 cr, AstroSage 80M downloads) and
white-label is the *differentiated* side, the sane structure is:

| | Pandit product | Consumer product |
|---|---|---|
| Brand | **Pothi** | a separate consumer brand |
| Domain | pothi.in | its own |
| Report branding | his name | our name |
| Sold as | credit packs | one report, one price |
| Cross-links | **none, in either direction** | none |

Same engine, same database, two front doors that never mention each other. The separation is
a `BRAND` config, not a fork — one deploy, two surfaces.

**Rules that keep the B2B side alive**
1. A consumer report never carries a pandit's branding, and vice versa.
2. The pandit dashboard never mentions the consumer brand.
3. **We never contact a pandit's client.** His client list is his; we hold it as processor.
   This is also the DPDP position — see [05-legal.md](05-legal.md).
4. Consumer marketing never targets "astrologers" as an audience.

---

## 2. Why B2C is worth doing anyway

The honest arithmetic from [01-market.md](01-market.md):

| | B2B (pandits) | B2C (consumers) |
|---|---|---|
| Realistic buyers | 50k–150k accounts | tens of millions |
| Revenue ceiling | ₹20–60 cr | the category is ₹30,000 cr |
| Price per report | ₹4 (our cut) | ₹199–₹999 (all ours) |
| Competition | almost none executing | Astrotalk, AstroSage, Clickastro, Prokerala |
| Our edge | design + white label | **we own the engine — COGS ≈ ₹0** |

**B2C is 50–250× the revenue per report and a far larger market — and far harder to win.**
The reason to do both: the engine cost is already paid, and the marginal cost of one more
report is a rounding error. Every B2C sale is close to pure margin.

### On ₹100,000 cr / $100B

It is not reachable selling kundli reports. India's whole astrology market is ~₹30,000 cr,
Astrotalk at category-leader scale is ₹1,182 cr, and the astrology *app* market is projected
to $1.8B by 2030. A $100B company would need to be several times the entire category.

What *is* reachable, and worth aiming at honestly:

- **₹50–100 cr** — a strong B2C report business at 2–5% of the category
- **₹500–1,000 cr** — only by moving past reports into consultation (Astrotalk's model:
  per-minute talk-time is where the money actually is; reports are the entry drug)
- **Beyond that** — a different business, not this one

Reports are the **acquisition wedge**, not the destination. A ₹399 report buyer is the
cheapest possible lead for a ₹30/min consultation. That is the path with real headroom.

---

## 3. The consumer product

### Pricing — anchored to what the market already charges

Three tiers, priced by depth. The previous ladder was set one report at a time
and drifted badly: measured against the words a buyer actually receives, Kundali
cost ₹45 per thousand and Vastu ₹181 — a four-fold spread across one shelf, with
the largest book the cheapest per page. Tiers are defined in
`server/catalog/catalog.js` as `PRICE_TIERS`, and a report is assigned a band
rather than a number.

| Tier | Reports | Chapters | Pages | Price | ₹ per 1,000 words |
|---|---|---|---|---|---|
| **Flagship** | Premium Personalised Kundali | 64 | 87 | **₹999** | 65 |
| **Full** | Dosh · Laal Kitaab · Varshaphal | 28–40 | 39–43 | **₹599** | 97–105 |
| **Focused** | Love · Health · Horoscope · Vastu | 15–26 | 25–28 | **₹399** | 60–151 |
| **Guna Milan** *(to build)* | ~30 | — | — | **₹599** | pandit charges ₹1,500–8,000 |

Market comparison: Clickastro ₹1,416, AstroSage ₹996–1,999, VedicRishi ₹550,
GrahAI ₹499, Prokerala matching ₹99. The flagship sits at AstroSage's floor and
30% under Clickastro, while carrying three designs, eight report types and a
report assistant that none of them offer.

The flagship is deliberately the best value per word on the shelf — it is the
anchor everything else is compared against, and the report the ads point at.

Prices are GST-inclusive; most consumers cannot claim it.

**These levels are a judgement call, not a finding.** What the tiers fixed is
*coherence* — the 4× spread was measurably wrong. Whether ₹999/₹599/₹399 is what
this market will pay is unknown until real buyers see it, which is what the
override table below exists for.

### The Love report was rebuilt

It is the worked example of what a report here should be, and worth reading
before writing another one.

**What was wrong.** Twenty-four chapters, 1,071 words, **45 words a chapter** —
and every chapter title was a *chart component*: "The 7th House", "Venus — The
Significator of Love", "The 7th Lord in the Navamsa". Each said which planets
sat where. That is a description of a chart, not an answer to a question, and
nobody buys a chart description. Every classical source agrees on the point the
structure missed: Venus, the Moon and the 7th house have to be read *together*,
because each alone says almost nothing about how a person loves.

**What it is now.** Fifteen chapters, ~3,600 words, **240 a chapter**, and every
title is a question — *How you are in love*, *Where the friction will come
from*, *Will it last?* Each answer synthesises several placements. The chart is
still in the report in full, as the closing chapter, as evidence for a reader
who wants to check the working.

| | Before | After |
|---|---|---|
| Chapters | 24 | 15 |
| Words | 1,071 | ~3,600 |
| Words/chapter | 45 | ~240 |
| Pages (heritage) | 15 | 25–28 |
| Identical for every buyer | 41% | 37% |

**Three pieces:**

- `engine/astrology/love-profile.js` — the derivation layer. Deterministic and
  classical: attachment style from the Moon, expression from Venus, chemistry
  from Venus–Mars, communication from Mercury, friction from Mars/Saturn/Rahu,
  endurance from the navamsa. Each judgement carries the `why` rule that fired.
- `engine/i18n/love-strings.js` — the vocabulary, in both languages, for things
  the chart does not name.
- `engine/mapping/love-chapters.js` — one chapter per question.

**The most useful thing it derives** is the split between what Venus is drawn to
and what the 7th house commits to. When they disagree, the reader is told that
the person who excites them and the person who suits them may not be the same
person. That is invisible if Venus and the 7th each get their own chapter, which
is exactly what the old structure did.

**A bug worth remembering.** `computeLifeFacts` returns house judgements *flat*
on `facts.houses7` — there is no `.judgement` wrapper. The first draft read
`facts.houses7?.judgement?.grade` everywhere and `|| "moderate"` made it look
like a real verdict. Every dial was reading nothing. `gradeOfHouse()` now throws
instead of defaulting: a wrong path has to fail, not average out.

**Generation cost.** Enrichment is tuned per report (`PROFILES` in
`engine/ai/enrich.js`) — Love asks for a 300-word floor and 220–300 word
expansions. As one Bedrock call that took 34 seconds of a buyer staring at a
spinner; it is now sent as concurrent batches of five, at 15s (en) / 23s (hi).

> **`career` has the same disease.** 44% of its sentences are identical for
> every buyer, because it is still one chapter per planet opening with a
> textbook definition. Same fix applies. Recorded in
> `scripts/audit_data_driven.js`.

### Changing a price without a deploy

`price_overrides` is a one-row-per-report table that wins over the tier. Staff
edit it at **Admin → Pricing**; the change is live on the next page load, with a
30-second cache in `pricing.service.js`. Clearing the override falls back to the
tier, so the code stays the source of the default and the database only holds
the deliberate exceptions. The panel shows tier price and charged price side by
side, because "why is Love ₹349" should be answerable without reading a git log.

An order stores `list_paise`, `coupon_code`, `discount_paise` and `amount_paise`.
A price change never rewrites an existing order — a buyer pays what they were
quoted.

### Coupons

`coupons` holds a code, a kind (`percent` or `flat`), a value, and the limits
worth having: a discount cap, a minimum order, a list of reports it applies to,
a total-use count, a start and an expiry. Managed at **Admin → Pricing**.

Three rules the implementation enforces, each because the obvious version is
wrong:

1. **The amount charged comes from our arithmetic, never the browser's.** The
   checkout re-validates the code server-side and recomputes the total; a posted
   `amount_paise` is ignored. `scripts/test_pricing.js` asserts this directly.
2. **A use is spent on payment, not on order creation.** Otherwise a hundred
   abandoned carts exhaust a hundred-use code before anyone pays.
3. **The discount is rounded up to a whole rupee.** 25% of ₹399 is ₹99.75, and
   ₹299.25 on a Razorpay page reads as a mistake. The rounding always favours
   the buyer.

Percent coupons are capped at 90% server-side, and no coupon can take an order
below ₹1 — a zero-rupee payment link cannot be created, and a free report should
be a deliberate act rather than an arithmetic accident.

### Support, and where it appears

One contact, in four places, from two sources that must be changed together:

| Where | Source |
|---|---|
| Site footer, every browse page, order page, profile | `pothi-app/src/lib/support.ts` |
| The closing page of every generated PDF | `CONSUMER_SUPPORT_PHONE` / `CONSUMER_SUPPORT_EMAIL` in `pothi-api/.env` |

Both are direct links, not a contact form: WhatsApp opens with the order number
already in the message and the email with it in the subject, so "it is not
working" arrives as something answerable. In the PDF they are real link
annotations, so they are tappable in a phone's reader — a buyer holding a PDF has
no browser tab to click in.

A pandit's white-label report carries the **pandit's** contact, never ours, and a
report for a pandit who gave us no number prints no support block at all rather
than falling back to the house one.

### The flow — three screens, no account

```
Landing → pick report → birth details → pick design → pay → PDF + WhatsApp
```

No signup before payment. Phone number captured at checkout, which is also the
receipt channel and the re-marketing consent.

### What must change in the code

| Piece | Change |
|---|---|
| `reports` table | `pandit_id` becomes nullable; add `order_id`, `buyer_phone`, `source` |
| new `orders` table | one purchase = one report, Razorpay order, status, price |
| `reports.service` | branding comes from **our** brand when `source = 'consumer'` |
| payment | real Razorpay per-transaction (the pilot stub stays for B2B) |
| new surface | consumer storefront, separate build, no auth |

The engine, renderer, designs, preview, location and PDF storage are reused unchanged.

---

## 4. Sequence

1. **Consumer storefront + one-off payment** — the whole B2C loop end to end.
2. **Guna Milan.** Highest-value SKU on *both* sides: ₹499 to a consumer, and the
   ₹1,500–8,000 report a matchmaking pandit sells.
3. **SEO.** Prokerala and AstroSage live on organic search for "kundli", "gun milan",
   "manglik dosh". Free per-chart pages are how a report business is actually discovered.
4. **Consultation** — only after reports prove the funnel. That is where the ceiling lifts.
