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

/**
 * Puts a reached exercise goal in the activity log, mostly so other players
 * find out goals exist at all. No Discord post and no Fame — goals carry no
 * reward. Failures are logged and swallowed: the goal itself is already saved.
 */
export const firebaseAddGoalCompletedLog = async (
  uid: string,
  { goalId, exerciseId, exerciseTitle, targetBpm }: GoalCompletedLogParams,
) => {
  try {
    const userSnapshot = await trackedGetDoc(doc(db, "users", uid));
    const userData = userSnapshot.data();
    if (!userData) return;

    await trackedSetDoc(doc(collection(db, "logs")), {
      type: "exercise_goal_completed",
      data: `Reached ${targetBpm} BPM on "${exerciseTitle}"`,
      uid,
      userName: userData.displayName,
      userAvatarFrame: userData.statistics?.lvl ?? 0,
      guildBadge: userData.guildBadge ?? null,
      avatarUrl: userData.avatar || null,
      timestamp: new Date().toISOString(),
      goalId,
      exerciseId,
      exerciseTitle,
      targetBpm,
    });
  } catch (error) {
    logger.error(error, { context: "addGoalCompletedLog" });
  }
};
