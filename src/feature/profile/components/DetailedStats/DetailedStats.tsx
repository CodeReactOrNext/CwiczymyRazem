import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { StatsField } from "feature/profile/components/StatsField";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
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
      {/* Enhanced Header */}
      <div className='rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
        <h3 className='mb-2 text-xl font-bold text-white'>
          {t("detailed_stats.title")}
        </h3>
        <p className='text-sm text-zinc-400'>
          {t("detailed_stats.description")}
        </p>
      </div>

      {/* Song Learning Stats */}
      {userSongs && (
        <div className='rounded-xl border border-zinc-700/50 bg-zinc-900/20 p-6 backdrop-blur-sm'>
          <div className='mb-4'>
            <h4 className='text-lg font-semibold text-white'>
              {t("detailed_stats.songs_title")}
            </h4>
            <p className='text-sm text-zinc-400'>
              {t("detailed_stats.songs_description")}
            </p>
          </div>
          <SongLearningStats userSongs={userSongs} />
        </div>
      )}

      {/* Detailed Statistics Grid */}
      <div className='rounded-xl border border-zinc-700/50 bg-zinc-900/20 p-6 backdrop-blur-sm'>
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
      </div>
    </div>
  );
};
