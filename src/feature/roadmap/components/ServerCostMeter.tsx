import { cn } from "assets/lib/utils";
import { Check, Server } from "lucide-react";

import { MONTHLY_RUNNING_COST } from "../data/roadmap.data";

/**
 * Slim one-line strip showing how much of this month's hosting bill the
 * community has covered. Kept compact on purpose so it reads as a quiet status
 * line, not another headline next to the roadmap bar.
 */
export const ServerCostMeter = ({
  raisedThisMonth,
}: {
  raisedThisMonth: number;
}) => {
  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;
  const pct = Math.min(100, (raisedThisMonth / MONTHLY_RUNNING_COST) * 100);

  return (
    <div className='mt-4 flex items-center gap-3 text-sm'>
      <Server size={15} className='shrink-0 text-zinc-500' />
      <span className='shrink-0 text-zinc-400'>Server cost this month</span>

      {/* Mini bar fills the middle */}
      <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800'>
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isCovered ? "bg-emerald-500" : "bg-cyan-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className='shrink-0 font-medium text-zinc-300'>
        ${covered} / ${MONTHLY_RUNNING_COST}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 font-medium",
          isCovered ? "text-emerald-400" : "text-zinc-500"
        )}>
        {isCovered ? (
          <>
            <Check size={13} strokeWidth={3} /> Covered
          </>
        ) : (
          `$${MONTHLY_RUNNING_COST - raisedThisMonth} to go`
        )}
      </span>
    </div>
  );
};
