import { useState } from "react";

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
  return (
    <div className='line order-4 row-span-1 m-4 mt-5 h-80 overflow-scroll border-4 border-second-400 bg-main-opposed bg-opacity-80 p-1 font-openSans text-xs leading-5 radius-default xs:p-3 sm:p-5 md:mt-0 lg:text-sm'>
      <div className='flex flex-row gap-4 border-b-2 border-main-opposed-500  font-bold'>
        <LogsBoxButton
          title={"Logs"}
          active={showedCategory === "logs"}
          onClick={() => setShowedCategory("logs")}
        />
        <LogsBoxButton
          title={"Events"}
          active={showedCategory === "events"}
          onClick={() => setShowedCategory("events")}
        />
        <LogsBoxButton
          title={" Achievements Map"}
          active={showedCategory === "achievements"}
          onClick={() => setShowedCategory("achievements")}
        />
      </div>
      {showedCategory === "achievements" && (
        <AchievementsMap userAchievements={userAchievements} />
      )}
      {showedCategory === "events" && <EventsList eventList={events} />}
      {showedCategory === "logs" && logs && <Logs logs={logs} />}
    </div>
  );
};

export default LogsBoxLayout;
