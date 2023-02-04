import { useTranslation } from "react-i18next";

import HeroView from "views/HeroView";
import LandingLayout from "layouts/ProfileLayout";

import { useAppSelector } from "store/hooks";
import AuthLayoutWrapper from "Hoc/AuthLayoutWrapper";
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
      <LandingLayout
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
