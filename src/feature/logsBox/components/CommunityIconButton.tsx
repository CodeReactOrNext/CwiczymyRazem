import { useUnreadMessages as useUnreadChatMessages } from "feature/chat/hooks/useUnreadMessages";
import { guildChatPath } from "feature/chat/services/chatService";
import { useUnreadMessages } from "feature/logs/hooks/useUnreadMessages";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { selectUserGuildBadge } from "feature/user/store/userSlice";
import { MessagesSquare } from "lucide-react";
import { useAppSelector } from "store/hooks";

interface CommunityIconButtonProps {
  /** Runs before the drawer opens — the mobile sidebar closes itself here. */
  onOpen?: () => void;
}

/**
 * Opens the activity feed and chats from the sidebar, next to the notifications bell and built the
 * same way: a square with its signals pinned to the corners, so the pair fits beside the logo.
 * The cyan count is new feed entries; the red dot is an unread message in the global or guild
 * chat — kept apart because a person writing to you asks for more than another logged session.
 */
export const CommunityIconButton = ({ onOpen }: CommunityIconButtonProps) => {
  const setOpen = useCommunityDrawer((state) => state.setOpen);
  const { unreadCount } = useUnreadMessages();

  const guildBadge = useAppSelector(selectUserGuildBadge);
  const { hasNewMessages: hasNewChat } = useUnreadChatMessages("chats");
  const { hasNewMessages: hasNewGuild } = useUnreadChatMessages(
    guildBadge?.guildId ? guildChatPath(guildBadge.guildId) : null,
  );
  const hasUnreadMessage = hasNewChat || hasNewGuild;

  const label = [
    "Activity and chat",
    unreadCount > 0 && `${unreadCount} new in the feed`,
    hasUnreadMessage && "unread messages",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type='button'
      onClick={() => {
        onOpen?.();
        setOpen(true);
      }}
      title='Activity & Chat'
      aria-label={label}
      className='group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[8px] bg-white/5 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/20 hover:bg-white/10'>
      <MessagesSquare className='h-4 w-4 text-zinc-400 transition-colors group-hover:text-white' />
      {unreadCount > 0 && (
        <span className='absolute right-0.5 top-0.5 flex h-4 min-w-[16px] select-none items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-none text-zinc-950'>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      {hasUnreadMessage && (
        <span className='absolute left-1 top-1 h-2 w-2 rounded-full bg-red-500' />
      )}
    </button>
  );
};
