import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";

/**
 * Shared motion for the workshop.
 *
 * Kept in one place so the whole tab moves with the same rhythm, and so the
 * styleguide's rule holds everywhere: things animate on *entry* and on *click*,
 * never on hover, and never by growing.
 */

/** Spring the tab uses for anything that lands rather than fades. */
const LANDING = { type: "spring" as const, stiffness: 260, damping: 22 };

interface RevealProps {
  children: ReactNode;
  /** Position in a list — staggers the entry without a parent variant. */
  index?: number;
  className?: string;
}

/** Rises into place. For rows and panels appearing for the first time. */
export const Reveal = ({ children, index = 0, className }: RevealProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
    className={className}>
    {children}
  </motion.div>
);

interface CountUpProps {
  value: number;
  className?: string;
  prefix?: string;
}

/**
 * Rolls to a new number instead of snapping to it.
 *
 * A level that ticks upward is read as *earned*; the same number swapped in place
 * is read as a re-render. This is the whole reward moment for a build, so it is
 * worth the two hundred milliseconds.
 */
export const CountUp = ({ value, className, prefix = "" }: CountUpProps) => {
  const raw = useMotionValue(value);
  const spring = useSpring(raw, { stiffness: 90, damping: 18 });
  const text = useTransform(spring, (v) => `${prefix}${Math.round(v)}`);

  useEffect(() => {
    raw.set(value);
  }, [raw, value]);

  return <motion.span className={className}>{text}</motion.span>;
};

interface PopProps {
  children: ReactNode;
  /** Change this to replay the pop — usually the value being celebrated. */
  trigger: string | number;
  className?: string;
}

/** A single spring-in, replayed whenever `trigger` changes. */
export const Pop = ({ children, trigger, className }: PopProps) => (
  <motion.div
    key={trigger}
    initial={{ scale: 0.7, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={LANDING}
    className={className}>
    {children}
  </motion.div>
);

/**
 * A slow shine that crosses an element every few seconds.
 *
 * Reserved for a job that is affordable *right now* — it is the tab's only
 * idle animation, so it has to mean exactly one thing: this one you can do.
 */
export const ReadyShine = ({ className }: { className?: string }) => (
  <motion.span
    aria-hidden
    className={`pointer-events-none absolute inset-0 overflow-hidden rounded-lg ${className ?? ""}`}>
    <motion.span
      className='absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent'
      initial={{ x: "-150%" }}
      animate={{ x: "350%" }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        repeatDelay: 4.5,
        ease: "easeInOut",
      }}
    />
  </motion.span>
);
