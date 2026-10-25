"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/**
 * The counter's answer to a purchase. The Fame leaving is drawn by the wallet;
 * these draw the other half — the thing arriving.
 *
 * All of it plays only on a change seen during the visit. A row that loads with
 * forty screws in the stash, or a card that was already bought this morning,
 * sits still: an animation on load would claim a purchase that did not just
 * happen.
 */

interface Increase {
  id: number;
  gain: number;
}

/**
 * The latest increase of `value`, or `null` before there has been one — derived
 * while rendering against the previous value, so nothing plays on mount.
 */
const useIncrease = (value: number): Increase | null => {
  const [prev, setPrev] = useState(value);
  const [hit, setHit] = useState<Increase | null>(null);

  if (value !== prev) {
    setPrev(value);
    if (value > prev) setHit({ id: (hit?.id ?? 0) + 1, gain: value - prev });
  }

  return hit;
};

interface GainCountProps {
  value: number;
  /** The colour the "+N" floats off in — the tier of what was bought. */
  color?: string;
  className?: string;
}

/** A holding that rolls up and throws off how much it just grew by. */
export const GainCount = ({
  value,
  color = "#e4e4e7",
  className,
}: GainCountProps) => {
  const hit = useIncrease(value);
  const raw = useMotionValue(value);
  const spring = useSpring(raw, { stiffness: 120, damping: 20 });
  const text = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    raw.set(value);
  }, [raw, value]);

  return (
    <span className='relative inline-flex'>
      <motion.span className={className}>{text}</motion.span>
      <AnimatePresence>
        {hit && (
          <motion.span
            key={hit.id}
            aria-hidden
            className='pointer-events-none absolute -top-1 left-full ml-1 whitespace-nowrap text-xs font-black tabular-nums'
            style={{ color }}
            initial={{ opacity: 0, y: 4, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -18, scale: [0.6, 1.2, 1, 1] }}
            transition={{
              duration: 1.3,
              times: [0, 0.15, 0.7, 1],
              ease: "easeOut",
            }}>
            +{hit.gain}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

/**
 * One pass of the bought thing's colour across its row — the row's own way of
 * saying "that one". Needs a `relative overflow-hidden` parent.
 */
export const PurchaseSweep = ({
  trigger,
  color,
}: {
  /** Anything that grows on a purchase — usually the holding. */
  trigger: number;
  color: string;
}) => {
  const hit = useIncrease(trigger);
  if (!hit) return null;

  return (
    <motion.span
      key={hit.id}
      aria-hidden
      className='pointer-events-none absolute inset-y-0 left-0 w-1/2'
      style={{
        background: `linear-gradient(90deg, transparent, ${color}2e, transparent)`,
      }}
      initial={{ x: "-100%", opacity: 1 }}
      animate={{ x: "220%", opacity: [1, 1, 0] }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
  );
};

/**
 * Whether this offer was taken on this screen, as opposed to already taken when
 * it loaded. Read in the card, which outlives the purchase — the stamp itself
 * only mounts once the offer is gone, so it cannot remember the before.
 */
export const useTakenHere = (available: boolean) => {
  const [availableOnLoad] = useState(available);
  return availableOnLoad && !available;
};

/**
 * "Bought today", stamped on rather than swapped in when the purchase happened
 * here. A card that loads already bought shows the line as it always did.
 */
export const PurchaseStamp = ({
  slam,
  children,
  className,
}: {
  slam: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    initial={slam ? { opacity: 0, scale: 1.9, rotate: -10 } : false}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 520, damping: 22 }}>
    {children}
  </motion.div>
);
