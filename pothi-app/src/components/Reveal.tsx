import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Content arrives as it enters view. Once, never on the way back up. */
export default function Reveal({ children, delay = 0, y = 22, className = "" }: {
  children: ReactNode; delay?: number; y?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      transition={{ duration: .7, delay, ease: [.2, .7, .2, 1] }}>
      {children}
    </motion.div>
  );
}
