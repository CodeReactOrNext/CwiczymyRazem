import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Flame, Play, RotateCcw, Square, Trophy, X } from "lucide-react";
import type { ReactNode } from "react";

import type { EarQuizStats } from "../../hooks/useEarQuizGame";

/** Header: what the quiz is, and how the session is going. */
export function EarQuizHeader({ label, stats }: { label: string; stats: EarQuizStats }) {
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null;

  return (
    <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2'>
      <p className='text-sm font-medium text-zinc-400'>{label}</p>

      <div className='flex items-center gap-5 text-xs tabular-nums text-zinc-400'>
        {accuracy !== null && (
          <span>
            <span className='font-semibold text-zinc-100'>{stats.correct}</span>
            <span className='text-zinc-500'>/{stats.answered}</span>
            <span className='ml-1.5 text-zinc-500'>{accuracy}%</span>
          </span>
        )}
        <span className={cn("flex items-center gap-1.5", stats.streak > 0 ? "text-orange-400" : "text-zinc-500")}>
          <Flame className='h-3.5 w-3.5' aria-hidden />
          <span className='font-semibold'>{stats.streak}</span>
        </span>
        {stats.bestStreak > 0 && (
          <span className='flex items-center gap-1.5 text-amber-400'>
            <Trophy className='h-3.5 w-3.5' aria-hidden />
            <span className='font-semibold'>{stats.bestStreak}</span>
          </span>
        )}
      </div>
    </div>
  );
}

interface ListenButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  /** Label before anything has been played; afterwards it becomes "Play again". */
  label?: string;
  hasPlayed?: boolean;
  className?: string;
}

/** The primary action of every quiz: hear the thing you're being asked about. */
export function ListenButton({ onClick, isPlaying, label = "Play", hasPlayed, className }: ListenButtonProps) {
  return (
    <Button
      size='lg'
      onClick={onClick}
      className={cn(
        "h-12 min-w-[168px] gap-2 bg-cyan-500/15 text-base font-semibold text-cyan-300 hover:bg-cyan-500/25",
        className,
      )}>
      {isPlaying ? <Square className='h-4 w-4' /> : hasPlayed ? <RotateCcw className='h-4 w-4' /> : <Play className='h-4 w-4' />}
      {isPlaying ? "Stop" : hasPlayed ? "Play again" : label}
    </Button>
  );
}

/** Secondary listening aid (arpeggio, tonic reference, slow replay …). */
export function QuizSecondaryButton({
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
    <Button
      size='lg'
      variant='ghost'
      onClick={onClick}
      disabled={disabled}
      className='h-12 gap-2 bg-zinc-800/40 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'>
      {icon}
      {children}
    </Button>
  );
}

type AnswerState = "idle" | "correct" | "wrong" | "muted";

interface AnswerTileProps {
  onClick: () => void;
  state: AnswerState;
  disabled?: boolean;
  title: string;
  subtitle?: string;
}

/** One option in an answer grid — big tap target, verdict shown by background. */
export function AnswerTile({ onClick, state, disabled, title, subtitle }: AnswerTileProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-3 text-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none",
        state === "idle" && "bg-zinc-800/40 text-zinc-100 hover:bg-zinc-800",
        state === "correct" && "bg-emerald-500/10 text-emerald-400",
        state === "wrong" && "bg-red-500/10 text-red-400",
        state === "muted" && "bg-zinc-800/20 text-zinc-500",
      )}>
      <span className='text-sm font-semibold leading-tight'>{title}</span>
      {subtitle && <span className='text-xs leading-tight opacity-70'>{subtitle}</span>}
    </button>
  );
}

interface QuizVerdictProps {
  isCorrect: boolean;
  /** The answer, spelled out: "C7 — Dominant 7". */
  answer: string;
  /** Why it sounds like that. */
  explanation?: string;
  /** Extra line, e.g. songs the progression shows up in. */
  footnote?: string;
  onNext: () => void;
  /** Optional listen-again control rendered next to Next. */
  extraAction?: ReactNode;
}

/** Verdict + the teaching moment + the way on to the next round. */
export function QuizVerdict({ isCorrect, answer, explanation, footnote, onNext, extraAction }: QuizVerdictProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex flex-col gap-4 rounded-lg p-4 sm:p-5", isCorrect ? "bg-emerald-500/10" : "bg-red-500/10")}>
      <div className='flex items-start gap-3'>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400",
          )}>
          {isCorrect ? <Check className='h-4 w-4' aria-label='Correct' /> : <X className='h-4 w-4' aria-label='Wrong' />}
        </span>

        <div className='min-w-0 space-y-1.5'>
          <p className={cn("text-base font-semibold", isCorrect ? "text-emerald-400" : "text-red-400")}>{answer}</p>
          {explanation && <p className='text-sm text-zinc-300'>{explanation}</p>}
          {footnote && <p className='text-xs text-zinc-400'>{footnote}</p>}
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <Button onClick={onNext} className='h-10 gap-2 bg-zinc-100 font-semibold text-zinc-900 hover:bg-white'>
          Next
          <ArrowRight className='h-4 w-4' />
        </Button>
        {extraAction}
      </div>
    </motion.div>
  );
}

/** Frame every quiz shares: one card, generous spacing, no nested surfaces. */
export function EarQuizCard({ children }: { children: ReactNode }) {
  return (
    <div className='mx-auto w-full max-w-3xl'>
      <div className='flex flex-col gap-6 rounded-lg bg-zinc-900/60 p-5 sm:p-6'>{children}</div>
    </div>
  );
}

/** Nudge to start the session timer — the quiz itself stays fully usable. */
export function StartTimerHint() {
  return (
    <p className='flex items-center justify-center gap-2 text-xs text-amber-400'>
      <Play className='h-3 w-3' aria-hidden />
      Press Play below to start the timer — the quiz already works
    </p>
  );
}

/** Fades a block in when it appears (verdicts, revealed hints). */
export function QuizReveal({ show, children }: { show: boolean; children: ReactNode }) {
  return <AnimatePresence initial={false}>{show ? children : null}</AnimatePresence>;
}
