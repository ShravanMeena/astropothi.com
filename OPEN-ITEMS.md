# Open items

## SHIPPED — 30. Premium rebuild: theming, motion, the book that opens

- **Dark and light**, following the device by default (`prefers-color-scheme`) with an
  explicit three-way toggle that persists. One set of semantic tokens — `surface`, `fg`,
  `brass`, `line` — so every component serves both. Painted before React mounts, so no flash.
  Dark is a lamplit manuscript, not a generic slate.
- **Framer Motion.** The signature piece is a scroll-driven **pothi that opens**: a 220vh
  track pins the hero, the front cover swings on its spine 0° → 168° in 3D, and a real
  rendered spread is revealed behind it. Every page shown is engine output.
- **`Reveal`** brings sections in as they enter view, once, with `useReducedMotion` respected
  throughout (the hero falls back to a static two-column layout).

### The typecheck was checking nothing — all session

`npm run typecheck` ran `tsc -p tsconfig.json`, and the Vite template's root tsconfig is
`{ "files": [], "references": [...] }`. **Zero source files were type-checked.** Every
"tsc clean" reported for this app was meaningless. Pointed at `tsconfig.app.json`; it
immediately found three real defects that had been invisible:

1. `i18n.ts` used `as const`, narrowing every string to a literal, so the Hindi table was not
   assignable to the English shape and the context type was broken.
2. `ReportPage` computed a corrected page count and never used it — the page still printed the
   stale `approx_pages`, so Heritage showed Classic's length.
3. Dead code in `Library.tsx`.

### `overflow-x: hidden` silently killed every sticky

The book hero would not pin. Cause: `html, body { overflow-x: hidden }` makes the root a
scroll container, which disables `position: sticky` everywhere. I had added that rule to fix
a mobile overflow that **did not exist** — it was a headless-Chrome screenshot artifact.
Changed to `overflow-x: clip`, which contains overflow without creating the container.

### The animation was hiding the pitch
The first cut faded the headline in only after scrolling, so anyone arriving from an ad landed
on a wordless page. The copy is now visible in the first frame and merely lifts as the book
opens. Motion decorates the message; it never withholds it.


## CORRECTED — 29. Real pages instead of a modal

You were right on all three counts: the report cards did not read as clickable, a modal is
not how a ₹699 product gets sold, and there was nowhere to actually learn what is in a report.

Rebuilt as real pages with real URLs — shareable, refreshable, back-button-able:

| Path | Page |
|---|---|
| `/` | Storefront |
| `/report/:code` | **What is inside** — real chapter list, sample pages, design picker, price |
| `/buy/:code` | Checkout on its own page, with the generation sequence |
| `/order/:publicId` | The finished report, permanently at that link |
| `/astrologers` | Console |

**The detail page prints the actual table of contents.** `GET /shop/report/:code` renders the
report once per (type, language), caches it, and returns every chapter title and subtitle —
so "All 64 chapters" is the real list, not marketing copy. Page count follows the design on
screen (love: 11 pages classic, 31 heritage), and the sample images are that exact
design rendered live.

Cards now say **"See what's inside →"** with hover lift and an arrow that travels.

### Bug caught while building: the storefront sample wore a pandit's name
`getPreview` had one hardcoded `DEMO_BRANDING` — *Pt. Ramesh Chandra Shastri*. Correct for the
console, wrong for a shopper, who saw a stranger's name on the product shot. Previews are now
imprint-aware (`pandit` | `house`), cached separately, and two new tests assert the storefront
sample carries the house brand and zero pandit references. **13 shop tests, all green.**

Verified end to end in a browser: order `AU5QWA1K`, Premium Kundali, heritage/gold, **87
pages**, invoice `POT-C-2026-00012`.


## CORRECTED — 28. Two apps merged into one site

I built the storefront as a second application (`pothi-shop` on :5190) alongside the console
(`pothi-web` on :5180). That was wrong — you asked for **one site** with a door to the
dashboard, not two.

Merged into **`pothi-app`**: `/` is the storefront, `/astrologers` is the console. One brand,
one palette, one deploy. `pothi-web` deleted.

The merge had real conflicts, not just file moves:
- **Eight component classes collided** with different definitions (`btn`, `card`, `field`,
  `eyebrow`, `shell`…), and the two apps had different `ink` and `brass` scales. Resolved by
  unifying on the storefront's system and rewriting the console's classes to match — so the
  two halves now read as one product rather than two stapled together.
