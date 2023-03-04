import { useState } from "react";
import { useTranslation } from "react-i18next";

import Logs from "./components/Logs";
import EventsList from "./components/EventsList";
import AchievementsMap from "./components/AchievementsMap";
import LogsBoxButton from "./components/LogsBoxButton";

import { AchievementList } from "assets/achievements/achievementsData";
import {
  FirebaseDiscordEventsInteface,
  FirebaseEventsInteface,
  FirebaseLogsInterface,
} from "utils/firebase/client/firebase.types";
import DiscordEvent from "./components/DiscordEvent";
import { MdEmojiEvents } from "react-icons/md";
import { FaExternalLinkSquareAlt, FaGuitar, FaMedal } from "react-icons/fa";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[];
  events: FirebaseEventsInteface[];
  discordEvent: FirebaseDiscordEventsInteface | null;
  userAchievements: AchievementList[];
}

const LogsBoxLayout = ({
  logs,
  events,
  userAchievements,
  discordEvent,
}: LogsBoxLayoutProps) => {
  const [showedCategory, setShowedCategory] = useState<
    "logs" | "events" | "achievements" | "discord"
  >("logs");

  const { t } = useTranslation("common");
  return (
    <div className='relative m-auto mt-5 flex h-80 flex-col border-4 border-second-400/60 bg-main-opposed-500/80 p-1 font-openSans text-xs leading-5 radius-default xs:p-5 xs:pb-0 md:mt-0 lg:text-sm xl:max-w-[70%]'>
      <div className='sticky top-0 left-0 flex flex-row  justify-around gap-4 border-b-2 border-main-opposed-500 font-bold'>
        <LogsBoxButton
          title={t("logsBox.logs")}
          active={showedCategory === "logs"}
          onClick={() => setShowedCategory("logs")}
          Icon={FaGuitar}
        />
        <LogsBoxButton
          title={t("logsBox.events")}
          active={showedCategory === "events"}
          onClick={() => setShowedCategory("events")}
          Icon={FaExternalLinkSquareAlt}
        />
        <LogsBoxButton
          title={t("logsBox.achievements_map")}
          active={showedCategory === "achievements"}
          onClick={() => setShowedCategory("achievements")}
          Icon={FaMedal}
        />
        <LogsBoxButton
          title={"Discord Event"}
          active={showedCategory === "discord"}
          onClick={() => setShowedCategory("discord")}
          Icon={MdEmojiEvents}
        />
      </div>
      <div className='overflow-x-scroll scrollbar-thin scrollbar-thumb-second-200'>
        {showedCategory === "achievements" && (
          <AchievementsMap userAchievements={userAchievements} />
        )}
        {showedCategory === "events" && <EventsList eventList={events} />}
        {showedCategory === "logs" && logs && <Logs logs={logs} />}
        {showedCategory === "discord" && logs && (
          <DiscordEvent discordEvent={discordEvent ? discordEvent : null} />
        )}
      </div>
    </div>
  );
};

export default LogsBoxLayout;
