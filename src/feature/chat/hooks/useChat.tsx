import { CHAT_LIMIT_MESSAGE_LENGTH } from "feature/chat/chat.setting";
import {
  fetchChatMessages,
  sendChatMessage,
} from "feature/chat/services/chatService";
import type { ChatMessage } from "feature/chat/types/chat.types";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useCallback,useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

export const useChat = () => {
  const { t } = useTranslation("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useAppSelector(selectUserAuth);
  const currentUserName = useAppSelector(selectUserName) || "Anonymous";
  const avatar = useAppSelector(selectUserAvatar);

  useEffect(() => {
    const unsubscribe = fetchChatMessages(setMessages);
    return unsubscribe;
  }, []);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newMessage.trim() || !currentUserId) return;

      if (newMessage.length > CHAT_LIMIT_MESSAGE_LENGTH) {
        setError(t('validation_too_long'));
        return;
      } else {
        setError(null);
      }

      try {
        await sendChatMessage(
          newMessage,
          currentUserId,
          currentUserName,
          avatar
        );
        setNewMessage("");
      } catch (error) {
        toast.error(t("error"));
      }
    },
    [newMessage, currentUserId, currentUserName, avatar]
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
