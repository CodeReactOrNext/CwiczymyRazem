import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { Check, Coffee, Heart, TriangleAlert } from "lucide-react";

import { MONTHLY_RUNNING_COST, ROADMAP_TIERS } from "../data/roadmap.data";

const BMC_URL = "https://buymeacoffee.com/riffquest";

/**
 * Single-row banner: pitch text left, compact "server cost this month" stat
 * in the middle, CTA right. Mirrors the layout of the dashboard's SupportBanner
 * (feature/dashboard/components/SupportBanner.tsx) so the same funding story
 * reads consistently wherever it shows up.
 */
export const RoadmapPitch = ({
  totalRaised,
  raisedThisMonth,
}: {
  totalRaised: number;
  raisedThisMonth: number;
}) => {
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
    <section className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <HeroPattern
        className='opacity-[0.06]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      {!isCovered && (
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent' />
      )}
      <div className='relative flex flex-wrap items-center gap-x-12 gap-y-6'>
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
              Why support Riff Quest
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              Riff Quest is a one-person project, free and built in the open.
              Support covers the domain, hosting, database, and Vercel first —
              the rest funds the roadmap above.
            </p>
          </div>
        </div>

        {/* Compact progress block: full-width row when stacked, fixed column on desktop */}
        <div className='order-last w-full min-w-0 lg:order-none lg:w-80'>
          <div className='flex items-center justify-between gap-4 text-xs sm:text-sm'>
            <span className='flex min-w-0 items-center gap-1.5'>
              {isCovered ? (
                <Check size={14} className='shrink-0 text-emerald-400' />
              ) : (
                <TriangleAlert size={14} className='shrink-0 text-orange-400' />
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

          <div className='mt-3 flex items-center justify-between gap-4 text-xs text-zinc-500'>
            {nextTier ? (
              <>
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
                <span className='shrink-0 font-medium text-cyan-400'>
                  ${nextTier.goal - totalRaised} to go
                </span>
              </>
            ) : (
              <span className='font-medium text-emerald-400'>
                Every goal above is funded — thank you
              </span>
            )}
          </div>
        </div>

        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 hover:bg-amber-400 sm:text-sm'>
          <Coffee size={16} />
          Support Riff Quest
        </a>
      </div>
    </section>
  );
};
