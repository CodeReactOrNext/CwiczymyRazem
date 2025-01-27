import { firebaseGetLogsStream } from "feature/logs/services/getLogsStream.service";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import LogsBoxLayout from "layouts/LogsBoxLayout";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSpinner } from "react-icons/fa";
import { useAppSelector } from "store/hooks";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<
    (FirebaseLogsSongsInterface | FirebaseLogsInterface)[] | null
  >(null);

  const userAchievement = useAppSelector(selectCurrentUserStats)?.achievements;
  const { t } = useTranslation("toast");

  useEffect(() => {
    // Subscribe to real-time logs updates
    const unsubscribe = firebaseGetLogsStream((logsData) => {
      setLogs(logsData);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [t]);

  return logs && userAchievement ? (
    <LogsBoxLayout logs={logs} userAchievements={userAchievement} />
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxView;
