import { useTranslation } from "react-i18next";
import { FaSoundcloud, FaYoutube } from "react-icons/fa";

import Avatar from "components/Avatar";
import Calendar from "components/Calendar";
import LevelBar from "components/UI/LevelBar";
import DaySince from "components/DaySince/DaySince";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { convertMsToHM } from "utils/converter/timeConverter";
import { ProfileInterface } from "types/ProfileInterface";

export interface LandingLayoutProps {
  statsField: StatsFieldProps[];
  userData: ProfileInterface;
  userAuth: string;
}

const ProfileLayout = ({
  statsField,
  userData,
  userAuth,
}: LandingLayoutProps) => {
  const { t } = useTranslation("profile");
  const {
    statistics,
    displayName,
    avatar,
    createdAt,
    band,
    soundCloudLink,
    youTubeLink,
  } = userData;
  const { time, achievements, lastReportDate } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  return (
    <div className='mt-8 flex justify-center'>
      <div className='m-4 flex w-[95%]  max-w-[1280px] flex-col justify-center bg-second pb-4 '>
        <HeadDecoration title={t("profile")} />
        <div className='grid-rows-auto  grid-cols-2  xl:grid'>
          <div className='content-box z-10 row-span-1 flex flex-col m-4 items-center justify-center gap-3 '>
            <div className=' flex  flex-row items-center justify-center gap-6 p-4 pb-0 '>
              <Avatar
                name={displayName}
                lvl={statistics.lvl}
                avatarURL={avatar}
              />
              <div className='flex-col '>
                <p className='relative  text-4xl'>{displayName}</p>
                <p className='relative  text-xl'>
                  {t("points")}:{" "}
                  <span className='text-2xl  font-extrabold'>
                    {statistics.points}
                  </span>
                </p>
                <DaySince date={new Date(lastReportDate)} />
                <p className='my-1  font-openSans text-xs font-bold text-tertiary-300 '>
                  {t("joined")}{" "}
                  <span className='text-mainText'>
                    {createdAt.toDate().toLocaleDateString()}
                  </span>
                </p>
              </div>
            </div>
            <div className=' z-10 flex w-[40%] flex-col items-center justify-center gap-1 font-openSans text-sm radius-default'>
              {band && (
                <p>
                  {t("band")} <span className='font-bold'>{band}</span>
                </p>
              )}
              <div className='flex flex-row items-center justify-evenly gap-4 p-2 text-sm'>
                {youTubeLink && (
                  <a
                    target='_blank'
                    rel='noreferrer'
                    href={youTubeLink}
                    className={"flex items-center gap-1"}>
                    <FaYoutube size={30} />
                    YouTube
                  </a>
                )}
                {soundCloudLink && (
                  <a
                    target='_blank'
                    rel='noreferrer'
                    href={soundCloudLink}
                    className={"flex items-center gap-1"}>
                    <FaSoundcloud size={30} />
                    SoundCloud
                  </a>
                )}
              </div>
            </div>
            <LevelBar
              points={statistics.points}
              lvl={statistics.lvl}
              currentLevelMaxPoints={statistics.currentLevelMaxPoints}
            />
          </div>
          <div className=' content-box z-10 row-span-1 m-4 flex justify-center '>
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
