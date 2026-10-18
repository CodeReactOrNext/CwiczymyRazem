import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { FormGuide, RatingSparkline } from "feature/duels/components/DuelBits";
import type { DuelOverview } from "feature/duels/types/duel.types";
import {
  formatRatingDelta,
  ratingTrail,
  recentForm,
} from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

interface DuelRatingSummaryProps {
  overview: DuelOverview | undefined;
}

/**
 * The one number the page is about — the rating — with what moved it last,
 * the place it buys, and the form and trend of the last few duels.
 */
export const DuelRatingSummary = ({ overview }: DuelRatingSummaryProps) => {
  const { t } = useTranslation("duels");
  const recent = overview?.recent;
  const form = useMemo(() => recentForm(recent ?? []), [recent]);
  const trail = useMemo(() => ratingTrail(recent ?? []), [recent]);

  if (!overview) {
    return (
      <div className='flex flex-col items-start gap-2 md:items-end'>
        <Skeleton className='h-14 w-32 rounded-lg' />
        <Skeleton className='h-4 w-40 rounded' />
      </div>
    );
  }

  const lastDelta =
    trail.length >= 2
      ? trail[trail.length - 1] - trail[trail.length - 2]
      : null;

  return (
    <div className='flex flex-col items-start md:items-end'>
      <span className='text-xs font-semibold text-zinc-400'>
        {t("rating.label")}
      </span>
      <div className='mt-1 flex items-baseline gap-3'>
        <span className='font-teko text-7xl font-semibold tabular-nums leading-[0.8] text-zinc-50'>
          {overview.rating}
        </span>
        {lastDelta !== null && lastDelta !== 0 && (
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              lastDelta > 0 ? "text-emerald-400" : "text-zinc-400",
            )}>
            {formatRatingDelta(lastDelta)}
          </span>
        )}
      </div>

      {overview.isRated && overview.rank ? (
        <p className='mt-3 text-sm text-zinc-300'>
          <span className='font-semibold text-zinc-100'>
            {t("rating.rank", {
              rank: overview.rank,
              total: overview.rankedPlayers,
            })}
          </span>
          <span className='text-zinc-600'> · </span>
          {/* Draws only once there is one — "0D" is noise, and the ladder leaves it out too. */}
          <span className='tabular-nums text-zinc-400'>
            {overview.draws > 0
              ? t("rating.record", {
                  wins: overview.wins,
                  losses: overview.losses,
                  draws: overview.draws,
                })
              : t("ranking.record", {
                  wins: overview.wins,
                  losses: overview.losses,
                })}
          </span>
        </p>
      ) : (
        <p className='mt-3 max-w-[16rem] text-sm text-zinc-400 md:text-right'>
          {t("rating.unrated")}
        </p>
      )}

      {(form.length > 0 || trail.length >= 2) && (
        <div className='mt-3 flex items-center gap-4'>
          <FormGuide form={form} />
          <RatingSparkline trail={trail} />
        </div>
      )}
    </div>
  );
};
