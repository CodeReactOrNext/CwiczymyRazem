import type { DateWithReport } from "components/ActivityLog/activityLog.types";
import { StatsCard } from "components/Cards";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import SkillsRadarChart from "feature/profile/components/SkillsRadarChart/SkillsRadarChart";
import {
  StatsField,
  type StatsFieldProps,
} from "feature/profile/components/StatsField";
import SongSheet from "feature/songs/components/SongSheet/SongSheet";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";

import { getTrendData } from "../utils/getTrendData";
import { RecommendationsSection } from "./Recommendations/RecommendationsSection";

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
  year: number;
  setYear: (year: number) => void;
  isLoadingActivity: boolean;
  mode?: "practice" | "review";
}

export const StatsSection = ({
  statsField,
  statistics,
  datasWithReports,
  userSongs,
  userAuth,
  achievements,
  onSongsChange,
  year,
  setYear,
  isLoadingActivity,
  mode = "review",
}: StatsSectionProps) => {
  const { time } = statistics;
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const currentUserId = useAppSelector(selectUserAuth);
  const isOwnProfile = currentUserId === userAuth;

  const refreshSongs = async () => {
    if (onSongsChange) {
      onSongsChange();
    }
  };

  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange: () => {},
    userSongs: userSongs || { wantToLearn: [], learning: [], learned: [] },
    onTableStatusChange: refreshSongs,
  });

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

  const statsWithTrends = useMemo(() => {
    return sortedStats.map((stat) => {
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
  }, [sortedStats, datasWithReports]);

  if (mode === "practice") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecommendationsSection 
            userSongs={userSongs} 
            isOwnProfile={isOwnProfile} 
            onRefreshSongs={refreshSongs}
            onOpenDetails={(song) => {
                setSelectedSong(song);
                setIsSheetOpen(true);
            }}
            type="exercise"
            />
            <RecommendationsSection 
            userSongs={userSongs} 
            isOwnProfile={isOwnProfile} 
            onRefreshSongs={refreshSongs}
            onOpenDetails={(song) => {
                setSelectedSong(song);
                setIsSheetOpen(true);
            }}
            type="song"
            />
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
  }

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

          {/* Skills Chart - Mobile */}
          <div className='lg:hidden'>
            <div className='relative mb-6'>
              <h3 className='text-xl font-semibold text-white'>Skills</h3>
              <p className='text-xs text-zinc-400'>
                Distribution of exercise time by category{" "}
              </p>
            </div>
            <SkillsRadarChart statistics={statistics} />
          </div>
        </div>

        <div className='space-y-6'>
          <div className='hidden lg:block space-y-4'>
            <SkillsRadarChart statistics={statistics} />
          </div>
        </div>
      </div>



      <div className='space-y-2'>
        <SeasonalAchievements userId={userAuth} />
      </div>

      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold text-white'>Achievements</h3>
          <span className='rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/70'>
            {achievements?.length || 0}
          </span>
        </div>
        <AchievementWrapper userAchievements={achievements ?? []} />
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
