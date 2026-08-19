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

Reports are the **acquisition wedge**, not the destination. A ₹299 report buyer is the
cheapest possible lead for a ₹30/min consultation. That is the path with real headroom.

---

## 3. The consumer product

### Pricing — anchored to what the market already charges

| Report | Chapters | Our price | Market comparison |
|---|---|---|---|
| Basic Kundali | ~12 | **₹199** | IndiaMART floor ₹200 |
| Dosh / Love / Health / Horoscope | 22–28 | **₹299** | Prokerala matching ₹99, GrahAI ₹499 |
| Laal Kitaab / Varshaphal | 30–40 | **₹499** | VedicRishi ₹550 |
| **Premium Kundali** | 64 | **₹699** | Clickastro ₹1,416, AstroSage ₹996–1,999 |
| **Guna Milan** *(to build)* | ~30 | **₹499** | pandit charges ₹1,500–8,000 |

Undercuts every incumbent while carrying 3 designs they do not have. Prices are
GST-inclusive; most consumers cannot claim it.

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
