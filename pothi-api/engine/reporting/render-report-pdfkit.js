import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { DEFAULT_BRANDING, loadLogoBuffer, mergeBranding } from "./branding.js";
import { t } from "../i18n/report-labels.js";
import { translateAny, translateNakshatra, translatePlanet, translateSign, translateTithi, translateNameAlphabet } from "../i18n/astrology-labels.js";
import { vargaSignIndex as classicalVargaIndex } from "../astrology/varga.js";
import {
  ASCENDANT_PROFILE_HI,
  DOSHA_NAME_HI,
  DOSHA_SEVERITY_HI,
  RADICAL_RULER_HI,
  GEM_CARD_DESC_BENEFIC_HI,
  GEM_CARD_DESC_LIFE_HI,
  GEM_CARD_DESC_LUCKY_HI,
  NUMEROLOGY_NARRATIVE_HI,
  GEM_RITUALS_HI,
  GEM_SUGGEST_INTRO_HI,
  KALSARPA_FACE_ABSENT_HI,
  KALSARPA_FACE_PRESENT_HI,
  KALSARPA_INTRO_1_HI,
  KALSARPA_INTRO_2_HI,
  MANGLIK_INTRO_1_HI,
  MANGLIK_INTRO_2_HI,
  MANGLIK_INTRO_3_HI,
  MANGLIK_REPORT_ABSENT_HI,
  MANGLIK_REPORT_PRESENT_HI,
  PLANET_GEMSTONE_HI,
  SADHESATI_INTRO_1_HI,
  SADHESATI_INTRO_2_HI,
  SHLOKA_DEHAM_ROOPAM_HI,
  SHLOKA_LAGNE_VYAYE_HI,
  SHLOKA_SHRI_GANESHAYA_HI,
  SHLOKA_SHUBH_DRIG_HI,
  SHLOKA_SUKHAM_DUHKHAM_HI,
  STONE_NAME_HI,
  gemFingerHi,
  gemMantraIntroHi,
  gemSubstituteHi,
  gemTimeToWearHi,
  gemWeightAndMetalHi
} from "../i18n/report-content-hi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Small helper — return Hindi if requested + available, else fall through.
function hi(lang) {
  return lang === "hi" || lang === "mr";
}

function translateStone(name, lang) {
  if (!name) return name ?? "";
  if (hi(lang)) return STONE_NAME_HI[name] ?? name;
  return name;
}

const GANESHA_IMAGE_PATH = path.resolve(__dirname, "../assets/ganeshji.png");
async function loadGaneshaImage() {
  try { return await readFile(GANESHA_IMAGE_PATH); } catch { return undefined; }
}

// Background image embedding is intentionally disabled. The bg.jpg asset is
// 18 MB and the pdfkit `pageAdded` hook embeds it on every one of 25 pages
// without dedup → ~466 MB PDFs. Re-introduce only with a dedup-safe path
// (e.g. doc.openImage once + reference cache) or a much smaller asset.

// ── Font registry ────────────────────────────────────────────────────────
// Helvetica has no Devanagari glyphs, so when the report language is Hindi
// or Marathi (both Devanagari scripts) we fall back to Noto Sans Devanagari
// for any text that might contain those scripts. Bengali/Tamil/Telugu/Kannada
// are out of scope for now — add their TTFs the same way when needed.
const DEVA_REGULAR_PATH = path.resolve(__dirname, "../assets/fonts/NotoSansDevanagari-Regular.ttf");
const DEVA_BOLD_PATH    = path.resolve(__dirname, "../assets/fonts/NotoSansDevanagari-Bold.ttf");

function isDevanagariLang(lang) {
  return lang === "hi" || lang === "mr";
}

// Picks the right font name for the current language. After registerFonts
// has been called on the doc, callers can do:
//   doc.font(pickFont(lang, /*bold*/ false))
// Helvetica is pdfkit's built-in default and needs no registration.
function pickFont(lang, bold = false) {
  if (isDevanagariLang(lang)) {
    return bold ? "Devanagari-Bold" : "Devanagari";
  }
  return bold ? "Helvetica-Bold" : "Helvetica";
}

function registerFonts(doc) {
  try {
    doc.registerFont("Devanagari",      DEVA_REGULAR_PATH);
    doc.registerFont("Devanagari-Bold", DEVA_BOLD_PATH);
  } catch (e) {
    // Non-fatal — if the TTFs aren't on disk, Hindi text will render as
    // missing-glyph boxes but the rest of the PDF still works.
    console.warn("[pdf] Devanagari font registration failed:", e instanceof Error ? e.message : e);
  }
}

// ═══ A4 layout ════════════════════════════════════════════════════════════════
const W   = 595.28;
const H   = 841.89;
const M   = 40;
const CW  = W - M * 2;
const HDR = 34;
const FTR = 28;
const CT  = HDR + 14;
const CB  = H - FTR - 10;

// ═══ Astronext palette ════════════════════════════════════════════════════════
const C = {
  orange:   "#ee7800",
  orangeD:  "#c55800",
  orangeL:  "#fff3e0",
  navy:     "#1a1464",
  navyL:    "#eef0f8",
  red:      "#cc0000",
  crimson:  "#7f1d1d",
  green:    "#1a7a3a",
  greenD:   "#0d5528",
  blue:     "#1d4ed8",
  ink:      "#333333",
  gray:     "#666666",
  grayL:    "#999999",
  lightGray:"#cccccc",
  bgGray:   "#f5f5f5",
  pink:     "#fdecec",
  pinkD:    "#fadcdc",
  yellow:   "#fffde7",
  yellowL:  "#fff8d6",
  white:    "#ffffff",

  // Kalsarpa chip pastels (to match the screenshot)
  ks: {
    peach:  "#f3b39a",
    sky:    "#8fd0e8",
    pink:   "#e7a4b5",
    teal:   "#6ebaa1",
    babyB:  "#a7d5ef",
    lime:   "#b2d493",
    lemon:  "#f4d58a",
    salmon: "#f0a28c",
  }
};

// ═══ Planet abbreviations ═════════════════════════════════════════════════════
const ABBR = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke"
};
// Devanagari short-form glyphs used inside chart cells (matches the
// "सू/चं/मं/बु/गु/शु/श/रा/के" convention seen in standard Hindi kundli reports).
const ABBR_HI = {
  Sun: "सू", Moon: "चं", Mars: "मं", Mercury: "बु",
  Jupiter: "गु", Venus: "शु", Saturn: "श", Rahu: "रा", Ketu: "के"
};

// ═══ Data tables ══════════════════════════════════════════════════════════════
const KALASARPA_NAMES = [
  "Anant","Kulik","Vasuki","Shankhpal","Padma","Mahapadma",
  "Takshak","Karkotak","Shankhchoor","Ghatak","Vishdhar","Sheshnaag"
];

const KALASARPA_CHIP_COLORS = [
  C.ks.peach, C.ks.sky,    C.ks.pink,   C.ks.teal,
  C.ks.babyB, C.ks.lime,   C.ks.lemon,  C.ks.salmon,
  C.ks.salmon,C.ks.teal,   C.ks.lemon,  C.ks.babyB
];

const SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// Dasha sequence and durations (Vimshottari).
const DASHA_ORDER = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const DASHA_YEARS = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};

// Gemstone knowledge base (Lagna lord → primary stone).
// This matches common Vedic practice. The actual gemstone is derived from the
// Ascendant lord (Lagnesh). The 5th/9th lords give Benefic/Lucky stones.
const PLANET_GEMSTONE = {
  Sun: {
    stone: "Ruby", substitute: "Red Garnet", metal: "Gold", finger: "Ring",
    day: "Sunday", deity: "Sun", minCarat: "3 - 4.25 Caret",
    mantra: "|| Om Hraam Hreem Hroum Sah Suryay Namah ||",
    description: "Ruby is the gemstone ruled by Sun. Pure form of ruby is unblemished, smooth to touch, clean, with good colour, lustre, brilliance and radiance. Wearing ruby brings wealth and property, strengthens will power and spirit. The wearer is fortunate and occupies a respected position in society.",
    caution: "Ruby should not be worn with Diamond, Blue Sapphire, Gomedha and Cat's Eye or their substitutes."
  },
  Moon: {
    stone: "Pearl", substitute: "Moonstone", metal: "Silver", finger: "Little",
    day: "Monday", deity: "Moon", minCarat: "4 - 6.25 Caret",
    mantra: "|| Om Shraam Shreem Shroum Sah Chandray Namah ||",
    description: "Pearl is the gemstone ruled by the Moon. It calms emotions, steadies the mind and deepens intuition. Wearing a clean, lustrous pearl brings mental peace, improves memory and strengthens maternal bonds and domestic harmony.",
    caution: "Pearl should not be worn together with Hessonite (Gomedha), Cat's Eye or Blue Sapphire."
  },
  Mars: {
    stone: "Red Coral", substitute: "Red Agate", metal: "Gold", finger: "Ring",
    day: "Tuesday", deity: "Mars", minCarat: "6 - 10.25 Caret",
    mantra: "|| Om Kraam Kreem Kraum Sah Bhaumay Namah ||",
    description: "Red Coral is the gemstone ruled by Mars. Wearing Red Coral makes one courageous and his enemies are vanquished. Red Coral protects from evil spirits, sorcery and bad dreams, and is excellent for strengthening vitality.",
    caution: "Red Coral should not be worn with Emerald, Diamond, Blue Sapphire, Gomedha and Cat's Eye or their substitutes."
  },
  Mercury: {
    stone: "Emerald", substitute: "Green Onyx", metal: "Gold", finger: "Little",
    day: "Wednesday", deity: "Mercury", minCarat: "3 - 5.25 Caret",
    mantra: "|| Om Braam Breem Broum Sah Budhay Namah ||",
    description: "Emerald is the gemstone ruled by Mercury. Wearing Emerald sharpens intellect, improves communication, and favours study, trade and analytical work. A clean, deep-green emerald is considered auspicious for career growth.",
    caution: "Emerald should not be worn with Ruby, Pearl or Red Coral without careful consideration."
  },
  Jupiter: {
    stone: "Yellow Sapphire", substitute: "Topaz", metal: "Gold", finger: "Index",
    day: "Thursday", deity: "Jupiter", minCarat: "4 - 5.25 Caret",
    mantra: "|| Om Graam Greem Groum Sah Gurave Namah ||",
    description: "Yellow Sapphire is the gemstone ruled by Jupiter. Wearing Yellow Sapphire brings good health, wisdom, property, longevity, name, honours and fame. Yellow Sapphire protects from evil influences and supports dharma.",
    caution: "Yellow Sapphire should not be worn with Diamond, Blue Sapphire, Gomedha or Cat's Eye."
  },
  Venus: {
    stone: "Diamond", substitute: "Zircon", metal: "Platinum / Silver", finger: "Middle",
    day: "Friday", deity: "Venus", minCarat: "0.5 - 1 Caret",
    mantra: "|| Om Draam Dreem Droum Sah Shukray Namah ||",
    description: "Diamond is the gemstone ruled by Venus. A brilliant, flawless diamond promotes romance, refinement, artistic ability, charisma and material prosperity. It is the stone of love, beauty and comfort.",
    caution: "Diamond should not be worn with Ruby, Red Coral or Pearl without consulting a qualified astrologer."
  },
  Saturn: {
    stone: "Blue Sapphire", substitute: "Amethyst", metal: "Silver", finger: "Middle",
    day: "Saturday", deity: "Saturn", minCarat: "3 - 5.25 Caret",
    mantra: "|| Om Praam Preem Proum Sah Shanaishcharay Namah ||",
    description: "Blue Sapphire is the gemstone ruled by Saturn. It is the fastest acting of all gemstones — it rewards discipline and punishes negligence. Always test for 3 days before committing to wear a Neelam.",
    caution: "ALWAYS test for three days before wearing. Not compatible with Ruby, Red Coral, Pearl or Diamond."
  },
  Rahu: {
    stone: "Hessonite", substitute: "Gomed", metal: "Silver", finger: "Middle",
    day: "Saturday", deity: "Rahu", minCarat: "5 - 7.25 Caret",
    mantra: "|| Om Bhraam Bhreem Bhroum Sah Rahave Namah ||",
    description: "Hessonite (Gomedha) is the stone of Rahu. It removes confusion, supports unconventional careers, foreign travel and unusual pursuits. Always consult a qualified astrologer before wearing.",
    caution: "Should not be worn with Pearl, Ruby or Red Coral."
  },
  Ketu: {
    stone: "Cat's Eye", substitute: "Tiger's Eye", metal: "Silver", finger: "Middle",
    day: "Tuesday", deity: "Ketu", minCarat: "3 - 5.25 Caret",
    mantra: "|| Om Straam Streem Stroum Sah Ketave Namah ||",
    description: "Cat's Eye (Lehsunia) is the stone of Ketu. It supports spiritual pursuits, research, mysticism and protects from hidden enemies. Test before wearing for three full days.",
    caution: "Not compatible with Pearl. Handle with care and consult before wearing."
  }
};

// Derive Life/Benefic/Lucky planets from Ascendant (1st / 5th / 9th house lords).
const ASCENDANT_LORDS_LBL = {
  Aries:       { lagna:"Mars",    fifth:"Sun",     ninth:"Jupiter", lord:"Mars",    symbol:"The Ram",      characteristics:"Fiery, Movable, East",    luckyGem:"Red Coral",      fastDay:"Tuesday" },
  Taurus:      { lagna:"Venus",   fifth:"Mercury", ninth:"Saturn",  lord:"Venus",   symbol:"The Bull",     characteristics:"Earthy, Fixed, South",    luckyGem:"Diamond",        fastDay:"Friday" },
  Gemini:      { lagna:"Mercury", fifth:"Venus",   ninth:"Saturn",  lord:"Mercury", symbol:"The Twins",    characteristics:"Airy, Dual, West",        luckyGem:"Emerald",        fastDay:"Wednesday" },
  Cancer:      { lagna:"Moon",    fifth:"Mars",    ninth:"Jupiter", lord:"Moon",    symbol:"The Crab",     characteristics:"Watery, Movable, North",  luckyGem:"Pearl",          fastDay:"Monday" },
  Leo:         { lagna:"Sun",     fifth:"Jupiter", ninth:"Mars",    lord:"Sun",     symbol:"The Lion",     characteristics:"Fiery, Immovable, East",  luckyGem:"Red Coral",      fastDay:"Sunday" },
  Virgo:       { lagna:"Mercury", fifth:"Saturn",  ninth:"Venus",   lord:"Mercury", symbol:"The Maiden",   characteristics:"Earthy, Dual, South",     luckyGem:"Emerald",        fastDay:"Wednesday" },
  Libra:       { lagna:"Venus",   fifth:"Saturn",  ninth:"Mercury", lord:"Venus",   symbol:"The Scales",   characteristics:"Airy, Movable, West",     luckyGem:"Diamond",        fastDay:"Friday" },
  Scorpio:     { lagna:"Mars",    fifth:"Jupiter", ninth:"Moon",    lord:"Mars",    symbol:"The Scorpion", characteristics:"Watery, Fixed, North",    luckyGem:"Red Coral",      fastDay:"Tuesday" },
  Sagittarius: { lagna:"Jupiter", fifth:"Mars",    ninth:"Sun",     lord:"Jupiter", symbol:"The Archer",   characteristics:"Fiery, Dual, East",       luckyGem:"Yellow Sapphire",fastDay:"Thursday" },
  Capricorn:   { lagna:"Saturn",  fifth:"Venus",   ninth:"Mercury", lord:"Saturn",  symbol:"The Goat",     characteristics:"Earthy, Movable, South",  luckyGem:"Blue Sapphire",  fastDay:"Saturday" },
  Aquarius:    { lagna:"Saturn",  fifth:"Mercury", ninth:"Venus",   lord:"Saturn",  symbol:"The Water Bearer",characteristics:"Airy, Fixed, West",    luckyGem:"Blue Sapphire",  fastDay:"Saturday" },
  Pisces:      { lagna:"Jupiter", fifth:"Moon",    ninth:"Mars",    lord:"Jupiter", symbol:"The Fishes",   characteristics:"Watery, Dual, North",     luckyGem:"Yellow Sapphire",fastDay:"Thursday" }
};

