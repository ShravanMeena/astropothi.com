// ─────────────────────────────────────────────────────────────────────────────
// Vastu Purusha Mandala — the classical directional ruleset, as data.
//
// Unlike every other report here, this one is NOT derived from a birth chart.
// It is derived from a building: which way it faces and what sits in each
// corner. So it takes its own inputs and shares nothing with the astrology
// engine except the renderer.
//
// Each zone carries its presiding deity, its element, what the tradition
// assigns it, and what must not go there. A "dosh" is a placement that
// contradicts the assignment — nothing more mystical than that, and every
// verdict below can be traced to the rule that produced it.
// ─────────────────────────────────────────────────────────────────────────────

/** The eight directions plus the centre, in mandala order. */
export const ZONES = [
  { key: "N",  en: "North",      hi: "उत्तर",      deity: "Kubera",  element: "Water",
    governs: { en: "wealth, opportunity, career flow", hi: "धन, अवसर, आजीविका का प्रवाह" },
    ideal: ["entrance", "living", "water", "cash", "study"],
    avoid: ["toilet", "kitchen", "staircase", "store"] },
  { key: "NE", en: "North-East", hi: "ईशान",       deity: "Ishana",  element: "Water",
    governs: { en: "clarity, prayer, health of the mind", hi: "स्पष्टता, उपासना, मानसिक स्वास्थ्य" },
    ideal: ["pooja", "water", "entrance", "study"],
    avoid: ["toilet", "kitchen", "master_bedroom", "staircase", "store"] },
  { key: "E",  en: "East",       hi: "पूर्व",      deity: "Indra",   element: "Air",
    governs: { en: "vitality, social standing, sons", hi: "ऊर्जा, सामाजिक प्रतिष्ठा, संतान" },
    ideal: ["entrance", "living", "bathroom", "study"],
    avoid: ["toilet", "staircase", "store"] },
  { key: "SE", en: "South-East", hi: "आग्नेय",     element: "Fire",  deity: "Agni",
    governs: { en: "fire, digestion, energy, money spent", hi: "अग्नि, पाचन, ऊर्जा, व्यय" },
    ideal: ["kitchen", "electrical"],
    avoid: ["pooja", "water", "master_bedroom", "toilet"] },
  { key: "S",  en: "South",      hi: "दक्षिण",     deity: "Yama",    element: "Earth",
    governs: { en: "rest, endurance, accumulated strength", hi: "विश्राम, सहनशक्ति, संचित बल" },
    ideal: ["bedroom", "store", "staircase", "toilet"],
    avoid: ["entrance", "water", "pooja"] },
  { key: "SW", en: "South-West", hi: "नैऋत्य",     deity: "Nairrti", element: "Earth",
    governs: { en: "stability, the head of the household, relationships", hi: "स्थिरता, गृहस्वामी, संबंध" },
    ideal: ["master_bedroom", "store", "staircase"],
    avoid: ["entrance", "water", "kitchen", "toilet", "pooja"] },
  { key: "W",  en: "West",       hi: "पश्चिम",     deity: "Varuna",  element: "Water",
    governs: { en: "gains, children, what returns to you", hi: "लाभ, संतान, प्रतिफल" },
    ideal: ["dining", "bedroom", "store", "staircase"],
    avoid: ["pooja"] },
  { key: "NW", en: "North-West", hi: "वायव्य",     deity: "Vayu",    element: "Air",
    governs: { en: "movement, guests, support, and letting go", hi: "गति, अतिथि, सहयोग, विसर्जन" },
    ideal: ["guest", "store", "toilet", "bedroom"],
    avoid: ["kitchen", "master_bedroom", "pooja"] },
  { key: "C",  en: "Brahmasthan", hi: "ब्रह्मस्थान", deity: "Brahma", element: "Space",
    governs: { en: "the still centre the whole house rests on", hi: "वह केंद्र जिस पर पूरा घर टिका है" },
    ideal: ["open"],
    avoid: ["toilet", "kitchen", "staircase", "pillar", "store", "master_bedroom"] }
];

export const ZONE = Object.fromEntries(ZONES.map((z) => [z.key, z]));

/** The placements we ask about, in the order the report walks them. */
export const PLACEMENTS = [
  { key: "entrance",       en: "Main entrance",   hi: "मुख्य द्वार",     weight: 3 },
  { key: "kitchen",        en: "Kitchen",         hi: "रसोई",            weight: 3 },
  { key: "master_bedroom", en: "Master bedroom",  hi: "मुख्य शयनकक्ष",   weight: 2 },
  { key: "pooja",          en: "Pooja room",      hi: "पूजा स्थान",      weight: 2 },
  { key: "toilet",         en: "Toilet",          hi: "शौचालय",          weight: 3 },
  { key: "water",          en: "Water source",    hi: "जल स्रोत",        weight: 2 },
  { key: "staircase",      en: "Staircase",       hi: "सीढ़ी",           weight: 1 },
  { key: "store",          en: "Store room",      hi: "भंडार",           weight: 1 }
];

export const PLACEMENT = Object.fromEntries(PLACEMENTS.map((p) => [p.key, p]));

/** Severity from the weight of the placement and how wrong the zone is. */
const SEVERITY = { 3: "high", 2: "moderate", 1: "mild" };

/**
 * Check one building against the mandala.
 *
 * @param {object} input
 * @param {string} input.facing  N | NE | E | SE | S | SW | W | NW
 * @param {object} input.rooms   { entrance: "N", kitchen: "SE", … } — zone keys
 * @returns {{ facing, zones, findings, score, counts }}
 */
export function auditVastu(input = {}) {
  const facing = ZONE[input.facing] ? input.facing : "N";
  const rooms = input.rooms || {};

  const findings = [];
  for (const p of PLACEMENTS) {
    const at = rooms[p.key];
    if (!at || !ZONE[at]) continue;                 // not told; say nothing rather than guess
    const zone = ZONE[at];
    const ideal = zone.ideal.includes(p.key)
      || (p.key === "master_bedroom" && zone.ideal.includes("bedroom"));
    const forbidden = zone.avoid.includes(p.key)
      || (p.key === "master_bedroom" && zone.avoid.includes("bedroom"));

    findings.push({
      placement: p.key, zoneKey: at, weight: p.weight,
      verdict: ideal ? "ideal" : forbidden ? "dosh" : "acceptable",
      severity: forbidden ? SEVERITY[p.weight] : null,
      // Where it should have been, if it is wrong.
      better: forbidden || !ideal
        ? ZONES.filter((z) => z.ideal.includes(p.key)
            || (p.key === "master_bedroom" && z.ideal.includes("bedroom"))).map((z) => z.key)
        : []
    });
  }

  const counts = {
    ideal:      findings.filter((f) => f.verdict === "ideal").length,
    acceptable: findings.filter((f) => f.verdict === "acceptable").length,
    dosh:       findings.filter((f) => f.verdict === "dosh").length,
    high:       findings.filter((f) => f.severity === "high").length
  };

  // A plain, explainable score: every placement can earn its weight, a dosh
  // earns nothing, a merely acceptable one earns half. No hidden arithmetic.
  const total = findings.reduce((s, f) => s + f.weight, 0);
  const earned = findings.reduce(
    (s, f) => s + (f.verdict === "ideal" ? f.weight : f.verdict === "acceptable" ? f.weight / 2 : 0), 0);
  const score = total ? Math.round((earned / total) * 100) : null;

  return { facing, facingZone: ZONE[facing], findings, counts, score, asked: findings.length };
}
