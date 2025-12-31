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
  const { datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth);

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
        <div className='relative overflow-hidden rounded-2xl bg-zinc-900/60 p-8 shadow-2xl'>
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
                    avatarURL={avatar}
                  />
                  <div className='absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 shadow-xl'>
                    <div className='flex flex-col items-center justify-center leading-none'>
                      <span className='text-[8px] font-black uppercase tracking-tighter text-zinc-500'>LVL</span>
                      <span className='text-sm font-black text-white'>{statistics.lvl}</span>
                    </div>
                  </div>
                </div>
                <div className='flex-col'>
                  <h1 className='relative bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-3xl font-black tracking-tight text-transparent lg:text-5xl'>
                    {displayName}
                  </h1>
                  <div className='mt-2 flex items-center gap-2'>
                    <div className='flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5'>
                      <div className='h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]'></div>
                      <span className='text-xs font-black uppercase tracking-widest text-zinc-300'>
                        {statistics.points.toLocaleString()} <span className="text-zinc-500">{t("points")}</span>
                      </span>
                    </div>
                    {band && (
                      <div className='rounded-full bg-purple-500/10 px-4 py-1.5'>
                        <span className='text-xs font-bold text-purple-300/80'>{band}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Info Section */}
              <div className='rounded-xl border border-zinc-700/30 bg-zinc-800/20 p-4 sm:p-6 backdrop-blur-sm'>
                <div className='font-openSans space-y-3'>
                  <DaySinceMessage date={new Date(lastReportDate)} />
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div className='flex items-center gap-2 text-sm text-zinc-300'>
                      <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
                      <span>
                        Joined: {createdAt.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    {yearsOfPlaying && yearsOfPlaying > 0 && (
                      <div className='flex items-center gap-2 text-sm text-zinc-300'>
                        <div className='h-2 w-2 rounded-full bg-green-400'></div>
                        <span>Playing for {yearsOfPlaying} years</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {(youTubeLink || soundCloudLink) && (
                  <div className='mt-4 flex flex-row flex-wrap justify-start gap-3 pt-4'>
                    {youTubeLink && (
                      <a
                        target='_blank'
                        rel='noreferrer'
                        href={youTubeLink}
                        className='flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm transition-all hover:bg-red-500/20'>
                        <FaYoutube size={16} />
                        YouTube
                      </a>
                    )}
                    {soundCloudLink && (
                      <a
                        target='_blank'
                        rel='noreferrer'
                        href={soundCloudLink}
                        className='flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 text-sm transition-all hover:bg-orange-500/20'>
                        <FaSoundcloud size={16} />
                        SoundCloud
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Level Bar */}
              <div className='rounded-xl border border-zinc-700/30 bg-zinc-800/20 p-4 sm:p-6 backdrop-blur-sm'>
                <h3 className='mb-4 text-lg font-semibold text-white'>
                  Level Progress
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

        {/* Enhanced Stats Section */}
        <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
          <h2 className='mb-6 text-2xl font-bold text-white'>Statistics</h2>
          <StatsSection
            statsField={statsField}
            statistics={statistics}
            datasWithReports={datasWithReports}
            userSongs={songs}
            userAuth={userAuth}
            achievements={achievements}
            year={year}
            setYear={setYear}
            isLoadingActivity={isLoading}
          />
        </div>

        {/* Skills Section */}
        {userSkills && (
          <div className='rounded-2xl bg-zinc-900/30 p-6'>
            <h2 className='mb-6 text-2xl font-bold text-white'>Skills</h2>
            <SkillTreeCards isUserProfile userSkills={userSkills} />
          </div>
        )}


      </div>
    </MainContainer>
  );
};

export default ProfileLayout;
