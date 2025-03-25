import { CHAT_LIMIT_MESSAGE } from "feature/chat/chat.setting";
import type { ChatMessageType } from "feature/chat/types/chat.types";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const fetchChatMessages = (
  callback: (messages: ChatMessageType[]) => void
) => {
  const chatQuery = query(
    collection(db, "chats"),
    orderBy("timestamp", "desc"),
    limit(CHAT_LIMIT_MESSAGE)
  );

  return onSnapshot(chatQuery, (snapshot) => {
    const messages = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ChatMessageType)
    );
    callback(messages.reverse());
  });
};

export const sendChatMessage = async (
  message: string,
  userId: string,
  username: string,
  avatar: string | undefined
) => {
  if (!message.trim()) return undefined
  
  return addDoc(collection(db, "chats"), {
    userId,
    username,
    message,
    timestamp: serverTimestamp(),
    userPhotoURL: avatar,
  });
};
