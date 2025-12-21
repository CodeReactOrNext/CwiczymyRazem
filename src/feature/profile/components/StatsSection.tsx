import type { DateWithReport } from "components/ActivityLog/activityLog.types";
import { StatsCard } from "components/Cards";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import SkillsRadarChart from "feature/profile/components/SkillsRadarChart/SkillsRadarChart";
import {
  StatsField,
  type StatsFieldProps,
} from "feature/profile/components/StatsField";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "react-i18next";
import type { StatisticsDataInterface } from "types/api.types";
import { calculatePercent, convertMsToHM } from "utils/converter";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { getTrendData } from "../utils/getTrendData";
import { Card } from "assets/components/ui/card";
import ActivityLog from "components/ActivityLog/ActivityLog";
import { DailyRecommendation } from "feature/songs/components/DailyRecommendation/DailyRecommendation";
import { DailyPlanRecommendation } from "feature/songs/components/DailyRecommendation/DailyPlanRecommendation";
import { RecommendationSkeleton } from "feature/songs/components/DailyRecommendation/RecommendationSkeleton";
import { getDailyRecommendation } from "feature/songs/services/getRecommendation";
import { getDailyExerciseRecommendation } from "feature/exercisePlan/services/getDailyRecommendation";
import { useEffect } from "react";
import SongSheet from "feature/songs/components/SongSheet/SongSheet";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";

interface StatsSectionProps {
  statsField: StatsFieldProps[];
  statistics: StatisticsDataInterface;
  datasWithReports: DateWithReport[];
  userAuth: string;
  userSongs:
    | {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
      }
    | undefined;
  achievements?: any[];
  onSongsChange?: () => void;
}

