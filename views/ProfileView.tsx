import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { firebaseGetUserDocument } from "utils/firebase/firebase.utils";
import { DocumentData } from "firebase/firestore";
import PageLoadingSpinner from "components/PageLoadingSpinner";
import { getUserStatsField } from "assets/stats/profileStats";

const ProfileView = () => {
  const [userData, setUserData] = useState<DocumentData | undefined>(undefined);
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

  return userData ? (
    <ProfileLayout
      statistics={getUserStatsField(userData?.statistics)}
      userStats={userData.statistics}
      userName={userData.displayName}
      userAvatar={userData.avatar}
    />
  ) : (
    <PageLoadingSpinner layoutVariant='secondary' />
  );
};

export default ProfileView;
