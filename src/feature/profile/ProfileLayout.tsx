import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DaySinceMessage } from "components/DaySince/DaySince";
import { LevelBar } from "components/LevelBar/LevelBar";
import MainContainer from "components/MainContainer";
import Avatar from "components/UI/Avatar";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillTreeCards } from "feature/skills/SkillTreeCards";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSoundcloud, FaYoutube } from "react-icons/fa";
import type { ProfileInterface } from "types/ProfileInterface";
import { getYearsOfPlaying } from "utils/converter";

import { PracticeInsights } from "./components/PracticeInsights/PracticeInsights";
import { StatsSection } from "./components/StatsSection";

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
  const [songs, setSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>();
  const {
    statistics,
    displayName,
    avatar,
    createdAt,
    band,
    soundCloudLink,
    youTubeLink,
    guitarStartDate,
  } = userData;
  const { lastReportDate, achievements } = statistics;
  const [userSkills, setUserSkills] = useState<UserSkills>();
  const { datasWithReports } = useActivityLog(userAuth);

  const yearsOfPlaying = guitarStartDate
    ? getYearsOfPlaying(guitarStartDate.toDate())
    : null;

  useEffect(() => {
    getUserSongs(userAuth).then((songs) => setSongs(songs));
  }, []);

  useEffect(() => {
    getUserSkills(userAuth).then((skills) => setUserSkills(skills));
  }, []);

  return (
    <MainContainer title={t("profile")}>
      <div className='grid-rows-auto m-auto max-w-screen-2xl grid-cols-1 px-5 xl:grid'>
        <div className='content-box relative z-10 row-span-1 mb-4 flex flex-col items-start gap-3 !p-6'>
          <div className='flex w-full flex-col justify-between gap-6 lg:flex-row'>
            <div className='flex w-full flex-col gap-4 lg:w-1/2'>
              <div className='flex flex-row items-center gap-6 p-4 pb-0'>
                <Avatar
                  name={displayName}
                  lvl={statistics.lvl}
                  avatarURL={avatar}
                />
                <div className='flex-col'>
                  <p className='relative text-2xl lg:text-4xl'>{displayName}</p>
                  <p className='relative text-lg font-thin lg:text-xl'>
                    {t("points")}:{" "}
                    <span className='text-xl font-bold lg:text-2xl'>
                      {statistics.points}
                    </span>
                  </p>
                </div>
              </div>

              <div className='z-10 mt-2 gap-1 font-openSans text-sm'>
                <DaySinceMessage date={new Date(lastReportDate)} />
                <p className='my-1 font-thin'>
                  {t("joined")}{" "}
                  <span className='font-semibold'>
                    {createdAt.toDate().toLocaleDateString()}
                  </span>
                </p>
                {yearsOfPlaying && yearsOfPlaying > 0 && (
                  <p className='font-thin'>
                    {t("yearsOfPlaying")}{" "}
                    <span className='font-bold'>{yearsOfPlaying}</span>
                  </p>
                )}
                {band && (
                  <p className='font-thin'>
                    {t("band")} <span className='font-bold'>{band}</span>
                  </p>
                )}

                <div className='flex flex-row flex-wrap justify-start gap-4 p-2 text-sm'>
                  {youTubeLink && (
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href={youTubeLink}
                      className='flex items-center gap-1 transition-colors hover:text-red-500'>
                      <FaYoutube size={30} />
                      YouTube
                    </a>
                  )}
                  {soundCloudLink && (
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href={soundCloudLink}
                      className='flex items-center gap-1 transition-colors hover:text-orange-500'>
                      <FaSoundcloud size={30} />
                      SoundCloud
                    </a>
                  )}
                </div>
              </div>

              <div className='w-fit'>
                <LevelBar
                  points={statistics.points}
                  lvl={statistics.lvl}
                  currentLevelMaxPoints={statistics.currentLevelMaxPoints}
                />
              </div>
            </div>

            <div className='mt-4 w-full font-openSans lg:mt-0 lg:w-1/2'>
              <PracticeInsights statistics={statistics} />
            </div>
          </div>
        </div>

        <div className='grid-rows-auto col-span-2'>
          <StatsSection
            statsField={statsField}
            statistics={statistics}
            datasWithReports={datasWithReports}
            userSongs={songs}
            userAuth={userAuth}
          />
        </div>

        <div className='col-span-2 p-2'>
          <ActivityLog userAuth={userAuth} />
        </div>
        <div className='my-2 mb-2 flex flex-col justify-between'>
          <AchievementWrapper userAchievements={achievements} />
        </div>
        {userSkills && (
          <div className='col-span-2 p-2'>
            <SkillTreeCards isUserProfile userSkills={userSkills} />
          </div>
        )}
      </div>
    </MainContainer>
  );
};

export default ProfileLayout;
