"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  /** Seconds the count takes. */
  duration?: number;
  /** Seconds before it starts. */
  delay?: number;
  className?: string;
}

/**
 * A whole number that rolls from `from` to `to`.
 *
 * Driven by a motion value rather than state, so a count that takes a second does
 * not re-render its parent sixty times: the text node is updated directly.
 */
export const CountUp = ({
  to,
  from = 0,
  duration = 0.9,
  delay = 0,
  className,
}: CountUpProps) => {
  const value = useMotionValue(from);
  const rounded = useTransform(value, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(value, to, { duration, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [value, to, duration, delay]);

  return (
    <motion.span className={className} aria-hidden>
      {rounded}
    </motion.span>
  );
};
