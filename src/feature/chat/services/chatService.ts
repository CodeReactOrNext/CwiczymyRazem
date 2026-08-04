import { CHAT_LIMIT_MESSAGE } from "feature/chat/chat.setting";
import type { ChatMessageType } from "feature/chat/types/chat.types";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
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
      (docSnapshot) =>
        ({ id: docSnapshot.id, ...docSnapshot.data() } as ChatMessageType)
    );
    callback(messages.reverse());
  }, (error) => {
    console.error("Chat messages listener failed:", error);
    callback([]);
  });
};

export const sendChatMessage = async (
  message: string,
  userId: string,
  username: string,
  avatar: string | undefined,
  lvl: number
) => {
  if (!message.trim()) return undefined

  return addDoc(collection(db, "chats"), {
    userId,
    username,
    message,
    timestamp: serverTimestamp(),
    userPhotoURL: avatar,
    lvl,
    likes: [],
  });
};

export const toggleLikeChatMessage = async (
  messageId: string,
  userId: string,
  hasLiked: boolean
) => {
  const messageRef = doc(db, "chats", messageId);

  return updateDoc(messageRef, {
    likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
  });
};
