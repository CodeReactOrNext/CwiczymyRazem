import { CHAT_LIMIT_MESSAGE_LENGTH } from "feature/chat/chat.setting";
import {
  fetchChatMessages,
  GLOBAL_CHAT_PATH,
  notifyChatMentions,
  sendChatMessage,
  toggleChatReaction,
} from "feature/chat/services/chatService";
import type {
  ChatAttachment,
  ChatMention,
  ChatMessageType,
  ChatReactionEmoji,
  ChatReplyTo,
} from "feature/chat/types/chat.types";
import { resolveMentions, snippet } from "feature/chat/utils/chatMentions";
import { findOwnReaction } from "feature/chat/utils/chatReactions";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserGuildBadge,
  selectUserName,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

/** What a reply quotes: the text, or what was shared when there was none. */
const quoteOf = (message: ChatMessageType): string => {
  if (message.message?.trim()) return snippet(message.message);
  const attachment = message.attachment;
  if (!attachment) return "";
  return attachment.kind === "item"
    ? `${attachment.itemBrand} ${attachment.itemName}`
    : attachment.title;
};

/** Same chat, any room: the global one by default, a guild's when given its path. */
export const useChat = (chatPath: string = GLOBAL_CHAT_PATH) => {
  const { t } = useTranslation("chat");
  // `null` until the first snapshot lands, so an empty room can be told apart from a loading one.
  const [messages, setMessages] = useState<ChatMessageType[] | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatReplyTo | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  // Everyone picked from the @ list while writing; the ones still in the text go out with it.
  const [pickedMentions, setPickedMentions] = useState<ChatMention[]>([]);

  const currentUserId = useAppSelector(selectUserAuth);
  const currentUserName = useAppSelector(selectUserName) || "Anonymous";
  const avatar = useAppSelector(selectUserAvatar);
  const userStats = useAppSelector(selectCurrentUserStats);
  // Read once at login like the avatar is: a tag changes when somebody joins,
  // leaves or re-kits a guild, which is rare enough to catch on the next load.
  const guildBadge = useAppSelector(selectUserGuildBadge);

  useEffect(() => {
    const unsubscribe = fetchChatMessages(setMessages, chatPath);
    return unsubscribe;
  }, [chatPath]);

  const startReply = useCallback((message: ChatMessageType) => {
    if (!message.id) return;
    setReplyTo({
      id: message.id,
      userId: message.userId,
      username: message.username,
      message: quoteOf(message),
    });
  }, []);

  const addMention = useCallback((mention: ChatMention) => {
    setPickedMentions((prev) => [...prev, mention]);
  }, []);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if ((!newMessage.trim() && !attachment) || !currentUserId) return;

      if (newMessage.length > CHAT_LIMIT_MESSAGE_LENGTH) {
        setError(t("validation_too_long"));
        return;
      } else {
        setError(null);
      }

      const mentions = resolveMentions(newMessage, pickedMentions, currentUserId);

      try {
        const sent = await sendChatMessage(
          newMessage,
          currentUserId,
          currentUserName,
          avatar,
          userStats?.lvl || 0,
          guildBadge,
          chatPath,
          { replyTo, mentions, attachment }
        );

        setNewMessage("");
        setReplyTo(null);
        setAttachment(null);
        setPickedMentions([]);

        const answersSomeoneElse = replyTo && replyTo.userId !== currentUserId;
        if (sent && (mentions.length > 0 || answersSomeoneElse)) {
          notifyChatMentions(chatPath, sent.id);
        }
      } catch  {
        toast.error(t("error"));
      }
    },
    [
      newMessage,
      attachment,
      pickedMentions,
      replyTo,
      currentUserId,
      currentUserName,
      avatar,
      userStats,
      guildBadge,
      chatPath,
      t,
    ]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: ChatReactionEmoji) => {
      if (!currentUserId) return;

      const message = messages?.find((msg) => msg.id === messageId);
      const own = findOwnReaction(message?.likes, currentUserId, emoji);

      try {
        await toggleChatReaction(
          messageId,
          own ?? { id: currentUserId, username: currentUserName, emoji },
          Boolean(own),
          chatPath
        );
      } catch {
        toast.error(t("error"));
      }
    },
    [messages, currentUserId, currentUserName, t, chatPath]
  );

  return {
    messages: messages ?? [],
    isLoading: messages === null,
    newMessage,
    setNewMessage,
    sendMessage,
    toggleReaction,
    replyTo,
    startReply,
    cancelReply: () => setReplyTo(null),
    attachment,
    setAttachment,
    addMention,
    currentUserId,
    currentUserName,
    error,
  };
};
