import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import ProfileLayout from "feature/profile/ProfileLayout";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import type { ProfileInterface } from "types/ProfileInterface";
import { firebaseGetUserDocument } from "utils/firebase/client/firebase.utils";

const ProfileView = () => {
  const { t } = useTranslation("profile");
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
      posthog.capture("profile_viewed", {
        profile_id: profileId,
      });
    }
  }, [profileId]);

  return (
    <AppLayout pageId={null} subtitle={t("profile")} variant='secondary'>
      {userData ? (
        <ProfileLayout
          // One mount per profile: the layout state is seeded from the doc.
          key={profileId as string}
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
