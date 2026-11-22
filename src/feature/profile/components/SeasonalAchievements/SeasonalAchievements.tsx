import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { rankRowLineClass } from "feature/leadboard/components/RankRow";
import {
  placeKeyClass,
  rankCardClass,
  rankScoreClass,
} from "feature/leadboard/components/rankRowStyles";
import { useSeasonalAchievements } from "feature/profile/hooks/useSeasonalAchievements";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { formatSeasonMonth, summarizeSeasonFinishes } from "./seasonFinishes";

interface SeasonalAchievementProps {
  userId?: string;
  /** When true, render nothing (instead of an empty card) if there are no finishes. */
  hideWhenEmpty?: boolean;
}

/** The newest finishes on show; the rest wait behind "Show all". */
const VISIBLE_FINISHES = 3;

/**
 * Where a player finished each season they ended in the top 10.
 *
 * Set as rows of the leaderboard they came from, not as trophies of their own:
 * the medal key in Teko, the podium light and the points as the score are the
 * same pieces the leaderboard, duels and the daily board use, so a finish here
 * reads as that board's row, kept.
 *
 * The points are the score rather than the Fame the place paid: the payout
 * ladder changed twice (nothing before March 2026, then 500 for 1st, now 2000),
 * and a past season is not stored with what it actually paid.
 */
const SeasonalAchievements = ({
  userId,
  hideWhenEmpty = false,
}: SeasonalAchievementProps) => {
  const { t } = useTranslation("profile");
  const intlLocale = useIntlLocale();
  const { data: finishes = [], isLoading } = useSeasonalAchievements(userId);
  const [showAll, setShowAll] = useState(false);

  // Nothing while loading either: a placeholder that may turn into nothing
  // would only shift the page under the player.
  if (isLoading) return null;

  const allSeasonsLink = (
    <Button asChild variant='ghost' size='sm' className='shrink-0'>
      <Link href='/seasons'>
        {t("seasonal_achievements.all_seasons")}
        <ArrowRight />
      </Link>
    </Button>
  );

  if (finishes.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className='flex flex-col items-start justify-between gap-4 rounded-lg bg-zinc-900/40 p-5 sm:flex-row sm:items-center'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-sm font-bold text-zinc-200'>
            {t("seasonal_achievements.heading")}
          </h2>
          <p className='text-xs text-zinc-400'>
            {t("seasonal_achievements.no_achievements")}
          </p>
        </div>
        {allSeasonsLink}
      </div>
    );
  }

  const { bestPlace, topTenCount } = summarizeSeasonFinishes(finishes);
  const visible = showAll ? finishes : finishes.slice(0, VISIBLE_FINISHES);
  const hiddenCount = finishes.length - VISIBLE_FINISHES;

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex items-end justify-between gap-4 px-1'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h2 className='text-sm font-bold text-zinc-200'>
            {t("seasonal_achievements.heading")}
          </h2>
          <p className='text-xs text-zinc-500'>
            {t("seasonal_achievements.best_place", { place: bestPlace })}
            {" · "}
            {t("seasonal_achievements.top_ten", { count: topTenCount })}
          </p>
        </div>
        {allSeasonsLink}
      </div>

      {/* As many columns as fit: three on the achievements page, fewer in a
          narrow profile tile, one on a phone. */}
      <ul className='grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2'>
        {visible.map((finish) => (
          <li key={finish.seasonId}>
            <div className={rankCardClass(finish.place, false)}>
              <div className={rankRowLineClass()}>
                <span
                  translate='no'
                  className={cn(
                    "h-9 w-10 text-2xl",
                    placeKeyClass(finish.place, false),
                  )}>
                  {finish.place}
                </span>

                <p className='min-w-0 flex-1 truncate text-sm font-bold text-zinc-100'>
                  {formatSeasonMonth(finish.seasonId, intlLocale)}
                </p>

                <div className='flex shrink-0 flex-col items-end gap-0.5'>
                  <span
                    className={rankScoreClass(finish.place, false, "compact")}>
                    {(finish.points ?? 0).toLocaleString(intlLocale)}
                  </span>
                  <span className='text-xs font-medium text-zinc-500'>
                    {t("seasonal_achievements.points_short")}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='self-start'
          onClick={() => setShowAll((open) => !open)}>
          {showAll
            ? t("seasonal_achievements.show_less")
            : t("seasonal_achievements.show_all", {
                count: finishes.length,
              })}
        </Button>
      )}
    </section>
  );
};

export default SeasonalAchievements;
