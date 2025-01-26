import type { FirebaseLogsInterface, FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";
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
    logs: (FirebaseLogsInterface | FirebaseLogsSongsInterface)[]
  ) => void
) => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("data", "desc"), limit(20));

  return onSnapshot(sortLogs, (snapshot) => {
    const logsArr: (FirebaseLogsInterface | FirebaseLogsSongsInterface)[] = [];

    snapshot.forEach((doc) => {
      const log = doc.data() as
        | FirebaseLogsInterface
        | FirebaseLogsSongsInterface;
      logsArr.push(log);
    });
    
    callback(logsArr);
  });
};

