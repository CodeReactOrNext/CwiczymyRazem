import { queryOptions } from "@tanstack/react-query";
import type { ProfileInterface } from "types/ProfileInterface";
import { firebaseGetUserDocument } from "utils/firebase/client/firebase.utils";

/**
 * A member profile (`/user/[profileId]`). One definition for the page and for the
 * links that warm it up on hover, so both hit the same cache entry.
 */
export const userProfileQuery = (profileId: string) =>
  queryOptions({
    queryKey: ["user-profile", profileId],
    queryFn: async () => (await firebaseGetUserDocument(profileId)) as ProfileInterface,
  });
