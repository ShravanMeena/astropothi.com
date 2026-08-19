// ─────────────────────────────────────────────────────────────────────────────
// Divisional charts (vargas), by the classical Parashari rules.
//
// This engine previously computed EVERY varga with one uniform formula,
// `(signIndex * divisor + part) % 12`. That formula is exactly right for D7, D9,
// D16, D20 and D27 — which is why it looked correct — but it is wrong for D3,
// D4, D10, D12, D24, D40, D45 and D60, and wrong for every division of D24.
//
// The reason is that each varga has its own *starting sign* rule, and the
// uniform formula only reproduces it by coincidence. D12 must count from the
// sign itself; the uniform formula always counts from Aries, because
// 12 * signIndex is a multiple of 12 and vanishes.
//
// A jyotishi reading a D10 against any mainstream software would have caught
// this immediately, so the rules are spelled out here one by one rather than
// derived.
// ─────────────────────────────────────────────────────────────────────────────

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const norm = (deg) => ((Number(deg) % 360) + 360) % 360;

const movable = (s) => s % 3 === 0;   // Aries, Cancer, Libra, Capricorn
const fixed   = (s) => s % 3 === 1;   // Taurus, Leo, Scorpio, Aquarius
const odd     = (s) => s % 2 === 0;   // Aries is the 1st sign, so index 0 is odd

/** The sign each varga starts counting from, for a planet in sign `s`. */
const START = {
  1:  (s) => s,
  3:  (s, k) => s + [0, 4, 8][k],                       // same, 5th, 9th
  4:  (s, k) => s + [0, 3, 6, 9][k],                    // the four kendras
  7:  (s) => (odd(s) ? s : s + 6),
  9:  (s) => (movable(s) ? s : fixed(s) ? s + 8 : s + 4),
  10: (s) => (odd(s) ? s : s + 8),
  12: (s) => s,
  16: (s) => (movable(s) ? 0 : fixed(s) ? 4 : 8),       // Aries / Leo / Sagittarius
  20: (s) => (movable(s) ? 0 : fixed(s) ? 8 : 4),       // Aries / Sagittarius / Leo
  24: (s) => (odd(s) ? 4 : 3),                          // Leo / Cancer
  27: (s) => s % 4 * 3,                                 // fiery Ar, earthy Cn, airy Li, watery Cp
  40: (s) => (odd(s) ? 0 : 6),                          // Aries / Libra
  45: (s) => (movable(s) ? 0 : fixed(s) ? 4 : 8),
  60: (s) => s
};

// D30 is the exception: five unequal spans ruled by five planets, reversed in
// even signs. It cannot be expressed as "start sign + equal part".
const TRIMSAMSA_ODD  = [[5, 0], [10, 10], [18, 8], [25, 2], [30, 6]];   // Ar, Aq, Sg, Ge, Li
const TRIMSAMSA_EVEN = [[5, 1], [12, 5], [20, 11], [25, 9], [30, 7]];   // Ta, Vi, Pi, Cp, Sc

/**
 * Sign index (0 = Aries) a planet occupies in the given divisional chart.
 * Divisors without a classical rule fall back to the uniform scheme, which is
 * what those charts were always drawn with.
 */
export function vargaSignIndex(longitude, divisor) {
  const lon = norm(longitude);
  const s = Math.floor(lon / 30);
  const inSign = lon % 30;

  if (divisor === 30) {
    const table = odd(s) ? TRIMSAMSA_ODD : TRIMSAMSA_EVEN;
    for (const [upto, sign] of table) if (inSign < upto) return sign;
    return table[table.length - 1][1];
  }

  const k = Math.min(divisor - 1, Math.floor(inSign / (30 / divisor)));
  const start = START[divisor];
  if (!start) return (s * divisor + k) % 12;            // D2, D5, D8 … no classical start rule here
  return (((start(s, k) % 12) + 12) % 12 + (divisor === 3 || divisor === 4 ? 0 : k)) % 12;
}

export const vargaSign = (longitude, divisor) => SIGNS[vargaSignIndex(longitude, divisor)];
