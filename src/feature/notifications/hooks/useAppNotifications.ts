import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

import type { AppNotification } from "../services/notification.service";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service";

// Sender avatars, so the same user isn't refetched on every snapshot. Module
// level: the bell and the desktop toasts each run this hook, and per instance
// both read the same sender documents.
const avatarCache: Record<string, string | null> = {};

export const useAppNotifications = (userId: string | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    // Backfill senderAvatarUrl for notifications that were stored without it
    // (legacy data) by pulling the sender's current avatar from their user doc.
    const enrichWithAvatars = async (
      list: AppNotification[],
    ): Promise<AppNotification[]> => {
      const missing = Array.from(
        new Set(
          list
            .filter(
              (n) =>
                !n.senderAvatarUrl &&
                n.senderId &&
                !(n.senderId in avatarCache),
            )
            .map((n) => n.senderId as string),
        ),
      );

      await Promise.all(
        missing.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            avatarCache[uid] = snap.exists()
              ? (snap.data().avatar ?? null)
              : null;
          } catch {
            avatarCache[uid] = null;
          }
        }),
      );

      return list.map((n) =>
        !n.senderAvatarUrl && n.senderId && avatarCache[n.senderId]
          ? { ...n, senderAvatarUrl: avatarCache[n.senderId] }
          : n,
      );
    };

    const applySnapshot = (list: AppNotification[]) => {
      setUnreadCount(list.filter((n) => !n.isRead).length);
      setIsLoading(false);
      enrichWithAvatars(list).then(setNotifications);
    };

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(20),
    );

    // Kept so the effect cleanup can close it: it used to stay subscribed after
    // logout and after every userId change.
    let unsubscribeFallback: (() => void) | null = null;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AppNotification[];

        applySnapshot(fetchedNotifications);
      },
      (error) => {
        console.error("Notifications listener failed:", error);

        // Fallback: If index-related error, try to fetch without orderBy
        // and sort locally.
        if (error.code === "failed-precondition") {
          console.warn(
            "Missing composite index for notifications. Sorting locally...",
          );
          const simpleQuery = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            limit(20),
          );

          unsubscribeFallback = onSnapshot(simpleQuery, (simpleSnapshot) => {
            const fetched = simpleSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as AppNotification[];

            // Sort locally by timestamp
            fetched.sort((a, b) => {
              const getMillis = (ts: any) =>
                ts?.toMillis ? ts.toMillis() : Date.now();
              return getMillis(b.timestamp) - getMillis(a.timestamp);
            });

            applySnapshot(fetched);
          });
        } else {
          setIsLoading(false);
        }
      },
    );

    return () => {
      unsubscribe();
      unsubscribeFallback?.();
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markNotificationAsRead,
    markAllAsRead: () => userId && markAllNotificationsAsRead(userId),
  };
};
