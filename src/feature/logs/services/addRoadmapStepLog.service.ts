import { logger } from "feature/logger/Logger";
import { collection, doc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  trackedGetDoc,
  trackedSetDoc,
} from "utils/firebase/client/firestoreTracking";

export interface RoadmapStepLogParams {
  roadmapId: string;
  roadmapTitle: string;
  phaseTitle: string;
  stepId: string;
  stepTitle: string;
}

/**
 * Puts a finished roadmap step in the activity log. No Discord post, unlike a
 * passed exam: a roadmap has thirty-odd steps, and the channel would be
 * nothing else. Failures are logged and swallowed — the progress itself is
 * already saved, and a missing feed row is not worth an error on screen.
 */
export const firebaseAddRoadmapStepLog = async (
  uid: string,
  {
    roadmapId,
    roadmapTitle,
    phaseTitle,
    stepId,
    stepTitle,
  }: RoadmapStepLogParams,
) => {
  try {
    const userSnapshot = await trackedGetDoc(doc(db, "users", uid));
    const userData = userSnapshot.data();
    if (!userData) return;

    await trackedSetDoc(doc(collection(db, "logs")), {
      type: "roadmap_step_completed",
      data: `Completed "${stepTitle}" on the ${roadmapTitle} roadmap`,
      uid,
      userName: userData.displayName,
      userAvatarFrame: userData.statistics?.lvl ?? 0,
      guildBadge: userData.guildBadge ?? null,
      avatarUrl: userData.avatar || null,
      timestamp: new Date().toISOString(),
      roadmapId,
      roadmapTitle,
      phaseTitle,
      stepId,
      stepTitle,
    });
  } catch (error) {
    logger.error(error, { context: "addRoadmapStepLog" });
  }
};
