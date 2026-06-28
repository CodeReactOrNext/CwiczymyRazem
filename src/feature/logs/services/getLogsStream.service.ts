import type {
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
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
    logs: (FirebaseLogsInterface | FirebaseLogsSongsInterface | FirebaseLogsTopPlayersInterface | FirebaseLogsMarketplaceInterface)[]
  ) => void
) => {
  const logsDocRef = collection(db, "logs");
  const sortLogs = query(logsDocRef, orderBy("timestamp", "desc"), limit(15));

  return onSnapshot(sortLogs, (snapshot) => {
    const logsArr: (FirebaseLogsInterface | FirebaseLogsSongsInterface | FirebaseLogsTopPlayersInterface | FirebaseLogsMarketplaceInterface)[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const log = {
        ...data,
        id: doc.id
      } as (FirebaseLogsInterface | FirebaseLogsSongsInterface | FirebaseLogsTopPlayersInterface | FirebaseLogsMarketplaceInterface) & { id: string };
      logsArr.push(log);
    });

    callback(logsArr);
  }, (error) => {
    console.error("Logs stream listener failed:", error);
    callback([]);
  });
};

