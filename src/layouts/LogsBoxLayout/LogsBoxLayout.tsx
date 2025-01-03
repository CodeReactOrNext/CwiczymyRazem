import { useState } from "react";
import { useTranslation } from "react-i18next";

import Logs from "./components/Logs";
import AchievementsMap from "./components/AchievementsMap";
import LogsBoxButton from "./components/LogsBoxButton";
import ExerciseBox from "../../feature/exercisePlan/view/ExerciseBox";

import { AchievementList } from "assets/achievements/achievementsData";
import {
  FirebaseEventsInteface,
  FirebaseLogsInterface,
} from "utils/firebase/client/firebase.types";
import { TbNews } from "react-icons/tb";
import { FaGuitar, FaMedal, FaTasks } from "react-icons/fa";
import Changelog from "./components/Changelog";
import { changelogEntries } from "changelogEntries";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[];
  events: FirebaseEventsInteface[];
  userAchievements: AchievementList[];
}

const LogsBoxLayout = ({ logs, userAchievements }: LogsBoxLayoutProps) => {
  const [showedCategory, setShowedCategory] = useState<
    "logs" | "achievements" | "discord" | "excerise"
  >("logs");

  const { t } = useTranslation("common");
  return (
    <div className='relative m-auto mt-5 flex h-[600px] flex-col border border-second-400/60 bg-second-500/80 p-1 font-openSans text-xs leading-5 radius-default xs:p-5 xs:pb-0 md:mt-0 lg:text-sm xl:w-[100%]'>
      <div className='sticky top-0 left-0 flex flex-row  justify-around gap-4 p-2  font-bold'>
        <LogsBoxButton
          title={t("logsBox.logs")}
          active={showedCategory === "logs"}
          onClick={() => setShowedCategory("logs")}
          Icon={FaGuitar}
        />

        <LogsBoxButton
          title={t("logsBox.achievements_map")}
          active={showedCategory === "achievements"}
          onClick={() => setShowedCategory("achievements")}
          Icon={FaMedal}
        />
        <LogsBoxButton
          title={"Plany Ćwiczeń"}
          active={showedCategory === "excerise"}
          onClick={() => setShowedCategory("excerise")}
          Icon={FaTasks}
        />
        <LogsBoxButton
          title={"Changelog"}
          active={showedCategory === "discord"}
          onClick={() => setShowedCategory("discord")}
          Icon={TbNews}
        />
      </div>
      {showedCategory === "achievements" && (
        <AchievementsMap userAchievements={userAchievements} />
      )}
      <div className='h-full overflow-x-scroll scrollbar-thin scrollbar-thumb-second-200'>
        {showedCategory === "logs" && logs && <Logs logs={logs} />}
        {showedCategory === "excerise" && logs && <ExerciseBox />}
        {showedCategory === "discord" && logs && (
          <Changelog entries={changelogEntries} />
        )}
      </div>
    </div>
  );
};

export default LogsBoxLayout;
