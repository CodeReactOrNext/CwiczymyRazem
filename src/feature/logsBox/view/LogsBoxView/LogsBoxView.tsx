import { FaSpinner } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import LogsBoxLayout from "layouts/LogsBoxLayout";

import { selectCurrentUserStats } from "feature/user/store/userSlice";
import {
  FirebaseDiscordEventsInteface,
  FirebaseEventsInteface,
  FirebaseLogsInterface,
} from "utils/firebase/client/firebase.types";
import {
  firebaseGetDiscordEvent,
  firebaseGetEvents,
  firebaseGetLogs,
} from "utils/firebase/client/firebase.utils";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<FirebaseLogsInterface[] | null>(null);
  const [events, setEvents] = useState<FirebaseEventsInteface[] | null>(null);
  const [discordEvent, setDiscordEvent] =
    useState<FirebaseDiscordEventsInteface | null>(null);
  const userAchievement = useAppSelector(selectCurrentUserStats)?.achievements;
  const { t } = useTranslation("toast");

  useEffect(() => {
    firebaseGetLogs()
      .then((logsData) => {
        setLogs(logsData);
      })
      .catch((error) => {
        toast.error(t("errors.fetch_error"));
      });

    firebaseGetEvents()
      .then((events) => {
        setEvents(events);
      })
      .catch((error) => {
        toast.error(t("errors.fetch_error"));
      });

    firebaseGetDiscordEvent()
      .then((events) => {
        setDiscordEvent(events ? events : null);
      })
      .catch((error) => {
        toast.error(t("errors.fetch_error"));
      });
  }, [t]);

  return logs && events && userAchievement ? (
    <LogsBoxLayout
      logs={logs}
      events={events}
      userAchievements={userAchievement}
      discordEvent={discordEvent}
    />
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxView;
