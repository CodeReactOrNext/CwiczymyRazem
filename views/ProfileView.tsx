import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { firebaseGetUserDocument } from "utils/firebase/firebase.utils";
import { DocumentData } from "firebase/firestore";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { getUserStatsField } from "assets/stats/profileStats";
import MainLayout from "layouts/MainLayout";

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

  return (
    <MainLayout subtitle='Profile' variant='secondary'>
      {userData ? (
        <ProfileLayout
          statsField={getUserStatsField(userData?.statistics)}
          userStats={userData.statistics}
          userName={userData.displayName}
          userAvatar={userData.avatar}
        />
      ) : (
        <PageLoadingLayout />
      )}
    </MainLayout>
  );
};

export default ProfileView;
