import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import {
  feedbackStyles,
  getPerformanceGrade,
} from "../hooks/noteMatchingFeedback";

/** Mirrors the multiplier curve in useNoteMatching: min(8, floor(combo / 5) + 1). */
const MAX_MULTIPLIER = 8;
const COMBO_PER_MULTIPLIER = 5;

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_PX = 76;

const FEEDBACK_VISIBLE_MS = 1200;

/** Ring warms up as the multiplier climbs: cyan -> amber -> orange. */
const getMultiplierTier = (multiplier: number) => {
  if (multiplier >= 6)
    return { from: "#fb923c", to: "#ea580c", text: "text-orange-400" };
  if (multiplier >= 3)
    return { from: "#fbbf24", to: "#d97706", text: "text-amber-400" };
  return { from: "#67e8f9", to: "#0891b2", text: "text-cyan-400" };
};

/**
 * The game HUD shown when mic mode is active: score and accuracy alongside a
 * combo ring that fills toward the next multiplier. `variant="full"` is the
 * enlarged full-screen layout (big score with accuracy stacked underneath).
 */
export const MicHud = ({
  className,
  variant = "docked",
}: {
  className?: string;
  variant?: "docked" | "full";
}) => {
  const { gameState, sessionAccuracy } = useNoteMatchingContext();
  const { score, combo, multiplier, lastFeedback, feedbackId } = gameState;

  const full = variant === "full";
  const ringPx = full ? 104 : RING_PX;
  const grade = getPerformanceGrade(sessionAccuracy);
  const tier = getMultiplierTier(multiplier);

  // lastFeedback is sticky in game state, so each burst is retired by its id.
  const [retiredFeedbackId, setRetiredFeedbackId] = useState(-1);
  useEffect(() => {
    if (!lastFeedback) return undefined;
    const timeout = setTimeout(
      () => setRetiredFeedbackId(feedbackId),
      FEEDBACK_VISIBLE_MS,
    );
    return () => clearTimeout(timeout);
  }, [feedbackId, lastFeedback]);

  const visibleFeedback = feedbackId === retiredFeedbackId ? "" : lastFeedback;
  const feedbackStyle = feedbackStyles[visibleFeedback];

  const comboProgress =
    multiplier >= MAX_MULTIPLIER
      ? 1
      : (combo % COMBO_PER_MULTIPLIER) / COMBO_PER_MULTIPLIER;
  const ringOffset = RING_CIRCUMFERENCE * (1 - comboProgress);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center duration-700 animate-in fade-in slide-in-from-right-4",
        full
          ? "gap-7 rounded-xl bg-zinc-900/50 px-6 py-4 backdrop-blur-sm"
          : "w-[340px] justify-between gap-6 rounded-lg bg-zinc-900/50 px-7 py-3",
        className,
      )}>
      {full ? (
        // Full screen: score stacked over accuracy, right-aligned next to the ring.
        <div className='flex flex-col items-end'>
          <span className='text-[10px] font-semibold tracking-wide text-zinc-400'>
            Score
          </span>
          <motion.span
            key={score}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className='text-5xl font-bold tabular-nums leading-none tracking-tighter text-zinc-100'>
            {score.toLocaleString()}
          </motion.span>
          <span
            className={cn(
              "mt-1.5 text-2xl font-bold tabular-nums leading-none",
              grade.color,
            )}>
            {sessionAccuracy}%
          </span>
        </div>
      ) : (
        <>
          <div className='flex flex-col items-start'>
            <span className='text-[10px] font-semibold tracking-wide text-zinc-400'>
              Score
            </span>

            <motion.span
              key={score}
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className='text-4xl font-bold tabular-nums leading-none tracking-tighter text-zinc-100'>
              {score.toLocaleString()}
            </motion.span>
          </div>

          <div className='flex flex-col items-start'>
            <span className='text-[10px] font-semibold tracking-wide text-zinc-400'>
              Accuracy
            </span>
            <span className={cn("text-xl font-bold tabular-nums", grade.color)}>
              {sessionAccuracy}%
            </span>
          </div>
        </>
      )}

      <div className='relative'>
        <svg
          width={ringPx}
          height={ringPx}
          viewBox='0 0 100 100'
          className='shrink-0'>
          <defs>
            <linearGradient
              id='micHudRingGrad'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='100%'>
              <stop offset='0%' stopColor={tier.from} />
              <stop offset='100%' stopColor={tier.to} />
            </linearGradient>
            <filter
              id='micHudRingGlow'
              x='-30%'
              y='-30%'
              width='160%'
              height='160%'>
              <feGaussianBlur stdDeviation='2' result='blur' />
              <feMerge>
                <feMergeNode in='blur' />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>
          </defs>
          <circle cx='50' cy='50' r={RING_RADIUS} fill='rgba(0,0,0,0.35)' />
          <circle
            cx='50'
            cy='50'
            r={RING_RADIUS}
            fill='none'
            stroke='rgba(255,255,255,0.08)'
            strokeWidth='5'
          />
          <motion.circle
            cx='50'
            cy='50'
            r={RING_RADIUS}
            fill='none'
            stroke='url(#micHudRingGrad)'
            strokeWidth='5'
            strokeLinecap='round'
            strokeDasharray={RING_CIRCUMFERENCE}
            transform='rotate(-90 50 50)'
            filter='url(#micHudRingGlow)'
            animate={{ strokeDashoffset: ringOffset }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />
        </svg>

        <div className='absolute inset-0 flex items-center justify-center'>
          <motion.span
            key={multiplier}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn(
              "font-bold tabular-nums tracking-tighter transition-colors duration-300",
              full ? "text-3xl" : "text-2xl",
              multiplier > 1 ? tier.text : "text-zinc-300",
            )}>
            x{multiplier}
          </motion.span>
        </div>

        <AnimatePresence>
          {visibleFeedback && (
            <motion.span
              key={feedbackId}
              initial={{
                opacity: 0,
                y: -4,
                scale: feedbackStyle?.scale ?? 1.3,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className={cn(
                "absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-sm font-bold tracking-wide",
                feedbackStyle?.color ?? "text-zinc-300",
                feedbackStyle?.dropShadow,
              )}>
              {visibleFeedback}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