- **Two brand names on one site.** The consumer side said Janampatri, the console said Pothi.
  With one public site the white-label separation argument no longer applies, so both are
  Pothi. The report imprint stays configurable via `CONSUMER_BRAND_NAME`.
- **A test hardcoded the old brand** and failed on the rename. It now reads the brand from
  `/shop/brand`, so renaming cannot break the test that proves branding is applied.


## SHIPPED — 27. Consumer storefront (Janampatri)

`pothi-shop` on **:5190** — landing page plus a no-account checkout, live against the same
engine. Verified end to end in a browser: order `YKMRKB5L`, Premium Kundali, heritage/gold,
₹699, **86 pages**, invoice `POT-C-2026-00004`.

- Landing: hero, seven reports, how it works, three designs, FAQ, footer
- Checkout: details → design → pay → PDF, no signup anywhere
- Astrologers reach Pothi through one quiet link in the nav and footer. The pandit motion is
  sales-led; **no ads point at it**

### The sample covers were carrying a pandit's name
The storefront reused `ads/assets/*.png`, which are branded *पं. रमेश चंद्र शास्त्री* for the
B2B creatives. A consumer landing page was showing a stranger's name on its own product shot.
Re-rendered with house branding — 0 pandit references, 93 brand references in the heritage cover.

### Two tooling traps worth recording
- **Headless Chrome `--window-size=390` lays out wider and crops**, which made the mobile
  landing page look badly broken. Measuring in-page gave `scrollWidth 390`, zero overflowing
  elements — the layout was correct all along.
- **Playwright's viewport is stuck at 2×** in this session. Requesting 195×422 yields a true
  390 CSS viewport, which is how the measurement above was taken. Screenshots from either tool
  need a sanity check before believing a layout bug.


## RESOLVED — 26. Pilot seats leaked; found by looping the suite

A single green run proves nothing about stability. Running `npm test` eight times in a row
(`npm run test:loop`) went **green ×5, then red ×3** — and the cause was two separate bugs.

### Product bug: a deleted pandit kept his seat forever
`status()` counts seats with the Sequelize ORM, which is paranoid-aware and skips
soft-deleted rows. `claimSeat()` counted with raw SQL that did **not**:

```sql
SELECT COUNT(*) FROM pandits WHERE pilot_seat IS NOT NULL   -- includes deleted
```

So the two disagreed. Remove a pandit and the login screen advertises a free place while
signup rejects everyone — and with only ten seats the pilot bricks itself silently. Fixed by
adding `AND "deletedAt" IS NULL`, verified: soft-delete a pandit and the next signup reclaims
his seat number.

### Test bug: the cleanup never ran
`scripts/test_pilot.sh` released its throwaway account with mangled quoting that produced
`phone = '"9123456789"'` — literal double quotes inside the string, matching nothing, with
the error swallowed by `2>&1`. **Every test run permanently consumed one of the ten real
pilot seats** until all were gone, which is what turned run 6 red. It now checks for
`DELETE 1` and complains if the release fails.

`scripts/loop_check.sh N` runs the suite N times, reports any differing run, and fingerprints
the numeric output so non-determinism shows even among green runs.


## AUDITED — 25. Report data and quality, before real users arrive

Three new audits, all wired into `npm test`.

### Chart maths: 480 invariants, 0 broken (`npm run audit:astro`)
Eight charts across 1958–2024 including a leap day and a year boundary, checking the things
a pandit verifies against his own software in the first minute:

- Sun and Moon never retrograde; Rahu–Ketu exactly 180° apart, both retrograde, never in one sign
- Every planet in a real sign, house 1–12, degree 0–30
- Twelve houses, twelve distinct signs, zodiacal order, house 1 = the ascendant
- Nine mahadashas, no repeats, **totalling exactly 120 years**, each period at its classical
  length within a day, chronological, and the cycle straddles the birth date
- Sarvashtakavarga totals 337; tithi within 1–30

**The engine is sound.** This closes the "is the data real" question at the arithmetic level.

### Text quality (`npm run audit:text`)
Fixed:
- **Placeholder leaks** — an empty `${cond ? "…" : ""}` slot left a double space mid-sentence
  (`"…here.  1 of nine planets…"`). Fixed globally with a normaliser in `doc-model.js` rather
  than at one site, since the pattern recurs across a 130 KB corpus.
