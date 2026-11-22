import { Skeleton } from "assets/components/ui/skeleton";
import { FormGuide } from "feature/duels/components/DuelBits";
import type { DuelOverview } from "feature/duels/types/duel.types";
import { recentForm } from "feature/duels/utils/duelFormat";
import { useTranslation } from "hooks/useTranslation";
import { CircleHelp } from "lucide-react";
import { useMemo } from "react";

interface DuelStatsStripProps {
  overview: DuelOverview | undefined;
  /** The rating is a button: it opens "What is ELO?". */
  onEloClick: () => void;
}

/**
 * The right side of the page banner: the three things a player checks — the
 * rating, the place it buys, and the form of the last few duels. Everything
 * else lives in the tabs below.
 */
export const DuelStatsStrip = ({
  overview,
  onEloClick,
}: DuelStatsStripProps) => {
  const { t } = useTranslation("duels");
  const recent = overview?.recent;
  const form = useMemo(() => recentForm(recent ?? []), [recent]);

  if (!overview) return <Skeleton className='h-12 w-40 rounded-lg' />;

  // On a phone the banner stacks, so the rating leads and reads from the left.
  return (
    <div className='flex flex-row-reverse items-center gap-4 sm:gap-6 md:flex-row'>
      <div className='flex flex-col items-start gap-1.5 text-sm md:items-end'>
        {overview.isRated && overview.rank ? (
          <span className='font-semibold tabular-nums text-zinc-100'>
            {t("rating.rank", {
              rank: overview.rank,
              total: overview.rankedPlayers,
            })}
          </span>
        ) : (
          <span className='text-zinc-400'>{t("strip.unrated")}</span>
        )}
        <FormGuide form={form} />
      </div>
      <button
        type='button'
        onClick={onEloClick}
        aria-label={t("strip.elo_aria", { rating: overview.rating })}
        className='-m-2 flex flex-col items-start rounded-lg p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 hover:bg-white/5'>
        <span className='flex items-center gap-2 text-xs font-semibold text-zinc-300'>
          {t("rating.label")}
          <CircleHelp className='size-4 text-zinc-500' aria-hidden='true' />
        </span>
        <span className='mt-1.5 font-teko text-5xl font-semibold tabular-nums leading-[0.8] text-zinc-50'>
          {overview.rating}
        </span>
      </button>
    </div>
  );
};
