import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import PageLoadingLayout from "layouts/PageLoadingLayout";
import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";

import { DocumentData } from "firebase/firestore";
import { getUserStatsField } from "assets/stats/profileStats";
import { firebaseGetUserDocument } from "utils/firebase/client/firebase.utils";
import AuthLayoutWrapper from "Hoc/AuthLayoutWrapper";

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
    <AuthLayoutWrapper pageId={null} subtitle='Profile' variant='secondary'>
      {userData ? (
        <ProfileLayout
          statsField={getUserStatsField(userData?.statistics)}
          userStats={userData.statistics}
          userName={userData.displayName}
          userAvatar={userData.avatar}
          userAuth={profileId as string}
        />
      ) : (
        <PageLoadingLayout />
      )}
    </AuthLayoutWrapper>
  );
};

export default ProfileView;
