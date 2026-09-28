import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Changelog, {
  hasRecentChanges,
  useChangelogData,
} from "components/Changelog/Changelog";
import { tabNavListClass } from "components/PageTabs/tabNav";
import Chat from "feature/chat/Chat";
import { useUnreadMessages as useUnreadChatMessages } from "feature/chat/hooks/useUnreadMessages";
import { guildChatPath } from "feature/chat/services/chatService";
import { useUnreadMessages } from "feature/logs/hooks/useUnreadMessages";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import {
  type CommunityTab,
  useCommunityDrawer,
} from "feature/logsBox/hooks/useCommunityDrawer";
import { selectUserGuildBadge } from "feature/user/store/userSlice";
import { AnimatePresence, m } from "framer-motion";
import LogsBoxButton from "layouts/LogsBoxLayout/components/LogsBoxButton";
import {
  feedScrollClass,
  PANEL_SCROLL_CLASS,
  panelHeightClass,
} from "layouts/LogsBoxLayout/logsBoxPanel";
import { useState } from "react";
import { FiBook } from "react-icons/fi";
import { IoChatboxEllipses } from "react-icons/io5";
import { LuLogs, LuShield } from "react-icons/lu";
import { useAppSelector } from "store/hooks";

import Logs from "./components/Logs";

type Category = CommunityTab;

interface LogsBoxLayoutProps {
  logs: AnyFirebaseLog[];
  currentUserId: string;
  className?: string; // Allow custom styles
  hasOlderLogs?: boolean;
  hasMoreLogs?: boolean;
  onLoadMoreLogs?: () => void;
  /**
   * The panel fills a box it doesn't own — the sidebar drawer — so every tab scrolls inside it
   * instead of growing the page. The height comes from `className`.
   */
  contained?: boolean;
}

