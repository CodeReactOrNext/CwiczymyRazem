import type { DateWithReport } from "components/ActivityLog/activityLog.types";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import { StatisticBar } from "feature/profile/components/StatisticBar";
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
    <div className='flex flex-col lg:flex-row lg:gap-4'>
      <div className='mb-4 lg:flex-1'>
        <div className='grid gap-4'>
          <div className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2'>
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
          {userSongs && <SongLearningStats userSongs={userSongs} />}

          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3'>
            {statsWithTrends
              .filter(
                (stat) => stat.id !== "total-time" && stat.id !== "points"
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
      <div className='flex flex-col lg:flex-1'>
        <div className='content-box relative z-20 mb-2 flex content-around justify-center'>
          <StatisticBar
            title={t("technique")}
            value={convertMsToHM(time.technique)}
            percent={calculatePercent(time.technique, totalTime)}
          />
          <StatisticBar
            title={t("theory")}
            value={convertMsToHM(time.theory)}
            percent={calculatePercent(time.theory, totalTime)}
          />
          <StatisticBar
            title={t("hearing")}
            value={convertMsToHM(time.hearing)}
            percent={calculatePercent(time.hearing, totalTime)}
          />
          <StatisticBar
            title={t("creativity")}
            value={convertMsToHM(time.creativity)}
            percent={calculatePercent(time.creativity, totalTime)}
          />
        </div>
        <div className='mb-2 mt-2'>
          <SeasonalAchievements userId={userAuth} />
        </div>
      </div>
    </div>
  );
};
