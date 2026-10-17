import { useQuery } from "@tanstack/react-query";
import { getRecordingLikers } from "feature/recordings/services/getRecordingLikers";

/** Names rarely change, and every hover on a counter would otherwise be a read. */
const LIKERS_STALE_TIME = 5 * 60 * 1000;

/**
 * Resolves the given ids to display names. Cached per set of ids rather than per
 * recording, so the same people liking several recordings are read once. Stays
 * idle until `enabled` — the tooltip turns it on when it opens.
 */
export const useRecordingLikers = (userIds: string[], enabled: boolean) =>
  useQuery({
    queryKey: ["recording-likers", ...userIds],
    queryFn: () => getRecordingLikers(userIds),
    enabled: enabled && userIds.length > 0,
    staleTime: LIKERS_STALE_TIME,
  });
