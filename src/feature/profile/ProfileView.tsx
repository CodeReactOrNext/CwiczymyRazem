import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import ProfileLayout from "feature/profile/ProfileLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { ProfileInterface } from "types/ProfileInterface";
import { firebaseGetUserDocument } from "utils/firebase/client/firebase.utils";
import AppLayout from "layouts/AppLayout";

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
    <AppLayout pageId={null} subtitle='Profile' variant='secondary'>
      {userData ? (
        <ProfileLayout
          statsField={
            getUserStatsField(userData?.statistics) as StatsFieldProps[]
          }
          userData={userData}
          userAuth={profileId as string}
        />
      ) : (
        <PageLoadingLayout />
      )}
    </AppLayout>
  );
};

export default ProfileView;