const ASCENDANT_PROFILE = {
  Aries: {
    description: [
      "People with Aries rising tend to be bold, assertive, pioneering and naturally energetic. You were built to start things. New projects, new journeys, new ideas — you run toward them while others hesitate.",
      "A restless spark lives inside you. You lead well but dislike being told how to move. You work at your best when you can set the tempo and hold the front line."
    ],
    quote: "You are happiest when you are the first one in. Waiting feels like wearing a jacket that's two sizes too small.",
    secondQuote: "Learn to finish what you start. The fire that kicks a door open is the same fire that burns quickly if not tended.",
    lesson: "Patience",
    positive: ["Dynamic","Courageous","Pioneering","Confident"],
    negative: ["Impulsive","Aggressive","Impatient","Self-centred"]
  },
  Taurus: {
    description: [
      "Taurus rising gives you a steady, sensual, pleasure-loving temperament. You build slowly and you build to last. Others may move faster, but few carry the same staying power you do.",
      "You have a natural eye for beauty — food, fabric, music, landscape. You understand the value of comfort and will design a life around it."
    ],
    quote: "You believe in the tangible. A thing isn't real to you until you can hold it, use it, or eat it.",
    secondQuote: "Your challenge is flexibility. Once you decide, you don't bend — which is both your strength and your limit.",
    lesson: "Letting go",
    positive: ["Patient","Reliable","Artistic","Determined"],
    negative: ["Stubborn","Possessive","Materialistic","Slow to change"]
  },
  Gemini: {
    description: [
      "Gemini rising makes you curious, witty, and endlessly interested. You pick up ideas as quickly as most people pick up coffee. Conversation is your natural medium.",
      "You adapt to almost any setting. This gives you range — and a restless streak. Staying with one thing long enough to master it is your quiet challenge."
    ],
    quote: "You read three books at once, start two side projects before breakfast, and are already bored with your last one.",
    secondQuote: "Your gift is connection — weaving ideas, people and possibilities. Slowing down to deepen those connections is the work of a lifetime.",
    lesson: "Depth over breadth",
    positive: ["Adaptable","Witty","Communicative","Versatile"],
    negative: ["Inconsistent","Restless","Superficial","Indecisive"]
  },
  Cancer: {
    description: [
      "Cancer rising gives you a soft, intuitive, deeply protective nature. You feel the emotional weather of every room you walk into — often before the people in it do.",
      "Home, family and lineage matter more to you than most will ever know. You build safe spaces and gather people into them."
    ],
    quote: "You remember every kindness and every slight. Your heart is a meticulous archivist.",
    secondQuote: "Learn to protect without absorbing. Not every emotion in the room is yours to carry.",
    lesson: "Emotional independence",
    positive: ["Nurturing","Intuitive","Protective","Loyal"],
    negative: ["Moody","Clingy","Over-sensitive","Indirect"]
  },
  Leo: {
    description: [
      "People with Leo rising tend to be generous, proud, emotional, romantic, extroverted, vain, egotistical, courageous, sentimental, self-confident, showy, and want to shine and be successful wherever they go and whatever they do.",
      "They like to 'rule' and have homage paid to them for their 'royal' nature. You like to take risks and can sometimes be foolhardy, but you definitely have a zest for living."
    ],
    quote: "The worst thing someone can do to you is to hurt your pride or be unappreciative of you. You wear your heart on your sleeve in matters of love and you need a partner you can be proud of.",
    secondQuote: "You enjoy sports and out-of-doors activity. Your vitality and spirit are strong except if your heart is broken in love. Your need for love and affection is very great and you need to feel appreciated.",
    lesson: "Humility",
    positive: ["Dynamic","Independent Thinker","Active","Courageous"],
    negative: ["Egoistic","Intolerant","Stubborn","Proud"]
  },
  Virgo: {
    description: [
      "Virgo rising gives you precision, analytical depth and a naturally helpful bent. You see detail where others see a blur — and you can't help wanting to fix it.",
      "Work, craft and service matter to you. You would rather do something well and slowly than badly and fast."
    ],
    quote: "You're the one people call when something has to be done right — and you secretly love it, even when you pretend to complain.",
    secondQuote: "Your challenge is to stop criticising yourself hardest of all. Excellence is your gift; self-punishment is not.",
    lesson: "Self-compassion",
    positive: ["Analytical","Precise","Helpful","Hardworking"],
    negative: ["Critical","Anxious","Perfectionist","Skeptical"]
  },
  Libra: {
    description: [
      "Libra rising gives you charm, diplomacy and a strong sense of justice. You sense imbalance in a room the way a musician hears a wrong note.",
      "You are relational by design. You do your best thinking in dialogue, and your best living in partnership."
    ],
    quote: "You see every side of every argument — which is both your superpower and the reason you never want to pick a restaurant.",
    secondQuote: "Learn to choose without needing approval. A decision made alone is not a betrayal of the people you love.",
    lesson: "Decisive action",
    positive: ["Diplomatic","Charming","Fair","Artistic"],
    negative: ["Indecisive","Avoidant","People-pleasing","Dependent"]
  },
  Scorpio: {
    description: [
      "Scorpio rising gives you intensity, magnetism and the power to see through surfaces. You don't do small talk — you do meaning.",
      "You are built for transformation. You carry the capacity to descend into difficulty and rise changed, again and again."
    ],
    quote: "You trust slowly and love fiercely. Once you're in, you're all the way in.",
    secondQuote: "Your work is in letting go. Not every wound must become a weapon; not every betrayal must become a boundary wall.",
    lesson: "Forgiveness",
    positive: ["Passionate","Resourceful","Perceptive","Determined"],
    negative: ["Jealous","Secretive","Obsessive","Vengeful"]
  },
  Sagittarius: {
    description: [
      "Sagittarius rising gives you optimism, adventurousness and a philosophical hunger. You need room — physical, mental, spiritual — to feel alive.",
      "You are a natural teacher, traveller and truth-seeker. Your mind reaches for the big picture faster than most can assemble the small one."
    ],
    quote: "You say what you think, often before you planned to. Your honesty wounds, but it also liberates.",
    secondQuote: "Your work is to finish what you begin. An open horizon is useless without a step into it.",
    lesson: "Follow-through",
    positive: ["Optimistic","Adventurous","Honest","Philosophical"],
    negative: ["Tactless","Restless","Over-confident","Irresponsible"]
  },
  Capricorn: {
    description: [
      "Capricorn rising gives you ambition, discipline and the patience of a long-distance runner. You climb — slowly, deliberately, with your eye on the summit.",
      "You understand structure, time and legacy. You were built for the long game."
    ],
    quote: "You don't need the shortcut. You suspect the shortcut is where most people go wrong.",
    secondQuote: "Your work is to enjoy the climb. Achievement without joy is a staircase to nowhere.",
    lesson: "Presence",
    positive: ["Disciplined","Ambitious","Patient","Responsible"],
    negative: ["Rigid","Pessimistic","Cold","Workaholic"]
  },
  Aquarius: {
    description: [
      "Aquarius rising gives you originality, independence and humanitarian instinct. You see the future before others do, and you are not afraid to point it out.",
      "You work best in networks, movements and communities of purpose. You are the one who belongs everywhere by not fully belonging anywhere."
    ],
    quote: "You are simultaneously the most social and the most solitary person in any room.",
    secondQuote: "Your work is intimacy. Ideals are beautiful; so is staying close enough to be disappointed by a real person.",
    lesson: "Emotional closeness",
    positive: ["Innovative","Humanitarian","Independent","Friendly"],
    negative: ["Detached","Stubborn","Aloof","Unpredictable"]
  },
  Pisces: {
    description: [
      "Pisces rising gives you compassion, imagination and spiritual sensitivity. You live with one foot in the seen world and one in the unseen — and neither feels strange to you.",
      "You feel what others feel without being told. You express what can't easily be spoken — in art, in music, in quiet presence."
    ],
    quote: "You dissolve boundaries naturally — which is a gift in love, art and healing, and a risk in money and boundaries.",
    secondQuote: "Your work is to stay grounded. The world needs your dreams, but only if you can land them somewhere.",
    lesson: "Grounding",
    positive: ["Compassionate","Intuitive","Creative","Gentle"],
    negative: ["Escapist","Over-sensitive","Impractical","Gullible"]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE CHROME
// ═══════════════════════════════════════════════════════════════════════════════

function pageBg(doc) {
  doc.rect(0, 0, W, H).fill(C.white);
  // Subtle orange side borders to echo astronext
  doc.rect(0, 0, 5, H).fill(C.orange);
  doc.rect(W - 5, 0, 5, H).fill(C.orange);
}

function pageFooter(doc, pageNum, footerLink = DEFAULT_BRANDING.footerLink, lang) {
  const y = H - FTR;
  doc.font("Helvetica").fontSize(9).fillColor(C.gray)
    .text(`${pageNum}`, 0, y, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.grayL)
    .text(footerLink, W - M - 150, y, { width: 150, align: "right" });
}

// Orange pill title at the top of every content page (flanked by thin lines).
function pageTitle(doc, title, y) {
  const textW = doc.font("Helvetica-Bold").fontSize(12).widthOfString(title);
  const pw = Math.min(textW + 48, CW - 40);
  const px = (W - pw) / 2;
  // Flanking lines
  doc.moveTo(M, y + 14).lineTo(px - 8, y + 14).strokeColor(C.orange).lineWidth(0.8).stroke();
  doc.moveTo(px + pw + 8, y + 14).lineTo(W - M, y + 14).strokeColor(C.orange).lineWidth(0.8).stroke();
  // Pill
  doc.roundedRect(px, y, pw, 26, 13).strokeColor(C.orange).lineWidth(1).stroke();
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.orange)
    .text(title, px, y + 7, { width: pw, align: "center" });
  return y + 42;
}

// Navy bold group header with decorative red/maroon curl underline ( ~ style ).
function groupHeader(doc, title, x, y, width, options = {}) {
  const align = options.align ?? "center";
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(title, x, y, { width, align });
  const ty = y + 18;
  if (align === "center") {
    // Short decorative curl in the middle
    const cx = x + width / 2;
    doc.strokeColor(C.crimson).lineWidth(0.9);
    doc.moveTo(cx - 20, ty).lineTo(cx - 6, ty).stroke();
    doc.moveTo(cx + 6, ty).lineTo(cx + 20, ty).stroke();
    // Tilde curl
    doc.save();
    doc.strokeColor(C.crimson).lineWidth(1.1);
    doc.moveTo(cx - 5, ty).bezierCurveTo(cx - 3, ty - 3, cx - 1, ty + 3, cx + 1, ty).stroke();
    doc.moveTo(cx + 1, ty).bezierCurveTo(cx + 3, ty - 3, cx + 4, ty + 3, cx + 6, ty).stroke();
    doc.restore();
  } else {
    // Short underline on the left for left-aligned group headers
    doc.strokeColor(C.crimson).lineWidth(0.9);
    doc.moveTo(x, ty).lineTo(x + 40, ty).stroke();
  }
  return y + 26;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

// 2-column key/value table with alternating pink/white rows (astronext style).
// Optional orange border around the table.
function kvTable(
  doc,
  rows,
  x, y, width,
  options = {}
) {
  const rowH   = options.rowH ?? 22;
  const labelW = width * (options.labelFraction ?? 0.42);
  const valueX = x + labelW + 6;

  if (options.bordered) {
    doc.roundedRect(x, y, width, rowH * rows.length, 3)
      .strokeColor(C.orange).lineWidth(1).stroke();
  }

  rows.forEach(([label, value], i) => {
    const rowY = y + i * rowH;
    doc.rect(x, rowY, width, rowH).fill(i % 2 === 0 ? C.white : C.pink);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.ink)
      .text(label, x + 10, rowY + 7, { width: labelW - 10, lineBreak: false });
    doc.font("Helvetica").fontSize(9).fillColor(C.ink)
      .text(value, valueX, rowY + 7, { width: width - labelW - 12, lineBreak: false });
  });

  if (options.bordered) {
    // Redraw the orange border on top so it sits above row fills.
    doc.roundedRect(x, y, width, rowH * rows.length, 3)
      .strokeColor(C.orange).lineWidth(1).stroke();
  }
  return y + rowH * rows.length;
}

// Wide data table (planetary positions etc.): orange header + alternating rows.
function dataTable(
  doc,
  headers,
  rows,
  y,
  options = {}
) {
  if (y > CB - 30) return y;
  const ROW  = 20;
  const HROW = 22;
  const cols = options.cols ?? headers.map(() => CW / headers.length);

  // Header
  doc.rect(M, y, CW, HROW).fill(C.orange);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white);
  let rx = M;
  headers.forEach((h, i) => {
    doc.text(h, rx + 8, y + 7, { width: cols[i] - 10, lineBreak: false });
    rx += cols[i];
  });
  y += HROW;

  for (const [ri, row] of rows.entries()) {
    if (y + ROW > CB) break;
    const isHi = ri === options.hilite;
    doc.rect(M, y, CW, ROW).fill(isHi ? C.pinkD : ri % 2 === 0 ? C.white : C.pink);
    doc.font(isHi ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(C.ink);
    let cx = M;
    row.forEach((cell, ci) => {
      doc.text(cell, cx + 8, y + 5, { width: cols[ci] - 10, lineBreak: false });
      cx += cols[ci];
    });
    y += ROW;
  }
  return y + 10;
}

// Section bodies reach us in two shapes: the kundli mapper builds an array of
// paragraphs, while the love/health mappers build one string with the
// paragraphs joined by blank lines (P.block). Iterating the string form would
// walk it character by character, so normalise to an array of paragraphs here.
function asParagraphs(body) {
  if (Array.isArray(body)) return body.filter((p) => typeof p === "string" && p.trim());
  if (typeof body === "string") return body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return [];
}

// Body paragraph stack.
function bodyText(doc, paragraphs, y, x = M, width = CW) {
  paragraphs = asParagraphs(paragraphs);
  if (!paragraphs.length) return y;
  for (const p of paragraphs) {
    if (!p || y > CB - 20) break;
    doc.font("Helvetica").fontSize(10).fillColor(C.ink);
    const th = doc.heightOfString(p, { width, align: "justify" });
    doc.text(p, x, y, { width, align: "justify" });
    y += th + 10;
  }
  return y;
}

// Orange-left-border quoted block (italic orange text on cream bg). Mirrors astronext.
function quoteBox(doc, text, y, x = M, width = CW) {
  if (!text) return y;
  const pad = 14;
  doc.font("Helvetica-Oblique").fontSize(11);
  const th = doc.heightOfString(text, { width: width - pad * 2 - 20 });
  const bh = th + pad * 2;
  doc.rect(x, y, width, bh).fill(C.bgGray);
  doc.rect(x, y, 4, bh).fill(C.orange);
  // Decorative opening quote
  doc.font("Helvetica-Bold").fontSize(22).fillColor(C.orange)
    .text(`"`, x + 12, y + 4, { width: 14, lineBreak: false });
  doc.font("Helvetica-Oblique").fontSize(11).fillColor(C.orange)
    .text(text, x + 30, y + pad, { width: width - pad - 40 });
  return y + bh + 12;
}

// Remedies box: green left accent bar, gray fill, bullet items.
function remediesBox(doc, items, y, x = M, width = CW) {
  if (!items?.length) return y;
  const pad = 14;
  const gap = 4;
  doc.font("Helvetica").fontSize(9.5);
  const lineHeights = items.map(i => doc.heightOfString(`-  ${i}`, { width: width - pad * 2 - 8 }));
  const totalH = lineHeights.reduce((a, b) => a + b + gap, 0);
  const bh = totalH + pad * 2;
  if (y + bh > CB) return y;

  doc.rect(x, y, width, bh).fill(C.bgGray);
  doc.rect(x, y, 5, bh).fill(C.green);

  let cy = y + pad;
  items.forEach((item, i) => {
    doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
      .text(`-  ${item}`, x + pad + 4, cy, { width: width - pad * 2 - 8 });
    cy += lineHeights[i] + gap;
  });
  return y + bh + 12;
}

// Small colored trait pill (used at end of Ascendant Report).
function traitPill(doc, text, x, y, color) {
  doc.font("Helvetica-Bold").fontSize(10);
  const textW = doc.widthOfString(text);
  const pw = textW + 18;
  doc.roundedRect(x, y, pw, 22, 11).fill(color);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white)
    .text(text, x, y + 6, { width: pw, align: "center" });
  return pw;
}

// Big colored number in an outlined pill below (Favourable Points page style).
function bigNumberBlock(doc, value, label, x, y, width, color) {
  doc.font("Helvetica-Bold").fontSize(54).fillColor(color)
    .text(value, x, y, { width, align: "center", lineBreak: false });
  doc.roundedRect(x + width / 2 - 75, y + 66, 150, 26, 13).strokeColor(color).lineWidth(1.2).stroke();
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(label, x + width / 2 - 75, y + 73, { width: 150, align: "center", lineBreak: false });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PLANET GLYPHS (drawn with pdfkit primitives)
// ═══════════════════════════════════════════════════════════════════════════════

function planetGlyph(doc, name, cx, cy, r, color) {
  doc.save();
  switch (name) {
    case "Sun": {
      // Filled disc + short rays
      doc.circle(cx, cy, r * 0.55).fill(color);
      doc.strokeColor(color).lineWidth(r * 0.12);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const x1 = cx + Math.cos(a) * r * 0.7;
        const y1 = cy + Math.sin(a) * r * 0.7;
        const x2 = cx + Math.cos(a) * r * 0.95;
        const y2 = cy + Math.sin(a) * r * 0.95;
        doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
      }
      break;
    }
    case "Moon": {
      // Crescent: two overlapping circles
      doc.save();
      doc.circle(cx, cy, r * 0.75).fill(color);
      doc.circle(cx + r * 0.32, cy - r * 0.10, r * 0.70).fill(C.white);
      doc.restore();
      break;
    }
    case "Mars": {
      // Mars ♂ — circle with arrow going up-right
      doc.circle(cx - r * 0.15, cy + r * 0.15, r * 0.50).strokeColor(color).lineWidth(r * 0.18).stroke();
      doc.strokeColor(color).lineWidth(r * 0.18);
      doc.moveTo(cx + r * 0.20, cy - r * 0.20).lineTo(cx + r * 0.80, cy - r * 0.80).stroke();
      // Arrowhead
      doc.moveTo(cx + r * 0.80, cy - r * 0.80).lineTo(cx + r * 0.45, cy - r * 0.85).stroke();
      doc.moveTo(cx + r * 0.80, cy - r * 0.80).lineTo(cx + r * 0.85, cy - r * 0.45).stroke();
      break;
    }
    case "Mercury": {
      // Small planet with swirl
      doc.circle(cx, cy, r * 0.55).strokeColor(color).lineWidth(r * 0.16).stroke();
      // Antennae
      doc.strokeColor(color).lineWidth(r * 0.14);
      doc.moveTo(cx - r * 0.35, cy - r * 0.55).lineTo(cx, cy - r * 0.90).stroke();
      doc.moveTo(cx + r * 0.35, cy - r * 0.55).lineTo(cx, cy - r * 0.90).stroke();
      break;
    }
    case "Jupiter": {
      // Circle with equatorial stripe (rings Jupiter-style)
      doc.circle(cx, cy, r * 0.75).strokeColor(color).lineWidth(r * 0.18).stroke();
      doc.strokeColor(color).lineWidth(r * 0.10);
      doc.moveTo(cx - r * 0.75, cy - r * 0.18).lineTo(cx + r * 0.75, cy - r * 0.18).stroke();
      doc.moveTo(cx - r * 0.75, cy + r * 0.18).lineTo(cx + r * 0.75, cy + r * 0.18).stroke();
      break;
    }
    case "Venus": {
      // Venus ♀ — circle above, cross below
      doc.circle(cx, cy - r * 0.15, r * 0.55).strokeColor(color).lineWidth(r * 0.18).stroke();
      doc.strokeColor(color).lineWidth(r * 0.18);
      doc.moveTo(cx, cy + r * 0.40).lineTo(cx, cy + r * 0.90).stroke();
      doc.moveTo(cx - r * 0.30, cy + r * 0.65).lineTo(cx + r * 0.30, cy + r * 0.65).stroke();
      break;
    }
    case "Saturn": {
      // Ringed planet
      doc.circle(cx, cy, r * 0.45).fill(color);
      doc.save();
      doc.translate(cx, cy);
      doc.rotate(-18);
      doc.scale(1, 0.35);
      doc.circle(0, 0, r * 0.90).strokeColor(color).lineWidth(r * 0.30).stroke();
      doc.restore();
      break;
    }
    case "Rahu": {
      // Upward snake-like curve (horseshoe up) filled
      doc.save();
      doc.moveTo(cx - r * 0.60, cy + r * 0.50)
        .bezierCurveTo(cx - r * 0.60, cy - r * 0.80, cx + r * 0.60, cy - r * 0.80, cx + r * 0.60, cy + r * 0.50)
        .strokeColor(color).lineWidth(r * 0.20).stroke();
      // Bottom dots
      doc.circle(cx - r * 0.60, cy + r * 0.55, r * 0.15).fill(color);
      doc.circle(cx + r * 0.60, cy + r * 0.55, r * 0.15).fill(color);
      doc.restore();
      break;
    }
    case "Ketu": {
      // Downward version
      doc.save();
      doc.moveTo(cx - r * 0.60, cy - r * 0.50)
        .bezierCurveTo(cx - r * 0.60, cy + r * 0.80, cx + r * 0.60, cy + r * 0.80, cx + r * 0.60, cy - r * 0.50)
        .strokeColor(color).lineWidth(r * 0.20).stroke();
      doc.circle(cx - r * 0.60, cy - r * 0.55, r * 0.15).fill(color);
      doc.circle(cx + r * 0.60, cy - r * 0.55, r * 0.15).fill(color);
      doc.restore();
      break;
    }
    default: {
      doc.circle(cx, cy, r * 0.55).fill(color);
    }
  }
  doc.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NORTH INDIAN CHART (yellow with orange lines)
// ═══════════════════════════════════════════════════════════════════════════════

// Sign index (0-11) of a sign name.
// Map every sign name we might see — English AND its localized (hi/mr) form —
// back to its 0-11 index. Placements in a Hindi report carry translated sign
// names ("मकर"), so a plain SIGNS.indexOf() returned -1 → fell back to 0 and
// corrupted every derived lagna (chart drawn +N off, e.g. lagna showing 11
// instead of 8). Building the alias map from translateSign keeps it exact.
const SIGN_ALIAS_TO_IDX = (() => {
  const m = {};
  SIGNS.forEach((en, i) => {
    m[en] = i;
    for (const lng of ["hi", "mr"]) {
      const loc = translateSign(en, lng);
      if (loc) m[loc] = i;
    }
  });
  return m;
})();
function signIdxOf(name) {
  const i = SIGN_ALIAS_TO_IDX[name];
  return i != null ? i : 0;
}

// Varga (divisional) sign index of an ecliptic longitude for divisor d.
const vargaSignIdx = (lon, d) => classicalVargaIndex(lon, d);

// Build a house-keyed chart (planet names per house 1-12) from a given lagna
// sign — used for the Moon chart (Moon as lagna) and any rashi-based chart.
function houseChartFromLagna(planets, lagnaIdx) {
  const out = {};
  for (let h = 1; h <= 12; h++) out[String(h)] = [];
  for (const p of planets) out[String(((signIdxOf(p.sign) - lagnaIdx + 12) % 12) + 1)].push(p.name);
  return out;
}

// Build a house-keyed divisional chart from its own varga lagna (e.g. navamsa).
function vargaChartFromLagna(planets, d, lagnaLon) {
  const lagnaIdx = vargaSignIdx(lagnaLon, d);
  const out = {};
  for (let h = 1; h <= 12; h++) out[String(h)] = [];
  for (const p of planets) out[String(((vargaSignIdx(p.longitude, d) - lagnaIdx + 12) % 12) + 1)].push(p.name);
  return { chart: out, lagnaIdx };
}

function northIndianChart(
  doc,
  chartData,
  ox, oy, size,
  lang,
  lagnaSignIndex = null
) {
  const cx = ox + size / 2;
  const cy = oy + size / 2;
  const sc = size / 300;

  doc.save();
  doc.rect(ox, oy, size, size).fill(C.yellow);
  doc.rect(ox, oy, size, size).strokeColor(C.orange).lineWidth(1.2).stroke();
  doc.strokeColor(C.orange).lineWidth(0.8);

  [[ox, oy], [ox + size, oy], [ox, oy + size], [ox + size, oy + size]].forEach(([px, py]) => {
    doc.moveTo(px, py).lineTo(cx, cy).stroke();
  });
  doc.moveTo(cx, oy).lineTo(ox + size, cy).lineTo(cx, oy + size).lineTo(ox, cy).closePath().stroke();

  const pos = [
    [148, 92], [74, 42], [17, 92], [74, 152],
    [17, 210], [74, 265], [148, 210], [225, 265],
    [280, 210], [225, 152], [280, 92], [225, 42]
  ];

  const fs = Math.max(5.5, 11 * sc);
  pos.forEach(([hx, hy], idx) => {
    const houseNum = idx + 1;
    const occupants = (chartData[String(houseNum)] ?? []).filter(p => p !== "-");
    const abbrTable = hi(lang) ? ABBR_HI : ABBR;
    const abbrs = occupants.map(o => abbrTable[o] ?? o).join(" ");
    const ax = ox + hx * sc;
    const ay = oy + hy * sc;
    // Traditional North-Indian charts label each house with its RASHI number
    // (lagna rashi at house 1). When no lagna sign is given we fall back to the
    // house number (1-12).
    const cellNum = lagnaSignIndex != null ? ((lagnaSignIndex + idx) % 12) + 1 : houseNum;
    doc.font("Helvetica").fontSize(Math.max(5, fs * 0.75)).fillColor(C.gray)
      .text(String(cellNum), ax - 10, ay - 8, { width: 20, align: "center", lineBreak: false });
    if (abbrs) {
      doc.font("Helvetica-Bold").fontSize(fs).fillColor(C.navy)
        .text(abbrs, ax - 26, ay + 4, { width: 52, align: "center", lineBreak: false });
    }
  });
  doc.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHA HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// Compute antardasha sub-periods within a mahadasha span.
function computeAntardashas(mahaLord, start, end) {
  const startMs = new Date(start).getTime();
  const endMs   = new Date(end).getTime();
  const total   = endMs - startMs;
  const startIdx = DASHA_ORDER.indexOf(mahaLord);
  if (startIdx < 0 || total <= 0) return [];
  const out = [];
  let cursor = startMs;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startIdx + i) % 9];
    const frac = DASHA_YEARS[lord] / 120;
    const dur  = total * frac;
    const segStart = cursor;
    cursor += dur;
    out.push({
      lord,
      start: new Date(segStart).toISOString().slice(0, 10),
      end: new Date(Math.min(cursor, endMs)).toISOString().slice(0, 10),
    });
    if (cursor >= endMs) break;
  }
  return out;
}