export const StatsSection = ({
  statsField,
  statistics,
  datasWithReports,
  userSongs,
  userAuth,
  achievements,
  onSongsChange,
}: StatsSectionProps) => {
  const { t } = useTranslation("profile");
  const { time } = statistics;
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);
  const [dailyPick, setDailyPick] = useState<Song | null>(null);
  const [dailyExercisePick, setDailyExercisePick] = useState<ExercisePlan | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const currentUserId = useAppSelector(selectUserAuth);
  const isOwnProfile = currentUserId === userAuth;

  const refreshSongs = async () => {
    if (onSongsChange) {
      onSongsChange();
    } else {
      fetchRecommendations();
    }
  };

  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange: () => {},
    userSongs: userSongs || { wantToLearn: [], learning: [], learned: [] },
    onTableStatusChange: refreshSongs,
  });

  const fetchRecommendations = async () => {
    if (!isOwnProfile) return;
    setIsLoadingRecommendations(true);
    try {
      // Song recommendation
      if (userSongs) {
        const ownedIds = [
          ...userSongs.wantToLearn.map(s => s.id),
          ...userSongs.learning.map(s => s.id),
          ...userSongs.learned.map(s => s.id)
        ];
        const pick = await getDailyRecommendation(ownedIds);
        setDailyPick(pick);
      }

      // Exercise recommendation
      const exPick = getDailyExerciseRecommendation();
      setDailyExercisePick(exPick);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userSongs, isOwnProfile]);

  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  const statsWithKeys = statsField.map((stat) => {
    if (stat.id === "total-time") {
      return {
        ...stat,
        key: "time",
      };
    }

    if (stat.id === "points") {
      return {
        ...stat,
        key: "points",
      };
    }

    return stat;
  });

  const sortedStats = statsWithKeys.sort((a, b) => {
    if (a.key && !b.key) return -1;
    if (!a.key && b.key) return 1;

    if (a.key === "time" && b.key === "points") return -1;
    if (a.key === "points" && b.key === "time") return 1;

    return 0;
  });

  const statsWithTrends = sortedStats.map((stat) => {
    if (!stat.key) return stat;

    const trendData = getTrendData(
      datasWithReports,
      stat.key as "points" | "time"
    );

    return {
      ...stat,
      trendData,
    };
  });

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-2'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {statsWithTrends
              .filter(
                (stat) => stat.id === "total-time" || stat.id === "points"
              )
              .map(({ id, Icon, description, value, trendData }) => (
                <StatsField
                  key={id}
                  Icon={Icon}
                  description={description}
                  value={value}
                  trendData={trendData}
                />
              ))}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {statsWithTrends
              .filter(
                (stat) =>
                  stat.id === "session-count" || stat.id === "habits-count"
              )
              .map(({ id, Icon, description, value }) => (
                <StatsCard
                  key={id}
                  title={description}
                  value={value}
                  icon={Icon ? <Icon className='h-4 w-4' /> : undefined}
                  compact
                />
              ))}
          </div>

          {isOwnProfile && isLoadingRecommendations && (
            <RecommendationSkeleton type="song" />
          )}

          {isOwnProfile && !isLoadingRecommendations && dailyPick && (
            <DailyRecommendation 
              song={dailyPick} 
              userSongs={userSongs || { wantToLearn: [], learning: [], learned: [] }} 
              onRefreshSongs={refreshSongs}
              onOpenDetails={(song) => {
                setSelectedSong(song);
                setIsSheetOpen(true);
              }}
            />
          )}

          {!userSongs ? (
            <RecommendationSkeleton type="progress" />
          ) : (
            <Card className='p- group  relative  transition-all duration-300 '>
              <div className='relative'>
                {(() => {
                  const totalSongs =
                    userSongs.wantToLearn.length +
                    userSongs.learning.length +
                    userSongs.learned.length;
                  const learnedPercentage = totalSongs
                    ? (userSongs.learned.length / totalSongs) * 100
                    : 0;
                  const learningPercentage = totalSongs
                    ? (userSongs.learning.length / totalSongs) * 100
                    : 0;

                  if (totalSongs === 0) {
                    return (
                      <div className='rounded-lg  bg-zinc-800/30 p-6 text-center'>
                        <div className='mb-3'>
                          <svg
                            className='mx-auto h-12 w-12 text-zinc-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={1.5}
                              d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                            />
                          </svg>
                        </div>
                        <h5 className='mb-2 font-semibold text-white'>
                          No songs
                        </h5>
                        <p className='text-sm text-zinc-400'>
                          Add your first songs to the library
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className='space-y-5'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h5 className='font-semibold text-white'>
                            Overall progress
                          </h5>
                          <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-1'>
                            <p className='text-[10px] font-bold text-zinc-400'>
                              {totalSongs} songs
                            </p>
                            <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                            <p className='text-[10px] font-bold text-purple-400'>
                              {userSongs.wantToLearn.length} want to learn
                            </p>
                            <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                            <p className='text-[10px] font-bold text-cyan-400'>
                              {userSongs.learning.length} learning
                            </p>
                            <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                            <p className='text-[10px] font-bold text-emerald-400'>
                              {userSongs.learned.length} learned
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-2xl font-black text-white'>
                            {learnedPercentage.toFixed(0)}%
                          </div>
                          <div className='text-[10px] font-bold uppercase tracking-tight text-zinc-500'>Completed</div>
                        </div>
                      </div>

                      <div className='relative mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700/50'>
                        <div
                          className='absolute left-0 top-0 h-full bg-white transition-all duration-700'
                          style={{ width: `${learnedPercentage}%` }}></div>
                        <div
                          className='absolute top-0 h-full bg-white/40 transition-all duration-700'
                          style={{
                            left: `${learnedPercentage}%`,
                            width: `${learningPercentage}%`,
                          }}></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          )}

          {/* Skills Chart - Mobile */}
          <div className='lg:hidden'>
            <div className='relative mb-6'>
              <h3 className='text-xl font-semibold text-white'>Skills</h3>
              <p className='text-xs text-zinc-400'>
                Distribution of exercise time by category{" "}
              </p>
            </div>
            <SkillsRadarChart statistics={statistics} />
            {isOwnProfile && (
              <div className="mt-4">
                {isLoadingRecommendations ? (
                  <RecommendationSkeleton type="exercise" />
                ) : dailyExercisePick ? (
                  <DailyPlanRecommendation plan={dailyExercisePick} />
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='hidden lg:block space-y-4'>
            <SkillsRadarChart statistics={statistics} />
            {isOwnProfile && isLoadingRecommendations && (
               <RecommendationSkeleton type="exercise" />
            )}
            {isOwnProfile && !isLoadingRecommendations && dailyExercisePick && (
              <DailyPlanRecommendation plan={dailyExercisePick} />
            )}
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <SeasonalAchievements userId={userAuth} />
      </div>

      {/* Regular Achievements - Collapsible */}
      <div className='space-y-2'>
        <button
          onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
          className='group flex w-full items-center justify-between rounded-lg p-3 transition-all duration-200 hover:bg-white/5'
          aria-expanded={isAchievementsExpanded}>
          <div className='text-left'>
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold text-white'>Achievements</h3>
              <span className='rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/70'>
                {achievements?.length || 0}
              </span>
            </div>
            <p className='text-sm text-zinc-400'>Your trophies and rewards</p>
          </div>
          <div className='text-white/60 transition-colors duration-200 group-hover:text-white'>
            {isAchievementsExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isAchievementsExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}>
          <AchievementWrapper userAchievements={achievements ?? []} />
        </div>
      </div>

      <SongSheet
        song={selectedSong}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onStatusChange={async (newStatus) => {
          if (selectedSong) {
            if (newStatus === undefined) {
              await handleSongRemoval(selectedSong.id);
            } else {
              await handleStatusChange(
                selectedSong.id,
                newStatus,
                selectedSong.title,
                selectedSong.artist
              );
            }
          }
        }}
        onRatingChange={refreshSongs}
        status={
          userSongs?.wantToLearn.some(s => s.id === selectedSong?.id) ? "wantToLearn" :
          userSongs?.learning.some(s => s.id === selectedSong?.id) ? "learning" :
          userSongs?.learned.some(s => s.id === selectedSong?.id) ? "learned" : 
          undefined
        }
      />
    </div>
  );
};
