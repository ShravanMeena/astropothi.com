import { track } from "../lib/track";
import { useLang } from "../lib/lang";

/**
 * Dosh-only conversion sections, matched to the Meta ad — bilingual.
 *
 * The ad opens on a specific question — "someone said you have a dosh, but do
 * you really?" — and the generic hero broke that thread. These sections carry
 * it: what happens, what you learn, and who it is for. Rendered only for dosh;
 * every other report keeps the page unchanged.
 *
 * Both languages, switched by the site toggle. No outcome claims (no "your
 * marriage will happen", no cure) — only what the report checks and explains,
 * which is what keeps it honest and ad-policy-safe.
 */
type Pair = { hi: string; en: string };
const T = {
  howEyebrow:   { hi: "कैसे काम करता है", en: "How it works" },
  steps: [
    { n: "01", t: { hi: "जन्म विवरण डालें", en: "Enter birth details" },        s: { hi: "तारीख़, समय और जगह — बस इतना।", en: "Date, time and place — that is all." } },
    { n: "02", t: { hi: "14 दोष जाँचे जाते हैं", en: "14 doshas are checked" },   s: { hi: "आपकी अपनी कुंडली पर, एक-एक करके।", en: "Against your own chart, one by one." } },
    { n: "03", t: { hi: "अपनी रिपोर्ट पाएँ", en: "Get your report" },            s: { hi: "व्यक्तिगत रिपोर्ट, हिन्दी और English में।", en: "A personalised report, in Hindi or English." } },
  ] as { n: string; t: Pair; s: Pair }[],
  howFootA:     { hi: "लगभग 1 मिनट · ", en: "About 1 minute · " },
  howFootB:     { hi: " · कोई Subscription नहीं", en: " · No subscription" },

  getEyebrow:   { hi: "आपको रिपोर्ट में क्या पता चलेगा?", en: "What you actually learn" },
  getTitle:     { hi: "हर दोष — है, नहीं, या प्रभाव कम।", en: "Each dosh — present, absent, or reduced." },
  getBody:      { hi: "उद्देश्य दोष ढूँढना नहीं — आपकी कुंडली की स्थिति साफ़-साफ़ बताना है। जहाँ कोई योग दोष को कम या निष्प्रभावी करता है, वह भी लिखा जाता है।",
                  en: "The point is not to find a dosh — it is to state your chart clearly. Where a yoga reduces or cancels a dosh, that is written too." },
  doshas: [
    { t: { hi: "मांगलिक दोष", en: "Manglik Dosh" },       s: { hi: "क्या है, नहीं है, या उसका प्रभाव कम/निष्प्रभावी है?", en: "Present, absent, or reduced/cancelled?" } },
    { t: { hi: "काल सर्प दोष", en: "Kaal Sarp Dosh" },     s: { hi: "क्या वास्तव में आपकी कुंडली में लागू होता है?", en: "Does it actually apply in your chart?" } },
    { t: { hi: "पितृ दोष", en: "Pitra Dosh" },             s: { hi: "क्या संकेत हैं, और उसका वास्तविक विश्लेषण।", en: "The indications, and the real analysis." } },
    { t: { hi: "गुरु चांडाल दोष", en: "Guru Chandal Dosh" }, s: { hi: "स्थिति, प्रभाव और व्यक्तिगत विश्लेषण।", en: "Placement, effect and personal analysis." } },
  ] as { t: Pair; s: Pair }[],
  getFootA:     { hi: "इनके अलावा श्रापित, अंगारक, ग्रहण, विष योग और बाक़ी — कुल ", en: "Plus Shrapit, Angarak, Grahan, Vish Yoga and the rest — " },
  getFootStrong:{ hi: "14 प्रमुख दोष", en: "14 major doshas" },
  getFootB:     { hi: " आपकी अपनी कुंडली पर जाँचे जाते हैं।", en: " checked against your own chart." },

  forEyebrow:   { hi: "यह रिपोर्ट आपके लिए है अगर…", en: "This report is for you if…" },
  forList: [
    { hi: "किसी ने कहा है कि आपकी कुंडली में दोष है", en: "someone has told you your chart has a dosh" },
    { hi: "आपको मांगलिक या काल सर्प दोष बताया गया है", en: "you have been told you are Manglik or have Kaal Sarp" },
    { hi: "शादी में देरी के कारण अपनी कुंडली बेहतर समझना चाहते हैं", en: "a delay in marriage has you wanting to understand your chart" },
    { hi: "पूजा या उपाय पर पैसा ख़र्च करने से पहले ख़ुद जाँचना चाहते हैं", en: "you want to check for yourself before spending on remedies" },
    { hi: "अलग-अलग ज्योतिषियों से अलग-अलग जवाब मिले हैं", en: "different astrologers have given you different answers" },
    { hi: "डर के बजाय स्पष्ट जानकारी चाहते हैं", en: "you want clear information, not fear" },
  ] as Pair[],
  cta:          { hi: "मेरी कुंडली जांचें", en: "Check my chart" },
  refund:       { hi: "कोई Subscription नहीं · 1 मिनट में रिपोर्ट · 100% Money Back", en: "No subscription · Report in 1 minute · 100% money-back" },
};

