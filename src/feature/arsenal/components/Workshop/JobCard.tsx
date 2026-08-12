import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { dotWash, hatchWash, plateStyle, QUIET_WASH } from "./blueprintPlate";
import { CountUp, ReadyShine } from "./workshopMotion";

type JobAccent = "emerald" | "cyan" | "purple";

const ACCENTS: Record<JobAccent, { bg: string; fg: string }> = {
  emerald: { bg: "bg-emerald-500/15", fg: "text-emerald-400" },
  cyan: { bg: "bg-cyan-500/15", fg: "text-cyan-400" },
  purple: { bg: "bg-purple-500/15", fg: "text-purple-400" },
};

/**
 * A surface per kind of work, so the three cards are told apart by material and not
 * only by the colour of one icon: grain for the job that brings a finish back,
 * plotted points for the one that adds to the build, and the mods' own drafting grid
 * for the one that leads into a wall of blueprint parts.
 */
const PLATES: Record<JobAccent, CSSProperties> = {
  emerald: {
    backgroundImage: `${hatchWash("rgba(160,255,215,0.055)")}, ${QUIET_WASH.emerald}`,
    backgroundSize: "auto, cover",
  },
  cyan: {
    backgroundImage: `${dotWash("rgba(150,220,255,0.13)")}, ${QUIET_WASH.cyan}`,
    backgroundSize: "22px 22px, cover",
  },
  purple: plateStyle("30px", QUIET_WASH.navy),
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
        "group relative flex items-center gap-5 overflow-hidden rounded-lg bg-zinc-900/40 p-6 text-left transition-colors click-behavior",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:bg-zinc-900/70",
      )}>
      {/*
        The plate is a layer rather than the button's own background: the card
        still wants its zinc hover underneath, and a grid drawn in `style` cannot
        be brightened on hover the way a class can.
      */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-95'
        style={PLATES[accent]}
      />
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

      <span className='relative flex min-w-0 flex-1 flex-col gap-1.5'>
        <span className='text-lg font-black text-white'>{title}</span>
        <span className='flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-zinc-400'>
          {summary}
        </span>
        {note && (
          <span className={cn("text-sm sm:hidden", noteClass)}>{note}</span>
        )}
      </span>

      <span className='relative flex shrink-0 items-center gap-4'>
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
