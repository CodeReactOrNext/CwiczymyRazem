import type {
  ChallengeNomination,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import {
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
  POINTS_PER_SUBMISSION,
  VOTES_PER_USER,
} from "feature/challenges/types/challenge.types";

/** Submissions keyed by song, newest first — drives the per-song player stacks. */
export const groupSubmissionsBySong = (
  submissions: ChallengeSubmission[],
): Map<string, ChallengeSubmission[]> => {
  const bySong = new Map<string, ChallengeSubmission[]>();
  for (const submission of submissions) {
    const bucket = bySong.get(submission.songId);
    if (bucket) bucket.push(submission);
    else bySong.set(submission.songId, [submission]);
  }
  for (const bucket of bySong.values()) {
    bucket.sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
    );
  }
  return bySong;
};

export const getClearedSongIds = (
  submissions: ChallengeSubmission[],
  userId: string | null | undefined,
): Set<string> =>
  new Set(
    userId
      ? submissions.filter((s) => s.userId === userId).map((s) => s.songId)
      : [],
  );

/** Distinct players who put at least one recording on the board. */
export const countParticipants = (submissions: ChallengeSubmission[]): number =>
  new Set(submissions.map((s) => s.userId)).size;

export interface SubmissionReward {
  points: number;
  fame: number;
  /** True when this submission is the one that completes the whole board. */
  isClear: boolean;
  /** False for a late run on a closed board — it lands, but pays nothing. */
  isPaid: boolean;
}

/**
 * Reward for a single recording. The clear bonus lands exactly once — on the
 * submission that takes the player from `total - 1` to `total` songs done.
 *
 * Closed boards stay open to late runs so players can catch up on the archive,
 * but they pay nothing: back-filling a year of boards must never be a shortcut
 * to the leaderboard. The run still counts as clearing the board, it just
 * doesn't move points or fame.
 */
export const calculateSubmissionReward = (
  clearedBefore: number,
  totalSongs: number,
  isLive = true,
): SubmissionReward => {
  const isClear = totalSongs > 0 && clearedBefore + 1 >= totalSongs;
  if (!isLive) return { points: 0, fame: 0, isClear, isPaid: false };
  return {
    points: POINTS_PER_SUBMISSION,
    fame: FAME_PER_SUBMISSION + (isClear ? FAME_CLEAR_BONUS : 0),
    isClear,
    isPaid: true,
  };
};

/** Votes the player has left this cycle — nominating spends one too. */
export const remainingVotes = (
  nominations: ChallengeNomination[],
  userId: string | null | undefined,
): number => {
  if (!userId) return 0;
  const used = nominations.filter((n) =>
    (n.voters ?? []).includes(userId),
  ).length;
  return Math.max(0, VOTES_PER_USER - used);
};

/** Most-backed first; an earlier nomination wins a tie, so squatting doesn't pay. */
export const rankNominations = (
  nominations: ChallengeNomination[],
): ChallengeNomination[] =>
  [...nominations].sort(
    (a, b) =>
      (b.voteCount ?? 0) - (a.voteCount ?? 0) ||
      (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0),
  );
