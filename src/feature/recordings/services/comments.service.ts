import type { Comment } from "feature/recordings/types/types";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc } from "utils/firebase/client/firestoreTracking";

export const addComment = async (recordingId: string, userId: string, content: string) => {
  const userDocRef = doc(db, "users", userId);
  const userSnapshot = await trackedGetDoc(userDocRef);
  const userData = userSnapshot.data();

  if (!userData) {
    throw new Error("User not found");
  }

  const recordingRef = doc(db, "recordings", recordingId);
  const commentsRef = collection(recordingRef, "comments");

  await runTransaction(db, async (transaction) => {
    const recordingDoc = await transaction.get(recordingRef);
    if (!recordingDoc.exists()) throw new Error("Recording not found");

    const recordingData = recordingDoc.data();
    const recipientId = recordingData.userId;
    const recipientRef = doc(db, "users", recipientId);

    const newCommentRef = doc(commentsRef);
    transaction.set(newCommentRef, {
      userId,
      userName: userData.displayName,
      userAvatarUrl: userData.photoURL || null,
      userAvatarFrame: userData.selectedFrame ?? userData.statistics?.level ?? userData.statistics?.lvl ?? 0,
      content,
      createdAt: serverTimestamp(),
    });

    transaction.update(recordingRef, {
      commentCount: increment(1)
    });

    // Fame and Notification logic
    if (recipientId !== userId) {
      // Increment fame
      transaction.update(recipientRef, {
        "statistics.fame": increment(1)
      });

      const notificationsRef = collection(db, "notifications");
      const newNotificationRef = doc(notificationsRef);
      transaction.set(newNotificationRef, {
        userId: recipientId,
        senderId: userId,
        senderName: userData.displayName || "Someone",
        senderAvatarUrl: userData.photoURL || null,
        senderFrame: userData.selectedFrame ?? userData.statistics?.level ?? userData.statistics?.lvl ?? 0,
        type: "comment",
        recordingId: recordingId,
        recordingTitle: recordingData.title,
        isRead: false,
        timestamp: serverTimestamp()
      });
    }
  });
};

export const getComments = async (recordingId: string) => {
  const commentsRef = collection(db, "recordings", recordingId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Comment[];
};

export const deleteComment = async (recordingId: string, commentId: string, userId: string) => {
  const recordingRef = doc(db, "recordings", recordingId);
  const commentRef = doc(db, "recordings", recordingId, "comments", commentId);

  await runTransaction(db, async (transaction) => {
    const recordingDoc = await transaction.get(recordingRef);
    const commentDoc = await transaction.get(commentRef);

    if (!recordingDoc.exists() || !commentDoc.exists()) {
      throw new Error("Recording or comment not found");
    }

    const commentData = commentDoc.data();
    if (commentData.userId !== userId) {
      throw new Error("Unauthorized to delete this comment");
    }

    const recordingData = recordingDoc.data();
    const recipientId = recordingData.userId;
    const recipientRef = doc(db, "users", recipientId);

    // Delete the comment
    transaction.delete(commentRef);

    // Update comment count
    transaction.update(recordingRef, {
      commentCount: increment(-1)
    });

    // Fame logic
    if (recipientId !== userId) {
      transaction.update(recipientRef, {
        "statistics.fame": increment(-1)
      });
    }
  });
};
