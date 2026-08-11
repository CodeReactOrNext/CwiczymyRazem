import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { CountUp, ReadyShine } from "./workshopMotion";

type JobAccent = "emerald" | "cyan" | "purple";

const ACCENTS: Record<JobAccent, { bg: string; fg: string }> = {
  emerald: { bg: "bg-emerald-500/15", fg: "text-emerald-400" },
  cyan: { bg: "bg-cyan-500/15", fg: "text-cyan-400" },
  purple: { bg: "bg-purple-500/15", fg: "text-purple-400" },
};

interface JobCardProps {
  icon: LucideIcon;
  title: string;
  /** What the job changes, in the item's own terms — text, or a visual stand-in. */
  summary: ReactNode;
  /** Level it is worth, when there is one. */
  gain?: number;
  /**
   * Shown in the gain's place for a job whose payoff is rolled, not fixed —
   * a mod is worth "somewhere in +1…+7", and printing a number would be a lie.
   */
  readyNote?: string;
  /** Ready to run right now — drives the accent and the status line. */
  ready: boolean;
  /** Shown instead of the gain when the job cannot run yet. */
  blockedNote?: string;
  accent: JobAccent;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * One action on the bench.
 *
 * The bench answers "what can I do and is it possible"; every number behind that
 * answer lives in the dialog this opens. Two readable rows beat two dense panels.
 */
export const JobCard = ({
  icon: Icon,
  title,
  summary,
  gain,
  readyNote,
  ready,
  blockedNote,
  accent,
  disabled = false,
  onClick,
}: JobCardProps) => {
  const showsGain = ready && gain != null;
  // The note is the whole answer to "why is this button grey?", so on a phone —
  // where there is no room for a right-hand column — it moves under the summary
  // rather than disappearing.
  const note = ready ? (showsGain ? undefined : readyNote) : blockedNote;
  const noteClass = ready ? ACCENTS[accent].fg : "text-amber-400/80";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-5 overflow-hidden rounded-lg bg-zinc-900/40 p-6 text-left transition-colors click-behavior",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:bg-zinc-900/70",
      )}>
      {ready && !disabled && <ReadyShine />}
      <span
        className={cn(
          "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg",
          ready ? ACCENTS[accent].bg : "bg-zinc-800/60",
        )}>
        <Icon
          size={24}
          className={cn(ready ? ACCENTS[accent].fg : "text-zinc-500")}
        />
      </span>

      <span className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <span className='text-lg font-black text-white'>{title}</span>
        <span className='flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-zinc-400'>
          {summary}
        </span>
        {note && (
          <span className={cn("text-sm sm:hidden", noteClass)}>{note}</span>
        )}
      </span>

      <span className='flex shrink-0 items-center gap-4'>
        {showsGain ? (
          <span className='flex flex-col items-end gap-0.5'>
            <CountUp
              value={gain}
              prefix='+'
              className={cn(
                "text-3xl font-black tabular-nums",
                ACCENTS[accent].fg,
              )}
            />
            <span className='text-sm text-zinc-500'>level</span>
          </span>
        ) : (
          note && (
            <span
              className={cn(
                "hidden max-w-[200px] text-right text-sm sm:block",
                noteClass,
              )}>
              {note}
            </span>
          )
        )}

        <ChevronRight size={18} className='text-zinc-600' />
      </span>
    </button>
  );
};
