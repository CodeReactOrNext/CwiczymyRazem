import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { format } from "date-fns";
import { ChatAttachmentCard } from "feature/chat/components/ChatAttachmentCard";
import { ChatAttachmentPicker } from "feature/chat/components/ChatAttachmentPicker";
import { ChatComposer } from "feature/chat/components/ChatComposer";
import { ChatMessageMenu } from "feature/chat/components/ChatMessageMenu";
import {
  ChatMessageActions,
  ChatReactionChips,
} from "feature/chat/components/ChatReactions";
import {
  ChatSystemRow,
  isJoinRow,
} from "feature/chat/components/ChatSystemRow";
import { useChat } from "feature/chat/hooks/useChat";
import { typingLabel, useChatTyping } from "feature/chat/hooks/useChatTyping";
import { useLongPress } from "feature/chat/hooks/useLongPress";
import { GLOBAL_CHAT_PATH } from "feature/chat/services/chatService";
import type {
  ChatMention,
  ChatMessageType,
  ChatReactionEmoji,
} from "feature/chat/types/chat.types";
import { foldGreetings } from "feature/chat/utils/chatGreetings";
import { splitByMentions } from "feature/chat/utils/chatMentions";
import {
  buildChatTimeline,
  chatDayKind,
} from "feature/chat/utils/chatTimeline";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { useOnlineUsers } from "hooks/useOnlineUsers";
import { useTranslation } from "hooks/useTranslation";
import {
  type ActivityPreview,
  ActivityStartModal,
} from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import { ArrowDown, Ellipsis, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** Within this many pixels of the bottom still counts as "at the bottom". */
const BOTTOM_SLACK_PX = 80;

/** Avatar column (w-10) plus the gap beside it — where a group's text starts. */
const AVATAR_INSET = "pl-[52px]";
const AVATAR_INSET_END = "pr-[52px]";

/**
 * Keeps iOS from selecting a held message's text and raising its callout over
 * our menu (which has Copy).
 */
const PRESSABLE =
  "[-webkit-touch-callout:none] [@media(hover:none)]:select-none";

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
}) => {
  const { t } = useTranslation("chat");
  return (
  <div className='flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center'>
    <span className='flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900'>
      <MessageCircle className='h-6 w-6 text-zinc-500' />
    </span>
    <div className='space-y-1'>
      <p className='text-sm font-semibold text-zinc-200'>
        {t("empty_room.title")}
      </p>
      <p className='text-sm text-zinc-400'>
        {isGuild ? t("empty_room.guild") : t("empty_room.everyone")}
      </p>
    </div>
    <button
      type='button'
      onClick={onSayHi}
      className='min-h-11 rounded-lg bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 active:click-behavior'>
      {t("empty_room.say_hi")}
    </button>
  </div>
  );
};

/** "Today", "Yesterday" or the date, centred between two days of talk. */
const DayDivider = ({ date }: { date: Date }) => {
  const { t } = useTranslation("chat");
  const locale = useDateFnsLocale();
  const now = new Date();
  const kind = chatDayKind(date, now);
  const label =
    kind === "today"
      ? t("time.today")
      : kind === "yesterday"
        ? t("time.yesterday")
        : format(
            date,
            date.getFullYear() === now.getFullYear()
              ? "EEEE, d MMMM"
              : "d MMMM yyyy",
            { locale },
          );

  return (
    <div className='mt-6 flex justify-center first:mt-2'>
      <time
        dateTime={format(date, "yyyy-MM-dd")}
        className='rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300'>
        {label}
      </time>
    </div>
  );
};

/** The ⋯ that opens a message's menu — only where there is no hover to reveal the actions. */
const MoreButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation("chat");
  return (
    <button
      type='button'
      aria-label={t("menu.more")}
      onClick={onClick}
      // -my-1 keeps a one-line bubble's row as tall as the bubble; the hit area stays 44px.
      className='-my-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 active:bg-white/10 [@media(hover:none)]:flex'>
      <Ellipsis className='h-5 w-5' />
    </button>
  );
};

