import type { Transition, Variants } from "framer-motion";

import tokens from "./tokens.json";

/**
 * The app's motion language — one set of durations and curves for everything
 * that moves. `tokens.json` is shared with tailwind.config.js, so `duration-base`
 * / `ease-out` in a class and `transitions.base` here are the same motion.
 * Rules and when to use which: docs/STYLEGUIDE.md, "Ruch".
 */

type Bezier = [number, number, number, number];

const easeOut = tokens.easeOut as Bezier;
const easeInOut = tokens.easeInOut as Bezier;

/** Seconds, as framer-motion wants them. */
export const DURATION = {
  /** Feedback to a press or hover: colour, opacity, a pressed state. */
  fast: tokens.duration.fast / 1000,
  /** Something entering or leaving: a menu, a toast, a page's content. */
  base: tokens.duration.base / 1000,
  /** Big surfaces and moments: a sheet, a panel, a reward. */
  slow: tokens.duration.slow / 1000,
} as const;

export const EASE = { out: easeOut, inOut: easeInOut } as const;

export const transitions = {
  fast: { duration: DURATION.fast, ease: easeOut },
  base: { duration: DURATION.base, ease: easeOut },
  slow: { duration: DURATION.slow, ease: easeOut },
  /** Moving between two places on screen (inOut: it leaves and arrives). */
  move: { duration: DURATION.slow, ease: easeInOut },
  /** Physical things — cards, chips, a value settling. Snappy, no wobble. */
  spring: { type: "spring", stiffness: 420, damping: 36, mass: 0.8 },
} satisfies Record<string, Transition>;

/**
 * Ready-made enter/exit variants: `initial="hidden" animate="visible" exit="hidden"`.
 * Opacity first, small offsets — nothing flies in from off-screen.
 */
export const fade: Variants = {
  hidden: { opacity: 0, transition: transitions.fast },
  visible: { opacity: 1, transition: transitions.base },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8, transition: transitions.fast },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, transition: transitions.fast },
  visible: { opacity: 1, scale: 1, transition: transitions.base },
};

/** Children of a list arriving one after another. */
export const stagger = (step = 0.04): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: step } },
});
