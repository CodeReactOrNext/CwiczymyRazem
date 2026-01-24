import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const toggleLogReaction = async (logId: string, userId: string, isRemoving: boolean = false) => {
  if (!logId || !userId) return;

  const logRef = doc(db, "logs", logId);

  try {
    await runTransaction(db, async (transaction) => {
      const logSnapshot = await transaction.get(logRef);
      if (!logSnapshot.exists()) return;

      const logData = logSnapshot.data();
      const recipientId = logData.uid;
      const recipientRef = doc(db, "users", recipientId);

      const reactorDocRef = doc(db, "users", userId);
      const reactorSnapshot = await transaction.get(reactorDocRef);
      const reactorData = reactorSnapshot.data();

      // Update the log reactions
      transaction.update(logRef, {
        reactions: isRemoving ? arrayRemove(userId) : arrayUnion(userId)
      });

      // Fame and Notification logic
      if (recipientId && recipientId !== userId) {
        // Update Fame
        transaction.update(recipientRef, {
          "statistics.fame": increment(isRemoving ? -1 : 1)
        });

        // Add Notification
        if (!isRemoving && reactorData) {
          const notificationsRef = collection(db, "notifications");
          const newNotificationRef = doc(notificationsRef);

          transaction.set(newNotificationRef, {
            userId: recipientId,
            senderId: userId,
            senderName: reactorData.displayName || "Someone",
            senderAvatarUrl: reactorData.photoURL || null,
            senderFrame: reactorData.selectedFrame ?? reactorData.statistics?.lvl ?? 0,
            type: "reaction",
            recordingId: logId,
            recordingTitle: "",
            isRead: false,
            timestamp: serverTimestamp()
          });
        }
      }
    });
  } catch (error) {
    console.error("Error toggling reaction with notification/fame:", error);
  }
};
