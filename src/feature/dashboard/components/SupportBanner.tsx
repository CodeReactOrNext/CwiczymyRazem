import { useTranslation } from "hooks/useTranslation";
import { Skeleton } from "assets/components/ui/skeleton";
import { HeroPattern } from "components/UI/HeroBanner";
import { FundingStatusBlock } from "feature/roadmap/components/FundingStatusBlock";
import { ROADMAP_RAISED_OFFSET } from "feature/roadmap/data/roadmap.data";
import { useBuyMeACoffeeFunding } from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";

export const SupportBanner = () => {
  const { t } = useTranslation("dashboard");
  const {
    totalRaised: rawTotalRaised,
    raisedThisMonth,
    isLoading,
  } = useBuyMeACoffeeFunding();
  // Same tier ladder as /roadmap — must apply the same reset offset,
  // otherwise "next unlock" here disagrees with the roadmap page.
  const totalRaised = Math.max(0, rawTotalRaised - ROADMAP_RAISED_OFFSET);

  return (
    <Link
      href='/roadmap'
      className='group relative block overflow-hidden rounded-lg bg-zinc-800/50 p-5 transition-background hover:bg-zinc-800/70 sm:p-7'>
      <HeroPattern
        className='opacity-[0.08]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      {/* The warm wash and the heart stay on regardless of funding state — tying
          them to `isCovered` made the banner flip tint the moment the funding
          request resolved. The actual status still lives in FundingStatusBlock. */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent' />
      <div className='relative z-10 flex flex-wrap items-center gap-x-12 gap-y-6'>
        {/* Full width until lg, same as RoadmapPitch — the shrink-0 CTA plus the
            gap would otherwise leave the copy a couple of characters per line. */}
        <div className='flex w-full min-w-0 items-start gap-3.5 lg:w-auto lg:flex-1'>
          <Heart size={18} className='mt-0.5 shrink-0 text-orange-400' />
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
              {t("support.title")}
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              {t("support.body")}
            </p>
          </div>
        </div>

        {/* Compact progress block: full-width row when stacked, fixed column on desktop */}
        {/* While the funding request is in flight a placeholder of the same
            shape holds the block's space, so the banner doesn't grow and push
            the feed down when the numbers arrive. */}
        {isLoading ? (
          <div aria-hidden className='w-full lg:w-80'>
            <div className='flex h-4 items-center justify-between gap-4 sm:h-5'>
              <Skeleton className='h-3 w-40 sm:h-3.5' />
              <Skeleton className='h-3 w-14 sm:h-3.5' />
            </div>
            <Skeleton className='mt-2 h-1.5 w-full rounded-full' />
            <div className='mt-3 flex h-4 items-center'>
              <Skeleton className='h-3 w-48' />
            </div>
          </div>
        ) : (
          <FundingStatusBlock
            totalRaised={totalRaised}
            raisedThisMonth={raisedThisMonth}
            className='w-full lg:w-80'
          />
        )}

        <span className='flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition-background group-hover:bg-white sm:w-auto sm:text-sm'>
          <span>{t("support.cta")}</span>
          <ArrowRight
            size={16}
            className='transition-transform duration-300 group-hover:translate-x-0.5'
          />
        </span>
      </div>
    </Link>
  );
};
