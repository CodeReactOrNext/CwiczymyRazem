import {
  selectCurrentUserStats,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { convertMsToHM } from "helpers/timeConverter";
import LandingLayout from "layouts/ProfileLayout";
import { LandingNavProps } from "layouts/ProfileLayout/components/LandingNav";
import { StatisticProps } from "layouts/ProfileLayout/components/Statistic";
import { achievements as achievementsData } from "data/achievements";
import {
  FaCalendarDay,
  FaClock,
  FaDumbbell,
  FaGuitar,
  FaHeart,
  FaMedal,
  FaStar,
  FaStarHalf,
} from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "react-i18next";

const LandingView = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const {
    points,
    sessionCount,
    habitsCount,
    achievements,
    time,
    dayWithoutBreak,
    maxPoints,
  } = userStats!;

  const statistics: StatisticProps[] = [
    {
      Icon: FaClock,
      description: t("stats.spent_time"),
      value: convertMsToHM(
        time.technique + time.theory + time.creativity + time.hearing
      ),
    },
    {
      Icon: FaGuitar,
      description: t("stats.num_sessions"),
      value: sessionCount,
    },
    {
      Icon: FaStar,
      description: t("stats.num_points"),
      value: points,
    },
    {
      Icon: FaHeart,
      description: t("stats.num_habbits"),
      value: habitsCount,
    },
    {
      Icon: FaMedal,
      description: t("stats.num_achievements"),
      value: achievements.length + "/" + achievementsData.length,
    },
    {
      Icon: FaDumbbell,
      description: t("stats.longest_session"),
      value: convertMsToHM(time.longestSession),
    },
    {
      Icon: FaCalendarDay,
      description: t("stats.consecutive days"),
      value: dayWithoutBreak,
    },
    {
      Icon: FaStarHalf,
      description: t("stats.max_points"),
      value: maxPoints,
    },
  ];

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
    <LandingLayout
      statistics={statistics}
      navigation={navigation}
      userStats={userStats!}
      userName={userName!}
      userAvatar={userAvatar}
    />
  );
};

export default LandingView;
