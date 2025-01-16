import Avatar from "components/Avatar";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { useChat } from "feature/chat/hooks/useChat";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const Chat = () => {
  const {
    error,
    messages,
    newMessage,
    sendMessage,
    setNewMessage,
    currentUserId,
  } = useChat();

  const { t } = useTranslation("chat");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat ${
              msg.userId === currentUserId ? "chat-end" : "chat-start"
            }`}>
            <div className='chat-image'>
              <Avatar
                avatarURL={msg.userPhotoURL}
                name={msg.username!}
                size='sm'
              />
            </div>
            <div className='chat-header'>{msg.username}</div>
            <div className='chat-bubble flex items-center bg-second-400'>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className='border-t p-4'>
        <div className='flex gap-2'>
          <Input
            type='text'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("send_placeholder")}
            className='flex-1'
          />
          <Button type='submit'>{t("send")}</Button>
        </div>
        {error && <p className='mt-1 text-red-400'>{error}</p>}
      </form>
    </div>
  );
};

export default Chat;
