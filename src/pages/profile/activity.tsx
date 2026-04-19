import { getUserStatsField } from "assets/stats/profileStats";
import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import { DashboardSection } from "components/Layout";
import MainContainer from "components/MainContainer";
import { HeroBanner } from "components/UI/HeroBanner";
import { RecordsList, SongLearningSection } from "feature/profile/components/DetailedStats/DetailedStats";
import { StatsSection } from "feature/profile/components/StatsSection";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { AchievementWrapper } from "feature/profile/components/Achievement/AchievementWrapper";
import SeasonalAchievements from "feature/profile/components/SeasonalAchievements/SeasonalAchievements";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import type { StatisticsDataInterface } from "types/api.types";

import { useQuery } from "@tanstack/react-query";

const ProfileActivityPage = () => {
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const { reportList, datasWithReports, year, setYear, isLoading } = useActivityLog(userAuth as string);

  const { data: songs, refetch: refreshSongs } = useQuery({
    queryKey: ['userSongs', userAuth],
    queryFn: () => getUserSongs(userAuth as string),
    enabled: !!userAuth,
  });

  const statsField = userStats ? getUserStatsField(userStats) as StatsFieldProps[] : [];

  return (
    <MainContainer noBorder>
      <HeroBanner
        title="Your Activity"
        subtitle="Track your practice history and progress over time"
        eyebrow="Practice stats"
        characterImage="/images/3d/activity.png"
        className="w-full !rounded-none !shadow-none min-h-[200px] md:min-h-[180px] lg:min-h-[220px]"
      />
      <div className='p-4'>
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

          {/* 4. Activity Log calendar */}
          <ActivityLog userAuth={userAuth as string} />

          {/* 5. Achievement Sections */}
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
