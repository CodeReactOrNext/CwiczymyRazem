"use client";

import { cn } from "assets/lib/utils";
import type { MotionProps } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "lib/motion/motion";
import { Hammer } from "lucide-react";

import type { SceneSubject } from "./sceneSubject";

/**
 * The scene kit: the handful of effects every arsenal scene is cut from, so a
 * teardown, a rework and a delivery hit with the same rhythm the merge does.
 *
 * Each one is a single colour, passed in. A scene is lit by what it is about —
 * the rarity of the guitar, the tier of the part, the purple of a mod — and never
 * by decoration, which is what keeps a Common looking like a Common.
 *
 * Everything here is absolutely positioned around the centre of a `relative`
 * stage and hidden from assistive tech: the scene's caption and summary say what
 * happened, the sparks only show it.
 *
 * Smoothness rules the kit keeps to:
 * - Only transform and opacity move. A gradient or a `filter` that changes per
 *   frame repaints the whole stage every frame; opacity runs on the compositor.
 * - Anything that should read as one motion is one tween. A keyframe list with
 *   a single ease eases *every segment*, so a ring growing 0.3 → 1.2 → 2.6
 *   stops dead at 1.2 and lurches off again. Multi-step lists are kept for
 *   opacity, where a hold reads as a hold.
 */

const ring = (count: number) =>
  Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2);

/**
 * The pool of light the subject stands in.
 *
 * A change of colour or strength crossfades two fixed layers instead of
 * animating the gradient itself — the gradient is painted once per layer, and
 * only the layers' opacity moves.
 */
