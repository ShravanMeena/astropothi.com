import { motion, useReducedMotion } from "framer-motion";

/**
 * The North Indian chart, drawn as line art.
 *
 * This is the one graphic that is unmistakably ours: a jyotishi reads this
 * diagram every day, and nobody outside the tradition uses it. It draws itself
 * once on entry, then sits behind the type as architecture rather than
 * decoration.
 */
export default function ChartMark({ className = "", stroke = "currentColor", draw = true, weight = 0.5, numerals = true }: {
  className?: string; stroke?: string; draw?: boolean; weight?: number; numerals?: boolean;
}) {
  const reduce = useReducedMotion();
  const animate = draw && !reduce;

  const line = (d: string, i: number) => (
    <motion.path
      key={d} d={d} fill="none" stroke={stroke} strokeWidth={weight} strokeLinecap="square"
      initial={animate ? { pathLength: 0, opacity: 0 } : false}
      animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
      transition={{ duration: 1.5, delay: 0.15 + i * 0.12, ease: [0.22, 0.7, 0.2, 1] }}
    />
  );

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[
        "M2 2 H198 V198 H2 Z",          // outer square
        "M2 2 L198 198",                 // the two diagonals
        "M198 2 L2 198",
        "M100 2 L198 100 L100 198 L2 100 Z"  // the inner diamond
      ].map(line)}
      {/* house numerals, the way a pandit writes them */}
      {numerals && [[100,26,"1"],[52,26,"2"],[26,52,"3"],[26,100,"4"],[26,148,"5"],[52,174,"6"],
        [100,174,"7"],[148,174,"8"],[174,148,"9"],[174,100,"10"],[174,52,"11"],[148,26,"12"]
      ].map(([x,y,n], i) => (
        <motion.text key={n as string} x={x as number} y={(y as number) + 3}
          textAnchor="middle" fontSize="8" fill={stroke} opacity="0.5"
          fontFamily="Fraunces, Georgia, serif"
          initial={animate ? { opacity: 0 } : false}
          animate={animate ? { opacity: 0.5 } : undefined}
          transition={{ duration: .5, delay: .9 + i * .04 }}>
          {n as string}
        </motion.text>
      ))}
    </svg>
  );
}
