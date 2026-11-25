import { Button, PRESSABLE, PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Square, Volume2 } from "lucide-react";
import type { ReactNode } from "react";

import type { EarQuizStats } from "../../hooks/useEarQuizGame";

/** Right answers in a row from which the streak is worth a word. */
const MIN_SHOWN_STREAK = 3;

/** One slim row over the question: the pause note, and the streak once there is one. */
export function EarQuizStatus({ stats, isPaused }: { stats: EarQuizStats; isPaused: boolean }) {
  const { t } = useTranslation("session");
  return (
    <div className='flex min-h-5 items-center justify-between gap-4'>
      <span className='text-sm text-zinc-400'>{isPaused && t("quiz.paused_note")}</span>
      {stats.streak >= MIN_SHOWN_STREAK && (
        <span className='shrink-0 text-sm font-bold text-orange-400'>
          {t("combo.in_a_row", { count: stats.streak })}
        </span>
      )}
    </div>
  );
}

/** What every listening panel is laid out as: the question and its listen keys,
 *  then the answers. Sideways the two stand beside each other. */
export function EarQuizLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex flex-col gap-6 text-left shortwide:grid shortwide:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] shortwide:items-center shortwide:gap-6'>
      {children}
    </div>
  );
}

/** How a round went, said where the question stood. */
export interface QuizVerdict {
  isCorrect: boolean;
  /** The answer, spelled out: "C7 — Dominant 7". */
  answer: string;
  /** Why it sounds like that. */
  detail: string;
  /** Plays the round once more. */
  onHear: () => void;
  /** The round is a toggle (the tuning drone) and it is sounding: Hear it stops it. */
  isSounding?: boolean;
  /** A second way to hear it that is still worth having once the answer is known. */
  aid?: { icon: ReactNode; label: string; onClick: () => void };
  onContinue: () => void;
}

/** A step up from the strip: the plain secondary key is the wrong answer's own grey. */
const VERDICT_KEY = "bg-zinc-700 px-4 text-zinc-100 hover:bg-zinc-600";

/** The answer as the session's strips say it: what happened on the left, what
 *  next on the right, across the whole card where there is one (the width comes
 *  from ExerciseContentArea). On a phone it is stacked, inside the panel. */
