import { CHAT_LIMIT_MESSAGE_LENGTH } from "feature/chat/chat.setting";
import {
  fetchChatMessages,
  GLOBAL_CHAT_PATH,
  sendChatMessage,
  toggleLikeChatMessage,
} from "feature/chat/services/chatService";
import type { ChatMessageType } from "feature/chat/types/chat.types";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

/** Same chat, any room: the global one by default, a guild's when given its path. */
export const useChat = (chatPath: string = GLOBAL_CHAT_PATH) => {
  const { t } = useTranslation("chat");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useAppSelector(selectUserAuth);
  const currentUserName = useAppSelector(selectUserName) || "Anonymous";
  const avatar = useAppSelector(selectUserAvatar);
  const userStats = useAppSelector(selectCurrentUserStats);

  useEffect(() => {
    const unsubscribe = fetchChatMessages(setMessages, chatPath);
    return unsubscribe;
  }, [chatPath]);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newMessage.trim() || !currentUserId) return;

      if (newMessage.length > CHAT_LIMIT_MESSAGE_LENGTH) {
        setError(t("validation_too_long"));
        return;
      } else {
        setError(null);
      }

      try {
        await sendChatMessage(
          newMessage,
          currentUserId,
          currentUserName,
          avatar,
          userStats?.lvl || 0,
          chatPath
        );

        setNewMessage("");
      } catch  {
        toast.error(t("error"));
      }
    },
    [newMessage, currentUserId, currentUserName, avatar, userStats, chatPath]
  );

  const toggleLike = useCallback(
    async (messageId: string) => {
      if (!currentUserId) return;

      const message = messages.find((msg) => msg.id === messageId);
      const hasLiked = message?.likes?.some((l) => l.id === currentUserId) ?? false;

      try {
        await toggleLikeChatMessage(messageId, currentUserId, currentUserName, hasLiked, chatPath);
      } catch {
        toast.error(t("error"));
      }
    },
    [messages, currentUserId, currentUserName, t, chatPath]
  );

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    toggleLike,
    currentUserId,
    error,
  };
};
