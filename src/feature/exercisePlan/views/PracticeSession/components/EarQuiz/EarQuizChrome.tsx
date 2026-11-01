import { PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowRight,
  Check,
  Flame,
  Play,
  RotateCcw,
  Square,
  Trophy,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import type { EarQuizStats } from "../../hooks/useEarQuizGame";

/** One labelled counter in the header — a bare flame and a number read as
 *  nothing in particular, so each one says what it counts. */
function QuizStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <span className='flex items-center gap-2 rounded-lg bg-zinc-800/40 px-3 py-1.5'>
      <span className={cn("flex [&_svg]:h-4 [&_svg]:w-4", tone)} aria-hidden>
        {icon}
      </span>
      {/* Keyed on the value so a new streak count pops in. */}
      <motion.span
        key={value}
        initial={{ scale: 1.4, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 20 }}
        className={cn("text-sm font-bold", value > 0 ? "text-zinc-100" : "text-zinc-500")}>
        {value}
      </motion.span>
      <span className='text-xs font-medium text-zinc-500'>{label}</span>
    </span>
  );
}

/** Header: what the quiz is, and how the session is going. */
export function EarQuizHeader({
  label,
  stats,
  hint,
}: {
  label: string;
  stats: EarQuizStats;
  /** Sideways the timer nudge rides in this row instead of taking one of its own. */
  hint?: ReactNode;
}) {
  const { t } = useTranslation("session");
  const accuracy =
    stats.answered > 0
      ? Math.round((stats.correct / stats.answered) * 100)
      : null;

  return (
    <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2'>
      <p className='text-sm font-semibold text-zinc-400'>{label}</p>
      {hint}

      <div className='flex items-center gap-2 tabular-nums'>
        {accuracy !== null && (
          <span className='flex items-baseline gap-1.5 rounded-lg bg-zinc-800/40 px-3 py-1.5 text-sm'>
            <span className='font-bold text-zinc-100'>
              {stats.correct}
              <span className='font-medium text-zinc-500'>/{stats.answered}</span>
            </span>
            <span className='text-xs font-medium text-zinc-500'>{accuracy}%</span>
          </span>
        )}
        <QuizStat
          icon={<Flame />}
          value={stats.streak}
          label={t("quiz.streak", "Streak")}
          tone={stats.streak > 0 ? "text-orange-400" : "text-zinc-500"}
        />
        {stats.bestStreak > 0 && (
          <QuizStat
            icon={<Trophy />}
            value={stats.bestStreak}
            label={t("quiz.best_streak", "Best")}
            tone='text-amber-400'
          />
        )}
      </div>
    </div>
  );
}

/**
 * Every quiz button is the same game-style key. Plain buttons rather than
 * <Button>: that one wraps its children in a span without the gap, so the icon
 * sat glued to the label.
 */
const QUIZ_KEY = cn(
  PRESSABLE_KEY,
  "inline-flex items-center justify-center gap-2.5 rounded-lg px-5 text-sm font-bold transition-colors",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
  "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
);

/** The white key: the one thing to press next. */
const PRIMARY_FACE = "bg-zinc-100 text-zinc-900 hover:bg-white";
const SECONDARY_FACE = "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100";

/** Same footprint for the listen button and the Next that takes its place. */
const PRIMARY_SIZE = "h-11 min-w-[168px]";

interface ListenButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  /** Label before anything has been played; afterwards it becomes "Play again". */
  label?: string;
  hasPlayed?: boolean;
  className?: string;
}

/** The primary action of every quiz: hear the thing you're being asked about. */
export function ListenButton({
  onClick,
  isPlaying,
  label,
  hasPlayed,
  className,
}: ListenButtonProps) {
  const { t } = useTranslation("session");
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(QUIZ_KEY, PRIMARY_SIZE, PRIMARY_FACE, className)}>
      {isPlaying ? <Square /> : hasPlayed ? <RotateCcw /> : <Play />}
      {isPlaying ? t("quiz.stop") : hasPlayed ? t("quiz.play_again") : (label ?? t("quiz.play"))}
    </button>
  );
}

/** White action key for the in-card steps (Check, That's in tune). */
export function QuizPrimaryButton({
  onClick,
  icon,
  children,
  disabled,
}: {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(QUIZ_KEY, "h-10", PRIMARY_FACE)}>
      {icon}
      {children}
    </button>
  );
}

/** Secondary listening aid (arpeggio, tonic reference, slow replay …). */
export function QuizSecondaryButton({
  onClick,
  icon,
  children,
  disabled,
  className,
}: {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(QUIZ_KEY, "h-11", SECONDARY_FACE, className)}>
      {icon}
      {children}
    </button>
  );
}

/**
 * Cross-fades one piece of the card into another in the same spot. Both are
 * stacked in a single grid cell while they swap, so the card never collapses
 * and re-grows around them — nothing below moves.
 */