- **A definition printed twelve times** — *"A divisional chart never replaces the birth
  chart"* appeared in every varga chapter. Now once.

### The real remaining gap: Love and Health are thin

Median words per chapter:

| Report | Median | Static across 8 charts |
|---|---|---|
| kundli | 245 | 18% |
| laalkitab | 210 | 23% |
| dosh | 160 | 42% |
| varshaphal | 139 | 13% |
| horoscope | 136 | 23% |
| **health** | **56** | **49%** |
| **love** | **44** | **40%** |

The two thinnest reports are the two most generic — 12 of Love's 24 chapters are under 45
words. At ₹300 that is a pamphlet. **This is the content work worth doing**, and the other
five reports do not need it.

Both audits now ratchet: depth may not fall, placeholder leaks may not appear.

### A caution about these audits
Four findings in this pass were **my tooling, not the product**: a wrong field name
(`fullDegree` vs `longitude`) reported the nodes as 0° apart; another (`lord` vs `mahaDasha`)
reported dashas totalling 0 years; a grep matched prose instead of a label; and joining
prose with bullets invented run-on sentences that do not exist on the page. Verify against
the rendered PDF before believing an audit.


## SHIPPED — 24. Invite-only free pilot (pricing switched off)

Ten seats, ten free reports each, nothing for sale. Built as a **mode**, not a hack:
`PILOT_MODE=false` restores the paid credit packs unchanged, and the payment flow beneath
stays tested (`npm run test:credits` still passes).

- **Flat 1 credit per report while the pilot runs**, so "10 free reports" is literally ten —
  not "10 credits, which is two Premium Kundalis at 5 each".
- **Invite gate on signup.** New phone needs `PILOT_INVITE_CODE` (default `POTHI10`);
  returning pandits sign in normally. Seat allocation is serialised in a transaction so two
  people cannot both take seat 10.
- **Credits tab hidden**, "Add credits" replaced by "New Report", balance relabelled
  "free reports left", seats-remaining shown on the login screen.
- Free reports are granted on **completing the branding profile**, not on signup — an
  activation cost against code-sharing. Idempotent via `trial_granted_at`.

Guarded by `npm run test:pilot` (7 assertions), wired into `npm test`.

### Bug the test found: a failed invite burned the OTP
The OTP session was marked `completed` before the invite check ran, so one mistyped code
forced the pandit to request a brand-new OTP. The OTP is now consumed only after the invite
and seat checks pass.

**To invite someone:** send them the code `POTHI10`. Change it with `PILOT_INVITE_CODE`,
seat count with `PILOT_SEATS`, allowance with `PILOT_REPORTS`.


## RESOLVED — 23. The dashboard was not finished

Audited every route against what the client actually calls. Seven endpoints existed with no
UI at all, and one of them broke the dashboard's headline number.

- **He could not set his selling prices.** `PUT/GET /earnings/prices` existed, no screen did.
  The dashboard says "estimated from prices you set" — and any report type he had not priced
  silently counted as **₹0**. That is why Varshaphal showed ₹0 on your dashboard.
  Added a prices modal reachable from the earnings card, plus a red chip naming exactly how
  many types are unpriced instead of hiding the shortfall.
- **Client book (vahi) had no screen** — 5 clients were stored and unreachable. Added as a
  tab inside Library (keeps the nav at 5 items, which matters on mobile), with the
  **birthday panel** that drives the Varshaphal re-order.
- **Credit ledger and invoices had no screen.** Added to Billing.

Client now calls 18 endpoints, up from 14.

### Bug found while testing: a price could never be removed
Clearing the field did nothing. The client dropped empty entries before sending, and the
server only ever upserted. Now the client sends every type and the server deletes on a zero.

That fix had a second defect behind it: `PanditPrice` inherits `paranoid: true`, so
`destroy()` soft-deleted and left the row occupying the `(pandit_id, report_type)` unique
index — a latent conflict for the upsert branch. Switched to `force: true`. Verified the
full set → clear → re-set cycle leaves no orphan rows.


## MEASURED — 21. How much of a report is real data?

You asked to be sure everything is based on real data. I measured it rather than assert it:
render each report for **eight very different birth charts** and count sentences that come
out byte-identical across all eight. (Two charts is not enough — a template branch both
charts happen to take looks identical but is data-driven.)

