import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { autoLogIn } from "feature/user/store/userSlice.asyncThunk";
import { initializeDailyQuestAction } from "feature/user/store/userSlice.questActions";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "store/store";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

const MAX_RETRIES = 2;
// Keep this well under any user's patience. Firebase auth restore is normally
// sub-second; a long wait here means the network is dropping the token refresh,
// and we'd rather retry / bounce to login than spin forever.
const AUTH_STATE_TIMEOUT = 10000;

const useAuthSync = () => {
  const { data: _session, status } = useSession();
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const userStats = useSelector(selectCurrentUserStats);
  const userAuth = useSelector(selectUserAuth);
  // Bumping this state on every failed attempt is what actually re-triggers the
  // effect. Using a ref here (as before) meant a Firebase auth-state timeout
  // left the dashboard spinner up forever: nothing in the dep array changed, so
  // the retry / sign-out branch never ran again.
  const [attempt, setAttempt] = useState(0);
  const isSyncing = useRef(false);
  const questInitialized = useRef(false);

  useEffect(() => {
    // Fully logged in — nothing to sync.
    if (userStats && userAuth) {
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

    // Retries exhausted (Firebase auth never resolved, or autoLogIn kept
    // failing). Sign out to clear the stale NextAuth session; AppLayout then
    // bounces the now-unauthenticated user to home instead of showing the
    // spinner indefinitely.
    if (attempt >= MAX_RETRIES) {
      console.warn("Auto login failed after retries. Signing out to clear stale session.");
      signOut({ redirect: false });
      return;
    }

    const syncUser = async () => {
      if (status !== "authenticated" || (userStats && userAuth)) return;
      if (isSyncing.current) return;

      isSyncing.current = true;

      try {
        const currentUser = await firebaseGetCurrentUser(AUTH_STATE_TIMEOUT);

        if (currentUser) {
          const result = await dispatch(autoLogIn(currentUser));
          // On success the reducer sets userStats/userAuth and this effect
          // re-runs into the early return above. On failure, count it as an
          // attempt so we retry and eventually sign out.
          if (autoLogIn.rejected.match(result)) {
            setAttempt((n) => n + 1);
          }
        } else {
          console.warn("Session authenticated but Firebase User null. Logging out to sync.");
          await signOut({ redirect: false });
        }
      } catch (error) {
        console.error("Auto login sync failed:", error);
        setAttempt((n) => n + 1);
      } finally {
        isSyncing.current = false;
      }
    };

    if (status === "authenticated") {
      syncUser();
    }
  }, [status, userStats, userAuth, attempt, dispatch]);

  return { isLoading: status === "loading" || (status === 'authenticated' && !userStats) };
}

export default useAuthSync;
