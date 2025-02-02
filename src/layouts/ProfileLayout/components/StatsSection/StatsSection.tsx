import type { StatisticsDataInterface } from "types/api.types";
import { calculatePercent, convertMsToHM } from "utils/converter";

import { getTrendData } from "../../utils/getTrendData";
import StatisticBar from "../StatisticBar";
import type { StatsFieldProps } from "../StatsField";
import StatsField from "../StatsField";

interface StatsSectionProps {
  statsField: StatsFieldProps[];
  statistics: StatisticsDataInterface;
  datasWithReports: any; // Replace with proper type
  t: (key: string) => string;
}

export const StatsSection = ({
  statsField,
  statistics,
  datasWithReports,
  t,
}: StatsSectionProps) => {
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

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-3'>
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
      <div className='content-box relative z-20 mb-2 flex content-around justify-center lg:flex-1'>
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
    </div>
  );
};
