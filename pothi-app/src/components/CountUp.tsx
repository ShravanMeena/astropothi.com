import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * A number that counts to its value once, when it comes into view.
 *
 * It renders the final value immediately when motion is reduced, and whenever
 * the value is not a number it is passed straight through — a price like ₹699
 * should never be animated into existence one rupee at a time.
 */
export default function CountUp({ value, duration = 1.1, className = "" }: {
  value: string | number; duration?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  // Only bare counts animate. A price must not climb from ₹0 to ₹699 in front
  // of a buyer, and "—" is not a number at all — both pass straight through.
  const numeric = typeof value === "number" || /^\d+$/.test(String(value).trim());
  const target = numeric ? Number(value) : 0;
  const [n, setN] = useState(numeric && !reduce ? 0 : target);

  useEffect(() => {
    if (!numeric || reduce || !inView) { setN(target); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      // ease-out: fast at the start, settling on the number rather than racing to it
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, numeric, reduce, target, duration]);

  return <span ref={ref} className={className}>{numeric ? n : value}</span>;
}
