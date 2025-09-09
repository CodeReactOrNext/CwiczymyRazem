import type { DateWithReport } from "components/ActivityLog/activityLog.types";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import SkillsRadarChart from "feature/profile/components/SkillsRadarChart/SkillsRadarChart";
import {
  StatsField,
  type StatsFieldProps,
} from "feature/profile/components/StatsField";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { calculatePercent, convertMsToHM } from "utils/converter";

import { getTrendData } from "../utils/getTrendData";

interface StatsSectionProps {
  statsField: StatsFieldProps[];
  statistics: StatisticsDataInterface;
  datasWithReports: DateWithReport[];
  userAuth: string;
  userSongs:
    | {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
      }
    | undefined;
}

export const StatsSection = ({
  statsField,
  statistics,
  datasWithReports,
  userSongs,
  userAuth,
}: StatsSectionProps) => {
  const { t } = useTranslation("profile");
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  const statsWithKeys = statsField.map((stat) => {
    if (stat.id === "total-time") {
      return {
        ...stat,
        key: "time",
      };
    }

    if (stat.id === "points") {
      return {
        ...stat,
        key: "points",
      };
    }

    return stat;
  });

  const sortedStats = statsWithKeys.sort((a, b) => {
    if (a.key && !b.key) return -1;
    if (!a.key && b.key) return 1;

    if (a.key === "time" && b.key === "points") return -1;
    if (a.key === "points" && b.key === "time") return 1;

    return 0;
  });

  const statsWithTrends = sortedStats.map((stat) => {
    if (!stat.key) return stat;

    const trendData = getTrendData(
      datasWithReports,
      stat.key as "points" | "time"
    );

    return {
      ...stat,
      trendData,
    };
  });

  return (
    <div className='flex flex-col gap-6 lg:flex-row'>
      <div className='lg:flex-1'>
        <div className='space-y-4'>
          {/* Essential Stats with Charts - Only Time and Points */}
          <div className='grid w-full grid-cols-1 gap-3 sm:grid-cols-2'>
            {statsWithTrends
              .filter(
                (stat) => stat.id === "total-time" || stat.id === "points"
              )
              .map(({ id, Icon, description, value, trendData }) => (
                <StatsField
                  key={id}
                  Icon={Icon}
                  description={description}
                  value={value}
                  trendData={trendData}
                />
              ))}
          </div>

          {/* Basic Stats - Only Session Count and Habits */}
          <div className='grid grid-cols-2 gap-3'>
            {statsWithTrends
              .filter(
                (stat) =>
                  stat.id === "session-count" || stat.id === "habits-count"
              )
              .map(({ id, Icon, description, value }) => (
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
      <div className='lg:flex-1'>
        <div className='space-y-4'>
          <SkillsRadarChart statistics={statistics} />
          <SeasonalAchievements userId={userAuth} />
        </div>
      </div>
    </div>
  );
};
