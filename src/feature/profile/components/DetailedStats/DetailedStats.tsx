import { Card } from "assets/components/ui/card";
import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { StatsField } from "feature/profile/components/StatsField";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongLearningStatsSkeleton } from "feature/songs/components/SongLearningStats/SongLearningStatsSkeleton";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";

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
  const { t } = useTranslation("profile");

  const allStats = getUserStatsField(statistics) as StatsFieldProps[];

  // Filter out the stats that are shown on main page
  const detailedStats = allStats.filter(
    (stat) =>
      stat.id !== "total-time" &&
      stat.id !== "points" &&
      stat.id !== "session-count" &&
      stat.id !== "habits-count"
  );

  return (
    <div className='space-y-6'>
      {/* Song Learning Stats */}
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

      {/* Detailed Statistics Grid */}
      <Card>
        <div className='mb-4'>
          <h4 className='text-lg font-semibold text-white'>
            {t("detailed_stats.records_title")}
          </h4>
          <p className='text-sm text-zinc-400'>
            {t("detailed_stats.records_description")}
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {detailedStats.map(({ id, Icon, description, value }) => (
            <StatsField
              key={id}
              Icon={Icon}
              description={description}
              value={value}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
