import {
  CHALLENGES_COLLECTION,
  invalidateChallengeCaches,
  SUBMISSIONS_COLLECTION,
} from "feature/challenges/services/challenges.service";
import type { Challenge } from "feature/challenges/types/challenge.types";
import { submissionDocId } from "feature/challenges/types/challenge.types";
import { isChallengeLive } from "feature/challenges/utils/challengeMonth";
import type { SubmissionReward } from "feature/challenges/utils/challengeProgress";
import { calculateSubmissionReward } from "feature/challenges/utils/challengeProgress";
import { logger } from "feature/logger/Logger";
import { addRecording } from "feature/recordings/services/addRecording";
import { deleteRecording } from "feature/recordings/services/deleteRecording";
import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import { doc, increment, runTransaction, Timestamp } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc } from "utils/firebase/client/firestoreTracking";

/** Raised when the player already has a recording on this song's slot. */
export class AlreadySubmittedError extends Error {
  constructor() {
    super("You already submitted a recording for this song");
    this.name = "AlreadySubmittedError";
  }
}

export interface SubmitChallengeParams {
  challenge: Challenge;
  songId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  videoUrl: string;
  title: string;
  description: string;
}

/**
 * Puts a recording on a challenge slot.
 *
 * The recording itself goes into the shared `recordings` collection so it shows
 * up in the Recordings tab, the activity feed and the usual view modal — the
 * challenge submission is a thin pointer at it.
 *
 * Rewards are settled in one transaction that reads every slot of the board:
 * the deterministic doc id makes a slot un-double-claimable, and reading all
 * of them tells us whether this recording is the one that clears the month.
 *
 * Closed boards still accept runs so the archive stays playable, but they pay
 * nothing — see `calculateSubmissionReward`.
 */
export const submitChallengeRecording = async (
  params: SubmitChallengeParams,
): Promise<SubmissionReward> => {
  const {
    challenge,
    songId,
    userId,
    userName,
    userAvatarUrl,
    videoUrl,
    title,
    description,
  } = params;

  const song = challenge.songs.find((s) => s.songId === songId);
  if (!song) throw new Error("This song is not on the board");

  const targetRef = doc(
    db,
    SUBMISSIONS_COLLECTION,
    submissionDocId(challenge.id, userId, songId),
  );

  // Cheap pre-check so the common "already done" case never creates a recording
  // it would have to clean up. The transaction below is the real guard.
  const existing = await trackedGetDoc(targetRef);
  if (existing.exists()) throw new AlreadySubmittedError();

  const recordingId = await addRecording(userId, {
    videoUrl,
    title,
    description,
    songId: song.songId,
    songTitle: song.title,
    songArtist: song.artist,
  });

  let reward: SubmissionReward;

  try {
    reward = await runTransaction(db, async (transaction) => {
      const slotRefs = challenge.songs.map((s) =>
        doc(
          db,
          SUBMISSIONS_COLLECTION,
          submissionDocId(challenge.id, userId, s.songId),
        ),
      );

      // All reads first — Firestore transactions forbid a read after a write.
      const slotSnaps = [];
      for (const ref of slotRefs) slotSnaps.push(await transaction.get(ref));

      const targetIndex = challenge.songs.findIndex((s) => s.songId === songId);
      if (slotSnaps[targetIndex].exists()) throw new AlreadySubmittedError();

      const clearedBefore = slotSnaps.filter(
        (snap, index) => index !== targetIndex && snap.exists(),
      ).length;
      // Derived here from the board's own id, never from a caller-supplied
      // flag — otherwise a late run could ask to be paid like a live one.
      const earned = calculateSubmissionReward(
        clearedBefore,
        challenge.songs.length,
        isChallengeLive(challenge.id),
      );

      transaction.set(targetRef, {
        challengeId: challenge.id,
        songId,
        userId,
        userName,
        userAvatarUrl: userAvatarUrl ?? null,
        recordingId,
        videoUrl,
        title,
        createdAt: Timestamp.now(),
      });

      // A late run touches no stats at all — skip the write rather than
      // increment by zero, so an archive catch-up leaves no trace on the user.
      if (earned.isPaid) {
        transaction.update(doc(db, "users", userId), {
          "statistics.points": increment(earned.points),
          "statistics.fame": increment(earned.fame),
        });
      }

      transaction.update(doc(db, CHALLENGES_COLLECTION, challenge.id), {
        submissionCount: increment(1),
        ...(earned.isClear ? { finisherCount: increment(1) } : {}),
      });

      return earned;
    });
  } catch (error) {
    // The recording is already live but earns nothing — roll it back so the
    // player doesn't end up with a stray entry in their Recordings tab.
    await deleteRecording(recordingId, userId).catch((cleanupError) =>
      logger.error(cleanupError, {
        context: "submitChallengeRecording:cleanup",
      }),
    );
    throw error;
  }

  // Season standings mirror lifetime points — best-effort, the reward is banked.
  if (reward.isPaid) {
    await updateSeasonalPoints(userId, reward.points).catch((error) =>
      logger.error(error, { context: "submitChallengeRecording:season" }),
    );
  }

  invalidateChallengeCaches();
  return reward;
};
