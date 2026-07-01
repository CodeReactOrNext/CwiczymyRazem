import { cn } from "assets/lib/utils";
import {
  MONTHLY_RUNNING_COST,
  ROADMAP_TIERS,
} from "feature/roadmap/data/roadmap.data";
import { useBuyMeACoffeeFunding } from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { ArrowRight, Heart, Unlock } from "lucide-react";
import Link from "next/link";

export const SupportBanner = () => {
  const { totalRaised, supporters, raisedThisMonth, isLoading } =
    useBuyMeACoffeeFunding();

  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;
  const pct = Math.min(100, (raisedThisMonth / MONTHLY_RUNNING_COST) * 100);
  const nextTier = ROADMAP_TIERS.find((t) => totalRaised < t.goal) ?? null;

  return (
    <Link
      href='/roadmap'
      className='group block rounded-lg bg-zinc-800/40 p-4 transition-background hover:bg-zinc-800/60 sm:p-5'>
      <div className='flex items-center gap-4'>
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400'>
          <Heart size={20} fill='currentColor' />
        </span>

        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
            Help build Riff Quest
          </p>
          <p className='mt-0.5 text-xs leading-snug text-zinc-400 sm:text-sm'>
            Riff Quest is free and built in the open. See what your support
            unlocks next on the roadmap.
          </p>
        </div>

        <span className='flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-200 transition-background group-hover:bg-amber-500/30 sm:text-sm'>
          <span className='hidden sm:inline'>View roadmap</span>
          <ArrowRight
            size={16}
            className='transition-transform duration-300 group-hover:translate-x-0.5'
          />
        </span>
      </div>

      {!isLoading && (
        <div className='mt-4 flex flex-col gap-3 border-t border-zinc-700/50 pt-4 sm:flex-row sm:items-center sm:gap-6'>
          {/* Lifetime raised — the headline number */}
          <div className='flex shrink-0 items-baseline gap-2'>
            <span className='text-xl font-bold tracking-tight text-zinc-100'>
              ${totalRaised}
            </span>
            <span className='text-xs text-zinc-500'>
              raised so far
              {supporters > 0 &&
                ` · ${supporters} supporter${supporters === 1 ? "" : "s"}`}
            </span>
          </div>

          {/* Next goal on the roadmap and how much is left to reach it */}
          {nextTier && (
            <div className='flex min-w-0 items-center gap-2 rounded-md bg-cyan-500/10 px-2.5 py-1.5 text-xs'>
              <Unlock size={13} className='shrink-0 text-cyan-300' />
              <span className='shrink-0 font-semibold text-cyan-200'>
                ${nextTier.goal - totalRaised} to go
              </span>
              <span className='truncate text-zinc-400'>{nextTier.label}</span>
            </div>
          )}

          {/* Mini server-cost bar for the current month */}
          <div className='w-full min-w-0 sm:ml-auto sm:w-56'>
            <div className='flex items-center justify-between gap-2 text-xs'>
              <span className='text-zinc-400'>Server cost this month</span>
              <span
                className={cn(
                  "shrink-0 font-medium",
                  isCovered ? "text-emerald-400" : "text-zinc-300"
                )}>
                ${covered} / ${MONTHLY_RUNNING_COST}
                {isCovered && " · covered"}
              </span>
            </div>
            <div className='mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isCovered ? "bg-emerald-500" : "bg-cyan-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};
