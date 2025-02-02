import { getUserStatsField } from "assets/stats/profileStats";
import HeroView from "feature/hero/HeroView";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { ProfileLandingLayout } from "layouts/ProfileLayout";
import type { StatsFieldProps } from "layouts/ProfileLayout/components/StatsField";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const LandingView = () => {
  const { t } = useTranslation("profile");

  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);

  return userStats ? (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("profile")}
      variant='secondary'>
      <ProfileLandingLayout
        statsField={getUserStatsField(userStats) as StatsFieldProps[]}
        userStats={userStats}
        featSlot={<LogsBoxView />}
        userAuth={userAuth as string}
      />
    </AuthLayoutWrapper>
  ) : (
    <HeroView />
  );
};

export default LandingView;
