import { useTranslation } from "react-i18next";

import LandingLayout from "layouts/ProfileLayout";
import { LandingNavProps } from "layouts/ProfileLayout/components/LandingNav";

import { useAppSelector } from "store/hooks";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { getUserStatsField } from "assets/stats/profileStats";
import {
  selectCurrentUserStats,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";

const LandingView = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  const navigation: LandingNavProps = {
    leftSideLinks: [
      {
        name: t("nav.report"),
        href: "/report",
      },
      {
        name: t("nav.exercise"),
        href: "/timer",
      },
    ],
    rightSideLinks: [
      {
        name: t("nav.leadboard"),
        href: "/leaderboard",
      },
      {
        name: t("nav.faq"),
        href: "/faq",
      },
    ],
  };

  return (
    userStats &&
    userName && (
      <LandingLayout
        statsField={getUserStatsField(userStats)}
        navigation={navigation}
        userStats={userStats}
        userName={userName}
        userAvatar={userAvatar}
        featSlot={<LogsBoxView />}
      />
    )
  );
};

export default LandingView;
