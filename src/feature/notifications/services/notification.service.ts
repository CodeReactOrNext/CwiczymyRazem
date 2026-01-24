import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export type NotificationType = "like" | "comment" | "reaction";

export interface AppNotification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderFrame?: number;
  recordingId: string;
  recordingTitle: string;
  timestamp: any;
  isRead: boolean;
}

export const addNotification = async (notification: Omit<AppNotification, "id" | "timestamp" | "isRead">) => {
  // Basic avoid self-notification
  if (notification.userId === notification.senderId) return;

  await addDoc(collection(db, "notifications"), {
    ...notification,
    isRead: false,
    timestamp: serverTimestamp()
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, { isRead: true });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false)
  );
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
};
