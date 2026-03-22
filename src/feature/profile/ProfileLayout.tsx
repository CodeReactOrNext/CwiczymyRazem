import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { DaySinceMessage } from "components/DaySince/DaySince";
import { LevelBar } from "components/LevelBar/LevelBar";
import Avatar from "components/UI/Avatar";
import { HeroBanner } from "components/UI/HeroBanner";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillTreeCards } from "feature/skills/SkillTreeCards";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useState } from "react";
import { FaSoundcloud, FaYoutube } from "react-icons/fa";
import type { ProfileInterface } from "types/ProfileInterface";
import { getYearsOfPlaying } from "utils/converter";

import { PracticeInsights } from "./components/PracticeInsights/PracticeInsights";
import { ProfileArsenal } from "./components/ProfileArsenal";
import { SongSkillShowcase } from "./components/SongSkillShowcase";
import { StatsSection } from "./components/StatsSection";
import { UserRecordingsSection } from "./components/UserRecordingsSection";

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
    selectedFrame,
    selectedGuitar,
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
    <div className='bg-second-600 rounded-xl flex flex-col shadow-sm border-none lg:mt-16'>
      <HeroBanner
        eyebrow='Player Profile'
        title={displayName}
        subtitle={`${statistics.points.toLocaleString()} ${t("points")}${band ? ` · ${band}` : ""}`}
        className='w-full !rounded-none !shadow-none'
        leftContent={
          <div className='flex items-center gap-5'>
            {/* Avatar with level badge */}
            <div className='relative shrink-0'>
              <Avatar
                name={displayName}
                avatarURL={avatar}
                lvl={statistics.lvl}
                selectedFrame={selectedFrame}
                selectedGuitar={selectedGuitar}
              />
              <div className='absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 shadow-xl'>
                <div className='flex flex-col items-center justify-center leading-none'>
                  <span className='text-[7px] font-black uppercase tracking-tighter text-zinc-500'>LVL</span>
                  <span className='text-sm font-black text-white'>{statistics.lvl}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className='space-y-2'>
              <DaySinceMessage date={new Date(lastReportDate)} />
              <div className='flex flex-wrap gap-x-4 gap-y-1'>
                <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500'>
                  <div className='h-1.5 w-1.5 rounded-full bg-cyan-400'></div>
                  <span>Joined: <span className='tracking-normal text-zinc-300 tabular-nums'>{createdAt.toDate().toLocaleDateString()}</span></span>
                </div>
                {yearsOfPlaying && yearsOfPlaying > 0 && (
                  <div className='flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500'>
                    <div className='h-1.5 w-1.5 rounded-full bg-green-400'></div>
                    <span>Playing for <span className='tracking-normal text-zinc-300 tabular-nums'>{yearsOfPlaying} years</span></span>
                  </div>
                )}
              </div>
              {(youTubeLink || soundCloudLink) && (
                <div className='flex flex-wrap gap-2'>
                  {youTubeLink && (
                    <a target='_blank' rel='noreferrer' href={youTubeLink}
                      className='flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs transition-all hover:bg-red-500/20'>
                      <FaYoutube size={13} /> YouTube
                    </a>
                  )}
                  {soundCloudLink && (
                    <a target='_blank' rel='noreferrer' href={soundCloudLink}
                      className='flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1.5 text-xs transition-all hover:bg-orange-500/20'>
                      <FaSoundcloud size={13} /> SoundCloud
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className='space-y-8 p-4 md:p-6'>
        {/* Level + Practice Insights */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='rounded-xl bg-zinc-800/20 p-4 sm:p-6 backdrop-blur-sm'>
            <h3 className='mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500'>
              Level Progress
            </h3>
            <LevelBar
              points={statistics.points}
              lvl={statistics.lvl}
              currentLevelMaxPoints={statistics.currentLevelMaxPoints}
            />
          </div>
          <div className='font-openSans lg:col-span-2'>
            <PracticeInsights statistics={statistics} />
          </div>
        </div>

        {/* Activity Heatmap */}
        <ActivityLogView
          year={year}
          setYear={setYear}
          datasWithReports={datasWithReports}
          isLoading={isLoading}
        />

        {/* Stats Section */}
        <div className='rounded-2xl bg-zinc-900/30 p-6 backdrop-blur-sm'>
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

        {/* Song Skill Showcase — visible to guests only */}
        <SongSkillShowcase userSongs={songs} profileUserId={userAuth} />

        {/* Skills Section */}
        {userSkills && (
          <div className='rounded-2xl bg-zinc-900/30 p-6'>
            <h2 className='mb-6 text-2xl font-bold text-white'>Skills</h2>
            <SkillTreeCards isUserProfile userSkills={userSkills} />
          </div>
        )}

        {/* Arsenal Section */}
        <ProfileArsenal userAuth={userAuth} />

        {/* Recordings Section */}
        <UserRecordingsSection userId={userAuth} />
      </div>
    </div>
  );
};

export default ProfileLayout;
