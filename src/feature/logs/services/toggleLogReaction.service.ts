import { arrayRemove,arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * Adds or removes a user's reaction to a log entry.
 * @param logId The ID of the log document
 * @param userId The UID of the user reacting
 * @param isRemoving Whether to remove the reaction instead of adding it
 */
export const toggleLogReaction = async (logId: string, userId: string, isRemoving: boolean = false) => {
  if (!logId || !userId) return;

  const logRef = doc(db, "logs", logId);

  try {
    await updateDoc(logRef, {
      reactions: isRemoving ? arrayRemove(userId) : arrayUnion(userId)
    });
  } catch (error) {
    console.error("Error toggling reaction:", error);
  }
};
