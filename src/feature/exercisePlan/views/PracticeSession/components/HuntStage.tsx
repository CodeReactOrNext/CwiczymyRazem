import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

import { HuntSuccessBurst } from "./HuntSuccessBurst";

interface HuntStageProps {
  /** Dims the whole stage until the session timer is started. */
  awaitingStart?: boolean;
  /** Score / strikes / countdown pills. */
  stats?: ReactNode;
  /** Target card(s) plus the one-line instruction — the "what am I doing" block. */
  prompt: ReactNode;
  /** Audio and view toggles: everything that changes how the drill is presented. */
  controls?: ReactNode;
  /** The neck diagram. */
  board?: ReactNode;
  /** Progress, Next, dev shortcuts — reads under the board. */
  footer?: ReactNode;
  className?: string;
  /** Widens the side rail for prompts that need more than one tile. */
  railClassName?: string;
}

/**
 * Shared frame for every "target + fretboard" drill (click hunts, interval
 * clicks, mic hunts).
 *
 * The neck is a very wide, short shape; the prompt is a narrow, tall one. Stacked
 * they waste a screenful of height and push the board off short viewports, so on
 * wide screens the prompt moves into a side rail and the board keeps the rest of
 * the width. Below `xl` everything falls back into one centered column — the neck
 * renders identically either way, it just gets the width it gets.
 */
export function HuntStage({
  awaitingStart,
  stats,
  prompt,
  controls,
  board,
  footer,
  className,
  railClassName,
}: HuntStageProps) {
  return (
    <div
      className={cn(
        "relative flex w-full max-w-7xl flex-col items-center gap-4",
        "xl:flex-row xl:items-center xl:justify-center xl:gap-8",
        className,
      )}>
      <AnimatePresence>
        {awaitingStart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-950/40 backdrop-blur-[1px]">
            <span className="rounded-lg bg-zinc-900/90 px-5 py-3 text-center text-sm font-bold tracking-wide text-amber-200">
              ▶ Press Play below to start the timer
              <br />
              <span className="text-xs font-semibold text-zinc-400">you can click right away</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("flex w-full flex-col items-center gap-3 xl:w-48 xl:shrink-0 xl:gap-4", railClassName)}>
        {stats}
        {prompt}
        {controls}
      </div>

      {(board || footer) && (
        <div className="flex w-full min-w-0 flex-col items-center gap-3 xl:flex-1">
          {board}
          {footer}
        </div>
      )}
    </div>
  );
}

interface HuntStatsProps {
  score?: number;
  mistakes?: { count: number; limit: number };
  /** `null` when the drill isn't on a rotation timer. */
  secondsLeft?: number | null;
  complete?: boolean;
  /** Drill-specific pills (e.g. the chromatic hunt's note counter). */
  children?: ReactNode;
}

/** The pill row every hunt panel opens with. */
export function HuntStats({ score, mistakes, secondsLeft, complete, children }: HuntStatsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {children}
      {score !== undefined && (
        <span className="rounded bg-amber-500/10 px-3 py-1 text-sm font-extrabold tabular-nums text-amber-400">
          ★ {score}
        </span>
      )}
      {mistakes && (
        <span className="rounded bg-zinc-800/40 px-3 py-1 text-sm font-extrabold tabular-nums text-zinc-400">
          ✕ {mistakes.count}/{mistakes.limit}
        </span>
      )}
      {secondsLeft !== null && secondsLeft !== undefined && (
        <span
          className={cn(
            "rounded px-3 py-1 text-sm font-extrabold tabular-nums transition-colors",
            complete
              ? "bg-emerald-500/10 text-emerald-400"
              : secondsLeft <= 5
                ? "animate-pulse bg-red-500/10 text-red-300"
                : "bg-zinc-800/40 text-zinc-200",
          )}>
          {secondsLeft}s
        </span>
      )}
    </div>
  );
}

const CHIP_TONES = {
  neutral: "bg-zinc-800/40 text-zinc-300",
  cyan: "bg-cyan-500/10 text-cyan-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
} as const;

/** Small scope/answer chip — "frets 0–12", "the B string", "✓ it was D#". */
export function HuntChip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof CHIP_TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("rounded px-2.5 py-1 text-xs font-bold", CHIP_TONES[tone], className)}>{children}</span>
  );
}

interface HuntTargetCardProps {
  /** The note (or prompt title) the drill is asking for. */
  value: ReactNode;
  complete: boolean;
  /** Drives the found/complete flourish. */
  foundCount: number;
  /** Re-runs the swap animation — pass the target note so a new one animates in. */
  animationKey?: string;
}

/** The big note tile every hunt leads with. */
export function HuntTargetCard({ value, complete, foundCount, animationKey }: HuntTargetCardProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "absolute -inset-2 rounded-lg blur-[16px] transition-opacity duration-500",
          complete ? "bg-emerald-500/40 opacity-100" : "bg-cyan-500/10 opacity-60",
        )}
      />
      <HuntSuccessBurst foundCount={foundCount} complete={complete} />
      <motion.div
        animate={complete ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg transition-colors duration-500 sm:h-24 sm:w-24",
          complete ? "bg-emerald-900/80" : "bg-zinc-900/90",
        )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={animationKey ?? String(value)}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.85 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="font-display text-4xl font-black tracking-tighter text-white sm:text-5xl">
            {value}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