function QuizSwap({
  swapKey,
  children,
  className,
}: {
  swapKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid w-full justify-items-center [&>*]:col-start-1 [&>*]:row-start-1", className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={swapKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, pointerEvents: "none" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className='flex w-full justify-center'>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export interface QuizVerdictInfo {
  isCorrect: boolean;
  /** The answer, spelled out: "C7 — Dominant 7". */
  answer: string;
  /** Why it sounds like that. */
  explanation?: string;
  /** Extra hint after the explanation, e.g. songs the progression shows up in. */
  footnote?: string;
}

/**
 * The question line. Once answered it turns into the verdict in place — the
 * answer, marked right or wrong — instead of a verdict box opening under the
 * card and shoving everything down.
 */
export function QuizQuestion({
  question,
  verdict,
}: {
  question: string;
  verdict?: QuizVerdictInfo | null;
}) {
  const { t } = useTranslation("session");
  return (
    <QuizSwap swapKey={verdict ? "verdict" : "question"}>
      {verdict ? (
        <p
          className={cn(
            "flex items-center justify-center gap-2.5 text-center text-xl font-bold tracking-tight",
            verdict.isCorrect ? "text-emerald-400" : "text-red-400",
          )}>
          <motion.span
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              verdict.isCorrect ? "bg-emerald-500/20" : "bg-red-500/20",
            )}>
            {verdict.isCorrect ? (
              <Check className='h-4 w-4' strokeWidth={3} aria-label={t("quiz.correct")} />
            ) : (
              <X className='h-4 w-4' strokeWidth={3} aria-label={t("quiz.wrong")} />
            )}
          </motion.span>
          {verdict.answer}
        </p>
      ) : (
        <p className='text-center text-xl font-bold tracking-tight text-zinc-100'>
          {question}
        </p>
      )}
    </QuizSwap>
  );
}

/**
 * The small line under the listen buttons: a hint while the round is open, the
 * teaching moment once it's answered. Two lines are always reserved for it, so
 * a longer explanation doesn't move the answers below.
 */
export function QuizNote({
  hint,
  verdict,
}: {
  hint: ReactNode;
  verdict?: QuizVerdictInfo | null;
}) {
  return (
    <QuizSwap swapKey={verdict ? "verdict" : "hint"} className='min-h-[2.5rem]'>
      {verdict ? (
        <p className='max-w-xl text-center text-sm leading-5 text-zinc-300'>
          {verdict.explanation}
          {verdict.footnote && (
            <span className='text-zinc-500'> {verdict.footnote}</span>
          )}
        </p>
      ) : (
        <p className='max-w-xl text-center text-xs leading-5 text-zinc-500'>{hint}</p>
      )}
    </QuizSwap>
  );
}

/**
 * The listen button's slot. Answered, Next takes its place at the same size —
 * the way on sits where the eye already is, and the row keeps its shape.
 */
export function QuizPrimarySlot({
  isAnswered,
  onNext,
  children,
}: {
  isAnswered: boolean;
  onNext: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation("session");
  return (
    <QuizSwap swapKey={isAnswered ? "next" : "listen"} className='w-auto'>
      {isAnswered ? (
        <button
          type='button'
          onClick={onNext}
          className={cn(QUIZ_KEY, PRIMARY_SIZE, PRIMARY_FACE)}>
          {t("quiz.next")}
          <ArrowRight />
        </button>
      ) : (
        children
      )}
    </QuizSwap>
  );
}

/** Swaps a quiz's in-card action row (Check / Clear …) for its answered one. */
export function QuizActionSwap({
  isAnswered,
  answered,
  children,
}: {
  isAnswered: boolean;
  answered: ReactNode;
  children: ReactNode;
}) {
  return (
    <QuizSwap swapKey={isAnswered ? "answered" : "open"}>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        {isAnswered ? answered : children}
      </div>
    </QuizSwap>
  );
}

type AnswerState = "idle" | "correct" | "wrong" | "muted";

const TILE_MOTION: Record<AnswerState, { scale?: number[]; x?: number[] }> = {
  idle: {},
  correct: { scale: [1, 1.06, 1] },
  wrong: { x: [0, -7, 7, -5, 5, -2, 0] },
  muted: {},
};

interface AnswerTileProps {
  onClick: () => void;
  state: AnswerState;
  disabled?: boolean;
  title: string;
  /** Shown once the round is answered. Always laid out (just hidden until then),
   *  so revealing it doesn't make the tile taller. */
  subtitle?: string;
}

/** One option in an answer grid — big tap target, verdict shown by background
 *  and a small pop (right) or shake (wrong). */
export function AnswerTile({
  onClick,
  state,
  disabled,
  title,
  subtitle,
}: AnswerTileProps) {
  return (
    <motion.button
      type='button'
      onClick={onClick}
      disabled={disabled}
      animate={TILE_MOTION[state]}
      transition={{ duration: state === "wrong" ? 0.4 : 0.3, ease: "easeOut" }}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-center transition-colors duration-base",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none",
        state === "idle" && "bg-zinc-800/40 text-zinc-100 hover:bg-zinc-800",
        state === "correct" && "bg-emerald-500/15 text-emerald-300",
        state === "wrong" && "bg-red-500/15 text-red-300",
        state === "muted" && "bg-zinc-800/20 text-zinc-500",
      )}>
      <span className='text-base font-bold leading-tight'>{title}</span>
      {subtitle !== undefined && (
        <span
          className={cn(
            "text-xs font-medium leading-tight tracking-wide opacity-70 transition-opacity duration-base",
            state === "idle" && "invisible opacity-0",
          )}>
          {subtitle}
        </span>
      )}
    </motion.button>
  );
}

/** Frame every quiz shares: one card, generous spacing, no nested surfaces. */
export function EarQuizCard({ children }: { children: ReactNode }) {
  return (
    <div className='mx-auto w-full max-w-3xl'>
      <div className='flex flex-col gap-5 rounded-lg bg-zinc-900/60 p-5 sm:p-6 shortwide:gap-4 shortwide:p-4'>
        {children}
      </div>
    </div>
  );
}

/** Nudge to start the session timer — the quiz itself stays fully usable. */
export function StartTimerHint({ className }: { className?: string }) {
  const { t } = useTranslation("session");
  return (
    <p className={cn('flex items-center justify-center gap-2 text-xs text-amber-400', className)}>
      <Play className='h-3 w-3' aria-hidden />
      {t("quiz.start_hint")}
    </p>
  );
}
