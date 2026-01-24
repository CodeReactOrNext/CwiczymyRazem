import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { AppNotification } from "../services/notification.service";
import { markAllNotificationsAsRead, markNotificationAsRead } from "../services/notification.service";

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

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
      setIsLoading(false);
    }, (error) => {
      console.error("Notifications listener failed:", error);

      // Fallback: If index-related error, try to fetch without orderBy
      // and sort locally.
      if (error.code === 'failed-precondition') {
        console.warn("Missing composite index for notifications. Sorting locally...");
        const simpleQuery = query(
          collection(db, "notifications"),
          where("userId", "==", userId),
          limit(20)
        );

        onSnapshot(simpleQuery, (simpleSnapshot) => {
          const fetched = simpleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AppNotification[];

          // Sort locally by timestamp
          fetched.sort((a, b) => {
            const getMillis = (ts: any) => ts?.toMillis ? ts.toMillis() : Date.now();
            return getMillis(b.timestamp) - getMillis(a.timestamp);
          });

          setNotifications(fetched);
          setUnreadCount(fetched.filter(n => !n.isRead).length);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markNotificationAsRead,
    markAllAsRead: () => userId && markAllNotificationsAsRead(userId)
  };
};
