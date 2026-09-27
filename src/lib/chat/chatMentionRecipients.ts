import type {
  ChatMention,
  ChatReplyTo,
} from "feature/chat/types/chat.types";
import { MAX_CHAT_MENTIONS } from "feature/chat/utils/chatMentions";

export type ChatNotificationType = "chat_mention" | "chat_reply";

/** The rooms a notification may point into: the global one, or a guild's. */
export const isChatPath = (value: unknown): value is string =>
  typeof value === "string" &&
  (value === "chats" || /^guilds\/[^/]+\/chat$/.test(value));

/** The guild a room belongs to, or `null` for the global room. */
export const guildIdOfChatPath = (chatPath: string): string | null =>
  /^guilds\/([^/]+)\/chat$/.exec(chatPath)?.[1] ?? null;

/**
 * Who a stored message should notify, and how. Read off the message rather than
 * the request: the author tagged at most five people, and whoever they answered
 * hears about it as a reply — once, even if they were tagged as well.
 */
export const chatNotificationRecipients = (message: {
  userId?: unknown;
  mentions?: unknown;
  replyTo?: unknown;
}): { uid: string; type: ChatNotificationType }[] => {
  const author = typeof message.userId === "string" ? message.userId : null;
  const byUid = new Map<string, ChatNotificationType>();

  const replyTo = message.replyTo as Partial<ChatReplyTo> | null | undefined;
  if (typeof replyTo?.userId === "string" && replyTo.userId !== "system") {
    byUid.set(replyTo.userId, "chat_reply");
  }

  const mentions = Array.isArray(message.mentions)
    ? (message.mentions as Partial<ChatMention>[])
    : [];
  for (const mention of mentions.slice(0, MAX_CHAT_MENTIONS)) {
    if (typeof mention?.id === "string" && !byUid.has(mention.id)) {
      byUid.set(mention.id, "chat_mention");
    }
  }

  if (author) byUid.delete(author);

  return [...byUid.entries()].map(([uid, type]) => ({ uid, type }));
};
