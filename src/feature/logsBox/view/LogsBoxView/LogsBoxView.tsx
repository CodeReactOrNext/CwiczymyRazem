import { firebaseGetLogsStream } from "feature/logs/services/getLogsStream.service";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import LogsBoxLayout from "layouts/LogsBoxLayout";
import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useAppSelector } from "store/hooks";

const LogsBoxView = ({ className }: { className?: string }) => {
  const [logs, setLogs] = useState<
    (FirebaseLogsSongsInterface | FirebaseLogsInterface | FirebaseLogsTopPlayersInterface)[] | null
  >(null);

  const userStats = useAppSelector(selectCurrentUserStats);
  const currentUserId = useAppSelector(selectUserAuth);
  const userAchievement = userStats?.achievements;

  useEffect(() => {
    const unsubscribe = firebaseGetLogsStream((logsData) => {
      return setLogs(logsData);
    });

    return () => unsubscribe();
  }, []);

  return logs && userAchievement && currentUserId ? (
    <LogsBoxLayout 
      logs={logs} 
      userAchievements={userAchievement} 
      currentUserId={currentUserId}
      className={className}
    />
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxView;
