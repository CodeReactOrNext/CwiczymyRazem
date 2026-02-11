import { Card } from "assets/components/ui/card";
import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongLearningStatsSkeleton } from "feature/songs/components/SongLearningStats/SongLearningStatsSkeleton";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

import { calculateMetrics } from "../PracticeInsights/calculateMetrics";

interface RecordsListProps {
  statistics: StatisticsDataInterface;
}

export const RecordsList = ({ statistics }: RecordsListProps) => {
  const { t } = useTranslation("profile");
  const { time, points, sessionCount } = statistics;

  const allStats = getUserStatsField(statistics) as StatsFieldProps[];

  const { avgSessionLength, avgPointsPerHour, strongestArea } = useMemo(
    () => calculateMetrics(time, points, sessionCount),
    [time, points, sessionCount]
  );

  const detailedStats = allStats.filter(
    (stat) =>
      stat.id !== "total-time" &&
      stat.id !== "points" &&
      stat.id !== "session-count" &&
      stat.id !== "habits-count"
  );

  const statRows = [
    {
      label: t("insights.avg_session"),
      value: convertMsToHM(avgSessionLength),
    },
    {
      label: t("insights.points_per_hour"),
      value: Math.round(avgPointsPerHour),
    },
    {
      label: t("insights.strongest_area"),
      value: t(`${strongestArea.name}` as any),
    },
    ...detailedStats.map((stat) => ({
      label: stat.description,
      value: stat.value,
    })),
  ];

  return (
    <Card className='h-full'>
      <div className='mb-4'>
        <h4 className='text-lg font-semibold text-white'>
          {t("detailed_stats.records_title")}
        </h4>
        <p className='text-sm text-zinc-400'>
          {t("detailed_stats.records_description")}
        </p>
      </div>

      <div className='divide-y divide-white/5'>
        {statRows.map((row, index) => (
          <div
            key={index}
            className='flex items-center justify-between py-3 first:pt-0 last:pb-0'
          >
            <span className='text-sm text-zinc-400'>{row.label}</span>
            <span className='text-sm font-semibold text-white tabular-nums'>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

interface SongLearningSectionProps {
  userSongs?:
    | {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
      }
    | undefined;
}

export const SongLearningSection = ({ userSongs }: SongLearningSectionProps) => {
  const { t } = useTranslation("profile");

  return (
    <Card>
      <div className='mb-4'>
        <h4 className='text-lg font-semibold text-white'>
          {t("detailed_stats.songs_title")}
        </h4>
        <p className='text-sm text-zinc-400'>
          {t("detailed_stats.songs_description")}
        </p>
      </div>
      {userSongs ? (
        <SongLearningStats userSongs={userSongs} />
      ) : (
        <SongLearningStatsSkeleton />
      )}
    </Card>
  );
};

interface DetailedStatsProps {
  statistics: StatisticsDataInterface;
  userSongs?:
    | {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
      }
    | undefined;
}

export const DetailedStats = ({
  statistics,
  userSongs,
}: DetailedStatsProps) => {
  return (
    <div className='space-y-6'>
      <SongLearningSection userSongs={userSongs} />
      <RecordsList statistics={statistics} />
    </div>
  );
};
