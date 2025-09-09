import ActivityLog from "components/ActivityLog/ActivityLog";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { ActivityChart } from "components/Charts/ActivityChart";
import { DetailedStats } from "feature/profile/components/DetailedStats/DetailedStats";
import { PracticeInsights } from "feature/profile/components/PracticeInsights/PracticeInsights";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song } from "feature/songs/types/songs.type";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { StatisticsDataInterface } from "types/api.types";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const ProfileActivityPage = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const { reportList } = useActivityLog(userAuth as string);
  const [songs, setSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>();

  useEffect(() => {
    if (userAuth) {
      getUserSongs(userAuth).then((songs) => setSongs(songs));
    }
  }, [userAuth]);

  return (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("activity", "Activity")}
      variant='secondary'>
      <>
        <div className='font-openSans flex flex-col gap-6'>
          {/* Practice Insights */}
          <PracticeInsights
            userAuth={userAuth as string}
            statistics={userStats as StatisticsDataInterface}
          />

          {/* Detailed Statistics */}
          {userStats && (
            <DetailedStats
              statistics={userStats as StatisticsDataInterface}
              userSongs={songs}
            />
          )}

          {/* Activity Chart */}
          <ActivityChart data={reportList as any} />
        </div>

        {/* Activity Log */}
        <div className='mt-8'>
          <ActivityLog userAuth={userAuth} />
        </div>
      </>
    </AuthLayoutWrapper>
  );
};

export default ProfileActivityPage;
