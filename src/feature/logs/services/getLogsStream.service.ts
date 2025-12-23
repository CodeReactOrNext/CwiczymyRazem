import type { 
  FirebaseLogsInterface, 
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface
} from "feature/logs/types/logs.type";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const firebaseGetLogsStream = (
  callback: (
    logs: (FirebaseLogsInterface | FirebaseLogsSongsInterface | FirebaseLogsTopPlayersInterface)[]
  ) => void
) => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("data", "desc"), limit(15));

  return onSnapshot(sortLogs, (snapshot) => {
    const logsArr: (FirebaseLogsInterface | FirebaseLogsSongsInterface | FirebaseLogsTopPlayersInterface)[] = [];

    snapshot.forEach((doc) => {
      const log = doc.data() as
        | FirebaseLogsInterface
        | FirebaseLogsSongsInterface
        | FirebaseLogsTopPlayersInterface;
      logsArr.push(log);
    });
    
    callback(logsArr);
  });
};

