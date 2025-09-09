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
      <div className='m-auto max-w-screen-2xl space-y-8 px-5'>
        {/* Enhanced Profile Header */}
        <div className='relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 p-8 shadow-2xl backdrop-blur-xl'>
          {/* Background decoration */}
          <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5'></div>
          <div className='absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl'></div>
          <div className='absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl'></div>

          <div className='relative z-10 flex w-full flex-col justify-between gap-8 lg:flex-row'>
            {/* Left Side - User Info */}
            <div className='flex w-full flex-col gap-6 lg:w-1/2'>
              <div className='flex flex-row items-center gap-8'>
                <div className='relative'>
                  <Avatar
                    name={displayName}
                    lvl={statistics.lvl}
                    avatarURL={avatar}
                  />
                  <div className='absolute -bottom-2 -right-2 rounded-full border-2 border-zinc-800 bg-gradient-to-r from-cyan-500 to-purple-500 px-3 py-1 text-xs font-bold text-white shadow-lg'>
                    Lvl {statistics.lvl}
                  </div>
                </div>
                <div className='flex-col'>
                  <h1 className='relative bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-3xl font-bold text-transparent lg:text-5xl'>
                    {displayName}
                  </h1>
                  <div className='mt-2 flex items-center gap-3'>
                    <div className='rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1'>
                      <span className='text-sm text-yellow-300'>
                        {statistics.points.toLocaleString()} {t("points")}
                      </span>
                    </div>
                    {band && (
                      <div className='rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1'>
                        <span className='text-sm text-purple-300'>{band}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Info Section */}
              <div className='rounded-xl border border-zinc-700/30 bg-zinc-800/20 p-6 backdrop-blur-sm'>
                <div className='font-openSans space-y-3'>
                  <DaySinceMessage date={new Date(lastReportDate)} />
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div className='flex items-center gap-2 text-sm text-zinc-300'>
                      <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
                      <span>
                        Dołączył: {createdAt.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    {yearsOfPlaying && yearsOfPlaying > 0 && (
                      <div className='flex items-center gap-2 text-sm text-zinc-300'>
                        <div className='h-2 w-2 rounded-full bg-green-400'></div>
                        <span>Gra od {yearsOfPlaying} lat</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {(youTubeLink || soundCloudLink) && (
                  <div className='mt-4 flex flex-row flex-wrap justify-start gap-3 border-t border-zinc-700/30 pt-4'>
                    {youTubeLink && (
                      <a
                        target='_blank'
                        rel='noreferrer'
                        href={youTubeLink}
                        className='flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm transition-all hover:border-red-500/50 hover:bg-red-500/20'>
                        <FaYoutube size={16} />
                        YouTube
                      </a>
                    )}
                    {soundCloudLink && (
                      <a
                        target='_blank'
                        rel='noreferrer'
                        href={soundCloudLink}
                        className='flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm transition-all hover:border-orange-500/50 hover:bg-orange-500/20'>
                        <FaSoundcloud size={16} />
                        SoundCloud
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Level Bar */}
              <div className='rounded-xl border border-zinc-700/30 bg-zinc-800/20 p-6 backdrop-blur-sm'>
                <h3 className='mb-4 text-lg font-semibold text-white'>
                  Postęp poziomu
                </h3>
                <LevelBar
                  points={statistics.points}
                  lvl={statistics.lvl}
                  currentLevelMaxPoints={statistics.currentLevelMaxPoints}
                />
              </div>
            </div>

            {/* Right Side - Practice Insights */}
            <div className='font-openSans w-full lg:w-1/2'>
              <PracticeInsights statistics={statistics} />
            </div>
          </div>
        </div>

        {/* Enhanced Stats and Charts Section */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Stats Section - 2/3 width */}
          <div className='lg:col-span-2'>
            <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
              <h2 className='mb-6 text-2xl font-bold text-white'>Statystyki</h2>
              <StatsSection
                statsField={statsField}
                statistics={statistics}
                datasWithReports={datasWithReports}
                userSongs={songs}
                userAuth={userAuth}
              />
            </div>
          </div>

          {/* Achievements - 1/3 width */}
          <div className='space-y-6'>
            <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
              <h2 className='mb-6 text-xl font-bold text-white'>Osiągnięcia</h2>
              <AchievementWrapper userAchievements={achievements} />
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {userSkills && (
          <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
            <h2 className='mb-6 text-2xl font-bold text-white'>Umiejętności</h2>
            <SkillTreeCards isUserProfile userSkills={userSkills} />
          </div>
        )}

        {/* Activity Log */}
        <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
          <h2 className='mb-6 text-2xl font-bold text-white'>
            Ostatnia aktywność
          </h2>
          <ActivityLog userAuth={userAuth} />
        </div>
      </div>
    </MainContainer>
  );
};

export default ProfileLayout;
