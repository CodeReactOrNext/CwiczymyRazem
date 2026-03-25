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
import { getSongTier } from "feature/songs/utils/getSongTier";
import { getYearsOfPlaying } from "utils/converter";
import { getPointsToLvlUp } from "utils/gameLogic";

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

  const lvlXpStart = getPointsToLvlUp(statistics.lvl - 1);
  const lvlXpEnd = getPointsToLvlUp(statistics.lvl);
  let effectivePts = statistics.points;
  if (statistics.points < lvlXpStart && statistics.lvl > 1) effectivePts += lvlXpStart;
  const ptsInLevel = Math.max(0, effectivePts - lvlXpStart);
  const lvlRange = Math.max(1, lvlXpEnd - lvlXpStart);
  const xpPercent = Math.min(Math.max((ptsInLevel / lvlRange) * 100, 0), 100);
  const arcR = 38;
  const arcC = 2 * Math.PI * arcR;
  const arcOffset = arcC * (1 - xpPercent / 100);

  const tierOrder: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1, '?': 0 };
  const bestTierKey = songs?.learned?.reduce<string>((best, song) => {
    const t = song.tier ?? '?';
    return (tierOrder[t] ?? 0) > (tierOrder[best] ?? 0) ? t : best;
  }, '?') ?? '?';
  const songTier = getSongTier(bestTierKey);

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
        rightContent={
          <div className='relative flex select-none items-center gap-4 pr-2'>
            <div className='absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl' />

            {/* Song tier badge */}
            <div className='relative flex flex-col items-center gap-1.5'>
              <span className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400'>Song tier</span>
              <div
                className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg'
                style={{ color: songTier.color, backgroundColor: 'rgba(10,10,10,0.9)', borderColor: `${songTier.color}40` }}
              >
                {songTier.tier}
              </div>
              <span className='text-[11px] font-medium' style={{ color: songTier.color }}>{songTier.label}</span>
            </div>

            {/* Level ring */}
            <div className='relative flex flex-col items-center gap-1'>
              <svg width='120' height='120' viewBox='0 0 100 100' className='relative shrink-0'>
                <defs>
                  <linearGradient id='lvlArcGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                    <stop offset='0%' stopColor='#a5f3fc' />
                    <stop offset='100%' stopColor='#0891b2' />
                  </linearGradient>
                  <filter id='lvlGlow' x='-30%' y='-30%' width='160%' height='160%'>
                    <feGaussianBlur stdDeviation='2.5' result='blur' />
                    <feMerge><feMergeNode in='blur' /><feMergeNode in='SourceGraphic' /></feMerge>
                  </filter>
                </defs>
                <circle cx='50' cy='50' r='46' fill='rgba(0,0,0,0.45)' />
                <circle cx='50' cy='50' r={arcR} fill='none' stroke='rgba(255,255,255,0.1)' strokeWidth='6' />
                <circle
                  cx='50' cy='50' r={arcR}
                  fill='none'
                  stroke='url(#lvlArcGrad)'
                  strokeWidth='6'
                  strokeLinecap='round'
                  strokeDasharray={arcC}
                  strokeDashoffset={arcOffset}
                  transform='rotate(-90 50 50)'
                  filter='url(#lvlGlow)'
                />
                <text x='50' y='54' textAnchor='middle' fill='white' fontSize='24' fontWeight='900' style={{ fontFamily: 'system-ui, sans-serif' }}>
                  {statistics.lvl}
                </text>
                <text x='50' y='67' textAnchor='middle' fill='#67e8f9' fontSize='9' fontWeight='700' letterSpacing='3' style={{ fontFamily: 'system-ui, sans-serif' }}>
                  LVL
                </text>
              </svg>
              <span className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400'>Level progress</span>
              <span className='text-[11px] tabular-nums text-zinc-500'>{ptsInLevel.toLocaleString()} / {lvlRange.toLocaleString()} XP</span>
            </div>
          </div>
        }
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
        {/* Practice Insights */}
        <div className='font-openSans'>
          <PracticeInsights statistics={statistics} />
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
