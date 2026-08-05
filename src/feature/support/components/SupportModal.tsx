import { cn } from "assets/lib/utils";
import {
  BMC_URL,
  MONTHLY_RUNNING_COST,
  ROADMAP_RAISED_OFFSET,
  ROADMAP_TIERS,
} from "feature/roadmap/data/roadmap.data";
import { useBuyMeACoffeeFunding } from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { Check, Coffee, Heart, TriangleAlert, X } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonate: () => void;
}

/**
 * Always shows the same precise explanation of what a donation actually pays
 * for — no rotating variants here (those are for the Activity feed only).
 * The live numbers (cost covered, next tier) are real, just the copy is fixed.
 */
export function SupportModal({ isOpen, onClose, onDonate }: SupportModalProps) {
  const {
    totalRaised: rawTotalRaised,
    raisedThisMonth,
    isLoading,
  } = useBuyMeACoffeeFunding();

  if (!isOpen || isLoading) return null;

  const totalRaised = Math.max(0, rawTotalRaised - ROADMAP_RAISED_OFFSET);
  const nextTierIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);
  const nextTier = nextTierIndex === -1 ? null : ROADMAP_TIERS[nextTierIndex];

  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;
  const costPct = Math.min(100, Math.max(0, (covered / MONTHLY_RUNNING_COST) * 100));

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/80 backdrop-blur-md'
        onClick={onClose}
      />
      <div className='relative w-full max-w-md overflow-hidden rounded-md bg-zinc-950 p-8'>
        <div className='pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]' />

        <button
          onClick={onClose}
          className='absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white'>
          <X size={16} />
        </button>

        <div className='relative z-10 flex flex-col gap-5'>
          <div className='flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10'>
            <Heart size={20} className='text-amber-400' fill='currentColor' />
          </div>

          <div>
            <p className='text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-500/80'>
              Help build Riff Quest
            </p>
            <h2 className='mt-2 text-2xl font-semibold tracking-tight text-white'>
              Why support Riff Quest?
            </h2>
            <p className='mt-3 text-sm leading-relaxed text-zinc-400'>
              Riff Quest is a one person project, free and built in the open. Your
              support covers the domain, hosting, and database first. Everything
              raised on top of that funds the roadmap: new exercises, gear, and
              features, unlocked tier by tier as the community funds them.
            </p>
          </div>

          <div className='rounded-md bg-zinc-900/60 p-4'>
            <div className='flex items-center justify-between gap-4 text-xs'>
              <span className='flex min-w-0 items-center gap-1.5'>
                {isCovered ? (
                  <Check size={14} className='shrink-0 text-emerald-400' />
                ) : (
                  <TriangleAlert size={14} className='shrink-0 text-orange-400' />
                )}
                <span
                  className={cn(
                    "truncate font-medium",
                    isCovered ? "text-zinc-300" : "text-orange-200"
                  )}>
                  {isCovered
                    ? "Server cost this month covered"
                    : "Server cost needs your help"}
                </span>
              </span>
              {!isCovered && (
                <span className='shrink-0 font-semibold text-zinc-100'>
                  ${covered} / ${MONTHLY_RUNNING_COST}
                </span>
              )}
            </div>

            <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isCovered
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-orange-500 to-orange-400"
                )}
                style={{ width: `${costPct}%` }}
              />
            </div>

            {nextTier && (
              <div className='mt-3 flex items-center justify-between gap-4 text-xs text-zinc-500'>
                <span className='truncate'>
                  Next unlock{" "}
                  <span className='font-medium text-zinc-300'>{nextTier.label}</span>
                </span>
                <span className='shrink-0 font-medium text-white'>
                  ${nextTier.goal - totalRaised} to go
                </span>
              </div>
            )}
          </div>

          <a
            href={BMC_URL}
            target='_blank'
            rel='noopener noreferrer'
            onClick={onDonate}
            className='flex items-center justify-center gap-2 rounded-md bg-amber-500 py-3.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-amber-400'>
            <Coffee size={16} />
            Support Riff Quest
          </a>

          <button
            onClick={onClose}
            className='text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300'>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
