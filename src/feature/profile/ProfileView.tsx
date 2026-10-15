import { useQuery } from "@tanstack/react-query";
import { getUserStatsField } from "assets/stats/profileStats";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { userProfileQuery } from "feature/profile/hooks/userProfileQuery";
import ProfileLayout from "feature/profile/ProfileLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";

const ProfileView = () => {
  const router = useRouter();
  const profileId = typeof router.query.profileId === "string" ? router.query.profileId : undefined;

  // Cached, so going back to a profile you just saw is instant instead of a
  // fresh document read behind a spinner.
  const { data: userData } = useQuery({
    ...userProfileQuery(profileId ?? ""),
    enabled: !!profileId,
  });

  useEffect(() => {
    if (profileId) {
      posthog.capture("profile_viewed", {
        profile_id: profileId,
      });
    }
  }, [profileId]);

  return userData ? (
    <ProfileLayout
      // One mount per profile: the layout state is seeded from the doc.
      key={profileId}
      statsField={getUserStatsField(userData?.statistics) as StatsFieldProps[]}
      userData={userData}
      userAuth={profileId as string}
    />
  ) : (
    <PageLoadingLayout />
  );
};

export default ProfileView;