| Report | Sentences | Static across all 8 |
|---|---|---|
| varshaphal | 423 | **13%** |
| kundli | 856 | **18%** |
| horoscope | 246 | 23% |
| laalkitab | 341 | 23% |
| love | 86 | **40%** |
| dosh | 322 | **42%** |
| health | 136 | **49%** |

**Verdict: the reports are genuinely chart-driven, but not uniformly.** Sample lines from a
real chapter — *"Your 2nd house is Gemini… its lord Mercury is debilitated in house 11, and
the house holds 32 bindus, rank 3 of 12"* — are computed per chart.

Much of the static remainder is **legitimate teaching**: *"Sun governs soul, father,
authority and confidence"* or *"the 7th house is the house of marriage"* are definitions and
should read the same for everyone. The genuine problem is **health (49%), dosh (42%) and
love (40%)** — over a third of those reports is the same for every client, and they are also
the shortest reports, so the ratio is felt.

Guarded by `npm run audit:data`, wired into `npm test` as a **ratchet** at today's values +1:
the build fails if static content grows. Lower the ceilings as the corpus improves.

## REVERTED — 22. Per-chapter placement strip (my mistake)

The engine attaches a `placements` array to ~160 sections and the renderer drew none of it,
which looked like discarded chart data. I rendered it as an "In your chart" strip — and it
made the report worse:

```
Sun — Full Reading
Pisces 3°05', house 11            ← subtitle
IN YOUR CHART  Sun  Pisces · house 11 · 3°05'   ← the strip I added
IN BRIEF  Sun governs… at 3°05' of Pisces, in house 11   ← prose
```

Three copies of the same three facts, and it pushed the summary onto the next page. The
engine already expresses placements in prose; the array is a redundant structured copy, not
lost information. Reverted.


## RESOLVED — 17. Stale previews (why the old layout kept appearing)

What you were looking at was **not** the current renderer. `out/previews/` cached rendered
PNGs keyed only by `(type, design, palette, lang)` — so every renderer, design or palette
fix left every cached preview stale, and a pandit would keep seeing last week's layout
indefinitely. There was no invalidation at all.

Fixed by fingerprinting the renderer sources (`render-report.js`, `designs/`, `palettes/`,
`style.js`, `doc-model.js`) into the cache key, and sweeping directories built by an older
revision on first request. Verified: touching `style.js` moved the key from `c24e3cb6` to
`e2207658` and removed the old directory; reverting restored it.

> Same trap when checking output by hand: `verify_all.js --quick` only rebuilds the
> **saffron** palette, so other palettes in `out/matrix/` can be several fixes behind.

## RESOLVED — 18. Text sitting on the page frame
Header and footer geometry now has measured clearance, guarded by a new
`npm run test:layout` that mirrors `header()`/`footer()` and fails if either comes within
4pt of the border: classic 6/13pt, heritage 8/17pt, editorial unframed.

## RESOLVED — 19. Bullets rendered as literal "%A"
`\u25C6` is outside the built-in Times/Helvetica WinAnsi encoding, so every bullet in the
two serif designs printed as garbage. Now `\u2022`/`\u2013`. A sweep across all 392 PDFs
in `out/matrix/` reports zero encoding artefacts.

## RESOLVED — 20. Typography and layout pass
- **Sans headings on serif body** — `FT()` always returned Helvetica for Latin, so classic
  and heritage set Helvetica headings over Times body. Headings now follow the design.
- **Misaligned running head** — the body was inset by a `measure` fraction while the header,
  rule and headings stayed full width. Replaced with wider page margins and `measure: 1`, so
  the whole page block shares one left edge.
- **Doubled rules** — border top and header rule sat 6pt apart; corner brackets floated
  inside the frame. When a frame exists it *is* the rule.
- **Editorial wasted column two** — every chapter began a new page, so short chapters left
  three quarters of the sheet blank. Columns now run continuously, as a magazine does.
- **Heritage was half title leaves** — 64 chapters produced 64 near-empty leaves. Threshold
  raised from 55% to 135% of a page; kundli heritage 135 → 85 pages, nothing lost.
- Paragraph gaps tightened, drop-cap threshold raised to avoid an ugly head/tail seam.


## RESOLVED — 13. Heritage was silently destroying most of the report

The worst bug so far, and page counts hid it completely. The drop-cap branch clipped the
opening paragraph with pdfkit's `height:` option:

```js
pdf.text(rest, x, y, { height: Math.min(head, lh * indentLines) })  // everything past 2 lines: gone
```

