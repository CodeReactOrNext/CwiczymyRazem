import { convertMsToHM } from "helpers/timeConverter";
import { StatisticProps } from "layouts/ProfileLayout/components/Statistic";
import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";
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
import { achievements as achievementsData } from "data/achievements";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { decodeUid } from "helpers/decodeUid";
import { useEffect, useState } from "react";
import { firebaseGetUserDocument } from "utils/firebase/firebase.utils";
import { DocumentData } from "firebase/firestore";
import PageLoadingSpinner from "components/PageLoadingSpinner";

const ProfileView = () => {
  const [userData, setUserData] = useState<DocumentData | undefined>(undefined);
  const { t } = useTranslation("profile");
  const router = useRouter();
  const { profileId } = router.query;

  useEffect(() => {
    async function getUserDoc() {
      const userDoc = await firebaseGetUserDocument(profileId as string);
      setUserData(userDoc);
    }
    if (profileId) {
      getUserDoc();
    }
  }, [profileId]);

  const userStats: StatisticsDataInterface = {
    time: {
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
      longestSession: 0,
    },
    lvl: 1,
    points: 25,
    pointsToNextLvl: 35,
    sessionCount: 0,
    habitsCount: 0,
    dayWithoutBreak: 0,
    maxPoints: 0,
    achievements: ["time_1", "time_2", "time_3"],
    actualDayWithoutBreak: 0,
    lastReportDate: "",
  };

  const userName = "placeholder";
  const userAvatar = undefined;
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

  return userData ? (
    <ProfileLayout
      statistics={statistics}
      userStats={userData?.statistics}
      userName={userData?.displayName}
      userAvatar={userData?.avatar}
    />
  ) : (
    <PageLoadingSpinner layoutVariant='secondary' />
  );
};

export default ProfileView;