const LogsBoxLayout = ({
  logs,
  currentUserId,
  className = "",
  hasOlderLogs = false,
  hasMoreLogs = false,
  onLoadMoreLogs,
  contained = false,
}: LogsBoxLayoutProps) => {
  const [localCategory, setLocalCategory] = useState<Category>("logs");
  // In the drawer the tab lives in its store: it outlasts closing the drawer, and a chat
  // notification can open the drawer straight on its room.
  const drawerTab = useCommunityDrawer((state) => state.tab);
  const setDrawerTab = useCommunityDrawer((state) => state.setTab);
  const showedCategory = contained ? drawerTab : localCategory;
  const setShowedCategory = contained ? setDrawerTab : setLocalCategory;
  const [changelogDotHidden, setChangelogDotHidden] = useState(false);

  const guildBadge = useAppSelector(selectUserGuildBadge);
  const guildPath = guildBadge?.guildId
    ? guildChatPath(guildBadge.guildId)
    : null;

  // Leaving the guild while its tab is open falls back to the feed.
  const activeCategory =
    showedCategory === "guild" && !guildPath ? "logs" : showedCategory;

  const {
    unreadCount: unreadLogs,
    hasNewMessages: hasNewLogs,
    markAsRead: markLogsAsRead,
  } = useUnreadMessages();

  const {
    unreadCount: unreadChats,
    hasNewMessages: hasNewChats,
    markAsRead: markChatsAsRead,
  } = useUnreadChatMessages("chats");

  const {
    unreadCount: unreadGuild,
    hasNewMessages: hasNewGuild,
    markAsRead: markGuildAsRead,
  } = useUnreadChatMessages(guildPath);

  const { changelog } = useChangelogData("2026-05");

  // Wyliczane w renderze: na serwerze i przed dociągnięciem changeloga jest
  // false, więc nie ma hydration mismatch (fetch i tak kończy się po mount).
  const hasNewChangelog =
    !changelogDotHidden &&
    typeof window !== "undefined" &&
    !!changelog?.entries &&
    hasRecentChanges(changelog.entries);

  // The drawer is for people, not release notes — the changelog stays on the dashboard.
  const showsChangelog = !contained && !className.includes("border-none");

  const handleCategoryChange = (category: Category) => {
    // A chat room counts as read both on the way in and on the way out, so
    // what arrived while it was open doesn't come back as unread.
    if (category === "guild" || activeCategory === "guild") {
      markGuildAsRead();
    }
    if (category === "chat" || activeCategory === "chat") {
      markChatsAsRead();
    } else if (category === "logs") {
      markLogsAsRead();
    } else if (category === "changelog") {
      // Zapis "przeczytane" robi sam <Changelog/> po zamontowaniu — dzięki temu
      // przy tym otwarciu wpisy są jeszcze podświetlone, a znikną od następnego.
      setChangelogDotHidden(true);
    }
    setShowedCategory(category);
  };

  const tabButtons = (
    <>
      <LogsBoxButton
        title='Activity'
        active={activeCategory === "logs"}
        onClick={() => handleCategoryChange("logs")}
        Icon={LuLogs}
        notificationCount={unreadLogs}
        hasNewMessages={hasNewLogs}
      />
      <LogsBoxButton
        title='Chat'
        active={activeCategory === "chat"}
        onClick={() => handleCategoryChange("chat")}
        Icon={IoChatboxEllipses}
        notificationCount={unreadChats}
        hasNewMessages={hasNewChats}
      />
      {guildPath && (
        <LogsBoxButton
          title='Guild'
          active={activeCategory === "guild"}
          onClick={() => handleCategoryChange("guild")}
          Icon={LuShield}
          notificationCount={unreadGuild}
          hasNewMessages={hasNewGuild}
        />
      )}
      {showsChangelog && (
        <LogsBoxButton
          title='Changelog'
          active={activeCategory === "changelog"}
          onClick={() => handleCategoryChange("changelog")}
          Icon={FiBook}
          hasNewDot={hasNewChangelog}
        />
      )}
    </>
  );

  // On phones the panel is a screen-sized box whatever the tab, so the chat's composer and the
  // feed's tab rail stay on screen instead of being pushed down the page — see `logsBoxPanel`.
  const heightClass = panelHeightClass({
    tab: activeCategory,
    hasOwnHeight: className.includes("h-"),
  });

  // Inside a bounded box a tab scrolls on its own instead of the page.
  const scrollClass = feedScrollClass(contained);

  return (
    <Card
      className={`relative m-auto flex ${heightClass} font-openSans flex-col p-1 ${className.includes("border-none") ? "pb-24" : "pb-3"} rounded-xl text-xs leading-5 xs:p-5 xs:pb-0 md:mt-0 lg:text-sm xl:w-[100%] ${className}`}>
      <div className={cn(tabNavListClass, "mb-4")}>
        {tabButtons}
      </div>
      <AnimatePresence mode='wait' initial={false}>
        {activeCategory === "changelog" && (
          <m.div
            key='changelog'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn("mb-2 p-4", PANEL_SCROLL_CLASS)}>
            <Changelog month='2026-05' />
          </m.div>
        )}
        {activeCategory === "logs" && (
          <m.div
            key='logs'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn("mb-2", scrollClass)}>
            {logs && (
              <div onClick={markLogsAsRead}>
                <Logs
                  logs={logs}
                  marksLogsAsRead={markLogsAsRead}
                  currentUserId={currentUserId}
                  hasOlderLogs={hasOlderLogs}
                  hasMoreLogs={hasMoreLogs}
                  onLoadMoreLogs={onLoadMoreLogs}
                />
              </div>
            )}
          </m.div>
        )}
        {activeCategory === "chat" && (
          <m.div
            key='chat'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className='mb-2 min-h-0 flex-1'>
            <Chat />
          </m.div>
        )}
        {activeCategory === "guild" && guildPath && (
          <m.div
            key='guild'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className='mb-2 min-h-0 flex-1'>
            <Chat chatPath={guildPath} />
          </m.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LogsBoxLayout;
