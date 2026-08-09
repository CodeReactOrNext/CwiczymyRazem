import { cn } from "assets/lib/utils";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface RequirementRowProps {
  label: string;
  /** Sits before the label — for a requirement paid in a currency, not in parts. */
  icon?: ReactNode;
  /** What the job asks for, and what the player currently holds. */
  need: number;
  have: number;
  /** Overrides the derived "have ≥ need" verdict (used by the condition gate). */
  ok?: boolean;
  /** Replaces the numeric readout — e.g. a condition grade name. */
  valueOverride?: ReactNode;
  children?: ReactNode;
}

/**
 * One non-parts requirement — the condition gate and the Fame charge. Parts have
 * their own list, where each line carries its own progress.
 *
 * The readout is deliberately *not* "23 of 6": with stock on the left that reads
 * as a fraction and lands backwards. Saying what is held and what is asked for as
 * two separate statements is unambiguous in both directions.
 */
export const RequirementRow = ({
  label,
  icon,
  need,
  have,
  ok,
  valueOverride,
  children,
}: RequirementRowProps) => {
  const satisfied = ok ?? have >= need;
  const short = Math.max(0, need - have);

  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex items-baseline justify-between gap-4'>
        <span className='flex items-center gap-2'>
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
              satisfied ? "bg-emerald-500/15" : "bg-zinc-800",
            )}>
            {satisfied ? (
              <Check size={10} strokeWidth={3} className='text-emerald-400' />
            ) : (
              <span className='h-1 w-1 rounded-full bg-zinc-500' />
            )}
          </span>
          {icon}
          <span
            className={cn(
              "text-sm",
              satisfied ? "text-zinc-300" : "text-zinc-400",
            )}>
            {label}
          </span>
        </span>

        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            satisfied ? "text-emerald-400" : "text-amber-400",
          )}>
          {valueOverride ??
            (satisfied
              ? `have ${have.toLocaleString()}`
              : `${short.toLocaleString()} short`)}
        </span>
      </div>

      {children}

      {!valueOverride && (
        <span className='text-xs text-zinc-500'>
          needs {need.toLocaleString()}
          {!satisfied && ` · you have ${have.toLocaleString()}`}
        </span>
      )}
    </div>
  );
};
