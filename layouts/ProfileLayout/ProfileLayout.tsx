import StatsField, { StatsFieldProps } from "./components/StatsField";
import StatisticBar from "./components/StatisticBar";
import { Level } from "./components/UserHeader/components/Level";
import HeadDecoration from "./components/HeadDecoration";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { useTranslation } from "react-i18next";
import { convertMsToHM } from "utils/converter/timeConverter";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";
import Avatar from "components/Avatar";
import DaySince from "components/DaySince/DaySince";
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
    <div className='flex justify-center'>
      <div className='m-4 mt-28 flex w-[90%]  max-w-[1080px] flex-col justify-center bg-second pb-4 '>
        <HeadDecoration title={t("profile")} />
        <div className='grid-rows-auto  grid-cols-2  md:grid'>
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
            <Level
              points={userStats.points}
              lvl={userStats.lvl}
              pointsToNextLvl={userStats.pointsToNextLvl}
            />
          </div>
          <div className=' row-span-1 my-5 flex justify-center '>
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
          <div className='row-cols-1'>
            {statsField.map(({ Icon, description, value }, index) => (
              <StatsField
                key={index}
                Icon={Icon}
                description={description}
                value={value}
              />
            ))}
          </div>
          <div className='row-cols-1  '>
            <AchievementWrapper userAchievements={achievements} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
