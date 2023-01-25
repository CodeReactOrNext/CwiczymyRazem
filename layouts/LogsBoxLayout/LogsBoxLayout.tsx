import { useState } from "react";
import { useTranslation } from "react-i18next";

import Logs from "./components/Logs";
import EventsList from "./components/EventsList";
import AchievementsMap from "./components/AchievementsMap";
import LogsBoxButton from "./components/LogsBoxButton";

import { AchievementList } from "assets/achievements/achievementsData";
import {
  FirebaseEventsInteface,
  FirebaseLogsInterface,
} from "utils/firebase/client/firebase.types";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[];
  events: FirebaseEventsInteface[];
  userAchievements: AchievementList[];
}

const LogsBoxLayout = ({
  logs,
  events,
  userAchievements,
}: LogsBoxLayoutProps) => {
  const [showedCategory, setShowedCategory] = useState<
    "logs" | "events" | "achievements"
  >("logs");

  const { t } = useTranslation("common");
  return (
    <div className='relative order-4 row-span-1 m-4 mt-5 flex h-80 flex-col border-4 border-second-400 bg-main-opposed-500/80 p-1 font-openSans text-xs leading-5 radius-default xs:p-5 xs:pb-0 md:mt-0 lg:text-sm'>
      <div className='sticky top-0 left-0 flex flex-row gap-4 border-b-2 border-main-opposed-500 font-bold'>
        <LogsBoxButton
          title={t("logsBox.logs")}
          active={showedCategory === "logs"}
          onClick={() => setShowedCategory("logs")}
        />
        <LogsBoxButton
          title={t("logsBox.events")}
          active={showedCategory === "events"}
          onClick={() => setShowedCategory("events")}
        />
        <LogsBoxButton
          title={t("logsBox.achievements_map")}
          active={showedCategory === "achievements"}
          onClick={() => setShowedCategory("achievements")}
        />
      </div>
      <div className='overflow-scroll'>
        {showedCategory === "achievements" && (
          <AchievementsMap userAchievements={userAchievements} />
        )}
        {showedCategory === "events" && <EventsList eventList={events} />}
        {showedCategory === "logs" && logs && <Logs logs={logs} />}
      </div>
    </div>
  );
};

export default LogsBoxLayout;
