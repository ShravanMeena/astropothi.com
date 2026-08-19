# Pothi — pilot recruitment ads

Static creatives for the invite-only pilot. **The report covers are real** — rendered by the
live engine (`kundli`, Hindi, three designs), not mockups, so the ad cannot promise a look
the product does not ship.

## Files

| Size | File | Where |
|---|---|---|
| 1080×1350 | `out/pothi-1080x1350.png` | Instagram / Facebook feed — best performing |
| 1080×1080 | `out/pothi-1080x1080.png` | Square feed, WhatsApp forward |
| 1080×1920 | `out/pothi-1080x1920.png` | Story / Reel / Status |

## Rebuilding

```bash
cd pothi/ads
python3 -m http.server 8899 &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1350 \
  --screenshot="$PWD/out/pothi-1080x1350.png" http://localhost:8899/ad-1080x1350.html
```

Regenerate `assets/*.png` from the engine whenever the designs change — see the render
snippet in the session notes, or just re-run a kundli in Hindi for each design and take
page 1 at 150 dpi.

## Copy decisions

- **Headline is the product's whole point** — "हर पन्ने पर आपका नाम" (your name on every page).
  Not features, not price.
- **Scarcity is real**, not manufactured: there are genuinely 10 seats
  (`PILOT_SEATS`), and the invite code on the creative is the live one.
- **No earnings promise.** The line reads *"ज्योतिषी आमतौर पर ऐसी रिपोर्ट ₹250–₹1,100 में देते हैं।
  दाम आप तय करें"* — a statement about the market, not a claim about what he will make.
  ASCI has repeatedly upheld complaints against absolute/outcome claims in astrology ads.
- **Disclaimer on every creative**: reports are for guidance, not a substitute for medical,
  legal or financial advice. Keeps us clear of the DMR Act and CCPA guidance —
  see `../docs/05-legal.md`.
- **Hindi first.** 9 of 10 new Indian internet users are Indic-language users; the buyer
  reads Devanagari before English.

## Before you spend money on this

Two things from `../docs/07-outreach.md` that matter more than the creative:

1. **Point the CTA at click-to-WhatsApp**, not a landing page. A user-initiated WhatsApp
   message opens a 24-hour free-form window — that is both a legitimate opt-in and ₹0
   delivery cost. It converts cold outreach into inbound, legally.
2. **Advertise the B2B tool, not astrology.** Google puts astrology in a sensitive category
   and Meta polices unrealistic-outcome claims. Keep a separate ad account for this.
