import axios from "axios";
import type {
  UserRoadmapDetail,
  UserRoadmapSummary,
} from "feature/supporterPanel/types/userRoadmaps.types";
import { auth } from "utils/firebase/client/firebase.utils";

const ENDPOINT = "/api/supporter/user-roadmaps";

const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
};

/** The listing: one row per player and roadmap, counts only. */
export const fetchUserRoadmaps = async (): Promise<UserRoadmapSummary[]> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<{ roadmaps: UserRoadmapSummary[] }>(
    ENDPOINT,
    { idToken },
  );
  return data.roadmaps ?? [];
};

/**
 * The steps of one roadmap, with what one player logged against them — the
 * owner, or `progressUid` (the viewer) on a roadmap they are following.
 */
export const fetchUserRoadmapDetail = async (
  id: string,
  userId: string,
  progressUid?: string | null,
): Promise<UserRoadmapDetail> => {
  const idToken = await getIdToken();
  const { data } = await axios.post<UserRoadmapDetail>(ENDPOINT, {
    idToken,
    id,
    userId,
    ...(progressUid ? { progressUid } : {}),
  });
  return data;
};
