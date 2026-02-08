import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { selectAutoLogInFailed, selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { autoLogIn } from "feature/user/store/userSlice.asyncThunk";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "store/store";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

const MAX_RETRIES = 2;

const useAuthSync = () => {
  const { data: _session, status } = useSession();
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const userStats = useSelector(selectCurrentUserStats);
  const userAuth = useSelector(selectUserAuth);
  const autoLogInFailed = useSelector(selectAutoLogInFailed);
  const retryCount = useRef(0);
  const isSyncing = useRef(false);

  useEffect(() => {
    // Reset retry count when user logs in successfully
    if (userStats && userAuth) {
      retryCount.current = 0;
      isSyncing.current = false;
      return;
    }

    // If autoLogIn already failed and we exhausted retries, sign out
    if (autoLogInFailed && retryCount.current >= MAX_RETRIES) {
      console.warn("Auto login failed after retries. Signing out to clear stale session.");
      signOut({ redirect: false });
      return;
    }

    const syncUser = async () => {
      if (status !== "authenticated" || (userStats && userAuth)) return;
      if (isSyncing.current) return;

      isSyncing.current = true;

      try {
        const currentUser = await firebaseGetCurrentUser(10000);

        if (currentUser) {
          retryCount.current++;
          dispatch(autoLogIn(currentUser));
        } else {
          console.warn("Session authenticated but Firebase User null. Logging out to sync.");
          await signOut({ redirect: false });
        }
      } catch (error) {
        console.error("Auto login sync failed:", error);
        retryCount.current++;

        if (retryCount.current >= MAX_RETRIES) {
          console.warn("Auto login sync exhausted retries. Signing out.");
          await signOut({ redirect: false });
        }
      } finally {
        isSyncing.current = false;
      }
    };

    if (status === "authenticated") {
      syncUser();
    }
  }, [status, userStats, userAuth, autoLogInFailed, dispatch]);

  return { isLoading: status === "loading" || (status === 'authenticated' && !userStats) };
}

export default useAuthSync;
