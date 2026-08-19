# 07 · Reaching pandits — what actually works, and what will get us banned

> You said: *get their list, WhatsApp them.* The list part is fine. **The WhatsApp-blast
> part, done the obvious way, is the single fastest way to lose the business.** This
> document explains why, and what to do instead — which is cheaper anyway.

---

## 1. The compliance wall — read this before buying any list

### WhatsApp: a scraped list is a banned number

Meta's Business Policy requires **explicit opt-in from each recipient, to your specific
business, before any marketing template message.** Importing a purchased or scraped phone
list violates it outright. The failure mode is not a warning letter — it is high block
rates, a collapsing quality score, and **the number gets banned.**
([WhatsApp Business Policy](https://whatsappbusiness.com/policy/) ·
[opt-in guide](https://wa.expert/pages/whatsapp-marketing-opt-in-guide))

Industry summary of who gets banned in India: *"Businesses that treat WhatsApp API like
email marketing — buying lists and blasting — are the ones that get banned."*
([teleitsolutions](https://teleitsolutions.com/new-whatsapp-business-api-update-2025-what-indian-businesses-should-know/))

### SMS: worse. The penalty reaches every phone line we own

Commercial SMS in India needs three-layer **DLT registration** — entity, header, and every
content template ([Telerivet](https://www.telerivet.com/blog/india-sms-compliance-trai-dlt-registration-and-tcccpr-guide)).
And the classification is unambiguous:

> *"Cold outreach to a business you have no relationship with is promotional. It does not
> become transactional because it is phrased as information."*
> — [TRAI DND rules for B2B](https://www.gstsignal.tech/trai-dnd-cold-calling-rules-india)

Penalty for bulk promotional sending without registration: the operator **must disconnect
that sender's resources and blacklist them for two years**, shared across all operators
within 24 hours. TRAI's own framing: offenders *"would lose all telecom resources allotted
to them, including phone, internet and other connections"*
([newsonair](https://www.newsonair.gov.in/trai-mandates-all-service-providers-to-immediately-stop-promotional-calls-from-unregistered-telemarketers-to-curb-increasing-spam-calls/) ·
[Deccan Herald](https://www.deccanherald.com/india/pesky-call-makers-lose-all-2266176)).
Responsibility sits with the **principal entity** — us — not the agency we hire.

Promotional windows are 9 AM–9 PM, and headers now carry a forced `-P` suffix for
promotional traffic (May 2025), so recipients see it is an ad before they read it.

### Scraping the list itself: grey, not black

DPDP Act s.3(c)(ii) exempts personal data *"made publicly available"* by the data
principal. A pandit who published his phone number on his own website or a public sangh
directory plausibly falls inside that. But **the government's position is that scrapers
still owe consent and other DPDPA obligations**, the term is undefined, and courts have not
ruled on whether a site's terms of use or robots.txt bind a scraper
([IAPP](https://iapp.org/news/a/scraping-public-data-in-india-innovation-enabler-or-privacy-threat-) ·
[Law.asia](https://law.asia/india-data-scraping-regulation/)). Penalties under the Act run
to ₹250 crore.

**Practical read:** collecting publicly self-published business contact details for B2B
research is defensible. Mass automated harvesting from Justdial/IndiaMART against their
terms, then blasting it, is not — and the messaging offence lands long before the scraping
one does.

**Bottom line: the list is legal to assemble. The blast is what kills us.**

---

## 2. What we are allowed to do — and it is enough

| Channel | Legal? | Scale | Notes |
|---|---|---|---|
| **Human 1:1 WhatsApp from a normal phone** | ✅ | ~60–80/day/person | Not the Business API. A person typing to a person. This is how India actually does B2B |
| **Phone call, then WhatsApp after he agrees** | ✅ | ~40–60 calls/day | The call *creates* the opt-in. Log it |
| **WhatsApp Business API to opted-in numbers** | ✅ | unlimited | Only after he has given consent. Use for delivery, receipts, re-order nudges — the retention engine, not acquisition |
| **He messages us first** (QR, "click to WhatsApp" ad, missed call) | ✅✅ | scales | **Opens a 24-hour free-form window at ₹0.** This is the mechanic to design everything around |
| Cold API blast to a scraped list | ❌ | — | Number ban |
| Bulk promotional SMS without DLT | ❌ | — | 2-year blacklist of all our telecom resources |

**The single most important design decision: make the pandit message us first.**
Inside the 24-hour customer-initiated window, replies are free and unrestricted. Every
poster, visiting card, dealer counter and YouTube coupon should carry a WhatsApp QR that
opens with a prefilled *"Mujhe Pothi ke baare mein jaanna hai"*. That flips cold outreach
into inbound, legally and economically.

---

## 3. Where the lists actually are

Ranked by cost to obtain and quality, from [04-pricing-gtm.md](04-pricing-gtm.md):

| Source | Size | How | Quality |
|---|---|---|---|
| **Trimbakeshwar Purohit Sangh** | ~120–150 | Public visiting-card directory with names, photos, phone numbers | **Best in India.** Self-published, so DPDPA-defensible. Two people, one week, door to door |
| **Prayagwal Mahasabha**, Prayagraj | 1,884 registered tirth purohits | One negotiation with the Mahasabha, not 1,884 cold messages | Endorsed access beats scraped access |
| **ICAS** | 21,000 members, 60+ chapters | Partner per chapter; office-bearers introduce us | Warm by construction |
| **Institutes** (IVA Indore 14,000+ students, BVB Delhi) | thousands | Bundle free credits into enrolment | The institute does the messaging, not us |
| **Google Maps astrologer businesses** | 20,961 | Places API, 50% have a listed phone | Self-published, but **call first — don't WhatsApp cold** |
| **Legacy software dealers** | unpublished | Mystery-shop Astro-Vision / Future Point; ₹400–600 per conversion | They already have the relationship *and* the opt-in |
| **CSC / Spice Money agents** | 5.4 lakh VLEs | Channel partnership | They onboard, we never touch a cold number |

**The pattern in every good row: someone who already has permission introduces us.** That
is not a compliance workaround — it converts far better than a cold message ever would.

---

## 4. The playbook

**Phase 1 · 0–30 days — Trimbakeshwar, in person.**
~150 purohits with published numbers, in one town. Two people, door to door, laptop open,
generate a report with *his* name on it while he watches, hand him the phone to WhatsApp it
to his own client. Get a signed/ticked consent line at signup so every later message is
lawful. Target 30 paying. No messaging tooling required at all.

**Phase 2 · 30–90 days — Prayagraj + one ICAS chapter.**
One negotiation each. Ask the body to send the introduction; we follow up 1:1 by hand.
Instrument: first-sale-within-7-days, reports/pandit/month, second-pack-at-60-days.

**Phase 3 · 90+ days — turn on inbound.**
WhatsApp QR on every artefact. Click-to-WhatsApp ads (the ad *is* the opt-in). Referral
bounty paid on the referee's **second** pack. Only now register a WABA and use templates —
for delivery receipts, low-credit nudges and Varshphal birthday reminders to people who
asked for them.

**What we must build in the product for this to be legal at scale:**
- A **consent record** on the pandit row: timestamp, channel, IP, and the exact wording he
  agreed to. Without this, none of the later WhatsApp automation is defensible.
- **Source tracking** per account (which sangh / dealer / agent), so we can prove provenance
  and pay commissions.
- An **unsubscribe** that actually stops messages, honoured within the hour.

---

## 5. What I'd tell you not to do

1. **Don't buy a "5 lakh astrologer database"** off a data broker. It is stale, it is not
   opt-in, and the first blast ends the WABA.
2. **Don't hire a bulk-SMS agency** for cold promotion. The liability is ours as principal
   entity, and the penalty is every phone line the company owns.
3. **Don't automate WhatsApp from a personal number** with an unofficial library. That is
   the other classic ban trigger, and it also breaks the 1:1 human quality that makes this
   segment convert.
4. **Don't treat list size as progress.** DevDham signed 2,000 pandits across 18 states,
   raised $1.59M, and shut down. Repeat purchase is the only real metric.
