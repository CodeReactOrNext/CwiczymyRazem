import { useTranslation } from "react-i18next";
import GitHubCalendar from "react-github-calendar";

import Avatar from "components/Avatar";
import LevelBar from "components/LevelBar";
import DaySince from "components/DaySince/DaySince";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { convertMsToHM } from "utils/converter/timeConverter";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import Calendar from "components/Calendar";

export interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  userName: string;
  userAvatar?: string;
}

const ProfileLayout = ({
  statsField,
  userStats,
  userName,
  userAvatar,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const { time, achievements, lastReportDate } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;
    
  return (
    <div className='mt-8 flex justify-center'>
      <div className='m-4 flex w-[95%]  max-w-[1080px] flex-col justify-center bg-second pb-4 '>
        <HeadDecoration title={t("profile")} />
        <div className='grid-rows-auto  grid-cols-2  xl:grid'>
          <div className=' row-span-1  flex flex-col  items-center justify-center gap-6 '>
            <div className='z-10 flex flex-row items-center gap-4 p-4 '>
              <Avatar
                name={userName}
                lvl={userStats.lvl}
                avatarURL={userAvatar}
              />
              <div className='flex-col'>
                <p className='relative  text-4xl'>{userName}</p>
                <p className='relative  text-xl'>
                  {t("points")}:{" "}
                  <span className='text-2xl font-extrabold'>
                    {userStats.points}
                  </span>
                </p>
                <DaySince date={new Date(lastReportDate)} />
              </div>
            </div>
            <LevelBar
              points={userStats.points}
              lvl={userStats.lvl}
              currentLevelMaxPoints={userStats.currentLevelMaxPoints}
            />
          </div>
          <div className=' z-10 row-span-1 m-4 my-5 flex justify-center border-2 border-second-400 bg-second-600 p-2 radius-default '>
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
          <div className='row-cols-1 flex flex-wrap justify-around'>
            {statsField.map(({ Icon, description, value }) => (
              <StatsField
                key={description}
                Icon={Icon}
                description={description}
                value={value}
              />
            ))}
          </div>
          <div className='row-cols-1 flex flex-col justify-between '>
            <AchievementWrapper userAchievements={achievements} />
          </div>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
