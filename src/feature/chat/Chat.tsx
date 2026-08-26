import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import { ScrollArea } from "assets/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { useChat } from "feature/chat/hooks/useChat";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { useTranslation } from "hooks/useTranslation";
import { Heart, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Chat = () => {
  const {
    error,
    messages,
    newMessage,
    sendMessage,
    setNewMessage,
    toggleLike,
    currentUserId,
  } = useChat();

  const { t } = useTranslation("chat");
  // Na dotyku nie ma hovera, więc serduszko odsłania się tapnięciem w dymek.
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const { getSupportMember } = useSupportTeam();
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
    <div className='flex h-full flex-col overflow-hidden rounded-2xl  bg-zinc-950/40 '>
      {/* Header for Chat if needed, otherwise just the list */}
      <ScrollArea
        ref={scrollRef}
        className='flex-1 p-2 sm:p-4 [&>[data-radix-scroll-area-viewport]>div]:!block'>
        <div className='flex flex-col gap-1 px-2'>
          {messages.map((msg, index) => {
            const isMe = msg.userId === currentUserId;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFollowUp = prevMsg && prevMsg.userId === msg.userId;
            const likes = msg.likes ?? [];
            const hasLiked = currentUserId
              ? likes.some((l) => l.id === currentUserId)
              : false;
            const supportMember = getSupportMember(msg.userId);
            const isActive = !!msg.id && activeMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`group flex w-full flex-col ${isMe ? "items-end" : "items-start"} ${isFollowUp ? "mt-0.5" : "mt-4"}`}>
                <div
                  className={`flex min-w-0 max-w-[90%] gap-3 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}>

                  {/* Avatar Section - Only show if not a follow-up */}
                  <div className='flex w-10 flex-shrink-0 justify-center'>
                    {!isFollowUp && (
                      <UserTooltip userId={msg.userId}>
                        <div className='mt-0.5'>
                          {supportMember ? (
                            <SupportAvatarRing>
                              <Avatar
                                size='sm'
                                name={msg.username}
                                avatarURL={msg.userPhotoURL}
                                lvl={msg.lvl}
                              />
                            </SupportAvatarRing>
                          ) : (
                            <Avatar
                              size='sm'
                              name={msg.username}
                              avatarURL={msg.userPhotoURL}
                              lvl={msg.lvl}
                            />
                          )}
                        </div>
                      </UserTooltip>
                    )}
                  </div>

                  {/* Message Section */}
                  <div
                    className={`flex min-w-0 flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isFollowUp && (
                      <div
                        className={cn(
                          "mb-1 flex items-center gap-1.5",
                          isMe && "flex-row-reverse"
                        )}>
                        <UserTooltip userId={msg.userId}>
                          <span className='px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500/80'>
                            {msg.username}
                          </span>
                        </UserTooltip>
                        {supportMember && <SupportBadge member={supportMember} />}
                      </div>
                    )}

                    <div
                      className={cn(
                        "relative flex min-w-0 items-center gap-1.5",
                        isMe && "flex-row-reverse",
                        likes.length > 0 && "mb-4"
                      )}>
                      <div
                        className='relative min-w-0'
                        onClick={() =>
                          setActiveMessageId((prev) =>
                            prev === msg.id ? null : msg.id ?? null
                          )
                        }>
                        <Card
                          className={`border-none px-3 py-2 text-sm transition-all [overflow-wrap:anywhere] sm:px-4 ${
                            isMe
                              ? `bg-cyan-500/20 text-cyan-50 ${isFollowUp ? "rounded-2xl" : "rounded-2xl rounded-tr-sm"}`
                              : `bg-white/5 text-zinc-100 ${isFollowUp ? "rounded-2xl" : "rounded-2xl rounded-tl-sm"}`
                          }`}>
                          {msg.message}
                        </Card>

                        {likes.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type='button'
                                aria-label={t("like")}
                                onClick={() => msg.id && toggleLike(msg.id)}
                                className={cn(
                                  "absolute -bottom-3.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-background active:click-behavior",
                                  hasLiked
                                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
                                  isMe ? "left-2" : "right-2"
                                )}>
                                <Heart className='h-4 w-4 fill-red-500 text-red-500' />
                                <span className='leading-none'>{likes.length}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='top' className='max-w-xs bg-zinc-900 text-white border-white/10'>
                              <div className='space-y-1'>
                                <p className='text-[11px] font-semibold text-zinc-300 mb-1'>
                                  Liked by:
                                </p>
                                {likes.map((liker) => (
                                  <UserTooltip key={liker.id} userId={liker.id}>
                                    <div className='text-[11px] text-zinc-200 hover:text-white cursor-pointer'>
                                      {liker.username}
                                    </div>
                                  </UserTooltip>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {likes.length === 0 && (
                        <button
                          type='button'
                          aria-label={t("like")}
                          onClick={() => msg.id && toggleLike(msg.id)}
                          className={cn(
                            // Mobile: poza flowem, żeby nie zjadał szerokości dymka.
                            "absolute -bottom-3.5 rounded-full bg-zinc-800 p-1.5 text-zinc-400 transition-opacity active:click-behavior",
                            isMe ? "left-2" : "right-2",
                            !isActive &&
                              "max-sm:pointer-events-none max-sm:opacity-0",
                            // Desktop bez zmian: inline obok dymka, odsłaniany hoverem.
                            "sm:static sm:bg-transparent sm:p-2 sm:text-zinc-500 sm:opacity-0 sm:hover:bg-white/5 sm:hover:text-red-400 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
                          )}>
                          <Heart className='h-4 w-4 sm:h-5 sm:w-5' />
                        </button>
                      )}
                    </div>
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
              className='h-12 border-white/10 bg-zinc-950/50 pr-12 transition-all focus-visible:ring-cyan-500/50 rounded-xl'
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
