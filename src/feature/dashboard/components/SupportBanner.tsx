import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import {
  MONTHLY_RUNNING_COST,
  ROADMAP_TIERS,
} from "feature/roadmap/data/roadmap.data";
import { useBuyMeACoffeeFunding } from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { ArrowRight, Check, Heart } from "lucide-react";
import Link from "next/link";

export const SupportBanner = () => {
  const { totalRaised, raisedThisMonth, isLoading } = useBuyMeACoffeeFunding();

  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;

  const nextTierIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);
  const nextTier = nextTierIndex === -1 ? null : ROADMAP_TIERS[nextTierIndex];
  const prevGoal =
    nextTierIndex > 0 ? ROADMAP_TIERS[nextTierIndex - 1].goal : 0;
  const tierPct = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalRaised - prevGoal) / (nextTier.goal - prevGoal)) * 100,
        ),
      )
    : 100;
  const NextTierIcon = nextTier?.icon;

  return (
    <Link
      href='/roadmap'
      className='group relative block overflow-hidden rounded-lg bg-zinc-800/40 p-5 transition-background hover:bg-zinc-800/60 sm:p-7'>
      <HeroPattern
        className='opacity-[0.03]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      <div className='relative z-10 flex flex-wrap items-center gap-x-12 gap-y-6'>
        <div className='flex min-w-0 flex-1 items-start gap-3.5'>
          <Heart size={18} className='mt-0.5 shrink-0 text-zinc-500' />
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
              Help build Riff Quest
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              Riff Quest is free and built in the open. See what your support
              unlocks next on the roadmap.
            </p>
          </div>
        </div>

        {/* Compact progress block: full-width row when stacked, fixed column on desktop */}
        {!isLoading && (
          <div className='order-last w-full min-w-0 lg:order-none lg:w-80'>
            {nextTier && (
              <>
                <div className='flex items-center justify-between gap-4 text-xs'>
                  <span className='flex min-w-0 items-center gap-1.5 text-zinc-400'>
                    {NextTierIcon && (
                      <NextTierIcon size={13} className='shrink-0' />
                    )}
                    <span className='truncate'>
                      Next unlock{" "}
                      <span className='font-medium text-zinc-200'>
                        {nextTier.label}
                      </span>
                    </span>
                  </span>
                  <span className='shrink-0 font-semibold text-cyan-300'>
                    ${nextTier.goal - totalRaised} to go
                  </span>
                </div>

                <div className='mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all'
                    style={{ width: `${tierPct}%` }}
                  />
                </div>
              </>
            )}

            <p
              className={cn(
                "flex items-center gap-1.5 text-xs text-zinc-500",
                nextTier && "mt-3",
              )}>
              {isCovered ? (
                <>
                  <Check size={13} className='text-emerald-400' />
                  <span>Server cost this month covered</span>
                </>
              ) : (
                <span>
                  Server cost this month ·{" "}
                  <span className='font-medium text-zinc-300'>
                    ${covered} / ${MONTHLY_RUNNING_COST}
                  </span>
                </span>
              )}
            </p>
          </div>
        )}

        <span className='flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-200 transition-background group-hover:bg-amber-500/30 sm:text-sm'>
          <span className='hidden sm:inline'>View roadmap</span>
          <ArrowRight
            size={16}
            className='transition-transform duration-300 group-hover:translate-x-0.5'
          />
        </span>
      </div>
    </Link>
  );
};
