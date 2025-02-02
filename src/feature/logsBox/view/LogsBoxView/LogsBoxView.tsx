import { firebaseGetLogsStream } from "feature/logs/services/getLogsStream.service";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import LogsBoxLayout from "layouts/LogsBoxLayout";
import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useAppSelector } from "store/hooks";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<
    (FirebaseLogsSongsInterface | FirebaseLogsInterface)[] | null
  >(null);

  const userAchievement = useAppSelector(selectCurrentUserStats)?.achievements;

  useEffect(() => {
    const unsubscribe = firebaseGetLogsStream((logsData) => {
      setLogs(logsData);
    });

    return () => unsubscribe();
  }, []);

  return logs && userAchievement ? (
    <LogsBoxLayout logs={logs} userAchievements={userAchievement} />
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxView;