Love and Health chapters are a **single** paragraph each, so this reduced whole chapters to
two lines. The PDF still had 55 pages and still "passed" — it was 95% empty.

**Fixed:** the head sets beside the capital, the remainder flows full width below it.
Nothing is clipped.

**Guarded:** new `npm run test:content` extracts real text with `pdftotext` and compares it
word-for-word against the engine's source sections. It requires ≥98% coverage and fails the
build otherwise. It caught a second bug immediately (a deleted `note()` helper).

## RESOLVED — 14. Heritage pages were mostly whitespace

Separate from the truncation: `chapterOpen: "titlepage"` gave every chapter its own leaf
plus a content page. With ~50-word chapters that produced page after page carrying four
lines. Now adaptive — a full title leaf only when the chapter can fill more than 55% of a
page, otherwise a decorative opener at the top of the content page. Love heritage went
55 → 31 pages, varshaphal 86 → 48, with no content lost.

While fixing it I emitted a blank sheet before every title leaf (kundli heritage ballooned
135 → 200 pages); `chapterTitlePage()` already opens its own pages.

## RESOLVED — 15. Heritage TOC overflowed the border
The two-column contents used `colX()/colW`, which are full-width in a one-column design, so
column two was drawn past the right frame. It now computes its own halves, and long titles
are truncated by measured width (pdfkit's `ellipsis` did not clip, so titles wrapped into
the next row).

## RESOLVED — 16. Footer sat on the border; viewer opened at 151%
Footer baseline moved inside the inner frame. The in-app viewer used `#view=FitH`, which
forced ~150% and clipped the page; it now opens at exactly `#zoom=100`.


## RESOLVED — 10. PDF reading experience

Looked at rendered pages at 110 dpi rather than trusting page counts, and found four real
typography faults:

- **~95 characters per line.** Comfortable reading is 65–75. Added a `measure` token per
  design (classic 0.86, heritage 0.80) that narrows and centres the body column.
- **Justified text with no hyphenation** tore rivers of white space through paragraphs —
  worst in editorial's narrow columns. Editorial is now ragged-right; only the wide
  serif designs justify.
- **Helvetica for long-form body copy.** Classic and heritage now set body in a serif,
  editorial stays sans — which also reinforces the difference between them.
- **Two identical filled boxes** stacked per chapter (summary + advisory). Advisory is now
  a quiet left-ruled italic note.

Also fixed bullet hanging indents and heading rhythm.

## RESOLVED — 11. Generation animation hung forever

The completion effect depended on `i` (the narration index), so every 1.15 s tick ran its
own cleanup and cleared the pending completion timer; a `finished` ref then blocked
rescheduling. The report generated and credits were charged, but the overlay never closed.
Fixed by holding the index, start time and callback in refs so the effect depends only on
`done`. There is now also a 6 s minimum so the moment feels substantial.

## RESOLVED — 12. PDFs opened in a new tab
`components/PdfModal.tsx` renders the PDF in-app (iframe over the browser's PDF engine, so
all pages, real scroll and zoom) with our own Download button. Wired into the create-success
screen, Library and Dashboard, and into "Open full sample" on the design step.


## RESOLVED — 1. Four report types were silently truncating

**Confirmed and fixed.** `render-horoscope-pdfkit.js` (122 lines) drew a cover plus three
summary pages and **discarded the 22-chapter `sections` array entirely** — one card even
clipped text with `ellipsis: true`. The same was true of the dosh, laalkitab and varshaphal
renderers. These are live on Devpunya today, so paying customers there are receiving 5–6
page PDFs for reports sold as 22–40 chapters.

**Fix:** replaced all five renderers with one themed renderer
(`engine/reporting/render-themed.js`) fed by a common document model
(`engine/reporting/doc-model.js`). Every report type now routes through `engine/render.js`.

| Report | Chapters | Before | After |
|---|---|---|---|
| dosh | 28 | 6 pages | 23–35 |
| horoscope | 22 | 5 pages | 15–26 |
| laalkitab | 30 | 6 pages | 20–35 |
| varshaphal | 40 | 6 pages | 22–45 |

`scripts/verify_all.js` fails the build if any report averages more than 3 sections/page.
**98/98 combinations pass** (7 types × 7 themes × 2 languages).

> **Still to decide:** whether to back-port this to Devpunya. Its customers are affected now.

