# Video ad — script, prompts and shot list

For **Veo 3.1** — Google's video model, 4/6/8-second clips with audio.

> **Nano Banana does not make video.** Nano Banana / Nano Banana 2 / Pro are Google's *image*
> models. Handing this script to Nano Banana gets you stills, not an ad.
> ([image-only](https://gemini.google/overview/image-generation/) · [Veo 3.1](https://deepmind.google/models/veo/))
>
> **New to this? Read [HOW-TO-MAKE-THE-VIDEO.md](HOW-TO-MAKE-THE-VIDEO.md) instead** — same ad,
> written as steps in Hindi with paste-ready prompts. This file is the reference.

> ## Read this before you generate anything
>
> **Never let the AI generate the report or the app.** Ask Veo for "a Hindi kundli report"
> and it will produce convincing-looking Devanagari that is actually gibberish, a fake app UI,
> and invented astrology. On a product whose entire promise is *"this is really your name on
> a real report"*, a fabricated product shot is the one lie that would matter — and the
> audience is people who read Devanagari for a living. They will notice.
>
> **So: AI generates the human and the room. The product shots are real files.**
> `assets/heritage.png`, `classic.png`, `editorial.png` are rendered by the live engine, and
> a short screen recording of the app at `localhost:5180` covers the rest.

---

## The cut — 10 seconds

Vertical 9:16. Hindi voiceover, male, warm, unhurried — a person talking, not an announcer.
Subtitles burned in; most Reels play silent.

| # | Time | Shot | On screen | Voiceover |
|---|---|---|---|---|
| 1 | 0.0–2.5 | **AI** — a plain stapled printout slid across a desk; a young couple glance at it, politely unmoved | *…नाम किसी और का* | मेहनत आपकी। नाम किसी और का। |
| 2 | 2.5–5.5 | **REAL** — `assets/heritage.png`, slow push-in settling on *पं. रमेश चंद्र शास्त्री* | **हर पन्ने पर आपका नाम** | पोथी हर पन्ने पर आपका नाम छापता है। |
| 3 | 5.5–7.8 | **REAL** — three covers fan in, cut to screen recording: Generate → PDF → WhatsApp | *तीन डिज़ाइन · 20 सेकंड* | बीस सेकंड में तैयार। |
| 4 | 7.8–10.0 | Logo card, black-gold | **पोथी** · WhatsApp पर बात करें · **POTHI10** | दस ज्योतिषियों को आमंत्रण। |

**22 words of voiceover.** At 3.2 words/second that is 6.9 seconds of speech inside 10 —
the remaining 3.1s are pauses, and they are what make it feel unhurried rather than crammed.
The first draft ran 29 words: 9.1s of talking, wall to wall. Adding a line back is the usual
way a 10-second ad gets ruined.

*"मेहनत आपकी। नाम किसी और का।"* replaced a longer opening because the parallel is doing the
work — and shot 3's on-screen text already says तीन डिज़ाइन, so the voice does not need to.

**Closing frame, held to the last frame:**
> दाम आप तय करें। रिपोर्ट मार्गदर्शन हेतु हैं।

### What ten seconds costs you

The three-shot opening — the pandit working late, the handover, the flat reaction — does not
fit. That narrative earned the line *"उस पर नाम किसी और का"*; at 10 seconds the line has to
carry itself, so shot 1 compresses the whole setup into one image and the words do the rest.

If a 10s cut tests well and you want to warm a colder audience, the same script extends to 30
by restoring that open and adding a page-turn through the inner pages. Ask and I will write it.

---

## Veo prompts

One AI shot in the 10s cut, plus an alternate opening. Keep them to people, hands and rooms —
no text, no screens, no paper the camera can read.

**Shot 1 — the handover** *(the one the cut uses)*
```
Medium shot from behind an older Indian astrologer's shoulder as he slides a
plain white stapled printout across a wooden desk toward a young Indian couple.
They glance down at it, then at each other — polite, unmoved. Soft daylight from
a window, documentary feel, muted colours, handheld, shallow depth of field.
The paper is blank and out of focus, no text legible. Vertical 9:16, 3 seconds.
```

**Alternate opening — the work** *(swap in if the couple's reaction reads as insulting
to the very people you are selling to)*
```
Close-up, shallow depth of field. The weathered hands of an Indian man in his
sixties writing in a cloth-bound ledger with a fountain pen. Warm tungsten lamp
on a wooden desk at night, a brass lamp glowing out of focus behind. Slow
push-in. Cinematic, 35mm, warm amber grade, film grain. No text visible.
Vertical 9:16, 3 seconds.
```
With this opening the first line becomes *"आप घंटों मेहनत करते हैं। नाम किसी और का।"*
(8 words — 24 total, still inside budget.)

> "No text visible / not legible" in every prompt is deliberate. It stops the model
> inventing Devanagari, and it keeps the plain paper genuinely plain — which is the
> contrast the ad turns on.

---

## Producing the REAL shots (4–7)

| Shot | How |
|---|---|
| 2 | `ads/assets/heritage.png` — 150 dpi. Slow Ken Burns push-in, 3s, landing on the pandit's name |
| 3 | Two beats in 2.3s: the three covers fanning in (~1s), then a screen recording of `localhost:5180` — Generate → the animation → PDF → WhatsApp — recorded at 1080×1920 and sped to 3× |
| 4 | Black `#0B0A08`, gold `#E8CE92`, Fraunces + Noto Sans Devanagari — matches `ad.css` |

---

## Voiceover direction

- **Male, 40s–50s, north Indian Hindi.** Not a radio voice. The tone is one professional
  talking to another, slightly confiding.
- **Pace 3.2 words/second.** The script is 22 words for 10 seconds; do not add more.
- Pause a full beat before *"पोथी हर पन्ने पर आपका नाम छापता है।"* — that line is the ad.
- Music: single tanpura drone or soft santoor, no percussion, ducked under the VO.
- **Subtitles burned in.** Most Reels play silent.

---

## What the script deliberately does not say

- No **"मुफ़्त"** anywhere. The scarcity is the invitation, not a giveaway — see `META-ADS.md`.
- No earnings figure in the video. *"दाम आप तय करें"* puts the number on him, which is both
  true and outside ASCI's line on outcome claims.
- No **"100%"**, no **"गारंटी"**, no disease or cure — DMR Act 1954 s.5 is criminal, not just
  an ad rejection. See `../docs/05-legal.md`.
- No claim the software interprets the chart. *"पढ़ना और सलाह देना आपका काम"* is the honest
  division and it also answers the objection pandits actually raise: *does this replace me?*
