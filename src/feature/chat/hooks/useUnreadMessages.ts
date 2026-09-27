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

/** A guild keeps its room under its own document — see `guildChatPath`. */
type GuildChatPath = `guilds/${string}/chat`;

/**
 * The room to count. `null` switches the listener off, for a room the player has no access to —
 * a guild chat before they have joined one.
 */
export type UnreadSource = "chats" | "logs" | GuildChatPath;

export const useUnreadMessages = (collectionName: UnreadSource | null) => {
  const [state, setState] = useState<UnreadMessagesState>({
    unreadCount: 0,
    hasNewMessages: false,
    lastReadTime: new Date(Date.now() - 3600000),
  });
  const currentUserId = useAppSelector(selectUserAuth);
  const lastReadTimeRef = useRef<Date>(new Date(Date.now() - 3600000));

  useEffect(() => {
    if (!currentUserId || !collectionName) return;

    const lastReadKey = `${collectionName}_lastRead_${currentUserId}`;
    const lastRead = localStorage.getItem(lastReadKey);
    const initialTime = lastRead ? new Date(parseInt(lastRead)) : new Date(Date.now() - 3600000);

    lastReadTimeRef.current = initialTime;
    setState(prev => ({ ...prev, lastReadTime: initialTime }));

    const handleExternalMarkAsRead = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.collectionName === collectionName && detail.userId === currentUserId) {
        lastReadTimeRef.current = new Date(detail.time);
        setState({ unreadCount: 0, hasNewMessages: false, lastReadTime: new Date(detail.time) });
      }
    };
    window.addEventListener("unreadMessagesMarkAsRead", handleExternalMarkAsRead);

    const messagesRef = collection(db, collectionName);
    const limitedQuery = query(
      messagesRef,
      orderBy(collectionName === "logs" ? "data" : "timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(limitedQuery, (snapshot) => {
      const currentLastReadTime = lastReadTimeRef.current;
      let count = 0;

      if (collectionName === "logs") {
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const dateA = new Date(a.data().data);
          const dateB = new Date(b.data().data);
          return dateB.getTime() - dateA.getTime();
        });

        count = sortedDocs.filter((doc) => {
          const logDate = new Date(doc.data().data);
          return logDate > currentLastReadTime;
        }).length;
      } else {
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const dataA = a.data();
          const dataB = b.data();

          const timeA = dataA.timestamp?.toDate ? dataA.timestamp.toDate().getTime() : Date.now();
          const timeB = dataB.timestamp?.toDate ? dataB.timestamp.toDate().getTime() : Date.now();

          return timeB - timeA;
        });

        count = sortedDocs.filter((doc) => {
          const data = doc.data();
          // Fix: skip pending writes (null timestamp) instead of treating them as new
          if (!data.timestamp || !data.timestamp.toDate) return false;
          // Your own message is never news to you — without this, writing and then closing the
          // chat before switching tabs flagged your own line as unread.
          if (data.userId === currentUserId) return false;

          return data.timestamp.toDate() > currentLastReadTime;
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

    return () => {
      unsubscribe();
      window.removeEventListener("unreadMessagesMarkAsRead", handleExternalMarkAsRead);
    };
  }, [collectionName, currentUserId]);

  const markAsRead = () => {
    if (!currentUserId || !collectionName) return;
    const lastReadKey = `${collectionName}_lastRead_${currentUserId}`;
    const now = Date.now();
    localStorage.setItem(lastReadKey, now.toString());
    lastReadTimeRef.current = new Date(now);
    setState({
      unreadCount: 0,
      hasNewMessages: false,
      lastReadTime: new Date(now)
    });
    window.dispatchEvent(new CustomEvent("unreadMessagesMarkAsRead", {
      detail: { collectionName, userId: currentUserId, time: now }
    }));
  };

  const isNewMessage = (messageDate: string | Date) => {
    const date = new Date(messageDate);
    return date > state.lastReadTime;
  };

  return {
    unreadCount: collectionName ? state.unreadCount : 0,
    hasNewMessages: Boolean(collectionName) && state.hasNewMessages,
    markAsRead,
    isNewMessage
  };
};
