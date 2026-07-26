import { selectUserAuth } from "feature/user/store/userSlice";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

interface UnreadMessagesState {
  unreadCount: number;
  hasNewMessages: boolean;
  lastReadTime: Date;
}

export const useUnreadMessages = () => {
  const [state, setState] = useState<UnreadMessagesState>({
    unreadCount: 0,
    hasNewMessages: false,
    lastReadTime: new Date(Date.now() - 3600000),
  });
  const currentUserId = useAppSelector(selectUserAuth);
  const lastReadTimeRef = useRef<Date>(new Date(Date.now() - 3600000));

  useEffect(() => {
    if (!currentUserId) return;

    const lastReadKey = `logs_lastRead_${currentUserId}`;
    const lastRead = localStorage.getItem(lastReadKey);
    const initialTime = lastRead ? new Date(parseInt(lastRead)) : new Date(Date.now() - 3600000);

    lastReadTimeRef.current = initialTime;
    setState(prev => ({ ...prev, lastReadTime: initialTime }));

    const handleExternalMarkAsRead = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.collectionName === "logs" && detail.userId === currentUserId) {
        lastReadTimeRef.current = new Date(detail.time);
        setState({ unreadCount: 0, hasNewMessages: false, lastReadTime: new Date(detail.time) });
      }
    };
    window.addEventListener("unreadMessagesMarkAsRead", handleExternalMarkAsRead);

    const messagesRef = collection(db, "logs");
    const limitedQuery = query(messagesRef, orderBy("data", "desc"), limit(30));

    const unsubscribe = onSnapshot(limitedQuery, (snapshot) => {
      const currentLastReadTime = lastReadTimeRef.current;

      const sortedDocs = snapshot.docs.sort((a, b) => {
        const dateA = new Date(a.data().data);
        const dateB = new Date(b.data().data);
        return dateB.getTime() - dateA.getTime();
      });

      const count = sortedDocs.filter((doc) => {
        const logDate = new Date(doc.data().data);
        return logDate > currentLastReadTime;
      }).length;

      setState(prev => ({
        ...prev,
        unreadCount: count,
        hasNewMessages: count > 0
      }));
    }, (error) => {
      console.error("Unread messages listener (logs) failed:", error);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("unreadMessagesMarkAsRead", handleExternalMarkAsRead);
    };
  }, [currentUserId]);

  const markAsRead = () => {
    if (!currentUserId) return;
    const lastReadKey = `logs_lastRead_${currentUserId}`;
    const now = Date.now();
    localStorage.setItem(lastReadKey, now.toString());
    lastReadTimeRef.current = new Date(now);
    setState({
      unreadCount: 0,
      hasNewMessages: false,
      lastReadTime: new Date(now)
    });
    window.dispatchEvent(new CustomEvent("unreadMessagesMarkAsRead", {
      detail: { collectionName: "logs", userId: currentUserId, time: now }
    }));
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
