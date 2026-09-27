import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { ChatAttachmentCard } from "feature/chat/components/ChatAttachmentCard";
import { ChatAttachmentPicker } from "feature/chat/components/ChatAttachmentPicker";
import { ChatComposer } from "feature/chat/components/ChatComposer";
import {
  ChatMessageActions,
  ChatReactionChips,
} from "feature/chat/components/ChatReactions";
import { ChatSystemRow } from "feature/chat/components/ChatSystemRow";
import { useChat } from "feature/chat/hooks/useChat";
import { typingLabel, useChatTyping } from "feature/chat/hooks/useChatTyping";
import { GLOBAL_CHAT_PATH } from "feature/chat/services/chatService";
import type {
  ChatMention,
  ChatMessageType,
} from "feature/chat/types/chat.types";
import { splitByMentions } from "feature/chat/utils/chatMentions";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { useOnlineUsers } from "hooks/useOnlineUsers";
import { useTranslation } from "hooks/useTranslation";
import { ActivityStartModal } from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import { ArrowDown, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** Within this many pixels of the bottom still counts as "at the bottom". */
const BOTTOM_SLACK_PX = 80;

const isPlain = (message: ChatMessageType) =>
  !message.type || message.type === "message";

/** The words of a message, with the people it tagged picked out. */
const MessageText = ({
  message,
  viewerId,
}: {
  message: ChatMessageType;
  viewerId: string | null;
}) => (
  <>
    {splitByMentions(message.message, message.mentions).map((segment, index) =>
      segment.type === "text" ? (
        <span key={index}>{segment.text}</span>
      ) : (
        <span
          key={index}
          className={cn(
            "font-semibold",
            segment.mention.id === viewerId ? "text-amber-300" : "text-cyan-300",
          )}>
          {segment.text}
        </span>
      ),
    )}
  </>
);

const EmptyRoom = ({
  isGuild,
  onSayHi,
}: {
  isGuild: boolean;
  onSayHi: () => void;
}) => (
  <div className='flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center'>
    <span className='flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900'>
      <MessageCircle className='h-6 w-6 text-zinc-500' />
    </span>
    <div className='space-y-1'>
      <p className='text-sm font-semibold text-zinc-200'>
        Nobody has said anything yet
      </p>
      <p className='text-sm text-zinc-500'>
        {isGuild
          ? "Be the first — say hi to your guild."
          : "Be the first — say hi to everyone."}
      </p>
    </div>
    <button
      type='button'
      onClick={onSayHi}
      className='rounded-lg bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 active:click-behavior'>
      Say hi 👋
    </button>
  </div>
);

/** `chatPath` picks the room; omitted, it is the global one. */
const Chat = ({ chatPath = GLOBAL_CHAT_PATH }: { chatPath?: string } = {}) => {
  const {
    error,
    messages,
    isLoading,
    newMessage,
    sendMessage,
    setNewMessage,
    toggleReaction,
    replyTo,
    startReply,
    cancelReply,
    attachment,
    setAttachment,
    addMention,
    currentUserId,
    currentUserName,
  } = useChat(chatPath);

  const { t } = useTranslation("chat");
  const isGuild = chatPath !== GLOBAL_CHAT_PATH;
  // Touch screens have no hover, so tapping a message is what reveals its actions.
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activity, setActivity] = useState<{
    plan?: ExercisePlan;
    exercise?: Exercise;
  } | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const { getSupportMember } = useSupportTeam();
  const { typingNames, notifyTyping, stopTyping } = useChatTyping(
    chatPath,
    currentUserId,
    currentUserName,
  );
  // Tagging is for the people in the room: in a guild that is who has spoken there, globally it
  // is also whoever is online right now.
  const { onlineUsers } = useOnlineUsers(!isGuild);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const atBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // The newest message the player has had on screen — whatever came after it is "new".
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Follows the conversation only when there is something new at the bottom, and only when the
  // player was already there (or wrote it). A like or an edit changes `messages` too, and someone
  // reading further up shouldn't be yanked down by either.
  useEffect(() => {
    const el = scrollRef.current;
    const lastId = lastMessage?.id ?? null;
    if (!el || !lastId || lastId === lastMessageIdRef.current) return;

    const isFirstLoad = lastMessageIdRef.current === null;
    lastMessageIdRef.current = lastId;

    if (isFirstLoad || atBottomRef.current || lastMessage?.userId === currentUserId) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastMessage, currentUserId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK_PX;
    atBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom && lastMessage?.id) setLastSeenId(lastMessage.id);
  };

  const unseenCount = useMemo(() => {
    if (isAtBottom || !lastSeenId) return 0;
    const seenIndex = messages.findIndex((message) => message.id === lastSeenId);
    return messages
      .slice(seenIndex + 1)
      .filter((message) => message.userId !== currentUserId).length;
  }, [isAtBottom, lastSeenId, messages, currentUserId]);

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const jumpToMessage = (messageId: string) => {
    const target = scrollRef.current?.querySelector(
      `[data-message-id="${CSS.escape(messageId)}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashMessageId(messageId);
    setTimeout(() => setFlashMessageId(null), 1500);
  };

  const mentionCandidates = useMemo((): ChatMention[] => {
    const byId = new Map<string, ChatMention>();
    // Most recent speakers first — they are who a reply is most likely aimed at.
    for (const message of [...messages].reverse()) {
      if (
        message.userId &&
        message.userId !== "system" &&
        message.userId !== currentUserId &&
        message.username &&
        !byId.has(message.userId)
      ) {
        byId.set(message.userId, {
          id: message.userId,
          username: message.username,
        });
      }
    }
    for (const user of onlineUsers) {
      if (user.uid !== currentUserId && user.displayName && !byId.has(user.uid)) {
        byId.set(user.uid, { id: user.uid, username: user.displayName });
      }
    }
    return [...byId.values()];
  }, [messages, onlineUsers, currentUserId]);

  const focusInput = () =>
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });

  const greet = (message: ChatMessageType) => {
    startReply(message);
    addMention({ id: message.userId, username: message.username });
    setNewMessage(`@${message.username} Welcome! 👋 `);
    focusInput();
  };

  const handleSubmit = (event: React.FormEvent) => {
    stopTyping();
    return sendMessage(event);
  };

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-lg bg-zinc-950/40'>
      <div className='relative min-h-0 flex-1'>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className='h-full overflow-y-auto p-2 scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-700 sm:p-4'>
          {!isLoading && messages.length === 0 ? (
            <EmptyRoom
              isGuild={isGuild}
              onSayHi={() => {
                setNewMessage(
                  isGuild ? "Hi guild! 👋 " : "Hi everyone! 👋 ",
                );
                focusInput();
              }}
            />
          ) : (
            <div className='flex flex-col gap-1 px-2 pt-8'>
              {messages.map((msg, index) => {
                const isMe = msg.userId === currentUserId;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isActive = !!msg.id && activeMessageId === msg.id;
                const react = (emoji: Parameters<typeof toggleReaction>[1]) =>
                  msg.id && toggleReaction(msg.id, emoji);

                if (!isPlain(msg)) {
                  return (
                    <div
                      key={msg.id}
                      data-message-id={msg.id}
                      className='group relative mt-4 flex flex-col items-center'
                      onClick={() =>
                        setActiveMessageId((prev) =>
                          prev === msg.id ? null : (msg.id ?? null),
                        )
                      }>
                      <ChatMessageActions
                        visible={isActive}
                        onReact={react}
                        className='absolute -top-8 left-1/2 -translate-x-1/2'
                      />
                      <ChatSystemRow
                        message={msg}
                        onSayHi={
                          !isMe && msg.userId !== "system"
                            ? () => greet(msg)
                            : undefined
                        }
                      />
                      <ChatReactionChips
                        reactions={msg.likes}
                        viewerId={currentUserId}
                        onToggle={react}
                      />
                    </div>
                  );
                }

                const isFollowUp =
                  !!prevMsg &&
                  isPlain(prevMsg) &&
                  prevMsg.userId === msg.userId &&
                  !msg.replyTo;
                const supportMember = getSupportMember(msg.userId);
                const tagsMe =
                  !isMe &&
                  (msg.mentions?.some((m) => m.id === currentUserId) ||
                    msg.replyTo?.userId === currentUserId);

                return (
                  <div
                    key={msg.id}
                    data-message-id={msg.id}
                    className={cn(
                      "group flex w-full flex-col",
                      isMe ? "items-end" : "items-start",
                      isFollowUp ? "mt-0.5" : "mt-4",
                    )}>
                    <div
                      className={cn(
                        "flex min-w-0 max-w-[90%] gap-3",
                        isMe ? "flex-row-reverse" : "flex-row",
                      )}>
                      {/* Avatar only on the first of a run */}
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

                      <div
                        className={cn(
                          "flex min-w-0 flex-col",
                          isMe ? "items-end" : "items-start",
                        )}>
                        {!isFollowUp && (
                          <div
                            className={cn(
                              "mb-1 flex items-center gap-1.5",
                              isMe && "flex-row-reverse",
                            )}>
                            <UserTooltip userId={msg.userId}>
                              <span className='px-1 text-xs font-semibold text-zinc-400'>
                                {msg.username}
                              </span>
                            </UserTooltip>
                            {/* Outside the tooltip on purpose — its trigger takes a
                                single child, and the tag belongs beside the name
                                rather than inside what opens the card. */}
                            <GuildTagBadge badge={msg.guildBadge} />
                            {supportMember && <SupportBadge member={supportMember} />}
                          </div>
                        )}

                        <div
                          className='relative min-w-0'
                          onClick={() =>
                            setActiveMessageId((prev) =>
                              prev === msg.id ? null : (msg.id ?? null),
                            )
                          }>
                          <ChatMessageActions
                            visible={isActive}
                            onReact={react}
                            onReply={() => {
                              startReply(msg);
                              focusInput();
                            }}
                            className={cn(
                              "absolute -top-8",
                              isMe ? "right-0" : "left-0",
                            )}
                          />
                          <div
                            className={cn(
                              "flex flex-col gap-2 rounded-lg px-3 py-2 text-sm transition-colors [overflow-wrap:anywhere] sm:px-4",
                              isMe
                                ? "bg-cyan-500/20 text-cyan-50"
                                : tagsMe
                                  ? "bg-amber-500/15 text-amber-50"
                                  : "bg-white/5 text-zinc-100",
                              !isFollowUp && (isMe ? "rounded-tr" : "rounded-tl"),
                              flashMessageId === msg.id && "bg-cyan-500/30",
                            )}>
                            {msg.replyTo && (
                              <button
                                type='button'
                                onClick={(event) => {
                                  event.stopPropagation();
                                  jumpToMessage(msg.replyTo!.id);
                                }}
                                className='flex min-w-0 flex-col rounded bg-black/20 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-black/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60'>
                                <span className='font-semibold text-zinc-300'>
                                  ↪ {msg.replyTo.username}
                                </span>
                                <span className='truncate text-zinc-400'>
                                  {msg.replyTo.message}
                                </span>
                              </button>
                            )}
                            {msg.message && (
                              <span>
                                <MessageText message={msg} viewerId={currentUserId} />
                              </span>
                            )}
                            {msg.attachment && (
                              <div
                                className='w-72 max-w-full'
                                onClick={(event) => event.stopPropagation()}>
                                <ChatAttachmentCard
                                  attachment={msg.attachment}
                                  onOpenActivity={setActivity}
                                  onOpenRecording={setRecordingId}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <ChatReactionChips
                          reactions={msg.likes}
                          viewerId={currentUserId}
                          onToggle={react}
                          alignEnd={isMe}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {unseenCount > 0 && (
          <button
            type='button'
            onClick={jumpToLatest}
            className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-200 active:click-behavior'>
            <ArrowDown className='h-3.5 w-3.5' />
            {unseenCount} new
          </button>
        )}
      </div>

      <ChatComposer
        value={newMessage}
        onChange={setNewMessage}
        onSubmit={handleSubmit}
        placeholder={t("send_placeholder")}
        inputRef={inputRef}
        replyTo={replyTo}
        onCancelReply={cancelReply}
        attachment={attachment}
        onClearAttachment={() => setAttachment(null)}
        onOpenPicker={() => setPickerOpen(true)}
        mentionCandidates={mentionCandidates}
        onMention={addMention}
        onTyping={notifyTyping}
        typingText={typingLabel(typingNames)}
        error={error}
      />

      <ChatAttachmentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        userId={currentUserId}
        onPick={(picked) => {
          setAttachment(picked);
          focusInput();
        }}
      />

      <ActivityStartModal
        plan={activity?.plan}
        exercise={activity?.exercise}
        onClose={() => setActivity(null)}
      />

      <RecordingViewModal
        isOpen={!!recordingId}
        onClose={() => setRecordingId(null)}
        recordingId={recordingId}
      />
    </div>
  );
};

export default Chat;
