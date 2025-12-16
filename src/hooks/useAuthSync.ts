import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { autoLogIn } from "feature/user/store/userSlice.asyncThunk";
import { User } from "firebase/auth";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";
import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "store/store";

const useAuthSync = () => {
  const { data: session, status } = useSession();
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const userStats = useSelector(selectCurrentUserStats);
  const userAuth = useSelector(selectUserAuth);

  useEffect(() => {
    const syncUser = async () => {
      // Only auto-login if authenticated in next-auth but missing stats in Redux
      if (status === "authenticated" && (!userStats || !userAuth)) {
        try {
          // Wait for Firebase Client SDK to initialize
          const currentUser = await firebaseGetCurrentUser();

          if (currentUser) {
            dispatch(autoLogIn(currentUser));
          } else {
            // Fallback: If Firebase Client is not signed in (e.g. cookie exists but IndexedDB cleared),
            // we technically have the session but no client-side 'User' object for 'fetchUserData'.
            // We could forcefully sign in with a custom token if we had one, or redirect to login.
            // For now, if we can't get the user, we can't fetch their data via existing thunks easily.
            // We can accept that this might require re-login if persistence failed.

            // However, let's try to reload slightly or wait?
            // Actually, if we are here, and firebaseGetCurrentUser resolved to null, we are inconsistent.
            console.warn("Session authenticated but Firebase User null. This may indicate a sync issue.");
          }

        } catch (error) {
          console.error("Auto login sync failed", error);
        }
      }
    };

    if (status === "authenticated") {
      syncUser();
    }
  }, [status, userStats, userAuth, dispatch]);

  return { isLoading: status === "loading" || (status === 'authenticated' && !userStats) };
}

export default useAuthSync;
