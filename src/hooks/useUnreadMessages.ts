import { useState, useEffect } from "react";
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  where,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

export const useUnreadMessages = (collectionName: "chats" | "logs") => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const currentUserId = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (!currentUserId) return;

    const lastReadKey = `${collectionName}_lastRead_${currentUserId}`;
    const lastRead = localStorage.getItem(lastReadKey);

    const lastReadTime = lastRead
      ? new Date(parseInt(lastRead))
      : new Date(Date.now() - 3600000); // 1 hour ago

    const messagesRef = collection(db, collectionName);

    const limitedQuery = query(
      messagesRef,
      orderBy(collectionName === "logs" ? "data" : "timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(limitedQuery, (snapshot) => {
      let count = 0;

      if (collectionName === "logs") {
        // Sort docs by date for logs
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const dateA = new Date(a.data().data);
          const dateB = new Date(b.data().data);
          return dateB.getTime() - dateA.getTime();
        });

        count = sortedDocs.filter((doc) => {
          const logDate = new Date(doc.data().data);
          return logDate > lastReadTime;
        }).length;
      } else {
        // Sort docs by timestamp for chats
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const timestampA = a.data().timestamp.toDate();
          const timestampB = b.data().timestamp.toDate();
          return timestampB.getTime() - timestampA.getTime();
        });

        count = sortedDocs.filter((doc) => {
          const timestamp = doc.data().timestamp;
          return timestamp.toDate() > lastReadTime;
        }).length;
      }

      setUnreadCount(count);
      setHasNewMessages(count > 0);
    });

    return () => unsubscribe();
  }, [collectionName, currentUserId]);

  const markAsRead = () => {
    if (!currentUserId) return;

    const lastReadKey = `${collectionName}_lastRead_${currentUserId}`;
    localStorage.setItem(lastReadKey, Date.now().toString());
    setUnreadCount(0);
    setHasNewMessages(false);
  };

  return { unreadCount, hasNewMessages, markAsRead };
};
