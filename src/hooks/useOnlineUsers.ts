import { getDatabase, onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { firebaseApp, isDatabaseEnabled } from "utils/firebase/client/firebase.config";

export interface OnlineUser {
  uid: string;
  displayName: string;
  avatar: string;
  state: "online" | "offline";
  last_changed: number;
  currentActivity?: {
    planTitle: string;
    exerciseTitle: string;
    category?: string;
    timestamp: number;
  };
}

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  // We explicitly check purely for the ability to use the database
  const [isDbEnabled, setIsDbEnabled] = useState(true);

  // Listen to all users
  useEffect(() => {
    if (!isDatabaseEnabled) return;

    let db;
    try {
      db = getDatabase(firebaseApp);
    } catch {
      return;
    }

    const allStatusRef = ref(db, "status");
    const unsubscribe = onValue(allStatusRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const users: OnlineUser[] = (Object.values(val) as OnlineUser[]).filter(
          (u) => u.state === "online"
        );
        setOnlineUsers(users);
      } else {
        setOnlineUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return { onlineUsers, isDbEnabled };
};
