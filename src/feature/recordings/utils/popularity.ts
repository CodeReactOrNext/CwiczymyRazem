import type { Recording } from "feature/recordings/types/types";

/**
 * A comment costs more than a tap on the heart — somebody sat down and wrote
 * something — so it weighs twice a like.
 */
export const COMMENT_WEIGHT = 2;

export const recordingPopularity = (
  recording: Pick<Recording, "likes" | "commentCount">,
) =>
  (recording.likes?.length ?? 0) +
  COMMENT_WEIGHT * Math.max(0, recording.commentCount ?? 0);

const createdAtMillis = (recording: Pick<Recording, "createdAt">) =>
  recording.createdAt?.toMillis ? recording.createdAt.toMillis() : 0;

/** Most popular first; equal scores go newest first, so fresh uploads are not buried under old zeros. */
export const sortByPopularity = <
  T extends Pick<Recording, "likes" | "commentCount" | "createdAt">,
>(
  recordings: T[],
) =>
  [...recordings].sort(
    (a, b) =>
      recordingPopularity(b) - recordingPopularity(a) ||
      createdAtMillis(b) - createdAtMillis(a),
  );
