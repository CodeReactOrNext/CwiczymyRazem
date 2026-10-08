import { CHAT_LIMIT_MESSAGE } from "feature/chat/chat.setting";
import type {
  ChatAttachment,
  ChatMention,
  ChatMessageType,
  ChatReaction,
  ChatReplyTo,
} from "feature/chat/types/chat.types";
import { isStockGreeting } from "feature/chat/utils/chatGreetings";
import type { GuildBadge } from "feature/guilds/types/guild.types";
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
import { auth, db } from "utils/firebase/client/firebase.utils";

/**
 * Where the messages live. The global room is a top-level collection; a guild
 * keeps its own under the guild document, so a channel is just a different
 * path and the whole chat feature works unchanged on either.
 */
export const GLOBAL_CHAT_PATH = "chats";

export const guildChatPath = (guildId: string): `guilds/${string}/chat` =>
  `guilds/${guildId}/chat`;

/**
 * New players used to be welcomed in the global room; they are greeted in the
 * activity feed now. The old cards are still stored, and so are the bare
 * "@Ania Welcome! 👋" replies to them — without the card, those would read as
 * stray lines.
 */
const isRetiredWelcome = (message: ChatMessageType) =>
  message.type === "welcome" ||
  (Boolean(message.replyTo?.id?.startsWith("welcome-")) &&
    isStockGreeting(message));

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
    const messages = snapshot.docs
      // Guild rooms used to announce every finished session; those rows are still stored.
      .filter((docSnapshot) => docSnapshot.data().system?.kind !== "session")
      .map(
        (docSnapshot) =>
          ({ id: docSnapshot.id, ...docSnapshot.data() } as ChatMessageType)
      )
      .filter((message) => !isRetiredWelcome(message));
    callback(messages.reverse());
  }, (error) => {
    console.error("Chat messages listener failed:", error);
    callback([]);
  });
};

export interface ChatMessageExtras {
  replyTo?: ChatReplyTo | null;
  mentions?: ChatMention[];
  attachment?: ChatAttachment | null;
}

export const sendChatMessage = async (
  message: string,
  userId: string,
  username: string,
  avatar: string | undefined,
  lvl: number,
  guildBadge: GuildBadge | null | undefined,
  chatPath: string = GLOBAL_CHAT_PATH,
  extras: ChatMessageExtras = {}
) => {
  if (!message.trim() && !extras.attachment) return undefined

  return addDoc(collection(db, chatPath), {
    userId,
    username,
    message,
    timestamp: serverTimestamp(),
    userPhotoURL: avatar,
    lvl,
    guildBadge: guildBadge ?? null,
    likes: [],
    // Only what the message actually carries — a plain line stays the shape it always was.
    ...(extras.replyTo && { replyTo: extras.replyTo }),
    ...(extras.mentions?.length && { mentions: extras.mentions }),
    ...(extras.attachment && { attachment: extras.attachment }),
  });
};

/**
 * Adds or takes back one reaction. Taking one back passes the stored entry
 * itself: `arrayRemove` only matches an identical object.
 */
export const toggleChatReaction = async (
  messageId: string,
  reaction: ChatReaction,
  remove: boolean,
  chatPath: string = GLOBAL_CHAT_PATH
) => {
  const messageRef = doc(db, chatPath, messageId);

  return updateDoc(messageRef, {
    likes: remove ? arrayRemove(reaction) : arrayUnion(reaction),
  });
};

const postWithToken = async (url: string, body: object) => {
  const user = auth.currentUser;
  if (!user) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await user.getIdToken(), ...body }),
  });
};

/**
 * Tells the people a message tagged or answered. The server reads who they are
 * off the stored message, so nothing here can aim a notification elsewhere.
 * Fire-and-forget: the message is already posted either way.
 */
export const notifyChatMentions = (chatPath: string, messageId: string) =>
  postWithToken("/api/chat/mentions", { chatPath, messageId }).catch(
    (error) => console.error("Chat mention notify failed:", error)
  );
