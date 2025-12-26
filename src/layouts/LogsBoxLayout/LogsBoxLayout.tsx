import type { AchievementList } from "feature/achievements/achievementsData";
import { useUnreadMessages } from "feature/chat/hooks/useUnreadMessages";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import AchievementsMap from "layouts/LogsBoxLayout/components/AchievementsMap";
import LogsBoxButton from "layouts/LogsBoxLayout/components/LogsBoxButton";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGuitar, FaMedal } from "react-icons/fa";
import { IoChatboxEllipses } from "react-icons/io5";

import Chat from "../../feature/chat/Chat";
import Logs from "./components/Logs";
import { Card } from "assets/components/ui/card";

export interface LogsBoxLayoutProps {
  logs: (
    | FirebaseLogsSongsInterface
    | FirebaseLogsInterface
    | FirebaseLogsTopPlayersInterface
  )[];
  userAchievements: AchievementList[];
  currentUserId: string;
}

const LogsBoxLayout = ({ logs, userAchievements, currentUserId }: LogsBoxLayoutProps) => {
  const [showedCategory, setShowedCategory] = useState<
    "logs" | "achievements" | "discord" | "excerise" | "chat"
  >("logs");

  const {
    unreadCount: unreadChats,
    hasNewMessages: hasNewChats,
    markAsRead: markChatsAsRead,
  } = useUnreadMessages("chats");

  const {
    unreadCount: unreadLogs,
    hasNewMessages: hasNewLogs,
    markAsRead: markLogsAsRead,
  } = useUnreadMessages("logs");

  const { t } = useTranslation("common");

  const handleCategoryChange = (category: typeof showedCategory) => {
    if (category === "chat" || showedCategory === "chat") {
      markChatsAsRead();
    } else if (category === "logs") {
      markLogsAsRead();
    }
    setShowedCategory(category);
  };

  return (
    <Card
      className={`relative m-auto  flex ${
        showedCategory !== "achievements" && "h-[600px]"
      } font-openSans flex-col p-1 pb-3 text-xs leading-5 radius-default xs:p-5 xs:pb-0 md:mt-0 lg:text-sm xl:w-[100%]`}>
      <div className=' left-0 top-0 flex flex-row  justify-around gap-4  font-bold'>
        <LogsBoxButton
          title={t("logsBox.logs")}
          active={showedCategory === "logs"}
          onClick={() => handleCategoryChange("logs")}
          Icon={FaGuitar}
          notificationCount={showedCategory === "chat" ? 0 : unreadLogs}
          hasNewMessages={showedCategory === "chat" ? false : hasNewLogs}
        />
        <LogsBoxButton
          title='Chat'
          active={showedCategory === "chat"}
          onClick={() => handleCategoryChange("chat")}
          Icon={IoChatboxEllipses}
          notificationCount={unreadChats}
          hasNewMessages={hasNewChats}
        />
        <LogsBoxButton
          title={t("logsBox.achievements_map")}
          active={showedCategory === "achievements"}
          onClick={() => handleCategoryChange("achievements")}
          Icon={FaMedal}
        />
      </div>
      {showedCategory === "achievements" && (
        <AchievementsMap userAchievements={userAchievements} />
      )}
      <div className='h-full overflow-x-scroll scrollbar-thin scrollbar-thumb-second-200'>
        {showedCategory === "logs" && logs && (
          <div onClick={markLogsAsRead}>
            <Logs 
              logs={logs} 
              marksLogsAsRead={markLogsAsRead} 
              currentUserId={currentUserId}
            />
          </div>
        )}

        {showedCategory === "chat" && <Chat />}
      </div>
    </Card>
  );
};

export default LogsBoxLayout;
