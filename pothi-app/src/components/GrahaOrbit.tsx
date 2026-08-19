import { motion, useReducedMotion } from "framer-motion";

/**
 * The nine grahas, moving.
 *
 * Relative speeds follow the real sidereal periods, compressed so Saturn takes
 * about four minutes to come round and the Moon a few seconds — the same ratios
 * a jyotishi works with. Rahu and Ketu run backwards and stay exactly opposite
 * each other, because that is what the nodes do.
 */
const C = 100;   // centre, in viewBox units

const GRAHA = [
  { en: "Moon",    r: 16, years: 0.0748, size: 3.2, at:  40 },
  { en: "Mercury", r: 25, years: 0.241,  size: 2.6, at: 155 },
  { en: "Venus",   r: 34, years: 0.615,  size: 3.0, at: 290 },
  { en: "Sun",     r: 44, years: 1,      size: 4.6, at: 205, glow: true },
  { en: "Mars",    r: 54, years: 1.881,  size: 2.9, at:  95 },
  { en: "Jupiter", r: 65, years: 11.86,  size: 3.9, at: 340 },
  {  en: "Saturn",  r: 76, years: 29.46,  size: 3.5, at: 120 },
  { en: "Rahu",    r: 87, years: 18.61,  size: 2.5, at:  15, retro: true },
  { en: "Ketu",    r: 87, years: 18.61,  size: 2.5, at: 195, retro: true }
];

const SATURN_LAP = 240;                                    // seconds for one Saturn round
const lap = (years: number) => (years / 29.46) * SATURN_LAP;

// Framer's originX/originY resolve against each group's own bounding box, which
// is not the chart's centre. transform-box: view-box makes transform-origin
// resolve in viewBox units instead, so the group pivots where we mean it to.
const pivot = (x: number, y: number) =>
  ({ transformBox: "view-box" as const, transformOrigin: `${x}px ${y}px` });

/** A short arc of travelled path, trailing the graha. */
function trail(r: number, sweep: number, retro?: boolean) {
  const a = ((retro ? sweep : -sweep) * Math.PI) / 180;
  return `M ${C + r * Math.cos(a)} ${C + r * Math.sin(a)} A ${r} ${r} 0 0 ${retro ? 0 : 1} ${C + r} ${C}`;
}

export default function GrahaOrbit({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <svg viewBox="0 0 200 200" className={className} role="img"
         aria-label="The nine grahas moving on their orbits">
      <defs>
        <radialGradient id="graha-sun">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* orbits */}
      {[...new Set(GRAHA.map((g) => g.r))].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none"
                stroke="currentColor" strokeWidth="0.25" opacity=".3" />
      ))}
      {/* the axes that make it a chart rather than a solar system */}
      <line x1={C - 94} y1={C} x2={C + 94} y2={C} stroke="currentColor" strokeWidth=".25" opacity=".16" />
      <line x1={C} y1={C - 94} x2={C} y2={C + 94} stroke="currentColor" strokeWidth=".25" opacity=".16" />

      {GRAHA.map((g) => {
        const dur = lap(g.years);
        const to = g.at + (g.retro ? -360 : 360);
        const spin = (from: number, target: number, x: number, y: number) => ({
          initial: { rotate: from },
          animate: reduce ? { rotate: from } : { rotate: target },
          transition: reduce ? undefined : { duration: dur, repeat: Infinity, ease: "linear" as const },
          style: pivot(x, y)
        });
        return (
          <motion.g key={g.en} {...spin(g.at, to, C, C)}>
            {/* the arc it just came through — a 5px glyph at this scale is noise,
                a trail reads as movement even in a still frame */}
            <path d={trail(g.r, 26, g.retro)} fill="none" stroke="currentColor"
                  strokeWidth={g.size * 0.62} strokeLinecap="round" opacity=".13" />
            {g.glow && <circle cx={C + g.r} cy={C} r={g.size * 3.6} fill="url(#graha-sun)" />}
            <circle cx={C + g.r} cy={C} r={g.size} fill="currentColor" opacity={g.retro ? ".5" : ".92"} />
            {g.retro && (
              <circle cx={C + g.r} cy={C} r={g.size + 1.6} fill="none"
                      stroke="currentColor" strokeWidth=".3" opacity=".55" />
            )}
          </motion.g>
        );
      })}

      {/* the native */}
      <circle cx={C} cy={C} r="2.2" fill="currentColor" />
      <circle cx={C} cy={C} r="6.4" fill="none" stroke="currentColor" strokeWidth=".3" opacity=".5" />
    </svg>
  );
}
