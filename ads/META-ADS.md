# Running these on Meta

Nine creatives: **3 angles × 3 placements** in `out/`. The report covers are rendered by the
live engine, not mocked up.

| Angle | File stem | The pitch |
|---|---|---|
| **A · नाम** | `naam-*` | Your name on every page — his reputation, not our brand |
| **B · छपाई** | `chhapai-*` | Printing worthy of his learning — the craft |
| **C · गणना** | `ganana-*` | We calculate, you decide — the division of labour |

Placements: `1x1` feed square · `4x5` feed portrait (**start here**) · `9x16` story/reel/status.

> **No "free" anywhere.** Leading with a giveaway recruits people who never pay — Dukaan
> converted 0.06% off a free base. These sell status and craft; the invitation carries the
> scarcity. The ten free reports are a thing you tell him **in the WhatsApp conversation**,
> once he is already interested, not a thing you shout in a feed.

---

## Campaign setup

| Field | Value |
|---|---|
| Objective | **Engagement → Click to WhatsApp** (not Traffic, not Leads) |
| Destination | Your WhatsApp Business number |
| CTA button | **Send WhatsApp Message** |
| Placements | Manual: FB Feed, IG Feed, IG Stories, WhatsApp Status |
| Budget | ₹300–500/day per angle for 4–5 days, then kill two |

**Why click-to-WhatsApp and nothing else.** A user-initiated WhatsApp message opens a
24-hour window in which you can reply freely, at ₹0, with no template approval — and it *is*
a lawful opt-in. A landing page gives you none of that, and cold-messaging a scraped list
gets the number banned. See `../docs/07-outreach.md`.

**Prefilled first message** (set this in the ad):
> नमस्ते, मुझे Pothi के बारे में जानना है।

---

## Copy for Ads Manager

Meta shows ~125 characters before "…more". The first line has to carry the ad on its own.

### A · नाम — identity

**Primary text**
> जो कुंडली आप जातक के हाथ में देते हैं, उस पर नाम आपका होना चाहिए — किसी सॉफ़्टवेयर कंपनी का नहीं।
>
> Pothi हर पन्ने पर आपकी फ़ोटो, आपकी संस्था और आपका नंबर छापता है। हमारा नाम कहीं नहीं आता। 50 से 135 पन्ने, सात तरह की रिपोर्ट, तीन अलग डिज़ाइन।
>
> इस समय हम दस ज्योतिषियों को आमंत्रित कर रहे हैं।

**Headline** `हर पन्ने पर आपका नाम`  **Description** `आपकी फ़ोटो · आपकी संस्था`

### B · छपाई — craft

**Primary text**
> गणना सटीक हो और छपाई साधारण — तो जातक को आपकी मेहनत का मोल समझ नहीं आता।
>
> तीन अलग डिज़ाइन: पारंपरिक, आधुनिक और राजसी। हर एक अलग ग्रंथ जैसा — सिर्फ़ रंग नहीं, पूरी बनावट, लंबाई और सजावट अलग। और हर पन्ने पर आपका नाम।
>
> दस ज्योतिषियों को आमंत्रण।

**Headline** `छपाई ऐसी, जैसी आपकी विद्या`  **Description** `पारंपरिक · आधुनिक · राजसी`

### C · गणना — division of labour

**Primary text**
> पढ़ना और सलाह देना आपका काम है। टाइप करना हमारा।
>
> जन्म विवरण डालिए — बीस सेकंड में 50 से 135 पन्ने की वैदिक कुंडली, आपके नाम और फ़ोटो के साथ, WhatsApp पर भेजने को तैयार।
>
> दाम आप तय करें। हमारा कोई हिस्सा नहीं।

**Headline** `गणना हम करें, फ़ैसला आपका`  **Description** `20 सेकंड में तैयार`

### English variants
- **A** — `The kundali you hand over should carry your name, not a software company's.` / headline `Your name on every page`
- **B** — `Accurate calculation on ordinary paper still reads as ordinary work.` / headline `Printing worthy of your craft`
- **C** — `You do the reading. We do the typing.` / headline `We calculate, you decide`

---

## Targeting

Detailed targeting on Meta cannot find "practising astrologer" cleanly. Layer instead:

- **Interests:** Vedic astrology · Horoscope · Jyotish · AstroSage · Astrotalk · Kundli ·
  Panchang · Hindu astrology
- **Behaviour:** Small business owners · Facebook Page admins
- **Age** 24–45 (the mobile-first cohort — the 50+ desktop cohort will not switch)
- **Language** Hindi
- **Geography** start narrow: Nashik, Prayagraj, Varanasi, Jaipur, Indore, Ujjain, Haridwar.
  Tirth towns have the density; a national campaign wastes budget on consumers.

**Exclude** people interested in "free horoscope", "daily rashifal" — that is the *consumer*
audience, and they will flood you with people wanting a reading, not selling one.

---

## What not to write

From `../docs/05-legal.md`:

- **No income promises.** "₹50,000 महीना कमाएँ" is the exact shape ASCI strikes down. The
  approved line states what the market does — *"ज्योतिषी आमतौर पर ₹250–₹1,100 में देते हैं"* — and
  puts the decision on him.
- **No absolute claims.** No "100%", no "गारंटी", no "पक्का".
- **Never name a disease or a cure.** DMR Act 1954 s.5 — criminal, not just an ad rejection.
- **Advertise the tool, not astrology.** Keep this in a **separate ad account** from any
  consumer astrology spend. Google files astrology as a sensitive category and Meta polices
  unrealistic-outcome claims; one harsh review should not take down your other accounts.
- The disclaimer is baked into every creative. Leave it there.

---

## Honest expectation

Research puts paid CAC in this segment at **₹1,500–3,000**, against ₹100–600 for
list-based outreach. For **ten** pilot seats, two people walking Trimbakeshwar with a laptop
will fill them faster and teach you more than any campaign.

Run these to learn which *message* lands — then use the winner as your WhatsApp opener when
you go door to door.

**Mention the ten free reports only once he replies.** In the feed it attracts freeloaders;
in a conversation with an interested pandit it closes.

---

## Rebuilding

```bash
cd pothi/ads
python3 -m http.server 8899 &
node build.mjs                     # regenerate gen/*.html from the angle definitions
python3 - <<'PY'
import json,subprocess,os
CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
for n,w,h in json.load(open('gen/manifest.json')):
    subprocess.run([CH,'--headless','--disable-gpu','--hide-scrollbars',
      '--force-device-scale-factor=1',f'--window-size={w},{h}',
      f'--screenshot={os.getcwd()}/out/{n}.png',f'http://localhost:8899/gen/{n}.html'])
PY
```

Edit angles and copy in `build.mjs` (`ANGLES`), shared styling in `ad.css`.
