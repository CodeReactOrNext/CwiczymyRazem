import { selectUserAuth } from "feature/user/store/userSlice";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

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
          // timestamp can be null during local write with serverTimestamp()
          const dataA = a.data();
          const dataB = b.data();

          const timeA = dataA.timestamp?.toDate ? dataA.timestamp.toDate().getTime() : Date.now();
          const timeB = dataB.timestamp?.toDate ? dataB.timestamp.toDate().getTime() : Date.now();

          return timeB - timeA;
        });

        count = sortedDocs.filter((doc) => {
          const data = doc.data();
          // Safety check: if timestamp is missing/null (pending write), treat as new (now)
          if (!data.timestamp || !data.timestamp.toDate) return true;

          return data.timestamp.toDate() > lastReadTime;
        }).length;
      }

      setState(prev => ({
        ...prev,
        unreadCount: count,
        hasNewMessages: count > 0
      }));
    }, (error) => {
      console.error(`Unread messages listener (${collectionName}) failed:`, error);
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