export const StageLight = ({
  color,
  strength = "22",
}: {
  color: string;
  /** Hex alpha of the centre, e.g. `22`. */
  strength?: string;
}) => (
  <AnimatePresence initial={false}>
    <motion.div
      key={`${color}${strength}`}
      aria-hidden
      className='pointer-events-none absolute inset-0'
      style={{
        background: `radial-gradient(closest-side, ${color}${strength} 0%, transparent 100%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "linear" }}
    />
  </AnimatePresence>
);

interface SparkBurstProps {
  color: string;
  delay?: number;
  count?: number;
  /** How far the nearest spark travels, in px. */
  distance?: number;
  /** Extra reach for every third spark, so the burst is not a perfect circle. */
  spread?: number;
  /** Seconds each spark flies. */
  duration?: number;
  /** Replays the burst on a loop, for a wind-up that waits on the server. */
  repeatEvery?: number;
}

/** Sparks thrown outward from the centre. */
export const SparkBurst = ({
  color,
  delay = 0,
  count = 12,
  distance = 110,
  spread = 30,
  duration = 0.85,
  repeatEvery,
}: SparkBurstProps) => (
  <>
    {ring(count).map((angle, i) => {
      const reach = distance + (i % 3) * spread;
      return (
        <motion.span
          key={i}
          aria-hidden
          className='absolute h-1.5 w-1.5 rounded-full will-change-transform'
          style={{ backgroundColor: color }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: [0, 1, 0],
            x: Math.cos(angle) * reach,
            y: Math.sin(angle) * reach,
            scale: 0.3,
          }}
          transition={{
            delay: delay + (i % 4) * 0.02,
            duration,
            // Thrown hard and drifting to a stop, in one continuous curve.
            ease: EASE.out,
            opacity: { inherit: true, times: [0, 0.08, 1], ease: "linear" },
            scale: { inherit: true, ease: "easeIn" },
            ...(repeatEvery
              ? {
                  repeat: Infinity,
                  repeatDelay: Math.max(0, repeatEvery - duration),
                }
              : null),
          }}
        />
      );
    })}
  </>
);

interface SparkConvergeProps {
  color: string;
  delay?: number;
  duration?: number;
  count?: number;
  radius?: number;
  /** Keeps drawing sparks in while the scene waits. */
  loop?: boolean;
}

/** Sparks running in to the centre — something is being gathered. */
export const SparkConverge = ({
  color,
  delay = 0,
  duration = 0.55,
  count = 10,
  radius = 150,
  loop = false,
}: SparkConvergeProps) => (
  <>
    {ring(count).map((angle, i) => (
      <motion.span
        key={i}
        aria-hidden
        className='absolute h-1.5 w-1.5 rounded-full will-change-transform'
        style={{ backgroundColor: color }}
        initial={{
          opacity: 0,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        }}
        animate={{ opacity: [0, 1, 0], x: 0, y: 0, scale: 0.4 }}
        transition={{
          delay: delay + i * 0.03,
          duration,
          ease: "easeIn",
          opacity: { inherit: true, times: [0, 0.3, 1], ease: "linear" },
          ...(loop ? { repeat: Infinity, repeatDelay: 0.35 } : null),
        }}
      />
    ))}
  </>
);

/** Two rings going out from an impact. */
export const ImpactRings = ({
  color,
  delay = 0,
  size = 112,
}: {
  color: string;
  delay?: number;
  size?: number;
}) => (
  <>
    {[0, 0.12].map((lag, i) => (
      <motion.span
        key={i}
        aria-hidden
        className='absolute rounded-full will-change-transform'
        style={{
          width: size,
          height: size,
          border: `${i === 0 ? 3 : 1.5}px solid ${color}`,
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.9, 0], scale: 2.6 }}
        transition={{
          delay: delay + lag,
          duration: 0.8,
          // One expanding wave, fastest at the hit and easing out to nothing.
          ease: EASE.out,
          opacity: { inherit: true, times: [0, 0.1, 1], ease: "linear" },
        }}
      />
    ))}
  </>
);

/** A white flash over the whole stage, for the instant something lands. */
export const ImpactFlash = ({ delay = 0 }: { delay?: number }) => (
  <motion.span
    aria-hidden
    className='pointer-events-none absolute inset-0 rounded-full will-change-transform'
    style={{
      background:
        "radial-gradient(closest-side, rgba(255,255,255,0.55) 0%, transparent 100%)",
    }}
    initial={{ opacity: 0, scale: 0.6 }}
    animate={{ opacity: [0, 1, 0], scale: 1.3 }}
    transition={{
      delay,
      duration: 0.5,
      ease: EASE.out,
      opacity: { inherit: true, times: [0, 0.15, 1], ease: "easeOut" },
    }}
  />
);

/** One swing of the hammer, and the fraction of it at which the head lands. */
const SWING = 0.6;
const STRIKE = 0.35;

/**
 * A hammer going at the subject's shoulder, sparks off every blow — the bench
 * at work, for as long as the request is out. Pair it with `STRIKE_FLINCH` on
 * the subject so it gives a little under each hit.
 */
export const HammerStrikes = () => (
  <>
    <motion.div
      aria-hidden
      className='absolute text-zinc-300 will-change-transform'
      style={{ x: 70, y: -80, originX: 0.15, originY: 0.85 }}
      animate={{ rotate: [-55, 18, -55] }}
      transition={{
        duration: SWING,
        times: [0, STRIKE, 1],
        // Wound up and brought down, then lifted off: velocity meets at the
        // blow, so the two segments read as one swing.
        ease: ["easeIn", "easeOut"],
        repeat: Infinity,
      }}>
      <Hammer size={48} strokeWidth={1.75} />
    </motion.div>
    <span className='absolute' style={{ transform: "translate(52px, -30px)" }}>
      <SparkBurst
        color='#fbbf24'
        delay={STRIKE * SWING}
        count={7}
        distance={34}
        spread={14}
        duration={0.45}
        repeatEvery={SWING}
      />
    </span>
  </>
);

/** The subject giving under each blow of `HammerStrikes`, in step with it. */
export const STRIKE_FLINCH: Pick<MotionProps, "animate" | "transition"> = {
  animate: { scale: [1, 1, 1.035, 1] },
  transition: {
    duration: SWING,
    times: [0, STRIKE, STRIKE + 0.08, 1],
    repeat: Infinity,
    ease: "easeOut",
  },
};

const SUBJECT_SIZE = {
  // Guitars are drawn lying down, so the box is square and the art is turned.
  guitar: {
    lg: "h-48 w-48 sm:h-60 sm:w-60",
    md: "h-36 w-36 sm:h-44 sm:w-44",
    sm: "h-24 w-24",
  },
  effect: {
    lg: "h-36 w-36 sm:h-44 sm:w-44",
    md: "h-28 w-28 sm:h-32 sm:w-32",
    sm: "h-20 w-20",
  },
} as const;

/**
 * An instrument's artwork at scene size.
 *
 * The turn is a class on the image and every wrapper is moved by framer, which
 * writes an inline transform that would replace a class one — so the two never
 * share an element.
 */
export const SubjectArt = ({
  subject,
  size = "lg",
  className,
}: {
  subject: Pick<SceneSubject, "kind" | "art">;
  size?: "lg" | "md" | "sm";
  className?: string;
}) => (
  <img
    src={subject.art}
    alt=''
    aria-hidden
    draggable={false}
    className={cn(
      "object-contain",
      SUBJECT_SIZE[subject.kind][size],
      subject.kind === "guitar" && "-rotate-90",
      className,
    )}
  />
);
