import { logger } from "feature/logger/Logger";
import { collection, doc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  trackedGetDoc,
  trackedSetDoc,
} from "utils/firebase/client/firestoreTracking";

export interface GoalCompletedLogParams {
  goalId: string;
  exerciseId: string;
  exerciseTitle: string;
  targetBpm: number;
}

export interface GoalCreatedLogParams extends GoalCompletedLogParams {
  startBpm: number;
}

/** Writes one goal row with the player's feed identity on it. */
const addGoalLog = async (
  uid: string,
  entry: Record<string, unknown>,
  context: string,
) => {
  try {
    const userSnapshot = await trackedGetDoc(doc(db, "users", uid));
    const userData = userSnapshot.data();
    if (!userData) return;

    await trackedSetDoc(doc(collection(db, "logs")), {
      ...entry,
      uid,
      userName: userData.displayName,
      userAvatarFrame: userData.statistics?.lvl ?? 0,
      guildBadge: userData.guildBadge ?? null,
      avatarUrl: userData.avatar || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(error, { context });
  }
};

/**
 * Puts a reached exercise goal in the activity log, mostly so other players
 * find out goals exist at all. No Discord post and no Fame — goals carry no
 * reward. Failures are logged and swallowed: the goal itself is already saved.
 */
export const firebaseAddGoalCompletedLog = (
  uid: string,
  { goalId, exerciseId, exerciseTitle, targetBpm }: GoalCompletedLogParams,
) =>
  addGoalLog(
    uid,
    {
      type: "exercise_goal_completed",
      data: `Reached ${targetBpm} BPM on "${exerciseTitle}"`,
      goalId,
      exerciseId,
      exerciseTitle,
      targetBpm,
    },
    "addGoalCompletedLog",
  );

/** A goal set — the feed shows where the player starts and what they're after. */
export const firebaseAddGoalCreatedLog = (
  uid: string,
  { goalId, exerciseId, exerciseTitle, targetBpm, startBpm }: GoalCreatedLogParams,
) =>
  addGoalLog(
    uid,
    {
      type: "exercise_goal_created",
      data: `Set a goal of ${targetBpm} BPM on "${exerciseTitle}"`,
      goalId,
      exerciseId,
      exerciseTitle,
      targetBpm,
      startBpm,
    },
    "addGoalCreatedLog",
  );