function QuizVerdictStrip({ verdict }: { verdict: QuizVerdict }) {
  const { t } = useTranslation("session");
  const { isCorrect, answer, detail, onHear, isSounding, aid, onContinue } = verdict;
  const hearLabel = isSounding ? t("quiz.stop") : t("quiz.hear_it");
  return (
    <div
      className={cn(
        "ml-[calc((100%-var(--quiz-strip-width,100%))/2)] w-[var(--quiz-strip-width,100%)] self-center rounded-[var(--quiz-strip-radius,0.5rem)] duration-slow [grid-area:1/1] animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none",
        isCorrect ? "bg-emerald-950" : "bg-zinc-800",
      )}>
      <div className='mx-auto flex max-w-6xl flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-5 shortwide:flex-col shortwide:items-stretch shortwide:gap-3 shortwide:p-4'>
        <div className='min-w-0 flex-1 space-y-1' aria-live='polite'>
          <p className={cn("text-lg font-bold leading-tight [text-wrap:balance] sm:text-xl shortwide:text-base", isCorrect ? "text-emerald-300" : "text-zinc-100")}>
            {answer}
          </p>
          <p className='text-sm leading-snug text-zinc-300 shortwide:text-xs'>{detail}</p>
        </div>
        <div className='flex shrink-0 items-center gap-2 sm:gap-3'>
          {aid && (
            <Button variant='secondary' size='lg' onClick={aid.onClick} aria-label={aid.label} title={aid.label} className={VERDICT_KEY}>
              {aid.icon}
            </Button>
          )}
          <Button variant='secondary' size='lg' onClick={onHear} aria-label={hearLabel} className={cn(VERDICT_KEY, "sm:px-6 shortwide:px-4")}>
            {isSounding ? <Square /> : <Volume2 />}
            <span className='hidden sm:inline shortwide:hidden'>{hearLabel}</span>
          </Button>
          {/* Focused, so Enter and Space carry on. */}
          <Button size='lg' autoFocus onClick={onContinue} className='flex-1 sm:flex-none shortwide:flex-1'>
            {t("verdict.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The question side: what is asked, an optional line it can't do without, and
 *  the keys. Answered, the verdict takes its place — the question stays laid out
 *  under it, so the answers below don't move. */
export function QuizPrompt({
  question,
  hint,
  verdict,
  children,
}: {
  question: string;
  hint?: ReactNode;
  verdict?: QuizVerdict | null;
  children: ReactNode;
}) {
  return (
    <div className='grid grid-cols-[minmax(0,1fr)]'>
      <div className={cn("flex flex-col gap-4 [grid-area:1/1] shortwide:gap-3", verdict && "invisible")}>
        <div className='space-y-1'>
          <p className='font-display text-2xl font-extrabold leading-tight tracking-tight text-zinc-50 [text-wrap:balance] shortwide:text-xl'>
            {question}
          </p>
          {hint && <p className='text-sm text-zinc-400'>{hint}</p>}
        </div>
        <div className='flex items-end gap-3'>{children}</div>
      </div>
      {verdict && <QuizVerdictStrip verdict={verdict} />}
    </div>
  );
}

interface ListenKeyProps {
  onClick: () => void;
  isPlaying: boolean;
  /** Said to a screen reader and on hover — the key itself is only the icon. */
  label: string;
  /** The tuning drone toggles, so it shows Stop while it sounds. */
  stopIcon?: boolean;
}

/** The one big key: hear the thing you are being asked about. */
export function ListenKey({ onClick, isPlaying, label, stopIcon }: ListenKeyProps) {
  const { t } = useTranslation("session");
  const text = isPlaying ? t("quiz.stop") : label;
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={text}
      title={text}
      className={cn(
        PRESSABLE,
        "flex h-[6.5rem] w-[6.5rem] shrink-0 items-center justify-center rounded-lg border-b-black/25 bg-zinc-100 text-zinc-950 transition-colors duration-fast hover:bg-white shortwide:h-[5.5rem] shortwide:w-[5.5rem]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      )}>
      {isPlaying && stopIcon
        ? <Square aria-hidden className='h-9 w-9' />
        : <Volume2 aria-hidden className={cn("h-12 w-12 shortwide:h-10 shortwide:w-10", isPlaying && "animate-pulse motion-reduce:animate-none")} />}
    </button>
  );
}

/** A second way to hear it (arpeggio, together, tonic, slower), beside the big key. */
export function ListenAidKey({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        PRESSABLE_KEY,
        "flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-100 transition-colors duration-fast hover:bg-zinc-600 shortwide:h-[3.75rem] shortwide:w-[3.75rem]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:h-7 [&_svg]:w-7",
      )}>
      {icon}
    </button>
  );
}

/** The key's number on the keyboard, in a tile's corner. Not on a phone. */
export const KeyNumber = ({ n }: { n: number }) => (
  <span aria-hidden className='absolute left-2.5 top-2.5 hidden rounded bg-black/25 px-1.5 py-1 text-xs font-semibold leading-none text-zinc-400 sm:block shortwide:hidden'>
    {n}
  </span>
);

type AnswerState = "idle" | "correct" | "wrong" | "muted";

const TILE_MOTION: Record<AnswerState, { scale?: number[]; x?: number[] }> = {
  idle: {},
  correct: { scale: [1, 1.04, 1] },
  wrong: { x: [0, -7, 7, -5, 5, -2, 0] },
  muted: {},
};

interface AnswerTileProps {
  onClick: () => void;
  state: AnswerState;
  /** Its place in the grid, from 1 — the number key that picks it. */
  number: number;
  title: string;
  /** Shown once the round is answered. Always laid out (just hidden until then),
   *  so revealing it doesn't make the tile taller. */
  subtitle?: string;
  /** Answered, the tile plays its own option instead — set to its label
   *  ("Hear Minor 7 from C") so the speaker icon has words behind it. */
  listenLabel?: string;
  /** This tile's option is the one sounding right now. */
  isSounding?: boolean;
  /** One of many: sideways on a phone it gives up height and its corner icon. */
  dense?: boolean;
}

/** One option in an answer grid: a key, whose verdict is its face and a small
 *  pop (right) or shake (wrong). */
export function AnswerTile({ onClick, state, number, title, subtitle, listenLabel, isSounding, dense }: AnswerTileProps) {
  const isListenable = listenLabel !== undefined;
  return (
    <motion.button
      type='button'
      onClick={onClick}
      title={listenLabel}
      aria-label={listenLabel}
      animate={TILE_MOTION[state]}
      transition={{ duration: state === "wrong" ? 0.4 : 0.3, ease: "easeOut" }}
      className={cn(
        PRESSABLE_KEY,
        // px-8 keeps both corners clear of the label, before and after the
        // speaker appears, so the text never re-wraps when the round settles.
        "group relative flex min-h-[72px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-8 py-2.5 text-center transition-colors duration-fast",
        dense ? "shortwide:min-h-[50px] shortwide:gap-0 shortwide:px-1 shortwide:py-1" : "shortwide:min-h-[60px]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        state === "idle" && "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
        state === "correct" && "bg-emerald-900 text-emerald-200 hover:bg-emerald-800",
        state === "wrong" && "bg-red-950 text-red-200 hover:bg-red-900",
        state === "muted" && "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
        isSounding && state === "muted" && "bg-zinc-800 text-zinc-200",
      )}>
      <KeyNumber n={number} />
      {/* Pinned to the corner so turning into a player doesn't grow the tile. */}
      {isListenable && (
        <span aria-hidden className={cn("absolute right-2.5 top-2.5", dense && "shortwide:hidden")}>
          <Volume2 className={cn("h-4 w-4 opacity-70", isSounding && "animate-pulse opacity-100 motion-reduce:animate-none")} />
        </span>
      )}
      <span className={cn("text-base font-bold leading-tight", dense && "shortwide:text-sm")}>{title}</span>
      {subtitle !== undefined && (
        <span className={cn("text-xs font-medium leading-tight", state === "idle" && "invisible")}>{subtitle}</span>
      )}
    </motion.button>
  );
}
