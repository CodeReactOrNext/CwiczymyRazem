import { useTranslation } from "react-i18next";
import { FaSoundcloud, FaYoutube } from "react-icons/fa";
import { useState, useEffect } from "react";

import Avatar from "components/Avatar";
import Calendar from "components/Calendar";
import LevelBar from "components/LevelBar";
import DaySince from "components/DaySince/DaySince";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { convertMsToHM } from "utils/converter";
import { ProfileInterface } from "types/ProfileInterface";
import MainContainer from "components/MainContainer";
import { getUserSongsWithStatus } from 'utils/firebase/client/firebase.utils';

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

  const [userSongs, setUserSongs] = useState({
    wantToLearn: [],
    learning: [],
    learned: [],
  });

  useEffect(() => {
    const loadUserSongs = async () => {
      if (!userAuth) return;

      const wantToLearn = await getUserSongsWithStatus(userAuth, 'wantToLearn');
      const learning = await getUserSongsWithStatus(userAuth, 'learning');
      const learned = await getUserSongsWithStatus(userAuth, 'learned');

      setUserSongs({
        wantToLearn,
        learning,
        learned,
      });
    };

    loadUserSongs();
  }, [userAuth]);

  return (
    <MainContainer title={t("profile")}>
      <div className='grid-rows-auto  grid-cols-2 px-5  xl:grid'>
        <div className='content-box relative z-10 row-span-1 m-4 flex flex-col items-start gap-3 !p-6'>
          <div className=' flex  flex-row items-center gap-6 p-4 pb-0 '>
            <Avatar
              name={displayName}
              lvl={statistics.lvl}
              avatarURL={avatar}
            />
            <div className='flex-col'>
              <p className='relative  text-4xl'>{displayName}</p>
              <p className='relative text-xl font-thin'>
                {t("points")}:{" "}
                <span className='text-2xl font-bold'>{statistics.points}</span>
              </p>
            </div>
          </div>
          <div className='z-10 mt-2 gap-1 font-openSans text-sm'>
            <DaySince date={new Date(lastReportDate)} />
            <p className='my-1 font-thin '>
              {t("joined")}{" "}
              <span className='font-semibold'>
                {createdAt.toDate().toLocaleDateString()}
              </span>
            </p>
            {band && (
              <p className='font-thin'>
                {t("band")} <span className='font-bold'>{band}</span>
              </p>
            )}
            <div className='flex flex-row justify-evenly gap-4 p-2 text-sm'>
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
        <div className='content-box z-10 row-span-1 m-4 flex justify-center '>
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
        <div className='grid h-fit  grid-flow-row grid-cols-2 gap-4 p-6 md:grid-cols-3'>
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
        <div className='col-span-2  p-2 '>
          <Calendar userAuth={userAuth} />
        </div>
        <div className="content-box z-10 row-span-1 m-4">
          <h3 className="text-xl font-semibold mb-4">{t('my_songs')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">{t('want_to_learn')} ({userSongs.wantToLearn.length})</h4>
              <ul className="space-y-2">
                {userSongs.wantToLearn.map(song => (
                  <li key={song.id} className="text-sm">{song.title} - {song.artist}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('learning')} ({userSongs.learning.length})</h4>
              <ul className="space-y-2">
                {userSongs.learning.map(song => (
                  <li key={song.id} className="text-sm">{song.title} - {song.artist}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t('learned')} ({userSongs.learned.length})</h4>
              <ul className="space-y-2">
                {userSongs.learned.map(song => (
                  <li key={song.id} className="text-sm">{song.title} - {song.artist}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  );
};

export default ProfileLayout;
