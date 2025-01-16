import { useState, useEffect } from "react";
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

interface UnreadMessagesState {
  unreadCount: number;
  hasNewMessages: boolean;
  lastReadTime: Date;
}

export const useUnreadMessages = (collectionName: "chats" | "logs") => {
  const [state, setState] = useState<UnreadMessagesState>({
    unreadCount: 0,
    hasNewMessages: false,
    lastReadTime: new Date(Date.now() - 3600000), // 1 hour ago default
  });
  const currentUserId = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (!currentUserId) return;

    const lastReadKey = `${collectionName}_lastRead_${currentUserId}`;
    const lastRead = localStorage.getItem(lastReadKey);
    const lastReadTime = lastRead ? new Date(parseInt(lastRead)) : new Date(Date.now() - 3600000);

    setState(prev => ({ ...prev, lastReadTime }));

    const messagesRef = collection(db, collectionName);
    const limitedQuery = query(
      messagesRef,
      orderBy(collectionName === "logs" ? "data" : "timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(limitedQuery, (snapshot) => {
      let count = 0;

      if (collectionName === "logs") {
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

      setState(prev => ({
        ...prev,
        unreadCount: count,
        hasNewMessages: count > 0
      }));
    });

    return () => unsubscribe();
  }, [collectionName, currentUserId]);

  const markAsRead = () => {
    if (!currentUserId) return;
    const lastReadKey = `${collectionName}_lastRead_${currentUserId}`;
    const now = Date.now();
    localStorage.setItem(lastReadKey, now.toString());
    setState({
      unreadCount: 0,
      hasNewMessages: false,
      lastReadTime: new Date(now)
    });
  };

  const isNewMessage = (messageDate: string | Date) => {
    const date = new Date(messageDate);
    return date > state.lastReadTime;
  };

  return { 
    unreadCount: state.unreadCount, 
    hasNewMessages: state.hasNewMessages, 
    markAsRead,
    isNewMessage 
  };
};
