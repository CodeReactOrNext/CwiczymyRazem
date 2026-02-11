import { getUserStatsField } from "assets/stats/profileStats";
import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import { DashboardSection } from "components/Layout";
import MainContainer from "components/MainContainer";
import { RecordsList, SongLearningSection } from "feature/profile/components/DetailedStats/DetailedStats";
import { StatsSection } from "feature/profile/components/StatsSection";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
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
    <MainContainer title={"Activity"}>
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
