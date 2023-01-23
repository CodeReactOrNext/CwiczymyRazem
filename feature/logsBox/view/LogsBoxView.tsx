import { FaSpinner } from "react-icons/fa";
import { useState, useEffect } from "react";

import LogsBoxLayout from "layouts/LogsBoxLayout";

import {
  firebaseGetEvents,
  firebaseGetLogs,
} from "utils/firebase/client/firebase.utils";
import {
  FirebaseEventsInteface,
  FirebaseLogsInterface,
} from "utils/firebase/client/firebase.types";
import { useAppSelector } from "store/hooks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<FirebaseLogsInterface[] | null>(null);
  const [events, setEvents] = useState<FirebaseEventsInteface[] | null>(null);
  const userAchievement = useAppSelector(selectCurrentUserStats)?.achievements;

  useEffect(() => {
    firebaseGetLogs()
      .then((logsData) => {
        setLogs(logsData);
      })
      .catch((error) => {
        throw new Error(error);
      });

    firebaseGetEvents()
      .then((events) => setEvents(events))
      .catch((error) => {
        throw new Error(error);
      });
  }, []);

  return logs && events && userAchievement ? (
    <LogsBoxLayout
      logs={logs}
      events={events}
      userAchievements={userAchievement}
    />
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxView;
