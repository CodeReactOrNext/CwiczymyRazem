import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import {
  MONTHLY_RUNNING_COST,
  ROADMAP_TIERS,
} from "feature/roadmap/data/roadmap.data";
import { useBuyMeACoffeeFunding } from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { ArrowRight, Check, Heart, TriangleAlert } from "lucide-react";
import Link from "next/link";

export const SupportBanner = () => {
  const { totalRaised, raisedThisMonth, isLoading } = useBuyMeACoffeeFunding();

  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;
  const costPct = Math.min(
    100,
    Math.max(0, (covered / MONTHLY_RUNNING_COST) * 100),
  );

  const nextTierIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);
  const nextTier = nextTierIndex === -1 ? null : ROADMAP_TIERS[nextTierIndex];
  const NextTierIcon = nextTier?.icon;

  return (
    <Link
      href='/roadmap'
      className='group relative block overflow-hidden rounded-lg bg-zinc-800/50 p-5 transition-background hover:bg-zinc-800/70 sm:p-7'>
      <HeroPattern
        className='opacity-[0.08]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      {!isCovered && (
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent' />
      )}
      <div className='relative z-10 flex flex-wrap items-center gap-x-12 gap-y-6'>
        <div className='flex min-w-0 flex-1 items-start gap-3.5'>
          <Heart
            size={18}
            className={cn(
              "mt-0.5 shrink-0",
              isCovered ? "text-zinc-500" : "text-orange-400",
            )}
          />
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
              Help build Riff Quest
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              Riff Quest is a one person project, free and built in the open.
              Your support keeps it that way.
            </p>
          </div>
        </div>

        {/* Compact progress block: full-width row when stacked, fixed column on desktop */}
        {!isLoading && (
          <div className='order-last w-full min-w-0 lg:order-none lg:w-80'>
            <div className='flex items-center justify-between gap-4 text-xs sm:text-sm'>
              <span className='flex min-w-0 items-center gap-1.5'>
                {isCovered ? (
                  <Check size={14} className='shrink-0 text-emerald-400' />
                ) : (
                  <TriangleAlert
                    size={14}
                    className='shrink-0 text-orange-400'
                  />
                )}
                <span
                  className={cn(
                    "truncate font-medium",
                    isCovered ? "text-zinc-300" : "text-orange-200",
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
                    : "bg-gradient-to-r from-orange-500 to-orange-400",
                )}
                style={{ width: `${costPct}%` }}
              />
            </div>

            {nextTier && (
              <div className='mt-3 flex items-center justify-between gap-4 text-sm text-zinc-500'>
                <span className='flex min-w-0 items-center gap-1.5'>
                  {NextTierIcon && (
                    <NextTierIcon size={12} className='shrink-0' />
                  )}
                  <span className='truncate'>
                    Next unlock{" "}
                    <span className='font-medium text-zinc-300'>
                      {nextTier.label}
                    </span>
                  </span>
                </span>
                <span className='shrink-0 font-medium text-white'>
                  ${nextTier.goal - totalRaised} to go
                </span>
              </div>
            )}
          </div>
        )}

        <span className='flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition-background group-hover:bg-white sm:text-sm'>
          <span className='hidden sm:inline'>Support</span>
          <ArrowRight
            size={16}
            className='transition-transform duration-300 group-hover:translate-x-0.5'
          />
        </span>
      </div>
    </Link>
  );
};
