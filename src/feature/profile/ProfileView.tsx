import { useQuery } from "@tanstack/react-query";
import { getUserStatsField } from "assets/stats/profileStats";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import { ProfileSkeleton } from "feature/profile/components/ProfileSkeleton";
import type { StatsFieldProps } from "feature/profile/components/StatsField";
import { userProfileQuery } from "feature/profile/hooks/userProfileQuery";
import ProfileLayout from "feature/profile/ProfileLayout";
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

  return (
    // Keyed too, so opening another profile fades its content in afresh.
    <LoadingSwap key={profileId} isLoading={!userData} skeleton={<ProfileSkeleton />}>
      {() => (
        <ProfileLayout
          // One mount per profile: the layout state is seeded from the doc.
          key={profileId}
          statsField={getUserStatsField(userData!.statistics) as StatsFieldProps[]}
          userData={userData!}
          userAuth={profileId as string}
        />
      )}
    </LoadingSwap>
  );
};

export default ProfileView;
