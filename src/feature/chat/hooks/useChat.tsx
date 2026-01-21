import { CHAT_LIMIT_MESSAGE_LENGTH } from "feature/chat/chat.setting";
import {
  fetchChatMessages,
  sendChatMessage,
} from "feature/chat/services/chatService";
import type { ChatMessageType } from "feature/chat/types/chat.types";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

export const useChat = () => {
  const { t } = useTranslation("chat");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useAppSelector(selectUserAuth);
  const currentUserName = useAppSelector(selectUserName) || "Anonymous";
  const avatar = useAppSelector(selectUserAvatar);
  const userStats = useAppSelector(selectCurrentUserStats);

  useEffect(() => {
    const unsubscribe = fetchChatMessages(setMessages);
    return unsubscribe;
  }, []);

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
          userStats?.lvl || 0
        );

        setNewMessage("");
      } catch (error) {
        toast.error(t("error"));
      }
    },
    [newMessage, currentUserId, currentUserName, avatar, userStats]
  );


  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    currentUserId,
    error,
  };
};
