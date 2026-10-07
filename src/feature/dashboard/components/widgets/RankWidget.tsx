import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { useUserRank } from "feature/leadboard/hooks/useUserRank";
import { getCurrentSeasonId } from "feature/leadboard/services/getCurrentSeason";
import { Trophy } from "lucide-react";
import { useState } from "react";

import { WidgetHeader, WidgetLink } from "./WidgetHeader";

/** The month a season id names, as a player would say it. */
const seasonLabel = (
  seasonId: string,
  fallback: string,
  locale = "en-US",
): string => {
  const [year, month] = seasonId.split("-").map(Number);
  if (!year || !month) return fallback;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, {
    month: "long",
    timeZone: "UTC",
  });
};

const Standing = ({
  label,
  rank,
  isLoading,
  emptyText,
}: {
  label: string;
  rank: number | null;
  isLoading: boolean;
  emptyText: string;
}) => (
  <div className='min-w-0 flex-1'>
    {isLoading ? (
      <Skeleton className='h-9 w-20 rounded-lg' />
    ) : rank ? (
      <p className='text-3xl font-bold tabular-nums text-white'>#{rank}</p>
    ) : (
      <p className='py-1 text-sm text-zinc-400'>{emptyText}</p>
    )}
    <p className='mt-1 truncate text-xs text-zinc-500'>{label}</p>
  </div>
);

/**
 * Where the player stands on both boards at once: the all-time ladder and the
 * month everyone is currently competing in. Two numbers rather than a toggle —
 * they answer different questions and neither is worth a click to reach.
 */
export const RankWidget = () => {
  const { t } = useTranslation("dashboard");
  const { userStats } = useDashboardData();
  const intlLocale = useIntlLocale();
  // The season only rolls over at UTC midnight on the 1st, so reading it once
  // per mount is plenty and keeps both queries on a stable key.
  const [seasonId] = useState(getCurrentSeasonId);

  const allTime = useUserRank("all-time");
  const seasonal = useUserRank("seasonal", seasonId);

  const points = userStats.points ?? 0;
  const lvl = userStats.lvl ?? 1;

  return (
    <Card className='flex h-full flex-col p-5 sm:p-6'>
      <WidgetHeader
        icon={Trophy}
        iconClassName='text-amber-400'
        title={t("rank.title")}
        action={<WidgetLink href='/seasons'>{t("rank.rankings")}</WidgetLink>}
      />

      <div className='flex items-start gap-6'>
        <Standing
          label={t("rank.all_time")}
          rank={allTime.userRank}
          isLoading={allTime.isLoading}
          emptyText={t("rank.not_on_board")}
        />
        <Standing
          label={seasonLabel(seasonId, t("rank.this_season"), intlLocale)}
          rank={seasonal.userRank}
          isLoading={seasonal.isLoading}
          emptyText={t("rank.no_season_points")}
        />
      </div>

      <p className='mt-4 text-xs text-zinc-500'>
        <span className='font-semibold text-cyan-400'>
          {points.toLocaleString(intlLocale ?? "en-US")}
        </span>{" "}
        {t("rank.points_level", { level: lvl })}
      </p>
    </Card>
  );
};
