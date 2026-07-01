import { cn } from "assets/lib/utils";
import { Check, Server } from "lucide-react";

import { MONTHLY_RUNNING_COST } from "../data/roadmap.data";

/**
 * Standalone card that spells out this month's hosting bill and how much of it
 * the community has already covered. Kept visually calmer than the roadmap, but
 * distinct enough that the running cost reads as a clear fact of its own.
 */
export const ServerCostMeter = ({
  raisedThisMonth,
}: {
  raisedThisMonth: number;
}) => {
  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;
  const remaining = Math.max(0, MONTHLY_RUNNING_COST - raisedThisMonth);
  const pct = Math.min(100, (raisedThisMonth / MONTHLY_RUNNING_COST) * 100);

  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400'>
            <Server size={18} />
          </span>
          <div>
            <h2 className='text-sm font-semibold text-zinc-200'>
              What it costs to run
            </h2>
            <p className='mt-0.5 text-xs text-zinc-500'>
              Hosting and tools come to about{" "}
              <span className='font-medium text-zinc-300'>
                ${MONTHLY_RUNNING_COST}/month
              </span>
              . Support chips in on this bill and keeps the app free for
              everyone.
            </p>
          </div>
        </div>

        <div className='shrink-0 text-right'>
          <p className='text-2xl font-bold tracking-tight text-zinc-100'>
            ${covered}
            <span className='text-base font-medium text-zinc-500'>
              {" "}
              / ${MONTHLY_RUNNING_COST}
            </span>
          </p>
          <p
            className={cn(
              "mt-0.5 flex items-center justify-end gap-1 text-xs font-medium",
              isCovered ? "text-emerald-400" : "text-zinc-500"
            )}>
            {isCovered ? (
              <>
                <Check size={13} strokeWidth={3} /> Covered this month
              </>
            ) : (
              `$${remaining} still to cover`
            )}
          </p>
        </div>
      </div>

      <div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800'>
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isCovered ? "bg-emerald-500" : "bg-cyan-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
};
