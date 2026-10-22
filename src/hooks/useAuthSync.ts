import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import {
  restoreUserSnapshot,
  selectCurrentUserStats,
  selectIsUserSnapshot,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { autoLogIn } from "feature/user/store/userSlice.asyncThunk";
import { initializeDailyQuestAction } from "feature/user/store/userSlice.questActions";
import {
  clearUserSnapshot,
  readUserSnapshot,
  writeUserSnapshot,
} from "feature/user/store/userSnapshot";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "store/store";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

// Immediate retries; past them, a failure that isn't a refusal waits for the
// connection (see the sync effect).
const MAX_RETRIES = 2;
const RETRY_DELAY = 5000;
const MAX_RETRY_DELAY = 60000;
// Keep this well under any user's patience. Firebase auth restore is normally
// sub-second; a long wait here means the network is dropping the token refresh,
// and we'd rather retry than spin forever.
const AUTH_STATE_TIMEOUT = 10000;
// The profile changes in bursts (a finished session touches several fields);
// one write after it settles is enough.
const SNAPSHOT_WRITE_DELAY = 1000;

const useAuthSync = () => {
  const { data: session, status } = useSession();
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const userStats = useSelector(selectCurrentUserStats);
  const userAuth = useSelector(selectUserAuth);
  const userInfo = useSelector(selectUserInfo);
  const isUserSnapshot = useSelector(selectIsUserSnapshot);
  // `[...nextauth]` puts the uid on the session user; next-auth's type doesn't know it.
  const sessionUid = (session?.user as { id?: string | null } | undefined)?.id ?? null;
  // Bumping this state on every failed attempt is what actually re-triggers the
  // effect. Using a ref here (as before) meant a Firebase auth-state timeout
  // left the dashboard spinner up forever: nothing in the dep array changed, so
  // the retry / sign-out branch never ran again.
  const [attempt, setAttempt] = useState(0);
  const isSyncing = useRef(false);
  const questInitialized = useRef(false);

  // Show the profile from the last visit right away (see `userSnapshot`). The
  // sync below still runs and replaces it, or signs out.
  useEffect(() => {
    if (status !== "authenticated" || !sessionUid || userAuth) return;
    const snapshot = readUserSnapshot(sessionUid);
    if (snapshot) dispatch(restoreUserSnapshot(snapshot));
  }, [status, sessionUid, userAuth, dispatch]);

  useEffect(() => {
    if (status === "unauthenticated") clearUserSnapshot();
  }, [status]);

  // Only a confirmed profile is saved — re-saving the restored copy would keep
  // it alive past the point the server stopped vouching for it.
  useEffect(() => {
    if (!userAuth || !userStats || isUserSnapshot) return;
    const timer = setTimeout(
      () => writeUserSnapshot({ userAuth, userInfo, currentUserStats: userStats }),
      SNAPSHOT_WRITE_DELAY
    );
    return () => clearTimeout(timer);
  }, [userAuth, userInfo, userStats, isUserSnapshot]);

  useEffect(() => {
    // Fully logged in — nothing to sync. A restored snapshot is not: it still
    // has to be confirmed (or refused) below.
    if (userStats && userAuth && !isUserSnapshot) {
      isSyncing.current = false;

      // Initialize the daily quest globally as soon as the user is fully logged
      // in, not only when the profile dashboard mounts. Without this, quest
      // progress dispatched before visiting the dashboard is silently dropped
      // by the date guard in completeQuestTask. generateDailyQuest is idempotent
      // (regenerates only when the stored date is not today), so this is safe.
      if (!questInitialized.current) {
        questInitialized.current = true;
        dispatch(initializeDailyQuestAction());
      }
      return;
    }

    const syncUser = async () => {
      if (status !== "authenticated") return;
      if (isSyncing.current) return;

      isSyncing.current = true;

      try {
        const currentUser = await firebaseGetCurrentUser(AUTH_STATE_TIMEOUT);

        if (currentUser) {
          const result = await dispatch(autoLogIn(currentUser));
          // On success the reducer sets userStats/userAuth and this effect
          // re-runs into the early return above.
          if (autoLogIn.rejected.match(result)) {
            if (result.payload === "refused") {
              // The server or Firebase turned the session down: it's over.
              console.warn("Session refused. Signing out.");
              clearUserSnapshot();
              await signOut({ redirect: false });
            } else {
              setAttempt((n) => n + 1);
            }
          }
        } else {
          console.warn("Session authenticated but Firebase User null. Logging out to sync.");
          clearUserSnapshot();
          await signOut({ redirect: false });
        }
      } catch (error) {
        console.error("Auto login sync failed:", error);
        setAttempt((n) => n + 1);
      } finally {
        isSyncing.current = false;
      }
    };

    if (status !== "authenticated") return;

    if (attempt < MAX_RETRIES) {
      syncUser();
      return;
    }

    // The quick retries are spent and nobody has refused the session — the
    // network is down (a sleeping laptop, a train, the desktop app offline).
    // Signing out here, as this used to, logged players out for losing wi-fi.
    // Try again when the connection is back, or after a growing pause.
    const delay = Math.min(
      MAX_RETRY_DELAY,
      RETRY_DELAY * 2 ** (attempt - MAX_RETRIES)
    );
    const retry = () => syncUser();
    const timer = setTimeout(retry, delay);
    window.addEventListener("online", retry);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", retry);
    };
  }, [status, userStats, userAuth, isUserSnapshot, attempt, dispatch]);

  return { isLoading: status === "loading" || (status === 'authenticated' && !userStats) };
}

export default useAuthSync;
