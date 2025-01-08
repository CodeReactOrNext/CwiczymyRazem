import { FaSpinner } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import LogsBoxLayout from "layouts/LogsBoxLayout";

import { selectCurrentUserStats } from "feature/user/store/userSlice";
import {
  FirebaseEventsInteface,
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";
import {
  firebaseGetEvents,
  firebaseGetLogsStream,
} from "utils/firebase/client/firebase.utils";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<
    (FirebaseLogsSongsInterface | FirebaseLogsInterface)[] | null
  >(null);
  const [events, setEvents] = useState<FirebaseEventsInteface[] | null>(null);

  const userAchievement = useAppSelector(selectCurrentUserStats)?.achievements;
  const { t } = useTranslation("toast");

  useEffect(() => {
    // Subscribe to real-time logs updates
    const unsubscribe = firebaseGetLogsStream((logsData) => {
      setLogs(logsData);
    });

    firebaseGetEvents()
      .then((events) => {
        setEvents(events);
      })
      .catch((error) => {
        toast.error(t("errors.fetch_error"));
      });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [t]);

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
