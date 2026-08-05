import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const firebaseGetLogsStream = (
  callback: (logs: AnyFirebaseLog[]) => void,
  logsLimit = 20
) => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("timestamp", "desc"), limit(logsLimit));

  return onSnapshot(sortLogs, (snapshot) => {
    const logsArr: AnyFirebaseLog[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const log = {
        ...data,
        id: doc.id
      } as AnyFirebaseLog & { id: string };
      logsArr.push(log);
    });

    callback(logsArr);
  }, (error) => {
    console.error("Logs stream listener failed:", error);
    callback([]);
  });
};
