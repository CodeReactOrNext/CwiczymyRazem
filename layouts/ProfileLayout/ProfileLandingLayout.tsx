import { useTranslation } from "react-i18next";

import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { convertMsToHM } from "utils/converter/timeConverter";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import Calendar from "components/Calendar";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
}

const LandingLayout = ({
  statsField,
  userStats,
  featSlot,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const { time, achievements } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  return (
    <div className='bg-second-500 radius-default'>
      <HeadDecoration title={t("statistics")} />
      <div className='grid-rows-auto grid-cols-2 items-start  lg:mt-5 lg:grid '>
        <div className=' flex flex-wrap justify-evenly'>
          {statsField.map(({ Icon, description, value }) => (
            <StatsField
              key={description}
              Icon={Icon}
              description={description}
              value={value}
            />
          ))}
        </div>
        <div className=' relative z-20 mx-4 my-2 flex justify-center border-2 border-second-400 bg-second-600 p-2 radius-default  '>
          <StatisticBar
            title={t("technique")}
            value={convertMsToHM(time.technique)}
            percent={Math.round((time.technique / totalTime) * 100)}
          />
          <StatisticBar
            title={t("theory")}
            value={convertMsToHM(time.theory)}
            percent={Math.round((time.theory / totalTime) * 100)}
          />
          <StatisticBar
            title={t("hearing")}
            value={convertMsToHM(time.hearing)}
            percent={Math.round((time.hearing / totalTime) * 100)}
          />
          <StatisticBar
            title={t("creativity")}
            value={convertMsToHM(time.creativity)}
            percent={Math.round((time.creativity / totalTime) * 100)}
          />
        </div>
        <div className=' my-2 flex flex-col justify-between p-4 '>
          <AchievementWrapper userAchievements={achievements} />
        </div>
        <div className='d-flex justify-content-center my-2 p-4 '>
          <Calendar />
        </div>
        <div className='col-span-2 p-4'>{featSlot}</div>
      </div>
    </div>
  );
};

export default LandingLayout;
