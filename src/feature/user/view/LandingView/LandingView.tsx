import { useTranslation } from "react-i18next";

import HeroView from "feature/hero/HeroView";
import { ProfileLandingLayout } from "layouts/ProfileLayout";

import { useAppSelector } from "store/hooks";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { getUserStatsField } from "assets/stats/profileStats";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";

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
        statsField={getUserStatsField(userStats)}
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
