import { buttonVariants } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { SupportHeart } from "feature/dashboard/components/SupportHeart";
import { FundingStatusBlock } from "feature/roadmap/components/FundingStatusBlock";
import { ROADMAP_RAISED_OFFSET } from "feature/roadmap/data/roadmap.data";
import { useBuyMeACoffeeFunding } from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight } from "lucide-react";
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
      // force-dark + support-warm: in the light theme this is the one dark card
      // on the page (globals.css) — ink surface, orange bar and amount, the
      // white key. The dark theme is unchanged.
      className='force-dark support-warm group relative block overflow-hidden rounded-lg bg-zinc-800/50 p-5 transition-background hover:bg-zinc-800/70 sm:p-7'>
      {/* Light theme: the pattern and the warm wash go (light-hide) — on a pale
          card they read as a peach stain. The heart and the progress bar carry
          the colour there. */}
      <HeroPattern
        className='light-hide opacity-[0.08]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      {/* The warm wash and the heart stay on regardless of funding state — tying
          them to `isCovered` made the banner flip tint the moment the funding
          request resolved. The actual status still lives in FundingStatusBlock. */}
      <div className='pointer-events-none absolute inset-0 light-hide bg-gradient-to-r from-orange-500/10 via-transparent to-transparent' />
      <div className='relative z-10 flex flex-wrap items-center gap-x-12 gap-y-6'>
        {/* Wraps on the banner's own width, not the viewport's: the dashboard
            column next to the sidebar is narrow on a landscape tablet even past
            lg, and a viewport breakpoint squeezed the copy to a word per line
            there. The copy never goes below 26rem before the funding block and
            the button drop to the next row; its huge grow keeps the funding
            block at its basis when they share a row. */}
        <div className='flex min-w-0 flex-[999_1_26rem] items-center gap-4'>
          <SupportHeart className='size-16 shrink-0 sm:size-20' />
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
              {t("support.title")}
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              {t("support.body")}
            </p>
          </div>
        </div>

        {/* Compact progress block: 18rem beside the copy, the full row when wrapped */}
        {/* While the funding request is in flight a placeholder of the same
            shape holds the block's space, so the banner doesn't grow and push
            the feed down when the numbers arrive. */}
        {isLoading ? (
          <div aria-hidden className='min-w-0 flex-[1_1_18rem]'>
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
            className='flex-[1_1_18rem]'
          />
        )}

        <span
          className={cn(
            buttonVariants(),
            // The whole banner is the link, so hovering it lights the button too.
            "w-full shrink-0 gap-1.5 text-xs group-hover:bg-primary/90 sm:w-auto sm:text-sm",
          )}>
          <span>{t("support.cta")}</span>
          <ArrowRight
            size={16}
            className='transition-transform duration-base group-hover:translate-x-0.5'
          />
        </span>
      </div>
    </Link>
  );
};