/** What a single row needs to react, answer, or open its menu and attachments. */
interface MessageHandlers {
  viewerId: string | null;
  onReact: (message: ChatMessageType, emoji: ChatReactionEmoji) => void;
  onReply: (message: ChatMessageType) => void;
  onOpenMenu: (message: ChatMessageType) => void;
  onJumpTo: (messageId: string) => void;
  onOpenActivity: (preview: ActivityPreview) => void;
  onOpenRecording: (recordingId: string) => void;
}

const MessageRow = ({
  msg,
  isMe,
  isFirst,
  avatar,
  tagsMe,
  isFlashing,
  handlers,
}: {
  msg: ChatMessageType;
  isMe: boolean;
  isFirst: boolean;
  avatar: React.ReactNode;
  tagsMe: boolean;
  isFlashing: boolean;
  handlers: MessageHandlers;
}) => {
  const longPress = useLongPress(() => handlers.onOpenMenu(msg));

  return (
    <div
      data-message-id={msg.id}
      className={cn(
        "group/msg flex w-full",
        isMe ? "justify-end" : "justify-start",
        !isFirst && "mt-0.5",
      )}>
      <div
        className={cn(
          "flex min-w-0 max-w-[90%] gap-3",
          isMe ? "flex-row-reverse" : "flex-row",
        )}>
        {/* Avatar only on the first of a run */}
        <div className='flex w-10 flex-shrink-0 justify-center'>
          {isFirst && avatar}
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-col",
            isMe ? "items-end" : "items-start",
          )}>
          <div
            className={cn(
              "flex min-w-0 max-w-full items-center gap-1",
              isMe && "flex-row-reverse",
            )}>
            {/* max-w-full, not just min-w-0: a quoted reply or a shared card has a
                wide minimum of its own, which would otherwise size the bubble and
                push it out past the edge of the column. */}
            <div
              className={cn("relative min-w-0 max-w-full", PRESSABLE)}
              {...longPress}>
              <ChatMessageActions
                onReact={(emoji) => handlers.onReact(msg, emoji)}
                onReply={() => handlers.onReply(msg)}
                className={cn("absolute -top-12", isMe ? "right-0" : "left-0")}
              />
              <div
                className={cn(
                  "flex flex-col gap-2 rounded-lg px-3 py-2 text-sm transition-colors [overflow-wrap:anywhere] sm:px-4",
                  isMe
                    ? "bg-cyan-500/20 text-cyan-50"
                    : tagsMe
                      ? "bg-amber-500/15 text-amber-50"
                      : "bg-white/5 text-zinc-100",
                  isFirst && (isMe ? "rounded-tr" : "rounded-tl"),
                  isFlashing && "bg-cyan-500/30",
                )}>
                {msg.replyTo && (
                  <button
                    type='button'
                    onClick={() => handlers.onJumpTo(msg.replyTo!.id)}
                    className='flex min-w-0 max-w-full flex-col rounded bg-black/20 px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-black/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60'>
                    <span className='font-semibold text-zinc-300'>
                      ↪ {msg.replyTo.username}
                    </span>
                    <span className='truncate text-zinc-300'>
                      {msg.replyTo.message}
                    </span>
                  </button>
                )}
                {msg.message && (
                  <span className='whitespace-pre-wrap'>
                    <MessageText message={msg} viewerId={handlers.viewerId} />
                  </span>
                )}
                {msg.attachment && (
                  <div className='w-72 max-w-full'>
                    <ChatAttachmentCard
                      attachment={msg.attachment}
                      onOpenActivity={handlers.onOpenActivity}
                      onOpenRecording={handlers.onOpenRecording}
                    />
                  </div>
                )}
              </div>
            </div>
            <MoreButton onClick={() => handlers.onOpenMenu(msg)} />
          </div>

          <ChatReactionChips
            reactions={msg.likes}
            viewerId={handlers.viewerId}
            onToggle={(emoji) => handlers.onReact(msg, emoji)}
            alignEnd={isMe}
          />
        </div>
      </div>
    </div>
  );
};

