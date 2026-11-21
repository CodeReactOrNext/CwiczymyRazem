import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
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
  /** Ready to run right now — drives the accent. */
  ready: boolean;
  accent: JobAccent;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * One action on the bench.
 *
 * The bench answers "what can I do and is it possible"; every number behind that
 * answer lives in the dialog this opens. Two readable rows beat two dense panels.
 *
 * A job that cannot run yet says so by going grey — icon and gain both — and
 * keeps what it is worth on show. What it is short of is the dialog's to say;
 * a line of orange on the card read as a telling-off.
 */
export const JobCard = ({
  icon: Icon,
  title,
  summary,
  gain,
  ready,
  accent,
  disabled = false,
  onClick,
}: JobCardProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center gap-5 overflow-hidden rounded-lg border border-arsenal-border bg-arsenal-section p-6 text-left transition-colors duration-fast click-behavior",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:border-arsenal-accent/30 hover:bg-arsenal-card",
      )}>
      {/*
        The plate is a layer rather than the button's own background: the card
        still wants its own hover underneath, and a grid drawn in `style` cannot
        be brightened on hover the way a class can.
      */}
      <span
        aria-hidden
        className='light-hide pointer-events-none absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60'
        style={PLATES[accent]}
      />
      {ready && !disabled && <ReadyShine />}
      <span
        className={cn(
          "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg",
          ready ? ACCENTS[accent].bg : "bg-arsenal-card",
        )}>
        <Icon
          size={24}
          className={cn(
            ready ? ACCENTS[accent].fg : "text-arsenal-text-tertiary",
          )}
        />
      </span>

      <span className='relative flex min-w-0 flex-1 flex-col gap-1.5'>
        <span className='text-lg font-semibold text-arsenal-text-primary'>
          {title}
        </span>
        <span className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-arsenal-text-secondary'>
          {summary}
        </span>
      </span>

      <span className='relative flex shrink-0 items-center gap-4'>
        {gain != null && (
          <span className='flex flex-col items-end gap-0.5'>
            <CountUp
              value={gain}
              prefix='+'
              className={cn(
                "text-3xl font-black tabular-nums",
                ready ? ACCENTS[accent].fg : "text-arsenal-text-tertiary",
              )}
            />
            <span className='text-sm text-arsenal-text-tertiary'>
              {t("workshop.levels_word", { count: gain })}
            </span>
          </span>
        )}

        <ChevronRight size={18} className='text-arsenal-text-tertiary' />
      </span>
    </button>
  );
};
