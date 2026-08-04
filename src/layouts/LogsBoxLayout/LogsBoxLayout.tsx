import { Card } from "assets/components/ui/card";
import Changelog, {
  hasRecentChanges,
  useChangelogData,
} from "components/Changelog/Changelog";
import type { AchievementList } from "feature/achievements/types";
import DiscordChatEmbed from "feature/discordBot/components/DiscordChatEmbed";
import { useUnreadMessages } from "feature/logs/hooks/useUnreadMessages";
import type {
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import AchievementsMap from "layouts/LogsBoxLayout/components/AchievementsMap";
import LogsBoxButton from "layouts/LogsBoxLayout/components/LogsBoxButton";
import { useState } from "react";
import { FaDiscord, FaGuitar, FaMedal } from "react-icons/fa";
import { FiBook } from "react-icons/fi";

import Logs from "./components/Logs";

interface LogsBoxLayoutProps {
  logs: (
    | FirebaseLogsSongsInterface
    | FirebaseLogsInterface
    | FirebaseLogsTopPlayersInterface
    | FirebaseLogsMarketplaceInterface
  )[];
  userAchievements: AchievementList[];
  currentUserId: string;
  className?: string; // Allow custom styles
}

const LogsBoxLayout = ({
  logs,
  userAchievements,
  currentUserId,
  className = "",
}: LogsBoxLayoutProps) => {
  const [showedCategory, setShowedCategory] = useState<
    "logs" | "achievements" | "discord" | "excerise" | "changelog"
  >("logs");
  const [changelogDotHidden, setChangelogDotHidden] = useState(false);

  const {
    unreadCount: unreadLogs,
    hasNewMessages: hasNewLogs,
    markAsRead: markLogsAsRead,
  } = useUnreadMessages();

  const { changelog } = useChangelogData("2026-05");

  // Wyliczane w renderze: na serwerze i przed dociągnięciem changeloga jest
  // false, więc nie ma hydration mismatch (fetch i tak kończy się po mount).
  const hasNewChangelog =
    !changelogDotHidden &&
    typeof window !== "undefined" &&
    !!changelog?.entries &&
    hasRecentChanges(changelog.entries);

  const { t } = useTranslation("common");

  const handleCategoryChange = (category: typeof showedCategory) => {
    if (category === "logs") {
      markLogsAsRead();
    } else if (category === "changelog") {
      // Zapis "przeczytane" robi sam <Changelog/> po zamontowaniu — dzięki temu
      // przy tym otwarciu wpisy są jeszcze podświetlone, a znikną od następnego.
      setChangelogDotHidden(true);
    }
    setShowedCategory(category);
  };

  return (
    <Card
      className={`relative m-auto flex ${
        showedCategory !== "achievements" && !className.includes("h-")
          ? "sm:h-[650px] lg:h-[800px]"
          : ""
      } font-openSans flex-col p-1 ${className.includes("border-none") ? "pb-24" : "pb-3"} rounded-xl text-xs leading-5 xs:p-5 xs:pb-0 md:mt-0 lg:text-sm xl:w-[100%] ${className}`}>
      <div className='left-0 top-0 mb-2 flex flex-row justify-around gap-4 font-bold'>
        <LogsBoxButton
          title='Activity'
          active={showedCategory === "logs"}
          onClick={() => handleCategoryChange("logs")}
          Icon={FaGuitar}
          notificationCount={unreadLogs}
          hasNewMessages={hasNewLogs}
        />
        <LogsBoxButton
          title='Discord'
          active={showedCategory === "discord"}
          onClick={() => handleCategoryChange("discord")}
          Icon={FaDiscord}
        />
        {!className.includes("border-none") && (
          <>
            <LogsBoxButton
              title={t("logsBox.achievements_map")}
              active={showedCategory === "achievements"}
              onClick={() => handleCategoryChange("achievements")}
              Icon={FaMedal}
            />
            <LogsBoxButton
              title='Changelog'
              active={showedCategory === "changelog"}
              onClick={() => handleCategoryChange("changelog")}
              Icon={FiBook}
              hasNewDot={hasNewChangelog}
            />
          </>
        )}
      </div>
      <AnimatePresence mode='wait' initial={false}>
        {showedCategory === "achievements" && (
          <m.div
            key='achievements'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}>
            <AchievementsMap userAchievements={userAchievements} />
          </m.div>
        )}
        {showedCategory === "changelog" && (
          <m.div
            key='changelog'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className='mb-2 overflow-visible p-4 scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600 sm:h-full sm:overflow-y-auto'>
            <Changelog month='2026-05' />
          </m.div>
        )}
        {(showedCategory === "logs" || showedCategory === "discord") && (
          <m.div
            key={showedCategory}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className='mb-2 overflow-visible scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600 sm:h-full sm:overflow-y-auto'>
            {showedCategory === "logs" && logs && (
              <div onClick={markLogsAsRead}>
                <Logs
                  logs={logs}
                  marksLogsAsRead={markLogsAsRead}
                  currentUserId={currentUserId}
                />
              </div>
            )}

            {showedCategory === "discord" && <DiscordChatEmbed />}
          </m.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LogsBoxLayout;
