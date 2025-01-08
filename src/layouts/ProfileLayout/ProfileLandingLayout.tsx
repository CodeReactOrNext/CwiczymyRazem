import { useTranslation } from "react-i18next";

import Calendar from "components/Calendar";
import StatisticBar from "./components/StatisticBar";
import HeadDecoration from "./components/HeadDecoration";
import StatsField, { StatsFieldProps } from "./components/StatsField";
import AchievementWrapper from "./components/Achievement/AchievementWrapper";

import { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM, calculatePercent } from "utils/converter";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import { useEffect, useState } from "react";
import { getUserSongs } from "utils/firebase/client/firebase.utils";
import { Song } from "utils/firebase/client/firebase.types";
import { Timestamp } from "firebase/firestore";

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
  const [songs, setSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>();
  const { time, achievements } = userStats;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  useEffect(() => {
    getUserSongs(userAuth).then((songs) => setSongs(songs));
  }, []);

  return (
    <div className='bg-second-600 radius-default'>
      <HeadDecoration title={t("statistics")} />
      <div className='grid-rows-auto grid-cols-1 items-start gap-6 p-3  md:grid-cols-2 md:!p-6 lg:grid '>
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
        <div className=' content-box relative z-20 my-2  flex  content-around justify-center '>
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
        <div className=' my-2 flex flex-col justify-between  '>
          <AchievementWrapper userAchievements={achievements} />
        </div>
        <div className='d-flex justify-content-center  '>
          <Calendar userAuth={userAuth} />
        </div>
        <div className='col-span-2 font-openSans'>
          {songs && (
            <SongLearningSection
              isLanding
              userSongs={{
                learned: songs?.learned,
                learning: songs?.learning,
                wantToLearn: songs?.wantToLearn,
              }}
              onChange={(songs) => setSongs(songs)}
            />
          )}
        </div>
        <div className='col-span-2 '>{featSlot}</div>
      </div>
    </div>
  );
};

export default ProfileLandingLayout;
