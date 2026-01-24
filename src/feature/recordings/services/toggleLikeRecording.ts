import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const toggleLikeRecording = async (recordingId: string, userId: string) => {
  const recordingRef = doc(db, "recordings", recordingId);

  await runTransaction(db, async (transaction) => {
    const recordingDoc = await transaction.get(recordingRef);
    if (!recordingDoc.exists()) {
      throw new Error("Recording does not exist");
    }

    const recordingData = recordingDoc.data();
    const likes = recordingData.likes || [];
    const hasLiked = likes.includes(userId);

    // Read sender info before any writes if we need to notify
    let senderData: any = null;
    if (!hasLiked && recordingData.userId !== userId) {
      const senderDocRef = doc(db, "users", userId);
      const senderSnapshot = await transaction.get(senderDocRef);
      senderData = senderSnapshot.data();
    }

    // Recipient document reference
    const recipientId = recordingData.userId;
    const recipientRef = doc(db, "users", recipientId);

    // Update the like status
    transaction.update(recordingRef, {
      likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    });

    // Fame and Notification logic
    if (recipientId !== userId) {
      // Increment/Decrement fame in the same transaction
      transaction.update(recipientRef, {
        "statistics.fame": increment(hasLiked ? -1 : 1)
      });

      if (!hasLiked && senderData) {
        const notificationsRef = collection(db, "notifications");
        const newNotificationRef = doc(notificationsRef);
        transaction.set(newNotificationRef, {
          userId: recipientId,
          senderId: userId,
          senderName: senderData.displayName || "Someone",
          senderAvatarUrl: senderData.photoURL || null,
          senderFrame: senderData.selectedFrame ?? senderData.statistics?.lvl ?? 0,
          type: "like",
          recordingId: recordingId,
          recordingTitle: recordingData.title,
          isRead: false,
          timestamp: serverTimestamp()
        });
      }
    }
  });
};
