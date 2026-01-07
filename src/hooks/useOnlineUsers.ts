import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { firebaseApp } from "utils/firebase/client/firebase.cofig";
import { useAppSelector } from "store/hooks";
import { selectUserInfo, selectUserAuth } from "feature/user/store/userSlice";

export interface OnlineUser {
  uid: string;
  displayName: string;
  avatar: string;
  state: "online" | "offline";
  last_changed: number;
}

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  // We explicitly check purely for the ability to use the database
  const [isDbEnabled, setIsDbEnabled] = useState(true);

  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);

  // Manage own presence
  useEffect(() => {
    if (!userAuth || !userInfo) return;

    let db;
    try {
      db = getDatabase(firebaseApp);
    } catch (error) {
      console.warn("Realtime Database not configured:", error);
      setIsDbEnabled(false);
      return;
    }

    const connectedRef = ref(db, ".info/connected");
    const userStatusRef = ref(db, `status/${userAuth}`);

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When I disconnect, remove this device
        onDisconnect(userStatusRef).remove();

        // Set user as online
        set(userStatusRef, {
          uid: userAuth,
          displayName: userInfo.displayName,
          avatar: userInfo.avatar,
          state: "online",
          last_changed: serverTimestamp(),
        });
      }
    });

    return () => {
      unsubscribe();
      // Optionally remove status on unmount, but onDisconnect handles the important part (tab close)
      // If we remove here, navigating between pages might flicker presence if the hook remounts.
      // Ideally this hook should be global or checking if we are truly leaving.
      // giving that it's just a hook, we better let onDisconnect handle it or set it to offline if we want strict window tracking
    };
  }, [userAuth, userInfo]);

  // Listen to all users
  useEffect(() => {
    let db;
    try {
      db = getDatabase(firebaseApp);
    } catch (e) {
      return;
    }

    const allStatusRef = ref(db, "status");
    const unsubscribe = onValue(allStatusRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const users: OnlineUser[] = Object.values(val);
        setOnlineUsers(users);
      } else {
        setOnlineUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return { onlineUsers, isDbEnabled };
};
