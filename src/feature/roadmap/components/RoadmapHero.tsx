import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { SupporterStrip } from "feature/supportTeam/components/SupporterStrip";
import { useTranslation } from "hooks/useTranslation";

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
 * stands, who is already paying it, and the button. Everything a first-time
 * visitor needs to decide is above the fold; the sections below add detail.
 */
export const RoadmapHero = ({
  totalRaised,
  raisedThisMonth,
  isLoading,
}: RoadmapHeroProps) => {
  const { t } = useTranslation("supporter");
  return (
  <HeroBanner
    title={t("hero.title")}
    subtitle={t("hero.subtitle")}
    eyebrow={t("hero.eyebrow")}
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
    footerContent={
      // Its own band rather than the left column: that one is capped at
      // max-w-xl for readable copy, which folded eighteen supporters onto two
      // short rows.
      <SupporterStrip />
    }
    rightContent={
      <div className='flex flex-col items-start gap-2.5 md:items-end'>
        <SupportCta className='px-7' />
        <p className='text-xs text-zinc-500'>
          {t("hero.coffee_hint")}
        </p>
      </div>
    }
  />
  );
};
