import { selectCurrentActivity, selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { getDatabase, onDisconnect, onValue, ref, serverTimestamp, set } from "firebase/database";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useEffect } from "react";
import { useAppSelector } from "store/hooks";
import type { CurrentActivityInterface } from "types/api.types";
import { firebaseApp, isDatabaseEnabled } from "utils/firebase/client/firebase.config";

/**
 * The Realtime Database refuses a write that holds an `undefined` anywhere — and a refused presence
 * write takes the player out of "Live now" altogether — so optional ids that came out empty go.
 */
export const toPresenceActivity = (
  activity: CurrentActivityInterface | null
): CurrentActivityInterface | null =>
  activity
    ? (Object.fromEntries(
        Object.entries(activity).filter(([, value]) => value !== undefined)
      ) as unknown as CurrentActivityInterface)
    : null;

export const usePresence = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);
  const currentActivity = useAppSelector(selectCurrentActivity);
  const { isElectron } = useElectronWindowControls();

  useEffect(() => {
    if (!userAuth || !userInfo || !isDatabaseEnabled) return;

    let db;
    try {
      db = getDatabase(firebaseApp);
    } catch (error) {
      console.warn("Realtime Database not configured:", error);
      return;
    }

    const connectedRef = ref(db, ".info/connected");
    const userStatusRef = ref(db, `status/${userAuth}`);

    const setOnline = () => {
      onDisconnect(userStatusRef).remove();
      set(userStatusRef, {
        uid: userAuth,
        displayName: userInfo.displayName,
        avatar: userInfo.avatar,
        state: "online",
        last_changed: serverTimestamp(),
        currentActivity: toPresenceActivity(currentActivity),
        platform: isElectron ? "desktop" : "web",
      });
      fetch("/api/presence/cleanup", { method: "POST" }).catch(() => {});
    };

    const setOffline = () => {
      onDisconnect(userStatusRef).cancel();
      set(userStatusRef, null);
    };

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true && !document.hidden) {
        setOnline();
      }
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      setOffline();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userAuth, userInfo, currentActivity, isElectron]);
};
