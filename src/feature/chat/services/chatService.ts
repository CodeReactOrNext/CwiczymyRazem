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

/**
 * Where the messages live. The global room is a top-level collection; a guild
 * keeps its own under the guild document, so a channel is just a different
 * path and the whole chat feature works unchanged on either.
 */
export const GLOBAL_CHAT_PATH = "chats";

export const guildChatPath = (guildId: string) => `guilds/${guildId}/chat`;

export const fetchChatMessages = (
  callback: (messages: ChatMessageType[]) => void,
  chatPath: string = GLOBAL_CHAT_PATH
) => {
  const chatQuery = query(
    collection(db, chatPath),
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
  lvl: number,
  chatPath: string = GLOBAL_CHAT_PATH
) => {
  if (!message.trim()) return undefined

  return addDoc(collection(db, chatPath), {
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
  username: string,
  hasLiked: boolean,
  chatPath: string = GLOBAL_CHAT_PATH
) => {
  const messageRef = doc(db, chatPath, messageId);

  return updateDoc(messageRef, {
    likes: hasLiked
      ? arrayRemove({ id: userId, username })
      : arrayUnion({ id: userId, username }),
  });
};