/** A server event (a join, a level, a cleared quest) — reactions, but nobody to reply to. */
const EventRow = ({
  msg,
  greeters,
  onSayHi,
  handlers,
}: {
  msg: ChatMessageType;
  greeters: ChatMessageType[];
  onSayHi?: () => void;
  handlers: MessageHandlers;
}) => {
  const longPress = useLongPress(() => handlers.onOpenMenu(msg));
  const isJoin = isJoinRow(msg);

  return (
    <div
      data-message-id={msg.id}
      className={cn(
        "group/msg relative mt-4 flex flex-col",
        isJoin ? "items-start" : "items-center",
      )}>
      <ChatMessageActions
        onReact={(emoji) => handlers.onReact(msg, emoji)}
        className={cn(
          "absolute -top-12",
          // Past the avatar column, over the bubble like a message's.
          isJoin ? "left-[52px]" : "left-1/2 -translate-x-1/2",
        )}
      />
      <div
        className={cn(
          "flex w-full items-center gap-1",
          isJoin ? "justify-start" : "justify-center",
          PRESSABLE,
        )}
        {...longPress}>
        <ChatSystemRow message={msg} onSayHi={onSayHi} greeters={greeters} />
        <MoreButton onClick={() => handlers.onOpenMenu(msg)} />
      </div>
      <div className={cn(isJoin && AVATAR_INSET)}>
        <ChatReactionChips
          reactions={msg.likes}
          viewerId={handlers.viewerId}
          onToggle={(emoji) => handlers.onReact(msg, emoji)}
        />
      </div>
    </div>
  );
};

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
  const dateLocale = useDateFnsLocale();
  const isGuild = chatPath !== GLOBAL_CHAT_PATH;
  // The message whose menu is open — a held finger or ⋯ on a touch screen.
  const [menuMessage, setMenuMessage] = useState<ChatMessageType | null>(null);
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityPreview | null>(null);
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // The newest message the player has had on screen — whatever came after it is "new".
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  const { visible: visibleMessages, greetersById } = useMemo(
    () => foldGreetings(messages),
    [messages],
  );

  const timeline = useMemo(
    () => buildChatTimeline(visibleMessages),
    [visibleMessages],
  );

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
    setNewMessage(`@${message.username} ${t("greetings.welcome")} `);
    focusInput();
  };

  const handleSubmit = (event: React.FormEvent) => {
    stopTyping();
    return sendMessage(event);
  };

  const handlers: MessageHandlers = {
    viewerId: currentUserId,
    onReact: (message, emoji) => {
      if (message.id) toggleReaction(message.id, emoji);
    },
    onReply: (message) => {
      startReply(message);
      focusInput();
    },
    onOpenMenu: setMenuMessage,
    onJumpTo: jumpToMessage,
    onOpenActivity: setActivity,
    onOpenRecording: setRecordingId,
  };

  const avatarFor = (msg: ChatMessageType) => {
    const avatar = (
      <Avatar
        size='sm'
        name={msg.username}
        avatarURL={msg.userPhotoURL}
        lvl={msg.lvl}
      />
    );
    return (
      <UserTooltip userId={msg.userId}>
        <div className='mt-0.5'>
          {getSupportMember(msg.userId) ? (
            <SupportAvatarRing>{avatar}</SupportAvatarRing>
          ) : (
            avatar
          )}
        </div>
      </UserTooltip>
    );
  };

  return (
    // On a phone the room already sits in the feed's card, so it drops its own surface there
    // rather than nesting a second card (and its padding) inside the first.
    <div className='flex h-full flex-col overflow-hidden sm:rounded-lg sm:bg-zinc-950/40'>
      <div className='relative min-h-0 flex-1'>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          // overflow-x-hidden: a vertical scroller scrolls sideways too unless told not to, and
          // the hover actions over a bubble (invisible until hovered, but laid out) reach past
          // a phone-width column — which gave the room a second, sideways scrollbar.
          className='h-full overflow-y-auto overflow-x-hidden py-2 scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-700 sm:px-6 sm:py-4'>
          {!isLoading && messages.length === 0 ? (
            <EmptyRoom
              isGuild={isGuild}
              onSayHi={() => {
                setNewMessage(
                  `${isGuild ? t("greetings.hi_guild") : t("greetings.hi_everyone")} `,
                );
                focusInput();
              }}
            />
          ) : (
            <div className='flex flex-col'>
              {timeline.map((entry) => {
                if (entry.kind === "day") {
                  return <DayDivider key={entry.key} date={entry.date} />;
                }

                if (entry.kind === "event") {
                  const msg = entry.message;
                  const greeters = (msg.id && greetersById.get(msg.id)) || [];
                  const canGreet =
                    msg.userId !== currentUserId &&
                    msg.userId !== "system" &&
                    !greeters.some((g) => g.userId === currentUserId);
                  return (
                    <EventRow
                      key={entry.key}
                      msg={msg}
                      greeters={greeters}
                      onSayHi={canGreet ? () => greet(msg) : undefined}
                      handlers={handlers}
                    />
                  );
                }

                const [first] = entry.messages;
                const isMe = entry.userId === currentUserId;
                const supportMember = getSupportMember(entry.userId);

                return (
                  <section
                    key={entry.key}
                    className={cn(
                      "mt-4 flex flex-col",
                      isMe ? "items-end" : "items-start",
                    )}>
                    {/* Sticks to the top of the list for as long as any of the group is
                        on screen, so a run cut off by the edge still says whose it is. */}
                    <header
                      className={cn(
                        "sticky top-0 z-[5] mb-1 flex max-w-full",
                        isMe ? AVATAR_INSET_END : AVATAR_INSET,
                      )}>
                      {/* One line, whatever the width: on a phone the name, tag, badge and time
                          used to wrap inside the pill ("11:10 / PM"). The name is the one
                          part that gives way — it truncates, the rest keep their size. */}
                      <div
                        className={cn(
                          "flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md bg-zinc-950/80 px-1.5 py-0.5",
                          isMe && "flex-row-reverse",
                        )}>
                        <UserTooltip userId={first.userId}>
                          <span className='min-w-0 truncate text-xs font-semibold text-zinc-300'>
                            {first.username}
                          </span>
                        </UserTooltip>
                        {/* Outside the tooltip on purpose — its trigger takes a
                            single child, and the tag belongs beside the name
                            rather than inside what opens the card. */}
                        <GuildTagBadge badge={first.guildBadge} />
                        {supportMember && <SupportBadge member={supportMember} />}
                        <time
                          dateTime={entry.sentAt.toISOString()}
                          className='shrink-0 text-xs tabular-nums text-zinc-400'>
                          {format(entry.sentAt, "p", { locale: dateLocale })}
                        </time>
                      </div>
                    </header>

                    {entry.messages.map((msg, index) => (
                      <MessageRow
                        key={msg.id ?? `${entry.key}-${index}`}
                        msg={msg}
                        isMe={isMe}
                        isFirst={index === 0}
                        avatar={avatarFor(msg)}
                        tagsMe={
                          !isMe &&
                          !!(
                            msg.mentions?.some((m) => m.id === currentUserId) ||
                            msg.replyTo?.userId === currentUserId
                          )
                        }
                        isFlashing={flashMessageId === msg.id}
                        handlers={handlers}
                      />
                    ))}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {unseenCount > 0 && (
          <button
            type='button'
            onClick={jumpToLatest}
            className='absolute bottom-3 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-cyan-500 px-4 text-xs font-semibold text-black transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-200 active:click-behavior'>
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

      <ChatMessageMenu
        message={menuMessage}
        viewerId={currentUserId}
        onClose={() => setMenuMessage(null)}
        onReact={handlers.onReact}
        // Server events take reactions only — there is nobody to answer.
        onReply={
          menuMessage && (!menuMessage.type || menuMessage.type === "message")
            ? handlers.onReply
            : undefined
        }
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

      {activity && (
        <ActivityStartModal
          preview={activity}
          onClose={() => setActivity(null)}
        />
      )}

      <RecordingViewModal
        isOpen={!!recordingId}
        onClose={() => setRecordingId(null)}
        recordingId={recordingId}
      />
    </div>
  );
};

export default Chat;
