import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { ScrollArea } from "assets/components/ui/scroll-area";
import { Card } from "assets/components/ui/card";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { useChat } from "feature/chat/hooks/useChat";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizontal } from "lucide-react";

export const Chat = () => {
  const {
    error,
    messages,
    newMessage,
    sendMessage,
    setNewMessage,
    currentUserId,
  } = useChat();

  const { t } = useTranslation("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className='flex h-full flex-col overflow-hidden radius-premium  bg-zinc-950/40 '>
      {/* Header for Chat if needed, otherwise just the list */}
      <ScrollArea ref={scrollRef} className='flex-1 p-2 sm:p-4 '>
        <div className='flex flex-col gap-1 px-2'>
          {messages.map((msg, index) => {
            const isMe = msg.userId === currentUserId;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFollowUp = prevMsg && prevMsg.userId === msg.userId;
            
            return (
              <div
                key={msg.id}
                className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"} ${isFollowUp ? "mt-0.5" : "mt-4"}`}>
                <div
                  className={`flex max-w-[90%] gap-3 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}>
                  
                  {/* Avatar Section - Only show if not a follow-up */}
                  <div className='flex w-10 flex-shrink-0 justify-center'>
                    {!isFollowUp && (
                      <UserTooltip userId={msg.userId}>
                        <div className='mt-0.5'>
                          <Avatar
                            size='sm'
                            name={msg.username}
                            avatarURL={msg.userPhotoURL}
                            lvl={msg.lvl}
                          />
                        </div>
                      </UserTooltip>
                    )}
                  </div>

                  {/* Message Section */}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isFollowUp && (
                      <UserTooltip userId={msg.userId}>
                        <span className='mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500/80'>
                          {msg.username}
                        </span>
                      </UserTooltip>
                    )}
                    
                    <Card
                      className={`relative border-none px-3 py-2 text-sm transition-all sm:px-4 ${
                        isMe
                          ? `bg-cyan-500/20 text-cyan-50 ${isFollowUp ? "rounded-2xl" : "rounded-2xl rounded-tr-sm"}`
                          : `bg-white/5 text-zinc-100 ${isFollowUp ? "rounded-2xl" : "rounded-2xl rounded-tl-sm"}`
                      }`}>
                      {msg.message}
                    </Card>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Section - Standard Shadcn patterns */}
      <div className='border-t border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xl'>
        <form 
          onSubmit={sendMessage} 
          className='mx-auto flex w-full max-w-4xl items-center gap-3'
        >
          <div className='relative flex-1'>
            <Input
              type='text'
              value={newMessage}
              placeholder={t("send_placeholder")}
              autoComplete="off"
              className='h-12 border-white/10 bg-zinc-950/50 pr-12 transition-all focus-visible:ring-cyan-500/50 radius-default'
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <Button
            type='submit'
            size='icon'
            className='h-12 w-12 rounded-2xl bg-cyan-500 font-bold text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95'
          >
            <SendHorizontal className='h-5 w-5' />
          </Button>
        </form>
        {error && (
          <p className='mt-2 px-1 text-center text-xs font-medium text-red-400'>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Chat;
