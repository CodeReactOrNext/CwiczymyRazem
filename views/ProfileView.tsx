import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import PageLoadingLayout from "layouts/PageLoadingLayout";
import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";

import { getUserStatsField } from "assets/stats/profileStats";
import { firebaseGetUserDocument } from "utils/firebase/client/firebase.utils";
import AuthLayoutWrapper from "Hoc/AuthLayoutWrapper";
import { ProfileInterface } from "types/profileInterface";

const ProfileView = () => {
  const [userData, setUserData] = useState<ProfileInterface | undefined>(
    undefined
  );
  const router = useRouter();
  const { profileId } = router.query;

  useEffect(() => {
    async function getUserDoc() {
      const userDoc = await firebaseGetUserDocument(profileId as string);
      setUserData(userDoc as ProfileInterface);
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
          userData={userData}
          userAuth={profileId as string}
        />
      ) : (
        <PageLoadingLayout />
      )}
    </AuthLayoutWrapper>
  );
};

export default ProfileView;
