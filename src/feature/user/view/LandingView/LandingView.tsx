import { getUserStatsField } from "assets/stats/profileStats";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import ProfileLandingLayout from "feature/profile/ProfileLandingLayout";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useAppSelector } from "store/hooks";

const LandingView = () => {

  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);

  if (!userStats ) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <PageLoadingLayout />
      </div>
    );
  }

  return (
    <ProfileLandingLayout
      statsField={getUserStatsField(userStats) as StatsFieldProps[]}
      userStats={userStats}
      featSlot={<LogsBoxView />}
      userAuth={userAuth as string}
    />
  );
};

export default LandingView;