## RESOLVED — 2. Generation is synchronous
Measured 0.4–3.4 s. No job table on the normal path; `report_jobs` is reserved for phase-5
bulk CSV. Plan doc updated.

## RESOLVED — 8. Design and colour are now separate axes

The old model fused layout and colour into one "theme", so picking a look also picked a
palette and vice-versa. Split into:

- **`engine/reporting/designs/`** — 3 structural designs. A design decides what pages exist,
  how a chapter opens, how many columns the body runs in, and what furniture each page carries.
- **`engine/reporting/palettes/`** — 7 colour sets. Any palette pairs with any design.

Same report, same subject, one palette:

| Report | classic | editorial | heritage |
|---|---|---|---|
| Premium Kundali | 53 pp | 69 pp | **135 pp** |
| Varshaphal | 21 pp | 44 pp | **86 pp** |
| Love | 11 pp | 29 pp | **55 pp** |

`classic` flows chapters inline with callout boxes; `editorial` is a two-column magazine
with a lede paragraph and no ornament; `heritage` gives every chapter its own title page,
adds a blessing page, drop caps, medallions and a colophon. `verify_all.js` fails if the
three designs ever produce the same page count.

## RESOLVED — 9. pdftoppm page-number padding
`pdftoppm` pads the page index to the width of the TOTAL page count, so a 135-page heritage
book wrote `p-001.png` while a 53-page classic wrote `p-01.png`. The preview service assumed
2-digit padding and silently returned zero images for any book over 99 pages. It now reads
the directory instead of guessing.

## RESOLVED — 4. Themes were colour-only; Devpunya logo leaked
- Themes now differ by **layout**: cover construction (minimal / banner / fullbleed / ornate /
  manuscript), whether each chapter opens a new page, borders, ornament, density and type
  scale. Same subject renders 45 pages in `saral` and 70 in `vivah`.
- `DEFAULT_BRANDING` no longer carries a fallback logo. A white-label product must never
  ship someone else's mark; if the pandit uploads nothing, the report carries nothing.
- Devanagari is no longer uppercased, letter-spaced, or set in Helvetica (all three produced
  garbage like `'©M˚å˚Ū$`). Font is chosen from the **content**, not the report language, so
  a Devanagari shop name renders correctly inside an English report.

---

## CLOSED — 3. Ayanamsha is fine; Swiss Ephemeris is NOT needed

I flagged `"Approx Lahiri"` as a credibility blocker for several sessions and recommended
buying the Swiss Ephemeris Professional Licence. **I was wrong — I judged it by the label,
never by measurement.**

Measured against true Lahiri (Chitrapaksha, 23°51'11.5" at J2000, precessing 50.29"/yr):

| Birth date | Engine | True Lahiri | Error |
|---|---|---|---|
| 1958-04-03 | 23°16'12" | 23°16'12" | −0.1" |
| 1973-12-05 | 23°29'20" | 23°29'20" | +0.2" |
| 1986-09-21 | 23°40'03" | 23°40'01" | +2.3" |
| 1992-03-17 | 23°44'39" | 23°44'38" | +1.6" |
| 2024-06-15 | 24°11'41" | 24°11'39" | +1.4" |

**Worst error 2.3 arcseconds.** A nakshatra pada is 12,000 arcseconds wide; a sign is
108,000. This cannot move a sign, house, nakshatra or pada. Rename the label to "Lahiri
(Chitrapaksha)" and keep `astronomy-engine`. **CHF 750 and the port are saved.**

*Caveat, honestly:* this verifies the **ayanamsha**, not planetary longitudes.
`astronomy-engine` documents ~1 arcminute planetary accuracy, which is comfortably inside
Vedic boundaries, but I have not cross-checked positions against an independent ephemeris.
Worth doing before scale — it is a test, not a purchase.

## OPEN — 5. Sign names render in English inside Hindi reports
The cover profile strip shows `Leo / Magha / Taurus` even in a Hindi report. The engine has
`translateSign` in `engine/i18n/astrology-labels.js`; the doc-model does not yet call it.
Small fix, cosmetic but visible on the cover.

## OPEN — 6. Guna Milan still missing
The highest-value SKU (₹1,500–8,000 to his client). See docs/02-product.md.

## OPEN — 7. Real payments
The gateway is a dummy sheet by design. Order creation, ledger, idempotent settlement, GST
split, invoicing and the signature-verified webhook are real; switching on Razorpay means
deleting one `if (true)` branch in `server/credits/credits.route.js`.
