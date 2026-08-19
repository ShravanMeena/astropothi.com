# 05 · Legal & compliance (India)

> **Not legal advice.** The GST-on-advances position and the DMR Act content rules in
> particular must be reviewed by a CA and a lawyer before launch. Everything here is
> sourced so a professional can verify it quickly.

## 1. GST — 18%, payable when we SELL the pack

**Rate 18%. Classify as SaaS (SAC 998434 or 997331), not astrology services (SAC 999799).**
Same tax rate, materially better merchant-category and liability posture:
*"we compute; the astrologer interprets and advises."*

**The single most important tax finding: our credit pack is NOT a voucher — it is an advance
for services, and GST is payable in the month we sell it.**

- Even under the old voucher rules (s.12(4)/13(4) CGST), a single-purpose self-redeemable
  credit is "identifiable at time of issue" → time of supply = date of issue.
- [Circular 243/37/2024-GST (31 Dec 2024)](https://gstcouncil.gov.in/sites/default/files/2025-01/circular-no-243-2024.pdf)
  treats voucher *transactions* as neither goods nor services, but it targets third-party
  voucher ecosystems (issuers, distributors, aggregators) — not a closed self-redeemable credit.
- The 55th GST Council recommended omitting ss.12(4), 13(4) and rule 32(6); given effect by
  Finance Act 2025. What remains is **s.13(2): time of supply = earliest of invoice date or
  receipt of payment**, and the Notification 66/2017 relief for advances covers **goods only**.

**Operationally:** sell a ₹2,000 pack on 5 August → **₹305.08 GST payable with the August
return**, even if zero reports are generated for a year. **Issue a full tax invoice at pack
sale**, not a receipt voucher — cleaner, avoids the GSTR-1 11A/11B dance, and lets a registered
pandit claim ITC immediately. Upside: **breakage is pure margin with no further GST event.**

Do **not** attempt voucher structuring to defer the tax; s.50 interest plus penalty on years of
deferred output tax massively exceeds the working-capital gain.

**Build requirements:**
- **`state` is a mandatory signup field.** Under s.12(2) IGST, place of supply is the
  recipient's GSTIN state if registered, otherwise the address on record — failing which it
  defaults to *our* location. Most Indian SaaS gets this wrong.
- Optional `gstin` field; if present, issue a B2B invoice and enable ITC.
- **E-invoicing** applies above **₹5 cr AATO** (Notification 10/2023, from 1 Aug 2023) and to
  **B2B/exports/SEZ only, not B2C.** Build the IRP integration behind a `customer.gstin != null`
  flag now; switch it on when we cross the threshold.
- Cross-border sales to NRI astrologers = export of services, zero-rated **with an LUT — get
  the LUT before the first export invoice.**
- Note OIDAR widened from 1 Oct 2023 (the "minimal human intervention" qualifier was deleted) —
  relevant to our *inbound* RCM on AWS / LLM vendors.
- Pandit's own registration threshold is ₹20 lakh (₹10 lakh special category), so most of the
  base is unregistered and cannot claim ITC. **Quote ₹2,360, not "₹2,000 + GST".**

## 2. Astrology claims — what we can and cannot print

**Astrology is legal.** *P.M. Bhargava v UGC* (SC, 5 May 2004) dismissed the challenge to UGC's
Jyotir Vigyan degrees ([Indian Kanoon](https://indiankanoon.org/doc/697794/)). Use it
defensively (payment-gateway or ad-platform appeals), never in marketing.

**ASCI** has repeatedly upheld complaints against astrology ads promising absolute outcomes
("101% solution in 5 hours", "100% solution within 2 hrs") under Code Chapters I.1 and I.5.
Current position: no absolute claims, past-performance claims must be data-substantiated,
disclaimers must be clear and visible.

### ⚠️ The sharpest specific criminal risk: Drugs and Magic Remedies Act 1954

s.2(c) defines "magic remedy" to include **talisman, mantra, kavacha**. **s.5 prohibits
advertising magic remedies** for treating/preventing the scheduled diseases. s.7: up to
6 months (1 year on repeat).

**A kundli's remedies section is exactly where this lives.** *"Wear a blue sapphire to reduce
Saturn's malefic influence"* is fine. ***"Chant this mantra to cure your child's epilepsy" is
a s.5 offence — and the pandit's logo on the PDF will not help us, because we authored the text.***

This bites us hardest in the **Health report (26 chapters)** we already have.

**Hard rule:** no remedy or prediction text may name a disease or medical condition, or claim
to cure / treat / prevent / mitigate illness. **Enforce as a CI lint over the content corpus**
with a blocklist derived from the DMR Act Schedule plus common Hindi disease terms, run on
every build. Rewrite the existing Health-report strings to the "areas of the body to care for /
consult a qualified physician" register before that SKU ships.

### Consumer Protection
CPA 2019 s.89: up to 2 years + ₹10 lakh for a false/misleading ad, 5 years + ₹50 lakh on
repeat; CCPA can fine ₹10 lakh / ₹50 lakh. The **2022 CCPA Guidelines** say a disclaimer must
not hide material information or contradict the main claim — **a 4pt grey footer is not
compliance.** The **Consumer Protection (E-Commerce) Rules 2020** apply to digital products:
**appoint and publish a grievance officer, acknowledge within 48 hours, redress within one
month.** Payment gateways check for this page during onboarding.

### The disclaimer, and the white-label twist

Incumbent pattern (AstroSage, Clickastro, Prokerala, Astrotalk) is consistent: *entertainment
purposes only · not a substitute for medical, legal, financial or psychiatric advice · no
guarantees · no liability for reliance · no refunds once generated.*

**Our twist: because the report is white-labelled, the disclaimer must survive being read by
someone who has never heard of us.** Put a **non-removable disclaimer block on every PDF, in
the report's language, that the pandit's branding controls cannot suppress.** Make it visually
designed per theme so it doesn't look like a wart — but it is not a toggle.

**⚠️ Unverified — check before marketing in those states:** whether plain astrology falls
inside the schedules of the **Maharashtra Anti-Superstition Act 2013** or the **Karnataka Act
2017**. Trimbakeshwar is in Maharashtra, so this is on the critical path for phase 1.

### Advertising platforms
Google does **not** prohibit astrology; it sits in a *sensitive category* ("Astrology &
esoteric") that publishers may block on Display/AdMob but that isn't barred on Search. The real
risk is the **Misrepresentation / Unacceptable business practices** policy — "egregious"
violations get suspension without warning and a permanent ban. Meta has no explicit astrology
prohibition; the risk is the unrealistic-outcomes line. **Advertise the B2B tool, not the
astrology, and keep two separate ad accounts.** (We plan near-zero ad spend anyway.)

## 3. Payments and RBI

**Razorpay primary.** No published astrology prohibition, and they publicly publish an
[Astrotalk case study](https://razorpay.com/case-studies/astrotalk/) — astrology is
demonstrably bankable at unicorn scale. Get their prohibited-business schedule **in writing**
from the account manager before building.

**Avoid PayU.** Their [published list](https://payu.in/BannedRestrictedCategorylist) puts
*"Fortune telling, astrology, psychic and esoteric advisory services"* at S.No.1 of the
**Cautious** list — but worse, the **Banned** list items 32 and 33 are *"Any intangible goods
or services"* and *"Software downloads."* Failover: Cashfree or Zoho Payments.

**Onboarding checklist** (most rejections in this category are for an incomplete website, not
the vertical): business PAN, CoI/deed, GSTIN, cancelled cheque, address proof, director
PAN+Aadhaar, and a **live website with linked T&C, Privacy, Refund/Cancellation, Pricing,
Contact (real address + phone) and Grievance Officer.**

### RBI PPI: our credit pack is exempt — keep it that way

[Master Direction on PPIs](https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12156)
para 2.1: Closed System PPIs are *"issued by an entity for facilitating purchase of goods and
services from that entity only and do not permit cash withdrawal"*, and their issuance is
*"not classified as a payment system requiring approval/authorisation by RBI."*

**Four non-negotiable design rules:**
1. Credits redeemable **only against our own services**.
2. **No cash withdrawal, ever.**
3. **No transfer of credits between accounts** — this doubles as our best anti-arbitrage control.
4. Refunds go back to the original instrument as a refund of the *service contract*, not as a
   redemption of stored value.

## 4. Data protection — DPDP Act 2023

We store **birth date, exact birth time, birth place, name, gender and phone of the pandit's
customers** — people who never signed up with us. That is a real obligation, not a formality.

- We are the **Data Fiduciary** for pandit accounts. For his clients' data the honest posture
  is **joint/processor with the pandit as the collecting party** — the pandit must have consent
  from his client. **Put that obligation explicitly in the pandit's T&C and make him tick it at
  signup**, and give him a one-tap consent-capture line to read to his client.
- **⚠️ Children's data (s.9) needs professional review before build.** Parents routinely
  commission a *janam kundli for a newborn* — that is processing a child's personal data,
  which requires verifiable parental consent and bans tracking/behavioural monitoring and
  targeted advertising directed at children. A "Child Kundli" SKU (AstroSage sells one at ₹499)
  is squarely in scope. Do not ship one without advice.
- Practical build requirements: purpose limitation (birth data used only to generate the
  requested report), retention limit (auto-purge report artefacts after a defined period; the
  client book is retained because it is the pandit's business record), a delete-client action
  that actually cascades, breach notification readiness, and encryption at rest.
- No selling or cross-using client birth data for anything — **and never for lead-gen back to a
  Devpunya-style B2C funnel.** That would break both the DPDP purpose limitation and the entire
  white-label trust proposition at once.

## 5. Pre-launch legal checklist

- [ ] Entity, PAN, GSTIN, current account, LUT (if any export)
- [ ] CA sign-off on GST-on-advance treatment and the invoice-at-pack-sale approach
- [ ] Razorpay approval **in writing** for the astrology/SaaS MCC
- [ ] Website pages live: T&C, Privacy, Refund/Cancellation, Pricing, Contact, **Grievance Officer**
- [ ] Non-removable PDF disclaimer block, en + hi, designed per theme
- [ ] **DMR Act content lint in CI**, with the Health report corpus rewritten and re-reviewed
- [ ] Maharashtra & Karnataka anti-superstition schedules checked (blocks Trimbakeshwar phase 1)
- [ ] Interpretation corpus registered under the Copyright Act 1957
- [ ] Swiss Ephemeris **Professional Licence** purchased (AGPL is not viable for a hosted app)
- [ ] Pandit T&C clause: he warrants he has his client's consent for the birth data
- [ ] DPDP review of the child-kundli case before that SKU exists
