import { getUserStatsField } from "assets/stats/profileStats";
import { HeroView } from "feature/hero/HeroView";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import ProfileLandingLayout from "feature/profile/ProfileLandingLayout";

import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

const LandingView = () => {
  const { t } = useTranslation("profile");

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
