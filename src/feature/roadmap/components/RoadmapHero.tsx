import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";

import { FundingStatusBlock } from "./FundingStatusBlock";
import { SupportCta } from "./SupportCta";

interface RoadmapHeroProps {
  /** Lifetime total with ROADMAP_RAISED_OFFSET already subtracted. */
  totalRaised: number;
  raisedThisMonth: number;
  isLoading: boolean;
}

/**
 * The whole pitch in one place: what the money does, where the running total
 * stands, and the button. Everything a first-time visitor needs to decide is
 * above the fold; the sections below only add detail.
 */
export const RoadmapHero = ({
  totalRaised,
  raisedThisMonth,
  isLoading,
}: RoadmapHeroProps) => (
  <HeroBanner
    title='Help build Riff Quest'
    subtitle='Riff Quest is free and made by one person. Your support pays the hosting bill first, and everything above it unlocks the next feature on the roadmap, for everyone.'
    eyebrow='Community funded'
    backgroundContent={<HeroPattern variant='heart' />}
    className='w-full !rounded-none !shadow-none'
    leftContent={
      isLoading ? (
        <div
          className='h-[60px] w-full max-w-sm animate-pulse rounded-lg bg-zinc-900/60'
          aria-hidden
        />
      ) : (
        <FundingStatusBlock
          totalRaised={totalRaised}
          raisedThisMonth={raisedThisMonth}
          className='max-w-sm'
        />
      )
    }
    rightContent={
      <div className='flex flex-col items-start gap-2.5 md:items-end'>
        <SupportCta className='px-7' />
        <p className='text-xs text-zinc-500'>
          A one-off coffee is enough. Nothing to sign up for, nothing to cancel.
        </p>
      </div>
    }
  />
);