export default function DoshCRO({ onBuy, price }: { onBuy: () => void; price: string }) {
  const [lang] = useLang();
  const L = lang === "hi" ? "hi" : "en";
  const deva = L === "hi" ? "deva" : "";
  const buy = () => { track("buy_clicked", { code: "dosh", from: "dosh_cro" }); onBuy(); };

  return (
    <>
      {/* ── How it works — 3 steps ───────────────────────────────────────── */}
      <section className="border-y border-line bg-sunken/40">
        <div className="shell py-8 sm:py-14">
          <p className={`caps text-brass text-center ${deva}`}>{T.howEyebrow[L]}</p>
          <div className="mt-6 sm:mt-9 grid gap-5 sm:gap-6 sm:grid-cols-3">
            {T.steps.map((st) => (
              <div key={st.n} className="flex gap-4 sm:block sm:text-center">
                <span className="font-serif text-brass text-[26px] sm:text-[34px] leading-none shrink-0 sm:block sm:mb-3 tabular-nums">{st.n}</span>
                <span>
                  <span className={`block text-[16px] sm:text-[18px] font-medium leading-snug ${deva}`}>{st.t[L]}</span>
                  <span className={`block text-[13px] sm:text-[14px] text-muted mt-1 leading-snug ${deva}`}>{st.s[L]}</span>
                </span>
              </div>
            ))}
          </div>
          <p className={`mt-7 sm:mt-9 text-center text-[13px] sm:text-[14px] text-faint ${deva}`}>{T.howFootA[L]}{price}{T.howFootB[L]}</p>
        </div>
      </section>

      {/* ── What you actually get ────────────────────────────────────────── */}
      <section className="shell py-9 sm:py-16">
        <div className="max-w-prose2">
          <p className={`caps text-brass ${deva}`}>{T.getEyebrow[L]}</p>
          <h2 className={`display text-[22px] sm:text-[34px] mt-2 leading-tight ${deva}`}>{T.getTitle[L]}</h2>
          <p className={`mt-3 text-[14px] sm:text-[16px] text-muted leading-relaxed ${deva}`}>{T.getBody[L]}</p>
        </div>
        <div className="mt-6 sm:mt-10 grid gap-3 sm:gap-4 sm:grid-cols-2">
          {T.doshas.map((d) => (
            <div key={d.t.en} className="card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid place-items-center w-7 h-7 rounded-full bg-brassSoft/50 dark:bg-brass/15 shrink-0">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-brass" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>
                  <span className={`block text-[16px] sm:text-[17px] font-semibold ${deva}`}>{d.t[L]}</span>
                  <span className={`block text-[13px] sm:text-[14px] text-muted mt-1 leading-snug ${deva}`}>{d.s[L]}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className={`mt-4 text-[13px] sm:text-[14px] text-faint ${deva}`}>
          {T.getFootA[L]}<strong className="text-fg">{T.getFootStrong[L]}</strong>{T.getFootB[L]}
        </p>
      </section>

      {/* ── This report is for you if... ─────────────────────────────────── */}
      <section className="border-t border-line bg-sunken/40">
        <div className="shell py-9 sm:py-16 max-w-prose2">
          <p className={`caps text-brass ${deva}`}>{T.forEyebrow[L]}</p>
          <ul className="mt-5 sm:mt-7 space-y-3">
            {T.forList.map((line) => (
              <li key={line.en} className="flex gap-3">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-brass shrink-0 mt-[3px]" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                <span className={`text-[15px] sm:text-[16px] leading-snug ${deva}`}>{line[L]}</span>
              </li>
            ))}
          </ul>
          <button className={`btn-brass h-[52px] px-7 mt-8 text-[15px] sm:text-[16px] ${deva}`} onClick={buy}>{T.cta[L]} — {price}</button>
          <p className={`mt-3 text-[13px] text-brass ${deva}`}>{T.refund[L]}</p>
        </div>
      </section>
    </>
  );
}
