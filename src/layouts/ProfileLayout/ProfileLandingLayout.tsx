import { useTranslation } from "react-i18next";

import Calendar from "components/Calendar";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM, calculatePercent } from "utils/converter";

interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  featSlot: React.ReactNode;
  userAuth: string;
}

const ProfileLandingLayout = ({
  statsField,
  userStats,
  userAuth,
  featSlot,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const { time, achievements } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  return (
    <div className='bg-second-600 radius-default'>
      <HeadDecoration title={t("statistics")} />
      <div className='grid-rows-auto grid-cols-2 items-start  lg:mt-5 lg:grid !p-6 '>
        <div className='row-cols-1 m-2 flex w-full flex-wrap gap-3'>
          {statsField.map(({ Icon, description, value }) => (
            <StatsField
              key={description}
              Icon={Icon}
              description={description}
              value={value}
            />
          ))}
        </div>
        <div className=' content-box relative z-20 mx-4 my-2 flex  content-around justify-center '>
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
        <div className=' my-2 flex flex-col justify-between p-4 '>
          <AchievementWrapper userAchievements={achievements} />
        </div>
        <div className='d-flex justify-content-center my-2 p-4 '>
          <Calendar userAuth={userAuth} />
        </div>
        <div className='col-span-2 p-4'>{featSlot}</div>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
