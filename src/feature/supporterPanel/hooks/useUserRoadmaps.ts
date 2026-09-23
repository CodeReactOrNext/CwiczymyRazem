import { useQuery } from "@tanstack/react-query";
import {
  fetchUserRoadmapDetail,
  fetchUserRoadmaps,
} from "feature/supporterPanel/services/userRoadmaps.service";

export const USER_ROADMAPS_KEY = ["user-roadmaps"] as const;

const STALE_TIME = 60 * 1000;

/** The owner's run keeps its old key, so the refine cache writes still land on it. */
export const userRoadmapDetailKey = (
  userId: string | null,
  id: string | null,
  progressUid: string | null = null,
) =>
  progressUid && progressUid !== userId
    ? ([...USER_ROADMAPS_KEY, "detail", userId, id, progressUid] as const)
    : ([...USER_ROADMAPS_KEY, "detail", userId, id] as const);

/** The listing — every supporter sees every player's roadmap. */
export const useUserRoadmaps = (enabled: boolean) =>
  useQuery({
    queryKey: USER_ROADMAPS_KEY,
    queryFn: fetchUserRoadmaps,
    enabled,
    staleTime: STALE_TIME,
  });

/**
 * One roadmap's steps, fetched when a row is opened and kept afterwards — the
 * bodies are long, so they never ride along with the listing.
 */
export const useUserRoadmapDetail = (
  id: string | null,
  userId: string | null,
  /** Whose run to load — the viewer's, on a roadmap they follow. Owner otherwise. */
  progressUid: string | null = null,
) =>
  useQuery({
    queryKey: userRoadmapDetailKey(userId, id, progressUid),
    queryFn: () =>
      fetchUserRoadmapDetail(id as string, userId as string, progressUid),
    enabled: !!id && !!userId,
    staleTime: Infinity,
  });
