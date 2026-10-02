import { cn } from "assets/lib/utils";

import type { TimingCounts, TimingGrade } from "../utils/timingGrade";

const GRADES: TimingGrade[] = [3, 2, 1];

// Only "on time" gets a colour — the tab's own hit green. The rest stay neutral:
// a beginner should read them as room to grow, not as a warning.
const GRADE_STYLE: Record<TimingGrade, { label: string; bar: string; chip: string }> = {
  3: { label: "On time", bar: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-400" },
  2: { label: "Close",   bar: "bg-zinc-500",    chip: "bg-zinc-800 text-zinc-300" },
  1: { label: "Loose",   bar: "bg-zinc-700",    chip: "bg-zinc-800 text-zinc-400" },
};

interface TimingBreakdownProps {
  timing: TimingCounts;
  className?: string;
}

/**
 * How the run's hits split across timing grades — and why the score came out
 * lower than the hit count suggests when some of them were off the beat.
 */
export const TimingBreakdown = ({ timing, className }: TimingBreakdownProps) => {
  const total = timing[3] + timing[2] + timing[1];
  if (total === 0) return null;
  const onTimePct = Math.round((timing[3] / total) * 100);

  return (
    <div className={className}>
      <div className='flex items-baseline justify-between'>
        <p className='text-[11px] font-semibold tracking-wide text-zinc-500'>Timing</p>
        <p className='text-[11px] tabular-nums text-zinc-400'>{onTimePct}% on time</p>
      </div>

      <div className='mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full' aria-hidden>
        {GRADES.filter((grade) => timing[grade] > 0).map((grade) => (
          <div key={grade} className={cn("h-full", GRADE_STYLE[grade].bar)} style={{ flexGrow: timing[grade] }} />
        ))}
      </div>

      <div className='mt-4 grid grid-cols-3 gap-2'>
        {GRADES.map((grade) => (
          <div key={grade} className='flex items-center gap-2.5'>
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                GRADE_STYLE[grade].chip
              )}>
              {grade}
            </span>
            <div>
              <div className='text-sm font-bold leading-none tabular-nums text-zinc-100'>{timing[grade]}</div>
              <div className='mt-1 text-[11px] text-zinc-500'>{GRADE_STYLE[grade].label}</div>
            </div>
          </div>
        ))}
      </div>

      {timing[3] < total && (
        <p className='mt-4 text-xs leading-relaxed text-zinc-400'>
          A note off the beat still counts, but for less: a 2 keeps two thirds of its points, a 1 keeps a third.
        </p>
      )}
    </div>
  );
};
