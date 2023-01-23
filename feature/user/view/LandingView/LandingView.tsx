import { useTranslation } from "react-i18next";

import LandingLayout from "layouts/ProfileLayout";

import { useAppSelector } from "store/hooks";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { getUserStatsField } from "assets/stats/profileStats";
import {
  selectCurrentUserStats,
} from "feature/user/store/userSlice";
import HeroView from "views/HeroView";
import AuthLayoutWrapper from "Hoc/AuthLayoutWrapper";

const LandingView = () => {
  const { t } = useTranslation("profile");

  const userStats = useAppSelector(selectCurrentUserStats);

  return userStats ? (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("profile")}
      variant='secondary'>
      <LandingLayout
        statsField={getUserStatsField(userStats)}
        userStats={userStats}
        featSlot={<LogsBoxView />}
      />
    </AuthLayoutWrapper>
  ) : (
    <HeroView />
  );
};

export default LandingView;
