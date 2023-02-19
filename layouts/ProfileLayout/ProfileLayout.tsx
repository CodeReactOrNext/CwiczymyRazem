import { useTranslation } from "react-i18next";
import { FaSoundcloud, FaYoutube } from "react-icons/fa";
import { ImSoundcloud2 } from "react-icons/im";

import Avatar from "components/Avatar";
import Calendar from "components/Calendar";
import LevelBar from "components/LevelBar";
import DaySince from "components/DaySince/DaySince";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { convertMsToHM } from "utils/converter/timeConverter";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";

export interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userStats: StatisticsDataInterface;
  userName: string;
  userAvatar?: string;
  userAuth: string;
}

const ProfileLayout = ({
  statsField,
  userStats,
  userName,
  userAvatar,
  userAuth,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const { time, achievements, lastReportDate } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  return (
    <div className='mt-8 flex justify-center'>
      <div className='m-4 flex w-[95%]  max-w-[1280px] flex-col justify-center bg-second pb-4 '>
        <HeadDecoration title={t("profile")} />
        <div className='grid-rows-auto  grid-cols-2  xl:grid'>
          <div className=' row-span-1  flex flex-col  items-center justify-center gap-6 '>
            <div className='z-10 flex flex-row items-center justify-center gap-6 p-4 pb-0 '>
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
                <p className='my-1 font-openSans text-xs font-bold text-tertiary-300 '>
                  {t("joined")}{" "}
                  <span className='text-mainText'>23-04-2023</span>
                </p>
              </div>
            </div>
            <div className='z-10 flex w-[40%] flex-col justify-center gap-1 font-openSans text-xs radius-default'>
              <p>
                {t("band")}{" "}
                <span className='font-bold'>
                  Sublunar / Free Return Trajectory
                </span>
              </p>
              <div className='flex flex-row items-center justify-evenly gap-4 p-2 text-xl'>
                <FaYoutube size={35} />
                <FaSoundcloud size={35} />
              </div>
            </div>
            <LevelBar
              points={userStats.points}
              lvl={userStats.lvl}
              currentLevelMaxPoints={userStats.currentLevelMaxPoints}
            />
          </div>
          <div className=' z-10 row-span-1 m-4 flex justify-center border-2 border-second-400/60 bg-second-600 p-2 radius-default '>
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
          <div className='row-cols-1 m-2 flex flex-wrap justify-around'>
            {statsField.map(({ Icon, description, value }) => (
              <StatsField
                key={description}
                Icon={Icon}
                description={description}
                value={value}
              />
            ))}
          </div>
          <div className='row-cols-1 m-4  flex flex-col justify-between  '>
            <AchievementWrapper userAchievements={achievements} />
          </div>
          <div className='col-span-2 m-auto  p-2 lg:max-w-[80%]'>
            <Calendar userAuth={userAuth} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
