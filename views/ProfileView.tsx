import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";
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

  return userData ? (
    <ProfileLayout
      statsField={getUserStatsField(userData?.statistics)}
      userStats={userData.statistics}
      userName={userData.displayName}
      userAvatar={userData.avatar}
    />
  ) : (
    <PageLoadingSpinner layoutVariant='secondary' />
  );
};

export default ProfileView;
