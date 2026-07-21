import { useQuery } from "@tanstack/react-query";
import { getUserStatsField } from "assets/stats/profileStats";
import ActivityLog from "components/ActivityLog/ActivityLog";
import { downloadActivityLogCsv } from "components/ActivityLog/activityLog.export";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import { DashboardSection } from "components/Layout";
import MainContainer from "components/MainContainer";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { PROGRESS_TABS } from "constants/navTabs";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
import { RecordsList, SongLearningSection } from "feature/profile/components/DetailedStats/DetailedStats";
import { LevelProgressHero } from "feature/profile/components/LevelProgressHero";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { StatsSection } from "feature/profile/components/StatsSection";
import { downloadProfileSummaryCsv } from "feature/profile/services/profileSummary.export";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { downloadSongProgressCsv } from "feature/songs/services/songs.export";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import { Download } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";

const ExportButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type='button'
    onClick={onClick}
    className='flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
    <Download size={14} />
    {label}
  </button>
);

const ProfileActivityPage = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const [refreshKey] = useState(0);
  const { reportList, datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth as string, refreshKey);

  const { data: songs, refetch: refreshSongs } = useQuery({
    queryKey: ['userSongs', userAuth],
    queryFn: () => getUserSongs(userAuth as string),
    enabled: !!userAuth,
  });

  const statsField = userStats ? getUserStatsField(userStats) as StatsFieldProps[] : [];

  const handleExportSessions = () => {
    if (!reportList || reportList.length === 0) {
      toast.error("No sessions to export yet");
      return;
    }

    downloadActivityLogCsv(reportList);
    toast.success("Sessions exported to CSV");
  };

  const handleExportSongs = () => {
    const songCount = songs
      ? songs.wantToLearn.length + songs.learning.length + songs.learned.length
      : 0;
    if (!songs || songCount === 0) {
      toast.error("No songs to export yet");
      return;
    }

    downloadSongProgressCsv(songs);
    toast.success("Song progress exported to CSV");
  };

  const handleExportSummary = () => {
    if (!userStats) {
      toast.error("No profile stats to export yet");
      return;
    }

    downloadProfileSummaryCsv(userStats);
    toast.success("Profile summary exported to CSV");
  };

  return (
    <MainContainer noBorder>
      <HeroBanner
        title="Your Activity"
        subtitle="Track your practice history and progress over time"
        eyebrow="Practice stats"
        backgroundContent={<HeroPattern />}
        rightContent={
          <div className="w-full h-full flex items-center md:justify-end">
            <LevelProgressHero 
              lvl={userStats?.lvl ?? 1} 
              points={userStats?.points ?? 0}
            />
          </div>
        }

        className="w-full !rounded-none !shadow-none min-h-[140px] md:min-h-[120px] lg:min-h-[160px] !flex-col md:!flex-row"
      />


      <div className='p-4'>
        <div className='mb-6 flex flex-wrap items-center gap-2'>
          <PageTabs
            tabs={PROGRESS_TABS}
            activeHref='/profile/activity'
            ariaLabel='Progress sections'
          />
          <div className='ml-auto flex items-center gap-1'>
            <ExportButton label='Export sessions' onClick={handleExportSessions} />
            <ExportButton label='Export songs' onClick={handleExportSongs} />
            <ExportButton label='Export summary' onClick={handleExportSummary} />
          </div>
          <Link
            href='/scoring'
            className='rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
            How points work
          </Link>
        </div>
        <div className='font-openSans flex flex-col gap-6'>

          {/* 1. Overview stats with trends + radar + achievements */}
          {userStats && (
            <DashboardSection compact>
              <StatsSection
                statsField={statsField}
                statistics={userStats}
                datasWithReports={datasWithReports}
                userSongs={songs}
                onSongsChange={refreshSongs}
                userAuth={userAuth as string}
                achievements={userStats.achievements}
                year={year}
                setYear={setYear}
                isLoadingActivity={isLoading}
                mode="review"
              />
            </DashboardSection>
          )}

          {/* 2. Activity Chart + Records list side by side */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <ActivityChart data={reportList as any} />
            </div>
            <div className='lg:col-span-1'>
              {userStats && (
                <RecordsList statistics={userStats as StatisticsDataInterface} />
              )}
            </div>
          </div>

          {/* 3. Song Learning Stats */}
          <SongLearningSection userSongs={songs} />

          {/* 5. Activity Log calendar */}
          <ActivityLog key={refreshKey} userAuth={userAuth as string} />

          {/* 6. Achievement Sections */}
          <div className='space-y-8 mt-4'>
                <SeasonalAchievements userId={userAuth as string} />

              <div className='flex items-center gap-2 mb-1'>
               <h3 className='text-xl font-semibold text-white mr-2'>Achievements</h3>
                <span className='rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/70'>
                  {userStats?.achievements?.length || 0}
                </span>
              </div>
              <AchievementWrapper userAchievements={userStats?.achievements ?? []} />
          </div>
        </div>
      </div>
    </MainContainer>
  );
};

ProfileActivityPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"profile"}
      subtitle="Activity" /* unused */
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileActivityPage;
