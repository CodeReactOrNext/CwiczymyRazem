import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { useUserRank } from "feature/leadboard/hooks/useUserRank";
import { getCurrentSeasonId } from "feature/leadboard/services/getCurrentSeason";
import { Trophy } from "lucide-react";
import { useState } from "react";

import { WidgetHeader, WidgetLink } from "./WidgetHeader";

/** The month a season id names, as a player would say it. */
const seasonLabel = (seasonId: string): string => {
  const [year, month] = seasonId.split("-").map(Number);
  if (!year || !month) return "this season";
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
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
  const { userStats } = useDashboardData();
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
        title='Your rank'
        action={<WidgetLink href='/seasons'>Rankings</WidgetLink>}
      />

      <div className='flex items-start gap-6'>
        <Standing
          label='All time'
          rank={allTime.userRank}
          isLoading={allTime.isLoading}
          emptyText='Not on the board yet.'
        />
        <Standing
          label={seasonLabel(seasonId)}
          rank={seasonal.userRank}
          isLoading={seasonal.isLoading}
          emptyText='No points this season yet.'
        />
      </div>

      <p className='mt-4 text-xs text-zinc-500'>
        <span className='font-semibold text-cyan-400'>
          {points.toLocaleString("en-US")}
        </span>{" "}
        points · level {lvl}
      </p>
    </Card>
  );
};
