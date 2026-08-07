import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { Coffee, Heart } from "lucide-react";

import { BMC_URL, MONTHLY_RUNNING_COST } from "../data/roadmap.data";
import { FundingStatusBlock } from "./FundingStatusBlock";

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
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;

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
        {/* Full width until lg: on a phone the shrink-0 CTA would otherwise
            squeeze the copy down to a couple of characters per line. */}
        <div className='flex w-full min-w-0 items-start gap-3.5 lg:w-auto lg:flex-1'>
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
              Riff Quest is a one person project, free and built in the open.
              Support covers the domain, hosting, database, and Vercel first.
              The rest funds the roadmap above.
            </p>
          </div>
        </div>

        {/* Compact progress block: full-width row when stacked, fixed column on desktop */}
        <FundingStatusBlock
          totalRaised={totalRaised}
          raisedThisMonth={raisedThisMonth}
          className='w-full lg:w-80'
        />

        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 hover:bg-amber-400 sm:w-auto sm:text-sm'>
          <Coffee size={16} />
          Support Riff Quest
        </a>
      </div>
    </section>
  );
};
