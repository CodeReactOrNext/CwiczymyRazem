import { selectCurrentActivity, selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { getDatabase, onDisconnect, onValue, ref, serverTimestamp, set } from "firebase/database";
import { useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { firebaseApp } from "utils/firebase/client/firebase.config";

export const usePresence = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);
  const currentActivity = useAppSelector(selectCurrentActivity);

  useEffect(() => {
    if (!userAuth || !userInfo) return;

    let db;
    try {
      db = getDatabase(firebaseApp);
    } catch (error) {
      console.warn("Realtime Database not configured:", error);
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
          currentActivity: currentActivity || null,
        });
      }
    });

    return () => {
      unsubscribe();
      onDisconnect(userStatusRef).cancel();
      set(userStatusRef, null);
    };
  }, [userAuth, userInfo, currentActivity]);
};
