# बनाना है? यह पढ़िए — step by step

**पहली बात: Nano Banana वीडियो नहीं बनाता।** वह Google का *image* model है (Nano Banana 2 /
Pro = Gemini image). वीडियो के लिए Google का model **Veo 3.1** है — वही 4, 6 या 8 सेकंड की
क्लिप बनाता है, आवाज़ के साथ।
([Nano Banana है image-only](https://gemini.google/overview/image-generation/) ·
[Veo 3.1](https://deepmind.google/models/veo/))

तो 10 सेकंड का ऐड ऐसे बनेगा:

| सेकंड | क्या | कहाँ से |
|---|---|---|
| 0–2.5 | पंडित जी और जोड़ा (असली इंसान) | **Veo** से बनवाइए |
| 2.5–7.8 | रिपोर्ट और ऐप | **असली फ़ाइलें** — पहले से बनी हैं |
| 7.8–10 | लोगो कार्ड | CapCut में टेक्स्ट |

जोड़ना **CapCut** में — मुफ़्त, फ़ोन पर चलता है, हिन्दी में है।

---

## Step 1 · Veo से पहली क्लिप बनवाइए (5 मिनट)

खोलिए **gemini.google.com** → नीचे **Video** चुनिए (Google AI Pro चाहिए)।
नीचे वाला पूरा टेक्स्ट **जैसा है वैसा paste** कर दीजिए:

```
A medium shot from behind an older Indian astrologer's shoulder. He slides a
plain white stapled printout across a polished wooden desk toward a young Indian
couple sitting opposite. They glance down at the paper, then at each other —
polite, unmoved, a small forced smile. Soft afternoon daylight from a window on
the left. Documentary style, handheld, shallow depth of field, muted natural
colours, 35mm. The paper is completely blank and out of focus — no text or
writing visible anywhere in the frame. No on-screen text. No subtitles.
Vertical 9:16 aspect ratio. 4 seconds. Ambient room tone only, no music, no
dialogue.
```

फिर **Download** दबाइए। बस।

> **"no text visible" क्यों लिखा है:** AI हिन्दी लिखने की कोशिश करेगा और बकवास अक्षर बनाएगा।
> आपके ग्राहक रोज़ देवनागरी पढ़ते हैं — वे तुरंत पकड़ लेंगे। इसलिए काग़ज़ खाली ही रहना चाहिए।

**अगर जोड़े का चेहरा बुरा लगे** (कुछ पंडित जी को लग सकता है कि उनका मज़ाक है), तो इसकी जगह
यह paste कीजिए:

```
Extreme close-up, shallow depth of field. The weathered hands of an Indian man
in his sixties writing in a cloth-bound ledger with a fountain pen. Warm
tungsten lamp on a wooden desk at night, a brass oil lamp glowing out of focus
in the background. Very slow push-in. Cinematic, 35mm, warm amber colour grade,
soft film grain. No text or writing legible. No on-screen text. Vertical 9:16
aspect ratio. 4 seconds. Ambient room tone only.
```

---

## Step 2 · असली फ़ाइलें तैयार कीजिए (2 मिनट)

ये पहले से बनी रखी हैं, कुछ बनाना नहीं:

```
pothi/ads/assets/heritage.png     ← मुख्य कवर
pothi/ads/assets/classic.png
pothi/ads/assets/editorial.png
```

और ऐप की एक छोटी रिकॉर्डिंग चाहिए:

1. `localhost:5180` खोलिए
2. फ़ोन साइज़ में रखिए (Chrome → F12 → फ़ोन आइकॉन → iPhone 14 Pro Max)
3. स्क्रीन रिकॉर्ड चालू कीजिए (Mac: `Cmd+Shift+5`)
4. **New Report → विवरण भरिए → Heritage चुनिए → Generate** दबाइए → रिपोर्ट खुले → **WhatsApp** बटन दिखाइए
5. रिकॉर्डिंग बंद

---

## Step 3 · CapCut में जोड़िए (15 मिनट)

नया project → **9:16** चुनिए।

| क्रम | क्या डालें | कितनी देर | क्या करें |
|---|---|---|---|
| 1 | Veo वाली क्लिप | 2.5s | कुछ नहीं |
| 2 | `heritage.png` | 3.0s | *Zoom in* चुनिए — धीरे-धीरे नाम पर आए |
| 3 | तीनों कवर | 1.0s | तीनों को अगल-बगल, हल्का slide |
| 4 | स्क्रीन रिकॉर्डिंग | 1.3s | **Speed 3x** कर दीजिए |
| 5 | काली स्क्रीन + टेक्स्ट | 2.2s | नीचे देखिए |

**आख़िरी कार्ड पर लिखिए:**
```
पोथी
WhatsApp पर बात करें
POTHI10
```
रंग: काला `#0B0A08`, सुनहरा `#E8CE92`

---

## Step 4 · आवाज़ (5 मिनट)

**सबसे आसान:** खुद बोलकर रिकॉर्ड कीजिए। असली आवाज़ AI से बेहतर लगती है।
CapCut में माइक बटन दबाइए और यह पढ़िए — धीरे, रुक-रुक कर:

| कब | क्या बोलें |
|---|---|
| 0.3s | मेहनत आपकी। नाम किसी और का। |
| 3.0s | *(एक पूरी साँस रुकिए)* पोथी हर पन्ने पर आपका नाम छापता है। |
| 6.0s | बीस सेकंड में तैयार। |
| 8.2s | दस ज्योतिषियों को आमंत्रण। |

कुल 22 शब्द। **इससे ज़्यादा मत बोलिए** — 10 सेकंड में जगह नहीं है।

**संगीत:** CapCut → Audio → कोई शांत सितार/संतूर। आवाज़ 100%, संगीत 15%।

---

## Step 5 · सबटाइटल (ज़रूरी)

CapCut → **Captions → Auto captions → हिन्दी**।
ज़्यादातर लोग बिना आवाज़ के देखते हैं। सबटाइटल के बिना आधा ऐड बेकार है।

आख़िरी 1.5 सेकंड पर छोटा टेक्स्ट रखिए:
> दाम आप तय करें। रिपोर्ट मार्गदर्शन हेतु हैं।

---

## अगर बिल्कुल भी समय न हो

Veo वाली क्लिप छोड़ दीजिए। सिर्फ़ ये करिए:

1. `heritage.png` — 3s, zoom in
2. स्क्रीन रिकॉर्डिंग — 4s, 3x speed
3. लोगो कार्ड — 3s

10 सेकंड, कोई AI नहीं, सब असली। यह भी चलेगा — शायद बेहतर ही चले, क्योंकि इसमें एक भी
नक़ली फ़्रेम नहीं है।

---

## ये गलतियाँ मत कीजिए

- **AI से रिपोर्ट मत बनवाइए।** वह नक़ली देवनागरी बनाएगा। पूरा ऐड झूठा लगेगा।
- **"मुफ़्त" मत लिखिए।** दस रिपोर्ट की बात WhatsApp पर बताइए, ऐड में नहीं।
- **कमाई का आँकड़ा मत दिखाइए।** "₹50,000 कमाएँ" जैसी लाइन पर ASCI कार्रवाई करता है।
- **"100%" या "गारंटी" मत लिखिए।**
- **किसी बीमारी का नाम मत लीजिए** — यह क़ानूनन अपराध है (DMR Act 1954)।