// Box for a single mahadasha period (astronext style): navy header, blue range,
// then a light alternating list of antardashas.
function mahaDashaBox(
  doc,
  period,
  x, y, w, h,
  lang
) {
  // Title
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(translatePlanet(period.mahaDasha, lang), x, y, { width: w, align: "center" });
  // Divider
  doc.moveTo(x + 10, y + 18).lineTo(x + w - 10, y + 18).strokeColor(C.lightGray).lineWidth(0.4).dash(1, { space: 1 }).stroke();
  doc.undash();
  // Range
  doc.font("Helvetica").fontSize(8).fillColor(C.ink)
    .text(period.start, x, y + 22, { width: w, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.ink)
    .text(period.end, x, y + 34, { width: w, align: "center" });
  // Divider
  doc.moveTo(x + 10, y + 48).lineTo(x + w - 10, y + 48).strokeColor(C.lightGray).lineWidth(0.4).dash(1, { space: 1 }).stroke();
  doc.undash();

  const listY = y + 54;
  const rowH  = 15;
  const antar = computeAntardashas(period.mahaDasha, period.start, period.end);
  antar.forEach((a, i) => {
    const ry = listY + i * rowH;
    if (ry + rowH > y + h) return;
    doc.rect(x, ry, w, rowH).fill(i % 2 === 0 ? C.white : C.pink);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.ink)
      .text(translatePlanet(a.lord, lang), x + 10, ry + 4, { width: w * 0.4, lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor(C.ink)
      .text(a.end, x + w * 0.45, ry + 4, { width: w * 0.55 - 10, align: "right", lineBreak: false });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ILLUSTRATIONS (simple symbolic drawings to replicate astronext's imagery)
// ═══════════════════════════════════════════════════════════════════════════════

function drawGanesha(doc, cx, cy, r) {
  doc.save();
  // Decorative halo rings
  doc.circle(cx, cy, r).strokeColor(C.red).lineWidth(0.6).stroke();
  doc.circle(cx, cy, r * 0.88).strokeColor(C.orange).lineWidth(0.5).stroke();
  // Ganesha silhouette (very simplified)
  doc.fillColor(C.orange);
  doc.circle(cx, cy - r * 0.1, r * 0.45).fill(); // head
  // Ears
  doc.circle(cx - r * 0.55, cy - r * 0.1, r * 0.22).fill();
  doc.circle(cx + r * 0.55, cy - r * 0.1, r * 0.22).fill();
  // Trunk
  doc.save();
  doc.strokeColor(C.orange).lineWidth(r * 0.14);
  doc.moveTo(cx, cy + r * 0.1)
    .bezierCurveTo(cx - r * 0.1, cy + r * 0.4, cx + r * 0.25, cy + r * 0.45, cx + r * 0.1, cy + r * 0.6)
    .stroke();
  doc.restore();
  // Body — yellow
  doc.fillColor("#f1b23d");
  doc.roundedRect(cx - r * 0.45, cy + r * 0.25, r * 0.9, r * 0.5, r * 0.1).fill();
  // Crown
  doc.fillColor("#e28a1e");
  doc.moveTo(cx - r * 0.35, cy - r * 0.5)
    .lineTo(cx - r * 0.2, cy - r * 0.7)
    .lineTo(cx, cy - r * 0.52)
    .lineTo(cx + r * 0.2, cy - r * 0.7)
    .lineTo(cx + r * 0.35, cy - r * 0.5)
    .closePath().fill();
  // Eye hints
  doc.fillColor(C.white);
  doc.circle(cx - r * 0.15, cy - r * 0.2, r * 0.05).fill();
  doc.circle(cx + r * 0.15, cy - r * 0.2, r * 0.05).fill();
  doc.restore();
}

function drawKalsarpaArt(doc, ox, oy, size) {
  doc.save();
  // Beige/cream background
  doc.roundedRect(ox, oy, size, size, 6).fill("#efe4d0");
  doc.roundedRect(ox, oy, size, size, 6).strokeColor(C.lightGray).lineWidth(0.6).stroke();
  const cx = ox + size / 2;
  const cy = oy + size / 2;
  // Stylised coiled-serpent deity motif
  for (let i = 0; i < 3; i++) {
    const rr = size * (0.35 - i * 0.07);
    doc.save();
    doc.translate(cx, cy);
    doc.rotate(i * 20);
    doc.moveTo(-rr, 0)
      .bezierCurveTo(-rr, -rr, rr, -rr, rr, 0)
      .bezierCurveTo(rr, rr, -rr, rr, -rr, 0)
      .strokeColor("#8b4513").lineWidth(1.3).stroke();
    doc.restore();
  }
  // Central face
  doc.fillColor("#8b4513");
  doc.circle(cx, cy - size * 0.02, size * 0.12).fill();
  doc.restore();
}

function drawMangalikArt(doc, ox, oy, size) {
  doc.save();
  doc.rect(ox, oy, size, size).fill("#fdf1dc");
  doc.rect(ox, oy, size, size).strokeColor(C.lightGray).lineWidth(0.6).stroke();
  const cx = ox + size / 2;
  const cy = oy + size / 2;
  // Stylised bride and groom silhouette with fire
  doc.fillColor("#b22222");
  // Groom (left)
  doc.roundedRect(cx - size * 0.30, cy - size * 0.05, size * 0.16, size * 0.32, size * 0.03).fill();
  doc.circle(cx - size * 0.22, cy - size * 0.15, size * 0.07).fill();
  // Bride (right)
  doc.fillColor("#c71585");
  doc.roundedRect(cx + size * 0.12, cy - size * 0.05, size * 0.16, size * 0.32, size * 0.03).fill();
  doc.circle(cx + size * 0.20, cy - size * 0.15, size * 0.07).fill();
  // Sacred fire
  doc.fillColor(C.orange);
  doc.moveTo(cx - size * 0.08, cy + size * 0.30)
    .lineTo(cx, cy + size * 0.10)
    .lineTo(cx + size * 0.08, cy + size * 0.30)
    .closePath().fill();
  doc.fillColor("#fdc16d");
  doc.moveTo(cx - size * 0.04, cy + size * 0.30)
    .lineTo(cx, cy + size * 0.17)
    .lineTo(cx + size * 0.04, cy + size * 0.30)
    .closePath().fill();
  doc.restore();
}

function drawShaniArt(doc, ox, oy, size) {
  doc.save();
  doc.rect(ox, oy, size, size).fill("#fdecc8");
  doc.rect(ox, oy, size, size).strokeColor(C.lightGray).lineWidth(0.6).stroke();
  const cx = ox + size / 2;
  const cy = oy + size / 2;
  // Saturn planet with ring
  doc.fillColor(C.navy);
  doc.circle(cx, cy - size * 0.05, size * 0.18).fill();
  doc.save();
  doc.translate(cx, cy - size * 0.05);
  doc.rotate(-15);
  doc.scale(1, 0.3);
  doc.circle(0, 0, size * 0.32).strokeColor(C.orange).lineWidth(2.5).stroke();
  doc.restore();
  // Crow silhouette (Shani's vahana)
  doc.fillColor("#2e2e2e");
  doc.moveTo(cx - size * 0.40, cy + size * 0.35)
    .bezierCurveTo(cx - size * 0.32, cy + size * 0.20, cx - size * 0.10, cy + size * 0.22, cx - size * 0.05, cy + size * 0.38)
    .closePath().fill();
  // Crow beak
  doc.moveTo(cx - size * 0.42, cy + size * 0.23)
    .lineTo(cx - size * 0.50, cy + size * 0.26)
    .lineTo(cx - size * 0.42, cy + size * 0.28)
    .closePath().fill();
  doc.restore();
}

function drawLionArt(doc, ox, oy, size) {
  doc.save();
  doc.rect(ox, oy, size, size).fill(C.white);
  const cx = ox + size / 2;
  const cy = oy + size / 2;

  // Stylised lion face — mane as radiating lines
  doc.strokeColor("#8b5a3c").lineWidth(1);
  for (let i = 0; i < 28; i++) {
    const a = (i * 2 * Math.PI) / 28;
    const x1 = cx + Math.cos(a) * size * 0.28;
    const y1 = cy + Math.sin(a) * size * 0.28;
    const x2 = cx + Math.cos(a) * size * 0.44;
    const y2 = cy + Math.sin(a) * size * 0.44;
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  }
  // Face circle
  doc.circle(cx, cy, size * 0.26).fillAndStroke("#c19a70", "#8b5a3c");
  // Eyes
  doc.fillColor("#2e2e2e");
  doc.circle(cx - size * 0.08, cy - size * 0.03, size * 0.025).fill();
  doc.circle(cx + size * 0.08, cy - size * 0.03, size * 0.025).fill();
  // Nose
  doc.moveTo(cx - size * 0.04, cy + size * 0.06)
    .lineTo(cx + size * 0.04, cy + size * 0.06)
    .lineTo(cx, cy + size * 0.11)
    .closePath().fill();
  doc.restore();
}

function drawGemstoneArt(doc, ox, oy, size, color) {
  doc.save();
  const cx = ox + size / 2;
  const cy = oy + size / 2;
  // Diamond / gem silhouette
  doc.moveTo(cx, cy - size * 0.38)
    .lineTo(cx + size * 0.38, cy - size * 0.04)
    .lineTo(cx + size * 0.20, cy + size * 0.38)
    .lineTo(cx - size * 0.20, cy + size * 0.38)
    .lineTo(cx - size * 0.38, cy - size * 0.04)
    .closePath().fill(color);
  // Internal facet lines (white)
  doc.strokeColor(C.white).lineWidth(1);
  doc.moveTo(cx, cy - size * 0.38).lineTo(cx - size * 0.20, cy + size * 0.38).stroke();
  doc.moveTo(cx, cy - size * 0.38).lineTo(cx + size * 0.20, cy + size * 0.38).stroke();
  doc.moveTo(cx - size * 0.38, cy - size * 0.04).lineTo(cx + size * 0.38, cy - size * 0.04).stroke();
  doc.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS FOR DERIVED FIELDS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt2(n) { return n.toString().padStart(2, "0"); }

function degreesToDMS(value) {
  const d = Math.floor(value);
  const mFloat = (value - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${fmt2(d)}:${fmt2(m)}:${fmt2(s)}`;
}

function latitudeToDeg(lat) {
  const hemi = lat >= 0 ? "N" : "S";
  const abs = Math.abs(lat);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  return `${d} ${hemi} ${m}`;
}

function longitudeToDeg(lon) {
  const hemi = lon >= 0 ? "E" : "W";
  const abs = Math.abs(lon);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  return `${d} ${hemi} ${m}`;
}

function tzOffsetString(tz) {
  if (/^[+-]/.test(tz)) return tz;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
    const part = fmt.formatToParts(new Date()).find(p => p.type === "timeZoneName")?.value ?? "GMT+5:30";
    const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (m) return `${m[1]}${fmt2(Number(m[2]))}:${fmt2(Number(m[3] ?? "0"))}`;
  } catch {}
  return "+05:30";
}

function formatDateSlashes(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return `${fmt2(d)}/${fmt2(m)}/${y}`;
}

function formatTime12h(hm) {
  const [h, m] = hm.split(":").map(Number);
  const pm = h >= 12;
  const hr = ((h + 11) % 12) + 1;
  return `${fmt2(hr)}:${fmt2(m)} ${pm ? "PM" : "AM"}`;
}

function intensityColor(intensity) {
  const l = intensity.toLowerCase();
  if (l.includes("highly")) return C.green;
  if (l.includes("fav"))     return C.green;
  if (l.includes("neutral")) return C.gray;
  if (l.includes("unfav"))   return "#c0392b";
  return C.gray;
}

const PLANET_COLORS = {
  Sun: "#ef5b3f", Moon: "#ef8aa0", Mars: "#d94a4a", Mercury: "#c47f56",
  Jupiter: "#d19b2e", Venus: "#c98977", Saturn: "#7d6f93", Rahu: "#6b5b4b", Ketu: "#7a8a9a"
};

// Kalsarpa type from Rahu's house position.
function getKalsarpaName(data) {
  const rahu = data.planets.find(p => p.name === "Rahu");
  if (!rahu) return "Unknown";
  return KALASARPA_NAMES[Math.max(0, Math.min(11, rahu.house - 1))];
}

// Manglik percentage: simple heuristic based on Mars house.
function manglikPercent(data) {
  const mars = data.planets.find(p => p.name === "Mars");
  if (!mars) return 0;
  if ([1, 4, 7, 8, 12].includes(mars.house)) return 55;
  if (mars.house === 2) return 35;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 1 — COVER
// ═══════════════════════════════════════════════════════════════════════════════

function renderCover(doc, report, branding, logoBuffer, ganeshBuffer) {
  // White background with subtle paisley echo (faint circles)
  doc.rect(0, 0, W, H).fill(C.white);
  for (let i = 0; i < 30; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    const rr = 20 + Math.random() * 40;
    doc.circle(rx, ry, rr).strokeColor("#f1f1f1").lineWidth(0.4).stroke();
  }

  // Ganesha image (real art) or drawn fallback
  if (ganeshBuffer) {
    try {
      const size = 260;
      doc.image(ganeshBuffer, (W - size) / 2, 60, { fit: [size, size], align: "center" });
    } catch {
      drawGanesha(doc, W / 2, 180, 110);
    }
  } else {
    drawGanesha(doc, W / 2, 180, 110);
  }

  // Sanskrit mantra — Devanagari when Hindi/Marathi font is active, else transliteration.
  doc.font("Helvetica-Bold").fontSize(24).fillColor(C.orange)
    .text(hi(report.request.language) ? SHLOKA_SHRI_GANESHAYA_HI : "|| Shri Ganeshaya Namah ||",
          0, 340, { width: W, align: "center" });

  // Orange name band
  const bandY = 450;
  const lang = report.request.language;
  doc.rect(0, bandY, W, 120).fill(C.orange);
  doc.font("Helvetica").fontSize(22).fillColor(C.white)
    .text(t("COVER_HOROSCOPE_FOR", lang), 0, bandY + 24, { width: W, align: "center" });
  doc.font("Helvetica-Bold").fontSize(18).fillColor(C.white)
    .text(report.request.fullName, 0, bandY + 60, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(12).fillColor(C.white)
    .text(`${formatDateSlashes(report.request.birthDate)}   ${formatTime12h(report.request.birthTime)}`, 0, bandY + 86, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(12).fillColor(C.white)
    .text(report.request.birthPlace, 0, bandY + 102, { width: W, align: "center" });

  // "generated by" + company logo / name
  doc.font("Helvetica").fontSize(11).fillColor(C.gray)
    .text(t("COVER_GENERATED_BY", lang), 0, H - 210, { width: W, align: "center" });

  if (logoBuffer) {
    try {
      // Fit the logo in a centered box; pdfkit preserves aspect ratio with fit.
      const logoW = 140;
      const logoH = 60;
      doc.image(logoBuffer, (W - logoW) / 2, H - 200, { fit: [logoW, logoH], align: "center" });
    } catch {
      // Invalid image — fall back to text brand
      doc.font("Helvetica-Bold").fontSize(22).fillColor(C.navy)
        .text(branding.companyName, 0, H - 185, { width: W, align: "center" });
    }
  } else {
    doc.font("Helvetica-Bold").fontSize(22).fillColor(C.navy)
      .text(branding.companyName, 0, H - 185, { width: W, align: "center" });
  }

  if (branding.companyInfo) {
    doc.font("Helvetica").fontSize(8).fillColor(C.gray)
      .text(branding.companyInfo, 0, H - 130, { width: W, align: "center" });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 2 — BASIC ASTROLOGICAL DETAILS
// ═══════════════════════════════════════════════════════════════════════════════

function renderBasicDetails(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_BASIC_DETAILS", lang), y);

  const colW = (CW - 20) / 2;
  const leftX  = M;
  const rightX = M + colW + 20;
  const COLUMN_START_Y = y;

  // ─── Left column: Basic Details + Ghat Chakra ─────────────────────────────
  let ly = COLUMN_START_Y;
  ly = groupHeader(doc, t("GROUP_BASIC_DETAILS", lang), leftX, ly, colW);

  ly = kvTable(doc, [
    [t("KV_DATE_OF_BIRTH", lang),  formatDateSlashes(report.request.birthDate)],
    [t("KV_TIME_OF_BIRTH", lang),  report.request.birthTime],
    [t("KV_PLACE_OF_BIRTH", lang), report.request.birthPlace],
    [t("KV_LATITUDE", lang),       latitudeToDeg(report.request.latitude)],
    [t("KV_LONGITUDE", lang),      longitudeToDeg(report.request.longitude)],
    [t("KV_TIMEZONE", lang),       tzOffsetString(report.request.timezone)],
    [t("KV_AYANAMSHA", lang),      degreesToDMS(data.calculationMeta.ayanamshaDegrees)],
    [t("KV_SUNRISE", lang),        data.panchang.sunrise || "—"],
    [t("KV_SUNSET", lang),         data.panchang.sunset  || "—"]
  ], leftX, ly, colW, { bordered: true });

  ly += 20;
  ly = groupHeader(doc, t("GROUP_GHAT_CHAKRA", lang), leftX, ly, colW);
  ly = kvTable(doc, [
    [t("KV_MONTH", lang),     translateAny(data.ghatChakra?.month, lang)     || "—"],
    [t("KV_TITHI", lang),     translateAny(data.ghatChakra?.tithi, lang)     || "—"],
    [t("KV_DAY", lang),       translateAny(data.ghatChakra?.day, lang)       || "—"],
    [t("KV_NAKSHATRA", lang), translateNakshatra(data.ghatChakra?.nakshatra, lang) || "—"],
    [t("KV_YOG", lang),       translateAny(data.ghatChakra?.yog, lang)       || "—"],
    [t("KV_KARAN", lang),     translateAny(data.ghatChakra?.karan, lang)     || "—"],
    [t("KV_PRAHAR", lang),    String(data.ghatChakra?.prahar ?? "—")],
    [t("KV_MOON", lang),      String(data.ghatChakra?.moon   ?? "—")]
  ], leftX, ly, colW);

  // ─── Right column: Panchang + Astrological Details ───────────────────────
  let ry = COLUMN_START_Y;
  ry = groupHeader(doc, t("GROUP_PANCHANG_DETAILS", lang), rightX, ry, colW);
  ry = kvTable(doc, [
    [t("KV_TITHI", lang),     translateTithi(data.panchang.tithi, lang)   || "—"],
    [t("KV_YOG", lang),       translateAny(data.panchang.yoga, lang)      || "—"],
    [t("KV_NAKSHATRA", lang), translateNakshatra(data.panchang.nakshatra, lang) || "—"],
    [t("KV_KARAN", lang),     translateAny(data.panchang.karana, lang)    || "—"]
  ], rightX, ry, colW);

  ry += 20;
  ry = groupHeader(doc, t("GROUP_ASTROLOGICAL_DETAILS", lang), rightX, ry, colW);
  ry = kvTable(doc, [
    [t("KV_VARNA", lang),          translateAny(data.astroDetails.varna, lang)          || "—"],
    [t("KV_VASHYA", lang),         translateAny(data.astroDetails.vashya, lang)         || "—"],
    [t("KV_YONI", lang),           translateAny(data.astroDetails.yoni, lang)           || "—"],
    [t("KV_GAN", lang),            translateAny(data.astroDetails.gan, lang)            || "—"],
    [t("KV_NADI", lang),           translateAny(data.astroDetails.nadi, lang)           || "—"],
    [t("KV_SIGN", lang),           translateSign(data.astroDetails.sign, lang)          || "—"],
    [t("KV_SIGN_LORD", lang),      translatePlanet(data.astroDetails.signLord, lang)    || "—"],
    [t("KV_NAKSHATRA", lang),      translateNakshatra(data.panchang.nakshatra, lang)    || "—"],
    [t("KV_NAKSHATRA_LORD", lang), translatePlanet(data.astroDetails.nakshatraLord, lang) || "—"],
    [t("KV_CHARAN", lang),         String(data.astroDetails.charan  ?? "—")],
    [t("KV_YUNJA", lang),          translateAny(data.astroDetails.yunja, lang)          || "—"],
    [t("KV_TATVA", lang),          translateAny(data.astroDetails.tatva, lang)          || "—"],
    [t("KV_NAME_ALPHABET", lang),  translateNameAlphabet(data.astroDetails.nameAlphabet, lang)   || "—"],
    [t("KV_PAYA", lang),           translateAny(data.astroDetails.paya, lang)           || "—"],
    [t("KV_ASCENDANT", lang),      translateSign(data.astroDetails.ascendant || data.ascendant.sign, lang) || "—"],
    [t("KV_ASCENDANT_LORD", lang), translatePlanet(data.astroDetails.ascendantLord, lang) || "—"]
  ], rightX, ry, colW);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 3 — PLANETARY POSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

function renderPlanetaryPositions(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_PLANETARY_POSITIONS", lang), y);

  // Wide table
  const rows = [...data.planets, {
    name: "Ascendant",
    sign: data.ascendant.sign,
    degree: data.ascendant.degree,
    signLord: data.astroDetails.ascendantLord || "—",
    nakshatra: "",
    nakshatraLord: "",
    house: 1,
    retrograde: false
  }].map(p => [
    translatePlanet(p.name, lang),
    p.retrograde ? t("VAL_YES_RETRO", lang) : t("VAL_NO_RETRO", lang),
    translateSign(p.sign, lang),
    degreesToDMS(p.degree),
    translatePlanet(p.signLord, lang) || "—",
    translateNakshatra(p.nakshatra, lang) || "—",
    translatePlanet(p.nakshatraLord, lang) || "—",
    String(p.house)
  ]);
  y = dataTable(doc,
    [
      t("COL_PLANETS", lang),
      t("COL_R", lang),
      t("COL_SIGN", lang),
      t("COL_DEGREES", lang),
      t("COL_SIGN_LORD", lang),
      t("COL_NAKSHATRA", lang),
      t("COL_NAKSHATRA_LORD", lang),
      t("COL_HOUSE", lang)
    ],
    rows, y,
    { cols: [68, 26, 68, 74, 64, 78, 84, 52] }
  );

  y += 4;

  // 3x3 grid of planet cards (glyph + details + intensity)
  const gap = 8;
  const cols = 3;
  const cw   = (CW - gap * (cols - 1)) / cols;
  const ch   = 82;

  data.planets.slice(0, 9).forEach((p, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cx  = M + col * (cw + gap);
    const cy  = y + row * (ch + gap);
    if (cy + ch > CB) return;

    // Card outline
    doc.roundedRect(cx, cy, cw, ch, 6).strokeColor(C.lightGray).lineWidth(0.6).stroke();

    // Glyph circle (left)
    const gx = cx + 28;
    const gy = cy + 30;
    const gr = 16;
    doc.circle(gx, gy, gr + 4).fill(C.pink);
    planetGlyph(doc, p.name, gx, gy, gr, PLANET_COLORS[p.name] ?? C.navy);

    // Name + sign + nakshatra (right)
    const tx = cx + 58;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
      .text(translatePlanet(p.name, lang), tx, cy + 12, { width: cw - 66, lineBreak: false });
    doc.font("Helvetica").fontSize(9).fillColor(C.ink)
      .text(translateSign(p.sign, lang) + (p.retrograde ? " (R)" : ""), tx, cy + 28, { width: cw - 66, lineBreak: false });
    doc.font("Helvetica").fontSize(9).fillColor(C.ink)
      .text(translateNakshatra(p.nakshatra, lang), tx, cy + 42, { width: cw - 66, lineBreak: false });

    // Intensity (translated for the active language)
    const col2 = intensityColor(p.intensity);
    const intensityKey = p.intensity === "Highly Favorable" ? "INTENSITY_HIGHLY_FAVORABLE"
                       : p.intensity === "Favorable"        ? "INTENSITY_FAVORABLE"
                       : p.intensity === "Unfavorable"      ? "INTENSITY_UNFAVORABLE"
                       :                                       "INTENSITY_NEUTRAL";
    doc.font("Helvetica-Bold").fontSize(10).fillColor(col2)
      .text(t(intensityKey, lang), cx + 12, cy + 62, { width: cw - 24 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 4 — HOROSCOPE CHARTS (Lagna big + Moon + Navamsa with descriptions)
// ═══════════════════════════════════════════════════════════════════════════════

function renderHoroscopeCharts(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_HOROSCOPE_CHARTS", lang), y);

  // Top row: big Lagna chart + description on right
  const chartW = 240;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy)
    .text(t("CHART_LAGNA_BIRTH", lang), M, y);
  y += 16;
  northIndianChart(doc, data.divisionalCharts.d1, M, y, chartW, lang, signIdxOf(data.ascendant.sign));

  const descX = M + chartW + 16;
  const descW = CW - chartW - 16;
  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
    .text(
      hi(lang)
        ? "लग्न जन्म के समय पूर्वी क्षितिज पर उदित होती राशि का अंश है। जातक चक्र या लग्न कुंडली में लग्न सबसे प्रभावशाली और महत्वपूर्ण राशि होती है। इस राशि को कुंडली का प्रथम भाव माना जाता है, और शेष भाव क्रमशः राशियों के अनुसार आगे बढ़ते हैं। इस प्रकार, लग्न केवल उदित होती राशि को ही नहीं, बल्कि कुंडली के सभी अन्य भावों को भी निर्धारित करती है।"
        : "Ascendant or Lagna is the degree of the sign which is rising on the eastern horizon at the time of birth. The Lagna is the most influential and important sign within the natal or lagna chart. This sign will be considered the first house of the horoscope, and the enumeration of the other houses follows in sequence through the rest of the signs of the zodiac. In this way, the Lagna does not only delineate the rising sign, but also all the other houses in the chart.",
      descX, y, { width: descW, align: "justify" }
    );

  y += chartW + 12;

  // Bottom row: Moon chart (left) + Navamsa (right) with labels below
  const halfW = (CW - 12) / 2;
  const bChartW = 176;
  const leftChartX  = M + (halfW - bChartW) / 2;
  const rightChartX = M + halfW + 12 + (halfW - bChartW) / 2;

  // Moon chart (चंद्र चार्ट): Moon's rashi becomes house 1 (was wrongly the
  // lagna chart). Navamsa (D9): drawn from the navamsa lagna, house-based.
  const moonIdx = signIdxOf((data.planets.find(p => p.name === "Moon") || {}).sign);
  const moonChart = houseChartFromLagna(data.planets, moonIdx);
  const nav = vargaChartFromLagna(data.planets, 9, data.ascendant.longitude);
  northIndianChart(doc, moonChart, leftChartX, y, bChartW, lang, moonIdx);
  northIndianChart(doc, nav.chart, rightChartX, y, bChartW, lang, nav.lagnaIdx);

  y += bChartW + 8;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy)
    .text(t("CHART_MOON", lang), M, y, { width: halfW, align: "center" });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy)
    .text(t("CHART_NAVAMSHA_D9", lang), M + halfW + 12, y, { width: halfW, align: "center" });
  y += 16;

  doc.font("Helvetica").fontSize(9).fillColor(C.ink)
    .text(
      hi(lang)
        ? "चंद्र चार्ट भविष्यवाणी का एक महत्वपूर्ण उपकरण है और ग्रह संयोगों के परिणाम तब अधिक प्रबल होते हैं जब योग या कुछ संयोग चंद्र और लग्न दोनों चार्ट में बनते हैं।"
        : "Moon Chart is an important tool of prediction and the results of planetary combinations are more prominent when the yogas or certain combinations happen in both Moon and Lagna Chart.",
      M + 6, y, { width: halfW - 12, align: "justify" }
    );
  doc.font("Helvetica").fontSize(9).fillColor(C.ink)
    .text(
      hi(lang)
        ? "नवांश चार्ट सबसे महत्वपूर्ण विभाजनात्मक चार्ट है। नवांश का अर्थ है किसी विशेष राशि का नवां भाग जिसमें प्रत्येक अंश 3 अंश 20 कला का होता है।"
        : "Navamsha Chart is the most important divisional chart. Navamsha means the ninth part of a particular Rashi in which each Amsa consists of 3 degrees and 20 minutes.",
      M + halfW + 18, y, { width: halfW - 12, align: "justify" }
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 5 — DIVISIONAL CHARTS (9-grid)
// ═══════════════════════════════════════════════════════════════════════════════

function renderDivisionalCharts(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_DIVISIONAL_CHARTS", lang), y);

  const cards = [
    { title: t("DCHART_SUN", lang),       data: data.divisionalCharts.d1,  desc: t("DCHART_DESC_SUN", lang) },
    { title: t("DCHART_HORA", lang),      data: data.divisionalCharts.d2,  desc: t("DCHART_DESC_HORA", lang) },
    { title: t("DCHART_DRESHKAN", lang),  data: data.divisionalCharts.d3,  desc: t("DCHART_DESC_DRESHKAN", lang) },
    { title: t("DCHART_CHATHURTH", lang), data: data.divisionalCharts.d4,  desc: t("DCHART_DESC_CHATHURTH", lang) },
    { title: t("DCHART_PANCH", lang),     data: data.divisionalCharts.d5 ?? data.divisionalCharts.d4, desc: t("DCHART_DESC_PANCH", lang) },
    { title: t("DCHART_SAPT", lang),      data: data.divisionalCharts.d7,  desc: t("DCHART_DESC_SAPT", lang) },
    { title: t("DCHART_ASHT", lang),      data: data.divisionalCharts.d8 ?? data.divisionalCharts.d7, desc: t("DCHART_DESC_ASHT", lang) },
    { title: t("DCHART_DASH", lang),      data: data.divisionalCharts.d10, desc: t("DCHART_DESC_DASH", lang) },
    { title: t("DCHART_DWAD", lang),      data: data.divisionalCharts.d12, desc: t("DCHART_DESC_DWAD", lang) }
  ];

  const gap   = 10;
  const cols  = 3;
  const cardSz = (CW - gap * (cols - 1)) / cols;
  const labelH = 18;
  const descH  = 14;

  cards.forEach((card, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cx = M + col * (cardSz + gap);
    const cy = y + row * (cardSz + labelH + descH + gap + 4);
    if (cy + cardSz + labelH + descH > CB) return;

    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.navy)
      .text(card.title, cx, cy, { width: cardSz, align: "center" });
    northIndianChart(doc, card.data, cx, cy + labelH, cardSz, lang);
    doc.font("Helvetica").fontSize(8).fillColor(C.gray)
      .text(card.desc, cx, cy + labelH + cardSz + 2, { width: cardSz, align: "center" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 6 — HOUSE CUSPS & SANDHI
// ═══════════════════════════════════════════════════════════════════════════════

function renderHouseCusps(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_HOUSE_CUSPS", lang), y);

  // Ascendant / Midheaven line
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy)
    .text(
      `${t("KV_ASCENDANT", lang)} - ${degreesToDMS(data.ascendant.degree)}     Midheaven - ${degreesToDMS((data.ascendant.degree + 270) % 360)}`,
      M, y
    );
  y += 20;

  const rows = data.houses.map((h, i) => [
    String(h.house),
    translateSign(h.sign, lang),
    degreesToDMS(h.cuspMiddle % 30),
    translateSign(h.sign, lang), // astronext duplicates the sign for the sandhi column
    degreesToDMS(data.houseCusps?.[i]
      ? parseFloat(data.houseCusps[i].sandhiDegree) || h.cuspEnd % 30
      : h.cuspEnd % 30)
  ]);
  y = dataTable(doc,
    [t("COL_HOUSE", lang), t("COL_SIGN", lang), t("COL_BHAV_MADHYA", lang), t("COL_SIGN", lang), t("COL_BHAV_SANDHI", lang)],
    rows, y,
    { cols: [56, 90, 130, 90, 149] }
  );

  y += 8;

  // Chalit Chart + description
  const chartSz = 180;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy)
    .text(t("CHART_CHALIT", lang), M, y, { width: chartSz, align: "center" });
  y += 16;
  northIndianChart(doc, data.divisionalCharts.chalit || data.divisionalCharts.d1, M, y, chartSz, lang);

  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
    .text(
      hi(lang)
        ? "लग्न कुंडली का शोधन चलित कुंडली है। अंतर इतना है कि लग्न कुंडली जन्म के समय की लग्न और सभी ग्रहों की राशि-स्थिति दर्शाती है, जबकि चलित कुंडली से स्पष्ट होता है कि जन्म-समय किस भाव में कौन सी राशि का प्रभाव है और किस भाव पर कौन सा ग्रह दृष्टि डाल रहा है।"
        : "House cusps are imaginary boundary lines for the Houses, similar to the way Sign cusps are boundary lines for the Signs. The Cusp is the most important and powerful point of a house. Planets located at the cusp have the strongest effect and most typical meaning of the house.",
      M + chartSz + 14, y, { width: CW - chartSz - 14, align: "justify" }
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGES 7–8 — VIMSHOTTARI DASHA (6-box grid)
// ═══════════════════════════════════════════════════════════════════════════════

function renderVimshottariPage(doc, report, slice, pageNum, isLast) {
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, `${t("PAGE_VIMSHOTTARI_DASHA", lang)} - ${pageNum}`, y);

  const cols = 3;
  const gap  = 12;
  const boxW = (CW - gap * (cols - 1)) / cols;
  const boxH = 248;

  slice.forEach((period, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = M + col * (boxW + gap);
    const bY = y + row * (boxH + 18);
    mahaDashaBox(doc, period, x, bY, boxW, boxH, lang);
  });

  // On the last page, append "Current Undergoing Dasha" table
  if (isLast) {
    const data = report.kundliData;
    const rowsUsed = Math.ceil(slice.length / cols);
    let cy = y + rowsUsed * (boxH + 18) + 8;

    if (cy > CB - 100) return;

    cy = groupHeader(doc, t("GROUP_CURRENT_DASHA", lang), M, cy, CW);

    const active = data.dashas.vimshottariTimeline.find(d => d.mahaDasha === data.dashas.currentMahaDasha);
    // Antardasha: its own start/end within the mahadasha (not the mahadasha's).
    const activeAntar = active
      ? computeAntardashas(data.dashas.currentMahaDasha, active.start, active.end).find(a => a.lord === data.dashas.currentAntarDasha)
      : undefined;
    // Pratyantar: a sub-period of the antardasha — compute within it, don't
    // reuse the antardasha's dates (that was the bug).
    const activePraty = activeAntar
      ? computeAntardashas(activeAntar.lord, activeAntar.start, activeAntar.end).find(p => p.lord === data.dashas.currentPratyantarDasha)
      : undefined;

    const statusRows = [
      [t("DASHA_MAHA", lang),      translatePlanet(data.dashas.currentMahaDasha, lang),       active?.start ?? "—",      active?.end ?? "—"],
      [t("DASHA_ANTAR", lang),     translatePlanet(data.dashas.currentAntarDasha, lang),      activeAntar?.start ?? "—", activeAntar?.end ?? "—"],
      [t("DASHA_PRTYANTAR", lang), translatePlanet(data.dashas.currentPratyantarDasha, lang), activePraty?.start ?? "—", activePraty?.end ?? "—"],
    ];
    cy = dataTable(doc,
      [t("COL_DASHA_NAME", lang), t("COL_PLANETS", lang), t("COL_START_DATE", lang), t("COL_END_DATE", lang)],
      statusRows, cy,
      { cols: [140, 120, 130, 125] });

    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.navy)
      .text(t("DASHA_NOTE", lang), M, cy);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 9 — FAVOURABLE POINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Destiny Number: sum of DOB digits reduced to 1-9.
// Radical Number: sum of day-of-month digits reduced to 1-9.
// Name Number: Chaldean numerology of full name reduced to 1-9.
function reduceToNumber(n) {
  while (n > 9) n = String(n).split("").reduce((a, c) => a + parseInt(c, 10), 0);
  return n;
}

function destinyNumber(dob) {
  const digits = dob.replace(/[^0-9]/g, "").split("").reduce((a, c) => a + parseInt(c, 10), 0);
  return reduceToNumber(digits);
}

function radicalNumber(dob) {
  const day = parseInt(dob.split("-")[2], 10);
  return reduceToNumber(day);
}

const CHALDEAN = {
  A:1,I:1,J:1,Q:1,Y:1,
  B:2,K:2,R:2,
  C:3,G:3,L:3,S:3,
  D:4,M:4,T:4,
  E:5,H:5,N:5,X:5,
  U:6,V:6,W:6,
  O:7,Z:7,
  F:8,P:8
};

function nameNumber(name) {
  const n = name.toUpperCase().split("").reduce((a, c) => a + (CHALDEAN[c] ?? 0), 0);
  return reduceToNumber(n);
}

const RADICAL_RULER = {
  1: { ruler:"Sun",     friendly:"1,2,4,7", neutral:"3,5,6",  evil:"8,9",    days:"Sunday, Monday, Tuesday", stone:"Ruby",              subStone:"Red Garnet, Red Spinel", god:"Vishnu", metal:"Gold",   color:"Yellow, Orange, Red", mantra:"|| Om Hraam Hreem Hroum Sah Suryay Namah ||" },
  2: { ruler:"Moon",    friendly:"1,2,7",   neutral:"3,5,6",  evil:"4,8,9",  days:"Monday, Friday",          stone:"Pearl",             subStone:"Moonstone, Opal",        god:"Durga",  metal:"Silver", color:"White, Light Green",  mantra:"|| Om Shraam Shreem Shroum Sah Chandray Namah ||" },
  3: { ruler:"Jupiter", friendly:"3,6,9",   neutral:"1,2,5",  evil:"4,7,8",  days:"Thursday, Friday",        stone:"Yellow Sapphire",   subStone:"Topaz, Citrine",         god:"Brihaspati", metal:"Gold", color:"Yellow", mantra:"|| Om Graam Greem Groum Sah Gurave Namah ||" },
  4: { ruler:"Rahu",    friendly:"1,5,7",   neutral:"2,8",    evil:"3,6,9",  days:"Saturday, Sunday",        stone:"Gomed",             subStone:"Hessonite",              god:"Durga",      metal:"Ashtdhatu", color:"Grey, Electric Blue", mantra:"|| Om Bhraam Bhreem Bhroum Sah Rahave Namah ||" },
  5: { ruler:"Mercury", friendly:"1,3,5,6", neutral:"2,4,7",  evil:"8,9",    days:"Wednesday, Friday",       stone:"Emerald",           subStone:"Green Onyx, Peridot",    god:"Ganesha",    metal:"Gold",   color:"Green, Light Blue",   mantra:"|| Om Braam Breem Broum Sah Budhay Namah ||" },
  6: { ruler:"Venus",   friendly:"4,3,9",   neutral:"2,5,7",  evil:"1,8",    days:"Thursday, Tuesday, Friday", stone:"Diamond, Opal",   subStone:"Zircon, White Sapphire", god:"Devi",       metal:"Silver", color:"White",               mantra:"|| Om Shum Shukray Namah ||" },
  7: { ruler:"Ketu",    friendly:"1,2,4",   neutral:"3,5,6",  evil:"8,9",    days:"Sunday, Monday",          stone:"Cat's Eye",         subStone:"Tiger's Eye",            god:"Ganesha",    metal:"Silver", color:"Variegated, Pale Colors", mantra:"|| Om Straam Streem Stroum Sah Ketave Namah ||" },
  8: { ruler:"Saturn",  friendly:"5,6,8",   neutral:"3,7",    evil:"1,2,4,9",days:"Saturday, Sunday",        stone:"Blue Sapphire",     subStone:"Amethyst, Lapis Lazuli", god:"Shani",      metal:"Iron",   color:"Dark Blue, Black",    mantra:"|| Om Praam Preem Proum Sah Shanaishcharay Namah ||" },
  9: { ruler:"Mars",    friendly:"3,5,9",   neutral:"1,2,7",  evil:"4,6,8",  days:"Tuesday, Thursday",       stone:"Red Coral",         subStone:"Carnelian, Jasper",      god:"Hanuman",    metal:"Gold",   color:"Red, Pink",           mantra:"|| Om Kraam Kreem Kraum Sah Bhaumay Namah ||" }
};

function renderFavourablePoints(doc, report) {
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_FAVOURABLE_POINTS", lang), y);

  const name   = report.request.fullName;
  const dob    = report.request.birthDate;
  const destiny = destinyNumber(dob);
  const radical = radicalNumber(dob);
  const nname   = nameNumber(name);

  // 3 big colored numbers
  const cw = CW / 3;
  y += 4;
  bigNumberBlock(doc, String(destiny), t("LBL_DESTINY_NUMBER", lang), M,          y, cw, C.green);
  bigNumberBlock(doc, String(radical), t("LBL_RADICAL_NUMBER", lang), M + cw,     y, cw, C.orange);
  bigNumberBlock(doc, String(nname),   t("LBL_NAME_NUMBER", lang),    M + cw * 2, y, cw, C.blue);
  y += 112;

  const ruler = hi(lang)
    ? (RADICAL_RULER_HI[radical] ?? RADICAL_RULER_HI[1])
    : (RADICAL_RULER[radical]    ?? RADICAL_RULER[1]);
  kvTable(doc, [
    [t("KV_YOUR_NAME", lang),             name],
    [t("KV_DATE_OF_BIRTH", lang),         formatDateSlashes(dob).replace(/\//g, "-")],
    [t("KV_RADICAL_NUMBER", lang),        String(radical)],
    [t("KV_RADICAL_RULER", lang),         ruler.ruler],
    [t("KV_FRIENDLY_NUMBERS", lang),      ruler.friendly],
    [t("KV_NEUTRAL_NUMBERS", lang),       ruler.neutral],
    [t("KV_EVIL_NUMBERS", lang),          ruler.evil],
    [t("KV_FAVOURABLE_DAYS", lang),       ruler.days],
    [t("KV_FAVOURABLE_STONE", lang),      ruler.stone],
    [t("KV_FAVOURABLE_SUB_STONE", lang),  ruler.subStone],
    [t("KV_FAVOURABLE_GOD", lang),        ruler.god],
    [t("KV_FAVOURABLE_METAL", lang),      ruler.metal],
    [t("KV_FAVOURABLE_COLOR", lang),      ruler.color],
    [t("KV_FAVOURABLE_MANTRA", lang),     ruler.mantra]
  ], M, y, CW, { rowH: 24, labelFraction: 0.32 });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 10 — NUMEROLOGY REPORT (About You + Favourable Time)
//  PAGE 11 — Favourable Gayatri Mantra
// ═══════════════════════════════════════════════════════════════════════════════

const NUMEROLOGY_NARRATIVE = {
  1: {
    about: [
      "Your Radical number is 1. Its ruling planet is the Sun. Due to the influence of Radical number 1, you carry a natural authority and an instinct to lead. You are original, self-reliant and ambitious; you prefer to set the direction yourself rather than follow someone else's.",
      "You value independence and dislike being told what to do. You can be proud, generous with those you care about, and stubbornly loyal. Learning to listen as well as to lead is your quiet work."
    ],
    time: [
      "The Sun is strongest in Leo (21 July – 21 August western, or around 17 August – 16 September in the Indian view) and exalted in Aries (around 14 April – 14 May). These windows are especially lucky for beginning important work."
    ],
    gayatri: "In order to increase the benefic effects of the Sun you should recite the Surya Gayatri Mantra in the morning 11, 21 or 108 times. Mantra : || Om Aadityaay Vidmahe Sahasrakiranaay Dheemahi Tanno Suryah Prachodayat ||"
  },
  2: {
    about: [
      "Your Radical number is 2. Its ruling planet is the Moon. You are sensitive, imaginative and nurturing; you feel the mood of a room as soon as you enter it. Relationships matter to you deeply.",
      "You prefer harmony to confrontation and can sometimes take on the emotions of others as if they were your own. Rest, rhythm and water-based practices (hydration, baths, swimming) help you stay balanced."
    ],
    time: [
      "The Moon is at its best around full-moon phases and in Cancer (around 16 July – 16 August in the Indian view). Launch initiatives close to the full moon for extra support."
    ],
    gayatri: "In order to increase the benefic effects of the Moon you should recite the Chandra Gayatri Mantra at night 11, 21 or 108 times. Mantra : || Om Padmadhwajaay Vidmahe Hemaroopaay Dheemahi Tanno Chandrah Prachodayat ||"
  },
  3: {
    about: [
      "Your Radical number is 3. Its ruling planet is Jupiter. You are optimistic, generous, and philosophically inclined. Knowledge, teaching and honest guidance energise you.",
      "You are a natural expander — your presence makes situations bigger, funnier, more hopeful. Your challenge is to keep your promises proportional to your enthusiasm."
    ],
    time: [
      "Thursday and Jupiter transits through Sagittarius or Pisces are auspicious for starting new ventures, signing contracts and teaching."
    ],
    gayatri: "Recite the Guru Gayatri Mantra on Thursday mornings 11, 21 or 108 times. Mantra : || Om Vrishabhdhwajaay Vidmahe Kritidhwajaay Dheemahi Tanno Guruh Prachodayat ||"
  },
  4: {
    about: [
      "Your Radical number is 4. Its ruling planet is Rahu. You think differently from the crowd — you see patterns others miss and often take unconventional paths to success.",
      "You do well with technology, foreign interests and anything that requires lateral thinking. Your work is to stay grounded when the mind races."
    ],
    time: [
      "Saturdays and transitional hours (early dawn, late evening) favour you. Begin long-term projects on Amavasya or solar eclipse days only after consultation."
    ],
    gayatri: "Recite the Rahu Gayatri Mantra 11, 21 or 108 times on Saturday. Mantra : || Om Shirorupaay Vidmahe Amritesh Dheemahi Tanno Rahuh Prachodayat ||"
  },
  5: {
    about: [
      "Your Radical number is 5. Its ruling planet is Mercury. You are quick-witted, communicative, adaptable and naturally social. Variety keeps you alive.",
      "You learn faster than you teach, and you teach faster than you commit. Your edge is sharpness; your challenge is depth."
    ],
    time: [
      "Wednesdays and the Sun in Gemini / Virgo are especially lucky — 14 May to 14 July in the Indian view. Schedule communication-heavy work in these windows."
    ],
    gayatri: "Recite the Budh Gayatri Mantra on Wednesday mornings 11, 21 or 108 times. Mantra : || Om Gajdhwajaay Vidmahe Sukhahastaay Dheemahi Tanno Budhah Prachodayat ||"
  },
  6: {
    about: [
      "Your Radical number is 6. Its ruling planet is Venus. Due to the influence of Radical number 6, you will have magnetic attraction. You will be affable and fond of friends. Due to these properties you will be liked by people. It will be natural for you to be attracted towards beauty and beautiful things. You will be fascinated by opposite sex, and to keep relations with beautiful men/women and to chat with them will be your nature. You will be interested in fine arts, which you can also opt as your career or business. You will be fond of music, literature, paintings and sculptures.",
      "You will fancy good clothes and well-decorated homes. You will pride in entertaining guests. You would love to keep all articles in your home and office well decorated and to maintain choicest furniture, curtains, etc. By nature you will be a little headstrong. You will try to ensure that any person talking to you accepts your viewpoint. Sticking to your views and jealousies are also part of your nature. It will be difficult for you to tolerate competition in your work. This may lead to stress and guilt. You will maintain your expertise in winning hearts. You will have plenty of friends as you are adept in winning attachment."
    ],
    time: [
      "According to the western view the Sun is in Taurus from 21st April to 21st May and in Libra from 24th September to 23rd October. According to the Indian view these periods are 13th May to 14th June and from 17th October to 13th November.",
      "These signs belong to Venus and from 14th March to 12th April i.e. in Pisces, Venus is exalted. Therefore the above-mentioned periods are lucky for persons belonging to Radical number 6 for starting any new work or for an important work."
    ],
    gayatri: "In order to increase the benefic effects of Venus you should recite the Sukra Gayatri Mantra in the morning 11, 21 or 108 times. Mantra : || Om Bhrigujay Vidmahe Divyadehay Dheemahi Tanno Shukrah Prachodyat ||"
  },
  7: {
    about: [
      "Your Radical number is 7. Its ruling planet is Ketu. You are introspective, mystical and original — happiest alone with ideas or with one or two people who truly see you.",
      "You are drawn to research, healing, spirituality and unusual pursuits. Your challenge is staying in the world when your instinct is to retreat from it."
    ],
    time: [
      "Tuesdays and the Moon in Cancer or Pisces are favourable. Solitude and long walks near water are deeply restorative for you."
    ],
    gayatri: "Recite the Ketu Gayatri Mantra on Tuesday 11, 21 or 108 times. Mantra : || Om Padmapatraay Vidmahe Amritesh Dheemahi Tanno Ketuh Prachodayat ||"
  },
  8: {
    about: [
      "Your Radical number is 8. Its ruling planet is Saturn. You build slowly and you build to last. Discipline, responsibility and a long view are your natural assets.",
      "Life tests you early and often — not as punishment but as refinement. Your greatest successes come after sustained effort, not shortcuts."
    ],
    time: [
      "Saturday is your power day. Long-term investments, legal matters and elder-focused work go especially well for you."
    ],
    gayatri: "Recite the Shani Gayatri Mantra on Saturday 11, 21 or 108 times. Mantra : || Om Kaakdhwajaay Vidmahe Khadgahastaay Dheemahi Tanno Mandah Prachodayat ||"
  },
  9: {
    about: [
      "Your Radical number is 9. Its ruling planet is Mars. You have energy, courage and a pioneering spirit. You work best when you have a clear mission and room to move.",
      "You are protective of those you love and can be fierce in a fight — including fights that were never really yours. Channelling your Mars into service rather than reaction is the lifelong practice."
    ],
    time: [
      "Tuesdays and the Sun in Aries or Scorpio are especially lucky. Short retreats, competitive sports and focused physical training all benefit you."
    ],
    gayatri: "Recite the Mangal Gayatri Mantra on Tuesday 11, 21 or 108 times. Mantra : || Om Veerdhwajaay Vidmahe Vighnahastaay Dheemahi Tanno Bhaumah Prachodayat ||"
  }
};

function renderNumerologyReport(doc, report) {
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_NUMEROLOGY_REPORT", lang), y);

  const rad = radicalNumber(report.request.birthDate);
  const data = hi(lang)
    ? (NUMEROLOGY_NARRATIVE_HI[rad] ?? NUMEROLOGY_NARRATIVE_HI[6])
    : (NUMEROLOGY_NARRATIVE[rad]    ?? NUMEROLOGY_NARRATIVE[6]);

  y = groupHeader(doc, t("GROUP_ABOUT_YOU", lang), M, y, CW);
  y = bodyText(doc, data.about, y);

  y += 6;
  y = groupHeader(doc, t("GROUP_FAVOURABLE_TIME", lang), M, y, CW);
  y = bodyText(doc, data.time, y);
}

function renderGayatriMantra(doc, report) {
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_GAYATRI_MANTRA", lang), y);

  const rad = radicalNumber(report.request.birthDate);
  const data = hi(lang)
    ? (NUMEROLOGY_NARRATIVE_HI[rad] ?? NUMEROLOGY_NARRATIVE_HI[6])
    : (NUMEROLOGY_NARRATIVE[rad]    ?? NUMEROLOGY_NARRATIVE[6]);

  y += 10;
  y = bodyText(doc, [data.gayatri], y);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGES 12–13 — KALSARPA DOSHA + EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

function renderKalsarpaDosha(doc, report, section) {
  const data = report.kundliData;
  const lang = report.request.language;
  const present = data.doshas.kaalSarp;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_KALSARPA_DOSHA", lang), y);

  // Illustration + intro text side by side
  const illustSz = 128;
  drawKalsarpaArt(doc, M, y, illustSz);
  const textX = M + illustSz + 14;
  const textW = CW - illustSz - 14;
  const kIntro1 = hi(lang)
    ? KALSARPA_INTRO_1_HI
    : "Rahu and Ketu are two nodes of the Moon and they are regarded as full-fledged planets in Vedic Astrology. They are considered as the most dreaded planets due to their heavy karmic effects. If all the 7 planets are situated between Rahu and Ketu then Kaal Sarp Yog is formed.";
  const kIntro2 = hi(lang)
    ? KALSARPA_INTRO_2_HI
    : "Most of the Kalasarpa dosha effects are negative, while few can be positive too. Rahu or Ketu gives sudden positive changes which are huge and can happen overnight or within a span of a few days.";
  doc.font("Helvetica").fontSize(10).fillColor(C.ink)
    .text(kIntro1, textX, y, { width: textW, align: "justify" });
  const line1H = doc.heightOfString(kIntro1, { width: textW, align: "justify" });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink)
    .text(kIntro2, textX, y + line1H + 6, { width: textW, align: "justify" });
  y += illustSz + 14;

  // 12 colored chips (4x3)
  const chipGap = 10;
  const chipCols = 4;
  const chipW = (CW - chipGap * (chipCols - 1)) / chipCols;
  const chipH = 28;
  KALASARPA_NAMES.forEach((n, i) => {
    const row = Math.floor(i / chipCols);
    const col = i % chipCols;
    const x = M + col * (chipW + chipGap);
    const cy = y + row * (chipH + chipGap);
    doc.roundedRect(x, cy, chipW, chipH, 3).fill(KALASARPA_CHIP_COLORS[i] ?? C.lightGray);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white)
      .text(translateAny(n, lang), x, cy + 9, { width: chipW, align: "center" });
  });
  y += Math.ceil(KALASARPA_NAMES.length / chipCols) * (chipH + chipGap) + 4;

  // Section header
  y = groupHeader(doc, t("GROUP_KALSARPA_PRESENCE", lang), M, y, CW, { align: "left" });

  // Left panel: face + text. Right panel: Kalsarpa Name + Direction boxes.
  const halfW = (CW - 14) / 2;
  const panelH = 128;

  // ── Left panel ──────────────
  doc.roundedRect(M, y, halfW, panelH, 4).strokeColor(C.lightGray).lineWidth(0.7).stroke();
  const faceCol = present ? C.red : C.green;
  // Face (drawn, not emoji)
  const fcx = M + halfW / 2;
  const fcy = y + 30;
  doc.circle(fcx, fcy, 16).strokeColor(faceCol).lineWidth(1.5).stroke();
  // Eyes
  doc.circle(fcx - 5, fcy - 2, 1.4).fill(faceCol);
  doc.circle(fcx + 5, fcy - 2, 1.4).fill(faceCol);
  // Mouth
  if (present) {
    doc.moveTo(fcx - 6, fcy + 8).bezierCurveTo(fcx - 2, fcy + 3, fcx + 2, fcy + 3, fcx + 6, fcy + 8)
      .strokeColor(faceCol).lineWidth(1.2).stroke();
  } else {
    doc.moveTo(fcx - 6, fcy + 6).bezierCurveTo(fcx - 2, fcy + 10, fcx + 2, fcy + 10, fcx + 6, fcy + 6)
      .strokeColor(faceCol).lineWidth(1.2).stroke();
  }
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(present ? t("KALSARPA_PRESENT", lang) : t("KALSARPA_NOT_PRESENT", lang), M, y + 62, { width: halfW, align: "center" });
  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
    .text(
      hi(lang)
        ? (present ? KALSARPA_FACE_PRESENT_HI : KALSARPA_FACE_ABSENT_HI)
        : (present
          ? "You have descending kalsarpa dosha direction, which is not very powerful. The KalSarpa Dosha is having full effect in your horoscope."
          : "All seven physical planets are distributed across both sides of the Rahu-Ketu axis. Kaal Sarp Yog is not formed."),
      M + 12, y + 84, { width: halfW - 24, align: "center" }
    );

  // ── Right panel ─────────────
  const rX = M + halfW + 14;
  doc.roundedRect(rX, y, halfW, panelH, 4).strokeColor(C.lightGray).lineWidth(0.7).stroke();
  const ksName = present ? translateAny(getKalsarpaName(data), lang).toUpperCase() : t("KALSARPA_NONE", lang);
  // Kalsarpa Name
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(t("KALSARPA_NAME_LABEL", lang), rX, y + 10, { width: halfW, align: "center" });
  doc.moveTo(rX + halfW / 2 - 22, y + 28).lineTo(rX + halfW / 2 + 22, y + 28).strokeColor(C.crimson).lineWidth(0.8).stroke();
  doc.roundedRect(rX + halfW / 2 - 60, y + 34, 120, 22, 2).fill(present ? C.orange : C.lightGray);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.white)
    .text(ksName, rX + halfW / 2 - 60, y + 40, { width: 120, align: "center" });
  // Direction
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(t("KALSARPA_DIRECTION_LABEL", lang), rX, y + 68, { width: halfW, align: "center" });
  doc.moveTo(rX + halfW / 2 - 18, y + 86).lineTo(rX + halfW / 2 + 18, y + 86).strokeColor(C.crimson).lineWidth(0.8).stroke();
  doc.roundedRect(rX + halfW / 2 - 80, y + 92, 160, 22, 2).fill(present ? C.orange : C.lightGray);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.white)
    .text(present ? t("KALSARPA_FULL_DESCENDING", lang) : t("KALSARPA_NOT_FORMED", lang), rX + halfW / 2 - 80, y + 98, { width: 160, align: "center" });

  // Silence unused var in the closure
  void section;
}

function renderKalsarpaEffect(doc, report, section) {
  const data = report.kundliData;
  const lang = report.request.language;
  const present = data.doshas.kaalSarp;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_KALSARPA_DOSHA_EFFECT", lang), y);

  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(t("KALSARPA_REPORT_TITLE", lang), M, y);
  y += 20;

  const narrative = section?.body?.length ? section.body : (hi(lang) ? (present ? [
    `आपकी जन्म कुंडली में ${translateAny(getKalsarpaName(data), lang)} कालसर्प योग उपस्थित है। इस कारण वैवाहिक जीवन सामान्य रहते हुए भी कष्टप्रद और बाधित हो सकता है। प्रेम-संबंधों में जातक प्रायः असफल रहता है अथवा मनचाहा जीवनसाथी नहीं मिलता। समय-समय पर रोग, मानसिक अशांति और आत्मविश्वास की कमी बनी रहती है। यात्राएँ अधिक होती हैं किन्तु वांछित सफलता दूर रहती है। शत्रु षड्यंत्र रचते हैं और हानि पहुँचाने का प्रयास करते हैं। पूजा-पाठ, दान-धर्म एवं आध्यात्मिक कार्यों में रुचि कम रहती है। इस प्रकार के कालसर्प योग वाले जातक को सेना अथवा शस्त्रबल से जुड़े कार्यों से दूर रहना चाहिए। आर्थिक स्थिति सामान्य रहती है, कानूनी मामलों में सफलता मिलती है तथा राजनीति में जातक उन्नति करता है।`
  ] : [
    "आपकी कुंडली में सक्रिय कालसर्प योग नहीं है — सातों भौतिक ग्रह राहु-केतु अक्ष के दोनों ओर वितरित हैं, बीच में सीमित नहीं। अतः इस विशेष दोष से जीवन की प्रगति बाधित नहीं होती और राहु-केतु अपनी-अपनी भाव-स्थिति के अनुसार सामान्य कर्म-प्रेरक की भूमिका में रहते हैं।",
    `दोष के अनुपस्थित होने से विशेष कालसर्प उपायों की आवश्यकता नहीं है। आपकी वर्तमान ${translatePlanet(data.dashas.currentMahaDasha, lang)} महादशा से संबंधित सामान्य ग्रह-शान्ति उपाय और भाव/षड्बल के अनुसार दुर्बल ग्रहों के सामान्य उपाय आपके लिए अधिक प्रभावी सिद्ध होंगे।`
  ]) : (present ? [
    `In your horoscope the ${getKalsarpaName(data)} Kaal Sarp Yog is present. Due to this reason the married life though normal could be painful and disturbed. The native remains unsuccessful in his love affairs or he may not be blessed with a desired spouse. The native may be ill from time to time. The worries and mental unrest do not leave the native due to one reason or other. His confidence may be lacking. The native travels a lot but success is not there. The enemies of the native hatch conspiracies against him and try to cause harm. The native does not take much interest in worship, recitations, alms or other religious activities. The character of the native remains dubious. Due to Kaal Sarp Yog of this type the native should not work in army. The native sees bad dreams from time to time such as snakes, fearful scenes, hanging, etc. The financial position of the native remains normal. He is good in legal matters and is successful in politics.`
  ] : [
    "Your chart does not show an active Kaal Sarp Yog — the seven physical planets are distributed across both sides of the Rahu-Ketu axis rather than being hemmed between them. Life progress is not obstructed by this particular dosha, and the nodes behave as normal karmic accelerators on the houses they occupy.",
    `Because the dosha is absent, specific Kaal Sarp remedies are not required. Standard planetary remedies relating to the active ${data.dashas.currentMahaDasha} Mahadasha and to any weak graha by house or Shadbala will be more relevant in your case.`
  ]));
  y = bodyText(doc, narrative, y);

  y += 6;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(t("KALSARPA_REMEDIES_TITLE", lang), M, y);
  y += 20;

  const remedies = section?.bullets?.length ? section.bullets : (hi(lang) ? (present ? [
    "कालसर्प दोष निवारण यंत्र घर में स्थापित कर उसका नियमित पूजन करें।",
    "हनुमान चालीसा का 108 बार पाठ करें।",
    "घर में मयूर (मोर) पंख रखें।",
    "शुभ मुहूर्त में बहते जल में कोयला तीन बार प्रवाहित करें।",
    "राहु की दशा में प्रतिदिन एक माला राहु मंत्र का जप करें; 18 हजार जप पूर्ण होने पर दूर्वा से पूर्णाहुति हवन करवाएँ और किसी निर्धन को उड़द एवं नीले वस्त्र का दान करें।",
    "महामृत्युंजय मंत्र का प्रतिदिन 11 माला जप करें, जब तक राहु-केतु की दशा-अंतर्दशा रहे; प्रत्येक शनिवार को श्रीशनिदेव का तैलाभिषेक करें।",
    "श्रावण मास में 30 दिनों तक महादेव का अभिषेक करें।",
    "14 मुखी रुद्राक्ष अथवा 8+9 मुखी रुद्राक्षों का संयुक्त धारण करें।"
  ] : [
    "विशेष कालसर्प उपायों की आवश्यकता नहीं है।",
    "अपनी सक्रिय महादशा के स्वामी से संबंधित सामान्य ग्रह-शान्ति उपाय निरंतर करते रहें।",
    "प्रत्येक अमावस्या को पितरों का स्मरण और तर्पण करें — यह सभी जातकों के लिए शुभ है।"
  ]) : (present ? [
    "Following are the remedies for Kalsarpa dosha —",
    "Rudrabhisheka — a puja to Lord Shiva can be performed on a solar or lunar eclipse or on Mahashivratri at Mahakaleshwar temple, Ujjain.",
    "Install an energised Kaal Sarpa Yog yantra at the place of veneration or puja room at home and worship it daily.",
    "Get a Kalsarpa dosha nivaran pooja performed on a Wednesday or Friday to negate the malefic effects of Rahu.",
    "Get a Dashansh Homa or Yajna done on Nag Panchami day in the month of Shravan in a temple or near a holy river.",
    "Donate fresh radish.",
    "Wear a 14-faced rudraksha or a combination of 8+9 faced rudraksha."
  ] : [
    "No Kaal Sarp remedies required.",
    "Maintain regular remedies for your active Mahadasha lord.",
    "Honour your ancestors on Amavasya each month — a universally helpful practice."
  ]));
  remediesBox(doc, remedies, y);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGES 14–15 — MANGLIK ANALYSIS I & II
// ═══════════════════════════════════════════════════════════════════════════════

function renderManglikAnalysisI(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, `${t("PAGE_MANGLIK_ANALYSIS", lang)} - I`, y);

  // Illustration + intro
  const illustSz = 120;
  drawMangalikArt(doc, M, y, illustSz);

  const tX = M + illustSz + 14;
  const tW = CW - illustSz - 14;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(t("MANGLIK_WHAT_IS", lang), tX, y);
  doc.font("Helvetica").fontSize(10).fillColor(C.ink)
    .text(
      hi(lang) ? MANGLIK_INTRO_1_HI
        : "In the boy's or the girl's horoscope when Mars, Sun, Saturn, Rahu or Ketu is in the ascendant, fourth house, seventh house, eighth house or twelfth house — that combination is called Manglik dosh.",
      tX, y + 22, { width: tW, align: "justify" }
    );
  doc.font("Helvetica").fontSize(10).fillColor(C.ink)
    .text(
      hi(lang) ? MANGLIK_INTRO_2_HI
        : "Manglik dosh is considered stronger when Mars is placed in the ascendant than when Mars is conjoined with Moon in the ascendant. If, according to the Shastras, the Manglik dosh of both partners is getting cancelled then they are guaranteed a happily married life.",
      tX, y + 68, { width: tW, align: "justify" }
    );

  y += illustSz + 16;
  const mIntro3 = hi(lang) ? MANGLIK_INTRO_3_HI
    : "On the other hand, if this Manglik dosh is not cancelled then they are likely to face unnecessary problems and hurdles in life. One must begin his/her married life after getting their horoscopes thoroughly matched. After getting the Manglik dosh properly cancelled the native shall be bestowed with a peaceful and wealthy life.";
  doc.font("Helvetica").fontSize(10).fillColor(C.ink)
    .text(mIntro3, M, y, { width: CW, align: "justify" });
  y += doc.heightOfString(mIntro3, { width: CW }) + 8;

  // Sanskrit shloka — Devanagari when Hindi, transliteration otherwise.
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.red)
    .text(hi(lang) ? SHLOKA_LAGNE_VYAYE_HI : "|| Lagne Vyaye Sukhe Vaapi Saptame Vaa Ashtame Kuje ||", M, y, { width: CW, align: "center" });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.red)
    .text(hi(lang) ? SHLOKA_SHUBH_DRIG_HI : "|| Shubh Drig Yog Heene Cha Patim Hanti Na Sanshayam ||", M, y + 18, { width: CW, align: "center" });
  y += 48;

  // Analysis header + percentage
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(t("MANGLIK_ANALYSIS_TITLE", lang), M, y);
  y += 18;

  const pct = manglikPercent(data);
  doc.rect(M, y, CW, 36).fill(C.bgGray);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.orange)
    .text(t("MANGLIK_TOTAL_PCT", lang), M + 20, y + 11, { width: CW - 130 });
  doc.roundedRect(W - M - 110, y + 2, 100, 32, 3).fill(C.orange);
  doc.font("Helvetica-Bold").fontSize(20).fillColor(C.white)
    .text(`${pct}%`, W - M - 110, y + 8, { width: 100, align: "center" });
  y += 50;

  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(t("MANGLIK_REPORT_TITLE", lang), M, y);
  y += 20;
  doc.font("Helvetica").fontSize(10).fillColor(C.ink)
    .text(
      hi(lang)
        ? (pct > 0 ? MANGLIK_REPORT_PRESENT_HI : MANGLIK_REPORT_ABSENT_HI)
        : (pct > 0
          ? "The Manglik dosha is present in your horoscope; however it is less effective. With some remedies related to Manglik dosha this can be reduced further."
          : "The Manglik dosha is not present in your horoscope. Mars is placed harmoniously and marriage life is generally supported."),
      M, y, { width: CW, align: "justify" }
    );
}

function renderManglikAnalysisII(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  const mars = data.planets.find(p => p.name === "Mars");
  const ketu = data.planets.find(p => p.name === "Ketu");
  const saturn = data.planets.find(p => p.name === "Saturn");
  const rahu = data.planets.find(p => p.name === "Rahu");
  const sun = data.planets.find(p => p.name === "Sun");

  const ordinalEn = (n) => ["First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth","Eleventh","Twelfth"][n - 1] || `${n}th`;
  // Hindi uses ordinal numbers like पहले/दूसरे/तीसरे… (oblique form, "in the Nth house")
  const ordinalHi = (n) => ["प्रथम","द्वितीय","तृतीय","चतुर्थ","पंचम","षष्ठम","सप्तम","अष्टम","नवम","दशम","एकादश","द्वादश"][n - 1] || `${n}वें`;
  const ord = (n) => hi(lang) ? ordinalHi(n) : ordinalEn(n);
  const occByPlanet  = (h, p) => hi(lang)
    ? `${translatePlanet(p, lang)} ग्रह आपकी जन्म कुंडली के ${ordinalHi(h)} भाव में स्थित है।`
    : `${ordinalEn(h)} house is occupied by planet ${p} in your birth chart.`;
  const situatedAt   = (p, h) => hi(lang)
    ? `${translatePlanet(p, lang)} ग्रह आपकी जन्म कुंडली में ${ordinalHi(h)} भाव में स्थित है।`
    : `Planet ${p} is situated in ${ordinalEn(h)} house in your birth chart.`;
  const aspectedBy   = (h, p) => hi(lang)
    ? `आपकी जन्म कुंडली के ${ordinalHi(h)} भाव पर ${translatePlanet(p, lang)} की दृष्टि है।`
    : `${ordinalEn(h)} house of your birth chart is aspected by ${p}.`;
  const aspectedShort = (h, p) => hi(lang)
    ? `${ordinalHi(h)} भाव पर ${translatePlanet(p, lang)} की दृष्टि है।`
    : `${ordinalEn(h)} house is aspected by ${p}.`;

  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, `${t("PAGE_MANGLIK_ANALYSIS", lang)} - II`, y);

  const colW = (CW - 20) / 2;

  // Two side-by-side panels: Based On House / Based On Aspects
  // Headers
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(t("MANGLIK_BASED_ON_HOUSE", lang), M, y, { width: colW, align: "center" });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(t("MANGLIK_BASED_ON_ASPECTS", lang), M + colW + 20, y, { width: colW, align: "center" });
  y += 20;

  // Silence the unused-helper warning when only Hindi variants are used.
  void ord;
  const houseItems = [];
  if (mars)  houseItems.push(occByPlanet(mars.house, "Mars"));
  if (ketu)  houseItems.push(situatedAt("Ketu", ketu.house));
  if (rahu)  houseItems.push(situatedAt("Rahu", rahu.house));

  const aspectItems = [];
  if (ketu)   aspectItems.push(aspectedBy(((ketu.house + 4) % 12) || 12, "Ketu"));
  if (saturn) aspectItems.push(aspectedShort(((saturn.house + 2) % 12) || 12, "Saturn"));
  if (rahu)   aspectItems.push(aspectedBy(((rahu.house + 4) % 12) || 12, "Rahu"));
  if (mars)   aspectItems.push(aspectedShort(((mars.house + 3) % 12) || 12, "Mars"));
  if (sun)    aspectItems.push(aspectedShort(((sun.house + 6) % 12) || 12, "Sun"));

  // Render striped lists
  let ly = y;
  houseItems.forEach((item, i) => {
    const rH = 40;
    doc.roundedRect(M, ly, colW, rH, 2).fill(i % 2 === 0 ? C.white : C.orangeL);
    doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
      .text(item, M + 10, ly + 10, { width: colW - 20 });
    ly += rH + 4;
  });

  let ry = y;
  aspectItems.forEach((item, i) => {
    const rH = 30;
    doc.roundedRect(M + colW + 20, ry, colW, rH, 2).fill(i % 2 === 0 ? C.white : C.orangeL);
    doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
      .text(item, M + colW + 30, ry + 8, { width: colW - 20 });
    ry += rH + 4;
  });
  y = Math.max(ly, ry) + 10;

  // Remedies
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(t("MANGLIK_REMEDIES_TITLE", lang), M, y);
  y += 20;
  remediesBox(doc, hi(lang) ? [
    "अपने पूजा स्थल पर ऊर्जा-सम्पन्न मंगल यंत्र स्थापित करें। त्रिकोणीय मंगल यंत्र पर मंगल मंत्र — ॐ क्रां क्रीं क्रौं सः भौमाय नमः — का जप करते हुए ध्यान करें।",
    "मंगलवार को सायंकाल हनुमान मंदिर जाएँ। थाली में लाल कुमकुम (रोली) से त्रिभुज बनाएँ और सिन्दूर अथवा लाल चन्दन, लाल पुष्प तथा दीप से हनुमानजी की पूजा करें।",
    "भगवान हनुमान की आराधना मंत्र — || ॐ श्रीं हनुमते नमः || — के साथ करें।",
    "मंगलवार को गुड़, मसूर की दाल अथवा लाल वस्त्र का दान करें।",
    "विवाह से पूर्व कुम्भ विवाह, अश्वत्थ विवाह अथवा विष्णु प्रतिमा के साथ विवाह जैसे शास्त्रोक्त उपाय अनुभवी आचार्य के निर्देशन में करवाएँ।"
  ] : [
    "Install an energised Mangal Yantra in your place of worship. Meditate on the triangular Mangal Yantra along with the recitation of the Mangal mantra: Om Kram Krim Krom Sah Bhomayay Namah.",
    "In the evening, visit a Hanuman temple. Draw a triangle with red kumkum (roli) on a plate and worship Hanumanji with sindoor or red sandalwood, red flowers and a lighted lamp.",
    "Worship Lord Hanuman with the mantra: || OM SHREEM HANUMATE NAMAH ||"
  ], y);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 16 — SADHESATI ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

function renderSadhesatiAnalysis(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  const present = data.doshas.sadeSati;
  const moon = data.planets.find(p => p.name === "Moon");
  const saturn = data.planets.find(p => p.name === "Saturn");

  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_SADHESATI_ANALYSIS", lang), y);

  // Illustration + intro
  const illustSz = 130;
  drawShaniArt(doc, M, y, illustSz);

  const tX = M + illustSz + 14;
  const tW = CW - illustSz - 14;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(t("SADHESATI_WHAT_IS", lang), tX, y);
  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
    .text(
      hi(lang) ? SADHESATI_INTRO_1_HI
        : "Sadhe Sati refers to the seven-and-a-half year period in which Saturn moves through three signs — the Moon sign, one before the Moon and one after it. Sadhe Sati starts when Saturn (Shani) enters the 12th sign from the birth Moon sign and ends when Saturn leaves the 2nd sign from the birth Moon sign. Since Saturn takes roughly two-and-a-half years to transit a sign (called Shani's dhaiya), the full passage through three signs takes about seven-and-a-half years, hence Sadhe Sati.",
      tX, y + 22, { width: tW, align: "justify" }
    );
  y += illustSz + 14;

  const sadeIntro2 = hi(lang) ? SADHESATI_INTRO_2_HI
    : "Generally Sade Sati comes thrice in a horoscope during a lifetime — first in childhood, second in youth, and third in old age. The first Sade Sati has effect on education and parents. The second has effect on profession, finance and family. The last affects health more than anything else.";
  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
    .text(sadeIntro2, M, y, { width: CW, align: "justify" });
  y += doc.heightOfString(sadeIntro2, { width: CW }) + 14;

  // Presence panel
  y = groupHeader(doc, t("GROUP_SADHESATI_PRESENCE", lang), M, y, CW, { align: "left" });
  const halfW = (CW - 14) / 2;
  const panelH = 120;

  // Left: face + text
  doc.roundedRect(M, y, halfW, panelH, 4).strokeColor(C.lightGray).lineWidth(0.7).stroke();
  const col = present ? C.red : C.green;
  const fcx = M + halfW / 2;
  const fcy = y + 30;
  doc.circle(fcx, fcy, 16).strokeColor(col).lineWidth(1.5).stroke();
  doc.circle(fcx - 5, fcy - 2, 1.4).fill(col);
  doc.circle(fcx + 5, fcy - 2, 1.4).fill(col);
  if (present) doc.moveTo(fcx - 6, fcy + 8).bezierCurveTo(fcx - 2, fcy + 3, fcx + 2, fcy + 3, fcx + 6, fcy + 8).strokeColor(col).lineWidth(1.2).stroke();
  else         doc.moveTo(fcx - 6, fcy + 6).bezierCurveTo(fcx - 2, fcy + 10, fcx + 2, fcy + 10, fcx + 6, fcy + 6).strokeColor(col).lineWidth(1.2).stroke();
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(present ? t("SADHESATI_PRESENT", lang) : t("SADHESATI_NOT_PRESENT", lang), M, y + 60, { width: halfW, align: "center" });
  doc.font("Helvetica").fontSize(9.5).fillColor(C.ink)
    .text(
      present ? t("SADHESATI_YES_NOTE", lang) : t("SADHESATI_NO_NOTE", lang),
      M, y + 84, { width: halfW, align: "center" }
    );

  // Right: details table
  const rX = M + halfW + 14;
  kvTable(doc, [
    [t("KV_CONSIDERATION_DATE", lang), formatDateSlashes(new Date().toISOString().slice(0, 10)).replace(/\//g, "-")],
    [t("KV_SATURN_SIGN", lang),        translateSign(saturn?.sign, lang) || "—"],
    [t("KV_MOON_SIGN", lang),          translateSign(moon?.sign, lang)   || "—"],
    [t("KV_SATURN_RETROGRADE", lang),  saturn?.retrograde ? t("VAL_YES_RETRO", lang) : "No"]
  ], rX, y, halfW, { rowH: panelH / 4 });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 17 — DOSHA SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

function renderDoshaSummary(doc, report, section) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_DOSHA_SUMMARY", lang), y);

  y = groupHeader(doc, t("GROUP_DOSHA_OVERVIEW", lang), M, y, CW);

  const translateDoshaName = (n) => hi(lang) ? (DOSHA_NAME_HI[n] ?? n) : n;
  const translateDoshaSev  = (s) => hi(lang) ? (DOSHA_SEVERITY_HI[s] ?? s) : s;
  const list = data.doshas.list ?? [];
  const doshas = list.length > 0
    ? list.map(d => ({ label: translateDoshaName(d.name), present: d.present, severity: d.severity }))
    : [
        { label: translateDoshaName("Manglik Dosha"),     present: data.doshas.manglik,     severity: "none" },
        { label: translateDoshaName("Sade Sati"),         present: data.doshas.sadeSati,    severity: "none" },
        { label: translateDoshaName("Kaal Sarp Dosha"),   present: data.doshas.kaalSarp,    severity: "none" },
        { label: translateDoshaName("Pitra Dosha"),       present: data.doshas.pitraDosha,  severity: "none" },
        { label: translateDoshaName("Guru Chandal Yoga"), present: data.doshas.guruChandal, severity: "none" }
      ];

  const cardW = (CW - 10) / 2;
  const cardH = 44;
  const rowGap = 6;
  doshas.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (cardW + 10);
    const cy = y + row * (cardH + rowGap);
    const bg = d.present ? "#fff0f0" : "#f0fff4";
    const accent = d.present
      ? (d.severity === "severe" ? C.red : d.severity === "mild" ? C.orangeD : C.crimson)
      : C.green;
    doc.roundedRect(x, cy, cardW, cardH, 5).fill(bg);
    doc.rect(x, cy, 4, cardH).fill(accent);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.navy)
      .text(d.label, x + 12, cy + 8, { width: cardW - 22 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(accent)
      .text(d.present ? `${t("DOSHA_PRESENT_PREFIX", lang)} · ${translateDoshaSev(d.severity)}` : t("DOSHA_NOT_FOUND", lang), x + 12, cy + 24, { width: cardW - 22 });
  });
  y += Math.ceil(doshas.length / 2) * (cardH + rowGap) + 6;

  // When the AI section is present (already in the requested language), prefer
  // that and skip the raw English `presentDetails` rows to avoid duplicated
  // English-then-Hindi output.
  if (section?.body?.length) {
    y = groupHeader(doc, t("GROUP_DETAILED_OBSERVATIONS", lang), M, y, CW);
    y = bodyText(doc, section.body, y);
  } else {
    const presentDetails = list.length
      ? list.filter(d => d.present).map(d => `${translateDoshaName(d.name)}: ${d.reason}`)
      : data.doshas.details ?? [];
    if (presentDetails.length) {
      y = groupHeader(doc, t("GROUP_DETAILED_OBSERVATIONS", lang), M, y, CW);
      y = bodyText(doc, presentDetails, y);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 18 — ASHTAKAVARGA
// ═══════════════════════════════════════════════════════════════════════════════

function renderAshtakavarga(doc, report, section) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_ASHTAKAVARGA", lang), y);

  // ── Total card ────────────────────────────────────────────────────────────
  const totalW = 220;
  doc.roundedRect(M + (CW - totalW) / 2, y, totalW, 58, 6).fill(C.navy);
  doc.font("Helvetica").fontSize(9).fillColor(C.white)
    .text(t("ASHTAKAVARGA_TOTAL", lang), M + (CW - totalW) / 2, y + 10, { width: totalW, align: "center" });
  doc.font("Helvetica-Bold").fontSize(30).fillColor(C.orange)
    .text(String(data.ashtakavarga.total), M + (CW - totalW) / 2, y + 22, { width: totalW, align: "center" });
  y += 70;

  // ── Per-planet BAV × 12 signs matrix (Bhinnashtakavarga) ──────────────────
  y = groupHeader(doc, t("GROUP_BHINNASHTAKAVARGA", lang), M, y, CW);

  const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const signAbbrev = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
  const labelW = 64;
  const totalColW = 36;
  const cellW = (CW - labelW - totalColW) / 12;
  const rowH = 18;
  const headerH = 18;

  // Header row
  doc.rect(M, y, CW, headerH).fill(C.navy);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white)
    .text(t("COL_PLANET", lang), M + 4, y + 5, { width: labelW - 8 });
  for (let i = 0; i < 12; i += 1) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white)
      .text(signAbbrev[i], M + labelW + i * cellW, y + 5, { width: cellW, align: "center" });
  }
  doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white)
    .text(t("COL_TOTAL", lang), M + labelW + 12 * cellW, y + 5, { width: totalColW, align: "center" });
  y += headerH;

  // Data rows per planet
  const bav = data.ashtakavarga.bavBySign ?? {};
  planets.forEach((planet, idx) => {
    const counts = bav[planet] ?? new Array(12).fill(0);
    const rowBg = idx % 2 === 0 ? "#f7f8fb" : C.white;
    doc.rect(M, y, CW, rowH).fill(rowBg);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.navy)
      .text(translatePlanet(planet, lang), M + 4, y + 5, { width: labelW - 8 });
    let rowTotal = 0;
    for (let i = 0; i < 12; i += 1) {
      const v = counts[i] ?? 0;
      rowTotal += v;
      doc.font("Helvetica").fontSize(9).fillColor(C.ink)
        .text(String(v), M + labelW + i * cellW, y + 5, { width: cellW, align: "center" });
    }
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.crimson)
      .text(String(rowTotal), M + labelW + 12 * cellW, y + 5, { width: totalColW, align: "center" });
    y += rowH;
  });

  // SAV row (column totals by sign)
  const sav = data.ashtakavarga.savBySign ?? new Array(12).fill(0);
  doc.rect(M, y, CW, rowH).fill(C.orangeL);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.navy)
    .text(t("ASHTAKAVARGA_SAV", lang), M + 4, y + 5, { width: labelW - 8 });
  for (let i = 0; i < 12; i += 1) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C.orangeD)
      .text(String(sav[i] ?? 0), M + labelW + i * cellW, y + 5, { width: cellW, align: "center" });
  }
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.orangeD)
    .text(String(data.ashtakavarga.total), M + labelW + 12 * cellW, y + 5, { width: totalColW, align: "center" });
  y += rowH;

  doc.rect(M, y - rowH * (planets.length + 1) - headerH, CW, rowH * (planets.length + 1) + headerH)
    .strokeColor(C.lightGray).lineWidth(0.5).stroke();
  y += 12;

  // ── House-wise SAV (rotated from ascendant) ───────────────────────────────
  y = groupHeader(doc, t("GROUP_SARVASHTAKAVARGA", lang), M, y, CW);
  const houseRows = data.ashtakavarga.houses.map(h => {
    const verdict = h.score >= 30
      ? t("STRENGTH_EXCELLENT", lang)
      : h.score >= 25 ? t("STRENGTH_GOOD", lang)
      : h.score >= 20 ? t("STRENGTH_AVERAGE", lang)
      : t("STRENGTH_WEAK", lang);
    return [`${t("WORD_HOUSE", lang)} ${h.house}`, String(h.score), verdict];
  });
  y = dataTable(doc,
    [t("COL_HOUSE", lang), t("COL_BINDUS", lang), t("COL_STRENGTH", lang)],
    houseRows, y, { cols: [80, 70, CW - 150] });

  if (section?.body?.length) y = bodyText(doc, section.body, y);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 19 — GEMSTONE SUGGESTIONS (3 gem cards)
// ═══════════════════════════════════════════════════════════════════════════════

function pickGemstones(data) {
  const asc = data.ascendant.sign;
  const profile = ASCENDANT_LORDS_LBL[asc] ?? ASCENDANT_LORDS_LBL["Leo"];
  return {
    life: PLANET_GEMSTONE[profile.lagna]?.stone ?? "Ruby",
    benefic: PLANET_GEMSTONE[profile.fifth]?.stone ?? "Yellow Sapphire",
    lucky: PLANET_GEMSTONE[profile.ninth]?.stone ?? "Red Coral",
    lifeLord: profile.lagna,
    beneficLord: profile.fifth,
    luckyLord: profile.ninth
  };
}

function renderGemstoneSuggestions(doc, report) {
  const data = report.kundliData;
  const lang = report.request.language;
  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_GEMSTONE_SUGGESTIONS", lang), y);

  // Intro paragraph
  const introText = hi(lang) ? GEM_SUGGEST_INTRO_HI
    : "Each planet has its unique corresponding astrological gemstone which radiates the same cosmic colour energies as the planet itself. The gemstones work by reflection of positive rays or absorption of negative rays. Wearing the appropriate gemstone can increase the corresponding planet's positive effect on its wearer as the gem filters and allows only the positive vibrations to penetrate the wearer's body.";
  doc.font("Helvetica-Oblique").fontSize(10).fillColor(C.ink)
    .text(introText, M, y, { width: CW, align: "justify" });
  y += doc.heightOfString(introText, { width: CW }) + 14;

  const gems = pickGemstones(data);
  const cardW = (CW - 18) / 3;
  const cardColors = [
    { head: "#7ad18a", name: t("GEM_LIFE_STONE", lang),    gemColor: "#b22222", label: translateStone(gems.life, lang) },
    { head: "#4fb0d4", name: t("GEM_BENEFIC_STONE", lang), gemColor: "#d4af37", label: translateStone(gems.benefic, lang) },
    { head: "#f2a24a", name: t("GEM_LUCKY_STONE", lang),   gemColor: "#b22222", label: translateStone(gems.lucky, lang) }
  ];

  cardColors.forEach((cc, i) => {
    const x = M + i * (cardW + 9);
    // Top bar (colored header)
    doc.roundedRect(x, y, cardW, 28, 3).fill(cc.head);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.white)
      .text(cc.name, x, y + 10, { width: cardW, align: "center" });
    // White card body
    doc.rect(x, y + 28, cardW, 140).fill(C.white);
    doc.roundedRect(x, y, cardW, 168, 3).strokeColor(C.lightGray).lineWidth(0.6).stroke();
    // Gem icon
    drawGemstoneArt(doc, x + cardW / 2 - 30, y + 48, 60, cc.gemColor);
    // Label at bottom
    doc.roundedRect(x, y + 140, cardW, 28, 3).fill(cc.head);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(C.white)
      .text(cc.label.toUpperCase(), x, y + 149, { width: cardW, align: "center" });
  });
  y += 176;

  // Short description text for each card (3-column)
  const descs = hi(lang) ? [
    GEM_CARD_DESC_LIFE_HI, GEM_CARD_DESC_BENEFIC_HI, GEM_CARD_DESC_LUCKY_HI
  ] : [
    "The Ascendant or LAGNA signifies the body and everything related to it — health, longevity, name, status, life path, and so on. The gemstone corresponding to the Lagnesh is called the LIFE STONE. One can and should wear this stone throughout life.",
    "The fifth house is the significator of the intellect, higher education, children, windfall gains and past good deeds (Purva Punya). The gemstone corresponding to the lord of the fifth house is called the BENEFIC STONE.",
    "The ninth house is the BHAGYA STHAANA — the House of Luck or Destiny. This house is related to fortune, success, merits, achievements and knowledge. The gemstone corresponding to the ninth house lord is called the LUCKY STONE."
  ];
  descs.forEach((d, i) => {
    const x = M + i * (cardW + 9);
    doc.font("Helvetica").fontSize(9).fillColor(C.ink)
      .text(d, x + 4, y, { width: cardW - 8, align: "justify" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGES 20–22 — Life / Benefic / Lucky Stone detail
// ═══════════════════════════════════════════════════════════════════════════════

function renderGemstoneDetail(
  doc,
  report,
  category
) {
  const data = report.kundliData;
  const lang = report.request.language;
  const gems = pickGemstones(data);
  const stoneLord = category === "LIFE" ? gems.lifeLord : category === "BENEFIC" ? gems.beneficLord : gems.luckyLord;
  const stoneName = category === "LIFE" ? gems.life     : category === "BENEFIC" ? gems.benefic     : gems.lucky;
  // Pick the right gemstone data table per language. Falls back to English
  // table if a Hindi entry is missing.
  const infoEn = PLANET_GEMSTONE[stoneLord] ?? PLANET_GEMSTONE.Sun;
  const infoHi = PLANET_GEMSTONE_HI[stoneLord] ?? PLANET_GEMSTONE_HI.Sun;
  const info = hi(lang) ? infoHi : infoEn;
  const stoneDisplay = translateStone(stoneName, lang);
  const label = category === "LIFE"    ? t("GEM_LIFE_STONE_TITLE", lang)
              : category === "BENEFIC" ? t("GEM_BENEFIC_STONE_TITLE", lang)
              :                          t("GEM_LUCKY_STONE_TITLE", lang);
  const gemColor =
    stoneName === "Ruby" ? "#b22222" :
    stoneName === "Pearl" ? "#f7f6ee" :
    stoneName === "Red Coral" ? "#d63b3b" :
    stoneName === "Emerald" ? "#2ea06c" :
    stoneName === "Yellow Sapphire" ? "#d4af37" :
    stoneName === "Diamond" ? "#cfd6de" :
    stoneName === "Blue Sapphire" ? "#2a3a8f" :
    stoneName === "Hessonite" ? "#c8581e" :
    stoneName === "Cat's Eye" ? "#b0a171" : "#b22222";

  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, label, y);

  // Top row: gem photo left, mini table right
  const colW = (CW - 16) / 2;
  drawGemstoneArt(doc, M + colW / 2 - 50, y + 20, 100, gemColor);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(`${label} - ${stoneDisplay}`, M, y, { width: colW, align: "center" });
  // Decorative curl under title
  const cx = M + colW / 2;
  doc.strokeColor(C.crimson).lineWidth(0.9);
  doc.moveTo(cx - 18, y + 18).lineTo(cx + 18, y + 18).stroke();

  // Right small table
  const rX = M + colW + 16;
  kvTable(doc, [
    [t("KV_SUBSTITUTES", lang), info.substitute],
    [t("KV_FINGER", lang),      info.finger],
    [t("KV_WEIGHT", lang),      info.minCarat],
    [t("KV_DAY", lang),         info.day],
    [t("KV_DEITY", lang),       info.deity],
    [t("KV_METAL", lang),       info.metal]
  ], rX, y + 10, colW, { rowH: 22 });

  y += 150;

  // Divider
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor(C.lightGray).lineWidth(0.6).stroke();
  y += 16;

  // 6-grid of info boxes (astronext layout)
  const gridCols = 3;
  const gridGap  = 14;
  const boxW     = (CW - gridGap * (gridCols - 1)) / gridCols;
  const boxH     = 150;

  const cells = hi(lang) ? [
    { icon: "desc",    title: t("GEM_CELL_DESCRIPTION", lang),      text: info.description },
    { icon: "time",    title: t("GEM_CELL_TIME_TO_WEAR", lang),     text: gemTimeToWearHi(stoneDisplay, info.day) },
    { icon: "finger",  title: t("GEM_CELL_FINGER", lang),           text: gemFingerHi(stoneDisplay, info.finger) },
    { icon: "weight",  title: t("GEM_CELL_WEIGHT_AND_METAL", lang), text: gemWeightAndMetalHi(stoneDisplay, info.metal) },
    { icon: "mantra",  title: t("GEM_CELL_MANTRA", lang),           text: gemMantraIntroHi(info.mantra), yellow: true },
    { icon: "subs",    title: t("GEM_CELL_SUBSTITUTES", lang),      text: gemSubstituteHi(stoneDisplay, info.substitute) },
    { icon: "ritual",  title: t("GEM_CELL_RITUALS", lang),          text: GEM_RITUALS_HI },
    { icon: "caution", title: t("GEM_CELL_CAUTION", lang),          text: info.caution }
  ] : [
    { icon: "desc",    title: t("GEM_CELL_DESCRIPTION", lang),      text: info.description },
    { icon: "time",    title: t("GEM_CELL_TIME_TO_WEAR", lang),     text: `${stoneName} should be worn on a ${info.day} morning of the bright half of the lunar month.` },
    { icon: "finger",  title: t("GEM_CELL_FINGER", lang),           text: `After the recitation of mantra the ${stoneName} should be worn on the ${info.finger.toLowerCase()} finger of the right hand.` },
    { icon: "weight",  title: t("GEM_CELL_WEIGHT_AND_METAL", lang), text: `${stoneName} should weigh at least as much as the range above. It should be set in ${info.metal} so the stone touches the skin.` },
    { icon: "mantra",  title: t("GEM_CELL_MANTRA", lang),           text: `Once energising rituals are completed, worship the stone with flower and incense. Recite the mantra below 108 times: ${info.mantra}`, yellow: true },
    { icon: "subs",    title: t("GEM_CELL_SUBSTITUTES", lang),      text: `One can also use the substitute for ${stoneName}: ${info.substitute}.` },
    { icon: "ritual",  title: t("GEM_CELL_RITUALS", lang),          text: `Before wearing, keep the ring immersed in unboiled milk or Ganges water for some time.` },
    { icon: "caution", title: t("GEM_CELL_CAUTION", lang),          text: info.caution }
  ];

  cells.slice(0, 8).forEach((c, i) => {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    const x = M + col * (boxW + gridGap);
    const cy = y + row * (boxH + gridGap);
    if (cy + boxH > CB + 12) return;

    // Background (yellow for mantra, white for rest)
    if (c.yellow) {
      doc.roundedRect(x, cy, boxW, boxH, 4).fill(C.yellowL);
    } else {
      doc.roundedRect(x, cy, boxW, boxH, 4).strokeColor(C.lightGray).lineWidth(0.5).stroke();
    }

    // Icon
    const iconX = x + 14;
    const iconY = cy + 12;
    doc.strokeColor(C.orange).lineWidth(1.1);
    switch (c.icon) {
      case "desc":
        doc.rect(iconX, iconY, 14, 14).stroke();
        doc.moveTo(iconX + 3, iconY + 4).lineTo(iconX + 11, iconY + 4).stroke();
        doc.moveTo(iconX + 3, iconY + 7).lineTo(iconX + 11, iconY + 7).stroke();
        doc.moveTo(iconX + 3, iconY + 10).lineTo(iconX + 9, iconY + 10).stroke();
        break;
      case "time":
        doc.circle(iconX + 7, iconY + 7, 7).stroke();
        doc.moveTo(iconX + 7, iconY + 7).lineTo(iconX + 7, iconY + 3).stroke();
        doc.moveTo(iconX + 7, iconY + 7).lineTo(iconX + 11, iconY + 7).stroke();
        break;
      case "finger":
        // Small hand
        doc.moveTo(iconX + 3, iconY + 14).lineTo(iconX + 3, iconY + 8).lineTo(iconX + 6, iconY + 4).lineTo(iconX + 8, iconY + 8).lineTo(iconX + 10, iconY + 4).lineTo(iconX + 12, iconY + 14).closePath().stroke();
        break;
      case "weight":
        doc.moveTo(iconX + 7, iconY + 14).lineTo(iconX + 7, iconY + 4).stroke();
        doc.moveTo(iconX + 2, iconY + 4).lineTo(iconX + 12, iconY + 4).stroke();
        doc.circle(iconX + 3, iconY + 6, 3).stroke();
        doc.circle(iconX + 11, iconY + 6, 3).stroke();
        break;
      case "mantra":
        // Chant / sound-wave icon, drawn as vector so it renders in any
        // language (the previous "⍨" glyph was missing in the Devanagari font).
        doc.circle(iconX + 3, iconY + 8, 1.8).fillColor("#d19b2e").fill();
        doc.strokeColor(C.orange).lineWidth(1.1);
        doc.moveTo(iconX + 7, iconY + 4).quadraticCurveTo(iconX + 11, iconY + 8, iconX + 7, iconY + 12).stroke();
        doc.moveTo(iconX + 9, iconY + 2).quadraticCurveTo(iconX + 15, iconY + 8, iconX + 9, iconY + 14).stroke();
        break;
      case "subs":
        doc.rect(iconX, iconY, 10, 10).stroke();
        doc.rect(iconX + 5, iconY + 4, 10, 10).stroke();
        break;
      case "ritual":
        // Small triangle
        doc.moveTo(iconX + 7, iconY).lineTo(iconX + 14, iconY + 14).lineTo(iconX, iconY + 14).closePath().stroke();
        doc.moveTo(iconX + 3, iconY + 10).lineTo(iconX + 11, iconY + 10).stroke();
        break;
      case "caution":
        doc.moveTo(iconX + 7, iconY).lineTo(iconX + 14, iconY + 12).lineTo(iconX, iconY + 12).closePath().stroke();
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C.orange)
          .text("!", iconX + 6, iconY + 4, { lineBreak: false });
        break;
    }

    // Title + text
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy)
      .text(c.title, x + 14, cy + 32, { width: boxW - 28 });
    doc.font("Helvetica").fontSize(8.5).fillColor(C.ink)
      .text(c.text, x + 14, cy + 48, { width: boxW - 28, align: "left" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGES 23–24 — ASCENDANT REPORT
// ═══════════════════════════════════════════════════════════════════════════════

function renderAscendantReport(doc, report, section) {
  const data = report.kundliData;
  const lang = report.request.language;
  const asc = data.ascendant.sign;
  const info = ASCENDANT_LORDS_LBL[asc] ?? ASCENDANT_LORDS_LBL["Leo"];
  const profile = hi(lang)
    ? (ASCENDANT_PROFILE_HI[asc] ?? ASCENDANT_PROFILE_HI["Leo"])
    : (ASCENDANT_PROFILE[asc]    ?? ASCENDANT_PROFILE["Leo"]);

  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_ASCENDANT_REPORT", lang), y);

  // Top: lion image (symbolic for any sign — could vary by sign)
  const halfW = (CW - 20) / 2;
  drawLionArt(doc, M, y, Math.min(halfW, 180));

  const tX = M + Math.min(halfW, 180) + 16;
  const tW = CW - Math.min(halfW, 180) - 16;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(`${t("PAGE_ASCENDANT_REPORT", lang)} - ${translateSign(asc, lang) || asc}`, tX, y);
  y += 22;

  kvTable(doc, [
    [t("KV_LORD", lang),            translatePlanet(info.lord, lang)],
    [t("KV_SYMBOL", lang),          hi(lang) ? ({
      "The Ram":"मेष","The Bull":"वृषभ","The Twins":"मिथुन","The Crab":"कर्क",
      "The Lion":"सिंह","The Maiden":"कन्या","The Scales":"तुला","The Scorpion":"वृश्चिक",
      "The Archer":"धनु","The Goat":"मकर","The Water Bearer":"कुम्भ","The Fishes":"मीन"
    })[info.symbol] ?? info.symbol : info.symbol],
    [t("KV_CHARACTERISTICS", lang), hi(lang) ? info.characteristics
      .replace(/Fiery/g,"अग्नि तत्त्व").replace(/Earthy/g,"पृथ्वी तत्त्व").replace(/Airy/g,"वायु तत्त्व").replace(/Watery/g,"जल तत्त्व")
      .replace(/Movable/g,"चर").replace(/Immovable/g,"स्थिर").replace(/Fixed/g,"स्थिर").replace(/Dual/g,"द्विस्वभाव")
      .replace(/North/g,"उत्तर").replace(/South/g,"दक्षिण").replace(/East/g,"पूर्व").replace(/West/g,"पश्चिम") : info.characteristics],
    [t("KV_LUCKY_GEMS", lang),      translateStone(info.luckyGem, lang)],
    [t("KV_DAY_OF_FAST", lang),     hi(lang) ? ({
      Sunday:"रविवार",Monday:"सोमवार",Tuesday:"मंगलवार",Wednesday:"बुधवार",
      Thursday:"गुरुवार",Friday:"शुक्रवार",Saturday:"शनिवार"
    })[info.fastDay] ?? info.fastDay : info.fastDay]
  ], tX, y, tW, { rowH: 24 });

  y += Math.min(halfW, 180);
  y += 6;

  // Sanskrit shloka — Devanagari when Hindi/Marathi.
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.red)
    .text(hi(lang) ? SHLOKA_DEHAM_ROOPAM_HI : "|| Deham Roopam Cha Gyanam Cha Varnam Chaiva Balaabalam ||", M, y, { width: CW, align: "center" });
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.red)
    .text(hi(lang) ? SHLOKA_SUKHAM_DUHKHAM_HI : "|| Sukham Duhkham Svabhavam Cha Lagna-Bhavaan Nireekshayet ||", M, y + 18, { width: CW, align: "center" });
  y += 46;

  // Body paragraphs + quote
  y = bodyText(doc, profile.description, y);
  y = quoteBox(doc, profile.quote, y);

  void section;
}

function renderAscendantReportDetailed(doc, report, section) {
  const data = report.kundliData;
  const lang = report.request.language;
  const asc = data.ascendant.sign;
  const profile = hi(lang)
    ? (ASCENDANT_PROFILE_HI[asc] ?? ASCENDANT_PROFILE_HI["Leo"])
    : (ASCENDANT_PROFILE[asc]    ?? ASCENDANT_PROFILE["Leo"]);

  pageBg(doc);
  let y = CT;
  y = pageTitle(doc, t("PAGE_ASCENDANT_REPORT", lang), y);

  // More body from section if available, else profile continuation
  const moreBody = section?.body?.length ? section.body : [
    profile.description[profile.description.length - 1] ?? "Live into the strengths of your sign and keep the shadow side in gentle view. The chart is a map — you are still the one walking the path."
  ];
  y = bodyText(doc, moreBody, y);
  y = quoteBox(doc, profile.secondQuote, y);

  // Spiritual lesson block
  y += 4;
  doc.roundedRect(M, y, CW, 70, 4).fill(C.bgGray);
  doc.font("Helvetica-Bold").fontSize(18).fillColor(C.orangeD)
    .text("ॐ", M, y + 8, { width: CW, align: "center", lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
    .text(t("ASCENDANT_SPIRITUAL_LESSON", lang), M, y + 30, { width: CW, align: "center" });
  doc.font("Helvetica").fontSize(14).fillColor(C.ink)
    .text(profile.lesson, M, y + 50, { width: CW, align: "center" });
  y += 84;

  // Positive traits
  y = groupHeader(doc, t("GROUP_POSITIVE_TRAITS", lang), M, y, CW);
  const posColors = [C.greenD, C.green, "#2ba7a5", "#4fa8d3"];
  let px = M;
  const gap = 10;
  profile.positive.forEach((t, i) => {
    const w = traitPill(doc, t, px, y, posColors[i % posColors.length]);
    px += w + gap;
  });
  y += 32;

  // Negative traits
  y = groupHeader(doc, t("GROUP_NEGATIVE_TRAITS", lang), M, y, CW);
  const negColors = [C.orange, "#d94a4a", C.orangeD, "#c2a13a"];
  let npx = M;
  profile.negative.forEach((t, i) => {
    const w = traitPill(doc, t, npx, y, negColors[i % negColors.length]);
    npx += w + gap;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PAGE 25 — FINAL (contact / brand)
// ═══════════════════════════════════════════════════════════════════════════════

function renderFinal(doc, branding, logoBuffer, lang) {
  pageBg(doc);

  // Decorative curls above the logo
  const cx = W / 2;
  doc.strokeColor(C.crimson).lineWidth(0.9);
  doc.moveTo(cx - 60, 300).lineTo(cx - 14, 300).stroke();
  doc.moveTo(cx + 14, 300).lineTo(cx + 60, 300).stroke();

  // Logo or brand name
  if (logoBuffer) {
    try {
      const logoW = 220;
      const logoH = 110;
      doc.image(logoBuffer, (W - logoW) / 2, 330, { fit: [logoW, logoH], align: "center" });
    } catch {
      doc.font("Helvetica-Bold").fontSize(36).fillColor(C.navy)
        .text(branding.companyName, 0, 350, { width: W, align: "center" });
    }
  } else {
    doc.font("Helvetica-Bold").fontSize(36).fillColor(C.navy)
      .text(branding.companyName, 0, 350, { width: W, align: "center" });
  }

  if (branding.companyInfo) {
    doc.font("Helvetica").fontSize(10).fillColor(C.gray)
      .text(branding.companyInfo, 0, 455, { width: W, align: "center" });
  }

  // Divider curls
  doc.strokeColor(C.crimson).lineWidth(0.9);
  doc.moveTo(cx - 60, 490).lineTo(cx - 14, 490).stroke();
  doc.moveTo(cx + 14, 490).lineTo(cx + 60, 490).stroke();

  // ── Legal disclaimer block ────────────────────────────────────────────────
  const disclaimerY = 510;
  const disclaimerPadding = 16;
  const disclaimerBoxW = W - M * 2;
  doc.roundedRect(M, disclaimerY, disclaimerBoxW, 130, 6)
    .strokeColor(C.crimson).lineWidth(0.8).stroke();
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.crimson)
    .text(t("FINAL_DISCLAIMER_TITLE", lang), M, disclaimerY + 10, { width: disclaimerBoxW, align: "center" });
  doc.font("Helvetica").fontSize(8).fillColor(C.ink)
    .text(
      t("FINAL_DISCLAIMER_BODY", lang),
      M + disclaimerPadding, disclaimerY + 30,
      { width: disclaimerBoxW - disclaimerPadding * 2, align: "justify", lineGap: 1.5 }
    );

  // Orange footer band with contact info
  const bandH = 170;
  doc.rect(0, H - bandH, W, bandH).fill(C.orange);
  doc.font("Helvetica-Bold").fontSize(26).fillColor(C.white)
    .text(branding.companyName, 0, H - bandH + 18, { width: W, align: "center" });

  let contactY = H - bandH + 60;
  const contactLine = (text) => {
    if (!text) return;
    doc.font("Helvetica").fontSize(12).fillColor(C.white)
      .text(text, 0, contactY, { width: W, align: "center" });
    contactY += 20;
  };
  contactLine(branding.domainUrl);
  contactLine(branding.email);
  if (branding.mobile) contactLine(branding.mobile);
  if (branding.landline && branding.landline !== branding.mobile) contactLine(branding.landline);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export async function buildKundliPdf(report) {
  const branding = mergeBranding(report.branding);
  const [logoBuffer, ganeshBuffer] = await Promise.all([
    loadLogoBuffer(branding),
    loadGaneshaImage()
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: false,
      info: {
        Title:   `Kundli Report — ${report.request.fullName}`,
        Author:  branding.companyName,
        Subject: "Premium Vedic Birth Chart Report",
        Creator: `${branding.companyName} PDF Engine`
      }
    });

    const chunks = [];
    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Register Devanagari fonts before any rendering so Hindi/Marathi text
    // can be drawn with proper glyphs.
    registerFonts(doc);

    // For Devanagari-script languages, monkey-patch doc.font so every
    // Helvetica call routes to Noto Sans Devanagari. This avoids editing
    // ~hundreds of doc.font("Helvetica") sites throughout the renderer.
    // Noto Sans Devanagari includes basic Latin glyphs, so English labels
    // (Planet, Sign, etc.) still render correctly while Devanagari text
    // gets proper glyphs.
    if (isDevanagariLang(report.request.language)) {
      const originalFont = doc.font.bind(doc);
      // pdfkit's font() accepts (src, family?, size?) so we keep the
      // signature compatible.
      doc.font = ((src, ...rest) => {
        if (src === "Helvetica")         return originalFont("Devanagari",      ...rest);
        if (src === "Helvetica-Bold")    return originalFont("Devanagari-Bold", ...rest);
        if (src === "Helvetica-Oblique") return originalFont("Devanagari",      ...rest);
        return originalFont(src, ...rest);
      });
      // characterSpacing breaks Devanagari shaping (matras/conjuncts detach) —
      // strip it for all text in Devanagari mode.
      const originalText = doc.text.bind(doc);
      doc.text = ((str, ...rest) => {
        const last = rest[rest.length - 1];
        if (last && typeof last === "object" && last.characterSpacing) last.characterSpacing = 0;
        return originalText(str, ...rest);
      });
    }

    // (background-image-per-page hook removed — see top of file)

    const sections = report.sections ?? [];
    const sec = (page) => sections.find(s => s.page === page);
    const lang = report.request.language;
    const foot = (n) => pageFooter(doc, n, branding.footerLink, lang);

    // 1
    doc.addPage(); renderCover(doc, report, branding, logoBuffer, ganeshBuffer);
    // 2
    doc.addPage(); renderBasicDetails(doc, report);       foot(2);
    // 3
    doc.addPage(); renderPlanetaryPositions(doc, report); foot(3);
    // 4
    doc.addPage(); renderHoroscopeCharts(doc, report);    foot(4);
    // 5
    doc.addPage(); renderDivisionalCharts(doc, report);   foot(5);
    // 6
    doc.addPage(); renderHouseCusps(doc, report);         foot(6);
    // 7–8 Vimshottari dashas
    const timeline = report.kundliData?.dashas.vimshottariTimeline ?? [];
    const firstHalf  = timeline.slice(0, 6);
    const secondHalf = timeline.slice(6);
    doc.addPage(); renderVimshottariPage(doc, report, firstHalf,  1, false); foot(7);
    doc.addPage(); renderVimshottariPage(doc, report, secondHalf, 2, true);  foot(8);
    // 9
    doc.addPage(); renderFavourablePoints(doc, report);   foot(9);
    // 10
    doc.addPage(); renderNumerologyReport(doc, report);   foot(10);
    // 11
    doc.addPage(); renderGayatriMantra(doc, report);      foot(11);
    // 12
    doc.addPage(); renderKalsarpaDosha(doc, report, sec(12));  foot(12);
    // 13
    doc.addPage(); renderKalsarpaEffect(doc, report, sec(13)); foot(13);
    // 14
    doc.addPage(); renderManglikAnalysisI(doc, report);   foot(14);
    // 15
    doc.addPage(); renderManglikAnalysisII(doc, report);  foot(15);
    // 16
    doc.addPage(); renderSadhesatiAnalysis(doc, report);  foot(16);
    // 17
    doc.addPage(); renderDoshaSummary(doc, report, sec(17)); foot(17);
    // 18
    doc.addPage(); renderAshtakavarga(doc, report, sec(18)); foot(18);
    // 19
    doc.addPage(); renderGemstoneSuggestions(doc, report); foot(19);
    // 20–22
    doc.addPage(); renderGemstoneDetail(doc, report, "LIFE");    foot(20);
    doc.addPage(); renderGemstoneDetail(doc, report, "BENEFIC"); foot(21);
    doc.addPage(); renderGemstoneDetail(doc, report, "LUCKY");   foot(22);
    // 23–24
    doc.addPage(); renderAscendantReport(doc, report, sec(23));         foot(23);
    doc.addPage(); renderAscendantReportDetailed(doc, report, sec(24)); foot(24);
    // 25
    doc.addPage(); renderFinal(doc, branding, logoBuffer, lang);

    doc.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DETERMINISTIC 64-CHAPTER RENDERER
//
//  The Premium Kundali is sold as 64 pages and the web/app report renders the
//  64 deterministic chapters produced by kundli-sections.js. This renderer draws
//  those same chapters, so the PDF the customer receives and the report they
//  read online say exactly the same thing. No LLM prose is involved.
// ═══════════════════════════════════════════════════════════════════════════════

// Turn a chapter's structured `placements` into the { "1": ["Sun", …] } shape
// northIndianChart expects, plus the lagna sign index that chart is cast from.
// The lagna index is derived, not assumed: for any placement, sign − (house − 1)
// is the sign sitting on house 1 of that chart (natal or divisional).
function chartFromPlacements(placements) {
  if (!Array.isArray(placements) || !placements.length) return null;
  const seen = new Set();
  const byHouse = {};
  let lagnaIdx = null;
  for (const p of placements) {
    if (!p?.planet || !p.sign || !p.house) continue;
    if (seen.has(p.planet)) continue;      // transit pages list a planet twice
    seen.add(p.planet);
    const h = String(p.house);
    (byHouse[h] = byHouse[h] || []).push(p.planet);
    if (lagnaIdx === null) lagnaIdx = ((signIdxOf(p.sign) - (p.house - 1)) % 12 + 12) % 12;
  }
  const placed = Object.values(byHouse).reduce((a, v) => a + v.length, 0);
  if (placed < 4) return null;             // too sparse to be worth drawing
  for (let i = 1; i <= 12; i += 1) if (!byHouse[String(i)]) byHouse[String(i)] = ["-"];
  return { chartData: byHouse, lagnaIdx };
}

// Highlights strip: up to three key-fact cards across the content width.
function highlightCards(doc, items, y) {
  const list = (items || []).filter(Boolean).slice(0, 3);
  if (!list.length) return y;
  const gap = 10;
  const cw = (CW - gap * (list.length - 1)) / list.length;
  doc.font("Helvetica").fontSize(8.5);
  const h = Math.max(...list.map((s) => doc.heightOfString(s, { width: cw - 16 }))) + 16;
  if (y + h > CB) return y;
  list.forEach((s, i) => {
    const x = M + i * (cw + gap);
    doc.roundedRect(x, y, cw, h, 4).fill(C.orangeL);
    doc.rect(x, y, 3, h).fill(C.orange);
    doc.font("Helvetica").fontSize(8.5).fillColor(C.navy)
      .text(s, x + 10, y + 8, { width: cw - 16 });
  });
  return y + h + 12;
}

// Advisory: one navy-accented line closing the chapter.
function advisoryBox(doc, text, y) {
  if (!text) return y;
  const pad = 10;
  doc.font("Helvetica-Oblique").fontSize(9);
  const th = doc.heightOfString(text, { width: CW - pad * 2 - 6 });
  const bh = th + pad * 2;
  if (y + bh > CB) return y;
  doc.rect(M, y, CW, bh).fill(C.navyL);
  doc.rect(M, y, 4, bh).fill(C.navy);
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(C.navy)
    .text(text, M + pad + 6, y + pad, { width: CW - pad * 2 - 6 });
  return y + bh + 10;
}

/**
 * Render the 64 deterministic chapters.
 *
 * @param {object} report { request, kundliData, sections, branding }
 * @returns {Promise<Buffer>}
 */
export async function buildKundliSectionsPdf(report) {
  const branding = mergeBranding(report.branding);
  const [logoBuffer, ganeshBuffer] = await Promise.all([
    loadLogoBuffer(branding),
    loadGaneshaImage()
  ]);
  const lang = report.request.language;
  const sections = Array.isArray(report.sections) ? report.sections : [];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: false,
      info: {
        Title:   `Kundli Report — ${report.request.fullName}`,
        Author:  branding.companyName,
        Subject: "Premium Vedic Birth Chart Report",
        Creator: `${branding.companyName} PDF Engine`
      }
    });

    const chunks = [];
    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    registerFonts(doc);

    // Same Devanagari routing as buildKundliPdf: every Helvetica call is
    // redirected to Noto Sans Devanagari, and characterSpacing is stripped
    // because it breaks matra/conjunct shaping.
    if (isDevanagariLang(lang)) {
      const originalFont = doc.font.bind(doc);
      doc.font = ((src, ...rest) => {
        if (src === "Helvetica")      return originalFont("Devanagari",      ...rest);
        if (src === "Helvetica-Bold") return originalFont("Devanagari-Bold", ...rest);
        if (src === "Helvetica-Oblique") return originalFont("Devanagari",   ...rest);
        return originalFont(src, ...rest);
      });
      const originalText = doc.text.bind(doc);
      doc.text = ((str, ...rest) => {
        const last = rest[rest.length - 1];
        if (last && typeof last === "object" && last.characterSpacing) last.characterSpacing = 0;
        return originalText(str, ...rest);
      });
    }

    let pageNum = 0;
    const newPage = (title, continued = false) => {
      doc.addPage();
      pageBg(doc);
      pageNum += 1;
      pageFooter(doc, pageNum, branding.footerLink, lang);
      return pageTitle(doc, continued ? `${title} (cont.)` : title, CT);
    };

    // ── cover ────────────────────────────────────────────────────────────────
    doc.addPage();
    renderCover(doc, report, branding, logoBuffer, ganeshBuffer);
    pageNum += 1;

    // ── 64 chapters ──────────────────────────────────────────────────────────
    for (const sec of sections) {
      const title = sec.title || "";
      let y = newPage(title);

      // Subtitle
      if (sec.subtitle) {
        doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(C.gray)
          .text(sec.subtitle, M, y, { width: CW, align: "center" });
        y += doc.heightOfString(sec.subtitle, { width: CW }) + 10;
      }

      // Summary
      if (sec.summary) y = quoteBox(doc, sec.summary, y);

      // Chart diagram, where the chapter carries structured placements
      const chart = chartFromPlacements(sec.placements);
      if (chart && y + 190 < CB) {
        const size = 168;
        northIndianChart(doc, chart.chartData, (W - size) / 2, y, size, lang, chart.lagnaIdx);
        y += size + 14;
      }

      // Body paragraphs, flowing onto a continuation page when they overrun
      for (const para of asParagraphs(sec.body)) {
        doc.font("Helvetica").fontSize(10);
        const th = doc.heightOfString(para, { width: CW, align: "justify" });
        if (y + th > CB) y = newPage(title, true);
        doc.font("Helvetica").fontSize(10).fillColor(C.ink)
          .text(para, M, y, { width: CW, align: "justify" });
        y += th + 10;
      }

      // Highlights
      if (sec.highlights?.length) {
        if (y + 60 > CB) y = newPage(title, true);
        y = highlightCards(doc, sec.highlights, y);
      }

      // Bullets
      if (sec.bullets?.length) {
        doc.font("Helvetica").fontSize(9.5);
        const need = sec.bullets.reduce((a, b) => a + doc.heightOfString(`-  ${b}`, { width: CW - 36 }) + 4, 0) + 28;
        if (y + need > CB) y = newPage(title, true);
        y = remediesBox(doc, sec.bullets, y);
      }

      // Advisory
      if (sec.advisory) {
        doc.font("Helvetica-Oblique").fontSize(9);
        const need = doc.heightOfString(sec.advisory, { width: CW - 26 }) + 20;
        if (y + need > CB) y = newPage(title, true);
        y = advisoryBox(doc, sec.advisory, y);
      }
    }

    // ── closing page ─────────────────────────────────────────────────────────
    doc.addPage();
    renderFinal(doc, branding, logoBuffer, lang);

    doc.end();
  });
}
